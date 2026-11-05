"""ساخت واژه‌نامهٔ آزاد واژه از داده‌های رایگان اینترنت.

منابع (همه رایگان؛ مجوزها در صفحهٔ /about آمده است):
- ویکی‌واژهٔ انگلیسی از طریق kaikki.org (wiktextract) — CC BY-SA 4.0 / GFDL
  * مدخل‌های انگلیسی: نقش دستوری، IPA، تعریف انگلیسی، مثال، ترجمه‌های فارسی
  * مدخل‌های فارسی: معکوس‌کردن تعریف‌های انگلیسی برای پیدا کردن معادل فارسی
- Tatoeba — CC BY 2.0 FR: جمله‌های انگلیسی با ترجمهٔ فارسی برای مثال
- FrequencyWords (Hermit Dave، بر پایهٔ OpenSubtitles) — CC BY-SA 4.0: رتبهٔ بسامد

ورودی‌ها (در DICT_SRC، پیش‌فرض /data/dictsrc):
  en_filtered.jsonl  ← خروجی فیلتر kaikki انگلیسی (scripts/dictionary/filter_kaikki.py)
  fa.jsonl           ← https://kaikki.org/dictionary/Persian/kaikki.org-dictionary-Persian.jsonl
  en_50k.txt, fa_50k.txt ← FrequencyWords 2018
  pes-eng_links.tsv.bz2, pes_sentences.tsv.bz2, eng_sentences.tsv.bz2 ← downloads.tatoeba.org/exports/per_language
خروجی: dictionary.jsonl (یک مدخل در هر خط، همان ستون‌های جدول dictionary_entries)
"""
import bz2, collections, json, os, re, sys

SRC = os.environ.get("DICT_SRC", "/data/dictsrc")
P = lambda f: os.path.join(SRC, f)

POS_FA = {"noun": "اسم", "verb": "فعل", "adj": "صفت", "adv": "قید", "prep": "حرف اضافه", "pron": "ضمیر",
          "conj": "حرف ربط", "intj": "صوت", "num": "عدد", "det": "صفت اشاره", "article": "حرف تعریف",
          "phrase": "عبارت", "particle": "ادات", "prep_phrase": "عبارت"}
SKIP_TAGS = {"obsolete", "archaic", "rare", "dialectal", "nonstandard", "misspelling", "vulgar", "offensive", "slur"}

freq = []
for line in open(P("en_50k.txt"), encoding="utf-8"):
    w = line.split(" ")[0].strip().lower()
    if w.isascii() and w.isalpha() and w not in freq[-1:]:
        freq.append(w)
rank = {}
for i, w in enumerate(freq):
    rank.setdefault(w, i + 1)

fa_rank = {}
for i, line in enumerate(open(P("fa_50k.txt"), encoding="utf-8")):
    fa_rank.setdefault(line.split(" ")[0].strip(), i + 1)

def fa_score(phrase):
    """هرچه کمتر، رایج‌تر. عبارت چندکلمه‌ای: کلمهٔ کم‌بسامدترش ملاک است."""
    parts = [p for p in re.split(r"[\s\u200c]+", phrase) if p]
    if not parts: return 10**9
    return max(fa_rank.get(p, 200000) for p in parts)

AR = re.compile(r"^[\u0600-\u06FF\u200c ]+$")
HARAKAT = re.compile(r"[\u064B-\u0652\u0670\u0640]")
def clean_fa(s):
    if not s: return None
    s = HARAKAT.sub("", re.sub(r"\s*\([^)]*\)", "", s)).strip()
    s = s.replace("ي", "ی").replace("ك", "ک")
    return s if AR.match(s) and 1 <= len(s) <= 40 else None

# ۱) معادل‌های فارسی از معکوس مدخل‌های فارسی ویکی‌واژه
rev = collections.defaultdict(list)
for line in open(P("fa.jsonl"), encoding="utf-8"):
    d = json.loads(line)
    w = clean_fa(d.get("word"))
    if not w: continue
    for s in d.get("senses", []) or []:
        if s.get("form_of") or s.get("alt_of"): continue
        if SKIP_TAGS & set(s.get("tags", []) or []): continue
        g = (s.get("glosses") or [""])[-1]
        g = re.sub(r"\([^)]*\)", "", g)
        for part in re.split(r"[;,]", g):
            p = re.sub(r"^(to|a|an|the) ", "", part.strip().lower())
            if p in rank:
                rev[(p, d.get("pos"))].append(w)
                rev[(p, None)].append(w)

# ۲) جمله‌های Tatoeba انگلیسی↔فارسی
pes = {}
with bz2.open(P("pes_sentences.tsv.bz2"), "rt", encoding="utf-8") as f:
    for line in f:
        i, _, t = line.rstrip("\n").split("\t", 2)
        pes[i] = t
links = collections.defaultdict(list)
with bz2.open(P("pes-eng_links.tsv.bz2"), "rt", encoding="utf-8") as f:
    for line in f:
        a, b = line.split()
        if a in pes: links[b].append(a)
eng = {}
with bz2.open(P("eng_sentences.tsv.bz2"), "rt", encoding="utf-8") as f:
    for line in f:
        i, _, t = line.rstrip("\n").split("\t", 2)
        if i in links: eng[i] = t
examples = collections.defaultdict(list)  # word → [(en, fa)]
for i, t in eng.items():
    if len(t) > 90: continue
    fa_t = pes[links[i][0]].strip()
    for tok in set(re.findall(r"[A-Za-z]+", t.lower())):
        if len(examples[tok]) < 4: examples[tok].append((t, fa_t))

# ۳) مدخل‌های انگلیسی
by = collections.defaultdict(list)
for line in open(P("en_filtered.jsonl"), encoding="utf-8"):
    d = json.loads(line)
    if d.get("p") in (None, "name", "prefix", "suffix", "symbol", "character", "abbrev", "contraction", "infix", "punct"): continue
    if d["w"] != d["w"].lower(): continue  # نام‌های خاص و سرواژه‌ها
    by[d["w"]].append(d)

def good_senses(d):
    return [s for s in d["s"] if not s["f"] and s["g"] and not (SKIP_TAGS & set(s["t"]))]

out = open(P("dictionary.jsonl"), "w", encoding="utf-8")
stats = collections.Counter()
for w, entries in sorted(by.items(), key=lambda kv: rank.get(kv[0], 10**9)):
    lemmas = [d for d in entries if good_senses(d)]
    if not lemmas: continue
    if len(w) < 2 and w not in ("a", "i"): continue
    # نقش دستوری اصلی: مدخلی که بیشترین معنی معتبر و ترجمه را دارد (book → اسم، نه فعل)
    lemmas.sort(key=lambda d: -(len(good_senses(d)) + 2 * len(d["tr"])))
    main = lemmas[0]
    fa_list = []
    def push(x):
        x = clean_fa(x)
        if x and x not in fa_list: fa_list.append(x)
    # ترجمه‌های مستقیم ویکی‌واژه، به ترتیب نقش دستوری اصلی
    first_sense = lemmas[0]["tr"][0].get("s") if lemmas[0]["tr"] else None
    direct_c = []
    for di, d in enumerate(lemmas):
        for t in d["tr"]:
            x = clean_fa(t.get("w"))
            if x: direct_c.append(((0 if di == 0 and t.get("s") == first_sense else 1), fa_score(x), len(direct_c), x))
    for *_, x in sorted(direct_c): push(x)
    direct = len(fa_list)
    cands = []
    for d in lemmas:
        cands += rev.get((w, d["p"]), [])
    cands = sorted(set(cands), key=fa_score)
    for c in cands:
        if fa_score(c) < 200000 or not fa_list: push(c)
    if not direct and fa_list:
        fa_list = sorted(fa_list, key=fa_score)
    ipa = next((i for d in lemmas for i in d["i"] if i.startswith("/")), None) or next((i for d in lemmas for i in d["i"]), None)
    gloss = good_senses(main)[0]["g"]
    gloss = gloss if len(gloss) <= 160 else gloss[:157].rsplit(" ", 1)[0] + "…"
    ex_en = ex_fa = None
    exs = examples.get(w)
    if exs:
        ex_en, ex_fa = min(exs, key=lambda x: len(x[0]))
    else:
        for d in lemmas:
            for s in good_senses(d):
                if s["x"] and re.search(r"\b" + re.escape(w) + r"\b", s["x"][0], re.I):
                    ex_en = s["x"][0]; break
            if ex_en: break
    srcs = ["wiktionary"] + (["tatoeba"] if ex_fa else [])
    row = {
        "id": re.sub(r"[^a-z0-9]+", "-", w).strip("-") or w,
        "en": w, "norm": w, "ipa": ipa, "pos": POS_FA.get(main["p"], main["p"]),
        "fa": "، ".join(fa_list[:3]) if fa_list else None,
        "fa_all": fa_list[:8], "gloss_en": gloss, "example_en": ex_en, "example_fa": ex_fa,
        "rank": rank.get(w), "sources": srcs,
    }
    out.write(json.dumps(row, ensure_ascii=False) + "\n")
    stats["entries"] += 1
    stats["with_fa"] += bool(fa_list)
    stats["direct_fa"] += bool(direct)
    stats["with_ipa"] += bool(ipa)
    stats["example_fa"] += bool(ex_fa)
    stats["example_any"] += bool(ex_en)
print(dict(stats))
