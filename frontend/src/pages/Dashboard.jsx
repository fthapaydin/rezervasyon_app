import { 
  Users, CalendarDays, CheckCircle, Wallet, TrendingUp, AlertTriangle, 
  MessageCircle, Plus, ArrowUpRight, Clock, Sparkles, Activity, QrCode
} from 'lucide-react';
import { sendWhatsAppReminder } from '../lib/reminder';
import EmptyState from '../components/ui/EmptyState';

export default function Dashboard({ patients, sessions, payments, onPatientClick, setActiveTab, requests = [], onNavigateToRequests }) {
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pending = sessions.filter(s => s.status === 'bekliyor');
  const completed = sessions.filter(s => s.status === 'tamamlandi');

  // Pending online requests from patients
  const pendingRequests = requests.filter(r => r.status === 'bekliyor');

  // Total debt calculation
  const totalSessionValue = sessions.reduce((sum, s) => sum + Number(s.treatment?.price || 0), 0);
  const totalDebt = Math.max(0, totalSessionValue - totalRevenue);

  const stats = [
    { 
      label: 'Toplam Kayıtlı Hasta',    
      value: patients.length,        
      icon: Users,          
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      badge: `${patients.length} Aktif Kayıt`,
      badgeColor: 'text-blue-700 bg-blue-50'
    },
    { 
      label: 'Bekleyen Seanslar',  
      value: pending.length,         
      icon: CalendarDays,   
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      badge: 'Günün & Haftanın Takvimi',
      badgeColor: 'text-amber-700 bg-amber-50'
    },
    { 
      label: 'Toplam Tahsilat',    
      value: `${totalRevenue.toLocaleString('tr-TR')} ₺`, 
      icon: Wallet, 
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      badge: 'Kasa & Ödeme Geliri',
      badgeColor: 'text-emerald-700 bg-emerald-50'
    },
    { 
      label: 'Kalan Toplam Alacak',   
      value: `${totalDebt.toLocaleString('tr-TR')} ₺`, 
      icon: AlertTriangle, 
      color: 'text-rose-500 bg-rose-50 border-rose-100',
      badge: 'Takip Edilen Borç',
      badgeColor: 'text-rose-700 bg-rose-50'
    },
  ];

  return (
    <div className="space-y-6">
      {/* 🚨 Onay Bekleyen Randevu Talepleri Vurgu Bannerı */}
      {pendingRequests.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white shadow-lg shadow-rose-600/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shrink-0 animate-bounce">
              🔔
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-[15px] font-black tracking-tight">
                  Onay Bekleyen {pendingRequests.length} Yeni Randevu Talebi Var!
                </h4>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white text-rose-700 uppercase tracking-wider shadow-2xs">
                  Acil İnceleme
                </span>
              </div>
              <p className="text-[12px] text-white/90 mt-0.5 truncate">
                {pendingRequests[0]?.patient?.full_name ? `Son talep: ${pendingRequests[0].patient.full_name} (${pendingRequests[0].requested_date} - ${pendingRequests[0].requested_time?.substring(0, 5)})` : 'Hastalar online randevu takviminden talep oluşturdu.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToRequests ? onNavigateToRequests() : (setActiveTab && setActiveTab('requests'))}
            className="h-10 px-5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-black text-[13px] shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer self-end sm:self-auto"
          >
            <span>Talepleri İncele &amp; Onayla</span>
            <ArrowUpRight size={16} />
          </button>
        </div>
      )}

      {/* ─── Stat Cards Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div 
              key={s.label} 
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</span>
                <div className={`w-10 h-10 rounded-xl ${s.color} border flex items-center justify-center transition-transform group-hover:scale-105`}>
                  <Icon size={18} strokeWidth={2.2} />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{s.value}</p>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badgeColor}`}>
                  {s.badge}
                </span>
                <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Main Columns ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upcoming Sessions Panel (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-emerald-600" />
              <h3 className="text-[14px] font-bold text-gray-900">Yaklaşan Seans Randevuları</h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
              {pending.length} randevu bekliyor
            </span>
          </div>

          <div className="flex-1">
            {pending.length === 0 ? (
              <div className="p-8">
                <EmptyState 
                  icon={CalendarDays}
                  title="Yaklaşan seans randevusu yok"
                  description="Şu an için bekleyen randevunuz bulunmuyor. Takvim üzerinden yeni bir seans ekleyebilirsiniz."
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pending.slice(0, 6).map(s => {
                  const patientInitial = s.patient?.full_name ? s.patient.full_name.charAt(0).toUpperCase() : '?';
                  return (
                    <div 
                      key={s.id} 
                      className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-[13px] font-bold shrink-0 border border-emerald-200">
                          {patientInitial}
                        </div>
                        <div className="min-w-0">
                          <button 
                            onClick={() => onPatientClick?.(s.patient?.id)} 
                            className="text-[13px] font-bold text-gray-900 hover:text-emerald-700 transition-colors text-left block truncate cursor-pointer"
                          >
                            {s.patient?.full_name || 'İsimsiz Hasta'}
                          </button>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {s.treatment?.name || 'Fizyoterapi Seansı'}
                            {s.therapist?.full_name && (
                              <span className="text-gray-400"> • {s.therapist.full_name}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-[13px] font-bold text-gray-800 font-mono">
                            {s.session_time?.substring(0, 5)}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(s.session_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <button
                          onClick={() => sendWhatsAppReminder(s)}
                          className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-all border border-emerald-200 shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
                          title="WhatsApp Randevu Hatırlatması Gönder"
                        >
                          <MessageCircle size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Financial & Status Summary (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/10 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-xs">
                <TrendingUp size={16} />
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase opacity-90">Klinik Ciro Durumu</span>
            </div>
            <p className="text-3xl font-black tracking-tight">{totalRevenue.toLocaleString('tr-TR')} ₺</p>
            <p className="text-[12px] text-emerald-100/80 mt-2">
              Kayıtlı {payments.length} adet tahsilat işlemi üzerinden hesaplandı.
            </p>
          </div>

          {/* Session Breakdown Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs">
            <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-4">
              Seans Dağılım Özeti
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 border border-amber-100/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                  <span className="text-[13px] font-semibold text-gray-700">Bekleyen Randevular</span>
                </div>
                <span className="text-[13px] font-black text-amber-700 font-mono">{pending.length}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[13px] font-semibold text-gray-700">Tamamlanan Seanslar</span>
                </div>
                <span className="text-[13px] font-black text-emerald-700 font-mono">{completed.length}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 px-1">
                <span className="text-[13px] font-bold text-gray-500">Toplam Seans Kaydı</span>
                <span className="text-[14px] font-black text-gray-900 font-mono">{sessions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
