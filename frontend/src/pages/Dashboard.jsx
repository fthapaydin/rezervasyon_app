import { Users, CalendarDays, CheckCircle, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';

export default function Dashboard({ patients, sessions, payments, onPatientClick }) {
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pending = sessions.filter(s => s.status === 'bekliyor');
  const completed = sessions.filter(s => s.status === 'tamamlandi');

  // Total debt calculation
  const totalSessionValue = sessions.reduce((sum, s) => sum + Number(s.treatment?.price || 0), 0);
  const totalDebt = Math.max(0, totalSessionValue - totalRevenue);

  const stats = [
    { label: 'Toplam Hasta',    value: patients.length,        icon: Users,          color: 'text-blue-600 bg-blue-50' },
    { label: 'Bekleyen Seans',  value: pending.length,         icon: CalendarDays,   color: 'text-amber-600 bg-amber-50' },
    { label: 'Toplam Gelir',    value: `${totalRevenue.toLocaleString('tr-TR')} ₺`, icon: Wallet, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Toplam Alacak',   value: `${totalDebt.toLocaleString('tr-TR')} ₺`, icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200/80 p-4 md:p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] md:text-[12px] font-medium text-gray-400 uppercase tracking-wide">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Upcoming Sessions */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200/80">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-gray-800">Yaklaşan Seanslar</h3>
            <span className="text-[11px] text-gray-400 font-medium">{pending.length} bekliyor</span>
          </div>
          <div className="divide-y divide-gray-50">
            {pending.length === 0 && (
              <div className="px-5 py-10 text-center text-[13px] text-gray-400">Yaklaşan seans yok</div>
            )}
            {pending.slice(0, 5).map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-[12px] font-bold">
                    {s.patient?.full_name?.charAt(0)}
                  </div>
                  <div>
                    <button onClick={() => onPatientClick?.(s.patient?.id)} className="text-[13px] font-semibold text-gray-800 hover:text-emerald-700 transition-colors text-left">
                      {s.patient?.full_name}
                    </button>
                    <p className="text-[11px] text-gray-400">{s.treatment?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-gray-700">{s.session_time?.substring(0,5)}</p>
                  <p className="text-[11px] text-gray-400">{new Date(s.session_date).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue + Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-emerald-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} />
              <span className="text-[12px] font-semibold opacity-80 uppercase tracking-wide">Toplam Gelir</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{totalRevenue.toLocaleString('tr-TR')} ₺</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200/80 p-5">
            <h4 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Seans Özeti</h4>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400"></div><span className="text-[13px] text-gray-600">Bekliyor</span></div>
                <span className="text-[13px] font-bold text-gray-800">{pending.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[13px] text-gray-600">Tamamlandı</span></div>
                <span className="text-[13px] font-bold text-gray-800">{completed.length}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-[13px] font-medium text-gray-500">Toplam</span>
                <span className="text-[13px] font-bold text-gray-900">{sessions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
