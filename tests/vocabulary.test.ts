import assert from "node:assert/strict";
import test from "node:test";
import {
  addWordToQueue,
  applyFreePracticeRating,
  canStartNextBatch,
  getPersonalWords,
  type WordRecord,
} from "../src/lib/vocabulary";

const word = (id: string, status: WordRecord["status"], stage?: number): WordRecord => ({
  id,
  en: id,
  fa: "معنی",
  ipa: "",
  pos: "word",
  exampleEn: "",
  exampleFa: "",
  status,
  stage,
  scheduledAt: "2026-11-04T08:00:00.000Z",
  addedAt: "2026-11-01T00:00:00.000Z",
  source: "manual",
});

test("queue insertion adds a new word once and keeps its queue state", () => {
  const candidate = {
    id: "serendipity",
    en: "serendipity",
    fa: "خوش‌اقبالی",
    ipa: "",
    pos: "word",
    exampleEn: "",
    exampleFa: "",
    source: "manual" as const,
  };
  const first = addWordToQueue([], candidate, "2026-11-01T00:00:00.000Z");
  assert.equal(first.added, true);
  assert.equal(first.words[0].status, "queued");
  assert.equal(first.words[0].addedAt, "2026-11-01T00:00:00.000Z");

  const duplicate = addWordToQueue(first.words, { ...candidate, en: " SERENDIPITY " });
  assert.equal(duplicate.added, false);
  assert.equal(duplicate.words.length, 1);
  assert.equal(duplicate.existing?.id, "serendipity");
});

test("free practice includes queued, active, and completed words", () => {
  const all = [word("one", "active"), word("two", "queued"), word("three", "completed")];
  assert.deepEqual(getPersonalWords(all), all);
});

test("free practice ratings do not change status, batch stage, or schedule", () => {
  const before = word("remember", "active", 2);
  for (const rating of ["forgot", "hard", "remembered", "easy"] as const) {
    const result = applyFreePracticeRating(before, rating);
    assert.equal(result.word, before);
    assert.equal(result.rating, rating);
    assert.equal(result.word.scheduledAt, before.scheduledAt);
    assert.equal(result.word.stage, 2);
  }
});

test("next batch remains blocked until every active word reaches stage five", () => {
  assert.equal(
    canStartNextBatch([word("a", "active", 5), word("b", "active", 4), word("c", "queued")]),
    false,
  );
  assert.equal(
    canStartNextBatch([word("a", "active", 5), word("b", "active", 5), word("c", "queued")]),
    true,
  );
  assert.equal(canStartNextBatch([word("a", "active", 5)]), false);
  assert.equal(canStartNextBatch([word("c", "queued")]), false);
});