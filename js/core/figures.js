/* FSIM.core.figures — the interactive diagrams of the "explain" phase (concepts.md: «العمارة والشقق» and «المصنع»).
   Plain SVG + DOM, no libraries. Clicking / pressing Enter on a node shows its explanation. */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h;
  var NS = "http://www.w3.org/2000/svg";

  function s(name, attrs, kids) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function t(x, y, text, cls, anchor) {
    var n = s("text", { x: x, y: y, "text-anchor": anchor || "middle" });
    if (cls) n.setAttribute("class", cls);
    n.textContent = text;
    return n;
  }
  /* node = rect + title (Arabic) + sub (LTR value) */
  function node(id, x, y, w, hgt, title, sub, label) {
    var g = s("g", { "class": "node", tabindex: "0", role: "button", "data-node": id, "aria-label": label || title }, [
      s("rect", { x: x, y: y, width: w, height: hgt, rx: 10 }),
      t(x + w / 2, y + 24, title),
      sub ? t(x + w / 2, y + 44, sub, "ltr-text") : s("g")
    ]);
    return g;
  }
  function link(id, x1, y1, x2, y2) { return s("line", { "class": "link", "data-link": id, x1: x1, y1: y1, x2: x2, y2: y2 }); }

  function activate(g, handler) {
    g.addEventListener("click", function () { handler(g.getAttribute("data-node")); });
    g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(g.getAttribute("data-node")); } });
  }

  /* ---------------- «العمارة والشقق» — a1-network ---------------- */
  function building(host, ctx) {
    var c = FSIM.data.case;
    var info = {
      pc: { t: "جهاز سامي — " + c.victimIP, d: "هذا «شقة سامي». عنوانه " + c.victimIP + " وقناع الشبكة " + c.subnetMask + "، فكل عنوان من 192.168.1.1 إلى 192.168.1.254 جار له في العمارة نفسها." },
      printer: { t: "الطابعة", d: "جهاز آخر في الشبكة نفسها (أي عنوان يبدأ بـ 192.168.1). الوصول إليه من جهاز سامي مباشر، دون المرور بالبوابة." },
      kali: { t: "جهاز " + c.attackerName + " — " + c.attackerIP, d: "عنوانه " + c.attackerIP + " يبدأ بـ 192.168.1 فهو جار مباشر لسامي: استطاع محاولة الدخول إلى جهازه من داخل الشبكة نفسها. (سنرى ذلك في Event Viewer لاحقاً.)" },
      router: { t: "الراوتر = البوابة الافتراضية — " + c.gateway, d: "بوابة العمارة: أي اتصال بعنوان خارج 192.168.1.x يخرج من هنا. لذلك تكون القفزة الأولى في tracert هي " + c.gateway + "." },
      internet: { t: "الإنترنت (المدينة) — " + c.network.googleIP, d: "عنوان عام (google.com). لا يمكن الوصول إليه إلا عبر البوابة، ولا يُرى عنوان سامي الخاص من هناك." }
    };
    var card = {
      ipv4: { nodes: ["pc"], d: "IPv4 Address = رقم الشقة. جهاز سامي: " + c.victimIP + ". فريد داخل الشبكة." },
      mask: { nodes: ["zone"], d: "Subnet Mask = حدود العمارة. " + c.subnetMask + " تعني أن الأجزاء الثلاثة الأولى (192.168.1) مشتركة بين الجيران، والأخير هو رقم الجهاز." },
      gw: { nodes: ["router"], d: "Default Gateway = بوابة العمارة. " + c.gateway + ": إليها يُرسل الجهاز كل ما هو خارج شبكته." }
    };

    var svg = s("svg", { "class": "fig-svg", viewBox: "0 0 780 340", role: "group", "aria-label": "رسم الشبكة المحلية: أجهزة وراوتر وإنترنت" });
    var zone = s("rect", { "class": "zone", x: 14, y: 14, width: 500, height: 312, rx: 14, "data-node": "zone" });
    svg.appendChild(zone);
    svg.appendChild(t(34, 36, "العمارة = الشبكة المحلية 192.168.1.0/24", "zone-label", "start"));
    var links = [link("pc", 105, 116, 270, 214), link("printer", 270, 116, 270, 214), link("kali", 435, 116, 270, 214), link("net", 335, 250, 560, 250)];
    links.forEach(function (l) { svg.appendChild(l); });
    var nodes = [
      node("pc", 40, 60, 130, 56, "جهاز سامي", c.victimIP),
      node("printer", 205, 60, 130, 56, "الطابعة", "192.168.1.x"),
      node("kali", 370, 60, 130, 56, c.attackerName, c.attackerIP),
      node("router", 200, 214, 140, 56, "الراوتر (البوابة)", c.gateway),
      node("internet", 560, 214, 190, 56, "الإنترنت", "google.com")
    ];
    nodes.forEach(function (n) { svg.appendChild(n); activate(n, show); });
    var dnsLabel = t(650, 300, "", "ltr-text");
    svg.appendChild(dnsLabel);

    var explain = h("div.fig-explain", { "aria-live": "polite", text: "اضغط على أي جهاز في الرسم، أو على إحدى البطاقات الثلاث، ليظهر التفسير." });
    var dns = h("input", { type: "checkbox", id: "fig-dns" });
    var ctrls = h("div.fig-controls",
      h("button.btn", { type: "button", "data-card": "ipv4", text: "IPv4 Address" }),
      h("button.btn", { type: "button", "data-card": "mask", text: "Subnet Mask" }),
      h("button.btn", { type: "button", "data-card": "gw", text: "Default Gateway" }),
      h("label.switch", { "for": "fig-dns" }, dns, "تعطيل DNS"));

    function clear() { Array.prototype.forEach.call(svg.querySelectorAll(".is-active"), function (e) { e.classList.remove("is-active"); }); }
    function show(id) {
      clear();
      var n = svg.querySelector('[data-node="' + id + '"]'); if (n) n.classList.add("is-active");
      var l = svg.querySelector('[data-link="' + id + '"]'); if (l) l.classList.add("is-active");
      if (id === "internet") { svg.querySelector('[data-link="net"]').classList.add("is-active"); }
      var i = info[id]; explain.textContent = i.t + " — " + i.d;
      if (id === "internet" && dns.checked) explain.textContent += " (DNS معطّل الآن: الوصول بالرقم 8.8.8.8 يعمل، لكن اسم google.com لا يُترجم إلى عنوان.)";
    }
    Array.prototype.forEach.call(ctrls.querySelectorAll("[data-card]"), function (b) {
      b.addEventListener("click", function () {
        clear();
        var k = card[b.getAttribute("data-card")];
        k.nodes.forEach(function (id) { var n = svg.querySelector('[data-node="' + id + '"]'); if (n) n.classList.add("is-active"); });
        explain.textContent = k.d;
      });
    });
    dns.addEventListener("change", function () {
      var broken = dns.checked;
      svg.querySelector('[data-link="net"]').classList.toggle("is-broken", broken);
      dnsLabel.textContent = broken ? "ping google.com ✘  |  ping 8.8.8.8 ✔" : "";
      explain.textContent = broken
        ? "DNS معطّل: الطريق إلى الإنترنت يعمل (ping 8.8.8.8 ينجح)، لكن «دليل الهاتف» مفقود فلا يُترجم الاسم google.com إلى رقم. الرسالة: Ping request could not find host."
        : "DNS يعمل: الاسم يُترجم إلى عنوان، فينجح ping google.com أيضاً.";
    });

    host.appendChild(h("div.figure", h("h3", { text: "الرسم التفاعلي: العمارة والشقق" }), h("p.muted", { text: "الشبكة المحلية = عمارة، الأجهزة = شقق، الراوتر = بوابة العمارة، الإنترنت = المدينة." }), ctrls, svg, explain));
  }

  /* ---------------- «المصنع» — a1-autoruns ---------------- */
  function factory(host, ctx) {
    var c = FSIM.data.case, m = c.malware;
    var state = "infected";
    var info = {
      explorer: { t: "explorer.exe — PID 5532", d: "عامل عادي: واجهة Windows. هو «الأب» الذي شغّل update.exe عند دخول سامي (Parent PID: 5532)." },
      chrome: { t: "chrome.exe — PID 8840", d: "المتصفح. يتصل بالمنفذ 443 (مواقع آمنة). استهلاكه للذاكرة كبير لكنه متناسب مع وظيفته." },
      onedrive: { t: "OneDrive.exe — PID 7312", d: "برنامج موقّع من Microsoft ومدخله في Run موثّق (Verified): تشغيل تلقائي سليم." },
      runkey: { t: "مفتاح Run — الباب الجانبي", d: "أي برنامج مسجّل في " + c.runKey.key + " يعمل وحده عند كل دخول لهذا المستخدم. هذا ما تعرضه Autoruns، وفيه يضع البرنامج الخبيث نفسه ليعود بعد إعادة التشغيل." },
      p443: { t: "المنفذ 443", d: "باب الشحن العادي لمواقع الويب المشفّرة (HTTPS)." },
      p4444: { t: "المنفذ " + c.c2Port, d: "باب غير معتاد: منفذ شائع في أدوات التحكم عن بعد. اتصال برنامج مجهول به مؤشر خطر." },
      update: { t: m.name + " — PID " + m.pid, d: "«PID واحد يربط أربع أدوات»:" }
    };
    var tools = [
      "Autoruns ← مدخل WindowsUpdateHelper في HKCU\\…\\Run، بلا ناشر موثّق (صف وردي). ← هذا الدرس",
      "TCPView ← " + m.name + " (PID " + m.pid + ") متصل بـ " + c.c2IP + ":" + c.c2Port + " (Established). ← درس لاحق",
      "Procmon ← أحداث ReadFile على مجلد Finance ثم TCP Send. ← درس لاحق",
      "RAMMap ← " + m.name + " يحجز نحو 1.2 GB ذاكرة خاصة. ← درس لاحق"
    ];

    var svg = s("svg", { "class": "fig-svg", viewBox: "0 0 780 350", role: "group", "aria-label": "رسم الجهاز كمصنع: عمليات ومفتاح تشغيل تلقائي ومنافذ" });
    svg.appendChild(s("rect", { "class": "zone", x: 14, y: 14, width: 520, height: 322, rx: 14 }));
    svg.appendChild(t(34, 36, "المصنع = الجهاز " + c.hostName, "zone-label", "start"));
    var lk = [link("chrome", 255, 116, 600, 70), link("update", 405, 214, 600, 230), link("runkey", 180, 238, 330, 238)];
    lk.forEach(function (l) { svg.appendChild(l); });
    var ns = [
      node("explorer", 40, 60, 130, 56, "explorer.exe", "PID 5532"),
      node("chrome", 190, 60, 130, 56, "chrome.exe", "PID 8840"),
      node("onedrive", 340, 60, 150, 56, "OneDrive.exe", "PID 7312"),
      node("runkey", 40, 210, 140, 56, "مفتاح Run", "HKCU\\…\\Run"),
      node("update", 330, 210, 150, 56, m.name, "PID " + m.pid),
      node("p443", 580, 44, 160, 50, "باب الشحن", "443"),
      node("p4444", 580, 206, 160, 50, "باب الشحن", String(c.c2Port))
    ];
    ns.forEach(function (n) { svg.appendChild(n); activate(n, show); });
    var upd = svg.querySelector('[data-node="update"]'), updLink = svg.querySelector('[data-link="update"]'), rkLink = svg.querySelector('[data-link="runkey"]');

    var explain = h("div.fig-explain", { "aria-live": "polite", text: "اضغط على أي عنصر. جرّب update.exe لترى كيف يربط رقم العملية الأدوات الأربع." });
    var tog = h("input", { type: "checkbox", id: "fig-infected", checked: "" });
    tog.checked = true;
    var ctrls = h("div.fig-controls", h("label.switch", { "for": "fig-infected" }, tog, "الجهاز مصاب"));

    function clear() { Array.prototype.forEach.call(svg.querySelectorAll(".is-active"), function (e) { e.classList.remove("is-active"); }); }
    function show(id) {
      clear();
      var n = svg.querySelector('[data-node="' + id + '"]'); if (n) n.classList.add("is-active");
      var l = svg.querySelector('[data-link="' + id + '"]'); if (l) l.classList.add("is-active");
      var i = info[id];
      explain.textContent = "";
      explain.appendChild(h("strong", { text: i.t + " — " }));
      explain.appendChild(document.createTextNode(i.d));
      if (id === "update") {
        rkLink.classList.add("is-active"); svg.querySelector('[data-node="p4444"]').classList.add("is-active");
        explain.appendChild(h("ul", tools.map(function (x) { return h("li", { text: x }); })));
      }
    }
    function applyState() {
      var inf = tog.checked; state = inf ? "infected" : "healthy";
      [upd, updLink, rkLink, svg.querySelector('[data-node="p4444"]')].forEach(function (e) { e.style.display = inf ? "" : "none"; });
      if (!inf) { clear(); explain.textContent = "جهاز سليم: لا يوجد update.exe، ولا مدخل WindowsUpdateHelper، ولا اتصال بالمنفذ " + c.c2Port + "."; }
      else explain.textContent = "جهاز مصاب: ظهر update.exe (PID " + m.pid + "). اضغط عليه.";
    }
    tog.addEventListener("change", applyState);

    host.appendChild(h("div.figure", h("h3", { text: "الرسم التفاعلي: المصنع" }), h("p.muted", { text: "الجهاز = مصنع: البرامج المثبّتة عمّال مسجّلون، والعمليات عمّال على رأس العمل، والمنافذ أبواب شحن، والسجل دفتر القواعد." }), ctrls, svg, explain));
  }

  /* ---------------- «دفتر الحارس» — a1-eventviewer ---------------- */
  function guard(host) {
    var c = FSIM.data.case;
    var pts = [
      { id: "p0", t: "5:42:10 PM", ok: true, label: "خروج", d: "4634 تسجيل خروج: نهاية دوام سامي (10/3/2026 5:42:10 PM)." },
      { id: "p1", t: "10:10:05 PM", ok: false, label: "فشل 1", d: "4625 — أول محاولة فاشلة من " + c.attackerIP + " (" + c.attackerName + "): Logon Type 3، Sub Status 0xC000006A." },
      { id: "p2", t: "10:10:39 PM", ok: false, label: "فشل 2", d: "4625 — المحاولة الثانية من المصدر نفسه." },
      { id: "p3", t: "10:11:12 PM", ok: false, label: "فشل 3", d: "4625 — الثالثة." },
      { id: "p4", t: "10:12:31 PM", ok: false, label: "فشل 4", d: "4625 — الرابعة." },
      { id: "p5", t: "10:13:02 PM", ok: false, label: "فشل 5", d: "4625 — الخامسة." },
      { id: "p6", t: "10:14:20 PM", ok: false, label: "فشل 6", d: "4625 — السادسة: ست محاولات خلال أربع دقائق = تخمين كلمة مرور (Brute Force)." },
      { id: "p7", t: "10:15:02 PM", ok: true, label: "نجاح", d: "4624 — دخول ناجح من " + c.attackerIP + "، Logon Type 3: نجح التخمين بعد دقيقة من آخر فشل." },
      { id: "p8", t: "10:17:41 PM", ok: true, other: true, label: "زرع", d: "ليس حدثاً في Security: هذا وقت إضافة WindowsUpdateHelper إلى Run كما تعرضه Autoruns (بعد الدخول بدقيقتين ونصف)." },
      { id: "p9", t: "10:31:55 PM", ok: true, label: "خروج", d: "4634 تسجيل خروج بعد الاختراق." }
    ];
    var svg = s("svg", { "class": "fig-svg", viewBox: "0 0 780 250", role: "group", "aria-label": "خط زمني لليلة 3/10/2026" });
    svg.appendChild(s("line", { "class": "link", x1: 30, y1: 110, x2: 750, y2: 110 }));
    var xs = 30 + 40;
    pts.forEach(function (p, i) {
      var x = 50 + i * 76;
      var g = s("g", { "class": "node" + (p.ok ? "" : " is-bad"), tabindex: "0", role: "button", "data-node": p.id, "aria-label": p.t + " " + p.label }, [
        s("rect", { "class": "hit", x: x - 36, y: 88, width: 72, height: 108 }), s("circle", { cx: x, cy: 110, r: 17 }), t(x, 116, String(i + 1), "ltr-text"), t(x, 160, p.label), t(x, 180, p.t.replace(" PM", ""), "ltr-text")
      ]);
      g.querySelector("circle").setAttribute("fill", p.ok ? "var(--success-soft)" : "var(--danger-soft)");
      svg.appendChild(g); activate(g, show);
    });
    svg.appendChild(t(390, 30, "ليلة 3/10/2026 (الأحمر = فشل، الأخضر = نجاح)", "zone-label"));
    var explain = h("div.fig-explain", { "aria-live": "polite", text: "اضغط على أي نقطة في الخط الزمني." });
    function show(id) {
      Array.prototype.forEach.call(svg.querySelectorAll(".is-active"), function (e) { e.classList.remove("is-active"); });
      svg.querySelector('[data-node="' + id + '"]').classList.add("is-active");
      explain.textContent = pts.filter(function (p) { return p.id === id; })[0].d;
    }
    var types = { 2: "Logon Type 2 — أمام الجهاز: شخص يجلس ويكتب على لوحة المفاتيح (مثل دخول سامي صباحاً).", 3: "Logon Type 3 — عبر الشبكة: جهاز آخر يتصل بالجهاز (مثل LAB-KALI مساءً).", 10: "Logon Type 10 — سطح مكتب بعيد (RDP): شاشة الجهاز تُعرض على حاسوب بعيد." };
    var tExplain = h("div.fig-explain", { "aria-live": "polite", text: "اختر نوع الدخول لترى معناه." });
    var ctrls = h("div.fig-controls", h("strong", { text: "Logon Type:" }), [2, 3, 10].map(function (n) {
      var b = h("button.btn", { type: "button", "data-ltype": String(n), text: String(n) });
      b.addEventListener("click", function () { tExplain.textContent = types[n]; });
      return b;
    }));
    host.appendChild(h("div.figure", h("h3", { text: "الرسم التفاعلي: دفتر الحارس" }), h("p.muted", { text: "سجل الأحداث دفتر حارس البوابة: يكتب من دخل، ومتى، ومن أين، ومن فشل." }), svg, explain, ctrls, tExplain));
  }

  /* ---------------- «آلة التصوير» — a2-ftk ---------------- */
  function camera(host) {
    var layout = "FFDEFDDEFFEEDFEDFFEEDEFE".split("");   // F = file, D = deleted file, E = empty (unallocated)
    var COLOR = { F: "var(--primary-soft)", D: "var(--warn-soft)", E: "var(--surface)" };
    var NAME = { F: "ملف ظاهر", D: "ملف محذوف (ما زالت بياناته على القرص)", E: "مساحة غير مخصصة" };
    function grid(id, x0, y0, cells, title) {
      var g = s("g", { "data-grid": id });
      g.appendChild(t(x0 + 120, y0 - 10, title, "zone-label"));
      cells.forEach(function (c, i) {
        var r = s("rect", { x: x0 + (i % 8) * 30, y: y0 + Math.floor(i / 8) * 30, width: 26, height: 26, rx: 4, stroke: "var(--text-muted)", "stroke-width": 1.5 });
        r.setAttribute("fill", c ? COLOR[c] : "none");
        if (c === null) r.setAttribute("stroke-dasharray", "3 3");
        g.appendChild(r);
        if (c === "D") g.appendChild(t(x0 + (i % 8) * 30 + 13, y0 + Math.floor(i / 8) * 30 + 18, "✕", "ltr-text"));
      });
      return g;
    }
    var svg = s("svg", { "class": "fig-svg", viewBox: "0 0 780 170", role: "img", "aria-label": "قرص بقطاعات: ملفات ومحذوف وفارغ، ونسختان" });
    var host1 = s("g"), host2 = s("g"); svg.appendChild(host1); svg.appendChild(host2);
    function draw(copyCells, label) {
      host1.textContent = ""; host2.textContent = "";
      host1.appendChild(grid("orig", 30, 40, layout, "القرص الأصلي"));
      host2.appendChild(grid("copy", 470, 40, copyCells, label));
    }
    draw(layout.map(function () { return null; }), "النسخة (فارغة بعد)");
    var out = h("div.fig-explain", { "aria-live": "polite", text: "اضغط «نسخ عادي» أو «نسخة جنائية» ثم «احسب Hash». الأزرق ملف ظاهر، والأصفر ✕ محذوف، والأبيض مساحة غير مخصصة." });
    var copy = null;
    var normal = h("button.btn", { type: "button", "data-camera": "normal", text: "نسخ عادي (Copy/Paste)" });
    var forensic = h("button.btn", { type: "button", "data-camera": "forensic", text: "نسخة جنائية (بت ببت)" });
    var hashBtn = h("button.btn", { type: "button", "data-camera": "hash", text: "احسب Hash" });
    normal.addEventListener("click", function () { copy = layout.map(function (c) { return c === "F" ? "F" : null; }); draw(copy, "نسخة عادية: الملفات الظاهرة فقط"); out.textContent = "النسخ العادي لا ينقل الملفات المحذوفة ولا المساحة غير المخصصة."; });
    forensic.addEventListener("click", function () { copy = layout.slice(); draw(copy, "نسخة جنائية: كل القطاعات"); out.textContent = "النسخة الجنائية تنقل كل القطاعات: الظاهر والمحذوف وغير المخصص."; });
    hashBtn.addEventListener("click", function () {
      if (!copy) { out.textContent = "أنشئ نسخة أولاً."; return; }
      var a = FSIM.core.md5(layout.join("")), b = FSIM.core.md5(copy.map(function (c) { return c || "-"; }).join(""));
      var same = layout.join("") === copy.map(function (c) { return c || "-"; }).join("");
      out.textContent = "";
      out.appendChild(h("div", { class: "ltr", text: "الأصل: " + a }));
      out.appendChild(h("div", { class: "ltr", text: "النسخة: " + b }));
      out.appendChild(h("strong", { text: same ? "القيمتان متطابقتان ← النسخة مطابقة للأصل (Match)." : "القيمتان مختلفتان ← هذه النسخة ليست مطابقة للأصل (Mismatch)." }));
    });
    var inp = h("input", { type: "text", "aria-label": "جملة لحساب MD5", spellcheck: "false", dir: "auto", placeholder: "اكتب جملة…" });
    var mh = h("code.ltr", { text: FSIM.core.md5("") });
    inp.addEventListener("input", function () { mh.textContent = FSIM.core.md5(inp.value); });
    host.appendChild(h("div.figure", h("h3", { text: "الرسم التفاعلي: آلة التصوير" }),
      h("p.muted", { text: "قارن النسخ العادي بالنسخة الجنائية، ثم جرّب محاكي MD5: غيّر حرفاً واحداً فتتغير القيمة كلياً." }),
      h("div.fig-controls", normal, forensic, hashBtn), svg, out,
      h("div.fig-controls", h("label", { "for": "md5-in", text: "محاكي Hash — اكتب جملة:" }), (inp.id = "md5-in", inp)), h("div", mh)));
  }

  /* ---------------- «الزجاجة والملصق» — a2-encase ---------------- */
  function bottle(host) {
    var files = [
      { n: "Q3-Salaries.xlsx", hex: "50 4B 03 04", real: "ملف Office (مبني على ZIP)", ok: true },
      { n: "holiday.jpg", hex: "50 4B 03 04", real: "ملف ZIP مضغوط", ok: false },
      { n: "cat.jpg", hex: "FF D8 FF E0", real: "صورة JPEG", ok: true, example: true },
      { n: "report.pdf", hex: "4D 5A 90 00", real: "ملف تنفيذي (MZ)", ok: false, example: true },
      { n: "arc_1003.zip", hex: "50 4B 03 04", real: "ملف ZIP", ok: true }
    ];
    var cur = null, solved = {};
    var list = h("div.fig-controls", { role: "group", "aria-label": "الملفات" });
    var out = h("div.fig-explain", { "aria-live": "polite", text: "اضغط على ملف لترى أول بايتاته ونوعه الحقيقي، ثم صنّفه: متطابق أم متنكّر." });
    var cls = h("div.fig-controls"), ok = h("button.btn", { type: "button", "data-class": "match", text: "متطابق" }), bad = h("button.btn", { type: "button", "data-class": "fake", text: "متنكّر" });
    cls.appendChild(ok); cls.appendChild(bad);
    var bytes = h("pre.c-tool", { text: "" });
    files.forEach(function (f, i) {
      var b = h("button.btn", { type: "button", "data-bottle": f.n, text: f.n });
      b.addEventListener("click", function () { cur = i; bytes.textContent = "أول بايتات " + f.n + ":  " + f.hex + (f.example ? "      (مثال توضيحي)" : ""); out.textContent = "الامتداد يقول «" + f.n.split(".").pop() + "». صنّف الملف بعد قراءة البايتات."; });
      list.appendChild(b);
    });
    function answer(isMatch) {
      if (cur === null) { out.textContent = "اختر ملفاً أولاً."; return; }
      var f = files[cur], right = f.ok === isMatch;
      if (right) solved[f.n] = true;
      out.textContent = (right ? "✔ صحيح. " : "✘ ليس كذلك. ") + "النوع الحقيقي: " + f.real + (f.ok ? "؛ يطابق الامتداد." : "؛ لا يطابق الامتداد ← ملف متنكّر.") + " (" + Object.keys(solved).length + "/" + files.length + " صُنّفت صحيحاً)";
    }
    ok.addEventListener("click", function () { answer(true); }); bad.addEventListener("click", function () { answer(false); });
    host.appendChild(h("div.figure", h("h3", { text: "الرسم التفاعلي: الزجاجة والملصق" }), h("p.muted", { text: "الامتداد ملصق على الزجاجة، والتوقيع هو ما في داخلها فعلاً." }), list, bytes, cls, out));
  }

  /* ---------------- «المكتبة» — a3-diskdigger ---------------- */
  function library(host) {
    var books = ["a.docx", "b.xlsx", "c.pdf", "d.jpg", "e.zip", "f.txt"].map(function (n) { return { n: n, st: "ok" }; });
    var sel = null;
    var shelf = h("div.fig-controls", { role: "group", "aria-label": "الرف" });
    var out = h("div.fig-explain", { "aria-live": "polite", text: "اختر كتاباً (ملفاً) ثم «احذف» لتمزيق بطاقة الفهرس فقط. بعدها «اكتب ملفاً جديداً» ثم «افحص»." });
    var ICON = { ok: "📗", deleted: "📕 (بطاقة ممزقة)", over: "🟫 (كُتب فوقه)" };
    function render() {
      shelf.textContent = "";
      books.forEach(function (b, i) {
        var btn = h("button.btn", { type: "button", "data-book": b.n, "aria-pressed": String(sel === i), text: b.n + "  " + ICON[b.st] });
        btn.addEventListener("click", function () { sel = i; render(); });
        shelf.appendChild(btn);
      });
    }
    function status() { return { ok: books.filter(function (b) { return b.st === "ok"; }).length, del: books.filter(function (b) { return b.st === "deleted"; }).length, over: books.filter(function (b) { return b.st === "over"; }).length }; }
    var del = h("button.btn", { type: "button", "data-lib": "delete", text: "احذف الملف المحدد" });
    var write = h("button.btn", { type: "button", "data-lib": "write", text: "اكتب ملفاً جديداً" });
    var scan = h("button.btn", { type: "button", "data-lib": "scan", text: "افحص" });
    del.addEventListener("click", function () { if (sel === null || books[sel].st !== "ok") { out.textContent = "اختر كتاباً سليماً أولاً."; return; } books[sel].st = "deleted"; render(); out.textContent = "مُزّقت بطاقة الفهرس فقط؛ الكتاب (البيانات) ما زال على الرف."; });
    write.addEventListener("click", function () { var b = books.filter(function (x) { return x.st === "deleted"; })[0]; if (!b) { out.textContent = "احذف ملفاً أولاً."; return; } b.st = "over"; render(); out.textContent = "كتاب جديد وُضع مكان «" + b.n + "»: بياناته القديمة كُتب فوقها وضاعت."; });
    scan.addEventListener("click", function () { var s2 = status(); out.textContent = "نتيجة الفحص: " + s2.ok + " ملفات سليمة • " + s2.del + " محذوفة قابلة للاستعادة • " + s2.over + " ضائعة بالكتابة فوقها."; });
    render();
    host.appendChild(h("div.figure", h("h3", { text: "الرسم التفاعلي: المكتبة" }), h("p.muted", { text: "الحذف يمزّق بطاقة الفهرس لا الكتاب؛ الكتابة الجديدة هي التي تُضيع القديم." }), shelf, h("div.fig-controls", del, write, scan), out));
  }

  /* ---------------- «الخزنة» — a3-veracrypt ---------------- */
  function safe(host) {
    var msg = h("input", { type: "text", id: "safe-msg", "aria-label": "النص", dir: "auto", placeholder: "اكتب نصاً…" });
    var pw = h("input", { type: "password", id: "safe-pw", "aria-label": "كلمة المرور", autocomplete: "off" });
    var out = h("div.fig-explain", { "aria-live": "polite", text: "اكتب نصاً وكلمة مرور ثم اضغط «شفّر»." });
    var state = null;
    function keyOf(p) { return FSIM.core.md5("salt|" + p); }
    function xor(text, p) { var k = keyOf(p), bytes = Array.prototype.slice.call(new TextEncoder().encode(text)); return bytes.map(function (b, i) { return b ^ parseInt(k.substr((i * 2) % 32, 2), 16); }); }
    var enc = h("button.btn", { type: "button", "data-safe": "encrypt", text: "شفّر" }), dec = h("button.btn", { type: "button", "data-safe": "decrypt", text: "فك التشفير" }), hash = h("button.btn", { type: "button", "data-safe": "hash", text: "Hash (MD5)" });
    enc.addEventListener("click", function () {
      if (!msg.value || !pw.value) { out.textContent = "اكتب النص وكلمة المرور."; return; }
      var c = xor(msg.value, pw.value); state = { cipher: c, check: keyOf(pw.value) };
      out.textContent = "النص المشفّر: " + c.map(function (b) { return ("0" + b.toString(16)).slice(-2); }).join(" ") + " ← رموز غير مفهومة بلا المفتاح.";
    });
    dec.addEventListener("click", function () {
      if (!state) { out.textContent = "شفّر نصاً أولاً."; return; }
      if (keyOf(pw.value) !== state.check) { out.textContent = "✘ كلمة المرور خاطئة: لا يمكن فك التشفير (VeraCrypt: Incorrect password or not a VeraCrypt volume)."; return; }
      var k = keyOf(pw.value), bytes = state.cipher.map(function (b, i) { return b ^ parseInt(k.substr((i * 2) % 32, 2), 16); });
      out.textContent = "✔ فُكّ التشفير: " + new TextDecoder().decode(new Uint8Array(bytes));
    });
    hash.addEventListener("click", function () { out.textContent = "MD5 للنص: " + FSIM.core.md5(msg.value) + " ← لا توجد طريقة لاستعادة النص منه: Hash ليس تشفيراً."; });
    host.appendChild(h("div.figure", h("h3", { text: "الرسم التفاعلي: الخزنة" }), h("p.muted", { text: "التشفير يُفك بالمفتاح، أما Hash فلا يعود." }),
      h("div.fig-controls", h("label", { "for": "safe-msg", text: "النص:" }), msg, h("label", { "for": "safe-pw", text: "كلمة المرور:" }), pw), h("div.fig-controls", enc, dec, hash), out));
  }

  /* ---------------- «المغلفات المتداخلة» — a4-wireshark ---------------- */
  function envelopes(host) {
    var c = FSIM.data.case, pk = c.wireshark.packets.filter(function (p) { return p.dns && !p.dns.resp && p.dns.name === "update-sync.example"; })[0];
    var layers = [
      { id: "eth", t: "Ethernet II", d: "عناوين MAC: من " + c.victimMAC + " (جهاز سامي، يظهر في Wireshark بالصيغة 3c:52:82:4a:91:0c) إلى عنوان الراوتر (" + c.routerMAC + "). تذكّر مفهوم «العنوان الفيزيائي».", w: 700, h: 190, x: 40, y: 20 },
      { id: "ip", t: "IP (IPv4)", d: "عناوين IP: من " + pk.src + " إلى " + pk.dst + " (الراوتر وخادم DNS). تذكّر «عنوان IP» و«البوابة الافتراضية».", w: 560, h: 150, x: 110, y: 45 },
      { id: "udp", t: "UDP", d: "المنافذ: من " + pk.udp.sport + " (مؤقت) إلى " + pk.udp.dport + " (DNS). تذكّر «المنفذ والبروتوكول».", w: 420, h: 110, x: 180, y: 70 },
      { id: "dns", t: "DNS", d: "التطبيق: سؤال عن الاسم " + pk.dns.name + " (Standard query " + pk.dns.id + "). الجواب سيكون 203.0.113.45 = العنوان نفسه في TCPView.", w: 280, h: 70, x: 250, y: 95 }
    ];
    var svg = s("svg", { "class": "fig-svg", viewBox: "0 0 780 230", role: "group", "aria-label": "حزمة DNS كمغلفات متداخلة" });
    layers.forEach(function (l) {
      var g = s("g", { "class": "node", tabindex: "0", role: "button", "data-node": l.id, "aria-label": l.t }, [s("rect", { x: l.x, y: l.y, width: l.w, height: l.h, rx: 12 }), t(l.x + 12, l.y + 22, l.t, null, "start")]);
      svg.appendChild(g); activate(g, show);
    });
    var out = h("div.fig-explain", { "aria-live": "polite", text: "اضغط على كل مغلّف من الخارج إلى الداخل: Ethernet ← IP ← UDP ← DNS." });
    function show(id) {
      Array.prototype.forEach.call(svg.querySelectorAll(".is-active"), function (e) { e.classList.remove("is-active"); });
      svg.querySelector('[data-node="' + id + '"]').classList.add("is-active");
      out.textContent = layers.filter(function (l) { return l.id === id; })[0].d;
    }
    host.appendChild(h("div.figure", h("h3", { text: "الرسم التفاعلي: المغلفات المتداخلة" }), h("p.muted", { text: "كل حزمة رسالة داخل مغلف داخل مغلف؛ Wireshark يفتح نسخة من كل مغلف." }), svg, out));
  }

  /* ---------------- «العلبة والبطاقة» — a4-pe ---------------- */
  function pecard(host) {
    var parts = [
      { id: "mz", t: "MZ (ترويسة DOS)", d: "أول بايتين 4D 5A = «MZ»: توقيع كل ملف تنفيذي في Windows. ملف يبدأ بـ PK مثل holiday.jpg ليس تنفيذياً." },
      { id: "pe", t: "ترويسة PE", d: "Machine (32 أم 64 بت) وعدد الأقسام (3) وTime Date Stamp (وقت الربط، ويمكن تزويره) وSubsystem (واجهة رسومية أم سطر أوامر)." },
      { id: "sec", t: "ترويسات الأقسام", d: "قائمة الأقسام: UPX0 وUPX1 وrsrc. أقسام باسم UPX تعني أن الملف مضغوط." },
      { id: "code", t: "الأقسام (الشيفرة والبيانات)", d: "هنا الشيفرة المضغوطة؛ لا تُرى محتوياتها بالفحص الساكن قبل فك الضغط." },
      { id: "imp", t: "جدول الاستيراد", d: "قائمة الدوال المستعارة من مكتبات Windows: تكشف قدرات البرنامج (شبكة، سجل، ملفات)." }
    ];
    var svg = s("svg", { "class": "fig-svg", viewBox: "0 0 780 300", role: "group", "aria-label": "بنية ملف PE كبطاقة على علبة" });
    parts.forEach(function (p, i) {
      var g = s("g", { "class": "node", tabindex: "0", role: "button", "data-node": p.id, "aria-label": p.t }, [s("rect", { x: 130, y: 14 + i * 54, width: 520, height: 44, rx: 8 }), t(390, 42 + i * 54, p.t)]);
      svg.appendChild(g); activate(g, show);
    });
    var out = h("div.fig-explain", { "aria-live": "polite", text: "اضغط على أي جزء من الملف لتعرف دوره." });
    function show(id) {
      Array.prototype.forEach.call(svg.querySelectorAll(".is-active"), function (e) { e.classList.remove("is-active"); });
      svg.querySelector('[data-node="' + id + '"]').classList.add("is-active");
      out.textContent = parts.filter(function (p) { return p.id === id; })[0].d;
    }
    host.appendChild(h("div.figure", h("h3", { text: "الرسم التفاعلي: العلبة والبطاقة" }), h("p.muted", { text: "ترويسة PE بطاقة تعريف على غلاف العلبة: ما فيها، ومتى صُنعت، وماذا تستعير." }), svg, out));
  }

  FSIM.core.figures = { building: building, factory: factory, guard: guard, camera: camera, bottle: bottle, library: library, safe: safe, envelopes: envelopes, pecard: pecard };
})();
