(function () {
  "use strict";

  // Apps Script web app (apps-script/bnb-rental.gs). If empty or unreachable, the page falls back to WhatsApp requests.
  var API = "https://script.google.com/macros/s/AKfycbwLRfCkvnc8yGdTzn9zfA8nmNKa4g7MngkB_DOFwVHBMNQm96Sh6kGtgsRxG0eikTxG5Q/exec";

  var WA = "6587222610";
  var RATE = 10, MIN = 50, PACK = 50;
  var TOTAL_DEFAULT = 6, HORIZON = 180;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var MSHORT = MONTHS.map(function (m) { return m.slice(0, 3); });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var form = $("[data-form]");
  if (!form) return;

  // ---- date helpers (plain YYYY-MM-DD strings, no timezone surprises) ----
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function toUTC(s) { var p = s.split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function fromUTC(t) { var d = new Date(t); return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  function addDays(s, n) { return fromUTC(toUTC(s) + n * 864e5); }
  function diffDays(a, b) { return Math.round((toUTC(b) - toUTC(a)) / 864e5); }
  function todaySG() {
    try {
      var p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
    } catch (e) {}
    var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function nice(s) { var p = s.split("-"); return +p[2] + " " + MSHORT[+p[1] - 1] + " " + p[0]; }
  function money(n) { return "$" + n; }

  var TODAY = todaySG(), LAST = addDays(TODAY, HORIZON);
  var st = { start: null, end: null, boxes: 1, packs: 0, total: TOTAL_DEFAULT, booked: null, month: TODAY.slice(0, 7) };

  // ---- availability ----
  function freeOn(d) {
    if (!st.booked) return st.total;
    return Math.max(0, st.total - (st.booked[d] || 0));
  }
  function minFree(a, b) {
    var m = st.total, d = a;
    while (d <= b) { m = Math.min(m, freeOn(d)); d = addDays(d, 1); }
    return m;
  }
  function loadAvailability() {
    if (!API) { status("Live availability is not connected yet. We will confirm your dates on WhatsApp."); return Promise.resolve(); }
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    return fetch(API + (API.indexOf("?") > -1 ? "&" : "?") + "action=availability", ctl ? { signal: ctl.signal } : {})
      .then(function (r) { return r.json(); })
      .then(function (j) {
        clearTimeout(timer);
        if (!j || !j.ok) throw new Error("bad");
        st.total = j.total || TOTAL_DEFAULT;
        st.booked = j.booked || {};
        renderCal(); refresh();
      })
      .catch(function () {
        clearTimeout(timer);
        st.booked = null;
        status("We could not load live availability. You can still send a request and we will confirm your dates.");
      });
  }
  function status(msg) { $("[data-status]").textContent = msg || ""; }

  // ---- calendar ----
  var elDays = $("[data-days]"), elMonth = $("[data-month]");
  function renderCal() {
    var y = +st.month.slice(0, 4), m = +st.month.slice(5, 7);
    elMonth.textContent = MONTHS[m - 1] + " " + y;
    var first = y + "-" + pad(m) + "-01";
    var lead = (new Date(toUTC(first)).getUTCDay() + 6) % 7; // Monday first
    var count = new Date(Date.UTC(y, m, 0)).getUTCDate();
    var html = "", i;
    for (i = 0; i < lead; i++) html += '<span class="rt-day is-blank"></span>';
    for (i = 1; i <= count; i++) {
      var d = y + "-" + pad(m) + "-" + pad(i);
      var past = d < TODAY, beyond = d > LAST;
      var free = freeOn(d), known = !!st.booked;
      var cls = "rt-day", sub = "", dis = false;
      if (past || beyond) { cls += " is-past"; dis = true; }
      else if (known && free === 0) { cls += " is-full"; sub = "Full"; dis = true; }
      else if (known && free < st.total && free <= 2) { cls += " is-low"; sub = free + " left"; }
      else if (known && free < st.total) { sub = free + " left"; }
      if (d === TODAY) cls += " is-today";
      if (st.start && st.end && d > st.start && d < st.end) cls += " in-range";
      if (d === st.start) cls += " is-start";
      if (d === st.end) cls += " is-end";
      var label = nice(d) + (dis ? (past ? ", unavailable" : ", fully booked") : (known ? ", " + free + " boxes available" : ""));
      html += '<button type="button" class="' + cls + '" data-d="' + d + '"' + (dis ? " disabled" : "") + ' aria-label="' + label + '"' +
        ((d === st.start || d === st.end) ? ' aria-pressed="true"' : "") + ">" + i + "<small>" + sub + "</small></button>";
    }
    elDays.innerHTML = html;
    $("[data-prev]").disabled = st.month <= TODAY.slice(0, 7);
    $("[data-next]").disabled = st.month >= LAST.slice(0, 7);
  }
  function shiftMonth(n) {
    var y = +st.month.slice(0, 4), m = +st.month.slice(5, 7) - 1 + n;
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    st.month = y + "-" + pad(m + 1); renderCal();
  }
  $("[data-prev]").addEventListener("click", function () { shiftMonth(-1); });
  $("[data-next]").addEventListener("click", function () { shiftMonth(1); });

  elDays.addEventListener("click", function (e) {
    var b = e.target.closest("[data-d]"); if (!b || b.disabled) return;
    var d = b.getAttribute("data-d");
    status("");
    if (!st.start || st.end) { st.start = d; st.end = null; }
    else if (d < st.start) { st.start = d; }
    else if (d === st.start) { st.end = d; }
    else if (minFree(st.start, d) === 0) {
      status("One of those days is fully booked. Pick a shorter range or different dates.");
      st.start = d; st.end = null;
    } else { st.end = d; }
    if (st.end) {
      var cap = minFree(st.start, st.end);
      if (st.boxes > cap) st.boxes = Math.max(1, cap);
    }
    renderCal(); refresh();
  });

  // ---- steppers ----
  function maxBoxes() { return st.start && st.end ? Math.max(1, minFree(st.start, st.end)) : st.total; }
  form.addEventListener("click", function (e) {
    var bx = e.target.closest("[data-box]"), pk = e.target.closest("[data-pack]");
    if (bx) { st.boxes = Math.min(maxBoxes(), Math.max(1, st.boxes + (+bx.getAttribute("data-box")))); if (st.packs > st.boxes) st.packs = st.boxes; refresh(); }
    if (pk) { st.packs = Math.min(st.boxes, Math.max(0, st.packs + (+pk.getAttribute("data-pack")))); refresh(); }
  });

  // ---- pricing ----
  function price() {
    if (!st.start || !st.end) return null;
    var days = diffDays(st.start, st.end) + 1;
    var per = Math.max(MIN, days * RATE);
    var boxesFee = per * st.boxes, packFee = st.packs * PACK;
    return { days: days, per: per, minApplied: days * RATE < MIN, boxesFee: boxesFee, packFee: packFee, total: boxesFee + packFee };
  }
  function refresh() {
    var p = price();
    $("[data-range]").textContent = st.start ? (st.end ? nice(st.start) + " to " + nice(st.end) + " · " + p.days + (p.days === 1 ? " day" : " days") : nice(st.start) + " · now pick your return date") : "No dates selected yet";
    $("[data-hint]").textContent = !st.start ? "Tap your collection date, then your return date." : (st.end ? "Tap a new date to change your dates." : "Now tap your return date (tap the same day for a one-day rental).");
    $("[data-boxes]").textContent = st.boxes;
    $("[data-packs]").textContent = st.packs;
    var mb = maxBoxes();
    form.querySelector('[data-box="1"]').disabled = st.boxes >= mb;
    form.querySelector('[data-box="-1"]').disabled = st.boxes <= 1;
    form.querySelector('[data-pack="1"]').disabled = st.packs >= st.boxes;
    form.querySelector('[data-pack="-1"]').disabled = st.packs <= 0;
    $("[data-boxnote]").textContent = st.start && st.end && st.booked ? (mb + (mb === 1 ? " box is" : " boxes are") + " free for all of these dates.") : "";
    $("[data-rotorwrap]").hidden = st.packs === 0;
    var L = $("[data-lines]");
    if (!p) { L.innerHTML = '<p class="rt-small">Select your dates to see the price.</p>'; $("[data-total]").textContent = "$0"; return; }
    var h = '<p class="rt-line"><span>' + st.boxes + (st.boxes === 1 ? " box" : " boxes") + " × " + p.days + (p.days === 1 ? " day" : " days") + " × $" + RATE + '</span><span>' + money(p.days * RATE * st.boxes) + "</span></p>";
    if (p.minApplied) h += '<p class="rt-line note">Minimum charge of $' + MIN + ' per box applies.</p><p class="rt-line"><span>Rental (' + st.boxes + " × $" + MIN + ")</span><span>" + money(p.boxesFee) + "</span></p>";
    if (st.packs) h += '<p class="rt-line"><span>Packing × ' + st.packs + "</span><span>" + money(p.packFee) + "</span></p>";
    L.innerHTML = h;
    $("[data-total]").textContent = money(p.total);
  }

  // ---- submit ----
  var err = $("[data-error]");
  function showErr(m) { err.textContent = m; err.hidden = !m; if (m) err.scrollIntoView({ block: "center", behavior: "smooth" }); }
  function waMsg(ref, f, p) {
    return "Hi Bike & Butter, I'd like to rent " + st.boxes + (st.boxes === 1 ? " bike box" : " bike boxes") + " from " + nice(st.start) + " to " + nice(st.end) + " (" + p.days + (p.days === 1 ? " day" : " days") + "). " +
      (st.packs ? "Packing for " + st.packs + (st.packs === 1 ? " bike" : " bikes") + (f.rotors ? ", rotors removed" : "") + ". " : "No packing. ") +
      "Total " + money(p.total) + ". Bike: " + f.bike + ". Name: " + f.name + (ref ? ". Ref: " + ref : "") + ".";
  }
  function fields() {
    var fd = new FormData(form);
    return { name: String(fd.get("name") || "").trim(), phone: String(fd.get("phone") || "").replace(/[^\d+]/g, ""), email: String(fd.get("email") || "").trim(), bike: String(fd.get("bike") || ""), notes: String(fd.get("notes") || "").trim(), rotors: !!fd.get("rotors") && st.packs > 0, hp: String(fd.get("website") || "") };
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); showErr("");
    var p = price(), f = fields();
    if (!p) return showErr("Please choose your collection and return dates on the calendar.");
    if (st.booked && minFree(st.start, st.end) < st.boxes) return showErr("Those dates no longer have enough boxes. Please adjust.");
    if (f.name.length < 2) return showErr("Please enter your name.");
    var digits = f.phone.replace(/\D/g, "");
    if (digits.length < 8) return showErr("Please enter a WhatsApp number we can reach you on.");
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return showErr("That email address does not look right.");
    if (f.hp) return;
    var btn = $("[data-submit]"); btn.disabled = true; btn.textContent = "Sending…";
    var payload = { action: "book", start: st.start, end: st.end, boxes: st.boxes, packs: st.packs, rotors: f.rotors, name: f.name, phone: f.phone, email: f.email, bike: f.bike, notes: f.notes, total: p.total };
    function finish(ref, sent) {
      btn.disabled = false; btn.textContent = "Request this booking";
      if (window.gtag) gtag("event", "generate_lead", { method: "bike_box_rental", value: p.total, currency: "SGD" });
      showDone(ref, sent, f, p);
    }
    if (!API) return finish("", false);
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json(); })
      .then(function (j) { clearTimeout(timer); if (j && j.ok) finish(j.ref, true); else throw new Error((j && j.error) || "failed"); })
      .catch(function () { clearTimeout(timer); finish("", false); });
  });

  function showDone(ref, sent, f, p) {
    var done = $("[data-done]");
    $("[data-done-h]").textContent = sent ? "Thanks, we have your request." : "One last step: send it on WhatsApp.";
    $("[data-done-p]").textContent = sent
      ? "We will message you on WhatsApp to confirm availability, then send the PayNow details. Your dates are only locked in once we confirm. Tap below if you would like to message us now."
      : "We could not send your request automatically. Tap the button below to send it to us on WhatsApp and we will confirm your dates and send the PayNow details.";
    var dl = [["Dates", nice(st.start) + " to " + nice(st.end) + " (" + p.days + (p.days === 1 ? " day)" : " days)")], ["Boxes", String(st.boxes)], ["Packing", st.packs ? st.packs + (st.packs === 1 ? " bike" : " bikes") : "None"], ["Total", money(p.total)]];
    if (ref) dl.unshift(["Reference", ref]);
    $("[data-done-dl]").innerHTML = dl.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1].replace(/[&<>]/g, "") + "</dd>"; }).join("");
    $("[data-wa]").href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(waMsg(ref, f, p));
    form.closest(".rt-grid").hidden = true; done.hidden = false; done.focus(); done.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  $("[data-again]").addEventListener("click", function () {
    $("[data-done]").hidden = true; form.closest(".rt-grid").hidden = false;
    st.start = st.end = null; st.boxes = 1; st.packs = 0; form.reset(); renderCal(); refresh(); loadAvailability();
    $("#book").scrollIntoView({ behavior: "smooth" });
  });

  renderCal(); refresh(); loadAvailability();
})();
