/* Lesson a1-procmon-rammap — behaviour (Process Monitor) and memory (RAMMap), the last half of Lab 2.
   Concepts: docs/concepts.md §19–20. Values/answers: docs/outputs-spec.md §د-3 و§د-4.
   NOTE: the unfiltered Process Monitor list contains PROPOSED background rows (explorer.exe / chrome.exe) — see outputs-spec. */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a1-procmon-rammap"] = {
  id: "a1-procmon-rammap", seq: 4, axis: 1, axisTitle: "المحور 1: فحص الجهاز والشبكة المحلية", labs: [2], chapters: [10, 11], minutes: 30,
  title: "Procmon وRAMMap: ماذا يفعل البرنامج؟",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "ماذا يفعل update.exe بالضبط؟",
    reached: "update.exe يبدأ تلقائياً ويتصل بعنوان خارجي على منفذ غير مألوف.",
    seeking: "نراقب نشاطه لحظة بلحظة: أي ملفات يقرأ وأي مفاتيح يكتب، وكم يستهلك من الذاكرة.",
    finding: "برنامج update.exe (PID 6120) مسجّل في HKCU\\…\\Run باسم WindowsUpdateHelper منذ 3/10/2026 10:17:41 م، يقرأ ملفات Finance ويضغطها في arc_1003.zip ويرسلها إلى 203.0.113.45:4444."
  },
  summary: [   // «ما يجب أن تتذكره» at the end of the lesson
    "Process Monitor يسجّل كل فعل يقوم به البرنامج؛ والفلتر Process Name is update.exe يُخفي الضجيج ولا يحذفه (يبقى 10 من 15 حدثاً).",
    "تسلسل الأدلة: RegSetValue على مفتاح Run (الاستمرار)، ثم قراءة ملفات Finance، ثم كتابة arc_1003.zip، ثم TCP Send (الإرسال إلى الخارج).",
    "RAMMap يُظهر أن update.exe أكبر مستهلك للذاكرة الخاصة (1,212,416 K ≈ 1.2 GB)، وهذا يفسّر بطء الجهاز."
  ],
  objectives: [
    "فلترة آلاف الأحداث في Process Monitor حتى تبقى أحداث البرنامج المشبوه فقط.",
    "قراءة تسلسل أحداث السجل والملفات والشبكة واستنتاج السلوك (تسريب بيانات).",
    "مقارنة استهلاك الذاكرة في RAMMap لكشف عملية غير متناسبة."
  ],
  explain: {
    intro: "التشبيه الجامع: Procmon كاميرا مراقبة تسجّل كل حركة، وRAMMap لوحة طاولات العمل في المصنع.",
    figure: "factory",
    whatNext: "ستفتح Process Monitor، وتنشئ فلتراً Process Name is update.exe، وتقرأ أحداثه (السجل ثم الملفات ثم الشبكة)، ثم تفتح RAMMap وترتّب العمليات حسب Private لترى حجم ذاكرة update.exe.",
    cards: [
      {
        id: "procmon-events", ar: "أحداث النظام في Procmon", en: "Operation / Path / Result",
        analogy: "كاميرا مراقبة تسجّل كل حركة لكل عامل: فتح خزانة، قرأ ملفاً، أجرى مكالمة.",
        meaning: "كل سطر عملية واحدة: ماذا فعلت العملية (Operation)، على ماذا (Path)، والنتيجة (Result). أنواعها: ملفات (CreateFile، ReadFile، WriteFile)، سجل (RegOpenKey، RegSetValue)، شبكة (TCP Connect، TCP Send)، عمليات (Process Start).",
        inTool: ["ReadFile  C:\\Users\\sami\\Documents\\Finance\\Q3-Salaries.xlsx  SUCCESS"],
        forInvestigator: "يحوّل الشك إلى سلوك موثّق: لا «يتصل بالخارج» فقط، بل «يقرأ ملفات المالية ثم يضغطها ثم يرسلها». الفلترة ضرورية لأن الأحداث بالآلاف في الدقيقة.",
        fromCase: "تسلسل ReadFile ← WriteFile arc_1003.zip ← TCP Send = تسريب.",
        mistake: "القراءة دون فلتر والضياع؛ أو اعتبار NAME NOT FOUND خطأً خطيراً (هو غالباً بحث عن شيء غير موجود).",
        quiz: { q: "أي عملية في Procmon تثبت أن البيانات خرجت من الجهاز؟", type: "choice", options: ["TCP Send", "ReadFile", "RegOpenKey"], answer: "TCP Send", why: "TCP Send يرسل بايتات عبر الشبكة؛ ReadFile مجرد قراءة محلية." }
      },
      {
        id: "memory", ar: "الذاكرة والذاكرة الخاصة", en: "RAM / Private memory",
        analogy: "طاولات العمل في المصنع: كل عامل يحجز طاولة؛ عامل جديد يحجز نصف القاعة أمر مريب.",
        meaning: "RAM ذاكرة العمل المؤقتة. Private ما تحجزه العملية لنفسها فقط.",
        inTool: ["RAMMap › Processes", "update.exe   Private 1,212,416 K"],
        forInvestigator: "استهلاك غير متناسب مع حجم البرنامج ووظيفته مؤشر. وما في الذاكرة يضيع عند إطفاء الجهاز (لذلك يُفحص الجهاز الحي قبل إطفائه).",
        fromCase: "ملف نحو 1MB يستهلك نحو 1.2GB؛ يفسّر البطء.",
        mistake: "اعتبار كل استهلاك كبير خبيثاً؛ المتصفح يستهلك كثيراً بطبيعته. المعيار: التناسب مع الوظيفة.",
        quiz: { q: "لماذا نقارن update.exe بـ notepad.exe؟", type: "choice", options: ["لإظهار عدم التناسب بين برنامجين صغيرين", "لأن notepad.exe خبيث", "لأن لهما الاسم نفسه"], answer: "لإظهار عدم التناسب بين برنامجين صغيرين", why: "برنامج بسيط مثل notepad يحتاج نحو 4 MB فقط، فيبدو 1.2 GB لـ update.exe شاذاً." }
      }
    ]
  },
  practice: {
    tool: "procmon", state: "infected",
    scenario: "عرفنا أن update.exe يبدأ تلقائياً ويتصل بالخارج. السؤال الآن: ماذا يفعل بالضبط؟ وكم يستهلك من الذاكرة؟ الجهاز مصاب (يمكنك التبديل إلى السليم للمقارنة).",
    launchers: [{ tool: "folder", label: "مجلد Sysinternals", auto: true }],
    folderTools: ["procmon", "rammap"],
    states: [{ id: "infected", label: "جهاز مصاب" }, { id: "healthy", label: "جهاز سليم" }],
    freeNote: "جرّب فلاتر مختلفة (Operation is TCP Send، Path contains Finance) وأزرار الفئات، ثم قارن العمليات في RAMMap.",
    steps: [
      { id: "s1", title: "شغّل Process Monitor", instruction: "في نافذة Sysinternals انقر نقراً مزدوجاً على Procmon64.exe.", why: "Procmon يسجّل أحداث الملفات والسجل والشبكة والعمليات لحظة بلحظة.",
        expect: { type: "event", name: "tool:launch", where: { tool: "procmon" } }, target: "[data-win=\"folder\"] [data-tool=\"procmon\"]",
        hints: ["انظر إلى الملفات في النافذة الصغيرة.", "الملف الذي يبدأ اسمه بـ Procmon.", "انقر نقراً مزدوجاً على Procmon64.exe."], demo: { kind: "folder-launch", tool: "procmon" } },
      { id: "s2", title: "افتح نافذة الفلتر", instruction: "اضغط زر Filter… في شريط الأدوات (أو من قائمة Filter).", why: "الأحداث كثيرة وفيها نشاط عادي لبرامج أخرى؛ الفلتر يخفيها دون حذفها.",
        expect: { type: "event", name: "procmon:filter-open" }, target: "[data-win=\"procmon\"] [data-pm=\"filter\"]",
        hints: ["الزر في الصف تحت شريط القوائم.", "اسمه يشبه الأداة التي تحتاجها (Ctrl+L).", "اضغط «Filter…»."], demo: { kind: "ui", tool: "procmon", action: "openFilter", arg: [] } },
      { id: "s3", title: "أنشئ الفلتر: Process Name is update.exe", instruction: "اختر Column = Process Name وRelation = is واكتب update.exe في Value واجعل الإجراء Include، ثم Add ثم OK.", why: "نريد أحداث البرنامج المشبوه وحده. الفلاتر لا تحذف الأحداث؛ يمكنك إلغاؤها بـ Reset.",
        expect: { type: "event", name: "procmon:filter-apply", where: { hasProcessRule: true } }, target: "[data-win=\"procmon\"] .dlg input[aria-label=\"Value\"]",
        onMismatch: "الفلتر المطلوب: Process Name — is — update.exe — Include. تأكد من القيم ثم اضغط Add ثم OK.",
        hints: ["القيم الافتراضية للعمود والعلاقة قريبة مما تريد.", "اكتب اسم الملف المشبوه في خانة Value ثم اضغط Add.", "Process Name · is · update.exe · Include ثم Add ثم OK."], demo: { kind: "ui", tool: "procmon", action: "applyUpdateFilter", arg: [] } },
      { id: "s4", title: "اقرأ حدث السجل", instruction: "اضغط على صف RegSetValue واقرأ Path وDetail.", why: "يُثبت أن البرنامج يعيد تثبيت نفسه في التشغيل التلقائي عند كل تشغيل.",
        expect: { type: "event", name: "procmon:select", where: { op: "RegSetValue" } }, target: "[data-win=\"procmon\"] tr.gr-row:nth-child(2)",
        hints: ["الصفوف الآن كلها لـ update.exe؛ انظر إلى عمود Operation.", "العملية التي تبدأ بـ Reg وتكتب قيمة.", "اضغط صف RegSetValue."], demo: { kind: "ui", tool: "procmon", action: "select", arg: "RegSetValue" } },
      { id: "s5", title: "اقرأ حدث الإرسال", instruction: "اضغط على صف TCP Send واقرأ Detail.", why: "هذه العملية هي التي تثبت أن البيانات خرجت فعلاً وليس مجرد اتصال.",
        expect: { type: "event", name: "procmon:select", where: { op: "TCP Send", process: "update.exe" } }, target: "[data-win=\"procmon\"] tr.gr-row:nth-last-child(2)",
        hints: ["الأحداث مرتبة زمنياً؛ الشبكة قرب النهاية.", "العملية التي تبدأ بـ TCP وتعني الإرسال.", "اضغط صف TCP Send."], demo: { kind: "ui", tool: "procmon", action: "select", arg: "TCP Send" } },
      { id: "s6", title: "شغّل RAMMap", instruction: "من نافذة Sysinternals انقر نقراً مزدوجاً على RAMMap64.exe.", why: "Procmon يخبرنا ماذا يفعل البرنامج؛ RAMMap يخبرنا كم ذاكرة يحجز.",
        expect: { type: "event", name: "tool:launch", where: { tool: "rammap" } }, target: "[data-win=\"folder\"] [data-tool=\"rammap\"]",
        hints: ["عد إلى نافذة Sysinternals (تحت النوافذ الأخرى).", "الملف الذي يبدأ اسمه بـ RAMMap.", "انقر نقراً مزدوجاً على RAMMap64.exe."], demo: { kind: "folder-launch", tool: "rammap" } },
      { id: "s7", title: "افتح تبويب Processes", instruction: "في RAMMap اضغط تبويب Processes.", why: "يعرض ذاكرة كل عملية على حدة.",
        expect: { type: "event", name: "rammap:tab", where: { tab: "Processes" } }, target: "[data-win=\"rammap\"] [data-tab=\"Processes\"]",
        hints: ["التبويبات في صف أفقي أعلى القائمة.", "الثاني من اليسار.", "اضغط Processes."], demo: { kind: "ui", tool: "rammap", action: "selectTab", arg: "Processes" } },
      { id: "s8", title: "رتّب حسب Private", instruction: "اضغط على عنوان العمود Private لترتيب العمليات.", why: "Private هو أهم عمود للمقارنة؛ العملية الشاذة تصعد إلى الأعلى.",
        expect: { type: "event", name: "rammap:sort", where: { col: "Private", desc: true } }, target: "[data-win=\"rammap\"] th:nth-child(4)",
        hints: ["العناوين في أعلى الجدول.", "العمود الرابع.", "اضغط عنوان Private (مرة واحدة يرتّب تنازلياً)."], demo: { kind: "ui", tool: "rammap", action: "sortBy", arg: "Private" } }
    ]
  },
  interpret: {
    coreHighlights: ["RegSetValue … \\Run\\WindowsUpdateHelper","WriteFile … Temp\\arc_1003.zip","TCP Send Length: 65,536","update.exe Private 1,212,416 K"],   // essential values (labels) counted by the discovery counter
    sources: [
      { id: "pm", kind: "table", tool: "procmon", title: "Procmon — update.exe", heading: "Process Monitor — Filter: Process Name is update.exe then Include", state: "infected" },
      { id: "ram", kind: "table", tool: "rammap", title: "RAMMap — Processes", heading: "RAMMap › Processes (مرتبة حسب Private)", state: "infected" }
    ],
    highlights: [
      { src: "pm", row: "Process Start:0", col: "Detail", label: "Parent PID", concept: "process-pid", meaning: "بدأ مع واجهة المستخدم (explorer.exe) بعد دخول سامي 8:01:58 AM؛ يتسق مع مفتاح Run وEvent Viewer." },
      { src: "pm", row: "RegSetValue:0", col: "Path", label: "RegSetValue … \\Run\\WindowsUpdateHelper", danger: true, concept: "persistence", meaning: "البرنامج يعيد تثبيت نفسه في التشغيل التلقائي عند كل تشغيل." },
      { src: "pm", row: "QueryDirectory:0", col: "Path", label: "QueryDirectory … Finance", danger: true, concept: "procmon-events", meaning: "يتصفح مجلد المالية قبل قراءة ملفاته." },
      { src: "pm", row: "ReadFile:0", col: "Path", label: "ReadFile", danger: true, concept: "procmon-events", meaning: "يقرأ ملفات المالية واحداً تلو الآخر (Q3-Salaries.xlsx ثم Suppliers-2026.xlsx ثم Bank-Accounts.docx)." },
      { src: "pm", row: "WriteFile:0", col: "Path", label: "WriteFile … Temp\\arc_1003.zip", danger: true, concept: "procmon-events", meaning: "يجمع ما قرأه في ملف مضغوط مؤقت." },
      { src: "pm", row: "TCP Send:0", col: "Detail", label: "TCP Send Length: 65,536", danger: true, concept: "procmon-events", meaning: "يرسل البيانات للخارج = تسريب بيانات (Exfiltration)." },
      { src: "pm", row: "RegOpenKey:0", col: "Result", label: "NAME NOT FOUND", concept: "procmon-events", meaning: "يتفقد إعدادات برنامج الحماية (Windows Defender): سلوك استطلاع شائع لدى البرمجيات الخبيثة؛ النتيجة وحدها ليست خطيرة." },
      { src: "ram", row: "update.exe", col: "Private", label: "update.exe Private 1,212,416 K", danger: true, concept: "memory", meaning: "ملف حجمه نحو 1 MB يستهلك أكثر من 1 GB ذاكرة خاصة: غير متناسب؛ يتسق مع ضغط الملفات في الذاكرة قبل إرسالها، ويفسّر شكوى البطء." },
      { src: "ram", row: "notepad.exe", col: "Private", label: "notepad.exe (للمقارنة)", concept: "memory", meaning: "برنامج بسيط يحتاج ذاكرة قليلة (نحو 4 MB)؛ المقارنة توضح الشذوذ." }
    ],
    table: [
      { see: "RegSetValue … \\Run\\WindowsUpdateHelper", means: "البرنامج يعيد تثبيت نفسه في التشغيل التلقائي عند كل تشغيل." },
      { see: "QueryDirectory … Finance ثم ReadFile", means: "يتصفح مجلد المالية ويقرأ الملفات واحداً تلو الآخر." },
      { see: "WriteFile … Temp\\arc_1003.zip", means: "يجمع ما قرأه في ملف مضغوط مؤقت." },
      { see: "TCP Send … 203.0.113.45:4444 Length: 65,536", means: "يرسل البيانات للخارج = تسريب بيانات (Exfiltration)." },
      { see: "RegOpenKey … Windows Defender … NAME NOT FOUND", means: "يتفقد إعدادات برنامج الحماية (سلوك استطلاع شائع لدى البرمجيات الخبيثة)." },
      { see: "Parent PID … explorer.exe", means: "بدأ مع واجهة المستخدم بعد دخول سامي 8:01:58 AM." },
      { see: "update.exe Private ≈ 1.2 GB", means: "ذاكرة غير متناسبة مع حجم الملف؛ تفسّر البطء." }
    ],
    ioc: ["قراءة ملفات حساسة ثم كتابة ملف مضغوط ثم إرسال.", "استهلاك ذاكرة غير متناسب."],
    questions: [
      { q: "أي أداة وأي عملية أثبتت أن البرنامج يرسل الملفات وليس يتصل فقط؟", type: "choice", options: ["Procmon: TCP Send بعد ReadFile", "TCPView: حالة Established", "Autoruns: الصف الوردي"], answer: "Procmon: TCP Send بعد ReadFile", why: "TCPView وAutoruns يثبتان الاتصال والاستمرار؛ Procmon وحده يعرض الإرسال الفعلي مسبوقاً بقراءة الملفات." },
      { q: "كم يستهلك update.exe تقريباً من الذاكرة الخاصة؟ (اكتب القيمة بالـ GB)", type: "value", answer: "1.2", accept: ["1.2 GB", "1.2GB", "≈ 1.2 GB", "1.2 gb"], why: "1,212,416 K ≈ 1.2 GB، بينما notepad.exe نحو 4 MB." },
      { extra: true, q: "لماذا نقارن update.exe بـ notepad.exe؟", type: "choice", options: ["لإظهار عدم التناسب بين برنامجين صغيرين", "لأن notepad.exe خبيث", "لأن لهما الاسم نفسه"], answer: "لإظهار عدم التناسب بين برنامجين صغيرين", why: "المعيار هو تناسب الاستهلاك مع حجم البرنامج ووظيفته." },
      { extra: true, q: "هل تعني النتيجة NAME NOT FOUND أن الجهاز في خطر مباشر؟", type: "choice", options: ["لا؛ غالباً بحث عن مفتاح غير موجود، والمهم هو ما يبحث عنه (إعدادات الحماية)", "نعم دائماً", "لا علاقة لها بالقضية"], answer: "لا؛ غالباً بحث عن مفتاح غير موجود، والمهم هو ما يبحث عنه (إعدادات الحماية)", why: "NAME NOT FOUND تعني أن المفتاح غير موجود، وهي شائعة في الاستخدام العادي." }
    ],
  },
  realWorld: {
    versionNotes: [
      "Process Monitor الحالي v4.11، ويعمل على Windows 11 وما بعده؛ يلتقط ملايين الأحداث، لذلك الفلترة قبل القراءة عادة أساسية.",
      "في البرنامج الحقيقي أعمدة وقوائم أكثر؛ المحاكاة تعرض الأعمدة الافتراضية السبعة وتفعّل فلتر Process Name وزر الفئات.",
      "RAMMap من Sysinternals أيضاً؛ تفعّل المحاكاة تبويبي Use Counts وProcesses فقط."
    ],
    officialSite: "https://learn.microsoft.com/en-us/sysinternals/downloads/procmon",
    ethics: "Process Monitor يسجّل كل نشاط الجهاز بما فيه خصوصيات المستخدم: لا تشغّله إلا على جهاز تملك إذناً بفحصه، وتعامل مع ما يظهر فيه بسرّية."
  }
};
