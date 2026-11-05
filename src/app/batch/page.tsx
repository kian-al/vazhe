"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/store";
import { Burst, Icon, Skel } from "@/components/ui";
import { EmptyCard, stg, WordRow } from "@/components/words";
import { fa, faN } from "@/lib/dictionary";
import { BATCH_MAX, canStartNextBatch, dueWords, isBatchComplete, statusKey } from "@/lib/vocabulary";

export default function BatchPage() {
  const app = useApp();
  const [shake, setShake] = useState(0);
  const [why, setWhy] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(id); }, []);
  if (!app.ready) return <div className="flex flex-col gap-3" aria-busy="true"><Skel h={220} r={22} /><Skel h={120} r={22} /></div>;
  const batch = app.batch;
  const done = batch.filter((w) => w.status === "completed").length;
  const complete = isBatchComplete(app.state);
  const canNext = canStartNextBatch(app.state);
  const dist = [1, 2, 3, 4, 5].map((n) => batch.filter((w) => w.stage === n).length);
  const sample = batch.some((w) => w.source === "sample");
  const due = now ? dueWords(app.state, now).length : 0;

  return (
    <div className="flex flex-col gap-4">
      <div><h2 className="h1">دستهٔ فعال</h2><p className="small muted">حداکثر {faN(BATCH_MAX)} واژه در هر دسته. دیدن واژه‌ها و مطالعهٔ آزاد هیچ‌وقت قفل نیست.</p></div>

      {batch.length === 0 ? (
        <EmptyCard title="هنوز دسته‌ای ساخته نشده" action={<Link className="btn btn-ghost" href="/queue"><Icon n="layers" size={18} /> دیدن صف ({faN(app.queue.length)})</Link>}>
          با ساخت دسته، تا {faN(BATCH_MAX)} واژهٔ قدیمی‌ترِ صف (به ترتیب ورود) وارد مرحلهٔ ۱ می‌شوند و اولین مرورشان همان لحظه آماده است.
          {app.queue.length > 0 && <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => app.startBatch()}><Icon n="plus" /> ساخت دستهٔ تازه از صف</button>}
        </EmptyCard>
      ) : (
        <section className="card flex flex-col gap-3 rise" aria-label="ظرفیت دسته">
          <div className="flex items-end justify-between gap-2 flex-wrap"><b style={{ fontSize: 20 }}>{faN(batch.length)} از {faN(BATCH_MAX)}</b>{sample && <span className="chip chip-demo">دادهٔ نمونه</span>}</div>
          <div style={{ height: 12, background: "var(--surface2)", borderRadius: 99, overflow: "hidden" }} role="progressbar" aria-valuemin={0} aria-valuemax={BATCH_MAX} aria-valuenow={batch.length} aria-label="پُری دسته">
            <div className="fillbar" style={{ height: "100%", width: `${(batch.length / BATCH_MAX) * 100}%`, background: "var(--accent)", borderRadius: 99 }} />
          </div>
          <div className="flex flex-col gap-2">
            {dist.map((n, i) => (
              <div key={i} className="flex items-center gap-3"><span style={{ width: 84 }} className="small">مرحلهٔ {fa(i + 1)}</span>
                <div style={{ flex: 1, height: 8, background: "var(--surface2)", borderRadius: 99 }}><div className="fillbar" style={{ height: "100%", width: `${(n / Math.max(1, batch.length)) * 100}%`, background: "var(--accent)", borderRadius: 99, animationDelay: `${i * 90}ms` }} /></div>
                <b className="small" style={{ width: 28, textAlign: "left" }}>{fa(n)}</b></div>
            ))}
          </div>
          <div className="banner"><Icon n="info" size={18} /><p className="small"><b>قانون مرحله‌ها:</b> در مرور زمان‌بندی‌شده «یادم بود» یا «آسان بود» یک مرحله جلو می‌برد، «سخت بود» همان مرحله و «فراموش کردم» یک مرحله عقب. موفقیت در مرحلهٔ ۵ یعنی تکمیل. مطالعهٔ آزاد مرحله را تغییر نمی‌دهد.</p></div>
          <div className="flex items-center justify-between gap-2 flex-wrap"><span className="small muted">{faN(due)} واژه همین حالا آمادهٔ مرور</span><Link className="btn btn-soft" href="/review"><Icon n="clock" size={18} /> مرور زمان‌بندی‌شده</Link></div>
        </section>
      )}

      {batch.length > 0 && (
        <section className={`card flex flex-col gap-3 rise ${complete ? "pop" : ""}`} style={{ ...stg(2), borderColor: complete ? "var(--accent)" : "var(--edge)", borderStyle: complete ? "solid" : "dashed", borderWidth: 2, position: "relative" }} aria-labelledby="next-h">
          {complete && <Burst k={1} />}
          <div className="flex items-center gap-3">
            <button type="button" className={`btn btn-ghost icon-btn ${shake ? "wobble" : ""}`} key={shake} aria-expanded={why} aria-controls="why-locked" aria-label="چرا؟" onClick={() => { setShake((x) => x + 1); setWhy((x) => !x); }}><Icon n={complete ? "leaf" : "lock"} /></button>
            <div style={{ flex: 1 }}>
              <b id="next-h">{complete ? "دستهٔ بعدی مجاز است" : "دستهٔ بعدی قفل است"}</b>
              <p className="small muted">{complete ? "همهٔ اعضای این دسته مرحلهٔ پنجم را گذرانده‌اند." : `وقتی باز می‌شود که همهٔ اعضای دستهٔ فعلی مرحلهٔ پنجم را گذرانده باشند. الان ${faN(done)} از ${faN(batch.length)} گذرانده‌اند.`}</p>
            </div>
          </div>
          {why && <p id="why-locked" className="small muted">این قفل فقط ساختن دستهٔ بعدی را می‌بندد؛ دیدن واژه‌ها، جست‌وجو، صف و مطالعهٔ آزاد همیشه باز است.</p>}
          {complete ? (
            <button type="button" className="btn btn-primary" disabled={!canNext} onClick={() => app.startBatch()}><Icon n="plus" /> {canNext ? `ساختن دستهٔ بعدی از صف (${faN(Math.min(BATCH_MAX, app.queue.length))} واژه)` : "صف خالی است؛ اول واژه اضافه کن"}</button>
          ) : (
            <button type="button" className="btn" disabled><Icon n="lock" size={18} /> هنوز قفل است</button>
          )}
        </section>
      )}

      {batch.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap"><h3 className="h3">اعضای دسته</h3><Link className="btn btn-soft" href="/study?scope=batch"><Icon n="flip" size={18} /> مطالعهٔ آزاد همین دسته</Link></div>
          <div className="members" role="list" aria-label="اعضای دستهٔ فعال">
            {batch.map((w) => (
              <div key={w.id} role="listitem" style={{ height: 84 }}><WordRow item={w} status={statusKey(w)} stage={w.stage} href={`/word/${encodeURIComponent(w.id)}`} /></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
