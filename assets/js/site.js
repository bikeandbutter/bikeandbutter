/* Bike & Butter — shared behaviour (header, menu overlay, newsletter, reveal, picker). No dependencies. */
(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("menu-overlay");

  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 40); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Menu overlay */
  function setMenu(open) {
    if (!btn || !panel) return;
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
    if (open) { panel.hidden = false; requestAnimationFrame(function () { panel.classList.add("is-open"); }); }
    else { panel.classList.remove("is-open"); setTimeout(function () { if (!panel.classList.contains("is-open")) panel.hidden = true; }, 260); }
  }
  if (btn && panel) {
    btn.addEventListener("click", function () { setMenu(btn.getAttribute("aria-expanded") !== "true"); });
    panel.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Newsletter -> Supabase (insert-only table, see supabase/newsletter.sql) */
  var SB_URL = "https://aneuljjitpxjvsfucwkq.supabase.co";
  var SB_KEY = "sb_publishable_3HBGJIBmOxzpks_WV2YH9Q_ogbuU9UP";
  document.querySelectorAll("form[data-newsletter]").forEach(function (form) {
    var msg = form.querySelector(".nl-msg");
    var submit = form.querySelector("button[type=submit]");
    function say(t, cls) { msg.textContent = t; msg.className = "nl-msg" + (cls ? " " + cls : ""); }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = form.elements.email.value.trim().toLowerCase();
      if (form.elements.website && form.elements.website.value) { say("Thanks — you're subscribed.", "ok"); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say("Please enter a valid email address.", "err"); return; }
      if (!form.elements.consent.checked) { say("Please tick the box to agree.", "err"); return; }
      submit.disabled = true; say("Subscribing…");
      fetch(SB_URL + "/rest/v1/newsletter_subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, Prefer: "return=minimal" },
        body: JSON.stringify({ email: email, source: location.pathname })
      }).then(function (r) {
        if (r.ok || r.status === 409) { form.reset(); say("Thanks — you're subscribed.", "ok"); if (window.gtag) gtag("event", "newsletter_signup"); }
        else { say("Something went wrong. Please try again, or message us on WhatsApp.", "err"); }
      }).catch(function () { say("Couldn't connect. Please try again in a moment.", "err"); })
        .then(function () { submit.disabled = false; });
    });
  });

  /* Picker: hovering / tapping a thumbnail swaps the big image */
  var picker = document.querySelector("[data-picker]");
  if (picker) {
    var items = picker.querySelectorAll("[data-pick]");
    var stage = picker.querySelector("[data-stage] img");
    var cap = picker.querySelector("[data-stage-cap]");
    var go = picker.querySelector("[data-stage-link]");
    var set = function (el) {
      items.forEach(function (i) { i.classList.toggle("is-on", i === el); });
      if (stage) { stage.src = el.dataset.img; stage.alt = el.dataset.alt || ""; }
      if (cap) cap.textContent = el.dataset.cap || "";
      if (go) go.setAttribute("href", el.getAttribute("href"));
    };
    items.forEach(function (el) {
      el.addEventListener("mouseenter", function () { if (window.matchMedia("(hover:hover)").matches) set(el); });
      el.addEventListener("focus", function () { set(el); });
    });
  }

  /* Reveal on scroll */
  var els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("is-in"); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
  els.forEach(function (el) { io.observe(el); });
})();
