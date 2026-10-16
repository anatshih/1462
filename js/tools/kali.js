/* FSIM.tools.kali — Kali Linux terminal skin on the shared terminal engine (ifconfig, md5sum, nmap). */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h;
  FSIM.core.sim = FSIM.core.sim || { state: "healthy" };

  function preprompt() {
    return h("span", h("span.pb", { text: "┌──(" }), h("span.pg", { text: "kali㉿kali" }), h("span.pb", { text: ")-[" }), h("span", { text: "~" }), h("span.pb", { text: "]" }));
  }
  function prompt() { return h("span", h("span.pb", { text: "└─" }), h("span.pg", { text: "$ " })); }

  function pad(s, n) { s = String(s); while (s.length < n) s += " "; return s; }

  /* nmap output (docs/ui-reference.md §2; values outputs-spec §ك). Only `nmap <ip>` is simulated, for 127.0.0.1 and 192.168.1.23. */
  function nmapLines(target) {
    var N = FSIM.data.case.nmap, T = target === "127.0.0.1" || target === "localhost" ? N.loopback : target === FSIM.data.case.victimIP ? N.victim : null;
    if (!T) return null;
    var w = 0; T.ports.forEach(function (p) { w = Math.max(w, p[0].length); });
    var L = ["Starting Nmap " + N.version + " ( https://nmap.org ) at " + N.when, "Nmap scan report for " + T.host, "Host is up (" + T.latency + " latency).", T.hidden, pad("PORT", w + 1) + "STATE SERVICE"];
    T.ports.forEach(function (p) { L.push(pad(p[0], w + 1) + pad(p[1], 5) + " " + p[2]); });
    if (T.mac) L.push("MAC Address: " + T.mac);
    L.push("", "Nmap done: 1 IP address (1 host up) scanned in " + T.seconds + " seconds");
    return L;
  }

  function compute(cmdline) {
    var parts = cmdline.trim().split(/\s+/), name = parts[0];
    switch (name) {
      case "ifconfig": return { lines: FSIM.data.case.network.kaliIfconfig.slice() };
      case "clear": return { lines: [], clear: true };
      case "ip": return { lines: [], note: "الأمر ip a هو البديل الحديث لـ ifconfig، لكنه غير مفعّل في هذا الدرس؛ استخدم ifconfig." };
      case "md5sum": {
        var f = parts[1];
        if (f === FSIM.data.case.image.name) return { lines: [FSIM.data.case.image.md5 + "  " + f] };
        return { lines: [f ? "md5sum: " + f + ": No such file or directory" : "md5sum: missing operand"] };
      }
      case "nmap": {
        if (parts.length !== 2) return { lines: [], note: "في هذه المحاكاة يعمل nmap بهدف واحد فقط: nmap 127.0.0.1 أو nmap 192.168.1.23." };
        if (!FSIM.core.sim.authorized) return { lines: [], note: "قبل أي فحص: يلزم تفويض كتابي بنطاق الفحص. فعّل خانة «لديّ تفويض» في شريط التطبيقات (فحص أجهزة الآخرين بلا إذن مخالفة)." };
        var L = nmapLines(parts[1]);
        if (!L) return { lines: [], note: "هذا الهدف غير معرّف في القضية؛ يعمل الدرس مع 127.0.0.1 و192.168.1.23 فقط (ولا نفحص أي جهاز خارج نطاق التفويض)." };
        return { lines: L, delay: 380, headCount: 3 };
      }
      case "dd": case "nc": return { lines: [], note: "الأمر «" + name + "» حقيقي في Kali لكنه غير مفعّل في هذه المحاكاة." };
      default: return { lines: ["zsh: command not found: " + name] };
    }
  }

  function exec(cmdline, out) {
    var r = compute(cmdline);
    if (r.clear) { out.clear(); return Promise.resolve(); }
    var head = r.headCount || r.lines.length;
    out.lines(r.lines.slice(0, head));
    return out.stream(r.lines.slice(head), r.delay || 0).then(function () { if (r.note) out.note(r.note); });
  }

  function open(stage, opts) {
    opts = opts || {};
    var term;
    return stage.create({
      id: "kali", title: "kali@kali: ~", icon: "kali", skin: "kali", width: opts.width || 620, height: opts.height || 360,
      x: opts.x != null ? opts.x : 60, y: opts.y != null ? opts.y : 90,
      build: function (body) {
        term = FSIM.core.terminal.create(body, {
          id: "kali", skin: "kali", inputLabel: "Kali terminal input",
          banner: function () { return []; }, preprompt: preprompt, prompt: prompt, exec: exec,
          getState: function () { return FSIM.core.sim.state; }
        });
        body.api = { term: term };
      },
      onFocus: function () { if (term) term.focus(); }
    });
  }

  FSIM.tools.kali = {
    id: "kali", compute: compute, open: open,
    outputOf: function (c) { var prev = FSIM.core.sim.authorized; FSIM.core.sim.authorized = true; var l = compute(c).lines.slice(); FSIM.core.sim.authorized = prev; return l; }
  };
})();
