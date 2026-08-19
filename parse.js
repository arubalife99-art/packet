/** Heuristic confirmation email parser */
const TYPE_HINTS = [
  { type: 'flight', re: /\b(flight|boarding|gate|airline|depart|arrival|pnr|e-ticket|eticket|itinerary)\b/i },
  { type: 'hotel', re: /\b(hotel|check-in|check in|check-out|reservation|guest room|airbnb|booking\.com|marriott|hilton|hyatt)\b/i },
  { type: 'car', re: /\b(rental car|car rental|pickup location|hertz|enterprise|avis|budget rental)\b/i },
  { type: 'ticket', re: /\b(ticket|admission|museum|tour|event|concert|boarding pass)\b/i },
];
function detectType(text) {
  for (const h of TYPE_HINTS) { if (h.re.test(text)) return h.type; }
  return 'other';
}
function firstMatch(text, patterns) {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return (m[1] || m[0]).trim();
  }
  return '';
}
function parseConfirmationEmail(raw) {
  const text = (raw || '').replace(/\r/g, '').trim();
  if (!text) return null;
  const type = detectType(text);
  const confirmation = firstMatch(text, [
    /confirmation\s*(?:number|#|code|id)?\s*[:#]?\s*([A-Z0-9-]{5,20})/i,
    /(?:booking|reservation)\s*(?:number|#|id|code)?\s*[:#]?\s*([A-Z0-9-]{5,20})/i,
    /\bPNR\s*[:#]?\s*([A-Z0-9]{5,8})\b/i,
    /record\s*locator\s*[:#]?\s*([A-Z0-9]{5,8})/i,
  ]);
  const code = firstMatch(text, [
    /(?:door|entry|access|lock|key)\s*code\s*[:#]?\s*([A-Z0-9*#-]{4,12})/i,
    /code\s*to\s*(?:enter|unlock|open)\s*[:#]?\s*([A-Z0-9*#-]{4,12})/i,
    /pin\s*[:#]?\s*(\d{4,8})/i,
  ]);
  const flightNumber = firstMatch(text, [
    /flight\s*(?:number|#)?\s*[:#]?\s*([A-Z]{2}\s?\d{1,4})/i,
    /\b([A-Z]{2}\s?\d{1,4})\b/,
  ]);
  const m = text.match(/\b([A-Z]{3})\s*(?:\u2192|->|to|\u2013|-)\s*([A-Z]{3})\b/);
  const routeLabel = m ? (m[1] + ' \u2192 ' + m[2]) : '';
  const date = firstMatch(text, [
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/i,
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
    /\b(\d{4}-\d{2}-\d{2})\b/,
  ]);
  const time = firstMatch(text, [/\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\b/]);
  const hotelName = firstMatch(text, [/(?:hotel|property|accommodation)\s*[:]\s*(.+)/i]);
  let title = 'Booking';
  if (type === 'flight') title = [flightNumber, routeLabel].filter(Boolean).join(' \u00b7 ') || 'Flight';
  else if (type === 'hotel') title = hotelName || 'Hotel stay';
  else if (type === 'car') title = 'Car rental';
  else if (type === 'ticket') title = 'Ticket / tour';
  const when = [date, time].filter(Boolean).join(' \u00b7 ');
  return { type, title: title.slice(0, 80), when, confirmation: confirmation || '', code: code || '', notes: '' };
}
window.parseConfirmationEmail = parseConfirmationEmail;
