/* Bike & Butter — store: cart, cart drawer, side drawers, shop, product page, checkout.
   Products live in /assets/data/products.json. No dependencies. */
(function () {
  "use strict";

  var CART_KEY = "bnb_cart_v1";
  var DATA = null;
  var PLACEHOLDER = "/assets/img/products/placeholder.webp";
  var WA = "https://wa.me/6587222610?text=";

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { return "S$" + Number(n).toLocaleString("en-SG", { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  function load() {
    if (DATA) return Promise.resolve(DATA);
    return fetch("/assets/data/products.json").then(function (r) { return r.json(); }).then(function (d) { DATA = d; return d; });
  }
  function find(id) { return DATA.products.filter(function (p) { return p.id === id; })[0]; }
  function imgTag(src, alt, cls, extra) {
    return '<img ' + (cls ? 'class="' + cls + '" ' : "") + 'src="' + esc(src) + '" alt="' + esc(alt || "") + '" ' + (extra || "") + ' onerror="this.onerror=null;this.src=\'' + PLACEHOLDER + '\'">';
  }
  function priceLabel(p) { return p.price == null ? "Enquire" : money(p.price); }
  function enquireUrl(p, variant) {
    return WA + encodeURIComponent("Hi Bike & Butter, I'd like to enquire about the " + p.name + (variant ? " (" + variant + ")" : "") + ".");
  }

  /* ---------- cart ---------- */
  var cart = (function () { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } })();
  function save() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} updateBadge(); renderCart(); }
  function count() { return cart.reduce(function (n, i) { return n + i.qty; }, 0); }
  function subtotal() { return cart.reduce(function (s, i) { return s + i.qty * i.price; }, 0); }
  function shipping(sub) { var s = DATA ? DATA.shipping : { freeOver: 150, flat: 15 }; return !cart.length ? 0 : (sub >= s.freeOver ? 0 : s.flat); }
  function add(p, variant, qty) {
    var key = p.id + "|" + (variant || "");
    var line = cart.filter(function (i) { return i.key === key; })[0];
    if (line) line.qty += qty || 1;
    else cart.push({ key: key, id: p.id, name: p.name, variant: variant || "", price: p.price, unit: p.unit, img: (p.images && p.images[0]) || PLACEHOLDER, qty: qty || 1 });
    save();
    if (window.gtag) gtag("event", "add_to_cart", { currency: "SGD", value: p.price, items: [{ item_id: p.id, item_name: p.name }] });
  }
  function setQty(key, q) {
    cart = cart.map(function (i) { if (i.key === key) i.qty = q; return i; }).filter(function (i) { return i.qty > 0; });
    save();
  }
  function updateBadge() {
    var n = count();
    $$("[data-cart-count]").forEach(function (el) { el.textContent = n; el.hidden = !n; });
  }

  /* ---------- cart drawer ---------- */
  var drawer, scrim;
  function buildCartDrawer() {
    if ($("#cart-drawer")) return;
    drawer = document.createElement("aside");
    drawer.id = "cart-drawer"; drawer.className = "cart-drawer"; drawer.hidden = true;
    drawer.setAttribute("aria-label", "Your bag");
    drawer.innerHTML = '<div class="cart-body" data-cart-body></div>';
    document.body.appendChild(drawer);
    scrim = document.createElement("div"); scrim.className = "scrim"; scrim.hidden = true; document.body.appendChild(scrim);
    scrim.addEventListener("click", closeAll);
    drawer.addEventListener("click", function (e) {
      var b = e.target.closest("[data-qty]");
      if (b) { var i = cart.filter(function (x) { return x.key === b.dataset.key; })[0]; if (i) setQty(i.key, i.qty + Number(b.dataset.qty)); return; }
      var r = e.target.closest("[data-remove]"); if (r) { setQty(r.dataset.remove, 0); return; }
      var a = e.target.closest("[data-acc]"); if (a) { var panel = a.nextElementSibling; var open = panel.hidden; panel.hidden = !open; a.querySelector(".plus").textContent = open ? "−" : "+"; return; }
      var c = e.target.closest("[data-cart-close]"); if (c) closeAll();
    });
  }
  function renderCart() {
    var body = $("[data-cart-body]"); if (!body || !DATA) return;
    if (!cart.length) {
      body.innerHTML = '<p class="cart-empty label">Your bag is empty</p><a class="btn btn-light cart-cta" href="/shop/" data-cart-close>Shop all</a>';
      return;
    }
    var sub = subtotal(), ship = shipping(sub), s = DATA.shipping;
    var left = Math.max(0, s.freeOver - sub);
    var rows = cart.map(function (i) {
      return '<div class="cart-line">' + imgTag(i.img, i.name, "cart-thumb", 'width="66" height="82"') +
        '<div class="cart-info"><div class="cart-row"><a class="label" href="/shop/product/?id=' + esc(i.id) + '">' + esc(i.name) + '</a><span class="label">' + money(i.price) + '</span></div>' +
        (i.variant ? '<div class="cart-var">' + esc(i.variant) + '</div>' : "") +
        '<div class="cart-row cart-ctl"><span class="qty"><button type="button" data-qty="-1" data-key="' + esc(i.key) + '" aria-label="Decrease">−</button><span>' + i.qty + '</span><button type="button" data-qty="1" data-key="' + esc(i.key) + '" aria-label="Increase">+</button></span>' +
        '<button type="button" class="x-btn" data-remove="' + esc(i.key) + '" aria-label="Remove ' + esc(i.name) + '">×</button></div></div></div>';
    }).join("");
    var related = DATA.products.filter(function (p) { return !cart.some(function (i) { return i.id === p.id; }); }).slice(0, 3).map(function (p) {
      return '<a class="mini-prod" href="/shop/product/?id=' + esc(p.id) + '">' + imgTag(p.images[0], p.name, "", 'width="52" height="65" loading="lazy"') + '<span><span class="label">' + esc(p.name) + '</span><small>' + priceLabel(p) + '</small></span></a>';
    }).join("");
    body.innerHTML = rows +
      '<p class="ship-note">' + (left > 0 ? "Add " + money(left) + " more for free delivery" : "You've got free delivery") + '</p>' +
      '<dl class="totals"><div><dt class="label">Subtotal</dt><dd class="label">' + money(sub) + '</dd></div><div><dt class="label">Shipping</dt><dd class="label">' + (ship ? money(ship) : "Free") + '</dd></div><div><dt class="label">Total</dt><dd class="label">' + money(sub + ship) + '</dd></div></dl>' +
      '<a class="btn btn-dark cart-cta" href="/checkout/">Go to checkout</a>' +
      '<button type="button" class="acc" data-acc><span class="label">Compatible with your order</span><span class="plus">+</span></button><div class="acc-panel" hidden>' + related + '</div>' +
      '<button type="button" class="acc" data-acc><span class="label">Payment, delivery &amp; returns</span><span class="plus">+</span></button><div class="acc-panel" hidden>' + policyHtml() + '</div>';
  }
  function policyHtml() {
    var s = DATA.shipping;
    return '<p><strong class="label">Payment</strong><br>Pay securely online by card or PayNow through HitPay after you place your order.</p>' +
      '<p><strong class="label">Delivery</strong><br>Orders of ' + money(s.freeOver) + ' or more ship free. Orders under ' + money(s.freeOver) + ' pay a flat ' + money(s.flat) + '. Questions? WhatsApp +65 8722 2610, Mon–Fri 9am–6pm.</p>' +
      '<p><strong class="label">Returns</strong><br>Message us on WhatsApp before ordering if you have questions about returns or warranty.</p>';
  }
  function openCart() {
    buildCartDrawer(); closeSide(); renderCart();
    drawer.hidden = false; scrim.hidden = false;
    var bag = $("[data-cart-open]"); if (bag) bag.classList.add("is-open");
    document.body.classList.add("drawer-open");
  }
  function closeAll() {
    if (drawer) drawer.hidden = true;
    if (scrim) scrim.hidden = true;
    var bag = $("[data-cart-open]"); if (bag) bag.classList.remove("is-open");
    closeSide();
    document.body.classList.remove("drawer-open");
  }

  /* ---------- side drawer (right panel) ---------- */
  var side;
  function openSide(title, html) {
    buildCartDrawer();
    if (!side) {
      side = document.createElement("aside"); side.className = "side-drawer"; side.hidden = true;
      side.innerHTML = '<div class="side-head"><span class="label" data-side-title></span><button type="button" class="x-btn" data-side-close aria-label="Close">×</button></div><div class="side-body" data-side-body></div>';
      document.body.appendChild(side);
      side.addEventListener("click", function (e) { if (e.target.closest("[data-side-close]")) closeAll(); });
    }
    $("[data-side-title]", side).textContent = title;
    $("[data-side-body]", side).innerHTML = html;
    if (drawer) drawer.hidden = true;
    side.hidden = false; scrim.hidden = false; document.body.classList.add("drawer-open");
  }
  function closeSide() { if (side) side.hidden = true; }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(); });
  document.addEventListener("click", function (e) {
    var o = e.target.closest("[data-cart-open]"); if (o) { e.preventDefault(); (drawer && !drawer.hidden) ? closeAll() : load().then(openCart); }
  });

  /* ---------- shop (collection) ---------- */
  var CATS = {
    all: { label: "All products", text: "Race-ready wheels and cockpit parts from the brands we distribute in Singapore, plus workshop builds and servicing.", img: "/assets/img/home/banner-wheels.webp" },
    wheels: { label: "Wheelsets", text: "UCI-certified carbon-spoke wheelsets from 8LIEN for road and triathlon, with Shimano, SRAM XDR and Campagnolo N3W freehub options.", img: "/assets/img/home/banner-wheels.webp" },
    cockpit: { label: "Cockpit parts", text: "CNC-machined baseplates and adaptors from RSTRI for time-trial and triathlon cockpits.", img: "/assets/img/home/s-cockpit.webp" }
  };
  function cardHtml(p) {
    return '<a class="card" href="/shop/product/?id=' + esc(p.id) + '"><div class="card-img">' + (p.badge ? '<span class="tag">' + esc(p.badge) + '</span>' : "") + imgTag(p.images[0], p.name, "", 'width="800" height="1000" loading="lazy"') + '</div>' +
      '<div class="card-info"><div class="row"><span class="label">' + esc(p.name) + '</span><span class="label">' + (p.price == null ? "Enquire" : money(p.price)) + '</span></div><div class="cat">' + esc(p.category) + '</div></div></a>';
  }
  function initShop() {
    var grid = $("[data-grid]"); if (!grid) return;
    var params = new URLSearchParams(location.search);
    var state = { cat: params.get("cat") || "all", brand: "all", sort: "featured" };
    function apply() {
      var c = CATS[state.cat] || CATS.all;
      $("[data-hero-label]").textContent = c.label; $("[data-hero-text]").textContent = c.text;
      var hi = $("[data-hero-img]"); if (hi.getAttribute("src") !== c.img) hi.src = c.img;
      var list = DATA.products.filter(function (p) { return (state.cat === "all" || p.cat === state.cat) && (state.brand === "all" || p.brand === state.brand); });
      if (state.sort === "low") list.sort(function (a, b) { return (a.price == null) - (b.price == null) || a.price - b.price; });
      if (state.sort === "high") list.sort(function (a, b) { return (a.price == null) - (b.price == null) || b.price - a.price; });
      grid.innerHTML = list.map(cardHtml).join("") + '<a class="card card-link" href="/evr/"><div class="card-img card-img-text"><span class="label">EVR apparel</span><p>Jerseys, bibs, jackets and accessories. Browse the full range and enquire for sizing and pricing.</p><span class="btn btn-line">View EVR</span></div><div class="card-info"><div class="row"><span class="label">EVR range</span><span class="label">Enquire</span></div><div class="cat">Apparel</div></div></a>';
      $("[data-count]").textContent = list.length + " products";
    }
    function refine() {
      var cats = Object.keys(CATS).map(function (k) { return '<label class="opt"><input type="radio" name="cat" value="' + k + '"' + (state.cat === k ? " checked" : "") + '><span>' + CATS[k].label + '</span></label>'; }).join("");
      var brands = ["all", "8LIEN", "RSTRI"].map(function (b) { return '<label class="opt"><input type="radio" name="brand" value="' + b + '"' + (state.brand === b ? " checked" : "") + '><span>' + (b === "all" ? "All brands" : b) + '</span></label>'; }).join("");
      var sorts = [["featured", "Featured"], ["low", "Price: low to high"], ["high", "Price: high to low"]].map(function (s) { return '<label class="opt"><input type="radio" name="sort" value="' + s[0] + '"' + (state.sort === s[0] ? " checked" : "") + '><span>' + s[1] + '</span></label>'; }).join("");
      openSide("Refine", '<div class="refine"><h3 class="label">Category</h3>' + cats + '<h3 class="label">Brand</h3>' + brands + '<h3 class="label">Sort</h3>' + sorts + '<button type="button" class="btn btn-dark" data-side-close>Show results</button></div>');
      $$(".refine input").forEach(function (i) { i.addEventListener("change", function () { state[i.name] = i.value; apply(); }); });
    }
    apply();
    $("[data-refine]").addEventListener("click", refine);
  }

  /* ---------- product page ---------- */
  function initProduct() {
    var root = $("[data-product]"); if (!root) return;
    var id = new URLSearchParams(location.search).get("id");
    var p = find(id);
    if (!p) { root.innerHTML = '<div class="notfound"><p class="label">Product not found</p><a class="btn btn-light" href="/shop/">Back to shop</a></div>'; return; }
    document.title = p.name + " — Bike & Butter";
    var meta = $('meta[name="description"]'); if (meta) meta.content = p.summary + " Official Singapore distributor, Bike & Butter.";
    var canon = $('link[rel="canonical"]'); if (canon) canon.href = "https://bikeandbutter.com/shop/product/?id=" + p.id;
    var variant = p.variants ? p.variants.options[0] : "";
    var imgs = p.images.slice();
    var thumbs = imgs.map(function (s, i) { return '<button type="button" class="pthumb' + (i === 0 ? " is-on" : "") + '" data-thumb="' + i + '" aria-label="Image ' + (i + 1) + '">' + imgTag(s, "", "", 'width="40" height="50"') + '</button>'; }).join("");
    var gallery = imgs.map(function (s, i) { return '<figure class="pfig' + (i === 0 ? " pfig-main" : "") + '" id="pimg-' + i + '">' + imgTag(s, p.name + " — image " + (i + 1), "", (i === 0 ? 'fetchpriority="high"' : 'loading="lazy"')) + '</figure>'; }).join("");
    var variants = p.variants ? '<div class="pvariants"><h2 class="label label-muted">' + esc(p.variants.label) + '</h2>' + p.variants.options.map(function (o, i) { return '<label class="vrow"><input type="radio" name="variant" value="' + esc(o) + '"' + (i === 0 ? " checked" : "") + '><span class="dot"></span><span>' + esc(o) + '</span><span class="label">' + (p.price != null ? money(p.price) : "") + '</span></label>'; }).join("") + '</div>' : "";
    root.innerHTML =
      '<div class="pgrid"><div class="pgallery">' + (imgs.length > 1 ? '<div class="pthumbs">' + thumbs + '</div>' : "") + gallery + (p.badge ? '<span class="tag tag-dark">' + esc(p.badge) + '</span>' : "") + '</div>' +
      '<div class="pinfo"><div class="pinfo-in"><p class="label label-muted">' + esc(p.category) + '</p>' +
      '<div class="prow"><h1 class="pname">' + esc(p.name) + '</h1><p class="pprice">' + (p.price != null ? money(p.price) + (p.unit ? '<small> / ' + esc(p.unit) + '</small>' : "") : "Enquire") + '</p></div>' +
      '<p class="psum">' + esc(p.summary) + '</p>' + variants +
      (p.purchasable ? '<button type="button" class="btn btn-dark btn-wide" data-add>Add to bag <span data-add-price>' + money(p.price) + '</span></button>' : '<a class="btn btn-dark btn-wide" data-enquire href="' + enquireUrl(p) + '" target="_blank" rel="noopener">Enquire on WhatsApp</a>') +
      '<div class="pbox"><p class="label"><span class="live"></span>' + (p.brand === "RSTRI" ? "In stock in Singapore. Free delivery over S$" + DATA.shipping.freeOver : "Official Singapore distributor. Free delivery over S$" + DATA.shipping.freeOver) + ' <button type="button" class="ul" data-open="pay">Read more</button></p>' +
      '<p class="label">Test rides and fitting at our Jurong West workshop <a class="ul" href="/#visit">Read more</a></p></div>' +
      '<h2 class="label label-muted lbl">Benefits</h2><ul class="bullets">' + p.benefits.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + '</ul>' +
      '<h2 class="label label-muted lbl">What\'s included</h2><ul class="bullets">' + p.included.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + '</ul>' +
      '<div class="paccs">' + [["desc", "Description"], ["tech", "Technical info"], ["inc", "What's included"], ["pay", "Payment, delivery & returns"]].map(function (a) { return '<button type="button" class="pacc" data-open="' + a[0] + '"><span class="plus">+</span><span class="label">' + a[1].replace("&", "&amp;") + '</span></button>'; }).join("") + '</div>' +
      '</div></div></div>';
    /* sticky mini bar */
    var mini = document.createElement("div"); mini.className = "minibar"; mini.hidden = true;
    mini.innerHTML = imgTag(imgs[0], "", "", 'width="26" height="32"') + '<span class="label mb-name">' + esc(p.name) + '</span><span class="label">' + priceLabel(p) + '</span><button type="button" class="mb-add" aria-label="' + (p.purchasable ? "Add to bag" : "Enquire") + '">+</button>';
    document.body.appendChild(mini);
    var btn = $("[data-add]") || $("[data-enquire]");
    if (btn && "IntersectionObserver" in window) new IntersectionObserver(function (en) { mini.hidden = en[0].isIntersecting || en[0].boundingClientRect.top > 0; }).observe(btn);
    function doAdd() { if (p.purchasable) { add(p, variant, 1); openCart(); } else window.open(enquireUrl(p, variant), "_blank", "noopener"); }
    $(".mb-add", mini).addEventListener("click", doAdd);
    var addBtn = $("[data-add]"); if (addBtn) addBtn.addEventListener("click", doAdd);
    $$("input[name=variant]", root).forEach(function (r) { r.addEventListener("change", function () { variant = r.value; var en = $("[data-enquire]"); if (en) en.href = enquireUrl(p, variant); }); });
    $$("[data-thumb]", root).forEach(function (b) { b.addEventListener("click", function () { $$("[data-thumb]", root).forEach(function (x) { x.classList.toggle("is-on", x === b); }); var t = $("#pimg-" + b.dataset.thumb); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }); });
    var sections = {
      desc: ["Description", p.description.map(function (d) { return '<h3 class="label">' + esc(d.h) + '</h3><p>' + esc(d.p) + '</p>'; }).join("")],
      tech: ["Technical info", '<dl class="spec">' + p.tech.map(function (t) { return '<div><dt class="label">' + esc(t[0]) + '</dt><dd>' + esc(t[1]) + '</dd></div>'; }).join("") + '</dl>'],
      inc: ["What's included", '<ul class="bullets">' + p.included.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>"],
      pay: ["Payment, delivery & returns", policyHtml()]
    };
    root.addEventListener("click", function (e) { var o = e.target.closest("[data-open]"); if (o) { var s = sections[o.dataset.open]; openSide(s[0], s[1]); } });
    /* more products */
    var more = DATA.products.filter(function (x) { return x.id !== p.id; }).sort(function (a, b) { return (b.cat === p.cat) - (a.cat === p.cat); }).slice(0, 3);
    var mp = $("[data-more]"); if (mp) mp.innerHTML = more.map(cardHtml).join("");
    if (window.gtag) gtag("event", "view_item", { items: [{ item_id: p.id, item_name: p.name }] });
  }

  /* ---------- checkout ---------- */
  var SB_URL = "https://aeszkgesbqxfqzuwintb.supabase.co";
  var SB_KEY = "sb_publishable_HLEeqpfnhWJ3kr_AHJIffA_9FOE0aHV";
  function initCheckout() {
    var root = $("[data-checkout]"); if (!root) return;
    var list = $("[data-co-items]"), form = $("#co-form");
    function render() {
      if (!cart.length) { root.classList.add("is-empty"); list.innerHTML = ""; return; }
      root.classList.remove("is-empty");
      var sub = subtotal(), ship = shipping(sub), left = Math.max(0, DATA.shipping.freeOver - sub);
      list.innerHTML = cart.map(function (i) {
        return '<div class="cart-line">' + imgTag(i.img, i.name, "cart-thumb", 'width="66" height="82"') + '<div class="cart-info"><div class="cart-row"><span class="label">' + esc(i.name) + '</span><span class="label">' + money(i.price * i.qty) + '</span></div>' + (i.variant ? '<div class="cart-var">' + esc(i.variant) + '</div>' : "") + '<div class="cart-var">Qty ' + i.qty + '</div></div></div>';
      }).join("");
      $("[data-co-sub]").textContent = money(sub); $("[data-co-ship]").textContent = ship ? money(ship) : "Free"; $("[data-co-total]").textContent = money(sub + ship);
      $("[data-co-note]").textContent = left > 0 ? "Add " + money(left) + " more for free delivery" : "You've got free delivery";
    }
    render();
    function err(name, msg) { var f = form.elements[name]; var m = f.parentNode.querySelector(".ferr"); if (!m) { m = document.createElement("span"); m.className = "ferr"; f.parentNode.appendChild(m); } m.textContent = msg || ""; f.classList.toggle("bad", !!msg); return !!msg; }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = {}; ["name", "email", "phone", "address", "notes"].forEach(function (k) { v[k] = form.elements[k].value.trim(); });
      var bad = false;
      bad = err("name", v.name.length < 2 ? "Please enter your name" : "") || bad;
      bad = err("email", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email) ? "Please enter a valid email" : "") || bad;
      bad = err("phone", v.phone.replace(/\D/g, "").length < 8 ? "Please enter a valid phone number" : "") || bad;
      bad = err("address", v.address.length < 8 ? "Please enter your delivery address" : "") || bad;
      if (bad || !cart.length) return;
      var btn = $("#co-submit"), msg = $("#co-msg"); btn.disabled = true; btn.textContent = "Creating order…"; msg.textContent = "";
      var sub = subtotal(), ship = shipping(sub), total = sub + ship;
      var orderNumber = "BNB-" + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase();
      var orderId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : null;
      var sb = window.supabase.createClient(SB_URL, SB_KEY);
      var items;
      Promise.resolve().then(function () {
        return sb.from("orders").insert({ id: orderId, order_number: orderNumber, customer_name: v.name, email: v.email, phone: v.phone, delivery_address: v.address, delivery_notes: v.notes || null, status: "pending_payment", subtotal_sgd: sub, shipping_fee_sgd: ship, total_sgd: total });
      }).then(function (r) {
        if (r.error) throw r.error;
        items = cart.map(function (i) { return { order_id: orderId, sku: i.id.toUpperCase(), name: i.name, colour: i.variant || "-", size: "One size", qty: i.qty, unit_price_sgd: i.price, line_total_sgd: i.qty * i.price }; });
        return sb.from("order_items").insert(items);
      }).then(function (r) {
        if (r.error) throw r.error;
        try { localStorage.removeItem(CART_KEY); } catch (x) {}
        btn.textContent = "Redirecting to payment…";
        return sb.functions.invoke("create-payment", { body: { order_id: orderId } });
      }).then(function (r) {
        if (r.error || !r.data || r.data.error) throw new Error((r.error && r.error.message) || (r.data && r.data.error) || "Could not create payment link");
        window.location.href = r.data.checkout_url;
      }).catch(function (ex) {
        console.error(ex);
        msg.className = "ferr show"; msg.textContent = "We couldn't complete your order just now (" + (ex.message || ex) + "). Please WhatsApp us on +65 8722 2610 and quote " + orderNumber + ".";
        btn.disabled = false; btn.textContent = "Try again";
      });
    });
  }

  /* ---------- boot ---------- */
  updateBadge();
  load().then(function () { buildCartDrawer(); renderCart(); initShop(); initProduct(); initCheckout(); updateBadge(); });
  window.BNB = { openCart: function () { load().then(openCart); }, cart: cart };
})();
