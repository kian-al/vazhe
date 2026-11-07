// Shared SQL used by route handlers and real PostgreSQL-engine tests.
export const CREATE_GUEST='INSERT INTO guest_vocab(owner_hash) VALUES($1) ON CONFLICT DO NOTHING';
export const READ_GUEST='SELECT payload, revision FROM guest_vocab WHERE owner_hash=$1';
export const WRITE_GUEST="UPDATE guest_vocab SET payload=$1::jsonb,revision=revision+1,updated_at=now(),expires_at=now()+interval '365 days' WHERE owner_hash=$2 AND revision=$3 RETURNING revision";

// Account ownership must come from a verified provider session, never the client.
export const CREATE_ACCOUNT = 'INSERT INTO account_vocab(owner_id) VALUES($1) ON CONFLICT DO NOTHING';
export const READ_ACCOUNT = 'SELECT payload, revision FROM account_vocab WHERE owner_id=$1';
export const WRITE_ACCOUNT = 'UPDATE account_vocab SET payload=$1::jsonb,revision=revision+1,updated_at=now() WHERE owner_id=$2 AND revision=$3 RETURNING revision';
// Only a pristine account can receive a copy. Both revisions are checked and
// the source row is locked: a concurrent guest edit cannot be silently omitted.
// The guest row is deliberately retained as a backup.
export const COPY_GUEST_TO_EMPTY_ACCOUNT = `WITH source AS (
 SELECT payload FROM guest_vocab WHERE owner_hash=$2 AND revision=$3 FOR UPDATE
)
UPDATE account_vocab AS a SET payload=source.payload,revision=a.revision+1,updated_at=now()
FROM source WHERE a.owner_id=$1 AND a.revision=$4 AND a.revision=0
 AND a.payload='{"version":2,"words":[],"currentBatchId":null}'::jsonb
 RETURNING a.payload,a.revision`;
