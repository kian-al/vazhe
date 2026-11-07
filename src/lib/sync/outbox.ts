import type { VocabState } from '../vocabulary';
import { validState } from '../../server/validation';

/**
 * Experimental storage primitive, NOT wired to the app store yet.
 * A writer gets its own record so tabs don't overwrite each other's outboxes.
 * Keys are opaque server-derived principals, never email addresses or tokens.
 * Never treat localStorage as an authentication boundary.
 */
export type Principal = { kind: 'guest' | 'account'; identity: string };
export type OutboxRecord = { version: 1; principal: Principal; writer: string; baseRevision: number; state: VocabState };
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
const HEX_256 = /^[a-f0-9]{64}$/;
const WRITER = /^[a-f0-9]{32}$/;
const PREFIX = 'vazhe.outbox.v1';
function validPrincipal(p: unknown): p is Principal {
  if (!p || typeof p !== 'object') return false;
  const v = p as Principal;
  return (v.kind === 'guest' || v.kind === 'account') && typeof v.identity === 'string' && HEX_256.test(v.identity);
}
function validWriter(w: unknown): w is string { return typeof w === 'string' && WRITER.test(w); }
function samePrincipal(a: Principal, b: Principal) { return a.kind === b.kind && a.identity === b.identity; }
export function outboxKey(principal: Principal, writer: string): string {
  if (!validPrincipal(principal) || !validWriter(writer)) throw new Error('invalid_outbox_identity');
  return `${PREFIX}.${principal.kind}.${principal.identity}.${writer}`;
}
export function saveOutbox(storage: StorageLike, record: OutboxRecord): void {
  const key = outboxKey(record.principal, record.writer);
  if (record.version !== 1 || !Number.isSafeInteger(record.baseRevision) || record.baseRevision < 0 || !validState(record.state)) throw new Error('invalid_outbox_record');
  // One setItem contains state AND base revision. Quota failures are propagated.
  storage.setItem(key, JSON.stringify(record));
}
export type OutboxRead = { kind: 'empty' } | { kind: 'invalid' } | { kind: 'found'; record: OutboxRecord };
export function readOutbox(storage: StorageLike, principal: Principal, writer: string): OutboxRead {
  const key = outboxKey(principal, writer);
  const raw = storage.getItem(key);
  if (raw === null) return { kind: 'empty' };
  try {
    const r: unknown = JSON.parse(raw);
    if (!r || typeof r !== 'object') return { kind: 'invalid' };
    const record = r as OutboxRecord;
    if (record.version !== 1 || !validPrincipal(record.principal) || !samePrincipal(principal, record.principal) || record.writer !== writer || !Number.isSafeInteger(record.baseRevision) || record.baseRevision < 0 || !validState(record.state)) return { kind: 'invalid' };
    return { kind: 'found', record };
  } catch { return { kind: 'invalid' }; }
}
/** No automatic upload: caller must still validate live identity and CAS. */
export function recoveryDecision(record: OutboxRecord, current: Principal, serverRevision: number): 'identity_changed' | 'conflict' | 'candidate' {
  if (!validPrincipal(current) || !validPrincipal(record.principal) || !samePrincipal(record.principal, current)) return 'identity_changed';
  if (!Number.isSafeInteger(serverRevision) || serverRevision < 0 || record.baseRevision !== serverRevision) return 'conflict';
  return 'candidate';
}
