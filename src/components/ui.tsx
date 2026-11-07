"use client";
import type { CSSProperties, ReactNode } from "react";
import type { StatusKey } from "@/lib/vocabulary";

const P: Record<string, ReactNode> = {
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  book: <><path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5Z" /><path d="M8 17h10" /></>,
  list: <path d="M8 6h11M8 12h11M8 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  home: <path d="M4 11.5 12 4l8 7.5V20h-5v-5H9v5H4v-8.5Z" />,
  layers: <><path d="m12 4 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4M4 16l8 4 8-4" /></>,
  volume: <><path d="M5 10v4h3l4 3.5v-11L8 10H5Z" /><path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10" /></>,
  right: <path d="m9 5 7 7-7 7" />,
  left: <path d="m15 5-7 7 7 7" />,
  wifioff: <><path d="M3 3l18 18M8.5 8.8A11 11 0 0 0 3 12.5M5.5 15.5A7 7 0 0 1 9 13.6M12 20h.01M15.5 13.4a7 7 0 0 1 3 2.1M13.5 7.2a11 11 0 0 1 7.5 5.3" /></>,
  alert: <><path d="M12 4 3 20h18L12 4Z" /><path d="M12 10v4.5M12 17.5h.01" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v5h-5" /></>,
  spark: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />,
  leaf: <><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" /><path d="M5 19c3-4 6-6 9-8" /></>,
  ext: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></>,
  trash: <><path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13" /></>,
  flip: <><path d="M4 9a8 8 0 0 1 14-3l2 2M20 15a8 8 0 0 1-14 3l-2-2" /><path d="M20 4v4h-4M4 20v-4h4" /></>,
  flame: <path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9Z" />,
  puzzle: <path d="M10 4h4v3a2 2 0 1 0 0 4h0v3h-3a2 2 0 1 1-4 0H4v-4h3a2 2 0 1 0 0-4V4h3Z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  shuffle: <path d="M4 7h3.5c4 0 5 10 9 10H20M4 17h3.5c1.5 0 2.6-1.6 3.6-3.2M14 8.6C14.7 7.6 15.6 7 16.5 7H20M18 4l2 3-2 3M18 14l2 3-2 3" />,
  pencil: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
};

export function Icon({ n, size = 22, className = "", style }: { n: string; size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} style={style}>
      {P[n]}
    </svg>
  );
}

/** متن انگلیسی با جهت LTR مستقل */
export function En({ children, className = "", style, sans = false, as: Tag = "span" }: { children: ReactNode; className?: string; style?: CSSProperties; sans?: boolean; as?: "span" | "div" | "p" | "h1" | "h2" | "h3" }) {
  return (
    <Tag dir="ltr" lang="en" className={`${sans ? "en-sans" : "en"} ${className}`} style={style}>
      {children}
    </Tag>
  );
}

export function Ipa({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <span dir="ltr" lang="en-fonipa" className="ipa">{children}</span>;
}

export type Mood = "happy" | "calm" | "oops" | "sleep";

/** «نهال» — شخصیت همراه واژه */
export function Sprout({ mood = "calm", size = 96, className = "", decorative = true }: { mood?: Mood; size?: number; className?: string; decorative?: boolean }) {
  const mouth =
    mood === "happy" ? "M42 63c3 6 13 6 16 0" : mood === "oops" ? "M43 66c3-3 11-3 14 0" : mood === "sleep" ? "M45 64h10" : "M43 63c4 4 10 4 14 0";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "نهال، همراه واژه" })}>
      <ellipse cx="50" cy="92" rx="26" ry="4" fill="var(--ink)" opacity=".1" />
      <path d="M50 42V26" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
      <g className="sp-leaf-l" style={{ transform: mood === "oops" ? "rotate(-30deg)" : undefined }}>
        <path d="M50 28C40 12 24 14 20 22c8 10 22 10 30 6Z" fill="var(--accent)" />
        <path d="M48 27C40 22 32 20 26 21" stroke="var(--accent-ink)" strokeOpacity=".5" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
      <g className="sp-leaf-r"><path d="M50 30c4-14 20-18 28-12-2 12-14 18-28 12Z" fill="var(--warm)" /></g>
      <path d="M50 40c-19 0-30 14-30 28 0 12 11 20 30 20s30-8 30-20c0-14-11-28-30-28Z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="3" />
      <path d="M26 72c6 4 14 6 24 6" stroke="var(--warm)" strokeOpacity=".35" strokeWidth="5" strokeLinecap="round" fill="none" />
      {mood === "sleep" ? (
        <path d="M36 55c3 2 6 2 9 0M55 55c3 2 6 2 9 0" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <ellipse className="sp-eye" cx="39" cy="55" rx="3.4" ry="4.4" fill="var(--ink)" />
          <ellipse className="sp-eye" cx="61" cy="55" rx="3.4" ry="4.4" fill="var(--ink)" />
        </>
      )}
      <circle cx="31" cy="62" r="4" fill="var(--warm)" opacity=".28" />
      <circle cx="69" cy="62" r="4" fill="var(--warm)" opacity=".28" />
      <path d={mouth} stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const BURST = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return { dx: Math.round(Math.cos(a) * (70 + (i % 3) * 18)), dy: Math.round(Math.sin(a) * (60 + (i % 2) * 24)), r: (i * 47) % 360 };
});
export function Burst({ k }: { k: number }) {
  return (
    <div className="burst" key={k} aria-hidden="true">
      {BURST.map((b, i) => <span key={i} style={{ "--dx": `${b.dx}px`, "--dy": `${b.dy}px`, "--r": `${b.r}deg` } as CSSProperties} />)}
    </div>
  );
}

export function Pips({ stage }: { stage?: number | null }) {
  return (
    <span className="pips" role="img" aria-label={stage ? `مرحلهٔ ${stage} از ۵` : "هنوز وارد مرحله‌ها نشده"}>
      {[1, 2, 3, 4, 5].map((i) => <i key={i} className={stage && i <= stage ? "on" : ""} />)}
    </span>
  );
}

export function Skel({ w = "100%", h = 16, r = 12 }: { w?: string | number; h?: number; r?: number }) {
  return <div className="skel" style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />;
}

/** برچسب نمایشی — تا خروجی ساختگی واقعی جلوه نکند */
export function DemoChip({ children = "نمایشی" }: { children?: ReactNode }) {
  return <span className="chip chip-demo"><Icon n="info" size={14} /> {children}</span>;
}

export const STATUS_META: Record<StatusKey, { label: string; icon: string; cls: string }> = {
  new: { label: "در فهرست شما نیست", icon: "plus", cls: "chip" },
  mine: { label: "در فهرست شما", icon: "list", cls: "chip chip-accent" },
  queue: { label: "در صف", icon: "layers", cls: "chip chip-warm" },
  active: { label: "در دستهٔ فعال", icon: "leaf", cls: "chip chip-accent" },
  done: { label: "مرحلهٔ ۵ گذرانده", icon: "check", cls: "chip chip-accent" },
};
export function StatusChip({ s }: { s: StatusKey }) {
  const m = STATUS_META[s];
  return <span className={m.cls}><Icon n={m.icon} size={14} /> {m.label}</span>;
}

export function speak(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}

/** جهت ورودی جست‌وجو: با نخستین حرف لاتین LTR، وگرنه RTL (تا placeholder فارسی درست بنشیند) */
export const inputDir = (v: string): "ltr" | "rtl" => (/^[^A-Za-z\u0600-\u06FF]*[A-Za-z]/.test(v) ? "ltr" : "rtl");
