import { NextResponse } from 'next/server';
import { database } from '@/server/db';
import { BY_ID, searchSql, type Query } from '@/server/dictionarySql';
import { DICTIONARY, entryById, type DictionaryEntry } from '@/lib/dictionary';
import { searchEntries } from '@/lib/vocabulary';
export const runtime='nodejs';
const headers={'Cache-Control':'public, s-maxage=3600, stale-while-revalidate=86400'};
let countCache:{n:number;at:number}|null=null;
export async function GET(req:Request){
 const p=new URL(req.url).searchParams;
 const q=(p.get('q')??'').trim(),id=(p.get('id')??'').trim().toLowerCase();
 if(q.length>100||id.length>160)return NextResponse.json({error:'query_too_long'},{status:400});
 const sql=database();
 if(!sql){
  // بدون پایگاه داده: فقط مدخل‌های محلی دست‌نویس
  if(id)return NextResponse.json({entry:entryById(id)??DICTIONARY.find(e=>e.en===id)??null,count:DICTIONARY.length,storage:'bundled-server'},{headers});
  return NextResponse.json({...searchEntries(DICTIONARY,q,50),count:DICTIONARY.length,storage:'bundled-server'},{headers});
 }
 try{
  const run:Query=async (text,params)=>(await sql.query(text,params)) as {payload:DictionaryEntry}[];
  if(p.get('download')==='1'){
   const rows=await sql`SELECT payload FROM dictionary_entries WHERE payload ? 'sourceUrl' ORDER BY id`;
   return NextResponse.json(rows.map(r=>r.payload),{headers:{...headers,'Content-Disposition':'attachment; filename="vazhe-open-dictionary.json"'}});
  }
  if(!countCache||Date.now()-countCache.at>600_000){const c=await sql`SELECT count(*)::integer AS n FROM dictionary_entries`;countCache={n:c[0].n,at:Date.now()};}
  const count=countCache.n;
  if(id){const rows=await run(BY_ID,[id]);return NextResponse.json({entry:rows[0]?.payload??null,count,storage:'postgres'},{headers});}
  const outcome=await searchSql(run,q,50);
  return NextResponse.json({...outcome,count,storage:'postgres'},{headers});
 }catch{return NextResponse.json({error:'dictionary_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
