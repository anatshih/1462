/* FSIM.tools.cmd — Windows Command Prompt simulation (ipconfig, ping, tracert, hostname, cls).
   All values come from FSIM.data.case (outputs-spec §ج). compute() is pure so the interpretation phase can re-use outputs. */
(function () {
  "use strict";
  var FSIM = window.FSIM, C = function () { return FSIM.data.case; };
  FSIM.core.sim = FSIM.core.sim || { state: "healthy" };

  var PROMPT = "C:\\Users\\Student>";
  var BANNER = ["Microsoft Windows [Version 10.0.22631.4317]", "(c) Microsoft Corporation. All rights reserved.", ""];

  /* real Windows commands that exist but are not part of this lesson's simulation */
  var KNOWN_UNSUPPORTED = ["nslookup", "arp", "route", "systeminfo", "getmac", "whoami", "nbtstat", "net", "taskkill", "dir", "cd", "type", "echo", "help"];

  function pad(s, n) { s = String(s); while (s.length < n) s = " " + s; return s; }

  function ipconfig(all, state) {
    var n = C().network, k = C();
    var L = ["Windows IP Configuration", "", "", "Wireless LAN adapter Wi-Fi:", ""];
    if (all) L.push("   Host Name . . . . . . . . . . . . : " + k.hostName);
    L.push("   Connection-specific DNS Suffix  . : ");
    if (all) {
      L.push("   Description . . . . . . . . . . . : " + n.adapterDescription);
      L.push("   Physical Address. . . . . . . . . : " + k.victimMAC);
      L.push("   DHCP Enabled. . . . . . . . . . . : Yes");
      L.push("   Autoconfiguration Enabled . . . . : Yes");
    }
    L.push("   Link-local IPv6 Address . . . . . : " + n.ipv6);
    if (state === "no-dhcp") {
      L.push("   Autoconfiguration IPv4 Address. . : " + n.apipa);
      L.push("   Subnet Mask . . . . . . . . . . . : 255.255.0.0");
      L.push("   Default Gateway . . . . . . . . . : ");
    } else {
      L.push("   IPv4 Address. . . . . . . . . . . : " + k.victimIP);
      L.push("   Subnet Mask . . . . . . . . . . . : " + k.subnetMask);
      if (all) { L.push("   Lease Obtained. . . . . . . . . . : " + n.leaseObtained); L.push("   Lease Expires . . . . . . . . . . : " + n.leaseExpires); }
      L.push("   Default Gateway . . . . . . . . . : " + k.gateway);
      if (all) { L.push("   DHCP Server . . . . . . . . . . . : " + k.gateway); L.push("   DNS Servers . . . . . . . . . . . : " + k.dnsServer); }
    }
    L.push("", "Ethernet adapter Ethernet:", "", "   Media State . . . . . . . . . . . : Media disconnected", "   Connection-specific DNS Suffix  . : ");
    return { lines: L, delay: 0 };
  }

  function pingBlock(target, label, data, ip) {
    var L = ["Pinging " + label + " with 32 bytes of data:"];
    var replies = data.replies.map(function (r) { return "Reply from " + ip + ": bytes=32 " + r; });
    var stats = ["", "Ping statistics for " + ip + ":", "    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),",
      "Approximate round trip times in milli-seconds:", "    Minimum = " + data.min + ", Maximum = " + data.max + ", Average = " + data.avg];
    return { lines: L.concat(replies, stats), delay: 600, headCount: 1, replyCount: replies.length };
  }

  function ping(target, state) {
    var n = C().network, t = (target || "").toLowerCase();
    if (!t) {
      return { lines: ["", "Usage: ping [-t] [-a] [-n count] [-l size] [-f] [-i TTL] [-v TOS]", "            [-r count] [-s count] [[-j host-list] | [-k host-list]]", "            [-w timeout] [-R] [-S srcaddr] [-c compartment] [-p]", "            [-4] [-6] target_name", "", "Options:", "    -t             Ping the specified host until stopped."], delay: 0 };
    }
    if (t === "127.0.0.1") return pingBlock(t, "127.0.0.1", n.pingLoopback, "127.0.0.1");
    if (t === "8.8.8.8") {
      if (state === "no-dhcp") {
        return { lines: ["Pinging 8.8.8.8 with 32 bytes of data:", "PING: transmit failed. General failure.", "PING: transmit failed. General failure.", "PING: transmit failed. General failure.", "PING: transmit failed. General failure.", "", "Ping statistics for 8.8.8.8:", "    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),"], delay: 400, headCount: 1, replyCount: 4 };
      }
      return pingBlock(t, "8.8.8.8", n.pingGoogleDNS, "8.8.8.8");
    }
    if (t === "google.com") {
      if (state === "dns-broken") return { lines: ["Ping request could not find host google.com. Please check the name and try again."], delay: 0 };
      if (state === "no-dhcp") return { lines: ["PING: transmit failed. General failure."], delay: 0 };
      return pingBlock(t, "google.com [" + n.googleIP + "]", n.pingGoogle, n.googleIP);
    }
    return { lines: [], delay: 0, note: "في هذه المحاكاة يعمل ping مع الأهداف الثلاثة المطلوبة في المختبر فقط: 127.0.0.1 و 8.8.8.8 و google.com." };
  }

  function tracert(target, state) {
    var n = C().network, t = (target || "").toLowerCase();
    if (!t) return { lines: ["", "Usage: tracert [-d] [-h maximum_hops] [-j host-list] [-w timeout]", "               [-R] [-S srcaddr] [-4] [-6] target_name"], delay: 0 };
    if (t !== "google.com") return { lines: [], delay: 0, note: "في هذه المحاكاة يعمل tracert مع google.com فقط." };
    if (state !== "healthy") return { lines: ["Unable to resolve target system name google.com."], delay: 0 };
    var L = ["Tracing route to google.com [" + n.googleIP + "]", "over a maximum of 30 hops:", ""];
    n.tracert.forEach(function (r) {
      if (r[1] === null) { L.push("  " + r[0] + "     *        *        *     " + r[4]); return; }
      L.push(pad(r[0], 3) + pad(r[1], 9) + pad(r[2], 9) + pad(r[3], 9) + "  " + r[4]);
    });
    L.push("", "Trace complete.");
    return { lines: L, delay: 450, headCount: 3 };
  }

  /* Lab 2 (outputs-spec §د-2): netstat -ano and tasklist share the PID 6120 with TCPView / Procmon / RAMMap */
  function netstat(args, state) {
    var a = args.join(" ").toLowerCase();
    if (a !== "-ano") return { lines: [], delay: 0, note: "في هذه المحاكاة يعمل netstat بالخيار -ano فقط." };
    var m = C().malware;
    var L = ["Active Connections", "", "  Proto  Local Address          Foreign Address        State           PID",
      "  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1100",
      "  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING       4"];
    if (state === "infected") L.push("  TCP    0.0.0.0:4444           0.0.0.0:0              LISTENING       " + m.pid);
    if (state === "infected") L.push("  TCP    " + C().victimIP + ":49822     " + C().c2IP + ":" + C().c2Port + "      ESTABLISHED     " + m.pid);
    L.push("  TCP    " + C().victimIP + ":51290     198.51.100.20:443      ESTABLISHED     7312",
      "  TCP    " + C().victimIP + ":51544     " + C().network.googleIP + ":443     ESTABLISHED     8840",
      "  UDP    0.0.0.0:5353           *:*                                    2264");
    return { lines: L, delay: 0 };
  }
  function tasklist(args, state) {
    var m = C().malware, a = args.join(" ");
    if (!/^\/FI "PID eq \d+"$/i.test(a)) return { lines: [], delay: 0, note: "في هذه المحاكاة يعمل tasklist بالصيغة: tasklist /FI \"PID eq 6120\"." };
    if (state === "infected" && /6120/.test(a)) {
      return { lines: ["", "Image Name                     PID Session Name        Session#    Mem Usage", "========================= ======== ================ =========== ============", "update.exe                    " + m.pid + " Console                    1      2,140 K"], delay: 0 };
    }
    return { lines: ["INFO: No tasks are running which match the specified criteria."], delay: 0 };
  }

  /* Lab 4: certutil -hashfile <file> SHA256 — two downloaded files with different (fictional) hashes */
  function certutil(args) {
    var d = C().download, a = args.slice();
    if ((a[0] || "").toLowerCase() !== "-hashfile" || !a[1]) return { lines: [], delay: 0, note: "في هذه المحاكاة يعمل certutil بالصيغة: certutil -hashfile DiskDigger.exe SHA256" };
    var f = a[1], alg = (a[2] || "SHA1").toUpperCase();
    var hit = [d.official, d.thirdParty].filter(function (x) { return x.file.toLowerCase() === f.toLowerCase(); })[0];
    if (!hit) return { lines: ["CertUtil: -hashfile command FAILED: 0x80070002 (WIN32: 2 ERROR_FILE_NOT_FOUND)", "CertUtil: The system cannot find the file specified."], delay: 0 };
    if (alg !== "SHA256") return { lines: [], delay: 0, note: "في هذه المحاكاة يُحسب SHA256 فقط: certutil -hashfile " + hit.file + " SHA256" };
    return { lines: ["SHA256 hash of " + hit.file + ":", hit.sha256, "CertUtil: -hashfile command completed successfully."], delay: 0 };
  }

  /* returns { lines, delay, note?, clear?, headCount? } */
  function compute(cmdline, state) {
    var parts = cmdline.trim().split(/\s+/);
    var name = parts[0].toLowerCase().replace(/\.exe$/, "");
    var args = parts.slice(1);
    if (name === "ipconfig/all") { name = "ipconfig"; args = ["/all"]; }
    switch (name) {
      case "ipconfig": {
        var a = (args[0] || "").toLowerCase();
        if (a === "" ) return ipconfig(false, state);
        if (a === "/all") return ipconfig(true, state);
        return { lines: [], delay: 0, note: "في هذه المحاكاة يعمل ipconfig بدون خيارات وبالخيار /all فقط." };
      }
      case "ping": return ping(args[args.length - 1], state);
      case "tracert": return tracert(args[0], state);
      case "netstat": return netstat(args, state);
      case "tasklist": return tasklist(args, state);
      case "certutil": return certutil(args);
      case "hostname": return { lines: [C().hostName], delay: 0 };
      case "cls": return { lines: [], delay: 0, clear: true };
      case "exit": return { lines: [], delay: 0, note: "في المحاكاة أغلق النافذة بزر ✕ في شريط العنوان." };
      default:
        if (KNOWN_UNSUPPORTED.indexOf(name) >= 0) return { lines: [], delay: 0, note: "الأمر «" + name + "» حقيقي في Windows لكنه غير مفعّل في هذا الدرس." };
        return { lines: ["'" + parts[0] + "' is not recognized as an internal or external command,", "operable program or batch file."], delay: 0 };
    }
  }

  function exec(cmdline, out) {
    var r = compute(cmdline, FSIM.core.sim.state);
    if (r.clear) { out.clear(); return Promise.resolve(); }
    var head = r.headCount || r.lines.length;
    var first = r.lines.slice(0, head);
    var rest = r.lines.slice(head);
    out.lines(first);
    var p = out.stream(rest, r.delay || 0).then(function () { if (r.note) out.note(r.note); });
    return p;
  }

  function open(stage, opts) {
    opts = opts || {};
    var term;
    return stage.create({
      id: "cmd", title: "Command Prompt", icon: "cmd", skin: "cmd", width: opts.width || 700, height: opts.height || 420,
      x: opts.x, y: opts.y,
      build: function (body) {
        term = FSIM.core.terminal.create(body, {
          id: "cmd", skin: "cmd", inputLabel: "Command Prompt input",
          banner: function () { return BANNER.slice(); },
          prompt: function () { return PROMPT; },
          exec: exec,
          getState: function () { return FSIM.core.sim.state; }
        });
        body.api = { term: term };
      },
      onFocus: function () { if (term) term.focus(); }
    });
  }

  FSIM.tools.cmd = {
    id: "cmd", prompt: PROMPT, compute: compute, open: open,
    /* used by the interpretation phase: full output of one command as plain lines */
    outputOf: function (cmdline, state) { return compute(cmdline, state || "healthy").lines.slice(); }
  };
})();
