/* Lesson a3-diskdigger — Lab 5 (DiskDigger). Concepts: docs/concepts.md §41–44. Values: docs/outputs-spec.md §ط-1 (PROPOSED, awaiting approval). */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a3-diskdigger"] = {
  id: "a3-diskdigger", seq: 9, axis: 3, axisTitle: "المحور 3: استرجاع البيانات وكشف المخفي", labs: [5], chapters: [3, 5], minutes: 30,
  title: "DiskDigger: استعادة الملفات المحذوفة",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "هل يمكن استعادة الأرشيف المحذوف؟",
    reached: "عندنا أداة استرجاع موثوقة تحققنا من بصمتها.",
    seeking: "نفحص نسخة القرص بحثاً عن الأرشيف المحذوف، ونعرف أين يظهر ولماذا.",
    finding: "استُرجع arc_1003.zip (محذوف) من Found in file system بمساره الأصلي، وحُفظ على قرص آخر؛ كما ظهر 0001.jpg منحوتاً في Found in free space."
  },
  summary: [   // «ما يجب أن تتذكره» at the end of the lesson
    "حذف الملف يزيل الإشارة إليه في نظام الملفات لا محتواه، فيبقى قابلاً للاستعادة حتى يُكتب فوقه.",
    "arc_1003.zip ظهر في تبويب Found in file system باسمه ومساره الأصلي؛ أما 0001.jpg فظهر في Found in free space بالنحت، بلا اسمه الأصلي.",
    "احفظ الملف المستعاد على قرص آخر، حتى لا تكتب فوق بيانات لم تُستعد بعد."
  ],
  objectives: [
    "فهم كيف يُحذف الملف فعلاً ولماذا يمكن استعادته غالباً.",
    "تمييز نتائج Found in file system عن Found in free space.",
    "استعادة ملف إلى مكان آمن دون الكتابة على القرص المفحوص."
  ],
  explain: {
    intro: "التشبيه الجامع: القرص مكتبة لها فهرس بطاقات؛ «الحذف» يمزّق بطاقة الفهرس فقط، والكتاب يبقى على الرف حتى يوضع مكانه كتاب جديد.",
    figure: "library",
    whatNext: "ستفحص قسم C: (النسخة) بـ DiskDigger: تختار القرص، وتقرأ تحذير TRIM، وتختار All file types، ثم تفحص نتيجتي التبويبين وتستعيد ملفاً إلى قرص آخر.",
    cards: [
      {
        id: "deletion", ar: "كيف يُحذف الملف فعلاً", en: "Deletion / File System",
        analogy: "تمزيق بطاقة الفهرس، لا حرق الكتاب.",
        meaning: "نظام الملفات (NTFS مثلاً) يعلّم مكان الملف «متاحاً» ويحذف الإشارة إليه؛ البيانات تبقى حتى يُكتب فوقها.",
        inTool: ["Found in file system   ←  أسماء الملفات المحذوفة ومساراتها"],
        forInvestigator: "المحذوف قابل للاستعادة غالباً؛ والحذف نفسه دليل نية (لماذا حُذف؟).",
        fromCase: "arc_1003.zip حُذف بعد إرساله، لكنه قابل للاستعادة.",
        mistake: "الظن أن تفريغ سلة المحذوفات يمحو البيانات.",
        quiz: { q: "متى تضيع بيانات ملف محذوف نهائياً؟", type: "choice", options: ["حين يُكتب فوقها", "لحظة الحذف", "عند إعادة تشغيل الجهاز"], answer: "حين يُكتب فوقها", why: "الحذف يزيل الإشارة لا البيانات؛ الكتابة الجديدة هي التي تُتلفها." }
      },
      {
        id: "unallocated", ar: "المساحة غير المخصصة والكتابة فوق البيانات", en: "Unallocated Space / Overwrite",
        analogy: "رفوف معلَّمة «فارغة» وفيها كتب قديمة؛ أي كتاب جديد قد يوضع فوقها.",
        meaning: "مساحة يراها النظام فارغة لكنها قد تحوي بقايا ملفات.",
        inTool: ["Found in free space"],
        forInvestigator: "لذلك يُفصل الجهاز ويُنسخ فوراً، ولا يُثبَّت برنامج الاستعادة على القرص نفسه ولا تُحفظ النتائج عليه.",
        fromCase: "الاستعادة تُجرى على النسخة الجنائية لا القرص الأصلي.",
        mistake: "حفظ الملفات المستعادة على القرص نفسه فيُكتب فوق غيرها.",
        quiz: { q: "لماذا لا نحفظ الملفات المستعادة على القرص نفسه؟", type: "choice", options: ["قد تُكتب فوق بيانات محذوفة أخرى", "لأن القرص ممتلئ دائماً", "لأن Windows يمنع ذلك"], answer: "قد تُكتب فوق بيانات محذوفة أخرى", why: "كل كتابة على القرص المفحوص قد تدمر دليلاً لم يُستعد بعد." }
      },
      {
        id: "carving", ar: "النحت", en: "File Carving",
        analogy: "إيجاد كتاب بلا بطاقة فهرس من شكل غلافه.",
        meaning: "البحث في البيانات الخام عن بدايات ونهايات أنواع ملفات معروفة (توقيعاتها) لاستخراجها دون الاعتماد على نظام الملفات.",
        inTool: ["Found in free space  (الإصدارات القديمة: وضع Dig deeper) — غالباً بلا أسماء أصلية"],
        forInvestigator: "يستعيد ملفات من أقراص مهيّأة أو تالفة.",
        fromCase: "صورة مستعادة باسم مولَّد مثل 0001.jpg.",
        mistake: "توقع الأسماء والمسارات الأصلية مع النحت.",
        quiz: { q: "لماذا تظهر الملفات المنحوتة بلا أسمائها الأصلية؟", type: "choice", options: ["لأن الاسم كان في الفهرس لا في الملف", "لأن DiskDigger يخفي الأسماء", "لأن الملف تالف دائماً"], answer: "لأن الاسم كان في الفهرس لا في الملف", why: "النحت يعتمد على محتوى الملف وتوقيعه فقط." }
      },
      {
        id: "trim", ar: "أقراص SSD وTRIM", en: "SSD & TRIM",
        analogy: "مكتبة ينظّف عمالها الرفوف المعلَّمة «فارغة» تلقائياً كل ليلة.",
        meaning: "في أقراص SSD يمحو الأمر TRIM البيانات المحذوفة فعلياً بعد فترة قصيرة.",
        inTool: ["DiskDigger يحذّر عند فحص قرص SSD"],
        forInvestigator: "فرص الاستعادة من SSD أقل؛ السرعة في الحيازة أهم.",
        fromCase: "—",
        mistake: "وعد الجهة الطالبة باستعادة مضمونة من SSD.",
        quiz: { q: "لماذا تقل فرصة الاستعادة من SSD؟", type: "choice", options: ["بسبب TRIM", "لأن SSD أبطأ", "لأن SSD لا يخزّن ملفات"], answer: "بسبب TRIM", why: "TRIM يمحو الكتل المحذوفة فعلياً." }
      }
    ]
  },
  practice: {
    tool: "diskdigger", state: "healthy",
    scenario: "لديك نسخة القسم C: لجهاز سامي. أثبت أن الأرشيف المحذوف arc_1003.zip قابل للاستعادة، واعرف ما تعطيك المساحة الحرة.",
    launchers: [{ tool: "diskdigger", label: "DiskDigger" }],
    freeNote: "افحص بنفسك: جرّب Specific file types، وقارن نتيجة التبويبين، وجرّب الحفظ على القرص نفسه لترى التحذير.",
    steps: [
      { id: "s1", title: "افتح DiskDigger", instruction: "اضغط زر «DiskDigger» في شريط التطبيقات.", why: "DiskDigger يفحص القرص بحثاً عن الملفات المحذوفة.",
        expect: { type: "event", name: "tool:launch", where: { tool: "diskdigger" } }, target: "[data-launch=\"diskdigger\"]", hints: ["الزر فوق نافذة المحاكاة.", "اسمه اسم البرنامج.", "اضغط «DiskDigger»."], demo: { kind: "launch", tool: "diskdigger" } },
      { id: "s2", title: "اختر القرص", instruction: "اختر القسم C:\\ ثم Next.", why: "نفحص النسخة لا القرص الأصلي.",
        expect: { type: "event", name: "dd:drive", where: { drive: "C:" } }, target: "[data-win=\"diskdigger\"] [data-drive=\"C:\"]", hints: ["القائمة تحوي قسماً واحداً.", "اضغطه لتفعيل Next.", "اختر C:\\ ثم Next."], demo: { kind: "ui", tool: "diskdigger", action: "step", arg: "s2" } },
      { id: "s3", title: "اقرأ تحذير TRIM", instruction: "اقرأ تحذير SSD / TRIM ثم اضغط OK.", why: "في SSD قد تكون البيانات المحذوفة قد مُحيت فعلاً.",
        expect: { type: "event", name: "dd:trim" }, target: "[data-win=\"diskdigger\"] .dlg-btns button", hints: ["النافذة الصغيرة فوق البرنامج.", "الزر الوحيد فيها.", "اضغط OK."], demo: { kind: "ui", tool: "diskdigger", action: "step", arg: "s3" } },
      { id: "s4", title: "اختر All file types", instruction: "اختر All file types ثم Next، وانتظر انتهاء الفحص (يمكنك Speed up).", why: "نريد كل الأنواع لأننا لا نعرف ما حُذف.",
        expect: { type: "event", name: "dd:types", where: { mode: "All file types" } }, target: "[data-win=\"diskdigger\"] input[value=\"All file types\"]", onMismatch: "في هذا المختبر اخترنا All file types.",
        hints: ["الخياران الأولان.", "الذي يشمل كل الأنواع.", "All file types ثم Next."], demo: { kind: "ui", tool: "diskdigger", action: "step", arg: "s4" } },
      { id: "s5", title: "اقرأ نتائج الفحص", instruction: "بعد انتهاء الفحص اقرأ تبويب Found in file system ولاحظ اسم الملف ومساره.", why: "هذه ملفات محذوفة ما زال فهرسها موجوداً.",
        expect: { type: "event", name: "dd:results" }, target: "[data-win=\"diskdigger\"] [data-tab=\"Found in file system\"]", hints: ["ينتهي الفحص تلقائياً.", "إن تأخر اضغط Speed up.", "انتظر ظهور تبويبي النتائج."], demo: { kind: "ui", tool: "diskdigger", action: "step", arg: "s5" } },
      { id: "s6", title: "حدّد arc_1003.zip", instruction: "اضغط على arc_1003.zip في Found in file system وانظر المعاينة.", why: "ظهر باسمه الأصلي ومساره لأن فهرسه ما زال موجوداً.",
        expect: { type: "event", name: "dd:select", where: { name: "arc_1003.zip" } }, target: "[data-win=\"diskdigger\"] tr[data-key=\"arc_1003.zip\"]", hints: ["الصف الوحيد في التبويب.", "اسمه يبدأ بـ arc.", "اضغط arc_1003.zip."], demo: { kind: "ui", tool: "diskdigger", action: "step", arg: "s6" } },
      { id: "s7", title: "افحص المساحة الحرة", instruction: "افتح تبويب Found in free space واضغط 0001.jpg.", why: "ملف منحوت: اسمه مولَّد لأن الاسم الأصلي ضاع مع الفهرس.",
        expect: { type: "event", name: "dd:select", where: { name: "0001.jpg", tab: "Found in free space" } }, target: "[data-win=\"diskdigger\"] [data-tab=\"Found in free space\"]", hints: ["التبويب الثاني فوق الجدول.", "الملف الذي اسمه رقم.", "Found in free space ← 0001.jpg."], demo: { kind: "ui", tool: "diskdigger", action: "step", arg: "s7" } },
      { id: "s8", title: "استعد إلى مكان آمن", instruction: "اضغط Recover selected files… واختر مجلداً على قرص آخر (D:\\Recovered)، ثم OK.", why: "الحفظ على القرص نفسه قد يكتب فوق ملفات محذوفة أخرى.",
        expect: { type: "event", name: "dd:recover", where: { safe: true } }, target: "[data-win=\"diskdigger\"] [data-dd=\"recover\"]", onMismatch: "اخترت القرص نفسه: اختر D:\\Recovered (قرص آخر).",
        hints: ["الزر في شريط أدوات النتائج.", "خياران: القرص المفحوص وقرص آخر.", "D:\\Recovered ثم OK."], demo: { kind: "ui", tool: "diskdigger", action: "step", arg: "s8" } }
    ]
  },
  interpret: {
    coreHighlights: ["arc_1003.zip","Directory","0001.jpg"],   // essential values (labels) counted by the discovery counter
    sources: [
      { id: "fs", kind: "table", tool: "diskdigger", title: "Found in file system", heading: "DiskDigger › Found in file system", tab: "Found in file system" },
      { id: "free", kind: "table", tool: "diskdigger", title: "Found in free space", heading: "DiskDigger › Found in free space", tab: "Found in free space" }
    ],
    highlights: [
      { src: "fs", row: "arc_1003.zip", col: "File name", label: "arc_1003.zip", danger: true, concept: "deletion", meaning: "ظهر باسمه الأصلي لأن فهرس الملف ما زال موجوداً؛ هذا هو أرشيف التسريب الذي رأيناه في Procmon." },
      { src: "fs", row: "arc_1003.zip", col: "Directory", label: "Directory", concept: "deletion", meaning: "مساره الأصلي قبل الحذف (Temp عند سامي)." },
      { src: "fs", row: "arc_1003.zip", col: "Date modified", label: "Date modified", concept: "deletion", meaning: "آخر تعديل 8:02 AM: يطابق وقت كتابته في Procmon." },
      { src: "free", row: "0001.jpg", col: "File name", label: "0001.jpg", concept: "carving", meaning: "اسم مولَّد: منحوت من المساحة الحرة بتوقيعه (JPEG)، دون اسم أصلي أو مسار." }
    ],
    table: [
      { see: "Found in file system", means: "ملفات محذوفة ما زال فهرسها موجوداً: أسماء ومسارات أصلية (كان يسمى Dig deep)." },
      { see: "Found in free space", means: "ملفات منحوتة من المساحة غير المخصصة بتوقيعاتها: غالباً بلا أسماء (كان يسمى Dig deeper)." },
      { see: "تحذير TRIM", means: "قرص SSD: قد تُمحى البيانات المحذوفة فعلياً؛ فرص الاستعادة أقل." },
      { see: "الحفظ على القرص نفسه", means: "تحذير: قد تكتب فوق بيانات محذوفة أخرى؛ احفظ على قرص آخر." }
    ],
    ioc: ["arc_1003.zip محذوف لكنه قابل للاستعادة: حذفه بعد الإرسال دليل على محاولة إخفاء."],
    questions: [
      { q: "هل استُرجع الملف المهم؟", type: "choice", options: ["نعم: arc_1003.zip ظهر في Found in file system وأمكن استعادته", "لا: كل شيء ضاع", "فقط 0001.jpg"], answer: "نعم: arc_1003.zip ظهر في Found in file system وأمكن استعادته", why: "فهرسه ما زال موجوداً فظهر باسمه الأصلي." },
      { q: "في أي تبويب ظهر arc_1003.zip؟", type: "choice", options: ["Found in file system", "Found in free space", "Advanced"], answer: "Found in file system", why: "لأنه ملف محذوف ما زال فهرسه موجوداً." },
      { extra: true, q: "لماذا ظهر 0001.jpg بلا اسمه الأصلي؟", type: "choice", options: ["لأن الاسم كان في الفهرس لا في الملف", "لأنه ملف خبيث", "لأن الاسم حُذف عمداً"], answer: "لأن الاسم كان في الفهرس لا في الملف", why: "النحت يعتمد على المحتوى فقط." },
      { extra: true, q: "الدليل يذكر «Basic Scan»؛ ما مقابلها في البرنامج الحديث؟", type: "choice", options: ["ليست تسمية في البرنامج؛ المقابل الحديث هو Found in file system", "Dig deeper دائماً", "Advanced"], answer: "ليست تسمية في البرنامج؛ المقابل الحديث هو Found in file system", why: "الإصدار الحديث دمج وضعي Dig deep وDig deeper في فحص واحد بتبويبين." },
      { extra: true, q: "لماذا اخترنا قرصاً آخر لحفظ الملف المستعاد؟", type: "choice", options: ["لئلا نكتب فوق بيانات محذوفة أخرى على القرص المفحوص", "لأنه أسرع", "لأن DiskDigger يشترط ذلك"], answer: "لئلا نكتب فوق بيانات محذوفة أخرى على القرص المفحوص", why: "الكتابة على القرص نفسه قد تتلف أدلة لم تُستعد بعد." }
    ],
  },
  realWorld: {
    versionNotes: [
      "منذ فبراير 2024 دمج DiskDigger وضعي Dig deep وDig deeper في فحص واحد بتبويبين؛ الإصدارات القديمة تعرض الوضعين للاختيار.",
      "دليل المختبر يذكر «Basic Scan» وهي ليست تسمية في البرنامج.",
      "المحاكاة تعرض نتيجتين فقط (ملف محذوف وصورة منحوتة)؛ في الواقع قد تكون النتائج بالآلاف."
    ],
    officialSite: "https://diskdigger.org/",
    ethics: "الاستعادة من أقراص الآخرين تكشف خصوصياتهم؛ لا تفحص إلا قرصاً تملك إذناً بفحصه، ولا تثبّت البرنامج ولا تحفظ النتائج على القرص المفحوص."
  }
};
