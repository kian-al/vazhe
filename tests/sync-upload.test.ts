import test from 'node:test';
import assert from 'node:assert/strict';
import { addToQueue, emptyState } from '../src/lib/vocabulary';
import { DICTIONARY } from '../src/lib/dictionary';
import { listOutboxes, outboxKey, readOutbox, saveOutbox, type OutboxRecord, type Principal } from '../src/lib/sync/outbox';
import { uploadAccountOutbox, type AccountTransport } from '../src/lib/sync/upload';

function storage() {
 const map = new Map<string,string>();
 return { map, get length(){return map.size}, key(i:number){return [...map.keys()][i]??null}, getItem(k:string){return map.get(k)??null}, setItem(k:string,v:string){map.set(k,v)} };
}
const p: Principal={kind:'account',identity:'a'.repeat(64)}, other: Principal={kind:'account',identity:'b'.repeat(64)};
const w1='1'.repeat(32),w2='2'.repeat(32);
function item(writer=w1):OutboxRecord {return {version:1,principal:p,writer,baseRevision:0,state:addToQueue(emptyState(),DICTIONARY[0]).state}}
function server():AccountTransport & { count:()=>number; revision:()=>number } {
 let revision=0, count=0;
 return {head:async()=>({identity:p.identity,revision}),write:async b=>{count++;if(b.identity!==p.identity)return {kind:'denied'};if(b.revision!==revision)return {kind:'conflict'};revision++;return {kind:'ok',identity:p.identity,revision}},count:()=>count,revision:()=>revision};
}

test('recovery lists only the current identity, reports corruption and never removes records',()=>{
 const s=storage(); saveOutbox(s,item());saveOutbox(s,item(w2));
 saveOutbox(s,{...item(),principal:other});s.setItem(`vazhe.outbox.v1.account.${p.identity}.${'3'.repeat(32)}`,'broken');
 const listing=listOutboxes(s,p);assert.equal(listing.records.length,2);assert.equal(listing.invalid,1);
 assert.equal(listOutboxes(s,other).records.length,1);assert.equal(s.length,4);
 assert.throws(()=>listOutboxes({...s,key:()=>{throw Error('blocked')}},p),/blocked/);
});

test('two writers do not overwrite each other; stale writer conflicts, no record deleted',async()=>{
 const s=storage(), api=server(); saveOutbox(s,item());saveOutbox(s,item(w2));
 assert.equal(await uploadAccountOutbox(s,p,w1,api),'written');
 assert.equal(await uploadAccountOutbox(s,p,w2,api),'conflict');
 assert.equal(api.count(),1);assert.equal(s.length,2);assert.equal(readOutbox(s,p,w1).kind,'found');
});

test('identity changes, outages, malformed records and stale revisions do not send',async()=>{
 const s=storage();saveOutbox(s,item());const api=server();
 assert.equal(await uploadAccountOutbox(s,p,w1,{...api,head:async()=>({identity:other.identity,revision:0})}),'identity_changed');
 assert.equal(await uploadAccountOutbox(s,p,w1,{...api,head:async()=>{throw Error('offline')}}),'not_sent');
 assert.equal(await uploadAccountOutbox(s,p,w1,{...api,head:async()=>({identity:p.identity,revision:9})}),'conflict');
 assert.equal(api.count(),0);
 s.setItem(outboxKey(p,w1),'bad');assert.equal(await uploadAccountOutbox(s,p,w1,api),'invalid_record');assert.equal(s.getItem(outboxKey(p,w1)),'bad');
 assert.equal(await uploadAccountOutbox(s,{kind:'guest',identity:'c'.repeat(64)},w1,api),'denied');
});

test('edits during request are retained; ambiguous failure is never called success',async()=>{
 const s=storage(),api=server();saveOutbox(s,item());
 const before=await uploadAccountOutbox(s,p,w1,{...api,head:async()=>{saveOutbox(s,{...item(),state:emptyState()});return {identity:p.identity,revision:0}}});
 assert.equal(before,'changed_before_write');assert.equal(api.count(),0);
 saveOutbox(s,item());
 const during=await uploadAccountOutbox(s,p,w1,{...api,write:async body=>{const r=await api.write(body);saveOutbox(s,{...item(),state:emptyState()});return r}});
 assert.equal(during,'written_but_changed');assert.equal((readOutbox(s,p,w1) as {kind:'found';record:OutboxRecord}).record.state.words.length,0);
 const s2=storage(),api2=server();saveOutbox(s2,item());
 const uncertain=await uploadAccountOutbox(s2,p,w1,{...api2,write:async body=>{await api2.write(body);throw Error('response lost')}});
 assert.equal(uncertain,'uncertain');assert.equal(api2.revision(),1);assert.equal(readOutbox(s2,p,w1).kind,'found');
 assert.equal(await uploadAccountOutbox(s2,p,w1,api2),'conflict');
});

test('a second upload of the same writer is rejected while in flight',async()=>{
 const s=storage(),api=server();saveOutbox(s,item());let release!:()=>void;
 const gate=new Promise<void>(r=>{release=r});let started!:()=>void;const begin=new Promise<void>(r=>{started=r});
 const first=uploadAccountOutbox(s,p,w1,{...api,head:async()=>{started();await gate;return api.head()}});
 await begin;assert.equal(await uploadAccountOutbox(s,p,w1,api),'busy');release();assert.equal(await first,'written');
});

test('account transport uses server identity, handles conflict and fails closed on invalid replies',async()=>{
 const {accountTransport}=await import('../src/lib/sync/account-transport');
 const requests: {url:string;init?:RequestInit}[]=[];
 let next=new Response(JSON.stringify({identity:p.identity,revision:3}),{status:200,headers:{'Content-Type':'application/json'}});
 const fetcher = (async (url:RequestInfo|URL,init?:RequestInit)=>{requests.push({url:String(url),init});return next}) as typeof fetch;
 const api=accountTransport(fetcher);
 assert.deepEqual(await api.head(),{identity:p.identity,revision:3});
 const body={identity:p.identity,revision:3,state:emptyState()};
 next=new Response(JSON.stringify({identity:p.identity,revision:4}),{status:200});
 assert.deepEqual(await api.write(body),{kind:'ok',identity:p.identity,revision:4});
 assert.equal(requests[1].url,'/api/account/state');assert.equal(requests[1].init?.method,'PUT');
 assert.deepEqual(JSON.parse(String(requests[1].init?.body)),body);
 next=new Response(JSON.stringify({error:'identity_changed'}),{status:409});assert.deepEqual(await api.write(body),{kind:'identity_changed'});
 next=new Response(JSON.stringify({error:'revision_conflict'}),{status:409});assert.deepEqual(await api.write(body),{kind:'conflict'});
 next=new Response('{}',{status:200});assert.deepEqual(await api.write(body),{kind:'unavailable'});
 next=new Response('{}',{status:200});await assert.rejects(api.head(),/invalid_account_head/);
});

test('server rejects a switched session after the read without applying the pending snapshot',async()=>{
 const {accountTransport}=await import('../src/lib/sync/account-transport');
 const s=storage();saveOutbox(s,item());let writes=0;
 const fetcher=(async (_url:RequestInfo|URL,init?:RequestInit)=>{
  if(init?.method!=='PUT')return Response.json({identity:p.identity,revision:0,state:emptyState()});
  writes++; // Cookie/session now belongs to a different account; server rejects the old identity.
  return Response.json({error:'identity_changed'},{status:409});
 }) as typeof fetch;
 assert.equal(await uploadAccountOutbox(s,p,w1,accountTransport(fetcher)),'identity_changed');
 assert.equal(writes,1);assert.equal(readOutbox(s,p,w1).kind,'found');
});
