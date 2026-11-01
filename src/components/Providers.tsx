"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import {
  addWordToQueue, makeWordId, SEED_WORDS,
  type ThemeName, type WordDraft, type WordRecord,
} from "@/lib/vocabulary";

const STORE_KEY = "vazhe.local.v1";
const THEME_KEY = "vazhe.theme.v1";

interface AppContextValue {
  words: WordRecord[];
  ready: boolean;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  addToQueue: (word: WordDraft) => { added: boolean; existing?: WordRecord };
  addManualWord: (draft: Pick<WordDraft, "en" | "fa"> & Partial<WordDraft>) => {
    added: boolean;
    existing?: WordRecord;
  };
}

const AppContext = createContext<AppContextValue | null>(null);

function isWordRecord(value: unknown): value is WordRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<WordRecord>;
  return typeof item.en === "string" &&
    typeof item.fa === "string" &&
    typeof item.id === "string" &&
    ["active", "queued", "completed"].includes(item.status ?? "");
}

export function Providers({ children }: { children: ReactNode }) {
  const [words, setWords] = useState<WordRecord[]>([]);
  const wordsRef = useRef<WordRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [theme, setThemeState] = useState<ThemeName>("grove");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        const savedWords = parsed && typeof parsed === "object"
          ? (parsed as { words?: unknown }).words
          : null;
        const initialWords = Array.isArray(savedWords) && savedWords.every(isWordRecord)
          ? savedWords
          : SEED_WORDS;
        wordsRef.current = initialWords;
        setWords(initialWords);
      } else {
        wordsRef.current = SEED_WORDS;
        setWords(SEED_WORDS);
      }
      const storedTheme = window.localStorage.getItem(THEME_KEY);
      if (storedTheme === "grove" || storedTheme === "orbit" || storedTheme === "folio") {
        setThemeState(storedTheme);
      }
    } catch {
      wordsRef.current = SEED_WORDS;
      setWords(SEED_WORDS);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, words }));
    } catch {
      // Keep the page usable if browser storage is disabled or full.
    }
  }, [ready, words]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Theme selection still applies for this page view.
    }
  }, [theme]);

  const addToQueue = useCallback((candidate: WordDraft) => {
    const result = addWordToQueue(wordsRef.current, candidate);
    if (!result.added) return { added: false, existing: result.existing };
    wordsRef.current = result.words;
    setWords(result.words);
    return { added: true };
  }, []);

  const addManualWord = useCallback(
    (draft: Pick<WordDraft, "en" | "fa"> & Partial<WordDraft>) => {
      const en = draft.en.trim();
      return addToQueue({
        id: makeWordId(en),
        en,
        fa: draft.fa.trim(),
        ipa: draft.ipa?.trim() || "",
        pos: draft.pos?.trim() || "word",
        exampleEn: draft.exampleEn?.trim() || "",
        exampleFa: draft.exampleFa?.trim() || "",
        source: "manual",
      });
    },
    [addToQueue],
  );

  const value = useMemo(
    () => ({
      words,
      ready,
      theme,
      setTheme: (nextTheme: ThemeName) => setThemeState(nextTheme),
      addToQueue,
      addManualWord,
    }),
    [words, ready, theme, addToQueue, addManualWord],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside Providers");
  return value;
}