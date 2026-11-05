'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/components/store';
import { En, Icon, Skel } from '@/components/ui';
import { fa, faN } from '@/lib/dictionary';
import { isRelearning, nextStage, previewDays } from '@/lib/scheduler';
import { dueWords, nextDueAt, type FreeRating } from '@/lib/vocabulary';
const ratings: {id:FreeRating; label:string;}[] = [
 {id:'forgot',label:'فراموش کردم'},{id:'hard',label:'سخت بود'},{id:'good',label:'یادم بود'},{id:'easy',label:'آسان بود'}
];
function span(days:number){ if(days<1/24) return `${fa(Math.max(1,Math.round(days*1440)))} دقیقه`; if(days<1) return `${fa(Math.round(days*24))} ساعت`; return `${fa(Math.round(days))} روز`; }
function when(iso:string){ return new Date(iso).toLocaleString('fa-IR',{weekday:'long',hour:'2-digit',minute:'2-digit'}); }
export default function Review(){
 const app=useApp(); const [now,setNow]=useState(0); const [revealed,setRevealed]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [count,setCount]=useState(0);
 const [preview,setPreview]=useState<Record<FreeRating,number>|null>(null);
 useEffect(()=>{setNow(Date.now()); const id=setInterval(()=>setNow(Date.now()),30000); return()=>clearInterval(id)},[]);
 const due=useMemo(()=>now?dueWords(app.state,now):[],[app.state,now]);
 const word=due[0];
 useEffect(()=>{ let alive=true; setPreview(null); if(word) void previewDays(word.review).then(p=>{if(alive)setPreview(p)}); return()=>{alive=false}; },[word]);
 async function rate(r:FreeRating){if(!word || busy)return; setBusy(true);setError('');try{await app.reviewWord(word.id,r);setRevealed(false);setCount(n=>n+1);setNow(Date.now());}catch{setError('ثبت مرور انجام نشد؛ دوباره امتحان کن.')}finally{setBusy(false)}}
 if(!app.ready || !now)return <Skel h={300} r={12}/>;
 const outcome=(r:FreeRating)=>{ const st=word?.stage ?? 1; const c=nextStage(st,r,isRelearning(word?.review)); if(c.completed) return 'تکمیل واژه'; const label=c.stage===st?'همین مرحله':`مرحلهٔ ${fa(c.stage)}`; return preview?`${label} · ${span(preview[r])}`:label; };
 const active=app.batch.filter(w=>w.status==='active').length;
 const upcoming=nextDueAt(app.state,now);
 return <div className="page-narrow flex flex-col gap-4">
 <div><h2 className="h1">مرور زمان‌بندی‌شده</h2><p className="muted">فقط واژه‌های دستهٔ فعال. «یادم بود/آسان بود» یک مرحله جلو می‌برد، «سخت بود» همان‌جا نگه می‌دارد و «فراموش کردم» یک مرحله عقب می‌برد. موفقیت در مرحلهٔ ۵ یعنی تکمیل.</p></div>
 {word ? <><div className="flex gap-2 flex-wrap"><span className="chip chip-accent">{faN(due.length)} واژه آمادهٔ مرور</span><span className="chip">مرحلهٔ {fa(word.stage ?? 1)} از ۵</span><span className="chip">{faN(count)} مرور در این نوبت</span></div>
 <section className="card flex flex-col gap-4" style={{minHeight:250,justifyContent:'center',textAlign:'center'}}><En as="h2" className="word-title" style={{fontSize:'clamp(36px, 9vw, 60px)'}}>{word.en}</En>{revealed ? <><p style={{fontSize:24,fontWeight:700}}>{word.fa}</p>{word.exampleEn && <En as="p" className="muted">{word.exampleEn}</En>}</>:<p className="muted">معنی را به یاد بیاور، بعد پاسخ را ببین.</p>}</section>
 {!revealed ? <button className="btn btn-primary" onClick={()=>setRevealed(true)}>نمایش پاسخ</button> : <div className="rating-grid">{ratings.map(r=><button key={r.id} disabled={busy} className={`btn ${r.id==='good'?'btn-primary':'btn-ghost'}`} onClick={()=>void rate(r.id)} style={{flexDirection:'column',gap:2}}><span>{r.label}</span><span className="small" style={{opacity:.75,fontWeight:400}}>{outcome(r.id)}</span></button>)}</div>}
 {error && <p role="alert">{error}</p>}
 <p className="small muted">فاصله‌ها را FSRS-6 بر اساس پاسخ‌های خودت تعیین می‌کند (حداکثر ۱۰ روز). مرور جبرانیِ بعد از «فراموش کردم» مرحله را جلو نمی‌برد.</p></>
 : <section className="card flex flex-col gap-3">
   {active>0 ? <><b>فعلاً مرور آماده‌ای نداری.</b><p className="muted">{faN(active)} واژه در دستهٔ فعال منتظر موعدند{upcoming?`؛ مرور بعدی: ${when(upcoming)}`:''}.</p><Link className="btn btn-ghost" href="/study"><Icon n="flip"/>مطالعهٔ آزاد تا آن موقع</Link></>
   : app.canStart ? <><b>{app.batch.length?'دستهٔ فعلی تکمیل شد.':'هنوز دسته‌ای نساخته‌ای.'}</b><p className="muted">با ساخت دسته، تا {faN(100)} واژهٔ قدیمی‌ترِ صف وارد مرحلهٔ ۱ می‌شوند و مرورشان از همین حالا شروع می‌شود. ({faN(app.queue.length)} واژه در صف)</p><button className="btn btn-primary" onClick={()=>{app.startBatch();setNow(Date.now());}}><Icon n="plus"/>ساخت دستهٔ تازه از صف</button></>
   : <><b>{app.words.length?'صف خالی است.':'هنوز واژه‌ای نداری.'}</b><p className="muted">برای مرور زمان‌بندی‌شده اول چند واژه به صف اضافه کن، بعد دسته بساز.</p><Link className="btn btn-ghost" href="/search"><Icon n="search"/>جست‌وجوی واژه</Link></>}
 </section>}
 <Link href="/batch" className="link">دیدن دستهٔ فعال</Link></div>
}
