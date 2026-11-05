"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useApp } from "./store";
import { Icon, Sprout } from "./ui";
import { SyncStatus } from "./SyncStatus";
import { faN } from "@/lib/dictionary";

const TABS = [
  { id: "home", href: "/", label: "مرور", icon: "home" },
  { id: "words", href: "/words", label: "واژه‌ها", icon: "list" },
  { id: "search", href: "/search", label: "جست‌وجو", icon: "search" },
  { id: "queue", href: "/queue", label: "صف", icon: "layers" },
  { id: "library", href: "/library", label: "کتابخانه", icon: "book" },
] as const;

function tabOf(path: string): string {
  if (path === "/" || path.startsWith("/study") || path.startsWith("/review") || path.startsWith("/batch")) return "home";
  if (path.startsWith("/words") || path.startsWith("/word/")) return "words";
  if (path.startsWith("/search")) return "search";
  if (path.startsWith("/queue")) return "queue";
  if (path.startsWith("/library")) return "library";
  return "";
}

function titleOf(path: string): string {
  if (path === "/") return "واژه";
  if (path.startsWith("/words")) return "واژه‌های من";
  if (path.startsWith("/word/")) return "جزئیات واژه";
  if (path.startsWith("/search")) return "جست‌وجو";
  if (path.startsWith("/queue")) return "صف";
  if (/^\/library\/[^/]+\/[^/]+/.test(path)) return "فصل";
  if (path.startsWith("/library/")) return "کتاب";
  if (path.startsWith("/library")) return "کتابخانه";
  if (path.startsWith("/batch")) return "دستهٔ فعال";
  if (path.startsWith("/review")) return "مرور زمان‌بندی‌شده";
  return "واژه";
}

function parentOf(path: string): string | null {
  const ch = path.match(/^\/library\/([^/]+)\/[^/]+/);
  if (ch) return `/library/${ch[1]}`;
  if (path.startsWith("/library/")) return "/library";
  if (path.startsWith("/word/")) return "/words";
  if (path.startsWith("/batch")) return "/";
  return null;
}

const FILL = ["/words", "/search", "/queue"];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() || "/";
  const router = useRouter();
  const { queue, toast, bump, online, syncStatus } = useApp();

  if (path.startsWith("/extension")) return <>{children}</>;

  const focus = path.startsWith("/study");
  const tab = tabOf(path);
  const parent = parentOf(path);
  const fill = FILL.includes(path);
  const badge = queue.length > 0 && (
    <span key={bump} className={`badge ${bump ? "bump" : ""}`} aria-hidden="true">{faN(queue.length)}</span>
  );
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(parent ?? "/");
  };

  return (
    <div className={`app ${focus ? "focus" : ""}`}>
      <a className="skip-link" href="#main">رفتن به محتوای اصلی</a>
      {!focus && (
        <nav className="sidebar" aria-label="ناوبری اصلی">
          <Link href="/" className="brand" aria-label="واژه، صفحهٔ مرور">
            <Sprout size={44} />
            <span><b style={{ fontSize: 24, lineHeight: 1 }}>واژه</b><span className="tiny muted" style={{ display: "block" }}>یادگیری واژگان انگلیسی</span></span>
          </Link>
          {TABS.map((t) => (
            <Link key={t.id} href={t.href} className="tab" aria-current={tab === t.id && !path.startsWith("/batch") ? "page" : undefined}>
              <Icon n={t.icon} /> <span style={{ flex: 1 }}>{t.label}</span>
              {t.id === "queue" && badge}
              {t.id === "queue" && queue.length > 0 && <span className="sr-only">{`${queue.length} واژه در صف`}</span>}
            </Link>
          ))}
          <Link href="/batch" className="tab" aria-current={path.startsWith("/batch") ? "page" : undefined}><Icon n="leaf" /> دستهٔ فعال</Link>
          <div style={{ flex: 1, minHeight: 16 }} />
          <Link href="/extension" className="tab"><Icon n="puzzle" /> <span style={{ flex: 1 }}>پیش‌نمایش افزونه</span></Link>
          <div className="sidebar-note"><b>هر واژه، یک قدم نزدیک‌تر.</b><p className="small muted">با ریتم خودت یاد بگیر؛ فشاری در کار نیست.</p><Link href="/about" className="link small">داده‌ها و حریم خصوصی</Link></div>
        </nav>
      )}

      <div className="column">
        {!focus && (
          <header className="topbar">
            {parent ? (
              <button type="button" className="btn btn-ghost icon-btn" aria-label="بازگشت" onClick={goBack}><Icon n="right" /></button>
            ) : (
              <Link href="/" aria-label="واژه، صفحهٔ مرور" style={{ display: "inline-flex", minWidth: 44, minHeight: 44, alignItems: "center" }}><Sprout size={40} /></Link>
            )}
            <h1>{titleOf(path)}</h1>
            <Link href="/queue" className="btn btn-ghost icon-btn" aria-label={`صف، ${queue.length} واژه`} style={{ position: "relative" }}>
              <Icon n="layers" />
              {queue.length > 0 && <span style={{ position: "absolute", top: -6, insetInlineStart: -6 }}>{badge}</span>}
            </Link>
          </header>
        )}
        {!focus && <SyncStatus />}
        {(syncStatus === "error" || syncStatus === "conflict") && <div className="banner banner-danger"><p className="small">{syncStatus === "conflict" ? "در تب دیگری داده تغییر کرده است. نسخهٔ محلی را نگه داشته‌ایم و برای جلوگیری از پاک‌شدن داده، همگام‌سازی متوقف شد." : "ذخیرهٔ سروری فعلاً در دسترس نیست؛ تغییرها ممکن است فقط روی همین مرورگر بمانند."}</p></div>}
        {!online && (
          <div className="banner banner-warm offline" role="status">
            <Icon n="wifioff" size={20} />
            <p className="small"><b>اتصال اینترنت قطع است.</b> فهرست قبلی برای مطالعه در دسترس است. جست‌وجو و ذخیرهٔ سروری تا برگشت اتصال ممکن نیست.</p>
          </div>
        )}
        <main id="main" className={`main ${fill ? "fill" : ""}`} tabIndex={-1}>
          <div className="main-inner">{children}</div>
        </main>
        <div className="toast-wrap" role="status" aria-live="polite">
          {toast && (
            <div className="toast-box toast" key={toast.id}>
              <Icon n={toast.kind === "warn" ? "alert" : "check"} size={20} />
              <span className="small" style={{ color: "inherit" }}>{toast.text}</span>
            </div>
          )}
        </div>
        {!focus && (
          <nav className="bottom-nav" aria-label="ناوبری اصلی">
            {TABS.map((t) => (
              <Link key={t.id} href={t.href} className="tab" aria-current={tab === t.id ? "page" : undefined}>
                <span className="tab-icon"><Icon n={t.icon} size={22} />{t.id === "queue" && badge}</span>
                {t.label}
                {t.id === "queue" && queue.length > 0 && <span className="sr-only">{`، ${queue.length} واژه`}</span>}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
