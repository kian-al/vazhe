import Link from "next/link";

export default function NotFound() {
  return (
    <section className="card empty-state">
      <h1>این صفحه پیدا نشد</h1>
      <p>از اینجا می‌توانی دوباره به واژه‌ها برگردی.</p>
      <Link className="button primary" href="/">بازگشت به مرور</Link>
    </section>
  );
}