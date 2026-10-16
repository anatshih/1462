/* Case TR-1261-01 — values copied from docs/outputs-spec.md (the single source of truth, CLAUDE.md §0).
   Fictional company and people; private / documentation IP ranges and .example domains only. */
(function () {
  "use strict";
  var FSIM = (window.FSIM = window.FSIM || {});
  FSIM.data = FSIM.data || {};

  FSIM.data.case = {
    id: "TR-1261-01",
    title: "جهاز المحاسب الذي يتحدث وحده",
    company: "شركة الواحة للتجارة (وهمية)",
    /* unified values table (outputs-spec §ب) */
    hostName: "ACC-PC07",
    user: "sami",
    victimIP: "192.168.1.23",
    subnetMask: "255.255.255.0",
    gateway: "192.168.1.1",
    dnsServer: "192.168.1.1",
    victimMAC: "3C-52-82-4A-91-0C",
    attackerIP: "192.168.1.50",
    attackerName: "LAB-KALI",
    c2IP: "203.0.113.45",
    c2Port: 4444,
    c2Domain: "update-sync.example",
    malware: { name: "update.exe", pid: 6120, path: "C:\\Users\\sami\\AppData\\Roaming\\WinUpdate\\update.exe" },
    runKey: { key: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", value: "WindowsUpdateHelper" },
    implantTime: "10/3/2026 10:17:41 PM",
    failedLogons: 6,
    stolenFolder: "C:\\Users\\sami\\Documents\\Finance\\",
    archive: "C:\\Users\\sami\\AppData\\Local\\Temp\\arc_1003.zip",

    /* ---- Lab 1: network tools (outputs-spec §ج) ---- */
    network: {
      ipv6: "fe80::8d1c:2f4a:61b0:9e27%14",
      adapterDescription: "Intel(R) Wi-Fi 6 AX201 160MHz",
      leaseObtained: "Saturday, October 4, 2026 8:00:12 AM",
      leaseExpires: "Sunday, October 5, 2026 8:00:12 AM",
      apipa: "169.254.38.112",
      googleIP: "142.250.185.78",
      pingLoopback: { replies: ["time<1ms TTL=128", "time<1ms TTL=128", "time<1ms TTL=128", "time<1ms TTL=128"], min: "0ms", max: "0ms", avg: "0ms" },
      pingGoogleDNS: { replies: ["time=24ms TTL=117", "time=23ms TTL=117", "time=31ms TTL=117", "time=24ms TTL=117"], min: "23ms", max: "31ms", avg: "25ms" },
      pingGoogle: { replies: ["time=27ms TTL=116", "time=26ms TTL=116", "time=27ms TTL=116", "time=28ms TTL=116"], min: "26ms", max: "28ms", avg: "27ms" },
      /* [hop, t1, t2, t3, address]  — null times mean "*" */
      tracert: [
        [1, "2 ms", "1 ms", "1 ms", "192.168.1.1"],
        [2, "9 ms", "8 ms", "10 ms", "10.20.0.1"],
        [3, "11 ms", "12 ms", "11 ms", "100.64.12.1"],
        [4, null, null, null, "Request timed out."],
        [5, "18 ms", "17 ms", "19 ms", "198.51.100.9"],
        [6, "22 ms", "21 ms", "23 ms", "198.51.100.61"],
        [7, "25 ms", "24 ms", "26 ms", "142.250.160.1"],
        [8, "27 ms", "26 ms", "27 ms", "142.250.185.78"]
      ],
      kaliIfconfig: [
        "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500",
        "        inet 192.168.1.40  netmask 255.255.255.0  broadcast 192.168.1.255",
        "        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>",
        "        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)",
        "        RX packets 15234  bytes 18234511 (17.3 MiB)",
        "        TX packets 8211  bytes 1022233 (998.2 KiB)",
        "",
        "lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536",
        "        inet 127.0.0.1  netmask 255.0.0.0",
        "        loop  txqueuelen 1000  (Local Loopback)"
      ]
    },

    /* ---- Lab 2: Autoruns (outputs-spec §د-1) ---- */
    autoruns: {
      /* tab → ordered groups; each entry: key, name, desc, publisher, path, time, cls ("", "pink", "yellow") */
      logon: [
        {
          header: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", time: "Sat Oct 4 08:00:05 2026",
          entries: [
            { key: "SecurityHealth", name: "SecurityHealth", desc: "Windows Security notification icon", publisher: "(Verified) Microsoft Windows", path: "C:\\Windows\\system32\\SecurityHealthSystray.exe", time: "Tue Jul 8 03:12:44 2026", cls: "" },
            { key: "RtkAudUService", name: "RtkAudUService", desc: "Realtek HD Audio Universal Service", publisher: "(Verified) Realtek Semiconductor Corp.", path: "C:\\Windows\\System32\\RtkAudUService64.exe", time: "Thu Mar 12 10:21:09 2026", cls: "" }
          ]
        },
        {
          header: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", time: { healthy: "Wed Sep 9 14:02:31 2026", infected: "Fri Oct 3 22:17:41 2026" },
          entries: [
            { key: "OneDrive", name: "OneDrive", desc: "Microsoft OneDrive", publisher: "(Verified) Microsoft Corporation", path: "C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe", time: "Wed Sep 9 14:02:31 2026", cls: "" },
            { key: "WindowsUpdateHelper", name: "WindowsUpdateHelper", desc: "", publisher: "(Not Verified)", path: "C:\\Users\\sami\\AppData\\Roaming\\WinUpdate\\update.exe", time: "Fri Oct 3 22:17:41 2026", cls: "pink", onlyIn: "infected" }
          ]
        }
      ],
      scheduledTasks: [
        {
          header: "Task Scheduler", time: "",
          entries: [
            { key: "PrinterTrayUpdate", name: "\\PrinterTrayUpdate", desc: "", publisher: "", path: "File not found: C:\\Program Files\\OldPrinterTool\\ptray.exe", time: "Mon Jan 5 09:30:00 2026", cls: "yellow" }
          ]
        }
      ]
    },

    /* ---- Lab 2: TCPView (outputs-spec §د-2) — [process, pid, proto, state, localAddr, localPort, remoteAddr, remotePort, key, onlyIn, flash] ---- */
    tcpview: [
      ["System", 4, "TCP", "Listen", "0.0.0.0", 445, "0.0.0.0", 0, "system-445"],
      ["svchost.exe", 1100, "TCP", "Listen", "0.0.0.0", 135, "0.0.0.0", 0, "svchost-135"],
      ["chrome.exe", 8840, "TCP", "Established", "192.168.1.23", 51544, "142.250.185.78", 443, "chrome-51544"],
      ["OneDrive.exe", 7312, "TCP", "Established", "192.168.1.23", 51290, "198.51.100.20", 443, "onedrive-51290"],
      ["update.exe", 6120, "TCP", "Established", "192.168.1.23", 49822, "203.0.113.45", 4444, "update-49822", "infected", "new"],
      ["update.exe", 6120, "TCP", "Listen", "0.0.0.0", 4444, "0.0.0.0", 0, "update-4444", "infected"],
      ["svchost.exe", 2264, "UDP", "", "0.0.0.0", 5353, "*", "*", "svchost-5353"],
      ["chrome.exe", 8840, "TCP", "Time Wait", "192.168.1.23", 51540, "142.250.185.78", 443, "chrome-51540", null, "closing"]
    ],

    /* ---- Lab 2: Process Monitor (outputs-spec §د-3). Rows with noise:true are PROPOSED background activity
       (explorer.exe / chrome.exe) so that filtering has something to remove; awaiting the instructor's approval. ---- */
    procmon: [
      { t: "8:01:59.1204 AM", p: "explorer.exe", pid: 5532, op: "RegQueryValue", path: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\\Start_TrackProgs", res: "SUCCESS", detail: "Type: REG_DWORD, Length: 4, Data: 1", noise: true },
      { t: "8:02:00.5521 AM", p: "chrome.exe", pid: 8840, op: "CreateFile", path: "C:\\Users\\sami\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cookies", res: "SUCCESS", detail: "Desired Access: Generic Read/Write", noise: true },
      { t: "8:02:03.7740 AM", p: "chrome.exe", pid: 8840, op: "TCP Receive", path: "ACC-PC07:51544 -> 142.250.185.78:443", res: "SUCCESS", detail: "Length: 1,448", noise: true },
      { t: "8:02:11.4310 AM", p: "update.exe", pid: 6120, op: "Process Start", path: "", res: "SUCCESS", detail: "Parent PID: 5532 (explorer.exe)" },
      { t: "8:02:11.4402 AM", p: "update.exe", pid: 6120, op: "RegSetValue", path: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\WindowsUpdateHelper", res: "SUCCESS", detail: "Type: REG_SZ, Data: C:\\Users\\sami\\AppData\\Roaming\\WinUpdate\\update.exe" },
      { t: "8:02:11.9120 AM", p: "explorer.exe", pid: 5532, op: "ReadFile", path: "C:\\Windows\\System32\\shell32.dll", res: "SUCCESS", detail: "Offset: 1,048,576, Length: 32,768", noise: true },
      { t: "8:02:12.1033 AM", p: "update.exe", pid: 6120, op: "QueryDirectory", path: "C:\\Users\\sami\\Documents\\Finance", res: "SUCCESS", detail: "FileInformationClass: FileBothDirectoryInformation" },
      { t: "8:02:12.1190 AM", p: "update.exe", pid: 6120, op: "ReadFile", path: "C:\\Users\\sami\\Documents\\Finance\\Q3-Salaries.xlsx", res: "SUCCESS", detail: "Offset: 0, Length: 48,128" },
      { t: "8:02:12.1244 AM", p: "update.exe", pid: 6120, op: "ReadFile", path: "C:\\Users\\sami\\Documents\\Finance\\Suppliers-2026.xlsx", res: "SUCCESS", detail: "Offset: 0, Length: 31,744" },
      { t: "8:02:12.1301 AM", p: "update.exe", pid: 6120, op: "ReadFile", path: "C:\\Users\\sami\\Documents\\Finance\\Bank-Accounts.docx", res: "SUCCESS", detail: "Offset: 0, Length: 22,016" },
      { t: "8:02:12.4087 AM", p: "update.exe", pid: 6120, op: "WriteFile", path: "C:\\Users\\sami\\AppData\\Local\\Temp\\arc_1003.zip", res: "SUCCESS", detail: "Offset: 0, Length: 65,536" },
      { t: "8:02:12.8800 AM", p: "chrome.exe", pid: 8840, op: "TCP Send", path: "ACC-PC07:51544 -> 142.250.185.78:443", res: "SUCCESS", detail: "Length: 517", noise: true },
      { t: "8:02:13.0021 AM", p: "update.exe", pid: 6120, op: "TCP Connect", path: "ACC-PC07:49822 -> 203.0.113.45:4444", res: "SUCCESS", detail: "Length: 0" },
      { t: "8:02:13.0512 AM", p: "update.exe", pid: 6120, op: "TCP Send", path: "ACC-PC07:49822 -> 203.0.113.45:4444", res: "SUCCESS", detail: "Length: 65,536" },
      { t: "8:02:13.2290 AM", p: "update.exe", pid: 6120, op: "RegOpenKey", path: "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender", res: "NAME NOT FOUND", detail: "Desired Access: Read" }
    ],

    /* ---- Lab 2: RAMMap Processes tab (outputs-spec §د-4); values in K ---- */
    rammap: [
      ["update.exe", 1, 6120, 1212416, 2048, 96, 2412, 1216972, "infected"],
      ["chrome.exe", 1, 8840, 418320, 9860, 312, 1880, 430372],
      ["MsMpEng.exe", 0, 3016, 212544, 4112, 64, 920, 217640],
      ["explorer.exe", 1, 5532, 96880, 6220, 140, 640, 103880],
      ["OneDrive.exe", 1, 7312, 61204, 3084, 20, 410, 64718],
      ["notepad.exe", 1, 9012, 4316, 512, 0, 96, 4924]
    ],
    rammapUseCounts: [["Process Private", "≈ 5.1 GB"], ["Mapped File", "≈ 2.3 GB"], ["Paged Pool", "≈ 0.6 GB"], ["Nonpaged Pool", "≈ 0.3 GB"], ["Free / Zeroed", "≈ 4.9 GB"]],

    /* ---- Lab 3: Event Viewer, Security log (outputs-spec §هـ) ---- */
    events: [
      { kw: "Audit Success", time: "10/4/2026 8:01:58 AM", id: 4672, cat: "Special Logon", kind: "special" },
      { kw: "Audit Success", time: "10/4/2026 8:01:58 AM", id: 4624, cat: "Logon", kind: "logon-local" },
      { kw: "Audit Success", time: "10/3/2026 10:31:55 PM", id: 4634, cat: "Logoff", kind: "logoff" },
      { kw: "Audit Success", time: "10/3/2026 10:15:02 PM", id: 4624, cat: "Logon", kind: "logon-breach" },
      { kw: "Audit Failure", time: "10/3/2026 10:14:20 PM", id: 4625, cat: "Logon", kind: "fail" },
      { kw: "Audit Failure", time: "10/3/2026 10:13:02 PM", id: 4625, cat: "Logon", kind: "fail" },
      { kw: "Audit Failure", time: "10/3/2026 10:12:31 PM", id: 4625, cat: "Logon", kind: "fail" },
      { kw: "Audit Failure", time: "10/3/2026 10:11:12 PM", id: 4625, cat: "Logon", kind: "fail" },
      { kw: "Audit Failure", time: "10/3/2026 10:10:39 PM", id: 4625, cat: "Logon", kind: "fail" },
      { kw: "Audit Failure", time: "10/3/2026 10:10:05 PM", id: 4625, cat: "Logon", kind: "fail" },
      { kw: "Audit Success", time: "10/3/2026 5:42:10 PM", id: 4634, cat: "Logoff", kind: "logoff" },
      { kw: "Audit Success", time: "10/3/2026 8:01:44 AM", id: 4672, cat: "Special Logon", kind: "special" },
      { kw: "Audit Success", time: "10/3/2026 8:01:44 AM", id: 4624, cat: "Logon", kind: "logon-local" }
    ],
    eventSource: "Microsoft Windows security auditing.",

    /* ---- Axis 2 (outputs-spec §ح — PROPOSED, awaiting approval) ---- */
    image: {
      name: "ACC-PC07_C.E01", base: "ACC-PC07_C", source: "C:", driveSizeGB: 20, sectorCount: "41,943,040",
      md5: "5f3a9c1e7b2d4806a1c9e0d3f7b84a26", sha1: "9b1c4e7a0d3f58216ac4be90172d6f3580ea41c7",
      caseNumber: "TR-1261-01", evidenceNumber: "EV-001",
      description: "قرص C: لجهاز ACC-PC07 — شركة الواحة للتجارة (وهمية)"
    },
    /* EnCase table: [name, ext, size, signature, deleted, lastWritten, fullPath, folderKey] */
    encaseFiles: [
      ["Q3-Salaries.xlsx", "xlsx", "48,128", "Match", false, "10/4/2026 8:00 AM", "C:\\Users\\sami\\Documents\\Finance\\Q3-Salaries.xlsx", "finance"],
      ["Suppliers-2026.xlsx", "xlsx", "31,744", "Match", false, "10/4/2026 8:00 AM", "C:\\Users\\sami\\Documents\\Finance\\Suppliers-2026.xlsx", "finance"],
      ["Bank-Accounts.docx", "docx", "22,016", "Match", false, "10/4/2026 8:00 AM", "C:\\Users\\sami\\Documents\\Finance\\Bank-Accounts.docx", "finance"],
      ["arc_1003.zip", "zip", "65,536", "Match", true, "10/4/2026 8:02 AM", "C:\\Users\\sami\\AppData\\Local\\Temp\\arc_1003.zip", "temp"],
      ["holiday.jpg", "jpg", "18,432", "Bad signature", false, "10/2/2026 4:15 PM", "C:\\Users\\sami\\Pictures\\holiday.jpg", "pictures"]
    ],
    /* entry names stored inside arc_1003.zip (so a keyword search for "Finance" / "Q3-Salaries" finds the deleted archive) */
    zipEntries: ["Finance\\Q3-Salaries.xlsx", "Finance\\Suppliers-2026.xlsx", "Finance\\Bank-Accounts.docx"],

    /* ---- Axis 3 (outputs-spec §ط — PROPOSED) ---- */
    diskdigger: {
      drive: "C:\\ [NTFS]",
      fileSystem: [{ name: "arc_1003.zip", dir: "\\Users\\sami\\AppData\\Local\\Temp", size: "64.0 KB", date: "10/4/2026 8:02 AM", kind: "zip" }],
      freeSpace: [{ name: "0001.jpg", dir: "", size: "212 KB", date: "", kind: "jpg" }]
    },
    download: {
      official: { site: "diskdigger.org", file: "DiskDigger.exe", sha256: "3e7d9a41c2b8f6054d1e7a93b0c5f28e6a4d17b9c30e85f2a6d1b94c7e0f3a58" },
      thirdParty: { site: "free-pdf-tools.example", file: "DiskDigger-setup.exe", sha256: "b91f04c6d27e3a85f1c9b0e47d63a2158ef40c97b3d6a1e82f05c7d94b3a6e10" }
    },
    veracrypt: { container: "Evidence.hc", folder: "C:\\Users\\Student\\Documents\\", sizeMB: 250, algorithm: "AES", hash: "SHA-512", letter: "M:", wrongPassword: "Incorrect password or not a VeraCrypt volume." },

    /* ---- Axis 4 (outputs-spec §ك — decided by the lead developer on the instructor's delegation) ---- */
    routerMAC: "a4:2b:b0:11:7e:30",

    /* Lab 8: the simulated capture "ACC-PC07-wifi.pcapng" (times in seconds from the first packet) */
    wireshark: (function () {
      var V = "192.168.1.23", R = "192.168.1.1", C2 = "203.0.113.45";
      var VM = "3c:52:82:4a:91:0c", RM = "a4:2b:b0:11:7e:30";
      var queries = [
        ["time.example", 0.31, "198.51.100.10"], ["mail.oasis-trading.example", 0.88, "198.51.100.21"], ["google.com", 1.42, "142.250.185.78"],
        ["cdn.example", 2.05, "198.51.100.30"], ["update-sync.example", 3.10, "203.0.113.45"], ["ocsp.example", 3.66, "198.51.100.40"],
        ["news.example", 4.21, "198.51.100.50"], ["mail.oasis-trading.example", 5.02, "198.51.100.21"], ["google.com", 5.77, "142.250.185.78"],
        ["free-pdf-tools.example", 6.35, "198.51.100.77"], ["time.example", 7.04, "198.51.100.10"], ["update-sync.example", 8.12, "203.0.113.45"],
        ["cdn.example", 9.01, "198.51.100.30"], ["update-sync.example", 9.80, "203.0.113.45"]
      ];
      var ids = [0x3a1f, 0x7b02, 0x5c44, 0x1d9e, 0x91c2, 0x28ab, 0x6e30, 0x4f17, 0xa05d, 0xc3e8, 0x12b6, 0x84f9, 0x37c0, 0xd21e];
      var ev = [];
      function hex4(n) { return ("000" + n.toString(16)).slice(-4); }
      ev.push({ t: 0.000, proto: "ARP", src: VM, dst: "ff:ff:ff:ff:ff:ff", len: 42, info: "Who has " + R + "? Tell " + V, kind: "arp", arp: { op: "request" } });
      ev.push({ t: 0.004, proto: "ARP", src: RM, dst: VM, len: 42, info: R + " is at " + RM, kind: "arp", arp: { op: "reply" } });
      queries.forEach(function (q, i) {
        var sp = 53000 + i * 37, id = "0x" + hex4(ids[i]), nameLen = q[0].length;
        ev.push({ t: q[1], proto: "DNS", src: V, dst: R, len: 58 + nameLen + 2, info: "Standard query " + id + " A " + q[0], kind: "dns", udp: { sport: sp, dport: 53 }, dns: { id: id, name: q[0], resp: false } });
        ev.push({ t: q[1] + 0.02, proto: "DNS", src: R, dst: V, len: 58 + nameLen + 2 + 16, info: "Standard query response " + id + " A " + q[0] + " A " + q[2], kind: "dns", udp: { sport: 53, dport: sp }, dns: { id: id, name: q[0], resp: true, ans: q[2] } });
      });
      function tcp(t, src, dst, sp, dp, flags, seq, ack, win, len, extra) {
        var info = sp + " \u2192 " + dp + " [" + flags + "] Seq=" + seq + (ack !== null ? " Ack=" + ack : "") + " Win=" + win + " Len=" + len + (extra ? " " + extra : "");
        ev.push({ t: t, proto: "TCP", src: src, dst: dst, len: 54 + len + (extra ? 8 : 0), info: info, kind: "tcp", tcp: { sport: sp, dport: dp, flags: flags } });
      }
      /* victim ↔ C2 (update.exe, local port 49822 as in TCPView) */
      tcp(3.350, V, C2, 49822, 4444, "SYN", 0, null, 64240, 0, "MSS=1460 WS=256 SACK_PERM");
      tcp(3.410, C2, V, 4444, 49822, "SYN, ACK", 0, 1, 65535, 0, "MSS=1460");
      tcp(3.4101, V, C2, 49822, 4444, "ACK", 1, 1, 2102272, 0);
      tcp(3.500, V, C2, 49822, 4444, "PSH, ACK", 1, 1, 2102272, 1448);
      tcp(3.520, C2, V, 4444, 49822, "ACK", 1, 1449, 65535, 0);
      tcp(3.530, V, C2, 49822, 4444, "PSH, ACK", 1449, 1, 2102272, 1448);
      tcp(3.540, V, C2, 49822, 4444, "PSH, ACK", 2897, 1, 2102272, 1448);
      tcp(3.580, C2, V, 4444, 49822, "ACK", 1, 4345, 65535, 0);
      tcp(8.400, V, C2, 49822, 4444, "PSH, ACK", 4345, 1, 2102272, 1448);
      tcp(8.430, C2, V, 4444, 49822, "ACK", 1, 5793, 65535, 0);
      /* victim ↔ google.com (browser, local port 51544 as in TCPView) */
      tcp(1.600, V, "142.250.185.78", 51544, 443, "SYN", 0, null, 64240, 0, "MSS=1460 WS=256 SACK_PERM");
      tcp(1.630, "142.250.185.78", V, 443, 51544, "SYN, ACK", 0, 1, 65535, 0, "MSS=1460");
      tcp(1.6301, V, "142.250.185.78", 51544, 443, "ACK", 1, 1, 2102272, 0);
      ev.sort(function (a, b) { return a.t - b.t; });
      ev.forEach(function (p, i) { p.no = i + 1; });
      return { name: "ACC-PC07-wifi.pcapng", packets: ev, dnsQueries: 14, dnsToC2: 3 };
    })(),

    /* Lab 11: nmap output (Kali is 192.168.1.40; its only open port on loopback is SSH) */
    nmap: {
      version: "7.95", when: "2026-10-04 09:41 +0300",
      loopback: { host: "localhost (127.0.0.1)", latency: "0.00010s", hidden: "Not shown: 999 closed tcp ports (reset)", ports: [["22/tcp", "open", "ssh"]], seconds: "0.07" },
      victim: { host: "192.168.1.23", latency: "0.0021s", hidden: "Not shown: 997 filtered tcp ports (no-response)", ports: [["135/tcp", "open", "msrpc"], ["445/tcp", "open", "microsoft-ds"], ["4444/tcp", "open", "krb524"]], mac: "3C:52:82:4A:91:0C (Unknown)", seconds: "4.76" }
    },

    /* Lab 9: Browser History Examiner (Chrome, profile Default of user sami; local time UTC+3) */
    bhe: {
      utcOffsetHours: 3,
      visits: [
        ["10/3/2026 3:02:19 PM", "Oasis Mail \u2014 Inbox", "https://mail.oasis-trading.example/inbox", "Typed", 41, 1, "", "Chrome"],
        ["10/3/2026 12:35:40 PM", "World News", "https://news.example/world", "Typed", 17, 1, "", "Chrome"],
        ["10/3/2026 11:15:33 AM", "free pdf editor - Search", "https://www.google.com/search?q=free+pdf+editor", "Link", 12, 1, "https://www.google.com/", "Chrome"],
        ["10/3/2026 10:02:11 AM", "Invoices", "https://docs.oasis-trading.example/invoices", "Typed", 9, 1, "", "Chrome"],
        ["10/3/2026 11:19:02 AM", "Free PDF Editor \u2014 download", "https://free-pdf-tools.example/pdf-editor-free", "Link", 3, 1, "https://www.google.com/search?q=free+pdf+editor", "Chrome"],
        ["10/3/2026 11:31:48 AM", "PDF-Tools-Free.exe", "https://free-pdf-tools.example/dl/PDF-Tools-Free.exe", "Link", 1, 1, "https://free-pdf-tools.example/pdf-editor-free", "Chrome"],
        ["10/3/2026 8:00:40 AM", "Google", "https://www.google.com/", "Typed", 6, 1, "", "Chrome"]
      ],
      downloads: [["PDF-Tools-Free.exe", "https://free-pdf-tools.example/dl/PDF-Tools-Free.exe", "10/3/2026 11:32:05 AM", "1,126,400 bytes", "C:\\Users\\sami\\Downloads\\PDF-Tools-Free.exe"]],
      searches: [["10/3/2026 11:15:33 AM", "free pdf editor", "Google"], ["10/3/2026 9:12:20 AM", "oasis trading invoice template", "Google"]]
    },

    /* Lab 12: PE Explorer view of update.exe (UPX-packed; values are training values) */
    pe: {
      files: [
        { name: "update.exe", path: "C:\\Users\\sami\\AppData\\Roaming\\WinUpdate\\update.exe", size: "1,021,440 bytes", valid: true },
        { name: "holiday.jpg", path: "C:\\Users\\sami\\Pictures\\holiday.jpg", size: "18,432 bytes", valid: false, magic: "PK" }
      ],
      headers: [
        ["Machine", "Intel386 (0x014C)"], ["Number of Sections", "3"], ["Time Date Stamp", "Fri Oct 2 2026 21:08:44"], ["Pointer to Symbol Table", "0x00000000"],
        ["Size of Optional Header", "0x00E0"], ["Characteristics", "Executable, 32-bit"], ["Magic", "PE32 (0x010B)"], ["Linker Version", "14.0"],
        ["Size of Code", "0x000F8E00"], ["Address of Entry Point", "0x002F4F20"], ["Image Base", "0x00400000"], ["Section Alignment", "0x00001000"],
        ["File Alignment", "0x00000200"], ["Subsystem", "Windows GUI (2)"], ["Size of Image", "0x002FB000"], ["Checksum", "0x00000000"]
      ],
      sections: [
        ["UPX0", "0x00200000", "0x00001000", "0x00000000", "0x00000400", "0xE0000080"],
        ["UPX1", "0x000F8DF0", "0x00201000", "0x000F8E00", "0x00000400", "0xE0000040"],
        [".rsrc", "0x00000300", "0x002FA000", "0x00000400", "0x000F9200", "0xC0000040"]
      ],
      dataDirs: [["Export", "0x00000000", "0x00000000"], ["Import", "0x002F5100", "0x000000F4"], ["Resource", "0x002FA000", "0x00000300"], ["Exception", "0x00000000", "0x00000000"], ["Security", "0x00000000", "0x00000000"], ["Base Relocation", "0x00000000", "0x00000000"], ["Debug", "0x00000000", "0x00000000"], ["TLS", "0x00000000", "0x00000000"], ["IAT", "0x002F5000", "0x00000100"]],
      imports: [
        ["KERNEL32.dll", ["LoadLibraryA", "GetProcAddress", "VirtualAlloc", "GetTempPathA", "CreateFileA", "ReadFile", "WriteFile", "FindFirstFileA", "FindNextFileA", "ExitProcess"]],
        ["ADVAPI32.dll", ["RegOpenKeyExA", "RegSetValueExA", "RegCloseKey"]],
        ["WS2_32.dll", ["WSAStartup", "socket", "connect", "send", "closesocket", "htons", "inet_addr"]],
        ["WININET.dll", ["InternetOpenA", "InternetOpenUrlA", "InternetReadFile", "InternetCloseHandle"]]
      ]
    }
  };
})();
