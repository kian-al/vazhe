"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/store";
import { Burst, En, Icon } from "@/components/ui";
import { EmptyCard, WordRow } from "@/components/words";
import { BOOKS, entryById, faN, type DictionaryEntry } from "@/lib/dictionary";
import { countFresh, statusKey } from "@/lib/vocabulary";

export default function ChapterPage() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const app = useApp();
  const [bk, setBk] = useState(0);
  const b = BOOKS.find((x) => x.id === bookId);
  const ch = b?.chapters.find((x) => x.id === chapterId);
  if (!b || !ch) return <EmptyCard title="این فصل پیدا نشد" action={<Link className="btn btn-primary" href="/library">بازگشت به کتابخانه</Link>} />;
  const es = ch.wordIds.map(entryById).filter((e): e is DictionaryEntry => !!e);
  const c = countFresh(app.words, es);
  return (
    <div className="flex flex-col gap-4 in-fwd">
      <div>
        <p className="small muted"><En sans>{b.title}</En></p>
        <En as="h2" style={{ fontSize: 24, fontWeight: 600 }}>{ch.title}</En>
        <p className="small muted mt-1">{faN(es.length)} واژه · {faN(c.fresh)} تازه · {faN(c.duplicates)} تکراری</p>
      </div>
      <div style={{ position: "relative" }}>
        <button type="button" className="btn btn-primary w-full" disabled={!app.ready || c.fresh === 0} onClick={() => { if (app.addMany(es).added) setBk((x) => x + 1); }}>
          <Icon n="plus" /> {c.fresh ? `افزودن فصل به صف (${faN(c.fresh)} واژهٔ تازه)` : "همهٔ واژه‌های این فصل را داری"}
        </button>
        {bk > 0 && <Burst k={bk} />}
      </div>
      {c.duplicates > 0 && <div className="banner banner-accent" role="note"><Icon n="check" size={18} /><p className="small">{faN(c.duplicates)} واژه از قبل در فهرست توست و دوباره اضافه نمی‌شود؛ با برچسب وضعیت مشخص شده‌اند.</p></div>}
      <div role="list" aria-label={`واژه‌های ${ch.title}`}>
        {es.map((e) => {
          const rec = app.byEn(e.en);
          return <div role="listitem" key={e.id} style={{ height: 88 }}><WordRow item={e} status={statusKey(rec)} stage={rec?.stage} href={`/word/${encodeURIComponent(rec?.id ?? e.id)}`} /></div>;
        })}
      </div>
    </div>
  );
}
