/* Help / FAQ: topic cards, accordion answers, search. Data: /assets/data/faq.json */
(function () {
  "use strict";
  var topicsEl = document.getElementById("help-topics"), list = document.getElementById("help-list"), label = document.getElementById("help-label"), q = document.getElementById("help-q");
  if (!topicsEl) return;
  var data, current = null;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function qaHtml(items) {
    return items.map(function (x) { return '<details class="faq"><summary><span>' + esc(x[0]) + '</span><span class="plus" aria-hidden="true">+</span></summary><p>' + esc(x[1]) + '</p></details>'; }).join("");
  }
  function showTopics() {
    current = null; list.hidden = true; topicsEl.hidden = false; label.textContent = "Topics";
    if (location.hash) history.replaceState(null, "", location.pathname);
  }
  function showTopic(id) {
    var t = data.topics.filter(function (x) { return x.id === id; })[0]; if (!t) return showTopics();
    current = id; topicsEl.hidden = true; list.hidden = false; label.textContent = t.title;
    list.innerHTML = '<button type="button" class="btn btn-line back" data-back>← All topics</button>' + qaHtml(t.qa);
    history.replaceState(null, "", "#" + id); window.scrollTo({ top: 0 });
  }
  function search(term) {
    term = term.trim().toLowerCase();
    if (!term) { current ? showTopic(current) : showTopics(); return; }
    var hits = [];
    data.topics.forEach(function (t) { t.qa.forEach(function (x) { if ((x[0] + " " + x[1]).toLowerCase().indexOf(term) > -1) hits.push(x); }); });
    topicsEl.hidden = true; list.hidden = false; label.textContent = hits.length + " result" + (hits.length === 1 ? "" : "s");
    list.innerHTML = '<button type="button" class="btn btn-line back" data-back>← All topics</button>' + (hits.length ? qaHtml(hits) : '<p class="clead">Nothing found. Try another word, or message us on WhatsApp.</p>');
  }
  fetch("/assets/data/faq.json").then(function (r) { return r.json(); }).then(function (d) {
    data = d;
    topicsEl.innerHTML = d.topics.map(function (t) {
      return '<a class="tcard" href="#' + t.id + '" data-topic="' + t.id + '"><img src="' + t.img + '" alt="" loading="lazy"><span class="arr" aria-hidden="true">→</span><span class="ttl">' + esc(t.title) + '</span></a>';
    }).join("");
    topicsEl.addEventListener("click", function (e) { var a = e.target.closest("[data-topic]"); if (a) { e.preventDefault(); showTopic(a.dataset.topic); } });
    list.addEventListener("click", function (e) { if (e.target.closest("[data-back]")) { q.value = ""; showTopics(); } });
    q.addEventListener("input", function () { search(q.value); });
    if (location.hash) showTopic(location.hash.slice(1));
  });
})();
