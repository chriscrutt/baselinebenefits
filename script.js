(function () {
  "use strict";

  // ---- analytics helpers (safe if gtag/clarity not loaded) ----
  function track(name, params) {
    try { if (typeof gtag === "function") gtag("event", name, params || {}); } catch (e) {}
    try { if (typeof clarity === "function") clarity("event", name); } catch (e) {}
  }
  function mark(key, value) {
    try { if (typeof clarity === "function") clarity("set", key, value); } catch (e) {}
  }

  // remember arrival attribution so it survives clicking around the site
  try {
    var q = new URLSearchParams(location.search);
    if (q.get("utm_source") && !sessionStorage.getItem("utm")) {
      sessionStorage.setItem("utm", location.search);
    }
  } catch (e) {}

  // ---- dark mode toggle (theme set early by inline <head> script) ----
  var themeToggle = document.getElementById("themeToggle");
  function syncTheme() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    if (themeToggle) themeToggle.setAttribute("aria-pressed", String(dark));
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.removeAttribute("media");
      m.setAttribute("content", dark ? "#0f1a16" : "#EEF3F2");
    });
  }
  syncTheme();
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncTheme();
      track("theme_toggle", { theme: next });
    });
  }

  // follow the OS theme live, unless the visitor has chosen one manually
  try {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", function (e) {
      if (!localStorage.getItem("theme")) {
        document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
        syncTheme();
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

  // investor mailto + cited-source clicks (mailto isn't covered by GA outbound tracking)
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener("click", function () {
      track("contact_click", { link_url: a.getAttribute("href") || "" });
    });
  });
  document.querySelectorAll(".footer__notes a").forEach(function (a) {
    a.addEventListener("click", function () {
      track("source_click", { link_domain: a.hostname, link_url: a.href });
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
      var utm = null;
      try { utm = new URLSearchParams(sessionStorage.getItem("utm") || location.search); } catch (err) {}
      var utmStr = utm && utm.get("utm_source")
        ? "utm:" + utm.get("utm_source") + "/" + (utm.get("utm_medium") || "") + "/" + (utm.get("utm_campaign") || "")
        : "";
      var btn = form.querySelector("button[type=submit]");
      if (btn) btn.disabled = true;
      msg.textContent = "Adding you…";
      fetch(WAITLIST_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams({
          email: email,
          source: "waitlist",
          page: location.pathname,
          ref: utmStr || document.referrer || "",
          utm_source: (utm && utm.get("utm_source")) || "",
          utm_medium: (utm && utm.get("utm_medium")) || "",
          utm_campaign: (utm && utm.get("utm_campaign")) || ""
        })
      }).then(function () {
        track("sign_up", { method: "waitlist" });
        mark("signed_up", "true");
        try { if (typeof clarity === "function") clarity("upgrade", "signed_up"); } catch (err) {}
        msg.textContent = "You're on the list. We'll email you when it's ready.";
        form.reset();
      }).catch(function () {
        msg.textContent = "That didn't go through. Try again, or email christopher@baselinebenefits.com.";
      }).then(function () {
        if (btn) btn.disabled = false;
      });
    });
  }

  // funnel: reached the CTA, started the form
  var ctaSection = document.getElementById("cta");
  if (ctaSection && "IntersectionObserver" in window) {
    var ctaObs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        track("view_cta", {});
        ctaObs.disconnect();
      }
    }, { threshold: 0.4 });
    ctaObs.observe(ctaSection);
  }
  var emailField = document.getElementById("email");
  if (emailField) {
    emailField.addEventListener("focus", function onFirstFocus() {
      emailField.removeEventListener("focus", onFirstFocus);
      track("form_start", {});
    });
  }
})();
