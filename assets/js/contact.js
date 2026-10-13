/* Enquiry form -> Supabase `enquiries` (anon insert only). B&B gets a Gmail alert + sees it in bnbhq > Inbox > Enquiries. */
(function () {
  "use strict";
  var SB = "https://aneuljjitpxjvsfucwkq.supabase.co", KEY = "sb_publishable_3HBGJIBmOxzpks_WV2YH9Q_ogbuU9UP";
  var form = document.getElementById("contact-form"); if (!form) return;
  var qs = new URLSearchParams(location.search);
  var type = "General Enquiry";
  var topics = Array.prototype.slice.call(document.querySelectorAll(".topic"));
  function setType(t) {
    var legacy = { "Wheels & Parts": "8LIEN" };
    t = legacy[t] || t;
    if (!topics.some(function (b) { return b.dataset.type === t; })) return;
    type = t; topics.forEach(function (b) { b.classList.toggle("is-on", b.dataset.type === t); });
  }
  if (qs.get("type")) setType(qs.get("type"));
  ["product", "bike", "size"].forEach(function (k) { if (qs.get(k)) form.elements[k].value = qs.get(k).slice(0, 200); });
  topics.forEach(function (b) { b.addEventListener("click", function () { setType(b.dataset.type); }); });
  function cut(v, n) { v = (v || "").trim(); return v ? v.slice(0, n) : null; }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("f-err"), btn = document.getElementById("f-submit");
    var f = form.elements, name = f.name.value.trim(), phone = f.phone.value.trim(), email = f.email.value.trim();
    if (f.website.value) return;
    var digits = phone.replace(/\D/g, "");
    if (name.length < 2) { err.className = "ferr show"; err.textContent = "Please enter your name."; return; }
    if (digits.length < 8) { err.className = "ferr show"; err.textContent = "Please enter a mobile number we can WhatsApp (at least 8 digits)."; return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.className = "ferr show"; err.textContent = "That email doesn't look right. You can also leave it blank."; return; }
    err.className = "ferr"; err.textContent = ""; btn.disabled = true; btn.textContent = "Sending…";
    var row = { name: name.slice(0, 120), mobile: phone.slice(0, 30), topic: type, product: cut(f.product.value, 300), bike: cut(f.bike.value, 200),
      size: cut(f.size.value, 80), email: cut(email, 200), message: cut(f.message.value, 3000), source_page: (document.referrer ? new URL(document.referrer, location.href).pathname : location.pathname).slice(0, 300) };
    fetch(SB + "/rest/v1/enquiries", { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(row) })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); })
      .then(function () {
        var txt = "Hi Bike & Butter, this is " + name + ". I just sent an enquiry on your website about " + (row.product || type) + (row.bike ? " (bike: " + row.bike + (row.size ? ", size " + row.size : "") + ")" : "") + ".";
        document.getElementById("f-wa").href = "https://wa.me/6587222610?text=" + encodeURIComponent(txt);
        form.hidden = true; document.getElementById("f-ok").hidden = false; window.scrollTo(0, 0);
        if (window.gtag) gtag("event", "generate_lead", { method: "enquiry_form", topic: type });
      })
      .catch(function (x) {
        console.error(x); btn.disabled = false; btn.textContent = "Send enquiry";
        err.className = "ferr show"; err.innerHTML = 'Sorry, that didn\'t send. Please try again, or <a href="https://wa.me/6587222610" style="text-decoration:underline">WhatsApp us</a> directly.';
      });
  });
})();
