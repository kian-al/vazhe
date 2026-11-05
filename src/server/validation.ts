import type { VocabState, WordRecord } from '@/lib/vocabulary';
const statuses = new Set(['saved','queued','active','completed']);
const sources = new Set(['sample','dictionary','manual','library']);
const text = (x: unknown, max: number) => typeof x === 'string' && x.length <= max && !/[\u0000-\u0008]/.test(x);
/** Reject, don't silently repair a malformed write. Resource bounds are not study limits. */
export function validState(value: unknown): value is VocabState {
 if (!value || typeof value !== 'object') return false;
 const s = value as VocabState;
 if (s.version !== 2 || !Array.isArray(s.words) || s.words.length > 20000 || !(s.currentBatchId === null || text(s.currentBatchId,128))) return false;
 const ids = new Set<string>(), normalized = new Set<string>();
 for (const w of s.words as WordRecord[]) {
  if (!w || !text(w.id,160) || !w.id || !text(w.en,120) || !w.en.trim() || !text(w.fa,1000) || !text(w.ipa,200) || !text(w.pos,100) || !text(w.exampleEn,2000) || !text(w.exampleFa,2000)) return false;
  const norm=w.en.trim().toLowerCase().replace(/\s+/g,' ');
  if(ids.has(w.id)||normalized.has(norm)||!statuses.has(w.status)||!sources.has(w.source))return false;
  if(w.stage != null && (!Number.isInteger(w.stage)||w.stage<1||w.stage>5))return false;
  if(!text(w.addedAt,40)||!Number.isFinite(Date.parse(w.addedAt)))return false;
  if(w.batchId != null && !text(w.batchId,128))return false;
  if(w.review !== undefined) {
   const r=w.review, c=r?.card;
   if(!r || r.model!=='FSRS-6' || !['forgot','hard','good','easy'].includes(r.lastRating) || !c || !text(c.cardId,100) || !text(c.dueAt,40) || !Number.isFinite(Date.parse(c.dueAt)) || (c.lastReviewAt !== null && (!text(c.lastReviewAt,40) || !Number.isFinite(Date.parse(c.lastReviewAt)))))return false;
   if(![0,1,2,3].includes(c.state) || !['new','learning','review','relearning'].includes(c.scheduleStatus))return false;
   if(![c.stability,c.difficulty,c.reps,c.lapses,c.scheduledDays,c.learningStep].every(n=>typeof n==='number' && Number.isFinite(n) && n>=0 && n<=1e9))return false;
  }

  for(const d of [w.queuedAt,w.scheduledAt])if(d != null && (!text(d,40)||!Number.isFinite(Date.parse(d))))return false;
  ids.add(w.id);normalized.add(norm);
 }
 return s.words.filter(w=>w.batchId && w.batchId===s.currentBatchId).length<=100;
}
