/* Live Google reviews on the homepage. Fetches from the google-reviews function (cached 12h server-side).
   If anything fails, the section simply stays hidden. */
(function () {
  "use strict";
  var sec = document.querySelector("[data-reviews]"); if (!sec) return;
  var URL_ = "https://aneuljjitpxjvsfucwkq.supabase.co/functions/v1/google-reviews";
  var KEY = "sb_publishable_3HBGJIBmOxzpks_WV2YH9Q_ogbuU9UP";
  function stars(n) { n = Math.max(0, Math.min(5, Math.round(n || 0))); return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  fetch(URL_, { headers: { apikey: KEY, Authorization: "Bearer " + KEY } })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (d) {
      var list = (d.reviews || []).filter(function (v) { return v.rating >= 4 && v.text; });
      if (!list.length) return;
      if (d.rating) {
        sec.querySelector("[data-rv-score]").textContent = Number(d.rating).toFixed(1);
        sec.querySelector("[data-rv-stars]").textContent = stars(d.rating);
        sec.querySelector("[data-rv-count]").textContent = (d.count || list.length) + " Google review" + ((d.count || list.length) === 1 ? "" : "s");
      }
      var grid = sec.querySelector("[data-rv-grid]");
      list.forEach(function (v) {
        var c = el("figure", "rv-card");
        c.appendChild(el("div", "rv-stars", stars(v.rating)));
        c.appendChild(el("blockquote", "rv-text", v.text));
        var cap = el("figcaption", "rv-by");
        cap.appendChild(el("strong", null, v.author));
        if (v.when) cap.appendChild(el("span", null, v.when));
        c.appendChild(cap);
        grid.appendChild(c);
      });
      sec.hidden = false;
    })
    .catch(function (e) { console.warn("reviews unavailable", e); });
})();
