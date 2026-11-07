import 'server-only';
import { createHash } from 'node:crypto';
import { createNeonAuth } from '@neon/auth/next/server';

// Authentication is opt-in. A partial/missing configuration must fail closed.
export function provider() {
 const baseUrl=process.env.NEON_AUTH_BASE_URL;
 const secret=process.env.NEON_AUTH_COOKIE_SECRET;
 if(!baseUrl || !secret || secret.length<32) return null;
 return createNeonAuth({baseUrl,cookies:{secret,sessionDataTtl:1}});
}

export async function verifiedAccount() {
 const auth=provider();
 if(!auth) return {kind:'unavailable' as const};
 try {
  const {data,error}=await auth.getSession();
  if(error) return {kind:'unavailable' as const};
  if(!data?.user) return {kind:'anonymous' as const};
  if(!data.user.emailVerified || typeof data.user.id!=='string' || !data.user.id || data.user.id.length>256) return {kind:'unverified' as const};
  return {kind:'account' as const,id:data.user.id,identity:createHash('sha256').update('account:'+data.user.id).digest('hex')};
 } catch { return {kind:'unavailable' as const}; }
}
