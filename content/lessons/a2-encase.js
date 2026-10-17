/* Lesson a2-encase — Lab 10 (EnCase). Concepts: docs/concepts.md §36–40. Values: docs/outputs-spec.md §ح-3 (PROPOSED, awaiting approval). */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a2-encase"] = {
  id: "a2-encase", seq: 7, axis: 2, axisTitle: "المحور 2: حيازة الدليل وحفظه", labs: [10], chapters: [2, 4], minutes: 30,
  title: "EnCase: قضية وتحليل النسخة الجنائية",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "ماذا تخفي النسخة الجنائية من ملفات؟",
    reached: "لدينا نسخة جنائية ACC-PC07_C.E01 موثّقة ببصمة متطابقة.",
    seeking: "نفتح النسخة في قضية، ونبحث فيها عن ملفات محذوفة أو متنكّرة بامتداد غير حقيقي.",
    finding: "في النسخة ACC-PC07_C.E01 ملف محذوف arc_1003.zip وملف holiday.jpg توقيعه ZIP (PK) لا JPEG."
  },
  summary: [   // «ما يجب أن تتذكره» at the end of the lesson
    "سير العمل في EnCase: إنشاء قضية، ثم إضافة الدليل (ملف E01)، ثم التصفح بالأجزاء الثلاثة Tree ثم Table ثم View.",
    "في مجلد Temp ملف محذوف arc_1003.zip (Is Deleted = Yes) ما زال محتواه موجوداً في النسخة.",
    "holiday.jpg امتداده صورة لكن توقيعه 50 4B (PK) أي ملف ZIP متنكّر؛ التوقيع لا الامتداد هو ما يحدد نوع الملف."
  ],
  objectives: [
    "إنشاء قضية وإضافة النسخة الجنائية (E01) مع التحقق من Hash.",
    "التنقل بين Tree وTable وView وقراءة أعمدة مثل Is Deleted وSignature Analysis.",
    "كشف الملف المحذوف والملف المتنكّر بامتداد مزوّر، والبحث في الدليل."
  ],
  explain: {
    intro: "الآن نفتح النسخة التي أنشأناها في FTK. اقرأ بطاقات المفاهيم بأي ترتيب، وسؤال كل بطاقة اختياري.",
    figure: "bottle",
    whatNext: "ستنشئ قضية باسم TR-1261-01، وتضيف ملف النسخة ACC-PC07_C.E01 (فيتحقق EnCase من Hash)، وتتجول في الأجزاء الثلاثة لتجد الملف المحذوف والملف المتنكّر، ثم تجري بحثاً بكلمة Finance.",
    cards: [
      {
        id: "case", ar: "إدارة القضية", en: "Case",
        analogy: "ملف ورقي للقضية يجمع كل الأوراق والصور والملاحظات.",
        meaning: "مشروع في الأداة يحفظ الأدلة المضافة والنتائج والإشارات المرجعية (Bookmarks) والتقارير.",
        inTool: ["Case > New Case  ←  Case Options (Name, Examiner name, Base case folder…)"],
        forInvestigator: "التنظيم يضمن إمكانية إعادة إنتاج النتائج وتوثيقها.",
        fromCase: "قضية باسم TR-1261-01.",
        mistake: "تحليل الأدلة خارج قضية منظمة ثم صعوبة كتابة التقرير.",
        quiz: { q: "ما أول خطوة في EnCase قبل إضافة الدليل؟", type: "choice", options: ["إنشاء قضية", "تشغيل الجهاز المضبوط", "حذف الملفات"], answer: "إنشاء قضية", why: "الدليل يُضاف داخل قضية." }
      },
      {
        id: "add-evidence", ar: "إضافة الدليل", en: "Add Evidence",
        analogy: "وضع الصندوق المختوم في ملف القضية.",
        meaning: "ربط النسخة الجنائية بالقضية: Add Evidence File (E01) أو Add Raw Image (dd) أو Add Local Device.",
        inTool: ["Add Evidence: Add Local Device / Add Network Device / Add Evidence File / Add Raw Image …"],
        forInvestigator: "EnCase يتحقق من Hash ملف E01 عند إضافته.",
        fromCase: "ACC-PC07_C.E01.",
        mistake: "إضافة القرص الأصلي بدل النسخة.",
        quiz: { q: "أي خيار تختار لملف من FTK بصيغة E01؟", type: "choice", options: ["Add Evidence File", "Add Local Device", "Add Raw Image"], answer: "Add Evidence File", why: "Add Raw Image لصيغة dd، وAdd Local Device للأقراص المتصلة (الأصل)." }
      },
      {
        id: "panes", ar: "الأجزاء الثلاثة", en: "Tree / Table / View",
        analogy: "فهرس المجلدات ← قائمة الملفات ← صفحة الملف المفتوحة.",
        meaning: "Tree لتصفح البنية • Table قائمة الملفات بخصائصها • View محتوى الملف (Text, Hex, Picture…).",
        inTool: ["Tree pane  ←  Table pane  ←  View pane", "Table: Name | File Ext | Logical Size | … | Is Deleted | Full Path"],
        forInvestigator: "الأعمدة (Is Deleted، Last Written…) تكشف ما لا يظهر في المستكشف العادي.",
        fromCase: "الملف المحذوف يظهر بعلامة حذف.",
        mistake: "فتح الملفات في برامجها الأصلية بدل العارض الداخلي.",
        quiz: { q: "في أي جزء ترى محتوى الملف بالست عشري؟", type: "choice", options: ["View (Hex)", "Tree", "Table"], answer: "View (Hex)", why: "Tree للبنية، Table للقائمة، وView للمحتوى." }
      },
      {
        id: "signature", ar: "توقيع الملف مقابل امتداده", en: "File Signature vs Extension",
        analogy: "ملصق «عصير» على زجاجة فيها شيء آخر.",
        meaning: "الامتداد (.jpg) مجرد اسم؛ نوع الملف الحقيقي تحدده البايتات الأولى (التوقيع): FF D8 FF لصور JPEG، PK لملفات ZIP، MZ للملفات التنفيذية.",
        inTool: ["Signature Analysis  ←  Match / Bad signature", "View › Hex: 50 4B 03 04  (PK)"],
        forInvestigator: "المخفون يغيّرون الامتداد لإخفاء ملفات؛ عدم التطابق مؤشر.",
        fromCase: "(مقترح) ملف باسم holiday.jpg توقيعه PK = ملف مضغوط متنكّر.",
        mistake: "الثقة بالامتداد.",
        quiz: { q: "ملف report.pdf يبدأ بـ MZ؛ ما نوعه الحقيقي؟", type: "choice", options: ["ملف تنفيذي", "مستند PDF", "صورة"], answer: "ملف تنفيذي", why: "MZ توقيع الملفات التنفيذية بغض النظر عن الامتداد." }
      },
      {
        id: "search", ar: "البحث في الدليل", en: "Search / Keywords",
        analogy: "البحث عن كلمة في كل صفحات الأرشيف دفعة واحدة.",
        meaning: "بحث بكلمات مفتاحية في كل البيانات، بما فيها المحذوف والمساحة غير المخصصة.",
        inTool: ["Raw Search / Index Search  ←  Search Results"],
        forInvestigator: "يجد أدلة لا يصل إليها التصفح اليدوي.",
        fromCase: "البحث عن Finance (وكذلك 203.0.113.45).",
        mistake: "كلمات بحث عامة جداً تعطي آلاف النتائج.",
        quiz: { q: "لماذا يجد البحث نصاً في ملف محذوف؟", type: "choice", options: ["لأن بياناته ما زالت في المساحة غير المخصصة", "لأن الملف لم يُحذف فعلاً", "لأن البحث يعدّل الملف"], answer: "لأن بياناته ما زالت في المساحة غير المخصصة", why: "الحذف يزيل الإشارة إلى الملف لا بياناته." }
      }
    ]
  },
  practice: {
    tool: "encase", state: "healthy",
    scenario: "لديك النسخة ACC-PC07_C.E01. أنشئ قضية، أضف النسخة، ثم ابحث فيها عن الملف المهم (الأرشيف المحذوف) وعن أي ملف يتنكّر بامتداد غير حقيقي.",
    launchers: [{ tool: "encase", label: "EnCase" }],
    freeNote: "افتح كل مجلد في Tree وقارن التوقيع والامتداد وعمود Is Deleted، وجرّب Raw Search بكلمات أخرى مثل Q3-Salaries.",
    steps: [
      { id: "s1", title: "افتح EnCase", instruction: "اضغط زر «EnCase» في شريط التطبيقات.", why: "EnCase يفتح على شاشة Home.",
        expect: { type: "event", name: "tool:launch", where: { tool: "encase" } }, target: "[data-launch=\"encase\"]", hints: ["الزر فوق نافذة المحاكاة.", "اسمه اسم البرنامج.", "اضغط «EnCase»."], demo: { kind: "launch", tool: "encase" } },
      { id: "s2", title: "أنشئ القضية", instruction: "اضغط New Case، واكتب Name = TR-1261-01 واسمك في Examiner name، ثم OK.", why: "كل الأدلة والنتائج تُحفظ داخل القضية.",
        expect: { type: "event", name: "encase:newcase", where: { name: "TR-1261-01" } }, target: "[data-win=\"encase\"] [data-ec=\"new\"]", onMismatch: "اسم القضية المطلوب: TR-1261-01.",
        hints: ["الرابط في صفحة Home.", "ثم عبّئ الحقل Name وExaminer name.", "New Case ← Name: TR-1261-01 ← OK."], demo: { kind: "ui", tool: "encase", action: "step", arg: "s2" } },
      { id: "s3", title: "أضف ملف الدليل", instruction: "اضغط Add Evidence ثم Add Evidence File.", why: "نضيف النسخة الجنائية بصيغة E01 لا القرص الأصلي.",
        expect: { type: "event", name: "encase:add", where: { kind: "Add Evidence File" } }, target: "[data-win=\"encase\"] [data-ec=\"add\"]", onMismatch: "الخيار الصحيح لملف E01 هو Add Evidence File.",
        hints: ["الرابط الأول في صفحة القضية.", "خيارات الإضافة ستة؛ الفعّال منها ما يناسب ملف E01.", "Add Evidence ← Add Evidence File."], demo: { kind: "ui", tool: "encase", action: "step", arg: "s3" } },
      { id: "s4", title: "اختر النسخة", instruction: "اختر ACC-PC07_C.E01 ثم Open، وانتظر التحقق من Hash.", why: "EnCase يتحقق من سلامة الملف عند إضافته.",
        expect: { type: "event", name: "encase:evidence", where: { name: "ACC-PC07_C.E01", verified: true } }, target: "[data-win=\"encase\"] [data-file]", hints: ["الملف الوحيد في القائمة.", "اضغطه ثم Open.", "ACC-PC07_C.E01 ← Open."], demo: { kind: "ui", tool: "encase", action: "step", arg: "s4" } },
      { id: "s5", title: "افتح مجلد Temp", instruction: "في Tree افتح Users › sami › AppData › Temp (اضغط Temp).", why: "هنا كتب البرنامج المشبوه أرشيف التسريب.",
        expect: { type: "event", name: "encase:tree", where: { folder: "Temp" } }, target: "[data-win=\"encase\"] [data-tree=\"temp\"]", hints: ["Tree على يسار النافذة.", "ابحث عن اسم المجلد المؤقت.", "اضغط Temp."], demo: { kind: "ui", tool: "encase", action: "step", arg: "s5" } },
      { id: "s6", title: "اعثر على الملف المحذوف", instruction: "في Table اضغط arc_1003.zip وانظر إلى عمود Is Deleted.", why: "الملف المحذوف ما زال في النسخة وبعلامة حمراء.",
        expect: { type: "event", name: "encase:select", where: { name: "arc_1003.zip" } }, target: "[data-win=\"encase\"] tr[data-key=\"arc_1003.zip\"]", hints: ["الصف الأحمر.", "اسمه يشبه أرشيفاً مؤقتاً.", "اضغط arc_1003.zip."], demo: { kind: "ui", tool: "encase", action: "step", arg: "s6" } },
      { id: "s7", title: "اكشف الامتداد المزوّر", instruction: "افتح مجلد Pictures، اضغط holiday.jpg، ثم تبويب Hex في View.", why: "أول بايتات الملف تكشف نوعه الحقيقي مهما كان اسمه.",
        expect: { type: "event", name: "encase:view", where: { tab: "Hex", name: "holiday.jpg" } }, target: "[data-win=\"encase\"] [data-tree=\"pictures\"]", onMismatch: "المطلوب: ملف holiday.jpg محدداً وتبويب Hex.",
        hints: ["الملف في مجلد Pictures.", "اختر الملف أولاً ثم التبويب Hex في الجزء السفلي.", "Pictures ← holiday.jpg ← Hex."], demo: { kind: "ui", tool: "encase", action: "step", arg: "s7" } },
      { id: "s8", title: "ابحث بكلمة Finance", instruction: "اضغط Raw Search، واكتب Finance، ثم Search.", why: "البحث يجد الكلمة في الأسماء وحتى داخل الملف المحذوف.",
        expect: { type: "event", name: "encase:search", where: { keyword: "finance" } }, target: "[data-win=\"encase\"] [data-ec=\"search\"]", hints: ["الزر في شريط أدوات EnCase.", "الكلمة مجلد المالية.", "Raw Search ← Finance ← Search."], demo: { kind: "ui", tool: "encase", action: "step", arg: "s8" } }
    ]
  },
  interpret: {
    coreHighlights: ["Is Deleted = Yes","Bad signature","50 4B (PK)"],   // essential values (labels) counted by the discovery counter
    sources: [
      { id: "table", kind: "table", tool: "encase", title: "جدول الملفات", heading: "EnCase › Table pane (كل الملفات)", state: "healthy" },
      { id: "hex", tool: "encase", cmd: "holiday.jpg", title: "Hex: holiday.jpg", heading: "View › Hex — holiday.jpg" }
    ],
    highlights: [
      { src: "table", row: "arc_1003.zip", col: "Is Deleted", label: "Is Deleted = Yes", danger: true, concept: "panes", meaning: "ملف محذوف لكنه ما زال في النسخة الجنائية؛ وهو أرشيف التسريب الذي رأيناه في Procmon." },
      { src: "table", row: "arc_1003.zip", col: "Full Path", label: "Full Path", concept: "panes", meaning: "المسار الأصلي قبل الحذف: C:\\Users\\sami\\AppData\\Local\\Temp." },
      { src: "table", row: "holiday.jpg", col: "Signature Analysis", label: "Bad signature", danger: true, concept: "signature", meaning: "التوقيع الحقيقي (ZIP) لا يطابق الامتداد (.jpg): ملف مضغوط متنكّر." },
      { src: "table", row: "Q3-Salaries.xlsx", col: "Signature Analysis", label: "Match", concept: "signature", meaning: "التوقيع يطابق الامتداد: ملف عادي." },
      { src: "hex", line: "00000000", match: "50 4B", label: "50 4B (PK)", danger: true, concept: "signature", meaning: "PK توقيع ZIP؛ ملف الصورة الحقيقي يبدأ بـ FF D8 FF." }
    ],
    table: [
      { see: "Is Deleted = Yes (علامة حمراء)", means: "ملف محذوف ما زالت بياناته موجودة في النسخة." },
      { see: "Signature Analysis: Bad signature", means: "الامتداد لا يطابق التوقيع: مؤشر تمويه." },
      { see: "Hex يبدأ بـ 50 4B", means: "ملف ZIP (أو صيغ مبنية عليه مثل docx وxlsx) مهما كان اسمه." },
      { see: "نتيجة بحث داخل arc_1003.zip", means: "البحث يصل إلى محتوى الملفات المحذوفة أيضاً." }
    ],
    ioc: ["أرشيف محذوف في Temp يحوي ملفات المالية (arc_1003.zip).", "ملف holiday.jpg توقيعه ZIP."],
    questions: [
      { q: "هل عُثر على ملف مهم؟", type: "choice", options: ["نعم: arc_1003.zip المحذوف، وholiday.jpg المتنكّر", "لا شيء مهم", "فقط ملفات Finance"], answer: "نعم: arc_1003.zip المحذوف، وholiday.jpg المتنكّر", why: "الأول هو أرشيف التسريب، والثاني ملف مضغوط بامتداد صورة." },
      { q: "ما اسم الملف المحذوف؟", type: "value", answer: "arc_1003.zip", why: "ظهر بعلامة حمراء وIs Deleted = Yes." },
      { extra: true, q: "ما النوع الحقيقي لـ holiday.jpg؟", type: "choice", options: ["ZIP (مضغوط)", "صورة JPEG", "ملف تنفيذي"], answer: "ZIP (مضغوط)", why: "البايتان الأولان 50 4B (PK)." },
      { extra: true, q: "لماذا ظهر arc_1003.zip رغم حذفه؟", type: "choice", options: ["لأن النسخة الجنائية تنسخ كل القطاعات بما فيها المحذوف", "لأن الحذف فشل", "لأن EnCase يستعيد الملفات تلقائياً"], answer: "لأن النسخة الجنائية تنسخ كل القطاعات بما فيها المحذوف", why: "الحذف يزيل الإشارة لا البيانات، والنسخة بت ببت أخذت البيانات." },
      { extra: true, q: "ما قيمة MD5 التي تحقق منها EnCase للنسخة؟", type: "value", answer: "5f3a9c1e7b2d4806a1c9e0d3f7b84a26", why: "هي القيمة نفسها التي ظهرت في FTK Imager: اتساق الدليل بين الأداتين." }
    ],
  },
  realWorld: {
    versionNotes: [
      "EnCase Forensic (OpenText) برنامج تجاري؛ الواجهة هنا على نمط الإصدار 8 (Home، ثم القضية، ثم Tree/Table/View).",
      "في الأصل تتحقق EnCase من Hash ملف E01 عند إضافته وتعرض نتيجة التحقق؛ المحاكاة تعرض الرسالة والقيمة.",
      "المحاكاة تفعّل Add Evidence File وتبويبات Text وHex وFields وRaw Search؛ البقية ظاهرة غير مفعّلة."
    ],
    officialSite: null,
    ethics: "اعمل دائماً على النسخة لا الأصل، ولا تضف القرص الأصلي إلى القضية. ما تجده في الملفات الشخصية للموظفين سرّي: لا تتجاوز نطاق التفويض الذي يحدد ما يجوز فحصه."
  }
};
