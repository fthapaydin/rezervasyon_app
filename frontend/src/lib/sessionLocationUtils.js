// --- Seans Hizmet Yeri / Lokasyon Yardımcı Modülü ---

export const DEFAULT_SESSION_LOCATIONS = [
  { 
    id: 'klinik', 
    label: 'Klinikte', 
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    dotColor: '#059669',
    description: 'Klinik merkezimizde seans'
  },
  { 
    id: 'evde', 
    label: 'Evde', 
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    dotColor: '#d97706',
    description: 'Hasta ikametgahında yerinde seans'
  },
  { 
    id: 'uzaktan', 
    label: 'Uzaktan', 
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold',
    dotColor: '#4f46e5',
    description: 'Görüntülü görüşme veya online seans'
  }
];

export const SESSION_LOCATIONS = DEFAULT_SESSION_LOCATIONS;

/**
 * Kliniğe ait kayıtlı hizmet yerlerini döner.
 * Klinik ayarlarından özelleştirilmişse onu, yoksa varsayılanları döner.
 */
export function getClinicLocations(clinic) {
  const custom = clinic?.working_days?.session_locations || clinic?.session_locations;
  if (Array.isArray(custom) && custom.length > 0) {
    return custom.map(item => {
      if (typeof item === 'string') {
        const cleanName = item.trim();
        const id = cleanName.toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '-');
        return {
          id,
          label: cleanName,
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-semibold',
          dotColor: '#475569',
          description: cleanName
        };
      }
      return {
        ...item,
        badgeClass: item.badgeClass || 'bg-slate-100 text-slate-800 border-slate-300 font-semibold',
        dotColor: item.dotColor || '#475569'
      };
    });
  }
  return DEFAULT_SESSION_LOCATIONS;
}

const LOCATION_REGEX = /\[(?:Yer|Konum):\s*([^\]]+)\]/gi;

/**
 * Seans nesnesinden veya notundan hizmet yerini çözümler.
 */
export function getSessionLocation(sessionOrNotes) {
  if (!sessionOrNotes) return 'klinik';
  
  if (typeof sessionOrNotes === 'object' && sessionOrNotes?.location_type) {
    const loc = String(sessionOrNotes.location_type).toLowerCase().trim();
    if (loc === 'evde' || loc === 'home') return 'evde';
    if (loc === 'uzaktan' || loc === 'online' || loc === 'remote') return 'uzaktan';
    if (loc === 'klinik' || loc === 'klinikte' || loc === 'clinic') return 'klinik';
    return loc;
  }

  const notes = typeof sessionOrNotes === 'string' ? sessionOrNotes : (sessionOrNotes?.notes || '');
  if (!notes) return 'klinik';

  const match = notes.match(/\[(?:Yer|Konum):\s*([^\]]+)\]/i);
  if (match && match[1]) {
    const val = match[1].trim();
    const low = val.toLowerCase();
    if (low === 'evde' || low === 'ev' || low === 'home') return 'evde';
    if (low === 'uzaktan' || low === 'online' || low === 'remote') return 'uzaktan';
    if (low === 'klinik' || low === 'klinikte' || low === 'clinic') return 'klinik';
    return low.replace(/[^a-z0-9ğüşıöç]/gi, '-');
  }
  
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
export function encodeSessionNotes(userNotes, locationType, label = '') {
  const clean = cleanSessionNotes(userNotes);
  const tagLabel = label || (locationType === 'evde' ? 'Evde' : locationType === 'uzaktan' ? 'Uzaktan' : locationType === 'klinik' ? 'Klinikte' : locationType);
  const tag = `[Yer: ${tagLabel}]`;
  return clean ? `${clean} ${tag}` : tag;
}

/**
 * Lokasyon kimliğine göre detay meta verisini döner.
 */
export function getSessionLocationMeta(locId, clinic = null) {
  const list = clinic ? getClinicLocations(clinic) : DEFAULT_SESSION_LOCATIONS;
  const normalized = locId ? String(locId).toLowerCase().trim() : 'klinik';
  
  const found = list.find(l => l.id === normalized || l.label.toLowerCase() === normalized);
  if (found) return found;

  // Fallback for default keys
  if (normalized === 'evde' || normalized === 'home') return list.find(l => l.id === 'evde') || DEFAULT_SESSION_LOCATIONS[1];
  if (normalized === 'uzaktan' || normalized === 'online') return list.find(l => l.id === 'uzaktan') || DEFAULT_SESSION_LOCATIONS[2];
  if (normalized === 'klinik' || normalized === 'klinikte') return list.find(l => l.id === 'klinik') || DEFAULT_SESSION_LOCATIONS[0];

  return {
    id: normalized,
    label: locId || 'Klinikte',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-semibold',
    dotColor: '#475569',
    description: locId || 'Klinik Seansı'
  };
}
