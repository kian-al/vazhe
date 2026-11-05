import { readFile } from 'node:fs/promises';
import nextEnv from '@next/env';
import { neon } from '@neondatabase/serverless';
nextEnv.loadEnvConfig(process.cwd());
const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;
if(!url) throw Error('Database URL missing');
const sql=neon(url);
for (const statement of (await readFile('db/library.sql','utf8')).replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean)) await sql.query(statement);
console.log('Library schema ready.');
