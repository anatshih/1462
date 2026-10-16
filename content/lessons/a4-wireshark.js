/* Lesson a4-wireshark — Lab 8 (Wireshark). Concepts: docs/concepts.md §50–53. Values: docs/outputs-spec.md §ك (decided by the lead developer). */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a4-wireshark"] = {
  id: "a4-wireshark", seq: 11, axis: 4, axisTitle: "المحور 4: تحليل الشبكة والأنشطة والملفات", labs: [8], chapters: [3, 7], minutes: 35,
  title: "Wireshark: التقاط الحزم وتحليلها",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "ماذا تُظهر حركة الشبكة نفسها؟",
    reached: "رأينا من داخل الجهاز اتصالاً بالعنوان 203.0.113.45 على المنفذ 4444.",
    seeking: "نلتقط الحزم على شبكة الجهاز لنرى الاتصال من الخارج: بأي اسم سأل الجهاز عن الخادم، وكيف وصل إليه.",
    finding: "الالتقاط على Wi-Fi يُظهر 14 طلب DNS منها 3 إلى update-sync.example، والرد 203.0.113.45 تلاه اتصال TCP من 192.168.1.23:49822 إلى المنفذ 4444."
  },
  objectives: [
    "التقاط حركة واجهة Wi-Fi وإيقافها وقراءة قائمة الحزم.",
    "كتابة فلاتر العرض (dns، dns.flags.response == 0، ip.addr، tcp.port) وعدّ النتائج بدقة.",
    "فتح طبقات الحزمة وربط DNS بالاتصال المشبوه في TCPView."
  ],
  explain: {
    intro: "التشبيه الجامع: الشبكة طريق، والحزم رسائل بريدية في مغلفات داخل مغلفات، وWireshark موظف فرز يفتح نسخة من كل مغلف ويقرأ عنوانه. افتح البطاقات بأي ترتيب.",
    figure: "envelopes",
    whatNext: "ستلتقط حركة Wi-Fi لجهاز سامي، وتوقف الالتقاط بعد اكتمال الحزم، ثم تفلتر dns وتعدّ الطلبات وحدها، وتفتح طبقات طلب update-sync.example، وتتبع الاتصال بـ 203.0.113.45 على المنفذ 4444.",
    cards: [
      {
        id: "packet", ar: "الحزمة وطبقاتها", en: "Packet / Layers",
        analogy: "رسالة داخل مغلف داخل صندوق شحن: كل طبقة عليها عنوان مختلف.",
        meaning: "كل حزمة طبقات: Ethernet (عناوين MAC) ← IP (عناوين IP) ← TCP/UDP (المنافذ) ← التطبيق (DNS، HTTP…).",
        inTool: ["Ethernet II  ←  Internet Protocol Version 4  ←  User Datagram Protocol  ←  Domain Name System"],
        forInvestigator: "يربط كل المفاهيم السابقة (MAC، IP، المنفذ، DNS) في حزمة واحدة.",
        fromCase: "حزمة DNS من 192.168.1.23 إلى 192.168.1.1 تسأل عن update-sync.example.",
        mistake: "قراءة سطر الملخص فقط دون فتح الطبقات.",
        quiz: { q: "في أي طبقة تجد رقم المنفذ؟", type: "choice", options: ["TCP/UDP", "Ethernet", "IP"], answer: "TCP/UDP", why: "Ethernet للعناوين الفيزيائية، IP لعناوين الأجهزة، والمنافذ في طبقة النقل TCP/UDP." }
      },
      {
        id: "capture", ar: "الالتقاط والواجهة", en: "Capture / Interface",
        analogy: "اختيار أي طريق تراقب.",
        meaning: "يختار الطالب الواجهة (Wi-Fi) ويبدأ الالتقاط؛ الرسم الصغير بجانبها يدل على وجود حركة.",
        inTool: ["شاشة الترحيب  ←  النقر المزدوج على Wi-Fi  ←  زر الإيقاف (■)"],
        forInvestigator: "الالتقاط يرى ما يمر في تلك الواجهة فقط؛ وحفظ الملف (.pcapng) يحفظ الدليل.",
        fromCase: "الالتقاط على Wi-Fi لأن جهاز سامي لاسلكي (من ipconfig).",
        mistake: "الالتقاط على واجهة لا حركة فيها.",
        quiz: { q: "كيف تعرف الواجهة النشطة قبل البدء؟", type: "choice", options: ["من الرسم البياني الصغير بجانبها", "من اسمها فقط", "من لون النافذة"], answer: "من الرسم البياني الصغير بجانبها", why: "الخط المتعرّج يدل على حركة؛ الخط المسطح يعني لا حركة." }
      },
      {
        id: "display-filter", ar: "فلتر العرض", en: "Display Filter",
        analogy: "نظارة تُظهر نوع رسائل واحداً من الكومة.",
        meaning: "تعبير يخفي ما لا يطابقه دون حذفه: dns، ip.addr == 203.0.113.45، tcp.port == 4444. الشريط أخضر إن كان صحيحاً وأحمر إن كان خاطئاً.",
        inTool: ["شريط الفلتر", "Packets: 43 · Displayed: 28 (65.1%)"],
        forInvestigator: "يحوّل آلاف الحزم إلى ما يخص السؤال.",
        fromCase: "dns ← طلبات وردود؛ dns.flags.response == 0 ← الطلبات فقط.",
        mistake: "عدّ الطلبات والردود معاً عند السؤال عن «عدد الطلبات».",
        quiz: { q: "الشريط صار أحمر؛ ماذا يعني؟", type: "choice", options: ["الفلتر مكتوب خطأ", "الفلتر ممتاز", "لا توجد حزم"], answer: "الفلتر مكتوب خطأ", why: "الأخضر = صحيح، الأحمر = خاطئ أو ناقص." }
      },
      {
        id: "dns", ar: "طلب DNS ورده", en: "DNS Query / Response",
        analogy: "سؤال لدليل الهاتف وجوابه.",
        meaning: "Standard query سؤال عن اسم، وStandard query response الجواب بالعنوان.",
        inTool: ["Standard query 0x91c2 A update-sync.example", "Standard query response 0x91c2 A update-sync.example A 203.0.113.45"],
        forInvestigator: "يكشف الأسماء التي تواصل معها الجهاز، وعنوانها الحالي.",
        fromCase: "الرد يعطي 203.0.113.45 = العنوان نفسه في TCPView.",
        mistake: "تجاهل DNS لأنه «ليس بيانات حقيقية».",
        quiz: { q: "كيف تربط اسماً مشبوهاً بعنوان IP رأيته في TCPView؟", type: "choice", options: ["من رد DNS", "من لون الحزمة", "من رقم الحزمة"], answer: "من رد DNS", why: "الرد يعطي العنوان الذي ترجم إليه الاسم." }
      }
    ]
  },
  practice: {
    tool: "wireshark", state: "healthy",
    scenario: "جهاز سامي يتصل بالخارج ليلاً. التقط حركة شبكته اللاسلكية وأجب: كم طلب DNS صدر؟ وأي اسم يشير إلى الخادم المشبوه؟ وكيف يظهر الاتصال به؟",
    launchers: [{ tool: "wireshark", label: "Wireshark" }],
    freeNote: "جرّب فلاتر أخرى: arp، tcp، ip.src == 192.168.1.23، dns.qry.name contains \"example\"، وفلتراً خاطئاً لترى الشريط الأحمر.",
    steps: [
      { id: "s1", title: "افتح Wireshark", instruction: "اضغط زر «Wireshark» في شريط التطبيقات.", why: "Wireshark يلتقط الحزم ويعرضها.",
        expect: { type: "event", name: "tool:launch", where: { tool: "wireshark" } }, target: "[data-launch=\"wireshark\"]", hints: ["الزر فوق نافذة المحاكاة.", "اسمه اسم البرنامج.", "اضغط «Wireshark»."], demo: { kind: "launch", tool: "wireshark" } },
      { id: "s2", title: "اختر واجهة Wi-Fi", instruction: "في شاشة الترحيب انقر نقراً مزدوجاً على Wi-Fi (الواجهة التي فيها رسم متعرّج).", why: "جهاز سامي لاسلكي، والرسم المتعرّج يدل على حركة.",
        expect: { type: "event", name: "wireshark:interface", where: { name: "Wi-Fi" } }, target: "[data-win=\"wireshark\"] [data-iface=\"Wi-Fi\"]", onMismatch: "هذه الواجهة بلا حركة؛ اختر Wi-Fi.",
        hints: ["قائمة الواجهات تحت عنوان Capture.", "الواجهة الأولى فيها رسم متعرّج.", "انقر نقراً مزدوجاً على Wi-Fi."], demo: { kind: "ui", tool: "wireshark", action: "step", arg: "s2" } },
      { id: "s3", title: "أوقف الالتقاط", instruction: "راقب العداد في شريط الحالة حتى يتوقف عن الزيادة (Packets: 43)، ثم اضغط زر الإيقاف (■).", why: "لإيقاف الالتقاط بعد اكتمال الحركة؛ الإيقاف المبكر يعطي نتائج ناقصة.",
        expect: { type: "event", name: "wireshark:stop", where: { complete: true } }, target: "[data-win=\"wireshark\"] button[title=\"Stop capturing packets\"]", onMismatch: "أوقفت الالتقاط مبكراً؛ أعد فتح الملف من File ▸ Open لتحصل على الالتقاط الكامل ثم تابع.",
        hints: ["العداد في وسط شريط الحالة.", "ينتظر حتى يستقر الرقم.", "اضغط ■ حين يصبح Packets: 43."], demo: { kind: "ui", tool: "wireshark", action: "step", arg: "s3" } },
      { id: "s4", title: "فلتر dns", instruction: "اكتب dns في شريط الفلتر واضغط Enter (أو →). لاحظ أن الشريط يصبح أخضر.", why: "يخفي كل ما ليس DNS دون حذفه؛ سطر الحالة يعرض Displayed.",
        expect: { type: "event", name: "wireshark:filter-apply", where: { text: "dns", valid: true } }, target: "[data-win=\"wireshark\"] [data-ws=\"filter\"]",
        hints: ["الحقل تحت شريط الأزرار.", "اسم البروتوكول بأحرف صغيرة.", "اكتب: dns"], demo: { kind: "ui", tool: "wireshark", action: "step", arg: "s4" } },
      { id: "s5", title: "عدّ الطلبات وحدها", instruction: "اكتب dns.flags.response == 0 واضغط Enter، ثم اقرأ Displayed في الشريط السفلي.", why: "فلتر dns يعرض الطلبات والردود معاً؛ السؤال عن عدد الطلبات يحتاج الطلبات فقط.",
        expect: { type: "event", name: "wireshark:filter-apply", where: { text: "dns.flags.response==0", valid: true } }, target: "[data-win=\"wireshark\"] [data-ws=\"filter\"]", onMismatch: "الفلتر المطلوب: dns.flags.response == 0",
        hints: ["الحقل الذي يميّز الطلب من الرد هو response.", "response يساوي صفراً في الطلبات.", "dns.flags.response == 0"], demo: { kind: "ui", tool: "wireshark", action: "step", arg: "s5" } },
      { id: "s6", title: "افتح طبقة DNS", instruction: "اضغط على طلب يخص update-sync.example، ثم اضغط سطر Domain Name System في تفاصيل الحزمة لتفتحه.", why: "الطبقة تعرض الاسم المسؤول عنه ونوع السجل.",
        expect: { type: "event", name: "wireshark:detail", where: { layer: "Domain Name System", open: true } }, target: "[data-win=\"wireshark\"] tr.gr-row", onMismatch: "افتح (توسيع) سطر Domain Name System من تفاصيل الحزمة.",
        hints: ["الجزء الأوسط من النافذة يعرض طبقات الحزمة.", "السطر الأخير هو طبقة التطبيق.", "اضغط Domain Name System (query)."], demo: { kind: "ui", tool: "wireshark", action: "step", arg: "s6" } },
      { id: "s7", title: "تتبّع العنوان المشبوه", instruction: "اكتب ip.addr == 203.0.113.45 واضغط Enter.", why: "يعرض كل حزمة تخص الخادم الذي أعاده رد DNS.",
        expect: { type: "event", name: "wireshark:filter-apply", where: { text: "ip.addr==203.0.113.45", valid: true } }, target: "[data-win=\"wireshark\"] [data-ws=\"filter\"]",
        hints: ["الحقل ip.addr يطابق المصدر أو الوجهة.", "العنوان من رد DNS ومن TCPView.", "ip.addr == 203.0.113.45"], demo: { kind: "ui", tool: "wireshark", action: "step", arg: "s7" } },
      { id: "s8", title: "افلتر المنفذ 4444", instruction: "اكتب tcp.port == 4444 واضغط Enter.", why: "المنفذ غير القياسي نفسه الذي رأيناه في TCPView وnetstat.",
        expect: { type: "event", name: "wireshark:filter-apply", where: { text: "tcp.port==4444", valid: true } }, target: "[data-win=\"wireshark\"] [data-ws=\"filter\"]",
        hints: ["الحقل الذي يطابق المنفذ المصدر أو الوجهة.", "tcp.port ثم المنفذ.", "tcp.port == 4444"], demo: { kind: "ui", tool: "wireshark", action: "step", arg: "s8" } }
    ]
  },
  interpret: {
    sources: [
      { id: "dns", kind: "table", tool: "wireshark", title: "قائمة dns", heading: "Wireshark › filter: dns  (28 من 43 حزمة)", filter: "dns" },
      { id: "c2", kind: "table", tool: "wireshark", title: "ip.addr == 203.0.113.45", heading: "Wireshark › filter: ip.addr == 203.0.113.45", filter: "ip.addr == 203.0.113.45" },
      { id: "detail", tool: "wireshark", cmd: "14", title: "طبقات الحزمة 14", heading: "Packet Details — الحزمة 14 (أول طلب إلى update-sync.example)" }
    ],
    highlights: [
      { src: "dns", row: "14", col: "Info", label: "طلب update-sync.example", danger: true, concept: "dns", meaning: "الجهاز يسأل عن اسم الخادم المشبوه؛ ثلاثة طلبات من هذا النوع في الالتقاط (14 و36 و42)." },
      { src: "dns", row: "15", col: "Info", label: "رد update-sync.example", danger: true, concept: "dns", meaning: "الرد يترجم الاسم إلى 203.0.113.45: العنوان نفسه الذي ظهر في TCPView وnetstat." },
      { src: "dns", row: "14", col: "Source", label: "المصدر 192.168.1.23", concept: "packet", meaning: "جهاز سامي؛ العنوان نفسه في ipconfig." },
      { src: "dns", row: "14", col: "Destination", label: "الوجهة 192.168.1.1", concept: "packet", meaning: "خادم DNS وهو الراوتر (البوابة الافتراضية)." },
      { src: "dns", row: "14", col: "Protocol", label: "Protocol DNS", concept: "display-filter", meaning: "خلفية الصف زرقاء فاتحة: لون قاعدة UDP/DNS الافتراضية في Wireshark." },
      { src: "c2", row: "16", col: "Info", label: "SYN إلى 4444", danger: true, concept: "packet", meaning: "بدء اتصال TCP من المنفذ المحلي 49822 (كما في TCPView) إلى المنفذ 4444؛ الصف الرمادي لأن SYN." },
      { src: "c2", row: "16", col: "Destination", label: "الوجهة 203.0.113.45", danger: true, concept: "dns", meaning: "الاتصال جاء بعد رد DNS مباشرة: الجهاز عرف العنوان من الرد ثم اتصل به." },
      { src: "detail", line: "Ethernet II, Src", match: "3c:52:82:4a:91:0c", label: "Src MAC", concept: "packet", meaning: "عنوان MAC لجهاز سامي (3C-52-82-4A-91-0C في ipconfig /all؛ Wireshark يكتبه بنقطتين وبأحرف صغيرة)." },
      { src: "detail", line: "Internet Protocol Version 4, Src", match: "192.168.1.23", label: "Src IP", concept: "packet", meaning: "عنوان IP لجهاز سامي." },
      { src: "detail", line: "User Datagram Protocol, Src Port", match: "Dst Port: 53", label: "Dst Port 53", concept: "packet", meaning: "المنفذ 53 هو DNS؛ المنفذ المصدر رقم مؤقت." },
      { src: "detail", line: "update-sync.example: type A", match: "update-sync.example", label: "الاسم المطلوب", danger: true, concept: "dns", meaning: "الاسم الذي يسأل عنه الجهاز: النطاق المرتبط بالخادم المشبوه." }
    ],
    table: [
      { see: "dns", means: "كل طلبات DNS وردودها (28 حزمة هنا)." },
      { see: "dns.flags.response == 0", means: "الطلبات فقط (14 طلباً): هذا هو العدد المطلوب عند السؤال عن «عدد طلبات DNS»." },
      { see: "ip.addr == 203.0.113.45", means: "كل حزمة من/إلى الخادم المشبوه (اتصال TCP على 4444)." },
      { see: "tcp.port == 4444", means: "حزم المنفذ غير القياسي نفسه الذي رأيناه في TCPView وnetstat." },
      { see: "شريط الفلتر أحمر", means: "الفلتر مكتوب خطأ أو ناقص؛ لا يُطبَّق." },
      { see: "صف رمادي (SYN)", means: "بداية اتصال TCP؛ يتبعه SYN, ACK ثم ACK (المصافحة الثلاثية)." }
    ],
    ioc: ["ثلاثة طلبات DNS إلى update-sync.example.", "اتصال TCP بـ 203.0.113.45:4444 بعد رد DNS مباشرة."],
    questions: [
      { q: "كم طلب DNS (الطلبات فقط) في الالتقاط؟ (اكتب رقماً)", type: "value", answer: "14", why: "فلتر dns.flags.response == 0 يعرض 14؛ أما dns وحده فيعرض 28 (الطلبات والردود)." },
      { q: "كم مرة سأل الجهاز عن update-sync.example؟ (اكتب رقماً)", type: "value", answer: "3", why: "الطلبات 14 و36 و42." },
      { q: "ما العنوان الذي أجاب به DNS عن update-sync.example؟", type: "choice", options: ["203.0.113.45", "192.168.1.50", "142.250.185.78"], answer: "203.0.113.45", why: "وهو الخادم نفسه في TCPView وnetstat وProcmon." },
      { extra: true, q: "كم حزمة تظهر بفلتر dns وحده؟ (اكتب رقماً)", type: "value", answer: "28", why: "14 طلباً + 14 رداً." },
      { extra: true, q: "الشريط صار أحمر؛ ماذا يعني؟", type: "choice", options: ["الفلتر مكتوب خطأ", "لا توجد حزم مطابقة", "الالتقاط توقف"], answer: "الفلتر مكتوب خطأ", why: "الأخضر = صحيح والأحمر = خاطئ أو ناقص." },
      { extra: true, q: "لماذا ظهر الاتصال بـ 203.0.113.45:4444 بعد رد DNS مباشرة؟", type: "choice", options: ["الجهاز عرف العنوان من الرد ثم اتصل به", "صدفة", "لأن الراوتر بدأ الاتصال"], answer: "الجهاز عرف العنوان من الرد ثم اتصل به", why: "رد DNS هو الذي أعطى العنوان؛ ثم بدأت مصافحة TCP." }
    ],
  },
  realWorld: {
    versionNotes: [
      "Wireshark مجاني من wireshark.org؛ عمود Delta قد يظهر في الإصدارات الحديثة (مخفي افتراضياً في المحاكاة).",
      "الالتقاط الحقيقي على Windows يحتاج برنامج Npcap الذي يُثبَّت مع Wireshark.",
      "المحاكاة تعرض 43 حزمة وجزءاً من جلسة الاتصال بالخادم؛ لا يطابق عدد بايتات Procmon (65,536) لأن الالتقاط جزئي."
    ],
    officialSite: "https://www.wireshark.org/",
    ethics: "التقاط حركة الشبكة قد يكشف رسائل وكلمات مرور الآخرين: التقط على شبكتك أو بتفويض مكتوب، ولا تحتفظ بمحتوى لا علاقة له بالقضية."
  }
};
