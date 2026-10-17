/* FSIM.core.lesson — renders one lesson page: Explain → Practice → Interpret (CLAUDE.md §5).
   Content comes from FSIM.lessons[id] (content/lessons/<id>.js). All dynamic text uses textContent. */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus, P = FSIM.core.progress, sleep = FSIM.core.sleep;
  var STAGE_LABEL = { explain: "الشرح", practice: "التطبيق", interpret: "التفسير" };

  /* ---------- shared helpers ---------- */
  function norm(v) { return String(v == null ? "" : v).toLowerCase().replace(/[\u064B-\u0652]/g, "").replace(/\s+/g, " ").replace(/[.\u061B,،]+$/g, "").trim(); }

  /* quiz: choice or short value, corrected immediately with a reason; after 2 misses the answer is revealed */
  function renderQuiz(host, quiz, onDone, already) {
    var wrong = 0, finished = false;
    var box = h("div.quiz", h("p.q", { text: quiz.q }));
    var fb = h("p.quiz-fb", { role: "status", "aria-live": "polite", hidden: "" });
    function finish(ok, revealed) {
      if (finished) return; finished = true;
      fb.hidden = false; fb.className = "quiz-fb " + (ok ? "ok" : "bad");
      fb.textContent = (ok ? "✔ إجابة صحيحة. " : "الإجابة الصحيحة: " + quiz.answer + ". ") + (quiz.why || "");
      Array.prototype.forEach.call(box.querySelectorAll("button,input"), function (e) { e.disabled = true; });
      if (onDone) onDone(ok, revealed);
    }
    function miss() {
      wrong++;
      if (wrong >= 2) { finish(false, true); return; }
      fb.hidden = false; fb.className = "quiz-fb bad";
      fb.textContent = "ليست الإجابة الصحيحة. فكّر في الشرح أعلاه وحاول مرة أخرى.";
    }
    if (quiz.type === "value") {
      var inp = h("input", { type: "text", "aria-label": "إجابتك", autocomplete: "off", spellcheck: "false", dir: "ltr" });
      var ok = h("button.btn.btn-primary", { type: "button", text: "تحقّق" });
      var accept = [quiz.answer].concat(quiz.accept || []).map(norm);
      var check = function () { if (!inp.value.trim()) return; if (accept.indexOf(norm(inp.value)) >= 0) finish(true); else miss(); };
      ok.addEventListener("click", check);
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); check(); } });
      box.appendChild(h("div.quiz-value", inp, ok));
    } else {
      var opts = h("div.quiz-opts", { role: "group", "aria-label": "الخيارات" });
      quiz.options.forEach(function (o) {
        var b = h("button.quiz-opt", { type: "button", text: o });
        b.addEventListener("click", function () {
          if (finished) return;
          if (o === quiz.answer) { b.classList.add("is-right"); finish(true); }
          else { b.classList.add("is-wrong"); b.disabled = true; miss(); }
        });
        opts.appendChild(b);
      });
      box.appendChild(opts);
    }
    box.appendChild(fb);
    host.appendChild(box);
    if (already) finish(true);
    return box;
  }

  /* concept card body rows (the fixed 7-part order). ①–③ are always shown; ④–⑥ (the detail) sit under «اعرف أكثر»
     so a self-learning student reads the essentials first without losing any detail. openMore shows them unfolded. */
  function cardRows(c, withQuiz, quizDone, alreadyDone, openMore) {
    function row(r) {
      var val;
      if (r[2] === "tool") val = h("pre.c-tool", { text: Array.isArray(r[1]) ? r[1].join("\n") : r[1], tabindex: "0", lang: "en", dir: "ltr" });
      else val = h("div", { text: r[1] });
      return h("div.c-row" + (r[2] === "mistake" ? ".c-mistake" : ""), h("div.c-label", { text: r[0] }), val);
    }
    var frag = document.createDocumentFragment();
    [["① التشبيه", c.analogy], ["② المعنى العملي", c.meaning], ["③ كيف تراه في الأداة", c.inTool, "tool"]].forEach(function (r) { frag.appendChild(row(r)); });
    var more = [["④ لماذا يهم المحقق", c.forInvestigator], ["⑤ مثال من القضية", c.fromCase], ["⑥ خطأ شائع", c.mistake, "mistake"]].filter(function (r) { return r[1]; });
    if (more.length) {
      var det = h("details.c-more", h("summary", { text: "اعرف أكثر: لماذا يهم المحقق، ومثال من القضية، وخطأ شائع" }));
      if (openMore) det.setAttribute("open", "");
      more.forEach(function (r) { det.appendChild(row(r)); });
      frag.appendChild(det);
    }
    if (withQuiz) {
      var q = h("div.c-row", h("div.c-label", { text: "⑦ سؤال فهم" }), h("div"));
      renderQuiz(q.lastChild, c.quiz, quizDone, alreadyDone);
      frag.appendChild(q);
    }
    return frag;
  }

  function dialog(title, bodyNode, returnFocus) {
    var closeBtn = h("button.btn.btn-primary", { type: "button", text: "إغلاق" });
    var dlg = h("div.fsim-dialog", { role: "dialog", "aria-modal": "true", "aria-label": title, tabindex: "-1" }, h("h3", { text: title }), bodyNode, h("div.actions", closeBtn));
    var back = h("div.fsim-dialog-backdrop", dlg);
    function close() { back.remove(); document.removeEventListener("keydown", esc); if (returnFocus) returnFocus.focus(); }
    function esc(e) { if (e.key === "Escape") close(); }
    closeBtn.addEventListener("click", close);
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    document.addEventListener("keydown", esc);
    document.body.appendChild(back);
    closeBtn.focus();
    return { close: close };
  }

  /* ================= lesson page ================= */
  function init() {
    var root = document.getElementById("lesson-root");
    var id = document.body.getAttribute("data-lesson");
    var L = FSIM.lessons[id];
    if (!root || !L) { if (root) root.textContent = "تعذّر تحميل محتوى الدرس."; return; }
    document.title = L.title + " — مختبر التحقيقات الرقمية الافتراضي";

    /* essential cards first (explain.core), then the optional ones under «للاستزادة»; without explain.core all are essential */
    var allCards = (L.explain && L.explain.cards) || [];
    var coreIds = (L.explain && L.explain.core) || allCards.map(function (c) { return c.id; });
    var concepts = allCards.filter(function (c) { return coreIds.indexOf(c.id) >= 0; })
      .concat(allCards.filter(function (c) { return coreIds.indexOf(c.id) < 0; }));
    var nCore = allCards.filter(function (c) { return coreIds.indexOf(c.id) >= 0; }).length;
    /* honest time per stage, shown under each stage heading */
    var coreHlCount = ((L.interpret && L.interpret.coreHighlights) || []).length || Math.min(5, ((L.interpret && L.interpret.highlights) || []).length);
    var MIN = {
      explain: Math.max(3, Math.round(nCore * 1.5 + (L.explain && L.explain.figure ? 2 : 0))),
      practice: Math.round(((L.practice && L.practice.steps) || []).length * 1.5) + 2,
      interpret: Math.round(coreHlCount * 0.5 + ((L.interpret && L.interpret.questions) || []).filter(function (q) { return !q.extra; }).length * 1.5) + 2
    };
    function timeNote(st) { return h("p.time-note", { text: "⏱ نحو " + MIN[st] + (MIN[st] <= 10 ? " دقائق" : " دقيقة") + " • يمكنك التوقف في أي وقت والعودة لاحقاً: تقدّمك محفوظ في هذا المتصفح." }); }
    var conceptById = {}; concepts.forEach(function (c) { conceptById[c.id] = c; });
    var phase = null, mode = "guided", stepper = null, stage = null, watchCancel = null;
    var panels = {}, tabs = {};
    /* position of this lesson in the course (content/lessons-index.js) for previous / next links */
    var pos = (function () { var list = (FSIM.data && FSIM.data.lessonIndex) || []; var i = list.findIndex(function (x) { return x.id === id; }); return { list: list, i: i, prev: i > 0 ? list[i - 1] : null, next: i >= 0 && i < list.length - 1 ? list[i + 1] : null }; })();
    function lessonNav() {
      return h("nav.lesson-nav", { "aria-label": "التنقل بين الدروس" },
        pos.prev ? h("a.btn", { href: pos.prev.id + ".html", text: "→ الدرس السابق: " + pos.prev.title }) : h("span"),
        pos.next ? h("a.btn.btn-primary", { href: pos.next.id + ".html", "data-next-lesson": pos.next.id, text: "الدرس التالي: " + pos.next.title + " ←" }) : h("a.btn.btn-primary", { href: "../index.html", text: "العودة إلى الرئيسية" }));
    }

    /* ---- header ---- */
    var meta = h("div.meta",
      h("span.chip", { text: "المحور " + L.axis }),
      L.labs && L.labs.length ? h("span.chip", { text: "Lab Manual: " + L.labs.join("، ") }) : null,
      L.chapters && L.chapters.length ? h("span.chip", { text: "فصول الكتاب: " + L.chapters.join("، ") }) : null,
      h("span.chip", { text: "≈ " + L.minutes + " دقيقة" }));
    root.appendChild(h("header.lesson-head",
      h("nav.breadcrumb", { "aria-label": "مسار التنقل" }, h("a", { href: "../index.html", text: "الرئيسية" }), " › ", L.axisTitle || ("المحور " + L.axis), pos.i >= 0 ? " › الدرس " + (pos.i + 1) + " من " + pos.list.length : ""),
      h("h1", { text: L.title }), meta,
      L.objectives ? h("div", h("strong", { text: "ستتعلم في هذا الدرس:" }), h("ul", L.objectives.map(function (o) { return h("li", { text: o }); }))) : null));

    /* ---- this lesson's place in the case (two lines; the full story is on case.html) ---- */
    var CB = L.caseBranch;
    if (CB) root.appendChild(h("aside.case-box", { "aria-label": "هذا الدرس في القضية" },
      h("p.case-box-title", h("strong", { text: "هذا الدرس في قضية سامي: " }), CB.question),
      h("p", h("strong", { text: "وصلنا إلى: " }), CB.reached),
      h("p", h("strong", { text: "نبحث الآن عن: " }), CB.seeking),
      h("a", { href: "../case.html", text: "عرض القضية ولوحة التحقيق" })));

    /* ---- phase navigation ---- */
    var nav = h("ol.phases", { "aria-label": "مراحل الدرس" });
    P.STAGES.forEach(function (st, i) {
      var b = h("button.phase-tab", { type: "button", "data-phase": st }, h("span.num", { text: String(i + 1) }), STAGE_LABEL[st]);
      b.addEventListener("click", function () { go(st); });
      tabs[st] = b; nav.appendChild(h("li", b));
    });
    root.appendChild(nav);
    var live = h("div.sr-only", { "aria-live": "polite" });
    root.appendChild(live);

    P.STAGES.forEach(function (st) { var p = h("section.phase-panel", { id: "panel-" + st, "aria-labelledby": "h-" + st, hidden: "" }); panels[st] = p; root.appendChild(p); });

    function unlocked(st) {
      return true; // the three stages are always reachable; the order is a recommendation (explain first), never a lock
    }
    function refreshNav() {
      P.STAGES.forEach(function (st) {
        var b = tabs[st];
        b.classList.toggle("is-current", st === phase);
        b.classList.toggle("is-done", P.isDone(id, st));
        b.setAttribute("aria-disabled", unlocked(st) ? "false" : "true");
        if (st === phase) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      });
    }
    function go(st) {
      if (!unlocked(st)) { live.textContent = "أنهِ المرحلة السابقة أولاً."; return; }
      if (phase === "practice" && st !== "practice") { setFocus(false); teardownPractice(); }
      phase = st;
      P.STAGES.forEach(function (s) { panels[s].hidden = s !== st; });
      if (!panels[st].getAttribute("data-built")) { build[st](); panels[st].setAttribute("data-built", "1"); }
      else if (st === "practice") buildPractice();
      P.setLast(id, st);
      refreshNav();
      var hd = panels[st].querySelector("h2"); if (hd) { hd.setAttribute("tabindex", "-1"); hd.focus({ preventScroll: false }); }
    }

    /* ================= EXPLAIN ================= */
    var build = {};
    build.explain = function () {
      var p = panels.explain;
      p.appendChild(h("h2#h-explain", { text: "قبل أن تبدأ: مفاهيم تحتاجها" }));
      p.appendChild(timeNote("explain"));
      if (L.explain.intro) p.appendChild(h("p.lead", { text: L.explain.intro }));
      p.appendChild(h("p.muted", { text: "في كل بطاقة ثلاثة أجزاء أساسية (التشبيه، والمعنى، وكيف تراه في الأداة)، وتحتها «اعرف أكثر» لمن يريد التفصيل. سؤال الفهم في آخر البطاقة اختياري ويُصحَّح فوراً." }));
      if (nCore < concepts.length) p.appendChild(h("h3.cards-group", { text: "المفاهيم الأساسية (" + nCore + ")" }));
      var list = h("div.concept-list");
      p.appendChild(list);
      var cards = [];
      var seenCount = 0;
      var figHost = null;
      var startBtn = h("button.btn.btn-primary#to-practice", { type: "button", text: "تابع إلى التطبيق ←" });
      var progressNote = h("p.muted", { "aria-live": "polite" });
      var next = h("div.phase-next", progressNote, startBtn);

      function updateGate() {
        var allSeen = seenCount >= nCore; // the essential cards are enough; «للاستزادة» stays optional
        progressNote.textContent = allSeen ? "" : "اطّلعت على " + seenCount + " من " + nCore + " بطاقات أساسية (يُفضّل قراءتها قبل التطبيق).";
        if (allSeen && !P.isDone(id, "explain")) { P.mark(id, "explain"); refreshNav(); }
        if (allSeen) whatBox.hidden = false;
      }
      function markSeen(rec, c) {
        if (rec.seen) return;
        rec.seen = true; if (rec.core) seenCount++; P.markCard(id, c.id);
        rec.card.classList.add("is-done");
        if (!rec.answered) rec.head.querySelector(".state").textContent = "✔ اطّلعت";
        updateGate();
      }
      var extraList = null;
      concepts.forEach(function (c, i) {
        var isCore = i < nCore;
        if (!isCore && !extraList) {
          /* optional detail cards: closed by default, clearly marked, never required */
          // the essential list is the last thing in the panel so far; the optional group follows it
          p.appendChild(h("div.cards-extra-head",
            h("h3.cards-group", { text: "للاستزادة (" + (concepts.length - nCore) + " مفاهيم، اختيارية)" }),
            h("p.muted", { text: "تشرح بالتفصيل قيماً تراها في الأداة. اقرأها الآن أو ارجع إليها متى احتجت؛ لا يتوقف عليها شيء." })));
          extraList = h("div.concept-list.is-extra");
          p.appendChild(extraList);
        }
        var already = !!P.get(id).cards[c.id];
        var head = h("button.concept-head", { type: "button", "aria-expanded": "false", id: "ch-" + c.id },
          h("span.cnum", { text: String(i + 1) }), h("span", { text: c.ar }), h("span.cen", { text: c.en || "" }), h("span.state", { text: "" }));
        var body = h("div.concept-body", { role: "region", "aria-labelledby": "ch-" + c.id, hidden: "" });
        var card = h("article.concept" + (isCore ? "" : ".is-extra"), head, body);
        var built = false;
        var rec = { card: card, head: head, body: body, seen: false, answered: false, core: isCore };
        /* «next» walks the essential cards, then the diagram; inside «للاستزادة» it walks the optional ones */
        var lastOfGroup = isCore ? i === nCore - 1 : i === concepts.length - 1;
        function ensure() {
          if (built) return; built = true;
          body.appendChild(cardRows(c, true, function (ok) {
            rec.answered = true; rec.head.querySelector(".state").textContent = "✔ أُجيب";
          }, false));
          var nxt = !lastOfGroup
            ? h("button.btn.btn-primary", { type: "button", "data-next-card": "", text: "البطاقة التالية: " + concepts[i + 1].ar + " ←" })
            : h("button.btn.btn-primary", { type: "button", "data-next-card": "", text: L.explain.figure ? "إلى الرسم التفاعلي ↓" : "تابع إلى التطبيق ←" });
          nxt.addEventListener("click", function () {
            head.setAttribute("aria-expanded", "false"); body.hidden = true;
            if (!lastOfGroup) { openCard(i + 1); cards[i + 1].head.scrollIntoView({ block: "start", behavior: FSIM.core.config.fast ? "auto" : "smooth" }); cards[i + 1].head.focus({ preventScroll: true }); }
            else if (L.explain.figure) { figHost.scrollIntoView({ block: "start", behavior: FSIM.core.config.fast ? "auto" : "smooth" }); }
            else go("practice");
          });
          var label = nCore === concepts.length ? "بطاقة " + (i + 1) + " من " + concepts.length
            : isCore ? "بطاقة أساسية " + (i + 1) + " من " + nCore : "للاستزادة " + (i - nCore + 1) + " من " + (concepts.length - nCore);
          body.appendChild(h("div.card-next", h("span.muted", { text: label }), nxt));
        }
        rec.ensure = ensure;
        head.addEventListener("click", function () {
          var open = head.getAttribute("aria-expanded") === "true";
          if (open) { head.setAttribute("aria-expanded", "false"); body.hidden = true; }
          else { ensure(); head.setAttribute("aria-expanded", "true"); body.hidden = false; markSeen(rec, c); }
        });
        if (already) { rec.seen = true; if (isCore) seenCount++; card.classList.add("is-done"); head.querySelector(".state").textContent = "✔ اطّلعت"; }
        cards.push(rec); (isCore ? list : extraList).appendChild(card);
      });
      function openCard(i) { var r = cards[i]; r.ensure(); r.head.setAttribute("aria-expanded", "true"); r.body.hidden = false; markSeen(r, concepts[i]); }
      var firstUnseen = cards.findIndex(function (r) { return r.core && !r.seen; });
      if (concepts.length) openCard(firstUnseen < 0 ? 0 : firstUnseen);

      /* interactive diagram */
      figHost = h("div");
      p.appendChild(figHost);
      if (L.explain.figure && FSIM.core.figures[L.explain.figure]) FSIM.core.figures[L.explain.figure](figHost, {});

      var whatBox = h("div.note.note-info", { hidden: "" }, h("strong", { text: "ماذا ستفعل في التطبيق؟ " }), document.createTextNode(L.explain.whatNext || ""));
      p.appendChild(whatBox);
      p.appendChild(next);
      startBtn.addEventListener("click", function () { go("practice"); });
      updateGate();
    };

    /* ================= PRACTICE ================= */
    var launchers = {}, offerBox = null;
    function teardownPractice() {
      if (watchCancel) { watchCancel(); watchCancel = null; }
      if (stepper) { stepper.destroy(); stepper = null; }
      if (stage) { stage.destroy(); stage = null; }
    }

    build.practice = function () {
      var pr = L.practice, p = panels.practice;
      p.appendChild(h("h2#h-practice", { text: "التطبيق" }));
      p.appendChild(timeNote("practice"));
      p.appendChild(h("div.practice-scenario", h("strong", { text: "السيناريو: " }), document.createTextNode(pr.scenario)));
      /* self-learners: watch the lecturer-style demo first, then try (the «watch» mode, offered up front) */
      var watchFirst = h("button.btn.btn-primary#watch-first", { type: "button", text: "▶ شاهد العرض أولاً" });
      offerBox = h("div.watch-offer", h("p", h("strong", { text: "أول مرة ترى هذا البرنامج؟ " }),
        "شاهد العرض التلقائي (نحو دقيقة): ينفّذ الخطوات أمامك واحدة واحدة مع شرحها، ثم جرّب بنفسك بالتوجيه."), watchFirst);
      watchFirst.addEventListener("click", function () {
        modes.querySelector('[data-mode="watch"]').click();
        var play = document.getElementById("watch-play"); if (play) play.click();
      });
      var modes = h("div.modes", { role: "group", "aria-label": "وضع التطبيق" }, h("span.label", { text: "الوضع:" }));
      [["guided", "جرّب بتوجيه"], ["watch", "شاهد"], ["free", "جرّب حراً"]].forEach(function (m) {
        var b = h("button.mode-btn", { type: "button", "data-mode": m[0], "aria-pressed": m[0] === mode ? "true" : "false", text: m[1] });
        b.addEventListener("click", function () {
          mode = m[0];
          Array.prototype.forEach.call(modes.querySelectorAll(".mode-btn"), function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          buildPractice();
        });
        modes.appendChild(b);
      });
      var freeBtn = modes.querySelector('[data-mode="free"]');
      freeBtn.setAttribute("aria-disabled", "false");
      p.appendChild(modes);
      p.appendChild(offerBox);
      p.appendChild(h("div.note.mobile-hint", { text: "للتطبيق الأفضل استخدم حاسوباً: البرامج الحقيقية برامج حاسوب، ونافذة المحاكاة تُمرَّر أفقياً على الشاشات الصغيرة." }));
      p.appendChild(h("div.practice-grid", h("aside.steps-panel#steps-panel", { "aria-label": "لوحة الخطوات" }), h("div.stage-wrap", h("div.stage-bar#stage-bar"), h("div.stage#stage"))));
      p.appendChild(h("div.phase-next", h("button.btn.btn-primary#to-interpret", { type: "button", hidden: "", text: "تابع إلى التفسير ←" })));
      document.getElementById("to-interpret").addEventListener("click", function () { go("interpret"); });
      buildPractice();
    };

    function buildPractice() {
      teardownPractice();
      var pr = L.practice;
      var stepsPanel = document.getElementById("steps-panel"), bar = document.getElementById("stage-bar"), stEl = document.getElementById("stage");
      stepsPanel.textContent = ""; bar.textContent = ""; stEl.textContent = ""; launchers = {};
      FSIM.core.sim.state = pr.state || "healthy";
      refreshModeButtons();
      if (offerBox) offerBox.hidden = !(mode === "guided" && !P.isDone(id, "practice"));
      stage = FSIM.core.windows.Stage(stEl);

      /* launchers + state switch */
      var LABELS = { wireshark: "Wireshark", bhe: "Browser History Examiner", peexplorer: "PE Explorer", ftk: "FTK Imager", encase: "EnCase", diskdigger: "DiskDigger", veracrypt: "VeraCrypt", browser: "Browser", cmd: "Command Prompt", kali: "Kali Terminal", autoruns: "Autoruns", tcpview: "TCPView", procmon: "Process Monitor", rammap: "RAMMap", eventviewer: "Event Viewer" };
      function launch(tool, auto) {
        var win;
        if (tool === "folder") win = FSIM.tools.autoruns.openFolder(stage, function (t) { launch(t); }, pr.folderTools);
        else if (FSIM.tools[tool] && FSIM.tools[tool].open) {
          var n = stage.list().length;
          win = FSIM.tools[tool].open(stage, { x: 14 + 30 * n, y: 14 + 30 * n });
          if (LABELS[tool]) addLauncher({ tool: tool, label: LABELS[tool] });
        }
        if (win) { win.open(); if (!auto) bus.emit("tool:launch", { tool: tool }); }
        return win;
      }
      function addLauncher(l) {
        if (launchers[l.tool]) return;
        var b = h("button", { type: "button", "data-launch": l.tool, text: l.label });
        b.addEventListener("click", function () { launch(l.tool); });
        launchers[l.tool] = b; bar.insertBefore(b, bar.querySelector(".spacer"));
      }
      bar.appendChild(h("span", { text: "التطبيقات:" }));
      bar.appendChild(h("span.spacer"));
      (pr.launchers || []).forEach(addLauncher);
      FSIM.core.sim.authorized = false;
      if (pr.authorization) {
        var acb = h("input", { type: "checkbox", id: "auth-cb" });
        acb.addEventListener("change", function () { FSIM.core.sim.authorized = acb.checked; bus.emit("sim:authorized", { value: acb.checked }); });
        bar.insertBefore(h("label.state-toggle", acb, h("span", { text: "لديّ تفويض كتابي بفحص أجهزة هذه القضية" })), bar.querySelector(".spacer"));
        stage._auth = acb;
      }
      if (pr.states && pr.states.length > 1) {
        var sel = h("select", { "aria-label": "حالة الجهاز" }, pr.states.map(function (s) { return h("option", { value: s.id, text: s.label }); }));
        sel.value = FSIM.core.sim.state;
        sel.addEventListener("change", function () { FSIM.core.sim.state = sel.value; bus.emit("sim:state", { state: sel.value }); });
        bar.appendChild(h("label.state-toggle", h("span", { text: "حالة الجهاز:" }), sel));
        stage._sel = sel;
      }
      var grid = stEl.closest(".practice-grid");
      var big = h("button", { type: "button", "aria-pressed": String(stEl.classList.contains("is-large")), title: "تكبير الخط داخل النوافذ", text: "A+" });
      big.addEventListener("click", function () { var on = !stEl.classList.contains("is-large"); stEl.classList.toggle("is-large", on); big.setAttribute("aria-pressed", String(on)); FSIM.core.storage.get().ui.largeText = on; FSIM.core.storage.save(); });
      if (FSIM.core.storage.get().ui.largeText) { stEl.classList.add("is-large"); big.setAttribute("aria-pressed", "true"); }
      var again = h("button", { type: "button", title: "إعادة التطبيق من البداية", text: "↺ من جديد" });
      again.addEventListener("click", function () { buildPractice(); });
      var full = h("button", { type: "button", "data-focus-toggle": "", "aria-pressed": String(grid.classList.contains("is-focus")), text: grid.classList.contains("is-focus") ? "✕ إنهاء ملء الشاشة" : "⛶ ملء الشاشة" });
      full.addEventListener("click", function () { setFocus(!grid.classList.contains("is-focus")); });
      bar.appendChild(h("span.stage-tools", big, again, full));
      (pr.launchers || []).forEach(function (l) { if (l.auto) launch(l.tool, true); });

      var toNext = document.getElementById("to-interpret");
      toNext.hidden = false;

      if (mode === "free") {
        stepsPanel.appendChild(h("h3", { text: "التجربة الحرة" }));
        stepsPanel.appendChild(h("p", { text: pr.freeNote || "لا تلميحات هنا. حاول الوصول إلى الأهداف التالية بنفسك، ثم راجع التفسير." }));
        stepsPanel.appendChild(h("ul", pr.steps.map(function (s) { return h("li", h("label", h("input", { type: "checkbox" }), " " + (s.title || s.instruction))); })));
        return;
      }
      stepsPanel.appendChild(h("h3", { text: mode === "watch" ? "عرض تلقائي" : "الخطوات" }));
      if (mode === "guided") stepsPanel.appendChild(h("p.steps-help", { text: "نفّذ الخطوة داخل النافذة، ويتحقق الموقع منها تلقائياً وينقلك إلى التالية. عالق؟ اضغط «تلميح»." }));
      var host = h("div"); stepsPanel.appendChild(host);
      stepper = FSIM.core.stepper.create(host, pr.steps, {
        mode: mode,
        onStep: function (st) {
          var m = /data-win=\\?"([a-z]+)\\?"/.exec(st.target || "");
          var w = m && stage && stage.get(m[1]);
          if (w && w.isOpen) w.focus();
        },
        onFill: function (st) { var w = stage.get(st.expect.tool || "cmd"); var t = w && w.body.api && w.body.api.term; if (t) { w.open(); t.fill(st.solution); } },
        onComplete: function () {
          if (mode === "guided") {
            P.mark(id, "practice"); refreshNav(); refreshModeButtons(); toNext.hidden = false;
            var goI = h("button.btn.btn-primary", { type: "button", text: "تابع إلى التفسير ←" });
            goI.addEventListener("click", function () { setFocus(false); go("interpret"); });
            host.appendChild(h("div.completion", { role: "status" }, h("strong", { text: "أحسنت! " }), document.createTextNode("أكملت التطبيق. الخطوة التالية: تفسير ما رأيت. "), goI));
          } else if (mode === "watch") {
            var tryNow = h("button.btn.btn-primary#try-now", { type: "button", text: "جرّب بنفسك الآن ←" });
            tryNow.addEventListener("click", function () { var g = document.querySelector('#panel-practice [data-mode="guided"]'); if (g) g.click(); });
            host.appendChild(h("div.note.note-info", h("p", { text: "انتهى العرض. الآن دورك: نفّذ الخطوات نفسها بيدك، والتلميحات متاحة متى احتجت." }), tryNow));
          }
        }
      });
      if (mode === "watch") {
        var play = h("button.btn.btn-primary#watch-play", { type: "button", text: "▶ ابدأ العرض التلقائي" });
        stepsPanel.appendChild(h("div.hint-row", play));
        var running = false;
        play.addEventListener("click", function () {
          if (running) { watchCancel && watchCancel(); return; }
          running = true; play.textContent = "⏸ إيقاف";
          var cancelled = false; watchCancel = function () { cancelled = true; running = false; play.textContent = "▶ استئناف"; watchCancel = null; };
          (function loop() {
            if (cancelled || !stepper || stepper.isFinished()) { if (!cancelled) { running = false; play.textContent = "انتهى العرض"; } return; }
            var st = stepper.current();
            Promise.resolve(runDemo(st)).then(function () { return sleep(1400); }).then(loop);
          })();
        });
      }
    }

    function refreshModeButtons() { /* free mode is always enabled */ }

    /* full-screen work area: steps on one side, the tool on the other; Esc leaves it */
    function onEsc(e) { if (e.key === "Escape") setFocus(false); }
    function setFocus(on) {
      var grid = document.querySelector("#panel-practice .practice-grid"); if (!grid) return;
      grid.classList.toggle("is-focus", on); document.body.classList.toggle("fsim-focus", on);
      var b = grid.querySelector("[data-focus-toggle]"); if (b) { b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "✕ إنهاء ملء الشاشة" : "⛶ ملء الشاشة"; }
      if (on) document.addEventListener("keydown", onEsc); else document.removeEventListener("keydown", onEsc);
      if (stage) stage.fit(); // windows grow with the full-screen work area and shrink back after it
    }

    function runDemo(st) {
      var d = st.demo || st; if (!d) return Promise.resolve();
      if (Array.isArray(d)) return d.reduce(function (p, one) { return p.then(function () { return runDemo(one).then(function () { return sleep(700); }); }); }, Promise.resolve());
      if (d.kind === "command") {
        var win = stage.get(d.tool) || (d.tool === "cmd" ? FSIM.tools.cmd.open(stage, {}) : FSIM.tools.kali.open(stage, {}));
        win.open();
        return win.body.api.term.typeAndRun(d.text);
      }
      if (d.kind === "launch") { var b = launchers[d.tool]; if (b) b.click(); return Promise.resolve(); }
      if (d.kind === "folder-launch") { var f = stage.get("folder"); var row = f && f.el.querySelector('[data-tool="' + d.tool + '"]'); if (row) row.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })); return Promise.resolve(); }
      if (d.kind === "auth") { var ac = stage._auth; if (ac) { ac.checked = true; ac.dispatchEvent(new Event("change")); } return Promise.resolve(); }
      if (d.kind === "state") { var s = stage._sel; if (s) { s.value = d.value; s.dispatchEvent(new Event("change")); } return Promise.resolve(); }
      if (d.kind === "ui") { var w = stage.get(d.tool); if (w && w.body.api) { w.open(); var a = w.body.api[d.action]; if (a) return Promise.resolve(a.apply(null, [].concat(d.arg))); } return Promise.resolve(); }
      return Promise.resolve();
    }

    /* ================= INTERPRET ================= */
    build.interpret = function () {
      var I = L.interpret, p = panels.interpret;
      p.appendChild(h("h2#h-interpret", { text: "التفسير: ماذا يعني الناتج؟" }));
      p.appendChild(timeNote("interpret"));
      p.appendChild(h("p", { text: "اضغط على أي قيمة مظلّلة لتظهر بطاقة معناها. ابدأ بالقيم الأساسية (عليها ★): هي ما تحتاجه للإجابة عن الأسئلة. القيم الأخرى المظلّلة تشرح التفاصيل لمن يريد. مؤشرات الخطر الحقيقية تُظلَّل باللون الوردي." }));

      /* annotated outputs; the discovery counter follows the essential values (interpret.coreHighlights) */
      var tools = h("div.annot-tools", { role: "group", "aria-label": "اختر الناتج" });
      var paneHost = h("div");
      var meaning = h("div.meaning-card", { "aria-live": "polite", hidden: "" });
      var coreLabels = I.coreHighlights || (I.highlights || []).map(function (x) { return x.label; });
      function isCoreHl(hl) { return coreLabels.indexOf(hl.label) >= 0; }
      var coreHls = (I.highlights || []).filter(isCoreHl);
      var found = {}, totalHl = coreHls.length;
      var counter = h("p.annot-count", { "aria-live": "polite", text: "اكتشفت 0 من " + totalHl + " قيم أساسية" });
      /* the essential values as a checklist: a click opens the right output and the value itself */
      var coreList = h("ul.core-list", { "aria-label": "القيم الأساسية في هذا الدرس" });
      var coreItems = {};
      coreHls.forEach(function (hl) {
        var src = (I.sources || []).filter(function (s) { return s.id === hl.src; })[0];
        var b = h("button", { type: "button", "data-core": hl.label, text: "★ " + hl.label + (src ? " (" + src.title + ")" : "") });
        b.addEventListener("click", function () {
          var sb = Array.prototype.filter.call(tools.children, function (x) { return x.getAttribute("data-src") === hl.src; })[0];
          if (sb && activeSrc !== hl.src) sb.click();
          var spot = Array.prototype.filter.call(paneHost.querySelectorAll(".annot.is-core"), function (x) { return x.getAttribute("data-label") === hl.label; })[0];
          if (spot) { spot.scrollIntoView({ block: "center", behavior: FSIM.core.config.fast ? "auto" : "smooth" }); spot.click(); spot.focus({ preventScroll: true }); }
        });
        coreItems[hl.label] = b;
        coreList.appendChild(h("li", b));
      });
      p.appendChild(tools); p.appendChild(counter); if (coreHls.length) p.appendChild(coreList); p.appendChild(paneHost); p.appendChild(meaning);
      var activeSrc = null;

      function showMeaning(hl, btn) {
        Array.prototype.forEach.call(p.querySelectorAll(".annot.is-open"), function (e) { e.classList.remove("is-open"); });
        btn.classList.add("is-open");
        meaning.hidden = false; meaning.classList.toggle("is-danger", !!hl.danger); meaning.textContent = "";
        meaning.appendChild(h("p", h("strong", { text: (hl.danger ? "⚠ مؤشر خطر: " : "") + hl.label + " " }), h("span.val", { text: hl.value || "" })));
        meaning.appendChild(h("p", { text: hl.meaning }));
        if (isCoreHl(hl)) {
          found[hl.label] = true;
          if (coreItems[hl.label]) coreItems[hl.label].classList.add("is-found");
          var nf = Object.keys(found).length;
          counter.textContent = "اكتشفت " + nf + " من " + totalHl + " قيم أساسية" + (nf >= totalHl ? " ✔ ممتاز: فهمت القيم الأساسية. انتقل إلى الأسئلة بالأسفل، والقيم الأخرى المظلّلة للاستزادة." : "");
        }
        setTimeout(function () { meaning.scrollIntoView({ block: "nearest", behavior: FSIM.core.config.fast ? "auto" : "smooth" }); }, 0);
        if (hl.concept && conceptById[hl.concept]) {
          var rb = h("button.recall-link", { type: "button", text: "تذكير بالمفهوم: " + conceptById[hl.concept].ar });
          rb.addEventListener("click", function () { dialog(conceptById[hl.concept].ar + " — " + (conceptById[hl.concept].en || ""), (function () { var d = h("div"); d.appendChild(cardRows(conceptById[hl.concept], false, null, false, true)); return d; })(), rb); });
          meaning.appendChild(rb);
        }
      }
      function annot(hl, text) {
        var core = isCoreHl(hl);
        var b = h("button.annot" + (hl.danger ? ".is-danger" : "") + (core ? ".is-core" : ".is-extra"), { type: "button", text: text, "data-label": hl.label, "aria-label": (core ? "قيمة أساسية — " : "") + hl.label + ": " + text });
        b.addEventListener("click", function () { showMeaning(Object.assign({ value: text }, hl), b); });
        return b;
      }
      function renderTerminal(src) {
        var lines = FSIM.tools[src.tool].outputOf(src.cmd, src.state);
        var mine = (I.highlights || []).filter(function (x) { return x.src === src.id; });
        var used = {};
        var pre = h("pre", { lang: "en", dir: "ltr", tabindex: "0" });
        lines.forEach(function (ln, li) {
          var found = [];
          mine.forEach(function (hl, hi) {
            if (used[hi] || ln.indexOf(hl.line || hl.match) < 0) return;
            var at = ln.indexOf(hl.match); if (at < 0) return;
            used[hi] = true; found.push({ at: at, hl: hl });
          });
          found.sort(function (a, b) { return a.at - b.at; });
          var pos = 0, line = h("div");
          found.forEach(function (f) {
            if (f.at < pos) return;
            line.appendChild(document.createTextNode(ln.slice(pos, f.at)));
            line.appendChild(annot(f.hl, f.hl.match)); pos = f.at + f.hl.match.length;
          });
          line.appendChild(document.createTextNode(ln.slice(pos) || (pos === 0 ? "\u00a0" : "")));
          pre.appendChild(line);
        });
        return h("div.annot-pane", h("div.annot-title", { text: src.heading || ((src.tool === "kali" ? "$ " : "C:\\Users\\Student> ") + src.cmd + (src.state && src.state !== "healthy" ? "   [" + src.state + "]" : "")) }), pre);
      }
      function renderAutoruns(src) {
        var mine = (I.highlights || []).filter(function (x) { return x.src === src.id; });
        var table = h("table.ar-table", { lang: "en", dir: "ltr" });
        var thead = h("thead", h("tr", ["Autorun Entry", "Description", "Publisher", "Image Path", "Timestamp"].map(function (c) { return h("th", { text: c }); })));
        table.appendChild(thead);
        var tb = h("tbody"); table.appendChild(tb);
        function cellFor(text, key, col) {
          var td = h("td");
          var hl = mine.filter(function (x) { return x.row === key && x.col === col; })[0];
          if (hl) td.appendChild(annot(hl, text)); else td.textContent = text;
          return td;
        }
        FSIM.tools.autoruns.entriesFor(src.tab, src.state).forEach(function (g) {
          var hh = mine.filter(function (x) { return x.row === "header:" + g.header; });
          var hc = h("td", { colspan: "4" }), tc = h("td");
          var hh1 = hh.filter(function (x) { return x.col === "header"; })[0], hh2 = hh.filter(function (x) { return x.col === "time"; })[0];
          if (hh1) hc.appendChild(annot(hh1, g.header)); else hc.textContent = g.header;
          if (hh2) tc.appendChild(annot(hh2, g.time)); else tc.textContent = g.time || "";
          tb.appendChild(h("tr.ar-header", hc, tc));
          g.entries.forEach(function (e) {
            tb.appendChild(h("tr.ar-row" + (e.cls ? ".is-" + e.cls : ""), cellFor(e.name, e.key, "name"), cellFor(e.desc, e.key, "desc"), cellFor(e.publisher, e.key, "publisher"), cellFor(e.path, e.key, "path"), cellFor(e.time, e.key, "time")));
          });
        });
        return h("div.annot-pane.is-light", h("div.annot-title", { text: "Autoruns › " + src.tab + (src.state ? "   [" + src.state + "]" : "") }), h("div.table-scroll", table));
      }
      function renderTable(src) {
        var mine = (I.highlights || []).filter(function (x) { return x.src === src.id; });
        var data = FSIM.tools[src.tool].annotTable(src);
        var table = h("table.ar-table", { lang: "en", dir: "ltr" });
        table.appendChild(h("thead", h("tr", data.columns.map(function (c) { return h("th", { text: c }); }))));
        var tb = h("tbody"); table.appendChild(tb);
        data.rows.forEach(function (r) {
          tb.appendChild(h("tr.ar-row" + (r.cls ? ".is-" + r.cls.replace(/^is-/, "") : ""), r.cells.map(function (txt, ci) {
            var td = h("td"), hl = mine.filter(function (x) { return x.row === r.key && x.col === data.columns[ci]; })[0];
            if (hl) td.appendChild(annot(hl, String(txt))); else td.textContent = txt === null || txt === undefined ? "" : String(txt);
            return td;
          })));
        });
        return h("div.annot-pane.is-light", h("div.annot-title", { text: src.heading || src.title }), h("div.table-scroll", table));
      }
      function showSource(src, btn) {
        activeSrc = src.id;
        Array.prototype.forEach.call(tools.children, function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        paneHost.textContent = ""; meaning.hidden = true;
        paneHost.appendChild(src.kind === "autoruns" ? renderAutoruns(src) : src.kind === "table" ? renderTable(src) : renderTerminal(src));
      }
      (I.sources || []).forEach(function (src, i) {
        var b = h("button", { type: "button", "aria-pressed": "false", "data-src": src.id, text: src.title });
        b.addEventListener("click", function () { showSource(src, b); });
        tools.appendChild(b);
        if (i === 0) showSource(src, b);
      });

      /* if-you-see table */
      p.appendChild(h("h3", { text: "إذا رأيت… فهذا يعني…" }));
      p.appendChild(h("div.table-scroll", h("table.data", h("thead", h("tr", h("th", { text: "إذا رأيت" }), h("th", { text: "فهذا يعني" }))),
        h("tbody", (I.table || []).map(function (r) { return h("tr", h("td", { text: r.see }), h("td", { text: r.means })); })))));

      if (I.ioc && I.ioc.length) {
        p.appendChild(h("h3", { text: "مؤشرات الخطر (IOC)" }));
        p.appendChild(h("ul.ioc-list", I.ioc.map(function (x) { return h("li", { text: x }); })));
      }

      /* Lab Manual questions */
      /* the Lab Manual questions complete the lesson; the «إضافي» ones deepen it and stay optional */
      var nReq = I.questions.filter(function (q) { return !q.extra; }).length;
      var pending = nReq, qs = h("div");
      p.appendChild(h("h3", { text: "أسئلة Lab Manual" }));
      p.appendChild(h("p.muted", { text: "الأسئلة الأساسية (" + nReq + ") تُنهي الدرس. الأسئلة المعلَّمة «إضافي» اختيارية تعمّق فهمك، ويُنصح بها قبل الامتحان." }));
      p.appendChild(qs);
      function gate() { if (pending <= 0) completeLesson(); }
      I.questions.forEach(function (q, i) {
        var already = !!P.get(id).questions[i];
        var box = h("div.lab-q" + (q.extra ? ".is-extra" : ""), h("p", h("span.q-num", { text: "سؤال " + (i + 1) + (q.extra ? " (إضافي)" : "") + ": " })));
        qs.appendChild(box);
        if (already && !q.extra) pending--;
        renderQuiz(box, q, function () { if (!P.get(id).questions[i]) { P.markQuestion(id, i); if (!q.extra) pending--; } gate(); }, already);
      });

      /* completion + real world */
      var done = h("div#completion", { hidden: "" });
      p.appendChild(done);
      function completeLesson() {
        if (!P.isDone(id, "interpret")) { P.mark(id, "interpret"); refreshNav(); }
        showCompletion();
      }
      function showCompletion() {
        done.hidden = false; done.textContent = "";
        var inp = h("input", { id: "student-id", type: "text", inputmode: "numeric", autocomplete: "off", "aria-describedby": "sid-help" });
        inp.value = P.getStudent();
        var out = h("div", { "aria-live": "polite" });
        var gen = h("button.btn.btn-primary", { type: "button", text: "أنشئ رمز الإنجاز" });
        function show() {
          out.textContent = "";
          if (!inp.value.trim()) { out.textContent = "أدخل رقمك الجامعي أولاً."; return; }
          P.setStudent(inp.value);
          out.appendChild(h("p", { text: "رمز إنجاز هذا الدرس:" }));
          out.appendChild(h("span.code-chip", { text: P.code(inp.value, id, L.axis), "data-testid": "completion-code" }));
        }
        gen.addEventListener("click", show);
        done.appendChild(h("div.completion", h("h3", { text: "🎉 أنهيت الدرس" }),
          CB ? h("div.case-found", h("p", h("strong", { text: "اكتشاف جديد أُضيف إلى لوحة التحقيق:" })), h("p", { text: CB.finding }),
            h("a", { href: "../case.html", text: "افتح لوحة التحقيق" })) : null,
          h("p", { text: "أجبت عن الأسئلة الأساسية. يمكنك الآن إنشاء رمز إنجاز يتحقق منه الأستاذ." }),
          h("div.field", h("label", { "for": "student-id", text: "رقمك الجامعي" }), inp, h("small.muted#sid-help", { text: "يُستخدم محلياً داخل المتصفح لتوليد الرمز ولا يُرسل إلى أي جهة." })),
          gen, out, pos.next ? h("p", h("a.btn.btn-primary", { href: pos.next.id + ".html", text: "الدرس التالي: " + pos.next.title + " ←" })) : null));
        if (inp.value.trim()) show();
      }

      /* «what to remember»: three lines a self-learning student can come back to before the exam */
      if (L.summary && L.summary.length) {
        p.appendChild(h("section.lesson-summary", { "aria-labelledby": "sum-h" },
          h("h3#sum-h", { text: "📌 ما يجب أن تتذكره من هذا الدرس" }),
          h("ol", L.summary.map(function (s) { return h("li", { text: s }); }))));
      }

      /* conclusion */
      var rw = L.realWorld || {};
      p.appendChild(h("h3", { text: "في البرنامج الحقيقي" }));
      p.appendChild(h("div.realworld",
        h("ul", (rw.versionNotes || []).map(function (n) { return h("li", { text: n }); })),
        rw.officialSite ? h("p", h("span", { text: "المصدر الرسمي للتنزيل: " }), h("a", { href: rw.officialSite, target: "_blank", rel: "noopener noreferrer", lang: "en", dir: "ltr", text: rw.officialSite })) : null));
      if (rw.ethics) p.appendChild(h("div.ethics", h("strong", { text: "الاستخدام المسؤول: " }), document.createTextNode(rw.ethics)));
      p.appendChild(lessonNav());
      if (P.isDone(id, "interpret")) showCompletion();
    };

    /* ---- start ---- */
    var start = "explain", hash = (window.location.hash || "").replace("#", "");
    if (hash && P.STAGES.indexOf(hash) >= 0 && unlocked(hash)) start = hash;
    else { var last = P.getLast(); if (last && last.lesson === id && unlocked(last.stage)) start = last.stage; else if (P.isDone(id, "explain")) start = P.isDone(id, "practice") ? "interpret" : "practice"; }
    go(start);
  }

  FSIM.core.lesson = { init: init, renderQuiz: renderQuiz, norm: norm };
})();
