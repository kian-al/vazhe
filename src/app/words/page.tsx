"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp, useIsDesktop } from "@/components/store";
import { Icon, Skel, inputDir } from "@/components/ui";
import { EmptyCard, PickHint, VList, WordDetail, WordRow } from "@/components/words";
import { fa, faN } from "@/lib/dictionary";
import { filterPersonal, statusKey } from "@/lib/vocabulary";

type Filter = "all" | "queue" | "batch" | "done";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "همه" }, { id: "queue", label: "در صف" }, { id: "batch", label: "دستهٔ فعال" }, { id: "done", label: "مرحلهٔ ۵ گذرانده" },
];

function Words() {
  const app = useApp();
  const desk = useIsDesktop();
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [stage, setStage] = useState(0);
  const [confirmSamples, setConfirmSamples] = useState(false);
  const ordered = useMemo(() => [...app.words].reverse(), [app.words]);
  const items = useMemo(() => filterPersonal(ordered, q, filter, stage), [ordered, q, filter, stage]);
  const selId = sp.get("w");
  const sel = selId ? app.words.find((w) => w.id === selId) : undefined;

  if (!app.ready) return <div className="flex flex-col gap-3" aria-busy="true" aria-label="در حال بارگذاری">{Array.from({ length: 7 }, (_, i) => <Skel key={i} h={64} r={16} />)}</div>;
  if (app.words.length === 0) {
    return (
      <EmptyCard mood="happy" title="فهرست تو هنوز خالی است" action={
        <div className="flex flex-wrap gap-2 justify-center">
          <Link className="btn btn-primary" href="/search"><Icon n="search" size={18} /> جست‌وجوی اولین واژه</Link>
          <button type="button" className="btn btn-ghost" onClick={app.restoreSamples}>برگرداندن واژه‌های نمونه</button>
        </div>
      }>هر واژه‌ای که اضافه کنی اینجا می‌آید؛ فهرست سقف ندارد.</EmptyCard>
    );
  }

  const list = (
    <div className="pane flex flex-col gap-3" style={{ flex: 1, minHeight: 0 }}>
      <div className="flex items-end justify-between gap-2 flex-wrap">
        <h2 className="h1">واژه‌های من</h2>
        <span className="small muted" aria-live="polite">{faN(items.length)} از {faN(app.words.length)} واژه</span>
      </div>
      {app.hasSamples && (
        <div className="banner banner-warm" role="note">
          <Icon n="info" size={18} />
          <div className="flex flex-col gap-2" style={{ flex: 1 }}>
            <p className="small">چند <b>واژهٔ نمونه</b> برای دیدن حالت‌ها در فهرست‌اند؛ مرحله‌هایشان هم نمونه است.</p>
            {confirmSamples ? (
              <span className="flex gap-2 flex-wrap">
                <button type="button" className="btn btn-danger-ghost" onClick={() => { app.clearSamples(); setConfirmSamples(false); }}>بله، نمونه‌ها حذف شوند</button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmSamples(false)}>انصراف</button>
              </span>
            ) : (
              <button type="button" className="btn btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => setConfirmSamples(true)}><Icon n="trash" size={18} /> حذف واژه‌های نمونه</button>
            )}
          </div>
        </div>
      )}
      <div>
        <label htmlFor="wq" className="small muted" style={{ fontWeight: 700 }}>جست‌وجو در فهرست تو</label>
        <div className="input-wrap mt-1">
          <Icon n="search" size={20} />
          <input id="wq" type="search" dir={inputDir(q)} className="input" value={q} autoComplete="off" spellCheck={false} placeholder="انگلیسی یا فارسی، مثلاً cur یا کنجکاو" onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center" role="group" aria-label="فیلتر وضعیت">
        {FILTERS.map((f) => (
          <button type="button" key={f.id} className="chip chip-btn" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
        <label className="sr-only" htmlFor="stg">مرحله</label>
        <select id="stg" className="select" value={stage} onChange={(e) => setStage(Number(e.target.value))}>
          <option value={0}>همهٔ مرحله‌ها</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>مرحلهٔ {fa(n)}</option>)}
        </select>
      </div>
      {items.length === 0 ? (
        <EmptyCard title="چیزی با این فیلتر پیدا نشد" action={<button type="button" className="btn btn-soft" onClick={() => { setQ(""); setFilter("all"); setStage(0); }}>پاک‌کردن فیلترها</button>} />
      ) : (
        <VList items={items} rowH={84} label="فهرست واژه‌های شخصی" keyOf={(w) => w.id} render={(w) => (
          <WordRow item={w} status={statusKey(w)} stage={w.stage} selected={desk && selId === w.id}
            href={desk ? `/words?w=${encodeURIComponent(w.id)}` : `/word/${encodeURIComponent(w.id)}`} replace={desk} />
        )} />
      )}
    </div>
  );
  if (!desk) return <div className="page-fill">{list}</div>;
  return (
    <div className="split">
      {list}
      <aside className="scroll" aria-label="جزئیات واژه">
        {sel ? <WordDetail entry={sel} record={sel} /> : <PickHint text="معنی، تلفظ و مثال اینجا باز می‌شود؛ جای فهرست عوض نمی‌شود." />}
      </aside>
    </div>
  );
}

export default function Page() {
  return <Suspense><Words /></Suspense>;
}
