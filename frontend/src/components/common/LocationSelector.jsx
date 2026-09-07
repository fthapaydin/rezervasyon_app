import { SESSION_LOCATIONS } from '../../lib/sessionLocationUtils';

export default function LocationSelector({ value = 'klinik', onChange, showDescription = true, compact = false }) {
  const current = value || 'klinik';

  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-semibold text-slate-700">
        Seans Hizmet Yeri <span className="text-slate-400 font-normal">(Klinik / Evde / Uzaktan)</span>
      </label>

      <div className="grid grid-cols-3 gap-2">
        {SESSION_LOCATIONS.map((loc) => {
          const isSelected = current === loc.id;
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onChange?.(loc.id)}
              className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                isSelected
                  ? loc.id === 'evde'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs font-bold ring-1 ring-amber-500'
                    : loc.id === 'uzaktan'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs font-bold ring-1 ring-indigo-500'
                    : 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs font-bold ring-1 ring-emerald-500'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className="text-base sm:text-lg leading-none">{loc.icon}</span>
              <span className="text-[11px] sm:text-[12px] leading-tight truncate w-full">{loc.label}</span>
            </button>
          );
        })}
      </div>

      {showDescription && !compact && (
        <div className="text-[11px] pt-0.5">
          {current === 'evde' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-900">
              <span className="shrink-0">🏠</span>
              <span><strong>Evde Fizyoterapi:</strong> Randevu hastanın ikametgahında yerinde seans olarak takvime işlenir.</span>
            </div>
          )}
          {current === 'uzaktan' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50/80 border border-indigo-200/80 text-indigo-900">
              <span className="shrink-0">💻</span>
              <span><strong>Online / Telerehabilitasyon:</strong> Görüntülü görüşme veya uzaktan takip seansı olarak planlanır.</span>
            </div>
          )}
          {current === 'klinik' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-600">
              <span className="shrink-0">🏥</span>
              <span><strong>Klinik İçi Seans:</strong> Seans doğrudan klinik merkezimizde fiziki olarak gerçekleştirilir.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Rozet Gösterici (Takvim ve Tablolar için)
 */
export function LocationBadge({ location, size = 'normal', showIconOnly = false }) {
  const locId = location || 'klinik';
  const meta = SESSION_LOCATIONS.find(l => l.id === locId) || SESSION_LOCATIONS[0];

  if (showIconOnly) {
    return (
      <span title={meta.fullLabel} className="inline-flex items-center text-xs">
        {meta.icon}
      </span>
    );
  }

  const isSmall = size === 'small';

  return (
    <span 
      title={meta.description}
      className={`inline-flex items-center gap-1 rounded-md border font-semibold tracking-tight transition-all shrink-0 ${
        isSmall ? 'text-[9px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5'
      } ${meta.badgeClass}`}
    >
      <span className="leading-none">{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}
