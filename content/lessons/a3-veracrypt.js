/* Lesson a3-veracrypt — Lab 7 (VeraCrypt). Concepts: docs/concepts.md §46–49. Values: docs/outputs-spec.md §ط-2 (PROPOSED, awaiting approval). */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a3-veracrypt"] = {
  id: "a3-veracrypt", seq: 10, axis: 3, axisTitle: "المحور 3: استرجاع البيانات وكشف المخفي", labs: [7], chapters: [6], minutes: 30,
  title: "VeraCrypt: الحاويات المشفّرة",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "كيف نحمي نتائج التحقيق نفسها؟",
    reached: "استعدنا الأرشيف المحذوف، وصار لدينا أدلة حساسة: ملفات رواتب وموردين وحسابات بنكية.",
    seeking: "نحفظ نتائج التحقيق في حاوية مشفّرة لا تُفتح إلا بكلمة المرور الصحيحة.",
    finding: "أُنشئت حاوية Evidence.hc (250 MB، AES، SHA-512) وظهرت M: بعد Mount بكلمة المرور الصحيحة، ورُفضت الكلمة الخاطئة برسالة Incorrect password."
  },
  objectives: [
    "إنشاء حاوية مشفرة (Evidence.hc) بخطوات VeraCrypt الحقيقية.",
    "ربط الحاوية بحرف قرص (Mount) وفكّها (Unmount)، وملاحظة رفض كلمة المرور الخاطئة.",
    "فهم لماذا يصعب على المحقق فتح حاوية مشتبه به."
  ],
  explain: {
    intro: "التشبيه الجامع لهذا الدرس: التشفير خزنة؛ المحتوى موجود لكنه لا يُقرأ بلا الرقم السري. اقرأ البطاقات بأي ترتيب.",
    figure: "safe",
    whatNext: "ستنشئ حاوية Evidence.hc بحجم 250 MB بخوارزمية AES، وتحرّك الفأرة لجمع العشوائية ثم Format، ثم تجرّب Mount بكلمة خاطئة وبالصحيحة، وتنتهي بـ Unmount.",
    cards: [
      {
        id: "encryption", ar: "التشفير ومفتاحه", en: "Encryption",
        analogy: "خزنة: المحتوى موجود لكن لا يُقرأ بلا الرقم السري.",
        meaning: "تحويل البيانات إلى صيغة غير مفهومة إلا بمفتاح/كلمة مرور. AES خوارزمية تشفير قوية شائعة.",
        inTool: ["Encryption Algorithm: AES   (معالج VeraCrypt)"],
        forInvestigator: "البيانات المشفرة بلا كلمة مرور لا تُقرأ عملياً؛ لذلك يهم ضبط الجهاز وهو يعمل والحجم مفتوح إن أمكن.",
        fromCase: "(مقترح) الطالب ينشئ حاوية Evidence.hc لحفظ نتائجه، ويفهم لماذا يصعب على المحقق فتح حاوية مشتبه به.",
        mistake: "الخلط بين التشفير (يُفك بالمفتاح) والـ Hash (لا يُعكس).",
        quiz: { q: "هل يمكن «فك» قيمة MD5 لاستعادة الملف؟", type: "choice", options: ["لا؛ Hash ليس تشفيراً", "نعم بكلمة المرور", "نعم دائماً"], answer: "لا؛ Hash ليس تشفيراً", why: "التشفير يُعكس بالمفتاح، أما Hash فلا يُعكس." }
      },
      {
        id: "container", ar: "الحاوية المشفرة والقرص الافتراضي", en: "Container / Volume / Mount",
        analogy: "حقيبة مقفلة تبدو ملفاً عادياً؛ عند فتحها تصبح درجاً جديداً في المكتب.",
        meaning: "ملف (مثل Evidence.hc) يحوي قرصاً مشفراً. Mount يربطه بحرف (مثل M:) فيظهر كقرص عادي؛ Unmount يعيده مقفلاً.",
        inTool: ["Create Volume • Select File… • Mount • Unmount  (Dismount في الإصدارات الأقدم)"],
        forInvestigator: "ملف كبير بلا امتداد معروف ومحتوى يبدو عشوائياً قد يكون حاوية مشفرة؛ ووجود VeraCrypt مثبّتاً مؤشر.",
        fromCase: "—",
        mistake: "الظن أن الملفات داخل الحاوية تُخزَّن مكشوفة على القرص.",
        quiz: { q: "أُطفئ الجهاز والحجم مفتوح؛ ماذا يحدث له؟", type: "choice", options: ["يُغلق ويعود مشفراً", "يبقى مفتوحاً", "يُحذف"], answer: "يُغلق ويعود مشفراً", why: "الحجم المركّب يُفصل عند الإطفاء ولا يُفتح إلا بكلمة المرور." }
      },
      {
        id: "password", ar: "كلمة المرور القوية والعشوائية", en: "Password / Randomness",
        analogy: "طول الرقم السري للخزنة وصعوبة تخمينه.",
        meaning: "قوة الحماية في كلمة المرور؛ وتحريك الفأرة يجمع عشوائية لتوليد مفاتيح لا تُتوقع.",
        inTool: ["Volume Password (مرتان)", "مؤشر العشوائية يصبح أخضر  ←  Format"],
        forInvestigator: "كلمة ضعيفة قد تُخمَّن (ارجع لمفهوم Brute Force).",
        fromCase: "حساب sami اختُرق بسبب كلمة مرور قابلة للتخمين.",
        mistake: "كلمات قصيرة أو شخصية.",
        quiz: { q: "لماذا يطلب VeraCrypt تحريك الفأرة؟", type: "choice", options: ["لجمع عشوائية لتوليد المفاتيح", "لتسريع النسخ", "لتأكيد هوية المستخدم"], answer: "لجمع عشوائية لتوليد المفاتيح", why: "حركات الفأرة مصدر عشوائية لا يتوقعها المهاجم." }
      },
      {
        id: "hidden", ar: "الحجم المخفي والإخفاء", en: "Hidden Volume / Steganography",
        analogy: "درج سري داخل درج عادي.",
        meaning: "VeraCrypt يتيح حجماً مخفياً داخل حجم عادي بكلمة مرور ثانية؛ والإخفاء (الفصل 6) يدسّ بيانات داخل صور أو ملفات أخرى.",
        inTool: ["Hidden VeraCrypt volume  (لا يُطبّق في الدرس، يُشرح فقط)"],
        forInvestigator: "فتح حجم بكلمة مرور لا يعني رؤية كل ما فيه.",
        fromCase: "—",
        mistake: "اعتبار الحجم «فارغاً» لأن الجزء المفتوح فارغ.",
        quiz: { q: "لماذا قد لا يكشف فتح الحاوية كل محتواها؟", type: "choice", options: ["قد تحوي حجماً مخفياً بكلمة أخرى", "لأن VeraCrypt يخفي نصف الملفات دائماً", "لأن القرص تالف"], answer: "قد تحوي حجماً مخفياً بكلمة أخرى", why: "الحجم المخفي لا يظهر إلا بكلمة مروره الخاصة." }
      }
    ]
  },
  practice: {
    tool: "veracrypt", state: "healthy",
    scenario: "ستنشئ حاوية مشفرة لحفظ نتائج التحقيق، وتتأكد أنها لا تُفتح إلا بكلمة المرور الصحيحة.",
    launchers: [{ tool: "veracrypt", label: "VeraCrypt" }],
    freeNote: "أنشئ حاوية بنفسك دون تلميحات. جرّب كلمات مرور قصيرة، وجرّب فتح الحاوية بكلمة خاطئة.",
    steps: [
      { id: "s1", title: "افتح VeraCrypt", instruction: "اضغط زر «VeraCrypt» في شريط التطبيقات.", why: "VeraCrypt برنامج مجاني لإنشاء الحاويات المشفرة.",
        expect: { type: "event", name: "tool:launch", where: { tool: "veracrypt" } }, target: "[data-launch=\"veracrypt\"]", hints: ["الزر فوق نافذة المحاكاة.", "اسمه اسم البرنامج.", "اضغط «VeraCrypt»."], demo: { kind: "launch", tool: "veracrypt" } },
      { id: "s2", title: "ابدأ معالج الإنشاء", instruction: "اضغط Create Volume.", why: "يفتح VeraCrypt Volume Creation Wizard.",
        expect: { type: "event", name: "vc:wizard-open" }, target: "[data-win=\"veracrypt\"] [data-vc=\"create\"]", hints: ["الزر الأول تحت قائمة الأقراص.", "اسمه يصف ما تفعله.", "اضغط Create Volume."], demo: { kind: "ui", tool: "veracrypt", action: "step", arg: "s2" } },
      { id: "s3", title: "حاوية قياسية في ملف", instruction: "اترك الخيارين الافتراضيين (حاوية مشفرة في ملف + حجم قياسي) واضغط Next مرتين، ثم اكتب المسار C:\\Users\\Student\\Documents\\Evidence.hc واضغط Next.", why: "الحاوية ملف عادي الشكل يحوي قرصاً مشفراً.",
        expect: { type: "event", name: "vc:location", where: { name: "Evidence.hc" } }, target: "[data-win=\"veracrypt\"] .dlg .dlg-btns button:nth-child(2)", onMismatch: "اسم الملف المطلوب: Evidence.hc.",
        hints: ["الخياران الأولان فعّالان وهما الافتراضيان.", "في صفحة Volume Location اكتب المسار الكامل.", "C:\\Users\\Student\\Documents\\Evidence.hc ثم Next."], demo: { kind: "ui", tool: "veracrypt", action: "step", arg: "s3" } },
      { id: "s4", title: "الخوارزمية والحجم", instruction: "اترك AES وSHA-512 كما هما واضغط Next، ثم اكتب الحجم 250 (MB) واضغط Next.", why: "AES قوية وشائعة؛ والحجم يحدد سعة القرص الافتراضي.",
        expect: { type: "event", name: "vc:size", where: { mb: 250, alg: "AES", hash: "SHA-512" } }, target: "[data-win=\"veracrypt\"] .dlg .dlg-btns button:nth-child(2)", onMismatch: "المطلوب: AES وSHA-512 وحجم 250 MB.",
        hints: ["الصفحة الأولى فيها قائمتان بقيمتين افتراضيتين صحيحتين.", "ثم صفحة الحجم: رقم ووحدة.", "250 وMB ثم Next."], demo: { kind: "ui", tool: "veracrypt", action: "step", arg: "s4" } },
      { id: "s5", title: "كلمة المرور", instruction: "اكتب كلمة مرور طويلة مرتين (8 أحرف أو أكثر) ثم Next.", why: "Next معطّل حتى تتطابق الكلمتان؛ وقوة الحاوية في قوة الكلمة.",
        expect: { type: "event", name: "vc:password", where: { match: true } }, target: "[data-win=\"veracrypt\"] input[aria-label=\"Password\"]", hints: ["حقلان: Password وConfirm.", "الكلمتان متطابقتان وغير شخصيتين.", "مثلاً Evid3nce-Lab!2026 في الحقلين."], demo: { kind: "ui", tool: "veracrypt", action: "step", arg: "s5" } },
      { id: "s6", title: "العشوائية ثم Format", instruction: "حرّك الفأرة فوق المنطقة الرمادية حتى يصبح المؤشر أخضر، ثم اضغط Format وانتظر رسالة النجاح.", why: "حركات الفأرة تولّد عشوائية لمفاتيح التشفير.",
        expect: { type: "event", name: "vc:created", where: { name: "Evidence.hc" } }, target: "[data-win=\"veracrypt\"] .mouse-pad", hints: ["المنطقة المنقّطة وسط النافذة.", "حرّك الفأرة بعشوائية داخلها (أو اضغط أي مفتاح عليها).", "عندما يمتلئ المؤشر وينقلب أخضر اضغط Format."], demo: { kind: "ui", tool: "veracrypt", action: "step", arg: "s6" } },
      { id: "s7", title: "Mount: كلمة خاطئة ثم صحيحة", instruction: "اضغط Select File… ثم Mount: جرّب كلمة مرور خاطئة وانظر الرفض، ثم أعد Mount بالكلمة الصحيحة.", why: "الحاوية لا تُفتح إلا بكلمة مرورها.",
        expect: { type: "event", name: "vc:mounted", where: { letter: "M:" } }, target: "[data-win=\"veracrypt\"] [data-vc=\"selectfile\"]", hints: ["Select File… يملأ مسار الحاوية التي أنشأتها.", "Mount ثم اكتب كلمة المرور.", "إن رُفضت الكلمة فأعد المحاولة بالصحيحة."], demo: { kind: "ui", tool: "veracrypt", action: "step", arg: "s7" } },
      { id: "s8", title: "Unmount", instruction: "حدّد M: في القائمة واضغط Unmount.", why: "بعد الانتهاء يُفصل الحجم فيعود مقفلاً (كان اسمها Dismount في الإصدارات القديمة).",
        expect: { type: "event", name: "vc:unmounted" }, target: "[data-win=\"veracrypt\"] [data-vc=\"unmount\"]", hints: ["الصف الذي يعرض M: ومسار الحاوية.", "الزر الذي كان يحمل اسم Mount.", "اضغط Unmount."], demo: { kind: "ui", tool: "veracrypt", action: "step", arg: "s8" } }
    ]
  },
  interpret: {
    sources: [
      { id: "created", tool: "veracrypt", cmd: "created", title: "رسالة الإنشاء", heading: "VeraCrypt — Volume Creation Wizard" },
      { id: "list", tool: "veracrypt", cmd: "list", title: "قائمة الأقراص بعد Mount", heading: "VeraCrypt — main window (after Mount)" },
      { id: "error", tool: "veracrypt", cmd: "error", title: "كلمة مرور خاطئة", heading: "VeraCrypt — message box" }
    ],
    highlights: [
      { src: "created", line: "successfully created", match: "successfully created", label: "successfully created", concept: "container", meaning: "أُنشئت الحاوية: ملف Evidence.hc على القرص، محتواه مشفر ولا يُقرأ بلا كلمة المرور." },
      { src: "created", line: "Encryption Algorithm", match: "AES", label: "AES", concept: "encryption", meaning: "خوارزمية التشفير؛ لا يمكن قراءة المحتوى بلا المفتاح المشتق من كلمة المرور." },
      { src: "list", line: "M:", match: "M:", label: "M:", concept: "container", meaning: "حرف القرص الافتراضي: يظهر كقرص عادي ما دام الحجم مركّباً (Mounted)." },
      { src: "list", line: "M:", match: "250 MB", label: "250 MB", concept: "container", meaning: "حجم القرص الافتراضي كما أنشأته." },
      { src: "list", line: "M:", match: "Normal", label: "Type: Normal", concept: "hidden", meaning: "حجم عادي؛ ولا يعني ذلك أنه لا يحوي حجماً مخفياً بكلمة أخرى." },
      { src: "error", line: "Incorrect password", match: "Incorrect password or not a VeraCrypt volume.", label: "رسالة الرفض", danger: true, concept: "password", meaning: "كلمة المرور خاطئة (أو الملف ليس حاوية): لا يكشف VeraCrypt أيهما، حتى لا يساعد المهاجم." }
    ],
    table: [
      { see: "ملف كبير بلا امتداد معروف ومحتوى عشوائي", means: "قد يكون حاوية مشفرة (مؤشر يحتاج تأكيداً)." },
      { see: "Incorrect password or not a VeraCrypt volume.", means: "كلمة المرور خاطئة أو الملف ليس حاوية؛ لا يمكن التمييز بينهما." },
      { see: "M: بعد Mount", means: "الحاوية مفتوحة وتظهر كقرص عادي؛ تُغلق بـ Unmount أو بإطفاء الجهاز." },
      { see: "VeraCrypt مثبّت على جهاز المشتبه به", means: "مؤشر على وجود بيانات مشفرة؛ اضبط الجهاز وهو يعمل إن أمكن قبل أن تُغلق الأحجام." }
    ],
    ioc: ["وجود برنامج تشفير وملف عشوائي كبير على جهاز المشتبه به."],
    questions: [
      { q: "هل أُنشئ القرص المشفر؟", type: "choice", options: ["نعم: ظهر M: بعد Mount بحجم 250 MB", "لا", "فقط ملف بلا قرص"], answer: "نعم: ظهر M: بعد Mount بحجم 250 MB", why: "الحاوية ملف Evidence.hc، وM: هو قرصها الافتراضي عند الفتح." },
      { q: "هل يُفتح القرص بلا كلمة المرور الصحيحة؟", type: "choice", options: ["لا: يرفضه VeraCrypt برسالة خطأ", "نعم لكن للقراءة فقط", "نعم إذا كان الملف كبيراً"], answer: "لا: يرفضه VeraCrypt برسالة خطأ", why: "المفتاح مشتق من كلمة المرور؛ بدونها لا يُفك التشفير." },
      { extra: true, q: "لماذا يطلب VeraCrypt تحريك الفأرة؟", type: "choice", options: ["لجمع عشوائية لتوليد المفاتيح", "لتسريع النسخ", "لتأكيد هوية المستخدم"], answer: "لجمع عشوائية لتوليد المفاتيح", why: "العشوائية تجعل المفاتيح غير متوقعة." },
      { extra: true, q: "أُطفئ الجهاز والحجم مفتوح؛ ماذا يحدث له؟", type: "choice", options: ["يُغلق ويعود مشفراً", "يبقى مفتوحاً", "يُحذف"], answer: "يُغلق ويعود مشفراً", why: "لذلك يُضبط جهاز المشتبه به وهو يعمل إن أمكن." },
      { extra: true, q: "هل يمكن «فك» قيمة MD5 كما نفك التشفير بالمفتاح؟", type: "choice", options: ["لا؛ Hash ليس تشفيراً", "نعم بكلمة المرور", "نعم بـ AES"], answer: "لا؛ Hash ليس تشفيراً", why: "Hash اتجاه واحد؛ التشفير اتجاهان بالمفتاح." }
    ],
  },
  realWorld: {
    versionNotes: [
      "VeraCrypt مجاني ومفتوح المصدر؛ في الإصدارات الحديثة سُمّي الأمران Unmount / Unmount All بدل Dismount.",
      "الحجم المخفي (Hidden volume) يُشرح هنا ولا يُطبَّق.",
      "نص رسالة كلمة المرور الخاطئة في المحاكاة من المعرفة العامة بالبرنامج؛ قد يختلف قليلاً بين الإصدارات."
    ],
    officialSite: "https://veracrypt.io/",
    ethics: "استخدم التشفير لحماية بياناتك المشروعة. ولا تحاول تخمين كلمة مرور حاوية لا تملك إذناً قانونياً بفتحها؛ فالتخمين المتكرر (Brute Force) اعتداء حتى لو كانت الحاوية ملف غيرك."
  }
};
