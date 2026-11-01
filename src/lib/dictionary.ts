// واژه‌نامهٔ نمونهٔ دست‌نویس. منبع واقعی واژه‌نامه هنوز انتخاب نشده است؛
// این داده‌ها فقط برای اجرای رابط و آزمون‌اند و جای واژه‌نامهٔ دارای مجوز را نمی‌گیرند.

export interface DictionaryEntry {
  id: string;
  en: string;
  ipa: string;
  pos: string;
  fa: string;
  exampleEn: string;
  exampleFa: string;
}

type Row = [en: string, ipa: string, pos: string, fa: string, exEn: string, exFa: string];

const ROWS: Row[] = [
  ["hesitate", "/ˈhɛzɪteɪt/", "فعل", "تردید کردن؛ دودل بودن", "Don't hesitate to ask if you're stuck.", "اگر گیر کردی، برای پرسیدن تردید نکن."],
  ["vivid", "/ˈvɪvɪd/", "صفت", "زنده؛ روشن (مثل یک خاطره)", "She has a vivid memory of that summer.", "او از آن تابستان خاطره‌ای زنده دارد."],
  ["thrive", "/θraɪv/", "فعل", "شکوفا شدن؛ خوب رشد کردن", "Plants thrive in bright, indirect light.", "گیاهان در نور روشنِ غیرمستقیم خوب رشد می‌کنند."],
  ["serendipity", "/ˌsɛrənˈdɪpɪti/", "اسم", "اتفاق خوشایندِ ناخواسته", "Meeting her was pure serendipity.", "آشنایی با او کاملاً یک اتفاق خوشایند بود."],
  ["resilient", "/rɪˈzɪliənt/", "صفت", "تاب‌آور؛ زود به حال‌ برگشتنی", "Children are often more resilient than we think.", "بچه‌ها اغلب تاب‌آورتر از چیزی‌اند که فکر می‌کنیم."],
  ["ambiguous", "/æmˈbɪɡjuəs/", "صفت", "مبهم؛ دوپهلو", "The ending of the film is deliberately ambiguous.", "پایان فیلم عمداً مبهم است."],
  ["reluctant", "/rɪˈlʌktənt/", "صفت", "بی‌میل؛ مردد", "He was reluctant to leave the village.", "او برای ترک روستا بی‌میل بود."],
  ["meticulous", "/məˈtɪkjələs/", "صفت", "بسیار دقیق و موشکاف", "She is meticulous about her notes.", "او دربارهٔ یادداشت‌هایش بسیار دقیق است."],
  ["curious", "/ˈkjʊəriəs/", "صفت", "کنجکاو", "Alice was curious about the white rabbit.", "آلیس دربارهٔ خرگوشِ سفید کنجکاو بود."],
  ["gratitude", "/ˈɡrætɪtjuːd/", "اسم", "قدردانی؛ سپاس‌گزاری", "He wrote a note to show his gratitude.", "او برای نشان‌دادن قدردانی‌اش یادداشتی نوشت."],
  ["mundane", "/mʌnˈdeɪn/", "صفت", "پیش‌پاافتاده؛ روزمره", "Even mundane tasks can feel calming.", "حتی کارهای روزمره هم می‌توانند آرامش‌بخش باشند."],
  ["eloquent", "/ˈɛləkwənt/", "صفت", "شیوا؛ خوش‌بیان", "Her speech was short but eloquent.", "سخنرانی‌اش کوتاه اما شیوا بود."],
  ["solitude", "/ˈsɒlɪtjuːd/", "اسم", "خلوت؛ تنهاییِ آرام", "He enjoyed the solitude of the mountains.", "او از خلوتِ کوهستان لذت می‌برد."],
  ["wander", "/ˈwɒndər/", "فعل", "پرسه زدن؛ بی‌مقصد رفتن", "We wandered through the old market.", "در بازار قدیمی پرسه زدیم."],
  ["fragile", "/ˈfrædʒaɪl/", "صفت", "شکننده؛ آسیب‌پذیر", "Handle the glass with care; it's fragile.", "شیشه را با احتیاط بردار؛ شکننده است."],
  ["humble", "/ˈhʌmbəl/", "صفت", "فروتن", "Despite his fame, he stayed humble.", "با وجود شهرتش فروتن ماند."],
  ["persist", "/pərˈsɪst/", "فعل", "پافشاری کردن؛ ادامه یافتن", "If the pain persists, see a doctor.", "اگر درد ادامه پیدا کرد، به پزشک مراجعه کن."],
  ["subtle", "/ˈsʌtəl/", "صفت", "ظریف؛ نامحسوس", "There is a subtle difference between them.", "میان آن‌ها تفاوتی ظریف هست."],
  ["candid", "/ˈkændɪd/", "صفت", "رک؛ صریح", "Thank you for being so candid with me.", "ممنون که این‌قدر رک با من حرف زدی."],
  ["ephemeral", "/ɪˈfɛmərəl/", "صفت", "زودگذر", "Fame can be ephemeral.", "شهرت می‌تواند زودگذر باشد."],
  ["receive", "/rɪˈsiːv/", "فعل", "دریافت کردن", "Did you receive my message?", "پیامم را دریافت کردی؟"],
  ["definitely", "/ˈdɛfɪnətli/", "قید", "قطعاً؛ بدون شک", "I will definitely come tomorrow.", "فردا قطعاً می‌آیم."],
  ["occur", "/əˈkɜːr/", "فعل", "رخ دادن؛ به ذهن رسیدن", "It never occurred to me to ask.", "هیچ‌وقت به ذهنم نرسید بپرسم."],
  ["hastily", "/ˈheɪstɪli/", "قید", "با شتاب؛ عجولانه", "She hastily closed the book.", "او با شتاب کتاب را بست."],
  ["peep", "/piːp/", "فعل", "دزدکی نگاه کردن؛ سرک کشیدن", "Alice peeped into the book her sister was reading.", "آلیس به کتابی که خواهرش می‌خواند سرک کشید."],
  ["burrow", "/ˈbʌroʊ/", "اسم", "لانهٔ زیرزمینی", "The rabbit disappeared into its burrow.", "خرگوش در لانه‌اش ناپدید شد."],
  ["weary", "/ˈwɪəri/", "صفت", "خسته؛ فرسوده", "The weary traveller sat down to rest.", "مسافرِ خسته برای استراحت نشست."],
  ["lantern", "/ˈlæntərn/", "اسم", "فانوس", "He carried a lantern along the path.", "او فانوسی در مسیر با خود می‌برد."],
  ["ubiquitous", "/juːˈbɪkwɪtəs/", "صفت", "همه‌جاحاضر؛ فراگیر", "Smartphones are now ubiquitous.", "گوشی هوشمند حالا همه‌جا هست."],
  ["scarce", "/skɛəs/", "صفت", "کمیاب", "Water is scarce in the desert.", "در بیابان آب کمیاب است."],
  ["abundant", "/əˈbʌndənt/", "صفت", "فراوان", "Fresh fruit is abundant in summer.", "میوهٔ تازه در تابستان فراوان است."],
  ["anticipate", "/ænˈtɪsɪpeɪt/", "فعل", "پیش‌بینی کردن؛ انتظار داشتن", "We anticipate a busy weekend.", "انتظار یک آخر هفتهٔ شلوغ را داریم."],
  ["obvious", "/ˈɒbviəs/", "صفت", "آشکار؛ بدیهی", "The answer seemed obvious to everyone.", "پاسخ برای همه بدیهی به نظر می‌رسید."],
  ["consider", "/kənˈsɪdər/", "فعل", "در نظر گرفتن؛ سنجیدن", "Please consider my offer.", "لطفاً پیشنهادم را در نظر بگیر."],
  ["achieve", "/əˈtʃiːv/", "فعل", "دست یافتن؛ به انجام رساندن", "She achieved her goal after years of work.", "او پس از سال‌ها تلاش به هدفش رسید."],
  ["accurate", "/ˈækjərət/", "صفت", "دقیق؛ درست", "The map was surprisingly accurate.", "نقشه به‌طرز شگفت‌آوری دقیق بود."],
  ["adequate", "/ˈædɪkwət/", "صفت", "کافی؛ بسنده", "The room has adequate light for reading.", "اتاق برای مطالعه نور کافی دارد."],
  ["advocate", "/ˈædvəkeɪt/", "فعل", "حمایت کردن؛ طرفداری کردن", "She advocates for cleaner cities.", "او از شهرهای پاکیزه‌تر حمایت می‌کند."],
  ["anxious", "/ˈæŋkʃəs/", "صفت", "نگران؛ مضطرب", "He felt anxious before the exam.", "او پیش از امتحان نگران بود."],
  ["apparent", "/əˈpærənt/", "صفت", "آشکار؛ ظاهری", "It soon became apparent that we were lost.", "خیلی زود آشکار شد که گم شده‌ایم."],
  ["appreciate", "/əˈpriːʃieɪt/", "فعل", "قدر دانستن؛ سپاس‌گزار بودن", "I really appreciate your help.", "واقعاً قدر کمکت را می‌دانم."],
  ["approach", "/əˈprəʊtʃ/", "اسم", "رویکرد؛ شیوه", "We need a different approach.", "به رویکرد دیگری نیاز داریم."],
  ["assume", "/əˈsjuːm/", "فعل", "فرض کردن", "Don't assume everyone knows the rules.", "فرض نکن همه قواعد را می‌دانند."],
  ["attempt", "/əˈtɛmpt/", "اسم", "تلاش؛ کوشش", "This is my first attempt at baking bread.", "این اولین تلاش من برای پختن نان است."],
  ["aware", "/əˈwɛər/", "صفت", "آگاه؛ باخبر", "Are you aware of the risks?", "آیا از خطرها آگاهی؟"],
  ["benefit", "/ˈbɛnɪfɪt/", "اسم", "سود؛ مزیت", "Walking has many health benefits.", "پیاده‌روی فایده‌های زیادی برای سلامتی دارد."],
  ["brief", "/briːf/", "صفت", "کوتاه؛ مختصر", "She gave a brief answer.", "او پاسخی کوتاه داد."],
  ["cautious", "/ˈkɔːʃəs/", "صفت", "محتاط", "Be cautious on the icy road.", "در جادهٔ یخ‌زده محتاط باش."],
  ["coherent", "/kəʊˈhɪərənt/", "صفت", "منسجم؛ منطقی و پیوسته", "Her argument was clear and coherent.", "استدلال او روشن و منسجم بود."],
  ["comprehend", "/ˌkɒmprɪˈhɛnd/", "فعل", "درک کردن؛ فهمیدن", "It's hard to comprehend how big space is.", "درک بزرگی فضا سخت است."],
  ["confident", "/ˈkɒnfɪdənt/", "صفت", "مطمئن؛ با اعتمادبه‌نفس", "She felt confident before the interview.", "او پیش از مصاحبه احساس اطمینان داشت."],
  ["consequence", "/ˈkɒnsɪkwəns/", "اسم", "پیامد؛ نتیجه", "Every choice has consequences.", "هر انتخابی پیامدهایی دارد."],
  ["crucial", "/ˈkruːʃəl/", "صفت", "حیاتی؛ بسیار مهم", "Sleep is crucial for memory.", "خواب برای حافظه حیاتی است."],
  ["deliberate", "/dɪˈlɪbərət/", "صفت", "عمدی؛ سنجیده", "It was a deliberate choice.", "انتخابی سنجیده بود."],
  ["diligent", "/ˈdɪlɪdʒənt/", "صفت", "سخت‌کوش؛ پرتلاش", "He is a diligent student.", "او دانشجوی سخت‌کوشی است."],
  ["distinct", "/dɪˈstɪŋkt/", "صفت", "متمایز؛ مشخص", "There are two distinct groups.", "دو گروه متمایز وجود دارد."],
  ["eager", "/ˈiːɡər/", "صفت", "مشتاق", "The kids were eager to start.", "بچه‌ها برای شروع مشتاق بودند."],
  ["elaborate", "/ɪˈlæbərət/", "صفت", "مفصل؛ پرجزئیات", "They made an elaborate plan.", "آن‌ها نقشه‌ای مفصل کشیدند."],
  ["emphasize", "/ˈɛmfəsaɪz/", "فعل", "تأکید کردن", "The teacher emphasized the main idea.", "معلم بر ایدهٔ اصلی تأکید کرد."],
  ["encounter", "/ɪnˈkaʊntər/", "فعل", "روبه‌رو شدن؛ برخوردن", "We encountered a few problems.", "با چند مشکل روبه‌رو شدیم."],
  ["essential", "/ɪˈsɛnʃəl/", "صفت", "ضروری؛ اساسی", "Water is essential for life.", "آب برای زندگی ضروری است."],
  ["evident", "/ˈɛvɪdənt/", "صفت", "آشکار؛ واضح", "Her talent was evident from the start.", "استعدادش از همان ابتدا آشکار بود."],
  ["exaggerate", "/ɪɡˈzædʒəreɪt/", "فعل", "اغراق کردن", "Don't exaggerate; it wasn't that bad.", "اغراق نکن؛ آن‌قدرها هم بد نبود."],
  ["feasible", "/ˈfiːzəbəl/", "صفت", "شدنی؛ عملی", "Is the plan feasible in one week?", "آیا این نقشه در یک هفته شدنی است؟"],
  ["flourish", "/ˈflʌrɪʃ/", "فعل", "رونق گرفتن؛ شکوفا شدن", "Small businesses flourished in the town.", "کسب‌وکارهای کوچک در شهر رونق گرفتند."],
  ["genuine", "/ˈdʒɛnjuɪn/", "صفت", "واقعی؛ صادقانه", "Her smile was genuine.", "لبخندش صادقانه بود."],
  ["gradual", "/ˈɡrædʒuəl/", "صفت", "تدریجی", "We saw a gradual improvement.", "بهبودی تدریجی دیدیم."],
  ["hostile", "/ˈhɒstaɪl/", "صفت", "خصمانه؛ دشمنانه", "The crowd was hostile.", "جمعیت حالتی خصمانه داشت."],
  ["imply", "/ɪmˈplaɪ/", "فعل", "تلویحاً رساندن؛ دلالت کردن", "What are you implying?", "منظورت از این حرف چیست؟"],
  ["inevitable", "/ɪnˈɛvɪtəbəl/", "صفت", "اجتناب‌ناپذیر", "Change is inevitable.", "تغییر اجتناب‌ناپذیر است."],
  ["integrity", "/ɪnˈtɛɡrɪti/", "اسم", "درستکاری؛ یکپارچگی", "He is a man of integrity.", "او مردی درستکار است."],
  ["keen", "/kiːn/", "صفت", "مشتاق؛ تیز", "She is keen on learning Japanese.", "او به یادگیری ژاپنی مشتاق است."],
  ["linger", "/ˈlɪŋɡər/", "فعل", "درنگ کردن؛ ماندن", "The smell of coffee lingered in the room.", "بوی قهوه در اتاق ماند."],
  ["modest", "/ˈmɒdɪst/", "صفت", "فروتن؛ متوسط و ساده", "They live in a modest house.", "آن‌ها در خانه‌ای ساده زندگی می‌کنند."],
  ["neglect", "/nɪˈɡlɛkt/", "فعل", "غفلت کردن؛ نادیده گرفتن", "Don't neglect your health.", "از سلامتی‌ات غافل نشو."],
  ["notion", "/ˈnəʊʃən/", "اسم", "تصور؛ مفهوم", "I had no notion of the time.", "هیچ تصوری از زمان نداشتم."],
  ["obscure", "/əbˈskjʊər/", "صفت", "گمنام؛ نامفهوم", "The poem is full of obscure references.", "شعر پر از اشاره‌های نامفهوم است."],
  ["obstacle", "/ˈɒbstəkəl/", "اسم", "مانع", "Fear is the biggest obstacle.", "ترس بزرگ‌ترین مانع است."],
  ["persuade", "/pərˈsweɪd/", "فعل", "قانع کردن؛ متقاعد کردن", "She persuaded me to join the club.", "او مرا قانع کرد به باشگاه بپیوندم."],
  ["plausible", "/ˈplɔːzəbəl/", "صفت", "پذیرفتنی؛ محتمل", "That's a plausible explanation.", "توضیح پذیرفتنی‌ای است."],
  ["precise", "/prɪˈsaɪs/", "صفت", "دقیق", "Give me the precise time.", "زمان دقیق را بگو."],
  ["profound", "/prəˈfaʊnd/", "صفت", "عمیق؛ ژرف", "The book had a profound effect on me.", "کتاب تأثیر عمیقی بر من گذاشت."],
  ["pursue", "/pərˈsjuː/", "فعل", "دنبال کردن؛ پیگیری کردن", "He wants to pursue a career in music.", "او می‌خواهد حرفه‌ای در موسیقی را دنبال کند."],
  ["reconcile", "/ˈrɛkənsaɪl/", "فعل", "آشتی دادن؛ سازگار کردن", "They finally reconciled after years.", "آن‌ها پس از سال‌ها سرانجام آشتی کردند."],
  ["reflect", "/rɪˈflɛkt/", "فعل", "اندیشیدن؛ بازتاب دادن", "Take a moment to reflect on your day.", "لحظه‌ای دربارهٔ روزت فکر کن."],
  ["reliable", "/rɪˈlaɪəbəl/", "صفت", "قابل‌اعتماد", "We need a reliable car.", "به یک خودروی قابل‌اعتماد نیاز داریم."],
  ["remarkable", "/rɪˈmɑːkəbəl/", "صفت", "چشمگیر؛ قابل‌توجه", "She made remarkable progress.", "او پیشرفت چشمگیری کرد."],
  ["sincere", "/sɪnˈsɪər/", "صفت", "صمیمانه؛ صادق", "Please accept my sincere apologies.", "لطفاً عذرخواهی صمیمانه‌ام را بپذیر."],
  ["spontaneous", "/spɒnˈteɪniəs/", "صفت", "خودجوش؛ بی‌برنامه", "We took a spontaneous trip to the sea.", "یک سفر بی‌برنامه به دریا رفتیم."],
  ["sufficient", "/səˈfɪʃənt/", "صفت", "کافی", "Is one hour sufficient?", "آیا یک ساعت کافی است؟"],
  ["tedious", "/ˈtiːdiəs/", "صفت", "خسته‌کننده؛ ملال‌آور", "Filling in forms is tedious.", "پر کردن فرم‌ها خسته‌کننده است."],
  ["tolerate", "/ˈtɒləreɪt/", "فعل", "تحمل کردن", "I can't tolerate loud music.", "نمی‌توانم موسیقی بلند را تحمل کنم."],
  ["trivial", "/ˈtrɪviəl/", "صفت", "جزئی؛ بی‌اهمیت", "Don't worry about trivial details.", "نگران جزئیات بی‌اهمیت نباش."],
  ["vague", "/veɪɡ/", "صفت", "مبهم؛ نامشخص", "He gave a vague answer.", "پاسخی مبهم داد."],
  ["versatile", "/ˈvɜːsətaɪl/", "صفت", "همه‌کاره؛ چندمنظوره", "Rice is a versatile ingredient.", "برنج ماده‌ای چندمنظوره است."],
  ["vulnerable", "/ˈvʌlnərəbəl/", "صفت", "آسیب‌پذیر", "Young plants are vulnerable to frost.", "گیاهان جوان در برابر یخ‌زدگی آسیب‌پذیرند."],
  ["whisper", "/ˈwɪspər/", "فعل", "نجوا کردن؛ آهسته گفتن", "She whispered the answer to me.", "او جواب را آهسته به من گفت."],
  ["yearn", "/jɜːn/", "فعل", "آرزو داشتن؛ دلتنگ بودن", "He yearned for home.", "او دلتنگ خانه بود."],
  ["zeal", "/ziːl/", "اسم", "شور؛ اشتیاق", "She worked with great zeal.", "او با شور فراوان کار کرد."],
  ["nimble", "/ˈnɪmbəl/", "صفت", "چابک؛ فرز", "The cat was nimble on the roof.", "گربه روی پشت‌بام چابک بود."],
  ["glimpse", "/ɡlɪmps/", "اسم", "نگاه گذرا؛ نیم‌نگاه", "I caught a glimpse of the sea.", "نیم‌نگاهی به دریا انداختم."],
  ["sorrow", "/ˈsɒrəʊ/", "اسم", "اندوه؛ غم", "The song was full of sorrow.", "آهنگ پر از اندوه بود."],
  ["splendid", "/ˈsplɛndɪd/", "صفت", "باشکوه؛ عالی", "We had a splendid view of the city.", "منظره‌ای باشکوه از شهر داشتیم."],
  ["timid", "/ˈtɪmɪd/", "صفت", "خجالتی؛ کم‌رو", "The timid child hid behind her mother.", "کودکِ کم‌رو پشت مادرش پنهان شد."],
];

export const slugify = (en: string) =>
  en.trim().toLocaleLowerCase("en-US").replace(/[^a-z0-9 '-]/g, "").replace(/\s+/g, "-");

export const DICTIONARY: DictionaryEntry[] = ROWS.map(([en, ipa, pos, fa, exampleEn, exampleFa]) => ({
  id: slugify(en),
  en,
  ipa,
  pos,
  fa,
  exampleEn,
  exampleFa,
}));

const BY_ID = new Map(DICTIONARY.map((e) => [e.id, e]));
export const entryById = (id: string): DictionaryEntry | undefined => BY_ID.get(id);

/** غلط‌های املایی رایج → واژهٔ درست */
export const TYPOS: Record<string, string> = {
  recieve: "receive",
  definately: "definitely",
  occured: "occur",
  hastly: "hastily",
  resiliant: "resilient",
  persue: "pursue",
};

export interface Chapter {
  id: string;
  title: string;
  wordIds: string[];
}
export interface Book {
  id: string;
  title: string;
  author: string;
  license: string;
  source: string;
  chapters: Chapter[];
}

// فقط آثار مالکیت عمومی به‌عنوان نمونه؛ فهرست واژه‌ها گزیدهٔ دستی است و متن کتاب بازنشر نمی‌شود.
// انتخاب منبع نهایی کتاب‌ها تصمیم‌گیری‌نشده است.
export const BOOKS: Book[] = [
  {
    id: "alice",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll (1865)",
    license: "مالکیت عمومی · پروژهٔ گوتنبرگ، شمارهٔ ۱۱",
    source: "https://www.gutenberg.org/ebooks/11",
    chapters: [
      { id: "alice-1", title: "Chapter I · Down the Rabbit-Hole", wordIds: ["curious", "peep", "burrow", "hastily", "weary", "glimpse", "linger"] },
      { id: "alice-2", title: "Chapter II · The Pool of Tears", wordIds: ["reluctant", "fragile", "wander", "timid", "sorrow", "whisper"] },
      { id: "alice-3", title: "Chapter III · A Caucus-Race and a Long Tale", wordIds: ["elaborate", "persuade", "obscure", "tedious", "modest"] },
    ],
  },
  {
    id: "prince",
    title: "The Happy Prince and Other Tales",
    author: "Oscar Wilde (1888)",
    license: "مالکیت عمومی · پروژهٔ گوتنبرگ، شمارهٔ ۹۰۲",
    source: "https://www.gutenberg.org/ebooks/902",
    chapters: [
      { id: "prince-1", title: "The Happy Prince", wordIds: ["lantern", "humble", "gratitude", "solitude", "splendid", "sorrow"] },
      { id: "prince-2", title: "The Nightingale and the Rose", wordIds: ["ephemeral", "eloquent", "subtle", "yearn", "sincere", "profound"] },
      { id: "prince-3", title: "The Selfish Giant", wordIds: ["hostile", "flourish", "thrive", "glimpse", "genuine"] },
    ],
  },
];

/** تبدیل ارقام به فارسی */
export const fa = (n: number | string): string =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]).replace(/,/g, "٬");
export const faN = (n: number): string => fa(n.toLocaleString("en-US"));
