-- Run once via `npm run db:migrate`; never on every request.
CREATE TABLE IF NOT EXISTS dictionary_entries (
 id text PRIMARY KEY,
 norm text NOT NULL UNIQUE,
 fa text NOT NULL,
 payload jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dictionary_prefix_idx ON dictionary_entries (norm text_pattern_ops);
CREATE TABLE IF NOT EXISTS guest_vocab (
 owner_hash text PRIMARY KEY CHECK (length(owner_hash) = 64),
 payload jsonb NOT NULL DEFAULT '{"version":2,"words":[],"currentBatchId":null}',
 revision integer NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now() + interval '365 days'
);
-- No anonymous/public SQL access. Only the server connection owns these tables.
ALTER TABLE guest_vocab ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictionary_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON guest_vocab FROM PUBLIC;
REVOKE ALL ON dictionary_entries FROM PUBLIC;
-- v2: جست‌وجوی سمت پایگاه داده (رتبهٔ بسامد + trigram برای غلط املایی و جست‌وجوی فارسی)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER TABLE dictionary_entries ADD COLUMN IF NOT EXISTS rank integer;
CREATE INDEX IF NOT EXISTS dictionary_norm_trgm_idx ON dictionary_entries USING gin (norm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS dictionary_fa_trgm_idx ON dictionary_entries USING gin (fa gin_trgm_ops);
