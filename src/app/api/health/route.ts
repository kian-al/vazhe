import { NextResponse } from 'next/server';
import { database } from '@/server/db';
export const dynamic='force-dynamic';
export async function GET(){
 const sql=database();
 if(!sql)return NextResponse.json({status:'local',database:'not-configured',dictionary:'bundled-server'},{headers:{'Cache-Control':'no-store'}});
 try{
  const rows=await sql`SELECT count(*)::integer AS count FROM dictionary_entries`;
  return NextResponse.json({status:rows[0].count>0?'ready':'needs-seed',database:'postgres',entries:rows[0].count},{status:rows[0].count>0?200:503,headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({status:'unavailable',database:'postgres'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
