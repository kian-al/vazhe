// Manual browser test: synthetic origin and mocked API only. No external network.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from 'playwright';
const bundled=await build({stdin:{contents:"import { ExperimentalAccountClient } from './src/lib/sync/account-client'; globalThis.TestAccountClient = ExperimentalAccountClient;",resolveDir:process.cwd(),loader:'ts'},bundle:true,format:'iife',platform:'browser',write:false});
const script=bundled.outputFiles[0].text;
const identityA='a'.repeat(64),identityB='b'.repeat(64);
const empty=()=>({version:2,words:[],currentBatchId:null});
const data=new Map([[identityA,{revision:0,state:empty()}],[identityB,{revision:0,state:empty()}]]);
let identity=identityA, racing=false,count=0,release;
const gate=new Promise(resolve=>{release=resolve});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});
try {
 const context=await browser.newContext();
 await context.route('**/*',async r=>{
  const url=new URL(r.request().url());
  if(url.origin!=='http://vazhe-test.invalid')return r.abort();
  if(url.pathname==='/')return r.fulfill({status:200,contentType:'text/html',body:`<!doctype html><html><body><script>${script}</script></body></html>`});
  if(url.pathname!=='/api/account/state')return r.abort();
  if(r.request().method()==='GET'){
   const captured=structuredClone({identity,...data.get(identity)});
   if(racing){if(++count===2)release();await gate;}
   return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(captured)});
  }
  const b=r.request().postDataJSON();const current=data.get(identity);
  if(b.identity!==identity)return r.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'identity_changed'})});
  if(b.revision!==current.revision)return r.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'revision_conflict'})});
  data.set(identity,{revision:current.revision+1,state:b.state});
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({identity,revision:current.revision+1})});
 });
 const p1=await context.newPage(),p2=await context.newPage();
 await Promise.all([p1.goto('http://vazhe-test.invalid/'),p2.goto('http://vazhe-test.invalid/')]);
 await p1.evaluate(()=>{localStorage.setItem('vazhe.local.v2','guest-original');localStorage.setItem('vazhe.server.pending','guest-pending')});
 for(const page of [p1,p2]){
  const status=await page.evaluate(async()=>{window.client=new window.TestAccountClient(localStorage);return (await window.client.start()).phase});
  assert.equal(status,'ready');
 }
 const record=(id)=>({version:2,currentBatchId:null,words:[{id,en:id,fa:'نمونه',ipa:'',pos:'',exampleEn:'',exampleFa:'',status:'queued',stage:null,batchId:null,scheduledAt:null,addedAt:'2026-01-01T00:00:00.000Z',queuedAt:'2026-01-01T00:00:00.000Z',source:'manual'}]});
 racing=true;
 const results=await Promise.all([p1.evaluate(s=>window.client.submit(s),record('first')),p2.evaluate(s=>window.client.submit(s),record('second'))]);
 racing=false;assert.deepEqual(results.sort(),['conflict','written']);
 const p3=await context.newPage();await p3.goto('http://vazhe-test.invalid/');
 const pending=await p3.evaluate(async()=>{window.client=new window.TestAccountClient(localStorage);return window.client.start()});
 assert.equal(pending.phase,'blocked');assert.equal(pending.reason,'pending_recovery');assert.equal(pending.recovery.length,1);
 identity=identityB;
 const p4=await context.newPage();await p4.goto('http://vazhe-test.invalid/');
 const other=await p4.evaluate(async()=>{window.client=new window.TestAccountClient(localStorage);return window.client.start()});
 assert.equal(other.phase,'ready');assert.equal(other.state.words.length,0);
 assert.equal(await p4.evaluate(()=>localStorage.getItem('vazhe.local.v2')),'guest-original');
 assert.equal(await p4.evaluate(()=>localStorage.getItem('vazhe.server.pending')),'guest-pending');
 console.log('PASS: real browser tabs with shared localStorage: one saved, one conflicted and recoverable');
 console.log('PASS: other account isolated and legacy guest keys preserved; API is mocked');
 await context.close();
}finally{await browser.close();}
