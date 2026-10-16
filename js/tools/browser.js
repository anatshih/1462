/* FSIM.tools.browser — a tiny generic browser window for Lab 4 (safe download): a results page, the official site (with a published
   SHA256) and a third-party site. Nothing is downloaded or fetched: "Download" only records a simulated file. */
(function () {
  "use strict";
  var FSIM = window.FSIM, h = FSIM.core.h, bus = FSIM.core.bus;

  function build(body, win) {
    var D = FSIM.data.case.download;
    var s = { page: "results", downloads: [] };
    var url = h("div.br-url", { text: "search.example/?q=DiskDigger+download" });
    var page = h("div.br-page", { role: "document" });
    var dlList = h("div.status-bar", { text: "Downloads: (لا شيء بعد)" });
    var backBtn = h("button", { type: "button", text: "◀", "aria-label": "Back" });
    var bar = h("div.br-bar", backBtn, url);
    body.appendChild(bar); body.appendChild(page); body.appendChild(dlList);
    backBtn.addEventListener("click", function () { show("results"); });

    function download(site, file) {
      s.downloads.push(file); dlList.textContent = "Downloads: " + s.downloads.join(" ، ") + "  → C:\\Users\\Student\\Downloads";
      bus.emit("br:download", { site: site, file: file });
    }
    function show(p) {
      s.page = p; page.textContent = "";
      if (p === "results") {
        url.textContent = "search.example/?q=DiskDigger+download";
        page.appendChild(h("h3", { text: "Search results: DiskDigger download" }));
        [["DiskDigger — recover deleted files", D.official.site, "official"], ["DiskDigger FREE download — fast & easy!", D.thirdParty.site, "third"]].forEach(function (r) {
          var b = h("button.br-btn", { type: "button", text: r[0], "data-result": r[2] });
          b.addEventListener("click", function () { show(r[2]); bus.emit("br:visit", { site: r[1] }); });
          page.appendChild(h("div.br-result", b, h("div.ltr", { text: "https://" + r[1] + "/" })));
        });
      } else if (p === "official") {
        url.textContent = "https://" + D.official.site + "/";
        var dl = h("button.dl-btn", { type: "button", text: "Download " + D.official.file, "data-download": "official" });
        dl.addEventListener("click", function () { download(D.official.site, D.official.file); });
        page.appendChild(h("h3", { text: "DiskDigger" })); page.appendChild(h("p", { text: "Undelete and recover lost files from your hard drive, memory card or USB drive." }));
        page.appendChild(dl);
        page.appendChild(h("p", { text: "Published checksum (SHA256) for " + D.official.file + ":" })); page.appendChild(h("code.br-hash.ltr", { text: D.official.sha256, "data-published": "1" }));
      } else {
        url.textContent = "https://" + D.thirdParty.site + "/diskdigger-free";
        var dl2 = h("button.dl-btn", { type: "button", text: "Download free — " + D.thirdParty.file, "data-download": "third" });
        dl2.addEventListener("click", function () { download(D.thirdParty.site, D.thirdParty.file); });
        page.appendChild(h("h3", { text: "★ DiskDigger FREE — 100% working ★" })); page.appendChild(h("p", { text: "Fast download! No registration. Click the big button now!" }));
        page.appendChild(dl2); page.appendChild(h("p", { text: "(لا يوجد Hash منشور في هذه الصفحة.)" }));
      }
    }
    show("results");
    body.api = {
      visit: function (which) { var b = page.querySelector('[data-result="' + which + '"]'); if (b) b.click(); return FSIM.core.sleep(250); },
      download: function (which) { var b = page.querySelector('[data-download="' + which + '"]'); if (b) b.click(); return FSIM.core.sleep(250); },
      back: function () { backBtn.click(); }
    };
  }

  FSIM.tools.browser = {
    id: "browser",
    open: function (stage, o) { o = o || {}; return stage.create({ id: "browser", title: "Browser", icon: "folder", skin: "win", width: o.width || 640, height: o.height || 380, x: o.x != null ? o.x : 20, y: o.y != null ? o.y : 16, build: build }); }
  };
})();
