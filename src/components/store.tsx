"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DictionaryEntry } from "@/lib/dictionary";
import { isRelearning, nextStage, scheduleReview } from "@/lib/scheduler";
import type { FreeRating } from "@/lib/vocabulary";
import {
  addManyToQueue, addToQueue, applyReview, batchOf, canStartNextBatch, isBatchComplete, startBatch as startBatchRule, deleteWord, emptyState, findWord, parseStored, queueOf,
  removeFromQueue, removeSamples, requeue, restoreSamples as restoreSampleWords, sampleState, type VocabState, type WordRecord, type WordSource,
} from "@/lib/vocabulary";

// ذخیره‌سازی: پایگاه دادهٔ سرور (Postgres از طریق /api/state) + نسخهٔ پشتیبان در localStorage همین مرورگر.
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
  syncStatus: "loading" | "local" | "saved" | "saving" | "error" | "conflict";
  retrySync: () => void;
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
  reviewWord: (id: string, rating: FreeRating) => Promise<{ stage: number; completed: boolean }>;
  canStart: boolean;
  startBatch: () => number;
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
  const [syncStatus, setSyncStatus] = useState<Ctx["syncStatus"]>("loading");
  const mode=useRef<"local"|"server"|"blocked">("local");
  const revision=useRef(0);
  const pending=useRef(false);
  const writing=useRef(false);
  const blocked=useRef(false);
  const flushRef=useRef<()=>Promise<void>>(async()=>{});
  const flush=useCallback(async()=>{
    if(mode.current!=="server"||writing.current||blocked.current||!pending.current)return;
    writing.current=true;setSyncStatus("saving");
    try {
      while(pending.current){
        const snapshot=ref.current;
        const response=await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({state:snapshot,revision:revision.current})});
        if(!response.ok){
          if(response.status===409){blocked.current=true;setSyncStatus("conflict");}
          else setSyncStatus("error");
          return;
        }
        const result=await response.json();revision.current=result.revision;
        pending.current=ref.current!==snapshot;
        try { window.localStorage.setItem("vazhe.server.pending",JSON.stringify({pending:pending.current,revision:revision.current})); }catch{}
      }
      setSyncStatus("saved");
    }catch{setSyncStatus("error");}finally{writing.current=false;}
  },[]);
  flushRef.current=flush;
  const retrySync=useCallback(()=>{if(mode.current==="blocked")window.location.reload();else if(!blocked.current)void flushRef.current();},[]);
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
    if(mode.current==="blocked") {
      pending.current=true;
      try{window.localStorage.setItem("vazhe.server.pending",JSON.stringify({pending:true,revision:null}));}catch{}
      setSyncStatus("error");
    }
    if(mode.current==="server") {pending.current=true;
      try{window.localStorage.setItem("vazhe.server.pending",JSON.stringify({pending:true,revision:revision.current}));}catch{}
      void flushRef.current();
    }
  }, []);

  useEffect(() => {
    let loaded: VocabState;
    let hadLocal=false;
    try {
      const previous=read(KEY_V2),legacy=read(KEY_V1);
      hadLocal=Boolean(previous||legacy);
      const { state: s } = parseStored(previous, legacy);
      loaded = s;
      const r = read(RECENT_KEY);
      if (Array.isArray(r)) setRecent(r.filter((x): x is string => typeof x === "string").slice(0, 6));
    } catch {
      loaded = sampleState();
      setStorageError(true);
    }
    ref.current = loaded;
    setState(loaded);
    let alive=true;
    fetch("/api/state",{cache:"no-store"}).then(async r=>{
      if(!r.ok)throw new Error("Server unavailable");
      const d=await r.json();if(!alive)return;
      if(d.mode==="server"){
        mode.current="server";revision.current=d.revision;
        let outbox:{pending?:boolean;revision?:number}={};
        try{outbox=read("vazhe.server.pending") as typeof outbox||{};}catch{}
        if(outbox.pending && outbox.revision!==d.revision){
          blocked.current=true;setSyncStatus("conflict");
          // Retain this browser's unsynced work; never overwrite either side.
        }else if(outbox.pending || (d.revision===0 && hadLocal && loaded.words.length>0)){
          pending.current=true;void flushRef.current();
        }else{
          ref.current=d.state;setState(d.state);setSyncStatus("saved");
          try{window.localStorage.setItem(KEY_V2,JSON.stringify(d.state));}catch{setStorageError(true);}
        }
      }else {
        mode.current="local";setSyncStatus("local");
        try{window.localStorage.setItem(KEY_V2,JSON.stringify(loaded));}catch{setStorageError(true);}
      }
      setReady(true);
    }).catch(()=>{
      if(!alive)return;
      mode.current="blocked";setSyncStatus("error");setReady(true);
    });
    setOnline(navigator.onLine);
    const on = () => {setOnline(true);void flushRef.current();};
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const sync = (e: StorageEvent) => {
      if(mode.current!=="local")return; // Server revisions protect cross-tab writes.
      if (e.key !== KEY_V2 || !e.newValue) return;
      try {
        const s = parseStored(JSON.parse(e.newValue), null).state;
        ref.current = s;
        setState(s);
      } catch { /* نادیده بگیر */ }
    };
    window.addEventListener("storage", sync);
    const guard=(e:BeforeUnloadEvent)=>{if(pending.current){e.preventDefault();e.returnValue="";}};
    window.addEventListener("beforeunload",guard);
    return () => {
      alive=false;
      window.removeEventListener("beforeunload",guard);
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

  const reviewWord = useCallback(async (id: string, rating: FreeRating) => {
    const original = ref.current.words.find(w => w.id === id);
    if (!original) throw new Error("word_not_found");
    if (original.status !== "active") throw new Error("not_in_batch");
    const review = await scheduleReview(original.review, rating);
    const current = ref.current.words.find(w => w.id === id);
    if (!current || current.review !== original.review) throw new Error("review_changed");
    const change = nextStage(original.stage ?? 1, rating, isRelearning(original.review));
    const next = applyReview(ref.current, id, review, change);
    commit(next);
    if (change.completed) {
      if (isBatchComplete(next)) notify("همهٔ واژه‌های این دسته تکمیل شد! حالا می‌توانی دستهٔ تازه بسازی.");
      else notify(`«${original.en}» مرحلهٔ ۵ را گذراند و تکمیل شد.`);
    }
    return change;
  }, [commit, notify]);
  const startBatch = useCallback(() => {
    const r = startBatchRule(ref.current, `batch-${Date.now().toString(36)}`);
    if (!r) { notify("فعلاً نمی‌شود دستهٔ تازه ساخت: یا صف خالی است یا دستهٔ فعلی کامل نشده.", "warn"); return 0; }
    commit(r.state);
    setBump((b) => b + 1);
    notify(`دستهٔ تازه با ${r.count.toLocaleString("fa-IR")} واژه ساخته شد؛ اولین مرورها آماده‌اند.`);
    return r.count;
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
    state, words: state.words, queue: queueOf(state.words), batch: batchOf(state), ready, storageError, syncStatus, retrySync, online, toast, bump, dupe, recent,
    hasSamples: state.words.some((w) => w.source === "sample"),
    notify, byEn: (en: string) => findWord(state.words, en), add, addMany, reviewWord, canStart: canStartNextBatch(state), startBatch, unqueue, requeueWord, remove, clearSamples, restoreSamples, pushRecent,
  }), [state, ready, storageError, syncStatus, retrySync, online, toast, bump, dupe, recent, notify, add, addMany, reviewWord, startBatch, unqueue, requeueWord, remove, clearSamples, restoreSamples, pushRecent]);

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
