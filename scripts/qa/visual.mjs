// QA بصری: اسکرین‌شات مسیرها و حالت‌ها در عرض‌های هدف. اجرا: node tests/visual.mjs <width> [names...]
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve("playwright", { paths: [process.cwd(), "/data", "/vercel/sandbox"] }));
const BASE = process.env.BASE ?? "http://localhost:3100";
const width = Number(process.argv[2] ?? 1440);
const only = process.argv.slice(3);
const height = width >= 1024 ? 860 : 780;
const shots = [
  ["home", "/"],
  ["words", "/words"],
  ["words-sel", "/words?w=serendipity"],
  ["search-start", "/search"],
  ["search-results", "/search?q=cur"],
  ["search-spell", "/search?q=recieve"],
  ["search-none", "/search?q=zzqxv"],
  ["detail", "/word/receive"],
  ["queue", "/queue"],
  ["library", "/library"],
  ["book", "/library/alice"],
  ["chapter", "/library/alice/alice-1"],
  ["batch", "/batch"],
  ["study-q", "/study"],
  ["extension", "/extension"],
];
const browser = await chromium.launch({ executablePath: "/usr/local/bin/chromium", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: "reduce", locale: "fa-IR" });
const page = await ctx.newPage();
const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") problems.push(`console: ${m.text()}`); });
for (const [name, path] of shots) {
  if (only.length && !only.includes(name)) continue;
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 0) problems.push(`${name}: horizontal overflow ${overflow}px`);
  await page.screenshot({ path: `.qa/v2/${width}-${name}.png` });
}
if (!only.length || only.includes("study-a")) {
  await page.goto(BASE + "/study", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "نمایش پاسخ" }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `.qa/v2/${width}-study-a.png` });
  await page.getByRole("button", { name: /فراموش کردم/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `.qa/v2/${width}-study-coach.png` });
}
console.log(problems.length ? problems.join("\n") : "no runtime errors / no horizontal overflow");
await page.close(); await ctx.close(); await browser.close();
process.exit(0);
