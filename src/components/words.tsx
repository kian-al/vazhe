"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { fa, faN, type DictionaryEntry } from "@/lib/dictionary";
import { statusKey, type StatusKey, type WordRecord } from "@/lib/vocabulary";
import { useApp } from "./store";
import { Burst, En, Icon, Ipa, Pips, Sprout, StatusChip, speak } from "./ui";

export const stg = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;

export function Marked({ text, word }: { text: string; word: string }) {
  if (!word) return <>{text}</>;
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${esc}\\w*)`, "i"));
  return <>{parts.map((p, i) => (i % 2 ? <mark key={i} style={{ background: "var(--hl)", borderRadius: 6, padding: "0 4px" }}>{p}</mark> : <span key={i}>{p}</span>))}</>;
}

/** فهرست مجازی: فقط ردیف‌های دیدنی ساخته می‌شوند؛ با ۴ یا هزاران واژه یکسان کار می‌کند. */
export function VList<T>({ items, rowH, render, label, keyOf }: { items: T[]; rowH: number; render: (it: T, i: number) => ReactNode; label: string; keyOf: (it: T) => string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const [h, setH] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setH(el.clientHeight);
    const ro = new ResizeObserver(() => setH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const small = items.length <= 40;
  const start = small ? 0 : Math.max(0, Math.floor(top / rowH) - 6);
  const end = small ? items.length : Math.min(items.length, Math.ceil((top + h) / rowH) + 6);
  return (
    <div ref={ref} className="scroll vlist" onScroll={small ? undefined : (e) => setTop(e.currentTarget.scrollTop)} role="list" aria-label={label}>
      <div style={{ height: items.length * rowH, position: "relative" }}>
        {items.slice(start, end).map((it, k) => (
          <div role="listitem" key={keyOf(it)} className={small ? "rise" : undefined} style={{ ...(small ? stg(Math.min(k, 12)) : {}), position: "absolute", insetInline: 0, top: (start + k) * rowH, height: rowH }}>
            {render(it, start + k)}
          </div>
        ))}
      </div>
    </div>
  );
}

type RowItem = { id: string; en: string; ipa: string; fa: string };

export function WordRow({ item, status, stage, href, replace, selected, onQuickAdd }: { item: RowItem; status: StatusKey; stage?: number | null; href: string; replace?: boolean; selected?: boolean; onQuickAdd?: () => void }) {
  const { dupe, byEn } = useApp();
  const isDupe = dupe && byEn(item.en)?.id === dupe;
  return (
    <div className={`flex items-center gap-1 ${isDupe ? "dupe-pulse" : ""}`} style={{ height: "100%", borderRadius: 16 }}>
      <Link href={href} prefetch={false} replace={replace} scroll={!replace} className="row" aria-current={selected ? "true" : undefined} data-selected={selected ? "true" : undefined} style={{ flex: 1, minWidth: 0 }}>
        <span style={{ minWidth: 0, flex: 1, display: "block" }}>
          <span className="flex items-baseline gap-2 flex-wrap" style={{ justifyContent: "flex-start" }}>
            <En style={{ fontSize: 16, fontWeight: 600 }}>{item.en}</En>
            <Ipa>{item.ipa}</Ipa>
          </span>
          <span className="small muted truncate" style={{ display: "block" }}>{item.fa}</span>
        </span>
        <span className="flex flex-col items-end gap-1 shrink-0">
          <StatusChip s={status} />
          {status === "active" || status === "done" ? <Pips stage={stage} /> : null}
        </span>
      </Link>
      {onQuickAdd && status === "new" ? (
        <button type="button" className="btn btn-soft icon-btn" aria-label={`افزودن «${item.en}» به صف`} onClick={onQuickAdd}><Icon n="plus" /></button>
      ) : null}
    </div>
  );
}

export function EmptyCard({ mood = "sleep", title, children, action }: { mood?: "sleep" | "happy" | "calm" | "oops"; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center text-center gap-3 rise" style={{ padding: 28 }}>
      <Sprout mood={mood} size={96} className="breathe" />
      <h2 className="h3">{title}</h2>
      {children && <p className="muted small" style={{ maxWidth: "46ch" }}>{children}</p>}
      {action}
    </div>
  );
}

/** جزئیات واژه — هم برای واژه‌نامه و هم واژه‌های شخصی */
export function WordDetail({ entry, record: recordProp }: { entry: DictionaryEntry; record?: WordRecord }) {
  const app = useApp();
  const record = recordProp ?? app.byEn(entry.en);
  const s = statusKey(record);
  const [bk, setBk] = useState(0);
  const pos = record ? app.queue.findIndex((w) => w.id === record.id) + 1 : 0;
  const [confirmDel, setConfirmDel] = useState(false);
  const w = record ?? entry;
  return (
    <div className="flex flex-col gap-4 in-fwd" key={entry.en}>
      <section className="card" style={{ padding: 20 }} aria-labelledby={`wt-${entry.id}`}>
        <div className="flex items-start justify-between gap-2">
          {w.pos ? <span className="chip">{w.pos}</span> : <span />}
          <StatusChip s={s} />
        </div>
        <En as="h2" className="word-title" style={{ marginTop: 10 }}><span id={`wt-${entry.id}`}>{w.en}</span></En>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Ipa>{w.ipa}</Ipa>
          <button type="button" className="btn btn-soft icon-btn" onClick={() => { if (!speak(w.en)) app.notify("این مرورگر تلفظ صوتی ندارد.", "warn"); }} aria-label={`پخش تلفظ ${w.en} با صدای مرورگر`}><Icon n="volume" /></button>
          <span className="small muted">صدای مرورگر؛ فایل صوتی واژه‌نامه هنوز وصل نیست</span>
        </div>
        <p style={{ fontSize: 24, fontWeight: 800, marginTop: 12, lineHeight: 1.6 }}>{w.fa}</p>
      </section>

      {entry.sourceUrl && <p className="source-credit small">منبع: <a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="link">ویکی‌واژه</a> · {entry.license} · <Link href="/about" className="link">دربارهٔ داده‌ها</Link><br/>ترجمه‌های جامعهٔ کاربران؛ ممکن است چند معنی متفاوت باشند.</p>}

      {w.exampleEn ? (
        <section className="card" aria-label="مثال">
          <p className="small muted" style={{ fontWeight: 700 }}>مثال</p>
          <En as="p" style={{ fontSize: 16, lineHeight: 1.6, marginTop: 6 }}><Marked text={w.exampleEn} word={w.en} /></En>
          {w.exampleFa && <p className="small muted" style={{ marginTop: 4 }}>{w.exampleFa}</p>}
        </section>
      ) : (
        <p className="small muted">برای این واژه هنوز مثالی ثبت نشده است.</p>
      )}

      {record && app.dupe === record.id && (
        <div className="banner banner-warm dupe-pulse" role="status">
          <Icon n="alert" />
          <p className="small"><b>تکراری است.</b> «{w.en}» قبلاً اضافه شده{pos ? ` و در صف، جایگاه ${fa(pos)} است` : ""}؛ دوباره اضافه نشد.</p>
        </div>
      )}

      <section className="card flex flex-col gap-3" aria-label="وضعیت این واژه">
        <p style={{ fontWeight: 800 }}>وضعیت این واژه</p>
        {s === "new" && (
          <>
            <p className="small muted">با افزودن، واژه به فهرست شما می‌آید و در صف منتظر ورود به دستهٔ فعال می‌ماند.</p>
            <div style={{ position: "relative" }}>
              <button type="button" className="btn btn-primary w-full" onClick={() => { if (app.add(entry)) setBk((x) => x + 1); }}><Icon n="plus" /> افزودن به صف</button>
              {bk > 0 && <Burst k={bk} />}
            </div>
          </>
        )}
        {s === "queue" && record && (
          <>
            <p className="small"><Icon n="check" size={16} className="inline-icon" /> در صف است{pos ? ` (جایگاه ${fa(pos)} از ${faN(app.queue.length)})` : ""}.</p>
            <button type="button" className="btn btn-ghost" onClick={() => app.unqueue(record.id)}><Icon n="x" size={18} /> برداشتن از صف</button>
          </>
        )}
        {s === "mine" && record && (
          <>
            <p className="small muted">در فهرست شماست، اما در صف نیست.</p>
            <button type="button" className="btn btn-soft" onClick={() => app.requeueWord(record.id)}><Icon n="layers" size={18} /> برگرداندن به صف</button>
          </>
        )}
        {(s === "active" || s === "done") && record && (
          <>
            <div className="flex items-center gap-3"><Pips stage={record.stage} /><span className="small">{record.stage ? `مرحلهٔ ${fa(record.stage)} از ۵` : "در دستهٔ فعال"}{record.source === "sample" ? " (نمونه)" : ""}</span></div>
            <div className="banner banner-accent"><Icon n="info" size={18} /><p className="small">مرور زمان‌بندی‌شده می‌تواند مرحله را تغییر دهد؛ مرحله‌های یادگیری از حالت‌های داخلی FSRS جدا هستند.</p></div>
          </>
        )}
        {record && (
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-ghost" href={`/study?word=${encodeURIComponent(record.id)}`}><Icon n="flip" size={18} /> تمرین آزاد همین واژه</Link>
            {s !== "active" && (confirmDel ? (
              <span className="flex items-center gap-2 flex-wrap" role="group" aria-label="تأیید حذف">
                <button type="button" className="btn btn-danger-ghost" onClick={() => { app.remove(record.id); setConfirmDel(false); }}>بله، حذف شود</button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmDel(false)}>انصراف</button>
              </span>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmDel(true)}><Icon n="trash" size={18} /> حذف از فهرست</button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function PickHint({ text }: { text: string }) {
  return (
    <div className="card text-center flex flex-col items-center gap-2" style={{ padding: 32 }}>
      <Sprout size={90} className="breathe" />
      <b>یک واژه را انتخاب کن</b>
      <p className="small muted">{text}</p>
    </div>
  );
}
