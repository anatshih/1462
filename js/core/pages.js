/* FSIM.core.pages — non-lesson pages: home, case (story + investigation board), about, verify. */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, P = FSIM.core.progress;
  var STAGE_LABEL = { explain: "الشرح", practice: "التطبيق", interpret: "التفسير" };
  var AXES = [
    { n: 1, title: "المحور 1: فحص الجهاز والشبكة المحلية", upcoming: [] },
    { n: 2, title: "المحور 2: حيازة الدليل وحفظه", upcoming: [] },
    { n: 3, title: "المحور 3: استرجاع البيانات وكشف المخفي", upcoming: [] },
    { n: 4, title: "المحور 4: تحليل الشبكة والأنشطة والملفات", upcoming: [] }
  ];
  function root() { return document.getElementById("page-root"); }
  function idx() { return FSIM.data.lessonIndex || []; }

  function setWidth(el, pct) { el.style.inlineSize = pct + "%"; }
  function progressBar(pct, label) {
    var inner = h("span"); setWidth(inner, pct);
    return h("div.progress-bar", { role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(pct), "aria-label": label }, inner);
  }

  /* ---------------- home ---------------- */
  function home() {
    var c = FSIM.data.course, r = root(), ids = idx().map(function (l) { return l.id; });
    var pct = P.percent(ids);
    r.appendChild(h("section.hero",
      h("p.chip", { text: c.semester }),
      h("h1", { text: "مختبر التحقيقات الرقمية الافتراضي" }),
      h("p.lead", { text: "تدرّب على أدوات الجانب العملي لمقرر " + c.name + " (" + c.number + ") داخل المتصفح: بلا تثبيت وبلا مخاطرة. تتعلم كل الأدوات من خلال قضية واحدة تحقق فيها من أولها إلى آخرها." })));

    var list = idx();
    /* the case comes first: the student understands the story before meeting any tool */
    r.appendChild(caseIntro(list, true));
    r.appendChild(h("div.note.note-info", h("strong", { text: "تنبيه: " }), document.createTextNode(c.disclaimer.full)));

    /* short "how it works" for first-time visitors */
    r.appendChild(h("section.card.how-to", { "aria-labelledby": "how-h" },
      h("h2#how-h", { text: "كيف يسير كل درس؟" }),
      h("p", { text: "يبدأ كل درس بسطرين: «وصلنا إلى…» و«نبحث الآن عن…»، ثم ثلاث مراحل:" }),
      h("ol",
        h("li", h("strong", { text: "١. الشرح" }), "بطاقات قصيرة للمفاهيم مع تشبيه ومثال من القضية، ورسم تفاعلي."),
        h("li", h("strong", { text: "٢. التطبيق" }), "نافذة تشبه البرنامج الحقيقي؛ تنفّذ الخطوات فيها، ويتحقق الموقع تلقائياً. «تلميح» عند الحاجة، و«⛶ ملء الشاشة» لمساحة أكبر."),
        h("li", h("strong", { text: "٣. التفسير" }), "تضغط القيم المظلّلة لتفهمها، وتجيب عن أسئلة Lab Manual؛ وعند إنهاء الدرس يظهر اكتشافك على لوحة التحقيق.")),
      h("p.muted", { text: "الدروس مرتبة حسب مسار التحقيق: ابدأ بالدرس 1 وتابع بالترتيب لتكتمل الصورة." })));

    var nextL = list.filter(function (l) { return !P.complete(l.id); })[0] || null;
    var last = P.getLast();
    var continueHref = last ? "labs/" + last.lesson + ".html#" + last.stage : (nextL ? "labs/" + nextL.id + ".html" : (list[0] ? "labs/" + list[0].id + ".html" : "#"));
    r.appendChild(h("section.card", { "aria-labelledby": "prog-h" },
      h("h2#prog-h", { text: "تقدّمك" }),
      progressBar(pct, "نسبة الإنجاز"), h("p", { text: pct + "% من مراحل الدروس المتاحة" }),
      h("div.hint-row", h("a.btn.btn-primary", { href: continueHref, text: last ? "تابع من حيث توقفت" : "ابدأ أول درس" }),
        (function () { var b = h("button.btn.btn-danger", { type: "button", text: "مسح تقدّمي" }); b.addEventListener("click", function () { if (window.confirm("سيُمسح تقدّمك واكتشافاتك على لوحة التحقيق في هذا المتصفح. هل أنت متأكد؟")) { P.reset(); window.location.reload(); } }); return b; })())));

    AXES.forEach(function (ax) {
      var lessons = idx().filter(function (l) { return l.axis === ax.n; });
      var cards = h("div.lesson-cards");
      lessons.forEach(function (l) {
        var st = P.STAGES.map(function (s) { return h("span.chip" + (P.isDone(l.id, s) ? ".chip-ok" : ""), { text: (P.isDone(l.id, s) ? "✔ " : "") + STAGE_LABEL[s] }); });
        var isNext = nextL && nextL.id === l.id;
        cards.appendChild(h("article.card.lesson-card" + (isNext ? ".is-next" : ""),
          h("h3", h("span.num", { text: String(list.indexOf(l) + 1) }), l.title),
          l.caseBranch ? h("p.case-q", h("strong", { text: "سؤال القضية: " }), l.caseBranch.question) : null,
          h("div.meta", isNext ? h("span.chip.chip-warn", { text: "★ المقترح الآن" }) : null, P.complete(l.id) ? h("span.chip.chip-ok", { text: "✔ مكتمل" }) : null,
            h("span.chip", { text: "Lab Manual: " + (l.labs || []).join("، ") }), h("span.chip", { text: "≈ " + l.minutes + " دقيقة" }), h("span.chip", { text: l.steps + " خطوات" })),
          h("div.stages", st),
          h("div.actions", h("a.btn.btn-primary", { href: "labs/" + l.id + ".html", text: P.get(l.id).explain ? "تابع الدرس" : "ابدأ الدرس" }))));
      });
      ax.upcoming.forEach(function (name) {
        if (lessons.some(function (l) { return l.title.toLowerCase().indexOf(name.split(" ")[0].toLowerCase()) >= 0; })) return;
        cards.appendChild(h("article.card.lesson-card.soon", h("h3", { text: name }), h("p.muted", { text: "قيد الإعداد: يأتي في مرحلة لاحقة." })));
      });
      var axQ = axisQuestion(ax.n);
      r.appendChild(h("section.axis-block", h("h2", { text: ax.title }), axQ ? h("p.axis-q", { text: "في القضية: " + axQ }) : null, cards));
    });
  }

  /* ---------------- about ---------------- */
  function about() {
    var c = FSIM.data.course, r = root();
    r.appendChild(h("h1.page-title", { text: "عن المقرر" }));
    r.appendChild(h("div.note", h("strong", { text: "تنبيه: " }), document.createTextNode(c.disclaimer.full)));
    r.appendChild(h("div.card", h("h2", { text: c.name + " (" + c.number + ")" }),
      h("table.data", h("tbody",
        [["الجامعة", c.university], ["الفرع", c.branch], ["الكلية", c.faculty], ["إعداد الموقع / المحتوى التطبيقي", c.instructor], ["الفصل الدراسي المعروض", c.semester]]
          .map(function (x) { return h("tr", h("th", { scope: "row", text: x[0] }), h("td", { text: x[1] })); })))));
    r.appendChild(h("h2", { text: "وصف المقرر" })); r.appendChild(h("p", { text: c.description }));
    r.appendChild(h("h2", { text: "أهداف المقرر" })); r.appendChild(h("ol", c.objectives.map(function (o) { return h("li", { text: o }); })));
    r.appendChild(h("h2", { text: "فصول الكتاب" }));
    r.appendChild(h("div.table-scroll", h("table.data", h("thead", h("tr", h("th", { text: "الفصل" }), h("th", { text: "العنوان" }), h("th", { text: "الامتحان" }))),
      h("tbody", c.chapters.map(function (ch) { return h("tr", h("td", { text: String(ch.n) }), h("td", { text: ch.title }), h("td", { text: ch.exam === "midterm" ? "النصفي" : "النهائي" })); })))));
    r.appendChild(h("h2", { text: "التقويم" }));
    r.appendChild(h("div.table-scroll", h("table.data", h("thead", h("tr", h("th", { text: "البند" }), h("th", { text: "الوزن" }), h("th", { text: "الفصول" }))),
      h("tbody", c.assessment.map(function (a) { return h("tr", h("td", { text: a.item }), h("td", { text: a.weight + "%" }), h("td", { text: a.chapters || "—" })); })))));
    r.appendChild(h("div.note.note-info", h("strong", { text: "الامتحان العملي: " }),
      document.createTextNode("مشروع منزلي (Take-Home) عبر البوابة الأكاديمية، مهلة 3 أيام، ملف Word أو PDF بلقطات شاشة. هذا الموقع تدريبي ولا يحلّ محلّ الامتحان ولا يحتوي على قضيته.")));
    r.appendChild(h("p.muted", { text: "المصدر: " + c.source }));
  }

  /* ---------------- the case (story, investigation board, epilogue) ---------------- */
  function story() { return (FSIM.data && FSIM.data.story) || null; }
  function axisQuestion(n) { var s = story(); var a = s && s.axes.filter(function (x) { return x.n === n; })[0]; return a ? a.question : ""; }

  /* the story as told before any lesson; short = home page version with links */
  function caseIntro(list, short) {
    var s = story(), cs = FSIM.data.case || {};
    if (!s) return h("div");
    var first = list[0], found = list.filter(function (l) { return P.complete(l.id); }).length;
    return h("section.card.case-intro", { "aria-labelledby": "case-h" },
      h("p.chip", { text: "القضية التدريبية " + (cs.id || "") }),
      h("h2#case-h", { text: "«" + s.title + "»" }),
      s.intro.map(function (p) { return h("p", { text: p }); }),
      h("h3", { text: "أسئلة التحقيق" }),
      h("ul.case-questions", s.bigQuestions.map(function (q) { return h("li", { text: q }); })),
      h("p.case-promise", { text: s.promise }),
      h("div.hint-row",
        short && first ? h("a.btn.btn-primary", { href: "labs/" + first.id + ".html", text: found ? "تابع التحقيق" : "ابدأ التحقيق: الدرس 1" }) : null,
        short ? h("a.btn", { href: "case.html", text: "لوحة التحقيق (" + found + " من " + list.length + ")" }) : null));
  }

  function casePage() {
    var r = root(), s = story(), list = idx();
    r.appendChild(h("h1.page-title", { text: "القضية ولوحة التحقيق" }));
    r.appendChild(caseIntro(list, false));
    if (!s) return;

    /* investigation board: one branch per lesson, grouped by axis; a finding appears only after the lesson is complete */
    var found = list.filter(function (l) { return P.complete(l.id); }).length;
    r.appendChild(h("h2", { text: "لوحة التحقيق" }));
    r.appendChild(h("p", { text: "كل فرع سؤال من أسئلة القضية. يظهر الاكتشاف مكان «؟» حين تُنهي الدرس الذي يجيب عنه." }));
    r.appendChild(progressBar(Math.round(found * 100 / (list.length || 1)), "الاكتشافات"));
    r.appendChild(h("p.board-count", { text: "اكتشفت " + found + " من " + list.length }));
    s.axes.forEach(function (ax) {
      var lessons = list.filter(function (l) { return l.axis === ax.n; });
      if (!lessons.length) return;
      r.appendChild(h("section.board-axis", { "aria-label": "المحور " + ax.n },
        h("h3", h("span.chip", { text: "المحور " + ax.n }), " " + ax.question),
        h("ol.board-list", lessons.map(function (l) {
          var b = l.caseBranch || {}, done = P.complete(l.id), n = list.indexOf(l) + 1;
          return h("li.board-item" + (done ? ".is-found" : ""),
            h("span.board-mark", { "aria-hidden": "true", text: done ? "✔" : "؟" }),
            h("div.board-body",
              h("p.board-q", h("strong", { text: n + ". " }), b.question || l.title),
              done ? h("p.board-finding", h("span.sr-only", { text: "الاكتشاف: " }), b.finding || "")
                   : h("p.muted", { text: "لم يُكتشف بعد." }),
              h("a" + (done ? "" : ".btn"), { href: "labs/" + l.id + ".html", text: (done ? "مراجعة الدرس: " : "اكتشفه في الدرس: ") + l.title })));
        }))));
    });

    /* epilogue: the whole picture (spoiler until every lesson is complete) */
    var all = found === list.length && list.length > 0;
    var tl = h("div.table-scroll", h("table.data.timeline",
      h("thead", h("tr", h("th", { text: "الوقت" }), h("th", { text: "ماذا حدث" }), h("th", { text: "الأداة التي كشفته" }))),
      h("tbody", s.timeline.map(function (t) { return h("tr", h("td", h("bdi", { text: t.time })), h("td", { text: t.event }), h("td", h("bdi", { text: t.tool }))); }))));
    var body = h("div", tl, h("p.case-promise", { text: s.lesson }));
    r.appendChild(h("h2#epilogue", { text: "الخاتمة: ماذا حدث لجهاز سامي؟" }));
    if (all) r.appendChild(h("div", h("p.note.note-info", { text: "أنهيت الدروس كلها، وهذه الصورة الكاملة التي جمعتها أداة بعد أداة." }), body));
    else r.appendChild(h("details.epilogue", h("summary", { text: "اعرض الخاتمة (تكشف إجابات كل الدروس؛ يُفضَّل فتحها بعد إنهائها)" }), body));

    /* completion codes */
    r.appendChild(h("h2", { text: "رموز الإنجاز" }));
    var sid = h("input", { id: "sid", type: "text", inputmode: "numeric", autocomplete: "off" }); sid.value = P.getStudent();
    r.appendChild(h("div.field", h("label", { "for": "sid", text: "رقمك الجامعي (يبقى في متصفحك ولا يُرسل)" }), sid));
    var codes = h("ul");
    r.appendChild(codes);
    function refresh() {
      codes.textContent = "";
      idx().forEach(function (l) {
        var done = P.complete(l.id);
        var li = h("li", { text: l.title + ": " });
        if (!done) li.appendChild(h("span.muted", { text: "أنهِ مراحل الدرس الثلاث أولاً." }));
        else if (!sid.value.trim()) li.appendChild(h("span.muted", { text: "أدخل رقمك الجامعي." }));
        else li.appendChild(h("span.code-chip", { text: P.code(sid.value, l.id, l.axis) }));
        codes.appendChild(li);
      });
    }
    sid.addEventListener("input", function () { P.setStudent(sid.value); refresh(); });
    refresh();
  }

  /* ---------------- verify (instructor page; not linked from menus) ---------------- */
  function verify() {
    var r = root();
    r.appendChild(h("h1.page-title", { text: "التحقق من رمز الإنجاز" }));
    r.appendChild(h("div.note", { text: "رادع خفيف وليس أماناً: الموقع ثابت ولا يمنع التزوير. يُستخدم للمطابقة السريعة فقط." }));
    var sid = h("input", { id: "v-sid", type: "text", inputmode: "numeric", autocomplete: "off" });
    var sel = h("select", { id: "v-lesson" }, idx().map(function (l) { return h("option", { value: l.id, text: l.title }); }));
    var code = h("input", { id: "v-code", type: "text", autocomplete: "off", dir: "ltr", placeholder: "A1-XXXX" });
    var out = h("p", { "aria-live": "polite", role: "status" });
    var go = h("button.btn.btn-primary", { type: "button", text: "تحقّق" });
    go.addEventListener("click", function () {
      var l = idx().filter(function (x) { return x.id === sel.value; })[0];
      if (!sid.value.trim() || !code.value.trim() || !l) { out.textContent = "أكمل الحقول الثلاثة."; return; }
      var ok = P.code(sid.value, l.id, l.axis) === code.value.trim().toUpperCase();
      out.className = "note" + (ok ? " note-info" : " note-danger");
      out.textContent = ok ? "✔ الرمز مطابق لهذا الرقم الجامعي وهذا الدرس." : "✘ الرمز غير مطابق.";
    });
    r.appendChild(h("div.card",
      h("div.field", h("label", { "for": "v-sid", text: "الرقم الجامعي" }), sid),
      h("div.field", h("label", { "for": "v-lesson", text: "الدرس" }), sel),
      h("div.field", h("label", { "for": "v-code", text: "الرمز" }), code), go, out));
  }

  var pageId = document.body.getAttribute("data-page");
  var map = { home: home, about: about, "case": casePage, verify: verify };
  if (map[pageId]) map[pageId]();
})();
