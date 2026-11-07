import type { AccountHead, AccountTransport, AccountWrite, WriteResponse } from './upload';

const IDENTITY = /^[a-f0-9]{64}$/;
function headShape(value: unknown): value is AccountHead {
  if (!value || typeof value !== 'object') return false;
  const v = value as AccountHead;
  return typeof v.identity === 'string' && IDENTITY.test(v.identity) && Number.isSafeInteger(v.revision) && v.revision >= 0;
}
/** Opt-in adapter only; never includes account IDs or credentials supplied by the UI. */
export function accountTransport(fetcher: typeof fetch = (...args) => globalThis.fetch(...args)): AccountTransport {
  return {
    async head() {
      const response = await fetcher('/api/account/state', {cache:'no-store', credentials:'same-origin'});
      if (!response.ok) throw new Error('account_head_unavailable');
      const value: unknown = await response.json();
      if (!headShape(value)) throw new Error('invalid_account_head');
      return {identity:value.identity,revision:value.revision};
    },
    async write(body: AccountWrite): Promise<WriteResponse> {
      const response = await fetcher('/api/account/state', {
        method:'PUT', cache:'no-store', credentials:'same-origin',
        headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
      });
      if (response.status === 409) {
        let error: unknown;
        try { error = (await response.json())?.error; } catch { return {kind:'unavailable'}; }
        if (error === 'identity_changed') return {kind:'identity_changed'};
        if (error === 'revision_conflict') return {kind:'conflict'};
        return {kind:'unavailable'};
      }
      if ([400,401,403,413,415].includes(response.status)) return {kind:'denied'};
      if (!response.ok) return {kind:'unavailable'};
      const value: unknown = await response.json();
      return headShape(value) ? {kind:'ok',identity:value.identity,revision:value.revision} : {kind:'unavailable'};
    },
  };
}
