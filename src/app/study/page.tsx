"use client";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/components/store";
import { Burst, DemoChip, En, Icon, Ipa, Skel, Sprout, speak } from "@/components/ui";
import { EmptyCard, Marked, stg } from "@/components/words";
import { fa, faN } from "@/lib/dictionary";
import { applyFreePracticeRating, freeStudyRound, getPersonalWords, ROUND_SIZE, type FreeRating, type WordRecord } from "@/lib/vocabulary";

const RATINGS: { id: FreeRating; label: string; icon: string; key: string }[] = [
  { id: "forgot", label: "فراموش کردم", icon: "refresh", key: "1" },
  { id: "hard", label: "سخت بود", icon: "flame", key: "2" },
  { id: "good", label: "یادم بود", icon: "check", key: "3" },
  { id: "easy", label: "آسان بود", icon: "spark", key: "4" },
];
const FA_KEYS: Record<string, string> = { "۱": "1", "۲": "2", "۳": "3", "۴": "4" };
const COACH = [
  "اشکال ندارد؛ فراموش‌کردن بخشی از یادگرفتن است. یک بار دیگر به معنی و مثال نگاه کن.",
  "این واژه فقط کمی از دستت رفت. یک جملهٔ کوتاه با آن در ذهنت بساز و برو سراغ بعدی.",
  "همین‌که دوباره دیدیش یعنی داری جلو می‌روی. نفس بکش، ادامه می‌دهیم.",
];

type Phase = "q" | "a" | "coach" | "recall" | "compare" | "advancing";

function Study() {
  const app = useApp();
  const router = useRouter();
  const sp = useSearchParams();
  const scope = sp.get("scope");
  const wordId = sp.get("word");
  const pool = useMemo<WordRecord[]>(() => {
    const all = getPersonalWords(app.words);
    if (wordId) return all.filter((w) => w.id === wordId);
    if (scope === "queue") return all.filter((w) => w.status === "queued");
    if (scope === "batch") return all.filter((w) => w.batchId && w.batchId === app.state.currentBatchId);
    return all;
  }, [app.words, app.state.currentBatchId, scope, wordId]);
  const [seed, setSeed] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [order, setOrder] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("q");
  const [ratings, setRatings] = useState<FreeRating[]>([]);
  const [burst, setBurst] = useState(0);
  const [recall, setRecall] = useState("");
  const [finished, setFinished] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => { setSeed(Math.floor(Math.random() * 1_000_000)); }, []);
  useEffect(() => {
    if (!app.ready || seed === null) return;
    setOrder(freeStudyRound(pool.map((w) => w.id), round, seed));
    setI(0); setPhase("q"); setRatings([]); setFinished(false); setRecall("");
    // فقط با شروع دور تازه دوباره ساخته می‌شود؛ تغییر فهرست وسط دور آن را به‌هم نمی‌زند.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.ready, seed, round, scope, wordId]);
  useEffect(() => { root.current?.focus({ preventScroll: true }); }, [i, phase]);
  useEffect(() => {
    if (phase !== "advancing") return;
    const t = setTimeout(next, 520);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, i]);

  const byId = (id: string) => app.words.find((w) => w.id === id);
  const w = order[i] ? byId(order[i]) : undefined;

  function next() {
    if (i + 1 >= order.length) { setFinished(true); return; }
    setI(i + 1); setPhase("q"); setRecall("");
  }
  function rate(r: FreeRating) {
    if (!w || phase !== "a") return;
    applyFreePracticeRating(w, r); // عمداً بدون اثر بر موعد، مرحله و وضعیت
    setRatings((x) => [...x, r]);
    if (r === "forgot") setPhase("coach");
    else { setBurst((b) => b + 1); setPhase("advancing"); }
  }
  const onKey = (e: globalThis.KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLButtonElement || t instanceof HTMLAnchorElement) return;
    if (phase === "q" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); setPhase("a"); return; }
    if (phase === "a") { const k = FA_KEYS[e.key] ?? e.key; const r = RATINGS.find((x) => x.key === k); if (r) rate(r.id); }
    if ((phase === "coach" || phase === "compare") && e.key === "Enter") { e.preventDefault(); next(); }
  };
  // میان‌برها روی کل صفحه کار می‌کنند، حتی پیش از اینکه کاربر روی کارت کلیک کند
  const keyRef = useRef(onKey);
  keyRef.current = onKey;
  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => { if (!finishedRef.current) keyRef.current(e); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const finishedRef = useRef(false);
  finishedRef.current = finished;

  if (!app.ready || seed === null) return <div className="flex flex-col gap-3" aria-busy="true"><Skel h={40} /><Skel h={330} r={26} /><Skel h={56} r={16} /></div>;
  if (pool.length === 0) {
    return <EmptyCard mood="happy" title={scope === "queue" ? "صف خالی است" : "هنوز واژه‌ای برای تمرین نیست"} action={<Link className="btn btn-primary" href="/search"><Icon n="search" size={18} /> افزودن واژه</Link>}>مطالعهٔ آزاد با هر واژه‌ای که به فهرستت اضافه کنی کار می‌کند.</EmptyCard>;
  }
  const exit = () => router.push("/");

  if (finished) {
    const count = (r: FreeRating) => ratings.filter((x) => x === r).length;
    const forgot = order.filter((_, k) => ratings[k] === "forgot").map(byId).filter((x): x is WordRecord => !!x);
    const total = ratings.length;
    const rounds = Math.ceil(pool.length / Math.min(ROUND_SIZE, pool.length));
    return (
      <div className="study" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
        <div className="cards-2 in-fwd" style={{ alignItems: "start" }}>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="flex items-end" style={{ height: 120 }} aria-hidden="true">
              <Sprout mood="happy" size={110} className="breathe" />
              {[0, 1, 2].map((k) => (
                <svg key={k} width="30" height="46" viewBox="0 0 30 46" className="bloom" style={{ ...stg(k + 1), marginInlineStart: -6 }}>
                  <path d="M15 46V20" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="15" cy="14" r="8" fill={k === 1 ? "var(--accent)" : "var(--warm)"} />
                  <circle cx="15" cy="14" r="3" fill="var(--surface)" />
                </svg>
              ))}
            </div>
            <h2 className="h1" role="status">این دور تمام شد؛ {fa(total)} کارت دیدی</h2>
            <p className="muted">همین‌که آمدی و ورق زدی، ارزش داشت.</p>
            <div className="banner banner-accent" style={{ textAlign: "right" }}><Icon n="info" size={18} /><p className="small">این پایان یک <b>دور مطالعهٔ آزاد</b> بود، نه تکمیل دسته: موعد مرور، مرحله‌ها و پیشرفت رسمی هیچ‌کدام تغییر نکرد.</p></div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              <button type="button" className="btn btn-primary" onClick={() => setRound((r) => r + 1)}><Icon n="shuffle" size={18} /> یک دور دیگر (سقفی نیست)</button>
              <Link className="btn btn-ghost" href="/">بازگشت به مرور</Link>
            </div>
          </div>
          <div className="card flex flex-col gap-3">
            <b>این دور چطور گذشت</b>
            {RATINGS.map((r, k) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="flex items-center gap-2" style={{ width: 130 }}><Icon n={r.icon} size={18} />{r.label}</span>
                <div style={{ flex: 1, height: 12, background: "var(--surface2)", borderRadius: 99, overflow: "hidden" }}>
                  <div className="fillbar" style={{ height: "100%", width: `${(count(r.id) / Math.max(1, total)) * 100}%`, background: r.id === "forgot" ? "var(--warm)" : "var(--accent)", borderRadius: 99, animationDelay: `${k * 120}ms` }} />
                </div>
                <b style={{ width: 28, textAlign: "left" }}>{fa(count(r.id))}</b>
              </div>
            ))}
            {forgot.length > 0 && (
              <div>
                <p className="small muted" style={{ fontWeight: 700 }}>برای دیدن دوباره</p>
                <div className="flex flex-wrap gap-2 mt-1">{forgot.map((x) => <Link key={x.id} href={`/word/${encodeURIComponent(x.id)}`} className="chip chip-warm chip-btn"><En sans>{x.en}</En></Link>)}</div>
              </div>
            )}
            <p className="small muted">دور {fa(round + 1)} · هر {faN(rounds)} دور همهٔ {faN(pool.length)} واژه را یک بار می‌گردد. طول دور فقط برای تکه‌کردن است، نه سقف روزانه.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!w) return <Skel h={330} r={26} />;
  const revealed = phase === "a" || phase === "coach" || phase === "compare" || phase === "advancing";
  const pct = ((i + (phase === "advancing" || phase === "coach" || phase === "compare" ? 1 : 0)) / order.length) * 100;
  const msg = COACH[(i + ratings.length) % COACH.length];
  const scopeLabel = wordId ? "همین واژه" : scope === "queue" ? "واژه‌های صف" : scope === "batch" ? "دستهٔ فعال" : `همهٔ ${faN(pool.length)} واژه`;

  return (
    <div ref={root} tabIndex={-1} className="study" aria-label="مطالعهٔ آزاد">
      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-ghost icon-btn" aria-label="خروج از مطالعه" onClick={exit}><Icon n="x" /></button>
        <div style={{ flex: 1 }}>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={order.length} aria-valuenow={i} aria-label="پیشرفت دور" style={{ height: 10, borderRadius: 99, background: "var(--surface2)", overflow: "hidden", border: "1px solid var(--line)" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 99, transition: "width .5s cubic-bezier(.3,.9,.3,1.1)" }} />
          </div>
          <p className="small muted mt-1">کارت {fa(i + 1)} از {fa(order.length)} · {scopeLabel}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="chip chip-accent"><Icon n="leaf" size={14} /> مطالعهٔ آزاد</span>
        <span className="chip" style={{ whiteSpace: "normal" }}>موعد مرور و پیشرفت رسمی تغییر نمی‌کند</span>
      </div>

      <div className="study-stage">
        <div className="card-zone">
          <div className="flip">
            <div className={`flip-in ${revealed ? "on" : ""}`} key={i}>
              <div className="face rise" aria-hidden={revealed} {...(revealed ? { inert: true } : {})}>
                {w.pos ? <span className="chip" style={{ alignSelf: "flex-start" }}>{w.pos}</span> : <span />}
                <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ flex: 1 }}>
                  <En as="h2" className="word-title" style={{ textAlign: "center", fontSize: "clamp(36px, 9vw, 60px)" }}>{w.en}</En>
                  <div className="flex items-center gap-2"><Ipa>{w.ipa}</Ipa>
                    <button type="button" className="btn btn-soft icon-btn" onClick={() => { if (!speak(w.en)) app.notify("این مرورگر تلفظ صوتی ندارد.", "warn"); }} aria-label="پخش تلفظ با صدای مرورگر"><Icon n="volume" /></button></div>
                </div>
                <p className="small muted text-center">{phase === "recall" ? "معنی پنهان است؛ از حافظه بنویس." : "اول خودت معنی‌اش را به یاد بیاور"}</p>
              </div>
              <div className="face back" aria-hidden={!revealed} {...(!revealed ? { inert: true } : {})}>
                <div className="flex justify-between items-start gap-2">{w.pos ? <span className="chip">{w.pos}</span> : <span />}<En style={{ fontSize: 20, fontWeight: 600 }}>{w.en}</En></div>
                <div className="scroll flex flex-col gap-3" style={{ flex: 1, justifyContent: "center", marginTop: 8 }}>
                  <p style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.5 }}>{w.fa}</p>
                  {w.exampleEn && (
                    <div style={{ borderInlineStart: "4px solid var(--accent)", paddingInlineStart: 12 }}>
                      <En as="p" style={{ fontSize: 18, lineHeight: 1.6 }}><Marked text={w.exampleEn} word={w.en} /></En>
                      {w.exampleFa && <p className="small muted">{w.exampleFa}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {burst > 0 && <Burst k={burst} />}
        </div>
        <aside className="card study-shortcuts flex-col gap-2" aria-label="میان‌برها">
          <b>میان‌برها</b>
          <p className="small muted"><kbd>Space</kbd> نمایش پاسخ</p>
          <p className="small muted"><kbd>۱</kbd>–<kbd>۴</kbd> امتیاز</p>
          <p className="small muted">امتیازهای مطالعهٔ آزاد زمان مرور بعدی را تغییر نمی‌دهند؛ برای FSRS از مرور زمان‌بندی‌شده استفاده کن.</p>
        </aside>
      </div>

      <div className="rate-zone">
        {phase === "coach" ? (
          <div className="card flex flex-col gap-3 pop" role="status" style={{ padding: 14 }}>
            <div className="flex items-center gap-3">
              <Sprout mood="oops" size={64} className="shrink-0" />
              <p style={{ flex: 1 }}>{msg}</p>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <DemoChip>متن ثابت؛ مربی هوش مصنوعی هنوز وصل نیست</DemoChip>
              <span className="flex gap-2 flex-wrap">
                <button type="button" className="btn btn-ghost" onClick={() => { setPhase("recall"); setRecall(""); }}><Icon n="pencil" size={18} /> دوباره از حافظه</button>
                <button type="button" className="btn btn-primary" onClick={next}>ادامه <Icon n="left" size={18} /></button>
              </span>
            </div>
          </div>
        ) : phase === "recall" ? (
          <form className="card flex flex-col gap-2 pop" onSubmit={(e) => { e.preventDefault(); setPhase("compare"); }}>
            <label htmlFor="recall" style={{ fontWeight: 700 }}>آنچه از معنی یادت می‌آید (اختیاری)</label>
            <textarea id="recall" className="input" value={recall} onChange={(e) => setRecall(e.target.value)} autoFocus placeholder="مثلاً: …" />
            <div className="flex gap-2 flex-wrap justify-between">
              <button type="button" className="btn btn-ghost" onClick={next}>رد شدن</button>
              <button type="submit" className="btn btn-primary">مقایسه با پاسخ</button>
            </div>
          </form>
        ) : phase === "compare" ? (
          <div className="card flex flex-col gap-3 pop" role="status">
            <div className="cards-2" style={{ gap: 12 }}>
              <div><p className="small muted" style={{ fontWeight: 700 }}>نوشتهٔ تو</p><p>{recall.trim() || "چیزی ننوشتی — اشکالی ندارد."}</p></div>
              <div><p className="small muted" style={{ fontWeight: 700 }}>پاسخ مرجع</p><p>{w.fa}</p></div>
            </div>
            <p className="small muted">ارزیابی خودکار در کار نیست؛ خودت مقایسه کن. امتیاز این کارت عوض نمی‌شود.</p>
            <button type="button" className="btn btn-primary" style={{ alignSelf: "flex-end" }} onClick={next}>ادامه <Icon n="left" size={18} /></button>
          </div>
        ) : phase === "q" ? (
          <button type="button" className="btn btn-primary w-full" style={{ minHeight: 56 }} onClick={() => setPhase("a")}><Icon n="flip" /> نمایش پاسخ</button>
        ) : (
          <div className="rating-grid rise" role="group" aria-label="امتیاز به خودت">
            {RATINGS.map((r) => (
              <button type="button" key={r.id} className={`btn ${r.id === "good" ? "btn-primary" : r.id === "forgot" ? "btn-warm" : "btn-ghost"}`} style={{ minHeight: 56, flexDirection: "column", gap: 0, lineHeight: 1.4 }} disabled={phase === "advancing"} onClick={() => rate(r.id)}>
                <span className="flex items-center gap-2"><Icon n={r.icon} size={18} />{r.label}</span>
                <span className="small" style={{ opacity: 0.85, fontWeight: 500 }}>کلید {fa(r.key)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense><Study /></Suspense>;
}
