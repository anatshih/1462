/* FSIM.core.windows — Windows 11 style frames inside a lesson "stage". Draggable, minimise / maximise / close. */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;
  var NS = "http://www.w3.org/2000/svg";

  function svg(w, hgt, children) {
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 " + w + " " + hgt);
    s.setAttribute("aria-hidden", "true");
    children.forEach(function (c) {
      var n = document.createElementNS(NS, c[0]);
      Object.keys(c[1]).forEach(function (k) { n.setAttribute(k, c[1][k]); });
      s.appendChild(n);
    });
    return s;
  }

  /* Project-made generic icons (no vendor logos — CLAUDE.md §8). */
  var ICONS = {
    cmd: function () { return svg(16, 16, [["rect", { x: 1, y: 2, width: 14, height: 12, rx: 1.5, fill: "#1f1f1f", stroke: "#8a8a8a" }], ["path", { d: "M4 6l3 2-3 2", fill: "none", stroke: "#e6e6e6", "stroke-width": 1.3 }], ["path", { d: "M8.5 10.5h3", stroke: "#e6e6e6", "stroke-width": 1.3 }]]); },
    kali: function () { return svg(16, 16, [["rect", { x: 1, y: 2, width: 14, height: 12, rx: 2, fill: "#2b3a55", stroke: "#5aa9ff" }], ["path", { d: "M4 6l3 2-3 2", fill: "none", stroke: "#4ee08a", "stroke-width": 1.3 }], ["path", { d: "M8.5 10.5h3", stroke: "#5aa9ff", "stroke-width": 1.3 }]]); },
    autoruns: function () { return svg(16, 16, [["circle", { cx: 8, cy: 8, r: 6.5, fill: "#ece6f7", stroke: "#6a4fb3" }], ["path", { d: "M6 5l5 3-5 3z", fill: "#6a4fb3" }]]); },
    folder: function () { return svg(16, 16, [["path", { d: "M1.5 4.5h4l1.2 1.5h7.8v7.5h-13z", fill: "#f2c94c", stroke: "#b8962e" }]]); },
    exe: function () { return svg(16, 16, [["rect", { x: 2, y: 2, width: 12, height: 12, rx: 1.5, fill: "#dfe8f6", stroke: "#4a74b5" }], ["path", { d: "M5 8h6M8 5v6", stroke: "#4a74b5", "stroke-width": 1.2 }]]); },
    file: function () { return svg(16, 16, [["path", { d: "M3.5 1.5h6l3 3v10h-9z", fill: "#fff", stroke: "#888" }]]); }
  };
  FSIM.core.icons = { get: function (name) { return (ICONS[name] || ICONS.file)(); } };

  var CTL = {
    min: function () { return svg(10, 10, [["path", { d: "M0 5.5h10" }]]); },
    max: function () { return svg(10, 10, [["rect", { x: 0.5, y: 0.5, width: 9, height: 9 }]]); },
    close: function () { return svg(10, 10, [["path", { d: "M0 0l10 10M10 0L0 10" }]]); }
  };

  function Stage(container) {
    var wins = {};
    var zTop = 10;
    var count = 0;

    function create(opts) {
      if (wins[opts.id]) { wins[opts.id].open(); return wins[opts.id]; }
      var body = h("div.fw-body");
      var closeBtn = h("button.fw-close", { type: "button", "aria-label": "Close" }, CTL.close());
      var minBtn = h("button", { type: "button", "aria-label": "Minimize" }, CTL.min());
      var maxBtn = h("button", { type: "button", "aria-label": "Maximize" }, CTL.max());
      var title = h("div.fw-title",
        h("span.fw-icon", opts.icon ? ICONS[opts.icon] ? ICONS[opts.icon]() : "" : ""),
        h("span.fw-name", { text: opts.title }),
        h("span.fw-badge", { text: "محاكاة تعليمية" }),
        h("span.fw-ctl", minBtn, maxBtn, closeBtn));
      var el = h("div.fw", {
        role: "dialog", "aria-label": opts.title + " — محاكاة تعليمية", tabindex: "-1",
        dir: "ltr", lang: "en", "data-skin": opts.skin || "win", "data-win": opts.id
      }, title, body);

      var off = (count++ % 5) * 28;
      el.style.left = (opts.x != null ? opts.x : 14 + off) + "px";
      el.style.top = (opts.y != null ? opts.y : 14 + off) + "px";
      el.style.width = (opts.width || 720) + "px";
      el.style.height = (opts.height || 480) + "px";
      el.style.zIndex = ++zTop;
      container.appendChild(el);
      /* keep every window fully inside the work area (no hidden title bars or buttons); on phones the stage scrolls instead */
      var cw = container.clientWidth, ch = container.clientHeight;
      if (ch > 300) {
        var W = cw >= 700 ? Math.min(opts.width || 720, cw - 12) : (opts.width || 720), H = Math.min(opts.height || 480, ch - 12);
        el.style.width = W + "px"; el.style.height = H + "px";
        if (cw >= 700) el.style.left = Math.max(4, Math.min(parseInt(el.style.left, 10), cw - W - 6)) + "px";
        el.style.top = Math.max(4, Math.min(parseInt(el.style.top, 10), ch - H - 6)) + "px";
      }

      var win = {
        id: opts.id, el: el, body: body, isOpen: true,
        focus: function () {
          el.style.zIndex = ++zTop;
          Object.keys(wins).forEach(function (k) { wins[k].el.classList.toggle("is-inactive", wins[k] !== win); });
          bus.emit("window:focus", { id: opts.id });
        },
        open: function () {
          if (!win.isOpen) { el.hidden = false; win.isOpen = true; bus.emit("window:open", { id: opts.id }); }
          el.classList.remove("is-min");
          win.focus();
          if (opts.onFocus) opts.onFocus(win);
        },
        close: function () {
          el.hidden = true; win.isOpen = false;
          bus.emit("window:close", { id: opts.id });
          if (opts.onClose) opts.onClose(win);
        },
        minimize: function () { el.classList.toggle("is-min"); },
        toggleMax: function () { el.classList.toggle("is-max"); win.focus(); }
      };
      wins[opts.id] = win;

      closeBtn.addEventListener("click", win.close);
      minBtn.addEventListener("click", win.minimize);
      maxBtn.addEventListener("click", win.toggleMax);
      title.addEventListener("dblclick", function (e) { if (!e.target.closest("button")) win.toggleMax(); });
      el.addEventListener("mousedown", function () { win.focus(); });

      /* drag by title bar */
      title.addEventListener("pointerdown", function (e) {
        if (e.target.closest("button") || el.classList.contains("is-max")) return;
        var sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
        function move(ev) {
          el.style.left = Math.max(0, ox + ev.clientX - sx) + "px";
          el.style.top = Math.max(0, oy + ev.clientY - sy) + "px";
        }
        function up() { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); }
        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", up);
      });

      if (opts.build) opts.build(body, win);
      win.focus();
      bus.emit("window:open", { id: opts.id });
      return win;
    }

    return {
      create: create,
      get: function (id) { return wins[id] || null; },
      isOpen: function (id) { return !!(wins[id] && wins[id].isOpen); },
      list: function () { return Object.keys(wins).map(function (k) { return wins[k]; }); }
    };
  }

  /* "not enabled in the simulation" message inside a window */
  FSIM.core.toast = function (root, text) {
    var old = root.querySelector(".sim-toast"); if (old) old.remove();
    var t = h("div.sim-toast", { role: "status", text: text });
    root.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 4500);
  };

  /* Shared menu bar: menus = { File: [["Label", "key"|null, {checked?}], ["-"]] }. Items without a key are shown
     disabled (CLAUDE.md §8: unused elements stay visible but inactive). onPick(menu, key, label) fires for enabled ones. */
  FSIM.core.menubar = function (root, menus, onPick, isChecked) {
    var bar = h("div.menubar", { role: "menubar" }), open = null;
    function close() { if (open) { open.pop.remove(); open.btn.setAttribute("aria-expanded", "false"); open = null; } }
    Object.keys(menus).forEach(function (name) {
      var btn = h("button", { type: "button", role: "menuitem", "aria-haspopup": "true", "aria-expanded": "false", text: name });
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (open && open.btn === btn) { close(); return; }
        close();
        var pop = h("div.menu-pop", { role: "menu" });
        menus[name].forEach(function (it) {
          if (it[0] === "-") { pop.appendChild(h("div.menu-sep")); return; }
          var chk = it[1] && isChecked ? isChecked(name, it[1]) : null;
          var el = h("button.menu-item", { type: "button", role: chk === null ? "menuitem" : "menuitemcheckbox", "aria-checked": chk === null ? false : String(!!chk), "aria-disabled": it[1] ? false : "true" },
            h("span.chk", { text: chk ? "✓" : "" }), it[0]);
          el.addEventListener("click", function (ev) {
            ev.stopPropagation(); close();
            if (it[1]) onPick(name, it[1], it[0]); else FSIM.core.toast(root, "غير مفعّل في المحاكاة");
          });
          pop.appendChild(el);
        });
        pop.style.insetInlineStart = btn.offsetLeft + "px";
        bar.appendChild(pop); btn.setAttribute("aria-expanded", "true"); open = { pop: pop, btn: btn };
      });
      bar.appendChild(btn);
    });
    root.addEventListener("click", close);
    return bar;
  };

  /* Generic sortable grid used by TCPView / Procmon / RAMMap / Event Viewer.
     opts: { columns:[names], rows:[{key, cls, cells:[text], data}], onSelect(row), sortable, label } → { el, setRows, select } */
  FSIM.core.grid = function (opts) {
    var sort = null, rows = opts.rows || [], selected = null;
    var table = h("table.gr-table", { role: "grid", "aria-label": opts.label || "table" });
    var tr = h("tr");
    opts.columns.forEach(function (c, i) {
      var th = h("th", { scope: "col", "aria-sort": "none", text: c });
      if (opts.sortable !== false) th.addEventListener("click", function () { doSort(i); });
      tr.appendChild(th);
    });
    table.appendChild(h("thead", tr));
    var tbody = h("tbody"); table.appendChild(tbody);
    var wrap = h("div.gr-wrap", { tabindex: "0", role: "region", "aria-label": opts.label || "table" }, table);
    function num(v) { var n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? null : n; }
    function doSort(i) {
      var dir = sort && sort.col === i ? -sort.dir : (opts.firstDesc && opts.firstDesc.indexOf(opts.columns[i]) >= 0 ? -1 : 1);
      sort = { col: i, dir: dir };
      Array.prototype.forEach.call(tr.children, function (th, k) { th.setAttribute("aria-sort", k === i ? (dir > 0 ? "ascending" : "descending") : "none"); th.textContent = opts.columns[k] + (k === i ? (dir > 0 ? " ▲" : " ▼") : ""); });
      if (opts.onSort) opts.onSort(opts.columns[i], dir);
      render();
    }
    function render() {
      tbody.textContent = "";
      var list = rows.slice();
      if (sort) list.sort(function (a, b) {
        var x = a.cells[sort.col], y = b.cells[sort.col], nx = num(x), ny = num(y);
        if (nx !== null && ny !== null) return (nx - ny) * sort.dir;
        return String(x) < String(y) ? -sort.dir : String(x) > String(y) ? sort.dir : 0;
      });
      list.forEach(function (r) {
        var row = h("tr.gr-row" + (r.cls ? "." + r.cls : "") + (selected === r.key ? ".is-selected" : ""), { "data-key": r.key, "aria-selected": selected === r.key ? "true" : "false" },
          r.cells.map(function (c) { return h("td", { text: c === null || c === undefined ? "" : String(c) }); }));
        row.addEventListener("click", function () { pick(r); });
        tbody.appendChild(row);
      });
    }
    function pick(r) {
      selected = r.key;
      Array.prototype.forEach.call(tbody.children, function (e) { var on = e.getAttribute("data-key") === r.key; e.classList.toggle("is-selected", on); e.setAttribute("aria-selected", on ? "true" : "false"); });
      if (opts.onSelect) opts.onSelect(r);
    }
    wrap.addEventListener("keydown", function (ev) {
      if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") return;
      var els = Array.prototype.slice.call(tbody.children); if (!els.length) return;
      var i = els.findIndex(function (e) { return e.classList.contains("is-selected"); });
      i = ev.key === "ArrowDown" ? Math.min(els.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1);
      ev.preventDefault();
      var key = els[i].getAttribute("data-key");
      pick(rows.filter(function (r) { return r.key === key; })[0]); els[i].scrollIntoView({ block: "nearest" });
    });
    render();
    return {
      el: wrap, tbody: tbody,
      setRows: function (r) { rows = r; if (selected && !r.some(function (x) { return x.key === selected; })) selected = null; render(); },
      select: function (key) { var r = rows.filter(function (x) { return x.key === key; })[0]; if (r) pick(r); },
      sortBy: doSort, selected: function () { return selected; }
    };
  };

  /* MD5 (RFC 1321) for the interactive hash demo — pure JS, UTF-8 input. */
  var MD5_S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  var MD5_K = []; for (var mi = 0; mi < 64; mi++) MD5_K[mi] = Math.floor(Math.abs(Math.sin(mi + 1)) * 4294967296) | 0;
  FSIM.core.md5 = function (str) {
    var bytes = Array.prototype.slice.call(new TextEncoder().encode(String(str)));
    var len = bytes.length;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var lo = (len * 8) >>> 0, hi = Math.floor(len / 536870912) >>> 0;
    for (var i = 0; i < 4; i++) bytes.push((lo >>> (8 * i)) & 255);
    for (i = 0; i < 4; i++) bytes.push((hi >>> (8 * i)) & 255);
    var a0 = 0x67452301 | 0, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476 | 0;
    for (var off = 0; off < bytes.length; off += 64) {
      var M = [];
      for (i = 0; i < 16; i++) M[i] = bytes[off + 4 * i] | (bytes[off + 4 * i + 1] << 8) | (bytes[off + 4 * i + 2] << 16) | (bytes[off + 4 * i + 3] << 24);
      var A = a0, B = b0, C = c0, D = d0, F, g;
      for (i = 0; i < 64; i++) {
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * i) % 16; }
        F = (F + A + MD5_K[i] + M[g]) | 0;
        A = D; D = C; C = B;
        B = (B + ((F << MD5_S[i]) | (F >>> (32 - MD5_S[i])))) | 0;
      }
      a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
    }
    return [a0, b0, c0, d0].map(function (w) { var o = ""; for (var k = 0; k < 4; k++) o += ("0" + ((w >>> (8 * k)) & 255).toString(16)).slice(-2); return o; }).join("");
  };

  /* Wizard dialog inside a tool window: steps = [{ title, build(el, st, refresh), canNext(st), nextLabel?, onNext?(st) }].
     State object `st` is shared; Back / Next / Cancel like the real installers. */
  FSIM.core.wizard = function (root, cfg) {
    var st = cfg.state || {}, idx = 0, back = h("div.dlg-back");
    var body = h("div.wiz-body"), title = h("h4"), btnBack = h("button", { type: "button", text: "< Back" }), btnNext = h("button", { type: "button" }), btnCancel = h("button", { type: "button", text: "Cancel" });
    var dlg = h("div.dlg.wiz", { role: "dialog", "aria-modal": "true", "aria-label": cfg.ariaLabel || cfg.title }, title, body, h("div.dlg-btns", btnBack, btnNext, btnCancel));
    back.appendChild(dlg); root.appendChild(back);
    function close() { back.remove(); }
    function refresh() {
      var step = cfg.steps[idx];
      btnBack.disabled = idx === 0;
      btnNext.textContent = step.nextLabel || (idx === cfg.steps.length - 1 ? "Finish" : "Next >");
      btnNext.disabled = step.canNext ? !step.canNext(st) : false;
    }
    function render() {
      var step = cfg.steps[idx];
      title.textContent = step.title; body.textContent = "";
      step.build(body, st, refresh);
      refresh();
      if (cfg.onStep) cfg.onStep(idx, step, st);
    }
    btnBack.addEventListener("click", function () { if (idx > 0) { idx--; render(); } });
    btnNext.addEventListener("click", function () {
      var step = cfg.steps[idx];
      if (step.onNext && step.onNext(st) === false) return;
      if (idx === cfg.steps.length - 1) { close(); if (cfg.onFinish) cfg.onFinish(st); } else { idx++; render(); }
    });
    btnCancel.addEventListener("click", function () { close(); if (cfg.onCancel) cfg.onCancel(st); });
    render();
    return { close: close, state: st, el: dlg };
  };

  /* Progress dialog with a "speed up" button (CLAUDE.md §8). rows = [[label, value]]; resolves true on completion, false on Cancel. */
  FSIM.core.runProgress = function (root, cfg) {
    return new Promise(function (resolve) {
      var fill = h("i"), pct = h("span", { text: "0%" }), rowsEl = h("div.prog-rows");
      (cfg.rows || []).forEach(function (r) { rowsEl.appendChild(h("div.prog-row", h("b", { text: r[0] + ":" }), h("span", { text: r[1] }))); });
      var speed = h("button.dlg-btn", { type: "button", text: "Speed up (محاكاة)" }), cancel = h("button.dlg-btn", { type: "button", text: "Cancel" });
      var total = FSIM.core.config.fast ? 120 : (cfg.ms || 5000), start = Date.now(), factor = 1, timer;
      var dlg = h("div.dlg", { role: "dialog", "aria-modal": "true", "aria-label": cfg.title }, h("h4", { text: cfg.title }), rowsEl,
        h("div.pbar", { role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" }, fill), pct, h("div.dlg-btns", speed, cancel));
      var back = h("div.dlg-back", dlg); root.appendChild(back);
      var done = 0;
      function tick() {
        done += (50 * factor) / total; if (done > 1) done = 1;
        var p = Math.round(done * 100);
        fill.style.inlineSize = p + "%"; pct.textContent = p + "%"; dlg.querySelector(".pbar").setAttribute("aria-valuenow", String(p));
        if (cfg.onTick) cfg.onTick(p, dlg);
        if (done >= 1) { clearInterval(timer); back.remove(); resolve(true); }
      }
      timer = setInterval(tick, 50);
      speed.addEventListener("click", function () { factor = 12; });
      cancel.addEventListener("click", function () { clearInterval(timer); back.remove(); resolve(false); });
    });
  };

  FSIM.core.windows = { Stage: Stage };
})();
