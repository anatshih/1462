/* FSIM.tools.procmon — Process Monitor with a working "Process Monitor Filter" dialog (docs/ui-reference.md §4).
   Rows: FSIM.data.case.procmon (outputs-spec §د-3; noise rows are proposed background activity). Filters never delete events. */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;
  FSIM.core.sim = FSIM.core.sim || { state: "healthy" };
  var COLS = ["Time of Day", "Process Name", "PID", "Operation", "Path", "Result", "Detail"];
  var FILTER_COLUMNS = ["Date & Time", "Process Name", "PID", "Event Class", "Operation", "Path", "Result", "Detail", "Category"];
  var RELATIONS = ["is", "is not", "less than", "more than", "begins with", "ends with", "contains", "excludes"];
  var CATS = [["Registry", /^Reg/], ["File System", /^(CreateFile|ReadFile|WriteFile|QueryDirectory)$/], ["Network", /^TCP /], ["Process and Thread", /^Process /]];
  var MENUS = {
    File: [["Open…"], ["Save…"], ["-"], ["Exit"]],
    Edit: [["Copy"], ["Find…"]],
    Event: [["Properties…"], ["Stack…"]],
    Filter: [["Filter…", "filter"], ["Reset Filter", "reset"]],
    Tools: [["Process Tree"], ["Count Occurrences…"]],
    Options: [["Select Columns…"], ["Profiling Events"]],
    Help: [["About Process Monitor"]]
  };

  function eventClass(op) { return CATS.filter(function (c) { return c[1].test(op); }).map(function (c) { return c[0]; })[0] || "Process and Thread"; }
  function value(ev, col) {
    return { "Date & Time": ev.t, "Process Name": ev.p, "PID": String(ev.pid), "Event Class": eventClass(ev.op), "Operation": ev.op, "Path": ev.path, "Result": ev.res, "Detail": ev.detail, "Category": "" }[col];
  }
  function relMatch(rel, actual, wanted) {
    var a = String(actual).toLowerCase(), w = String(wanted).toLowerCase();
    switch (rel) {
      case "is": return a === w; case "is not": return a !== w;
      case "begins with": return a.indexOf(w) === 0; case "ends with": return a.slice(-w.length) === w && w.length > 0;
      case "contains": return a.indexOf(w) >= 0; case "excludes": return a.indexOf(w) < 0;
      case "less than": return parseFloat(actual) < parseFloat(wanted); case "more than": return parseFloat(actual) > parseFloat(wanted);
    }
    return false;
  }
  /* real semantics: Includes on the same column are OR-ed, different columns AND-ed; any Exclude match hides the row */
  function passes(ev, rules) {
    var inc = {}, excluded = false;
    rules.forEach(function (r) {
      var m = relMatch(r.rel, value(ev, r.col), r.val);
      if (r.act === "Exclude") { if (m) excluded = true; } else { inc[r.col] = inc[r.col] || m; }
    });
    return !excluded && Object.keys(inc).every(function (c) { return inc[c]; });
  }
  function eventsFor(state) { return FSIM.data.case.procmon.filter(function (e) { return state === "infected" || e.noise; }); }

  function build(body, win) {
    var s = { rules: [], cats: { "Registry": true, "File System": true, "Network": true, "Process and Thread": true }, capture: true };
    var root = h("div.ar"); body.appendChild(root);
    root.appendChild(FSIM.core.menubar(root, MENUS, function (menu, key) { if (key === "filter") openFilter(); else if (key === "reset") { s.rules = []; apply(); } }));
    var tb = h("div.tb");
    var capture = h("button", { type: "button", "aria-pressed": "true", text: "Capture (Ctrl+E)" });
    capture.addEventListener("click", function () { s.capture = !s.capture; capture.setAttribute("aria-pressed", String(s.capture)); bus.emit("procmon:capture", { on: s.capture }); });
    var clear = h("button", { type: "button", text: "Clear (Ctrl+X)", "aria-disabled": "true" });
    clear.addEventListener("click", function () { FSIM.core.toast(root, "مسح الأحداث غير مفعّل في المحاكاة."); });
    var filterBtn = h("button", { type: "button", text: "Filter… (Ctrl+L)", "data-pm": "filter" });
    filterBtn.addEventListener("click", openFilter);
    tb.appendChild(capture); tb.appendChild(clear); tb.appendChild(filterBtn); tb.appendChild(h("span.tb-sep"));
    CATS.forEach(function (c) {
      var b = h("button", { type: "button", "aria-pressed": "true", text: c[0], "data-cat": c[0] });
      b.addEventListener("click", function () { s.cats[c[0]] = !s.cats[c[0]]; b.setAttribute("aria-pressed", String(s.cats[c[0]])); apply(); });
      tb.appendChild(b);
    });
    root.appendChild(tb);

    var grid = FSIM.core.grid({ columns: COLS, rows: [], label: "Process Monitor events", sortable: false,
      onSelect: function (r) { bus.emit("procmon:select", { op: r.ev.op, process: r.ev.p, path: r.ev.path }); } });
    root.appendChild(grid.el);
    var status = h("div.status-bar"); root.appendChild(status);

    function apply() {
      var all = eventsFor(FSIM.core.sim.state);
      var rows = all.map(function (ev, i) { return { key: "e" + i, ev: ev, cells: [ev.t, ev.p, ev.pid, ev.op, ev.path, ev.res, ev.detail] }; })
        .filter(function (r) { return s.cats[eventClass(r.ev.op)] && passes(r.ev, s.rules); });
      grid.setRows(rows);
      status.textContent = "Showing " + rows.length + " of " + all.length + " events (" + (all.length ? Math.round(rows.length * 100 / all.length) : 100) + "%)";
    }

    function openFilter() {
      bus.emit("procmon:filter-open", {});
      var draft = s.rules.map(function (r) { return Object.assign({}, r); }), sel = -1;
      var colSel = h("select", { "aria-label": "Column" }, FILTER_COLUMNS.map(function (c) { return h("option", { value: c, text: c }); }));
      var relSel = h("select", { "aria-label": "Relation" }, RELATIONS.map(function (c) { return h("option", { value: c, text: c }); }));
      var val = h("input", { type: "text", "aria-label": "Value", spellcheck: "false", size: "22" });
      var act = h("select", { "aria-label": "Action" }, ["Include", "Exclude"].map(function (c) { return h("option", { value: c, text: c }); }));
      colSel.value = "Process Name";
      var list = h("div.dlg-list");
      function renderList() {
        list.textContent = "";
        var t = h("table", h("thead", h("tr", ["Column", "Relation", "Value", "Action"].map(function (x) { return h("th", { text: x }); }))), h("tbody",
          draft.map(function (r, i) {
            var tr = h("tr" + (i === sel ? ".is-selected" : ""), h("td", { text: r.col }), h("td", { text: r.rel }), h("td", { text: r.val }), h("td", { text: r.act }));
            tr.addEventListener("click", function () { sel = i; renderList(); });
            return tr;
          })));
        list.appendChild(t);
      }
      var back, close = function () { back.remove(); };
      var add = h("button.dlg-btn", { type: "button", text: "Add" }), remove = h("button.dlg-btn", { type: "button", text: "Remove" });
      add.addEventListener("click", function () {
        if (!val.value.trim()) return;
        draft.push({ col: colSel.value, rel: relSel.value, val: val.value.trim(), act: act.value });
        val.value = ""; renderList(); bus.emit("procmon:filter-add", { column: colSel.value });
      });
      remove.addEventListener("click", function () { if (sel >= 0) { draft.splice(sel, 1); sel = -1; renderList(); } });
      function commit() {
        s.rules = draft.map(function (r) { return Object.assign({}, r); });
        apply();
        bus.emit("procmon:filter-apply", {
          count: s.rules.length,
          hasProcessRule: s.rules.some(function (r) { return r.col === "Process Name" && r.rel === "is" && r.val.toLowerCase() === "update.exe" && r.act === "Include"; })
        });
      }
      var ok = h("button", { type: "button", text: "OK" }), cancel = h("button", { type: "button", text: "Cancel" }), applyB = h("button", { type: "button", text: "Apply" }), reset = h("button", { type: "button", text: "Reset" });
      ok.addEventListener("click", function () { commit(); close(); });
      applyB.addEventListener("click", commit);
      cancel.addEventListener("click", close);
      reset.addEventListener("click", function () { draft = []; sel = -1; renderList(); });
      var dlg = h("div.dlg", { role: "dialog", "aria-label": "Process Monitor Filter", "aria-modal": "true" },
        h("h4", { text: "Process Monitor Filter" }),
        h("p", { text: "Display entries matching these conditions:" }),
        h("div.dlg-row", colSel, relSel, val, h("span", { text: "then" }), act),
        h("div.dlg-row", add, remove),
        list,
        h("div.dlg-btns", ok, cancel, applyB, reset));
      back = h("div.dlg-back", dlg);
      root.appendChild(back); renderList(); val.focus();
    }

    bus.on("sim:state", apply);
    apply();
    body.api = { openFilter: openFilter, applyUpdateFilter: function () { s.rules = [{ col: "Process Name", rel: "is", val: "update.exe", act: "Include" }]; apply(); bus.emit("procmon:filter-open", {}); bus.emit("procmon:filter-apply", { count: 1, hasProcessRule: true }); }, rows: function () { return grid.tbody.children.length; }, select: function (op) { var r = Array.prototype.filter.call(grid.tbody.children, function (e) { return e.children[3].textContent === op; })[0]; if (r) r.click(); } };
  }

  FSIM.tools.procmon = {
    id: "procmon", eventsFor: eventsFor,
    open: function (stage, o) {
      o = o || {};
      return stage.create({ id: "procmon", title: "Process Monitor - Sysinternals: www.sysinternals.com", icon: "autoruns", skin: "win", width: o.width || 900, height: o.height || 460, x: o.x != null ? o.x : 24, y: o.y != null ? o.y : 40, build: build });
    },
    annotTable: function (src) {
      var rules = src.rules || [{ col: "Process Name", rel: "is", val: "update.exe", act: "Include" }];
      var seen = {};
      var rows = eventsFor(src.state).filter(function (e) { return passes(e, rules); }).map(function (e) { var n = seen[e.op] = (seen[e.op] === undefined ? 0 : seen[e.op] + 1); return { key: e.op + ":" + n, cls: "", cells: [e.t, e.p, e.pid, e.op, e.path, e.res, e.detail], op: e.op }; });
      return { columns: COLS, rows: rows };
    }
  };
})();
