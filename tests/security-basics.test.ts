import test from 'node:test';
import assert from 'node:assert/strict';
import { readBoundedJson, BodyTooLarge } from '../src/server/request-body';
import { eventRecord } from '../src/server/events';

test('bounded JSON accepts split multibyte data and rejects malformed or oversized streams', async () => {
 const bytes=new TextEncoder().encode(JSON.stringify({fa:'واژه'}));
 const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(bytes.slice(0,8));c.enqueue(bytes.slice(8));c.close()}});
 const req=new Request('http://localhost/',{method:'POST',body:stream,duplex:'half'} as RequestInit);
 assert.deepEqual(await readBoundedJson(req,100),{fa:'واژه'});
 await assert.rejects(readBoundedJson(new Request('http://localhost/',{method:'POST',body:'{'}),100),SyntaxError);
 await assert.rejects(readBoundedJson(new Request('http://localhost/',{method:'POST',headers:{'content-length':'1000'},body:'{}'}),50),BodyTooLarge);
 const oversized=new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(30));c.enqueue(new Uint8Array(30));c.close()}});
 await assert.rejects(readBoundedJson(new Request('http://localhost/',{method:'POST',body:oversized,duplex:'half'} as RequestInit),50),BodyTooLarge);
 const invalid=new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array([0xff]));c.close()}});
 await assert.rejects(readBoundedJson(new Request('http://localhost/',{method:'POST',body:invalid,duplex:'half'} as RequestInit),50));
});

test('operational event has only fixed, non-sensitive fields', () => {
 const record=eventRecord('guest_import','conflict',409);
 assert.deepEqual(Object.keys(record).sort(),['at','event','result','schema','status']);
 assert.equal(record.event,'guest_import');assert.equal(record.status,409);
 assert.ok(Number.isFinite(Date.parse(record.at)));
});

test('JSON content type is exact and revisions cannot lose integer precision', async () => {
 const { isJsonContentType, isRevision } = await import('../src/server/request-validation');
 for (const type of ['application/json','application/json; charset=utf-8',' Application/JSON ']) assert.equal(isJsonContentType(type),true);
 for (const type of [null,'','application/jsonp','application/json-evil','text/plain','application/problem+json']) assert.equal(isJsonContentType(type),false);
 for (const n of [0,1,Number.MAX_SAFE_INTEGER]) assert.equal(isRevision(n),true);
 for (const n of [-1,1.5,Number.MAX_SAFE_INTEGER+1,NaN,Infinity,'1',null]) assert.equal(isRevision(n),false);
});
