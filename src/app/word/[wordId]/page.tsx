"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/store";
import { Icon, Skel } from "@/components/ui";
import { EmptyCard, WordDetail } from "@/components/words";
import { dictionary } from "@/lib/dictionaryProvider";
import type { DictionaryEntry } from "@/lib/dictionary";

export default function WordPage() {
  return <div className="page-narrow"><WordPageInner /></div>;
}

function WordPageInner() {
  const { wordId } = useParams<{ wordId: string }>();
  const id = decodeURIComponent(wordId ?? "");
  const app = useApp();
  const record = app.words.find((w) => w.id === id);
  const [entry, setEntry] = useState<DictionaryEntry | null | undefined>(undefined);
  const [err, setErr] = useState(false);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (record) return;
    let live = true;
    setErr(false);
    setEntry(undefined);
    dictionary.lookup(id).then((e) => { if (live) setEntry(e); }).catch(() => { if (live) setErr(true); });
    return () => { live = false; };
  }, [id, record, n]);

  if (!app.ready) return <div className="flex flex-col gap-3" aria-busy="true"><Skel h={200} r={22} /><Skel h={110} r={22} /></div>;
  if (record) return <WordDetail entry={record} record={record} />;
  if (err) {
    return (
      <div className="banner banner-danger" role="alert">
        <Icon n="alert" />
        <div className="flex flex-col gap-2"><p className="small"><b>جزئیات واژه بارگذاری نشد.</b> چیزی از فهرست تو کم نشده است.</p>
          <button type="button" className="btn btn-ghost" onClick={() => setN((x) => x + 1)}><Icon n="refresh" size={18} /> تلاش دوباره</button></div>
      </div>
    );
  }
  if (entry === undefined) return <div className="flex flex-col gap-3" aria-busy="true" aria-label="در حال بارگذاری"><Skel h={200} r={22} /><Skel h={110} r={22} /></div>;
  if (entry === null) {
    return <EmptyCard title="این واژه پیدا نشد" action={<Link className="btn btn-primary" href="/search"><Icon n="search" size={18} /> جست‌وجوی واژه</Link>}>ممکن است از فهرست حذف شده باشد یا در واژه‌نامهٔ نمونه نباشد.</EmptyCard>;
  }
  return <WordDetail entry={entry} />;
}
