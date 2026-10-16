/* FSIM.core.storage — single versioned localStorage key (fsim.v1), always inside try/catch. */
(function () {
  "use strict";
  var FSIM = (window.FSIM = window.FSIM || {});
  FSIM.core = FSIM.core || {};
  FSIM.tools = FSIM.tools || {};
  FSIM.data = FSIM.data || {};
  FSIM.lessons = FSIM.lessons || {};

  var KEY = "fsim.v1";
  var memory = null; // fallback when storage is unavailable
  var cache = null;

  function blank() {
    return { progress: {}, student: "", ui: {} };
  }

  function load() {
    if (cache) return cache;
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          cache = Object.assign(blank(), parsed);
          return cache;
        }
      } catch (e2) { /* corrupted → start over */ }
    }
    cache = memory || blank();
    return cache;
  }

  function save() {
    memory = cache;
    try { window.localStorage.setItem(KEY, JSON.stringify(cache)); return true; } catch (e) { return false; }
  }

  FSIM.core.storage = {
    KEY: KEY,
    get: function () { return load(); },
    save: save,
    update: function (fn) { fn(load()); save(); },
    clear: function () {
      cache = blank(); memory = null;
      try { window.localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    },
    available: function () {
      try { var k = KEY + ".probe"; window.localStorage.setItem(k, "1"); window.localStorage.removeItem(k); return true; } catch (e) { return false; }
    }
  };

  /* tiny event bus shared by tools and the stepper */
  var listeners = {};
  FSIM.core.bus = {
    on: function (name, fn) { (listeners[name] = listeners[name] || []).push(fn); return function () { FSIM.core.bus.off(name, fn); }; },
    off: function (name, fn) { listeners[name] = (listeners[name] || []).filter(function (f) { return f !== fn; }); },
    emit: function (name, payload) { (listeners[name] || []).slice().forEach(function (f) { try { f(payload || {}); } catch (e) { if (window.console) console.error(e); } }); (listeners["*"] || []).slice().forEach(function (f) { try { f(name, payload || {}); } catch (e) { /* ignore */ } }); }
  };

  /* DOM helper: h("div.cls#id", {attr}, children...) — text goes through textContent only. */
  FSIM.core.h = function (spec, attrs) {
    var m = /^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i.exec(spec) || [];
    var el = document.createElement(m[1] || "div");
    (m[2] || "").replace(/([.#])([\w-]+)/g, function (_, t, n) { if (t === "#") el.id = n; else el.classList.add(n); return ""; });
    var start = 1;
    if (attrs && typeof attrs === "object" && !(attrs.nodeType) && !Array.isArray(attrs) && typeof attrs !== "string") {
      start = 2;
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === false || v == null) return;
        if (k === "text") el.textContent = v;
        else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
        else if (k === "class") v.split(" ").forEach(function (c) { if (c) el.classList.add(c); });
        else el.setAttribute(k, v === true ? "" : v);
      });
    }
    for (var i = start; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  };
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }

  FSIM.core.config = {
    fast: /[?&]fast=1/.test(window.location.search) ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  };
  FSIM.core.sleep = function (ms) {
    return new Promise(function (r) { setTimeout(r, FSIM.core.config.fast ? 0 : ms); });
  };
})();
