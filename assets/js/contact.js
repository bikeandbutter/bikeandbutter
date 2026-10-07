/* Contact form -> Google Apps Script sheet (same endpoint as before, no sign-in needed) */
(function () {
  "use strict";
  var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyD5oir2beAnURC3hy56VCA4vIaJXuu6KoGlNmF03cyXEzqSwbAzqZOH9yiKdYGlEYQ/exec";
  var form = document.getElementById("contact-form"); if (!form) return;
  var type = "General Enquiry";
  var q = new URLSearchParams(location.search).get("type");
  var topics = Array.prototype.slice.call(document.querySelectorAll(".topic"));
  function setType(t) { type = t; topics.forEach(function (b) { b.classList.toggle("is-on", b.dataset.type === t); }); }
  if (q) setType(q);
  topics.forEach(function (b) { b.addEventListener("click", function () { setType(b.dataset.type); }); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("f-err"), btn = document.getElementById("f-submit");
    var name = form.elements.name.value.trim(), email = form.elements.email.value.trim(), phone = form.elements.phone.value.trim(), message = form.elements.message.value.trim();
    if (form.elements.website.value) return;
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 5) { err.className = "ferr show"; err.textContent = "Please add your name, a valid email and a short message."; return; }
    err.textContent = ""; btn.disabled = true; btn.textContent = "Sending…";
    var timestamp = new Date().toLocaleString("en-SG", { timeZone: "Asia/Singapore" });
    fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ timestamp: timestamp, name: name, email: email, phone: phone, type: type, bike: "", offer: "", message: message, bikeId: "" }) })
      .catch(function (x) { console.error(x); })
      .then(function () { form.hidden = true; document.getElementById("f-ok").hidden = false; if (window.gtag) gtag("event", "generate_lead", { method: "contact_form" }); });
  });
})();
