(function () {
  "use strict";
  var API = "https://aeszkgesbqxfqzuwintb.supabase.co/rest/v1/", KEY = "sb_publishable_HLEeqpfnhWJ3kr_AHJIffA_9FOE0aHV";
  var WA = "6587222610";
  var RANGES = {
    discover: ["Discover", "Everyday kit at an easy price. Comfortable, no fuss."],
    explore: ["Explore", "Our broadest range. Good fabrics and fit for regular riders."],
    tech: ["Tech", "Performance cuts and fabrics for training and long days out."],
    pro: ["Pro", "Race-focused kit with a close fit and top-tier pads."],
    ascent: ["Ascent", "Premium all-weather kit, built for climbing and cold mornings."]
  };
  var RLABEL = { discover: "Discover", explore: "Explore", tech: "Tech", pro: "Pro", ascent: "Ascent", joy: "Joy", etech: "E-Tech", pro_ultra: "Pro Ultra", accessories: "Accessories" };
  var GLABEL = { M: "Men", F: "Women", Unisex: "Unisex" };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var money = function (n) { return "S$" + Number(n).toFixed(0); };
  var img = function (p) { return p ? "/evr/" + encodeURI(p) : "/assets/img/products/placeholder.webp"; };
  var P = [], bySku = {}, charts = {}, state = { g: "", cat: "", range: "", sort: "" };

  function get(path) {
    return fetch(API + path, { headers: { apikey: KEY, Authorization: "Bearer " + KEY } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function title(n) { return n.replace(/^EVR\s+/i, "").replace(/Cyling/g, "Cycling"); }

  function load() {
    return Promise.all([
      get("products?select=id,sku,name,range,category,gender,price_sgd,size_run,size_chart_url&active=eq.true&order=sku"),
      get("product_variants?select=product_id,colour,size,image_path,price_sgd,hex&limit=2000"),
      get("size_chart_data?select=sku,tables")
    ]).then(function (a) {
      var vm = {};
      a[1].forEach(function (v) { (vm[v.product_id] = vm[v.product_id] || []).push(v); });
      a[2].forEach(function (c) { charts[c.sku] = c.tables; });
      P = a[0].map(function (p) {
        var seen = {}, cols = [];
        (vm[p.id] || []).forEach(function (v) { if (!seen[v.colour]) { seen[v.colour] = 1; cols.push(v); } });
        var prices = cols.map(function (c) { return Number(c.price_sgd || p.price_sgd); }).concat([Number(p.price_sgd)]).filter(Boolean);
        p.cols = cols; p.title = title(p.name);
        p.min = Math.min.apply(null, prices); p.max = Math.max.apply(null, prices);
        p.sizes = p.size_run ? p.size_run.split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];
        p.slug = p.id.slice(0, 8); bySku[p.slug] = p; return p;
      }).filter(function (p) { return p.cols.length; });
    });
  }

  function fillSelect(el, label, vals, fmt) {
    el.innerHTML = '<option value="">' + label + "</option>" + vals.map(function (v) { return '<option value="' + esc(v) + '">' + esc(fmt ? fmt(v) : v) + "</option>"; }).join("");
  }
  function uniq(k) { var o = {}; P.forEach(function (p) { o[p[k]] = 1; }); return Object.keys(o).sort(); }

  function setup() {
    var g = $("[data-gender]");
    g.innerHTML = [["", "All"], ["M", "Men"], ["F", "Women"], ["Unisex", "Unisex"]].map(function (x) { return '<button type="button" data-g="' + x[0] + '"' + (x[0] === "" ? ' class="on"' : "") + ">" + x[1] + "</button>"; }).join("");
    fillSelect($("[data-cat]"), "All categories", uniq("category"));
    var order = ["discover", "explore", "tech", "pro", "pro_ultra", "ascent", "joy", "etech", "accessories"];
    fillSelect($("[data-range]"), "All ranges", order.filter(function (r) { return P.some(function (p) { return p.range === r; }); }), function (r) { return RLABEL[r] || r; });
    $("[data-ranges]").innerHTML = Object.keys(RANGES).map(function (k) { return '<button type="button" class="evr-range" data-r="' + k + '"><b>' + RANGES[k][0] + "</b><span>" + RANGES[k][1] + "</span></button>"; }).join("");
    g.addEventListener("click", function (e) { var b = e.target.closest("[data-g]"); if (!b) return; state.g = b.dataset.g; render(); });
    $("[data-cat]").addEventListener("change", function (e) { state.cat = e.target.value; render(); });
    $("[data-range]").addEventListener("change", function (e) { state.range = e.target.value; render(); });
    $("[data-sort]").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
    $("[data-ranges]").addEventListener("click", function (e) { var b = e.target.closest("[data-r]"); if (!b) return; state.range = state.range === b.dataset.r ? "" : b.dataset.r; render(); $("[data-bar]").scrollIntoView({ behavior: "smooth" }); });
    $("[data-grid]").addEventListener("click", function (e) { var a = e.target.closest("a[data-sku]"); if (!a) return; e.preventDefault(); show(a.dataset.sku, true); });
  }

  function render() {
    var list = P.filter(function (p) { return (!state.g || p.gender === state.g) && (!state.cat || p.category === state.cat) && (!state.range || p.range === state.range); });
    if (state.sort === "lo") list.sort(function (a, b) { return a.min - b.min; });
    if (state.sort === "hi") list.sort(function (a, b) { return b.min - a.min; });
    document.querySelectorAll("[data-g]").forEach(function (b) { b.classList.toggle("on", b.dataset.g === state.g); });
    document.querySelectorAll("[data-r]").forEach(function (b) { b.classList.toggle("on", b.dataset.r === state.range); });
    $("[data-cat]").value = state.cat; $("[data-range]").value = state.range;
    $("[data-count]").textContent = list.length + " product" + (list.length === 1 ? "" : "s");
    $("[data-empty]").hidden = list.length > 0;
    $("[data-grid]").innerHTML = list.map(card).join("");
  }
  function priceTxt(p) { return p.min === p.max ? money(p.min) : "From " + money(p.min); }
  function card(p) {
    return '<a class="card" href="/evr/?p=' + p.slug + '" data-sku="' + esc(p.slug) + '"><div class="card-img"><img loading="lazy" src="' + img(p.cols[0].image_path) + '" alt="' + esc(p.title) + '" onerror="this.onerror=null;this.src=\'/assets/img/products/placeholder.webp\'"></div><div class="card-info"><div class="row"><span>' + esc(p.title) + "</span><span>" + priceTxt(p) + '</span></div><span class="cat">' + esc((RLABEL[p.range] || p.range) + " · " + p.category + " · " + (GLABEL[p.gender] || p.gender)) + '</span><span class="cat">' + p.cols.length + (p.cols.length === 1 ? " colour" : " colours") + "</span></div></a>";
  }

  function show(sku, push) {
    var p = bySku[sku], L = $("#evr-list"), D = $("#evr-detail");
    if (!p) { L.hidden = false; D.hidden = true; document.title = "EVR Cycling Apparel — Bike & Butter"; return; }
    if (push) history.pushState({ sku: sku }, "", "/evr/?p=" + sku);
    document.title = p.title + " — EVR — Bike & Butter";
    var st = { c: p.cols[0], s: "" };
    L.hidden = true; $(".evr-hero").hidden = true; D.hidden = false; window.scrollTo(0, 0);
    var ct = charts[p.sku], chart = "";
    if (ct && ct.length) chart = ct.map(function (t) { return '<p class="label">' + esc(t.title || "Size guide") + '</p><table class="evr-tbl"><tr><th></th>' + t.headers.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr>" + t.rows.map(function (r) { return "<tr><th>" + esc(r.label) + "</th>" + r.values.map(function (v) { return "<td>" + esc(v) + "</td>"; }).join("") + "</tr>"; }).join("") + "</table>"; }).join("");
    if (p.size_chart_url) chart += '<img loading="lazy" src="/evr/' + encodeURI(p.size_chart_url) + '" alt="Size chart" onerror="this.remove()">';
    D.innerHTML = '<div class="evr-d"><div class="evr-d-img"><img data-main alt="' + esc(p.title) + '"></div><div class="evr-d-in">' +
      '<button class="evr-back label" type="button" data-back>← All EVR</button>' +
      '<span class="label label-muted">' + esc((RLABEL[p.range] || p.range) + " · " + p.category + " · " + (GLABEL[p.gender] || p.gender)) + "</span>" +
      "<h1>" + esc(p.title) + '</h1><div class="prow"><span data-price></span></div>' +
      '<div><p class="label">Colour: <span data-cname></span></p><div class="evr-cols" data-cols></div></div>' +
      (p.sizes.length ? '<div><p class="label">Size</p><div class="evr-sizes" data-sizes></div></div>' : "") +
      '<a class="btn btn-dark" data-wa target="_blank" rel="noopener">Enquire on WhatsApp</a>' +
      '<p class="evr-note">Enquire with your preferred colour and size and we will confirm availability and pricing. Unsure of your size? Send us your height and weight and we will recommend a fit.</p>' +
      (chart ? '<details class="evr-acc"><summary class="label">Size guide</summary><div>' + chart + "</div></details>" : "") +
      '<details class="evr-acc"><summary class="label">Delivery &amp; payment</summary><p class="evr-note" style="padding-bottom:16px">Orders are placed with our supplier only after full payment has been received via PayNow. Once your order has been placed, we will advise you of the estimated delivery date. Delivery is available across Singapore. Please note that all items are made to order and are not available for immediate collection.</p></details>' +
      "</div></div>";
    function draw() {
      var v = st.c, pr = Number(v.price_sgd || p.price_sgd);
      $("[data-main]", D).src = img(v.image_path);
      $("[data-price]", D).textContent = money(pr);
      $("[data-cname]", D).textContent = v.colour;
      var msg = "Hi Bike & Butter, I'd like to enquire about EVR " + p.title + ", colour " + v.colour + (st.s ? ", size " + st.s : "") + ", " + money(pr) + ". ";
      $("[data-wa]", D).href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
      D.querySelectorAll("[data-ci]").forEach(function (b) { b.classList.toggle("on", b.dataset.ci === v.colour); });
      D.querySelectorAll("[data-si]").forEach(function (b) { b.classList.toggle("on", b.dataset.si === st.s); });
    }
    $("[data-cols]", D).innerHTML = p.cols.map(function (v) { return '<button type="button" class="evr-col" data-ci="' + esc(v.colour) + '" title="' + esc(v.colour) + '"><img src="' + img(v.image_path) + '" alt="' + esc(v.colour) + '"></button>'; }).join("");
    var sz = $("[data-sizes]", D); if (sz) sz.innerHTML = p.sizes.map(function (s) { return '<button type="button" data-si="' + esc(s) + '">' + esc(s) + "</button>"; }).join("");
    D.onclick = function (e) {
      var c = e.target.closest("[data-ci]"), s = e.target.closest("[data-si]"), b = e.target.closest("[data-back]");
      if (c) { st.c = p.cols.filter(function (v) { return v.colour === c.dataset.ci; })[0]; draw(); }
      if (s) { st.s = st.s === s.dataset.si ? "" : s.dataset.si; draw(); }
      if (b) { history.pushState({}, "", "/evr/"); route(); }
    };
    draw();
  }
  function route() {
    var sku = new URLSearchParams(location.search).get("p");
    if (sku && bySku[sku]) return show(sku, false);
    $("#evr-detail").hidden = true; $("#evr-list").hidden = false; $(".evr-hero").hidden = false;
    document.title = "EVR Cycling Apparel — Bike & Butter";
  }
  window.addEventListener("popstate", route);
  load().then(function () { setup(); render(); route(); }).catch(function () {
    $("[data-count]").textContent = "";
    $("[data-grid]").innerHTML = '<p class="evr-empty" style="grid-column:1/-1">We could not load the catalogue just now. Please refresh, or <a href="https://wa.me/' + WA + '" style="text-decoration:underline">message us on WhatsApp</a>.</p>';
  });
})();
