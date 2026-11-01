"use client";
import Link from "next/link";
import { useApp } from "@/components/store";
import { Icon, Skel, Sprout } from "@/components/ui";
import { stg } from "@/components/words";
import { faN } from "@/lib/dictionary";
import { BATCH_MAX } from "@/lib/vocabulary";

export default function Home() {
  const { ready, words, queue, batch, storageError } = useApp();

  if (!ready) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="در حال بارگذاری">
        <Skel h={34} w="60%" />
        <div className="cards-2"><Skel h={180} r={22} /><Skel h={180} r={22} /></div>
        <Skel h={64} r={16} /><Skel h={64} r={16} />
      </div>
    );
  }

  const storageBanner = storageError && (
    <div className="banner banner-danger" role="alert">
      <Icon n="alert" />
      <p className="small"><b>ذخیره‌سازی مرورگر در دسترس نیست.</b> تغییرها فقط تا بستن این صفحه می‌مانند. حالت خصوصی یا پر بودن فضای مرورگر را بررسی کن.</p>
    </div>
  );

  if (words.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {storageBanner}
        <div className="card flex flex-col items-center text-center gap-3 rise" style={{ padding: 28 }}>
          <Sprout mood="happy" size={110} className="breathe" />
          <h2 className="h1">خوش آمدی؛ بیا اولین واژه را بکاریم</h2>
          <p className="muted">فهرست تو خالی است و همین خوب است — از یک واژه شروع می‌کنیم.</p>
        </div>
        <div className="cards-3">
          <Link className="btn btn-primary" style={{ minHeight: 56 }} href="/search"><Icon n="search" /> جست‌وجوی یک واژه</Link>
          <Link className="btn btn-ghost" style={{ minHeight: 56 }} href="/library"><Icon n="book" /> شروع از کتابخانه</Link>
          <Link className="btn btn-ghost" style={{ minHeight: 56 }} href="/words"><Icon n="list" /> برگرداندن واژه‌های نمونه</Link>
        </div>
        <div className="card rise" style={{ ...stg(2), borderStyle: "dashed" }}>
          <div className="flex items-center justify-between gap-2 flex-wrap"><b>مطالعهٔ آزاد</b><span className="chip">وقتی واژه‌ای داشتی باز می‌شود</span></div>
          <p className="small muted mt-1">مطالعهٔ آزاد همیشه به همهٔ واژه‌های شخصی‌ات دسترسی دارد.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {storageBanner}
      <div className="flex items-center gap-3 rise">
        <Sprout size={76} className="breathe shrink-0" />
        <div>
          <h2 className="h1">امروز چه کاری دلت می‌خواهد؟</h2>
          <p className="muted small">فشاری در کار نیست؛ هر کدام را که خواستی شروع کن.</p>
        </div>
      </div>

      <div className="cards-2">
        <section className="card rise flex flex-col gap-3" style={{ ...stg(1), padding: 20, borderColor: "var(--accent)", borderWidth: 2 }} aria-labelledby="free-h">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 id="free-h" className="h3" style={{ fontSize: 20 }}>مطالعهٔ آزاد</h3>
            <span className="chip chip-accent"><Icon n="check" size={14} /> همیشه باز</span>
          </div>
          <p>با همهٔ <b>{faN(words.length)}</b> واژهٔ شخصی‌ات، بدون سقف روزانه.</p>
          <p className="small muted">موعد مرور و پیشرفت رسمی را تغییر نمی‌دهد؛ فقط برای تمرین راحت است.</p>
          <div className="flex gap-2 flex-wrap">
            <Link className="btn btn-primary grow" style={{ minHeight: 54 }} href="/study"><Icon n="flip" /> شروع مطالعهٔ آزاد</Link>
            {queue.length > 0 && <Link className="btn btn-ghost" style={{ minHeight: 54 }} href="/study?scope=queue">فقط واژه‌های صف</Link>}
          </div>
        </section>

        <section className="card rise flex flex-col gap-3" style={{ ...stg(2), padding: 20, borderStyle: "dashed", borderColor: "var(--edge)", background: "transparent" }} aria-labelledby="sched-h">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 id="sched-h" className="h3" style={{ fontSize: 20 }}>مرور زمان‌بندی‌شده</h3>
            <span className="chip chip-warm"><Icon n="lock" size={14} /> در انتظار اتصال FSRS</span>
          </div>
          <p className="small muted">این بخش جدا از مطالعهٔ آزاد است. تا وقتی FSRS وصل نشده، موعدی محاسبه یا نمایش داده نمی‌شود.</p>
          <button type="button" className="btn" disabled><Icon n="lock" size={18} /> هنوز فعال نیست</button>
        </section>
      </div>

      <h3 className="h3 rise" style={{ ...stg(3), marginTop: 6 }}>ادامه بده</h3>
      <div className="cards-3">
        <Link className="card card-lift rise flex items-center gap-3" style={stg(4)} href="/batch">
          <span className="chip chip-accent icon-tile"><Icon n="leaf" /></span>
          <span style={{ flex: 1 }}><b>دستهٔ فعال</b><span className="small muted" style={{ display: "block" }}>{faN(batch.length)} از {faN(BATCH_MAX)} واژه</span></span>
          <Icon n="left" size={18} />
        </Link>
        <Link className="card card-lift rise flex items-center gap-3" style={stg(5)} href="/queue">
          <span className="chip chip-warm icon-tile"><Icon n="layers" /></span>
          <span style={{ flex: 1 }}><b>صف</b><span className="small muted" style={{ display: "block" }}>{faN(queue.length)} واژه منتظر است</span></span>
          <Icon n="left" size={18} />
        </Link>
        <Link className="card card-lift rise flex items-center gap-3" style={stg(6)} href="/search">
          <span className="chip icon-tile"><Icon n="search" /></span>
          <span style={{ flex: 1 }}><b>واژهٔ تازه پیدا کن</b><span className="small muted" style={{ display: "block" }}>جست‌وجو با پیشنهاد املا</span></span>
          <Icon n="left" size={18} />
        </Link>
      </div>
    </div>
  );
}
