import 'server-only';
import { randomBytes, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
export async function guest(create=false) {
 const jar=await cookies();let token=jar.get('vazhe_guest')?.value;
 if(!token || !/^[a-f0-9]{64}$/.test(token)) {
  if(!create)return null;
  token=randomBytes(32).toString('hex');
  jar.set('vazhe_guest',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:31536000});
 }
 return createHash('sha256').update(token).digest('hex');
}
export function sameOrigin(req:Request) {
 const origin=req.headers.get('origin');
 // Mutation is browser-only; reject absent, foreign and opaque origins.
 if(!origin)return false;
 const expected=process.env.APP_ORIGIN || new URL(req.url).origin;
 return origin===expected;
}
