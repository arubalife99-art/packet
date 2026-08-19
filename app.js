(function () {
  const STORAGE_KEY = 'packet-trips-v2';
  const root = document.getElementById('app');
  const SAMPLE = {
    id: 'sample-mia', name: 'Miami weekend', destination: 'Miami, FL',
    startDate: '2026-03-20', endDate: '2026-03-22', notes: '',
    bookings: [
      { id: 'b1', type: 'flight', title: 'AA 1420', from: 'MCO', to: 'MIA', seat: '14A', gate: 'B12', when: 'Fri, Mar 20 \u00b7 8:15 AM', sortKey: '2026-03-20T08:15', confirmation: 'K8F2QM', amount: 218, cancelBy: '', creditExpires: '2026-09-01', address: '', notes: 'Terminal B' },
      { id: 'b2', type: 'car', title: 'Enterprise', when: 'Fri, Mar 20 \u00b7 9:30 AM', sortKey: '2026-03-20T09:30', confirmation: '14827365', amount: 96, cancelBy: '2026-08-21', address: 'Miami International Airport' },
      { id: 'b3', type: 'hotel', title: '1 Hotel South Beach', when: 'Fri, Mar 20 \u00b7 4:00 PM', sortKey: '2026-03-20T16:00', confirmation: 'HB-992014', code: '4821#', amount: 612, cancelBy: '2026-08-22', address: '2341 Collins Ave, Miami Beach, FL' },
      { id: 'b4', type: 'ticket', title: 'Perez Art Museum', when: 'Sat, Mar 21 \u00b7 11:00 AM', sortKey: '2026-03-21T11:00', confirmation: 'PAM-55102', address: '1103 Biscayne Blvd, Miami, FL' },
      { id: 'b5', type: 'flight', title: 'AA 1889', from: 'MIA', to: 'MCO', seat: '12C', gate: 'D8', when: 'Sun, Mar 22 \u00b7 6:40 PM', sortKey: '2026-03-22T18:40', confirmation: 'K8F2QM' }
    ]
  };
  const state = { trips: loadTrips(), view: 'home', activeTripId: null, sheet: null, toast: '', tripName: '', tripForm: emptyTrip(), bookingForm: emptyBooking(), pasteText: '', pasteMode: 'paste', selectedBooking: null };
  function emptyBooking() { return { type: 'flight', title: '', when: '', confirmation: '', code: '', notes: '', from: '', to: '', seat: '', gate: '', address: '', amount: '', cancelBy: '', creditExpires: '' }; }
  function emptyTrip() { return { name: '', destination: '', startDate: '', endDate: '', notes: '' }; }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function loadTrips() { try { var d = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(d) ? d : []; } catch (e) { return []; } }
  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.trips)); }
  function toast(msg) { state.toast = msg; render(); setTimeout(function () { state.toast = ''; render(); }, 2000); }
  function esc(s) { return String(s || '').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"'); }
  function activeTrip() { return state.trips.filter(function (t) { return t.id === state.activeTripId; })[0]; }
  function sortBookings(list) { return (list || []).slice().sort(function (a, b) { return (a.sortKey || a.when || '').localeCompare(b.sortKey || b.when || ''); }); }
  function typeCounts(list) { var c = {}; (list || []).forEach(function (b) { c[b.type] = (c[b.type] || 0) + 1; }); return c; }
  function daysUntil(iso) {
    if (!iso) return null;
    var t = Date.parse(iso + (iso.length === 10 ? 'T23:59:59' : ''));
    if (isNaN(t)) return null;
    return Math.ceil((t - Date.now()) / 86400000);
  }
  function moneyAlerts(trip) {
    var out = [];
    (trip.bookings || []).forEach(function (b) {
      var d1 = daysUntil(b.cancelBy);
      if (d1 !== null && d1 >= 0 && d1 <= 7) out.push({ days: d1, amount: Number(b.amount) || 0, text: (b.title || 'Booking') + ' free cancel in ' + d1 + 'd' });
      var d2 = daysUntil(b.creditExpires);
      if (d2 !== null && d2 >= 0 && d2 <= 45) out.push({ days: d2, amount: Number(b.amount) || 0, text: (b.title || 'Credit') + ' expires in ' + d2 + 'd' });
    });
    return out.sort(function (a, b) { return a.days - b.days; });
  }
  function allAlerts() {
    var out = [];
    state.trips.forEach(function (t) { moneyAlerts(t).forEach(function (a) { out.push(a); }); });
    return out;
  }
  function moneyBlock(alerts) {
    if (!alerts.length) return '';
    var total = alerts.reduce(function (s, a) { return s + (a.amount || 0); }, 0);
    return '<div class="radar"><div class="label">Money at risk</div><h2>$' + Math.round(total) + '</h2><p>Cancel windows and credits that expire soon.</p>' + alerts.map(function (a) { return '<div class="radar-row"><span>' + esc(a.text) + '</span><strong>' + (a.amount ? '$' + Math.round(a.amount) : '') + '</strong></div>'; }).join('') + '</div>';
  }
  function mapsUrl(a) { return 'https://maps.apple.com/?q=' + encodeURIComponent(a); }
  function dayKey(b) { return (b.sortKey || '').slice(0, 10) || (b.when || 'Other'); }
  function dayLabel(key) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return new Date(key + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    return key.split('\u00b7')[0];
  }
  function icon(n) {
    var m = {
      plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>',
      back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>',
      wallet: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>'
    };
    return m[n] || '';
  }
  function openTrip(id) { state.activeTripId = id; state.view = 'trip'; state.sheet = null; render(); }
  function addSample() {
    if (!state.trips.some(function (t) { return t.id === 'sample-mia'; })) {
      state.trips = [JSON.parse(JSON.stringify(SAMPLE))].concat(state.trips); persist();
    }
    openTrip('sample-mia'); toast('Sample trip loaded');
  }
  function createTrip() {
    var trip = { id: uid(), name: (state.tripName || '').trim() || 'Untitled trip', destination: state.tripForm.destination || '', startDate: '', endDate: '', notes: '', bookings: [] };
    state.trips = [trip].concat(state.trips); persist(); state.sheet = null; openTrip(trip.id);
  }
  function saveTripDetails() {
    var trip = activeTrip(); if (!trip) return;
    trip.name = (state.tripForm.name || '').trim() || 'Untitled trip';
    trip.destination = state.tripForm.destination || '';
    trip.startDate = state.tripForm.startDate || '';
    trip.endDate = state.tripForm.endDate || '';
    persist(); state.sheet = null; render();
  }
  function deleteTrip(id) { state.trips = state.trips.filter(function (t) { return t.id !== id; }); persist(); state.view = 'home'; state.activeTripId = null; state.sheet = null; render(); }
  function saveBooking() {
    var f = state.bookingForm; if (!(f.title || '').trim()) { toast('Add a title'); return; }
    var trip = activeTrip(); if (!trip) return;
    var booking = Object.assign({ id: f.id || uid() }, f, { title: f.title.trim() });
    var found = false;
    trip.bookings = (trip.bookings || []).map(function (b) { if (b.id === booking.id) { found = true; return booking; } return b; });
    if (!found) trip.bookings.push(booking);
    persist(); state.sheet = null; state.bookingForm = emptyBooking(); render(); toast('Saved');
  }
  function removeBooking(id) {
    var trip = activeTrip(); if (!trip) return;
    trip.bookings = trip.bookings.filter(function (b) { return b.id !== id; }); persist(); state.sheet = null; render();
  }
  function runParse() {
    var parsed = window.parseConfirmationEmail(state.pasteText);
    if (!parsed) { toast('Nothing to parse'); return; }
    state.bookingForm = Object.assign(emptyBooking(), parsed); state.pasteMode = 'manual'; render(); toast('Parsed');
  }
  function bookingCard(b) {
    var route = (b.from && b.to) ? '<div class="route"><span>' + esc(b.from) + '</span><span class="arrow">\u2192</span><span>' + esc(b.to) + '</span></div>' : '';
    var pass = (b.seat || b.gate) ? '<div class="pass-row">' + (b.seat ? '<div class="stat"><span>Seat</span><strong>' + esc(b.seat) + '</strong></div>' : '') + (b.gate ? '<div class="stat"><span>Gate</span><strong>' + esc(b.gate) + '</strong></div>' : '') + '</div>' : '';
    var maps = b.address ? '<a class="maps" href="' + esc(mapsUrl(b.address)) + '" target="_blank" data-action="maps">' + esc(b.address) + '</a>' : '';
    return '<div class="tl-item"><button class="booking-card ' + (b.type === 'flight' ? 'pass-card' : '') + '" data-action="open-booking" data-id="' + esc(b.id) + '"><span class="chip ' + esc(b.type) + '">' + esc(b.type) + '</span>' + route + '<div class="title">' + esc(b.title) + '</div>' + (b.when ? '<div class="when">' + esc(b.when) + '</div>' : '') + pass + (b.confirmation ? '<div class="conf">Conf: <strong class="mono">' + esc(b.confirmation) + '</strong></div>' : '') + (b.code ? '<div class="code-pill">' + esc(b.code) + '</div>' : '') + maps + '</button></div>';
  }
  function renderHome() {
    var list = !state.trips.length
      ? '<div class="empty"><div class="glyph">' + icon('wallet') + '</div><h2>Don\'t leave trip money on the table</h2><p>Cancel windows and airline credits first. Itinerary second.</p><button class="btn btn-primary" style="max-width:260px;margin:0 auto" data-action="sample">Load sample trip</button></div>'
      : '<div class="trip-list">' + state.trips.map(function (t) {
          var chips = Object.keys(typeCounts(t.bookings)).map(function (k) { return '<span class="chip ' + esc(k) + '">' + typeCounts(t.bookings)[k] + ' ' + esc(k) + '</span>'; }).join('');
          return '<button class="trip-card" data-action="open-trip" data-id="' + esc(t.id) + '"><div class="kicker">' + esc(t.destination || 'Trip') + '</div><div class="name">' + esc(t.name) + '</div><div class="meta"><span>' + (t.bookings || []).length + ' bookings</span></div><div class="chips">' + chips + '</div></button>';
        }).join('') + '</div>';
    return '<header class="header"><div><h1>Packet</h1><div class="sub">Trip money + wallet</div></div><button class="icon-btn primary" data-action="new-trip">' + icon('plus') + '</button></header><main class="content">' + moneyBlock(allAlerts()) + list + '</main><div class="bottom-bar">' + (state.trips.length ? '<button class="btn btn-ghost" data-action="sample">Sample</button>' : '') + '<button class="btn btn-primary" data-action="new-trip">New trip</button></div>';
  }
  function renderTrip() {
    var trip = activeTrip(); if (!trip) return renderHome();
    var bookings = sortBookings(trip.bookings);
    var body;
    if (!bookings.length) body = '<div class="empty"><h2>No bookings yet</h2></div>';
    else {
      var n = bookings[0];
      var heroTitle = n.from && n.to ? n.from + ' \u2192 ' + n.to : n.title;
      var hero = '<div class="hero"><div class="label">Up next</div><h2>' + esc(heroTitle) + '</h2><div class="when">' + esc([n.title, n.when].filter(Boolean).join(' \u00b7 ')) + '</div><div class="row"><div class="stat"><span>Seat</span><strong>' + esc(n.seat || '\u2014') + '</strong></div><div class="stat"><span>Gate</span><strong>' + esc(n.gate || '\u2014') + '</strong></div><div class="stat"><span>Conf</span><strong class="mono">' + esc(n.confirmation || '\u2014') + '</strong></div></div></div>';
      var groups = [], map = {};
      bookings.forEach(function (b) { var k = dayKey(b); if (!map[k]) { map[k] = { key: k, items: [] }; groups.push(map[k]); } map[k].items.push(b); });
      body = moneyBlock(moneyAlerts(trip)) + hero + groups.map(function (g) { return '<div class="day-label">' + esc(dayLabel(g.key)) + '</div>' + g.items.map(bookingCard).join(''); }).join('');
    }
    return '<header class="header"><div class="back-row"><button class="icon-btn" data-action="home">' + icon('back') + '</button><div><h1>' + esc(trip.name) + '</h1><div class="sub">' + esc(trip.destination || '') + '</div></div></div></header><main class="content">' + body + '</main><div class="bottom-bar"><button class="btn btn-ghost" data-action="edit-trip">Edit</button><button class="btn btn-secondary" data-action="open-paste">Paste</button><button class="btn btn-primary" data-action="open-manual">Add</button></div>';
  }
  function renderSheet() {
    if (!state.sheet) return '';
    var inner = '';
    if (state.sheet === 'editTrip') {
      var tf = state.tripForm;
      inner = '<div class="sheet-handle"></div><h2>Trip</h2><div class="form-group"><label>Name</label><input id="f-edit-name" value="' + esc(tf.name) + '" /></div><div class="form-group"><label>Destination</label><input id="f-edit-dest" value="' + esc(tf.destination) + '" /></div><button class="btn btn-primary" style="width:100%" data-action="save-trip">Save</button><button class="btn btn-danger" style="width:100%;margin-top:10px" data-action="delete-trip">Delete</button>';
    }
    if (state.sheet === 'addTrip') inner = '<div class="sheet-handle"></div><h2>New trip</h2><div class="form-group"><label>Name</label><input id="f-trip-name" value="' + esc(state.tripName) + '" /></div><div class="form-group"><label>Destination</label><input id="f-new-dest" /></div><button class="btn btn-primary" style="width:100%" data-action="create-trip">Create</button>';
    if (state.sheet === 'addBooking') {
      inner = '<div class="sheet-handle"></div><h2>Booking</h2><div class="tabs"><button class="tab ' + (state.pasteMode==='paste'?'active':'') + '" data-action="mode-paste">Paste</button><button class="tab ' + (state.pasteMode==='manual'?'active':'') + '" data-action="mode-manual">Manual</button></div>';
      if (state.pasteMode === 'paste') inner += '<div class="form-group"><label>Email</label><textarea id="f-paste">' + esc(state.pasteText) + '</textarea></div><button class="btn btn-primary" style="width:100%" data-action="parse">Parse</button>';
      else {
        var f = state.bookingForm;
        inner += '<div class="form-group"><label>Title</label><input id="f-title" value="' + esc(f.title) + '" /></div><div class="form-row"><div class="form-group"><label>From</label><input id="f-from" value="' + esc(f.from) + '" /></div><div class="form-group"><label>To</label><input id="f-to" value="' + esc(f.to) + '" /></div></div><div class="form-row"><div class="form-group"><label>Seat</label><input id="f-seat" value="' + esc(f.seat) + '" /></div><div class="form-group"><label>Gate</label><input id="f-gate" value="' + esc(f.gate) + '" /></div></div><div class="form-row"><div class="form-group"><label>Amount $</label><input id="f-amount" value="' + esc(f.amount) + '" /></div><div class="form-group"><label>Free cancel by</label><input id="f-cancelBy" type="date" value="' + esc(f.cancelBy) + '" /></div></div><div class="form-group"><label>Credit expires</label><input id="f-creditExpires" type="date" value="' + esc(f.creditExpires) + '" /></div><div class="form-group"><label>Address</label><input id="f-address" value="' + esc(f.address) + '" /></div><div class="form-group"><label>Conf</label><input id="f-conf" value="' + esc(f.confirmation) + '" /></div><div class="form-group"><label>When</label><input id="f-when" value="' + esc(f.when) + '" /></div><button class="btn btn-primary" style="width:100%" data-action="save-booking">Save</button>';
      }
    }
    if (state.sheet === 'bookingDetail' && state.selectedBooking) {
      var b = state.selectedBooking;
      inner = '<div class="sheet-handle"></div><h2>' + esc(b.title) + '</h2><div class="detail-block">' + (b.confirmation ? '<div class="detail-row"><span>Conf</span><span class="mono">' + esc(b.confirmation) + '</span></div>' : '') + (b.cancelBy ? '<div class="detail-row"><span>Cancel by</span><span>' + esc(b.cancelBy) + '</span></div>' : '') + (b.creditExpires ? '<div class="detail-row"><span>Credit expires</span><span>' + esc(b.creditExpires) + '</span></div>' : '') + (b.amount ? '<div class="detail-row"><span>Amount</span><span>$' + esc(b.amount) + '</span></div>' : '') + (b.address ? '<div class="detail-row"><span>Map</span><span><a href="' + esc(mapsUrl(b.address)) + '" target="_blank">Open</a></span></div>' : '') + '</div><div class="actions-row"><button class="btn btn-secondary" data-action="edit-booking">Edit</button><button class="btn btn-danger" data-action="delete-booking">Delete</button></div>';
    }
    return '<div class="overlay" data-action="close-sheet"><div class="sheet" data-stop="1">' + inner + '</div></div>';
  }
  function render() { root.innerHTML = ((state.view === 'trip' && activeTrip()) ? renderTrip() : renderHome()) + renderSheet() + (state.toast ? '<div class="toast">' + esc(state.toast) + '</div>' : ''); }
  function readForm() {
    var g = function (id) { return document.getElementById(id); };
    if (g('f-trip-name')) state.tripName = g('f-trip-name').value;
    if (g('f-edit-name')) state.tripForm.name = g('f-edit-name').value;
    if (g('f-edit-dest')) state.tripForm.destination = g('f-edit-dest').value;
    if (g('f-new-dest')) state.tripForm.destination = g('f-new-dest').value;
    if (g('f-paste')) state.pasteText = g('f-paste').value;
    ['title','when','confirmation','from','to','seat','gate','address','amount','cancelBy','creditExpires'].forEach(function (k) {
      var el = k === 'confirmation' ? g('f-conf') : g('f-' + k);
      if (el) state.bookingForm[k] = el.value;
    });
  }
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action]'); if (!t) return;
    var action = t.getAttribute('data-action');
    if (action === 'maps') { e.stopPropagation(); return; }
    if (action === 'close-sheet') { if (e.target === t) { readForm(); state.sheet = null; render(); } return; }
    if (t.getAttribute('data-stop')) return;
    readForm();
    if (action === 'home') { state.view = 'home'; state.sheet = null; render(); }
    else if (action === 'sample') addSample();
    else if (action === 'new-trip') { state.sheet = 'addTrip'; render(); }
    else if (action === 'create-trip') createTrip();
    else if (action === 'open-trip') openTrip(t.getAttribute('data-id'));
    else if (action === 'edit-trip') { var tr = activeTrip(); state.tripForm = { name: tr.name, destination: tr.destination || '', startDate: '', endDate: '', notes: '' }; state.sheet = 'editTrip'; render(); }
    else if (action === 'save-trip') saveTripDetails();
    else if (action === 'delete-trip') { if (confirm('Delete?')) deleteTrip(state.activeTripId); }
    else if (action === 'open-paste') { state.pasteMode = 'paste'; state.sheet = 'addBooking'; render(); }
    else if (action === 'open-manual') { state.bookingForm = emptyBooking(); state.pasteMode = 'manual'; state.sheet = 'addBooking'; render(); }
    else if (action === 'mode-paste') { state.pasteMode = 'paste'; render(); }
    else if (action === 'mode-manual') { state.pasteMode = 'manual'; render(); }
    else if (action === 'parse') runParse();
    else if (action === 'save-booking') saveBooking();
    else if (action === 'open-booking') { var b = activeTrip().bookings.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]; if (b) { state.selectedBooking = b; state.sheet = 'bookingDetail'; render(); } }
    else if (action === 'edit-booking') { state.bookingForm = Object.assign(emptyBooking(), state.selectedBooking); state.pasteMode = 'manual'; state.sheet = 'addBooking'; render(); }
    else if (action === 'delete-booking') removeBooking(state.selectedBooking.id);
  });
  render();
})();
