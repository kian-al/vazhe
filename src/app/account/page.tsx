'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { createAuthClient } from '@neon/auth/next';
import { Icon, Sprout } from '@/components/ui';

const auth = createAuthClient();
type View = 'signup' | 'login' | 'verify' | 'forgot' | 'reset' | 'signed-in';
type User = { name: string; email: string };

export default function AccountPage() {
 const [view,setView]=useState<View>('signup');
 const [name,setName]=useState(''); const [email,setEmail]=useState('');
 const [password,setPassword]=useState(''); const [otp,setOtp]=useState('');
 const [token,setToken]=useState(''); const [user,setUser]=useState<User|null>(null);
 const [busy,setBusy]=useState(false); const [checking,setChecking]=useState(true);
 const [error,setError]=useState(''); const [notice,setNotice]=useState('');

 useEffect(()=>{
  let active=true;
  const url=new URL(window.location.href); const t=url.searchParams.get('token');
  if(t){setToken(t);setView('reset');url.searchParams.delete('token');window.history.replaceState(null,'',url.pathname+url.search+url.hash);}
  auth.getSession().then(({data})=>{
   if(!active)return;
   if(data?.user && !t){setUser({name:data.user.name,email:data.user.email});setView('signed-in');}
  }).catch(()=>{}).finally(()=>{if(active)setChecking(false)});
  return()=>{active=false};
 },[]);

 useEffect(()=>{document.getElementById("main")?.scrollTo({top:0,behavior:"instant"});},[view]);

 function switchView(next:View){setView(next);setError('');setNotice('');setPassword('');setOtp('');}
 async function perform(action:()=>Promise<void>){
  if(busy)return; setBusy(true);setError('');setNotice('');
  try{await action()}catch{setError('ارتباط با سرویس حساب برقرار نشد. کمی بعد دوباره تلاش کن.')}finally{setBusy(false)}
 }
 async function submit(e:FormEvent){
  e.preventDefault();
  await perform(async()=>{
   const normalizedEmail=email.trim();
   if(view==='signup'){
    const result=await auth.signUp.email({name:name.trim(),email:normalizedEmail,password});
    if(result.error){setError('ساخت حساب انجام نشد؛ اطلاعات را بررسی کن یا بعداً دوباره تلاش کن.');return;}
    setPassword(''); setView('verify');setNotice('اگر ثبت‌نام موفق باشد، کد تأیید به ایمیلت فرستاده می‌شود.');
   }else if(view==='login'){
    const result=await auth.signIn.email({email:normalizedEmail,password});
    if(result.error){setError('ورود انجام نشد. ایمیل و رمز را بررسی کن؛ اگر ایمیلت تأیید نشده، کد را وارد کن.');return;}
    const session=await auth.getSession();
    if(!session.data?.user){setError('نشست تأیید نشد. دوباره تلاش کن.');return;}
    setPassword('');setUser({name:session.data.user.name,email:session.data.user.email});setView('signed-in');
   }else if(view==='verify'){
    const result=await auth.emailOtp.verifyEmail({email:normalizedEmail,otp:otp.trim()});
    if(result.error){setError('کد معتبر نیست یا منقضی شده است. دوباره امتحان کن.');return;}
    setOtp('');setView('login');setNotice('ایمیل تأیید شد. حالا می‌توانی وارد شوی.');
   }else if(view==='forgot'){
    const result=await auth.requestPasswordReset({email:normalizedEmail,redirectTo:`${window.location.origin}/account`});
    if(result.error){setError('درخواست بازیابی ارسال نشد؛ کمی بعد دوباره تلاش کن.');return;}
    setNotice('اگر حسابی با این ایمیل وجود داشته باشد، راهنمای بازیابی برایت ارسال می‌شود.');
   }else if(view==='reset'){
    if(!token){setError('لینک بازیابی معتبر نیست. دوباره درخواست بده.');return;}
    const result=await auth.resetPassword({newPassword:password,token});
    if(result.error){setError('بازیابی انجام نشد؛ ممکن است لینک منقضی شده باشد.');return;}
    setPassword('');setToken('');setView('login');setNotice('رمز تغییر کرد. با رمز جدید وارد شو.');
   }
  });
 }
 async function resend(){
  await perform(async()=>{
   if(!email.trim()){setError('اول ایمیلت را وارد کن.');return;}
   const result=await auth.sendVerificationEmail({email:email.trim()});
   if(result.error){setError('ارسال کد انجام نشد؛ کمی بعد دوباره تلاش کن.');return;}
   setNotice('اگر حساب تأییدنشده‌ای با این ایمیل وجود داشته باشد، کد ارسال می‌شود.');
  });
 }
 async function signOut(){
  await perform(async()=>{const r=await auth.signOut();if(r.error){setError('خروج انجام نشد؛ دوباره تلاش کن.');return;}setUser(null);switchView('login');setNotice('از حساب خارج شدی.');});
 }
 const title=view==='signup'?'حساب بساز، واژه‌هات همراهت بمونن':view==='login'?'خوش برگشتی':view==='verify'?'ایمیلت را تأیید کن':view==='forgot'?'بازیابی رمز عبور':view==='reset'?'رمز تازه انتخاب کن':`سلام ${user?.name || ''}!`;
 return <div className="account-page">
  <header className="account-intro">
   <Sprout size={68} mood={view==='signed-in'?'happy':'calm'} />
   <div><h2 className="h1" aria-live="polite">{title}</h2><p className="muted">یک جای امن برای مسیر یادگیری‌ات.</p></div>
  </header>
  <div className="banner banner-warm account-beta" role="note"><Icon n="info" size={20}/><p className="small"><b>نسخهٔ آزمایشی حساب</b><br/>اتصال واژه‌ها به حساب هنوز کامل نشده است؛ داده‌های فعلی همچنان مهمان هستند و بین دستگاه‌ها همگام نمی‌شوند.</p></div>
  {checking ? <section className="card account-card" aria-live="polite" aria-busy="true">در حال بررسی حساب…</section> : view==='signed-in' && user ? <>
   <section className="card account-card flex flex-col gap-3" aria-label="اطلاعات حساب">
    <div className="account-section-heading"><div><h3 className="h3">حساب تو</h3><p className="small muted">اطلاعات ورود</p></div><span className="chip chip-accent"><Icon n="check" size={16}/> وارد شده</span></div>
    <div className="account-profile"><span className="small muted">نام</span><b>{user.name}</b><span className="small muted">ایمیل</span><b className="en-sans account-email" dir="ltr">{user.email}</b></div>
    <p className="small muted">خروج، واژه‌های مهمان این مرورگر را پاک نمی‌کند.</p>
    {error && <p className="account-error" role="alert">{error}</p>}
    <button type="button" className="btn btn-ghost" disabled={busy} onClick={()=>void signOut()}>{busy?'کمی صبر کن…':'خروج از حساب'}</button>
   </section>
  </> : <>
   {(view==='signup'||view==='login') && <div className="account-switch" aria-label="انتخاب ورود یا ساخت حساب">
    <button type="button" aria-pressed={view==='signup'} onClick={()=>switchView('signup')}>ساخت حساب</button>
    <button type="button" aria-pressed={view==='login'} onClick={()=>switchView('login')}>ورود</button>
   </div>}
   <form className="card account-card flex flex-col gap-3" onSubmit={submit}>
    <div><h3 className="h3">{view==='signup'?'شروع با ایمیل':view==='login'?'ورود به حساب':view==='verify'?'کد تأیید':view==='forgot'?'ایمیل حساب': 'رمز عبور جدید'}</h3>
     <p className="small muted">{view==='signup'?'برای ساخت حساب، چند اطلاعات ساده کافی است.':view==='login'?'با ایمیل و رمز عبورت وارد شو.':view==='verify'?'کد ارسال‌شده به ایمیلت را وارد کن.':view==='forgot'?'اگر حسابت وجود داشته باشد، لینک بازیابی ارسال می‌شود.':'رمز تازه باید حداقل ۸ نویسه داشته باشد.'}</p></div>
    {view==='signup' && <label className="account-field"><span>نام</span><input className="input" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="مثلاً سارا" maxLength={100} required/></label>}
    {view!=='reset' && <label className="account-field"><span>ایمیل</span><input className="input en-sans" dir="ltr" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" maxLength={254} required/></label>}
    {(view==='signup'||view==='login'||view==='reset') && <div className="account-field"><label htmlFor="account-password">{view==='reset'?'رمز عبور تازه':'رمز عبور'}</label><input id="account-password" className="input en-sans" dir="ltr" type="password" autoComplete={view==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} minLength={8} maxLength={128} aria-describedby={view==='signup'?'password-hint':undefined} required/>{view==='signup' && <span id="password-hint" className="small muted">حداقل ۸ نویسه انتخاب کن.</span>}</div>}
    {view==='verify' && <label className="account-field"><span>کد تأیید</span><input className="input en-sans" dir="ltr" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={e=>setOtp(e.target.value)} maxLength={12} required/></label>}
    {error && <div className="banner banner-danger" role="alert"><Icon n="alert" size={18}/><p className="small">{error}</p></div>}
    {notice && <div className="banner banner-accent" role="status"><Icon n="info" size={18}/><p className="small">{notice}</p></div>}
    <button type="submit" className="btn btn-primary account-submit" disabled={busy}>{busy?'کمی صبر کن…':view==='signup'?'ساخت حساب':view==='login'?'ورود':view==='verify'?'تأیید ایمیل':view==='forgot'?'ارسال لینک بازیابی':'ذخیرهٔ رمز تازه'}</button>
    <div className="account-actions">
     {view==='login' && <><button type="button" className="link" onClick={()=>switchView('forgot')}>رمز را فراموش کرده‌ام</button><button type="button" className="link" onClick={()=>switchView('verify')}>واردکردن کد تأیید</button></>}
     {view==='verify' && <button type="button" className="link" disabled={busy} onClick={()=>void resend()}>ارسال دوبارهٔ کد</button>}
     {(view==='forgot'||view==='verify'||view==='reset') && <button type="button" className="link" onClick={()=>switchView('login')}>بازگشت به ورود</button>}
    </div>
   </form>
  </>}
  <p className="small muted account-footnote"><Icon n="lock" size={16}/> تا آماده‌شدن همگام‌سازی، داده‌های مهمان در همین مرورگر باقی می‌مانند. <Link className="link" href="/about">جزئیات ذخیره‌سازی</Link></p>
 </div>;
}
