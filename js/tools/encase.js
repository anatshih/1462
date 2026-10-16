/* FSIM.tools.encase — EnCase Forensic 8: Home → New Case → Add Evidence File → Tree / Table / View, Raw Search (docs/ui-reference.md §7).
   Files: FSIM.data.case.encaseFiles (outputs-spec §ح-3, proposed). */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;
  var COLS = ["Name", "File Ext", "Logical Size", "Category", "Signature Analysis", "Created", "Last Accessed", "Last Written", "Is Deleted", "Full Path"];
  var VIEWS = [["Text", 1], ["Hex", 1], ["Doc", 0], ["Transcript", 0], ["Picture", 0], ["Report", 0], ["Fields", 1], ["File Extents", 0], ["Permissions", 0], ["Hash Sets", 0]];
  var TREE = [
    ["case", 0, "Case: TR-1261-01", null], ["evidence", 1, "ACC-PC07_C.E01", "all"], ["c", 2, "C (NTFS)", "all"], ["users", 3, "Users", "all"], ["sami", 4, "sami", "all"],
    ["documents", 5, "Documents", "all"], ["finance", 6, "Finance", "finance"], ["appdata", 5, "AppData", "all"], ["temp", 6, "Temp", "temp"], ["pictures", 5, "Pictures", "pictures"]
  ];
  var ADD = [["Add Local Device", 2], ["Add Network Device", 0], ["Add Evidence File", 1], ["Add Raw Image", 0], ["Acquire Smartphone", 0], ["Add Crossover Preview", 0]];
  var CAT = { xlsx: "Document", docx: "Document", zip: "Archive", jpg: "Archive" }; // jpg: category follows the real (ZIP) signature

  function files() {
    return FSIM.data.case.encaseFiles.map(function (f) {
      return { name: f[0], ext: f[1], size: f[2], sig: f[3], del: f[4], written: f[5], path: f[6], folder: f[7], cat: CAT[f[1]] };
    });
  }
  function folderOf(key) { var all = files(); return key === "all" ? all : all.filter(function (f) { return f.folder === key; }); }
  function rowOf(f) { return { key: f.name, f: f, cls: f.del ? "is-red" : "", cells: [f.name, f.ext, f.size, f.cat, f.sig, "", "", f.written, f.del ? "Yes" : "No", f.path] }; }
  function hexOf(f) { return ["Offset    00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F", "00000000  50 4B 03 04 14 00 00 00 08 00 00 00 00 00 00 00   PK.............."]; }

  function build(body, win) {
    var s = { screen: "home", caseName: "", evidence: false, folder: "all", sel: null, view: "Text", results: null };
    var root = h("div.ec"); body.appendChild(root);
    var menubar = FSIM.core.menubar(root, { Case: [["New Case…", "new"], ["Open Case…"], ["-"], ["Exit"]], View: [["Table"]], Tools: [["Evidence Processor"]], Help: [["About EnCase"]] }, function (m, key) { if (key === "new") newCase(); });
    root.appendChild(menubar);
    var main = h("div"); main.style.display = "flex"; main.style.flexDirection = "column"; main.style.flex = "1"; main.style.minHeight = "0";
    root.appendChild(main);
    var status = h("div.status-bar", { text: "Home" }); root.appendChild(status);

    function showHome() {
      s.screen = "home"; main.textContent = ""; status.textContent = "Home";
      var nc = h("button.ec-link", { type: "button", text: "New Case", "data-ec": "new" }); nc.addEventListener("click", newCase);
      main.appendChild(h("div.ec-home", h("h3", { text: "Home" }), nc, h("button.ec-link", { type: "button", "aria-disabled": "true", text: "Open Case", onclick: function () { FSIM.core.toast(root, "غير مفعّل في المحاكاة"); } })));
    }
    function showCase() {
      s.screen = "case"; main.textContent = ""; status.textContent = "Case: " + s.caseName;
      var list = h("div");
      var add = h("button.ec-link", { type: "button", text: "Add Evidence", "data-ec": "add" });
      add.addEventListener("click", function () { list.hidden = false; });
      list.hidden = true;
      ADD.forEach(function (a) {
        var b = h("button.ec-link", { type: "button", text: a[0], "data-ec-add": a[0], "aria-disabled": a[1] ? false : "true" });
        b.addEventListener("click", function () {
          bus.emit("encase:add", { kind: a[0] });
          if (a[0] === "Add Local Device") FSIM.core.toast(root, "لا تضف القرص الأصلي إلى القضية: تعمل دائماً على النسخة الجنائية (E01).");
          else if (!a[1]) FSIM.core.toast(root, "غير مفعّل في المحاكاة");
          else if (a[1] === 1) pickFile();
        });
        list.appendChild(b);
      });
      main.appendChild(h("div.ec-home", h("h3", { text: "Case: " + s.caseName }), add, list));
    }

    function newCase() {
      bus.emit("encase:newcase-open", {});
      var name = h("input", { type: "text", "aria-label": "Name", spellcheck: "false" }), ex = h("input", { type: "text", "aria-label": "Examiner name" }), exid = h("input", { type: "text", "aria-label": "Examiner ID" });
      var desc = h("input", { type: "text", "aria-label": "Description" }), base = h("input", { type: "text", "aria-label": "Base case folder" }); base.value = "C:\\Users\\Student\\Documents\\EnCase\\Cases";
      var full = h("span.ltr", { text: "" });
      name.addEventListener("input", function () { full.textContent = base.value + "\\" + name.value + "\\" + name.value + ".case"; });
      var ok = h("button.dlg-btn", { type: "button", text: "OK" }), cancel = h("button.dlg-btn", { type: "button", text: "Cancel" });
      var back = h("div.dlg-back", h("div.dlg.wiz", { role: "dialog", "aria-modal": "true", "aria-label": "New Case" }, h("h4", { text: "New Case" }),
        h("div.dlg-row", h("span", { text: "Case Options:" }), ["Basic", "Forensic"].map(function (t) { return h("button.dlg-btn", { type: "button", "aria-disabled": "true", text: t }); })),
        [["Name", name], ["Full case path", full], ["Examiner name", ex], ["Examiner ID", exid], ["Description", desc], ["Base case folder", base]].map(function (f) { return h("div.field-row", h("label", { text: f[0] }), f[1]); }),
        h("div.dlg-btns", ok, cancel)));
      root.appendChild(back); name.focus();
      cancel.addEventListener("click", function () { back.remove(); });
      ok.addEventListener("click", function () {
        if (!name.value.trim()) { FSIM.core.toast(root, "اكتب اسم القضية (Name) أولاً."); return; }
        s.caseName = name.value.trim(); back.remove(); showCase();
        bus.emit("encase:newcase", { name: s.caseName, examiner: !!ex.value.trim() });
      });
      s.dlg = { name: name, ex: ex, ok: ok };
    }

    function pickFile() {
      var sel = null, list = h("div.dlg-list");
      var cand = [FSIM.data.case.image.name];
      cand.forEach(function (n) { var r = h("div", { text: n, role: "option", tabindex: "0", "data-file": n }); r.addEventListener("click", function () { sel = n; Array.prototype.forEach.call(list.children, function (c) { c.classList.toggle("is-selected", c === r); }); }); list.appendChild(r); });
      var ok = h("button.dlg-btn", { type: "button", text: "Open" }), cancel = h("button.dlg-btn", { type: "button", text: "Cancel" });
      var back = h("div.dlg-back", h("div.dlg", { role: "dialog", "aria-modal": "true", "aria-label": "Add Evidence File" }, h("h4", { text: "Add Evidence File" }), h("p", { text: "اختر ملف النسخة (E01 أو Ex01):" }), list, h("div.dlg-btns", ok, cancel)));
      root.appendChild(back);
      cancel.addEventListener("click", function () { back.remove(); });
      ok.addEventListener("click", function () {
        if (!sel) return;
        back.remove();
        FSIM.core.runProgress(root, { title: "Adding evidence — verifying hash…", ms: 2600, rows: [["Evidence", sel], ["Status", "Verifying image hash…"]] }).then(function (done) {
          if (!done) return;
          s.evidence = true; showMain();
          bus.emit("encase:evidence", { name: sel, verified: true });
        });
      });
    }

    var tableHost, viewBody, grid, tabs, treeEl, caption;
    function showMain() {
      s.screen = "main"; main.textContent = ""; status.textContent = "Evidence verified: " + FSIM.data.case.image.md5;
      var tb = h("div.tb"); var rs = h("button", { type: "button", text: "Raw Search", "data-ec": "search" }); rs.addEventListener("click", openSearch);
      tb.appendChild(rs); tb.appendChild(h("span", { text: "Verified: " + FSIM.data.case.image.name + "  MD5 " + FSIM.data.case.image.md5 }));
      main.appendChild(tb);
      treeEl = h("div.ec-tree", { role: "tree", "aria-label": "Tree pane" });
      TREE.forEach(function (n) {
        var b = h("button", { type: "button", role: "treeitem", "data-tree": n[0], "aria-selected": "false", text: "\u00a0\u00a0".repeat(n[1]) + (n[1] ? "▸ " : "") + n[2] });
        b.addEventListener("click", function () { if (n[3]) selectFolder(n[0], n[3], b); });
        treeEl.appendChild(b);
      });
      caption = h("div.ev-head", { text: "" });
      grid = FSIM.core.grid({ columns: COLS, rows: [], label: "Table pane", onSelect: function (r) { s.sel = r.f; renderView(); bus.emit("encase:select", { name: r.f.name, deleted: r.f.del, badSignature: r.f.sig !== "Match" }); } });
      tableHost = h("div"); tableHost.style.display = "flex"; tableHost.style.flexDirection = "column"; tableHost.style.minHeight = "0"; tableHost.style.overflow = "hidden";
      tableHost.appendChild(caption); tableHost.appendChild(grid.el);
      tabs = h("div.ec-vtabs", { role: "tablist" });
      VIEWS.forEach(function (v) {
        var b = h("button" + (v[1] ? "" : ".is-off"), { type: "button", role: "tab", "aria-selected": String(v[0] === s.view), "data-view": v[0], text: v[0] });
        b.addEventListener("click", function () {
          if (!v[1]) { FSIM.core.toast(root, "غير مفعّل في المحاكاة"); return; }
          s.view = v[0]; Array.prototype.forEach.call(tabs.children, function (x) { x.setAttribute("aria-selected", String(x === b)); });
          renderView(); bus.emit("encase:view", { tab: v[0], name: s.sel ? s.sel.name : "" });
        });
        tabs.appendChild(b);
      });
      viewBody = h("div.ec-vbody");
      var view = h("div.ec-view", tabs, viewBody);
      main.appendChild(h("div.ec-panes", treeEl, tableHost, view));
      selectFolder("evidence", "all", treeEl.children[1]);
    }
    function selectFolder(key, folder, btn) {
      s.folder = folder; s.results = null;
      Array.prototype.forEach.call(treeEl.children, function (b) { var on = b === btn; b.classList.toggle("is-selected", on); b.setAttribute("aria-selected", String(on)); });
      caption.textContent = "Table: " + (key === "evidence" ? "ACC-PC07_C.E01 (كل الملفات)" : key);
      grid.setRows(folderOf(folder).map(rowOf)); s.sel = null; renderView();
      bus.emit("encase:tree", { folder: key === "temp" ? "Temp" : key === "finance" ? "Finance" : key === "pictures" ? "Pictures" : key });
    }
    function renderView() {
      var f = s.sel; viewBody.textContent = "";
      if (!f) { viewBody.textContent = "اختر ملفاً من Table لرؤية محتواه."; return; }
      if (s.view === "Hex") viewBody.textContent = hexOf(f).join("\n") + (f.sig !== "Match" ? "\n\n← يبدأ بـ 50 4B (PK) أي ملف مضغوط، بينما الامتداد ." + f.ext : "");
      else if (s.view === "Text") viewBody.textContent = "PK\u0003\u0004\u0014…   (محتوى ثنائي: افتح تبويب Hex لرؤية البايتات)";
      else if (s.view === "Fields") viewBody.textContent = ["Name              " + f.name, "Full Path         " + f.path, "Logical Size      " + f.size, "Is Deleted        " + (f.del ? "Yes" : "No"), "Signature         " + f.sig + (f.sig !== "Match" ? "  (Alias: zip)" : "")].join("\n");
    }

    function openSearch() {
      var kw = h("input", { type: "text", "aria-label": "Keywords", spellcheck: "false", size: "28" });
      var go = h("button.dlg-btn", { type: "button", text: "Search" }), cancel = h("button.dlg-btn", { type: "button", text: "Cancel" });
      var back = h("div.dlg-back", h("div.dlg", { role: "dialog", "aria-modal": "true", "aria-label": "Raw Search" }, h("h4", { text: "Raw Search" }), h("div.dlg-row", h("label", "Keywords: ", kw)), h("p.wiz-note", { text: "البحث الخام يشمل الأسماء والمحتوى حتى في الملفات المحذوفة." }), h("div.dlg-btns", go, cancel)));
      root.appendChild(back); kw.focus();
      cancel.addEventListener("click", function () { back.remove(); });
      function run() {
        var q = kw.value.trim().toLowerCase(); if (!q) return;
        back.remove();
        var hits = [];
        files().forEach(function (f) {
          if (f.path.toLowerCase().indexOf(q) >= 0) hits.push({ f: f, where: "Full Path / File name" });
          else if (f.name === "arc_1003.zip" && FSIM.data.case.zipEntries.some(function (e) { return e.toLowerCase().indexOf(q) >= 0; })) hits.push({ f: f, where: "داخل الأرشيف (أسماء الملفات المضغوطة)" });
        });
        s.results = hits; caption.textContent = "Search Results: " + hits.length + " hit(s) for \"" + kw.value.trim() + "\"";
        grid.setRows(hits.map(function (x) { var r = rowOf(x.f); r.cells[9] = x.f.path + "   [" + x.where + "]"; return r; }));
        bus.emit("encase:search", { keyword: q, hits: hits.length });
      }
      go.addEventListener("click", run); kw.addEventListener("keydown", function (e) { if (e.key === "Enter") run(); });
    }

    showHome();
    function q(sel) { return root.querySelector(sel); }
    function fire(el, v) { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }
    body.api = {
      step: function (id) {
        var w = function () { return FSIM.core.sleep(250); };
        if (id === "s2") { q('[data-ec="new"]').click(); return w().then(function () { fire(s.dlg.name, "TR-1261-01"); fire(s.dlg.ex, "Student"); s.dlg.ok.click(); }); }
        if (id === "s3") { q('[data-ec="add"]').click(); q('[data-ec-add="Add Evidence File"]').click(); return w(); }
        if (id === "s4") { q("[data-file]").click(); Array.prototype.filter.call(root.querySelectorAll(".dlg-btns button"), function (b) { return b.textContent === "Open"; })[0].click(); return new Promise(function (res) { var off = bus.on("encase:evidence", function () { off(); res(); }); }); }
        if (id === "s5") { q('[data-tree="temp"]').click(); return w(); }
        if (id === "s6") { q('tr[data-key="arc_1003.zip"]').click(); return w(); }
        if (id === "s7") { q('[data-tree="pictures"]').click(); q('tr[data-key="holiday.jpg"]').click(); q('[data-view="Hex"]').click(); return w(); }
        if (id === "s8") { q('[data-ec="search"]').click(); fire(q('input[aria-label="Keywords"]'), "Finance"); Array.prototype.filter.call(root.querySelectorAll(".dlg-btns button"), function (b) { return b.textContent === "Search"; })[0].click(); return w(); }
        return Promise.resolve();
      }
    };
  }

  FSIM.tools.encase = {
    id: "encase", files: files,
    open: function (stage, o) { o = o || {}; return stage.create({ id: "encase", title: "EnCase Forensic", icon: "autoruns", skin: "win", width: o.width || 880, height: o.height || 520, x: o.x != null ? o.x : 20, y: o.y != null ? o.y : 16, build: build }); },
    annotTable: function () { return { columns: COLS, rows: files().map(rowOf).map(function (r) { return { key: r.key, cls: r.cls, cells: r.cells }; }) }; },
    outputOf: function (kind) { var f = files().filter(function (x) { return x.name === kind; })[0]; return f ? hexOf(f).concat(f.sig !== "Match" ? ["", "← 50 4B (PK) = ZIP، بينما الامتداد ." + f.ext] : []) : []; }
  };
})();
