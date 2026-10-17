/* Lesson a1-autoruns — Autoruns half of Lab 2 (TCPView / Procmon / RAMMap come in phase 2).
   Concept text: docs/concepts.md §12–15, 21. Values and answers: docs/outputs-spec.md §د-1. */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a1-autoruns"] = {
  id: "a1-autoruns", seq: 2, axis: 1, axisTitle: "المحور 1: فحص الجهاز والشبكة المحلية", labs: [2], chapters: [10, 11], minutes: 25,
  title: "Autoruns: كيف يعود البرنامج الخبيث؟",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "هل يبدأ برنامج غريب وحده مع تشغيل الجهاز؟",
    reached: "جهاز ACC-PC07 عنوانه 192.168.1.23 ومتصل بالإنترنت.",
    seeking: "إن كان الجهاز «يعمل وحده» فلعل برنامجاً يبدأ تلقائياً مع كل تسجيل دخول. نبحث عنه في أماكن التشغيل التلقائي.",
    finding: "مدخل WindowsUpdateHelper في HKCU\\…\\Run يشير إلى C:\\Users\\sami\\AppData\\Roaming\\WinUpdate\\update.exe، بلا ناشر موثّق، وأُضيف في 3/10/2026 10:17:41 م."
  },
  summary: [   // «ما يجب أن تتذكره» at the end of the lesson
    "Autoruns يجمع كل أماكن التشغيل التلقائي في نافذة واحدة، وتبويب Logon يعرض مفاتيح Run التي تعمل مع كل تسجيل دخول.",
    "المدخل المشبوه: WindowsUpdateHelper في HKCU\\…\\Run يشغّل update.exe من مجلد AppData، بلا ناشر موثّق، وأُضيف في 10/3/2026 10:17:41 PM.",
    "الصف الوردي = لا توقيع موثّق، والأصفر = الملف غير موجود؛ اللون إشارة تستحق الفحص، لا حكماً نهائياً بالاختراق."
  ],
  objectives: [
    "فهم معنى التشغيل التلقائي (Persistence) ولماذا يهم المحقق.",
    "قراءة نافذة Autoruns وتمييز الصف الوردي والأصفر.",
    "الوصول إلى المدخل المشبوه وتوثيق مساره ووقت إضافته دون تغيير الدليل."
  ],
  explain: {
    intro: "التشبيه الجامع للدروس القادمة: الحاسوب مصنع؛ البرامج المثبّتة عمّال مسجّلون، والعمليات الجارية عمّال على رأس العمل، والمنافذ أبواب شحن، والسجل دفتر قواعد المصنع. افتح البطاقات بالترتيب.",
    figure: "factory",
    whatNext: "ستفتح مجلد Sysinternals وتشغّل Autoruns، وتنظر في تبويب Logon على جهاز سليم أولاً، ثم تبدّل إلى الجهاز المصاب لتجد المدخل المشبوه، وتخفي مدخلات Microsoft لتركّز على الباقي، وتتعرف على الصف الأصفر.",
    cards: [
      {
        id: "process-pid", ar: "البرنامج والعملية ورقمها", en: "Program / Process / PID",
        analogy: "البرنامج وصفة طبخ في كتاب؛ العملية طبّاخ يطبخها الآن، ورقمه على بطاقة العمل.",
        meaning: "العملية برنامج قيد التشغيل؛ يعطيها النظام رقماً فريداً (PID) طوال تشغيلها. لكل عملية «أب» شغّلها (Parent).",
        inTool: ["update.exe   6120", "Parent PID: 5532 (explorer.exe)    ← Procmon (درس لاحق)"],
        forInvestigator: "PID هو الخيط الذي يربط الأدوات: نفس الرقم في TCPView وnetstat وProcmon وRAMMap.",
        fromCase: "PID 6120 = update.exe في كل الأدوات.",
        mistake: "الحكم على العملية من اسمها؛ الاسم سهل التقليد (svchost.exe في مسار غريب مثلاً).",
        quiz: { q: "في netstat ظهر اتصال PID 6120؛ كيف تعرف البرنامج؟", type: "choice", options: ["من TCPView أو tasklist", "من لون شاشة الجهاز", "من اسم الجهاز فقط"], answer: "من TCPView أو tasklist", why: "كلاهما يربط رقم العملية باسم البرنامج." }
      },
      {
        id: "persistence", ar: "التشغيل التلقائي والاستمرار", en: "Autostart / Persistence",
        analogy: "نسخة مفتاح مخبأة تحت سجادة الباب: يعود اللص متى شاء.",
        meaning: "أماكن في النظام تجعل برنامجاً يعمل وحده عند الإقلاع أو الدخول (مفاتيح Run، المهام المجدولة، الخدمات). البرمجيات الخبيثة تضيف نفسها إليها لتبقى بعد إعادة التشغيل.",
        inTool: ["HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "   WindowsUpdateHelper   ← Autoruns، تبويب Logon"],
        forInvestigator: "من أول الأماكن التي تُفحص؛ يكشف «كيف يعود» البرنامج الخبيث، وTimestamp يعطي وقت الزرع.",
        fromCase: "أُضيف WindowsUpdateHelper في 3/10 10:17:41 م.",
        mistake: "حذف المدخل من الواجهة قبل توثيقه؛ المحقق يوثّق أولاً ولا يغيّر الدليل.",
        quiz: { q: "لماذا يضع البرنامج الخبيث نفسه في مفتاح Run؟", type: "choice", options: ["ليعمل تلقائياً بعد كل إعادة تشغيل", "ليختفي من قائمة العمليات", "ليسرّع الجهاز"], answer: "ليعمل تلقائياً بعد كل إعادة تشغيل", why: "ما في Run يبدأ مع كل دخول، فيضمن المهاجم بقاءه." }
      },
      {
        id: "registry", ar: "السجل ومفاتيحه", en: "Windows Registry",
        analogy: "دفتر قواعد المصنع: كل إعداد مكتوب في صفحة لها عنوان.",
        meaning: "قاعدة بيانات إعدادات Windows، مرتبة كمجلدات (مفاتيح) وقيم. HKLM للجهاز كله، HKCU للمستخدم الحالي.",
        inTool: ["HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "RegSetValue … SUCCESS    ← Procmon (درس لاحق)"],
        forInvestigator: "السجل يحفظ آثار البرامج والأجهزة والمستخدمين (الفصل 11 من الكتاب).",
        fromCase: "update.exe يكتب قيمة في HKCU\\…\\Run عند كل تشغيل.",
        mistake: "تعديل السجل على الجهاز الأصلي أثناء الفحص.",
        quiz: { q: "مدخل في HKCU يؤثر على كل المستخدمين أم المستخدم الحالي؟", type: "choice", options: ["المستخدم الحالي", "كل المستخدمين"], answer: "المستخدم الحالي", why: "HKCU = HKEY_CURRENT_USER، وHKLM هو الخاص بالجهاز كله." }
      },
      {
        id: "signature", ar: "التوقيع الرقمي والناشر", en: "Digital Signature / Publisher",
        analogy: "ختم الشركة على علبة الدواء.",
        meaning: "الشركات توقّع برامجها رقمياً؛ Windows يتحقق أن الملف لم يُعدَّل وأنه من الناشر المذكور.",
        inTool: ["(Verified) Microsoft Corporation", "(Not Verified)    ← صف وردي في Autoruns"],
        forInvestigator: "غياب التوقيع ليس دليلاً على الخبث، لكنه مؤشر يستحق الفحص، خاصة مع مسار واسم مريبين.",
        fromCase: "WindowsUpdateHelper بلا وصف ولا ناشر موثّق، بينما برامج Windows الحقيقية (Verified).",
        mistake: "الثقة بالاسم؛ «WindowsUpdate» في الاسم لا يعني أنه من Microsoft.",
        quiz: { q: "ماذا يعني الصف الأصفر في Autoruns؟", type: "choice", options: ["الملف الذي يشير إليه المدخل غير موجود", "المدخل خبيث مؤكد", "المدخل موقّع من Microsoft"], answer: "الملف الذي يشير إليه المدخل غير موجود", why: "الأصفر = الملف غير موجود؛ أما الوردي فيعني بلا ناشر موثّق." }
      },
      {
        id: "ioc", ar: "مؤشرات الاختراق", en: "Indicators of Compromise (IOC)",
        analogy: "آثار أقدام وبصمات في مسرح الجريمة.",
        meaning: "علامات تقنية تدل على اختراق محتمل: اسم ملف، مسار، عنوان IP، منفذ، مفتاح سجل، قيمة Hash.",
        inTool: ["صف وردي، اتصال إلى منفذ غريب، RegSetValue على Run"],
        forInvestigator: "تُجمع في التقرير ويُبحث عنها في أجهزة أخرى بالمؤسسة.",
        fromCase: "update.exe، AppData\\Roaming\\WinUpdate، 203.0.113.45:4444، WindowsUpdateHelper.",
        mistake: "الاكتفاء بمؤشر واحد؛ القوة في تطابق عدة مؤشرات من أدوات مختلفة.",
        quiz: { q: "أي زوج مؤشرين من أداتين مختلفتين يدل على update.exe؟", type: "choice", options: ["مدخل WindowsUpdateHelper في Autoruns + اتصال بـ 203.0.113.45:4444 في TCPView", "صف أصفر في Autoruns + اسم الجهاز ACC-PC07", "ipconfig + ping 8.8.8.8"], answer: "مدخل WindowsUpdateHelper في Autoruns + اتصال بـ 203.0.113.45:4444 في TCPView", why: "التطابق بين أداتين (التشغيل التلقائي والاتصال) يقوّي الاستنتاج؛ الخيارات الأخرى لا تخص البرنامج نفسه." }
      }
    ]
  },
  practice: {
    tool: "autoruns", state: "healthy",
    scenario: "سامي يقول إن الجهاز يعمل وحده ليلاً. ابحث عن برنامج يبدأ تلقائياً مع تسجيل الدخول. ابدأ بجهاز سليم لتتعرف على شكل المدخلات الطبيعية، ثم بدّل إلى الجهاز المصاب.",
    launchers: [{ tool: "folder", label: "مجلد Sysinternals", auto: true }],
    states: [{ id: "healthy", label: "جهاز سليم" }, { id: "infected", label: "جهاز مصاب" }],
    freeNote: "ابحث بنفسك دون تلميحات: جرّب التبويبات وخيارات Options وQuick Filter، وبدّل حالة الجهاز.",
    steps: [
      { id: "s1", title: "شغّل Autoruns من مجلد Sysinternals", instruction: "في نافذة Sysinternals انقر نقراً مزدوجاً على Autoruns64.exe (أو اخترها واضغط Enter).", why: "Autoruns برنامج مستقل لا يحتاج تثبيتاً؛ يُشغَّل من المجلد الذي نزّلته إليه.",
        expect: { type: "event", name: "tool:launch", where: { tool: "autoruns" } }, target: "[data-win=\"folder\"] [data-tool=\"autoruns\"]",
        hints: ["انظر إلى قائمة الملفات في النافذة الصغيرة.", "الملف الذي يبدأ اسمه بـ Autoruns.", "انقر نقراً مزدوجاً على Autoruns64.exe."], demo: { kind: "folder-launch", tool: "autoruns" } },
      { id: "s2", title: "افتح تبويب Logon", instruction: "في Autoruns اضغط تبويب Logon.", why: "يعرض البرامج التي تبدأ عند تسجيل دخول المستخدم، وهو أول مكان يُفحص عند الشك في الاستمرار.",
        expect: { type: "event", name: "autoruns:tab", where: { tab: "Logon" } }, target: "[data-win=\"autoruns\"] [data-tab=\"Logon\"]",
        hints: ["التبويبات في صف أفقي تحت شريط القوائم.", "ثاني تبويب بعد Everything.", "اضغط التبويب المسمى Logon."], demo: { kind: "ui", tool: "autoruns", action: "selectTab", arg: "Logon" } },
      { id: "s3", title: "تعرّف على مدخل سليم: OneDrive", instruction: "الجهاز الآن «سليم». اضغط على مدخل OneDrive ولاحظ عمود Publisher.", why: "لتعرف شكل المدخل الطبيعي: ناشر موثّق (Verified) ومسار داخل Program Files.",
        expect: { type: "event", name: "autoruns:select", where: { key: "OneDrive" } }, target: "[data-win=\"autoruns\"] tr[data-key=\"OneDrive\"]",
        hints: ["ابحث عن الصف الذي اسمه برنامج التخزين السحابي.", "تحت ترويسة HKCU\\…\\Run.", "اضغط صف OneDrive."], demo: { kind: "ui", tool: "autoruns", action: "select", arg: "OneDrive" } },
      { id: "s4", title: "بدّل إلى الجهاز المصاب", instruction: "من شريط التطبيقات أعلى النافذة غيّر «حالة الجهاز» إلى «جهاز مصاب».", why: "لترى الفرق بين الجهاز السليم والمصاب في الأداة نفسها.",
        expect: { type: "event", name: "sim:state", where: { state: "infected" } }, target: "#stage-bar select",
        hints: ["القائمة المنسدلة فوق نافذة المحاكاة.", "اختر الخيار الثاني.", "اختر «جهاز مصاب»."], demo: { kind: "state", value: "infected" } },
      { id: "s5", title: "حدّد المدخل الوردي", instruction: "ابحث عن الصف الوردي تحت ترويسة HKCU\\…\\Run واضغط عليه.", why: "الوردي = بلا ناشر موثّق أو فشل التحقق من التوقيع؛ مؤشر يستحق الفحص، لا إدانة بحد ذاته.",
        expect: { type: "event", name: "autoruns:select", where: { key: "WindowsUpdateHelper" } }, target: "[data-win=\"autoruns\"] tr[data-key=\"WindowsUpdateHelper\"]",
        hints: ["الصف الوحيد الملوّن بالوردي.", "اسمه يقلّد خدمة تحديث Windows.", "اضغط صف WindowsUpdateHelper."], demo: { kind: "ui", tool: "autoruns", action: "select", arg: "WindowsUpdateHelper" } },
      { id: "s6", title: "أخفِ مدخلات Microsoft", instruction: "افتح قائمة Options واختر Hide Microsoft Entries.", why: "تخفي المدخلات الموقّعة من Microsoft فيبقى ما يستحق النظر؛ أسلوب المحققين لتقليل الضجيج.",
        expect: { type: "event", name: "autoruns:option", where: { name: "Hide Microsoft Entries", value: true } }, target: "[data-win=\"autoruns\"] .menubar > button:nth-child(4)",
        hints: ["القوائم في أعلى النافذة: File, Entry, Category, Options…", "قائمة Options (الرابعة).", "Options ثم Hide Microsoft Entries."], demo: { kind: "ui", tool: "autoruns", action: "setOption", arg: ["Hide Microsoft Entries", true] } },
      { id: "s7", title: "افحص الصف الأصفر", instruction: "افتح تبويب Scheduled Tasks واضغط على الصف الأصفر \\PrinterTrayUpdate.", why: "الأصفر = الملف غير موجود؛ سنعرف لماذا ليس هذا دليلاً على اختراق.",
        expect: { type: "event", name: "autoruns:select", where: { key: "PrinterTrayUpdate" } }, target: "[data-win=\"autoruns\"] [data-tab=\"Scheduled Tasks\"]",
        hints: ["المهام المجدولة لها تبويب خاص.", "تبويب Scheduled Tasks ثم الصف الملوّن بالأصفر.", "اضغط التبويب ثم الصف \\PrinterTrayUpdate."], demo: [{ kind: "ui", tool: "autoruns", action: "selectTab", arg: "Scheduled Tasks" }, { kind: "ui", tool: "autoruns", action: "select", arg: "PrinterTrayUpdate" }] }
    ]
  },
  interpret: {
    coreHighlights: ["صف وردي: WindowsUpdateHelper","Publisher","Image Path","Timestamp"],   // essential values (labels) counted by the discovery counter
    sources: [
      { id: "logon-infected", kind: "autoruns", title: "Logon — جهاز مصاب", tab: "Logon", state: "infected" },
      { id: "tasks", kind: "autoruns", title: "Scheduled Tasks", tab: "Scheduled Tasks", state: "infected" },
      { id: "logon-healthy", kind: "autoruns", title: "Logon — جهاز سليم", tab: "Logon", state: "healthy" }
    ],
    highlights: [
      { src: "logon-infected", row: "WindowsUpdateHelper", col: "name", label: "صف وردي: WindowsUpdateHelper", danger: true, concept: "signature", meaning: "مؤشر خطر: لا وصف، والناشر غير موثّق. الاسم يقلّد Windows Update لكن Windows لا يضع برامجه في AppData\\Roaming لحساب مستخدم." },
      { src: "logon-infected", row: "WindowsUpdateHelper", col: "publisher", label: "Publisher", danger: true, concept: "signature", meaning: "(Not Verified) = غير موقّع أو فشل التحقق من التوقيع. غياب التوقيع مؤشر لا دليل قاطع؛ نقويه بالمسار والاسم والوقت." },
      { src: "logon-infected", row: "WindowsUpdateHelper", col: "path", label: "Image Path", danger: true, concept: "ioc", meaning: "AppData\\Roaming\\WinUpdate مجلد قابل للكتابة من المستخدم؛ مكان مفضّل للبرمجيات الخبيثة لأنه لا يحتاج صلاحيات مدير." },
      { src: "logon-infected", row: "WindowsUpdateHelper", col: "time", label: "Timestamp", danger: true, concept: "persistence", meaning: "وقت تعديل مفتاح التشغيل التلقائي: بعد الدوام، ويتطابق مع وقت الاختراق في Event Viewer (المختبر 3)." },
      { src: "logon-infected", row: "header:HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", col: "header", label: "مفتاح HKCU\\…\\Run", concept: "registry", meaning: "يعمل البرنامج عند كل تسجيل دخول لسامي = آلية استمرار (Persistence)." },
      { src: "logon-infected", row: "OneDrive", col: "publisher", label: "(Verified) Microsoft", concept: "signature", meaning: "موقّع رقمياً من ناشر معروف = موثوق غالباً." },
      { src: "tasks", row: "PrinterTrayUpdate", col: "path", label: "File not found", concept: "signature", meaning: "صف أصفر: الملف غير موجود؛ بقايا برنامج أُزيل، ليس خبيثاً لكنه يستحق الملاحظة." },
      { src: "logon-healthy", row: "header:HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", col: "time", label: "Timestamp في الجهاز السليم", concept: "persistence", meaning: "في الجهاز السليم لا يوجد صف WindowsUpdateHelper، وطابع وقت مفتاح HKCU هو نفسه وقت مدخل OneDrive: لا تغيير حديث." }
    ],
    table: [
      { see: "صف وردي WindowsUpdateHelper", means: "مؤشر خطر: لا وصف، والناشر غير موثّق، والاسم يقلّد Windows Update." },
      { see: "Image Path في AppData\\Roaming\\WinUpdate", means: "مجلد قابل للكتابة من المستخدم؛ مكان مفضّل للبرمجيات الخبيثة لأنه لا يحتاج صلاحيات مدير." },
      { see: "Timestamp … Fri Oct 3 22:17:41 2026", means: "وقت تعديل مفتاح التشغيل التلقائي: بعد الدوام، ويتطابق مع وقت الاختراق في Event Viewer." },
      { see: "مفتاح HKCU\\…\\Run", means: "يعمل البرنامج عند كل تسجيل دخول لسامي = آلية استمرار (Persistence)." },
      { see: "صف أصفر ptray.exe", means: "الملف غير موجود: بقايا برنامج أُزيل؛ ليس خبيثاً لكنه يستحق الملاحظة." },
      { see: "(Verified) Microsoft …", means: "موقّع رقمياً من ناشر معروف = موثوق غالباً." }
    ],
    ioc: [
      "برنامج يعمل تلقائياً بلا ناشر موثّق.",
      "مسار تنفيذ داخل AppData باسم يقلّد Windows.",
      "(تُستكمل المؤشرات من TCPView وProcmon وRAMMap في الدروس التالية.)"
    ],
    questions: [
      { q: "هل يوجد برنامج مشبوه في التشغيل التلقائي؟ اختر المدخل ومساره.", type: "choice", options: ["WindowsUpdateHelper — C:\\Users\\sami\\AppData\\Roaming\\WinUpdate\\update.exe", "OneDrive — C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe", "\\PrinterTrayUpdate — C:\\Program Files\\OldPrinterTool\\ptray.exe"], answer: "WindowsUpdateHelper — C:\\Users\\sami\\AppData\\Roaming\\WinUpdate\\update.exe", why: "بلا ناشر موثّق، وفي AppData\\Roaming، واسمه يقلّد Windows Update." },
      { extra: true, q: "لماذا الصف الأصفر (PrinterTrayUpdate) ليس دليلاً على اختراق؟", type: "choice", options: ["الملف غير موجود: بقايا برنامج أُزيل وليس خبيثاً", "لأن الأصفر يعني موقّعاً من Microsoft", "لأنه لا يظهر إلا في الجهاز السليم"], answer: "الملف غير موجود: بقايا برنامج أُزيل وليس خبيثاً", why: "الأصفر يعني أن الملف الذي يشير إليه المدخل غير موجود؛ يُلاحَظ ويُوثَّق لكنه لا يدل على فعل خبيث." },
      { q: "متى أُضيف WindowsUpdateHelper إلى التشغيل التلقائي؟ (انسخ الطابع كما في Timestamp)", type: "value", answer: "Fri Oct 3 22:17:41 2026", accept: ["10/3/2026 10:17:41 PM", "3/10/2026 10:17:41 PM"], why: "هو طابع وقت مفتاح HKCU\\…\\Run، ويأتي بعد دخول المهاجم بدقيقتين ونصف (سنرى الدخول في Event Viewer)." }
    ],
  },
  realWorld: {
    versionNotes: [
      "Autoruns برنامج واحد من Sysinternals يعمل بلا تثبيت (Autoruns64.exe على Windows 64-bit).",
      "في البرنامج الحقيقي نحو 20 تبويباً؛ المحاكاة تفعّل Logon وScheduled Tasks وEverything فقط.",
      "عمود VirusTotal يعمل في الأصل بعد تفعيل Check VirusTotal.com من Scan Options؛ غير مفعّل هنا."
    ],
    officialSite: "https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns",
    ethics: "لا تعطّل مدخلاً ولا تحذفه على جهاز تحقق فيه قبل التوثيق وأخذ نسخة من الدليل: ما تغيّره يصبح جزءاً من القضية. وافحص أجهزتك أو أجهزة مؤسسة أذنت لك بفحصها فقط."
  }
};
