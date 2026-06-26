(function () {
  "use strict";

  // sticky nav border
  var nav = document.getElementById("nav");
  function onScroll() { nav.classList.toggle("is-stuck", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // waitlist (front-end stub)
  var form = document.getElementById("waitlist");
  if (form) {
    var msg = document.getElementById("ctaMsg");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("email");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
        msg.textContent = "Enter a valid email and we'll be in touch.";
        input.focus();
        return;
      }
      msg.textContent = "You're on the list. We'll email you when it's ready.";
      form.reset();
    });
  }
})();
