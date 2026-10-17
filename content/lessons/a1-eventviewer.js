/* Lesson a1-eventviewer — Lab 3 (Security log). Concepts: docs/concepts.md §22–29. Values/answers: docs/outputs-spec.md §هـ. */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a1-eventviewer"] = {
  id: "a1-eventviewer", seq: 5, axis: 1, axisTitle: "المحور 1: فحص الجهاز والشبكة المحلية", labs: [3], chapters: [7, 11], minutes: 30,
  title: "Event Viewer: من دخل إلى الجهاز ومتى؟",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "كيف دخل المهاجم إلى الجهاز؟ ومتى؟",
    reached: "update.exe زُرع مساء 3/10/2026، ويقرأ ملفات المالية ويرسلها إلى الخارج.",
    seeking: "من زرعه؟ نبحث في سجل الأحداث عمّا سبق زرع البرنامج: محاولات الدخول إلى حساب sami.",
    finding: "سجل Security يُظهر 6 محاولات دخول فاشلة (4625) إلى حساب sami عبر الشبكة من 192.168.1.50 (LAB-KALI) بين 10:10 و10:14 م يوم 3/10/2026، تلاها دخول ناجح (4624، النوع 3) في 10:15:02 م."
  },
  summary: [   // «ما يجب أن تتذكره» at the end of the lesson
    "سجل Security يحفظ محاولات الدخول: الحدث 4625 = دخول فاشل، و4624 = دخول ناجح؛ ونعزلها بـ Filter Current Log.",
    "6 محاولات فاشلة من 192.168.1.50 (LAB-KALI) بين 10:10 و10:14 م، تلاها دخول ناجح في 10:15:02 م من النوع 3 (عبر الشبكة): هذا تخمين لكلمة المرور.",
    "آخر دخول في السجل هو دخول سامي صباحاً (النوع 2، أمام الجهاز)؛ نوع الدخول ومصدره هما ما يفرّق بين المستخدم والمهاجم."
  ],
  objectives: [
    "الوصول إلى سجل Security وفلترته برقم الحدث (4625 و4624).",
    "قراءة تفاصيل الحدث: نوع الدخول وسبب الفشل ومصدر المحاولة.",
    "التمييز بين دخول صاحب الجهاز ودخول المهاجم، وبناء خط زمني."
  ],
  explain: {
    core: ["event-log","event-id","audit","logon-type","brute-force"],   // essential cards shown first; the others under «للاستزادة»
    intro: "التشبيه الجامع: سجل الأحداث دفتر الحارس عند البوابة: يكتب من دخل ومتى ومن أين ومن فشل. ثمانية مفاهيم بالترتيب.",
    figure: "guard",
    whatNext: "ستفتح Event Viewer، وتنتقل إلى Windows Logs › Security، وتفلتر 4625 فتعدّ المحاولات الفاشلة، ثم 4624 لتجد الدخول الناجح الذي جاء بعدها، ثم تجمع الاثنين معاً.",
    cards: [
      {
        id: "event-log", ar: "سجل الأحداث وأنواعه", en: "Event Log: Application / Security / System",
        analogy: "دفاتر متعددة: دفتر الحارس (Security)، دفتر الصيانة (System)، دفتر الأقسام (Application).",
        meaning: "Windows يسجّل الأحداث في سجلات؛ Security يحفظ عمليات الدخول والخروج والصلاحيات.",
        inTool: ["Windows Logs > Security"],
        forInvestigator: "أهم سجل لمعرفة «من دخل ومتى» (الفصل 7 من الكتاب: «أهم سجل يجب فحصه»).",
        fromCase: "كل أحداث الدخول والفشل في Security.",
        mistake: "البحث عن الدخول في سجل System.",
        quiz: { q: "في أي سجل تبحث عن محاولات الدخول الفاشلة؟", type: "choice", options: ["Security", "System", "Application"], answer: "Security", why: "Security هو دفتر الحارس: الدخول والخروج والصلاحيات." }
      },
      {
        id: "event-id", ar: "رقم الحدث", en: "Event ID",
        analogy: "رمز موحد في دفتر الحارس: «دخول» = 4624، «محاولة فاشلة» = 4625.",
        meaning: "رقم يحدد نوع الحدث. الأهم هنا: 4624 دخول ناجح • 4625 دخول فاشل • 4634 خروج • 4672 دخول بصلاحيات خاصة (مدير).",
        inTool: ["Event ID", "<All Event IDs>  ← اكتب 4625"],
        forInvestigator: "يحوّل آلاف الأحداث إلى ما يهم بنقرة فلتر.",
        fromCase: "الفلترة بـ 4625 تُظهر 6 أحداث.",
        mistake: "قراءة السجل كاملاً بلا فلترة.",
        quiz: { q: "ما رقم حدث الدخول الناجح؟ (اكتب رقماً)", type: "value", answer: "4624", why: "4624 دخول ناجح، 4625 دخول فاشل." }
      },
      {
        id: "audit", ar: "نجاح وفشل التدقيق", en: "Audit Success / Audit Failure",
        analogy: "ختم أخضر «سُمح» وختم أحمر «رُفض» في دفتر الحارس.",
        meaning: "عمود Keywords في سجل Security يبين نتيجة العملية.",
        inTool: ["Audit Success   (أيقونة مفتاح)", "Audit Failure   (أيقونة قفل)"],
        forInvestigator: "تتابع فشل كثير ثم نجاح من المصدر نفسه نمط مريب.",
        fromCase: "6 × Audit Failure ثم Audit Success من 192.168.1.50.",
        mistake: "تجاهل فشل واحد عادي (المستخدم أخطأ كلمته) مقابل سلسلة متقاربة.",
        quiz: { q: "كم Audit Failure متتالياً في القضية؟ (اكتب رقماً)", type: "value", answer: "6", why: "ست محاولات فاشلة بين 10:10:05 و10:14:20 مساءً." }
      },
      {
        id: "logon-type", ar: "نوع الدخول", en: "Logon Type",
        analogy: "هل دخل الزائر من الباب الأمامي بنفسه، أم أرسل طلباً من الخارج؟",
        meaning: "رقم في تفاصيل الحدث: 2 أمام الجهاز (لوحة المفاتيح) • 3 عبر الشبكة • 10 سطح مكتب بعيد (RDP) • 7 فتح قفل الشاشة.",
        inTool: ["Logon Type:\t\t3"],
        forInvestigator: "يميّز دخول صاحب الجهاز عن دخول من جهاز آخر.",
        fromCase: "الصباح نوع 2 (سامي)، المساء نوع 3 من LAB-KALI (مهاجم).",
        mistake: "الاكتفاء بـ «تم الدخول» دون نوعه ومصدره.",
        quiz: { q: "دخول بنوع 3؛ هل كان الشخص جالساً أمام الجهاز؟", type: "choice", options: ["نعم", "لا، عبر الشبكة"], answer: "لا، عبر الشبكة", why: "النوع 2 هو أمام الجهاز؛ النوع 3 اتصال من جهاز آخر عبر الشبكة." }
      },
      {
        id: "failure-reason", ar: "سبب الفشل", en: "Failure Reason / Status / Sub Status",
        analogy: "ملاحظة الحارس: «الاسم غير مسجل» أم «الاسم صحيح والبطاقة خاطئة».",
        meaning: "رموز توضّح سبب الفشل: 0xC000006A كلمة مرور خاطئة لاسم صحيح • 0xC0000064 اسم مستخدم غير موجود • 0xC0000234 الحساب مقفل.",
        inTool: ["Failure Reason:\t\tUnknown user name or bad password.", "Sub Status:\t\t0xC000006A"],
        forInvestigator: "يكشف هل المهاجم يعرف اسم الحساب (يخمّن كلمة المرور فقط) أم يجرّب أسماء عشوائية.",
        fromCase: "0xC000006A ← المهاجم يعرف أن الحساب sami.",
        mistake: "قراءة Status وترك Sub Status الأدق.",
        quiz: { q: "ماذا يعني 0xC0000064؟", type: "choice", options: ["اسم مستخدم غير موجود", "كلمة مرور خاطئة لاسم صحيح", "الحساب مقفل"], answer: "اسم مستخدم غير موجود", why: "0xC000006A كلمة مرور خاطئة، 0xC0000234 الحساب مقفل." }
      },
      {
        id: "source", ar: "مصدر الدخول", en: "Network Information",
        analogy: "لوحة سيارة الزائر عند البوابة.",
        meaning: "Workstation Name اسم الجهاز الطالب، وSource Network Address عنوانه.",
        inTool: ["Workstation Name:\tLAB-KALI", "Source Network Address:\t192.168.1.50"],
        forInvestigator: "يحدد الجهاز الذي يجب فحصه بعد ذلك.",
        fromCase: "المصدر 192.168.1.50 جار في الشبكة (يربطه بمفهوم Subnet Mask).",
        mistake: "الثقة المطلقة باسم الجهاز؛ يمكن تغييره، والعنوان أوثق نسبياً.",
        quiz: { q: "من أي عنوان جاءت المحاولات الفاشلة؟", type: "value", answer: "192.168.1.50", why: "عنوان الجهاز LAB-KALI، وهو جار لجهاز سامي في الشبكة نفسها." }
      },
      {
        id: "brute-force", ar: "تخمين كلمات المرور", en: "Brute Force",
        analogy: "لص يجرّب مفاتيح كثيرة على القفل واحداً تلو الآخر.",
        meaning: "محاولات دخول متتالية بكلمات مختلفة حتى تنجح إحداها.",
        inTool: ["سلسلة 4625 متقاربة زمنياً من المصدر نفسه ثم 4624"],
        forInvestigator: "نمط واضح في السجل؛ والحماية: كلمات قوية وقفل الحساب بعد عدد محاولات.",
        fromCase: "6 محاولات خلال 4 دقائق ثم نجاح في 10:15:02.",
        mistake: "عدّ كل فشل هجوماً؛ المعيار العدد والتقارب والمصدر.",
        quiz: { q: "ما الإعداد الذي كان سيمنع نجاح الهجوم؟", type: "choice", options: ["قفل الحساب بعد عدد محاولات فاشلة", "تكبير حجم القرص", "إخفاء اسم الجهاز"], answer: "قفل الحساب بعد عدد محاولات فاشلة", why: "القفل (مع كلمة مرور قوية) يوقف التخمين المتتالي." }
      },
      {
        id: "timeline", ar: "الخط الزمني", en: "Timeline",
        analogy: "ترتيب صور كاميرات المراقبة حسب الوقت لرواية ما حدث.",
        meaning: "ترتيب الأحداث من مصادر مختلفة على محور زمني واحد.",
        inTool: ["Date and Time    ← Event Viewer", "Timestamp         ← Autoruns", "Time of Day       ← Procmon"],
        forInvestigator: "يحوّل أدلة متفرقة إلى رواية متماسكة يفهمها القاضي؛ وانتبه للمنطقة الزمنية.",
        fromCase: "10:15:02 دخول ← 10:17:41 زرع ← صباحاً تسريب.",
        mistake: "خلط تنسيقات التاريخ (10/3/2026 بالتنسيق الأمريكي = 3 أكتوبر).",
        quiz: { q: "ما الحدث الذي جاء بعد الدخول الناجح بدقيقتين ونصف؟", type: "choice", options: ["زرع update.exe في مفتاح Run", "تسجيل خروج سامي", "6 محاولات فاشلة"], answer: "زرع update.exe في مفتاح Run", why: "10:15:02 دخول ثم 10:17:41 إضافة WindowsUpdateHelper (Autoruns)." }
      }
    ]
  },
  practice: {
    tool: "eventviewer", state: "healthy",
    scenario: "متى وكيف دخل أحد إلى جهاز سامي؟ افحص سجل Security في Event Viewer: عدّ المحاولات الفاشلة، ثم ابحث عن الدخول الناجح الذي تلاها.",
    launchers: [{ tool: "eventviewer", label: "Event Viewer" }],
    freeNote: "افحص السجل بنفسك: جرّب فلاتر أخرى (4634 و4672) وابحث عن أنواع الدخول المختلفة.",
    steps: [
      { id: "s1", title: "افتح Event Viewer", instruction: "اضغط زر «Event Viewer» في شريط التطبيقات (هو بمثابة قائمة ابدأ).", why: "Event Viewer مدمج في Windows ويعرض سجلات النظام.",
        expect: { type: "event", name: "tool:launch", where: { tool: "eventviewer" } }, target: "[data-launch=\"eventviewer\"]",
        hints: ["الزر فوق نافذة المحاكاة.", "اسمه اسم الأداة.", "اضغط «Event Viewer»."], demo: { kind: "launch", tool: "eventviewer" } },
      { id: "s2", title: "اختر سجل Security", instruction: "في الشجرة اليسرى اختر Windows Logs › Security.", why: "Security هو سجل الدخول والخروج والصلاحيات.",
        expect: { type: "event", name: "eventviewer:log", where: { log: "Security" } }, target: "[data-win=\"eventviewer\"] [data-log=\"Security\"]",
        hints: ["الشجرة على يسار النافذة.", "تحت Windows Logs.", "اضغط Security."], demo: { kind: "ui", tool: "eventviewer", action: "selectLog", arg: "Security" } },
      { id: "s3", title: "فلتر 4625", instruction: "اضغط «Filter Current Log…» في لوحة Actions، واكتب 4625 في <All Event IDs> ثم OK.", why: "4625 = دخول فاشل. عدد النتائج هو عدد المحاولات الفاشلة.",
        expect: { type: "event", name: "eventviewer:filter", where: { ids: "4625" } }, target: "[data-win=\"eventviewer\"] [data-act=\"filter\"]", onMismatch: "الفلتر المطلوب في هذه الخطوة: رقم الحدث 4625 وحده.",
        hints: ["اللوحة اليمنى Actions.", "الزر الخامس في قسم Security.", "Filter Current Log… ثم اكتب 4625 ثم OK."], demo: { kind: "ui", tool: "eventviewer", action: "filter", arg: "4625" } },
      { id: "s4", title: "اقرأ حدث فشل", instruction: "اضغط على أي حدث 4625 واقرأ تبويب General: Logon Type وSub Status وSource Network Address.", why: "التفاصيل تقول كيف حاول، وأي كلمة، ومن أين.",
        expect: { type: "event", name: "eventviewer:select", where: { id: 4625 } }, target: "[data-win=\"eventviewer\"] tr.gr-row",
        hints: ["القائمة الوسطى.", "أي صف من الستة.", "اضغط أي صف ثم اقرأ اللوحة السفلى."], demo: { kind: "ui", tool: "eventviewer", action: "select", arg: [4625, "10/3/2026 10:10:05 PM"] } },
      { id: "s5", title: "فلتر 4624", instruction: "افتح Filter Current Log… واكتب 4624 ثم OK.", why: "4624 = دخول ناجح؛ نريد الدخول الذي تلا المحاولات الفاشلة.",
        expect: { type: "event", name: "eventviewer:filter", where: { ids: "4624" } }, target: "[data-win=\"eventviewer\"] [data-act=\"filter\"]", onMismatch: "الفلتر المطلوب في هذه الخطوة: رقم الحدث 4624 وحده.",
        hints: ["الخطوات نفسها مع رقم مختلف.", "الرقم يبدأ بـ 462.", "اكتب 4624."], demo: { kind: "ui", tool: "eventviewer", action: "filter", arg: "4624" } },
      { id: "s6", title: "اعثر على دخول المساء", instruction: "من بين أحداث 4624 اضغط على الحدث المسجّل في 10/3/2026 10:15:02 PM.", why: "هو الدخول الذي جاء بعد دقيقة من آخر محاولة فاشلة؛ لاحظ Logon Type ومصدره.",
        expect: { type: "event", name: "eventviewer:select", where: { time: "10/3/2026 10:15:02 PM" } }, target: "[data-win=\"eventviewer\"] tr.gr-row[data-key=\"10/3/2026 10:15:02 PM|4624\"]",
        hints: ["ثلاثة أحداث فقط: اثنان صباحاً وواحد مساءً.", "الوقت المطلوب 10:15:02 مساءً.", "اضغط الصف الذي وقته 10/3/2026 10:15:02 PM."], demo: { kind: "ui", tool: "eventviewer", action: "select", arg: [4624, "10/3/2026 10:15:02 PM"] } },
      { id: "s7", title: "اجمع الرقمين", instruction: "افتح الفلتر واكتب 4624,4625 معاً ثم OK.", why: "لترى القصة كاملة: ست محاولات فاشلة ثم نجاح، في عرض واحد.",
        expect: { type: "event", name: "eventviewer:filter", where: { ids: "4624,4625" } }, target: "[data-win=\"eventviewer\"] [data-act=\"filter\"]", onMismatch: "المطلوب كتابة الرقمين معاً مفصولين بفاصلة: 4624,4625.",
        hints: ["الحقل يقبل أكثر من رقم.", "افصل بين الرقمين بفاصلة.", "اكتب: 4624,4625"], demo: { kind: "ui", tool: "eventviewer", action: "filter", arg: "4624,4625" } }
    ]
  },
  interpret: {
    coreHighlights: ["Audit Failure / 4625 × 6","10/3/2026 10:15:02 PM","Failure Reason","Logon Type 3"],   // essential values (labels) counted by the discovery counter
    sources: [
      { id: "list", kind: "table", tool: "eventviewer", title: "قائمة Security", heading: "Security   Number of events: 13", ids: "" },
      { id: "fail", tool: "eventviewer", cmd: "fail", title: "حدث 4625 (General)", heading: "Event 4625, Microsoft Windows security auditing." },
      { id: "breach", tool: "eventviewer", cmd: "logon-breach", title: "حدث 4624 — 10:15:02 PM", heading: "Event 4624 — 10/3/2026 10:15:02 PM" },
      { id: "local", tool: "eventviewer", cmd: "logon-local", title: "حدث 4624 — الصباح", heading: "Event 4624 — 10/4/2026 8:01:58 AM (و10/3/2026 8:01:44 AM)" }
    ],
    highlights: [
      { src: "list", row: "10/3/2026 10:10:05 PM|4625", col: "Keywords", label: "Audit Failure / 4625 × 6", danger: true, concept: "audit", meaning: "محاولات دخول فاشلة متتالية خلال 4 دقائق = تخمين كلمة مرور (Brute Force)." },
      { src: "list", row: "10/3/2026 10:15:02 PM|4624", col: "Date and Time", label: "10/3/2026 10:15:02 PM", danger: true, concept: "brute-force", meaning: "نجح التخمين بعد دقيقة من آخر محاولة فاشلة (10:14:20)." },
      { src: "list", row: "10/4/2026 8:01:58 AM|4624", col: "Date and Time", label: "10/4/2026 8:01:58 AM", concept: "logon-type", meaning: "دخول صباح اليوم التالي: هو آخر تسجيل دخول، لكنه دخول سامي نفسه (نوع 2) لا المهاجم." },
      { src: "list", row: "10/3/2026 10:31:55 PM|4634", col: "Event ID", label: "4634", concept: "event-id", meaning: "4634 = تسجيل خروج. 4672 = دخول بصلاحيات خاصة." },
      { src: "fail", line: "Logon Type:", match: "3", label: "Logon Type", concept: "logon-type", meaning: "دخول عبر الشبكة وليس أمام الجهاز (النوع 2)." },
      { src: "fail", line: "Failure Reason", match: "Unknown user name or bad password.", label: "Failure Reason", danger: true, concept: "failure-reason", meaning: "اسم المستخدم معروف لكن كلمة المرور خاطئة." },
      { src: "fail", line: "Sub Status", match: "0xC000006A", label: "Sub Status", danger: true, concept: "failure-reason", meaning: "اسم المستخدم صحيح وكلمة المرور خاطئة (المهاجم يعرف اسم الحساب)." },
      { src: "fail", line: "Workstation Name", match: "LAB-KALI", label: "Workstation Name", concept: "source", meaning: "اسم الجهاز الطالب؛ يمكن تغييره، فالعنوان أوثق نسبياً." },
      { src: "fail", line: "Source Network Address", match: "192.168.1.50", label: "Source Network Address", danger: true, concept: "source", meaning: "الجهاز المهاجِم داخل الشبكة نفسها." },
      { src: "breach", line: "Logon Type:", match: "3", label: "Logon Type 3", danger: true, concept: "logon-type", meaning: "دخول عبر الشبكة من جهاز آخر، وليس أمام الجهاز." },
      { src: "breach", line: "Source Network Address", match: "192.168.1.50", label: "Source Network Address", danger: true, concept: "source", meaning: "4624 في 10:15:02 PM من العنوان نفسه: نجح التخمين." },
      { src: "local", line: "Logon Type:", match: "2", label: "Logon Type 2", concept: "logon-type", meaning: "الصباح: نوع 2 من الجهاز نفسه (سامي)؛ المساء: نوع 3 من جهاز آخر (مهاجم)." },
      { src: "local", line: "Workstation Name", match: "ACC-PC07", label: "Workstation Name", concept: "source", meaning: "الجهاز نفسه (ACC-PC07)، لا جهاز آخر." },
      { src: "local", line: "Source Network Address", match: "127.0.0.1", label: "Source Network Address", concept: "source", meaning: "127.0.0.1 = الجهاز نفسه، أي سامي أمام الجهاز." },
      { src: "local", line: "Logon Process", match: "User32", label: "Logon Process", concept: "logon-type", meaning: "عملية دخول واجهة المستخدم (User32 مع Negotiate) = جلسة عادية أمام الجهاز." }
    ],
    table: [
      { see: "Audit Failure / 4625 ×6 خلال 4 دقائق", means: "محاولات دخول فاشلة متتالية = تخمين كلمة مرور (Brute Force)." },
      { see: "Sub Status: 0xC000006A", means: "اسم المستخدم صحيح وكلمة المرور خاطئة (المهاجم يعرف اسم الحساب)." },
      { see: "Logon Type: 3", means: "دخول عبر الشبكة وليس أمام الجهاز (النوع 2)." },
      { see: "Source Network Address: 192.168.1.50 / LAB-KALI", means: "الجهاز المهاجِم داخل الشبكة نفسها." },
      { see: "4624 في 10:15:02 PM من العنوان نفسه", means: "نجح التخمين بعد دقيقة من آخر محاولة فاشلة." },
      { see: "الفرق مع دخول 8:01 AM", means: "الصباح: نوع 2 من الجهاز نفسه (سامي)؛ المساء: نوع 3 من جهاز آخر (مهاجم)." },
      { see: "10:15:02 → 10:17:41 (Autoruns)", means: "بعد الدخول بدقيقتين ونصف زُرع update.exe: الخط الزمني يربط الأدلة." }
    ],
    ioc: ["6 محاولات فاشلة (4625) من 192.168.1.50 خلال 4 دقائق.", "دخول ناجح (4624، Logon Type 3) من المصدر نفسه بعد دقيقة."],
    questions: [
      { q: "كم عدد محاولات الدخول الفاشلة؟ (اكتب رقماً)", type: "value", answer: "6", why: "Event ID 4625، من 10:10:05 إلى 10:14:20 PM في 3/10/2026." },
      { q: "ما آخر تسجيل دخول؟ (انسخ الوقت كما يظهر في Date and Time)", type: "value", answer: "10/4/2026 8:01:58 AM", accept: ["10/4/2026 8:01:58 AM"], why: "هو آخر 4624 زمنياً: الحساب sami، Logon Type 2 (سامي نفسه صباحاً). لكن انتبه: آخر دخول مشبوه مختلف (السؤال التالي)." },
      { extra: true, q: "وما آخر دخول مشبوه؟", type: "choice", options: ["10/3/2026 10:15:02 PM — من 192.168.1.50 (LAB-KALI)، Logon Type 3", "10/4/2026 8:01:58 AM — سامي، Logon Type 2", "10/3/2026 8:01:44 AM — سامي، Logon Type 2"], answer: "10/3/2026 10:15:02 PM — من 192.168.1.50 (LAB-KALI)، Logon Type 3", why: "يتميّز بنوع الدخول (3) ومصدره (جهاز آخر)، وبأنه جاء بعد سلسلة فشل متتالية." },
      { extra: true, q: "ما الفرق بين Logon Type 2 وLogon Type 3؟", type: "choice", options: ["2 أمام الجهاز، و3 عبر الشبكة من جهاز آخر", "2 عبر الشبكة، و3 أمام الجهاز", "كلاهما عبر سطح المكتب البعيد"], answer: "2 أمام الجهاز، و3 عبر الشبكة من جهاز آخر", why: "النوع 10 هو سطح المكتب البعيد." },
      { extra: true, q: "لماذا يهم Sub Status؟", type: "choice", options: ["يبيّن أن اسم الحساب صحيح وكلمة المرور خاطئة", "يبيّن اسم الجهاز", "يبيّن وقت الدخول"], answer: "يبيّن أن اسم الحساب صحيح وكلمة المرور خاطئة", why: "0xC000006A تعني أن المهاجم يعرف اسم الحساب ويخمّن كلمة المرور فقط." },
      { extra: true, q: "رتّب الأحداث زمنياً:", type: "choice", options: ["6 فشل ← نجاح ← زرع update.exe ← اتصال خارجي", "زرع update.exe ← 6 فشل ← نجاح ← اتصال خارجي", "نجاح ← 6 فشل ← اتصال خارجي ← زرع update.exe"], answer: "6 فشل ← نجاح ← زرع update.exe ← اتصال خارجي", why: "10:10–10:14 فشل، 10:15:02 نجاح، 10:17:41 زرع، ثم تسريب بعد دخول سامي صباحاً." }
    ],
  },
  realWorld: {
    versionNotes: [
      "Event Viewer مدمج في Windows ويُفتح بكتابة eventvwr.msc في مربع التشغيل؛ قراءة سجل Security تحتاج صلاحيات مدير.",
      "تظهر أحداث 4624 و4625 فقط إذا كان تدقيق الدخول مفعّلاً في سياسة الأمان.",
      "المحاكاة تفعّل سجل Security وفلتر Event ID؛ بقية خيارات الفلتر وتبويب Details غير مفعّلة."
    ],
    officialSite: null,
    ethics: "لا تمسح السجل (Clear Log) على جهاز قيد التحقيق؛ مسحه إتلاف للدليل. واقرأ سجلات أجهزة تملك إذناً بفحصها فقط، فهي تكشف أنشطة أشخاص."
  }
};
