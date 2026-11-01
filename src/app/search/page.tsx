"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useApp } from "@/components/Providers";
import { CATALOG, searchWords, type WordDraft } from "@/lib/vocabulary";

export default function SearchPage() {
  const { words, addToQueue, addManualWord, ready } = useApp();
  const [query, setQuery] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [manualEn, setManualEn] = useState("");
  const [manualFa, setManualFa] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const pool = [
      ...CATALOG.map((item) => ({ ...item, status: "queued" as const, addedAt: "" })),
      ...words,
    ];
    return searchWords(pool, query).filter(
      (item, index, all) =>
        all.findIndex((candidate) => candidate.en.toLowerCase() === item.en.toLowerCase()) === index,
    );
  }, [query, words]);

  if (!ready) return <p className="loading-state" role="status">جست‌وجو در حال آماده‌شدن است…</p>;

  function addResult(candidate: WordDraft) {
    const result = addToQueue(candidate);
    setMessage(result.added ? `«${candidate.en}» به صف اضافه شد.` : `«${candidate.en}» از قبل در مجموعه‌ات هست.`);
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const en = manualEn.trim();
    const fa = manualFa.trim();
    if (!/^[a-zA-Z][a-zA-Z' -]{0,79}$/.test(en)) {
      setFormError("واژه را با حروف انگلیسی بنویس؛ حداکثر ۸۰ نویسه.");
      return;
    }
    if (fa.length < 1 || fa.length > 240) {
      setFormError("معنی فارسی را وارد کن (حداکثر ۲۴۰ نویسه).");
      return;
    }
    const result = addManualWord({ en, fa });
    setFormError("");
    setMessage(result.added ? `«${en}» با معنی واردشده به صف اضافه شد.` : `«${en}» از قبل در مجموعه‌ات هست.`);
    setManualEn("");
    setManualFa("");
  }

  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">پیدا کن، بعد نگهش دار</p>
        <h1>جست‌وجوی واژه</h1>
        <p className="lead">در واژه‌های نمونه و مجموعهٔ شخصی‌ات بگرد یا یک واژه را با معنی خودت ثبت کن.</p>
      </div>
      <section className="card list-card">
        <label className="field-label" htmlFor="word-search">واژهٔ انگلیسی یا معنی فارسی</label>
        <input
          id="word-search"
          name="word-search"
          type="search"
          dir="auto"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="مثلاً resilient یا تاب‌آور…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setMessage("");
          }}
        />
        <p className="field-hint">جست‌وجوی این نسخه روی داده‌های نمونه و واژه‌های خودت انجام می‌شود؛ به اینترنت وصل نیست.</p>
      </section>
      {message && <p className="inline-notice" role="status">{message}</p>}
      {query.trim() && (
        <section className="search-results" aria-live="polite" aria-label="نتیجه‌های جست‌وجو">
          {results.length ? (
            <>
              <p className="result-count">{new Intl.NumberFormat("fa-IR").format(results.length)} نتیجه</p>
              <ul className="word-list card list-card">
                {results.map((word) => {
                  const personal = words.find((item) => item.en.toLowerCase() === word.en.toLowerCase());
                  return (
                    <li key={word.id}>
                      <div className="word-row">
                        <Link className="word-copy word-link" href={`/word/${encodeURIComponent(word.id)}`}>
                          <b className="english" lang="en" dir="ltr" translate="no">{word.en}</b>
                          <span className="word-meaning">{word.fa}</span>
                        </Link>
                        {personal ? (
                          <span className={`word-status ${personal.status}`}>
                            {personal.status === "queued" ? "در صف" : personal.status === "completed" ? "تکمیل‌شده" : "دستهٔ فعال"}
                          </span>
                        ) : (
                          <button className="button small primary" type="button" onClick={() => addResult(word)}>
                            افزودن به صف
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="card empty-state">
              <h2>در واژه‌نامهٔ نمونه پیدا نشد</h2>
              <p>جست‌وجوی آنلاین هنوز وصل نیست. اگر معنی را می‌دانی، می‌توانی واژه را دستی به صف اضافه کنی.</p>
            </div>
          )}
        </section>
      )}
      <section className="manual-card">
        <button
          className="disclosure-button"
          type="button"
          aria-expanded={manualOpen}
          aria-controls="manual-word-form"
          onClick={() => setManualOpen((open) => !open)}
        >
          <span>{manualOpen ? "بستن افزودن دستی" : "افزودن واژه با معنی خودم"}</span>
          <span aria-hidden="true">{manualOpen ? "−" : "+"}</span>
        </button>
        {manualOpen && (
          <form id="manual-word-form" className="manual-form" onSubmit={handleManualSubmit} noValidate>
            <p className="field-hint">این روش از واژه‌نامهٔ بیرونی استفاده نمی‌کند؛ معنی و مثال را خودت وارد می‌کنی.</p>
            <label className="field-label" htmlFor="manual-en">واژهٔ انگلیسی</label>
            <input
              id="manual-en"
              name="manual-en"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              dir="ltr"
              maxLength={80}
              value={manualEn}
              onChange={(event) => setManualEn(event.target.value)}
            />
            <label className="field-label" htmlFor="manual-fa">معنی فارسی</label>
            <input
              id="manual-fa"
              name="manual-fa"
              autoComplete="off"
              maxLength={240}
              value={manualFa}
              onChange={(event) => setManualFa(event.target.value)}
            />
            {formError && <p className="field-error" role="alert">{formError}</p>}
            <button className="button primary" type="submit">افزودن به صف</button>
          </form>
        )}
      </section>
    </>
  );
}