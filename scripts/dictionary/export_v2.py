"""dictionary.jsonl (خروجی build_v2.py) ← payload نهایی برای جدول dictionary_entries.
فقط مدخل‌هایی که معنی فارسی دارند وارد می‌شوند. مدخل‌های نسخهٔ قبل (data/open-dictionary.json) اگر در
خروجی تازه نباشند حفظ می‌شوند. خروجی: $DICT_SRC/dictionary-v2.json"""
import json, os, sys
SRC = os.environ.get("DICT_SRC", "/data/dictsrc")
old_path = sys.argv[1] if len(sys.argv) > 1 else None
ATTR = "English Wiktionary contributors · extracted by Kaikki/wiktextract"
out, seen = [], set()
for line in open(os.path.join(SRC, "dictionary.jsonl"), encoding="utf-8"):
    r = json.loads(line)
    if not r["fa"]: continue
    e = {
        "id": r["id"], "en": r["en"], "ipa": r["ipa"] or "", "pos": r["pos"] or "",
        "fa": "؛ ".join(r["fa_all"][:3]), "exampleEn": r["example_en"] or "", "exampleFa": r["example_fa"] or "",
        "glossEn": r["gloss_en"] or "", "rank": r["rank"],
        "sourceUrl": f"https://en.wiktionary.org/wiki/{r['en']}#English", "license": "CC BY-SA 4.0", "attribution": ATTR,
        "quality": "community-unreviewed",
    }
    if r["example_fa"]:
        e["exampleSource"] = "Tatoeba (CC BY 2.0 FR)"
    elif r["example_en"]:
        e["exampleSource"] = "Wiktionary (CC BY-SA 4.0)"
    out.append(e); seen.add(e["id"])
kept = 0
if old_path:
    for e in json.load(open(old_path, encoding="utf-8")):
        if e["id"] not in seen:
            out.append(e); seen.add(e["id"]); kept += 1
json.dump(out, open(os.path.join(SRC, "dictionary-v2.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(json.dumps({"entries": len(out), "kept_from_v1": kept, "with_fa_example": sum(1 for e in out if e.get("exampleFa")), "with_gloss": sum(1 for e in out if e.get("glossEn"))}))
