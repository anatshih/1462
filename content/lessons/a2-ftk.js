/* Lesson a2-ftk — Lab 6 (FTK Imager). Concepts: docs/concepts.md §30–35. Values: docs/outputs-spec.md §ح (PROPOSED, awaiting approval). */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a2-ftk"] = {
  id: "a2-ftk", seq: 6, axis: 2, axisTitle: "المحور 2: حيازة الدليل وحفظه", labs: [6], chapters: [2, 4], minutes: 30,
  title: "FTK Imager: النسخة الجنائية والتحقق",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "كيف نحفظ قرص الجهاز دليلاً لا يُطعن فيه؟",
    reached: "اكتملت صورة الاختراق في المحور 1: دخول عبر الشبكة، ثم برنامج يسرق ملفات المالية.",
    seeking: "قبل أي تحليل أعمق نأخذ نسخة جنائية من القرص، ونثبت ببصمتها أنها لم تتغير.",
    finding: "نُسخ القرص C: لجهاز ACC-PC07 بصيغة E01 (MD5 5f3a9c1e…4a26)، وتطابق Computed hash وReport Hash."
  },
  objectives: [
    "إنشاء نسخة جنائية (E01) من قسم C: بخطوات FTK Imager الحقيقية.",
    "تدوين بيانات الدليل (رقم القضية والفاحص) لحفظ سلسلة الحيازة.",
    "قراءة نتيجة التحقق: Computed hash وReport Hash وVerify result."
  ],
  explain: {
    intro: "التشبيه الجامع: المحقق لا يعمل على الوثيقة الأصلية أبداً؛ يصوّرها نسخة مطابقة مختومة ويعمل على النسخة. اقرأ البطاقات بأي ترتيب تشاء.",
    figure: "camera",
    whatNext: "ستنشئ نسخة جنائية بصيغة E01 من قسم C: لجهاز ACC-PC07: تختار المصدر والقسم والصيغة، وتدوّن بيانات الدليل، وتحدد اسم الملف، وتبدأ النسخ مع التحقق، ثم تقرأ قيم Hash.",
    cards: [
      {
        id: "evidence", ar: "الدليل الرقمي وهشاشته", en: "Digital Evidence",
        analogy: "بصمة على كوب: لمسة واحدة خاطئة تفسدها.",
        meaning: "أي بيانات رقمية تثبت واقعة أو تنفيها. يتغير بسهولة: مجرد فتح ملف قد يغيّر تاريخ آخر وصول.",
        inTool: ["Evidence Tree   ← مصادر الدليل في FTK"],
        forInvestigator: "أي تغيير غير موثّق قد يُسقط الدليل أمام المحكمة.",
        fromCase: "قرص جهاز ACC-PC07.",
        mistake: "تشغيل الجهاز المضبوط «لإلقاء نظرة سريعة».",
        quiz: { q: "لماذا لا نفتح ملفات القرص الأصلي مباشرة؟", type: "choice", options: ["لأن الفتح قد يغيّر بياناته الوصفية", "لأن الملفات كبيرة", "لأن Windows يمنع ذلك"], answer: "لأن الفتح قد يغيّر بياناته الوصفية", why: "مثل تاريخ آخر وصول؛ والنسخة هي التي نعمل عليها." }
      },
      {
        id: "forensic-image", ar: "النسخة الجنائية", en: "Forensic Image (bit-by-bit)",
        analogy: "تصوير كل صفحة في الكتاب، حتى الصفحات الفارغة والهوامش الممسوحة.",
        meaning: "نسخة بت ببت من القرص كله، بما فيه المساحة غير المستخدمة والملفات المحذوفة؛ تختلف عن النسخ العادي (Copy/Paste) الذي ينسخ الملفات الظاهرة فقط.",
        inTool: ["File → Create Disk Image…"],
        forInvestigator: "كل التحليل اللاحق (DiskDigger، EnCase) يُجرى على النسخة؛ الأصل يُحفظ مختوماً.",
        fromCase: "الملف المحذوف arc_1003.zip لن يظهر في نسخ عادي، لكنه في النسخة الجنائية.",
        mistake: "اعتبار نسخ المجلدات بالسحب والإفلات نسخة جنائية.",
        quiz: { q: "لماذا لا يكفي نسخ مجلد Documents؟", type: "choice", options: ["لا ينسخ المحذوف ولا المساحة غير المخصصة", "لأنه بطيء", "لأنه يغيّر أسماء الملفات"], answer: "لا ينسخ المحذوف ولا المساحة غير المخصصة", why: "النسخة الجنائية تأخذ كل القطاعات، لا الملفات الظاهرة فقط." }
      },
      {
        id: "drive-types", ar: "القرص الفيزيائي والمنطقي", en: "Physical / Logical Drive",
        analogy: "العمارة كاملة مقابل شقة واحدة فيها.",
        meaning: "Physical Drive القرص كله بكل أقسامه ومساحاته • Logical Drive قسم واحد مثل C:. وهناك Image File وContents of a Folder.",
        inTool: ["Select Source: Physical Drive / Logical Drive / Image File / Contents of a Folder"],
        forInvestigator: "الفيزيائي أشمل وهو الأصل في التحقيق؛ المنطقي أسرع وأصغر حين يكفي.",
        fromCase: "دليل المختبر يطلب Logical Drive.",
        mistake: "اختيار Contents of a Folder والظن أنه يشمل المحذوف.",
        quiz: { q: "أي خيار يشمل المساحة غير المقسّمة؟", type: "choice", options: ["Physical Drive", "Logical Drive", "Contents of a Folder"], answer: "Physical Drive", why: "القسم المنطقي لا يرى ما خارج حدوده." }
      },
      {
        id: "image-formats", ar: "صيغ النسخة", en: "Raw (dd) / E01",
        analogy: "صورة خام بلا إطار مقابل صورة في ملف مختوم عليه بيانات القضية.",
        meaning: "Raw (dd) نسخة خام بحجم القرص • E01 صيغة جنائية تضغط البيانات وتحفظ معها بيانات القضية وقيم Hash.",
        inTool: ["Select Image Type: Raw (dd) / SMART / E01 / AFF"],
        forInvestigator: "E01 الأكثر استخداماً مع EnCase؛ dd يُقرأ بكل الأدوات.",
        fromCase: "النسخة ACC-PC07_C.E01 (مقترح).",
        mistake: "الظن أن الضغط في E01 يفقد بيانات؛ هو ضغط بلا فقدان.",
        quiz: { q: "أي صيغة تحفظ معلومات القضية داخل الملف؟", type: "choice", options: ["E01", "Raw (dd)"], answer: "E01", why: "E01 تحفظ بيانات القضية وقيم Hash داخل الملف؛ dd نسخة خام فقط." }
      },
      {
        id: "hash", ar: "البصمة الرقمية والتحقق", en: "Hash (MD5 / SHA1)",
        analogy: "بصمة الإصبع للملف: تغيير حرف واحد يغيّرها كلياً.",
        meaning: "دالة تحوّل أي بيانات إلى سلسلة ثابتة الطول. تُحسب للأصل وللنسخة؛ تطابقهما يثبت أن النسخة مطابقة تماماً.",
        inTool: ["Verify images after they are created", "Computed hash / Report Hash / Verify result: Match"],
        forInvestigator: "«الحجة القانونية» على أن الدليل لم يُعبث به منذ لحظة النسخ.",
        fromCase: "قيمة MD5 نفسها تظهر في FTK ثم في EnCase.",
        mistake: "نسيان التحقق أو عدم توثيق القيمة في التقرير.",
        quiz: { q: "غيّرنا حرفاً واحداً في ملف؛ ماذا يحدث لقيمة MD5؟", type: "choice", options: ["تتغير كلياً", "تتغير حرفاً واحداً فقط", "لا تتغير"], answer: "تتغير كلياً", why: "هذه خاصية الـ Hash: تغيّر بسيط يعطي قيمة مختلفة تماماً (جرّبه في الرسم أدناه)." }
      },
      {
        id: "custody", ar: "بيانات الدليل وسلسلة الحيازة", en: "Evidence Item Information / Chain of Custody",
        analogy: "إيصال تسليم واستلام لكل من حمل الصندوق.",
        meaning: "توثيق رقم القضية والدليل والوصف والفاحص والملاحظات، وكل من تسلّم الدليل ومتى.",
        inTool: ["Case Number / Evidence Number / Unique Description / Examiner / Notes"],
        forInvestigator: "فجوة في السلسلة قد تُسقط الدليل.",
        fromCase: "Case Number TR-1261-01، Examiner اسم الطالب.",
        mistake: "ترك الحقول فارغة لأنها «اختيارية».",
        quiz: { q: "لماذا يُكتب اسم الفاحص؟", type: "choice", options: ["لتحديد المسؤول عن كل خطوة في السلسلة", "لتجميل التقرير", "لأن البرنامج يطلبه فقط"], answer: "لتحديد المسؤول عن كل خطوة في السلسلة", why: "كل من لمس الدليل يجب أن يكون معروفاً ومسؤولاً." }
      }
    ]
  },
  practice: {
    tool: "ftk", state: "healthy",
    scenario: "أُحضر قرص جهاز ACC-PC07 الذي اختُرق. مهمتك: نسخ القسم C: نسخة جنائية بصيغة E01، مع تدوين بيانات الدليل، ثم التحقق من النسخة.",
    launchers: [{ tool: "ftk", label: "FTK Imager" }],
    freeNote: "أنشئ النسخة بنفسك دون تلميحات. جرّب تعطيل «Verify images…» لترى كيف تصبح النسخة غير موثّقة، وجرّب ترك Case Number فارغاً.",
    steps: [
      { id: "s1", title: "افتح FTK Imager", instruction: "اضغط زر «FTK Imager» في شريط التطبيقات.", why: "FTK Imager برنامج مجاني لإنشاء النسخ الجنائية.",
        expect: { type: "event", name: "tool:launch", where: { tool: "ftk" } }, target: "[data-launch=\"ftk\"]",
        hints: ["الزر فوق نافذة المحاكاة.", "اسمه اسم البرنامج.", "اضغط «FTK Imager»."], demo: { kind: "launch", tool: "ftk" } },
      { id: "s2", title: "ابدأ إنشاء النسخة", instruction: "اختر File ثم Create Disk Image… (أو زر Create Disk Image في الشريط).", why: "هذا هو المعالج الذي ينشئ النسخة الجنائية.",
        expect: { type: "event", name: "ftk:wizard-open" }, target: "[data-win=\"ftk\"] [data-ftk=\"create\"]",
        hints: ["القوائم: File, View, Mode, Help.", "القائمة الأولى فيها العنصر المطلوب.", "File ← Create Disk Image…"], demo: { kind: "ui", tool: "ftk", action: "step", arg: "s2" } },
      { id: "s3", title: "اختر المصدر: Logical Drive", instruction: "في Select Source اختر Logical Drive ثم Next.", why: "نريد قسماً واحداً (C:)؛ Physical Drive يأخذ القرص كله.",
        expect: { type: "event", name: "ftk:source", where: { type: "Logical Drive" } }, target: "[data-win=\"ftk\"] input[value=\"Logical Drive\"]", onMismatch: "المصدر المطلوب في هذا المختبر هو Logical Drive (قسم C:).",
        hints: ["الخيارات الأربعة الأولى فعّالة.", "المصدر قسم واحد وليس القرص كله.", "Logical Drive ثم Next."], demo: { kind: "ui", tool: "ftk", action: "step", arg: "s3" } },
      { id: "s4", title: "اختر القسم C:", instruction: "في Select Drive اختر C:\\ ثم Finish.", why: "هذا هو قسم Windows لجهاز سامي.",
        expect: { type: "event", name: "ftk:drive", where: { drive: "C:" } }, target: "[data-win=\"ftk\"] select[aria-label=\"Source Drive Selection\"]",
        hints: ["القائمة المنسدلة تحت العنوان.", "القسم الوحيد في القائمة.", "اختر C:\\ ثم Finish."], demo: { kind: "ui", tool: "ftk", action: "step", arg: "s4" } },
      { id: "s5", title: "اختر الصيغة E01", instruction: "في نافذة Create Image اضغط Add… ثم اختر E01 ثم Next.", why: "E01 صيغة جنائية تحفظ بيانات القضية وقيم Hash داخل الملف.",
        expect: { type: "event", name: "ftk:imagetype", where: { type: "E01" } }, target: "[data-win=\"ftk\"] [data-ftk=\"add\"]", onMismatch: "الصيغة المطلوبة هنا E01.",
        hints: ["الزر Add… تحت قائمة الوجهات.", "اختر الصيغة التي تبدأ بحرف E.", "E01 ثم Next."], demo: { kind: "ui", tool: "ftk", action: "step", arg: "s5" } },
      { id: "s6", title: "دوّن بيانات الدليل", instruction: "اكتب Case Number = TR-1261-01 وEvidence Number = EV-001 واسمك في Examiner ثم Next.", why: "هذه بيانات سلسلة الحيازة: من، وماذا، ولأي قضية.",
        expect: { type: "event", name: "ftk:info", where: { caseNumber: "TR-1261-01" } }, target: "[data-win=\"ftk\"] input[aria-label=\"Case Number\"]", onMismatch: "رقم القضية في هذا المختبر هو TR-1261-01 (انتبه للحروف والشرطات).",
        hints: ["الحقول الخمسة: Case Number وEvidence Number وUnique Description وExaminer وNotes.", "رقم القضية يبدأ بـ TR.", "Case Number: TR-1261-01 ثم Next."], demo: { kind: "ui", tool: "ftk", action: "step", arg: "s6" } },
      { id: "s7", title: "حدّد اسم الملف", instruction: "في Select Image Destination اكتب Image Filename = ACC-PC07_C (بدون امتداد) ثم Finish.", why: "FTK يضيف الامتداد (.E01) بنفسه؛ الاسم الواضح يسهّل الربط مع الجهاز.",
        expect: { type: "event", name: "ftk:dest", where: { name: "ACC-PC07_C" } }, target: "[data-win=\"ftk\"] input[aria-label=\"Image Filename (Excluding Extension)\"]", onMismatch: "الاسم المطلوب: ACC-PC07_C بلا امتداد.",
        hints: ["الحقل الثاني من الأعلى.", "اسم الجهاز ثم _C.", "ACC-PC07_C ثم Finish."], demo: { kind: "ui", tool: "ftk", action: "step", arg: "s7" } },
      { id: "s8", title: "ابدأ النسخ مع التحقق", instruction: "أبقِ «Verify images after they are created» مفعّلاً واضغط Start، وانتظر حتى تظهر نتائج التحقق (يمكنك استخدام Speed up).", why: "التحقق يقارن Hash للنسخة بـ Hash المحسوب أثناء النسخ.",
        expect: { type: "event", name: "ftk:results", where: { verified: true } }, target: "[data-win=\"ftk\"] .dlg button:not([data-ftk])", onMismatch: "لم يُجرَ التحقق: أعد العملية وأبقِ Verify images مفعّلاً.",
        hints: ["الزر Start في أسفل نافذة Create Image.", "لا تُلغِ خيار Verify.", "اضغط Start ثم انتظر أو اضغط Speed up."], demo: { kind: "ui", tool: "ftk", action: "step", arg: "s8" } }
    ]
  },
  interpret: {
    sources: [{ id: "verify", tool: "ftk", cmd: "verify", title: "نتائج التحقق", heading: "Drive/Image Verify Results" }],
    highlights: [
      { src: "verify", line: "Name  ", match: "ACC-PC07_C.E01", label: "Name", concept: "image-formats", meaning: "اسم النسخة وصيغتها E01؛ نفس الاسم سيظهر في EnCase عند إضافة الدليل." },
      { src: "verify", line: "Sector count", match: "41,943,040", label: "Sector count", concept: "forensic-image", meaning: "عدد القطاعات (20 GB بقطاعات 512 بايت): النسخة تغطي القسم كله بما فيه المساحة غير المخصصة." },
      { src: "verify", line: "Computed hash     5f3a", match: "5f3a9c1e7b2d4806a1c9e0d3f7b84a26", label: "MD5 Computed hash", concept: "hash", meaning: "قيمة MD5 المحسوبة الآن من النسخة." },
      { src: "verify", line: "Report Hash       5f3a", match: "5f3a9c1e7b2d4806a1c9e0d3f7b84a26", label: "MD5 Report Hash", concept: "hash", meaning: "القيمة المحفوظة وقت إنشاء النسخة. تطابقها مع Computed hash يثبت أن النسخة لم تتغير." },
      { src: "verify", line: "Verify result     Match", match: "Match", label: "Verify result", concept: "hash", meaning: "تطابق = نسخة مطابقة تماماً. لو ظهر Mismatch فالنسخة تالفة أو عُبث بها." },
      { src: "verify", line: "Computed hash     9b1c", match: "9b1c4e7a0d3f58216ac4be90172d6f3580ea41c7", label: "SHA1 Computed hash", concept: "hash", meaning: "بصمة ثانية (SHA1) تقوّي التوثيق؛ تُدوَّن القيمتان في التقرير." },
      { src: "verify", line: "Bad Blocks List", match: "No bad blocks found in image", label: "Bad Blocks List", concept: "forensic-image", meaning: "لا توجد قطاعات تالفة تعذّرت قراءتها أثناء النسخ." }
    ],
    table: [
      { see: "Computed hash = Report Hash", means: "النسخة مطابقة للأصل لحظة النسخ." },
      { see: "Verify result: Match", means: "نجح التحقق، والنسخة صالحة لتكون الأساس لكل التحليل." },
      { see: "Mismatch", means: "النسخة تالفة أو تغيّرت؛ لا تُستخدم وأعد النسخ." },
      { see: "لا يوجد Verify أو Report Hash", means: "نسخة غير موثّقة؛ لا يمكن إثبات سلامتها قانونياً." },
      { see: "Case Number / Examiner فارغان", means: "فجوة في سلسلة الحيازة قد تُضعف الدليل." }
    ],
    ioc: [],
    questions: [
      { q: "ما نوع Image التي أنشأتها؟", type: "choice", options: ["E01", "Raw (dd)", "AFF"], answer: "E01", why: "اخترنا E01 لأنها تحفظ بيانات القضية وقيم Hash داخل الملف." },
      { q: "هل أُنشئ Hash للنسخة؟ وهل تحقق؟", type: "choice", options: ["نعم: MD5 وSHA1، والتحقق Match", "نعم لكن التحقق فشل", "لا، لم يُنشأ Hash"], answer: "نعم: MD5 وSHA1، والتحقق Match", why: "Computed hash وReport Hash متطابقان في الاثنين." },
      { extra: true, q: "اكتب أول 8 خانات من قيمة MD5 للنسخة.", type: "value", answer: "5f3a9c1e", why: "MD5 الكاملة: 5f3a9c1e7b2d4806a1c9e0d3f7b84a26؛ تُدوَّن كاملة في التقرير وتُقارَن لاحقاً في EnCase." },
      { extra: true, q: "ماذا نستنتج لو اختلف Computed hash عن Report Hash؟", type: "choice", options: ["النسخة لا تطابق الأصل أو تغيّرت، ولا نعتمد عليها", "لا شيء مهم", "أن النسخة أفضل من الأصل"], answer: "النسخة لا تطابق الأصل أو تغيّرت، ولا نعتمد عليها", why: "الهدف من Hash إثبات التطابق؛ الاختلاف يعني فقدانه." }
    ],
  },
  realWorld: {
    versionNotes: [
      "FTK Imager مجاني من Exterro (AccessData سابقاً)؛ الواجهة قد تختلف قليلاً بين الإصدارات.",
      "في الواقع تُنسخ الأقراص الأصلية عبر مانع كتابة (Write Blocker) كي لا يتغير شيء على الأصل؛ تُشرح الفكرة هنا ولا تُحاكى.",
      "المحاكاة تفعّل مصدر Logical Drive وصيغة E01؛ بقية الخيارات ظاهرة غير مفعّلة."
    ],
    officialSite: null,
    ethics: "لا تنسخ قرص جهاز لا تملك إذناً قانونياً بفحصه، ووثّق كل خطوة وكل من تسلّم الدليل؛ فالإجراء غير الموثّق قد يُسقط الدليل."
  }
};
