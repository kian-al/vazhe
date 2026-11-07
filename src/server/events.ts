/** Minimal, allowlisted operational events. Never accept request bodies, URLs or credentials. */
export type EventName = 'state_write' | 'account_write' | 'guest_import' | 'auth_request';
export type EventResult = 'success' | 'denied' | 'conflict' | 'unavailable' | 'provider_response';
export function eventRecord(event: EventName, result: EventResult, status: number) {
  return {schema:1, at:new Date().toISOString(), event, result, status};
}
export function logEvent(event: EventName, result: EventResult, status: number) {
  console.info(JSON.stringify(eventRecord(event,result,status)));
}
