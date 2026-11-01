"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/components/Providers";
import { CATALOG, normalizeWord, type WordDraft } from "@/lib/vocabulary";

export default function WordDetailPage() {
  const params = useParams<{ wordId: string }>();
  const { words, addToQueue, ready } = useApp();
  const slug = decodeURIComponent(params.wordId ?? "");
  const word =
    words.find((item) => item.id === slug || normalizeWord(item.en) === normalizeWord(slug)) ??
    CATALOG.find((item) => item.id === slug || normalizeWord(item.en) === normalizeWord(slug));

  if (!ready) return <p className="loading-state" role="status">جزئیات واژه در حال آماده‌شدن است…</p>;
  if (!word) {
    return (
      <section className="card empty-state">
        <h1>این واژه پیدا نشد</h1>
        <p>ممکن است از فهرست محلی پاک شده باشد یا در نمونهٔ واژه‌نامه نباشد.</p>
        <Link className="button secondary" href="/search">بازگشت به جست‌وجو</Link>
      </section>
    );
  }

  const personal = words.find((item) => normalizeWord(item.en) === normalizeWord(word.en));
  const draft: WordDraft = {
    id: word.id,
    en: word.en,
    fa: word.fa,
    ipa: word.ipa,
    pos: word.pos,
    exampleEn: word.exampleEn,
    exampleFa: word.exampleFa,
    source: word.source,
  };

  return (
    <>
      <p className="eyebrow"><Link className="text-link" href="/search">جست‌وجو</Link> / جزئیات واژه</p>
      <section className="card detail-card">
        <div className="detail-heading">
          <div>
            <h1 className="english detail-word" lang="en" dir="ltr" translate="no">{word.en}</h1>
            {word.ipa && <p className="ipa" lang="en" dir="ltr">{word.ipa} · {word.pos}</p>}
          </div>
          <span className="detail-sprout" aria-hidden="true">✳</span>
        </div>
        <h2>معنی</h2>
        <p>{word.fa}</p>
        {word.exampleEn && (
          <div className="example-block">
            <h2>در جمله</h2>
            <p className="english example-en" lang="en" dir="ltr">{word.exampleEn}</p>
            {word.exampleFa && <p className="muted">{word.exampleFa}</p>}
          </div>
        )}
      </section>
      <section className="detail-actions" aria-label="کارهای واژه">
        {personal ? (
          <p className="inline-notice" role="status">
            {personal.status === "queued" ? "این واژه از قبل در صف است." : "این واژه در مجموعهٔ شخصی‌ات قرار دارد."}
          </p>
        ) : (
          <button className="button primary" type="button" onClick={() => addToQueue(draft)}>
            افزودن به صف
          </button>
        )}
        <Link className="button secondary" href={`/study?scope=one&id=${encodeURIComponent(word.id)}`}>
          مطالعهٔ آزاد این واژه
        </Link>
      </section>
      <p className="field-hint">
        اطلاعات این صفحه از واژه‌نامهٔ نمونهٔ محلی است؛ صوت تلفظ و واژه‌نامهٔ برخط در این نسخه ارائه نمی‌شوند.
      </p>
    </>
  );
}