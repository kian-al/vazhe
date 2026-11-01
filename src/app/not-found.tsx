import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card flex flex-col items-center text-center gap-3" style={{ padding: 28 }}>
      <h2 className="h1">این صفحه پیدا نشد</h2>
      <p className="muted">شاید نشانی جابه‌جا شده باشد. واژه‌هایت سر جایشان‌اند.</p>
      <Link className="btn btn-primary" href="/">بازگشت به مرور</Link>
    </div>
  );
}
