import { getClinicLocations, getSessionLocationMeta } from '../../lib/sessionLocationUtils';

export default function LocationSelector({ value = 'klinik', onChange, clinic = null, locations = null }) {
  const current = value || 'klinik';
  const availableLocations = locations || getClinicLocations(clinic);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[12px] font-semibold text-slate-700">
          Seans Hizmet Yeri
        </label>
        <span className="text-[11px] text-slate-400">
          {availableLocations.length} seçenek
        </span>
      </div>

      <div className={`grid gap-2 ${availableLocations.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {availableLocations.map((loc) => {
          const isSelected = current === loc.id || current === loc.label;
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onChange?.(loc.id)}
              className={`h-10 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center text-[12px] font-semibold select-none ${
                isSelected
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className="truncate">{loc.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Rozet Gösterici (Takvim ve Tablolar için - İkonsuz, sade ve şık)
 */
export function LocationBadge({ location, clinic = null, size = 'normal' }) {
  const locId = location || 'klinik';
  const meta = getSessionLocationMeta(locId, clinic);
  const isSmall = size === 'small';

  return (
    <span 
      title={meta.label}
      className={`inline-flex items-center rounded-md border font-semibold tracking-tight transition-all shrink-0 ${
        isSmall ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
      } ${meta.badgeClass || 'bg-slate-100 text-slate-800 border-slate-300'}`}
    >
      <span>{meta.label}</span>
    </span>
  );
}

