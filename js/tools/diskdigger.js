/* FSIM.tools.diskdigger — DiskDigger (latest merged scan): drive → TRIM notice → file types → scan → two result tabs → recover (docs/ui-reference.md §8).
   Data: FSIM.data.case.diskdigger (outputs-spec §ط-1, proposed). */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;
  var COLS = ["File name", "Directory", "Size", "Date modified"];
  var TABS = ["Found in file system", "Found in free space", "Advanced"];

  function rowsFor(tab) {
    var D = FSIM.data.case.diskdigger, list = tab === "Found in free space" ? D.freeSpace : D.fileSystem;
    return list.map(function (f) { return { key: f.name, f: f, cls: "", cells: [f.name, f.dir, f.size, f.date] }; });
  }

  function build(body, win) {
    var D = FSIM.data.case.diskdigger;
    var s = { screen: "drive", drive: "", tab: "Found in file system", sel: null, mode: "" };
    var root = h("div.ar"); body.appendChild(root);
    var main = h("div"); main.style.display = "flex"; main.style.flexDirection = "column"; main.style.flex = "1"; main.style.minHeight = "0";
    root.appendChild(main);
    var status = h("div.status-bar", { text: "Select a drive to scan." }); root.appendChild(status);
    function btn(text, fn, attrs) { var b = h("button.dlg-btn", Object.assign({ type: "button", text: text }, attrs || {})); b.addEventListener("click", fn); return b; }

    function screenDrive() {
      s.screen = "drive"; main.textContent = "";
      var list = h("div.dlg-list", { role: "listbox", "aria-label": "Drives" }); list.style.maxBlockSize = "none";
      var row = h("div", { role: "option", tabindex: "0", "data-drive": "C:", text: D.drive + "   20 GB   (النسخة الجنائية ACC-PC07_C.E01)" });
      row.addEventListener("click", function () { s.drive = "C:"; row.classList.add("is-selected"); next.disabled = false; });
      list.appendChild(row);
      var next = btn("Next >", function () { bus.emit("dd:drive", { drive: s.drive }); trimNotice(); }); next.disabled = true;
      main.appendChild(h("div.vc-box", h("h4", { text: "Select a drive to scan" }), list, h("div.dlg-btns", next)));
    }
    function trimNotice() {
      var ok = btn("OK", function () { back.remove(); bus.emit("dd:trim", {}); screenTypes(); });
      var back = h("div.dlg-back", h("div.dlg", { role: "dialog", "aria-modal": "true", "aria-label": "TRIM notice" }, h("h4", { text: "Warning: SSD / TRIM" }),
        h("p", { text: "If this drive is an SSD, deleted files may already be erased by the TRIM command, and recovery may fail." }),
        h("p.wiz-note", { text: "في أقراص SSD يمحو TRIM البيانات المحذوفة فعلياً بعد فترة قصيرة؛ لذلك السرعة في الحيازة أهم، وفرص الاستعادة أقل." }), h("div.dlg-btns", ok)));
      root.appendChild(back);
    }
    function screenTypes() {
      s.screen = "types"; main.textContent = ""; status.textContent = "Select the file types to look for.";
      var all = h("input", { type: "radio", name: "dd-mode", value: "All file types" }), spec = h("input", { type: "radio", name: "dd-mode", value: "Specific file types" });
      var go = btn("Next >", function () { bus.emit("dd:types", { mode: s.mode }); scan(); }); go.disabled = true;
      [all, spec].forEach(function (r) { r.addEventListener("change", function () { s.mode = r.value; go.disabled = false; }); });
      main.appendChild(h("div.vc-box", h("h4", { text: "Select the file types to look for" }), h("div.radio-list", h("label", all, "All file types"), h("label", spec, "Specific file types"), h("label.is-off", h("input", { type: "radio", disabled: "" }), "Dig deep / Dig deeper (الإصدارات القديمة — دُمجا في فحص واحد)")), h("div.dlg-btns", go)));
    }
    function scan() {
      FSIM.core.runProgress(root, { title: "Scanning " + D.drive + "…", ms: 4200, rows: [["Mode", s.mode], ["Status", "Scanning file system and free space…"]] }).then(function (ok) { if (ok) screenResults(); });
    }
    var grid, preview, tabsEl, note;
    function screenResults() {
      s.screen = "results"; main.textContent = ""; status.textContent = "Scan complete.";
      tabsEl = h("div.ar-tabs", { role: "tablist" });
      TABS.forEach(function (t) {
        var on = t !== "Advanced";
        var b = h("button.ar-tab" + (on ? "" : ".is-off"), { type: "button", role: "tab", "aria-selected": String(t === s.tab), "data-tab": t, text: t });
        b.addEventListener("click", function () {
          if (!on) { FSIM.core.toast(root, "غير مفعّل في المحاكاة"); return; }
          s.tab = t; s.sel = null; Array.prototype.forEach.call(tabsEl.children, function (x) { x.setAttribute("aria-selected", String(x === b)); }); refresh(); bus.emit("dd:tab", { tab: t });
        });
        tabsEl.appendChild(b);
      });
      var tb = h("div.tb", h("span", { text: "View: List" }), h("button", { type: "button", "aria-disabled": "true", text: "Thumbnails" }), h("button", { type: "button", "aria-disabled": "true", text: "Tree" }),
        h("label", h("input", { type: "checkbox", disabled: "" }), " Show only deleted files"));
      var rec = h("button", { type: "button", text: "Recover selected files…", "data-dd": "recover" }); rec.addEventListener("click", recover); tb.appendChild(rec);
      note = h("div.dd-note");
      grid = FSIM.core.grid({ columns: COLS, rows: [], label: "Scan results", onSelect: function (r) { s.sel = r.f; showPreview(); bus.emit("dd:select", { name: r.f.name, tab: s.tab }); } });
      preview = h("div.ec-vbody"); preview.style.minHeight = "70px"; preview.style.maxHeight = "90px";
      main.appendChild(tb); main.appendChild(tabsEl); main.appendChild(note); main.appendChild(grid.el); main.appendChild(preview);
      refresh();
      bus.emit("dd:results", { files: rowsFor("Found in file system").length + rowsFor("Found in free space").length });
    }
    function refresh() {
      grid.setRows(rowsFor(s.tab));
      note.textContent = s.tab === "Found in free space" ? "المساحة الحرة: ملفات منحوتة (Carving) من توقيعاتها، غالباً بأسماء مولَّدة بلا مسار." : "نظام الملفات: ملفات محذوفة ما زال فهرسها موجوداً، فتظهر بأسمائها ومساراتها.";
      showPreview();
    }
    function showPreview() { preview.textContent = s.sel ? "Preview: " + s.sel.name + "   (" + s.sel.size + ")   " + (s.sel.kind === "zip" ? "PK\u0003\u0004…" : "ÿØÿà JFIF…") : "اختر ملفاً لمعاينته."; }

    function recover() {
      if (!s.sel) { FSIM.core.toast(root, "حدّد ملفاً أولاً."); return; }
      var same = h("input", { type: "radio", name: "dd-dest", value: "C:\\Users\\Student\\Recovered" }), other = h("input", { type: "radio", name: "dd-dest", value: "D:\\Recovered" });
      var ok = btn("OK", function () {
        var v = same.checked ? "same" : other.checked ? "other" : ""; if (!v) return;
        back.remove();
        if (v === "same") { FSIM.core.toast(root, "تحذير: لا تحفظ الملفات المستعادة على القرص نفسه؛ قد تكتب فوق بيانات محذوفة أخرى."); bus.emit("dd:recover", { safe: false, name: s.sel.name }); }
        else { FSIM.core.toast(root, "تمت استعادة " + s.sel.name + " إلى D:\\Recovered."); bus.emit("dd:recover", { safe: true, name: s.sel.name }); }
      }), cancel = btn("Cancel", function () { back.remove(); });
      var back = h("div.dlg-back", h("div.dlg", { role: "dialog", "aria-modal": "true", "aria-label": "Recover selected files" }, h("h4", { text: "Select a folder to save the recovered files" }),
        h("div.radio-list", h("label", same, "C:\\Users\\Student\\Recovered  (القرص الذي تفحصه)"), h("label", other, "D:\\Recovered  (قرص آخر)")), h("div.dlg-btns", ok, cancel)));
      root.appendChild(back);
    }

    screenDrive();
    function q(sel) { return root.querySelector(sel); }
    body.api = {
      step: function (id) {
        var w = function () { return FSIM.core.sleep(250); };
        if (id === "s2") { q('[data-drive="C:"]').click(); Array.prototype.filter.call(root.querySelectorAll("button"), function (b) { return b.textContent === "Next >"; })[0].click(); return w(); }
        if (id === "s3") { Array.prototype.filter.call(root.querySelectorAll(".dlg-btns button"), function (b) { return b.textContent === "OK"; })[0].click(); return w(); }
        if (id === "s4") { var r = q('input[value="All file types"]'); r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); Array.prototype.filter.call(root.querySelectorAll("button"), function (b) { return b.textContent === "Next >" && !b.disabled; })[0].click(); return new Promise(function (res) { var off = bus.on("dd:results", function () { off(); res(); }); }); }
        if (id === "s6") { q('tr[data-key="arc_1003.zip"]').click(); return w(); }
        if (id === "s7") { q('[data-tab="Found in free space"]').click(); q('tr[data-key="0001.jpg"]').click(); return w(); }
        if (id === "s8") { q('[data-dd="recover"]').click(); var o = q('input[value="D:\\\\Recovered"]'); o.checked = true; Array.prototype.filter.call(root.querySelectorAll(".dlg-btns button"), function (b) { return b.textContent === "OK"; })[0].click(); return w(); }
        return Promise.resolve();
      }
    };
  }

  FSIM.tools.diskdigger = {
    id: "diskdigger",
    open: function (stage, o) { o = o || {}; return stage.create({ id: "diskdigger", title: "DiskDigger", icon: "autoruns", skin: "win", width: o.width || 820, height: o.height || 480, x: o.x != null ? o.x : 24, y: o.y != null ? o.y : 16, build: build }); },
    annotTable: function (src) { return { columns: COLS, rows: rowsFor(src.tab).map(function (r) { return { key: r.key, cls: "", cells: r.cells }; }) }; }
  };
})();
