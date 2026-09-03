import { ArrowUpRight, MessageCircle } from 'lucide-react';
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
      label: 'Toplam Hasta',    
      value: patients.length,        
      desc: 'Kayıtlı aktif hasta portföyü'
    },
    { 
      label: 'Bekleyen Seans',  
      value: pending.length,         
      desc: 'Günün ve haftanın takvimi'
    },
    { 
      label: 'Toplam Tahsilat',    
      value: `${totalRevenue.toLocaleString('tr-TR')} ₺`, 
      desc: 'Kasa toplam nakit & kart'
    },
    { 
      label: 'Kalan Alacak',   
      value: `${totalDebt.toLocaleString('tr-TR')} ₺`, 
      desc: 'Takip edilen açık bakiye'
    },
  ];

  return (
    <div className="space-y-6 font-[Inter]">
      {/* Onay Bekleyen Randevu Talepleri Vurgu Bannerı */}
      {pendingRequests.length > 0 && (
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-2xs">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-[14px] font-bold tracking-tight">
                Onay Bekleyen {pendingRequests.length} Yeni Randevu Talebi
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Yeni
              </span>
            </div>
            <p className="text-[12px] text-slate-400 mt-0.5 truncate">
              {pendingRequests[0]?.patient?.full_name ? `Son talep: ${pendingRequests[0].patient.full_name} (${pendingRequests[0].requested_date} - ${pendingRequests[0].requested_time?.substring(0, 5)})` : 'Hastalar online randevu takviminden talep oluşturdu.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToRequests ? onNavigateToRequests() : (setActiveTab && setActiveTab('requests'))}
            className="h-8 px-4 rounded-lg bg-white text-slate-900 hover:bg-slate-100 font-semibold text-[12px] transition-colors shrink-0 cursor-pointer self-end sm:self-auto"
          >
            Talepleri İncele &amp; Onayla
          </button>
        </div>
      )}

      {/* ─── Stat Cards Grid (Tek Renk Kurumsal Kutular) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div 
            key={s.label} 
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-colors"
          >
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {s.label}
            </span>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* ─── Main Columns ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upcoming Sessions Panel (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-[13px] font-bold text-slate-900">Yaklaşan Seans Randevuları</h3>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {pending.length} bekliyor
            </span>
          </div>

          <div className="flex-1">
            {pending.length === 0 ? (
              <div className="p-8">
                <EmptyState 
                  title="Yaklaşan seans randevusu yok"
                  description="Şu an için bekleyen randevunuz bulunmuyor. Takvim üzerinden yeni bir seans ekleyebilirsiniz."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pending.slice(0, 6).map(s => {
                  const patientInitial = s.patient?.full_name ? s.patient.full_name.charAt(0).toUpperCase() : '?';
                  return (
                    <div 
                      key={s.id} 
                      className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-[12px] font-bold shrink-0 border border-slate-200">
                          {patientInitial}
                        </div>
                        <div className="min-w-0">
                          <button 
                            onClick={() => onPatientClick?.(s.patient?.id)} 
                            className="text-[13px] font-semibold text-slate-900 hover:text-slate-600 transition-colors text-left block truncate cursor-pointer"
                          >
                            {s.patient?.full_name || 'İsimsiz Hasta'}
                          </button>
                          <p className="text-[11px] text-slate-400 truncate">
                            {s.treatment?.name || 'Fizyoterapi Seansı'}
                            {s.therapist?.full_name && (
                              <span className="text-slate-400"> • {s.therapist.full_name}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-[12px] font-semibold text-slate-800 font-mono">
                            {s.session_time?.substring(0, 5)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(s.session_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <button
                          onClick={() => sendWhatsAppReminder(s)}
                          className="h-7 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title="WhatsApp Randevu Hatırlatması Gönder"
                        >
                          <MessageCircle size={12} />
                          <span className="hidden sm:inline">WhatsApp</span>
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
        <div className="lg:col-span-2 space-y-4">
          {/* Revenue Card (Tek Renk Slate-900) */}
          <div className="bg-slate-900 rounded-xl p-5 text-white border border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 block mb-1">
              Klinik Ciro Durumu
            </span>
            <p className="text-3xl font-bold tracking-tight text-white">{totalRevenue.toLocaleString('tr-TR')} ₺</p>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Kayıtlı {payments.length} adet tahsilat işlemi üzerinden hesaplandı.
            </p>
          </div>

          {/* Session Breakdown Card (Tek Renk Beyaz) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Seans Dağılım Özeti
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <span className="text-[12px] font-medium text-slate-700">Bekleyen Randevular</span>
                </div>
                <span className="text-[12px] font-bold text-slate-900 font-mono">{pending.length}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[12px] font-medium text-slate-700">Tamamlanan Seanslar</span>
                </div>
                <span className="text-[12px] font-bold text-slate-900 font-mono">{completed.length}</span>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 px-1">
                <span className="text-[12px] font-semibold text-slate-500">Toplam Seans Kaydı</span>
                <span className="text-[13px] font-bold text-slate-900 font-mono">{sessions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
