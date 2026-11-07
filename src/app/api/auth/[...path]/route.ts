import { logEvent } from '@/server/events';
import { provider } from '@/server/auth';
import { sameOrigin } from '@/server/guest';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
async function handle(req:Request, context:Context) {
 const auth=provider();
 if(!auth)return Response.json({error:'auth_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 // The provider also validates origins. Do not weaken browser CSRF checks.
 if(req.method!=='GET'&&!sameOrigin(req)){logEvent('auth_request','denied',403);return Response.json({error:'origin_denied'},{status:403,headers:{'Cache-Control':'no-store'}});}
 const handlers=auth.handler();
 const method=req.method as keyof typeof handlers;
 if(!handlers[method])return new Response(null,{status:405});
 const response=await handlers[method](req,context);
 if(req.method!=='GET')logEvent('auth_request','provider_response',response.status);
 return response;
}
export const GET=handle, POST=handle, PUT=handle, PATCH=handle, DELETE=handle;
