"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DictionaryEntry } from "@/lib/dictionary";
import {
  addManyToQueue, addToQueue, batchOf, deleteWord, emptyState, findWord, parseStored, queueOf,
  removeFromQueue, removeSamples, requeue, restoreSamples as restoreSampleWords, sampleState, type VocabState, type WordRecord, type WordSource,
} from "@/lib/vocabulary";

// ذخیره‌سازی فعلی فقط localStorage همین مرورگر است — نه پایگاه دادهٔ سروری یا همگام‌سازی.
const KEY_V2 = "vazhe.local.v2";
const KEY_V1 = "vazhe.local.v1";
const RECENT_KEY = "vazhe.recent.v1";

export type Toast = { id: number; text: string; kind: "ok" | "warn" };

interface Ctx {
  state: VocabState;
  words: WordRecord[];
  queue: WordRecord[];
  batch: WordRecord[];
  ready: boolean;
  storageError: boolean;
  online: boolean;
  toast: Toast | null;
  bump: number;
  dupe: string | null;
  recent: string[];
  hasSamples: boolean;
  notify: (text: string, kind?: Toast["kind"]) => void;
  byEn: (en: string) => WordRecord | undefined;
  add: (entry: DictionaryEntry, source?: WordSource) => boolean;
  addMany: (entries: DictionaryEntry[]) => { added: number; duplicates: number };
  unqueue: (id: string) => void;
  requeueWord: (id: string) => void;
  remove: (id: string) => void;
  clearSamples: () => void;
  restoreSamples: () => void;
  pushRecent: (q: string) => void;
}

const C = createContext<Ctx | null>(null);

function read(key: string): unknown {
  const raw = window.localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VocabState>(emptyState);
  const ref = useRef<VocabState>(state);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [online, setOnline] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [bump, setBump] = useState(0);
  const [dupe, setDupe] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);

  const commit = useCallback((next: VocabState) => {
    ref.current = next;
    setState(next);
    try {
      window.localStorage.setItem(KEY_V2, JSON.stringify(next));
    } catch {
      setStorageError(true);
    }
  }, []);

  useEffect(() => {
    let loaded: VocabState;
    try {
      const { state: s } = parseStored(read(KEY_V2), read(KEY_V1));
      loaded = s;
      window.localStorage.setItem(KEY_V2, JSON.stringify(s));
      const r = read(RECENT_KEY);
      if (Array.isArray(r)) setRecent(r.filter((x): x is string => typeof x === "string").slice(0, 6));
    } catch {
      loaded = sampleState();
      setStorageError(true);
    }
    ref.current = loaded;
    setState(loaded);
    setReady(true);
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const sync = (e: StorageEvent) => {
      if (e.key !== KEY_V2 || !e.newValue) return;
      try {
        const s = parseStored(JSON.parse(e.newValue), null).state;
        ref.current = s;
        setState(s);
      } catch { /* نادیده بگیر */ }
    };
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = useCallback((text: string, kind: Toast["kind"] = "ok") => setToast({ id: Date.now() + Math.random(), text, kind }), []);

  const add = useCallback((entry: DictionaryEntry, source: WordSource = "dictionary") => {
    const r = addToQueue(ref.current, entry, source);
    if (!r.added) {
      setDupe(r.existing?.id ?? null);
      notify("این واژه از قبل در فهرست شماست؛ دوباره اضافه نشد.", "warn");
      return false;
    }
    commit(r.state);
    setDupe(null);
    setBump((b) => b + 1);
    notify(`«${entry.en}» وارد صف شد.`);
    return true;
  }, [commit, notify]);

  const addMany = useCallback((entries: DictionaryEntry[]) => {
    const r = addManyToQueue(ref.current, entries);
    if (r.added) { commit(r.state); setBump((b) => b + 1); }
    notify(
      r.added ? `${r.added.toLocaleString("fa-IR")} واژهٔ تازه وارد صف شد${r.duplicates ? `؛ ${r.duplicates.toLocaleString("fa-IR")} تکراری رد شد` : ""}.` : "همهٔ این واژه‌ها از قبل در فهرست شما هستند.",
      r.added ? "ok" : "warn",
    );
    return { added: r.added, duplicates: r.duplicates };
  }, [commit, notify]);

  const unqueue = useCallback((id: string) => { commit(removeFromQueue(ref.current, id)); notify("از صف برداشته شد؛ در فهرست شما می‌ماند."); }, [commit, notify]);
  const requeueWord = useCallback((id: string) => { commit(requeue(ref.current, id)); setBump((b) => b + 1); notify("دوباره به انتهای صف رفت."); }, [commit, notify]);
  const remove = useCallback((id: string) => { commit(deleteWord(ref.current, id)); notify("واژه از فهرست شما حذف شد."); }, [commit, notify]);
  const clearSamples = useCallback(() => { commit(removeSamples(ref.current)); notify("واژه‌های نمونه حذف شدند؛ واژه‌های خودت سر جایشان‌اند."); }, [commit, notify]);
  const restoreSamples = useCallback(() => {
    commit(restoreSampleWords(ref.current));
    notify("واژه‌های نمونه برگشتند.");
  }, [commit, notify]);
  const pushRecent = useCallback((q: string) => {
    const t = q.trim();
    if (!t) return;
    setRecent((r) => {
      const next = [t, ...r.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6);
      try { window.localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* اختیاری */ }
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(() => ({
    state, words: state.words, queue: queueOf(state.words), batch: batchOf(state), ready, storageError, online, toast, bump, dupe, recent,
    hasSamples: state.words.some((w) => w.source === "sample"),
    notify, byEn: (en: string) => findWord(state.words, en), add, addMany, unqueue, requeueWord, remove, clearSamples, restoreSamples, pushRecent,
  }), [state, ready, storageError, online, toast, bump, dupe, recent, notify, add, addMany, unqueue, requeueWord, remove, clearSamples, restoreSamples, pushRecent]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("AppProvider missing");
  return c;
}

/** چیدمان دسکتاپ از ۱۰۲۴ پیکسل به بالا */
export function useIsDesktop(): boolean {
  const [d, setD] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const f = () => setD(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return d;
}
