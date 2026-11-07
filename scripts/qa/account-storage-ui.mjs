// Manual, isolated browser smoke test. The app must be running locally; no real account is used.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
const base = process.env.VAZHE_QA_URL || 'http://127.0.0.1:3194';
const url=new URL(base);
if (!['127.0.0.1','localhost','::1','[::1]'].includes(url.hostname)) throw Error('QA URL must be localhost');
const screenshotDir=process.env.VAZHE_QA_SCREENSHOT_DIR;
if(screenshotDir)await mkdir(screenshotDir,{recursive:true});
const screenshot=async(page,name)=>{if(screenshotDir)await page.screenshot({path:path.join(screenshotDir,name)});};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});
try {
 const ctx=await browser.newContext({viewport:{width:390,height:844}}),p=await ctx.newPage();
 let requestedOtp=null; const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/api/auth/**',async r=>{
  const path=new URL(r.request().url()).pathname;
  if(path.endsWith('/email-otp/send-verification-otp'))requestedOtp=r.request().postDataJSON();
  const body=path.endsWith('/get-session')?null:path.endsWith('/sign-up/email')?{user:{id:'test',name:'سارا',email:'test@example.com',emailVerified:false},token:null}:{success:true};
  await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 await p.goto(`${base}/account`,{waitUntil:'networkidle'});
 await p.getByRole('heading',{name:'شروع با ایمیل'}).waitFor();
 assert.equal(await p.locator('#password-hint').count(),0);
 assert.equal(await p.locator('#account-password').getAttribute('aria-describedby'),'account-form-intro');
 assert.match(await p.locator('#account-form-intro').innerText(),/۸ نویسه/);
 await screenshot(p,'account-mobile.png');
 await p.locator('#account-password').scrollIntoViewIfNeeded(); await screenshot(p,'account-mobile-password.png');
 await p.getByLabel('نام',{exact:true}).fill('سارا');await p.getByLabel('ایمیل',{exact:true}).fill('test@example.com');await p.getByLabel('رمز عبور',{exact:true}).fill('example-password');
 await p.getByRole('button',{name:'ساخت حساب',exact:true}).last().click();await p.getByRole('heading',{name:'کد تأیید'}).waitFor();
 await p.getByRole('button',{name:'ارسال دوبارهٔ کد'}).click();await p.getByText('اگر حساب تأییدنشده‌ای با این ایمیل وجود داشته باشد، کد ارسال می‌شود.').waitFor();
 assert.equal(requestedOtp?.email,'test@example.com');assert.equal(requestedOtp?.type,'email-verification');
 console.log('PASS: input helper removed; resend uses email-verification OTP endpoint (mocked)');
 await p.evaluate(()=>localStorage.clear());
 let release;const gate=new Promise(resolve=>{release=resolve});let writes=0;
 await p.route('**/api/state',async r=>{
  if(r.request().method()==='GET'){await gate;await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({mode:'server',state:{version:2,words:[],currentBatchId:null},revision:0})});}
  else {writes++;await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({revision:1})});}
 });
 await p.route('**/api/dictionary?*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({results:[{id:'testword',en:'testword',fa:'نمونه',ipa:'',pos:'',exampleEn:'',exampleFa:''}],count:1})}));
 await p.goto(`${base}/search?q=testword`,{waitUntil:'domcontentloaded'});await p.getByRole('button',{name:'افزودن «testword» به صف'}).waitFor();
 assert.equal(await p.locator('#sh').count(),0);
 await p.getByRole('button',{name:'افزودن «testword» به صف'}).click();await p.getByText('هنوز در حال دریافت واژه‌ها هستیم؛ کمی بعد دوباره تلاش کن.').waitFor();
 assert.equal(writes,0);release();await p.getByText('ذخیره‌شده روی سرور').waitFor();await p.getByRole('button',{name:'افزودن «testword» به صف'}).click();
 await p.waitForTimeout(300);assert.equal(writes,1);await screenshot(p,'search-mobile.png');
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('PASS: writes are blocked until initial server snapshot loads and succeed afterward (mocked)');
 await ctx.close();
 const d=await browser.newContext({viewport:{width:1440,height:900}});const page=await d.newPage();
 await page.route('**/api/auth/**',r=>r.fulfill({status:200,contentType:'application/json',body:'null'}));
 await page.goto(`${base}/account`,{waitUntil:'networkidle'});await page.getByRole('heading',{name:'شروع با ایمیل'}).waitFor();await screenshot(page,'account-desktop.png');await d.close();
} finally { await browser.close(); }
