(function () {
  var WA = "https://wa.me/6587222610?text=";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var money = function (n) { return n ? "S$" + Number(n).toLocaleString("en-SG") : "Enquire"; };
  var img = function (f) { return f ? "/assets/img/bikes/" + encodeURI(f) : ""; };
  var B = [], state = { t: "", sort: "" };
  var rank = { available: 0, reserved: 1, sold: 2 };

  function load() {
    return fetch("/assets/data/bikes.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
      B = (d.bikes || []).filter(function (b) { return b && b.id && b.name; }); return B;
    }).catch(function () { B = []; return B; });
  }
  function tag(b) { return b.status === "sold" ? '<span class="mk-tag">Sold</span>' : b.status === "reserved" ? '<span class="mk-tag y">Reserved</span>' : ""; }
  function card(b) {
    return '<a class="mk-card' + (b.status === "sold" ? " is-sold" : "") + '" href="/marketplace/?b=' + encodeURIComponent(b.id) + '" data-b="' + esc(b.id) + '">' +
      '<div class="mk-img">' + (b.images && b.images[0] ? '<img loading="lazy" src="' + img(b.images[0]) + '" alt="' + esc(b.name) + '">' : "") + tag(b) + "</div>" +
      '<div class="mk-info"><div class="row"><span>' + esc(b.name) + "</span><span>" + money(b.price) + "</span></div><small>" +
      [b.type, b.size, b.year].filter(Boolean).map(esc).join(" · ") + "</small></div></a>";
  }
  function render() {
    var list = B.filter(function (b) { return !state.t || b.type === state.t; });
    list.sort(function (a, b) {
      var r = (rank[a.status] || 0) - (rank[b.status] || 0); if (r) return r;
      if (state.sort === "lo") return (a.price || 9e9) - (b.price || 9e9);
      if (state.sort === "hi") return (b.price || 0) - (a.price || 0);
      return 0;
    });
    document.querySelectorAll("[data-t]").forEach(function (x) { x.classList.toggle("on", x.dataset.t === state.t); });
    $("[data-mk-count]").textContent = list.length + (list.length === 1 ? " bike" : " bikes");
    $("[data-mk-grid]").innerHTML = list.map(card).join("");
    $("[data-nomatch]").hidden = !(B.length && !list.length);
  }
  function wa(b) { return WA + encodeURIComponent("Hi Bike & Butter, I'm interested in the " + b.name + (b.size ? " (" + b.size + ")" : "") + " listed on your website."); }
  function show(id, push) {
    var b = B.filter(function (x) { return x.id === id; })[0];
    if (!b) return list(true);
    var L = $("#mk-list"), D = $("#mk-detail"), H = $("[data-hero]");
    L.hidden = true; H.hidden = true; D.hidden = false;
    var ims = (b.images || []).filter(Boolean);
    var specs = (b.specs || []).concat(b.size ? [["Size", b.size]] : [], b.year ? [["Year", b.year]] : [], b.condition ? [["Condition", b.condition]] : []);
    D.innerHTML = '<div class="mk-d"><div class="mk-gal"><div class="mk-main"><img data-main alt="' + esc(b.name) + '"></div>' +
      (ims.length > 1 ? '<div class="mk-thumbs">' + ims.map(function (f, i) { return '<button type="button" data-i="' + i + '"><img src="' + img(f) + '" alt=""></button>'; }).join("") + "</div>" : "") +
      '</div><div class="mk-d-in"><button class="mk-back label" type="button" data-back>← All bikes</button>' +
      '<span class="label">' + esc([b.brand, b.type].filter(Boolean).join(" · ")) + "</span><h1>" + esc(b.name) + '</h1><div class="mk-price">' + (b.status === "sold" ? "Sold" : money(b.price)) + (b.status === "reserved" ? " · Reserved" : "") + "</div>" +
      (b.summary ? "<p>" + esc(b.summary) + "</p>" : "") +
      (b.status === "sold" ? "" : '<a class="btn btn-dark" target="_blank" rel="noopener" href="' + wa(b) + '">Enquire on WhatsApp</a><a class="btn btn-line" style="color:#111;border-color:#111" href="/contact/">Arrange a viewing</a>') +
      '<p class="mk-note">Viewings and test rides are by appointment at our Jurong West workshop, Monday to Friday, 9am to 6pm.</p>' +
      (b.description || []).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
      (specs.length ? '<dl class="mk-specs">' + specs.map(function (s) { return "<div><dt>" + esc(s[0]) + "</dt><dd>" + esc(s[1]) + "</dd></div>"; }).join("") + "</dl>" : "") + "</div></div>";
    function pick(i) { $("[data-main]", D).src = img(ims[i]); D.querySelectorAll("[data-i]").forEach(function (x) { x.classList.toggle("on", +x.dataset.i === i); }); }
    if (ims.length) pick(0);
    D.onclick = function (e) { var t = e.target.closest("[data-i]"); if (t) pick(+t.dataset.i); if (e.target.closest("[data-back]")) list(true); };
    document.title = b.name + " — Bike & Butter";
    if (push) history.pushState({ b: id }, "", "/marketplace/?b=" + encodeURIComponent(id));
    window.scrollTo(0, 0);
  }
  function list(push) {
    $("#mk-list").hidden = false; $("[data-hero]").hidden = false; $("#mk-detail").hidden = true;
    document.title = "Bikes for sale — Bike & Butter";
    if (push) history.pushState({}, "", "/marketplace/");
    window.scrollTo(0, 0);
  }
  function route() { var id = new URLSearchParams(location.search).get("b"); id ? show(id, false) : list(false); }

  function initPage() {
    load().then(function () {
      var has = B.length > 0;
      $("[data-bar]").hidden = !has; $("[data-mk-grid]").hidden = !has; $("[data-empty]").hidden = has;
      var types = []; B.forEach(function (b) { if (b.type && types.indexOf(b.type) < 0) types.push(b.type); });
      $("[data-types]").innerHTML = (types.length > 1 ? ["All"].concat(types) : []).map(function (t) { return '<button type="button" data-t="' + (t === "All" ? "" : esc(t)) + '">' + esc(t) + "</button>"; }).join("");
      $("[data-types]").addEventListener("click", function (e) { var x = e.target.closest("[data-t]"); if (!x) return; state.t = x.dataset.t; render(); });
      $("[data-sort]").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
      $("[data-mk-grid]").addEventListener("click", function (e) { var a = e.target.closest("a[data-b]"); if (!a || e.metaKey || e.ctrlKey) return; e.preventDefault(); show(a.dataset.b, true); });
      render(); route(); window.addEventListener("popstate", route);
    });
  }
  function initTeaser() {
    var T = $("[data-bike-teaser]"); if (!T) return;
    load().then(function () {
      var l = B.filter(function (b) { return b.status !== "sold"; }).slice(0, 3); if (!l.length) return;
      $("[data-teaser-grid]", T).innerHTML = l.map(card).join(""); T.hidden = false;
    });
  }
  if ($("#mk-list")) initPage(); initTeaser();
})();
