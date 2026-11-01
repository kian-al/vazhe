"use client";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { En } from "@/components/ui";
import { stg } from "@/components/words";
import { BOOKS, fa } from "@/lib/dictionary";

export default function Library() {
  return (
    <div className="flex flex-col gap-4">
      <div><h2 className="h1">کتابخانه</h2><p className="small muted">واژه‌ها را فصل‌به‌فصل بیاور؛ تکراری‌ها خودکار رد می‌شوند.</p></div>
      <div className="banner banner-warm" role="note"><Icon n="info" size={18} /><p className="small">فعلاً فقط آثار <b>مالکیت عمومی</b> به‌عنوان نمونه آمده‌اند و فهرست واژه‌ها گزیدهٔ دستی است؛ متن کتاب بازنشر نمی‌شود. <b>منبع نهایی کتاب‌ها تصمیم‌گیری‌نشده است.</b></p></div>
      <div className="lib-grid">
        {BOOKS.map((b, i) => (
          <Link key={b.id} href={`/library/${b.id}`} className="card card-lift rise flex flex-col gap-2" style={stg(i)}>
            <span className="flex items-start justify-between gap-2">
              <span className="chip chip-accent icon-tile"><Icon n="book" /></span>
              <span className="chip">{fa(b.chapters.length)} فصل</span>
            </span>
            <En as="p" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>{b.title}</En>
            <p className="small muted"><En sans>{b.author}</En></p>
            <span className="chip" style={{ alignSelf: "flex-start", whiteSpace: "normal", lineHeight: 1.5, padding: "4px 12px" }}><Icon n="check" size={14} /> {b.license}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
