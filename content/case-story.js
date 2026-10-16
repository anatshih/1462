/* The training case told as a story (case.html, home page, lesson boxes). Text edited by the instructor without touching code.
   Facts only from docs/outputs-spec.md §أ (story), §و (timeline) and §ك. The story asks questions; the answers appear on the
   investigation board only after the student finishes the lesson that discovers them (each lesson's caseBranch.finding). */
window.FSIM = window.FSIM || {}; window.FSIM.data = window.FSIM.data || {};
window.FSIM.data.story = {
  title: "جهاز المحاسب الذي يتحدث وحده",
  company: "شركة الواحة للتجارة (وهمية)",
  intro: [
    "سامي محاسب في شركة الواحة للتجارة، يعمل على جهاز اسمه ACC-PC07 (نظام Windows 11، حساب sami).",
    "صباح 4/10/2026 اشتكى سامي: الجهاز بطيء على غير عادته، ومروحته تعمل بقوة ليلاً، وزميل له لاحظ أن الجهاز كان يعمل بعد انتهاء الدوام.",
    "طلبت الشركة من فريق التحقيق الرقمي فحص الجهاز. أنت المحقق."
  ],
  bigQuestions: [
    "هل اختُرق الجهاز فعلاً؟ ومن دخل إليه، ومتى، وكيف؟",
    "هل يعمل عليه برنامج غريب؟ وماذا يفعل؟",
    "هل خرجت بيانات من الجهاز؟ وإلى أين؟",
    "كيف نحفظ الأدلة بطريقة تُقبل ولا يُطعن فيها؟"
  ],
  promise: "لن تقرأ الإجابات هنا: ستكتشفها بنفسك. في كل درس تتعلم أداة حقيقية من أدوات المقرر ومفاهيمها، وتستخدمها للإجابة عن سؤال واحد من أسئلة القضية. وكلما أنهيت درساً ظهر ما اكتشفته على لوحة التحقيق.",
  axes: [
    { n: 1, question: "هل اختُرق الجهاز؟ ومن دخل، وماذا زرع؟" },
    { n: 2, question: "كيف نحفظ القرص دليلاً لا يُطعن فيه، ونبحث فيه؟" },
    { n: 3, question: "ماذا حُذف؟ وكيف نحمي أدلتنا نحن؟" },
    { n: 4, question: "كيف تمّ الاتصال بالخارج؟ وما حقيقة البرنامج؟" }
  ],
  /* epilogue: the whole picture, shown on case.html (hidden behind a spoiler warning until all lessons are complete) */
  timeline: [
    { time: "3/10/2026 8:01:44 AM", event: "سامي يسجّل الدخول إلى جهازه محلياً (النوع 2) كأي يوم عمل.", tool: "Event Viewer" },
    { time: "3/10/2026 11:32:05 AM", event: "سامي ينزّل PDF-Tools-Free.exe من موقع «تنزيل مجاني» وسيط: مخاطرة موثّقة، لكنها ليست طريق الاختراق.", tool: "Browser History Examiner" },
    { time: "3/10/2026 5:42:10 PM", event: "تسجيل خروج نهاية الدوام.", tool: "Event Viewer" },
    { time: "3/10/2026 10:10:05–10:14:20 PM", event: "جهاز LAB-KALI (192.168.1.50) يحاول الدخول إلى حساب sami عبر الشبكة 6 مرات بكلمة مرور خاطئة.", tool: "Event Viewer" },
    { time: "3/10/2026 10:15:02 PM", event: "ينجح الدخول عبر الشبكة (4624، النوع 3): خُمّنت كلمة المرور.", tool: "Event Viewer" },
    { time: "3/10/2026 10:17:41 PM", event: "زرع update.exe وإضافته إلى التشغيل التلقائي (Run) باسم مضلِّل WindowsUpdateHelper.", tool: "Autoruns، Procmon" },
    { time: "4/10/2026 8:01:58 AM", event: "سامي يسجّل الدخول صباحاً، فيبدأ update.exe معه تلقائياً (PID 6120).", tool: "Event Viewer، Procmon" },
    { time: "4/10/2026 8:02 AM فما بعد", event: "update.exe يقرأ ملفات Finance ويضغطها في arc_1003.zip، ويسأل عن update-sync.example ثم يتصل بـ 203.0.113.45 على المنفذ 4444، ويستمع على 4444 أيضاً.", tool: "Procmon، TCPView، netstat، Wireshark، nmap" },
    { time: "التحقيق", event: "نسخة جنائية ACC-PC07_C.E01 ببصمة متطابقة؛ استعادة الأرشيف المحذوف arc_1003.zip؛ ملف holiday.jpg متنكّر (توقيعه ZIP)؛ وupdate.exe مضغوط UPX ويستورد مكتبات الشبكة والسجل.", tool: "FTK Imager، EnCase، DiskDigger، PE Explorer" }
  ],
  lesson: "الدرس المستفاد: كلمة مرور ضعيفة وحساب يقبل الدخول عبر الشبكة كانا كافيين لزرع برنامج يسرق ملفات المالية. وكل أداة تعلّمتها كشفت جزءاً من الصورة، ولم تكفِ واحدة وحدها."
};
