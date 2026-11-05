"""Redistributable Wiktionary-derived subset. No Tatoeba, frequency ranks, or quotations.
Source intermediate: en_filtered.jsonl from Kaikki/wiktextract. Adaptations:
normalize Persian letters, remove annotated translations, merge direct translations.
Dictionary data is CC BY-SA 4.0; see data/NOTICE.md and /about.
"""
import json,re,pathlib,hashlib
from urllib.parse import quote
root=pathlib.Path(__file__).resolve().parents[2]
words={}; pos={'noun':'اسم','verb':'فعل','adj':'صفت','adv':'قید','prep':'حرف اضافه','pron':'ضمیر','conj':'حرف ربط','intj':'صوت','num':'عدد','det':'تعیین‌کننده','phrase':'عبارت'}
skip={'obsolete','archaic','rare','dialectal','nonstandard','misspelling','offensive','vulgar','slur'}
for line in open('/data/dictsrc/en_filtered.jsonl',encoding='utf8'):
 d=json.loads(line); w=d['w']; p=d.get('p')
 if not re.fullmatch('[a-z]{2,40}',w) or p not in pos:continue
 senses=[s for s in d['s'] if not s['f'] and s['g'] and not skip.intersection(s['t'])]
 if not senses:continue
 translations=[]
 for t in d.get('tr',[]):
  x=(t.get('w') or '').replace('ي','ی').replace('ك','ک').strip()
  x=re.sub(r'[\u064b-\u065f\u0670]','',x)
  if re.fullmatch(r'[\u0600-\u06ff\u200c ]{2,60}',x) and x not in translations:translations.append(x)
 if not translations:continue
 # Keep one part-of-speech record, not an invented alignment across senses.
 if w in words:continue
 words[w]={'id':w,'en':w,'ipa':next((i for i in d['i'] if i.startswith('/')),''),'pos':pos[p],'fa':'؛ '.join(translations[:4]),'exampleEn':'','exampleFa':'','sourceUrl':'https://en.wiktionary.org/wiki/'+quote(w)+'#English','license':'CC BY-SA 4.0','attribution':'English Wiktionary contributors · extracted by Kaikki/wiktextract','quality':'community-unreviewed'}
out=sorted(words.values(),key=lambda e:e['en'])
(root/'data/open-dictionary.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf8')
manifest={'entries':len(out),'source':'https://kaikki.org/dictionary/English/','upstream':'https://en.wiktionary.org','license':'CC BY-SA 4.0','changes':['Persian character normalization and removal of optional vocalization marks','Direct translation selection and deduplication','One part of speech per word','Examples and frequency data deliberately excluded'],'sha256':hashlib.sha256((root/'data/open-dictionary.json').read_bytes()).hexdigest(),'quality':'Community data, not editorially reviewed; translations may represent multiple senses.'}
(root/'data/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({'entries':len(out),'bytes':(root/'data/open-dictionary.json').stat().st_size}))
