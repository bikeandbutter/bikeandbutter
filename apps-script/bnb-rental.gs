/**
 * Bike & Butter — bike box rental.  Standalone Apps Script web app (script.google.com > New project),
 * deployed from the bikeandbutter@gmail.com account.
 *
 * HOW AVAILABILITY WORKS (Google Calendar is the single source of truth)
 *  - Every confirmed or ongoing rental is an event on the bikeandbutter@gmail.com calendar whose TITLE STARTS WITH "BOX".
 *      "BOX Tan Wei"            = 1 box
 *      "BOX x2 Tan Wei"         = 2 boxes   (write x2, x3 ... for more than one box)
 *  - The event's dates are the days the box(es) are out, first day and last day included.
 *    Extend a rental by dragging the end date on the calendar. The website updates within about a minute.
 *  - Website requests arrive as "PENDING · BOX x2 · Name". They do NOT block the calendar.
 *    To confirm a booking, delete the "PENDING · " part of the title. That is all.
 *  - Anything else on the calendar (not starting with "BOX") is ignored by the website.
 */
var CAL_ID = 'bikeandbutter@gmail.com';
var OWNER_EMAIL = 'bikeandbutter@gmail.com';
var TOTAL_BOXES = 6;          // change this if you buy more boxes
var HORIZON_DAYS = 180;
var TZ = 'Asia/Singapore';
var RATE = 10, MIN_CHARGE = 50, PACK_FEE = 50;

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  if (action !== 'availability') return json_({ ok: true, service: 'bnb-rental' });
  var cache = CacheService.getScriptCache();
  var hit = cache.get('avail');
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  var out = JSON.stringify({ ok: true, total: TOTAL_BOXES, booked: bookedMap_(), generated: new Date().toISOString() });
  cache.put('avail', out, 60);
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
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
    var rotors = !!b.rotors && packs > 0;

    // basic spam brake: 3 requests per phone per hour
    var cache = CacheService.getScriptCache(), key = 'rl_' + phone.replace(/\D/g, '');
    var n = parseInt(cache.get(key) || '0', 10);
    if (n >= 3) return json_({ ok: false, error: 'too many requests' });
    cache.put(key, String(n + 1), 3600);

    // price recalculated here, the browser's number is not trusted
    var days = daysBetween_(start, end) + 1;
    var perBox = Math.max(MIN_CHARGE, days * RATE);
    var total = perBox * boxes + packs * PACK_FEE;

    var booked = bookedMap_(), free = TOTAL_BOXES, d = start;
    while (d <= end) { free = Math.min(free, TOTAL_BOXES - (booked[d] || 0)); d = addDays_(d, 1); }

    var ref = 'BX' + Utilities.formatDate(new Date(), TZ, 'yyMMdd') + Math.floor(100 + Math.random() * 900);
    var label = start === end ? nice_(start) : nice_(start) + ' to ' + nice_(end);
    var title = 'PENDING · BOX ' + (boxes > 1 ? 'x' + boxes + ' ' : '') + '· ' + name;
    var desc = [
      'Ref: ' + ref,
      'Dates: ' + label + ' (' + days + ' day' + (days > 1 ? 's' : '') + ')',
      'Boxes: ' + boxes,
      'Packing: ' + (packs ? packs + ' bike(s)' + (rotors ? ', remove rotors' : '') : 'none'),
      'Total: $' + total,
      'Name: ' + name, 'WhatsApp: ' + phone, email ? 'Email: ' + email : '', 'Bike: ' + bike,
      notes ? 'Notes: ' + notes : '',
      '',
      'TO CONFIRM: delete "PENDING · " from the title. The boxes are then blocked on the website.'
    ].join('\n');

    var cal = CalendarApp.getCalendarById(CAL_ID) || CalendarApp.getDefaultCalendar();
    var startDate = Utilities.parseDate(start, TZ, 'yyyy-MM-dd');
    var endExclusive = Utilities.parseDate(addDays_(end, 1), TZ, 'yyyy-MM-dd');
    var ev = cal.createAllDayEvent(title, startDate, endExclusive, { description: desc });
    try { ev.setColor(CalendarApp.EventColor.YELLOW); } catch (x) {}
    CacheService.getScriptCache().remove('avail');

    var wa = whatsapp_(phone);
    var confirmMsg = 'Hi ' + name.split(' ')[0] + ', thanks for booking a bike box with Bike & Butter. ' +
      (free >= boxes ? 'Good news, ' + boxes + (boxes > 1 ? ' boxes are' : ' box is') + ' available for ' + label + '. ' : 'Unfortunately we do not have enough boxes for ' + label + '. ') +
      (free >= boxes ? 'The total is $' + total + ' (' + days + ' day' + (days > 1 ? 's' : '') + (packs ? ', incl. packing' : '') + '). Please PayNow to confirm and send us a screenshot. Collection is at 491 Jurong West Ave 1.' : 'Would other dates work for you?');
    var body = [
      'New bike box request ' + ref,
      '',
      free >= boxes ? 'AVAILABILITY: OK (' + free + ' free for the whole period)' : 'AVAILABILITY: NOT ENOUGH BOXES (only ' + free + ' free on the tightest day)',
      '',
      desc,
      '',
      'Reply to the customer on WhatsApp (message prefilled):',
      wa ? 'https://wa.me/' + wa + '?text=' + encodeURIComponent(confirmMsg) : '(could not read the phone number)'
    ].join('\n');
    MailApp.sendEmail({ to: OWNER_EMAIL, subject: (free >= boxes ? '' : '[FULL] ') + 'Bike box request ' + ref + ' · ' + label + ' · ' + name, body: body, replyTo: email || OWNER_EMAIL });

    return json_({ ok: true, ref: ref });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Map of 'yyyy-MM-dd' -> number of boxes out that day, from calendar events whose title starts with BOX. */
function bookedMap_() {
  var cal = CalendarApp.getCalendarById(CAL_ID) || CalendarApp.getDefaultCalendar();
  var from = addDays_(day_(new Date()), -1), to = addDays_(day_(new Date()), HORIZON_DAYS + 8);
  var events = cal.getEvents(Utilities.parseDate(from, TZ, 'yyyy-MM-dd'), Utilities.parseDate(to, TZ, 'yyyy-MM-dd'));
  var map = {};
  events.forEach(function (ev) {
    var title = ev.getTitle() || '';
    if (!/^\s*box/i.test(title)) return;
    var m = title.match(/[x×]\s*(\d+)/i), qty = m ? Math.max(1, parseInt(m[1], 10)) : 1;
    var first, lastIncl;
    if (ev.isAllDayEvent()) {
      first = day_(ev.getAllDayStartDate());
      lastIncl = addDays_(day_(ev.getAllDayEndDate()), -1);
    } else {
      first = day_(ev.getStartTime());
      var endT = ev.getEndTime();
      lastIncl = Utilities.formatDate(endT, TZ, 'HH:mm') === '00:00' ? addDays_(day_(endT), -1) : day_(endT);
    }
    if (lastIncl < first) lastIncl = first;
    var d = first;
    while (d <= lastIncl) { map[d] = (map[d] || 0) + qty; d = addDays_(d, 1); }
  });
  return map;
}

function day_(d) { return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); }
function addDays_(s, n) { var p = s.split('-'); var t = Date.UTC(+p[0], +p[1] - 1, +p[2]) + n * 864e5; var d = new Date(t); return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); }
function daysBetween_(a, b) { var p = a.split('-'), q = b.split('-'); return Math.round((Date.UTC(+q[0], +q[1] - 1, +q[2]) - Date.UTC(+p[0], +p[1] - 1, +p[2])) / 864e5); }
function nice_(s) { var p = s.split('-'); return +p[2] + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+p[1] - 1]; }
function clean_(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max); }
function whatsapp_(p) { var d = String(p).replace(/\D/g, ''); if (d.length === 8) return '65' + d; return d.length >= 9 ? d : ''; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Run this once from the editor (Run > testAvailability) to check calendar access. */
function testAvailability() { Logger.log(JSON.stringify(bookedMap_())); }
