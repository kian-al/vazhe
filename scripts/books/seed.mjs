import { readFile } from 'node:fs/promises';
import nextEnv from '@next/env';
import { neon } from '@neondatabase/serverless';
nextEnv.loadEnvConfig(process.cwd());
const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;
if(!url) throw Error('Database URL missing');
const sql=neon(url);
const rows=JSON.parse(await readFile('data/books-catalog.json','utf8'));
// All catalog writes are one SQL statement. Personal vocabulary is never touched.
await sql`INSERT INTO library_books (id,position,payload)
 SELECT book->>'id',ord::integer,book FROM jsonb_array_elements(${JSON.stringify(rows)}::jsonb) WITH ORDINALITY AS x(book,ord)
 ON CONFLICT(id) DO UPDATE SET position=excluded.position,payload=excluded.payload,updated_at=now()`;
console.log(`Seeded ${rows.length} library books.`);
