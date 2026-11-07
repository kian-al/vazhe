/** Read bounded UTF-8 JSON without first buffering an unbounded request body. */
export class BodyTooLarge extends Error {
  constructor() { super('payload_too_large'); }
}
export async function readBoundedJson(req: Request, limit: number): Promise<unknown> {
  const declared = req.headers.get('content-length');
  if (declared && /^\d+$/.test(declared) && Number(declared) > limit) throw new BodyTooLarge();
  if (!req.body) throw new SyntaxError('invalid_json');
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const {done,value} = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        // Do not await cancellation: a client can leave a cancellation pending.
        void reader.cancel().catch(() => {});
        throw new BodyTooLarge();
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
