/* FSIM.core.chrome — page chrome shared by every page: theme toggle + foldable unofficial-site banner. */
(function () {
  "use strict";
  var FSIM = window.FSIM, store = FSIM.core.storage;

  function applyTheme(t) {
    var root = document.documentElement;
    if (t === "light" || t === "dark") root.setAttribute("data-theme", t); else root.removeAttribute("data-theme");
  }
  function current() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function init() {
    var ui = store.get().ui;
    if (ui.theme) applyTheme(ui.theme);

    var btn = document.querySelector("[data-theme-toggle]");
    if (btn) {
      var sync = function () { var dark = current() === "dark"; btn.setAttribute("aria-pressed", String(dark)); btn.textContent = dark ? "☀ فاتح" : "🌙 داكن"; };
      btn.addEventListener("click", function () { var next = current() === "dark" ? "light" : "dark"; applyTheme(next); store.get().ui.theme = next; store.save(); sync(); });
      sync();
    }

    var banner = document.querySelector(".unofficial-banner");
    var fold = document.querySelector("[data-banner-fold]");
    if (banner && fold) {
      var set = function (folded) {
        banner.classList.toggle("is-folded", folded);
        fold.setAttribute("aria-expanded", String(!folded));
        fold.textContent = folded ? "توسيع" : "طيّ";
      };
      set(ui.bannerFolded !== false);
      fold.addEventListener("click", function () { var f = !banner.classList.contains("is-folded"); set(f); store.get().ui.bannerFolded = f; store.save(); });
    }
  }

  FSIM.core.chrome = { init: init };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
