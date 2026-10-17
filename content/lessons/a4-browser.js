/* Lesson a4-browser — Lab 9 (Browser History Examiner). Concepts: docs/concepts.md §57–59. Values: docs/outputs-spec.md §ك. */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a4-browser"] = {
  id: "a4-browser", seq: 13, axis: 4, axisTitle: "المحور 4: تحليل الشبكة والأنشطة والملفات", labs: [9], chapters: [8], minutes: 30,
  title: "Browser History Examiner: سجل التصفح",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "هل لتصفح سامي علاقة بالحادثة؟",
    reached: "عرفنا كيف دخل المهاجم، وماذا زرع، وإلى أين يرسل البيانات.",
    seeking: "نفحص سجل التصفح: ماذا زار سامي وماذا نزّل قبل الحادثة، مع الانتباه إلى المنطقة الزمنية.",
    finding: "أكثر المواقع زيارة mail.oasis-trading.example (41)؛ وفي 3/10/2026 11:32 AM (محلي) نزّل سامي PDF-Tools-Free.exe من free-pdf-tools.example بعد بحث في Google، قبل الاختراق بنحو 11 ساعة."
  },
  summary: [   // «ما يجب أن تتذكره» at the end of the lesson
    "Browser History Examiner يقرأ سجل المتصفح: الزيارات (Website Visits) والتنزيلات (Downloads) وعمليات البحث (Searches).",
    "أكثر موقع زيارة mail.oasis-trading.example (41 زيارة)؛ وPDF-Tools-Free.exe نُزّل من free-pdf-tools.example بعد الوصول إليه عبر بحث Google (Link).",
    "انتبه للمنطقة الزمنية: التوقيت المحلي UTC+3، فالساعة 10:15 م محلياً = 19:15 بتوقيت UTC."
  ],
  objectives: [
    "تحميل سجل Chrome من الجهاز المحلي وقراءة جدول Website Visits.",
    "ترتيب الزيارات بعدد المرات (Visit Count) وتفسير Visit Type وVisited From.",
    "فهم أثر المنطقة الزمنية على الخط الزمني (محلي مقابل UTC)."
  ],
  explain: {
    intro: "التشبيه الجامع: المتصفح مفكرة يكتب فيها وحده كل مكان زرته. افتح البطاقات بأي ترتيب.",
    figure: null,
    whatNext: "ستحمّل سجل Chrome لحساب sami، وتفتح Website Visits وترتبه بـ Visit Count، وتبحث عن free-pdf، وتفتح Downloads، ثم تبدّل المنطقة الزمنية إلى UTC وتلاحظ تغيّر الأوقات.",
    cards: [
      {
        id: "artifacts", ar: "آثار المتصفح", en: "Browser Artifacts",
        analogy: "مفكرة يكتب فيها المتصفح وحده كل مكان زرته.",
        meaning: "المتصفح يحفظ: الزيارات، التنزيلات، عمليات البحث، الملفات المؤقتة (Cache)، ملفات تعريف الارتباط (Cookies)، الإشارات المرجعية.",
        inTool: ["Website Visits  |  Downloads  |  Searches  |  Cached Files  |  Cookies …"],
        forInvestigator: "يكشف النية والتسلسل: ماذا بحث، ماذا نزّل، من أين.",
        fromCase: "(مقترح) زيارة free-pdf-tools.example وتنزيل ملف قبل الحادثة.",
        mistake: "الظن أن «التصفح الخفي» أو مسح السجل لا يترك أي أثر.",
        quiz: { q: "أي نوع بيانات يُظهر الملفات التي نزّلها المستخدم؟", type: "choice", options: ["Downloads", "Cookies", "Bookmarks"], answer: "Downloads", why: "Downloads يسجّل اسم الملف ومصدره ووقت تنزيله." }
      },
      {
        id: "visit-columns", ar: "أعمدة الزيارات", en: "Date Visited / Visit Count / Visit Type / Visited From",
        analogy: "في المفكرة: التاريخ، عدد المرات، كيف وصلت (بالكتابة أم برابط)، ومن أي صفحة جئت.",
        meaning: "Visit Count عدد الزيارات • Visit Type (Typed = كتبه بنفسه، Link = ضغط رابطاً) • Visited From الصفحة السابقة.",
        inTool: ["جدول Website Visits: Date Visited | Title | URL | Visit Type | Visit Count | URL Record Count | Visited From | Web Browser"],
        forInvestigator: "Typed يقوّي دلالة القصد؛ Visited From يعيد بناء مسار التصفح.",
        fromCase: "أكثر موقع زيارة يُعرف بالترتيب حسب Visit Count.",
        mistake: "اعتبار كل زيارة مقصودة؛ بعضها تحويلات تلقائية.",
        quiz: { q: "أي قيمة لـ Visit Type تدل على أن المستخدم كتب العنوان بنفسه؟", type: "choice", options: ["Typed", "Link", "Redirect"], answer: "Typed", why: "Link تعني ضغط رابطاً في صفحة أخرى." }
      },
      {
        id: "timezone", ar: "الطوابع الزمنية والمنطقة الزمنية", en: "Timestamps / Time Zone",
        analogy: "ساعة الحائط في بلد آخر.",
        meaning: "الأدوات قد تعرض الوقت بتوقيت UTC أو المحلي؛ فلسطين UTC+2 شتاءً وUTC+3 صيفاً.",
        inTool: ["Time zone: Local time (UTC+03:00) / UTC   (إعداد المنطقة الزمنية في Browser History Examiner)"],
        forInvestigator: "خطأ المنطقة الزمنية يقلب الخط الزمني ويضعف التقرير.",
        fromCase: "مقارنة أوقات التصفح مع Event Viewer.",
        mistake: "مقارنة أوقات من أدوات بمناطق زمنية مختلفة.",
        quiz: { q: "حدث مسجل 19:15 UTC؛ كم الساعة في فلسطين صيفاً؟ (اكتب بصيغة 24 ساعة)", type: "value", answer: "22:15", accept: ["22:15:00", "10:15 pm"], why: "فلسطين صيفاً UTC+3: 19:15 + 3 = 22:15، وهو وقت الدخول المشبوه في Event Viewer." }
      }
    ]
  },
  practice: {
    tool: "bhe", state: "healthy",
    scenario: "افحص سجل تصفح حساب sami على جهازه: ماذا زار؟ وماذا نزّل؟ وهل لذلك علاقة بالحادثة؟ انتبه للمنطقة الزمنية عند المقارنة مع Event Viewer.",
    launchers: [{ tool: "bhe", label: "Browser History Examiner" }],
    freeNote: "جرّب أنواع البيانات الأخرى (معطّلة) وحقل Filter والترتيب بأعمدة أخرى، وبدّل المنطقة الزمنية ذهاباً وإياباً.",
    steps: [
      { id: "s1", title: "افتح Browser History Examiner", instruction: "اضغط زر «Browser History Examiner» في شريط التطبيقات.", why: "أداة تقرأ سجلات المتصفحات وتعرضها منظّمة.",
        expect: { type: "event", name: "tool:launch", where: { tool: "bhe" } }, target: "[data-launch=\"bhe\"]", hints: ["الزر فوق نافذة المحاكاة.", "اسمه اسم البرنامج.", "اضغط الزر."], demo: { kind: "launch", tool: "bhe" } },
      { id: "s2", title: "اختر مصدر السجل", instruction: "اختر «Load history from the local computer» ثم Next.", why: "السجل على جهاز سامي نفسه.",
        expect: { type: "event", name: "bhe:source", where: { kind: "Load history from the local computer" } }, target: "[data-win=\"bhe\"] input[value=\"Load history from the local computer\"]", hints: ["أول خيار فعّال في القائمة.", "الخيارات الأخرى للأقراص الخارجية والصور.", "اختر الخيار الأول ثم Next."], demo: { kind: "ui", tool: "bhe", action: "step", arg: "s2" } },
      { id: "s3", title: "حمّل سجل Chrome", instruction: "أبقِ Chrome مؤشراً (الوحيد المتوفر) واضغط Capture، وانتظر انتهاء التحميل.", why: "تقرأ الأداة ملفات السجل من ملف المستخدم sami.",
        expect: { type: "event", name: "bhe:capture", where: { browsers: "Chrome" } }, target: "[data-win=\"bhe\"] .dlg-btns button", hints: ["قائمة المتصفحات فيها Chrome مؤشراً.", "الزر Capture أسفل القائمة.", "اضغط Capture وانتظر (يمكنك Speed up)."], demo: { kind: "ui", tool: "bhe", action: "step", arg: "s3" } },
      { id: "s4", title: "افتح Website Visits", instruction: "من قائمة أنواع البيانات اليسرى اضغط Website Visits.", why: "جدول الزيارات هو أساس إعادة بناء النشاط.",
        expect: { type: "event", name: "bhe:datatype", where: { type: "Website Visits" } }, target: "[data-win=\"bhe\"] [data-type=\"Website Visits\"]", hints: ["القائمة اليسرى تعرض أنواع البيانات.", "آخر عنصر فعّال في القائمة.", "اضغط Website Visits."], demo: { kind: "ui", tool: "bhe", action: "step", arg: "s4" } },
      { id: "s5", title: "رتّب بـ Visit Count", instruction: "اضغط عنوان العمود Visit Count لترتيب الزيارات من الأكثر إلى الأقل.", why: "أكثر موقع زيارة يظهر في الأعلى.",
        expect: { type: "event", name: "bhe:sort", where: { col: "Visit Count", desc: true } }, target: "[data-win=\"bhe\"] th:nth-child(5)", hints: ["عناوين الأعمدة فوق الجدول.", "العمود الخامس.", "اضغط Visit Count مرة واحدة."], demo: { kind: "ui", tool: "bhe", action: "step", arg: "s5" } },
      { id: "s6", title: "ابحث عن free-pdf", instruction: "اكتب free-pdf في حقل Filter.", why: "للوصول إلى المواقع المرتبطة بالتنزيل المشبوه.",
        expect: { type: "event", name: "bhe:filter", where: { hasFree: true } }, target: "[data-win=\"bhe\"] input[aria-label=\"Filter\"]", hints: ["الحقل فوق الجدول.", "الاسم الذي ورد في حزم DNS في Wireshark.", "اكتب: free-pdf"], demo: { kind: "ui", tool: "bhe", action: "step", arg: "s6" } },
      { id: "s7", title: "افتح Downloads", instruction: "اضغط Downloads في قائمة أنواع البيانات.", why: "يعرض الملفات التي نزّلها المستخدم من المتصفح.",
        expect: { type: "event", name: "bhe:datatype", where: { type: "Downloads" } }, target: "[data-win=\"bhe\"] [data-type=\"Downloads\"]", hints: ["القائمة اليسرى.", "نوع البيانات الذي اسمه يدل على التنزيل.", "اضغط Downloads."], demo: { kind: "ui", tool: "bhe", action: "step", arg: "s7" } },
      { id: "s8", title: "بدّل إلى UTC", instruction: "غيّر Time zone إلى UTC وقارن وقت التنزيل.", why: "المقارنة مع Event Viewer تحتاج منطقة زمنية واحدة معروفة.",
        expect: { type: "event", name: "bhe:timezone", where: { tz: "UTC" } }, target: "[data-win=\"bhe\"] select[aria-label=\"Time Zone\"]", hints: ["القائمة المنسدلة فوق الجدول.", "الخيار الثاني.", "اختر UTC."], demo: { kind: "ui", tool: "bhe", action: "step", arg: "s8" } }
    ]
  },
  interpret: {
    coreHighlights: ["Visit Count 41","Link (free-pdf-tools)","رابط الملف التنفيذي","PDF-Tools-Free.exe"],   // essential values (labels) counted by the discovery counter
    sources: [
      { id: "visits", kind: "table", tool: "bhe", type: "Website Visits", tz: "Local", title: "Website Visits", heading: "Browser History Examiner › Website Visits (Local time UTC+03:00)" },
      { id: "downloads", kind: "table", tool: "bhe", type: "Downloads", tz: "Local", title: "Downloads", heading: "Browser History Examiner › Downloads (Local time)" },
      { id: "utc", kind: "table", tool: "bhe", type: "Website Visits", tz: "UTC", title: "Website Visits (UTC)", heading: "Browser History Examiner › Website Visits (UTC)" }
    ],
    highlights: [
      { src: "visits", row: "v0", col: "Visit Count", label: "Visit Count 41", concept: "visit-columns", meaning: "أكثر موقع زيارة: mail.oasis-trading.example (41 زيارة)، وهو بريد العمل؛ نشاط عادي لمحاسب." },
      { src: "visits", row: "v0", col: "Visit Type", label: "Typed", concept: "visit-columns", meaning: "كتب سامي العنوان بنفسه: زيارة مقصودة معتادة." },
      { src: "visits", row: "v4", col: "Visit Type", label: "Link (free-pdf-tools)", concept: "visit-columns", meaning: "وصل إلى الموقع بضغط رابط من نتائج البحث، لا بكتابة عنوانه." },
      { src: "visits", row: "v4", col: "Visited From", label: "Visited From: Google", concept: "visit-columns", meaning: "الصفحة السابقة: نتائج بحث Google عن free pdf editor؛ يكشف مسار الوصول." },
      { src: "visits", row: "v5", col: "URL", label: "رابط الملف التنفيذي", danger: true, concept: "artifacts", meaning: "رابط مباشر لملف PDF-Tools-Free.exe من موقع «تنزيل مجاني» وسيط: ممارسة خطرة (راجع درس التنزيل الآمن)." },
      { src: "downloads", row: "d0", col: "File Name", label: "PDF-Tools-Free.exe", danger: true, concept: "artifacts", meaning: "ملف نزّله سامي يوم 3/10/2026 11:32 AM، أي قبل الاختراق بنحو 11 ساعة؛ مخاطرة أمنية تُوثَّق، لكن الاختراق نفسه جاء عبر الشبكة (Event Viewer) لا عبر هذا الملف." },
      { src: "utc", row: "v4", col: "Date Visited", label: "Date Visited بتوقيت UTC", concept: "timezone", meaning: "الوقت المحلي 11:19:02 AM يصبح 8:19:02 AM بتوقيت UTC (فلسطين صيفاً UTC+3)." }
    ],
    table: [
      { see: "Visit Count مرتفع", means: "موقع متكرر الزيارة (غالباً عمل أو عادة يومية)." },
      { see: "Visit Type = Typed", means: "المستخدم كتب العنوان بنفسه: قصد أقوى." },
      { see: "Visit Type = Link", means: "وصل برابط من صفحة أخرى؛ انظر Visited From." },
      { see: "Visited From", means: "الصفحة السابقة: تعيد بناء مسار التصفح." },
      { see: "وقت محلي مقابل UTC", means: "فرق 3 ساعات في فلسطين صيفاً: وحّد المنطقة قبل المقارنة بين الأدوات." }
    ],
    ioc: ["تنزيل ملف تنفيذي من موقع وسيط (PDF-Tools-Free.exe) قبل الحادثة."],
    questions: [
      { q: "ما أكثر موقع زيارة (حسب Visit Count)؟", type: "choice", options: ["mail.oasis-trading.example", "news.example", "free-pdf-tools.example"], answer: "mail.oasis-trading.example", why: "41 زيارة، وهو بريد العمل." },
      { q: "كيف وصل المستخدم إلى free-pdf-tools.example؟", type: "choice", options: ["بضغط رابط من نتائج بحث Google (Link)", "كتب العنوان بنفسه (Typed)", "من البريد الإلكتروني"], answer: "بضغط رابط من نتائج بحث Google (Link)", why: "Visit Type = Link وVisited From = صفحة بحث Google." },
      { extra: true, q: "ما اسم الملف الذي نزّله من ذلك الموقع؟", type: "value", answer: "PDF-Tools-Free.exe", why: "ظهر في Downloads وفي Website Visits (الرابط المباشر)." },
      { extra: true, q: "حدث مسجل 19:15 UTC؛ كم الساعة في فلسطين صيفاً؟ (24 ساعة)", type: "value", answer: "22:15", accept: ["22:15:00", "10:15 pm"], why: "19:15 + 3 ساعات = 22:15: وقت الدخول المشبوه في Event Viewer (10:15:02 PM)." },
      { extra: true, q: "ما قيمة Visit Type التي تدل على أن المستخدم كتب العنوان بنفسه؟", type: "value", answer: "Typed", why: "Link = ضغط رابطاً." }
    ],
  },
  realWorld: {
    versionNotes: [
      "Browser History Examiner من Foxton Forensics برنامج تجاري (نسخة مجانية محدودة)؛ يدعم Chrome وEdge وFirefox وSafari وInternet Explorer.",
      "تستطيع الأداة تحميل السجل من الجهاز المحلي أو قرص خارجي أو جهاز بعيد أو صورة جنائية؛ المحاكاة تفعّل الجهاز المحلي وChrome فقط.",
      "المحاكاة تعرض سبع زيارات (سجل واحد لكل رابط)؛ في الواقع يحوي السجل آلاف السجلات."
    ],
    officialSite: "https://www.foxtonforensics.com/browser-history-examiner/",
    ethics: "سجل التصفح من أكثر البيانات خصوصية: لا تفحصه إلا بتفويض، وتعامل مع ما لا علاقة له بالقضية بسرّية، ولا تفترض أن كل زيارة مقصودة."
  }
};
