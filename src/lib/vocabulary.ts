// قواعد دامنهٔ واژه — قطعی، بدون وابستگی به رابط و قابل آزمون.
// قانون دسته: دستهٔ تازه با «ساخت دسته» از ابتدای صف (قدیمی‌ترین اول، حداکثر ۱۰۰) ساخته می‌شود
// و فقط وقتی مجاز است که همهٔ اعضای دستهٔ قبلی مرحلهٔ ۵ را گذرانده باشند.
// قانون مرحله‌ها در scheduler.ts (nextStage) است و فقط مرور زمان‌بندی‌شده آن را تغییر می‌دهد.

import { DICTIONARY, TYPOS, entryById, slugify, type DictionaryEntry } from "./dictionary";
import type { ReviewMemory } from "./scheduler";

/** saved: در فهرست شخصی، بیرون از صف و دسته · queued: در صف · active: عضو دستهٔ فعال · completed: مرحلهٔ ۵ گذرانده */
export type WordStatus = "saved" | "queued" | "active" | "completed";
export type FreeRating = "forgot" | "hard" | "good" | "easy";
export type Stage = 1 | 2 | 3 | 4 | 5;
export type WordSource = "sample" | "dictionary" | "manual" | "library";

export interface WordRecord {
  id: string;
  en: string;
  fa: string;
  ipa: string;
  pos: string;
  exampleEn: string;
  exampleFa: string;
  status: WordStatus;
  /** مرحلهٔ ۱ تا ۵ در دستهٔ فعال؛ فقط مرور زمان‌بندی‌شده آن را تغییر می‌دهد. */
  stage?: Stage | null;
  batchId?: string | null;
  /** موعد مرور بعدی (کپی dueAt کارت FSRS)؛ مطالعهٔ آزاد هرگز آن را تغییر نمی‌دهد. */
  scheduledAt?: string | null;
  /** زمان‌بندی FSRS جدا از مرحله‌های دسته و مطالعهٔ آزاد است. */
  review?: ReviewMemory;
  addedAt: string;
  queuedAt?: string | null;
  source: WordSource;
}

export interface VocabState {
  version: 2;
  words: WordRecord[];
  currentBatchId: string | null;
}

export const BATCH_MAX = 100;
export const ROUND_SIZE = 10;

export type StatusKey = "new" | "mine" | "queue" | "active" | "done";

export const normalizeWord = (value: string): string =>
  value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");

export function findWord(words: WordRecord[], en: string): WordRecord | undefined {
  const key = normalizeWord(en);
  return words.find((w) => normalizeWord(w.en) === key);
}

export function statusKey(word: WordRecord | undefined): StatusKey {
  if (!word) return "new";
  switch (word.status) {
    case "queued": return "queue";
    case "active": return "active";
    case "completed": return "done";
    default: return "mine";
  }
}

export function toRecord(entry: DictionaryEntry, source: WordSource, at: string): WordRecord {
  return { ...entry, status: "queued", stage: null, batchId: null, scheduledAt: null, addedAt: at, queuedAt: at, source };
}

export interface AddResult {
  state: VocabState;
  added: boolean;
  existing?: WordRecord;
}

/** افزودن به صف با حذف قطعی تکرار (بر پایهٔ صورت نرمال‌شدهٔ انگلیسی). */
export function addToQueue(state: VocabState, entry: DictionaryEntry, source: WordSource = "dictionary", at = new Date().toISOString()): AddResult {
  const existing = findWord(state.words, entry.en);
  if (existing) return { state, added: false, existing };
  const id = uniqueId(state.words, entry.id || slugify(entry.en));
  const record = toRecord({ ...entry, id }, source, at);
  return { state: { ...state, words: [...state.words, record] }, added: true };
}

export function addManyToQueue(state: VocabState, entries: DictionaryEntry[], source: WordSource = "library", at = new Date().toISOString()) {
  let next = state;
  let added = 0;
  let duplicates = 0;
  const seen = new Set<string>();
  for (const entry of entries) {
    const key = normalizeWord(entry.en);
    if (seen.has(key)) { duplicates += 1; continue; }
    seen.add(key);
    const r = addToQueue(next, entry, source, at);
    if (r.added) { added += 1; next = r.state; } else duplicates += 1;
  }
  return { state: next, added, duplicates };
}

/** شمارش تازه/تکراری برای یک مجموعه، پیش از افزودن (برای دکمه‌های کتاب و فصل) */
export function countFresh(words: WordRecord[], entries: DictionaryEntry[]) {
  const have = new Set(words.map((w) => normalizeWord(w.en)));
  const uniq = new Set(entries.map((e) => normalizeWord(e.en)));
  let fresh = 0;
  for (const key of uniq) if (!have.has(key)) fresh += 1;
  return { fresh, duplicates: entries.length - fresh, total: entries.length };
}

/** برداشتن از صف: واژه از فهرست شخصی حذف نمی‌شود. */
export function removeFromQueue(state: VocabState, id: string): VocabState {
  return { ...state, words: state.words.map((w) => (w.id === id && w.status === "queued" ? { ...w, status: "saved", queuedAt: null } : w)) };
}

/** بازگرداندن واژهٔ ذخیره‌شده به انتهای صف */
export function requeue(state: VocabState, id: string, at = new Date().toISOString()): VocabState {
  return { ...state, words: state.words.map((w) => (w.id === id && w.status === "saved" ? { ...w, status: "queued", queuedAt: at } : w)) };
}

export function deleteWord(state: VocabState, id: string): VocabState {
  return { ...state, words: state.words.filter((w) => w.id !== id) };
}

export function queueOf(words: WordRecord[]): WordRecord[] {
  return words
    .filter((w) => w.status === "queued")
    .sort((a, b) => (a.queuedAt ?? a.addedAt).localeCompare(b.queuedAt ?? b.addedAt));
}

export function batchOf(state: VocabState): WordRecord[] {
  if (!state.currentBatchId) return [];
  return state.words.filter((w) => w.batchId === state.currentBatchId);
}

/** اعضای دسته وقتی «تکمیل»اند که مرحلهٔ ۵ را گذرانده باشند. */
export const passedStageFive = (w: WordRecord) => w.status === "completed";

export function isBatchComplete(state: VocabState): boolean {
  const batch = batchOf(state);
  return batch.length > 0 && batch.every(passedStageFive);
}

/** دستهٔ بعدی فقط وقتی مجاز است که همهٔ اعضای دستهٔ فعلی مرحلهٔ ۵ را گذرانده باشند و صف خالی نباشد. */
export function canStartNextBatch(state: VocabState): boolean {
  const batch = batchOf(state);
  const queueNotEmpty = state.words.some((w) => w.status === "queued");
  if (!queueNotEmpty) return false;
  return batch.length === 0 || batch.every(passedStageFive);
}

/**
 * ساخت دستهٔ تازه: قدیمی‌ترین واژه‌های صف (حداکثر BATCH_MAX) وارد دسته می‌شوند،
 * همه در مرحلهٔ ۱ و با اولین مرور در همان لحظه. اگر قفل باشد null برمی‌گردد.
 */
export function startBatch(state: VocabState, batchId: string, at = new Date().toISOString(), max = BATCH_MAX): { state: VocabState; count: number } | null {
  if (!canStartNextBatch(state)) return null;
  const picked = new Set(queueOf(state.words).slice(0, max).map((w) => w.id));
  const words = state.words.map((w) => (picked.has(w.id)
    ? { ...w, status: "active" as const, stage: 1 as Stage, batchId, scheduledAt: at, review: undefined, queuedAt: null }
    : w));
  return { state: { ...state, words, currentBatchId: batchId }, count: picked.size };
}

/** واژه‌های دستهٔ فعال که موعد مرورشان رسیده، به ترتیب موعد */
export function dueWords(state: VocabState, now: number): WordRecord[] {
  return batchOf(state)
    .filter((w) => w.status === "active" && Date.parse(w.scheduledAt ?? w.review?.card.dueAt ?? w.addedAt) <= now)
    .sort((a, b) => Date.parse(a.scheduledAt ?? a.addedAt) - Date.parse(b.scheduledAt ?? b.addedAt));
}

/** نزدیک‌ترین موعد آینده در دستهٔ فعال (برای پیام «مرور بعدی») */
export function nextDueAt(state: VocabState, now: number): string | null {
  let best: string | null = null;
  for (const w of batchOf(state)) {
    if (w.status !== "active") continue;
    const at = w.scheduledAt ?? w.addedAt;
    if (Date.parse(at) > now && (!best || Date.parse(at) < Date.parse(best))) best = at;
  }
  return best;
}

/** ثبت نتیجهٔ یک مرور زمان‌بندی‌شده: حافظهٔ FSRS، موعد بعدی و مرحلهٔ تازه */
export function applyReview(state: VocabState, id: string, memory: ReviewMemory, change: { stage: Stage; completed: boolean }): VocabState {
  return {
    ...state,
    words: state.words.map((w) => (w.id === id
      ? { ...w, review: memory, stage: change.stage, status: change.completed ? "completed" as const : w.status, scheduledAt: change.completed ? null : memory.card.dueAt }
      : w)),
  };
}

/** مطالعهٔ آزاد: همهٔ واژه‌های شخصی — ذخیره، صف، دستهٔ فعال و تکمیل‌شده. */
export const getPersonalWords = (words: WordRecord[]): WordRecord[] => words;

/** امتیاز مطالعهٔ آزاد فقط در همان جلسه شمرده می‌شود؛ موعد، مرحله و وضعیت تغییر نمی‌کند. */
export function applyFreePracticeRating(word: WordRecord, rating: FreeRating): { word: WordRecord; rating: FreeRating } {
  return { word, rating };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = items.slice();
  const rnd = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * دور n‌امِ مطالعهٔ آزاد. طول دور فقط برای تکه‌کردن است، نه سقف:
 * دورهای پیاپی پیش از تکرار، همهٔ واژه‌ها را پوشش می‌دهند و تعداد دورها نامحدود است.
 */
export function freeStudyRound(ids: string[], round: number, seed: number, size = ROUND_SIZE): string[] {
  const uniq = Array.from(new Set(ids));
  if (!uniq.length) return [];
  const n = Math.min(size, uniq.length);
  const rounds = Math.ceil(uniq.length / n);
  const cycle = Math.floor(round / rounds);
  const order = seededShuffle(uniq, seed + cycle * 7919);
  const start = (round % rounds) * n;
  return order.slice(start, start + n);
}

export function levenshtein(a: string, b: string): number {
  const left = normalizeWord(a);
  const right = normalizeWord(b);
  const row = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[right.length];
}

export interface SearchOutcome {
  results: DictionaryEntry[];
  /** وقتی پیدا نشد و پیشنهاد املایی داریم */
  suggestion?: string;
}

const isLatin = (s: string) => /[a-z]/i.test(s);

/** جست‌وجوی فازی: پیشوند ← شامل ← معنی فارسی ← غلط رایج ← فاصلهٔ ویرایشی */
export function searchEntries(entries: DictionaryEntry[], query: string, limit = 50): SearchOutcome {
  const raw = query.trim();
  if (!raw) return { results: [] };
  const q = normalizeWord(raw);
  if (isLatin(q)) {
    const prefix = entries.filter((e) => normalizeWord(e.en).startsWith(q));
    const inner = entries.filter((e) => !normalizeWord(e.en).startsWith(q) && normalizeWord(e.en).includes(q));
    const direct = [...prefix.sort((a, b) => a.en.length - b.en.length), ...inner];
    if (direct.length) return { results: direct.slice(0, limit) };
    const typo = TYPOS[q];
    const fixed = typo && entries.find((e) => normalizeWord(e.en) === typo);
    const fuzzy = entries
      .map((e) => ({ e, d: levenshtein(e.en, q) }))
      .filter(({ e, d }) => d <= Math.max(1, Math.min(2, Math.floor(e.en.length / 3))))
      .sort((a, b) => a.d - b.d)
      .map(({ e }) => e);
    const results = fixed ? [fixed, ...fuzzy.filter((e) => e !== fixed)] : fuzzy;
    return { results: results.slice(0, limit), suggestion: results[0]?.en };
  }
  const fa = entries.filter((e) => e.fa.includes(raw));
  return { results: fa.slice(0, limit) };
}

/** فهرست شخصی را با مرکز و ترتیب ثابت فیلتر می‌کند (جست‌وجوی فهرست من) */
export function filterPersonal(words: WordRecord[], q: string, filter: "all" | "queue" | "batch" | "done", stage: number): WordRecord[] {
  const t = q.trim();
  const n = normalizeWord(t);
  return words.filter((w) => {
    if (t && !(normalizeWord(w.en).includes(n) || w.fa.includes(t))) return false;
    if (filter === "queue" && w.status !== "queued") return false;
    if (filter === "batch" && w.status !== "active") return false;
    if (filter === "done" && w.status !== "completed") return false;
    if (stage && w.stage !== stage) return false;
    return true;
  });
}

function uniqueId(words: WordRecord[], base: string): string {
  const ids = new Set(words.map((w) => w.id));
  if (!ids.has(base)) return base;
  let i = 2;
  while (ids.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

/* ───────────── داده‌های نمونه و مهاجرت ───────────── */

export const SAMPLE_BATCH_ID = "sample-batch-1";
const SAMPLE_AT = "2026-11-01T00:00:00.000Z";

const SAMPLE_PLAN: [id: string, status: WordStatus, stage: Stage | null, inBatch: boolean][] = [
  ["hesitate", "queued", null, false],
  ["vivid", "queued", null, false],
  ["thrive", "queued", null, false],
  ["serendipity", "active", 3, true],
  ["resilient", "completed", 5, true],
  ["ambiguous", "active", 2, true],
  ["reluctant", "active", 4, true],
  ["meticulous", "active", 1, true],
  ["curious", "completed", 5, true],
  ["gratitude", "completed", 5, true],
  ["mundane", "active", 1, true],
  ["eloquent", "active", 2, true],
  ["solitude", "active", 3, true],
  ["wander", "active", 4, true],
  ["fragile", "active", 2, true],
  ["humble", "completed", 5, false],
  ["persist", "completed", 5, false],
  ["subtle", "completed", 5, false],
  ["candid", "completed", 5, false],
  ["ephemeral", "completed", 5, false],
];

export function sampleState(): VocabState {
  const words: WordRecord[] = SAMPLE_PLAN.map(([id, status, stage, inBatch], i) => {
    const e = entryById(id)!;
    const at = new Date(Date.parse(SAMPLE_AT) + i * 60_000).toISOString();
    return {
      ...e, status, stage, batchId: inBatch ? SAMPLE_BATCH_ID : null, scheduledAt: null,
      addedAt: at, queuedAt: status === "queued" ? at : null, source: "sample",
    };
  });
  return { version: 2, words, currentBatchId: SAMPLE_BATCH_ID };
}

export function emptyState(): VocabState {
  return { version: 2, words: [], currentBatchId: null };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

/** خواندن امن دادهٔ ذخیره‌شده؛ نسخهٔ ۱ (واژه‌های دستی) به نسخهٔ ۲ منتقل می‌شود. */
export function parseStored(v2: unknown, v1: unknown): { state: VocabState; migrated: boolean } {
  if (isRecord(v2) && v2.version === 2 && Array.isArray(v2.words)) {
    const words = v2.words.filter(isValidRecord);
    return { state: { version: 2, words, currentBatchId: typeof v2.currentBatchId === "string" ? v2.currentBatchId : null }, migrated: false };
  }
  const base = sampleState();
  if (isRecord(v1) && Array.isArray(v1.words)) {
    let state = base;
    for (const w of v1.words) {
      if (!isRecord(w) || typeof w.en !== "string" || typeof w.fa !== "string" || w.source !== "manual") continue;
      const r = addToQueue(state, {
        id: slugify(w.en), en: w.en, fa: w.fa, ipa: String(w.ipa ?? ""), pos: String(w.pos ?? ""),
        exampleEn: String(w.exampleEn ?? ""), exampleFa: String(w.exampleFa ?? ""),
      }, "manual", typeof w.addedAt === "string" ? w.addedAt : SAMPLE_AT);
      state = r.state;
    }
    return { state, migrated: true };
  }
  return { state: base, migrated: false };
}

function isValidRecord(v: unknown): v is WordRecord {
  return isRecord(v) && typeof v.id === "string" && typeof v.en === "string" && typeof v.fa === "string" &&
    ["saved", "queued", "active", "completed"].includes(String(v.status));
}

export function removeSamples(state: VocabState): VocabState {
  const words = state.words.filter((w) => w.source !== "sample");
  const batchAlive = words.some((w) => w.batchId === state.currentBatchId);
  return { ...state, words, currentBatchId: batchAlive ? state.currentBatchId : null };
}

/** برگرداندن نمونه‌ها بدون دست زدن به واژه‌های کاربر */
export function restoreSamples(state: VocabState): VocabState {
  const sample = sampleState();
  const fresh = sample.words.filter((w) => !findWord(state.words, w.en));
  return { ...state, words: [...fresh, ...state.words], currentBatchId: state.currentBatchId ?? sample.currentBatchId };
}

export { DICTIONARY };
