// Shared SQL used by route handlers and real PostgreSQL-engine tests.
export const CREATE_GUEST='INSERT INTO guest_vocab(owner_hash) VALUES($1) ON CONFLICT DO NOTHING';
export const READ_GUEST='SELECT payload, revision FROM guest_vocab WHERE owner_hash=$1';
export const WRITE_GUEST="UPDATE guest_vocab SET payload=$1::jsonb,revision=revision+1,updated_at=now(),expires_at=now()+interval '365 days' WHERE owner_hash=$2 AND revision=$3 RETURNING revision";
