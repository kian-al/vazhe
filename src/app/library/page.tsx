"use client";
import Link from "next/link";
import { BookCover } from "@/components/BookCover";
import { useApp } from "@/components/store";
import { En, Icon, Skel, Sprout } from "@/components/ui";
import { faN } from "@/lib/dictionary";
import { useLibrary, type LibraryBook } from "@/lib/library";
import { countFresh } from "@/lib/vocabulary";
function BookCard({book}:{book:LibraryBook}) {
 const app=useApp(); const entries=book.chapters.flatMap(c=>c.entries); const fresh=countFresh(app.words,entries).fresh;
 return <section className="card library-card" aria-label={book.fa ?? book.title}>
  <BookCover book={book} size={104}/><div className="library-card-content">
   <h3 className="h3">{book.fa ?? book.title}</h3><En as="p" style={{fontSize:14,color:'var(--ink2)',lineHeight:1.4}}>{book.title}</En>
   <p className="small muted" dir="ltr" style={{textAlign:'left'}}>{book.author}</p>
   <p className="small">{faN(book.chapters.length)} {book.id==='w1100'?'هفته':book.collection==='series'?'درس':'فصل'} · {entries.length ? `${faN(entries.length)} واژهٔ استخراج‌شده`:'فهرست واژه‌ها آماده نیست'}</p>
   <div className="library-actions"><Link className="btn btn-primary" href={`/library/${book.id}`}><Icon n="book" size={18}/> دیدن کتاب</Link>
   {!!entries.length && <button className="btn btn-ghost" disabled={!app.ready||!fresh} onClick={()=>app.addMany(entries)}><Icon n="plus" size={18}/> {fresh ? `${faN(fresh)} واژهٔ تازه به صف`:'واژه‌ها در مجموعه‌اند'}</button>}</div>
  </div></section>;
}
export default function LibraryPage() {
 const {books,status,retry}=useLibrary();
 if(status==='loading') return <div aria-busy="true" aria-label="در حال بارگذاری کتابخانه" className="flex flex-col gap-3"><Skel h={160}/><Skel h={160}/></div>;
 if(status==='error') return <div className="banner banner-warm" role="alert"><Icon n="alert" size={20}/><div className="flex flex-col gap-2"><p>کتابخانه از سرور دریافت نشد. اتصال را بررسی کن و دوباره تلاش کن.</p><button type="button" className="btn btn-ghost" onClick={retry}><Icon n="refresh" size={18}/> تلاش دوباره</button></div></div>;
 return <div className="flex flex-col gap-4 library-page">
  <div><h2 className="h1">کتابخانه</h2><p className="muted">یک کتاب انتخاب کن و واژه‌ها را فصل‌به‌فصل به صف بیاور.</p></div>
  <div className="banner banner-info" role="note"><Icon n="info" size={18}/><p className="small">واژه‌های آثار کلاسیک خودکار از متن هر فصل استخراج شده‌اند. فهرست درس‌های کتاب‌های آموزشی تا فراهم‌شدن منبع مجاز خالی است.</p></div>
  <h3 className="h2">سری‌های آموزش واژه</h3><div className="library-grid">{books.filter(b=>b.collection==='series').map(b=><BookCard key={b.id} book={b}/>)}</div>
  <h3 className="h2">ادبیات کلاسیک</h3><div className="library-grid">{books.filter(b=>b.collection==='classics').map(b=><BookCard key={b.id} book={b}/>)}</div>
  <div className="card flex items-center gap-3"><Sprout size={56}/><p className="small muted">واژه‌های تکراری دوباره به مجموعه‌ات اضافه نمی‌شوند.</p></div>
 </div>;
}
