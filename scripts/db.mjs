import { neon } from '@neondatabase/serverless';
import { readFile, readdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;
if(!url)throw new Error('Set DATABASE_URL in .env.local (server-only).');
const sql=neon(url);const mode=process.argv[2];
if(mode==='migrate'){
 const ddl=await readFile('db/schema.sql','utf8');
 const statements=ddl.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean);
 for(const s of statements)await sql.query(s);
 console.log('Schema migrated.');
}else if(mode==='seed'){
 // DICT_FILE: خروجی scripts/dictionary/export_v2.py (فایل بزرگ داده در مخزن نگه داشته نمی‌شود)
 const file=process.env.DICT_FILE;
 const rows=file ? JSON.parse(await readFile(file,'utf8')) : JSON.parse(gunzipSync(Buffer.from((await Promise.all((await readdir('data')).filter(n=>/^dictionary-part-\d+\.b64$/.test(n)).sort().map(n=>readFile(`data/${n}`,'utf8')))).join(''),'base64')).toString('utf8'));
 // Include locally authored starter words missing from the imported dataset.
 const { DICTIONARY }=await import('../src/lib/dictionary.ts');
 const have=new Set(rows.map(e=>e.en));rows.push(...DICTIONARY.filter(e=>!have.has(e.en)));
 for(let i=0;i<rows.length;i+=200){
  await sql`INSERT INTO dictionary_entries(id,norm,fa,payload,rank)
   SELECT e->>'id',lower(e->>'en'),e->>'fa',e,(e->>'rank')::integer FROM jsonb_array_elements(${JSON.stringify(rows.slice(i,i+200))}::jsonb) e
   ON CONFLICT(id) DO UPDATE SET norm=EXCLUDED.norm,fa=EXCLUDED.fa,payload=EXCLUDED.payload,rank=EXCLUDED.rank,updated_at=now()`;
 }
 console.log(`Seeded ${rows.length} entries without touching personal vocabulary.`);
}else throw new Error('Use migrate or seed');
