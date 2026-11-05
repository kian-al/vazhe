import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { validState } from '../src/server/validation';
import { CREATE_GUEST, READ_GUEST, WRITE_GUEST } from '../src/server/queries';
import { addToQueue, emptyState, sampleState } from '../src/lib/vocabulary';
import { DICTIONARY } from '../src/lib/dictionary';
test('validation rejects malformed, duplicated and oversized active batches',()=>{
 assert.equal(validState(sampleState()),true);
 const s=addToQueue(emptyState(),DICTIONARY[0]).state;
 assert.equal(validState(s),true);
 assert.equal(validState({...s,words:[...s.words,...s.words]}),false);
 assert.equal(validState({...s,words:[{...s.words[0],stage:9}]}),false);
 assert.equal(validState({...s,words:[{...s.words[0],en:'x'.repeat(121)}]}),false);
 assert.equal(validState({...s,words:[{...s.words[0],status:'admin'}]}),false);
});
test('PostgreSQL schema, tenant isolation, revision conflicts and safe dictionary upserts',async()=>{
 const db=new PGlite({ extensions:{pg_trgm} });try{
  await db.exec(await readFile('db/schema.sql','utf8'));
  await db.exec('CREATE ROLE test_visitor');
  await db.exec('SET ROLE test_visitor');
  await assert.rejects(db.query('SELECT * FROM guest_vocab'),/permission denied/);
  await db.exec('RESET ROLE');
  const a='a'.repeat(64),b='b'.repeat(64);
  await db.query(CREATE_GUEST,[a]);await db.query(CREATE_GUEST,[b]);
  const s=addToQueue(emptyState(),DICTIONARY[0]).state;
  assert.equal((await db.query(WRITE_GUEST,[JSON.stringify(s),a,0])).rows.length,1);
  assert.equal((await db.query(WRITE_GUEST,[JSON.stringify(emptyState()),a,0])).rows.length,0,'stale writer cannot overwrite');
  const ar=await db.query<{payload:typeof s;revision:number}>(READ_GUEST,[a]);
  const br=await db.query<{payload:typeof s;revision:number}>(READ_GUEST,[b]);
  assert.equal(ar.rows[0].payload.words.length,1);assert.equal(ar.rows[0].revision,1);
  assert.equal(br.rows[0].payload.words.length,0,'other visitor stays isolated');
  assert.equal((await db.query(WRITE_GUEST,[JSON.stringify(s),'c'.repeat(64),0])).rows.length,0);
  const rows=JSON.parse(gunzipSync(Buffer.from((await Promise.all((await readdir('data')).filter(n=>/^dictionary-part-\d+\.b64$/.test(n)).sort().map(n=>readFile(`data/${n}`,'utf8')))).join(''),'base64')).toString('utf8'));
  assert.ok(rows.length>5000);assert.ok(rows.every((r:{sourceUrl:string;license:string})=>r.sourceUrl?.startsWith('https://en.wiktionary.org/')&&r.license==='CC BY-SA 4.0'));
  await db.query(`INSERT INTO dictionary_entries(id,norm,fa,payload) SELECT e->>'id',lower(e->>'en'),e->>'fa',e FROM jsonb_array_elements($1::jsonb) e ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload`,[JSON.stringify(rows)]);
  assert.equal((await db.query<{n:number}>('SELECT count(*)::integer AS n FROM dictionary_entries')).rows[0].n,rows.length);
  const result=await db.query('SELECT payload FROM dictionary_entries WHERE norm=$1',[rows[0].en]);assert.ok(result.rows.length);
  assert.equal((await db.query('SELECT payload FROM dictionary_entries WHERE norm=$1',["apple' OR 1=1 --"])).rows.length,0);
 }finally{await db.close();}
});
