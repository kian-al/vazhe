import { NextResponse } from 'next/server';
import { isJsonContentType, isRevision } from './request-validation';
import { readBoundedJson, BodyTooLarge } from './request-body';
import { CREATE_ACCOUNT, READ_ACCOUNT, WRITE_ACCOUNT, READ_GUEST, COPY_GUEST_TO_EMPTY_ACCOUNT } from './queries';
import { validState } from './validation';
import type { EventName, EventResult } from './events';

type Identity = { kind: 'unavailable' | 'anonymous' | 'unverified' } | { kind: 'account'; id: string; identity: string };
type Account = Extract<Identity, {kind:'account'}>;
type Sql = { query: (query: string, params: unknown[]) => Promise<Record<string, any>[]> };
export type AccountRouteDependencies = {
  account: () => Promise<Identity>;
  guest: () => Promise<string | null>;
  database: () => Sql | null;
  sameOrigin: (request: Request) => boolean;
  log: (event: EventName, result: EventResult, status: number) => void;
};
const headers = {'Cache-Control':'private, no-store','Vary':'Cookie'};
const json = (value: unknown, status=200) => NextResponse.json(value,{status,headers});
const fail = (error: string, status: number) => json({error},status);

type Access = {account:Account; owner?:string} | {error:Response};
/** Request handlers are dependency-injected so their real authorization and SQL paths
 * can be tested with synthetic sessions and a local PostgreSQL engine. */
export function makeAccountRoutes(deps: AccountRouteDependencies) {
  async function access(needsGuest=false): Promise<Access> {
    let user: Identity;
    try { user = await deps.account(); } catch { return {error:fail('auth_unavailable',503)}; }
    if (user.kind === 'unavailable') return {error:fail('auth_unavailable',503)};
    if (user.kind !== 'account') return {error:fail('verified_session_required',401)};
    if (!needsGuest) return {account:user};
    try {
      const owner = await deps.guest();
      return owner ? {account:user,owner} : {error:fail('guest_not_found',404)};
    } catch { return {error:fail('guest_unavailable',503)}; }
  }
  function preflight(req: Request, event: EventName): Response | null {
    if (!deps.sameOrigin(req)) {deps.log(event,'denied',403);return fail('origin_denied',403);}
    if (!isJsonContentType(req.headers.get('content-type'))) return fail('json_required',415);
    return null;
  }
  async function body(req:Request, limit:number): Promise<{value:Record<string,unknown>} | {error:Response}> {
    let value: unknown;
    try {value=await readBoundedJson(req,limit);} catch(e) {return {error:fail(e instanceof BodyTooLarge?'payload_too_large':'invalid_json',e instanceof BodyTooLarge?413:400)};}
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {error:fail('invalid_json',400)};
    return {value:value as Record<string,unknown>};
  }
  async function getState() {
    const accessResult=await access();if('error' in accessResult)return accessResult.error;
    const sql=deps.database();if(!sql)return fail('database_unavailable',503);
    try {
      await sql.query(CREATE_ACCOUNT,[accessResult.account.id]);
      const rows=await sql.query(READ_ACCOUNT,[accessResult.account.id]);
      return json({identity:accessResult.account.identity,state:rows[0].payload,revision:rows[0].revision});
    } catch {return fail('database_unavailable',503);}
  }
  async function putState(req:Request) {
    const invalid=preflight(req,'account_write');if(invalid)return invalid;
    const accessResult=await access();if('error' in accessResult)return accessResult.error;
    const sql=deps.database();if(!sql)return fail('database_unavailable',503);
    const parsed=await body(req,4_000_000);if('error' in parsed)return parsed.error;
    const b=parsed.value, account=accessResult.account;
    if (b.identity!==account.identity)return fail('identity_changed',409);
    if (!validState(b.state)||!isRevision(b.revision))return fail('invalid_state',400);
    try {
      const rows=await sql.query(WRITE_ACCOUNT,[JSON.stringify(b.state),account.id,b.revision]);
      if(!rows.length){deps.log('account_write','conflict',409);return fail('revision_conflict',409);}
      return json({identity:account.identity,revision:rows[0].revision});
    } catch {return fail('database_unavailable',503);}
  }
  async function getImport() {
    const accessResult=await access(true);if('error' in accessResult)return accessResult.error;
    const sql=deps.database();if(!sql)return fail('database_unavailable',503);
    try {
      await sql.query(CREATE_ACCOUNT,[accessResult.account.id]);
      const g=await sql.query(READ_GUEST,[accessResult.owner]);const a=await sql.query(READ_ACCOUNT,[accessResult.account.id]);
      if(!g.length)return fail('guest_not_found',404);
      return json({identity:accessResult.account.identity,guestRevision:g[0].revision,guestWordCount:g[0].payload.words.length,accountRevision:a[0].revision,accountWordCount:a[0].payload.words.length});
    } catch {return fail('database_unavailable',503);}
  }
  async function postImport(req:Request) {
    const invalid=preflight(req,'guest_import');if(invalid)return invalid;
    const accessResult=await access(true);if('error' in accessResult)return accessResult.error;
    const sql=deps.database();if(!sql)return fail('database_unavailable',503);
    const parsed=await body(req,2048);if('error' in parsed)return parsed.error;
    const b=parsed.value, account=accessResult.account;
    if(b.identity!==account.identity)return fail('identity_changed',409);
    if(!isRevision(b.guestRevision)||!isRevision(b.accountRevision))return fail('invalid_revision',400);
    try {
      const rows=await sql.query(COPY_GUEST_TO_EMPTY_ACCOUNT,[account.id,accessResult.owner,b.guestRevision,b.accountRevision]);
      if(!rows.length){deps.log('guest_import','conflict',409);return fail('import_conflict',409);}
      deps.log('guest_import','success',200);return json({revision:rows[0].revision});
    } catch {return fail('database_unavailable',503);}
  }
  return {getState,putState,getImport,postImport};
}
