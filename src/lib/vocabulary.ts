export type WordStatus = "active" | "queued" | "completed";
export type FreeRating = "forgot" | "hard" | "remembered" | "easy";
export type ThemeName = "grove" | "orbit" | "folio";

export interface WordRecord {
  id: string;
  en: string;
  fa: string;
  ipa: string;
  pos: string;
  exampleEn: string;
  exampleFa: string;
  status: WordStatus;
  /** Reserved until the product rules for the five learning stages are decided. */
  stage?: number;
  scheduledAt?: string | null;
  addedAt: string;
  source: "sample" | "manual";
}

export type WordDraft = Omit<WordRecord, "status" | "stage" | "scheduledAt" | "addedAt">;

export const CATALOG: WordDraft[] = [
  {
    id: "resilient", en: "resilient",
    fa: "تاب‌آور؛ توانا در بازگشت به حالت اول پس از سختی",
    ipa: "/rɪˈzɪl.i.ənt/", pos: "adjective",
    exampleEn: "Children are often more resilient than adults expect.",
    exampleFa: "کودکان اغلب از آنچه بزرگسالان انتظار دارند تاب‌آورترند.",
    source: "sample",
  },
  {
    id: "meticulous", en: "meticulous", fa: "بسیار دقیق و موشکاف",
    ipa: "/məˈtɪk.jə.ləs/", pos: "adjective",
    exampleEn: "She keeps meticulous records of every expense.",
    exampleFa: "او از هر هزینه‌ای سوابق دقیقی نگه می‌دارد.",
    source: "sample",
  },
  {
    id: "ephemeral", en: "ephemeral", fa: "زودگذر؛ چیزی که فقط مدتی کوتاه دوام می‌آورد",
    ipa: "/ɪˈfem.ər.əl/", pos: "adjective",
    exampleEn: "Fame can be ephemeral; yesterday’s star is today’s memory.",
    exampleFa: "شهرت می‌تواند زودگذر باشد؛ ستارهٔ دیروز، خاطرهٔ امروز است.",
    source: "sample",
  },
  {
    id: "candid", en: "candid", fa: "رک و صادق", ipa: "/ˈkæn.dɪd/", pos: "adjective",
    exampleEn: "I appreciate your candid feedback.",
    exampleFa: "از بازخورد صادقانه‌ات ممنونم.", source: "sample",
  },
  {
    id: "ubiquitous", en: "ubiquitous", fa: "همه‌جاحاضر؛ فراگیر",
    ipa: "/juːˈbɪk.wɪ.təs/", pos: "adjective",
    exampleEn: "Smartphones are now ubiquitous.",
    exampleFa: "گوشی هوشمند حالا همه‌جا هست.", source: "sample",
  },
  {
    id: "reluctant", en: "reluctant", fa: "بی‌میل؛ مردد", ipa: "/rɪˈlʌk.tənt/",
    pos: "adjective", exampleEn: "He was reluctant to share his plan.",
    exampleFa: "او برای گفتن نقشه‌اش بی‌میل بود.", source: "sample",
  },
  {
    id: "scarce", en: "scarce", fa: "کمیاب", ipa: "/skeəs/", pos: "adjective",
    exampleEn: "Water is scarce in the desert.", exampleFa: "در بیابان آب کمیاب است.",
    source: "sample",
  },
  {
    id: "vivid", en: "vivid", fa: "زنده و روشن؛ پرجزئیات", ipa: "/ˈvɪv.ɪd/",
    pos: "adjective", exampleEn: "She has vivid memories of that summer.",
    exampleFa: "او خاطرات روشنی از آن تابستان دارد.", source: "sample",
  },
  {
    id: "abundant", en: "abundant", fa: "فراوان", ipa: "/əˈbʌn.dənt/",
    pos: "adjective", exampleEn: "Fresh fruit is abundant in summer.",
    exampleFa: "میوهٔ تازه در تابستان فراوان است.", source: "sample",
  },
  {
    id: "fragile", en: "fragile", fa: "شکننده؛ آسیب‌پذیر", ipa: "/ˈfrædʒ.aɪl/",
    pos: "adjective", exampleEn: "The vase is very fragile.",
    exampleFa: "این گلدان بسیار شکننده است.", source: "sample",
  },
];

export const SEED_WORDS: WordRecord[] = CATALOG.slice(0, 4).map((word, index) => ({
  ...word,
  status: index === 3 ? "queued" : "active",
  addedAt: "2026-11-01T00:00:00.000Z",
}));

export function normalizeWord(value: string): string {
  return value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

export function makeWordId(value: string): string {
  return normalizeWord(value).replace(/[^a-z0-9 '-]/g, "").replace(/\s+/g, "-");
}

export function addWordToQueue(
  words: WordRecord[],
  candidate: WordDraft,
  addedAt = new Date().toISOString(),
): { words: WordRecord[]; added: boolean; existing?: WordRecord } {
  const key = normalizeWord(candidate.en);
  const existing = words.find((word) => normalizeWord(word.en) === key);
  if (existing) return { words, added: false, existing };
  const queued: WordRecord = {
    ...candidate,
    id: candidate.id || makeWordId(candidate.en),
    status: "queued",
    addedAt,
  };
  return { words: [...words, queued], added: true };
}

export function getPersonalWords(words: WordRecord[]): WordRecord[] {
  // Free Study deliberately includes queued, active, and completed words.
  return words;
}

export function canStartNextBatch(words: WordRecord[]): boolean {
  const activeBatch = words.filter((word) => word.status === "active");
  const hasQueued = words.some((word) => word.status === "queued");
  return hasQueued && activeBatch.length > 0 && activeBatch.every((word) => word.stage === 5);
}

export function applyFreePracticeRating(
  word: WordRecord,
  rating: FreeRating,
): { word: WordRecord; rating: FreeRating } {
  // Session-only: never change scheduling dates or batch progress here.
  return { word, rating };
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
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        diagonal + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return row[right.length];
}

export function searchWords(words: WordRecord[], query: string): WordRecord[] {
  const q = query.trim();
  if (!q) return [];
  const lower = normalizeWord(q);
  const exact = words.filter(
    (word) => normalizeWord(word.en).includes(lower) || word.fa.includes(q),
  );
  if (exact.length) return exact;
  return words
    .map((word) => ({ word, distance: levenshtein(word.en, q) }))
    .filter(({ word, distance }) => distance <= Math.min(2, Math.floor(word.en.length / 3)))
    .sort((a, b) => a.distance - b.distance)
    .map(({ word }) => word);
}