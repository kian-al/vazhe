import re, json, collections, argparse
from pathlib import Path
parser=argparse.ArgumentParser(description='Build the classic-book catalog using provided Gutenberg texts and dictionary ID index.')
parser.add_argument('--inputs',type=Path,required=True,help='Directory containing alice.txt, prince.txt, dictionary-index.json')
parser.add_argument('--output',type=Path,default=Path('data/books-catalog.json'))
args=parser.parse_args(); p=args.inputs
index={x['norm']:x['id'] for x in json.loads((p/'dictionary-index.json').read_text())}
stop=set('about above after again against almost along already also although always among another around because before being below between both could every first found from great having herself himself itself little might never other shall should since still such their them there these thing things those through under until very where which while would your yours themselves ourselves myself yourself something anything nothing everything without what when whose whom alice prince said asked replied cried thought went came know made make come upon have been will that with this they were then than some into only just much many more most must here over down like look looked looking began began back away again'.split())
def ids(txt):
    words=re.findall(r"\b[a-z]{5,}\b",txt.lower())
    count=collections.Counter(w for w in words if w in index and w not in stop)
    return [index[w] for w,_ in sorted(count.items(),key=lambda x:(-x[1],x[0]))[:30]]
a=(p/'alice.txt').read_text(); a=a[a.index('*** START OF THE PROJECT GUTENBERG EBOOK'):a.index('*** END OF THE PROJECT GUTENBERG EBOOK')]; hits=list(re.finditer(r'(?m)^CHAPTER ([IVX]+)\.\s*$',a)); assert len(hits)==12,len(hits)
atitles=['Down the Rabbit-Hole','The Pool of Tears','A Caucus-Race and a Long Tale','The Rabbit Sends in a Little Bill','Advice from a Caterpillar','Pig and Pepper','A Mad Tea-Party','The Queen’s Croquet-Ground','The Mock Turtle’s Story','The Lobster Quadrille','Who Stole the Tarts?','Alice’s Evidence']
ach=[{'id':f'alice-{i+1}','title':f'Chapter {h.group(1)} · {atitles[i]}','wordIds':ids(a[h.end():hits[i+1].start() if i+1<len(hits) else len(a)])} for i,h in enumerate(hits)]
s=(p/'prince.txt').read_text(); s=s[s.index('*** START OF THE PROJECT GUTENBERG EBOOK'):s.index('*** END OF THE PROJECT GUTENBERG EBOOK')]; names=['The Happy Prince','The Nightingale and the Rose','The Selfish Giant','The Devoted Friend','The Remarkable Rocket']; ps=[re.search(r'(?m)^'+re.escape(t)+r'\.\s*$',s) for t in names]; assert all(ps)
pch=[{'id':f'prince-{i+1}','title':t,'wordIds':ids(s[ps[i].end():ps[i+1].start() if i+1<len(ps) else len(s)])} for i,t in enumerate(names)]
def units(prefix,label,n): return [{'id':f'{prefix}-{i}','title':f'{label} {i}','wordIds':[]} for i in range(1,n+1)]
note='فهرست درس‌های این کتاب هنوز وارد نشده؛ منبع مجاز و قابل‌توزیع لازم است.'
books=[{'id':'w504','title':'504 Absolutely Essential Words','fa':'۵۰۴ واژهٔ ضروری انگلیسی','author':'Murray Bromberg and others','cover':'amber','emblem':'۵۰۴','collection':'series','license':'محتوای کتاب هنوز در دسترس نیست','source':'','note':note,'chapters':units('w504-l','Lesson',42)}, {'id':'w1100','title':'1100 Words You Need to Know','fa':'۱۱۰۰ واژهٔ لازم برای دانستن','author':'Murray Bromberg · Melvin Gordon','cover':'teal','emblem':'۱۱۰۰','collection':'series','license':'محتوای کتاب هنوز در دسترس نیست','source':'','note':note,'chapters':units('w1100-w','Week',46)}]
for i,ord in enumerate(['یکم','دوم','سوم','چهارم','پنجم','ششم'],1): books.append({'id':f'w4000-{i}','title':f'4000 Essential English Words, Book {i}','fa':f'۴۰۰۰ واژهٔ ضروری انگلیسی — جلد {ord}','author':'Paul Nation','cover':'indigo','emblem':str(i),'collection':'series','license':'محتوای کتاب هنوز در دسترس نیست','source':'','note':note,'chapters':units(f'w4000-b{i}-u','Unit',30)})
for id,title,fa,author,chapters,cover,source in [('alice',"Alice’s Adventures in Wonderland",'آلیس در سرزمین عجایب','Lewis Carroll (1865)',ach,'alice','https://www.gutenberg.org/ebooks/11'),('prince','The Happy Prince and Other Tales','شاهزادهٔ خوشبخت و داستان‌های دیگر','Oscar Wilde (1888)',pch,'prince','https://www.gutenberg.org/ebooks/902')]: books.append({'id':id,'title':title,'fa':fa,'author':author,'cover':cover,'collection':'classics','license':'اثر در مالکیت عمومی در آمریکا؛ وضعیت سایر کشورها ممکن است متفاوت باشد','source':source,'note':'واژه‌ها به‌صورت خودکار از متن هر فصل استخراج و با واژه‌نامهٔ واژه تطبیق داده شده‌اند؛ فهرست آموزشی رسمی یا بازبینی‌شده نیستند.','chapters':chapters})
args.output.write_text(json.dumps(books,ensure_ascii=False,indent=2)+'\n')
print('books:',len(books),'chapters:',sum(len(b['chapters']) for b in books),'classic words per chapter:',[len(c['wordIds']) for b in books[-2:] for c in b['chapters']])
