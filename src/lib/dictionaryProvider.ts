// مرز ارائه‌دهندهٔ واژه‌نامه. اکنون فقط واژه‌نامهٔ نمونهٔ محلی وصل است؛
// ارائه‌دهندهٔ واقعی (سمت سرور، دارای مجوز) بعداً همین رابط را پیاده می‌کند.

import { DICTIONARY, entryById, type DictionaryEntry } from "./dictionary";
import { searchEntries, type SearchOutcome } from "./vocabulary";

export interface DictionaryProvider {
  readonly id: string;
  readonly label: string;
  search(query: string, signal?: AbortSignal): Promise<SearchOutcome>;
  lookup(idOrWord: string, signal?: AbortSignal): Promise<DictionaryEntry | null>;
  size(): number;
}

export const localSampleProvider: DictionaryProvider = {
  id: "local-sample",
  label: "واژه‌نامهٔ نمونهٔ محلی",
  async search(query) {
    return searchEntries(DICTIONARY, query);
  },
  async lookup(idOrWord) {
    const key = idOrWord.trim().toLowerCase();
    return entryById(key) ?? DICTIONARY.find((e) => e.en.toLowerCase() === key) ?? null;
  },
  size: () => DICTIONARY.length,
};

let entryCount = 0;
export const dictionary: DictionaryProvider = {
 id: "open-server", label: "ویکی‌واژه · دادهٔ آزاد با ذکر منبع",
 async search(query, signal) {
  const r=await fetch(`/api/dictionary?q=${encodeURIComponent(query)}`,{signal});
  if(!r.ok)throw new Error("Dictionary unavailable");
  const data=await r.json();entryCount=data.count;return data;
 },
 async lookup(idOrWord,signal) {
  const r=await fetch(`/api/dictionary?id=${encodeURIComponent(idOrWord)}`,{signal});
  if(!r.ok)throw new Error("Dictionary unavailable");
  const data=await r.json();entryCount=data.count;return data.entry;
 },
 size:()=>entryCount,
};
