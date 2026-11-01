"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useApp } from "@/components/Providers";
import type { ThemeName } from "@/lib/vocabulary";

const NAV_ITEMS = [
  { href: "/", key: "review", label: "مرور", icon: "↻" },
  { href: "/words", key: "words", label: "واژه‌ها", icon: "▤" },
  { href: "/search", key: "search", label: "جست‌وجو", icon: "⌕" },
  { href: "/queue", key: "queue", label: "صف", icon: "☷" },
];

function activeKey(path: string): string {
  if (path.startsWith("/words") || path.startsWith("/word/")) return "words";
  if (path.startsWith("/search")) return "search";
  if (path.startsWith("/queue")) return "queue";
  return "review";
}

function ThemePicker() {
  const { theme, setTheme } = useApp();
  return (
    <label className="theme-picker">
      <span>حال‌وهوای صفحه</span>
      <select
        aria-label="انتخاب پوسته"
        value={theme}
        onChange={(event) => setTheme(event.target.value as ThemeName)}
      >
        <option value="grove">Grove · سبز و روشن</option>
        <option value="orbit">Orbit · تیره</option>
        <option value="folio">Folio · کرم و سفالی</option>
      </select>
    </label>
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  const current = activeKey(path);
  const focused = path.startsWith("/study");

  return (
    <div className={`app-frame${focused ? " is-focused" : ""}`}>
      <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
      <aside className="sidebar" aria-label="ناوبری برنامه">
        <Link className="brand" href="/" aria-label="واژه، صفحهٔ مرور">
          <span className="brand-mark" aria-hidden="true">و</span><span>واژه</span>
        </Link>
        <nav className="side-nav" aria-label="بخش‌های برنامه">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="nav-link"
              aria-current={current === item.key ? "page" : undefined}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <ThemePicker />
          <p className="local-note">نسخهٔ آغازین<br />داده‌ها فقط در همین مرورگر ذخیره می‌شوند.</p>
        </div>
      </aside>
      <header className="mobile-header">
        <Link className="mobile-brand" href="/">
          <span className="brand-mark" aria-hidden="true">و</span><span>واژه</span>
        </Link>
        <ThemePicker />
      </header>
      <main id="main-content" className="main-content" tabIndex={-1}>
        <div className="content-inner">{children}</div>
      </main>
      <nav className="bottom-nav" aria-label="ناوبری اصلی">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="bottom-nav-link"
            aria-current={current === item.key ? "page" : undefined}
          >
            <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}