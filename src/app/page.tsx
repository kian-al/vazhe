"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { useApp } from "@/components/store";
import { Icon,Skel,Sprout } from "@/components/ui";
import { faN } from "@/lib/dictionary";
import { dueWords,BATCH_MAX } from "@/lib/vocabulary";
export default function Home(){
 const app=useApp();const [now,setNow]=useState(0);
 useEffect(()=>{setNow(Date.now());const id=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(id)},[]);
 if(!app.ready)return <div className="flex flex-col gap-4" aria-busy="true" aria-label="در حال بارگذاری"><Skel h={80}/><Skel h={180}/></div>;
 const due=now?dueWords(app.state,now).length:0;
 return <div className="home-redesign flex flex-col gap-4">
  {app.storageError&&<div className="banner banner-danger" role="alert"><Icon n="alert"/><p className="small">ذخیره‌سازی مرورگر در دسترس نیست. وضعیت همگام‌سازی را بررسی کن.</p></div>}
  <header className="flex items-center gap-3"><Sprout size={76} mood={app.words.length?'calm':'happy'}/><div><h2 className="h1">{app.words.length?'امروز چه کاری دلت می‌خواهد؟':'خوش آمدی؛ بیا اولین واژه را بکاریم'}</h2><p className="small muted">{app.words.length?'فشاری در کار نیست؛ هر کدام را خواستی شروع کن.':'از یک واژه شروع می‌کنیم، نه بیشتر.'}</p></div></header>
  <div className="home-cards">
   <section className="card home-study flex flex-col gap-3" aria-labelledby="free-h"><div className="flex items-center justify-between gap-2 flex-wrap"><h3 id="free-h" className="h2">مطالعهٔ آزاد</h3><span className="chip chip-accent"><Icon n="check" size={14}/> همیشه باز</span></div><p>با همهٔ <b>{faN(app.words.length)}</b> واژهٔ شخصی‌ات، بدون سقف روزانه.</p><p className="small muted">موعد مرور و پیشرفت رسمی را تغییر نمی‌دهد؛ فقط برای تمرین راحت است.</p><div className="flex gap-2 flex-wrap"><Link className="btn btn-primary" style={{flex:1}} href={app.words.length?'/study':'/search'}><Icon n={app.words.length?'flip':'search'}/>{app.words.length?'شروع مطالعهٔ آزاد':'پیدا کردن اولین واژه'}</Link>{app.queue.length>0&&<Link className="btn btn-ghost" href="/study?scope=queue">فقط واژه‌های صف</Link>}</div></section>
   <section className="card home-scheduled flex flex-col gap-3" aria-labelledby="sched-h"><div className="flex items-center justify-between gap-2 flex-wrap"><h3 id="sched-h" className="h2">مرور زمان‌بندی‌شده</h3><span className="chip chip-accent"><Icon n="clock" size={14}/> بر پایهٔ FSRS</span></div><p className="small muted">فقط واژه‌های دستهٔ فعال که موعدشان رسیده اینجا مرور می‌شوند؛ نتیجهٔ مرور روی موعد و مرحله اثر دارد.</p><div className="banner"><Icon n="info" size={18}/><p className="small">{faN(due)} واژه آمادهٔ مرور است. مطالعهٔ آزاد همیشه جدا و در دسترس است.</p></div><Link className="btn btn-ghost" href="/review"><Icon n="clock"/> دیدن مرورها</Link></section>
  </div>
  <h3 className="h3">ادامه بده</h3><div className="home-next">
   <Link className="card card-lift flex items-center gap-3" href="/batch"><span className="chip chip-accent icon-tile"><Icon n="leaf"/></span><span className="grow"><b>دستهٔ فعال</b><span className="small muted" style={{display:'block'}}>{faN(app.batch.length)} از {faN(BATCH_MAX)} واژه</span></span><Icon n="left" size={18}/></Link>
   <Link className="card card-lift flex items-center gap-3" href="/queue"><span className="chip chip-warm icon-tile"><Icon n="layers"/></span><span className="grow"><b>صف</b><span className="small muted" style={{display:'block'}}>{faN(app.queue.length)} واژه منتظر است</span></span><Icon n="left" size={18}/></Link>
   <Link className="card card-lift flex items-center gap-3" href="/library"><span className="chip icon-tile"><Icon n="book"/></span><span className="grow"><b>کتابخانه</b><span className="small muted" style={{display:'block'}}>یک فصل تازه انتخاب کن</span></span><Icon n="left" size={18}/></Link>
  </div>
 </div>;
}
