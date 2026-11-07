import { validState } from '../../server/validation';
import type { VocabState } from '../vocabulary';
import { accountTransport } from './account-transport';
import { listOutboxes, outboxKey, saveOutbox, type EnumerableStorage, type OutboxRecord, type Principal } from './outbox';
import { uploadAccountOutbox, type UploadResult } from './upload';

/** Experimental account-only client. Not yet connected to the product store/UI.
 * Each instance owns a fresh random writer key; it never touches another writer.
 * Caller must stop and reinitialize on any session change. */
export type AccountClientState =
 | {phase:'idle'|'loading'|'closed'}
 | {phase:'ready'|'saving'; principal:Principal; revision:number; state:VocabState}
 | {phase:'blocked'; reason:string; principal?:Principal; state?:VocabState; recovery?:OutboxRecord[]; invalid?:number};

function randomWriter() {
 const bytes=globalThis.crypto.getRandomValues(new Uint8Array(16));
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
function cloneState(state:VocabState):VocabState {return JSON.parse(JSON.stringify(state)) as VocabState;}

export class ExperimentalAccountClient {
 private writer = randomWriter();
 private current:AccountClientState={phase:'idle'};
 private closed=false;
 constructor(private storage:EnumerableStorage, private fetcher:typeof fetch=(...args)=>globalThis.fetch(...args)) {}
 get status(): AccountClientState {return JSON.parse(JSON.stringify(this.current)) as AccountClientState;}
 close() {this.closed=true;this.current={phase:'closed'};}

 async start(): Promise<AccountClientState> {
  if(this.current.phase!=='idle')return this.status;
  this.current={phase:'loading'};
  try {
   const response=await this.fetcher('/api/account/state',{cache:'no-store',credentials:'same-origin'});
   if(!response.ok)throw new Error('session_or_server_unavailable');
   const payload:unknown=await response.json();
   if(!payload||typeof payload!=='object')throw new Error('invalid_server_response');
   const d=payload as {identity:unknown;revision:unknown;state:unknown};
   if(typeof d.identity!=='string'||!/^[a-f0-9]{64}$/.test(d.identity)||!Number.isSafeInteger(d.revision)||Number(d.revision)<0||!validState(d.state))throw new Error('invalid_server_response');
   const principal:Principal={kind:'account',identity:d.identity};
   const recovered=listOutboxes(this.storage,principal);
   if(this.closed)return this.status;
   const state=cloneState(d.state);
   if(recovered.records.length||recovered.invalid){
    this.current={phase:'blocked',reason:'pending_recovery',principal,state,recovery:recovered.records,invalid:recovered.invalid};
   }else this.current={phase:'ready',principal,revision:d.revision as number,state};
  }catch {
   if(!this.closed)this.current={phase:'blocked',reason:'session_storage_or_server_unavailable'};
  }
  return this.status;
 }

 async submit(next:VocabState):Promise<UploadResult|'not_ready'|'invalid_state'|'too_large'> {
  if(this.current.phase!=='ready'||this.closed)return 'not_ready';
  if(!validState(next))return 'invalid_state';
  const old=this.current;
  let snapshot:VocabState;
  try {snapshot=cloneState(next);}catch{return 'invalid_state';}
  if(new TextEncoder().encode(JSON.stringify({identity:old.principal.identity,revision:old.revision,state:snapshot})).byteLength>4_000_000)return 'too_large';
  const record:OutboxRecord={version:1,principal:old.principal,writer:this.writer,baseRevision:old.revision,state:snapshot};
  const key=outboxKey(old.principal,this.writer), raw=JSON.stringify(record);
  try {saveOutbox(this.storage,record);}catch{return 'storage_unavailable';}
  this.current={phase:'saving',principal:old.principal,revision:old.revision,state:snapshot};
  const result=await uploadAccountOutbox(this.storage,old.principal,this.writer,accountTransport(this.fetcher));
  if(this.closed)return 'uncertain'; // never remove on an unobserved completion
  if(result==='written'){
   try {
    // Only this instance's random writer can legitimately modify this key.
    // Never remove a different snapshot or any recovered record.
    if(this.storage.getItem(key)!==raw)throw new Error('outbox_changed');
    this.storage.removeItem(key);
    if(this.storage.getItem(key)!==null)throw new Error('outbox_not_removed');
    this.current={phase:'ready',principal:old.principal,revision:old.revision+1,state:snapshot};
    return 'written';
   }catch{this.current={phase:'blocked',reason:'ack_cleanup_uncertain',principal:old.principal,state:snapshot,recovery:[record]};return 'uncertain';}
  }
  // Report the current stored drafts, not just the possibly stale sent snapshot.
  let recovery=[record], invalid=0;
  try {const saved=listOutboxes(this.storage,old.principal);recovery=saved.records;invalid=saved.invalid;}catch {/* keep the in-memory copy */}
  this.current={phase:'blocked',reason:result,principal:old.principal,state:snapshot,recovery,invalid};
  return result;
 }
}
