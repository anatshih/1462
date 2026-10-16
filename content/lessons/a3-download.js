/* Lesson a3-download — Lab 4 (safe download + verification, no real download). Concepts: docs/concepts.md §45 (+ Hash recap §34).
   Values: docs/outputs-spec.md §ط-1 (PROPOSED). The hashes are fictional. */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a3-download"] = {
  id: "a3-download", seq: 8, axis: 3, axisTitle: "المحور 3: استرجاع البيانات وكشف المخفي", labs: [4], chapters: [3, 5], minutes: 20,
  title: "التنزيل الآمن والتحقق من الأداة",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "كيف نحصل على أداة الاسترجاع دون أن نُخترق نحن؟",
    reached: "في النسخة الجنائية أرشيف محذوف نريد استعادته.",
    seeking: "نحتاج أداة استرجاع (DiskDigger). نتعلم أولاً تنزيلها من مصدرها الرسمي والتحقق من بصمتها، فالمحقق لا يكرر خطأ الضحية.",
    finding: "نُزّل DiskDigger.exe من diskdigger.org وتطابق SHA256 المحسوب (3e7d9a41…) مع القيمة المنشورة؛ أما ملف الموقع الوسيط فلا يطابق ورُفض."
  },
  objectives: [
    "التعرف على الموقع الرسمي لأداة وتمييزه من موقع وسيط.",
    "حساب Hash للملف المنزّل بأمر certutil ومقارنته بالقيمة المنشورة رسمياً.",
    "تفسير التطابق وعدمه، وقرار تشغيل الملف أو رفضه."
  ],
  explain: {
    intro: "في المختبر 4 يُطلب تنزيل DiskDigger. هنا لا ننزّل شيئاً فعلياً: نتدرب على الطريقة الآمنة التي يجب أن يتبعها المحقق قبل تشغيل أي أداة على جهازه.",
    figure: null,
    whatNext: "ستبحث عن DiskDigger في «المتصفح» المحاكى، وتنزّل من الموقع الرسمي ومن موقع وسيط (محاكاة فقط)، وتحسب SHA256 لكل ملف بـ certutil، وتقارن بالقيمة المنشورة.",
    cards: [
      {
        id: "safe-download", ar: "التنزيل الآمن والتحقق من الأداة", en: "Safe download & verification",
        analogy: "شراء الدواء من الصيدلية لا من بائع متجول.",
        meaning: "تُنزَّل الأداة من موقعها الرسمي فقط، ويُتحقق من الملف (التوقيع الرقمي أو قيمة Hash المنشورة).",
        inTool: ["certutil -hashfile DiskDigger.exe SHA256", "SHA256 hash of DiskDigger.exe:"],
        forInvestigator: "أداة مزيفة قد تكون خبيثة أو تغيّر الدليل؛ والمحكمة قد تسأل عن مصدر الأداة.",
        fromCase: "update.exe نفسه مثال لبرنامج «يتنكر» كتحديث.",
        mistake: "التنزيل من مواقع «Download free» الوسيطة.",
        quiz: { q: "كيف تتأكد أن الملف المنزّل لم يُعدَّل؟", type: "choice", options: ["بمطابقة Hash مع المنشور رسمياً", "بالنظر إلى اسم الملف", "بحجم الملف فقط"], answer: "بمطابقة Hash مع المنشور رسمياً", why: "اسم الملف وحجمه يسهل تقليدهما؛ أما Hash فيتغير كلياً مع أي تعديل." }
      },
      {
        id: "hash-recap", ar: "تذكير: البصمة الرقمية", en: "Hash (SHA256)",
        analogy: "بصمة الإصبع للملف.",
        meaning: "سلسلة ثابتة الطول تُحسب من محتوى الملف؛ أي تغيير ولو بحرف يغيّرها كلياً. SHA256 أقوى من MD5 وأطول (64 خانة).",
        inTool: ["SHA256 hash of DiskDigger.exe:", "3e7d9a41c2b8f6054d1e7a93b0c5f28e6a4d17b9c30e85f2a6d1b94c7e0f3a58"],
        forInvestigator: "المقارنة بالقيمة الرسمية المنشورة تثبت أن الملف هو نفسه الذي نشره المطوّر.",
        fromCase: "رأيت MD5 للنسخة الجنائية في FTK Imager؛ هنا نستخدم SHA256 لملف تنفيذي.",
        mistake: "مقارنة أول أحرف فقط والتوقف؛ الأفضل مقارنة القيمة كاملة.",
        quiz: { q: "إذا اختلف حرف واحد في Hash المحسوب عن المنشور، فماذا نفعل؟", type: "choice", options: ["لا نشغّل الملف ونعيد التنزيل من المصدر الرسمي", "نشغّله لأن الفرق صغير", "نتجاهل Hash"], answer: "لا نشغّل الملف ونعيد التنزيل من المصدر الرسمي", why: "الفرق الصغير في Hash يعني أن الملف تغيّر." }
      }
    ]
  },
  practice: {
    tool: "browser", state: "healthy",
    scenario: "يطلب Lab Manual تنزيل DiskDigger. نفّذ الإجراء الآمن: نزّل من الموقع الرسمي وتحقق من Hash، ثم جرّب موقعاً وسيطاً وانظر الفرق. (لا يُنزَّل أي ملف فعلي.)",
    launchers: [{ tool: "browser", label: "Browser" }, { tool: "cmd", label: "Command Prompt" }],
    freeNote: "جرّب المصدرين بنفسك واحسب Hash لكل ملف.",
    steps: [
      { id: "s1", title: "افتح المتصفح", instruction: "اضغط زر «Browser» في شريط التطبيقات.", why: "نبحث عن الأداة كما يفعل أي مستخدم.",
        expect: { type: "event", name: "tool:launch", where: { tool: "browser" } }, target: "[data-launch=\"browser\"]", hints: ["الزر فوق نافذة المحاكاة.", "اسمه Browser.", "اضغط «Browser»."], demo: { kind: "launch", tool: "browser" } },
      { id: "s2", title: "افتح الموقع الرسمي", instruction: "من نتائج البحث افتح نتيجة diskdigger.org (الموقع الرسمي للأداة).", why: "المطوّر ينشر ملفه وقيمة Hash الصحيحة في موقعه الرسمي.",
        expect: { type: "event", name: "br:visit", where: { site: "diskdigger.org" } }, target: "[data-win=\"browser\"] [data-result=\"official\"]", onMismatch: "ابدأ بالموقع الرسمي diskdigger.org.",
        hints: ["نتيجتان في الصفحة.", "العنوان الذي يطابق اسم الأداة بلا زيادات.", "افتح diskdigger.org."], demo: { kind: "ui", tool: "browser", action: "visit", arg: "official" } },
      { id: "s3", title: "نزّل الملف الرسمي", instruction: "اضغط زر Download DiskDigger.exe، ولاحظ قيمة SHA256 المنشورة في الصفحة.", why: "القيمة المنشورة هي المرجع الذي سنقارن به.",
        expect: { type: "event", name: "br:download", where: { site: "diskdigger.org" } }, target: "[data-win=\"browser\"] [data-download=\"official\"]", hints: ["الزر الأزرق في الصفحة.", "اسم الملف DiskDigger.exe.", "اضغط Download."], demo: { kind: "ui", tool: "browser", action: "download", arg: "official" } },
      { id: "s4", title: "احسب Hash للملف الرسمي", instruction: "افتح Command Prompt واكتب: certutil -hashfile DiskDigger.exe SHA256 ثم قارن القيمة بالمنشورة.", why: "التطابق يثبت أن الملف الذي نزّلته هو نفسه الذي نشره المطوّر.",
        expect: { type: "command", tool: "cmd", match: "^certutil -hashfile DiskDigger\\.exe SHA256$" }, solution: "certutil -hashfile DiskDigger.exe SHA256", target: "[data-launch=\"cmd\"]",
        hints: ["الأمر certutil ومعه الخيار -hashfile.", "اسم الملف ثم اسم الخوارزمية.", "certutil -hashfile DiskDigger.exe SHA256"], demo: [{ kind: "launch", tool: "cmd" }, { kind: "command", tool: "cmd", text: "certutil -hashfile DiskDigger.exe SHA256" }] },
      { id: "s5", title: "جرّب الموقع الوسيط", instruction: "ارجع (◀) وافتح نتيجة free-pdf-tools.example ونزّل منها الملف.", why: "لترى كيف يبدو موقع وسيط مغرٍ بلا قيمة Hash منشورة.",
        expect: { type: "event", name: "br:download", where: { site: "free-pdf-tools.example" } }, target: "[data-win=\"browser\"] .br-bar button", onMismatch: "المطلوب هنا التنزيل من free-pdf-tools.example (للتجربة فقط).",
        hints: ["زر الرجوع في شريط عنوان المتصفح.", "النتيجة الثانية ذات الشعار «FREE».", "افتحها واضغط Download free."], demo: [{ kind: "ui", tool: "browser", action: "back", arg: [] }, { kind: "ui", tool: "browser", action: "visit", arg: "third" }, { kind: "ui", tool: "browser", action: "download", arg: "third" }] },
      { id: "s6", title: "احسب Hash للملف الوسيط", instruction: "اكتب في Command Prompt: certutil -hashfile DiskDigger-setup.exe SHA256 وقارنه بالقيمة الرسمية.", why: "القرار: هل نشغّل الملف؟",
        expect: { type: "command", tool: "cmd", match: "^certutil -hashfile DiskDigger-setup\\.exe SHA256$" }, solution: "certutil -hashfile DiskDigger-setup.exe SHA256",
        hints: ["الأمر نفسه باسم الملف الثاني.", "الملف المنزّل من الموقع الوسيط.", "certutil -hashfile DiskDigger-setup.exe SHA256"], demo: { kind: "command", tool: "cmd", text: "certutil -hashfile DiskDigger-setup.exe SHA256" } }
    ]
  },
  interpret: {
    sources: [
      { id: "official", tool: "cmd", cmd: "certutil -hashfile DiskDigger.exe SHA256", title: "الملف الرسمي", state: "healthy" },
      { id: "third", tool: "cmd", cmd: "certutil -hashfile DiskDigger-setup.exe SHA256", title: "الملف الوسيط", state: "healthy" }
    ],
    highlights: [
      { src: "official", line: "3e7d9a41", match: "3e7d9a41c2b8f6054d1e7a93b0c5f28e6a4d17b9c30e85f2a6d1b94c7e0f3a58", label: "SHA256 المحسوب", concept: "safe-download", meaning: "يطابق حرفاً بحرف القيمة المنشورة في الموقع الرسمي: الملف سليم ولم يُعدَّل." },
      { src: "official", line: "completed successfully", match: "completed successfully", label: "completed successfully", concept: "hash-recap", meaning: "نجح حساب Hash؛ لا يعني أن الملف آمن، بل أن القيمة حُسبت. الحكم بالمقارنة." },
      { src: "third", line: "b91f04c6", match: "b91f04c6d27e3a85f1c9b0e47d63a2158ef40c97b3d6a1e82f05c7d94b3a6e10", label: "SHA256 المحسوب", danger: true, concept: "safe-download", meaning: "لا يطابق أي قيمة رسمية منشورة؛ الملف من موقع وسيط وقد يكون معدّلاً أو خبيثاً: لا تشغّله." }
    ],
    table: [
      { see: "Hash مطابق للمنشور رسمياً", means: "الملف هو نفسه الذي نشره المطوّر؛ يمكن استخدامه." },
      { see: "Hash مختلف أو لا توجد قيمة منشورة", means: "لا يمكن إثبات سلامة الملف؛ لا يُشغَّل." },
      { see: "الموقع ليس diskdigger.org", means: "مصدر غير رسمي؛ ابحث عن الرابط من الموقع الرسمي لا من نتائج «Download free»." }
    ],
    ioc: [],
    questions: [
      { q: "اكتب أول 8 خانات من SHA256 للملف الرسمي.", type: "value", answer: "3e7d9a41", why: "هي بداية القيمة 3e7d9a41c2b8…؛ وتُقارن القيمة كاملة في الواقع." },
      { q: "أي المصدرين يمكن الوثوق بالملف المنزّل منه؟", type: "choice", options: ["diskdigger.org: Hash يطابق المنشور", "free-pdf-tools.example: التنزيل أسرع", "كلاهما بلا فرق"], answer: "diskdigger.org: Hash يطابق المنشور", why: "الموقع الوسيط لم ينشر Hash، وقيمة ملفه لا تطابق الرسمية." },
      { extra: true, q: "ما الأمر الذي حسبنا به Hash في CMD؟", type: "choice", options: ["certutil -hashfile ملف SHA256", "ipconfig /all", "netstat -ano"], answer: "certutil -hashfile ملف SHA256", why: "certutil أداة مدمجة في Windows." },
      { extra: true, q: "لماذا يهم مصدر الأداة في التحقيق؟", type: "choice", options: ["أداة مزيفة قد تغيّر الدليل أو تكون خبيثة، والمحكمة قد تسأل عن مصدرها", "لأن الأدوات الرسمية أجمل", "لا يهم"], answer: "أداة مزيفة قد تغيّر الدليل أو تكون خبيثة، والمحكمة قد تسأل عن مصدرها", why: "سلامة الأداة جزء من سلامة الإجراء." }
    ],
  },
  realWorld: {
    versionNotes: [
      "DiskDigger برنامج لاستعادة الملفات من diskdigger.org؛ الملف الحقيقي له قيمة تحقق تنشرها الجهة المطوّرة (قيمة المحاكاة وهمية).",
      "certutil -hashfile أمر مدمج في Windows يدعم خوارزميات SHA1 وSHA256 وMD5.",
      "في الواقع يُتحقق أيضاً من التوقيع الرقمي للملف التنفيذي (Properties ← Digital Signatures)."
    ],
    officialSite: "https://diskdigger.org/",
    ethics: "لا تنزّل أدوات التحقيق من مواقع وسيطة، ولا تشغّلها على جهاز الأدلة قبل التحقق منها؛ وسجّل مصدر الأداة وقيمة Hash في تقريرك."
  }
};
