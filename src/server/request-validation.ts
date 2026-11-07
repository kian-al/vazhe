/** Strict checks for the browser JSON mutation endpoints. */
export function isJsonContentType(value: string | null): boolean {
  if (!value) return false;
  return value.split(';', 1)[0].trim().toLowerCase() === 'application/json';
}

/** Revisions cross the JSON boundary as JavaScript numbers; reject lossy values. */
export function isRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
