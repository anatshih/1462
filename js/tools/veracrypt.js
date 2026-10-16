/* FSIM.tools.veracrypt — VeraCrypt: Create Volume wizard (file container), Mount / Unmount (docs/ui-reference.md §9).
   Values: FSIM.data.case.veracrypt (outputs-spec §ط-2, proposed). The password the student chooses is kept in memory only. */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;
  var V = function () { return FSIM.data.case.veracrypt; };
  var LETTERS = ["M:", "N:", "O:", "P:"];

  function field(label, el) { return h("div.field-row", h("label", { text: label }), el); }

  function build(body, win) {
    var s = { containers: {}, mounted: {}, letter: "M:", pathText: "" };
    var root = h("div.ar"); body.appendChild(root);
    root.appendChild(FSIM.core.menubar(root, { Volumes: [["Create New Volume…"], ["Mount Volume"]], System: [["Create an Encrypted System…"]], Favorites: [["Add Mounted Volume to Favorites…"]], Tools: [["Beginner's Tutorial"]], Settings: [["Language…"]], Help: [["User's Guide"]], Homepage: [["VeraCrypt Homepage"]] }, function () {}));

    var list = h("div.vc-list", { role: "listbox", "aria-label": "Drives" });
    var colHead = h("div.ec-vtabs"); ["Drive", "Volume", "Size", "Encryption Algorithm", "Type"].forEach(function (c) { var b = h("button", { type: "button", "aria-disabled": "true", text: c }); colHead.appendChild(b); });
    var createBtn = h("button", { type: "button", text: "Create Volume", "data-vc": "create" });
    var path = h("input", { type: "text", "aria-label": "Volume path", spellcheck: "false", placeholder: "Volume" });
    var selFile = h("button", { type: "button", text: "Select File…", "data-vc": "selectfile" });
    var mountBtn = h("button", { type: "button", text: "Mount", "data-vc": "mount" });
    var never = h("input", { type: "checkbox" }); never.checked = true;
    var box = h("div.vc-box", h("div.row", path), h("div.row", h("label", never, " Never save history"), selFile, h("button", { type: "button", "aria-disabled": "true", text: "Volume Tools…" }), h("button", { type: "button", "aria-disabled": "true", text: "Select Device…" })));
    root.appendChild(colHead); root.appendChild(list);
    root.appendChild(h("div.vc-btns", createBtn, h("button", { type: "button", "aria-disabled": "true", text: "Volume Properties…" }), h("button", { type: "button", "aria-disabled": "true", text: "Wipe Cache" })));
    root.appendChild(box);
    root.appendChild(h("div.vc-btns", mountBtn, h("button", { type: "button", "aria-disabled": "true", text: "Auto-Mount Devices" }), h("button", { type: "button", "aria-disabled": "true", text: "Unmount All" }), h("button", { type: "button", "aria-disabled": "true", text: "Exit" })));
    var status = h("div.status-bar", { text: "Ready." }); root.appendChild(status);

    function renderList() {
      list.textContent = "";
      LETTERS.forEach(function (l) {
        var m = s.mounted[l];
        var row = h("div.fx-row" + (s.letter === l ? ".is-selected" : ""), { role: "option", "aria-selected": String(s.letter === l), "data-letter": l },
          h("span", { text: l }), h("span", { text: m ? m.path : "" }), h("span", { text: m ? m.sizeMB + " MB" : "" }), h("span", { text: m ? m.alg : "" }), h("span", { text: m ? "Normal" : "" }));
        row.style.gridTemplateColumns = "50px 1fr 80px 140px 70px";
        row.addEventListener("click", function () { s.letter = l; renderList(); updateMountBtn(); });
        list.appendChild(row);
      });
    }
    function updateMountBtn() { mountBtn.textContent = s.mounted[s.letter] ? "Unmount" : "Mount"; mountBtn.setAttribute("data-vc", s.mounted[s.letter] ? "unmount" : "mount"); }
    path.addEventListener("input", function () { s.pathText = path.value; });
    selFile.addEventListener("click", function () {
      var last = Object.keys(s.containers).pop();
      path.value = last || V().folder + V().container; s.pathText = path.value;
    });
    createBtn.addEventListener("click", createWizard);
    mountBtn.addEventListener("click", function () {
      if (s.mounted[s.letter]) { unmount(); return; }
      if (!s.pathText.trim()) { FSIM.core.toast(root, "اختر ملف الحاوية أولاً (Select File…)."); return; }
      passwordDialog();
    });

    function unmount() {
      var m = s.mounted[s.letter]; delete s.mounted[s.letter]; renderList(); updateMountBtn();
      status.textContent = "Unmounted " + s.letter + " — الحجم عاد مقفلاً.";
      bus.emit("vc:unmounted", { letter: m ? s.letter : "" });
    }
    function passwordDialog() {
      var pw = h("input", { type: "password", "aria-label": "Password", autocomplete: "off" });
      var ok = h("button.dlg-btn", { type: "button", text: "OK" }), cancel = h("button.dlg-btn", { type: "button", text: "Cancel" });
      var back = h("div.dlg-back", h("div.dlg.wiz", { role: "dialog", "aria-modal": "true", "aria-label": "Enter password" }, h("h4", { text: "Enter password for " + s.pathText }),
        field("Password:", pw),
        h("div.field-row", h("label", { text: "PRF" }), h("select", { "aria-label": "PRF" }, [h("option", { text: "Autodetection" })])),
        h("div.dlg-btns", ok, cancel)));
      root.appendChild(back); pw.focus();
      cancel.addEventListener("click", function () { back.remove(); });
      function go() {
        var c = s.containers[Object.keys(s.containers).filter(function (k) { return k.toLowerCase() === s.pathText.trim().toLowerCase(); })[0]];
        back.remove();
        if (!c || c.password !== pw.value) {
          var dlg = h("div.dlg-back", h("div.dlg", { role: "alertdialog", "aria-modal": "true", "aria-label": "VeraCrypt" }, h("p", { text: V().wrongPassword }), h("div.dlg-btns", h("button.dlg-btn", { type: "button", text: "OK", onclick: function () { dlg.remove(); } }))));
          root.appendChild(dlg);
          bus.emit("vc:mount-fail", {});
          return;
        }
        s.mounted[s.letter] = { path: s.pathText.trim(), sizeMB: c.sizeMB, alg: c.alg }; renderList(); updateMountBtn();
        status.textContent = "Mounted " + s.letter;
        bus.emit("vc:mounted", { letter: s.letter });
      }
      ok.addEventListener("click", go); pw.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    }

    function createWizard() {
      bus.emit("vc:wizard-open", {});
      FSIM.core.wizard(root, {
        title: "VeraCrypt Volume Creation Wizard", ariaLabel: "VeraCrypt Volume Creation Wizard",
        state: { kind: "Create an encrypted file container", type: "Standard VeraCrypt volume", path: "", alg: "AES", hash: "SHA-512", size: "", unit: "MB", pw: "", pw2: "", moves: 0, formatted: false },
        steps: [
          { title: "Volume Type", build: function (el, st) {
              var l = h("div.radio-list"); [["Create an encrypted file container", 1], ["Encrypt a non-system partition/drive", 0], ["Encrypt the system partition or entire system drive", 0]].forEach(function (o) {
                var r = h("input", { type: "radio", name: "vc-kind", value: o[0] }); r.checked = o[0] === st.kind; if (!o[1]) r.disabled = true; l.appendChild(h("label" + (o[1] ? "" : ".is-off"), r, o[0]));
              }); el.appendChild(l);
            } },
          { title: "Volume Type", build: function (el, st) {
              var l = h("div.radio-list"); [["Standard VeraCrypt volume", 1], ["Hidden VeraCrypt volume", 0]].forEach(function (o) {
                var r = h("input", { type: "radio", name: "vc-type", value: o[0] }); r.checked = o[0] === st.type; if (!o[1]) r.disabled = true; l.appendChild(h("label" + (o[1] ? "" : ".is-off"), r, o[0]));
              }); el.appendChild(l); el.appendChild(h("p.wiz-note", { text: "الحجم المخفي (Hidden volume) يُشرح فقط ولا يُطبَّق في الدرس: فتح حجم بكلمة مرور لا يعني رؤية كل ما فيه." }));
            } },
          { title: "Volume Location", build: function (el, st, refresh) {
              var p = h("input", { type: "text", "aria-label": "Volume location", spellcheck: "false", placeholder: "C:\\Users\\Student\\Documents\\Evidence.hc" }); p.value = st.path;
              p.addEventListener("input", function () { st.path = p.value; refresh(); });
              var sf = h("button.dlg-btn", { type: "button", text: "Select File…" }); sf.addEventListener("click", function () { FSIM.core.toast(root, "اكتب مسار الملف: " + V().folder + V().container); });
              el.appendChild(h("div.dlg-row", p, sf));
            }, canNext: function (st) { return !!st.path.trim(); }, onNext: function (st) { var nm = st.path.trim().split("\\").pop(); bus.emit("vc:location", { name: nm }); } },
          { title: "Encryption Options", build: function (el, st) {
              var a = h("select", { "aria-label": "Encryption Algorithm" }, ["AES", "Serpent", "Twofish", "Camellia"].map(function (x) { return h("option", { value: x, text: x }); })); a.value = st.alg;
              var hs = h("select", { "aria-label": "Hash Algorithm" }, ["SHA-512", "Whirlpool", "SHA-256", "Streebog"].map(function (x) { return h("option", { value: x, text: x }); })); hs.value = st.hash;
              a.addEventListener("change", function () { st.alg = a.value; }); hs.addEventListener("change", function () { st.hash = hs.value; });
              el.appendChild(field("Encryption Algorithm", a)); el.appendChild(field("Hash Algorithm", hs));
              el.appendChild(h("p.wiz-note", { text: "AES خوارزمية تشفير قوية شائعة؛ والـ Hash هنا يُستخدم لاشتقاق المفتاح من كلمة المرور." }));
            } },
          { title: "Volume Size", build: function (el, st, refresh) {
              var n = h("input", { type: "text", inputmode: "numeric", "aria-label": "Volume size", size: "8" }); n.value = st.size;
              var u = h("select", { "aria-label": "Unit" }, ["KB", "MB", "GB"].map(function (x) { return h("option", { value: x, text: x }); })); u.value = st.unit;
              n.addEventListener("input", function () { st.size = n.value; refresh(); }); u.addEventListener("change", function () { st.unit = u.value; });
              el.appendChild(h("div.dlg-row", n, u));
            }, canNext: function (st) { return /^\d+$/.test(st.size) && +st.size > 0; },
            onNext: function (st) { bus.emit("vc:size", { mb: st.unit === "MB" ? +st.size : st.unit === "GB" ? +st.size * 1024 : Math.round(+st.size / 1024), alg: st.alg, hash: st.hash }); } },
          { title: "Volume Password", build: function (el, st, refresh) {
              var a = h("input", { type: "password", "aria-label": "Password", autocomplete: "off" }), b = h("input", { type: "password", "aria-label": "Confirm", autocomplete: "off" });
              var note = h("p.wiz-note", { text: "اختر كلمة مرور طويلة وغير شخصية (8 أحرف على الأقل). Next معطّل حتى تتطابق الكلمتان." });
              a.value = st.pw; b.value = st.pw2;
              function upd() { st.pw = a.value; st.pw2 = b.value; note.textContent = a.value && a.value === b.value ? (a.value.length < 8 ? "تطابقتا، لكن الكلمة قصيرة وسهلة التخمين." : "تطابقت الكلمتان.") : "اختر كلمة مرور طويلة وغير شخصية. Next معطّل حتى تتطابق الكلمتان."; refresh(); }
              a.addEventListener("input", upd); b.addEventListener("input", upd);
              el.appendChild(field("Password:", a)); el.appendChild(field("Confirm:", b)); el.appendChild(note);
            }, canNext: function (st) { return !!st.pw && st.pw === st.pw2; }, onNext: function (st) { bus.emit("vc:password", { match: true, strong: st.pw.length >= 8 }); } },
          { title: "Volume Format", nextLabel: "Format", build: function (el, st, refresh) {
              var bar = h("div.rand-bar", h("i")), pad = h("div.mouse-pad", { tabindex: "0", "aria-label": "تحريك الفأرة", text: "حرّك الفأرة بعشوائية فوق هذه المنطقة حتى يصبح المؤشر أخضر" });
              function paint() { var p = Math.min(100, st.moves * 4); bar.firstChild.style.inlineSize = p + "%"; bar.classList.toggle("is-green", p >= 100); refresh(); }
              pad.addEventListener("mousemove", function () { st.moves++; paint(); });
              pad.addEventListener("keydown", function () { st.moves += 5; paint(); });
              el.appendChild(h("p", { text: "Randomness collected from mouse movements" })); el.appendChild(bar); el.appendChild(pad); paint();
            }, canNext: function (st) { return st.moves * 4 >= 100; },
            onNext: function (st) {
              var key = st.path.trim();
              FSIM.core.runProgress(root, { title: "Formatting…", ms: 2500, rows: [["Volume", key], ["Algorithm", st.alg + " / " + st.hash]] }).then(function (ok) {
                if (!ok) return;
                s.containers[key] = { password: st.pw, sizeMB: st.unit === "MB" ? +st.size : st.unit === "GB" ? +st.size * 1024 : Math.round(+st.size / 1024), alg: st.alg };
                var done = h("div.dlg-back", h("div.dlg", { role: "alertdialog", "aria-modal": "true", "aria-label": "VeraCrypt" }, h("p", { text: "The VeraCrypt volume has been successfully created." }), h("div.dlg-btns", h("button.dlg-btn", { type: "button", text: "OK", onclick: function () { done.remove(); } }))));
                root.appendChild(done);
                bus.emit("vc:created", { name: key.split("\\").pop(), alg: st.alg, hash: st.hash, sizeMB: s.containers[key].sizeMB });
              });
            } }
        ],
        onFinish: function () {}
      });
    }

    renderList(); updateMountBtn();
    function q(sel) { return root.querySelector(sel); }
    function fire(el, v) { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }
    function lastDlg() { var l = root.querySelectorAll(".dlg-back"); return l[l.length - 1]; }
    function nextBtn() { return lastDlg().querySelector(".dlg-btns").children[1]; }
    body.api = {
      step: function (id) {
        var w = function () { return FSIM.core.sleep(250); };
        if (id === "s2") { createBtn.click(); return w(); }
        if (id === "s3") { nextBtn().click(); nextBtn().click(); fire(lastDlg().querySelector('input[aria-label="Volume location"]'), V().folder + V().container); nextBtn().click(); return w(); }
        if (id === "s4") { nextBtn().click(); fire(lastDlg().querySelector('input[aria-label="Volume size"]'), "250"); nextBtn().click(); return w(); }
        if (id === "s5") { var d = lastDlg(); fire(d.querySelector('input[aria-label="Password"]'), "Evid3nce-Lab!2026"); fire(d.querySelector('input[aria-label="Confirm"]'), "Evid3nce-Lab!2026"); nextBtn().click(); return w(); }
        if (id === "s6") { var pad = lastDlg().querySelector(".mouse-pad"); for (var i = 0; i < 30; i++) pad.dispatchEvent(new MouseEvent("mousemove", { bubbles: true })); nextBtn().click(); return new Promise(function (res) { var off = bus.on("vc:created", function () { off(); res(); }); }).then(function () { Array.prototype.forEach.call(root.querySelectorAll(".dlg-back button"), function (b) { if (b.textContent === "OK") b.click(); }); }); }
        if (id === "s7") { selFile.click(); mountBtn.click(); fire(lastDlg().querySelector('input[aria-label="Password"]'), "Evid3nce-Lab!2026"); lastDlg().querySelector(".dlg-btns").children[0].click(); return w(); }
        if (id === "s8") { mountBtn.click(); return w(); }
        return Promise.resolve();
      }
    };
  }

  FSIM.tools.veracrypt = {
    id: "veracrypt",
    outputOf: function (kind) {
      var v = V();
      if (kind === "created") return ["The VeraCrypt volume has been successfully created.", "", "Volume: " + v.folder + v.container, "Encryption Algorithm: " + v.algorithm + "   Hash Algorithm: " + v.hash + "   Size: " + v.sizeMB + " MB"];
      if (kind === "error") return [v.wrongPassword];
      return ["Drive  Volume                                        Size     Encryption Algorithm  Type", v.letter + "     " + v.folder + v.container + "   " + v.sizeMB + " MB  " + v.algorithm + "                   Normal"];
    },
    open: function (stage, o) { o = o || {}; return stage.create({ id: "veracrypt", title: "VeraCrypt", icon: "autoruns", skin: "win", width: o.width || 640, height: o.height || 500, x: o.x != null ? o.x : 24, y: o.y != null ? o.y : 16, build: build }); }
  };
})();
