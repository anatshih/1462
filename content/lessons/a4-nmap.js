/* Lesson a4-nmap — Lab 11 (nmap from Kali). Concepts: docs/concepts.md §54–56 (+ md5sum consistency with FTK).
   Values: docs/outputs-spec.md §ك. Two approved steps: 127.0.0.1 first, then 192.168.1.23. */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a4-nmap"] = {
  id: "a4-nmap", seq: 12, axis: 4, axisTitle: "المحور 4: تحليل الشبكة والأنشطة والملفات", labs: [11], chapters: [7], minutes: 20,
  title: "nmap: فحص المنافذ بتفويض",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "ما المنافذ المفتوحة على جهاز سامي؟",
    reached: "الحزم تؤكد اتصال الجهاز بالخادم المشبوه بعد سؤال عن اسم نطاق.",
    seeking: "نفحص جهاز سامي من جهاز المحقق (بتفويض) لنعرف ما يستمع عليه من منافذ، ونطابقها مع ما رأيناه في TCPView.",
    finding: "nmap على 192.168.1.23 يُظهر 3 منافذ مفتوحة (135 و445 و4444)؛ المنفذ 4444 غير قياسي وتملكه العملية update.exe (PID 6120) حسب TCPView."
  },
  objectives: [
    "فهم أن nmap 127.0.0.1 يفحص الجهاز الذي تكتب عليه، وبماذا يختلف عن فحص جهاز الضحية.",
    "قراءة حالات المنافذ (open / closed / filtered) وعدّ المنافذ المفتوحة.",
    "تمييز منفذ غير قياسي مفتوح (4444) وعدم الثقة باسم الخدمة المخمَّن."
  ],
  explain: {
    intro: "التشبيه الجامع: المرور على أبواب العمارة وتجربة كل باب. وتجربة أبواب بيوت الآخرين بلا إذن جريمة حتى لو لم تدخل؛ لذلك لا يعمل الفحص في هذا الدرس قبل أن تؤكد التفويض.",
    figure: null,
    whatNext: "ستفتح Kali، وتؤكد التفويض الكتابي، وتفحص 127.0.0.1 لتفهم الأداة، ثم 192.168.1.23 (جهاز سامي) لترى منافذه ومنها 4444، وتتحقق من Hash النسخة بـ md5sum.",
    cards: [
      {
        id: "port-scan", ar: "فحص المنافذ وحالاتها", en: "Port Scan: open / closed / filtered",
        analogy: "المرور على أبواب العمارة وتجربة كل باب: مفتوح، مغلق، أو حارس لا يجيب.",
        meaning: "nmap يرسل محاولات اتصال إلى منافذ الجهاز ويصنّفها: open خدمة تستقبل • closed لا خدمة • filtered جدار ناري يحجب.",
        inTool: ["PORT     STATE SERVICE", "445/tcp   open  microsoft-ds"],
        forInvestigator: "يكشف الخدمات المكشوفة على جهاز، ومنفذاً غريباً مفتوحاً (باب خلفي).",
        fromCase: "127.0.0.1 ← جهاز Kali نفسه؛ ثم 192.168.1.23 ← يظهر 4444 بين المنافذ.",
        mistake: "الظن أن nmap 127.0.0.1 يفحص جهازاً آخر.",
        quiz: { q: "على أي جهاز يعمل الفحص nmap 127.0.0.1؟", type: "choice", options: ["الجهاز الذي تكتب عليه", "جهاز الضحية", "الراوتر"], answer: "الجهاز الذي تكتب عليه", why: "127.0.0.1 هو loopback: الجهاز نفسه." }
      },
      {
        id: "well-known", ar: "الخدمات المعروفة", en: "Well-known Ports",
        analogy: "في كل عمارة: الباب 80 للزوار، 443 للزوار بهوية، 22 للصيانة.",
        meaning: "22 SSH • 53 DNS • 80 HTTP • 135 RPC • 443 HTTPS • 445 SMB • 3389 RDP.",
        inTool: ["عمود SERVICE"],
        forInvestigator: "الخدمة المتوقعة تُستبعد بسرعة، والغريبة تُفحص.",
        fromCase: "445 عادي في Windows؛ 4444 غير قياسي.",
        mistake: "الثقة باسم الخدمة الذي يخمنه nmap من رقم المنفذ.",
        quiz: { q: "أي منفذ يستخدمه سطح المكتب البعيد؟ (اكتب رقماً)", type: "value", answer: "3389", why: "3389 هو منفذ RDP." }
      },
      {
        id: "legal", ar: "الاستخدام القانوني والأخلاقي", en: "Legal & Ethical Use",
        analogy: "تجربة أبواب بيوت الآخرين جريمة حتى لو لم تدخل.",
        meaning: "فحص أجهزة أو شبكات بلا إذن مكتوب قد يكون مخالفة قانونية.",
        inTool: ["—  (خانة «لديّ تفويض» في شريط التطبيقات)"],
        forInvestigator: "يعمل بتفويض قانوني ونطاق محدد، ويوثّق ذلك.",
        fromCase: "الفحص هنا على جهاز ضمن قضية مصرّح بها.",
        mistake: "«التجربة» على شبكة الجامعة أو الجيران.",
        quiz: { q: "متى يجوز لك فحص جهاز بـ nmap؟", type: "choice", options: ["جهازك، أو بإذن صريح من المالك/الجهة المختصة", "إذا كان الجهاز قريباً منك", "إذا كنت فضولياً فقط"], answer: "جهازك، أو بإذن صريح من المالك/الجهة المختصة", why: "الإذن المكتوب وتحديد النطاق شرط قانوني وأخلاقي." }
      }
    ]
  },
  practice: {
    tool: "kali", state: "infected", authorization: true,
    scenario: "بعد أن رأيت الاتصال بالمنفذ 4444 من الجهاز، افحص المنافذ المفتوحة على جهاز سامي من جهاز المحقق (Kali، 192.168.1.40). ابدأ بتأكيد التفويض.",
    launchers: [{ tool: "kali", label: "Kali Terminal" }],
    freeNote: "جرّب الأوامر دون تلميحات: nmap على الجهازين، وmd5sum، وجرّب nmap قبل تأكيد التفويض لترى الرفض.",
    steps: [
      { id: "s1", title: "افتح Kali", instruction: "اضغط زر «Kali Terminal» في شريط التطبيقات.", why: "جهاز المحقق الذي سيجري الفحص.",
        expect: { type: "event", name: "tool:launch", where: { tool: "kali" } }, target: "[data-launch=\"kali\"]", hints: ["الزر فوق نافذة المحاكاة.", "اسمه Kali Terminal.", "اضغط الزر."], demo: { kind: "launch", tool: "kali" } },
      { id: "s2", title: "أكّد التفويض", instruction: "فعّل خانة «لديّ تفويض كتابي بفحص أجهزة هذه القضية» في شريط التطبيقات.", why: "لا يُفحص جهاز بلا إذن مكتوب بنطاق الفحص.",
        expect: { type: "event", name: "sim:authorized", where: { value: true } }, target: "#auth-cb", hints: ["الخانة بجانب قائمة الحالات في الشريط.", "تحمل عبارة التفويض الكتابي.", "اضغط الخانة لتفعيلها."], demo: { kind: "auth" } },
      { id: "s3", title: "افحص 127.0.0.1", instruction: "في Kali اكتب: nmap 127.0.0.1 ثم عدّ المنافذ المفتوحة.", why: "هذا يفحص جهاز Kali نفسه (loopback): لفهم شكل الناتج قبل فحص جهاز الضحية.",
        expect: { type: "command", tool: "kali", match: "^nmap 127\\.0\\.0\\.1$" }, solution: "nmap 127.0.0.1", target: "[data-win=\"kali\"] .term-input", onMismatch: "المطلوب الآن: nmap 127.0.0.1 (إن ظهر رفض فتأكد من تفعيل التفويض).",
        hints: ["الأمر nmap ثم الهدف.", "الهدف عنوان الجهاز نفسه.", "nmap 127.0.0.1"], demo: { kind: "command", tool: "kali", text: "nmap 127.0.0.1" } },
      { id: "s4", title: "افحص جهاز سامي", instruction: "اكتب: nmap 192.168.1.23 ثم لاحظ المنافذ المفتوحة، وخاصة غير القياسي منها.", why: "هذا جهاز الضحية: يُظهر الخدمات المكشوفة ومنها المنفذ 4444.",
        expect: { type: "command", tool: "kali", match: "^nmap 192\\.168\\.1\\.23$" }, solution: "nmap 192.168.1.23", target: "[data-win=\"kali\"] .term-input",
        hints: ["الهدف جهاز سامي.", "عنوانه من ipconfig.", "nmap 192.168.1.23"], demo: { kind: "command", tool: "kali", text: "nmap 192.168.1.23" } },
      { id: "s5", title: "تحقق من Hash النسخة", instruction: "اكتب: md5sum ACC-PC07_C.E01 وقارن القيمة بما ظهر في FTK Imager وEnCase.", why: "الاتساق بين الأدوات: القيمة نفسها تثبت أن النسخة لم تتغير.",
        expect: { type: "command", tool: "kali", match: "^md5sum ACC-PC07_C\\.E01$" }, solution: "md5sum ACC-PC07_C.E01", target: "[data-win=\"kali\"] .term-input",
        hints: ["أمر حساب MD5 في Linux.", "ثم اسم ملف النسخة.", "md5sum ACC-PC07_C.E01"], demo: { kind: "command", tool: "kali", text: "md5sum ACC-PC07_C.E01" } }
    ]
  },
  interpret: {
    sources: [
      { id: "local", tool: "kali", cmd: "nmap 127.0.0.1", title: "nmap 127.0.0.1" },
      { id: "victim", tool: "kali", cmd: "nmap 192.168.1.23", title: "nmap 192.168.1.23" },
      { id: "md5", tool: "kali", cmd: "md5sum ACC-PC07_C.E01", title: "md5sum" }
    ],
    highlights: [
      { src: "local", line: "Nmap scan report", match: "localhost (127.0.0.1)", label: "الهدف 127.0.0.1", concept: "port-scan", meaning: "الجهاز الذي تكتب عليه (Kali) لا جهاز الضحية." },
      { src: "local", line: "Not shown", match: "999 closed tcp ports (reset)", label: "منافذ مغلقة", concept: "port-scan", meaning: "999 منفذاً مغلقاً (closed): لا خدمة عليها؛ الجهاز يرد برفض." },
      { src: "local", line: "22/tcp", match: "22/tcp open  ssh", label: "22/tcp open", concept: "well-known", meaning: "منفذ واحد مفتوح على Kali: SSH. إجابة «كم منفذاً مفتوحاً» لهذه الخطوة = 1." },
      { src: "victim", line: "Not shown", match: "997 filtered tcp ports (no-response)", label: "منافذ filtered", concept: "port-scan", meaning: "جدار ناري يحجب: لا رد أصلاً. تختلف عن closed التي يردّ فيها الجهاز بالرفض." },
      { src: "victim", line: "135/tcp", match: "135/tcp  open  msrpc", label: "135/tcp", concept: "well-known", meaning: "خدمة Windows عادية (RPC)؛ نفسها Listen في TCPView." },
      { src: "victim", line: "445/tcp", match: "445/tcp  open  microsoft-ds", label: "445/tcp", concept: "well-known", meaning: "مشاركة الملفات (SMB): عادية في Windows." },
      { src: "victim", line: "4444/tcp", match: "4444/tcp open  krb524", label: "4444/tcp", danger: true, concept: "well-known", meaning: "منفذ غير قياسي مفتوح: باب خلفي محتمل. الاسم krb524 تخمين nmap من الرقم فقط؛ الخدمة الحقيقية هي update.exe (PID 6120) كما رأينا في TCPView (Listen على 4444)." },
      { src: "victim", line: "MAC Address", match: "3C:52:82:4A:91:0C", label: "MAC Address", concept: "port-scan", meaning: "العنوان الفيزيائي نفسه في ipconfig /all (3C-52-82-4A-91-0C): تأكيد أن الجهاز المفحوص هو جهاز سامي." },
      { src: "md5", line: "5f3a", match: "5f3a9c1e7b2d4806a1c9e0d3f7b84a26", label: "MD5 النسخة", concept: "port-scan", meaning: "القيمة نفسها التي ظهرت في FTK Imager وEnCase: اتساق الدليل بين الأدوات." }
    ],
    table: [
      { see: "PORT STATE open", means: "خدمة تستقبل اتصالات على هذا المنفذ." },
      { see: "STATE closed", means: "لا خدمة؛ الجهاز يرد برفض." },
      { see: "STATE filtered / no-response", means: "جدار ناري يحجب فلا يظهر ردّ." },
      { see: "منفذ غير قياسي مفتوح (4444)", means: "باب خلفي محتمل؛ قارنه بـ TCPView وnetstat لتعرف أي برنامج يستمع عليه." },
      { see: "اسم الخدمة بجانب المنفذ", means: "تخمين من رقم المنفذ؛ لا تثق به دون تحقق." }
    ],
    ioc: ["منفذ 4444 مفتوح (Listen) على جهاز سامي، تملكه العملية update.exe."],
    questions: [
      { q: "كم منفذاً مفتوحاً يُظهره nmap 127.0.0.1؟ (اكتب رقماً)", type: "value", answer: "1", why: "SSH على 22. تذكّر أنه فحص لجهاز Kali نفسه." },
      { q: "كم منفذاً مفتوحاً يُظهره nmap 192.168.1.23؟ (اكتب رقماً)", type: "value", answer: "3", why: "135 و445 و4444." },
      { extra: true, q: "ما المنفذ غير القياسي المفتوح على جهاز سامي؟ (اكتب رقماً)", type: "value", answer: "4444", why: "نفس المنفذ في TCPView (Listen وEstablished) وWireshark وnetstat." },
      { extra: true, q: "على أي جهاز يعمل الفحص nmap 127.0.0.1؟", type: "choice", options: ["الجهاز الذي تكتب عليه", "جهاز الضحية", "الراوتر"], answer: "الجهاز الذي تكتب عليه", why: "لذلك احتجنا خطوة ثانية لفحص جهاز سامي." },
      { extra: true, q: "لماذا لا نثق باسم الخدمة krb524 بجانب 4444؟", type: "choice", options: ["nmap يخمّن الاسم من رقم المنفذ فقط، والخدمة الحقيقية update.exe", "لأن nmap لا يعمل جيداً", "لأن 4444 منفذ معروف لـ Kerberos"], answer: "nmap يخمّن الاسم من رقم المنفذ فقط، والخدمة الحقيقية update.exe", why: "الاسم من جدول أرقام المنافذ؛ لا يثبت أي برنامج يستمع فعلاً." }
    ],
  },
  realWorld: {
    versionNotes: [
      "nmap مجاني من nmap.org ويأتي مثبتاً في Kali؛ النسخ الحديثة تضيف رقم الإصدار والتاريخ وسطر Host is up.",
      "الفحص الافتراضي يغطي أشهر 1000 منفذ TCP؛ لذلك Not shown تجمع الباقي (997 filtered أو 999 closed).",
      "المحاكاة تدعم صيغة nmap <ip> فقط؛ خيارات مثل -sV و-p غير مفعّلة."
    ],
    officialSite: "https://nmap.org/",
    ethics: "لا تفحص بـ nmap إلا جهازك أو شبكة تملك إذناً كتابياً بفحصها. الفحص بلا إذن قد يُعدّ جريمة حتى لو لم تدخل الجهاز، وشبكة الجامعة والجيران ليست ميدان تجربة."
  }
};
