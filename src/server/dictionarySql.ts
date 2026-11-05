// جست‌وجوی واژه‌نامه مستقیم در Postgres (Neon). همین SQL در تست‌ها روی PGlite اجرا می‌شود.
// ترتیب: دقیق/پیشوند ← شامل ← غلط املایی رایج ← فازی (pg_trgm) · فارسی: شامل معنی
import { TYPOS, type DictionaryEntry } from '../lib/dictionary';

export type Query = (text: string, params: unknown[]) => Promise<{ payload: DictionaryEntry }[]>;
export interface SqlOutcome { results: DictionaryEntry[]; suggestion?: string }

const PREFIX = `SELECT payload FROM dictionary_entries WHERE norm LIKE $1 || '%' ORDER BY (norm = $1) DESC, rank NULLS LAST, length(norm), norm LIMIT $2`;
const CONTAINS = `SELECT payload FROM dictionary_entries WHERE norm LIKE '%' || $1 || '%' AND norm NOT LIKE $1 || '%' ORDER BY rank NULLS LAST, length(norm) LIMIT $2`;
const EXACT = `SELECT payload FROM dictionary_entries WHERE norm = $1 LIMIT 1`;
const FUZZY = `SELECT payload FROM dictionary_entries WHERE norm % $1 ORDER BY similarity(norm, $1) DESC, rank NULLS LAST LIMIT $2`;
const PERSIAN = `SELECT payload FROM dictionary_entries WHERE fa LIKE '%' || $1 || '%' ORDER BY (fa = $1) DESC, rank NULLS LAST, length(fa) LIMIT $2`;
export const BY_ID = `SELECT payload FROM dictionary_entries WHERE id = $1 OR norm = $1 ORDER BY (id = $1) DESC LIMIT 1`;

/** فقط حروف مجاز؛ نویسه‌های ویژهٔ LIKE (% _ \) هرگز به پرس‌وجو نمی‌رسند */
export const cleanLatin = (q: string) => q.toLowerCase().replace(/[^a-z' -]/g, '').replace(/\s+/g, ' ').trim();
export const cleanPersian = (q: string) => q.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[%_\\]/g, '').trim();

export async function searchSql(run: Query, raw: string, limit = 50): Promise<SqlOutcome> {
  const text = raw.trim();
  if (!text) return { results: [] };
  if (/[a-z]/i.test(text)) {
    const q = cleanLatin(text);
    if (!q) return { results: [] };
    const prefix = (await run(PREFIX, [q, limit])).map((r) => r.payload);
    const inner = q.length >= 3 && prefix.length < limit ? (await run(CONTAINS, [q, limit - prefix.length])).map((r) => r.payload) : [];
    if (prefix.length || inner.length) return { results: [...prefix, ...inner] };
    const fixed = TYPOS[q] ? (await run(EXACT, [TYPOS[q]])).map((r) => r.payload) : [];
    const fuzzy = (await run(FUZZY, [q, 20])).map((r) => r.payload).filter((e) => !fixed.some((f) => f.id === e.id));
    const results = [...fixed, ...fuzzy];
    return { results, suggestion: results[0]?.en };
  }
  const q = cleanPersian(text);
  if (!q) return { results: [] };
  return { results: (await run(PERSIAN, [q, limit])).map((r) => r.payload) };
}
