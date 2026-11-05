-- Additive library catalog; never modifies dictionary or personal vocabulary.
CREATE TABLE IF NOT EXISTS library_books (
 id text PRIMARY KEY,
 position integer NOT NULL,
 payload jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON library_books FROM PUBLIC;
