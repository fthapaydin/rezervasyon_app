import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { API_URL } from '../lib/api';
import { 
  CheckCircle, XCircle, Clock, Calendar, Phone, Stethoscope, MessageSquare, X, Send, UserCheck, Check 
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';

const STATUS_MAP = {
  bekliyor:    { label: 'Bekliyor',    cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  onaylandi:   { label: 'Onaylandı',   cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  reddedildi:  { label: 'Reddedildi',  cls: 'bg-red-50 text-red-700 border border-red-200' },
};

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('tr-TR', { day:'2-digit', month:'long', year:'numeric', weekday:'long' });
}

function formatCreated(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

export default function Requests({ clinic, staff = [], requests = [], refresh }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState('bekliyor');
  const [rejectModal, setRejectModal] = useState(null);
  const [approveModal, setApproveModal] = useState(null);
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(null);

  const filtered = requests.filter(r => filter === 'hepsi' ? true : r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'bekliyor').length;

  const openApproveModal = (req) => {
    setApproveModal(req);
    setSelectedTherapistId(req.therapist_id || staff[0]?.id || '');
  };

  const handleApproveConfirm = async () => {
    if (!approveModal) return;
    if (staff.length > 1 && !selectedTherapistId) {
      toast.warning('Lütfen randevuyu yönetecek fizyoterapisti seçiniz.', 'Terapist Seçimi Gerekli');
      return;
    }
    setProcessing(approveModal.id);

    const therapistId = selectedTherapistId || (staff.length === 1 ? staff[0].id : null);

    try {
      // 1. Talebi onayla (doğrudan Supabase)
      const { error: updateErr } = await supabase
        .from('session_requests')
        .update({ status: 'onaylandi', therapist_id: therapistId })
        .eq('id', approveModal.id);

      if (updateErr) throw updateErr;

      // 2. Takvime seans ekle (clinic_id olmadan — canlı DB'de bu kolon yok)
      const { error: sessionErr } = await supabase
        .from('sessions')
        .insert([{
          patient_id: approveModal.patient_id,
          treatment_id: approveModal.treatment_id,
          therapist_id: therapistId,
          session_date: approveModal.requested_date,
          session_time: approveModal.requested_time,
          notes: approveModal.notes || null,
          status: 'bekliyor'
        }]);

      if (sessionErr) throw sessionErr;

      // 3. WhatsApp bildirim (arka planda, hata yutulur)
      const assignedTherapist = staff.find(s => s.id === therapistId);
      if (approveModal.patient?.phone) {
        axios.post(`${API_URL}/whatsapp/send-template`, {
          clinic_id: clinic?.id,
          to_phone: approveModal.patient.phone,
          type: 'approval',
          patient_name: approveModal.patient.full_name,
          date: approveModal.requested_date,
          time: approveModal.requested_time?.substring(0, 5),
          therapist_name: assignedTherapist?.full_name,
          treatment_name: approveModal.treatment?.name
        }).catch(() => {});
      }

      toast.success(`"${approveModal.patient?.full_name}" randevusu onaylandı ve takvime eklendi.`, 'Randevu Onaylandı');
      setApproveModal(null);
      refresh();
    } catch (err) {
      console.error('Onaylama hatası:', err);
      toast.error(err.message || 'İşlem başarısız oldu.', 'Hata');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(rejectModal.id);
    try {
      const { error } = await supabase
        .from('session_requests')
        .update({ status: 'reddedildi', rejection_reason: rejectionReason || null })
        .eq('id', rejectModal.id);

      if (error) throw error;

      toast.info(`"${rejectModal.patient?.full_name}" randevu talebi reddedildi.`, 'Talep Reddedildi');
      setRejectModal(null);
      setRejectionReason('');
      refresh();
    } catch (err) {
      console.error('Reddetme hatası:', err);
      toast.error(err.message || 'İşlem başarısız oldu.', 'Hata');
    } finally {
      setProcessing(null);
    }
  };

  const tabs = [
    { key: 'bekliyor',   label: 'Bekleyenler', count: requests.filter(r=>r.status==='bekliyor').length },
    { key: 'onaylandi',  label: 'Onaylananlar', count: requests.filter(r=>r.status==='onaylandi').length },
    { key: 'reddedildi', label: 'Reddedilenler', count: requests.filter(r=>r.status==='reddedildi').length },
    { key: 'hepsi',      label: 'Tümü', count: requests.length },
  ];

  return (
    <div className="space-y-5">
      {/* Header stats */}
      {pendingCount > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-slate-900">
              {pendingCount} onay bekleyen randevu talebi
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Talebi onaylamak veya terapist atamak için inceleyin.</p>
          </div>
          <span className="text-[11px] font-semibold text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded">
            Yeni Talep
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`h-7 px-3 rounded-md text-[12px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === t.key ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                t.key === 'bekliyor' && t.count > 0 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Request Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-[13px]">
            Bu filtrede randevu talebi bulunmuyor.
          </div>
        ) : (
          filtered.map(req => {
            const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.bekliyor;
            const isPending = req.status === 'bekliyor';
            const isApproved = req.status === 'onaylandi';
            const isRejected = req.status === 'reddedildi';

            return (
              <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-slate-900 text-[14px]">{req.patient?.full_name}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-slate-600">
                      <div>
                        <span>{req.patient?.phone}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-800">{req.treatment?.name}</span>
                        {req.treatment?.price && <span className="text-slate-500 font-semibold ml-1">({req.treatment.price} ₺)</span>}
                      </div>
                      <div>
                        <span className="font-medium">{formatDate(req.requested_date)}</span>
                        <span className="font-bold text-slate-900 ml-1.5">{req.requested_time?.substring(0, 5)}</span>
                      </div>
                      {req.therapist && (
                        <div>
                          <span className="font-medium text-slate-700">Terapist: {req.therapist.full_name}</span>
                        </div>
                      )}
                    </div>

                    {req.notes && (
                      <p className="text-[12px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-800">Hasta Notu:</span> {req.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openApproveModal(req)}
                        disabled={processing === req.id}
                        className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Check size={13} />
                        <span>Onayla &amp; Terapist Ata</span>
                      </button>
                      <button
                        onClick={() => { setRejectModal(req); setRejectionReason(''); }}
                        disabled={processing === req.id}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <X size={13} className="text-slate-500" />
                        <span>Reddet</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Approve Modal with Therapist Assignment */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setApproveModal(null)} />
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 w-full max-w-md z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">Randevu Onayla &amp; Terapist Belirle</h3>
              <button onClick={() => setApproveModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={17} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-[12px] text-emerald-800">
                <p className="font-bold">{approveModal.patient?.full_name}</p>
                <p>{formatDate(approveModal.requested_date)} saat {approveModal.requested_time?.substring(0, 5)}</p>
                <p className="font-semibold mt-1">{approveModal.treatment?.name}</p>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">
                  Görevli Fizyoterapist {staff.length > 1 ? <span className="text-red-500">*</span> : ''}
                </label>
                <select
                  required={staff.length > 1}
                  value={selectedTherapistId}
                  onChange={(e) => setSelectedTherapistId(e.target.value)}
                  className="input-field bg-white"
                >
                  <option value="">{staff.length > 1 ? 'Fizyoterapist seçiniz *' : 'Seçim yapılmadı (Varsayılan)'}</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.title || 'Fzt.'})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-gray-400">
                💡 Onaylandığında hastaya otomatik WhatsApp onay bildirimi gönderilir ve seans takvime işlenir.
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setApproveModal(null)}
                className="h-9 px-4 rounded-xl text-[12px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleApproveConfirm}
                disabled={processing === approveModal.id}
                className="h-9 px-5 rounded-xl text-[12px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs"
              >
                {processing === approveModal.id ? 'Onaylanıyor...' : 'Onayla & Bildir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 w-full max-w-md z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">Randevu Talebini Reddet</h3>
              <button onClick={() => setRejectModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={17} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[13px] text-gray-600">
                <span className="font-bold">{rejectModal.patient?.full_name}</span> adlı hastanın talebini reddetmek üzeresiniz.
              </p>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">Reddetme Nedeni (İsteğe Bağlı)</label>
                <textarea
                  rows={3}
                  placeholder="Örn: O saatte kliniğimiz doludur..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-[12px] outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="h-9 px-4 rounded-xl text-[12px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={processing === rejectModal.id}
                className="h-9 px-5 rounded-xl text-[12px] font-semibold text-white bg-red-600 hover:bg-red-700"
              >
                {processing === rejectModal.id ? 'İşleniyor...' : 'Talebi Reddet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
