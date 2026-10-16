/* FSIM.tools.bhe — Browser History Examiner: source → browser capture → data-type list → Website Visits / Downloads / Searches,
   sortable, filterable, with a time-zone switch (docs/ui-reference.md §10; data FSIM.data.case.bhe, outputs-spec §ك). */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;
  var SOURCES = [["Load history from the local computer", 1], ["Load history from an external drive", 0], ["Load history from a remote computer", 0], ["Load history from a forensic image", 0], ["Load history manually", 0]];
  var BROWSERS = [["Chrome", 1], ["Edge", 0], ["Firefox", 0], ["Safari", 0], ["Internet Explorer", 0]];
  var TYPES = [["Bookmarks", 0], ["Cached Files", 0], ["Cookies", 0], ["Downloads", 1], ["Favicons", 0], ["Form History", 0], ["Logins", 0], ["Searches", 1], ["Session Data", 0], ["Thumbnails", 0], ["Website Visits", 1]];
  var VCOLS = ["Date Visited", "Title", "URL", "Visit Type", "Visit Count", "URL Record Count", "Visited From", "Web Browser"];
  var DCOLS = ["Date Downloaded", "File Name", "Source URL", "Size", "Saved To"];
  var SCOLS = ["Date Searched", "Search Term", "Search Engine"];

  function parse(str) {
    var m = /^(\d+)\/(\d+)\/(\d+) (\d+):(\d+):(\d+) (AM|PM)$/.exec(str); if (!m) return null;
    var hh = +m[4] % 12 + (m[7] === "PM" ? 12 : 0);
    return new Date(Date.UTC(+m[3], +m[1] - 1, +m[2], hh, +m[5], +m[6]));
  }
  function fmt(d) {
    var hh = d.getUTCHours(), ap = hh >= 12 ? "PM" : "AM", h12 = hh % 12 || 12;
    return (d.getUTCMonth() + 1) + "/" + d.getUTCDate() + "/" + d.getUTCFullYear() + " " + h12 + ":" + ("0" + d.getUTCMinutes()).slice(-2) + ":" + ("0" + d.getUTCSeconds()).slice(-2) + " " + ap;
  }
  /* stored values are local time (UTC+3); "UTC" subtracts the offset */
  function shift(str, tz) { if (tz !== "UTC") return str; var d = parse(str); if (!d) return str; return fmt(new Date(d.getTime() - FSIM.data.case.bhe.utcOffsetHours * 3600000)); }

  function rowsFor(type, tz) {
    var B = FSIM.data.case.bhe;
    if (type === "Website Visits") return { cols: VCOLS, rows: B.visits.map(function (v, i) { return { key: "v" + i, cells: [shift(v[0], tz), v[1], v[2], v[3], v[4], v[5], v[6], v[7]] }; }) };
    if (type === "Downloads") return { cols: DCOLS, rows: B.downloads.map(function (d, i) { return { key: "d" + i, cells: [shift(d[2], tz), d[0], d[1], d[3], d[4]] }; }) };
    if (type === "Searches") return { cols: SCOLS, rows: B.searches.map(function (x, i) { return { key: "s" + i, cells: [shift(x[0], tz), x[1], x[2]] }; }) };
    return { cols: [], rows: [] };
  }

  function build(body, win) {
    var s = { screen: "source", type: "Website Visits", tz: "Local", filter: "" };
    var root = h("div.ar"); body.appendChild(root);
    root.appendChild(FSIM.core.menubar(root, { File: [["New Case…"], ["Exit"]], View: [["Data Types"]], Tools: [["Export…"], ["Report…"]], Help: [["Contents"], ["About"]] }, function () {}));
    var main = h("div"); main.style.display = "flex"; main.style.flexDirection = "column"; main.style.flex = "1"; main.style.minHeight = "0"; root.appendChild(main);
    var status = h("div.status-bar", { text: "Ready" }); root.appendChild(status);

    function sourcePage() {
      s.screen = "source"; main.textContent = "";
      var sel = "", list = h("div.radio-list", { role: "radiogroup", "aria-label": "Capture history" });
      var next = h("button.dlg-btn", { type: "button", text: "Next >", disabled: "" });
      SOURCES.forEach(function (o) {
        var r = h("input", { type: "radio", name: "bhe-src", value: o[0] }); if (!o[1]) r.disabled = true;
        r.addEventListener("change", function () { sel = o[0]; next.disabled = false; });
        list.appendChild(h("label" + (o[1] ? "" : ".is-off"), r, o[0]));
      });
      next.addEventListener("click", function () { bus.emit("bhe:source", { kind: sel }); browserPage(); });
      main.appendChild(h("div.vc-box", h("h4", { text: "Capture History — choose the source" }), list, h("div.dlg-btns", next)));
    }
    function browserPage() {
      s.screen = "browsers"; main.textContent = "";
      var boxes = [], cap = h("button.dlg-btn", { type: "button", text: "Capture" });
      var list = h("div.radio-list");
      BROWSERS.forEach(function (b) {
        var cb = h("input", { type: "checkbox", value: b[0] }); cb.checked = !!b[1]; if (!b[1]) cb.disabled = true; boxes.push(cb);
        list.appendChild(h("label" + (b[1] ? "" : ".is-off"), cb, b[0] + (b[1] ? "   (profile: sami › Default)" : "   (غير موجود في هذا الجهاز)")));
      });
      cap.addEventListener("click", function () {
        var chosen = boxes.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
        if (!chosen.length) { FSIM.core.toast(root, "اختر متصفحاً واحداً على الأقل."); return; }
        FSIM.core.runProgress(root, { title: "Capturing history…", ms: 2200, rows: [["Source", "Local computer"], ["Browsers", chosen.join(", ")]] }).then(function (ok) { if (ok) { mainView(); bus.emit("bhe:capture", { browsers: chosen.join(",") }); } });
      });
      main.appendChild(h("div.vc-box", h("h4", { text: "Select the web browsers to capture" }), list, h("div.dlg-btns", cap)));
    }

    var grid, caption, search, tzSel, side;
    function mainView() {
      s.screen = "main"; main.textContent = ""; status.textContent = "History captured: Chrome › sami › Default";
      side = h("div.ec-tree", { role: "listbox", "aria-label": "Data types" });
      TYPES.forEach(function (t) {
        var b = h("button", { type: "button", role: "option", "data-type": t[0], "aria-selected": String(t[0] === s.type), text: t[0] });
        if (t[0] === s.type) b.classList.add("is-selected");
        b.addEventListener("click", function () {
          if (!t[1]) { FSIM.core.toast(root, "لا بيانات من هذا النوع في المحاكاة (غير مفعّل)."); return; }
          s.type = t[0]; Array.prototype.forEach.call(side.children, function (x) { var on = x === b; x.classList.toggle("is-selected", on); x.setAttribute("aria-selected", String(on)); });
          draw(); bus.emit("bhe:datatype", { type: t[0] });
        });
        side.appendChild(b);
      });
      search = h("input", { type: "text", "aria-label": "Filter", placeholder: "Filter…", spellcheck: "false" });
      search.addEventListener("input", function () { s.filter = search.value; draw(); bus.emit("bhe:filter", { text: search.value.toLowerCase(), hasFree: search.value.toLowerCase().indexOf("free-pdf") >= 0 || search.value.toLowerCase().indexOf("free pdf") >= 0 }); });
      tzSel = h("select", { "aria-label": "Time Zone" }, [h("option", { value: "Local", text: "Local time (UTC+03:00)" }), h("option", { value: "UTC", text: "UTC" })]);
      tzSel.addEventListener("change", function () { s.tz = tzSel.value; draw(); bus.emit("bhe:timezone", { tz: tzSel.value }); });
      var tb = h("div.tb", h("label", "Filter: ", search), h("label", "Time zone: ", tzSel));
      caption = h("div.ev-head");
      grid = FSIM.core.grid({ columns: VCOLS, rows: [], label: "History data", firstDesc: ["Visit Count"], onSort: function (c, d) { bus.emit("bhe:sort", { col: c, desc: d < 0 }); } });
      var center = h("div"); center.style.display = "flex"; center.style.flexDirection = "column"; center.style.flex = "1"; center.style.minWidth = "0";
      center.appendChild(tb); center.appendChild(caption); center.appendChild(h("div", { class: "bhe-grid" })); center.lastChild.style.display = "flex"; center.lastChild.style.flex = "1"; center.lastChild.style.minHeight = "0"; center.lastChild.appendChild(grid.el);
      var wrap = h("div.ec-panes"); wrap.style.gridTemplateColumns = "180px minmax(0, 1fr)"; wrap.style.gridTemplateRows = "minmax(0, 1fr)";
      side.style.gridRow = "auto"; wrap.appendChild(side); wrap.appendChild(center);
      main.appendChild(wrap); draw();
    }
    function draw() {
      var d = rowsFor(s.type, s.tz);
      /* columns differ per data type: rebuild the grid when they change */
      if (grid.cols !== d.cols.join("|")) {
        var parent = grid.el.parentNode;
        grid = FSIM.core.grid({ columns: d.cols, rows: [], label: "History data", firstDesc: ["Visit Count"], onSort: function (c, dd) { bus.emit("bhe:sort", { col: c, desc: dd < 0 }); } });
        grid.cols = d.cols.join("|"); parent.textContent = ""; parent.appendChild(grid.el);
      }
      var q = s.filter.toLowerCase().trim();
      var rows = d.rows.filter(function (r) { return !q || r.cells.join("\u0001").toLowerCase().indexOf(q) >= 0; });
      grid.setRows(rows);
      caption.textContent = s.type + " — " + rows.length + " record(s)   [" + (s.tz === "UTC" ? "UTC" : "Local time UTC+03:00") + "]";
    }

    sourcePage();
    function q(sel) { return root.querySelector(sel); }
    body.api = {
      step: function (id) {
        var w = function () { return FSIM.core.sleep(250); };
        if (id === "s2") { var r = q('input[value="Load history from the local computer"]'); r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); q(".dlg-btns button").click(); return w(); }
        if (id === "s3") { q(".dlg-btns button").click(); return new Promise(function (res) { var off = bus.on("bhe:capture", function () { off(); res(); }); }); }
        if (id === "s4") { q('[data-type="Website Visits"]').click(); return w(); }
        if (id === "s5") { grid.sortBy(VCOLS.indexOf("Visit Count")); return w(); }
        if (id === "s6") { search.value = "free-pdf"; search.dispatchEvent(new Event("input")); return w(); }
        if (id === "s7") { q('[data-type="Downloads"]').click(); return w(); }
        if (id === "s8") { tzSel.value = "UTC"; tzSel.dispatchEvent(new Event("change")); return w(); }
        return Promise.resolve();
      }
    };
  }

  FSIM.tools.bhe = {
    id: "bhe",
    shift: shift,
    open: function (stage, o) { o = o || {}; return stage.create({ id: "bhe", title: "Browser History Examiner", icon: "folder", skin: "win", width: o.width || 900, height: o.height || 480, x: o.x != null ? o.x : 16, y: o.y != null ? o.y : 16, build: build }); },
    annotTable: function (src) { var d = rowsFor(src.type || "Website Visits", src.tz || "Local"); return { columns: d.cols, rows: d.rows.map(function (r) { return { key: r.key, cls: "", cells: r.cells }; }) }; }
  };
})();
