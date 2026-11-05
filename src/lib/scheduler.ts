// مرور زمان‌بندی‌شده = FSRS-6 (کتابخانهٔ آزاد ts-fsrs) + قانون پنج مرحلهٔ دسته.
//
// تصمیم محصول (همه در همین فایل، با تست):
// - فقط واژه‌های «دستهٔ فعال» مرور زمان‌بندی‌شده دارند. با ساخت دسته، هر واژه در مرحلهٔ ۱ است
//   و اولین مرورش همان لحظه موعد دارد.
// - «یادم بود» یا «آسان بود» ← یک مرحله جلو؛ موفقیت در مرحلهٔ ۵ = تکمیل واژه.
//   «سخت بود» ← همان مرحله.  «فراموش کردم» ← یک مرحله عقب (کمترین ۱) و ۱۰ دقیقه بعد مرور جبرانی.
// - مرور جبرانی (پس از فراموشی) مرحله را جلو نمی‌برد؛ فقط واژه را به برنامهٔ عادی برمی‌گرداند.
// - فاصله‌ها را FSRS تعیین می‌کند، با سقف ۱۰ روز تا دسته‌ها طولانی نشوند:
//   در بهترین حالت واژه حدود ۳۳ روز بعد (۵ مرور موفق) تکمیل می‌شود.
// - مطالعهٔ آزاد هیچ‌کدام از این‌ها را تغییر نمی‌دهد.
import { DefaultScheduler, Rating, type DefaultSchedulerCard, type DefaultSchedulerCardInput } from 'ts-fsrs';
import type { FreeRating, Stage, WordRecord } from './vocabulary';

type Card = DefaultSchedulerCard<'FSRS-6'>;
export type StoredCard = Omit<Card, 'dueAt'|'lastReviewAt'> & { dueAt: string; lastReviewAt: string|null };
export interface ReviewMemory { model: 'FSRS-6'; card: StoredCard; lastRating: FreeRating; }
export const MAX_INTERVAL_DAYS = 10;
const RELEARNING = 3; // State.Relearning
const ratings = {forgot:Rating.Again, hard:Rating.Hard, good:Rating.Good, easy:Rating.Easy} as const;
const scheduler = DefaultScheduler({version:'FSRS-6', desiredRetention:0.9, enableFuzz:false, maximumInterval:MAX_INTERVAL_DAYS, learningSteps:[]});

/** فقط واژه‌های دستهٔ فعال موعد دارند؛ واژهٔ تازهٔ دسته بلافاصله موعد دارد */
export function isDue(w: WordRecord, now: number): boolean {
 return w.status === 'active' && (!w.review || Date.parse(w.review.card.dueAt) <= now);
}
export async function scheduleReview(previous: ReviewMemory|undefined, rating: FreeRating, now = new Date()): Promise<ReviewMemory> {
 const s = await scheduler;
 const card: DefaultSchedulerCardInput<'FSRS-6'> = previous ? {...previous.card, dueAt:new Date(previous.card.dueAt), lastReviewAt:previous.card.lastReviewAt ? new Date(previous.card.lastReviewAt):null} : s.newCard({now});
 const next = s.review({card, grade:ratings[rating], now}).card;
 return { model:'FSRS-6', card:{...next, dueAt:next.dueAt.toISOString(), lastReviewAt:next.lastReviewAt?.toISOString() ?? null}, lastRating:rating };
}
/** پیش‌نمایش فاصلهٔ هر امتیاز (به روز) برای نمایش روی دکمه‌ها */
export async function previewDays(previous: ReviewMemory|undefined, now = new Date()): Promise<Record<FreeRating, number>> {
 const out = {} as Record<FreeRating, number>;
 for (const r of Object.keys(ratings) as FreeRating[]) {
  const m = await scheduleReview(previous, r, now);
  out[r] = Math.max(0, (Date.parse(m.card.dueAt) - now.getTime()) / 86_400_000);
 }
 return out;
}
export interface StageChange { stage: Stage; completed: boolean }
/** قانون مرحله؛ wasRelearning = این مرور، مرور جبرانیِ بعد از فراموشی بود */
export function nextStage(stage: Stage, rating: FreeRating, wasRelearning = false): StageChange {
 if (rating === 'forgot') return { stage: Math.max(1, stage - 1) as Stage, completed: false };
 if (rating === 'hard' || wasRelearning) return { stage, completed: false };
 return stage >= 5 ? { stage: 5, completed: true } : { stage: (stage + 1) as Stage, completed: false };
}
export const isRelearning = (m: ReviewMemory|undefined) => m?.card.state === RELEARNING;
