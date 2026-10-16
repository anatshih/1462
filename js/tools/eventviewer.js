/* FSIM.tools.eventviewer — Event Viewer, Security log (docs/ui-reference.md §5; data outputs-spec §هـ).
   Real filtering via "Filter Current Log…" on <All Event IDs> ("4625", "4624,4625", "4624-4625"). */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;
  var COLS = ["Keywords", "Date and Time", "Source", "Event ID", "Task Category"];
  var TREE = [["Event Viewer (Local)", 0, null], ["Custom Views", 1, null], ["Windows Logs", 1, null], ["Application", 2, "Application"], ["Security", 2, "Security"], ["Setup", 2, "Setup"], ["System", 2, "System"], ["Forwarded Events", 2, "Forwarded Events"], ["Applications and Services Logs", 1, null], ["Subscriptions", 1, null]];
  var ACTIONS = [["Open Saved Log…"], ["Create Custom View…"], ["Import Custom View…"], ["Clear Log…"], ["Filter Current Log…", "filter"], ["Properties"], ["Find…"], ["Save All Events As…"]];

  var LOGON_TYPE = { fail: 3, "logon-breach": 3, "logon-local": 2 };
  function parseIds(text) {
    var out = [];
    String(text || "").split(",").forEach(function (part) {
      var m = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(part);
      if (m) { for (var i = +m[1]; i <= +m[2] && i - +m[1] < 5000; i++) out.push(i); }
      else if (/^\s*\d+\s*$/.test(part)) out.push(+part);
    });
    return out.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
  }

  /* General-tab text for one event (outputs-spec §هـ). 4672 / 4634 only carry a headline (details not in the spec). */
  function message(ev) {
    var c = FSIM.data.case;
    if (ev.kind === "fail") {
      return ["An account failed to log on.", "", "Subject:", "\tSecurity ID:\t\tNULL SID", "\tAccount Name:\t\t-", "\tAccount Domain:\t\t-", "\tLogon ID:\t\t0x0", "",
        "Logon Type:\t\t\t3", "", "Account For Which Logon Failed:", "\tSecurity ID:\t\tNULL SID", "\tAccount Name:\t\t" + c.user, "\tAccount Domain:\t\t" + c.hostName, "",
        "Failure Information:", "\tFailure Reason:\t\tUnknown user name or bad password.", "\tStatus:\t\t\t0xC000006D", "\tSub Status:\t\t0xC000006A", "",
        "Process Information:", "\tCaller Process ID:\t0x0", "\tCaller Process Name:\t-", "", "Network Information:", "\tWorkstation Name:\t" + c.attackerName, "\tSource Network Address:\t" + c.attackerIP, "\tSource Port:\t\t0", "",
        "Detailed Authentication Information:", "\tLogon Process:\t\tNtLmSsp ", "\tAuthentication Package:\tNTLM", "\tTransited Services:\t-", "\tPackage Name (NTLM only):\t-", "\tKey Length:\t\t0"];
    }
    if (ev.kind === "logon-breach") {
      return ["An account was successfully logged on.", "", "Subject:", "\tSecurity ID:\t\tNULL SID", "\tAccount Name:\t\t-", "\tAccount Domain:\t\t-", "\tLogon ID:\t\t0x0", "",
        "Logon Information:", "\tLogon Type:\t\t3", "\tRestricted Admin Mode:\t-", "\tVirtual Account:\t\tNo", "\tElevated Token:\t\tNo", "", "Impersonation Level:\t\tImpersonation", "",
        "New Logon:", "\tSecurity ID:\t\t" + c.hostName + "\\" + c.user, "\tAccount Name:\t\t" + c.user, "\tAccount Domain:\t\t" + c.hostName, "\tLogon ID:\t\t0x3A41F2", "",
        "Process Information:", "\tProcess ID:\t\t0x0", "\tProcess Name:\t\t-", "", "Network Information:", "\tWorkstation Name:\t" + c.attackerName, "\tSource Network Address:\t" + c.attackerIP, "\tSource Port:\t\t0", "",
        "Detailed Authentication Information:", "\tLogon Process:\t\tNtLmSsp ", "\tAuthentication Package:\tNTLM", "\tTransited Services:\t-", "\tPackage Name (NTLM only):\t-", "\tKey Length:\t\t128"];
    }
    if (ev.kind === "logon-local") {
      return ["An account was successfully logged on.", "", "Subject:", "\tSecurity ID:\t\tNULL SID", "\tAccount Name:\t\t-", "\tAccount Domain:\t\t-", "\tLogon ID:\t\t0x0", "",
        "Logon Information:", "\tLogon Type:\t\t2", "\tRestricted Admin Mode:\t-", "\tVirtual Account:\t\tNo", "\tElevated Token:\t\tNo", "", "Impersonation Level:\t\tImpersonation", "",
        "New Logon:", "\tSecurity ID:\t\t" + c.hostName + "\\" + c.user, "\tAccount Name:\t\t" + c.user, "\tAccount Domain:\t\t" + c.hostName, "",
        "Process Information:", "", "Network Information:", "\tWorkstation Name:\t" + c.hostName, "\tSource Network Address:\t127.0.0.1", "\tSource Port:\t\t0", "",
        "Detailed Authentication Information:", "\tLogon Process:\t\tUser32", "\tAuthentication Package:\tNegotiate"];
    }
    return [ev.kind === "special" ? "Special privileges assigned to new logon." : "An account was logged off.", "", "(تفاصيل هذا الحدث غير مدرجة في المحاكاة.)"];
  }

  function filtered(ids) { return FSIM.data.case.events.filter(function (e) { return !ids.length || ids.indexOf(e.id) >= 0; }); }
  function rowsOf(list) {
    return list.map(function (e) { return { key: e.time + "|" + e.id, ev: e, cls: e.kw === "Audit Failure" ? "is-fail" : "is-ok", cells: [e.kw, e.time, FSIM.data.case.eventSource, e.id, e.cat] }; });
  }

  function build(body, win) {
    var c = FSIM.data.case;
    var s = { log: null, ids: [], idsText: "" };
    var root = h("div.ar"); body.appendChild(root);
    root.appendChild(FSIM.core.menubar(root, { File: [["Open Saved Log…"], ["Exit"]], Action: [["Filter Current Log…", "filter"]], View: [["Add/Remove Columns…"]], Help: [["Event Viewer Help"]] },
      function (menu, key) { if (key === "filter") openFilter(); }));
    var layout = h("div.ev"); root.appendChild(layout);

    /* tree */
    var tree = h("div.ev-tree", { role: "tree", "aria-label": "Event Viewer tree" });
    TREE.forEach(function (n) {
      var b = h("button.lvl" + n[1], { type: "button", role: "treeitem", "aria-selected": "false", "data-log": n[2] || false, text: (n[1] === 2 ? "" : n[1] === 1 && !n[2] ? "▸ " : "") + n[0] });
      if (n[2]) b.addEventListener("click", function () { selectLog(n[2], b); });
      else b.addEventListener("click", function () { FSIM.core.toast(root, "غير مفعّل في المحاكاة: اختر Windows Logs ثم Security."); });
      tree.appendChild(b);
    });
    layout.appendChild(tree);

    /* centre */
    var head = h("div.ev-head", { text: "" });
    var gridHost = h("div", { class: "gr-holder" }); gridHost.style.display = "flex"; gridHost.style.flex = "1"; gridHost.style.minHeight = "0"; gridHost.style.flexDirection = "column";
    var grid = FSIM.core.grid({ columns: COLS, rows: [], label: "Security events", sortable: false, onSelect: function (r) { showEvent(r.ev); bus.emit("eventviewer:select", { id: r.ev.id, time: r.ev.time, logonType: LOGON_TYPE[r.ev.kind] || 0 }); } });
    gridHost.appendChild(grid.el);
    var ptitle = h("div.ev-ptitle", { text: "Select an event to see its details." });
    var tabGeneral = h("button", { type: "button", role: "tab", "aria-selected": "true", text: "General" });
    var tabDetails = h("button", { type: "button", role: "tab", "aria-selected": "false", text: "Details" });
    var pbody = h("div.ev-pbody");
    var current = null, ptab = "General";
    function renderPreview() {
      pbody.textContent = "";
      if (!current) return;
      if (ptab === "Details") { pbody.appendChild(h("p.ev-note", { text: "عرض Details (Friendly View / XML View) غير مفعّل في المحاكاة؛ استخدم تبويب General." })); return; }
      pbody.appendChild(h("pre", { text: message(current).join("\n") }));
      pbody.appendChild(h("div.ev-fields",
        h("b", { text: "Log Name:" }), h("span", { text: "Security" }), h("b", { text: "Source:" }), h("span", { text: c.eventSource }),
        h("b", { text: "Event ID:" }), h("span", { text: String(current.id) }), h("b", { text: "Level:" }), h("span", { text: "Information" }),
        h("b", { text: "User:" }), h("span", { text: "N/A" }), h("b", { text: "OpCode:" }), h("span", { text: "Info" }),
        h("b", { text: "Logged:" }), h("span", { text: current.time }), h("b", { text: "Task Category:" }), h("span", { text: current.cat }),
        h("b", { text: "Keywords:" }), h("span", { text: current.kw }), h("b", { text: "Computer:" }), h("span", { text: c.hostName })));
    }
    function showEvent(ev) { current = ev; ptitle.textContent = "Event " + ev.id + ", " + c.eventSource; renderPreview(); }
    [[tabGeneral, "General"], [tabDetails, "Details"]].forEach(function (p) {
      p[0].addEventListener("click", function () { ptab = p[1]; tabGeneral.setAttribute("aria-selected", String(ptab === "General")); tabDetails.setAttribute("aria-selected", String(ptab === "Details")); bus.emit("eventviewer:tab", { tab: ptab }); renderPreview(); });
    });
    var preview = h("div.ev-preview", ptitle, h("div.ev-ptabs", { role: "tablist" }, tabGeneral, tabDetails), pbody);
    layout.appendChild(h("div.ev-center", head, gridHost, preview));

    /* actions */
    var actions = h("div.ev-actions", { "aria-label": "Actions" });
    layout.appendChild(actions);
    function renderActions() {
      actions.textContent = "";
      actions.appendChild(h("h5", { text: s.log || "Event Viewer (Local)" }));
      ACTIONS.concat(s.ids.length ? [["Clear Filter", "clear"]] : []).forEach(function (a) {
        var on = !!a[1] && !!s.log;
        var b = h("button", { type: "button", "aria-disabled": on ? false : "true", text: a[0], "data-act": a[1] || false });
        b.addEventListener("click", function () { if (!on) { FSIM.core.toast(root, a[1] ? "اختر سجلاً أولاً (Windows Logs ← Security)." : "غير مفعّل في المحاكاة"); return; } if (a[1] === "filter") openFilter(); else if (a[1] === "clear") { s.ids = []; s.idsText = ""; refresh(); bus.emit("eventviewer:filter", { ids: "", count: filtered([]).length }); } });
        actions.appendChild(b);
      });
    }

    function refresh() {
      renderActions();
      if (s.log !== "Security") {
        grid.setRows([]); head.textContent = s.log ? s.log + "   Number of events: 0" : "Event Viewer (Local)";
        if (s.log) head.textContent = s.log + " — غير مفعّل في المحاكاة (استخدم Security)";
        return;
      }
      var list = filtered(s.ids);
      grid.setRows(rowsOf(list));
      head.textContent = s.ids.length
        ? "Filtered: Log: Security; Source: ; Event ID: " + s.idsText + ". Number of events: " + list.length
        : "Security   Number of events: " + list.length;
    }
    function selectLog(name, btn) {
      s.log = name;
      Array.prototype.forEach.call(tree.children, function (b) { var on = b === btn; b.classList.toggle("is-selected", on); b.setAttribute("aria-selected", String(on)); });
      refresh(); bus.emit("eventviewer:log", { log: name });
    }

    function openFilter() {
      var logged = h("select", { "aria-label": "Logged" }, ["Any time", "Last hour", "Last 12 hours", "Last 24 hours", "Last 7 days", "Last 30 days", "Custom range…"].map(function (x) { return h("option", { value: x, text: x }); }));
      logged.disabled = true;
      var levels = ["Critical", "Warning", "Verbose", "Error", "Information"].map(function (l) { var cb = h("input", { type: "checkbox", disabled: "" }); return h("label", cb, " " + l); });
      var ids = h("input", { type: "text", "aria-label": "<All Event IDs>", placeholder: "<All Event IDs>", spellcheck: "false", size: "28" });
      ids.value = s.idsText;
      var other = h("div.dlg-row", ["Task category", "Keywords", "User", "Computer(s)"].map(function (x) { var i = h("input", { type: "text", disabled: "", placeholder: "<All " + x + ">", "aria-label": x }); return h("label", x + ":", i); }));
      var back, close = function () { back.remove(); };
      var ok = h("button", { type: "button", text: "OK" }), cancel = h("button", { type: "button", text: "Cancel" }), clear = h("button", { type: "button", text: "Clear" });
      ok.addEventListener("click", function () {
        var list = parseIds(ids.value);
        s.ids = list; s.idsText = list.join(",");
        close(); refresh();
        bus.emit("eventviewer:filter", { ids: s.idsText, count: filtered(list).length });
      });
      cancel.addEventListener("click", close);
      clear.addEventListener("click", function () { ids.value = ""; });
      ids.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); ok.click(); } });
      var dlg = h("div.dlg", { role: "dialog", "aria-modal": "true", "aria-label": "Filter Current Log" },
        h("h4", { text: "Filter Current Log" }),
        h("div.dlg-row", h("label", "Logged:", logged)),
        h("div.dlg-row", h("span", { text: "Event level:" }), levels),
        h("div.dlg-row", h("label", "Includes/Excludes Event IDs: Enter ID numbers and/or ID ranges separated by commas.", h("br"), ids)),
        other,
        h("div.dlg-btns", ok, cancel, clear));
      back = h("div.dlg-back", dlg); root.appendChild(back); ids.focus();
    }

    renderActions(); refresh();
    body.api = {
      selectLog: function (n) { var b = tree.querySelector('[data-log="' + n + '"]'); if (b) b.click(); },
      filter: function (text) { var list = parseIds(text); s.ids = list; s.idsText = list.join(","); refresh(); bus.emit("eventviewer:filter", { ids: s.idsText, count: filtered(list).length }); },
      select: function (id, time) { var r = rowsOf(filtered(s.ids)).filter(function (x) { return x.ev.id === id && (!time || x.ev.time === time); })[0]; if (r) grid.select(r.key); },
      state: s
    };
  }

  FSIM.tools.eventviewer = {
    id: "eventviewer", parseIds: parseIds, message: message,
    open: function (stage, o) {
      o = o || {};
      return stage.create({ id: "eventviewer", title: "Event Viewer", icon: "folder", skin: "win", width: o.width || 860, height: o.height || 520, x: o.x != null ? o.x : 16, y: o.y != null ? o.y : 24, build: build });
    },
    /* plain text of one event for the interpretation phase: outputOf("fail"|"logon-breach"|"logon-local") */
    outputOf: function (kind) { return message({ kind: kind }); },
    annotTable: function (src) { return { columns: COLS, rows: rowsOf(filtered(parseIds(src.ids))).map(function (r) { return { key: r.key, cls: r.cls, cells: r.cells }; }) }; }
  };
})();
