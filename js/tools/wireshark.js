/* FSIM.tools.wireshark — Wireshark: welcome screen → live (simulated) capture on Wi-Fi → Stop → display filters → packet details.
   Layout per docs/ui-reference.md §3; packets: FSIM.data.case.wireshark (outputs-spec §ك). The display-filter engine is real:
   fields dns / tcp / udp / arp / ip.addr / ip.src / ip.dst / tcp.port / udp.port / dns.flags.response / dns.qry.name / frame.number …
   with == != contains > < >= <= && || ! ( ). Green bar = valid, red = invalid. */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;
  var NS = "http://www.w3.org/2000/svg";
  var V = "192.168.1.23", R = "192.168.1.1", VM = "3c:52:82:4a:91:0c", RM = "a4:2b:b0:11:7e:30";
  var COLS = ["No.", "Time", "Source", "Destination", "Protocol", "Length", "Info"];
  var MENUS = {
    File: [["Open…", "open"], ["Open Recent"], ["Merge…"], ["Import from Hex Dump…"], ["Close"], ["-"], ["Save"], ["Save As…"], ["-"], ["Quit"]],
    Edit: [["Copy"], ["Find Packet…"], ["Preferences…"]], View: [["Main Toolbar"], ["Filter Toolbar"], ["Packet List"], ["Packet Details"], ["Packet Bytes"], ["Colorize Packet List"]],
    Go: [["Go to Packet…"], ["Go to First Packet"], ["Go to Last Packet"]], Capture: [["Options…"], ["Start", "start"], ["Stop", "stop"], ["Restart"], ["Capture Filters…"]],
    Analyze: [["Display Filters…"], ["Follow"]], Statistics: [["Capture File Properties"], ["Conversations"], ["Endpoints"]], Telephony: [["VoIP Calls"]], Wireless: [["WLAN Traffic"]], Tools: [["Firewall ACL Rules"]], Help: [["Contents"], ["About Wireshark"]]
  };
  var TOOLBAR = [["▶", "Start capturing packets", "start"], ["■", "Stop capturing packets", "stop"], ["↻", "Restart current capture"], ["⚙", "Capture options"], ["⏏", "Open a capture file", "open"], ["⎙", "Save this capture file"], ["✕", "Close this capture file"], ["⟳", "Reload this file"],
    ["⌕", "Find a packet"], ["◀", "Go back in packet history"], ["▶", "Go forward in packet history"], ["⇥", "Go to specific packet"], ["⤒", "Go to first packet"], ["⤓", "Go to last packet"], ["⇩", "Automatically scroll during live capture"], ["◐", "Colorize packet list", "color"], ["＋", "Zoom in"], ["－", "Zoom out"], ["⊡", "Reset zoom"], ["⇔", "Resize columns"]];

  function data() { return FSIM.data.case.wireshark; }

  /* ---------- display filter engine ---------- */
  function ethOf(p) { return p.kind === "arp" ? [p.src, p.dst] : [p.src === V ? VM : RM, p.dst === V ? VM : RM]; }
  var FIELDS = {
    "frame.number": function (p) { return [p.no]; }, "frame.len": function (p) { return [p.len]; },
    "ip.addr": function (p) { return p.kind === "arp" ? [] : [p.src, p.dst]; }, "ip.src": function (p) { return p.kind === "arp" ? [] : [p.src]; }, "ip.dst": function (p) { return p.kind === "arp" ? [] : [p.dst]; },
    "eth.addr": function (p) { return ethOf(p); }, "eth.src": function (p) { return [ethOf(p)[0]]; }, "eth.dst": function (p) { return [ethOf(p)[1]]; },
    "tcp.port": function (p) { return p.tcp ? [p.tcp.sport, p.tcp.dport] : []; }, "tcp.srcport": function (p) { return p.tcp ? [p.tcp.sport] : []; }, "tcp.dstport": function (p) { return p.tcp ? [p.tcp.dport] : []; },
    "udp.port": function (p) { return p.udp ? [p.udp.sport, p.udp.dport] : []; }, "udp.srcport": function (p) { return p.udp ? [p.udp.sport] : []; }, "udp.dstport": function (p) { return p.udp ? [p.udp.dport] : []; },
    "dns.flags.response": function (p) { return p.dns ? [p.dns.resp ? 1 : 0] : []; }, "dns.qry.name": function (p) { return p.dns ? [p.dns.name] : []; },
    "dns.id": function (p) { return p.dns ? [p.dns.id] : []; }
  };
  var PROTOS = { eth: function () { return true; }, ip: function (p) { return p.kind !== "arp"; }, tcp: function (p) { return p.kind === "tcp"; }, udp: function (p) { return !!p.udp; }, dns: function (p) { return p.kind === "dns"; }, arp: function (p) { return p.kind === "arp"; }, frame: function () { return true; } };

  function tokenize(src) {
    var t = [], i = 0, m;
    while (i < src.length) {
      var c = src.charAt(i);
      if (/\s/.test(c)) { i++; continue; }
      if (c === "(" || c === ")") { t.push({ k: c }); i++; continue; }
      if ((m = /^(&&|\|\||==|!=|>=|<=|>|<|!)/.exec(src.slice(i)))) { t.push({ k: "op", v: m[1] }); i += m[1].length; continue; }
      if (c === '"') { var j = src.indexOf('"', i + 1); if (j < 0) throw new Error("unterminated string"); t.push({ k: "str", v: src.slice(i + 1, j) }); i = j + 1; continue; }
      if ((m = /^[A-Za-z0-9_.:\-\/]+/.exec(src.slice(i)))) { t.push({ k: "word", v: m[0] }); i += m[0].length; continue; }
      throw new Error("unexpected character " + c);
    }
    return t;
  }
  function compile(text) {
    var src = String(text || "").trim();
    if (!src) return { ok: true, empty: true, fn: function () { return true; } };
    try {
      var tk = tokenize(src), pos = 0;
      var peek = function () { return tk[pos]; }, next = function () { return tk[pos++]; };
      var isOr = function (t) { return t && ((t.k === "op" && t.v === "||") || (t.k === "word" && t.v.toLowerCase() === "or")); };
      var isAnd = function (t) { return t && ((t.k === "op" && t.v === "&&") || (t.k === "word" && t.v.toLowerCase() === "and")); };
      var isNot = function (t) { return t && ((t.k === "op" && t.v === "!") || (t.k === "word" && t.v.toLowerCase() === "not")); };
      function parseOr() { var l = parseAnd(); while (isOr(peek())) { next(); var r = parseAnd(); l = (function (a, b) { return function (p) { return a(p) || b(p); }; })(l, r); } return l; }
      function parseAnd() { var l = parseNot(); while (isAnd(peek())) { next(); var r = parseNot(); l = (function (a, b) { return function (p) { return a(p) && b(p); }; })(l, r); } return l; }
      function parseNot() { if (isNot(peek())) { next(); var e = parseNot(); return function (p) { return !e(p); }; } return parsePrimary(); }
      function parsePrimary() {
        var t = next(); if (!t) throw new Error("unexpected end");
        if (t.k === "(") { var e = parseOr(); if (!peek() || peek().k !== ")") throw new Error("missing )"); next(); return e; }
        if (t.k !== "word") throw new Error("unexpected token");
        var field = t.v.toLowerCase(), nx = peek();
        var opTok = nx && (nx.k === "op" && ["==", "!=", ">=", "<=", ">", "<"].indexOf(nx.v) >= 0 ? nx.v : nx.k === "word" && ["eq", "ne", "contains"].indexOf(nx.v.toLowerCase()) >= 0 ? nx.v.toLowerCase() : null);
        if (!opTok) {
          if (PROTOS[field]) return PROTOS[field];
          if (FIELDS[field]) return function (p) { return FIELDS[field](p).length > 0; };
          throw new Error("unknown field " + field);
        }
        if (!FIELDS[field]) throw new Error("unknown field " + field);
        next();
        var vt = next(); if (!vt || (vt.k !== "word" && vt.k !== "str")) throw new Error("missing value");
        var want = vt.v, op = { eq: "==", ne: "!=" }[opTok] || opTok, get = FIELDS[field];
        var num = /^-?\d+$/.test(want) ? parseInt(want, 10) : null;
        function eqOne(a) { return typeof a === "number" ? (num !== null && a === num) : String(a).toLowerCase() === String(want).toLowerCase(); }
        return function (p) {
          var vals = get(p); if (!vals.length) return op === "!=" ? false : false;
          if (op === "==") return vals.some(eqOne);
          if (op === "!=") return !vals.some(eqOne);
          if (op === "contains") return vals.some(function (a) { return String(a).toLowerCase().indexOf(String(want).toLowerCase()) >= 0; });
          var n = num; if (n === null) throw new Error("numeric value expected");
          return vals.some(function (a) { return typeof a === "number" && (op === ">" ? a > n : op === "<" ? a < n : op === ">=" ? a >= n : a <= n); });
        };
      }
      var fn = parseOr();
      if (pos < tk.length) throw new Error("unexpected trailing token");
      return { ok: true, fn: fn };
    } catch (e) { return { ok: false, error: String(e.message || e), fn: function () { return false; } }; }
  }

  function fmtTime(t) { return t.toFixed(6); }
  function colorClass(p) {
    if (p.kind === "arp") return "ws-arp";
    if (p.kind === "tcp") return /SYN|FIN/.test(p.tcp.flags) ? "ws-syn" : "ws-tcp";
    return "ws-udp";
  }
  function rowOf(p) { return { key: String(p.no), p: p, cls: colorClass(p), cells: [p.no, fmtTime(p.t), p.src, p.dst, p.proto, p.len, p.info] }; }

  /* detail tree: [{ label, layer?, children:[] }] */
  function detailTree(p) {
    var bits = p.len * 8, nodes = [];
    nodes.push({ label: "Frame " + p.no + ": " + p.len + " bytes on wire (" + bits + " bits), " + p.len + " bytes captured (" + bits + " bits)", layer: "Frame", children: ["Interface id: 0 (Wi-Fi)", "Arrival Time: Oct  4, 2026 09:41:" + (10 + Math.floor(p.t)).toString().padStart(2, "0") + " +03", "Frame Number: " + p.no, "Frame Length: " + p.len + " bytes (" + bits + " bits)"] });
    var e = ethOf(p);
    nodes.push({ label: "Ethernet II, Src: " + e[0] + ", Dst: " + e[1], layer: "Ethernet II", children: ["Destination: " + e[1], "Source: " + e[0], "Type: " + (p.kind === "arp" ? "ARP (0x0806)" : "IPv4 (0x0800)")] });
    if (p.kind === "arp") {
      nodes.push({ label: "Address Resolution Protocol (" + p.arp.op + ")", layer: "Address Resolution Protocol", children: ["Hardware type: Ethernet (1)", "Protocol type: IPv4 (0x0800)", "Opcode: " + p.arp.op + " (" + (p.arp.op === "request" ? 1 : 2) + ")", "Sender MAC address: " + p.src, "Sender IP address: " + (p.arp.op === "request" ? V : R), "Target IP address: " + (p.arp.op === "request" ? R : V)] });
      return nodes;
    }
    nodes.push({ label: "Internet Protocol Version 4, Src: " + p.src + ", Dst: " + p.dst, layer: "Internet Protocol Version 4", children: ["0100 .... = Version: 4", ".... 0101 = Header Length: 20 bytes (5)", "Total Length: " + (p.len - 14), "Protocol: " + (p.udp ? "UDP (17)" : "TCP (6)"), "Source Address: " + p.src, "Destination Address: " + p.dst] });
    if (p.udp) {
      nodes.push({ label: "User Datagram Protocol, Src Port: " + p.udp.sport + ", Dst Port: " + p.udp.dport, layer: "User Datagram Protocol", children: ["Source Port: " + p.udp.sport, "Destination Port: " + p.udp.dport, "Length: " + (p.len - 34)] });
      var q = p.dns;
      var ch = ["Transaction ID: " + q.id, q.resp ? "Flags: 0x8180 Standard query response, No error" : "Flags: 0x0100 Standard query", "Questions: 1", "Answer RRs: " + (q.resp ? 1 : 0), "Queries", "    " + q.name + ": type A, class IN"];
      if (q.resp) { ch.push("Answers"); ch.push("    " + q.name + ": type A, class IN, addr " + q.ans); }
      nodes.push({ label: "Domain Name System (" + (q.resp ? "response" : "query") + ")", layer: "Domain Name System", children: ch });
    } else {
      var t = p.tcp, len = parseInt(/Len=(\d+)/.exec(p.info)[1], 10);
      nodes.push({ label: "Transmission Control Protocol, Src Port: " + t.sport + ", Dst Port: " + t.dport + ", Len: " + len, layer: "Transmission Control Protocol", children: ["Source Port: " + t.sport, "Destination Port: " + t.dport, "Flags: [" + t.flags + "]"] });
    }
    return nodes;
  }

  function spark(active) {
    var s = document.createElementNS(NS, "svg"); s.setAttribute("viewBox", "0 0 80 22"); s.setAttribute("aria-hidden", "true"); s.setAttribute("class", "ws-spark");
    var pl = document.createElementNS(NS, "polyline"); pl.setAttribute("fill", "none"); pl.setAttribute("stroke", active ? "#1d8a2e" : "#999"); pl.setAttribute("stroke-width", "1.6");
    pl.setAttribute("points", active ? "0,18 8,16 16,10 24,17 32,6 40,15 48,4 56,14 64,8 72,16 80,12" : "0,18 80,18");
    s.appendChild(pl); return s;
  }

  function build(body, win) {
    var D = data();
    var s = { mode: "welcome", n: 0, timer: null, complete: false, stopped: false, filter: compile(""), filterText: "", color: true, sel: null, openLayers: {} };
    var root = h("div.ar"); body.appendChild(root);
    root.appendChild(FSIM.core.menubar(root, MENUS, function (m, key) { if (key === "open") openFile(); else if (key === "stop") stop(); else if (key === "start") startCapture(); }));

    /* main toolbar */
    var tb = h("div.tb", { role: "toolbar", "aria-label": "Main toolbar" });
    var btns = {};
    TOOLBAR.forEach(function (t) {
      var b = h("button", { type: "button", title: t[1], "aria-label": t[1], text: t[0], "aria-disabled": t[2] ? false : "true" });
      b.addEventListener("click", function () {
        if (t[2] === "start") startCapture(); else if (t[2] === "stop") stop(); else if (t[2] === "open") openFile();
        else if (t[2] === "color") { s.color = !s.color; b.setAttribute("aria-pressed", String(s.color)); refreshRows(); }
        else FSIM.core.toast(root, "غير مفعّل في المحاكاة");
      });
      if (t[2] === "color") b.setAttribute("aria-pressed", "true");
      btns[t[2] || t[1]] = b; tb.appendChild(b);
    });
    root.appendChild(tb);

    /* filter toolbar */
    var fin = h("input", { type: "text", "aria-label": "Display filter", placeholder: "Apply a display filter … <Ctrl-/>", spellcheck: "false", "data-ws": "filter" });
    var apply = h("button", { type: "button", "aria-label": "Apply display filter", title: "Apply display filter", text: "→", "data-ws": "apply" });
    var clear = h("button", { type: "button", "aria-label": "Clear display filter", title: "Clear display filter", text: "✕" });
    var ftb = h("div.tb.ws-filterbar", h("button", { type: "button", "aria-disabled": "true", text: "Bookmarks" }), fin, clear, apply, h("button", { type: "button", "aria-disabled": "true", text: "Recent" }), h("button", { type: "button", "aria-disabled": "true", text: "+" }));
    root.appendChild(ftb);
    function paintFilter() { var f = compile(fin.value); fin.classList.toggle("is-ok", f.ok && !f.empty); fin.classList.toggle("is-bad", !f.ok); fin.title = f.ok ? "" : f.error; }
    fin.addEventListener("input", paintFilter);
    function applyFilter() {
      var f = compile(fin.value); paintFilter();
      if (!f.ok) { FSIM.core.toast(root, "الفلتر خاطئ (الشريط أحمر): " + f.error); bus.emit("wireshark:filter-apply", { text: fin.value.replace(/\s+/g, "").toLowerCase(), valid: false, displayed: 0 }); return; }
      s.filter = f; s.filterText = fin.value; refreshRows();
      bus.emit("wireshark:filter-apply", { text: fin.value.replace(/\s+/g, "").toLowerCase(), valid: true, displayed: displayedCount() });
    }
    apply.addEventListener("click", applyFilter);
    fin.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); applyFilter(); } });
    clear.addEventListener("click", function () { fin.value = ""; applyFilter(); });

    /* panes */
    var stage = h("div"); stage.style.display = "flex"; stage.style.flexDirection = "column"; stage.style.flex = "1"; stage.style.minHeight = "0";
    root.appendChild(stage);
    var status = h("div.status-bar.ws-status", h("span.ws-left", { text: "Ready to load or capture" }), h("span.ws-mid", { text: "No Packets" }), h("span.ws-right", { text: "Profile: Default" }));
    root.appendChild(status);
    function setStatus(left, mid) { status.children[0].textContent = left; status.children[1].textContent = mid; }

    var grid, detail, bytes;
    function visiblePackets() { return D.packets.slice(0, s.n).filter(s.filter.fn); }
    function displayedCount() { return visiblePackets().length; }
    function refreshRows() {
      if (!grid) return;
      grid.setRows(visiblePackets().map(function (p) { var r = rowOf(p); if (!s.color) r.cls = ""; return r; }));
      var d = displayedCount();
      setStatus(s.mode === "capturing" ? "● Capturing from Wi-Fi" : D.name, "Packets: " + s.n + " · Displayed: " + d + " (" + (s.n ? (d * 100 / s.n).toFixed(1) : "0.0") + "%)");
    }

    function showWelcome() {
      stage.textContent = ""; s.mode = "welcome";
      var ifaces = [["Wi-Fi", true], ["Ethernet", false], ["Loopback: Adapter for loopback traffic capture", false]];
      var list = h("div.ws-ifaces", { role: "listbox", "aria-label": "Capture interfaces" });
      ifaces.forEach(function (i) {
        var row = h("div.ws-iface", { role: "option", tabindex: "0", "data-iface": i[0], "aria-selected": "false" }, h("span", { text: i[0] }), spark(i[1]));
        row.addEventListener("click", function () { Array.prototype.forEach.call(list.children, function (c) { c.classList.toggle("is-selected", c === row); c.setAttribute("aria-selected", String(c === row)); }); s.iface = i[0]; });
        row.addEventListener("dblclick", function () { s.iface = i[0]; bus.emit("wireshark:interface", { name: i[0] }); startCapture(); });
        row.addEventListener("keydown", function (e) { if (e.key === "Enter") { s.iface = i[0]; bus.emit("wireshark:interface", { name: i[0] }); startCapture(); } });
        list.appendChild(row);
      });
      var recent = h("button.ec-link", { type: "button", text: D.name, "data-ws": "recent" }); recent.addEventListener("click", function () { openFile(true); });
      stage.appendChild(h("div.ec-home", h("h3", { text: "Welcome to Wireshark" }), h("h4", { text: "Open" }), recent, h("h4", { text: "Capture" }), h("div.dlg-row", h("label", "…using this filter: ", h("input", { type: "text", disabled: "", placeholder: "Enter a capture filter …" }))), list));
      setStatus("Ready to load or capture", "No Packets");
    }

    function showPanes() {
      stage.textContent = "";
      grid = FSIM.core.grid({ columns: COLS, rows: [], label: "Packet List", firstDesc: [], onSelect: function (r) { s.sel = r.p; renderDetail(); bus.emit("wireshark:select", { no: r.p.no, proto: r.p.proto, name: r.p.dns ? r.p.dns.name : "", response: r.p.dns ? r.p.dns.resp : false }); } });
      detail = h("div.ws-detail", { role: "tree", "aria-label": "Packet Details" });
      bytes = h("pre.ws-bytes", { "aria-label": "Packet Bytes" });
      stage.appendChild(grid.el); stage.appendChild(detail); stage.appendChild(bytes);
      detail.textContent = "Select a packet to see its layers."; bytes.textContent = "";
    }
    function renderDetail() {
      detail.textContent = ""; var p = s.sel; if (!p) return;
      detailTree(p).forEach(function (n) {
        var open = !!s.openLayers[n.layer];
        var head = h("button.ws-node", { type: "button", role: "treeitem", "aria-expanded": String(open), "data-layer": n.layer, text: (open ? "▾ " : "▸ ") + n.label });
        head.addEventListener("click", function () { s.openLayers[n.layer] = !open; renderDetail(); bus.emit("wireshark:detail", { layer: n.layer, packet: p.no, open: !open }); });
        detail.appendChild(head);
        if (open) n.children.forEach(function (c) { detail.appendChild(h("div.ws-leaf", { text: c })); });
      });
      var e = ethOf(p).map(function (m) { return m.split(":").map(function (x) { return x.toUpperCase(); }).join(" "); });
      bytes.textContent = "0000  " + (p.kind === "arp" ? e[1] + " " + e[0] + " 08 06" : e[1] + " " + e[0] + " 08 00") + "   Ethernet header (14 bytes)\n…     (بقية البايتات غير معروضة في المحاكاة)";
    }

    function addPacket() {
      if (s.n >= D.packets.length) { s.complete = true; clearInterval(s.timer); return; }
      s.n++; if (s.n >= D.packets.length) s.complete = true;
      refreshRows();
      var wrap = grid.el; wrap.scrollTop = wrap.scrollHeight;
    }
    function startCapture() {
      if (s.mode === "capturing") return;
      if (s.stopped || s.mode === "file") { FSIM.core.toast(root, "التقاط جديد غير مفعّل بعد الإيقاف؛ افتح الملف المحفوظ من File ▸ Open."); return; }
      if (s.iface && s.iface !== "Wi-Fi") { FSIM.core.toast(root, "لا حركة على هذه الواجهة (الرسم مسطّح): اختر Wi-Fi لأن جهاز سامي لاسلكي."); bus.emit("wireshark:interface", { name: s.iface }); return; }
      s.iface = "Wi-Fi"; s.mode = "capturing"; s.n = 0; s.complete = false; showPanes(); refreshRows();
      bus.emit("wireshark:capture-start", { iface: "Wi-Fi" });
      if (FSIM.core.config.fast) { while (s.n < D.packets.length) { s.n++; } s.complete = true; refreshRows(); }
      else s.timer = setInterval(addPacket, 140);
    }
    function stop() {
      if (s.mode !== "capturing") { FSIM.core.toast(root, "لا يوجد التقاط جارٍ."); return; }
      clearInterval(s.timer); s.mode = "stopped"; s.stopped = true;
      setStatus(D.name + " (unsaved)", "Packets: " + s.n + " · Displayed: " + displayedCount());
      refreshRows(); setStatus("Capture stopped", status.children[1].textContent);
      bus.emit("wireshark:stop", { packets: s.n, complete: s.n >= D.packets.length });
    }
    function openFile(direct) {
      var go = function () { s.mode = "file"; s.n = D.packets.length; s.complete = true; s.stopped = true; showPanes(); refreshRows(); bus.emit("wireshark:open-file", { name: D.name }); };
      if (direct) { go(); return; }
      var ok = h("button.dlg-btn", { type: "button", text: "Open" }), cancel = h("button.dlg-btn", { type: "button", text: "Cancel" });
      var back = h("div.dlg-back", h("div.dlg", { role: "dialog", "aria-modal": "true", "aria-label": "Open Capture File" }, h("h4", { text: "Open Capture File" }), h("div.dlg-list", h("div.is-selected", { text: D.name })), h("div.dlg-btns", ok, cancel)));
      root.appendChild(back); ok.addEventListener("click", function () { back.remove(); go(); }); cancel.addEventListener("click", function () { back.remove(); });
    }

    showWelcome();
    function q(sel) { return root.querySelector(sel); }
    function setFilter(text) { fin.value = text; applyFilter(); return FSIM.core.sleep(250); }
    body.api = {
      step: function (id) {
        var w = function () { return FSIM.core.sleep(250); };
        if (id === "s2") { q('[data-iface="Wi-Fi"]').dispatchEvent(new MouseEvent("dblclick", { bubbles: true })); return w(); }
        if (id === "s3") { return new Promise(function (res) { var tick = function () { if (s.complete) { stop(); res(); } else setTimeout(tick, 150); }; tick(); }); }
        if (id === "s4") return setFilter("dns");
        if (id === "s5") return setFilter("dns.flags.response == 0");
        if (id === "s6") { setFilter("dns.qry.name == \"update-sync.example\" && dns.flags.response == 0"); var r = grid.tbody.querySelector("tr"); if (r) r.click(); q('[data-layer="Domain Name System"]').click(); return w(); }
        if (id === "s7") return setFilter("ip.addr == 203.0.113.45");
        if (id === "s8") return setFilter("tcp.port == 4444");
        return Promise.resolve();
      },
      setFilter: setFilter, state: s
    };
  }

  FSIM.tools.wireshark = {
    id: "wireshark", compile: compile, detailTree: detailTree,
    open: function (stage, o) { o = o || {}; return stage.create({ id: "wireshark", title: "The Wireshark Network Analyzer", icon: "autoruns", skin: "win", width: o.width || 860, height: o.height || 600, x: o.x != null ? o.x : 16, y: o.y != null ? o.y : 16, build: build }); },
    annotTable: function (src) {
      var f = compile(src.filter || ""); var rows = data().packets.filter(f.fn).map(rowOf);
      return { columns: COLS, rows: rows.map(function (r) { return { key: r.key, cls: r.cls, cells: r.cells }; }) };
    },
    /* plain-text detail tree of one packet (by number) for the interpretation phase */
    outputOf: function (no) {
      var p = data().packets.filter(function (x) { return String(x.no) === String(no); })[0]; if (!p) return [];
      var out = []; detailTree(p).forEach(function (n) { out.push(n.label); n.children.forEach(function (c) { out.push("    " + c); }); }); return out;
    }
  };
})();
