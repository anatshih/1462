/* FSIM.tools.tcpview — TCPView v4 (docs/ui-reference.md §4). Data: FSIM.data.case.tcpview (outputs-spec §د-2).
   Colours: green = new connection, yellow = state changed, red = closed (disappears after a moment). */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;
  FSIM.core.sim = FSIM.core.sim || { state: "healthy" };
  var COLS = ["Process Name", "Process ID", "Protocol", "State", "Local Address", "Local Port", "Remote Address", "Remote Port", "Create Time", "Module Name", "Sent Packets", "Recv Packets", "Sent Bytes", "Recv Bytes"];
  var MENUS = {
    File: [["Save…"], ["Close Connections", "close"], ["-"], ["Exit"]],
    Options: [["Always on Top"], ["Show Unconnected Endpoints"], ["-"], ["Refresh Rate…", "refresh"]],
    View: [["Update Speed"], ["Resolve Addresses"]],
    Help: [["About TCPView"]]
  };
  var FLASH_MS = 3200;

  function rowsFor(state, src) {
    return FSIM.data.case.tcpview.filter(function (r) { return !r[9] || r[9] === state; }).map(function (r) {
      return { key: r[8], proc: r[0], cells: [r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], "", "", "", "", "", ""], flash: r[10] || null, state: r[3] };
    });
  }

  function build(body, win) {
    var s = { proto: { "TCP v4": true, "TCP v6": true, "UDP v4": true, "UDP v6": true }, query: "", flashing: {}, timer: null };
    var root = h("div.ar"); body.appendChild(root);
    root.appendChild(FSIM.core.menubar(root, MENUS, function (menu, key) {
      if (key === "close") FSIM.core.toast(root, "إغلاق اتصال قائم يغيّر الجهاز المفحوص ويُتلف الدليل. المحقق يوثّق الاتصال ولا يقطعه (معطّل في المحاكاة).");
      else FSIM.core.toast(root, "غير مفعّل في المحاكاة: التحديث كل ثانية ثابت في هذه النسخة.");
    }));
    var search = h("input", { type: "text", "aria-label": "Search", placeholder: "Search", spellcheck: "false" });
    var tb = h("div.tb");
    ["TCP v4", "TCP v6", "UDP v4", "UDP v6"].forEach(function (p) {
      var b = h("button", { type: "button", "aria-pressed": "true", text: p, "data-proto": p });
      b.addEventListener("click", function () { s.proto[p] = !s.proto[p]; b.setAttribute("aria-pressed", String(s.proto[p])); bus.emit("tcpview:proto", { proto: p, on: s.proto[p] }); refresh(); });
      tb.appendChild(b);
    });
    tb.appendChild(h("span.tb-sep"));
    tb.appendChild(search);
    root.appendChild(tb);
    search.addEventListener("input", function () { s.query = search.value; bus.emit("tcpview:search", { query: search.value.toLowerCase().trim(), hasUpdate: search.value.toLowerCase().indexOf("update") >= 0 }); refresh(); });

    var grid = FSIM.core.grid({ columns: COLS, rows: [], label: "TCPView connections", onSelect: function (r) { bus.emit("tcpview:select", { key: r.key, process: r.proc, state: r.state }); } });
    root.appendChild(grid.el);
    var status = h("div.status-bar", { text: "" });
    root.appendChild(status);

    function protoOf(r) { return r.cells[2] + " v4"; }
    function visible() {
      var q = s.query.toLowerCase().trim();
      return rowsFor(FSIM.core.sim.state).filter(function (r) {
        if (!s.proto[protoOf(r)]) return false;
        if (s.flashing[r.key] === "gone") return false;
        return !q || r.cells.join("\u0001").toLowerCase().indexOf(q) >= 0;
      }).map(function (r) { var f = s.flashing[r.key]; r.cls = f === "new" ? "is-green" : f === "closing" ? "is-red" : ""; return r; });
    }
    function refresh() { var v = visible(); grid.setRows(v); status.textContent = "Endpoints: " + v.length; }

    function animate() {
      clearTimeout(s.timer);
      s.flashing = {};
      rowsFor(FSIM.core.sim.state).forEach(function (r) { if (r.flash) s.flashing[r.key] = r.flash; });
      refresh();
      s.timer = setTimeout(function () {
        Object.keys(s.flashing).forEach(function (k) { s.flashing[k] = s.flashing[k] === "closing" ? "gone" : "settled"; });
        refresh();
      }, FLASH_MS);
    }
    bus.on("sim:state", function () { animate(); });
    animate();
    body.api = {
      select: function (key) { grid.select(key); },
      setSearch: function (t) { search.value = t; search.dispatchEvent(new Event("input")); },
      rows: function () { return visible(); }
    };
  }

  FSIM.tools.tcpview = {
    id: "tcpview", rowsFor: rowsFor,
    open: function (stage, o) {
      o = o || {};
      return stage.create({ id: "tcpview", title: "TCPView - Sysinternals: www.sysinternals.com", icon: "autoruns", skin: "win", width: o.width || 860, height: o.height || 440, x: o.x != null ? o.x : 30, y: o.y != null ? o.y : 50, build: build });
    },
    /* annotated table for the interpretation phase */
    annotTable: function (src) {
      var rows = rowsFor(src.state).map(function (r) { return { key: r.key, cls: r.flash === "new" ? "is-green" : r.flash === "closing" ? "is-red" : "", cells: r.cells.slice(0, 8) }; });
      return { columns: COLS.slice(0, 8), rows: rows };
    }
  };
})();
