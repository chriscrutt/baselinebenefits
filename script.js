(function () {
  "use strict";

  // ---- analytics helper (safe if gtag not loaded) ----
  function track(name, params) {
    try { if (typeof gtag === "function") gtag("event", name, params || {}); } catch (e) {}
  }

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
  var WAITLIST_ENDPOINT = ""; // <-- paste your Apps Script web-app /exec URL here
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
