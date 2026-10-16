/* FSIM.core.terminal — one terminal engine for CMD and Kali.
   A tool supplies { skin, banner(), prompt(), exec(cmdline, out) }; the engine draws, handles history and emits
   "terminal:command" on the bus so the stepper can check progress. Student text only ever goes through textContent. */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus, sleep = FSIM.core.sleep;

  function create(host, spec) {
    var history = [], hIdx = 0, busy = false;
    var outEl = h("div.term-log", { role: "log", "aria-live": "off" });
    var promptEl = h("span.term-prompt");
    var input = h("input.term-input", {
      type: "text", spellcheck: "false", autocomplete: "off", autocapitalize: "off", "aria-label": spec.inputLabel || "Command input", dir: "ltr"
    });
    var preEl = h("div.term-pre");
    var line = h("div.term-input-row", promptEl, input);
    var row = h("div.term-input-wrap", preEl, line);
    var term = h("div.term", { "data-skin": spec.skin || "cmd" }, outEl, row);
    host.appendChild(term);

    function renderPrompt() {
      preEl.textContent = "";
      if (spec.preprompt) preEl.appendChild(spec.preprompt());
      promptEl.textContent = "";
      var p = spec.prompt();
      if (typeof p === "string") promptEl.textContent = p;
      else promptEl.appendChild(p);
    }

    function scroll() { term.scrollTop = term.scrollHeight; }

    var out = {
      line: function (text, cls) { var l = h("div.term-line" + (cls ? "." + cls : ""), { text: text === "" ? " " : text }); outEl.appendChild(l); scroll(); return l; },
      lines: function (arr) { arr.forEach(function (t) { out.line(t); }); },
      note: function (text) { out.line("ℹ " + text, "t-note"); },
      clear: function () { outEl.textContent = ""; },
      stream: function (arr, delay) {
        return arr.reduce(function (p, t) {
          return p.then(function () { out.line(t); return sleep(delay == null ? 0 : delay); });
        }, Promise.resolve());
      },
      sleep: sleep
    };

    function banner() { (spec.banner ? spec.banner() : []).forEach(function (t) { out.line(t); }); }

    function submit(raw) {
      var cmd = raw.replace(/\s+$/, "");
      if (spec.preprompt) { var pl = h("div.term-line"); pl.appendChild(spec.preprompt()); outEl.appendChild(pl); }
      var echo = h("div.term-line");
      var p = spec.prompt();
      if (typeof p === "string") echo.appendChild(document.createTextNode(p));
      else echo.appendChild(p.cloneNode(true));
      echo.appendChild(document.createTextNode(cmd));
      outEl.appendChild(echo);
      if (cmd.trim() !== "") { history.push(cmd); }
      hIdx = history.length;
      input.value = "";
      if (cmd.trim() === "") { scroll(); return Promise.resolve(); }
      busy = true; term.classList.add("is-busy");
      var norm = cmd.trim().replace(/\s+/g, " ");
      return Promise.resolve(spec.exec(norm, out)).catch(function (e) {
        if (window.console) console.error(e);
        out.line("The system cannot complete the operation.");
      }).then(function () {
        busy = false; term.classList.remove("is-busy");
        renderPrompt();
        bus.emit("terminal:command", { tool: spec.id, cmd: norm, state: spec.getState ? spec.getState() : null });
        scroll();
        if (!host.hidden) input.focus({ preventScroll: true });
      });
    }

    input.addEventListener("keydown", function (e) {
      if (busy) { e.preventDefault(); return; }
      if (e.key === "Enter") { e.preventDefault(); submit(input.value); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (hIdx > 0) { hIdx--; input.value = history[hIdx]; } }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; } else { hIdx = history.length; input.value = ""; } }
      else if (e.key === "l" && e.ctrlKey && spec.skin === "kali") { e.preventDefault(); out.clear(); }
    });
    term.addEventListener("click", function () {
      if (window.getSelection && String(window.getSelection()) !== "") return;
      input.focus({ preventScroll: true });
    });

    banner();
    renderPrompt();

    return {
      el: term, input: input, out: out,
      focus: function () { input.focus({ preventScroll: true }); },
      refreshPrompt: renderPrompt,
      clear: function () { out.clear(); },
      /* used by "watch" mode and hint level 3 */
      typeAndRun: function (text) {
        var i = 0;
        input.value = "";
        return new Promise(function (resolve) {
          (function tick() {
            if (i < text.length) { input.value += text.charAt(i++); setTimeout(tick, FSIM.core.config.fast ? 0 : 45); }
            else setTimeout(function () { submit(input.value).then(resolve); }, FSIM.core.config.fast ? 0 : 250);
          })();
        });
      },
      fill: function (text) { input.value = text; input.focus({ preventScroll: true }); },
      isBusy: function () { return busy; }
    };
  }

  FSIM.core.terminal = { create: create };
})();
