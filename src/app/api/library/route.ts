import { NextResponse } from "next/server";
import { database } from "@/server/db";
import type { DictionaryEntry } from "@/lib/dictionary";
export const runtime = "nodejs";
type Chapter = { id:string; title:string; wordIds:string[] };
type Book = { chapters:Chapter[] };
export async function GET() {
  const sql=database();
  if(!sql) return NextResponse.json({error:"library_unavailable"},{status:503});
  try {
    const rows=await sql`SELECT payload FROM library_books ORDER BY position`;
    const books=rows.map(r=>r.payload as Book);
    const ids=[...new Set(books.flatMap(b=>b.chapters.flatMap(c=>c.wordIds)))];
    const entries=ids.length?await sql`SELECT id,payload FROM dictionary_entries WHERE id = ANY(${ids}::text[])`:[];
    const byId=new Map(entries.map(r=>[r.id,r.payload as DictionaryEntry]));
    const expanded=books.map(b=>({...b,chapters:b.chapters.map(c=>({...c,entries:c.wordIds.map(id=>byId.get(id)).filter(Boolean)}))}));
    return NextResponse.json({books:expanded},{headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=86400"}});
  } catch { return NextResponse.json({error:"library_unavailable"},{status:503,headers:{"Cache-Control":"no-store"}}); }
}
