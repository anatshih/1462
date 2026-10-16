/* FSIM.core.stepper — practice steps: one instruction + reason per step, 3-level hints, completes only on the right action.
   expect: { type:"command", match:"^ipconfig$", state?:"healthy" }  |  { type:"event", name:"autoruns:tab", where:{ tab:"Logon" } } */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;

  function Stepper(host, steps, opts) {
    opts = opts || {};
    var idx = 0, hintLevel = 0, done = [], offs = [], finished = false;
    var mode = opts.mode || "guided";
    var list = h("ol.step-list");
    var progress = h("p.steps-progress", { "aria-live": "polite" });
    host.appendChild(progress);
    host.appendChild(list);
    var items = steps.map(function (st, i) {
      var li = h("li.step", { "data-step": st.id },
        h("div.step-title", h("span.mark", { "aria-hidden": "true", text: String(i + 1) }), h("span.step-name", { text: st.title || st.instruction })));
      list.appendChild(li);
      return li;
    });

    function clearHl() { Array.prototype.forEach.call(document.querySelectorAll(".fsim-hl"), function (e) { e.classList.remove("fsim-hl"); }); }

    var nudgeTimer = null;
    function keepInView() {
      var panel = host.closest(".steps-panel"), li = items[idx];
      if (!panel || !li || panel.scrollHeight <= panel.clientHeight + 4) return;
      var top = li.offsetTop - panel.offsetTop - 70;
      if (li.offsetTop - panel.scrollTop < panel.offsetTop + 40 || li.offsetTop + li.offsetHeight - panel.scrollTop > panel.offsetTop + panel.clientHeight) panel.scrollTop = Math.max(0, top);
    }
    function render() {
      progress.textContent = finished ? "اكتملت الخطوات (" + steps.length + "/" + steps.length + ")" : "الخطوة " + (idx + 1) + " من " + steps.length;
      items.forEach(function (li, i) {
        li.classList.toggle("is-done", i < idx || finished);
        li.classList.toggle("is-current", i === idx && !finished);
        li.classList.toggle("is-locked", i > idx && !finished);
        li.setAttribute("aria-current", i === idx && !finished ? "step" : "false");
        var mark = li.querySelector(".mark");
        mark.textContent = (i < idx || finished) ? "✓" : String(i + 1);
        var d = li.querySelector(".step-detail"); if (d) d.remove();
        if (i === idx && !finished) li.appendChild(detail(steps[i]));
      });
      keepInView();
      clearTimeout(nudgeTimer);
      if (!finished && mode === "guided" && !FSIM.core.config.fast) {
        nudgeTimer = setTimeout(function () {
          var d = items[idx] && items[idx].querySelector(".step-detail");
          if (d && hintLevel === 0 && !d.querySelector(".step-nudge")) d.insertBefore(h("p.step-nudge", { text: "عالق؟ اضغط «تلميح» لتحصل على إشارة صغيرة، ثم وصف، ثم الحل." }), d.querySelector(".hint-row"));
        }, 45000);
      }
    }

    function detail(st) {
      var box = h("div.step-detail");
      box.appendChild(h("div", { text: st.instruction }));
      if (st.why) box.appendChild(h("p.step-why", { text: "لماذا؟ " + st.why }));
      var fb = h("div.step-feedback", { role: "status", hidden: "" });
      var hintBox = h("div.hint-text", { hidden: "", "aria-live": "polite" });
      box.appendChild(fb); box.appendChild(hintBox);
      if (mode === "guided") {
        var btn = h("button.btn", { type: "button", text: "تلميح" });
        var row = h("div.hint-row", btn);
        btn.addEventListener("click", function () {
          hintLevel = Math.min(3, hintLevel + 1);
          var txt = (st.hints || [])[hintLevel - 1] || "";
          hintBox.hidden = false; hintBox.textContent = "";
          hintBox.appendChild(h("strong", { text: ["إشارة", "وصف", "الحل"][hintLevel - 1] + ": " }));
          hintBox.appendChild(document.createTextNode(txt));
          if (hintLevel === 1 && st.target) { var el = document.querySelector(st.target); if (el) el.classList.add("fsim-hl"); }
          if (hintLevel === 3 && st.expect.type === "command" && st.solution && opts.onFill) {
            var fill = h("button.btn", { type: "button", text: "اكتب الأمر لي" });
            fill.addEventListener("click", function () { opts.onFill(st); });
            if (!row.querySelector("[data-fill]")) { fill.setAttribute("data-fill", ""); row.appendChild(fill); }
          }
          btn.textContent = hintLevel < 3 ? "تلميح آخر" : "لا مزيد من التلميحات";
          if (hintLevel >= 3) btn.setAttribute("aria-disabled", "true");
        });
        box.appendChild(row);
      }
      box._fb = fb;
      return box;
    }

    function feedback(msg) {
      var d = items[idx] && items[idx].querySelector(".step-detail");
      if (!d) return;
      var fb = d._fb; fb.hidden = false; fb.textContent = msg;
    }

    function advance() {
      clearHl();
      done.push(steps[idx].id);
      var prevLi = items[idx];
      prevLi.classList.add("just-done"); setTimeout(function () { prevLi.classList.remove("just-done"); }, 1400);
      progress.textContent = "✔ أُنجزت الخطوة " + (idx + 1);
      idx++; hintLevel = 0;
      if (idx >= steps.length) { finished = true; render(); if (opts.onComplete) opts.onComplete(); }
      else { render(); if (opts.onStep) opts.onStep(steps[idx], idx); }
    }

    function matches(st, name, payload) {
      var e = st.expect;
      if (e.type === "command") {
        if (name !== "terminal:command") return null;
        if (e.tool && payload.tool !== e.tool) return null;
        var ok = new RegExp(e.match, e.flags || "i").test(payload.cmd);
        if (ok && e.state && payload.state !== e.state) return "state";
        return ok ? true : false;
      }
      if (e.type === "event") {
        if (name !== e.name) return null;
        var w = e.where || {};
        return Object.keys(w).every(function (k) { return payload[k] === w[k]; });
      }
      return null;
    }

    offs.push(bus.on("*", function (name, payload) {
      if (finished || idx >= steps.length) return;
      var st = steps[idx];
      var r = matches(st, name, payload);
      if (r === true) { advance(); }
      else if (r === "state") { feedback("الأمر صحيح لكن حالة الجهاز الحالية ليست المطلوبة في هذه الخطوة. راجع تعليمة الخطوة."); }
      else if (r === false) {
        if (st.expect.type === "command") feedback(st.onMismatch || "الأمر نُفِّذ، لكنه ليس المطلوب في هذه الخطوة. اقرأ التعليمة مرة أخرى أو اطلب تلميحاً.");
        else feedback(st.onMismatch || "هذا الإجراء ليس المطلوب في هذه الخطوة. اقرأ التعليمة مرة أخرى أو اطلب تلميحاً.");
      }
    }));

    render();
    if (opts.onStep) opts.onStep(steps[0], 0);

    return {
      current: function () { return finished ? null : steps[idx]; },
      index: function () { return idx; },
      isFinished: function () { return finished; },
      destroy: function () { clearTimeout(nudgeTimer); offs.forEach(function (o) { o(); }); clearHl(); host.textContent = ""; }
    };
  }

  FSIM.core.stepper = { create: Stepper };
})();
