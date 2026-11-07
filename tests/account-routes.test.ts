import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { makeAccountRoutes, type AccountRouteDependencies } from '../src/server/account-routes';
import { CREATE_GUEST, READ_ACCOUNT, READ_GUEST, WRITE_GUEST } from '../src/server/queries';
import { addToQueue, emptyState } from '../src/lib/vocabulary';
import { DICTIONARY } from '../src/lib/dictionary';

const origin='https://local-test.invalid';
const userA={kind:'account' as const,id:'synthetic-a',identity:'a'.repeat(64)};
const userB={kind:'account' as const,id:'synthetic-b',identity:'b'.repeat(64)};
const userC={kind:'account' as const,id:'synthetic-c',identity:'c'.repeat(64)};
const owner='d'.repeat(64);
const state=addToQueue(emptyState(),DICTIONARY[0]).state;
function request(path:string, value:unknown, options:{origin?:string;contentType?:string;declared?:string}={}) {
 const headers:Record<string,string>={'origin':options.origin ?? origin,'content-type':options.contentType ?? 'application/json'};
 if(options.declared)headers['content-length']=options.declared;
 return new Request(origin+path,{method:path.endsWith('import')?'POST':'PUT',headers,body:typeof value==='string'?value:JSON.stringify(value)});
}

test('account handlers enforce sessions, ownership, CAS and non-destructive guest import',async()=>{
 const db=new PGlite({extensions:{pg_trgm}});
 try {
  await db.exec(await readFile('db/schema.sql','utf8'));
  await db.query(CREATE_GUEST,[owner]);await db.query(WRITE_GUEST,[JSON.stringify(state),owner,0]);
  let current: Awaited<ReturnType<AccountRouteDependencies['account']>> = userA;
  const events:Array<{event:string;result:string;status:number}>=[];
  const deps:AccountRouteDependencies={account:async()=>current,guest:async()=>owner,database:()=>({query:async(q,p)=>(await db.query(q,p)).rows as Record<string,any>[]}),sameOrigin:req=>req.headers.get('origin')===origin,log:(event,result,status)=>events.push({event,result,status})};
  const api=makeAccountRoutes(deps);
  let res=await api.getState();assert.equal(res.status,200);assert.equal(res.headers.get('cache-control'),'private, no-store');assert.equal(res.headers.get('vary'),'Cookie');
  assert.deepEqual((await res.json()).state,emptyState());
  current=userB;await api.getState();current=userA;
  res=await api.putState(request('/api/account/state',{identity:userA.identity,revision:0,state,owner_id:userB.id}));
  assert.equal(res.status,200);assert.deepEqual(await res.json(),{identity:userA.identity,revision:1});
  assert.equal((await db.query<{payload:typeof state}>(READ_ACCOUNT,[userA.id])).rows[0].payload.words.length,1);
  assert.equal((await db.query<{payload:typeof state}>(READ_ACCOUNT,[userB.id])).rows[0].payload.words.length,0,'client-supplied owner is ignored');
  res=await api.putState(request('/api/account/state',{identity:userA.identity,revision:0,state:emptyState()}));assert.equal(res.status,409);assert.equal((await res.json()).error,'revision_conflict');
  current=userB;res=await api.putState(request('/api/account/state',{identity:userA.identity,revision:0,state}));assert.equal(res.status,409);assert.equal((await res.json()).error,'identity_changed');
  assert.equal((await db.query<{payload:typeof state}>(READ_ACCOUNT,[userB.id])).rows[0].payload.words.length,0,'session switch cannot write the prior identity');
  for(const status of ['anonymous','unverified'] as const){current={kind:status};assert.equal((await api.getState()).status,401);assert.equal((await api.putState(request('/api/account/state',{identity:userA.identity,revision:0,state}))).status,401)}
  current={kind:'unavailable'};assert.equal((await api.getState()).status,503);
  current=userC;
  assert.equal((await api.postImport(request('/api/account/import',{}, {origin:'https://evil.invalid'}))).status,403);
  assert.equal((await api.postImport(request('/api/account/import',{}, {contentType:'application/jsonp'}))).status,415);
  assert.equal((await api.postImport(request('/api/account/import','{'))).status,400);
  assert.equal((await api.postImport(request('/api/account/import',{}, {declared:'2049'}))).status,413);
  res=await api.getImport();assert.equal(res.status,200);assert.deepEqual(await res.json(),{identity:userC.identity,guestRevision:1,guestWordCount:1,accountRevision:0,accountWordCount:0});
  const body={identity:userC.identity,guestRevision:1,accountRevision:0};
  assert.equal((await api.postImport(request('/api/account/import',{...body,identity:userA.identity}))).status,409);
  assert.equal((await api.postImport(request('/api/account/import',{...body,guestRevision:0}))).status,409);
  assert.equal((await api.postImport(request('/api/account/import',{...body,accountRevision:Number.MAX_SAFE_INTEGER+1}))).status,400);
  res=await api.postImport(request('/api/account/import',body));assert.equal(res.status,200);assert.equal((await res.json()).revision,1);
  assert.equal((await api.postImport(request('/api/account/import',body))).status,409,'no replacing non-pristine account');
  assert.equal((await db.query<{payload:typeof state}>(READ_GUEST,[owner])).rows[0].payload.words.length,1,'original guest remains');
  assert.equal((await db.query<{payload:typeof state}>(READ_ACCOUNT,[userC.id])).rows[0].payload.words.length,1);
  assert.ok(events.some(e=>e.event==='guest_import'&&e.result==='success'));
  assert.ok(events.some(e=>e.event==='account_write'&&e.result==='conflict'));
  assert.ok(events.every(e=>Object.keys(e).sort().join(',')==='event,result,status'));
 } finally {await db.close()}
});

test('account handlers fail closed on unavailable dependencies',async()=>{
 const base:AccountRouteDependencies={account:async()=>userA,guest:async()=>owner,database:()=>null,sameOrigin:()=>true,log:()=>{}};
 assert.equal((await makeAccountRoutes(base).getState()).status,503);
 assert.equal((await makeAccountRoutes({...base,account:async()=>{throw Error('private')}}).getState()).status,503);
 assert.equal((await makeAccountRoutes({...base,guest:async()=>{throw Error('private')}}).getImport()).status,503);
 assert.equal((await makeAccountRoutes({...base,guest:async()=>null}).getImport()).status,404);
});
