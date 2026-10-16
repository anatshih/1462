/* FSIM.tools.rammap — RAMMap: Use Counts and Processes tabs enabled (docs/ui-reference.md §4; data outputs-spec §د-4). */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;
  FSIM.core.sim = FSIM.core.sim || { state: "healthy" };
  var TABS = ["Use Counts", "Processes", "Priority Summary", "Physical Pages", "Physical Ranges", "File Summary", "File Details"];
  var PCOLS = ["Process", "Session", "PID", "Private", "Standby", "Modified", "Page Table", "Total"];
  var UCOLS = ["Use Counts", "Total", "Active", "Standby", "Modified", "Transition", "Zeroed", "Free", "Bad"];
  var USE_ROWS = ["Process Private", "Mapped File", "Shareable", "Paged Pool", "Nonpaged Pool", "Driver Locked", "Kernel Stack", "Metafile", "Page Table"];
  var MENUS = { File: [["Save…"], ["Exit"]], Empty: [["Empty Working Sets"], ["Empty System Working Sets"], ["Empty Modified Page List"], ["Empty Standby List"], ["Empty Priority 0 Standby List"]], Help: [["About RAMMap"]] };

  function k(n) { return n.toLocaleString("en-US") + " K"; }
  function procRows(state) {
    return FSIM.data.case.rammap.filter(function (r) { return !r[8] || r[8] === state; })
      .map(function (r) { return { key: r[0], cells: [r[0], r[1], r[2], k(r[3]), k(r[4]), k(r[5]), k(r[6]), k(r[7])], hot: r[8] === "infected" }; });
  }

  function build(body) {
    var s = { tab: "Use Counts" };
    var root = h("div.ar"); body.appendChild(root);
    root.appendChild(FSIM.core.menubar(root, MENUS, function () {}));
    var tabs = h("div.ar-tabs", { role: "tablist", "aria-label": "RAMMap tabs" });
    TABS.forEach(function (t) {
      var on = t === "Use Counts" || t === "Processes";
      var b = h("button.ar-tab" + (on ? "" : ".is-off"), { type: "button", role: "tab", "aria-selected": String(t === s.tab), "data-tab": t, text: t });
      b.addEventListener("click", function () { s.tab = t; Array.prototype.forEach.call(tabs.children, function (x) { x.setAttribute("aria-selected", String(x === b)); }); bus.emit("rammap:tab", { tab: t }); show(); });
      tabs.appendChild(b);
    });
    root.appendChild(tabs);
    var holder = h("div.gr-holder"); root.appendChild(holder);
    holder.className = "ar-grid";
    var status = h("div.status-bar", { text: "Ready." }); root.appendChild(status);
    var pgrid = null;

    function show() {
      holder.textContent = ""; pgrid = null;
      if (s.tab === "Processes") {
        pgrid = FSIM.core.grid({ columns: PCOLS, rows: [], label: "RAMMap processes", firstDesc: ["Private", "Standby", "Modified", "Page Table", "Total"],
          onSort: function (c, d) { bus.emit("rammap:sort", { col: c, desc: d < 0 }); }, onSelect: function (r) { bus.emit("rammap:select", { process: r.key }); } });
        holder.appendChild(pgrid.el);
        pgrid.setRows(procRows(FSIM.core.sim.state).map(function (r) { return { key: r.key, cells: r.cells, cls: "" }; }));
      } else if (s.tab === "Use Counts") {
        var vals = {}; FSIM.data.case.rammapUseCounts.forEach(function (v) { vals[v[0]] = v[1]; });
        var rows = USE_ROWS.map(function (n) { return { key: n, cells: [n, vals[n] || "", "", "", "", "", "", "", ""] }; });
        rows.push({ key: "free", cells: ["Free / Zeroed", vals["Free / Zeroed"], "", "", "", "", "", "", ""] });
        var g = FSIM.core.grid({ columns: UCOLS, rows: rows, label: "RAMMap use counts", sortable: false }); holder.appendChild(g.el);
        holder.appendChild(h("p.view-note", { text: "المحاكاة تعرض أرقاماً إجمالية تقريبية لخمسة أنواع فقط؛ تفاصيل الحالات (Active وStandby…) غير مفعّلة." }));
      } else {
        holder.appendChild(h("div.view-note", { text: "هذا التبويب (" + s.tab + ") غير مفعّل في المحاكاة." }));
      }
    }
    bus.on("sim:state", show);
    show();
    body.api = { selectTab: function (t) { var b = tabs.querySelector('[data-tab="' + t + '"]'); if (b) b.click(); }, sortBy: function (col) { if (pgrid) pgrid.sortBy(PCOLS.indexOf(col)); }, state: s };
  }

  FSIM.tools.rammap = {
    id: "rammap",
    open: function (stage, o) {
      o = o || {};
      return stage.create({ id: "rammap", title: "RAMMap - Sysinternals: www.sysinternals.com", icon: "autoruns", skin: "win", width: o.width || 800, height: o.height || 420, x: o.x != null ? o.x : 50, y: o.y != null ? o.y : 70, build: build });
    },
    annotTable: function (src) {
      return { columns: PCOLS, rows: procRows(src.state).sort(function (a, b) { return parseInt(b.cells[3].replace(/\D/g, ""), 10) - parseInt(a.cells[3].replace(/\D/g, ""), 10); }).map(function (r) { return { key: r.key, cls: r.hot ? "is-hot" : "", cells: r.cells }; }) };
    }
  };
})();
