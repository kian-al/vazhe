"use client";
import { En } from "@/components/ui";
import type { LibraryBook as Book, CoverTheme } from "@/lib/library";

export const COVER_THEME: Record<CoverTheme, { from: string; mid: string; to: string; fg: string }> = {
  alice: { from: "#123524", mid: "#1d5c3f", to: "#123524", fg: "#cfe8d4" },
  prince: { from: "#5d1f2d", mid: "#84304a", to: "#4a1a26", fg: "#f3d9d0" },
  amber: { from: "#6b3d0f", mid: "#a9762c", to: "#57310c", fg: "#f7e7c9" },
  teal: { from: "#0f4c5c", mid: "#1b6e7e", to: "#0b3a46", fg: "#d3edf3" },
  indigo: { from: "#232c5c", mid: "#3a4a92", to: "#1a2147", fg: "#dfe4ff" },
};

/** جلد تایپوگرافیک — بدون بازنشر متن یا تصویر اثر؛ در وب و اپ مشترک است. */
export function BookCover({ book, size = 128 }: { book: Book; size?: number }) {
  const t = COVER_THEME[book.cover ?? (book.id === "alice" ? "alice" : "prince")];
  const classic = book.cover === "alice" || book.cover === "prince" || (!book.cover && (book.id === "alice" || book.id === "prince"));
  return (
    <div
      className="book-cover"
      aria-hidden="true"
      style={{
        width: size,
        height: size * 1.42,
        borderRadius: 14,
        background: `linear-gradient(160deg, ${t.from}, ${t.mid} 55%, ${t.to})`,
        color: t.fg,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 14px 28px -16px rgba(20, 38, 27, 0.55), inset 0 0 0 1px rgba(255,255,255,0.1)",
        flexShrink: 0,
      }}
    >
      {classic ? (
        <svg viewBox="0 0 120 60" width={size - 24} style={{ opacity: 0.5, marginTop: 2 }} aria-hidden="true">
          {book.cover === "prince" ? (
            <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M60 34c-8-6-16-10-16-18a8 8 0 0 1 16-2 8 8 0 0 1 16 2c0 8-8 12-16 18Z" />
              <path d="M60 34v14m0-8c5-3 9-3 12-6" />
            </g>
          ) : (
            <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M60 8c14 0 26 10 26 22s-12 22-26 22-26-10-26-22S46 8 60 8Z" />
              <path d="M60 18c8 0 15 5 15 12s-7 12-15 12-15-5-15-12 7-12 15-12Z" />
              <path d="M60 26c3.5 0 6 2 6 4.5S63.5 35 60 35s-6-2-6-4.5 2.5-4.5 6-4.5Z" />
            </g>
          )}
        </svg>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4, opacity: 0.55 }} aria-hidden="true">
            {[92, 78, 86, 64, 82, 70].map((w, i) => (
              <span key={i} style={{ height: 3, width: `${w}%`, borderRadius: 3, background: "currentColor" }} />
            ))}
          </div>
          {book.emblem ? (
            <span style={{ fontSize: size / 3.4, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", marginTop: "auto" }}>{book.emblem}</span>
          ) : null}
        </>
      )}
      <En
        sans
        style={{
          fontFamily: "'Fraunces Variable', Georgia, serif",
          fontSize: classic ? size / 8.2 : size / 11.5,
          lineHeight: 1.25,
          fontWeight: 600,
          marginTop: classic ? "auto" : 8,
        }}
      >
        {book.title.split(" and Other")[0].split(",")[0]}
      </En>
      <span dir="ltr" style={{ fontSize: size / 12.5, opacity: 0.8, marginTop: 4 }}>
        {book.author}
      </span>
    </div>
  );
}
