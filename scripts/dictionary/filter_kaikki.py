import sys, json
freq = set()
for i, line in enumerate(open('/data/dictsrc/en_50k.txt', encoding='utf-8')):
    w = line.split(' ')[0].strip().lower()
    if w.isalpha() and w.isascii(): freq.add(w)
out = open('/data/dictsrc/en_filtered.jsonl', 'w', encoding='utf-8')
n = k = 0
for line in sys.stdin:
    n += 1
    if n % 200000 == 0: print(n, k, file=sys.stderr, flush=True)
    # پیش‌فیلتر سریع پیش از parse
    s = line.find('"word": "')
    if s < 0: continue
    e = line.find('"', s + 9)
    w = line[s + 9:e]
    if w.lower() not in freq: continue
    try: d = json.loads(line)
    except Exception: continue
    if d.get('lang_code') != 'en': continue
    w = d.get('word', '')
    if w.lower() not in freq: continue
    senses = []
    trans = []
    for t in d.get('translations', []) or []:
        if t.get('lang_code') == 'fa' or t.get('lang') == 'Persian':
            trans.append({'w': t.get('word'), 'r': t.get('roman'), 's': t.get('sense')})
    for sn in d.get('senses', []) or []:
        tags = sn.get('tags', []) or []
        g = (sn.get('glosses') or [''])[-1]
        ex = [x.get('text') for x in (sn.get('examples') or []) if x.get('text') and len(x.get('text')) < 140][:1]
        senses.append({'g': g, 't': tags[:6], 'x': ex, 'f': bool(sn.get('form_of') or sn.get('alt_of'))})
        for t in sn.get('translations', []) or []:
            if t.get('lang_code') == 'fa' or t.get('lang') == 'Persian':
                trans.append({'w': t.get('word'), 'r': t.get('roman'), 's': g[:80]})
    ipa = [x.get('ipa') for x in (d.get('sounds') or []) if x.get('ipa')]
    out.write(json.dumps({'w': w, 'p': d.get('pos'), 'i': ipa[:3], 's': senses[:6], 'tr': trans[:12]}, ensure_ascii=False) + '\n')
    k += 1
print('done', n, k, file=sys.stderr)
