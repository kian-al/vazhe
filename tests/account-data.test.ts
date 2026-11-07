import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { CREATE_ACCOUNT, READ_ACCOUNT, WRITE_ACCOUNT, CREATE_GUEST, READ_GUEST, WRITE_GUEST, COPY_GUEST_TO_EMPTY_ACCOUNT } from '../src/server/queries';
import { addToQueue, emptyState } from '../src/lib/vocabulary';
import { DICTIONARY } from '../src/lib/dictionary';

test('account isolation, optimistic concurrency and non-destructive guest copy', async () => {
 const db = new PGlite({extensions:{pg_trgm}});
 try {
  await db.exec(await readFile('db/schema.sql','utf8'));
  await db.exec('CREATE ROLE account_visitor; SET ROLE account_visitor');
  await assert.rejects(db.query('SELECT * FROM account_vocab'), /permission denied/);
  await db.exec('RESET ROLE');
  const guest='a'.repeat(64), a='account-a', b='account-b';
  await db.query(CREATE_GUEST,[guest]);
  await db.query(CREATE_ACCOUNT,[a]); await db.query(CREATE_ACCOUNT,[b]);
  const state=addToQueue(emptyState(),DICTIONARY[0]).state;
  await db.query(WRITE_GUEST,[JSON.stringify(state),guest,0]);
  assert.equal((await db.query(COPY_GUEST_TO_EMPTY_ACCOUNT,[a,guest,0,0])).rows.length,0,'stale guest version must not copy');
  assert.equal((await db.query(COPY_GUEST_TO_EMPTY_ACCOUNT,[a,guest,1,1])).rows.length,0,'stale account version must not copy');
  assert.equal((await db.query(COPY_GUEST_TO_EMPTY_ACCOUNT,[a,guest,1,0])).rows.length,1);
  assert.equal((await db.query(COPY_GUEST_TO_EMPTY_ACCOUNT,[a,guest,1,1])).rows.length,0,'no replacement of account data');
  assert.equal((await db.query<{payload:typeof state}>(READ_GUEST,[guest])).rows[0].payload.words.length,1,'guest is retained');
  assert.equal((await db.query<{payload:typeof state}>(READ_ACCOUNT,[a])).rows[0].payload.words.length,1);
  assert.equal((await db.query<{payload:typeof state}>(READ_ACCOUNT,[b])).rows[0].payload.words.length,0,'different accounts stay isolated');
  assert.equal((await db.query(WRITE_ACCOUNT,[JSON.stringify(emptyState()),a,0])).rows.length,0,'stale update rejected');
  assert.equal((await db.query(WRITE_ACCOUNT,[JSON.stringify(emptyState()),a,1])).rows.length,1);
  assert.equal((await db.query(WRITE_ACCOUNT,[JSON.stringify(state),'other-account',0])).rows.length,0);
 } finally { await db.close(); }
});
