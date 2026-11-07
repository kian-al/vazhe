"use client";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApp, useIsDesktop } from "@/components/store";
import { En, Icon, Skel, Sprout, inputDir } from "@/components/ui";
import { PickHint, VList, WordDetail, WordRow } from "@/components/words";
import { dictionary } from "@/lib/dictionaryProvider";
import { DICTIONARY, slugify, type DictionaryEntry } from "@/lib/dictionary";
import { statusKey, type SearchOutcome } from "@/lib/vocabulary";

type Phase = "start" | "loading" | "error" | "done";
const STARTERS = ["curious", "serendipity", "lantern", "persuade", "glimpse"];

function ManualAdd({ initial }: { initial: string }) {
  const app = useApp();
  const [en, setEn] = useState(/[a-z]/i.test(initial) ? initial : "");
  const [faText, setFa] = useState("");
  const [errs, setErrs] = useState<{ en?: string; fa?: string }>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errs = {};
    if (!/^[a-z][a-z '\-]{0,40}$/i.test(en.trim())) next.en = "یک واژه یا عبارت کوتاه انگلیسی بنویس (فقط حروف لاتین).";
    if (faText.trim().length < 2) next.fa = "معنی فارسی را بنویس تا کارت قابل‌مرور باشد.";
    setErrs(next);
    if (next.en || next.fa) return;
    const entry: DictionaryEntry = { id: slugify(en), en: en.trim(), fa: faText.trim(), ipa: "", pos: "", exampleEn: "", exampleFa: "" };
    if (app.add(entry, "manual")) { setEn(""); setFa(""); }
  };
  return (
    <form className="card flex flex-col gap-3" onSubmit={submit} noValidate aria-labelledby="manual-h">
      <h3 id="manual-h" className="h3">افزودن دستی</h3>
      <p className="small muted">اگر واژه در واژه‌نامه نیست، خودت اضافه‌اش کن. تکراری‌ها خودکار رد می‌شوند.</p>
      <div>
        <label htmlFor="m-en" className="small" style={{ fontWeight: 700 }}>واژهٔ انگلیسی</label>
        <input id="m-en" dir="ltr" lang="en" className="input no-icon mt-1" value={en} autoComplete="off" spellCheck={false} onChange={(e) => setEn(e.target.value)} aria-invalid={!!errs.en} aria-describedby={errs.en ? "m-en-err" : undefined} />
        {errs.en && <p id="m-en-err" className="field-error">{errs.en}</p>}
      </div>
      <div>
        <label htmlFor="m-fa" className="small" style={{ fontWeight: 700 }}>معنی فارسی</label>
        <input id="m-fa" dir="rtl" className="input no-icon mt-1" value={faText} autoComplete="off" onChange={(e) => setFa(e.target.value)} aria-invalid={!!errs.fa} aria-describedby={errs.fa ? "m-fa-err" : undefined} />
        {errs.fa && <p id="m-fa-err" className="field-error">{errs.fa}</p>}
      </div>
      <button type="submit" className="btn btn-primary"><Icon n="plus" /> افزودن به صف</button>
    </form>
  );
}

function Search() {
  const app = useApp();
  const desk = useIsDesktop();
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [phase, setPhase] = useState<Phase>(q.trim() ? "loading" : "start");
  const [out, setOut] = useState<SearchOutcome>({ results: [] });
  const [attempt, setAttempt] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selId = sp.get("w");

  useEffect(() => {
    const t = q.trim();
    // Keep reload/back links truthful, including clearing a previous query.
    // A selected result is preserved when the query itself did not change.
    const params = new URLSearchParams(sp.toString());
    if ((params.get("q") ?? "") !== t) {
      if (t) params.set("q", t); else params.delete("q");
      params.delete("w");
      const suffix = params.toString();
      router.replace(suffix ? `${path}?${suffix}` : path, { scroll: false });
    }
    if (!t) { setPhase("start"); setOut({ results: [] }); return; }
    setPhase("loading");
    const ctl = new AbortController();
    const timer = setTimeout(() => {
      dictionary.search(t, ctl.signal)
        .then((r) => { if (!ctl.signal.aborted) { setOut(r); setPhase("done"); } })
        .catch(() => { if (!ctl.signal.aborted) setPhase("error"); });
    }, 180);
    return () => { clearTimeout(timer); ctl.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, attempt]);

  const sel = useMemo(() => {
    if (!selId) return undefined;
    return out.results.find((r) => r.id === selId) ?? DICTIONARY.find((d) => d.id === selId);
  }, [selId, out.results]);

  const setQuery = (v: string) => { setQ(v); inputRef.current?.focus(); };
  const rowHref = (id: string) => {
    if (!desk) return `/word/${encodeURIComponent(id)}`;
    const params = new URLSearchParams({ q: q.trim(), w: id });
    return `/search?${params.toString()}`;
  };
  const results = out.results;
  const spell = phase === "done" && out.suggestion && results.length > 0;
  const none = phase === "done" && results.length === 0;

  const body = (
    <div className="pane flex flex-col gap-3" style={{ flex: 1, minHeight: 0 }}>
      <h2 className="h1">پیدا کردن واژهٔ تازه</h2>
      <form role="search" onSubmit={(e) => { e.preventDefault(); app.pushRecent(q); }}>
        <label htmlFor="sq" className="small muted" style={{ fontWeight: 700 }}>واژهٔ انگلیسی یا معنی فارسی</label>
        <div className="input-wrap mt-1">
          <Icon n="search" size={20} />
          <input ref={inputRef} id="sq" type="search" dir={inputDir(q)} className="input" value={q} autoComplete="off" spellCheck={false} autoFocus={desk}
            placeholder="مثلاً curious یا recieve" onChange={(e) => setQ(e.target.value)} onBlur={() => app.pushRecent(q)} />
        </div>
      </form>

      {phase === "start" && (
        <div className="flex flex-col gap-3 rise">
          <div className="card flex items-center gap-3">
            <Sprout size={64} className="breathe shrink-0" />
            <p className="small muted">یک واژه بنویس تا معنی، تلفظ و مثالش را ببینی. بعد با یک ضربه وارد صف می‌شود.</p>
          </div>
          {app.recent.length > 0 && (
            <>
              <p className="small muted" style={{ fontWeight: 700 }}>جست‌وجوهای اخیر</p>
              <div className="flex flex-wrap gap-2">
                {app.recent.map((x) => <button type="button" key={x} className="chip chip-btn" onClick={() => setQuery(x)}><span dir="auto">{x}</span></button>)}
              </div>
            </>
          )}
          <p className="small muted" style={{ fontWeight: 700 }}>برای شروع</p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((x) => <button type="button" key={x} className="chip chip-btn" onClick={() => setQuery(x)}><En sans>{x}</En></button>)}
          </div>
        </div>
      )}
      {phase === "loading" && (
        <div className="flex flex-col gap-3" aria-busy="true"><p className="small muted" role="status">در حال جست‌وجو…</p>{[0, 1, 2].map((i) => <Skel key={i} h={64} r={16} />)}</div>
      )}
      {phase === "error" && (
        <div className="banner banner-danger" role="alert">
          <Icon n="alert" />
          <div className="flex flex-col gap-2"><p className="small"><b>جست‌وجو انجام نشد.</b> اتصال به واژه‌نامه برقرار نشد؛ چیزی از فهرست تو کم نشده است.</p>
            <button type="button" className="btn btn-ghost" onClick={() => setAttempt((a) => a + 1)}><Icon n="refresh" size={18} /> تلاش دوباره</button></div>
        </div>
      )}
      {spell && (
        <div className="banner banner-accent rise" role="status">
          <Icon n="spark" />
          <p className="small">«<En sans>{q.trim()}</En>» پیدا نشد. منظورت <button type="button" className="btn btn-soft" style={{ minHeight: 44, padding: "0 12px" }} onClick={() => setQuery(out.suggestion!)}><En sans>{out.suggestion}</En></button> بود؟ نزدیک‌ترین نتیجه‌ها پایین آمده‌اند.</p>
        </div>
      )}
      {none && (
        <div className="flex flex-col gap-3 scroll" style={{ minHeight: 0 }}>
          <div className="card text-center flex flex-col items-center gap-2 rise" style={{ padding: 24 }}>
            <Sprout mood="sleep" size={80} />
            <b>برای «<span dir="auto">{q.trim()}</span>» چیزی پیدا نشد</b>
            <p className="small muted">املای واژه را بررسی کن یا معنی فارسی‌اش را بنویس. از کتابخانه هم می‌توانی واژه بیاوری.</p>
            <Link className="btn btn-soft" href="/library"><Icon n="book" size={18} /> رفتن به کتابخانه</Link>
          </div>
          <ManualAdd initial={q.trim()} />
        </div>
      )}
      {phase === "done" && results.length > 0 && (
        <VList items={results} rowH={88} label="نتیجه‌های جست‌وجو" keyOf={(e) => e.id} render={(e) => {
          const rec = app.byEn(e.en);
          return <WordRow item={e} status={statusKey(rec)} stage={rec?.stage} href={rowHref(e.id)} replace={desk} selected={desk && selId === e.id} onQuickAdd={() => app.add(e)} />;
        }} />
      )}
    </div>
  );
  if (!desk) return <div className="page-fill">{body}</div>;
  return (
    <div className="split">
      {body}
      <aside className="scroll" aria-label="جزئیات واژه">
        {sel ? <WordDetail entry={sel} /> : <PickHint text="یک نتیجه را انتخاب کن تا جزئیاتش اینجا باز شود." />}
      </aside>
    </div>
  );
}

export default function Page() {
  return <Suspense><Search /></Suspense>;
}
