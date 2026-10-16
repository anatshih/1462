/* Lesson a4-pe — Lab 12 (PE Explorer, static analysis of update.exe). Concepts: docs/concepts.md §60–63. Values: docs/outputs-spec.md §ك. */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a4-pe"] = {
  id: "a4-pe", seq: 14, axis: 4, axisTitle: "المحور 4: تحليل الشبكة والأنشطة والملفات", labs: [12], chapters: [10], minutes: 30,
  title: "PE Explorer: تحليل الملف التنفيذي",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "ما حقيقة الملف update.exe نفسه؟",
    reached: "رأينا سلوك update.exe من كل الجهات: التشغيل التلقائي والاتصال والملفات.",
    seeking: "نفحص الملف دون تشغيله: ما نوعه؟ وهل هو مضغوط؟ وما المكتبات التي يستوردها؟",
    finding: "update.exe ملف PE 32-بت مضغوط بـ UPX (UPX0/UPX1)، يستورد WS2_32.dll وWININET.dll (شبكة) وADVAPI32.dll (RegSetValueExA)، وهذا يتسق مع اتصاله بـ 203.0.113.45:4444 وكتابته في Run."
  },
  objectives: [
    "قراءة ترويسة ملف PE (Headers Info) وتحديد نوع الملف و32/64 بت ووقت الربط.",
    "اكتشاف الضغط من أسماء الأقسام (UPX0/UPX1).",
    "قراءة المكتبات والدوال المستوردة ومطابقتها مع سلوك البرنامج الذي رُصد في المحور 1."
  ],
  explain: {
    intro: "التشبيه الجامع: فحص الطرد بالأشعة دون فتحه. نحلل update.exe تحليلاً ساكناً: لا نشغّله أبداً. افتح البطاقات بأي ترتيب.",
    figure: "pecard",
    whatNext: "ستفتح update.exe في PE Explorer، وتقرأ Headers Info، وتلاحظ أقسام UPX، ثم تقرأ جدول الاستيراد: WS2_32.dll للشبكة وADVAPI32.dll (RegSetValueExA) لتعديل السجل.",
    cards: [
      {
        id: "pe-file", ar: "الملف التنفيذي وبنيته", en: "PE File / Header",
        analogy: "بطاقة تعريف مطبوعة على غلاف العلبة: ما فيها، لمن صُنعت، متى.",
        meaning: "ملفات Windows التنفيذية (.exe, .dll) بصيغة PE؛ تبدأ بـ MZ، وترويستها تحوي: المعالج (Machine)، عدد الأقسام، وقت الربط (Time Date Stamp)، نوع الملف، Subsystem (واجهة رسومية أم سطر أوامر).",
        inTool: ["Headers Info:  Machine | Number of Sections | Time Date Stamp | Subsystem …"],
        forInvestigator: "تحليل ساكن دون تشغيل الملف (آمن)، يعطي معلومات أولية: هل هو تنفيذي فعلاً؟ متى بُني؟ 32 أم 64 بت؟",
        fromCase: "تحليل update.exe.",
        mistake: "الثقة المطلقة بوقت الربط؛ يمكن تزويره.",
        quiz: { q: "بماذا يبدأ كل ملف تنفيذي في Windows؟", type: "value", answer: "MZ", why: "البايتان 4D 5A هما «MZ»؛ ملف يبدأ بغيرهما (مثل PK) ليس تنفيذياً." }
      },
      {
        id: "imports", ar: "المكتبات والدوال المستوردة", en: "DLL / Imports / API",
        analogy: "قائمة الأدوات التي استعارها العامل من المخزن: تكشف ماذا ينوي أن يفعل.",
        meaning: "البرنامج يستعمل دوال جاهزة من مكتبات Windows (DLL). قائمة الاستيراد تكشف قدراته: WS2_32.dll شبكة • WININET.dll إنترنت • ADVAPI32.dll (RegSetValueExA) تعديل السجل • KERNEL32.dll (WriteProcessMemory, CreateRemoteThread) حقن في عمليات أخرى.",
        inTool: ["عارض Imports: يسار DLL، يمين الدوال", "ADVAPI32.dll  ←  RegSetValueExA"],
        forInvestigator: "يطابق القدرات مع السلوك المرصود (Procmon/TCPView).",
        fromCase: "update.exe يستورد شبكة + سجل ← يتسق مع ما رأيناه في المحور 1.",
        mistake: "الحكم بالخبث من دالة واحدة؛ برامج سليمة كثيرة تستخدم الشبكة. المعيار: التركيبة والسياق.",
        quiz: { q: "أي مكتبة تدل على قدرة الاتصال بالشبكة؟", type: "choice", options: ["WS2_32.dll", "ADVAPI32.dll", "KERNEL32.dll"], answer: "WS2_32.dll", why: "WS2_32 هي مكتبة Winsock للشبكات." }
      },
      {
        id: "packing", ar: "الأقسام والضغط والتمويه", en: "Sections / Packing (UPX)",
        analogy: "طرد مغلّف بإحكام لا تعرف محتواه حتى يُفتح.",
        meaning: "الأقسام (.text للشيفرة، .data للبيانات، .rsrc للموارد). أقسام بأسماء UPX0/UPX1 تعني أن الملف مضغوط يفك نفسه عند التشغيل، فيُخفي محتواه عن الفحص الساكن.",
        inTool: ["Section Headers:  UPX0 | UPX1 | .rsrc"],
        forInvestigator: "الضغط/التمويه مؤشر يستدعي تحليلاً أعمق (أو فك الضغط).",
        fromCase: "(مقترح) update.exe مضغوط بـ UPX.",
        mistake: "اعتبار كل ملف مضغوط خبيثاً.",
        quiz: { q: "ماذا تعني أقسام باسم UPX0 وUPX1؟", type: "choice", options: ["الملف مضغوط بـ UPX", "الملف صورة", "الملف موقّع رقمياً"], answer: "الملف مضغوط بـ UPX", why: "UPX أداة ضغط للملفات التنفيذية تترك هذه الأسماء." }
      },
      {
        id: "static-dynamic", ar: "التحليل الساكن والديناميكي", en: "Static / Dynamic Analysis",
        analogy: "فحص الطرد بالأشعة مقابل فتحه في غرفة معزولة.",
        meaning: "الساكن دون تشغيل (PE Explorer)؛ الديناميكي بتشغيله في بيئة معزولة ومراقبته (Procmon، TCPView).",
        inTool: ["—"],
        forInvestigator: "يكمّل أحدهما الآخر؛ ولا يُشغَّل ملف مشبوه على جهاز حقيقي أبداً.",
        fromCase: "المحور 1 كان ديناميكياً (سلوك)، والمحور 4 ساكن (بنية) — والنتيجتان متسقتان.",
        mistake: "تشغيل الملف «لنرى ماذا يفعل» على جهاز العمل.",
        quiz: { q: "أي الأداتين تحليل ساكن: Procmon أم PE Explorer؟", type: "choice", options: ["PE Explorer", "Procmon"], answer: "PE Explorer", why: "Procmon يراقب برنامجاً يعمل؛ PE Explorer يقرأ الملف دون تشغيله." }
      }
    ]
  },
  practice: {
    tool: "peexplorer", state: "healthy",
    scenario: "في المحور 1 رأيت سلوك update.exe. الآن افحص الملف نفسه دون تشغيله: ما نوعه؟ هل هو مضغوط؟ وماذا يستورد من مكتبات؟",
    launchers: [{ tool: "peexplorer", label: "PE Explorer" }],
    freeNote: "جرّب فتح holiday.jpg أيضاً لترى لماذا يُرفض (لا يبدأ بـ MZ)، وتنقّل بين كل الأقسام.",
    steps: [
      { id: "s1", title: "افتح PE Explorer", instruction: "اضغط زر «PE Explorer» في شريط التطبيقات.", why: "أداة للتحليل الساكن لملفات PE.",
        expect: { type: "event", name: "tool:launch", where: { tool: "peexplorer" } }, target: "[data-launch=\"peexplorer\"]", hints: ["الزر فوق نافذة المحاكاة.", "اسمه اسم البرنامج.", "اضغط الزر."], demo: { kind: "launch", tool: "peexplorer" } },
      { id: "s2", title: "افتح update.exe", instruction: "من File ▸ Open (أو زر Open) اختر update.exe ثم Open.", why: "الملف نفسه الذي رصدناه: C:\\Users\\sami\\AppData\\Roaming\\WinUpdate\\update.exe.",
        expect: { type: "event", name: "pe:open", where: { name: "update.exe", valid: true } }, target: "[data-win=\"peexplorer\"] [data-pe=\"open\"]", onMismatch: "المطلوب ملف update.exe (وهو ملف تنفيذي صالح).",
        hints: ["القائمة تعرض ملفين.", "اسم الملف المشبوه من المحور 1.", "اختر update.exe ثم Open."], demo: { kind: "ui", tool: "peexplorer", action: "step", arg: "s2" } },
      { id: "s3", title: "اقرأ Headers Info", instruction: "اضغط زر Headers Info واقرأ Machine وNumber of Sections وTime Date Stamp وSubsystem.", why: "معلومات أولية: 32 أم 64 بت؟ كم قسماً؟ متى رُبط؟",
        expect: { type: "event", name: "pe:view", where: { view: "Headers Info" } }, target: "[data-win=\"peexplorer\"] [data-view=\"Headers Info\"]", hints: ["أزرار العرض في الشريط.", "الزر الأول.", "اضغط Headers Info."], demo: { kind: "ui", tool: "peexplorer", action: "step", arg: "s3" } },
      { id: "s4", title: "افتح Section Headers", instruction: "اضغط Section Headers ولاحظ أسماء الأقسام.", why: "أسماء UPX تعني أن الملف مضغوط.",
        expect: { type: "event", name: "pe:view", where: { view: "Section Headers" } }, target: "[data-win=\"peexplorer\"] [data-view=\"Section Headers\"]", hints: ["الزر الثالث بين أزرار العرض.", "اسمه يدل على ترويسات الأقسام.", "اضغط Section Headers."], demo: { kind: "ui", tool: "peexplorer", action: "step", arg: "s4" } },
      { id: "s5", title: "افتح Imports", instruction: "اضغط Imports لترى المكتبات المستوردة.", why: "القائمة تكشف قدرات البرنامج.",
        expect: { type: "event", name: "pe:view", where: { view: "Imports" } }, target: "[data-win=\"peexplorer\"] [data-view=\"Imports\"]", hints: ["الزر الرابع.", "اسمه يدل على الاستيراد.", "اضغط Imports."], demo: { kind: "ui", tool: "peexplorer", action: "step", arg: "s5" } },
      { id: "s6", title: "ادرس مكتبة الشبكة", instruction: "اضغط WS2_32.dll في القائمة اليسرى وانظر دوالها على اليمين.", why: "socket وconnect وsend: قدرة الاتصال بخادم خارجي.",
        expect: { type: "event", name: "pe:dll", where: { dll: "WS2_32.dll" } }, target: "[data-win=\"peexplorer\"] tr[data-key=\"WS2_32.dll\"]", hints: ["القائمة اليسرى فيها أربع مكتبات.", "اسم المكتبة يحوي 32 وشرطة سفلية.", "اضغط WS2_32.dll."], demo: { kind: "ui", tool: "peexplorer", action: "step", arg: "s6" } },
      { id: "s7", title: "اعثر على دالة السجل", instruction: "اضغط ADVAPI32.dll ثم اضغط الدالة RegSetValueExA على اليمين.", why: "هذه الدالة تكتب قيمة في السجل: يتسق مع مفتاح Run الذي أضافه البرنامج.",
        expect: { type: "event", name: "pe:function", where: { name: "RegSetValueExA" } }, target: "[data-win=\"peexplorer\"] tr[data-key=\"ADVAPI32.dll\"]", hints: ["مكتبة اسمها يبدأ بـ ADV.", "من دوالها ما يبدأ بـ RegSet.", "ADVAPI32.dll ثم RegSetValueExA."], demo: { kind: "ui", tool: "peexplorer", action: "step", arg: "s7" } }
    ]
  },
  interpret: {
    sources: [
      { id: "headers", kind: "table", tool: "peexplorer", view: "Headers Info", title: "Headers Info", heading: "PE Explorer › Headers Info — update.exe" },
      { id: "sections", kind: "table", tool: "peexplorer", view: "Section Headers", title: "Section Headers", heading: "PE Explorer › Section Headers — update.exe" },
      { id: "imports", kind: "table", tool: "peexplorer", view: "Imports", title: "Imports", heading: "PE Explorer › Imports — update.exe" }
    ],
    highlights: [
      { src: "headers", row: "Machine", col: "Value", label: "Machine: Intel386", concept: "pe-file", meaning: "ملف 32-بت (يعمل على 64-بت أيضاً)." },
      { src: "headers", row: "Number of Sections", col: "Value", label: "Number of Sections", concept: "packing", meaning: "ثلاثة أقسام فقط: قليلة، وأسماؤها (UPX0 وUPX1) هي التي تدل على الضغط." },
      { src: "headers", row: "Time Date Stamp", col: "Value", label: "Time Date Stamp", concept: "pe-file", meaning: "وقت الربط (2 أكتوبر 2026) قبل زرع الملف بيوم تقريباً؛ لكنه قابل للتزوير فلا يُعتمد عليه وحده." },
      { src: "headers", row: "Subsystem", col: "Value", label: "Subsystem: Windows GUI", concept: "pe-file", meaning: "يعمل بلا نافذة سطر أوامر ظاهرة: مناسب لبرنامج خلفي لا يريد لفت النظر." },
      { src: "sections", row: "UPX0", col: "Name", label: "قسم UPX0", danger: true, concept: "packing", meaning: "اسم قسم من أداة الضغط UPX: الملف مضغوط يفك نفسه عند التشغيل." },
      { src: "sections", row: "UPX1", col: "Name", label: "قسم UPX1", danger: true, concept: "packing", meaning: "يحوي الشيفرة المضغوطة؛ لا تُرى محتوياتها بالفحص الساكن قبل فك الضغط (علامة تمويه، لا إدانة وحدها)." },
      { src: "imports", row: "connect", col: "Name", label: "connect (WS2_32.dll)", danger: true, concept: "imports", meaning: "قدرة الاتصال بخادم عبر الشبكة؛ يتسق مع اتصاله بـ 203.0.113.45:4444." },
      { src: "imports", row: "RegSetValueExA", col: "Name", label: "RegSetValueExA (ADVAPI32.dll)", danger: true, concept: "imports", meaning: "كتابة قيمة في السجل: يتسق مع إضافته WindowsUpdateHelper في مفتاح Run." },
      { src: "imports", row: "InternetOpenUrlA", col: "Name", label: "InternetOpenUrlA (WININET.dll)", concept: "imports", meaning: "فتح روابط إنترنت: قدرة إضافية على الاتصال؛ ليست دليلاً وحدها فبرامج سليمة كثيرة تستخدمها." },
      { src: "imports", row: "FindFirstFileA", col: "Name", label: "FindFirstFileA (KERNEL32.dll)", concept: "imports", meaning: "تعداد الملفات: يتسق مع QueryDirectory على مجلد Finance في Procmon." }
    ],
    table: [
      { see: "Machine: Intel386", means: "ملف 32-بت." },
      { see: "أقسام UPX0 / UPX1", means: "الملف مضغوط بـ UPX؛ يستدعي تحليلاً أعمق أو فك الضغط." },
      { see: "WS2_32.dll و WININET.dll", means: "قدرة على الاتصال بالشبكة والإنترنت." },
      { see: "ADVAPI32.dll (RegSetValueExA)", means: "قدرة على تعديل السجل (مثل مفتاح Run)." },
      { see: "ملف يبدأ بـ PK بدل MZ", means: "ليس ملفاً تنفيذياً (مثل holiday.jpg): يرفضه PE Explorer." }
    ],
    ioc: ["update.exe: ملف مضغوط بـ UPX يستورد مكتبات شبكة وتعديل السجل (يتسق مع السلوك المرصود في المحور 1)."],
    questions: [
      { q: "ما نوع الملف update.exe؟", type: "choice", options: ["ملف تنفيذي (EXE) بصيغة 32-بت وواجهة رسومية", "مكتبة DLL", "صورة JPEG"], answer: "ملف تنفيذي (EXE) بصيغة 32-بت وواجهة رسومية", why: "Machine = Intel386 وSubsystem = Windows GUI، ويبدأ بـ MZ." },
      { q: "هل توجد مكتبات أو أقسام مشبوهة؟", type: "choice", options: ["نعم: WS2_32.dll وWININET.dll (شبكة) وADVAPI32.dll (RegSetValueExA)، وأقسام UPX", "لا شيء", "فقط KERNEL32.dll"], answer: "نعم: WS2_32.dll وWININET.dll (شبكة) وADVAPI32.dll (RegSetValueExA)، وأقسام UPX", why: "التركيبة (شبكة + سجل + ضغط) تتسق مع سلوكه، والمعيار التركيبة لا دالة واحدة." },
      { extra: true, q: "ماذا تعني أقسام باسم UPX0 وUPX1؟", type: "choice", options: ["الملف مضغوط بـ UPX", "الملف موقّع رقمياً", "الملف صورة"], answer: "الملف مضغوط بـ UPX", why: "أسماء أقسام أداة الضغط UPX." },
      { extra: true, q: "بماذا يبدأ كل ملف تنفيذي في Windows؟", type: "value", answer: "MZ", why: "ملف holiday.jpg يبدأ بـ PK فلا يُفتح كملف PE." },
      { extra: true, q: "لماذا لا نشغّل update.exe على جهاز حقيقي لنرى ماذا يفعل؟", type: "choice", options: ["قد يخرّب الجهاز أو يسرّب بياناته؛ التحليل الديناميكي يكون في بيئة معزولة فقط", "لأنه لا يعمل أصلاً", "لأن Windows يمنع ذلك دائماً"], answer: "قد يخرّب الجهاز أو يسرّب بياناته؛ التحليل الديناميكي يكون في بيئة معزولة فقط", why: "التحليل الساكن آمن، والديناميكي يحتاج مختبراً معزولاً." }
    ],
  },
  realWorld: {
    versionNotes: [
      "PE Explorer من Heaventools برنامج تجاري؛ يعرض Headers Info وData Directories وSection Headers وImports وغيرها، وفيه Disassembler وDependency Scanner.",
      "في الواقع يخفي ضغط UPX معظم الاستيرادات حتى فك الضغط؛ المحاكاة تعرض الجدول الكامل لغرض التعلّم.",
      "الأرقام (RVA وأحجام الأقسام وTime Date Stamp) قيم تدريبية للقضية، لا قراءة من ملف حقيقي."
    ],
    officialSite: "https://www.heaventools.com/",
    ethics: "حلّل الملفات المشبوهة تحليلاً ساكناً أولاً ولا تشغّلها على جهاز حقيقي. وإن شاركت عيّنة خبيثة فاجعلها في بيئة معزولة وبتفويض، ولا تنشرها."
  }
};
