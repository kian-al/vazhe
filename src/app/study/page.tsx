"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/components/Providers";
import {
  applyFreePracticeRating,
  CATALOG,
  getPersonalWords,
  type FreeRating,
  type WordRecord,
} from "@/lib/vocabulary";

const RATINGS: { value: FreeRating; label: string }[] = [
  { value: "forgot", label: "فراموش کردم" },
  { value: "hard", label: "سخت بود" },
  { value: "remembered", label: "یادم بود" },
  { value: "easy", label: "آسان بود" },
];

function StudyContent() {
  const params = useSearchParams();
  const scope = params.get("scope") ?? "all";
  const selectedId = params.get("id");
  const { words, ready } = useApp();
  const studyWords = useMemo(() => {
    if (scope === "queue") return words.filter((word) => word.status === "queued");
    if (scope === "one") {
      const personal = words.find(
        (word) => word.id === selectedId || word.en.toLowerCase() === selectedId?.toLowerCase(),
      );
      if (personal) return [personal];
      const catalogWord = CATALOG.find(
        (word) => word.id === selectedId || word.en.toLowerCase() === selectedId?.toLowerCase(),
      );
      return catalogWord
        ? [{ ...catalogWord, status: "queued", addedAt: "" } as WordRecord]
        : [];
    }
    return getPersonalWords(words);
  }, [scope, selectedId, words]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [forgotten, setForgotten] = useState(false);
  const [counts, setCounts] = useState<Record<FreeRating, number>>({
    forgot: 0, hard: 0, remembered: 0, easy: 0,
  });

  if (!ready) return <p className="loading-state" role="status">جلسهٔ مطالعه در حال آماده‌شدن است…</p>;
  if (studyWords.length === 0) {
    return (
      <section className="card empty-state">
        <h1>{scope === "queue" ? "صف خالی است" : "واژه‌ای برای مطالعه نیست"}</h1>
        <p>از جست‌وجو واژه‌ای به مجموعه‌ات اضافه کن، یا به فهرست واژه‌ها برگرد.</p>
        <div className="button-row">
          <Link className="button primary" href="/search">رفتن به جست‌وجو</Link>
          <Link className="button secondary" href="/words">فهرست واژه‌ها</Link>
        </div>
      </section>
    );
  }

  if (index >= studyWords.length) {
    return (
      <section className="card completion-card">
        <span className="completion-flower" aria-hidden="true">✿</span>
        <p className="eyebrow">یک دور دیگر مرور شد</p>
        <h1>خسته نباشی!</h1>
        <p>{new Intl.NumberFormat("fa-IR").format(studyWords.length)} واژه را دیدی.</p>
        <p className="muted">این جلسه آزاد بود؛ برنامهٔ مرور و مرحلهٔ یادگیری تغییر نکرد.</p>
        <div className="rating-summary">
          {RATINGS.map((rating) => (
            <span key={rating.value}>
              {rating.label}: {new Intl.NumberFormat("fa-IR").format(counts[rating.value])}
            </span>
          ))}
        </div>
        <div className="button-row">
          <Link className="button primary" href="/study?scope=all">مرور دوباره</Link>
          <Link className="button secondary" href="/words">بازگشت به فهرست</Link>
        </div>
      </section>
    );
  }

  const word = studyWords[index];
  function next() {
    setIndex((value) => value + 1);
    setRevealed(false);
    setForgotten(false);
  }
  function rate(rating: FreeRating) {
    applyFreePracticeRating(word, rating);
    setCounts((previous) => ({ ...previous, [rating]: previous[rating] + 1 }));
    if (rating === "forgot") setForgotten(true);
    else next();
  }

  return (
    <div className="study-view">
      <div className="study-topline">
        <Link className="button quiet-button" href={scope === "queue" ? "/queue" : "/words"}>← خروج از مطالعه</Link>
        <span className="muted">
          {new Intl.NumberFormat("fa-IR").format(index + 1)} از {new Intl.NumberFormat("fa-IR").format(studyWords.length)}
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={studyWords.length}
        aria-valuenow={index}
        aria-label="جایگاه در مجموعه"
      >
        <span style={{ width: `${(index / studyWords.length) * 100}%` }} />
      </div>
      <p className="session-mode">مطالعهٔ آزاد · بدون تغییر در زمان‌بندی مرور</p>

      <section className="card study-card" aria-live="polite">
        <div className="study-word-line">
          <h1 className="english detail-word" lang="en" dir="ltr" translate="no">{word.en}</h1>
          <span className="ipa" lang="en" dir="ltr">{word.ipa || "تلفظ وارد نشده"}</span>
        </div>
        {!revealed && !forgotten && (
          <p className="study-prompt">معنی را در ذهنت بگو؛ بعد پاسخ را ببین.</p>
        )}
        {revealed && !forgotten && (
          <div className="answer-panel">
            <h2>{word.fa}</h2>
            {word.exampleEn && <p className="english example-en" lang="en" dir="ltr">{word.exampleEn}</p>}
            {word.exampleFa && <p className="muted">{word.exampleFa}</p>}
          </div>
        )}
        {forgotten && (
          <div className="coach-placeholder" role="status">
            <span className="coach-icon" aria-hidden="true">✳</span>
            <div>
              <h2>اشکالی نداره؛ بعضی واژه‌ها به چند دیدار نیاز دارن.</h2>
              <p>
                راهنمای حافظهٔ هوش مصنوعی هنوز متصل نیست؛ به‌جای ساختن پیشنهادِ غیرواقعی،
                پاسخ مرجع را همین‌جا می‌بینی.
              </p>
              <p className="coach-answer">{word.fa}</p>
            </div>
          </div>
        )}
      </section>

      {forgotten ? (
        <button className="button primary block-button" type="button" onClick={next}>ادامه به واژهٔ بعدی</button>
      ) : revealed ? (
        <div className="rating-area">
          <p className="muted">چقدر یادت بود؟</p>
          <div className="rating-grid">
            {RATINGS.map((rating) => (
              <button
                className={`button rating-button${rating.value === "forgot" ? " warm" : ""}`}
                key={rating.value}
                type="button"
                onClick={() => rate(rating.value)}
              >
                {rating.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button className="button primary block-button" type="button" onClick={() => setRevealed(true)}>
          نمایش معنی و مثال
        </button>
      )}
      <p className="study-footnote">امتیازهای این صفحه فقط برای پایان جلسه شمرده می‌شوند؛ در برنامهٔ مرور ثبت نمی‌شوند.</p>
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={<p className="loading-state" role="status">جلسهٔ مطالعه در حال آماده‌شدن است…</p>}>
      <StudyContent />
    </Suspense>
  );
}