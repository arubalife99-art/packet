(function () {
  const STORAGE_KEY = 'packet-trips-v1';
  const root = document.getElementById('app');
  const SAMPLE = {
    id: 'sample-mia',
    name: 'Miami weekend',
    destination: 'Miami, FL',
    startDate: '2026-03-20',
    endDate: '2026-03-22',
    notes: '',
    createdAt: Date.now(),
    bookings: [
      { id: 'b1', type: 'flight', title: 'AA 1420 \u00b7 MCO \u2192 MIA', when: 'Fri, Mar 20 \u00b7 8:15 AM', confirmation: 'K8F2QM', code: '', notes: 'Terminal B \u00b7 Seat 14A', createdAt: 1 },
      { id: 'b2', type: 'car', title: 'Enterprise \u00b7 Compact', when: 'Fri, Mar 20 \u00b7 9:30 AM', confirmation: '14827365', code: '', notes: 'Miami Airport', createdAt: 2 },
      { id: 'b3', type: 'hotel', title: '1 Hotel South Beach', when: 'Fri, Mar 20 \u00b7 4:00 PM check-in', confirmation: 'HB-992014', code: '4821#', notes: '2341 Collins Ave',
 createdAt: 3 },
      { id: 'b4', type: 'ticket', title: 'Perez Art Museum', when: 'Sat, Mar 21 \u00b7 11:00 AM', confirmation: 'PAM-55102', code: '', notes: 'Main entrance', createdAt: 4 },
      { id: 'b5', type: 'flight', title: 'AA 1889 \u00b7 MIA \u2192 MCO', when: 'Sun, Mar 22 \u00b7 6:40 PM', confirmation: 'K8F2QM', code: '', notes: 'Terminal D', createdAt: 5 }
    ]
  };
  const state = { trips: loadTrips(), view: 'home', activeTripId: null, sheet: null, toast: '', toastTimer: null, tripName: '', tripForm: emptyTrip(), bookingForm: emptyBooking(), pasteText: '', pasteMode: 'paste', selectedBooking: null, shareTrip: null };
  function emptyBooking() { return { type: 'flight', title: '', when: '', confirmation: '', code: '', notes: '' }; }
  function emptyTrip() { return { name: '', destination: '', startDate: '', endDate: '', notes: '' }; }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function loadTrips() { try { const raw = localStorage.getItem(STORAGE_KEY); const data = raw ? JSON.parse(raw) : []; return Array.isArray(data) ? data : []; } catch (e) { return []; } }
  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.trips)); }
  function toast(msg) { state.toast = msg; render(); clearTimeout(state.toastTimer); state.toastTimer = setTimeout(function () { state.toast = ''; render(); }, 2200); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"'); }
  function sortBookings(bookings) { return (bookings || []).slice().sort(function (a, b) { return (a.when || '').localeCompare(b.when || '') || (a.createdAt || 0) - (b.createdAt || 0); }); }
  function typeCounts(bookings) { var c = {}; (bookings || []).forEach(function (b) { c[b.type] = (c[b.type] || 0) + 1; }); return c; }
  function activeTrip() { for (var i = 0; i < state.trips.length; i++) { if (state.trips[i].id === state.activeTripId) return state.trips[i]; } return null; }
  function icon(name) {
    var map = {
      flight: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
      hotel: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>',
      car: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 17h14v-5l-2-5H7L5 12v5zM7 17v2M17 17v2M5 12h14"/></svg>',
      ticket: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z"/></svg>',
      other: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>',
      plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>',
      back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>',
      share: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/></svg>',
      wallet: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>',
      copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/></svg>'
    };
    return map[name] || map.other;
  }
  function copyText(text) { if (!text) return; if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast('Copied'); }); }
  function openTrip(id) { state.activeTripId = id; state.view = 'trip'; state.sheet = null; render(); }
  function addSample() {
    if (!state.trips.some(function (t) { return t.id === 'sample-mia'; })) {
      state.trips = [JSON.parse(JSON.stringify(Object.assign({}, SAMPLE, { createdAt: Date.now() })))].concat(state.trips);
      persist();
    }
    openTrip('sample-mia'); toast('Sample trip loaded');
  }
  function createTrip() {
    var name = (state.tripName || '').trim() || 'Untitled trip';
    var trip = { id: uid(), name: name, destination: (state.tripForm.destination || '').trim(), startDate: state.tripForm.startDate || '', endDate: state.tripForm.endDate || '', notes: '', createdAt: Date.now(), bookings: [] };
    state.trips = [trip].concat(state.trips); persist(); state.sheet = null; state.tripName = ''; openTrip(trip.id); toast('Trip created');
  }
  function saveTripDetails() {
    var trip = activeTrip(); if (!trip) return;
    trip.name = (state.tripForm.name || '').trim() || 'Untitled trip';
    trip.destination = (state.tripForm.destination || '').trim();
    trip.startDate = state.tripForm.startDate || '';
    trip.endDate = state.tripForm.endDate || '';
    trip.notes = state.tripForm.notes || '';
    persist(); state.sheet = null; render(); toast('Trip updated');
  }
  function deleteTrip(id) { state.trips = state.trips.filter(function (t) { return t.id !== id; }); persist(); state.view = 'home'; state.activeTripId = null; state.sheet = null; render(); toast('Trip deleted'); }
  function normConf(s) { return String(s || '').replace(/\s+/g, '').toUpperCase(); }
  function findMatchingBooking(trip, parsed) {
    if (!trip || !parsed) return null;
    var conf = normConf(parsed.confirmation);
    if (conf) { for (var i = 0; i < trip.bookings.length; i++) { if (normConf(trip.bookings[i].confirmation) === conf) return trip.bookings[i]; } }
    return null;
  }
  function saveBooking() {
    var f = state.bookingForm; if (!(f.title || '').trim()) { toast('Add a title'); return; }
    var trip = activeTrip(); if (!trip) return;
    var booking = { id: f.id || uid(), type: f.type || 'other', title: f.title.trim(), when: f.when || '', confirmation: f.confirmation || '', code: f.code || '', notes: f.notes || '', createdAt: f.createdAt || Date.now() };
    var found = false;
    trip.bookings = trip.bookings.map(function (b) { if (b.id === booking.id) { found = true; return booking; } return b; });
    if (!found) trip.bookings.push(booking);
    persist(); state.sheet = null; state.bookingForm = emptyBooking(); render(); toast('Saved');
  }
  function removeBooking(id) { var trip = activeTrip(); if (!trip) return; trip.bookings = trip.bookings.filter(function (b) { return b.id !== id; }); persist(); state.sheet = null; state.selectedBooking = null; render(); toast('Removed'); }
  function runParse() {
    var parsed = window.parseConfirmationEmail(state.pasteText);
    if (!parsed) { toast('Nothing to parse'); return; }
    var match = findMatchingBooking(activeTrip(), parsed);
    state.bookingForm = Object.assign(emptyBooking(), parsed);
    if (match) { state.bookingForm.id = match.id; state.bookingForm.createdAt = match.createdAt; }
    state.pasteMode = 'manual'; render(); toast(match ? 'Matched — review update' : 'Parsed — review & save');
  }
  function runAutoUpdate() {
    var parsed = window.parseConfirmationEmail(state.pasteText);
    if (!parsed) { toast('Nothing to parse'); return; }
    var trip = activeTrip(); if (!trip) return;
    var match = findMatchingBooking(trip, parsed);
    if (!match) { state.bookingForm = Object.assign(emptyBooking(), parsed); state.pasteMode = 'manual'; render(); toast('No match — save as new'); return; }
    ['title','when','confirmation','code','type'].forEach(function (k) { if (parsed[k]) match[k] = parsed[k]; });
    if (parsed.notes) match.notes = (match.notes ? match.notes + '\n' : '') + parsed.notes;
    match.updatedAt = Date.now(); persist(); state.sheet = null; render(); toast('Updated');
  }
  function bookingCard(b, clickable) {
    return '<div class="tl-item"><div class="tl-dot ' + esc(b.type) + '">' + icon(b.type) + '</div><' + (clickable ? 'button' : 'div') + ' class="booking-card"' + (clickable ? ' data-action="open-booking" data-id="' + esc(b.id) + '"' : '') + '><div class="type-row"><span class="chip ' + esc(b.type) + '">' + esc(b.type) + '</span></div><div class="title">' + esc(b.title) + '</div>' + (b.when ? '<div class="when">' + esc(b.when) + (b.updatedAt ? ' \u00b7 updated' : '') + '</div>' : '') + (b.confirmation ? '<div class="conf">Conf: <strong class="mono">' + esc(b.confirmation) + '</strong></div>' : '') + (b.code ? '<div class="code-pill">' + esc(b.code) + '</div>' : '') + '</' + (clickable ? 'button' : 'div') + '></div>';
  }
  function renderHome() {
    var list;
    if (!state.trips.length) {
      list = '<div class="empty"><div class="glyph">' + icon('wallet') + '</div><h2>No trips yet</h2><p>Airline, hotel, and Airbnb emails become one offline timeline.</p><button class="btn btn-primary" style="max-width:240px;margin:0 auto" data-action="sample">Load sample trip</button></div>';
    } else {
      list = '<div class="trip-list">' + state.trips.map(function (t) {
        var chips = Object.keys(typeCounts(t.bookings)).map(function (type) { return '<span class="chip ' + esc(type) + '">' + typeCounts(t.bookings)[type] + ' ' + esc(type) + '</span>'; }).join('');
        return '<button class="trip-card" data-action="open-trip" data-id="' + esc(t.id) + '"><div class="name">' + esc(t.name) + '</div><div class="meta">' + (t.destination ? '<span>' + esc(t.destination) + '</span>' : '') + '<span>' + t.bookings.length + ' bookings</span></div><div class="chips">' + chips + '</div></button>';
      }).join('') + '</div>';
    }
    return '<header class="header"><div><h1>Packet</h1><div class="sub">Your trip wallet</div></div><button class="icon-btn primary" data-action="new-trip">' + icon('plus') + '</button></header><main class="content">' + list + '</main><div class="bottom-bar">' + (state.trips.length ? '<button class="btn btn-ghost" data-action="sample">Sample</button>' : '') + '<button class="btn btn-primary" data-action="new-trip">' + icon('plus') + ' New trip</button></div>';
  }
  function renderTrip() {
    var trip = activeTrip(); if (!trip) return renderHome();
    var bookings = sortBookings(trip.bookings);
    var body = bookings.length ? '<div class="timeline">' + bookings.map(function (b) { return bookingCard(b, true); }).join('') + '</div>' : '<div class="empty"><h2>No bookings yet</h2><p>Paste a confirmation or add one.</p></div>';
    return '<header class="header"><div class="back-row"><button class="icon-btn" data-action="home">' + icon('back') + '</button><div><h1>' + esc(trip.name) + '</h1><div class="sub">' + (trip.destination ? esc(trip.destination) + ' \u00b7 ' : '') + bookings.length + ' bookings</div></div></div></header><main class="content">' + body + '</main><div class="bottom-bar"><button class="btn btn-ghost" data-action="edit-trip">Edit trip</button><button class="btn btn-secondary" data-action="open-paste">Paste</button><button class="btn btn-primary" data-action="open-manual">' + icon('plus') + ' Add</button></div>';
  }
  function renderSheet() {
    if (!state.sheet) return '';
    var inner = '';
    if (state.sheet === 'editTrip') {
      var tf = state.tripForm;
      inner = '<div class="sheet-handle"></div><h2>Customize trip</h2><div class="form-group"><label>Trip name</label><input id="f-edit-name" value="' + esc(tf.name) + '" /></div><div class="form-group"><label>Destination</label><input id="f-edit-dest" value="' + esc(tf.destination) + '" /></div><div class="form-row"><div class="form-group"><label>Start</label><input id="f-edit-start" type="date" value="' + esc(tf.startDate) + '" /></div><div class="form-group"><label>End</label><input id="f-edit-end" type="date" value="' + esc(tf.endDate) + '" /></div></div><div class="form-group"><label>Notes</label><textarea id="f-edit-notes">' + esc(tf.notes) + '</textarea></div><button class="btn btn-primary" style="width:100%" data-action="save-trip">Save trip</button><button class="btn btn-danger" style="width:100%;margin-top:10px" data-action="delete-trip">Delete trip</button>';
    }
    if (state.sheet === 'addTrip') {
      inner = '<div class="sheet-handle"></div><h2>New trip</h2><div class="form-group"><label>Trip name</label><input id="f-trip-name" value="' + esc(state.tripName) + '" placeholder="Miami weekend" /></div><div class="form-group"><label>Destination</label><input id="f-new-dest" value="' + esc(state.tripForm.destination) + '" /></div><button class="btn btn-primary" style="width:100%" data-action="create-trip">Create</button>';
    }
    if (state.sheet === 'addBooking') {
      inner = '<div class="sheet-handle"></div><h2>Add booking</h2><div class="tabs"><button class="tab ' + (state.pasteMode === 'paste' ? 'active' : '') + '" data-action="mode-paste">Paste email</button><button class="tab ' + (state.pasteMode === 'manual' ? 'active' : '') + '" data-action="mode-manual">Manual</button></div>';
      if (state.pasteMode === 'paste') {
        inner += '<div class="form-group"><label>Confirmation email</label><textarea id="f-paste">' + esc(state.pasteText) + '</textarea></div><button class="btn btn-primary" style="width:100%" data-action="parse">Parse & review</button><button class="btn btn-secondary" style="width:100%;margin-top:10px" data-action="auto-update">Auto-update if it matches</button>';
      } else {
        var f = state.bookingForm;
        var segs = ['flight','hotel','car','ticket','other'].map(function (t) { return '<button class="seg ' + (f.type === t ? 'active' : '') + '" data-action="set-type" data-type="' + t + '">' + t + '</button>'; }).join('');
        inner += '<div class="form-group"><label>Type</label><div class="segmented">' + segs + '</div></div><div class="form-group"><label>Title</label><input id="f-title" value="' + esc(f.title) + '" /></div><div class="form-group"><label>When</label><input id="f-when" value="' + esc(f.when) + '" /></div><div class="form-row"><div class="form-group"><label>Confirmation</label><input class="mono" id="f-conf" value="' + esc(f.confirmation) + '" /></div><div class="form-group"><label>Door code</label><input class="mono" id="f-code" value="' + esc(f.code) + '" /></div></div><div class="form-group"><label>Notes</label><textarea id="f-notes">' + esc(f.notes) + '</textarea></div><button class="btn btn-primary" style="width:100%" data-action="save-booking">Save booking</button>';
      }
    }
    if (state.sheet === 'bookingDetail' && state.selectedBooking) {
      var b = state.selectedBooking;
      inner = '<div class="sheet-handle"></div><span class="chip ' + esc(b.type) + '">' + esc(b.type) + '</span><h2>' + esc(b.title) + '</h2>' + (b.when ? '<p class="muted">' + esc(b.when) + '</p>' : '') + '<div class="detail-block"><h3>Show at desk</h3>' + (b.confirmation ? '<div class="detail-row"><span>Confirmation</span><span class="mono">' + esc(b.confirmation) + '</span></div>' : '') + (b.code ? '<div class="detail-row"><span>Access code</span><span class="mono">' + esc(b.code) + '</span></div>' : '') + '</div>' + (b.notes ? '<div class="detail-block"><h3>Notes</h3><p>' + esc(b.notes) + '</p></div>' : '') + '<div class="actions-row"><button class="btn btn-secondary" data-action="edit-booking">Edit</button><button class="btn btn-danger" data-action="delete-booking">Delete</button></div>';
    }
    return '<div class="overlay" data-action="close-sheet"><div class="sheet" data-stop="1">' + inner + '</div></div>';
  }
  function render() {
    var html = (state.view === 'trip' && activeTrip()) ? renderTrip() : renderHome();
    html += renderSheet();
    if (state.toast) html += '<div class="toast">' + esc(state.toast) + '</div>';
    root.innerHTML = html;
  }
  function readFormFields() {
    var el;
    el = document.getElementById('f-trip-name'); if (el) state.tripName = el.value;
    el = document.getElementById('f-edit-name'); if (el) state.tripForm.name = el.value;
    el = document.getElementById('f-edit-dest'); if (el) state.tripForm.destination = el.value;
    el = document.getElementById('f-edit-start'); if (el) state.tripForm.startDate = el.value;
    el = document.getElementById('f-edit-end'); if (el) state.tripForm.endDate = el.value;
    el = document.getElementById('f-edit-notes'); if (el) state.tripForm.notes = el.value;
    el = document.getElementById('f-new-dest'); if (el) state.tripForm.destination = el.value;
    el = document.getElementById('f-paste'); if (el) state.pasteText = el.value;
    el = document.getElementById('f-title'); if (el) state.bookingForm.title = el.value;
    el = document.getElementById('f-when'); if (el) state.bookingForm.when = el.value;
    el = document.getElementById('f-conf'); if (el) state.bookingForm.confirmation = el.value;
    el = document.getElementById('f-code'); if (el) state.bookingForm.code = el.value;
    el = document.getElementById('f-notes'); if (el) state.bookingForm.notes = el.value;
  }
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action]');
    if (!t) return;
    var action = t.getAttribute('data-action');
    if (action === 'close-sheet') { if (e.target === t) { readFormFields(); state.sheet = null; render(); } return; }
    if (t.getAttribute('data-stop')) return;
    readFormFields();
    if (action === 'home') { state.view = 'home'; state.sheet = null; render(); }
    else if (action === 'sample') addSample();
    else if (action === 'new-trip') { state.tripName = ''; state.tripForm = emptyTrip(); state.sheet = 'addTrip'; render(); }
    else if (action === 'create-trip') createTrip();
    else if (action === 'open-trip') openTrip(t.getAttribute('data-id'));
    else if (action === 'edit-trip') { var tr = activeTrip(); state.tripForm = { name: tr ? tr.name : '', destination: (tr && tr.destination) || '', startDate: (tr && tr.startDate) || '', endDate: (tr && tr.endDate) || '', notes: (tr && tr.notes) || '' }; state.sheet = 'editTrip'; render(); }
    else if (action === 'save-trip') saveTripDetails();
    else if (action === 'delete-trip') { if (confirm('Delete this trip?')) deleteTrip(state.activeTripId); }
    else if (action === 'open-paste') { state.pasteText = ''; state.pasteMode = 'paste'; state.bookingForm = emptyBooking(); state.sheet = 'addBooking'; render(); }
    else if (action === 'open-manual') { state.bookingForm = emptyBooking(); state.pasteMode = 'manual'; state.sheet = 'addBooking'; render(); }
    else if (action === 'mode-paste') { state.pasteMode = 'paste'; render(); }
    else if (action === 'mode-manual') { state.pasteMode = 'manual'; render(); }
    else if (action === 'set-type') { state.bookingForm.type = t.getAttribute('data-type'); render(); }
    else if (action === 'parse') runParse();
    else if (action === 'auto-update') runAutoUpdate();
    else if (action === 'save-booking') saveBooking();
    else if (action === 'open-booking') { var trip = activeTrip(); var b = trip && trip.bookings.find(function (x) { return x.id === t.getAttribute('data-id'); }); if (b) { state.selectedBooking = b; state.sheet = 'bookingDetail'; render(); } }
    else if (action === 'edit-booking') { state.bookingForm = Object.assign(emptyBooking(), state.selectedBooking); state.pasteMode = 'manual'; state.sheet = 'addBooking'; render(); }
    else if (action === 'delete-booking') removeBooking(state.selectedBooking.id);
    else if (action === 'copy') copyText(t.getAttribute('data-text'));
  });
  render();
})();
