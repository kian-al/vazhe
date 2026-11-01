"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/components/Providers";
import { searchWords } from "@/lib/vocabulary";

export default function QueuePage() {
  const { words, ready } = useApp();
  const [query, setQuery] = useState("");
  const queued = useMemo(() => words.filter((word) => word.status === "queued"), [words]);
  const filtered = useMemo(
    () => (query.trim() ? searchWords(queued, query) : queued),
    [query, queued],
  );

  if (!ready) return <p className="loading-state" role="status">صف در حال آماده‌شدن است…</p>;

  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">واژه‌های بعدی</p>
        <h1>صف یادگیری</h1>
        <p className="lead">{new Intl.NumberFormat("fa-IR").format(queued.length)} واژه در صف منتظرند.</p>
      </div>
      <section className="card list-card">
        {queued.length ? (
          <>
            <label className="field-label" htmlFor="queue-filter">جست‌وجو در صف</label>
            <input
              id="queue-filter"
              name="queue-filter"
              type="search"
              autoComplete="off"
              placeholder="نام واژه یا معنی…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="queue-actions">
              <Link className="button primary" href="/study?scope=queue">مطالعهٔ آزاد واژه‌های صف</Link>
              <Link className="text-link" href="/search">پیداکردن واژهٔ تازه</Link>
            </div>
            {filtered.length ? (
              <ul className="word-list">
                {filtered.map((word) => (
                  <li key={word.id}>
                    <Link className="word-row" href={`/word/${encodeURIComponent(word.id)}`}>
                      <span className="word-copy">
                        <b className="english" lang="en" dir="ltr" translate="no">{word.en}</b>
                        <span className="word-meaning">{word.fa}</span>
                      </span>
                      <span className="word-status queued">در صف</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">با این عبارت چیزی در صف پیدا نشد.</p>
            )}
          </>
        ) : (
          <div className="empty-state">
            <span className="empty-illustration" aria-hidden="true">✿</span>
            <h2>صف فعلاً خالی است</h2>
            <p>واژه‌ای که از جست‌وجو پیدا کنی یا دستی اضافه کنی، اینجا می‌ماند.</p>
            <Link className="button primary" href="/search">رفتن به جست‌وجو</Link>
          </div>
        )}
      </section>
      <p className="local-banner">
        واژه‌های صف در مطالعهٔ آزاد هم در دسترس‌اند. شروع دستهٔ بعدی تا تصمیم‌گیری دربارهٔ
        قواعد ۵ مرحله‌ای غیرفعال می‌ماند.
      </p>
    </>
  );
}