/* Lesson a1-network — text edited by the instructor without touching code (CLAUDE.md §5).
   Concept text: docs/concepts.md §1–11. Values and answers: docs/outputs-spec.md §ج. */
window.FSIM = window.FSIM || {}; window.FSIM.lessons = window.FSIM.lessons || {};
window.FSIM.lessons["a1-network"] = {
  id: "a1-network", seq: 1, axis: 1, axisTitle: "المحور 1: فحص الجهاز والشبكة المحلية", labs: [1], chapters: [1, 7], minutes: 25,
  title: "أدوات الشبكة: ipconfig وping وtracert",
  caseBranch: {   // this lesson's place in the case (lesson box + investigation board on case.html)
    question: "أين يقع جهاز سامي في الشبكة؟ وهل هو متصل؟",
    reached: "وصلتنا شكوى سامي: الجهاز بطيء ويعمل وحده ليلاً. لم نفحص شيئاً بعد.",
    seeking: "نبدأ بالأساس: عنوان الجهاز في الشبكة وهل يتصل بالإنترنت، فكل اتصال مشبوه سنراه لاحقاً يُقرأ بالنسبة إلى هذا العنوان.",
    finding: "جهاز ACC-PC07 عنوانه 192.168.1.23 (MAC 3C-52-82-4A-91-0C) ضمن الشبكة 192.168.1.0/24، ومتصل بالإنترنت عبر 192.168.1.1."
  },
  summary: [   // «ما يجب أن تتذكره» at the end of the lesson
    "ipconfig يعطيك عنوان الجهاز (IPv4 Address) وبوابته (Default Gateway): جهاز سامي 192.168.1.23 وبوابته 192.168.1.1.",
    "ping يختبر الاتصال: بالرقم (ping 8.8.8.8) يختبر الوصول إلى الإنترنت، وبالاسم (ping google.com) يختبر DNS أيضاً؛ و0% loss تعني اتصالاً سليماً.",
    "tracert يرسم الطريق قفزة قفزة حتى الوجهة؛ والنجوم * * * في قفزة لا تعني انقطاعاً ما دام المسار اكتمل (8 قفزات)."
  ],
  objectives: [
    "معرفة عنوان الجهاز ونطاق شبكته وبوابته بأمر ipconfig.",
    "التأكد من الاتصال وتفسير نتائج ping وtracert.",
    "التمييز بين انقطاع الإنترنت وعطل DNS وفشل DHCP."
  ],
  explain: {
    core: ["ipv4","gateway","dns","ping","tracert"],   // essential cards shown first; the others under «للاستزادة»
    intro: "التشبيه الجامع لهذا الدرس: الشبكة المحلية عمارة، والأجهزة شقق، والراوتر بوابة العمارة، والإنترنت المدينة. ابدأ بالبطاقات الأساسية الخمس بالترتيب؛ والبقية للاستزادة.",
    figure: "building",
    whatNext: "ستكتب في Command Prompt الأمر ipconfig ثم ipconfig /all، ثم تفحص ثلاث وجهات بأمر ping، وتتبّع المسار بـ tracert، وتقارن مع واجهة Kali، ثم تجرّب كيف يبدو عطل DNS.",
    cards: [
      {
        id: "ipv4", ar: "عنوان IP", en: "IPv4 Address",
        analogy: "رقم الشقة في العمارة.",
        meaning: "رقم فريد يُعرف به الجهاز داخل الشبكة، من أربعة أجزاء كل منها بين 0 و255، مثل 192.168.1.23.",
        inTool: ["IPv4 Address. . . . . . . . . . . : 192.168.1.23"],
        forInvestigator: "هو «هوية» الجهاز في سجلات الراوتر والاتصالات وسجلات الدخول؛ به نربط نشاطاً شبكياً بجهاز بعينه.",
        fromCase: "جهاز سامي 192.168.1.23؛ سنجد الرقم نفسه في TCPView وWireshark.",
        mistake: "الظن أن IP ثابت دائماً؛ غالباً يتغير (انظر DHCP)، فيُسجَّل وقت أخذه.",
        quiz: { q: "أي العناوين التالية يمكن أن يكون عنوان جهاز صحيحاً؟", type: "choice", options: ["192.168.1.23", "192.168.1.300"], answer: "192.168.1.23", why: "300 أكبر من 255، فلا يصلح جزءاً من عنوان IPv4." }
      },
      {
        id: "private-public", ar: "العنوان الخاص والعام", en: "Private / Public IP",
        analogy: "رقم الشقة (يعرفه سكان العمارة فقط) مقابل عنوان العمارة في المدينة (يعرفه الجميع).",
        meaning: "العناوين الخاصة تُستخدم داخل الشبكات فقط ولا تُرى من الإنترنت: تبدأ بـ 10. أو 192.168. أو 172.16 حتى 172.31. ما عداها عام.",
        inTool: ["192.168.1.23      ← خاص", "142.250.185.78    ← عام (google.com)"],
        forInvestigator: "العنوان الخاص يدل على جهاز داخل المؤسسة؛ العام يدل على جهة خارجية، وقد تحتاج طلباً رسمياً من مزوّد الخدمة لمعرفة صاحبه.",
        fromCase: "المهاجم 192.168.1.50 خاص ← من داخل الشبكة؛ الخادم 203.0.113.45 عام ← خارجي.",
        mistake: "البحث عن صاحب عنوان خاص في الإنترنت؛ لا معنى لذلك.",
        quiz: { q: "هل 10.20.0.1 عنوان خاص أم عام؟", type: "choice", options: ["خاص", "عام"], answer: "خاص", why: "يبدأ بـ 10. فهو من النطاق الخاص." }
      },
      {
        id: "subnet", ar: "قناع الشبكة الفرعية", en: "Subnet Mask",
        analogy: "حدود العمارة: من هم جيرانك.",
        meaning: "يحدد أي جزء من العنوان «اسم الشبكة» وأي جزء «رقم الجهاز». 255.255.255.0 تعني: الأجزاء الثلاثة الأولى ثابتة لكل الجيران (192.168.1)، والأخير رقم الجهاز (1–254).",
        inTool: ["Subnet Mask . . . . . . . . . . . : 255.255.255.0"],
        forInvestigator: "يعرف به من يستطيع الوصول إلى الجهاز مباشرة دون المرور بالبوابة.",
        fromCase: "192.168.1.50 يبدأ بـ 192.168.1 ← جار ← استطاع محاولة الدخول مباشرة.",
        mistake: "اعتبار القناع عنواناً لجهاز؛ هو قاعدة تقسيم وليس جهازاً.",
        quiz: { q: "بالقناع 255.255.255.0، هل 192.168.2.10 جار لـ 192.168.1.23؟", type: "choice", options: ["نعم", "لا"], answer: "لا", why: "الجزء الثالث مختلف (2 مقابل 1)، فهو في شبكة أخرى." }
      },
      {
        id: "gateway", ar: "البوابة الافتراضية", en: "Default Gateway",
        analogy: "بوابة العمارة: كل خروج إلى المدينة يمر منها.",
        meaning: "عنوان الراوتر الذي يُرسل إليه الجهاز كل ما هو خارج شبكته.",
        inTool: ["Default Gateway . . . . . . . . . : 192.168.1.1", "  1     2 ms     1 ms     1 ms  192.168.1.1   ← أول قفزة في tracert"],
        forInvestigator: "سجلات الراوتر قد تحفظ الاتصالات الخارجة؛ وغياب البوابة يعني أن الجهاز لا يصل للإنترنت.",
        fromCase: "البيانات المسرّبة إلى 203.0.113.45 خرجت عبر 192.168.1.1.",
        mistake: "الخلط بين البوابة وخادم DNS (قد يكونان الجهاز نفسه في البيوت لكن وظيفتهما مختلفة).",
        quiz: { q: "ما أول قفزة تتوقعها في tracert من جهاز سامي؟ (اكتب العنوان)", type: "value", answer: "192.168.1.1", why: "أول قفزة دائماً البوابة الافتراضية." }
      },
      {
        id: "dns", ar: "نظام أسماء النطاقات", en: "DNS",
        analogy: "دليل الهاتف: تعرف الاسم وتريد الرقم.",
        meaning: "يترجم اسم الموقع (google.com) إلى عنوان IP (142.250.185.78).",
        inTool: ["DNS Servers . . . . . . . . . . . : 192.168.1.1", "Pinging google.com [142.250.185.78] with 32 bytes of data:"],
        forInvestigator: "كل اسم يطلب الجهاز ترجمته أثر لما حاول الوصول إليه، حتى لو لم يزره المستخدم بنفسه.",
        fromCase: "(المحور 4) طلبات DNS إلى update-sync.example تكشف خادم المهاجم.",
        mistake: "الحكم بانقطاع الإنترنت لأن الموقع بالاسم لا يفتح؛ قد تكون المشكلة في DNS فقط.",
        quiz: { q: "ping 8.8.8.8 ينجح وping google.com يفشل؛ أين المشكلة؟", type: "choice", options: ["في DNS", "في كابل الشبكة", "في بطاقة الشبكة"], answer: "في DNS", why: "الوصول بالرقم يعمل، فالطريق سليم؛ الذي فشل هو ترجمة الاسم." }
      },
      {
        id: "mac", ar: "العنوان الفيزيائي", en: "MAC Address",
        analogy: "رقم الهيكل المحفور في السيارة؛ اللوحة (IP) قد تتغير والهيكل لا.",
        meaning: "رقم بطاقة الشبكة من المصنع، ستة أزواج ست عشرية.",
        inTool: ["Physical Address. . . . . . . . . : 3C-52-82-4A-91-0C   (ipconfig /all)", "ether 08:00:27:4e:66:a1                                  (ifconfig)"],
        forInvestigator: "يُطابَق مع جدول الأجهزة في الراوتر لإثبات أن هذا الجهاز بعينه كان متصلاً، حتى لو تغيّر IP.",
        fromCase: "MAC جهاز سامي يظهر في إطار Ethernet في Wireshark.",
        mistake: "اعتباره دليلاً قاطعاً؛ يمكن تزويره برمجياً، فيُعزَّز بأدلة أخرى.",
        quiz: { q: "أي الأمرين يعرض MAC في Windows؟", type: "choice", options: ["ipconfig", "ipconfig /all"], answer: "ipconfig /all", why: "الأمر المجرّد يعرض العناوين فقط؛ التفاصيل الكاملة تحتاج الخيار /all." }
      },
      {
        id: "dhcp", ar: "التوزيع التلقائي للعناوين", en: "DHCP / 169.254",
        analogy: "موظف الاستقبال يعطي كل نزيل رقم غرفة مؤقتاً.",
        meaning: "الراوتر يوزّع العناوين تلقائياً لمدة محددة (Lease). إن لم يرد، يعطي Windows نفسه عنواناً يبدأ بـ 169.254 لا يصلح للإنترنت.",
        inTool: ["DHCP Enabled. . . . . . . . . . . : Yes", "Lease Obtained. . . . . . . . . . : Saturday, October 4, 2026 8:00:12 AM", "Autoconfiguration IPv4 Address. . : 169.254.38.112   ← حالة العطل"],
        forInvestigator: "لأن العنوان مؤقت، يُسجَّل وقت أخذه؛ وسجلات DHCP في الراوتر تربط IP بـ MAC في وقت محدد.",
        fromCase: "عنوان سامي أُعطي صباح 4/10 الساعة 8:00:12.",
        mistake: "تجاهل 169.254 والظن أن الجهاز متصل.",
        quiz: { q: "جهاز عنوانه 169.254.38.112؛ هل يصل للإنترنت؟", type: "choice", options: ["نعم", "لا"], answer: "لا", why: "العنوان الذي يبدأ بـ 169.254 يعني أن الجهاز لم يحصل على عنوان من الراوتر." }
      },
      {
        id: "loopback", ar: "عنوان الجهاز نفسه", en: "Loopback 127.0.0.1",
        analogy: "أن تتصل برقم هاتفك لتتأكد أن الجهاز يعمل.",
        meaning: "عنوان يشير دائماً إلى الجهاز نفسه؛ لا يخرج إلى أي شبكة.",
        inTool: ["Reply from 127.0.0.1: bytes=32 time<1ms TTL=128", "lo: flags=73<UP,LOOPBACK,RUNNING>   (Kali)"],
        forInvestigator: "نجاحه يعني أن برمجيات الشبكة في النظام سليمة؛ وفحص nmap 127.0.0.1 يفحص الجهاز الذي تكتب عليه لا جهازاً آخر.",
        fromCase: "لذلك يفحص الطالب في المحور 4 عنوان 192.168.1.23 بعد 127.0.0.1.",
        mistake: "الظن أن نجاح ping 127.0.0.1 يعني وجود إنترنت.",
        quiz: { q: "نجح ping 127.0.0.1 وفشل ping 8.8.8.8؛ ماذا نستنتج؟", type: "choice", options: ["برمجيات الشبكة في النظام تعمل، والمشكلة خارج الجهاز", "النظام معطّل بالكامل", "لا يمكن استنتاج شيء"], answer: "برمجيات الشبكة في النظام تعمل، والمشكلة خارج الجهاز", why: "loopback لا يخرج من الجهاز؛ نجاحه يثبت سلامة الجهاز لا سلامة الطريق." }
      },
      {
        id: "ping", ar: "ping وحزم ICMP", en: "Reply / timed out / time / TTL",
        analogy: "تطرق باب الجار وتنتظر «نعم».",
        meaning: "يرسل 4 حزم اختبار صغيرة (32 بايت) وينتظر الرد. time زمن الذهاب والعودة. TTL عدّاد ينقص 1 عند كل راوتر.",
        inTool: ["Reply from 8.8.8.8: bytes=32 time=24ms TTL=117", "Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)", "Request timed out."],
        forInvestigator: "يثبت إمكانية الوصول إلى جهاز في وقت معين؛ وTTL يقرّب عدد الراوترات ونوع النظام (Windows يبدأ بـ 128، Linux بـ 64).",
        fromCase: "الجهاز يصل للإنترنت (0% فقدان).",
        mistake: "اعتبار Request timed out. دليلاً على أن الجهاز مطفأ؛ قد يكون جدار ناري يحجب ping.",
        quiz: { q: "ردّ جهاز بـ TTL=63؛ أقرب نظام بدأ منه؟", type: "choice", options: ["Windows", "Linux"], answer: "Linux", why: "Linux يبدأ بـ 64، وقد نقصت قفزة واحدة." }
      },
      {
        id: "tracert", ar: "tracert والقفزة", en: "Hop",
        analogy: "تتبع طرد في البريد: كل مكتب بريد مرّ به.",
        meaning: "يُظهر الراوترات التي تمر بها الحزم حتى الوجهة؛ كل سطر قفزة بثلاث قياسات زمن.",
        inTool: ["  1     2 ms     1 ms     1 ms  192.168.1.1", "  4     *        *        *     Request timed out.", "Trace complete."],
        forInvestigator: "يحدد أين يتوقف الاتصال أو يتأخر، ويوضح المسار إلى خادم خارجي.",
        fromCase: "المسار إلى google.com 8 قفزات؛ الأولى البوابة.",
        mistake: "اعتبار * في منتصف المسار انقطاعاً؛ إن أكمل المسار بعدها فهو راوتر صامت فقط.",
        quiz: { q: "المسار اكتمل وفيه سطر *؛ هل يُحسب في عدد القفزات؟", type: "choice", options: ["نعم", "لا"], answer: "نعم", why: "الراوتر الصامت قفزة حقيقية، لكنه لا يرد على هذا النوع من الحزم." }
      },
      {
        id: "interface", ar: "واجهة الشبكة", en: "Network Interface / Adapter",
        analogy: "أبواب الشقة: باب رئيسي وباب خلفي.",
        meaning: "كل وسيلة اتصال لها واجهة: Wi-Fi وEthernet في Windows؛ eth0 وwlan0 وlo في Linux. لكل واجهة عنوانها.",
        inTool: ["Wireless LAN adapter Wi-Fi:", "Media State . . . . . . . . . . . : Media disconnected", "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>"],
        forInvestigator: "يحدد من أين اتصل الجهاز (سلكي أم لاسلكي)، ووجود أكثر من واجهة قد يعني اتصالاً بشبكتين.",
        fromCase: "جهاز سامي متصل عبر Wi-Fi فقط، والـ Ethernet مفصولة.",
        mistake: "قراءة عنوان من الواجهة الخطأ.",
        quiz: { q: "ماذا تعني UP وRUNNING في ifconfig؟", type: "choice", options: ["الواجهة مفعّلة وتعمل", "الواجهة معطّلة", "الواجهة موصولة بالإنترنت فقط"], answer: "الواجهة مفعّلة وتعمل", why: "UP = مفعّلة، RUNNING = تعمل الآن." }
      }
    ]
  },
  practice: {
    tool: "cmd", state: "healthy",
    scenario: "قبل فحص جهاز سامي (ACC-PC07)، تأكد من موقعه في الشبكة وأنه متصل بالإنترنت. اكتب الأوامر في نافذة Command Prompt كما تفعل في المختبر.",
    launchers: [{ tool: "cmd", label: "Command Prompt", auto: true }, { tool: "kali", label: "Kali Terminal" }],
    states: [{ id: "healthy", label: "سليم" }, { id: "dns-broken", label: "DNS معطّل" }, { id: "no-dhcp", label: "بلا DHCP" }],
    freeNote: "جرّب الأوامر بنفسك دون تلميحات، وبدّل «حالة الجهاز» لترى كيف يختلف الناتج.",
    steps: [
      { id: "s1", title: "اعرف عنوان الجهاز: ipconfig", instruction: "في نافذة Command Prompt اكتب الأمر ipconfig ثم اضغط Enter.", why: "لتعرف عنوان الجهاز وموقعه في الشبكة قبل أي فحص.",
        expect: { type: "command", tool: "cmd", match: "^ipconfig$" }, solution: "ipconfig", target: "[data-win=\"cmd\"] .term-input",
        hints: ["انقر داخل النافذة السوداء ثم اكتب.", "الأمر كلمة واحدة تبدأ بـ ip وتنتهي بـ config.", "اكتب: ipconfig"], demo: { kind: "command", tool: "cmd", text: "ipconfig" } },
      { id: "s2", title: "التفاصيل الكاملة: ipconfig /all", instruction: "اكتب ipconfig /all لترى اسم الجهاز والعنوان الفيزيائي وخادم DHCP.", why: "العنوان الفيزيائي (MAC) واسم الجهاز لا يظهران في الأمر المجرّد.",
        expect: { type: "command", tool: "cmd", match: "^ipconfig ?/all$" }, solution: "ipconfig /all", target: "[data-win=\"cmd\"] .term-input",
        hints: ["هو الأمر السابق نفسه مع خيار إضافي.", "الخيار يبدأ بشرطة مائلة (/) ويعني «الكل».", "اكتب: ipconfig /all"], demo: { kind: "command", tool: "cmd", text: "ipconfig /all" } },
      { id: "s3", title: "اختبر الجهاز نفسه: ping 127.0.0.1", instruction: "اكتب ping 127.0.0.1 (عنوان الجهاز نفسه).", why: "نجاحه يثبت أن برمجيات الشبكة في النظام سليمة قبل أن نتهم الشبكة.",
        expect: { type: "command", tool: "cmd", match: "^ping 127\\.0\\.0\\.1$" }, solution: "ping 127.0.0.1", target: "[data-win=\"cmd\"] .term-input",
        hints: ["نستخدم أمر الاختبار الذي يطرق الباب وينتظر الرد.", "الوجهة هي عنوان loopback.", "اكتب: ping 127.0.0.1"], demo: { kind: "command", tool: "cmd", text: "ping 127.0.0.1" } },
      { id: "s4", title: "اختبر الإنترنت بالرقم: ping 8.8.8.8", instruction: "اكتب ping 8.8.8.8 لتختبر الوصول إلى الإنترنت بالرقم.", why: "الاختبار بالرقم لا يعتمد على DNS، فيعزل مشكلة الاتصال عن مشكلة الأسماء.",
        expect: { type: "command", tool: "cmd", match: "^ping 8\\.8\\.8\\.8$" }, solution: "ping 8.8.8.8", target: "[data-win=\"cmd\"] .term-input",
        hints: ["الأمر نفسه لكن الوجهة خارج جهازك.", "الوجهة أربع مرات الرقم 8.", "اكتب: ping 8.8.8.8"], demo: { kind: "command", tool: "cmd", text: "ping 8.8.8.8" } },
      { id: "s5", title: "اختبر بالاسم: ping google.com", instruction: "اكتب ping google.com لتختبر الاتصال والترجمة معاً.", why: "ظهور العنوان بين قوسين يعني أن DNS ترجم الاسم بنجاح.",
        expect: { type: "command", tool: "cmd", match: "^ping google\\.com$" }, solution: "ping google.com", target: "[data-win=\"cmd\"] .term-input",
        hints: ["الأمر نفسه لكن الوجهة اسم موقع.", "الموقع هو google.com", "اكتب: ping google.com"], demo: { kind: "command", tool: "cmd", text: "ping google.com" } },
      { id: "s6", title: "تتبّع المسار: tracert google.com", instruction: "اكتب tracert google.com وانتظر حتى يظهر Trace complete.", why: "لترى الراوترات بين جهاز سامي وGoogle وتعدّ القفزات.",
        expect: { type: "command", tool: "cmd", match: "^tracert google\\.com$" }, solution: "tracert google.com", target: "[data-win=\"cmd\"] .term-input",
        hints: ["أمر تتبع المسار اسمه مشتق من trace route.", "الأمر في Windows اسمه tracert (بلا حرف o).", "اكتب: tracert google.com"], demo: { kind: "command", tool: "cmd", text: "tracert google.com" } },
      { id: "s7", title: "قارن مع Kali: ifconfig", instruction: "افتح «Kali Terminal» من شريط التطبيقات أعلى النافذة، ثم اكتب ifconfig فيها.", why: "نفس المعلومة (IP وMAC والواجهة) بصيغة Linux، وهي أمر مألوف في أدوات المحور 4.",
        expect: { type: "command", tool: "kali", match: "^ifconfig$" }, solution: "ifconfig", target: "[data-launch=\"kali\"]",
        hints: ["الزر في الشريط فوق نافذة المحاكاة.", "اضغط «Kali Terminal» ثم اكتب في النافذة الداكنة.", "اكتب في Kali: ifconfig"], demo: [{ kind: "launch", tool: "kali" }, { kind: "command", tool: "kali", text: "ifconfig" }] },
      { id: "s8", title: "جرّب عطل DNS", instruction: "غيّر «حالة الجهاز» إلى «DNS معطّل»، ثم نفّذ ping google.com في Command Prompt.", why: "لتفهم الفرق بين انقطاع الإنترنت وعطل ترجمة الأسماء: الرسالة تختلف.",
        expect: { type: "command", tool: "cmd", match: "^ping google\\.com$", state: "dns-broken" }, solution: "ping google.com", target: "#stage-bar select", onMismatch: "الأمر نُفِّذ لكن ليس ping google.com، أو حالة الجهاز ليست «DNS معطّل».",
        hints: ["القائمة المنسدلة «حالة الجهاز» في شريط التطبيقات.", "اختر «DNS معطّل» ثم أعد ping لاسم الموقع.", "بعد التبديل اكتب: ping google.com"], demo: [{ kind: "state", value: "dns-broken" }, { kind: "command", tool: "cmd", text: "ping google.com" }] }
    ]
  },
  interpret: {
    coreHighlights: ["IPv4 Address","Default Gateway","Reply from 8.8.8.8","Lost = 0 (0% loss)","Trace complete."],   // essential values (labels) counted by the discovery counter
    sources: [
      { id: "ipconfig", title: "ipconfig", tool: "cmd", cmd: "ipconfig", state: "healthy" },
      { id: "ipconfig-all", title: "ipconfig /all", tool: "cmd", cmd: "ipconfig /all", state: "healthy" },
      { id: "ping-lo", title: "ping 127.0.0.1", tool: "cmd", cmd: "ping 127.0.0.1", state: "healthy" },
      { id: "ping-dns", title: "ping 8.8.8.8", tool: "cmd", cmd: "ping 8.8.8.8", state: "healthy" },
      { id: "ping-google", title: "ping google.com", tool: "cmd", cmd: "ping google.com", state: "healthy" },
      { id: "tracert", title: "tracert google.com", tool: "cmd", cmd: "tracert google.com", state: "healthy" },
      { id: "kali", title: "Kali: ifconfig", tool: "kali", cmd: "ifconfig", state: "healthy" },
      { id: "dns-broken", title: "حالة: DNS معطّل", tool: "cmd", cmd: "ping google.com", state: "dns-broken" },
      { id: "no-dhcp", title: "حالة: بلا DHCP", tool: "cmd", cmd: "ipconfig", state: "no-dhcp" }
    ],
    highlights: [
      { src: "ipconfig", line: "IPv4 Address", match: "192.168.1.23", label: "IPv4 Address", concept: "ipv4", meaning: "هوية الجهاز داخل الشبكة المحلية. يبدأ بـ 192.168 فهو عنوان خاص لا يُرى من الإنترنت مباشرة. هذا العنوان سنبحث عنه لاحقاً في سجلات الشبكة." },
      { src: "ipconfig", line: "Subnet Mask", match: "255.255.255.0", label: "Subnet Mask", concept: "subnet", meaning: "يحدد نطاق الشبكة: كل الأجهزة من 192.168.1.1 إلى 192.168.1.254 جيران في الشبكة نفسها." },
      { src: "ipconfig", line: "Default Gateway", match: "192.168.1.1", label: "Default Gateway", concept: "gateway", meaning: "الراوتر: باب الخروج إلى الإنترنت. أي اتصال خارجي يمر من هنا، وسجلاته قد تكون دليلاً." },
      { src: "ipconfig", line: "Media State", match: "Media disconnected", label: "Media disconnected", concept: "interface", meaning: "بطاقة Ethernet غير موصولة؛ الجهاز متصل عبر Wi-Fi فقط." },

      { src: "ipconfig-all", line: "Host Name", match: "ACC-PC07", label: "Host Name", meaning: "اسم الجهاز؛ يظهر في سجلات الأحداث وسجلات الشبكة، ويربط الدليل بالجهاز." },
      { src: "ipconfig-all", line: "Physical Address", match: "3C-52-82-4A-91-0C", label: "Physical Address", concept: "mac", meaning: "عنوان MAC: بصمة بطاقة الشبكة، تُطابَق مع سجلات الراوتر لإثبات أن هذا الجهاز هو المتصل." },
      { src: "ipconfig-all", line: "DHCP Enabled", match: "Yes", label: "DHCP Enabled", concept: "dhcp", meaning: "العنوان يُعطى تلقائياً من الراوتر وقد يتغير؛ لذلك يُسجَّل وقت الإسناد في التقرير." },
      { src: "ipconfig-all", line: "Lease Obtained", match: "Saturday, October 4, 2026 8:00:12 AM", label: "Lease Obtained", concept: "dhcp", meaning: "وقت أخذ العنوان من الراوتر. سجّله في التقرير لأن العنوان مؤقت." },
      { src: "ipconfig-all", line: "DHCP Server", match: "192.168.1.1", label: "DHCP Server", concept: "dhcp", meaning: "الجهاز الذي أعطى العنوان (هنا الراوتر)." },
      { src: "ipconfig-all", line: "DNS Servers", match: "192.168.1.1", label: "DNS Servers", concept: "dns", meaning: "من يترجم أسماء المواقع؛ مهم عند تحليل طلبات DNS لاحقاً." },

      { src: "ping-lo", line: "Reply from", match: "Reply from 127.0.0.1", label: "Reply from 127.0.0.1", concept: "loopback", meaning: "127.0.0.1 هو الجهاز نفسه (Loopback)؛ نجاحه يعني أن برمجيات الشبكة في النظام سليمة." },
      { src: "ping-lo", line: "Reply from", match: "TTL=128", label: "TTL=128", concept: "ping", meaning: "القيمة الابتدائية في Windows." },

      { src: "ping-dns", line: "Reply from", match: "Reply from 8.8.8.8", label: "Reply from 8.8.8.8", concept: "ping", meaning: "الجهاز يصل إلى الإنترنت." },
      { src: "ping-dns", line: "Reply from", match: "time=24ms", label: "time=24ms", concept: "ping", meaning: "زمن الذهاب والعودة؛ أقل من 100ms اتصال جيد." },
      { src: "ping-dns", line: "Reply from", match: "TTL=117", label: "TTL=117", concept: "ping", meaning: "بدأت الحزمة من الطرف الآخر بقيمة (غالباً 128) ونقصت 1 مع كل راوتر؛ فرق ≈ 11 قفزة تقريباً." },
      { src: "ping-dns", line: "Packets:", match: "Lost = 0 (0% loss)", label: "Lost = 0 (0% loss)", concept: "ping", meaning: "لا فقدان؛ لو ظهر فقدان فهناك مشكلة أو حجب." },

      { src: "ping-google", line: "Pinging google.com", match: "[142.250.185.78]", label: "العنوان بين القوسين", concept: "dns", meaning: "ظهور العنوان بين القوسين يعني أن DNS ترجم الاسم بنجاح." },

      { src: "tracert", line: "1 ms  192.168.1.1", match: "192.168.1.1", label: "القفزة 1", concept: "gateway", meaning: "أول قفزة دائماً البوابة الافتراضية (تطابق ipconfig)." },
      { src: "tracert", line: "10.20.0.1", match: "10.20.0.1", label: "القفزتان 2–3", concept: "private-public", meaning: "عناوين داخلية لمزوّد الإنترنت (10.x و100.64.x)." },
      { src: "tracert", line: "Request timed out", match: "*        *        *", label: "* * *", concept: "tracert", meaning: "راوتر لا يرد على هذا النوع من الحزم (حجب/جدار ناري)، وليس انقطاعاً لأن ما بعده يكمل." },
      { src: "tracert", line: "Trace complete.", match: "Trace complete.", label: "Trace complete.", concept: "tracert", meaning: "وصلت الحزم للوجهة. عدد القفزات = 8 (القفزة 4 لم ترد لكنها تُحسب)." },

      { src: "kali", line: "eth0:", match: "UP,BROADCAST,RUNNING,MULTICAST", label: "flags", concept: "interface", meaning: "UP,RUNNING = الواجهة تعمل." },
      { src: "kali", line: "inet 192.168.1.40", match: "inet 192.168.1.40", label: "inet", concept: "ipv4", meaning: "عنوان IP (يقابل IPv4 في Windows). جهاز المحقق 192.168.1.40 غير جهاز المهاجم .50." },
      { src: "kali", line: "ether", match: "ether 08:00:27:4e:66:a1", label: "ether", concept: "mac", meaning: "عنوان MAC للواجهة." },
      { src: "kali", line: "lo:", match: "lo:", label: "lo", concept: "loopback", meaning: "واجهة الجهاز نفسه (127.0.0.1). بديل حديث لـ ifconfig: ip a." },

      { src: "dns-broken", line: "Ping request", match: "Ping request could not find host google.com. Please check the name and try again.", label: "فشل ترجمة الاسم", danger: true, concept: "dns", meaning: "ping 8.8.8.8 ينجح، وهذه الرسالة تعني أن الإنترنت يعمل والمشكلة في ترجمة الأسماء (DNS)." },

      { src: "no-dhcp", line: "Autoconfiguration IPv4", match: "169.254.38.112", label: "169.254.x.x", danger: true, concept: "dhcp", meaning: "الجهاز لم يحصل على عنوان من الراوتر (مشكلة DHCP)." },
      { src: "no-dhcp", line: "Default Gateway", match: "Default Gateway . . . . . . . . . :", label: "Default Gateway فارغ", danger: true, concept: "gateway", meaning: "لا يوجد Default Gateway = لا خروج إلى الإنترنت." }
    ],
    table: [
      { see: "IP يبدأ بـ 192.168 أو 10 أو 172.16–31", means: "شبكة محلية خاصة" },
      { see: "IP يبدأ بـ 169.254", means: "الجهاز لم يحصل على عنوان (مشكلة DHCP)" },
      { see: "لا يوجد Default Gateway", means: "لا خروج إلى الإنترنت" },
      { see: "Reply from", means: "الوجهة ترد" },
      { see: "Request timed out.", means: "لا رد (انقطاع أو حجب)" },
      { see: "ping لـ IP ينجح ولاسم يفشل", means: "مشكلة DNS" },
      { see: "* في tracert ثم يكمل المسار", means: "راوتر صامت، ليس انقطاعاً" }
    ],
    ioc: [],
    questions: [
      { q: "ما هو IP الخاص بالجهاز؟ (اكتب العنوان)", type: "value", answer: "192.168.1.23", why: "ظهر في سطر IPv4 Address من ipconfig؛ والبوابة 192.168.1.1." },
      { q: "هل الاتصال بالإنترنت يعمل؟", type: "choice", options: ["نعم: ping 8.8.8.8 نجح بلا فقدان وping google.com نجح فـ DNS يعمل", "لا: الجهاز غير متصل", "الإنترنت يعمل لكن DNS معطّل"], answer: "نعم: ping 8.8.8.8 نجح بلا فقدان وping google.com نجح فـ DNS يعمل", why: "4 ردود و0% فقدان في الاختبارين، والاسم تُرجم إلى عنوان." },
      { q: "كم عدد القفزات في tracert؟ (اكتب رقماً)", type: "value", answer: "8", why: "القفزة 4 لم ترد لكنها تُحسب؛ الأخيرة 8 هي الوجهة." },
      { extra: true, q: "لماذا ظهرت * في القفزة 4 ومع ذلك اكتمل المسار؟", type: "choice", options: ["راوتر لا يرد على ICMP والحزم مرّت", "انقطع الإنترنت مؤقتاً", "الوجهة محجوبة"], answer: "راوتر لا يرد على ICMP والحزم مرّت", why: "لو كان الانقطاع حقيقياً لما وصلت الحزم إلى القفزات 5–8." }
    ],
  },
  realWorld: {
    versionNotes: [
      "ipconfig وping وtracert أوامر مدمجة في Windows ولا تحتاج تثبيتاً.",
      "في Linux يُستخدم ip a وtraceroute بدلاً من ifconfig وtracert؛ ifconfig قديم لكنه ما زال مذكوراً في الكتب وLab Manual.",
      "اسم المحوّل (Wi-Fi أو Ethernet) وأرقام الواجهات يختلف من جهاز لآخر."
    ],
    officialSite: null,
    ethics: "استخدم هذه الأوامر على جهازك أو على شبكة تملك إذناً بفحصها. ping وtracert بريئة، لكن توجيه أدوات الفحص إلى أجهزة الآخرين دون إذن مخالف للأخلاق وللأنظمة."
  }
};
