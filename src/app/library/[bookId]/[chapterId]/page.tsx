"use client";
import Link from "next/link";import {useParams} from "next/navigation";import {useState} from "react";import {useApp} from "@/components/store";import {Burst,En,Icon,Skel} from "@/components/ui";import {EmptyCard,WordRow} from "@/components/words";import {faN} from "@/lib/dictionary";import {useLibrary} from "@/lib/library";import {countFresh,statusKey} from "@/lib/vocabulary";
export default function ChapterPage(){
 const {bookId,chapterId}=useParams<{bookId:string;chapterId:string}>();const app=useApp();const {books,status}=useLibrary();const [burst,setBurst]=useState(0);
 if(status==='loading')return <div aria-busy="true"><Skel h={160}/></div>;
 if(status==='error')return <div role="alert">دریافت کتابخانه ناموفق بود. صفحه را دوباره باز کن.</div>;
 const b=books.find(x=>x.id===bookId);const ch=b?.chapters.find(x=>x.id===chapterId);
 if(!b||!ch)return <EmptyCard title="این فصل پیدا نشد" action={<Link className="btn btn-primary" href="/library">بازگشت به کتابخانه</Link>}/>;
 const es=ch.entries,c=countFresh(app.words,es);
 return <div className="flex flex-col gap-4"><div><p className="small muted"><En sans>{b.title}</En></p><En as="h2" style={{fontSize:24}}>{ch.title}</En><p className="small muted">{faN(es.length)} واژه · {faN(c.fresh)} تازه</p></div>
 {!es.length?<div className="card"><p>{b.note}</p><Link className="btn btn-ghost" href={`/library/${b.id}`}>بازگشت به کتاب</Link></div>:<><div className="banner banner-info"><Icon n="info" size={18}/><p className="small">{b.note}</p></div><div style={{position:'relative'}}><button className="btn btn-primary w-full" disabled={!app.ready||!c.fresh} onClick={()=>{if(app.addMany(es).added)setBurst(n=>n+1)}}><Icon n="plus"/>{c.fresh?`افزودن ${faN(c.fresh)} واژه به صف`:'همهٔ واژه‌ها در مجموعه‌اند'}</button>{burst>0&&<Burst k={burst}/>}</div><div role="list" aria-label={`واژه‌های ${ch.title}`}>{es.map(e=>{const rec=app.byEn(e.en);return <div role="listitem" key={e.id} style={{minHeight:88}}><WordRow item={e} status={statusKey(rec)} stage={rec?.stage} href={`/word/${encodeURIComponent(rec?.id??e.id)}`}/></div>})}</div></>}
 </div>;
}
