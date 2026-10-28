/**
 * Bike & Butter — bike box rental.  Standalone Apps Script web app, deployed from bikeandbutter@gmail.com.
 *
 * HOW IT WORKS
 *  - Rentals live on a dedicated Google Calendar called "Bike Box Rentals" (created automatically on first run).
 *    EVERY event on that calendar counts as a rental, whatever its title or colour.
 *      "Wendy Tan"        = 1 box          "Wendy Tan x2"  = 2 boxes
 *    The event's days (first and last day included) are the days the box is out. Drag the end date to extend.
 *  - Website requests arrive on the same calendar as "PENDING · BOX · Name". Pending events do NOT block the website.
 *  - You get an email per request with a "Review and confirm" link. Confirming removes "PENDING · ", which blocks
 *    the boxes on the website, and emails the customer a confirmation. You can also confirm by editing the title.
 *  - Old events on the main bikeandbutter@gmail.com calendar still count if their title contains the word "box".
 *  - A daily 9am job emails the customer a reminder 3 days before collection (if we have their email)
 *    and sends you a list of collections that day.
 */
var CAL_ID = 'bikeandbutter@gmail.com';
var RENTAL_CAL_NAME = 'Bike Box Rentals';
var OWNER_EMAIL = 'bikeandbutter@gmail.com';
var TOTAL_BOXES = 6;
var HORIZON_DAYS = 180;
var TZ = 'Asia/Singapore';
var RATE = 10, MIN_CHARGE = 50, PACK_FEE = 50;
var UEN = '53521776E';
var QR_URL = 'https://bikeandbutter.com/assets/img/paynow-qr.png';
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
    if (!b || b.action !== 'book') return json_({ ok: false, error: 'unknown action' });
    if (b.website) return json_({ ok: true, ref: 'BX000000' }); // honeypot

    var start = String(b.start || ''), end = String(b.end || '');
    var today = day_(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return json_({ ok: false, error: 'bad dates' });
    if (start < today || end < start || end > addDays_(today, HORIZON_DAYS + 7)) return json_({ ok: false, error: 'dates out of range' });
    var boxes = Math.max(1, Math.min(TOTAL_BOXES, parseInt(b.boxes, 10) || 1));
    var packs = Math.max(0, Math.min(boxes, parseInt(b.packs, 10) || 0));
    var name = clean_(b.name, 80), phone = String(b.phone || '').replace(/[^\d+]/g, '').slice(0, 20);
    if (name.length < 2 || phone.replace(/\D/g, '').length < 8) return json_({ ok: false, error: 'missing details' });
    var email = clean_(b.email, 120), bike = clean_(b.bike, 40), notes = clean_(b.notes, 400);
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) email = '';
    var rotors = !!b.rotors && packs > 0;

    var cache = CacheService.getScriptCache(), key = 'rl_' + phone.replace(/\D/g, '');
    var n = parseInt(cache.get(key) || '0', 10);
    if (n >= 3) return json_({ ok: false, error: 'too many requests' });
    cache.put(key, String(n + 1), 3600);

    // price recalculated here, the browser's number is not trusted
    var days = daysBetween_(start, end) + 1;
    var total = Math.max(MIN_CHARGE, days * RATE) * boxes + packs * PACK_FEE;

    var booked = bookedMap_(), free = TOTAL_BOXES, d = start;
    while (d <= end) { free = Math.min(free, TOTAL_BOXES - (booked[d] || 0)); d = addDays_(d, 1); }

    var ref = 'BX' + Utilities.formatDate(new Date(), TZ, 'yyMMdd') + Math.floor(100 + Math.random() * 900);
    var label = start === end ? nice_(start) : nice_(start) + ' to ' + nice_(end);
    var daysTxt = days + ' day' + (days > 1 ? 's' : '');
    var title = 'PENDING · BOX ' + (boxes > 1 ? 'x' + boxes + ' ' : '') + '· ' + name;
    var desc = [
      'Ref: ' + ref,
      'Dates: ' + label + ' (' + daysTxt + ')',
      'Boxes: ' + boxes,
      'Packing: ' + (packs ? packs + ' bike(s)' + (rotors ? ', remove rotors' : '') : 'none'),
      'Total: $' + total,
      'Name: ' + name,
      'WhatsApp: ' + phone,
      'Email: ' + email,
      'Bike: ' + bike,
      'Notes: ' + notes,
      '',
      'TO CONFIRM: use the link in the request email, or delete "PENDING · " from the title.'
    ].join('\n');

    var cal = rentalCal_();
    var ev = cal.createAllDayEvent(title, Utilities.parseDate(start, TZ, 'yyyy-MM-dd'), Utilities.parseDate(addDays_(end, 1), TZ, 'yyyy-MM-dd'), { description: desc });
    try { ev.setColor(CalendarApp.EventColor.YELLOW); } catch (x) {}
    PropertiesService.getScriptProperties().setProperty('ev_' + ref, ev.getId());
    cache.remove('avail');

    var ok = free >= boxes;
    var wa = whatsapp_(phone);
    var first = name.split(' ')[0];
    var payLine = 'Please PayNow $' + total + ' to UEN ' + UEN + ' (Bike & Butter), or scan the QR here: ' + QR_URL + ' . Once paid, send us a screenshot and we will lock in your booking.';
    var msg = ok
      ? 'Hi ' + first + ', thanks for booking a bike box with Bike & Butter. Good news, ' + boxes + (boxes > 1 ? ' boxes are' : ' box is') + ' available for ' + label + ' (' + daysTxt + (packs ? ', incl. packing' : '') + '). ' + payLine + ' Collection is at 491 Jurong West Ave 1.'
      : 'Hi ' + first + ', thanks for your bike box request. Unfortunately we do not have enough boxes for ' + label + '. Would other dates work for you?';
    var reviewUrl = adminUrl_('review', ref);
    var text = [
      'New bike box request ' + ref,
      ok ? 'AVAILABILITY: OK (' + free + ' free for the whole period)' : 'AVAILABILITY: NOT ENOUGH BOXES (only ' + free + ' free on the tightest day)',
      '', desc, '',
      '1) Message the customer on WhatsApp (prefilled, includes PayNow):',
      wa ? 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg) : '(could not read the phone number)',
      '',
      '2) Once they have paid, review and confirm (blocks the boxes on the website, emails the customer):',
      reviewUrl
    ].join('\n');
    var html = '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111;max-width:560px">' +
      '<h2 style="margin:0 0 6px">New bike box request ' + ref + '</h2>' +
      '<p style="margin:0 0 12px;font-weight:bold;color:' + (ok ? '#1a7f37' : '#b42318') + '">' + (ok ? 'Availability OK (' + free + ' free for the whole period)' : 'NOT ENOUGH BOXES (only ' + free + ' free on the tightest day)') + '</p>' +
      '<pre style="font-family:inherit;background:#f6f6f4;padding:12px;border-radius:6px;white-space:pre-wrap">' + esc_(desc.replace(/\n\nTO CONFIRM[\s\S]*$/, '')) + '</pre>' +
      '<p><b>1) WhatsApp the customer</b> (message is prefilled with availability, total and PayNow):<br><a href="' + (wa ? 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg) : '#') + '">Open WhatsApp</a></p>' +
      '<p><b>2) After they pay</b>, <a href="' + reviewUrl + '">review and confirm this booking</a>. This blocks the boxes on the website and emails the customer a confirmation.</p>' +
      '<hr style="border:0;border-top:1px solid #ddd;margin:16px 0"><p style="margin:0 0 6px"><b>PayNow</b> UEN ' + UEN + ' · Bike & Butter · Amount $' + total + '</p>' +
      '<img src="' + QR_URL + '" alt="PayNow QR" width="220" height="220" style="display:block"></div>';
    MailApp.sendEmail({ to: OWNER_EMAIL, subject: (ok ? '' : '[FULL] ') + 'Bike box request ' + ref + ' · ' + label + ' · ' + name, body: text, htmlBody: html, replyTo: email || OWNER_EMAIL });

    return json_({ ok: true, ref: ref });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// ---------- confirm / decline (links in the owner email) ----------
function adminPage_(p) {
  var ref = String(p.ref || ''), ok = ref && p.t && p.t === token_(ref);
  if (!ok) return page_('Link not valid', '<p>This link is not valid. Please use the link in the latest request email.</p>');
  var ev = findPending_(ref);
  if (!ev) return page_('Already handled', '<p>Booking <b>' + esc_(ref) + '</b> was not found as a pending request. It may already be confirmed or removed. Check the Bike Box Rentals calendar.</p>');
  var d = ev.getDescription() || '';
  if (p.action === 'review') {
    return page_('Booking ' + esc_(ref), '<pre>' + esc_(d.replace(/\n\nTO CONFIRM[\s\S]*$/, '')) + '</pre>' +
      '<p>Only confirm once the customer has paid. Confirming blocks the boxes on the website' + (field_(d, 'Email') ? ' and emails the customer.' : '.') + '</p>' +
      '<p><a class="b" href="' + adminUrl_('confirm', ref) + '">Confirm booking</a> <a class="b o" href="' + adminUrl_('decline', ref) + '">Decline and remove</a></p>');
  }
  if (p.action === 'confirm') {
    ev.setTitle((ev.getTitle() || '').replace(PENDING_RE, ''));
    try { ev.setColor(CalendarApp.EventColor.GREEN); } catch (x) {}
    ev.setDescription(d.replace(/\n\nTO CONFIRM[\s\S]*$/, '') + '\n\nCONFIRMED ' + Utilities.formatDate(new Date(), TZ, 'd MMM yyyy HH:mm'));
    CacheService.getScriptCache().remove('avail');
    var em = field_(d, 'Email');
    if (em) {
      MailApp.sendEmail({ to: em, replyTo: OWNER_EMAIL, subject: 'Your bike box booking is confirmed (' + ref + ')',
        body: 'Hi ' + (field_(d, 'Name') || '').split(' ')[0] + ',\n\nYour bike box booking is confirmed.\n\n' + d.replace(/\n\nTO CONFIRM[\s\S]*$/, '').replace(/\n\nCONFIRMED[\s\S]*$/, '').split('\n').filter(function (l) { return /^(Ref|Dates|Boxes|Packing|Total):/.test(l); }).join('\n') +
          '\n\nCollection and return: 491 Jurong West Avenue 1, Singapore 640491. We will message you on WhatsApp to arrange the collection time. Boxes are 130 x 49 x 100 cm and weigh 16-17 kg empty, so please make sure your transport can fit one.\n\nIf you need to change your dates, just reply to this email or WhatsApp us on +65 8722 2610.\n\nBike & Butter' });
    }
    return page_('Confirmed', '<p>Booking <b>' + esc_(ref) + '</b> is confirmed and the boxes are now blocked on the website.' + (em ? ' A confirmation email was sent to the customer.' : ' (No customer email on file, so no email was sent.)') + '</p>');
  }
  if (p.action === 'decline') {
    ev.deleteEvent(); CacheService.getScriptCache().remove('avail');
    return page_('Removed', '<p>Booking <b>' + esc_(ref) + '</b> was removed from the calendar. Let the customer know on WhatsApp.</p>');
  }
}
function findPending_(ref) {
  var cal = rentalCal_(), id = PropertiesService.getScriptProperties().getProperty('ev_' + ref), ev = null;
  if (id) { try { ev = cal.getEventById(id); } catch (x) {} }
  if (!ev) {
    var from = new Date(Date.now() - 30 * 864e5), to = new Date(Date.now() + (HORIZON_DAYS + 30) * 864e5);
    cal.getEvents(from, to).forEach(function (e) { if (!ev && (e.getDescription() || '').indexOf('Ref: ' + ref) === 0) ev = e; });
  }
  return ev && PENDING_RE.test(ev.getTitle() || '') ? ev : null;
}
function page_(title, body) {
  return HtmlService.createHtmlOutput('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + '</title>' +
    '<style>body{font-family:Arial,sans-serif;max-width:520px;margin:32px auto;padding:0 16px;color:#111;line-height:1.5}pre{background:#f6f6f4;padding:12px;border-radius:6px;white-space:pre-wrap}.b{display:inline-block;background:#111;color:#fff;padding:12px 18px;border-radius:4px;text-decoration:none;margin:4px 6px 4px 0}.o{background:#fff;color:#111;border:1px solid #111}</style>' +
    '<h2>' + title + '</h2>' + body).setTitle(title);
}

// ---------- reminders (daily trigger) ----------
/** Run once from the editor to switch on the daily 9am reminders. */
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'sendReminders') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sendReminders').timeBased().everyDays(1).atHour(9).inTimezone(TZ).create();
  rentalCal_(); // makes sure the Bike Box Rentals calendar exists
  Logger.log('Daily reminders switched on (9am Singapore time).');
}

function sendReminders() {
  var target = addDays_(day_(new Date()), 3), props = PropertiesService.getScriptProperties(), list = [];
  rentalCal_().getEvents(Utilities.parseDate(addDays_(target, -1), TZ, 'yyyy-MM-dd'), Utilities.parseDate(addDays_(target, 3), TZ, 'yyyy-MM-dd')).forEach(function (ev) {
    var t = ev.getTitle() || '';
    if (PENDING_RE.test(t)) return;
    var first = ev.isAllDayEvent() ? day_(ev.getAllDayStartDate()) : day_(ev.getStartTime());
    if (first !== target) return;
    var d = ev.getDescription() || '', em = field_(d, 'Email'), nm = field_(d, 'Name') || t;
    list.push('• ' + t + (field_(d, 'WhatsApp') ? ' (' + field_(d, 'WhatsApp') + ')' : '') + (em ? '' : ' [no email, WhatsApp them]'));
    var flag = 'rem_' + ev.getId();
    if (em && !props.getProperty(flag)) {
      MailApp.sendEmail({ to: em, replyTo: OWNER_EMAIL, subject: 'Reminder: your bike box collection on ' + nice_(first),
        body: 'Hi ' + nm.split(' ')[0] + ',\n\nA quick reminder that your bike box rental starts on ' + nice_(first) + '.\n\n' +
          'Collection: 491 Jurong West Avenue 1, Singapore 640491. We will WhatsApp you to confirm the collection time.\n' +
          'The box measures 130 x 49 x 100 cm and weighs 16-17 kg empty (at least 25 kg with a road bike, 30 kg with a tri bike), so please make sure your transport can fit it.\n' +
          'Each box comes with 2 TSA-approved locks. If you booked packing, bring your bike to the workshop and we will pack it.\n\n' +
          'Need to change anything? Reply to this email or WhatsApp us on +65 8722 2610.\n\nBike & Butter' });
      props.setProperty(flag, '1');
    }
  });
  if (list.length && !props.getProperty('dig_' + target)) { props.setProperty('dig_' + target, '1'); MailApp.sendEmail({ to: OWNER_EMAIL, subject: 'Bike box collections on ' + nice_(target) + ' (' + list.length + ')', body: 'Rentals starting in 3 days (' + nice_(target) + '):\n\n' + list.join('\n') + '\n\nCustomers with an email on file were sent a reminder.' }); }
}

// ---------- availability ----------
/** Map of 'yyyy-MM-dd' -> boxes out that day. */
function bookedMap_() {
  var from = Utilities.parseDate(addDays_(day_(new Date()), -1), TZ, 'yyyy-MM-dd');
  var to = Utilities.parseDate(addDays_(day_(new Date()), HORIZON_DAYS + 8), TZ, 'yyyy-MM-dd');
  var map = {};
  function add(ev) {
    var title = ev.getTitle() || '';
    var m = title.match(/(?:^|\s)[x×]\s*(\d+)\b/i) || title.match(/\b(\d+)\s*(?:bike\s*)?boxes\b/i);
    var qty = m ? Math.max(1, parseInt(m[1], 10)) : 1, first, lastIncl;
    if (ev.isAllDayEvent()) { first = day_(ev.getAllDayStartDate()); lastIncl = addDays_(day_(ev.getAllDayEndDate()), -1); }
    else { first = day_(ev.getStartTime()); var endT = ev.getEndTime(); lastIncl = Utilities.formatDate(endT, TZ, 'HH:mm') === '00:00' ? addDays_(day_(endT), -1) : day_(endT); }
    if (lastIncl < first) lastIncl = first;
    for (var d = first; d <= lastIncl; d = addDays_(d, 1)) map[d] = (map[d] || 0) + qty;
  }
  rentalCal_().getEvents(from, to).forEach(function (ev) { if (!PENDING_RE.test(ev.getTitle() || '')) add(ev); });
  var main = CalendarApp.getCalendarById(CAL_ID);
  if (main) main.getEvents(from, to).forEach(function (ev) { var t = ev.getTitle() || ''; if (!PENDING_RE.test(t) && /box/i.test(t)) add(ev); });
  return map;
}
function rentalCal_() {
  var c = CalendarApp.getCalendarsByName(RENTAL_CAL_NAME);
  if (c.length) return c[0];
  var n = CalendarApp.createCalendar(RENTAL_CAL_NAME, { timeZone: TZ, color: CalendarApp.Color.ORANGE });
  return n;
}

// ---------- helpers ----------
function token_(ref) {
  var props = PropertiesService.getScriptProperties(), secret = props.getProperty('SECRET');
  if (!secret) { secret = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('SECRET', secret); }
  return Utilities.computeHmacSha256Signature(ref, secret).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('').slice(0, 32);
}
function adminUrl_(action, ref) { return ScriptApp.getService().getUrl() + '?action=' + action + '&ref=' + encodeURIComponent(ref) + '&t=' + token_(ref); }
function field_(desc, key) { var m = String(desc).match(new RegExp('^' + key + ':\\s*(.*)$', 'm')); return m ? m[1].trim() : ''; }
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
