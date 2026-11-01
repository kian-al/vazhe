"use client";

import Link from "next/link";
import { useApp } from "@/components/Providers";

function faNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export default function HomePage() {
  const { words, ready } = useApp();
  if (!ready) return <p className="loading-state" role="status">دارم صفحه را آماده می‌کنم…</p>;

  const queued = words.filter((word) => word.status === "queued").length;
  const active = words.filter((word) => word.status === "active").length;

  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">آرام و پیوسته</p>
        <h1>امروز سراغ کدوم واژه‌ها بریم؟</h1>
        <p className="lead">واژه‌ها با چند بار دیدن، کم‌کم جای خودشون رو توی ذهنت پیدا می‌کنن.</p>
      </div>

      <section className="card hero-card" aria-labelledby="free-title">
        <div className="hero-copy">
          <span className="kicker">هر وقت خواستی، به سبک خودت</span>
          <h2 id="free-title">مطالعهٔ آزاد</h2>
          <p>
            همهٔ واژه‌های شخصی‌ات، از جمله واژه‌های صف و دسته‌های قبلی، همین‌جا در دسترس‌اند؛
            بدون سقف روزانه.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/study?scope=all">
              شروع با همهٔ واژه‌ها
              <span className="button-count">{faNumber(words.length)}</span>
            </Link>
            <Link className="button secondary" href="/words">دیدن فهرست واژه‌ها</Link>
          </div>
          <p className="quiet-note">این تمرین زمان‌بندی مرور را تغییر نمی‌دهد.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="leaf leaf-one">✳</span>
          <span className="leaf leaf-two">✿</span>
          <span className="hero-letter">A</span>
        </div>
      </section>

      <div className="home-grid">
        <section className="card info-card" aria-labelledby="scheduled-title">
          <div className="section-heading">
            <span className="section-icon" aria-hidden="true">◷</span>
            <div>
              <h2 id="scheduled-title">مرور زمان‌بندی‌شده</h2>
              <p className="muted">جدا از مطالعهٔ آزاد</p>
            </div>
          </div>
          <p>
            زمان‌بندی مرور و ثبت امتیازهای رسمی هنوز به سرویس مرور متصل نشده؛ در این نسخه
            هیچ موعدی شبیه‌سازی نمی‌شود.
          </p>
          <span className="status-pill">در حال آماده‌سازی</span>
        </section>

        <section className="card info-card" aria-labelledby="queue-summary-title">
          <div className="section-heading">
            <span className="section-icon" aria-hidden="true">☷</span>
            <div>
              <h2 id="queue-summary-title">صف یادگیری</h2>
              <p className="muted">{faNumber(queued)} واژه منتظرند</p>
            </div>
          </div>
          <p>
            واژه‌های تازه اینجا می‌مانند و در مطالعهٔ آزاد هم قابل مرورند؛ افزودن به صف،
            دستهٔ فعال را دور نمی‌زند.
          </p>
          <Link className="text-link" href="/queue">رفتن به صف <span aria-hidden="true">←</span></Link>
        </section>
      </div>

      <section className="card batch-card" aria-labelledby="batch-title">
        <div className="section-heading">
          <span className="section-icon" aria-hidden="true">▦</span>
          <div>
            <h2 id="batch-title">دسته‌بندی مرحله‌ای</h2>
            <p className="muted">{faNumber(active)} واژه در دستهٔ فعال · ظرفیت آینده حداکثر ۱۰۰ واژه</p>
          </div>
        </div>
        <p>
          قانون پیشروی میان ۵ مرحله هنوز نهایی نشده است. تا روشن‌شدن آن، این نسخه پیشرفت
          مرحله‌ای یا فارغ‌التحصیلی واژه‌ها را تغییر نمی‌دهد.
        </p>
      </section>

      <p className="local-banner" role="note">
        این نسخهٔ اجرایی محلی است: ورود کاربر، همگام‌سازی سرور، واژه‌نامهٔ زنده و FSRS هنوز
        وصل نیستند. داده‌ها روی همین مرورگر می‌مانند.
      </p>
    </>
  );
}