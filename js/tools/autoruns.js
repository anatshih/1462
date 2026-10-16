/* FSIM.tools.autoruns — Sysinternals Autoruns (Logon / Scheduled Tasks) + the "Sysinternals" folder that launches it.
   Layout follows docs/ui-reference.md §4; data from FSIM.data.case.autoruns (outputs-spec §د-1). */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;
  FSIM.core.sim = FSIM.core.sim || { state: "healthy" };

  /* real tab order (⚠️ from general knowledge, ui-reference §4) */
  var TABS = ["Everything", "Logon", "Explorer", "Internet Explorer", "Scheduled Tasks", "Services", "Drivers", "Codecs", "Boot Execute", "Image Hijacks", "AppInit", "KnownDLLs", "Winlogon", "Winsock Providers", "Print Monitors", "LSA Providers", "Network Providers", "WMI", "Office"];
  var ON_TABS = { "Everything": 1, "Logon": 1, "Scheduled Tasks": 1 };
  var COLS = ["Autorun Entry", "Description", "Publisher", "Image Path", "Timestamp", "VirusTotal"];
  var MENUS = {
    File: [["Open…"], ["Save"], ["Compare…"], ["Run…"], ["-"], ["Refresh"], ["-"], ["Exit"]],
    Entry: [["Jump to Entry…", "jump"], ["Jump to Image…"], ["-"], ["Delete", "delete"], ["Properties", "props"], ["Process Explorer…", "pe"]],
    Category: TABS.map(function (t) { return [t]; }),
    Options: [["Hide Empty Locations", "opt"], ["Hide Microsoft Entries", "opt"], ["Hide Windows Entries", "opt"], ["-"], ["Scan Options…", "scan"]],
    User: [["…"]],
    Help: [["About Autoruns"]]
  };

  function toast(root, text) {
    var old = root.querySelector(".sim-toast"); if (old) old.remove();
    var t = h("div.sim-toast", { role: "status", text: text });
    root.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 4500);
  }

  /* ---------- Autoruns window ---------- */
  function buildAutoruns(body, win) {
    var data = FSIM.data.case.autoruns;
    var s = { tab: "Everything", selected: null, filter: "", sort: null, opts: { "Hide Empty Locations": true, "Hide Microsoft Entries": false, "Hide Windows Entries": false } };
    var root = h("div.ar"), openMenu = null;
    body.appendChild(root);

    /* menu bar */
    var bar = h("div.menubar", { role: "menubar" });
    Object.keys(MENUS).forEach(function (name) {
      var btn = h("button", { type: "button", role: "menuitem", "aria-haspopup": "true", "aria-expanded": "false", text: name });
      btn.addEventListener("click", function (e) { e.stopPropagation(); toggleMenu(name, btn); });
      bar.appendChild(btn);
    });
    root.appendChild(bar);

    function closeMenu() {
      if (openMenu) { openMenu.pop.remove(); openMenu.btn.setAttribute("aria-expanded", "false"); openMenu = null; }
    }
    function toggleMenu(name, btn) {
      if (openMenu && openMenu.btn === btn) { closeMenu(); return; }
      closeMenu();
      var pop = h("div.menu-pop", { role: "menu" });
      MENUS[name].forEach(function (it) {
        if (it[0] === "-") { pop.appendChild(h("div.menu-sep")); return; }
        var kind = it[1] || "off";
        var checked = kind === "opt" && s.opts[it[0]];
        var el = h("button.menu-item", { type: "button", role: kind === "opt" ? "menuitemcheckbox" : "menuitem", "aria-checked": kind === "opt" ? String(!!checked) : false, "aria-disabled": kind === "off" ? "true" : false },
          h("span.chk", { text: checked ? "✓" : "" }), it[0]);
        el.addEventListener("click", function (e) { e.stopPropagation(); closeMenu(); onMenu(name, it); });
        pop.appendChild(el);
      });
      pop.style.insetInlineStart = btn.offsetLeft + "px";
      bar.appendChild(pop);
      btn.setAttribute("aria-expanded", "true");
      openMenu = { pop: pop, btn: btn };
    }
    root.addEventListener("click", closeMenu);

    function onMenu(menu, it) {
      var kind = it[1] || "off";
      if (kind === "opt") { s.opts[it[0]] = !s.opts[it[0]]; bus.emit("autoruns:option", { name: it[0], value: s.opts[it[0]] }); render(); return; }
      if (menu === "Category") { toast(root, "اختر التبويب بالنقر عليه في الشريط أعلى القائمة."); return; }
      if (kind === "delete") { toast(root, "المحقق يوثّق الدليل ولا يغيّره: حذف المدخل يعدّل الجهاز المفحوص، لذلك هو معطّل في المحاكاة. سجّل ما وجدت أولاً."); bus.emit("autoruns:delete", {}); return; }
      if (kind === "props") { showProps(); return; }
      if (kind === "jump") { toast(root, "«Jump to Entry…» يفتح محرر السجل في Windows الحقيقي؛ غير مفعّل في المحاكاة (ولا تعدّل السجل على الجهاز الأصلي)."); return; }
      toast(root, "غير مفعّل في المحاكاة");
    }

    /* toolbar + tabs */
    var qf = h("input", { type: "text", "aria-label": "Quick Filter", placeholder: "Quick Filter", spellcheck: "false" });
    qf.addEventListener("input", function () { s.filter = qf.value; bus.emit("autoruns:filter", { text: qf.value }); render(); });
    root.appendChild(h("div.ar-toolbar", h("label", { text: "Quick Filter:" }), qf));

    var tabs = h("div.ar-tabs", { role: "tablist", "aria-label": "Autoruns categories" });
    TABS.forEach(function (t) {
      var b = h("button.ar-tab" + (ON_TABS[t] ? "" : ".is-off"), { type: "button", role: "tab", "aria-selected": t === s.tab ? "true" : "false", text: t, "data-tab": t });
      b.addEventListener("click", function () { selectTab(t); });
      tabs.appendChild(b);
    });
    root.appendChild(tabs);

    /* grid */
    var grid = h("div.ar-grid", { tabindex: "0", role: "region", "aria-label": "Autorun entries" });
    var table = h("table.ar-table", { role: "grid" });
    var thead = h("thead"), tr = h("tr");
    COLS.forEach(function (c, i) {
      var th = h("th", { scope: "col", "data-col": String(i), "aria-sort": "none", text: c });
      th.addEventListener("click", function () { sortBy(i); });
      tr.appendChild(th);
    });
    thead.appendChild(tr); table.appendChild(thead);
    var tbody = h("tbody"); table.appendChild(tbody);
    grid.appendChild(table);
    var empty = h("div.ar-empty", { hidden: "" });
    grid.appendChild(empty);
    root.appendChild(grid);
    var status = h("div.ar-status", { text: "Ready." });
    root.appendChild(status);

    function selectTab(t) {
      s.tab = t;
      Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute("aria-selected", b.getAttribute("data-tab") === t ? "true" : "false"); });
      s.selected = null;
      bus.emit("autoruns:tab", { tab: t });
      render();
    }
    function sortBy(i) {
      if (s.sort && s.sort.col === i) s.sort.dir = -s.sort.dir; else s.sort = { col: i, dir: 1 };
      Array.prototype.forEach.call(tr.children, function (th, idx) { th.setAttribute("aria-sort", s.sort && s.sort.col === idx ? (s.sort.dir > 0 ? "ascending" : "descending") : "none"); th.textContent = COLS[idx] + (s.sort && s.sort.col === idx ? (s.sort.dir > 0 ? " ▲" : " ▼") : ""); });
      bus.emit("autoruns:sort", { col: COLS[i] });
      render();
    }

    function groupsFor(tab, state) {
      var g = [];
      if (tab === "Everything" || tab === "Logon") g = g.concat(data.logon);
      if (tab === "Everything" || tab === "Scheduled Tasks") g = g.concat(data.scheduledTasks);
      return g.map(function (grp) {
        var time = typeof grp.time === "object" ? grp.time[state] : grp.time;
        var entries = grp.entries.filter(function (e) { return !e.onlyIn || e.onlyIn === state; });
        return { header: grp.header, time: time, entries: entries };
      });
    }
    function visible(e) {
      var pub = e.publisher || "";
      if (s.opts["Hide Microsoft Entries"] && /^\(Verified\) Microsoft/.test(pub)) return false;
      if (s.opts["Hide Windows Entries"] && /^\(Verified\) Microsoft Windows/.test(pub)) return false;
      if (s.filter) {
        var q = s.filter.toLowerCase();
        if ([e.name, e.desc, e.publisher, e.path].join("\u0001").toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    }
    function cell(e, i) { return [e.name, e.desc, e.publisher, e.path, e.time, ""][i]; }

    function render() {
      tbody.textContent = "";
      var state = FSIM.core.sim.state;
      var off = !ON_TABS[s.tab];
      empty.hidden = !off;
      table.hidden = off;
      if (off) { empty.textContent = "هذا التبويب (" + s.tab + ") غير مفعّل في المحاكاة. المحاكاة تعرض تبويبات Logon و Scheduled Tasks و Everything."; status.textContent = "Ready."; return; }
      var shown = 0;
      groupsFor(s.tab, state).forEach(function (g) {
        var es = g.entries.filter(visible);
        if (s.sort) es.sort(function (a, b) { var x = cell(a, s.sort.col), y = cell(b, s.sort.col); return x < y ? -s.sort.dir : x > y ? s.sort.dir : 0; });
        if (!es.length && (s.opts["Hide Empty Locations"] || s.filter)) return;
        tbody.appendChild(h("tr.ar-header", h("td", { colspan: "4", text: g.header }), h("td", { text: g.time || "" }), h("td")));
        es.forEach(function (e) {
          shown++;
          var cb = h("input", { type: "checkbox", checked: "", "aria-label": "Enable " + e.name, tabindex: "-1" });
          cb.checked = true;
          cb.addEventListener("click", function (ev) {
            ev.preventDefault(); ev.stopPropagation();
            toast(root, "تعطيل مدخل من Autoruns يغيّر الجهاز المفحوص. المحقق لا يغيّر الدليل: وثّق أولاً. (معطّل في المحاكاة)");
          });
          var row = h("tr.ar-row" + (e.cls ? ".is-" + e.cls : "") + (s.selected === e.key ? ".is-selected" : ""), { "data-key": e.key, "aria-selected": s.selected === e.key ? "true" : "false" },
            h("td.c-entry", h("div.ar-ent", cb, h("span.ar-name", { text: e.name }))),
            h("td", { text: e.desc }), h("td", { text: e.publisher }), h("td", { text: e.path }), h("td", { text: e.time }), h("td"));
          row.addEventListener("click", function () { pick(e.key, e.name); });
          tbody.appendChild(row);
        });
      });
      status.textContent = "Ready." + (s.opts["Hide Microsoft Entries"] ? "  Microsoft entries hidden." : "") + (s.opts["Hide Windows Entries"] ? "  Windows entries hidden." : "");
      if (!shown) { empty.hidden = false; empty.textContent = "لا توجد مدخلات مطابقة."; }
    }

    function pick(key, name) {
      s.selected = key;
      Array.prototype.forEach.call(tbody.querySelectorAll("tr.ar-row"), function (r) {
        var on = r.getAttribute("data-key") === key;
        r.classList.toggle("is-selected", on);
        r.setAttribute("aria-selected", on ? "true" : "false");
      });
      bus.emit("autoruns:select", { key: key, name: name || key });
    }

    grid.addEventListener("keydown", function (ev) {
      if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") return;
      var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr.ar-row"));
      if (!rows.length) return;
      var i = rows.findIndex(function (r) { return r.classList.contains("is-selected"); });
      i = ev.key === "ArrowDown" ? Math.min(rows.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1);
      ev.preventDefault();
      var r = rows[i]; pick(r.getAttribute("data-key"));
      r.scrollIntoView({ block: "nearest" });
    });

    function allEntries() { return groupsFor("Everything", FSIM.core.sim.state).reduce(function (a, g) { return a.concat(g.entries); }, []); }
    function showProps() {
      if (!s.selected) { toast(root, "اختر مدخلاً أولاً ثم Entry ▸ Properties."); return; }
      var e = allEntries().filter(function (x) { return x.key === s.selected; })[0];
      if (!e) return;
      var old = root.querySelector(".ar-prop"); if (old) old.remove();
      var closeBtn = h("button", { type: "button", text: "Close" });
      var pane = h("div.ar-prop", { role: "dialog", "aria-label": "Properties" },
        h("div", { text: "Name: " + e.name }), h("div", { text: "Description: " + e.desc }), h("div", { text: "Publisher: " + e.publisher }),
        h("div", { text: "Image Path: " + e.path }), h("div", { text: "Timestamp: " + e.time }), h("p"), closeBtn);
      closeBtn.addEventListener("click", function () { pane.remove(); });
      root.appendChild(pane);
      bus.emit("autoruns:properties", { key: e.key });
    }

    bus.on("sim:state", function () { s.selected = null; render(); });
    render();

    body.api = {
      selectTab: selectTab,
      select: function (key) { pick(key); },
      setOption: function (name, val) { s.opts[name] = val; bus.emit("autoruns:option", { name: name, value: val }); render(); },
      setFilter: function (t) { qf.value = t; s.filter = t; bus.emit("autoruns:filter", { text: t }); render(); },
      state: s,
      /* rows for the interpretation phase */
      visibleRows: function () { return Array.prototype.map.call(tbody.querySelectorAll("tr.ar-row"), function (r) { return r.getAttribute("data-key"); }); }
    };
  }

  function openAutoruns(stage, opts) {
    opts = opts || {};
    return stage.create({
      id: "autoruns", title: "Autoruns - Sysinternals: www.sysinternals.com", icon: "autoruns", skin: "win",
      width: opts.width || 840, height: opts.height || 470, x: opts.x != null ? opts.x : 40, y: opts.y != null ? opts.y : 40,
      build: buildAutoruns
    });
  }

  /* ---------- Sysinternals folder (launcher) ---------- */
  var FILES = [
    { name: "Autoruns64.exe", type: "Application", tool: "autoruns" },
    { name: "Procmon64.exe", type: "Application", tool: "procmon" },
    { name: "RAMMap64.exe", type: "Application", tool: "rammap" },
    { name: "Tcpview64.exe", type: "Application", tool: "tcpview" }
  ];
  function openFolder(stage, launch, enabled) {
    enabled = enabled || ["autoruns"];
    return stage.create({
      id: "folder", title: "Sysinternals", icon: "folder", skin: "win", width: 520, height: 196, x: 20, y: 12,
      build: function (body) {
        var selected = null;
        var list = h("div.fx-list", { role: "listbox", "aria-label": "Sysinternals files" });
        var foot = h("div.fx-foot", { text: FILES.length + " items" });
        FILES.forEach(function (f) {
          var on = enabled.indexOf(f.tool) >= 0;
          var row = h("button.fx-row" + (on ? "" : ".is-disabled"), { type: "button", role: "option", "aria-selected": "false", "data-tool": f.tool, title: on ? "انقر نقراً مزدوجاً (أو Enter) للتشغيل" : "غير مفعّل في هذا الدرس" },
            h("span.fx-name", FSIM.core.icons.get("exe"), f.name), h("span", { text: f.type }), h("span"));
          row.addEventListener("click", function () {
            selected = f;
            Array.prototype.forEach.call(list.children, function (r) { var is = r === row; r.classList.toggle("is-selected", is); r.setAttribute("aria-selected", is ? "true" : "false"); });
            foot.textContent = "1 item selected" + (on ? "" : " — غير مفعّل في المحاكاة");
          });
          function run() { if (!on) { toast(body, "غير مفعّل في المحاكاة: هذا البرنامج ليس مطلوباً في هذا الدرس."); return; } launch(f.tool); }
          row.addEventListener("dblclick", run);
          row.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); run(); } });
          list.appendChild(row);
        });
        body.appendChild(h("div.fx",
          h("div.fx-bar", h("span", { text: "📁" }), h("div.fx-path", { text: "This PC › Downloads › Sysinternals" })),
          h("div.fx-head", h("span", { text: "Name" }), h("span", { text: "Type" }), h("span")),
          list, foot));
      }
    });
  }

  FSIM.tools.autoruns = {
    id: "autoruns", open: openAutoruns, openFolder: openFolder,
    /* rows (with colours) for interpretation highlighting, per sim state */
    entriesFor: function (tab, state) {
      var g = [];
      if (tab === "Logon") g = FSIM.data.case.autoruns.logon; else if (tab === "Scheduled Tasks") g = FSIM.data.case.autoruns.scheduledTasks;
      return g.map(function (grp) { return { header: grp.header, time: typeof grp.time === "object" ? grp.time[state] : grp.time, entries: grp.entries.filter(function (e) { return !e.onlyIn || e.onlyIn === state; }) }; });
    }
  };
})();
