"use client";
import { useEffect, useState } from "react";
import type { DictionaryEntry } from "./dictionary";
export type CoverTheme = "alice" | "prince" | "amber" | "teal" | "indigo";
export type LibraryChapter = { id: string; title: string; wordIds: string[]; entries: DictionaryEntry[] };
export type LibraryBook = { id: string; title: string; fa?: string; author: string; license: string; source: string; cover?: CoverTheme; emblem?: string; collection: "series" | "classics"; note: string; chapters: LibraryChapter[] };
export function useLibrary() {
  const [books,setBooks]=useState<LibraryBook[]>([]);
  const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
  const [attempt,setAttempt]=useState(0);
  useEffect(() => { const ctrl=new AbortController(); setStatus("loading"); fetch("/api/library",{signal:ctrl.signal}).then(r=>{ if(!r.ok) throw Error(); return r.json(); }).then(data=>{setBooks(data.books);setStatus("ready")}).catch(()=>{if(!ctrl.signal.aborted)setStatus("error")}); return ()=>ctrl.abort(); },[attempt]);
  return {books,status,retry:()=>setAttempt(n=>n+1)};
}
