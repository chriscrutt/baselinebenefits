(function () {
  "use strict";

  // ---- analytics helper (safe if gtag not loaded) ----
  function track(name, params) {
    try { if (typeof gtag === "function") gtag("event", name, params || {}); } catch (e) {}
  }

  // ---- dark mode toggle (theme set early by inline <head> script) ----
  var themeToggle = document.getElementById("themeToggle");
  function setThemeLabel() {
    if (!themeToggle) return;
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    themeToggle.setAttribute("aria-pressed", String(dark));
  }
  setThemeLabel();
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      setThemeLabel();
      track("theme_toggle", { theme: next });
    });
  }

  // follow the OS theme live, unless the visitor has chosen one manually
  try {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", function (e) {
      if (!localStorage.getItem("theme")) {
        document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
        setThemeLabel();
      }
    });
  } catch (e) {}

  // sticky nav border
  var nav = document.getElementById("nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("is-stuck", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // CTA / nav link clicks -> GA event
  document.querySelectorAll("a.btn, .nav__right a, .hero__cta a").forEach(function (a) {
    a.addEventListener("click", function () {
      track("cta_click", {
        link_text: (a.textContent || "").trim().slice(0, 60),
        link_url: a.getAttribute("href") || ""
      });
    });
  });

  // waitlist -> Google Sheet (Apps Script) + GA conversion
  var WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfycbxeKWFLL3AgQ4pgrVlgbZMJgJOZ4jCBJqQDfy4fJ3kCEUcfQd-hP6q0J4_AayFBP9jo/exec";
  var form = document.getElementById("waitlist");
  if (form) {
    var msg = document.getElementById("ctaMsg");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("email");
      var email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.textContent = "Enter a valid email and we'll be in touch.";
        input.focus();
        track("sign_up_invalid", {});
        return;
      }
      if (WAITLIST_ENDPOINT) {
        try {
          fetch(WAITLIST_ENDPOINT, {
            method: "POST",
            mode: "no-cors",
            body: new URLSearchParams({
              email: email,
              source: "waitlist",
              page: location.pathname,
              ref: document.referrer || ""
            })
          });
        } catch (err) {}
      }
      track("sign_up", { method: "waitlist" });
      msg.textContent = "You're on the list. We'll email you when it's ready.";
      form.reset();
    });
  }
})();
