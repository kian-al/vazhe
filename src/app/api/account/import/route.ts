import { readBoundedJson, BodyTooLarge } from '@/server/request-body';
import { logEvent } from '@/server/events';
import { NextResponse } from 'next/server';
import { verifiedAccount } from '@/server/auth';
import { database } from '@/server/db';
import { guest, sameOrigin } from '@/server/guest';
import { CREATE_ACCOUNT, READ_ACCOUNT, READ_GUEST, COPY_GUEST_TO_EMPTY_ACCOUNT } from '@/server/queries';
export const runtime='nodejs'; export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','Vary':'Cookie'};
async function access(){
 const a=await verifiedAccount();
 if(a.kind==='unavailable')return {error:NextResponse.json({error:'auth_unavailable'},{status:503,headers})};
 if(a.kind!=='account')return {error:NextResponse.json({error:'verified_session_required'},{status:401,headers})};
 const owner=await guest();
 if(!owner)return {error:NextResponse.json({error:'guest_not_found'},{status:404,headers})};
 return {account:a,owner};
}
export async function GET(){
 const {account,owner,error}=await access();if(error)return error;
 const sql=database();if(!sql)return NextResponse.json({error:'database_unavailable'},{status:503,headers});
 try{
  await sql.query(CREATE_ACCOUNT,[account!.id]);
  const g=await sql.query(READ_GUEST,[owner]);const a=await sql.query(READ_ACCOUNT,[account!.id]);
  if(!g.length)return NextResponse.json({error:'guest_not_found'},{status:404,headers});
  return NextResponse.json({identity:account!.identity,guestRevision:g[0].revision,guestWordCount:g[0].payload.words.length,accountRevision:a[0].revision,accountWordCount:a[0].payload.words.length},{headers});
 }catch{return NextResponse.json({error:'database_unavailable'},{status:503,headers});}
}
export async function POST(req:Request){
 if(!sameOrigin(req)){logEvent('guest_import','denied',403);return NextResponse.json({error:'origin_denied'},{status:403,headers});}
 if(!req.headers.get('content-type')?.startsWith('application/json'))return NextResponse.json({error:'json_required'},{status:415,headers});
 const {account,owner,error}=await access();if(error)return error;
 const sql=database();if(!sql)return NextResponse.json({error:'database_unavailable'},{status:503,headers});
 try{
  let b: any;try{b=await readBoundedJson(req,2048)}catch(e){return NextResponse.json({error:e instanceof BodyTooLarge?'payload_too_large':'invalid_json'},{status:e instanceof BodyTooLarge?413:400,headers});}
  if(!b || typeof b!=='object' || Array.isArray(b))return NextResponse.json({error:'invalid_json'},{status:400,headers});
  if(b.identity!==account!.identity)return NextResponse.json({error:'identity_changed'},{status:409,headers});
  if(!Number.isInteger(b.guestRevision)||b.guestRevision<0||!Number.isInteger(b.accountRevision)||b.accountRevision<0)return NextResponse.json({error:'invalid_revision'},{status:400,headers});
  const rows=await sql.query(COPY_GUEST_TO_EMPTY_ACCOUNT,[account!.id,owner,b.guestRevision,b.accountRevision]);
  if(!rows.length){logEvent('guest_import','conflict',409);return NextResponse.json({error:'import_conflict'},{status:409,headers});}
  logEvent('guest_import','success',200);return NextResponse.json({revision:rows[0].revision},{headers});
 }catch{return NextResponse.json({error:'database_unavailable'},{status:503,headers});}
}
