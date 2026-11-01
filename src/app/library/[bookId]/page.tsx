"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/components/store";
import { En, Icon } from "@/components/ui";
import { EmptyCard, stg } from "@/components/words";
import { BOOKS, entryById, faN, type DictionaryEntry } from "@/lib/dictionary";
import { countFresh } from "@/lib/vocabulary";

export default function BookPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const app = useApp();
  const b = BOOKS.find((x) => x.id === bookId);
  if (!b) return <EmptyCard title="این کتاب پیدا نشد" action={<Link className="btn btn-primary" href="/library">بازگشت به کتابخانه</Link>} />;
  const all = b.chapters.flatMap((c) => c.wordIds).map(entryById).filter((e): e is DictionaryEntry => !!e);
  const c = countFresh(app.words, all);
  const uniqDup = all.length - c.fresh;
  return (
    <div className="flex flex-col gap-4 in-fwd">
      <div>
        <En as="h2" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.25 }}>{b.title}</En>
        <p className="small muted mt-1"><En sans>{b.author}</En></p>
        <p className="small muted mt-1">مجوز: {b.license}. <a className="link" href={b.source} target="_blank" rel="noreferrer">صفحهٔ منبع</a></p>
      </div>
      <button type="button" className="btn btn-primary" disabled={!app.ready || c.fresh === 0} onClick={() => app.addMany(all)}>
        <Icon n="plus" /> {c.fresh ? `افزودن کل کتاب به صف (${faN(c.fresh)} تازه${uniqDup ? `، ${faN(uniqDup)} تکراری رد می‌شود` : ""})` : "همهٔ واژه‌های این کتاب را داری"}
      </button>
      <div className="flex flex-col gap-2">
        {b.chapters.map((ch, i) => {
          const es = ch.wordIds.map(entryById).filter((e): e is DictionaryEntry => !!e);
          const n = countFresh(app.words, es).fresh;
          return (
            <Link key={ch.id} href={`/library/${b.id}/${ch.id}`} className="card card-lift rise flex items-center gap-3" style={stg(i)}>
              <span style={{ flex: 1 }}><En as="p" style={{ fontSize: 18, fontWeight: 600 }}>{ch.title}</En><span className="small muted">{faN(es.length)} واژه · {faN(n)} تازه</span></span>
              <Icon n="left" size={18} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
