"use client";
import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/components/store";
import { Burst, En, Icon, Ipa, Pips, Skel, Sprout, StatusChip, speak, inputDir } from "@/components/ui";
import { dictionary } from "@/lib/dictionaryProvider";
import { faN, type DictionaryEntry } from "@/lib/dictionary";
import { statusKey } from "@/lib/vocabulary";

const PAGE_TEXT = "The weary traveller lifted her lantern and peeped into the burrow. She was curious, yet she did not hesitate. A reply would definitely occur to her, and soon she would receive it.";
const PICKABLE = new Set(["weary", "lantern", "peeped", "burrow", "curious", "hesitate", "definitely", "occur", "receive"]);
const LEMMA: Record<string, string> = { peeped: "peep" };

type Look = { phase: "idle" } | { phase: "loading"; word: string } | { phase: "error"; word: string } | { phase: "missing"; word: string } | { phase: "found"; entry: DictionaryEntry };

function ReadingPage({ picked, onPick }: { picked: string | null; onPick: (w: string) => void }) {
  const tokens = PAGE_TEXT.split(/(\b[A-Za-z]+\b)/);
  return (
    <section className="ext-page card flex-col" style={{ width: 460, padding: 0, overflow: "hidden" }} aria-label="صفحهٔ نمونه برای انتخاب واژه">
      <div className="flex items-center gap-2" style={{ padding: "10px 14px", background: "var(--surface2)", borderBottom: "1px solid var(--line)" }}>
        <span className="small grow text-center"><En sans>example-reading-page.test</En></span>
        <span className="chip chip-demo">صفحهٔ شبیه‌سازی‌شده</span>
      </div>
      <div style={{ padding: 24 }}>
        <En as="h2" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.2, textAlign: "left" }}>A Walk Before Dawn</En>
        <p className="small muted mt-1">یک واژهٔ هایلایت‌شده را بزن؛ مثل انتخاب متن در صفحهٔ واقعی، افزونه آن را باز می‌کند.</p>
        <En as="p" style={{ fontSize: 22, lineHeight: 2, marginTop: 16, display: "block", textAlign: "left" }}>
          {tokens.map((t, i) => {
            const k = t.toLowerCase();
            return PICKABLE.has(k) ? (
              <button type="button" key={i} className="hl-word" aria-pressed={picked === (LEMMA[k] ?? k)} onClick={() => onPick(LEMMA[k] ?? k)} aria-label={`جست‌وجوی ${t}`}>{t}</button>
            ) : <span key={i}>{t}</span>;
          })}
        </En>
      </div>
    </section>
  );
}

function Popup({ word, onWord }: { word: string | null; onWord: (w: string | null) => void }) {
  const app = useApp();
  const [q, setQ] = useState("");
  const [look, setLook] = useState<Look>({ phase: "idle" });
  const [n, setN] = useState(0);
  const [bk, setBk] = useState(0);

  useEffect(() => {
    if (!word) { setLook({ phase: "idle" }); return; }
    let live = true;
    setLook({ phase: "loading", word });
    dictionary.lookup(word)
      .then(async (e) => {
        if (!live) return;
        if (e) { setLook({ phase: "found", entry: e }); return; }
        const s = await dictionary.search(word);
        if (!live) return;
        setLook(s.results[0] && s.suggestion ? { phase: "found", entry: s.results[0] } : { phase: "missing", word });
      })
      .catch(() => { if (live) setLook({ phase: "error", word }); });
    return () => { live = false; };
  }, [word, n]);

  const submit = (e: FormEvent) => { e.preventDefault(); const t = q.trim(); if (t) onWord(t.toLowerCase()); };
  const entry = look.phase === "found" ? look.entry : null;
  const rec = entry ? app.byEn(entry.en) : undefined;
  const s = statusKey(rec);

  return (
    <section className="card flex flex-col" style={{ width: "100%", maxWidth: 400, height: 600, padding: 0, overflow: "hidden", position: "relative", borderColor: "var(--edge)", boxShadow: "0 24px 50px -20px rgba(0,0,0,.35)" }} aria-label="پنجرهٔ افزونهٔ واژه">
      <header className="flex items-center gap-2" style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
        <Sprout size={36} />
        <b style={{ fontSize: 18, flex: 1 }}>واژه <span className="small muted" style={{ fontWeight: 500 }}>· افزونه</span></b>
        <span className="chip chip-demo">پیش‌نمایش وب</span>
      </header>
      <form style={{ padding: "12px 14px 0" }} onSubmit={submit} role="search">
        <label htmlFor="ext-q" className="small muted" style={{ fontWeight: 700 }}>جست‌وجوی دستی</label>
        <div className="input-wrap mt-1">
          <Icon n="search" size={20} />
          <input id="ext-q" type="search" dir={inputDir(q)} className="input" value={q} placeholder="مثلاً lantern" autoComplete="off" spellCheck={false} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
        </div>
      </form>
      {!app.online && (
        <div className="banner banner-warm" role="status" style={{ margin: "10px 14px 0" }}><Icon n="wifioff" size={20} /><p className="small"><b>اتصال برقرار نیست.</b> در این پیش‌نمایش واژه‌نامه محلی است و کار می‌کند؛ افزونهٔ واقعی برای جست‌وجو به اتصال نیاز خواهد داشت.</p></div>
      )}
      <div className="scroll" style={{ flex: 1, padding: 14, minHeight: 0 }} aria-live="polite">
        {look.phase === "error" ? (
          <div className="card text-center flex flex-col items-center gap-2" role="alert" style={{ padding: 24 }}>
            <Sprout mood="oops" size={80} />
            <b>واژه بارگذاری نشد؛ مشکل از ما بود</b>
            <p className="small muted">چیزی از صف و فهرست تو کم نشده است.</p>
            <button type="button" className="btn btn-primary" onClick={() => setN((x) => x + 1)}><Icon n="refresh" size={18} /> تلاش دوباره</button>
          </div>
        ) : look.phase === "loading" || !app.ready ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="در حال بارگذاری"><Skel h={44} w="60%" /><Skel h={18} w="40%" /><Skel h={26} /><Skel h={80} r={16} /><Skel h={52} r={16} /></div>
        ) : look.phase === "missing" ? (
          <div className="flex flex-col items-center text-center gap-2" style={{ padding: "24px 8px" }}>
            <Sprout mood="sleep" size={80} />
            <b>«<span dir="auto">{look.word}</span>» در واژه‌نامهٔ نمونه نیست</b>
            <p className="small muted">در برنامهٔ کامل می‌توانی دستی اضافه‌اش کنی.</p>
            <Link className="btn btn-ghost" href={`/search?q=${encodeURIComponent(look.word)}`} target="_blank"><Icon n="ext" size={18} /> باز کردن در برنامهٔ کامل</Link>
          </div>
        ) : !entry ? (
          <div className="flex flex-col items-center text-center gap-2" style={{ padding: "28px 8px" }}>
            <Sprout size={96} className="breathe" />
            <b>واژه‌ای انتخاب نشده</b>
            <p className="small muted">در صفحه یک واژه را انتخاب کن یا بالا بنویس.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 in-fwd" key={entry.id}>
            <div className="flex items-start justify-between gap-2"><span className="chip">{entry.pos}</span><StatusChip s={s} /></div>
            <En as="h2" style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.15 }}>{entry.en}</En>
            <div className="flex items-center gap-2"><Ipa>{entry.ipa}</Ipa>
              <button type="button" className="btn btn-soft icon-btn" onClick={() => speak(entry.en)} aria-label="پخش تلفظ با صدای مرورگر"><Icon n="volume" /></button></div>
            <p style={{ fontSize: 20, fontWeight: 800 }}>{entry.fa}</p>
            <div className="card" style={{ padding: 12 }}><En as="p" style={{ fontSize: 16, lineHeight: 1.6 }}>{entry.exampleEn}</En><p className="small muted">{entry.exampleFa}</p></div>
            {s === "new" && <div style={{ position: "relative" }}><button type="button" className="btn btn-primary w-full" onClick={() => { if (app.add(entry)) setBk((x) => x + 1); }}><Icon n="plus" /> افزودن به صف</button>{bk > 0 && <Burst k={bk} />}</div>}
            {s === "queue" && <div className="banner banner-warm"><Icon n="layers" size={18} /><p className="small"><b>در صف است.</b> منتظر ورود به دستهٔ فعال.</p></div>}
            {s === "mine" && <div className="banner banner-accent"><Icon n="list" size={18} /><p className="small"><b>از قبل در فهرست توست.</b> افزودن دوباره لازم نیست.</p></div>}
            {s === "active" && <div className="banner banner-accent"><Icon n="leaf" size={18} /><p className="small"><b>در دستهٔ فعال است</b> <Pips stage={rec?.stage} /></p></div>}
            {s === "done" && <div className="banner banner-accent"><Icon n="check" size={18} /><p className="small"><b>مرحلهٔ ۵ را گذرانده.</b> نیازی به افزودن نیست.</p></div>}
            <Link className="btn btn-ghost" href={`/word/${encodeURIComponent(rec?.id ?? entry.id)}`} target="_blank"><Icon n="ext" size={18} /> باز کردن در برنامهٔ کامل</Link>
          </div>
        )}
      </div>
      <div className="toast-wrap" role="status" aria-live="polite" style={{ bottom: 52 }}>
        {app.toast && <div className="toast-box toast" key={app.toast.id}><Icon n={app.toast.kind === "warn" ? "alert" : "check"} size={20} /><span className="small" style={{ color: "inherit" }}>{app.toast.text}</span></div>}
      </div>
      <footer className="small muted" style={{ padding: "8px 14px", borderTop: "1px solid var(--line)" }}>
        {faN(app.words.length)} واژه در فهرست تو · ذخیره در همین مرورگر
      </footer>
    </section>
  );
}

function ExtensionPreview() {
  const sp = useSearchParams();
  const [word, setWord] = useState<string | null>(sp.get("word") ?? "receive");
  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh" }}>
      <header className="flex items-center gap-3 flex-wrap" style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
        <Link href="/" className="btn btn-ghost"><Icon n="right" size={18} /> بازگشت به برنامه</Link>
        <div className="grow">
          <h1 className="h3">پیش‌نمایش افزونهٔ مرورگر</h1>
          <p className="small muted">این یک نمای وب از افزونه است، نه افزونهٔ نصب‌شده. افزودن به صف واقعاً در فهرست همین مرورگر ذخیره می‌شود.</p>
        </div>
      </header>
      <main id="main" className="ext-stage">
        <ReadingPage picked={word} onPick={setWord} />
        <Popup word={word} onWord={setWord} />
      </main>
    </div>
  );
}

export default function Page() {
  return <Suspense><ExtensionPreview /></Suspense>;
}
