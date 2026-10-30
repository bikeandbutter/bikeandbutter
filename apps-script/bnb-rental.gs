/**
 * Bike & Butter — bike box rental.  Standalone Apps Script web app, deployed from bikeandbutter@gmail.com.
 *
 * Rentals live on the Google Calendar "Bike Box Rentals" (created automatically). EVERY event on it counts as a rental:
 *   "Wendy Tan" = 1 box        "Wendy Tan x2" = 2 boxes      (use x2, x3 ... in the title for more than one box)
 * The event's days (first and last day included) are the days the boxes are out.
 * Three states: PENDING (yellow, website request, does NOT block the website), CONFIRMED (grey, boxes reserved, awaiting payment)
 * and PAID (tomato, boxes blocked, confirmation sent). Mark a booking paid in the bnbhq Rentals tab or with the link in the request email.
 * Older manual bookings on your other calendars still count if the title has the word "box" / "bikebox";
 * the bnbhq tab can import them into the Bike Box Rentals calendar.
 * The bnbhq "Bike Box Rentals" tab reads and writes the same calendar through this script.
 */
var CAL_ID = 'bikeandbutter@gmail.com';
var RENTAL_CAL_NAME = 'Bike Box Rentals';
var OWNER_EMAIL = 'bikeandbutter@gmail.com';
var TOTAL_BOXES = 6;
var HORIZON_DAYS = 180;
var TZ = 'Asia/Singapore';
var RATE = 10, MIN_CHARGE = 50, PACK_FEE = 50, DELIVERY_FEE = 30;   // DELIVERY_FEE is per way (delivery, or collection)
var UEN = '53521776E';
var QR_URL = 'https://bikeandbutter.com/assets/img/paynow-qr.png';
var WORKSHOP = '491 Jurong West Ave 1';
var TERMS_URL = 'https://bikeandbutter.com/terms/#bike-box-rental';
var LATE_FEE = RATE;   // late return: per box per extra day (see the rental terms)
var PENDING_RE = /^\s*PENDING\s*[·\-:]?\s*/i;

// ---------- web app ----------
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'availability') {
    var cache = CacheService.getScriptCache(), hit = cache.get('avail');
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
    var out = JSON.stringify({ ok: true, total: TOTAL_BOXES, booked: bookedMap_(), generated: new Date().toISOString() });
    cache.put('avail', out, 60);
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  }
  if (p.action === 'review' || p.action === 'confirm' || p.action === 'decline') return adminPage_(p);
  return json_({ ok: true, service: 'bnb-rental' });
}

function doPost(e) {
  try {
    var b = JSON.parse(e.postData.contents);
    if (!b) return json_({ ok: false, error: 'bad request' });
    if (b.action === 'book') return bookFromWebsite_(b);
    if (/^admin/.test(String(b.action))) {
      if (!b.key || b.key !== adminKey_()) return json_({ ok: false, error: 'Wrong admin key' });
      return adminApi_(b);
    }
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// ---------- website booking ----------
function bookFromWebsite_(b) {
  if (b.website) return json_({ ok: true, ref: 'BX000000' }); // honeypot
  var r = normalise_(b);
  if (r.error) return json_({ ok: false, error: r.error });
  if (!r.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) return json_({ ok: false, error: 'email needed' });
  if ((r.deliver || r.collect) && r.address.length < 6) return json_({ ok: false, error: 'address needed' });
  if (b.terms !== true) return json_({ ok: false, error: 'terms' });
  r.terms = 'accepted ' + Utilities.formatDate(new Date(), TZ, 'd MMM yyyy HH:mm') + ' (website)';

  var cache = CacheService.getScriptCache(), key = 'rl_' + r.phone.replace(/\D/g, '');
  var n = parseInt(cache.get(key) || '0', 10);
  if (n >= 3) return json_({ ok: false, error: 'too many requests' });
  cache.put(key, String(n + 1), 3600);

  r.total = priceOf_(r);                       // recalculated here, the browser's number is not trusted
  r.ref = 'BX' + Utilities.formatDate(new Date(), TZ, 'yyMMdd') + Math.floor(100 + Math.random() * 900);
  var free = freeFor_(r.start, r.end, null);
  var ev = rentalCal_().createAllDayEvent(titleOf_(r, true), dateOf_(r.start), dateOf_(addDays_(r.end, 1)), { description: descOf_(r, 'pending') });
  try { ev.setColor(CalendarApp.EventColor.YELLOW); } catch (x) {}
  PropertiesService.getScriptProperties().setProperty('ev_' + r.ref, ev.getId());
  cache.remove('avail');

  var ok = free >= r.boxes, msg = whatsappText_(r, ok), wa = whatsapp_(r.phone);
  var waLink = wa ? 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg) : '';
  var reviewUrl = adminUrl_('review', r.ref), label = labelOf_(r);
  var avail = ok ? 'AVAILABILITY: OK (' + free + ' free for the whole period)' : 'AVAILABILITY: NOT ENOUGH BOXES (only ' + free + ' free on the tightest day)';
  var text = ['New bike box request ' + r.ref, avail, '', descOf_(r, '').replace(/\n\nTO CONFIRM[\s\S]*$/, ''), '',
    '1) Message the customer on WhatsApp (prefilled):', waLink || '(could not read the phone number)', '',
    '2) Once they have paid, confirm it in bnbhq (Bike Box Rentals tab) or with this link:', reviewUrl].join('\n');
  var html = '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111;max-width:560px">' +
    '<h2 style="margin:0 0 6px">New bike box request ' + r.ref + '</h2>' +
    '<p style="margin:0 0 12px;font-weight:bold;color:' + (ok ? '#1a7f37' : '#b42318') + '">' + esc_(avail) + '</p>' +
    '<pre style="font-family:inherit;background:#f6f6f4;padding:12px;border-radius:6px;white-space:pre-wrap">' + esc_(descOf_(r, '').replace(/\n\nTO CONFIRM[\s\S]*$/, '')) + '</pre>' +
    '<p><b>1) WhatsApp the customer</b> (prefilled with availability, total and PayNow):<br><a href="' + (waLink || '#') + '">Open WhatsApp</a></p>' +
    '<p><b>2) After they pay</b>, confirm it in <b>bnbhq → Bike Box Rentals</b>, or <a href="' + reviewUrl + '">use this confirm link</a>.</p>' +
    '<hr style="border:0;border-top:1px solid #ddd;margin:16px 0"><p style="margin:0 0 6px"><b>PayNow</b> UEN ' + UEN + ' · Bike & Butter · Amount $' + r.total + '</p>' +
    '<img src="' + QR_URL + '" alt="PayNow QR" width="220" height="220" style="display:block"></div>';
  MailApp.sendEmail({ to: OWNER_EMAIL, subject: (ok ? '' : '[FULL] ') + 'Bike box request ' + r.ref + ' · ' + label + ' · ' + r.name, body: text, htmlBody: html, replyTo: r.email || OWNER_EMAIL });
  return json_({ ok: true, ref: r.ref });
}

/** Cleans and validates a booking object from the website or bnbhq. */
function normalise_(b) {
  var r = { start: String(b.start || ''), end: String(b.end || '') };
  var today = day_(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.start) || !/^\d{4}-\d{2}-\d{2}$/.test(r.end)) return { error: 'bad dates' };
  if (r.end < r.start) return { error: 'return date is before collection date' };
  if (b._admin !== true && (r.start < today || r.end > addDays_(today, HORIZON_DAYS + 7))) return { error: 'dates out of range' };
  r.boxes = Math.max(1, Math.min(TOTAL_BOXES, parseInt(b.boxes, 10) || 1));
  r.packs = Math.max(0, Math.min(r.boxes, parseInt(b.packs, 10) || 0));
  r.deliver = !!b.deliver; r.collect = !!b.collect;
  r.address = clean_(b.address, 200);
  r.name = clean_(b.name, 80); r.phone = String(b.phone || '').replace(/[^\d+]/g, '').slice(0, 20);
  if (r.name.length < 2) return { error: 'missing name' };
  if (b._admin !== true && r.phone.replace(/\D/g, '').length < 8) return { error: 'missing phone' };
  r.email = clean_(b.email, 120); r.bike = clean_(b.bike, 40); r.notes = clean_(b.notes, 400);
  r.legs = legsFrom_(r, Array.isArray(b.legs) ? b.legs : []);
  return r;
}
/** Boxes 2..N of one booking. A box with no details of its own inherits everything from the main customer. */
function legsFrom_(r, raw) {
  var legs = [];
  for (var i = 0; i < r.boxes - 1; i++) {
    var L = raw[i];
    if (!L) { legs.push({ name: r.name, phone: r.phone, email: r.email, bike: r.bike, deliver: r.deliver, collect: r.collect, address: r.address }); continue; }
    legs.push({ name: clean_(L.name, 80) || r.name, phone: String(L.phone || '').replace(/[^\d+]/g, '').slice(0, 20), email: clean_(L.email, 120), bike: clean_(L.bike, 40),
      deliver: !!L.deliver, collect: !!L.collect, address: clean_(L.address, 200) });
  }
  return legs;
}
/** Every box of the booking as {name, phone, email, bike, deliver, collect, address}; box 1 is the main customer. */
function allLegs_(r) {
  return [{ name: r.name, phone: r.phone, email: r.email, bike: r.bike, deliver: r.deliver, collect: r.collect, address: r.address }].concat(r.legs || []);
}
function addrKey_(a) { return String(a || '').toLowerCase().replace(/\s+/g, ' ').trim() || '?'; }
/** Delivery / collection trips: one per way per distinct address (boxes going to the same address share a trip). */
function waysOf_(r) {
  var dn = {}, cn = {}, n = 0;
  allLegs_(r).forEach(function (l) {
    var k = addrKey_(l.address);
    if (l.deliver && !dn[k]) { dn[k] = 1; n++; }
    if (l.collect && !cn[k]) { cn[k] = 1; n++; }
  });
  return n;
}
function daysOf_(r) { return daysBetween_(r.start, r.end) + 1; }
function priceOf_(r) { return Math.max(MIN_CHARGE, daysOf_(r) * RATE) * r.boxes + r.packs * PACK_FEE + waysOf_(r) * DELIVERY_FEE; }
function labelOf_(r) { return r.start === r.end ? nice_(r.start) : nice_(r.start) + ' to ' + nice_(r.end); }
function titleOf_(r, pending) { return (pending ? 'PENDING · ' : '') + 'BOX ' + (r.boxes > 1 ? 'x' + r.boxes + ' ' : '') + '· ' + r.name; }
function dateOf_(s) { return Utilities.parseDate(s, TZ, 'yyyy-MM-dd'); }
function yn_(v) { return v ? 'yes' : 'no'; }
function descOf_(r, state) {
  var d = daysOf_(r);
  return [
    'Ref: ' + r.ref,
    'Dates: ' + labelOf_(r) + ' (' + d + ' day' + (d > 1 ? 's' : '') + ')',
    'Boxes: ' + r.boxes,
    'Packing: ' + (r.packs ? r.packs + ' bike(s)' : 'none'),
    'Deliver: ' + yn_(r.deliver),
    'Collect: ' + yn_(r.collect),
    'Address: ' + r.address,
    'Total: $' + r.total,
    'Name: ' + r.name,
    'WhatsApp: ' + r.phone,
    'Email: ' + r.email,
    'Bike: ' + r.bike,
    'Notes: ' + r.notes
  ].concat((r.legs || []).map(function (l, i) { return 'Box' + (i + 2) + ': ' + JSON.stringify(l); }))
    .concat(r.terms ? ['Terms: ' + r.terms] : [])
    .concat(r.boxnos && r.boxnos.length ? ['Boxnos: ' + r.boxnos.join(',')] : [])
    .concat(r.payment ? ['Payment: ' + JSON.stringify(r.payment)] : [])
    .concat(r.handover ? ['Handover: ' + JSON.stringify(r.handover)] : []).join('\n') +
    (state === 'pending' ? '\n\nTO CONFIRM: once the customer has paid, mark it PAID in bnbhq (Bike Box Rentals) or use the link in the request email.' : '') +
    (state === 'paid' ? '\n\nPAID ' + Utilities.formatDate(new Date(), TZ, 'd MMM yyyy HH:mm') : '');
}

/** The WhatsApp message to the customer (availability + PayNow). */
function whatsappText_(r, ok) {
  var first = r.name.split(' ')[0], d = daysOf_(r), n = r.boxes;
  var incl = [], legs = allLegs_(r);
  if (r.packs) incl.push('packing');
  if (legs.some(function (l) { return l.deliver; })) incl.push('delivery');
  if (legs.some(function (l) { return l.collect; })) incl.push('collection');
  var inclTxt = incl.length > 1 ? incl.slice(0, -1).join(', ') + ' and ' + incl[incl.length - 1] : incl.join('');
  var daysTxt = d + ' day' + (d > 1 ? 's' : '') + (incl.length ? ', incl. ' + inclTxt : '');
  if (!ok) return 'Hi ' + first + ', thanks for your bike box request. Unfortunately we do not have enough boxes for ' + labelOf_(r) + '. Would other dates work for you?';
  var where = whereText_(r);
  return 'Hi ' + first + ', thanks for booking a bike box with Bike & Butter. Good news, ' + n + (n > 1 ? ' boxes are' : ' box is') + ' available for ' + labelOf_(r) + ' (' + daysTxt + ').\n\n' +
    'To confirm your booking, please kindly make the payment of $' + r.total + ' to UEN ' + UEN + ' (Bike & Butter). Once paid, kindly reply to this message with a screenshot and we will lock in your booking.\n\n' + where;
}
function whereOne_(l) {
  if (l.deliver && l.collect) return 'Delivery and collection will be made at ' + l.address + '.';
  if (l.deliver) return 'Delivery will be made to ' + l.address + '. Return is at ' + WORKSHOP + '.';
  if (l.collect) return 'Self-collection is at ' + WORKSHOP + '. We will collect the box from ' + l.address + ' at the end of your rental.';
  return 'Self-collection is at ' + WORKSHOP + '.';
}
/** Where the boxes go: one sentence when every box is handled the same way, otherwise one line per box. */
function whereText_(r) {
  var legs = allLegs_(r), lines = legs.map(whereOne_);
  if (lines.every(function (x) { return x === lines[0]; })) return lines[0];
  return legs.map(function (l, i) { return 'Box ' + (i + 1) + (l.name && l.name !== r.name ? ' (' + l.name.split(' ')[0] + ')' : '') + ': ' + whereOne_(l); }).join('\n');
}
/** Message sent to the customer once payment is verified. */
function confirmText_(r) {
  var first = r.name.split(' ')[0], d = daysOf_(r), n = r.boxes;
  return 'Hi ' + first + ', we have received your payment of $' + r.total + ', thank you! Your bike box booking with Bike & Butter is confirmed.\n\n' +
    'Ref: ' + r.ref + '\nDates: ' + labelOf_(r) + ' (' + d + ' day' + (d > 1 ? 's' : '') + ')\nBoxes: ' + n + (r.packs ? '\nPacking: ' + r.packs + ' bike' + (r.packs > 1 ? 's' : '') : '') + '\n\n' +
    whereText_(r) + '\n\nWe will message you to arrange the exact times. Rental terms: ' + TERMS_URL + '\n\nSee you soon!';
}
function whereTextEmail_(r) {
  if (r.deliver && r.collect) return 'Delivery and collection: ' + r.address + '. We will WhatsApp you to arrange the times.';
  if (r.deliver) return 'Delivery to: ' + r.address + '. Return the box to ' + WORKSHOP + ', Singapore 640491. We will WhatsApp you to arrange the times.';
  if (r.collect) return 'Collection at: ' + WORKSHOP + ', Singapore 640491. We will collect the box from ' + r.address + ' at the end. We will WhatsApp you to arrange the times.';
  return 'Collection and return: ' + WORKSHOP + ', Singapore 640491. We will WhatsApp you to arrange the collection time.';
}

// ---------- confirm / decline (link in the owner email) ----------
function adminPage_(p) {
  var ref = String(p.ref || ''), ok = ref && p.t && p.t === token_(ref);
  if (!ok) return page_('Link not valid', '<p>This link is not valid. Please use the link in the latest request email.</p>');
  var ev = findPending_(ref);
  if (!ev) return page_('Already handled', '<p>Booking <b>' + esc_(ref) + '</b> was not found as an unpaid booking. It may already be marked paid or removed. Check the Bike Box Rentals calendar.</p>');
  var r = recOf_(ev, 'rental');
  if (p.action === 'review') {
    var free = freeFor_(r.start, r.end, null), warn = free < r.boxes ? '<p style="color:#b42318"><b>Warning:</b> only ' + free + ' box(es) free for these dates.</p>' : '';
    return page_('Booking ' + esc_(ref), '<pre>' + esc_((ev.getDescription() || '').replace(/\n\nTO CONFIRM[\s\S]*$/, '')) + '</pre>' + warn +
      '<p>Only mark it paid once you have checked the customer\'s payment. This blocks the boxes on the website and emails the customer a confirmation. You then send the WhatsApp confirmation from bnbhq.</p>' +
      '<p><a class="b" href="' + adminUrl_('confirm', ref) + '">Mark as PAID</a> <a class="b o" href="' + adminUrl_('decline', ref) + '">Decline and remove</a></p>');
  }
  if (p.action === 'confirm') {
    var em = markPaid_(ev, null, true).emailed;
    return page_('Marked as paid', '<p>Booking <b>' + esc_(ref) + '</b> is marked PAID and the boxes are now blocked on the website.' + (em.length ? ' A confirmation email was sent to ' + esc_(em.join(', ')) + '.' : ' (No customer email on file, so no email was sent.)') + ' Open bnbhq → Bike Box Rentals to send the WhatsApp confirmation.</p>');
  }
  ev.deleteEvent(); CacheService.getScriptCache().remove('avail');
  return page_('Removed', '<p>Booking <b>' + esc_(ref) + '</b> was removed from the calendar. Let the customer know on WhatsApp.</p>');
}
/** Marks a booking PAID: tomato colour, boxes blocked, payment recorded, confirmation emailed (unless sendEmail is false). Returns {emailed, cmsg}. */
function markPaid_(ev, payment, sendEmail) {
  ev.setTitle((ev.getTitle() || '').replace(PENDING_RE, ''));
  try { ev.setColor(CalendarApp.EventColor.RED); } catch (x) {}   // RED is "Tomato" in Google Calendar
  var r0 = recOf_(ev, 'rental');
  var pay = payment || {};
  var rec = { amount: isNaN(+pay.amount) || pay.amount === '' || pay.amount == null ? (r0.total || 0) : +pay.amount, method: clean_(pay.method || 'PayNow', 30), ref: clean_(pay.ref, 60), date: /^\d{4}-\d{2}-\d{2}$/.test(String(pay.date || '')) ? pay.date : day_(new Date()) };
  var d = (ev.getDescription() || '').replace(/\n\nTO CONFIRM[\s\S]*$/, '').replace(/\n\n(CONFIRMED|PAID) .*$/m, '').replace(/\n?^Payment: .*$/m, '');
  ev.setDescription(d + '\nPayment: ' + JSON.stringify(rec) + '\n\nPAID ' + Utilities.formatDate(new Date(), TZ, 'd MMM yyyy HH:mm'));
  CacheService.getScriptCache().remove('avail');
  var r = recOf_(ev, 'rental');
  return { emailed: sendEmail === false ? [] : emailConfirmation_(r), cmsg: confirmText_(r) };
}
/** One confirmation email per distinct address (the main customer's also shows the total). */
function emailConfirmation_(r) {
  var groups = {}, order = [];
  allLegs_(r).forEach(function (l) {
    var e = (l.email || '').toLowerCase();
    if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return;
    if (!groups[e]) { groups[e] = []; order.push(e); }
    groups[e].push(l);
  });
  order.forEach(function (e) {
    var ls = groups[e], main = e === (r.email || '').toLowerCase(), wheres = [];
    ls.forEach(function (l) { var t = whereTextEmail_(l); if (wheres.indexOf(t) < 0) wheres.push(t); });
    MailApp.sendEmail({ to: ls[0].email, replyTo: OWNER_EMAIL, subject: 'Your bike box booking is confirmed (' + r.ref + ')',
      body: 'Hi ' + ls[0].name.split(' ')[0] + ',\n\nWe have received your payment and your bike box booking is confirmed.\n\nRef: ' + r.ref + '\nDates: ' + labelOf_(r) + ' (' + daysOf_(r) + ' day' + (daysOf_(r) > 1 ? 's' : '') + ')\nBoxes: ' + ls.length +
        (main ? '\nPacking: ' + (r.packs ? r.packs + ' bike(s)' : 'None') + '\nTotal paid: $' + r.total : '') + '\n\n' + wheres.join('\n') +
        '\n\nBoxes are 130 x 49 x 100 cm and weigh 16-17 kg empty, so please make sure your transport can fit one.\n\nRental terms (late return, damage, cancellations): ' + TERMS_URL + '\n\nIf you need to change your dates, just reply to this email or WhatsApp us on +65 8722 2610.\n\nBike & Butter' });
  });
  return order;
}
function findPending_(ref) {
  var cal = rentalCal_(), id = PropertiesService.getScriptProperties().getProperty('ev_' + ref), ev = null;
  if (id) { try { ev = cal.getEventById(id); } catch (x) {} }
  if (!ev) {
    var from = new Date(Date.now() - 30 * 864e5), to = new Date(Date.now() + (HORIZON_DAYS + 30) * 864e5);
    cal.getEvents(from, to).forEach(function (e) { if (!ev && (e.getDescription() || '').indexOf('Ref: ' + ref) === 0) ev = e; });
  }
  return ev && !/^PAID /m.test(ev.getDescription() || '') ? ev : null;
}
function page_(title, body) {
  return HtmlService.createHtmlOutput('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + '</title>' +
    '<style>body{font-family:Arial,sans-serif;max-width:520px;margin:32px auto;padding:0 16px;color:#111;line-height:1.5}pre{background:#f6f6f4;padding:12px;border-radius:6px;white-space:pre-wrap}.b{display:inline-block;background:#111;color:#fff;padding:12px 18px;border-radius:4px;text-decoration:none;margin:4px 6px 4px 0}.o{background:#fff;color:#111;border:1px solid #111}</style>' +
    '<h2>' + title + '</h2>' + body).setTitle(title);
}

// ---------- admin API (used by the bnbhq "Bike Box Rentals" tab) ----------
function adminApi_(b) {
  var cal = rentalCal_(), act = b.action;
  if (act === 'adminList') {
    var from = new Date(Date.now() - 60 * 864e5), to = dateOf_(addDays_(day_(new Date()), HORIZON_DAYS + 8)), list = [];
    cal.getEvents(from, to).forEach(function (ev) { list.push(recOf_(ev, 'rental')); });
    legacyEvents_(from, to).forEach(function (ev) { list.push(recOf_(ev, 'main')); });
    var booked = bookedMap_();
    list.forEach(function (r) {
      if (r.legacy || r.block) return;
      if (r.status === 'pending') { r.free = freeFor_(r.start, r.end, null, booked); r.msg = whatsappText_(r, r.free >= r.boxes); }
      else if (r.status === 'confirmed') r.msg = whatsappText_(r, true);
      else r.cmsg = confirmText_(r);
    });
    return json_({ ok: true, total: TOTAL_BOXES, rates: { rate: RATE, min: MIN_CHARGE, pack: PACK_FEE, delivery: DELIVERY_FEE }, rentals: list, today: day_(new Date()) });
  }
  if (act === 'adminPaid' || act === 'adminConfirm' || act === 'adminRemove') {
    var ev = cal.getEventById(String(b.id || ''));
    if (!ev) return json_({ ok: false, error: 'Event not found. Refresh the list.' });
    if (act === 'adminRemove') { ev.deleteEvent(); CacheService.getScriptCache().remove('avail'); return json_({ ok: true }); }
    var r = recOf_(ev, 'rental');
    var free = freeFor_(r.start, r.end, null);
    if (free < r.boxes && !b.force) return json_({ ok: false, code: 'full', error: 'Only ' + free + ' box(es) are free for these dates.' });
    var mp = markPaid_(ev, b.payment, b.sendEmail !== false);
    return json_({ ok: true, emailed: mp.emailed, cmsg: mp.cmsg });
  }
  if (act === 'adminAdopt') {
    // moves an older manual booking (from another calendar) into the Bike Box Rentals calendar as a confirmed rental
    var oc = CalendarApp.getCalendarById(String(b.calId || '')), lev = oc ? oc.getEventById(String(b.id || '')) : null;
    if (!lev) return json_({ ok: false, error: 'Event not found. Refresh the list.' });
    var lr = recOf_(lev, 'main');
    var s3 = { start: lr.start, end: lr.end, boxes: lr.boxes, packs: 0, deliver: false, collect: false, address: '', name: lr.name, phone: '', email: '', bike: '', notes: clean_(lr.desc, 400) };
    s3.legs = legsFrom_(s3, []);
    s3.total = priceOf_(s3); s3.ref = newRef_();
    var ne = cal.createAllDayEvent(titleOf_(s3, false), dateOf_(s3.start), dateOf_(addDays_(s3.end, 1)), { description: descOf_(s3, 'paid') });   // older bookings were already paid
    try { ne.setColor(CalendarApp.EventColor.RED); } catch (x) {}
    PropertiesService.getScriptProperties().setProperty('ev_' + s3.ref, ne.getId());
    lev.deleteEvent(); CacheService.getScriptCache().remove('avail');
    return json_({ ok: true, id: ne.getId() });
  }
  if (act === 'adminSave') {
    b._admin = true;
    var s = normalise_(b);
    if (s.error) return json_({ ok: false, error: s.error });
    var ev2 = b.id ? cal.getEventById(String(b.id)) : null;
    if (b.id && !ev2) return json_({ ok: false, error: 'Event not found. Refresh the list.' });
    var old = ev2 ? recOf_(ev2, 'rental') : null;
    var status = /^(pending|confirmed|paid)$/.test(String(b.status)) ? b.status : (old ? old.status : (b.pending ? 'pending' : 'confirmed'));
    if (status !== 'pending') {
      var free2 = freeFor_(s.start, s.end, ev2 ? ev2.getId() : null);
      if (free2 < s.boxes && !b.force) return json_({ ok: false, code: 'full', error: 'Only ' + free2 + ' box(es) are free for these dates.' });
    }
    s.total = (b.total !== '' && b.total != null && !isNaN(+b.total)) ? Math.max(0, +b.total) : priceOf_(s);
    s.ref = (old && old.ref) || newRef_();
    s.terms = old ? old.terms : '';
    if (b.terms === true && !s.terms) s.terms = 'accepted ' + Utilities.formatDate(new Date(), TZ, 'd MMM yyyy HH:mm') + ' (confirmed by us)';
    s.boxnos = old ? old.boxnos : []; s.payment = old ? old.payment : null; s.handover = old ? old.handover : null;
    var desc = descOf_(s, status);
    if (status === 'paid' && old && old.paidAt) desc = desc.replace(/\n\nPAID .*$/, '\n\nPAID ' + old.paidAt);
    var pending = status === 'pending', color = pending ? CalendarApp.EventColor.YELLOW : status === 'paid' ? CalendarApp.EventColor.RED : CalendarApp.EventColor.GRAY;
    if (ev2) { ev2.setTitle(titleOf_(s, pending)); ev2.setAllDayDates(dateOf_(s.start), dateOf_(addDays_(s.end, 1))); ev2.setDescription(desc); }
    else {
      ev2 = cal.createAllDayEvent(titleOf_(s, pending), dateOf_(s.start), dateOf_(addDays_(s.end, 1)), { description: desc });
      PropertiesService.getScriptProperties().setProperty('ev_' + s.ref, ev2.getId());
    }
    try { ev2.setColor(color); } catch (x) {}
    CacheService.getScriptCache().remove('avail');
    return json_({ ok: true, id: ev2.getId(), total: s.total });
  }
  if (act === 'adminHandover') return handover_(b, cal);
  if (act === 'adminBlockSave') {
    var bs = { start: String(b.start || ''), end: String(b.end || '') };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bs.start) || !/^\d{4}-\d{2}-\d{2}$/.test(bs.end) || bs.end < bs.start) return json_({ ok: false, error: 'Please check the dates.' });
    bs.boxes = Math.max(1, Math.min(TOTAL_BOXES, parseInt(b.boxes, 10) || 1)); bs.reason = clean_(b.reason, 80) || 'Blocked'; bs.nos = nums_(Array.isArray(b.boxnos) ? b.boxnos.join(',') : b.boxnos);
    var btitle = 'BLOCK ' + (bs.boxes > 1 ? 'x' + bs.boxes + ' ' : '') + '\u00b7 ' + bs.reason;
    var bdesc = 'Reason: ' + bs.reason + '\nBoxes: ' + bs.boxes + '\nDates: ' + bs.start + ' to ' + bs.end + (bs.nos.length ? '\nBoxnos: ' + bs.nos.join(',') : '') + '\n\nBLOCKED (not available to rent)';
    var bev = b.id ? cal.getEventById(String(b.id)) : null;
    if (b.id && !bev) return json_({ ok: false, error: 'Event not found. Refresh the list.' });
    if (bev) { bev.setTitle(btitle); bev.setAllDayDates(dateOf_(bs.start), dateOf_(addDays_(bs.end, 1))); bev.setDescription(bdesc); }
    else bev = cal.createAllDayEvent(btitle, dateOf_(bs.start), dateOf_(addDays_(bs.end, 1)), { description: bdesc });
    try { bev.setColor(CalendarApp.EventColor.CYAN); } catch (x) {}
    CacheService.getScriptCache().remove('avail');
    return json_({ ok: true, id: bev.getId() });
  }
  return json_({ ok: false, error: 'unknown admin action' });
}

/** A plain record for one calendar event. */
function recOf_(ev, source) {
  var t = ev.getTitle() || '', d = ev.getDescription() || '', first, last;
  if (ev.isAllDayEvent()) { first = day_(ev.getAllDayStartDate()); last = addDays_(day_(ev.getAllDayEndDate()), -1); }
  else { first = day_(ev.getStartTime()); var e = ev.getEndTime(); last = Utilities.formatDate(e, TZ, 'HH:mm') === '00:00' ? addDays_(day_(e), -1) : day_(e); }
  if (last < first) last = first;
  var m = t.match(/(?:^|\s)[x×]\s*(\d+)\b/i) || t.match(/\b(\d+)\s*(?:bike\s*)?boxes\b/i);
  var boxes = m ? Math.max(1, parseInt(m[1], 10)) : 1;
  var nm = field_(d, 'Name') || t.replace(PENDING_RE, '').replace(/(?:^|\s)[x×]\s*\d+\b/i, '').replace(/\b\d+\s*(?:bike\s*)?boxes\b/i, '').replace(/bike\s*box(es)?|(^|[^a-z])box(es)?(?![a-z])/ig, ' ').replace(/^[\s·\-:]+|[\s·\-:]+$/g, '').replace(/\s+/g, ' ').trim() || t;
  var total = field_(d, 'Total').replace(/[^\d.]/g, '');
  var pend = PENDING_RE.test(t), paidAt = (d.match(/^PAID (.*)$/m) || [])[1] || '';
  var block = /^\s*BLOCK\b/i.test(t);
  if (block) { var bx = parseInt(field_(d, 'Boxes'), 10); if (bx) boxes = Math.max(1, Math.min(TOTAL_BOXES, bx)); nm = field_(d, 'Reason') || t.replace(/^\s*BLOCK\s*(x\d+)?\s*[·\-:]?\s*/i, '').trim() || 'Blocked'; }
  var main = { name: nm, phone: field_(d, 'WhatsApp'), email: field_(d, 'Email'), bike: field_(d, 'Bike'), deliver: /^y/i.test(field_(d, 'Deliver')), collect: /^y/i.test(field_(d, 'Collect')), address: field_(d, 'Address') };
  var legs = [];
  for (var i = 2; i <= boxes; i++) {
    var lm = d.match(new RegExp('^Box' + i + ': (.*)$', 'm')), L = null;
    if (lm) { try { L = JSON.parse(lm[1]); } catch (x) {} }
    legs.push(L ? { name: L.name || nm, phone: L.phone || '', email: L.email || '', bike: L.bike || '', deliver: !!L.deliver, collect: !!L.collect, address: L.address || '' } : JSON.parse(JSON.stringify(main)));
  }
  return {
    id: ev.getId(), calId: ev.getOriginalCalendarId ? ev.getOriginalCalendarId() : '', source: source, legacy: source !== 'rental', pending: pend, status: block ? 'blocked' : (pend ? 'pending' : (paidAt ? 'paid' : 'confirmed')), block: block, paidAt: paidAt, legs: legs,
    terms: field_(d, 'Terms'), boxnos: nums_(field_(d, 'Boxnos')), payment: jsonField_(d, 'Payment'), handover: jsonField_(d, 'Handover'), title: t, desc: d,
    ref: field_(d, 'Ref'), start: first, end: last, boxes: boxes, packs: parseInt(field_(d, 'Packing'), 10) || 0,
    deliver: main.deliver, collect: main.collect, address: main.address,
    name: nm, phone: field_(d, 'WhatsApp'), email: field_(d, 'Email'), bike: field_(d, 'Bike'), notes: field_(d, 'Notes'),
    total: total === '' ? null : +total
  };
}

/** Run once from the editor. Prints the admin key to paste into bnbhq (Bike Box Rentals tab). */
function nums_(v) { var out = []; String(v || '').split(/[^\d]+/).forEach(function (x) { var n = parseInt(x, 10); if (n >= 1 && n <= TOTAL_BOXES && out.indexOf(n) < 0) out.push(n); }); return out; }
function jsonField_(d, key) { var v = field_(d, key); if (!v) return null; try { return JSON.parse(v); } catch (x) { return null; } }
function showAdminKey() { Logger.log('ADMIN KEY: ' + adminKey_()); }
function newRef_() { return 'BX' + Utilities.formatDate(new Date(), TZ, 'yyMMdd') + Math.floor(100 + Math.random() * 900); }
function adminKey_() {
  var props = PropertiesService.getScriptProperties(), k = props.getProperty('ADMIN_KEY');
  if (!k) { k = Utilities.getUuid().replace(/-/g, ''); props.setProperty('ADMIN_KEY', k); }
  return k;
}

// ---------- check-out / check-in ----------
/** Records (or undoes) the handover of the boxes: box numbers, condition notes, photos, extra charges. */
function handover_(b, cal) {
  var ev = cal.getEventById(String(b.id || ''));
  if (!ev) return json_({ ok: false, error: 'Event not found. Refresh the list.' });
  var r = recOf_(ev, 'rental');
  if (r.block || r.pending) return json_({ ok: false, error: 'Only confirmed rentals can be handed over.' });
  var ho = r.handover || {}, now = Utilities.formatDate(new Date(), TZ, 'd MMM yyyy HH:mm'), nos = r.boxnos;
  if (b.undo === 'out') { delete ho.out; delete ho['in']; nos = []; }
  else if (b.undo === 'in') delete ho['in'];
  else if (b.stage === 'out') {
    nos = nums_(Array.isArray(b.boxnos) ? b.boxnos.join(',') : b.boxnos);
    if (nos.length && nos.length !== r.boxes && !b.force) return json_({ ok: false, code: 'count', error: 'This rental has ' + r.boxes + ' box(es) but you picked ' + nos.length + ' box number(s).' });
    var clash = '';
    cal.getEvents(new Date(Date.now() - 120 * 864e5), dateOf_(addDays_(day_(new Date()), HORIZON_DAYS + 8))).forEach(function (e2) {
      if (clash || e2.getId() === ev.getId()) return;
      var o = recOf_(e2, 'rental');
      if (o.block || o.pending || !o.handover || !o.handover.out || o.handover['in']) return;
      if (o.boxnos.some(function (n) { return nos.indexOf(n) >= 0; })) clash = o.name;
    });
    if (clash && !b.force) return json_({ ok: false, code: 'busy', error: 'One of those boxes is still out with ' + clash + '.' });
    ho.out = { at: now, note: clean_(b.note, 500), photos: photos_(b.photos), terms: !!b.terms || !!(ho.out && ho.out.terms) };
    delete ho['in'];
  } else if (b.stage === 'in') {
    if (!ho.out) return json_({ ok: false, error: 'Check the boxes out first.' });
    ho['in'] = { at: now, note: clean_(b.note, 500), photos: photos_(b.photos), damage: !!b.damage, fee: Math.max(0, +b.fee || 0), feeNote: clean_(b.feeNote, 200) };
  } else return json_({ ok: false, error: 'unknown handover stage' });
  var d = (ev.getDescription() || '').replace(/\n?^Handover: .*$/m, '').replace(/\n?^Boxnos: .*$/m, '');
  var add = (nos.length ? '\nBoxnos: ' + nos.join(',') : '') + (ho.out ? '\nHandover: ' + JSON.stringify(ho) : '');
  var m = d.match(/\n\n(TO CONFIRM|PAID|CONFIRMED) /);
  d = m ? d.slice(0, m.index) + add + d.slice(m.index) : d + add;
  ev.setDescription(d);
  return json_({ ok: true });
}
function photos_(a) { return (Array.isArray(a) ? a : []).filter(function (u) { return /^https:\/\//.test(String(u)); }).slice(0, 8).map(function (u) { return String(u).slice(0, 300); }); }

// ---------- reminders and the daily agenda (daily trigger) ----------
/** Run once from the editor to switch on the daily 9am reminders and agenda. */
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'sendReminders') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sendReminders').timeBased().everyDays(1).atHour(9).inTimezone(TZ).create();
  rentalCal_();
  Logger.log('Daily reminders and agenda switched on (9am Singapore time).');
}

/** Daily 9am: customer reminders (3 days before, and on the return day), then the owner's agenda email. */
function sendReminders() {
  var today = day_(new Date()), props = PropertiesService.getScriptProperties(), recs = [];
  rentalCal_().getEvents(dateOf_(addDays_(today, -90)), dateOf_(addDays_(today, HORIZON_DAYS + 8))).forEach(function (ev) { recs.push(recOf_(ev, 'rental')); });
  var target = addDays_(today, 3);
  recs.forEach(function (r) {
    if (r.block || r.pending || r.status !== 'paid' || !r.email) return;
    if (r.start === target && !props.getProperty('rem_' + r.id)) {
      MailApp.sendEmail({ to: r.email, replyTo: OWNER_EMAIL, subject: 'Reminder: your bike box rental starts on ' + nice_(r.start),
        body: 'Hi ' + r.name.split(' ')[0] + ',\n\nA quick reminder that your bike box rental starts on ' + nice_(r.start) + '.\n\n' + whereTextEmail_(r) + '\n\n' +
          'The box measures 130 x 49 x 100 cm and weighs 16-17 kg empty (at least 25 kg with a road bike, 30 kg with a tri bike), so please make sure your transport can fit it.\n' +
          'Each box comes with 2 TSA-approved locks. If you booked packing, bring your bike to the workshop and we will pack it.\n\n' +
          'Need to change anything? Reply to this email or WhatsApp us on +65 8722 2610.\n\nBike & Butter' });
      props.setProperty('rem_' + r.id, '1');
    }
    if (r.end === today && !(r.handover && r.handover['in']) && !props.getProperty('ret_' + r.id)) {
      MailApp.sendEmail({ to: r.email, replyTo: OWNER_EMAIL, subject: 'Your bike box is due back today (' + nice_(r.end) + ')',
        body: 'Hi ' + r.name.split(' ')[0] + ',\n\nA reminder that your bike box rental ends today, ' + nice_(r.end) + '.\n\n' +
          (r.collect ? 'We will collect the box from ' + r.address + '. We will WhatsApp you to arrange the time.' : 'Please return the box to ' + WORKSHOP + ', Singapore 640491. WhatsApp us on +65 8722 2610 to arrange the time.') +
          '\n\nEach extra day after today is charged at $' + LATE_FEE + ' per box (see the rental terms: ' + TERMS_URL + '). If you need more days, please tell us now and we will check availability.\n\nThank you,\nBike & Butter' });
      props.setProperty('ret_' + r.id, '1');
    }
  });
  sendAgenda_(recs, today, false);
}
/** Run from the editor to send today's agenda right now (ignores the once-a-day guard). */
function sendAgendaNow() {
  var today = day_(new Date()), recs = [];
  rentalCal_().getEvents(dateOf_(addDays_(today, -90)), dateOf_(addDays_(today, HORIZON_DAYS + 8))).forEach(function (ev) { recs.push(recOf_(ev, 'rental')); });
  sendAgenda_(recs, today, true);
}
function overdueDays_(r, today) { return r.handover && r.handover.out && !r.handover['in'] && r.end < today ? daysBetween_(r.end, today) : 0; }
function agendaLine_(r, today, kind) {
  var bits = [r.name + ' x' + r.boxes];
  if (r.phone) bits.push(r.phone);
  if (r.boxnos && r.boxnos.length) bits.push('box ' + r.boxnos.join(', '));
  bits.push(r.status === 'paid' ? 'paid' : 'NOT PAID' + (r.total != null ? ' ($' + r.total + ')' : ''));
  if (kind === 'start' && r.deliver) bits.push('DELIVER to ' + r.address);
  if (kind === 'end' && r.collect) bits.push('COLLECT from ' + r.address);
  if (kind === 'late') bits.push(overdueDays_(r, today) + ' day(s) overdue, due ' + nice_(r.end) + ', late fee about $' + (overdueDays_(r, today) * LATE_FEE * r.boxes));
  return bits.join(' · ');
}
function sendAgenda_(recs, today, force) {
  var props = PropertiesService.getScriptProperties();
  if (!force && props.getProperty('agenda_' + today)) return;
  var tomorrow = addDays_(today, 1), in3 = addDays_(today, 3), live = recs.filter(function (r) { return !r.block && !r.pending; });
  var secs = [
    ['COLLECTIONS TODAY', live.filter(function (r) { return r.start === today && !(r.handover && r.handover.out); }), 'start'],
    ['RETURNS TODAY', live.filter(function (r) { return r.end === today && !(r.handover && r.handover['in']); }), 'end'],
    ['OVERDUE (still out)', live.filter(function (r) { return overdueDays_(r, today) > 0; }), 'late'],
    ['TOMORROW: collections', live.filter(function (r) { return r.start === tomorrow; }), 'start'],
    ['TOMORROW: returns', live.filter(function (r) { return r.end === tomorrow; }), 'end'],
    ['IN 3 DAYS: collections', live.filter(function (r) { return r.start === in3; }), 'start'],
    ['UNPAID, starting within 7 days', live.filter(function (r) { return r.status !== 'paid' && r.start >= today && r.start <= addDays_(today, 7); }), 'start']
  ].filter(function (x) { return x[1].length; });
  var pend = recs.filter(function (r) { return r.pending && r.end >= today; }).length;
  if (!secs.length && !pend) return;
  props.setProperty('agenda_' + today, '1');
  var out = live.filter(function (r) { return r.start <= today && r.end >= today; }).reduce(function (a, r) { return a + r.boxes; }, 0);
  var blocked = recs.filter(function (r) { return r.block && r.start <= today && r.end >= today; }).reduce(function (a, r) { return a + r.boxes; }, 0);
  var late = secs.filter(function (x) { return x[2] === 'late'; })[0];
  var subject = 'Bike box agenda · ' + nice_(today) + (late ? ' · ' + late[1].length + ' OVERDUE' : '');
  var text = ['Bike box agenda for ' + nice_(today), 'Boxes out today: ' + out + ' of ' + TOTAL_BOXES + (blocked ? ' (' + blocked + ' blocked)' : ''), ''], html = ['<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111;max-width:620px"><h2 style="margin:0 0 4px">Bike box agenda · ' + nice_(today) + '</h2><p style="margin:0 0 12px">Boxes out today: <b>' + out + ' of ' + TOTAL_BOXES + '</b>' + (blocked ? ' (' + blocked + ' blocked)' : '') + '</p>'];
  secs.forEach(function (x) {
    text.push(x[0]); html.push('<h3 style="margin:14px 0 4px;font-size:13px;letter-spacing:.4px;color:' + (x[2] === 'late' ? '#b42318' : '#111') + '">' + esc_(x[0]) + '</h3><ul style="margin:0;padding-left:18px">');
    x[1].forEach(function (r) {
      var line = agendaLine_(r, today, x[2]), wa = whatsapp_(r.phone), link = '';
      if (wa && x[2] === 'late') link = ' <a href="https://wa.me/' + wa + '?text=' + encodeURIComponent('Hi ' + r.name.split(' ')[0] + ', this is Bike & Butter. Your bike box was due back on ' + nice_(r.end) + '. Could you let us know when we can collect it? Each extra day is charged at $' + LATE_FEE + ' per box.') + '">WhatsApp</a>';
      else if (wa) link = ' <a href="https://wa.me/' + wa + '">WhatsApp</a>';
      text.push('  - ' + line + (wa ? '  https://wa.me/' + wa : '')); html.push('<li>' + esc_(line) + link + '</li>');
    });
    text.push(''); html.push('</ul>');
  });
  if (pend) { text.push('PENDING website requests waiting for payment: ' + pend); html.push('<p style="margin-top:14px"><b>' + pend + '</b> pending website request(s) waiting for payment. Open bnbhq, Bike Box Rentals.</p>'); }
  html.push('</div>');
  MailApp.sendEmail({ to: OWNER_EMAIL, subject: subject, body: text.join('\n'), htmlBody: html.join('') });
}

// ---------- availability ----------
/** Map of 'yyyy-MM-dd' -> boxes out that day. skipId leaves one event out (used when editing it). */
function bookedMap_(skipId) {
  var from = dateOf_(addDays_(day_(new Date()), -1)), to = dateOf_(addDays_(day_(new Date()), HORIZON_DAYS + 8)), map = {};
  function add(ev, source) {
    if (skipId && ev.getId() === skipId) return;
    var r = recOf_(ev, source);
    for (var d = r.start; d <= r.end; d = addDays_(d, 1)) map[d] = (map[d] || 0) + r.boxes;
  }
  rentalCal_().getEvents(from, to).forEach(function (ev) { if (!PENDING_RE.test(ev.getTitle() || '')) add(ev, 'rental'); });
  legacyEvents_(from, to).forEach(function (ev) { add(ev, 'main'); });
  return map;
}
/** Fewest boxes free on any day between start and end. */
function freeFor_(start, end, skipId, map) {
  var booked = map || bookedMap_(skipId), free = TOTAL_BOXES;
  for (var d = start; d <= end; d = addDays_(d, 1)) free = Math.min(free, TOTAL_BOXES - (booked[d] || 0));
  return free;
}
/** Older manual bookings: events on any OTHER calendar you own whose title has the word "box" / "bikebox" (not "Boxing Day"). */
var BOX_WORD_RE = /(^|[^a-z])box(es)?([^a-z]|$)|bikebox/i;
function legacyEvents_(from, to) {
  var out = [];
  CalendarApp.getAllOwnedCalendars().forEach(function (c) {
    if (c.getName() === RENTAL_CAL_NAME) return;
    c.getEvents(from, to).forEach(function (ev) { var t = ev.getTitle() || ''; if (!PENDING_RE.test(t) && BOX_WORD_RE.test(t)) out.push(ev); });
  });
  return out;
}
function rentalCal_() {
  var c = CalendarApp.getCalendarsByName(RENTAL_CAL_NAME);
  if (c.length) return c[0];
  return CalendarApp.createCalendar(RENTAL_CAL_NAME, { timeZone: TZ, color: CalendarApp.Color.ORANGE });
}

// ---------- helpers ----------
function token_(ref) {
  var props = PropertiesService.getScriptProperties(), secret = props.getProperty('SECRET');
  if (!secret) { secret = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('SECRET', secret); }
  return Utilities.computeHmacSha256Signature(ref, secret).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('').slice(0, 32);
}
function adminUrl_(action, ref) { return ScriptApp.getService().getUrl() + '?action=' + action + '&ref=' + encodeURIComponent(ref) + '&t=' + token_(ref); }
function field_(desc, key) { var m = String(desc).match(new RegExp('^' + key + ':[ \\t]*(.*)$', 'm')); return m ? m[1].trim() : ''; }
function day_(d) { return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); }
function addDays_(s, n) { var p = s.split('-'); var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]) + n * 864e5); return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); }
function daysBetween_(a, b) { var p = a.split('-'), q = b.split('-'); return Math.round((Date.UTC(+q[0], +q[1] - 1, +q[2]) - Date.UTC(+p[0], +p[1] - 1, +p[2])) / 864e5); }
function nice_(s) { var p = s.split('-'); return +p[2] + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+p[1] - 1]; }
function clean_(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max); }
function esc_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function whatsapp_(p) { var d = String(p).replace(/\D/g, ''); if (d.length === 8) return '65' + d; return d.length >= 9 ? d : ''; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Run from the editor to check calendar access and see what the website will see. */
function testAvailability() { Logger.log(JSON.stringify(bookedMap_())); }
