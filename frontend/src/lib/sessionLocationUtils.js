// --- Seans Hizmet Yeri / Lokasyon Yardımcı Modülü ---

export const SESSION_LOCATIONS = [
  { 
    id: 'klinik', 
    label: 'Klinikte', 
    fullLabel: 'Klinikte Tedavi', 
    icon: '🏥', 
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    dotColor: '#059669',
    description: 'Klinik merkezimizde yüz yüze seans'
  },
  { 
    id: 'evde', 
    label: 'Evde', 
    fullLabel: 'Evde Fizyoterapi & Ziyaret', 
    icon: '🏠', 
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    dotColor: '#d97706',
    description: 'Hasta ikametgahında yerinde seans ziyareti'
  },
  { 
    id: 'uzaktan', 
    label: 'Uzaktan', 
    fullLabel: 'Uzaktan / Online (Telerehabilitasyon)', 
    icon: '💻', 
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold',
    dotColor: '#4f46e5',
    description: 'Görüntülü görüşme ile online egzersiz ve danışmanlık'
  }
];

const LOCATION_REGEX = /\[(?:Yer|Konum):\s*(?:Evde|Ev|Uzaktan|Online|Klinik|Klinikte|Home|Remote|Clinic)\]/gi;

/**
 * Seans nesnesinden veya notundan hizmet yerini ('klinik' | 'evde' | 'uzaktan') çözümler.
 */
export function getSessionLocation(sessionOrNotes) {
  if (!sessionOrNotes) return 'klinik';
  
  if (typeof sessionOrNotes === 'object' && sessionOrNotes?.location_type) {
    const loc = String(sessionOrNotes.location_type).toLowerCase();
    if (loc === 'evde' || loc === 'home') return 'evde';
    if (loc === 'uzaktan' || loc === 'online' || loc === 'remote') return 'uzaktan';
    return 'klinik';
  }

  const notes = typeof sessionOrNotes === 'string' ? sessionOrNotes : (sessionOrNotes?.notes || '');
  if (!notes) return 'klinik';

  if (/\[(?:Yer|Konum):\s*(?:Evde|Ev|Home)\]/i.test(notes)) return 'evde';
  if (/\[(?:Yer|Konum):\s*(?:Uzaktan|Online|Remote)\]/i.test(notes)) return 'uzaktan';
  if (/\[(?:Yer|Konum):\s*(?:Klinik|Klinikte|Clinic)\]/i.test(notes)) return 'klinik';
  
  return 'klinik';
}

/**
 * Kullanıcı notunu [Yer: ...] etiketlerinden arındırarak saf metin olarak döner.
 */
export function cleanSessionNotes(notes) {
  if (!notes) return '';
  return String(notes).replace(LOCATION_REGEX, '').trim();
}

/**
 * Kullanıcı notuna seçilen hizmet yeri etiketini ekler.
 */
export function encodeSessionNotes(userNotes, locationType) {
  const clean = cleanSessionNotes(userNotes);
  const loc = locationType || 'klinik';
  const tag = loc === 'evde' ? '[Yer: Evde]' : loc === 'uzaktan' ? '[Yer: Uzaktan]' : '[Yer: Klinik]';
  return clean ? `${clean} ${tag}` : tag;
}

/**
 * Lokasyon kimliğine göre detay meta verisini döner.
 */
export function getSessionLocationMeta(locId) {
  const normalized = locId ? String(locId).toLowerCase() : 'klinik';
  return SESSION_LOCATIONS.find(l => l.id === normalized) || SESSION_LOCATIONS[0];
}
