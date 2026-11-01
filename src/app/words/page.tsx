"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/components/Providers";
import { searchWords } from "@/lib/vocabulary";

function StatusLabel({ status }: { status: string }) {
  const label = status === "queued" ? "در صف" : status === "completed" ? "تکمیل‌شده" : "دستهٔ فعال";
  return <span className={`word-status ${status}`}>{label}</span>;
}

export default function WordsPage() {
  const { words, ready } = useApp();
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => (query.trim() ? searchWords(words, query) : words),
    [query, words],
  );

  if (!ready) return <p className="loading-state" role="status">فهرست واژه‌ها در حال آماده‌شدن است…</p>;

  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">کتابچهٔ شخصی تو</p>
        <h1>همهٔ واژه‌های من</h1>
        <p className="lead">{new Intl.NumberFormat("fa-IR").format(words.length)} واژه · هیچ حالتی از فهرست حذف نمی‌شود.</p>
      </div>
      <section className="card list-card">
        <label className="field-label" htmlFor="word-filter">جست‌وجو در واژه‌هایم</label>
        <input
          id="word-filter"
          name="word-filter"
          type="search"
          autoComplete="off"
          placeholder="مثلاً resilient یا معنی فارسی…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {filtered.length ? (
          <ul className="word-list">
            {filtered.map((word) => (
              <li key={word.id}>
                <Link className="word-row" href={`/word/${encodeURIComponent(word.id)}`}>
                  <span className="word-copy">
                    <b className="english" lang="en" dir="ltr" translate="no">{word.en}</b>
                    <span className="word-meaning">{word.fa}</span>
                  </span>
                  <StatusLabel status={word.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">واژه‌ای با این عبارت در فهرستت نیست.</p>
        )}
      </section>
      <Link className="button secondary" href="/study?scope=all">مطالعهٔ آزاد همهٔ واژه‌ها</Link>
    </>
  );
}