import { NextResponse } from 'next/server';
import { verifiedAccount } from '@/server/auth';
import { database } from '@/server/db';
import { sameOrigin } from '@/server/guest';
import { CREATE_ACCOUNT, READ_ACCOUNT, WRITE_ACCOUNT } from '@/server/queries';
import { validState } from '@/server/validation';
export const runtime='nodejs'; export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','Vary':'Cookie'};
async function identity(){
 const a=await verifiedAccount();
 if(a.kind==='unavailable')return {error:NextResponse.json({error:'auth_unavailable'},{status:503,headers})};
 if(a.kind!=='account')return {error:NextResponse.json({error:'verified_session_required'},{status:401,headers})};
 return {account:a};
}
export async function GET(){
 const {account,error}=await identity();if(error)return error;
 const sql=database();if(!sql)return NextResponse.json({error:'database_unavailable'},{status:503,headers});
 try{
  await sql.query(CREATE_ACCOUNT,[account!.id]);
  const rows=await sql.query(READ_ACCOUNT,[account!.id]);
  return NextResponse.json({identity:account!.identity,state:rows[0].payload,revision:rows[0].revision},{headers});
 }catch{return NextResponse.json({error:'database_unavailable'},{status:503,headers});}
}
export async function PUT(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'origin_denied'},{status:403,headers});
 if(!req.headers.get('content-type')?.startsWith('application/json'))return NextResponse.json({error:'json_required'},{status:415,headers});
 const {account,error}=await identity();if(error)return error;
 const sql=database();if(!sql)return NextResponse.json({error:'database_unavailable'},{status:503,headers});
 try{
  const raw=await req.text();if(Buffer.byteLength(raw)>4_000_000)return NextResponse.json({error:'payload_too_large'},{status:413,headers});
  let body;try{body=JSON.parse(raw)}catch{return NextResponse.json({error:'invalid_json'},{status:400,headers});}
  if(body.identity!==account!.identity)return NextResponse.json({error:'identity_changed'},{status:409,headers});
  if(!validState(body.state)||!Number.isInteger(body.revision)||body.revision<0)return NextResponse.json({error:'invalid_state'},{status:400,headers});
  const rows=await sql.query(WRITE_ACCOUNT,[JSON.stringify(body.state),account!.id,body.revision]);
  if(!rows.length)return NextResponse.json({error:'revision_conflict'},{status:409,headers});
  return NextResponse.json({revision:rows[0].revision},{headers});
 }catch{return NextResponse.json({error:'database_unavailable'},{status:503,headers});}
}
