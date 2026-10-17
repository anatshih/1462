/* Lesson a1-tcpview — connections half of Lab 2 (TCPView + netstat + tasklist).
   Concepts: docs/concepts.md §16–18. Values/answers: docs/outputs-spec.md §د-2. */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a1-tcpview"] = {
  id: "a1-tcpview", seq: 3, axis: 1, axisTitle: "المحور 1: فحص الجهاز والشبكة المحلية", labs: [2], chapters: [7, 10], minutes: 20,
  title: "TCPView وnetstat: من يتصل بالخارج؟",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "هل يتصل الجهاز بجهة خارجية؟ ومن البرنامج المسؤول؟",
    reached: "وجدنا update.exe يبدأ تلقائياً من مفتاح Run باسم مضلِّل.",
    seeking: "هل يتصل هذا البرنامج بالخارج؟ نفحص اتصالات الشبكة ونربط كل اتصال بالعملية التي فتحته.",
    finding: "برنامج update.exe (PID 6120) له اتصال Established بالعنوان 203.0.113.45 على المنفذ 4444، وتؤكده أداتا TCPView وnetstat."
  },
  summary: [   // «ما يجب أن تتذكره» at the end of the lesson
    "TCPView وnetstat -ano يعرضان كل اتصال شبكي مع العملية التي فتحته ورقمها (PID).",
    "update.exe (PID 6120) له اتصال Established بالعنوان الخارجي 203.0.113.45 على المنفذ 4444، ويستمع (Listen) على المنفذ 4444 أيضاً.",
    "الأمر tasklist /FI \"PID eq 6120\" يحوّل رقم العملية إلى اسم البرنامج؛ وحين تعطي أداتان مختلفتان النتيجة نفسها يقوى الدليل."
  ],
  objectives: [
    "قراءة جدول الاتصالات: العنوان المحلي والبعيد والمنفذ والحالة.",
    "تمييز الاتصال المشبوه (برنامج مجهول ← عنوان خارجي ← منفذ غير قياسي).",
    "ربط الاتصال بالبرنامج برقم العملية (PID) بين TCPView وnetstat وtasklist."
  ],
  explain: {
    intro: "التشبيه الجامع: الحاسوب مصنع، والمنافذ أبواب شحن مرقّمة. ثلاثة مفاهيم قصيرة قبل أن تفتح TCPView.",
    figure: "factory",
    whatNext: "ستشغّل TCPView على جهاز سليم ثم مصاب، وتحدّد اتصال update.exe، وتبحث عنه بحقل Search، ثم تتحقق من النتيجة نفسها بأمر netstat -ano وتربط الرقم 6120 بالبرنامج بـ tasklist.",
    cards: [
      {
        id: "port", ar: "المنفذ والبروتوكول", en: "Port / TCP / UDP",
        analogy: "العمارة لها عنوان واحد (IP) وأبواب مرقّمة (منافذ)، لكل خدمة باب.",
        meaning: "رقم من 0 إلى 65535 يحدد الخدمة على الجهاز. منافذ معروفة: 80 (HTTP)، 443 (HTTPS)، 53 (DNS)، 445 (مشاركة الملفات)، 3389 (سطح المكتب البعيد). TCP اتصال مضمون بتأكيد، UDP إرسال سريع بلا تأكيد.",
        inTool: ["192.168.1.23:49822 → 203.0.113.45:4444", "Protocol: TCP"],
        forInvestigator: "منفذ غير مألوف (مثل 4444) مع برنامج مجهول مؤشر قوي على أداة تحكم عن بعد.",
        fromCase: "update.exe يتصل بالمنفذ 4444، بينما المتصفح على 443.",
        mistake: "الخلط بين المنفذ المحلي (رقم مؤقت عشوائي مثل 49822) والمنفذ البعيد (الخدمة المقصودة).",
        quiz: { q: "في الاتصال بـ 142.250.185.78:443، ما الخدمة المرجّحة؟", type: "choice", options: ["موقع ويب مشفّر (HTTPS)", "مشاركة الملفات", "سطح مكتب بعيد"], answer: "موقع ويب مشفّر (HTTPS)", why: "المنفذ 443 هو منفذ HTTPS." }
      },
      {
        id: "conn-state", ar: "حالات الاتصال", en: "Listen / Established / Time Wait",
        analogy: "Listen = موظف ينتظر عند الباب • Established = مكالمة جارية • Time Wait = المكالمة انتهت وتُغلق.",
        meaning: "حالة كل اتصال TCP.",
        inTool: ["TCPView: State = Listen / Established / Time Wait", "netstat: LISTENING / ESTABLISHED / TIME_WAIT"],
        forInvestigator: "Established إلى عنوان خارجي = اتصال قائم الآن؛ Listen على منفذ غريب = الجهاز ينتظر من يتصل به (باب خلفي محتمل).",
        fromCase: "update.exe … Established إلى 203.0.113.45.",
        mistake: "القلق من كل Listen؛ منافذ 135 و445 خدمات Windows عادية.",
        quiz: { q: "ماذا يعني صف أخضر في TCPView؟", type: "choice", options: ["اتصال جديد ظهر للتو", "اتصال أُغلق", "تغيّرت حالة الاتصال"], answer: "اتصال جديد ظهر للتو", why: "أخضر = جديد، أصفر = تغيّرت حالته، أحمر = أُغلق (ثم يختفي)." }
      },
      {
        id: "local-remote", ar: "العنوان المحلي والبعيد", en: "Local / Remote Address",
        analogy: "في المكالمة: رقمك ورقم من تتحدث معه.",
        meaning: "المحلي = هذا الجهاز ومنفذه؛ البعيد = الطرف الآخر.",
        inTool: ["Local Address / Local Port", "Remote Address / Remote Port"],
        forInvestigator: "العنوان البعيد هو ما يُبحث عنه لاحقاً (من صاحبه؟ هل ظهر في أجهزة أخرى؟).",
        fromCase: "البعيد 203.0.113.45 عام وخارجي.",
        mistake: "قراءة الاتجاه بالعكس.",
        quiz: { q: "في اتصال update.exe، ما العنوان البعيد مع منفذه؟", type: "value", answer: "203.0.113.45:4444", why: "المحلي هو جهاز سامي 192.168.1.23:49822، والبعيد هو الخادم الخارجي." }
      }
    ]
  },
  practice: {
    tool: "tcpview", state: "healthy",
    scenario: "سامي يقول إن الجهاز يعمل وحده ليلاً. افحص اتصالات الشبكة: هل يتصل برنامج مجهول بعنوان خارجي؟ ابدأ بالجهاز السليم ثم بدّل إلى المصاب.",
    launchers: [{ tool: "folder", label: "مجلد Sysinternals", auto: true }, { tool: "cmd", label: "Command Prompt" }],
    folderTools: ["tcpview"],
    states: [{ id: "healthy", label: "جهاز سليم" }, { id: "infected", label: "جهاز مصاب" }],
    freeNote: "افحص الاتصالات بنفسك: جرّب أزرار TCP/UDP وحقل Search والأوامر netstat وtasklist.",
    steps: [
      { id: "s1", title: "شغّل TCPView", instruction: "في نافذة Sysinternals انقر نقراً مزدوجاً على Tcpview64.exe.", why: "TCPView يعرض الاتصالات الحية مع اسم البرنامج صاحب كل اتصال.",
        expect: { type: "event", name: "tool:launch", where: { tool: "tcpview" } }, target: "[data-win=\"folder\"] [data-tool=\"tcpview\"]",
        hints: ["انظر إلى الملفات في النافذة الصغيرة.", "الملف الذي يبدأ اسمه بـ Tcpview.", "انقر نقراً مزدوجاً على Tcpview64.exe."], demo: { kind: "folder-launch", tool: "tcpview" } },
      { id: "s2", title: "بدّل إلى الجهاز المصاب", instruction: "الجهاز الآن سليم: لا اتصال مريب. غيّر «حالة الجهاز» إلى «جهاز مصاب».", why: "لترى كيف يظهر الاتصال المشبوه في الأداة نفسها.",
        expect: { type: "event", name: "sim:state", where: { state: "infected" } }, target: "#stage-bar select",
        hints: ["القائمة المنسدلة فوق نافذة المحاكاة.", "اختر الخيار الثاني.", "اختر «جهاز مصاب»."], demo: { kind: "state", value: "infected" } },
      { id: "s3", title: "حدّد اتصال update.exe", instruction: "ابحث عن الصف الذي حالته Established إلى عنوان خارجي على منفذ غير قياسي، واضغط عليه.", why: "برنامج مجهول + عنوان عام + منفذ 4444 = مؤشر خطر (المتصفح يستخدم 443).",
        expect: { type: "event", name: "tcpview:select", where: { process: "update.exe" } }, target: "[data-win=\"tcpview\"] tr[data-key=\"update-49822\"]",
        hints: ["انظر إلى عمودي Remote Address وRemote Port.", "البرنامج الذي لا تعرفه واسمه ينتهي بـ .exe ويتصل بالمنفذ 4444.", "اضغط صف update.exe."], demo: { kind: "ui", tool: "tcpview", action: "select", arg: "update-49822" } },
      { id: "s4", title: "ابحث عنه بحقل Search", instruction: "اكتب update في حقل Search أعلى النافذة.", why: "عندما تكثر الاتصالات يساعدك البحث على عزل البرنامج الذي تشك فيه.",
        expect: { type: "event", name: "tcpview:search", where: { hasUpdate: true } }, target: "[data-win=\"tcpview\"] input[aria-label=\"Search\"]",
        hints: ["الحقل في صف الأزرار فوق الجدول.", "اكتب اسم البرنامج أو جزءاً منه.", "اكتب: update"], demo: { kind: "ui", tool: "tcpview", action: "setSearch", arg: "update" } },
      { id: "s5", title: "تحقق بـ netstat -ano", instruction: "افتح «Command Prompt» من شريط التطبيقات، واكتب netstat -ano.", why: "الأمر نفسه بلا واجهة رسومية؛ العمود الأخير PID يربط الاتصال بالبرنامج.",
        expect: { type: "command", tool: "cmd", match: "^netstat -ano$", state: "infected" }, solution: "netstat -ano", target: "[data-launch=\"cmd\"]",
        hints: ["الزر في شريط التطبيقات فوق نافذة المحاكاة.", "الأمر يعرض الاتصالات (network statistics) مع الخيارات a وn وo.", "اكتب: netstat -ano"], demo: [{ kind: "launch", tool: "cmd" }, { kind: "command", tool: "cmd", text: "netstat -ano" }] },
      { id: "s6", title: "اعرف البرنامج من رقم PID", instruction: "اكتب: tasklist /FI \"PID eq 6120\" لمعرفة البرنامج صاحب الرقم 6120.", why: "المحقق لا يكتفي بالرقم؛ يربطه باسم البرنامج (اختياري في المختبر لكنه يثبت الرابط).",
        expect: { type: "command", tool: "cmd", match: "^tasklist /FI \"PID eq 6120\"$", state: "infected" }, solution: "tasklist /FI \"PID eq 6120\"",
        hints: ["أمر قائمة المهام اسمه tasklist.", "الفلتر /FI بصيغة: \"PID eq الرقم\".", "اكتب: tasklist /FI \"PID eq 6120\""], demo: { kind: "command", tool: "cmd", text: "tasklist /FI \"PID eq 6120\"" } }
    ]
  },
  interpret: {
    coreHighlights: ["update.exe","Remote Address","Remote Port 4444","PID 6120"],   // essential values (labels) counted by the discovery counter
    sources: [
      { id: "tv", kind: "table", tool: "tcpview", title: "TCPView — جهاز مصاب", heading: "TCPView — TCP v4 + UDP v4", state: "infected" },
      { id: "netstat", title: "netstat -ano", tool: "cmd", cmd: "netstat -ano", state: "infected" },
      { id: "tasklist", title: "tasklist", tool: "cmd", cmd: "tasklist /FI \"PID eq 6120\"", state: "infected" }
    ],
    highlights: [
      { src: "tv", row: "update-49822", col: "Process Name", label: "update.exe", danger: true, concept: "port", meaning: "برنامج مجهول له اتصال قائم بعنوان خارجي على منفذ غير قياسي. اسمه يقلّد تحديثاً لكنه ليس من Microsoft." },
      { src: "tv", row: "update-49822", col: "Process ID", label: "Process ID", concept: "local-remote", meaning: "يربط الاتصال بالعملية؛ سنجد الرقم 6120 نفسه في netstat -ano وProcmon وRAMMap." },
      { src: "tv", row: "update-49822", col: "State", label: "Established", danger: true, concept: "conn-state", meaning: "اتصال قائم الآن (أخضر = جديد ظهر للتو) إلى عنوان خارجي." },
      { src: "tv", row: "update-49822", col: "Remote Address", label: "Remote Address", danger: true, concept: "local-remote", meaning: "عنوان عام وخارجي (203.0.113.45): الطرف الآخر الذي يُبحث عن صاحبه." },
      { src: "tv", row: "update-49822", col: "Remote Port", label: "Remote Port 4444", danger: true, concept: "port", meaning: "منفذ شائع في أدوات التحكم عن بعد. مواقع الويب تستخدم 443/80." },
      { src: "tv", row: "update-49822", col: "Local Port", label: "Local Port", concept: "port", meaning: "رقم مؤقت عشوائي يختاره الجهاز؛ المهم هو المنفذ البعيد (الخدمة المقصودة)." },
      { src: "tv", row: "update-4444", col: "State", label: "Listen على 4444", danger: true, concept: "conn-state", meaning: "update.exe لا يتصل بالخارج فقط، بل ينتظر اتصالاً على المنفذ 4444 أيضاً: باب خلفي محتمل (Listen على منفذ غريب). سيراه nmap على 192.168.1.23 في المحور 4." },
      { src: "tv", row: "system-445", col: "State", label: "Listen", concept: "conn-state", meaning: "خدمة Windows عادية (مشاركة الملفات) تنتظر؛ كذلك 135 (RPC)." },
      { src: "tv", row: "chrome-51540", col: "State", label: "Time Wait (صف أحمر)", concept: "conn-state", meaning: "الأحمر = اتصال أُغلق، ويختفي بعد لحظة." },
      { src: "netstat", line: "203.0.113.45:4444", match: "203.0.113.45:4444", label: "Foreign Address", danger: true, concept: "local-remote", meaning: "نفس المعلومة بلا واجهة رسومية: اتصال ESTABLISHED بالعنوان الخارجي والمنفذ 4444." },
      { src: "netstat", line: "203.0.113.45:4444", match: "6120", label: "PID", concept: "process-pid", meaning: "PID 6120 يربط الاتصال بالبرنامج update.exe (tasklist ← الاسم)." },
      { src: "netstat", line: "0.0.0.0:445", match: "LISTENING", label: "LISTENING", concept: "conn-state", meaning: "خدمة تنتظر اتصالات (445 و135 خدمات Windows عادية)." },
      { src: "tasklist", line: "update.exe", match: "6120", label: "PID 6120", danger: true, concept: "process-pid", meaning: "PID 6120 = update.exe: الرقم نفسه في netstat وTCPView." }
    ],
    table: [
      { see: "update.exe → 203.0.113.45:4444 Established", means: "مؤشر خطر: برنامج مجهول له اتصال قائم بعنوان خارجي على منفذ غير قياسي (4444 شائع في أدوات التحكم عن بعد)؛ مواقع الويب تستخدم 443/80." },
      { see: "Process ID 6120", means: "يربط الاتصال بالعملية؛ الرقم نفسه في netstat -ano وProcmon." },
      { see: "Listen على 445 و135", means: "خدمات Windows عادية (مشاركة الملفات وRPC)." },
      { see: "update.exe Listen على 4444", means: "برنامج مجهول ينتظر اتصالات على منفذ غير قياسي: باب خلفي محتمل؛ سيظهر مفتوحاً في فحص nmap." },
      { see: "أخضر / أصفر / أحمر", means: "أخضر = اتصال جديد ظهر للتو • أصفر = تغيّرت حالته • أحمر = أُغلق." }
    ],
    ioc: ["اتصال قائم بعنوان خارجي على منفذ غير قياسي (203.0.113.45:4444).", "المنفذ 4444 في حالة Listen على الجهاز نفسه (العملية update.exe).", "برنامج بلا ناشر موثّق يتصل بالخارج (update.exe، PID 6120)."],
    questions: [
      { q: "هل يوجد اتصال غير معروف؟ اختر الوصف الصحيح.", type: "choice", options: ["نعم: update.exe (PID 6120) ← 203.0.113.45:4444 الحالة Established", "لا: كل الاتصالات إلى المنفذ 443", "نعم: svchost.exe على المنفذ 445"], answer: "نعم: update.exe (PID 6120) ← 203.0.113.45:4444 الحالة Established", why: "445 و135 خدمات Windows عادية، أما update.exe فمجهول ويتصل بعنوان عام على منفذ غير قياسي." },
      { q: "ما رقم PID للاتصال المشبوه؟ (اكتب رقماً)", type: "value", answer: "6120", why: "ظهر في TCPView وnetstat وtasklist." },
      { extra: true, q: "ما المنفذ البعيد في اتصال update.exe؟ (اكتب رقماً)", type: "value", answer: "4444", why: "المنفذ المحلي 49822 مؤقت وعشوائي؛ المنفذ البعيد هو الخدمة المقصودة." },
      { extra: true, q: "ما الذي يميّز اتصال update.exe عن اتصال المتصفح؟", type: "choice", options: ["برنامج مجهول إلى عنوان خارجي على منفذ غير قياسي بدل 443", "أن المتصفح لا يستخدم TCP", "لا فرق بينهما"], answer: "برنامج مجهول إلى عنوان خارجي على منفذ غير قياسي بدل 443", why: "المتصفح يتصل بمنفذ 443 (HTTPS) وهو معروف؛ المنفذ 4444 غير مألوف للمواقع." }
    ],
  },
  realWorld: {
    versionNotes: [
      "تعرض TCPView نسخة 4 أزرار TCP v4 وTCP v6 وUDP v4 وUDP v6 وحقل Search؛ النسخ القديمة بواجهة مختلفة.",
      "netstat وtasklist أمران مدمجان في Windows؛ الخيار -o في netstat هو الذي يضيف عمود PID.",
      "المحاكاة تعرض أول 8 أعمدة بقيمها، وتترك أعمدة Create Time والحزم والبايتات فارغة لأن قيمها غير مدرجة في القضية."
    ],
    officialSite: "https://learn.microsoft.com/en-us/sysinternals/downloads/tcpview",
    ethics: "لا تقطع اتصالاً (Close Connections) على جهاز تحقق فيه قبل توثيقه: قطعه يغيّر الدليل. وافحص أجهزتك أو أجهزة مؤسسة أذنت لك بفحصها فقط."
  }
};
