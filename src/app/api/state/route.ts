import { NextResponse } from 'next/server';
import { database } from '@/server/db';
import { guest, sameOrigin } from '@/server/guest';
import { CREATE_GUEST, READ_GUEST, WRITE_GUEST } from '@/server/queries';
import { validState } from '@/server/validation';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','Vary':'Cookie'};
export async function GET(){
 const sql=database();
 if(!sql)return NextResponse.json({mode:'local'},{headers});
 try{
  const owner=await guest(true);
  await sql.query(CREATE_GUEST,[owner]);
  const rows=await sql.query(READ_GUEST,[owner]);
  return NextResponse.json({mode:'server',state:rows[0].payload,revision:rows[0].revision},{headers});
 }catch{return NextResponse.json({error:'database_unavailable'},{status:503,headers});}
}
export async function PUT(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'origin_denied'},{status:403,headers});
 if(!req.headers.get('content-type')?.startsWith('application/json'))return NextResponse.json({error:'json_required'},{status:415,headers});
 const sql=database();if(!sql)return NextResponse.json({error:'database_not_configured'},{status:503,headers});
 const owner=await guest();if(!owner)return NextResponse.json({error:'session_required'},{status:401,headers});
 try{
  const raw=await req.text();if(Buffer.byteLength(raw)>4_000_000)return NextResponse.json({error:'payload_too_large'},{status:413,headers});
  let b;try{b=JSON.parse(raw)}catch{return NextResponse.json({error:'invalid_json'},{status:400,headers});}
  if(!validState(b.state)||!Number.isInteger(b.revision)||b.revision<0)return NextResponse.json({error:'invalid_state'},{status:400,headers});
  const rows=await sql.query(WRITE_GUEST,[JSON.stringify(b.state),owner,b.revision]);
  if(!rows.length)return NextResponse.json({error:'revision_conflict'},{status:409,headers});
  return NextResponse.json({revision:rows[0].revision},{headers});
 }catch{return NextResponse.json({error:'database_unavailable'},{status:503,headers});}
}
