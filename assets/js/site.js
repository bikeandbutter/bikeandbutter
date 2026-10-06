/* Bike & Butter — shared behaviour (header, menu, reveal-on-scroll). No dependencies. */
(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("mobile-nav");

  /* Header gets a hairline + shadow once the page scrolls */
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile menu */
  function setMenu(open) {
    if (!btn || !panel) return;
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    panel.hidden = !open;
  }
  if (btn && panel) {
    btn.addEventListener("click", function () { setMenu(btn.getAttribute("aria-expanded") !== "true"); });
    panel.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    window.matchMedia("(min-width: 960px)").addEventListener("change", function (e) { if (e.matches) setMenu(false); });
  }

  /* Mark the current page in the nav */
  var path = location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".primary a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href.charAt(0) === "/" && href.indexOf("#") === -1 && href !== "/" && path.indexOf(href) === 0) {
      a.setAttribute("aria-current", "page");
    }
  });

  /* Reveal on scroll */
  var items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) { items.forEach(function (el) { el.classList.add("is-in"); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  items.forEach(function (el) { io.observe(el); });
})();
