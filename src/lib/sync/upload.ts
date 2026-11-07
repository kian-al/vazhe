import { outboxKey, readOutbox, recoveryDecision, type OutboxRecord, type Principal, type StorageLike } from './outbox';

/**
 * Experimental single-record account upload. Not connected to UI or the app store.
 * Transport MUST authenticate server-side and compare identity atomically with the
 * write (as /api/account/state does); a browser identity is not authorization.
 */
export type AccountHead = { identity: string; revision: number };
export type AccountWrite = { identity: string; revision: number; state: OutboxRecord['state'] };
export type WriteResponse = { kind: 'ok'; identity: string; revision: number } | { kind: 'conflict' | 'identity_changed' | 'denied' | 'unavailable' };
export type AccountTransport = { head: () => Promise<AccountHead>; write: (body: AccountWrite) => Promise<WriteResponse> };
export type UploadResult =
  | 'no_record' | 'invalid_record' | 'storage_unavailable' | 'busy' | 'not_sent'
  | 'identity_changed' | 'conflict' | 'changed_before_write' | 'denied'
  | 'uncertain' | 'written' | 'written_but_changed';
const active = new Set<string>();

export async function uploadAccountOutbox(storage: StorageLike, principal: Principal, writer: string, transport: AccountTransport): Promise<UploadResult> {
  // Account only: the current guest API lacks an equivalent identity write guard.
  if (principal.kind !== 'account') return 'denied';
  let key: string;
  try { key = outboxKey(principal, writer); } catch { return 'invalid_record'; }
  if (active.has(key)) return 'busy';
  active.add(key);
  try {
    let raw: string | null;
    let record: OutboxRecord;
    try {
      raw = storage.getItem(key);
      const read = readOutbox(storage, principal, writer);
      if (read.kind === 'empty') return 'no_record';
      if (read.kind === 'invalid' || raw === null) return 'invalid_record';
      record = read.record;
      // The two reads may straddle an edit; do not send an ambiguous snapshot.
      if (JSON.stringify(record) !== raw) return 'changed_before_write';
    } catch { return 'storage_unavailable'; }
    let head: AccountHead;
    try { head = await transport.head(); } catch { return 'not_sent'; }
    if (!head || typeof head.identity !== 'string') return 'not_sent';
    const decision = recoveryDecision(record, {kind:'account',identity:head.identity}, head.revision);
    if (decision !== 'candidate') return decision;
    try { if (storage.getItem(key) !== raw) return 'changed_before_write'; }
    catch { return 'storage_unavailable'; }
    let result: WriteResponse;
    try { result = await transport.write({identity:record.principal.identity,revision:record.baseRevision,state:record.state}); }
    catch { return 'uncertain'; } // A network failure may follow a committed write.
    if (!result || result.kind === 'unavailable') return 'uncertain';
    if (result.kind === 'conflict') return 'conflict';
    if (result.kind === 'identity_changed') return 'identity_changed';
    if (result.kind === 'denied') return 'denied';
    if (result.kind !== 'ok' || result.identity !== record.principal.identity || result.revision !== record.baseRevision + 1 || !Number.isSafeInteger(result.revision)) return 'uncertain';
    try { return storage.getItem(key) === raw ? 'written' : 'written_but_changed'; }
    catch { return 'written_but_changed'; }
  } finally { active.delete(key); }
}
