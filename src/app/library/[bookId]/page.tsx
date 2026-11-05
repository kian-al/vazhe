"use client";
import Link from "next/link";import { useParams } from "next/navigation";
import { useApp } from "@/components/store";import { BookCover } from "@/components/BookCover";import { En, Icon, Skel } from "@/components/ui";import { EmptyCard } from "@/components/words";
import { faN } from "@/lib/dictionary";import { useLibrary } from "@/lib/library";import { countFresh } from "@/lib/vocabulary";
export default function BookPage(){
 const {bookId}=useParams<{bookId:string}>();const app=useApp();const {books,status}=useLibrary();
 if(status==='loading')return <div aria-busy="true"><Skel h={160}/></div>;
 if(status==='error')return <div role="alert">دریافت کتابخانه ناموفق بود. صفحه را دوباره باز کن.</div>;
 const b=books.find(x=>x.id===bookId);if(!b)return <EmptyCard title="این کتاب پیدا نشد" action={<Link className="btn btn-primary" href="/library">بازگشت به کتابخانه</Link>}/>;
 const entries=b.chapters.flatMap(c=>c.entries);const fresh=countFresh(app.words,entries).fresh;
 return <div className="flex flex-col gap-4"><div className="library-detail-head"><BookCover book={b} size={104}/><div><h2 className="h1">{b.fa}</h2><En as="p">{b.title}</En><p className="small muted">{b.author}</p></div></div>
 <div className="banner banner-info"><Icon n="info" size={18}/><p className="small">{b.note} {b.source&&<a href={b.source} target="_blank" rel="noreferrer">منبع اثر</a>}</p></div>
 {entries.length>0&&<button className="btn btn-primary" disabled={!app.ready||!fresh} onClick={()=>app.addMany(entries)}><Icon n="plus"/> {fresh?`افزودن ${faN(fresh)} واژهٔ تازه به صف`:'همهٔ واژه‌ها در مجموعه‌اند'}</button>}
 <div className="flex flex-col gap-2">{b.chapters.map(ch=><Link prefetch={false} key={ch.id} href={`/library/${b.id}/${ch.id}`} className="card card-lift flex items-center gap-3"><span style={{flex:1}}><En as="p" style={{fontSize:18}}>{ch.title}</En><span className="small muted">{ch.entries.length?`${faN(ch.entries.length)} واژهٔ استخراج‌شده`:'فهرست واژه‌ها آماده نیست'}</span></span><Icon n="left" size={18}/></Link>)}</div></div>;
}
