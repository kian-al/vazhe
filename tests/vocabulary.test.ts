import assert from "node:assert/strict";
import test from "node:test";
import { DICTIONARY, BOOKS, entryById } from "../src/lib/dictionary";
import {
  addManyToQueue, addToQueue, applyFreePracticeRating, batchOf, canStartNextBatch, countFresh,
  emptyState, freeStudyRound, getPersonalWords, isBatchComplete, parseStored, queueOf, removeFromQueue,
  removeSamples, requeue, sampleState, searchEntries, statusKey, type VocabState, type WordRecord,
} from "../src/lib/vocabulary";

const e = (id: string) => entryById(id)!;

test("adding to the queue deduplicates by normalized English form", () => {
  const first = addToQueue(emptyState(), e("vivid"), "dictionary", "2026-11-01T00:00:00.000Z");
  assert.equal(first.added, true);
  assert.equal(first.state.words[0].status, "queued");
  const dup = addToQueue(first.state, { ...e("vivid"), id: "other", en: "  VIVID " });
  assert.equal(dup.added, false);
  assert.equal(dup.existing?.id, "vivid");
  assert.equal(dup.state.words.length, 1);
});

test("adding a chapter reports fresh and duplicate counts and never duplicates", () => {
  const chapter = BOOKS[0].chapters[0].wordIds.map(e);
  const start = addToQueue(emptyState(), chapter[0]).state;
  assert.deepEqual(countFresh(start.words, chapter), { fresh: chapter.length - 1, duplicates: 1, total: chapter.length });
  const r = addManyToQueue(start, [...chapter, chapter[1]]);
  assert.equal(r.added, chapter.length - 1);
  assert.equal(r.duplicates, 2);
  assert.equal(new Set(r.state.words.map((w) => w.en)).size, r.state.words.length);
});

test("queue keeps insertion order; removing keeps the word in the personal list", () => {
  let s = emptyState();
  s = addToQueue(s, e("vivid"), "dictionary", "2026-11-01T00:00:01.000Z").state;
  s = addToQueue(s, e("candid"), "dictionary", "2026-11-01T00:00:02.000Z").state;
  assert.deepEqual(queueOf(s.words).map((w) => w.id), ["vivid", "candid"]);
  s = removeFromQueue(s, "vivid");
  assert.equal(s.words.length, 2);
  assert.equal(statusKey(s.words.find((w) => w.id === "vivid")), "mine");
  s = requeue(s, "vivid", "2026-11-01T00:00:03.000Z");
  assert.deepEqual(queueOf(s.words).map((w) => w.id), ["candid", "vivid"]);
});

test("free study includes saved, queued, active and completed words", () => {
  const s = sampleState();
  const statuses = new Set(getPersonalWords(s.words).map((w) => w.status));
  for (const st of ["queued", "active", "completed"]) assert.ok(statuses.has(st as WordRecord["status"]));
  assert.equal(getPersonalWords(s.words).length, s.words.length);
});

test("free study rounds cover every personal word before repeating and have no cap", () => {
  const ids = DICTIONARY.map((d) => d.id);
  const rounds = Math.ceil(ids.length / 10);
  const seen = new Set<string>();
  for (let r = 0; r < rounds; r += 1) for (const id of freeStudyRound(ids, r, 42)) seen.add(id);
  assert.equal(seen.size, ids.length);
  assert.equal(freeStudyRound(ids, rounds * 5 + 3, 42).length > 0, true);
  assert.deepEqual(freeStudyRound(["a", "a", "b"], 0, 1).sort(), ["a", "b"]);
});

test("free practice ratings never change status, stage, or schedule", () => {
  const before: WordRecord = { ...sampleState().words[3], scheduledAt: "2026-11-04T08:00:00.000Z" };
  for (const rating of ["forgot", "hard", "good", "easy"] as const) {
    const r = applyFreePracticeRating(before, rating);
    assert.equal(r.word, before);
    assert.equal(r.word.scheduledAt, before.scheduledAt);
    assert.equal(r.word.stage, before.stage);
    assert.equal(r.word.status, before.status);
  }
});

test("next batch stays locked until every current batch member passed stage five", () => {
  const s = sampleState();
  assert.equal(isBatchComplete(s), false);
  assert.equal(canStartNextBatch(s), false);
  const done: VocabState = { ...s, words: s.words.map((w) => (w.batchId === s.currentBatchId ? { ...w, status: "completed", stage: 5 } : w)) };
  assert.equal(isBatchComplete(done), true);
  assert.equal(canStartNextBatch(done), true);
  const noQueue: VocabState = { ...done, words: done.words.filter((w) => w.status !== "queued") };
  assert.equal(canStartNextBatch(noQueue), false);
  assert.ok(batchOf(s).length <= 100);
});

test("search: prefix first, Persian meaning, typo suggestion and fuzzy match", () => {
  assert.equal(searchEntries(DICTIONARY, "cur").results[0].en, "curious");
  assert.ok(searchEntries(DICTIONARY, "کنجکاو").results.some((r) => r.en === "curious"));
  const typo = searchEntries(DICTIONARY, "recieve");
  assert.equal(typo.suggestion, "receive");
  assert.equal(searchEntries(DICTIONARY, "lantren").results[0]?.en, "lantern");
  assert.equal(searchEntries(DICTIONARY, "zzqxv").results.length, 0);
  assert.equal(searchEntries(DICTIONARY, "  ").results.length, 0);
});

test("stored data: v2 is read, v1 manual words migrate, garbage falls back to samples", () => {
  const s = sampleState();
  assert.equal(parseStored(s, null).state.words.length, s.words.length);
  const migrated = parseStored(null, { words: [{ en: "Kindle", fa: "روشن کردن", source: "manual", status: "queued", id: "kindle" }] });
  assert.equal(migrated.migrated, true);
  assert.ok(migrated.state.words.some((w) => w.en === "Kindle" && w.status === "queued"));
  assert.equal(parseStored("nope", 3).state.words.length, s.words.length);
  const cleaned = removeSamples(migrated.state);
  assert.deepEqual(cleaned.words.map((w) => w.en), ["Kindle"]);
  assert.equal(cleaned.currentBatchId, null);
});

test("library chapters only reference existing dictionary entries", () => {
  for (const b of BOOKS) for (const c of b.chapters) for (const id of c.wordIds) assert.ok(entryById(id), id);
});
