import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState } from '../src/lib/vocabulary';
import { outboxKey, readOutbox, recoveryDecision, saveOutbox, type OutboxRecord, type Principal } from '../src/lib/sync/outbox';

test('experimental outboxes isolate principals and independent writers without touching legacy storage', () => {
 const data = new Map<string,string>([['vazhe.local.v2','legacy'],['vazhe.server.pending','legacy-pending']]);
 const storage = {getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value)}};
 const guest:Principal={kind:'guest',identity:'a'.repeat(64)}, account:Principal={kind:'account',identity:'b'.repeat(64)};
 const writer1='1'.repeat(32),writer2='2'.repeat(32);
 const record:OutboxRecord={version:1,principal:guest,writer:writer1,baseRevision:4,state:emptyState()};
 saveOutbox(storage,record);saveOutbox(storage,{...record,writer:writer2});
 assert.equal(readOutbox(storage,guest,writer1).kind,'found');
 assert.equal(readOutbox(storage,guest,writer2).kind,'found');
 assert.equal(readOutbox(storage,account,writer1).kind,'empty');
 assert.equal(data.get('vazhe.local.v2'),'legacy');assert.equal(data.get('vazhe.server.pending'),'legacy-pending');
 assert.equal(recoveryDecision(record,account,4),'identity_changed');
 assert.equal(recoveryDecision(record,guest,5),'conflict');
 assert.equal(recoveryDecision(record,guest,4),'candidate');
 data.set(outboxKey(account,writer1),JSON.stringify(record));
 assert.equal(readOutbox(storage,account,writer1).kind,'invalid');
 data.set(outboxKey(guest,writer2),'{');assert.equal(readOutbox(storage,guest,writer2).kind,'invalid');
 assert.throws(()=>outboxKey({kind:'guest',identity:'a@b.com'},writer1));
 assert.throws(()=>saveOutbox(storage,{...record,baseRevision:Number.MAX_SAFE_INTEGER+1}));
 assert.throws(()=>saveOutbox({getItem:()=>null,setItem:()=>{throw new Error('quota')}},record),/quota/);
});
