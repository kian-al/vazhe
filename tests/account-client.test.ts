import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { ExperimentalAccountClient } from '../src/lib/sync/account-client';
import { makeAccountRoutes, type AccountRouteDependencies } from '../src/server/account-routes';
import { addToQueue,emptyState } from '../src/lib/vocabulary';
import { DICTIONARY } from '../src/lib/dictionary';

const a={kind:'account' as const,id:'local-a',identity:'a'.repeat(64)},b={kind:'account' as const,id:'local-b',identity:'b'.repeat(64)};
function memoryStorage() {
 const map=new Map<string,string>([['vazhe.local.v2','guest-original'],['vazhe.server.pending','guest-pending']]);
 return {map,get length(){return map.size},key(i:number){return [...map.keys()][i]??null},getItem(k:string){return map.get(k)??null},setItem(k:string,v:string){map.set(k,v)},removeItem(k:string){map.delete(k)}};
}
async function fixture() {
 const db=new PGlite({extensions:{pg_trgm}});await db.exec(await readFile('db/schema.sql','utf8'));
 let current:Awaited<ReturnType<AccountRouteDependencies['account']>>=a;
 const deps:AccountRouteDependencies={account:async()=>current,guest:async()=>null,database:()=>({query:async(q,p)=>(await db.query(q,p)).rows as Record<string,any>[]}),sameOrigin:req=>req.headers.get('origin')==='https://test.invalid',log:()=>{}};
 const api=makeAccountRoutes(deps);
 const fetcher=(async (input:RequestInfo|URL,init?:RequestInit)=>{
  const headers=new Headers(init?.headers);headers.set('origin','https://test.invalid');
  const req=new Request(new URL(String(input),'https://test.invalid'),{...init,headers});
  return req.method==='PUT'?api.putState(req):api.getState();
 }) as typeof fetch;
 return {db,fetcher,identity:(value:typeof a|typeof b)=>{current=value}};
}

test('experimental account client talks to actual handlers and isolates accounts and legacy guest data',async()=>{
 const f=await fixture();try{
  const storage=memoryStorage();const client=new ExperimentalAccountClient(storage,f.fetcher);
  const start=await client.start();assert.equal(start.phase,'ready');
  const next=addToQueue(emptyState(),DICTIONARY[0]).state;
  assert.equal(await client.submit(next),'written');assert.equal(client.status.phase,'ready');assert.equal(storage.map.size,2);
  const reload=new ExperimentalAccountClient(storage,f.fetcher);const loaded=await reload.start();
  assert.equal(loaded.phase,'ready');if(loaded.phase==='ready'){assert.equal(loaded.revision,1);assert.equal(loaded.state.words.length,1);loaded.state.words.length=0;assert.equal((reload.status as typeof loaded).state.words.length,1,'caller cannot mutate internal state');}
  f.identity(b);const other=new ExperimentalAccountClient(storage,f.fetcher);const otherState=await other.start();
  assert.equal(otherState.phase,'ready');if(otherState.phase==='ready')assert.equal(otherState.state.words.length,0);
  assert.equal(storage.getItem('vazhe.local.v2'),'guest-original');assert.equal(storage.getItem('vazhe.server.pending'),'guest-pending');
 }finally{await f.db.close()}
});

test('account switch between read and write is rejected; outbox survives reload',async()=>{
 const f=await fixture();try{
  const s=memoryStorage();let gets=0;
  const switched=(async (input:RequestInfo|URL,init?:RequestInit)=>{
   const result=await f.fetcher(input,init);if(!init?.method && ++gets===2)f.identity(b);return result;
  }) as typeof fetch;
  const client=new ExperimentalAccountClient(s,switched);assert.equal((await client.start()).phase,'ready');
  assert.equal(await client.submit(addToQueue(emptyState(),DICTIONARY[0]).state),'identity_changed');
  assert.equal(client.status.phase,'blocked');assert.equal(s.map.size,3);
  const wrongAccount=new ExperimentalAccountClient(s,f.fetcher);const other=await wrongAccount.start();assert.equal(other.phase,'ready');
  if(other.phase==='ready')assert.equal(other.state.words.length,0);
  f.identity(a);const recovered=new ExperimentalAccountClient(s,f.fetcher);const pending=await recovered.start();
  assert.equal(pending.phase,'blocked');if(pending.phase==='blocked'){assert.equal(pending.reason,'pending_recovery');assert.equal(pending.recovery?.length,1);assert.equal(pending.recovery?.[0].state.words.length,1);}
 }finally{await f.db.close()}
});

test('lost response after committed write remains uncertain and preserves the outbox',async()=>{
 const f=await fixture();try{
  const s=memoryStorage();const failAfterWrite=(async (input:RequestInfo|URL,init?:RequestInit)=>{
   const result=await f.fetcher(input,init);if(init?.method==='PUT')throw Error('response lost');return result;
  }) as typeof fetch;
  const client=new ExperimentalAccountClient(s,failAfterWrite);await client.start();
  assert.equal(await client.submit(addToQueue(emptyState(),DICTIONARY[0]).state),'uncertain');assert.equal(s.map.size,3);
  const reloaded=await new ExperimentalAccountClient(s,f.fetcher).start();assert.equal(reloaded.phase,'blocked');
  if(reloaded.phase==='blocked'){assert.equal(reloaded.state?.words.length,1);assert.equal(reloaded.recovery?.length,1);}
 }finally{await f.db.close()}
});

test('two clients race on the same account without losing the losing draft',async()=>{
 const f=await fixture();try{
  const s=memoryStorage();let waitHead=false,count=0;let release!:()=>void;
  const gate=new Promise<void>(r=>{release=r});
  const racing=(async (input:RequestInfo|URL,init?:RequestInit)=>{
   const result=await f.fetcher(input,init);
   if(waitHead&&!init?.method){if(++count===2)release();await gate;}
   return result;
  }) as typeof fetch;
  const one=new ExperimentalAccountClient(s,racing),two=new ExperimentalAccountClient(s,racing);
  assert.equal((await one.start()).phase,'ready');assert.equal((await two.start()).phase,'ready');waitHead=true;
  const [r1,r2]=await Promise.all([one.submit(addToQueue(emptyState(),DICTIONARY[0]).state),two.submit(addToQueue(emptyState(),DICTIONARY[1]).state)]);
  assert.deepEqual([r1,r2].sort(),['conflict','written']);assert.equal(s.map.size,3);
  const blocked=await new ExperimentalAccountClient(s,f.fetcher).start();assert.equal(blocked.phase,'blocked');
  if(blocked.phase==='blocked')assert.equal(blocked.recovery?.length,1);
 }finally{await f.db.close()}
});

test('storage failures prevent upload; concurrent submits and close cannot discard work',async()=>{
 const f=await fixture();try{
  const s=memoryStorage();const failing={...s,setItem:()=>{throw Error('quota')}};
  const c=new ExperimentalAccountClient(failing,f.fetcher);await c.start();
  assert.equal(await c.submit(addToQueue(emptyState(),DICTIONARY[0]).state),'storage_unavailable');
  assert.equal(c.status.phase,'ready');assert.equal(s.map.size,2);
  let release!:()=>void,started!:()=>void;const gate=new Promise<void>(r=>release=r),begin=new Promise<void>(r=>started=r);
  const paused=(async (input:RequestInfo|URL,init?:RequestInit)=>{if(init?.method==='PUT'){started();await gate;}return f.fetcher(input,init)}) as typeof fetch;
  const c2=new ExperimentalAccountClient(s,paused);await c2.start();
  const first=c2.submit(addToQueue(emptyState(),DICTIONARY[0]).state);await begin;
  assert.equal(await c2.submit(addToQueue(emptyState(),DICTIONARY[1]).state),'not_ready');c2.close();release();assert.equal(await first,'uncertain');assert.equal(s.map.size,3);
 }finally{await f.db.close()}
});

test('if an outbox changes during a write recovery reports the latest stored snapshot',async()=>{
 const f=await fixture();try{
  const s=memoryStorage();const mutateDuringWrite=(async (input:RequestInfo|URL,init?:RequestInit)=>{
   const response=await f.fetcher(input,init);
   if(init?.method==='PUT'){
    const key=[...s.map.keys()].find(k=>k.startsWith('vazhe.outbox.v1.account.'))!;
    const item=JSON.parse(s.getItem(key)!);item.state=addToQueue(item.state,DICTIONARY[1]).state;s.setItem(key,JSON.stringify(item));
   }
   return response;
  }) as typeof fetch;
  const client=new ExperimentalAccountClient(s,mutateDuringWrite);await client.start();
  assert.equal(await client.submit(addToQueue(emptyState(),DICTIONARY[0]).state),'written_but_changed');
  const result=client.status;assert.equal(result.phase,'blocked');if(result.phase==='blocked')assert.equal(result.recovery?.[0].state.words.length,2);
 }finally{await f.db.close()}
});
