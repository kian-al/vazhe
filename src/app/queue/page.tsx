"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp, useIsDesktop } from "@/components/store";
import { Icon, Skel, inputDir } from "@/components/ui";
import { EmptyCard, PickHint, VList, WordDetail, WordRow } from "@/components/words";
import { faN } from "@/lib/dictionary";
import { BATCH_MAX, normalizeWord } from "@/lib/vocabulary";

function Queue() {
  const app = useApp();
  const desk = useIsDesktop();
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const items = useMemo(() => {
    const t = q.trim();
    const n = normalizeWord(t);
    return app.queue.filter((w) => !t || normalizeWord(w.en).includes(n) || w.fa.includes(t));
  }, [app.queue, q]);
  const selId = sp.get("w");
  const sel = selId ? app.words.find((w) => w.id === selId) : undefined;

  if (!app.ready) return <div className="flex flex-col gap-3" aria-busy="true">{Array.from({ length: 5 }, (_, i) => <Skel key={i} h={64} r={16} />)}</div>;
  if (app.queue.length === 0) {
    return (
      <EmptyCard title="صف خالی است" action={
        <div className="flex flex-wrap gap-2 justify-center">
          <Link className="btn btn-primary" href="/search"><Icon n="search" size={18} /> جست‌وجوی واژه</Link>
          <Link className="btn btn-ghost" href="/library"><Icon n="book" size={18} /> از کتابخانه</Link>
        </div>
      }>واژه‌های تازه که اضافه کنی، اینجا به ترتیب افزودن منتظر دستهٔ فعال می‌مانند.</EmptyCard>
    );
  }
  const list = (
    <div className="pane flex flex-col gap-3" style={{ flex: 1, minHeight: 0 }}>
      <div className="flex items-end justify-between gap-2"><h2 className="h1">صف</h2><span className="small muted">{faN(app.queue.length)} واژه</span></div>
      <div>
        <label htmlFor="qq" className="small muted" style={{ fontWeight: 700 }}>جست‌وجو در صف</label>
        <div className="input-wrap mt-1"><Icon n="search" size={20} /><input id="qq" type="search" dir={inputDir(q)} className="input" value={q} autoComplete="off" spellCheck={false} placeholder="بخشی از واژه یا معنی" onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      {items.length === 0 ? <p className="muted small" role="status">هیچ واژه‌ای در صف با این جست‌وجو نیست.</p> : (
        <VList items={items} rowH={88} label="صف" keyOf={(w) => w.id} render={(w) => (
          <div className="flex items-center gap-1" style={{ height: "100%" }}>
            <div style={{ flex: 1, minWidth: 0, height: "100%" }}>
              <WordRow item={w} status="queue" href={desk ? `/queue?w=${encodeURIComponent(w.id)}` : `/word/${encodeURIComponent(w.id)}`} replace={desk} selected={desk && selId === w.id} />
            </div>
            <button type="button" className="btn btn-ghost icon-btn" aria-label={`برداشتن «${w.en}» از صف`} onClick={() => app.unqueue(w.id)}><Icon n="x" size={18} /></button>
          </div>
        )} />
      )}
      <p className="small muted">صف سقف ندارد. دستهٔ فعال حداکثر {faN(BATCH_MAX)} واژه دارد. برداشتن از صف، واژه را از فهرستت حذف نمی‌کند.</p>
    </div>
  );
  if (!desk) return <div className="page-fill">{list}</div>;
  return (
    <div className="split">
      {list}
      <aside className="scroll" aria-label="جزئیات واژه">{sel ? <WordDetail entry={sel} record={sel} /> : <PickHint text="یک واژه از صف را انتخاب کن." />}</aside>
    </div>
  );
}

export default function Page() {
  return <Suspense><Queue /></Suspense>;
}
