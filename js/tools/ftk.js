/* FSIM.tools.ftk — FTK Imager: Create Disk Image wizard → Create Image → progress → verify results (docs/ui-reference.md §6).
   Values: FSIM.data.case.image (outputs-spec §ح, proposed). */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;
  var IMAGE_TYPES = [["Raw (dd)", "نسخة خام بحجم القرص"], ["SMART", ""], ["E01", "صيغة جنائية: تضغط وتحفظ بيانات القضية وقيم Hash"], ["AFF", ""]];

  function verifyLines() {
    var i = FSIM.data.case.image;
    return ["Drive/Image Verify Results", "Name                " + i.name, "Sector count        " + i.sectorCount, "MD5 Hash",
      "  Computed hash     " + i.md5, "  Report Hash       " + i.md5, "  Verify result     Match", "SHA1 Hash",
      "  Computed hash     " + i.sha1, "  Report Hash       " + i.sha1, "  Verify result     Match", "Bad Blocks List     No bad blocks found in image"];
  }
  function row(label, el) { return h("div.field-row", h("label", { text: label }), el); }
  function input(val, opts) { var i = h("input", Object.assign({ type: "text", spellcheck: "false" }, opts || {})); i.value = val || ""; return i; }

  function build(body, win) {
    var I = FSIM.data.case.image;
    var s = { dests: [], running: false, verify: true, cur: null };
    var root = h("div.ar"); body.appendChild(root);
    root.appendChild(FSIM.core.menubar(root, {
      File: [["Add Evidence Item…"], ["Add All Attached Devices"], ["Image Mounting…"], ["Remove Evidence Item"], ["-"], ["Create Disk Image…", "create"], ["Export Disk Image…"], ["-"], ["Exit"]],
      View: [["Evidence Tree"], ["File List"], ["Properties"]], Mode: [["Common"], ["Registry"], ["Hex"]], Help: [["Contents"], ["About FTK Imager"]]
    }, function (menu, key) { if (key === "create") openFlow(); }));
    var tb = h("div.tb");
    tb.appendChild(h("button", { type: "button", "aria-disabled": "true", text: "Add Evidence Item" }));
    var createBtn = h("button", { type: "button", text: "Create Disk Image", "data-ftk": "create" });
    createBtn.addEventListener("click", openFlow);
    tb.appendChild(createBtn);
    root.appendChild(tb);
    var panes = h("div.ftk",
      h("div", h("div.pane-title", { text: "Evidence Tree" }), h("span.muted", { text: "لا يوجد دليل مُضاف. استخدم Create Disk Image لإنشاء نسخة." })),
      h("div", h("div.pane-title", { text: "File List" })),
      h("div", h("div.pane-title", { text: "Properties" })),
      h("div", h("div.pane-title", { text: "Viewer" })));
    root.appendChild(panes);
    root.appendChild(h("div.status-bar", { text: "Ready." }));

    function openFlow() {
      bus.emit("ftk:wizard-open", {});
      s.cur = FSIM.core.wizard(root, {
        title: "Create Image", ariaLabel: "Select Source",
        steps: [
          { title: "Select Source", build: function (el, st, refresh) {
              st.source = st.source || "";
              var opts = [["Physical Drive", 1], ["Logical Drive", 1], ["Image File", 1], ["Contents of a Folder", 1], ["Fernico Device (Multiple CD/DVD)", 0]];
              var list = h("div.radio-list", { role: "radiogroup", "aria-label": "Please select the source evidence type" });
              opts.forEach(function (o) {
                var r = h("input", { type: "radio", name: "ftk-src", value: o[0] }); if (!o[1]) r.disabled = true;
                r.checked = st.source === o[0];
                r.addEventListener("change", function () { st.source = o[0]; refresh(); });
                list.appendChild(h("label" + (o[1] ? "" : ".is-off"), r, o[0]));
              });
              el.appendChild(h("p", { text: "Please select the source you want to make an image of:" })); el.appendChild(list);
              el.appendChild(h("p.wiz-note", { text: "Physical Drive = القرص كله بكل أقسامه • Logical Drive = قسم واحد مثل C: • Image File = ملف نسخة موجود • Contents of a Folder = مجلد (لا يشمل المحذوف)." }));
            }, canNext: function (st) { return !!st.source; },
            onNext: function (st) { bus.emit("ftk:source", { type: st.source }); if (st.source !== "Logical Drive") { /* other sources are not simulated */ FSIM.core.toast(root, "في هذه المحاكاة مصدر المختبر هو Logical Drive (قسم C:)؛ اختياراتك الأخرى غير مفعّلة."); return false; } } },
          { title: "Select Drive", build: function (el, st, refresh) {
              var sel = h("select", { "aria-label": "Source Drive Selection" }, [h("option", { value: "", text: "— اختر —" }), h("option", { value: "C:", text: "C:\\ - [NTFS]" })]);
              sel.value = st.drive || "";
              sel.addEventListener("change", function () { st.drive = sel.value; refresh(); });
              el.appendChild(h("p", { text: "Source Drive Selection" })); el.appendChild(sel);
            }, canNext: function (st) { return !!st.drive; }, nextLabel: "Finish" }
        ],
        onFinish: function (st) { bus.emit("ftk:drive", { drive: st.drive }); openCreateImage(st.drive); }
      });
    }

    function openCreateImage(drive) {
      var back, list = h("div.dlg-list", { "aria-label": "Image Destination(s)" });
      var verify = h("input", { type: "checkbox" }); verify.checked = true;
      var pre = h("input", { type: "checkbox" }); pre.checked = true;
      var dirs = h("input", { type: "checkbox" });
      var start = h("button", { type: "button", text: "Start", disabled: "" }), cancel = h("button", { type: "button", text: "Cancel" });
      var add = h("button.dlg-btn", { type: "button", text: "Add…", "data-ftk": "add" }), rem = h("button.dlg-btn", { type: "button", text: "Remove All" });
      function renderList() {
        list.textContent = "";
        s.dests.forEach(function (d) { list.appendChild(h("div", { text: d.folder + d.name + (d.type === "E01" ? ".E01" : d.type === "Raw (dd)" ? ".001" : "") + "   [" + d.type + "]" })); });
        start.disabled = !s.dests.length;
      }
      add.addEventListener("click", addDestination);
      rem.addEventListener("click", function () { s.dests = []; renderList(); });
      cancel.addEventListener("click", function () { back.remove(); });
      start.addEventListener("click", function () { s.verify = verify.checked; back.remove(); run(); });
      var dlg = h("div.dlg", { role: "dialog", "aria-modal": "true", "aria-label": "Create Image" }, h("h4", { text: "Create Image" }),
        h("div.dlg-row", h("b", { text: "Image Source:" }), h("span", { text: drive + "\\" })),
        h("div", { text: "Image Destination(s)" }), list, h("div.dlg-row", add, h("button.dlg-btn", { type: "button", "aria-disabled": "true", text: "Edit…" }), h("button.dlg-btn", { type: "button", "aria-disabled": "true", text: "Remove" }), rem),
        h("div.dlg-row", h("label", verify, " Verify images after they are created")),
        h("div.dlg-row", h("label", pre, " Precalculate Progress Statistics")),
        h("div.dlg-row", h("label", dirs, " Create directory listings of all files in the image after they are created")),
        h("div.dlg-btns", start, cancel));
      back = h("div.dlg-back", dlg); root.appendChild(back); s.cdlg = { el: dlg, back: back, verify: verify, start: start, add: add };
      renderList();

      function addDestination() {
        var w = FSIM.core.wizard(root, {
          title: "Create Image", ariaLabel: "Select Image Type", state: { type: "", caseNumber: "", evidenceNumber: "", description: "", examiner: "", notes: "", folder: "C:\\Evidence\\", name: "", frag: "1500", comp: "6" },
          steps: [
            { title: "Select Image Type", build: function (el, st, refresh) {
                var list2 = h("div.radio-list", { role: "radiogroup" });
                IMAGE_TYPES.forEach(function (t) {
                  var r = h("input", { type: "radio", name: "ftk-type", value: t[0] }); r.checked = st.type === t[0];
                  r.addEventListener("change", function () { st.type = t[0]; refresh(); });
                  list2.appendChild(h("label", r, t[0] + (t[1] ? "  — " + t[1] : "")));
                });
                el.appendChild(h("p", { text: "Please Select the Destination Image Type" })); el.appendChild(list2);
              }, canNext: function (st) { return !!st.type; }, onNext: function (st) { bus.emit("ftk:imagetype", { type: st.type }); } },
            { title: "Evidence Item Information", build: function (el, st, refresh) {
                [["Case Number:", "caseNumber"], ["Evidence Number:", "evidenceNumber"], ["Unique Description:", "description"], ["Examiner:", "examiner"]].forEach(function (f) {
                  var i = input(st[f[1]], { "aria-label": f[0].replace(":", "") }); i.addEventListener("input", function () { st[f[1]] = i.value; refresh(); }); el.appendChild(row(f[0], i));
                });
                var n = h("textarea", { "aria-label": "Notes" }); n.value = st.notes; n.addEventListener("input", function () { st.notes = n.value; });
                el.appendChild(row("Notes:", n));
                el.appendChild(h("p.wiz-note", { text: "تنبيه: اترك الحقول كاملة؛ فجوة في بيانات الدليل أو سلسلة الحيازة قد تُضعف الدليل أمام المحكمة." }));
              }, onNext: function (st) { bus.emit("ftk:info", { caseNumber: st.caseNumber, hasCase: !!st.caseNumber.trim(), examiner: !!st.examiner.trim() }); } },
            { title: "Select Image Destination", build: function (el, st, refresh) {
                var f = input(st.folder, { "aria-label": "Image Destination Folder" }), nm = input(st.name, { "aria-label": "Image Filename (Excluding Extension)" });
                var fr = input(st.frag, { "aria-label": "Image Fragment Size (MB)" }), co = h("select", { "aria-label": "Compression" }, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return h("option", { value: String(n), text: String(n) }); }));
                co.value = st.comp;
                var browse = h("button.dlg-btn", { type: "button", text: "Browse" }); browse.addEventListener("click", function () { FSIM.core.toast(root, "اختيار المجلد غير مفعّل في المحاكاة؛ اكتب المسار مباشرة."); });
                f.addEventListener("input", function () { st.folder = f.value; }); nm.addEventListener("input", function () { st.name = nm.value; refresh(); });
                fr.addEventListener("input", function () { st.frag = fr.value; }); co.addEventListener("change", function () { st.comp = co.value; });
                el.appendChild(row("Image Destination Folder", h("div.dlg-row", f, browse)));
                el.appendChild(row("Image Filename (Excluding Extension)", nm));
                el.appendChild(row("Image Fragment Size (MB)", fr));
                el.appendChild(row("Compression (0=None, 1=Fastest, ..., 9=Smallest)", co));
                var ad = h("input", { type: "checkbox", disabled: "" }); el.appendChild(h("label", ad, " Use AD Encryption"));
              }, canNext: function (st) { return !!st.name.trim(); }, nextLabel: "Finish" }
          ],
          onFinish: function (st) { s.dests.push(Object.assign({}, st)); renderList(); bus.emit("ftk:dest", { name: st.name, type: st.type, folder: st.folder }); }
        });
        s.cur = w;
      }
    }

    function run() {
      if (s.running) return Promise.resolve();
      s.running = true;
      var d = s.dests[0] || {};
      bus.emit("ftk:start", { verify: s.verify });
      return FSIM.core.runProgress(root, { title: "Creating Image…", ms: 5200, rows: [["Source", FSIM.data.case.image.source + "\\"], ["Destination", (d.folder || "") + (d.name || "")], ["Status", "Creating image…"]] })
        .then(function (ok) {
          if (!ok) { s.running = false; return; }
          var after = s.verify ? FSIM.core.runProgress(root, { title: "Verifying…", ms: 3400, rows: [["Image", I.name], ["Status", "Verifying image…"]] }) : Promise.resolve(true);
          return after.then(function (ok2) {
            s.running = false; if (!ok2) return;
            var box = h("div.verify-box", { text: s.verify ? verifyLines().join("\n") : "Image created.\nVerification skipped: لم تُقارَن قيمة Hash للنسخة بالأصل، فالنسخة غير موثّقة." });
            var close = h("button.dlg-btn", { type: "button", text: "Close" });
            var back = h("div.dlg-back", h("div.dlg", { role: "dialog", "aria-modal": "true", "aria-label": "Drive/Image Verify Results" }, box, h("div.dlg-btns", close)));
            close.addEventListener("click", function () { back.remove(); });
            root.appendChild(back);
            bus.emit("ftk:results", { verified: s.verify, md5: s.verify ? I.md5 : "", info: !!(d.caseNumber) });
          });
        });
    }

    /* scripted helpers for "watch" mode — drive the same DOM the student uses */
    function wait(ms) { return FSIM.core.sleep(ms); }
    function nextBtn() { var l = root.querySelectorAll(".dlg-back"); var d = l[l.length - 1]; return d ? d.querySelector(".dlg-btns").children[1] : null; }
    function fire(el, v) { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }
    body.api = {
      step: function (id) {
        var last = function () { var l = root.querySelectorAll(".dlg-back"); return l[l.length - 1]; };
        if (id === "s2") { openFlow(); return wait(300); }
        if (id === "s3") { var r = last().querySelector('input[value="Logical Drive"]'); r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); nextBtn().click(); return wait(300); }
        if (id === "s4") { fire(last().querySelector("select"), "C:"); nextBtn().click(); return wait(300); }
        if (id === "s5") { s.cdlg.add.click(); var b = last(); var e = b.querySelector('input[value="E01"]'); e.checked = true; e.dispatchEvent(new Event("change", { bubbles: true })); nextBtn().click(); return wait(300); }
        if (id === "s6") { var b2 = last(); fire(b2.querySelector('input[aria-label="Case Number"]'), I.caseNumber); fire(b2.querySelector('input[aria-label="Evidence Number"]'), I.evidenceNumber); fire(b2.querySelector('input[aria-label="Examiner"]'), "Student"); nextBtn().click(); return wait(300); }
        if (id === "s7") { fire(last().querySelector('input[aria-label="Image Filename (Excluding Extension)"]'), I.base); nextBtn().click(); return wait(300); }
        if (id === "s8") { s.cdlg.start.click(); return new Promise(function (res) { var off = bus.on("ftk:results", function () { off(); res(); }); }); }
        return Promise.resolve();
      }
    };
  }

  FSIM.tools.ftk = {
    id: "ftk", verifyLines: verifyLines, outputOf: function () { return verifyLines(); },
    open: function (stage, o) { o = o || {}; return stage.create({ id: "ftk", title: "AccessData FTK Imager", icon: "autoruns", skin: "win", width: o.width || 860, height: o.height || 500, x: o.x != null ? o.x : 20, y: o.y != null ? o.y : 16, build: build }); }
  };
})();
