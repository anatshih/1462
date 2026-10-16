/* FSIM.tools.peexplorer — PE Explorer: File ▸ Open, then Headers Info / Data Directories / Section Headers / Imports (docs/ui-reference.md §11;
   values FSIM.data.case.pe, outputs-spec §ك). Static analysis only: nothing is executed. */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;
  var VIEWS = [["Headers Info", 1], ["Data Directories", 1], ["Section Headers", 1], ["Imports", 1], ["Exports", 0], ["Resources", 0], ["Debug", 0]];
  function hex(n, w) { var s = n.toString(16).toUpperCase(); while (s.length < w) s = "0" + s; return "0x" + s; }

  function importModel() {
    var P = FSIM.data.case.pe;
    return P.imports.map(function (d, i) {
      return { dll: d[0], rva: hex(0x002F5100 + i * 20, 8), funcs: d[1].map(function (f, j) { return { rva: hex(0x002F5400 + i * 0x80 + j * 8, 8), hint: hex((i * 37 + j * 11) % 400, 4), name: f }; }) };
    });
  }

  function build(body, win) {
    var P = FSIM.data.case.pe;
    var s = { file: null, view: "Headers Info", dll: null };
    var root = h("div.ar"); body.appendChild(root);
    root.appendChild(FSIM.core.menubar(root, { File: [["Open…", "open"], ["Save As…"], ["-"], ["Exit"]], View: [["Headers Info"], ["Data Directories"], ["Section Headers"], ["Imports"]], Tools: [["Disassembler"], ["Dependency Scanner"]], Help: [["About PE Explorer"]] }, function (m, key) { if (key === "open") openDialog(); }));
    var tb = h("div.tb", { role: "toolbar" });
    var openBtn = h("button", { type: "button", text: "Open", "data-pe": "open" }); openBtn.addEventListener("click", openDialog); tb.appendChild(openBtn); tb.appendChild(h("span.tb-sep"));
    var vbtns = {};
    VIEWS.forEach(function (v) {
      var b = h("button", { type: "button", text: v[0], "data-view": v[0], "aria-pressed": "false", "aria-disabled": v[1] ? false : "true" });
      b.addEventListener("click", function () { if (!v[1]) { FSIM.core.toast(root, "غير مفعّل في المحاكاة"); return; } if (!s.file) { FSIM.core.toast(root, "افتح ملفاً أولاً (File ▸ Open)."); return; } setView(v[0]); bus.emit("pe:view", { view: v[0] }); });
      vbtns[v[0]] = b; tb.appendChild(b);
    });
    root.appendChild(tb);
    var content = h("div.pe-content"); content.style.flex = "1"; content.style.minHeight = "0"; content.style.overflow = "auto"; content.style.background = "#fff"; content.style.display = "flex"; content.style.flexDirection = "column";
    root.appendChild(content);
    var status = h("div.status-bar", { text: "Ready" }); root.appendChild(status);

    function table(cols, rows, label) { var g = FSIM.core.grid({ columns: cols, rows: rows.map(function (r, i) { return { key: "r" + i, cells: r }; }), label: label, sortable: false }); return g.el; }
    function setView(v) {
      s.view = v; Object.keys(vbtns).forEach(function (k) { vbtns[k].setAttribute("aria-pressed", String(k === v)); });
      content.textContent = "";
      if (!s.file) { content.appendChild(h("p.view-note", { text: "افتح ملفاً تنفيذياً من File ▸ Open (مثلاً update.exe)." })); return; }
      if (v === "Headers Info") {
        content.appendChild(h("div.ev-head", { text: "File type: Executable file (EXE) — Win32 PE" }));
        content.appendChild(table(["Field", "Value"], P.headers, "Headers Info"));
      } else if (v === "Data Directories") content.appendChild(table(["Directory", "RVA", "Size"], P.dataDirs, "Data Directories"));
      else if (v === "Section Headers") {
        content.appendChild(table(["Name", "Virtual Size", "Virtual Address", "Raw Size", "Raw Address", "Characteristics"], P.sections, "Section Headers"));
        content.appendChild(h("div.dd-note", { text: "أقسام باسم UPX0 وUPX1 = الملف مضغوط بـ UPX: يفك نفسه عند التشغيل ويُخفي محتواه عن الفحص الساكن." }));
      } else if (v === "Imports") importsView();
    }
    function importsView() {
      var model = importModel();
      var left = h("div"), right = h("div"); left.style.flex = "0 0 300px"; left.style.overflow = "auto"; right.style.flex = "1"; right.style.overflow = "auto"; right.style.minWidth = "0";
      var wrap = h("div"); wrap.style.display = "flex"; wrap.style.flex = "1"; wrap.style.minHeight = "0"; wrap.appendChild(left); wrap.appendChild(right);
      var gl = FSIM.core.grid({ columns: ["RVA", "Name"], rows: model.map(function (d) { return { key: d.dll, d: d, cells: [d.rva, d.dll] }; }), label: "Imported libraries", sortable: false,
        onSelect: function (r) { s.dll = r.d.dll; showFuncs(r.d); bus.emit("pe:dll", { dll: r.d.dll }); } });
      left.appendChild(gl.el);
      function showFuncs(d) {
        right.textContent = "";
        var gr = FSIM.core.grid({ columns: ["RVA", "Hint", "Name"], rows: d.funcs.map(function (f, i) { return { key: f.name, f: f, cells: [f.rva, f.hint, f.name] }; }), label: "Imported functions of " + d.dll, sortable: false,
          onSelect: function (r) { bus.emit("pe:function", { name: r.f.name, dll: d.dll }); } });
        right.appendChild(gr.el);
      }
      right.appendChild(h("p.view-note", { text: "اختر مكتبة (DLL) من اليسار لترى الدوال المستوردة منها." }));
      content.appendChild(wrap);
      content.appendChild(h("div.dd-note", { text: "في الواقع يُخفي الضغط معظم الاستيرادات حتى فك الضغط؛ المحاكاة تعرض الجدول الكامل بعد الفك." }));
    }

    function openDialog() {
      bus.emit("pe:open-dialog", {});
      var sel = null, list = h("div.dlg-list", { role: "listbox", "aria-label": "Files" });
      P.files.forEach(function (f) {
        var r = h("div", { role: "option", tabindex: "0", "data-file": f.name, text: f.name + "    " + f.path + "    " + f.size });
        r.addEventListener("click", function () { sel = f; Array.prototype.forEach.call(list.children, function (c) { c.classList.toggle("is-selected", c === r); }); });
        list.appendChild(r);
      });
      var ok = h("button.dlg-btn", { type: "button", text: "Open" }), cancel = h("button.dlg-btn", { type: "button", text: "Cancel" });
      var back = h("div.dlg-back", h("div.dlg", { role: "dialog", "aria-modal": "true", "aria-label": "Open File" }, h("h4", { text: "Open File" }), list, h("div.dlg-btns", ok, cancel)));
      root.appendChild(back); cancel.addEventListener("click", function () { back.remove(); });
      ok.addEventListener("click", function () {
        if (!sel) return; back.remove();
        if (!sel.valid) {
          var err = h("div.dlg-back", h("div.dlg", { role: "alertdialog", "aria-modal": "true", "aria-label": "PE Explorer" }, h("p", { text: sel.name + " is not a valid Win32 executable file: the 'MZ' signature is missing (the file starts with '" + sel.magic + "')." }), h("div.dlg-btns", h("button.dlg-btn", { type: "button", text: "OK", onclick: function () { err.remove(); } }))));
          root.appendChild(err); bus.emit("pe:open", { name: sel.name, valid: false }); return;
        }
        s.file = sel; status.textContent = "PE Explorer — " + sel.name; setView("Headers Info"); vbtns["Headers Info"].setAttribute("aria-pressed", "false");
        bus.emit("pe:open", { name: sel.name, valid: true });
      });
    }

    setView("Headers Info");
    function q(sel) { return root.querySelector(sel); }
    body.api = {
      step: function (id) {
        var w = function () { return FSIM.core.sleep(250); };
        if (id === "s2") { openBtn.click(); q('[data-file="update.exe"]').click(); Array.prototype.filter.call(root.querySelectorAll(".dlg-btns button"), function (b) { return b.textContent === "Open"; })[0].click(); return w(); }
        if (id === "s3") { vbtns["Headers Info"].click(); return w(); }
        if (id === "s4") { vbtns["Section Headers"].click(); return w(); }
        if (id === "s5") { vbtns["Imports"].click(); return w(); }
        if (id === "s6") { q('tr[data-key="WS2_32.dll"]').click(); return w(); }
        if (id === "s7") { q('tr[data-key="ADVAPI32.dll"]').click(); return FSIM.core.sleep(150).then(function () { q('tr[data-key="RegSetValueExA"]').click(); return w(); }); }
        return Promise.resolve();
      }
    };
  }

  FSIM.tools.peexplorer = {
    id: "peexplorer", importModel: importModel,
    open: function (stage, o) { o = o || {}; return stage.create({ id: "peexplorer", title: "PE Explorer", icon: "exe", skin: "win", width: o.width || 860, height: o.height || 480, x: o.x != null ? o.x : 16, y: o.y != null ? o.y : 16, build: build }); },
    annotTable: function (src) {
      var P = FSIM.data.case.pe;
      if (src.view === "Section Headers") return { columns: ["Name", "Virtual Size", "Virtual Address", "Raw Size", "Raw Address", "Characteristics"], rows: P.sections.map(function (r) { return { key: r[0], cls: "", cells: r }; }) };
      if (src.view === "Imports") { var rows = []; importModel().forEach(function (d) { d.funcs.forEach(function (f) { rows.push({ key: f.name, cls: "", cells: [d.dll, f.rva, f.hint, f.name] }); }); }); return { columns: ["DLL", "RVA", "Hint", "Name"], rows: rows }; }
      return { columns: ["Field", "Value"], rows: P.headers.map(function (r) { return { key: r[0], cls: "", cells: r }; }) };
    }
  };
})();
