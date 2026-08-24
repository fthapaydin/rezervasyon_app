import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { CheckCircle, XCircle, Clock, Calendar, Phone, Stethoscope, MessageSquare, X } from 'lucide-react';

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

export default function Requests({ requests, refresh }) {
  const [filter, setFilter] = useState('bekliyor');
  const [rejectModal, setRejectModal] = useState(null); // request object
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(null); // id of request being processed

  const filtered = requests.filter(r => filter === 'hepsi' ? true : r.status === filter);

  const pendingCount = requests.filter(r => r.status === 'bekliyor').length;

  const handleApprove = async (req) => {
    setProcessing(req.id);
    try {
      await axios.put(`${API_URL}/session-requests/${req.id}`, { status: 'onaylandi' });
      refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'İşlem başarısız oldu.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(rejectModal.id);
    try {
      await axios.put(`${API_URL}/session-requests/${rejectModal.id}`, {
        status: 'reddedildi',
        rejection_reason: rejectionReason || null
      });
      setRejectModal(null);
      setRejectionReason('');
      refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'İşlem başarısız oldu.');
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center">
            <Clock size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-amber-800">
              {pendingCount} bekleyen randevu talebi var
            </p>
            <p className="text-[11px] text-amber-600">Onaylamak veya reddetmek için talebi inceleyin.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5 ${
              filter === t.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                t.key === 'bekliyor' && t.count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar size={22} className="text-gray-400" />
          </div>
          <p className="text-[13px] text-gray-500">Bu kategoride talep bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const status = STATUS_MAP[req.status] || STATUS_MAP.bekliyor;
            const isProcessing = processing === req.id;
            return (
              <div key={req.id} className="bg-white rounded-xl border border-gray-200/80 p-5 hover:border-gray-300 transition-all">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Patient & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-[12px] shrink-0">
                        {(req.patient?.full_name || '?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-gray-800">{req.patient?.full_name || 'Bilinmiyor'}</p>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Phone size={10} />
                          {req.patient?.phone || '-'}
                        </div>
                      </div>
                      <span className={`ml-auto shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 text-[12px] text-gray-600">
                        <Calendar size={13} className="text-gray-400 shrink-0" />
                        <span>{formatDate(req.requested_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-gray-600">
                        <Clock size={13} className="text-gray-400 shrink-0" />
                        <span className="font-semibold">{req.requested_time?.slice(0,5)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-gray-600">
                        <Stethoscope size={13} className="text-gray-400 shrink-0" />
                        <span>{req.treatment?.name || '-'}</span>
                      </div>
                    </div>

                    {req.notes && (
                      <div className="mt-3 flex items-start gap-2 text-[12px] text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <MessageSquare size={12} className="mt-0.5 shrink-0 text-gray-400" />
                        <span>{req.notes}</span>
                      </div>
                    )}

                    {req.status === 'reddedildi' && req.rejection_reason && (
                      <div className="mt-3 flex items-start gap-2 text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
                        <XCircle size={12} className="mt-0.5 shrink-0" />
                        <span><strong>Red gerekçesi:</strong> {req.rejection_reason}</span>
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400 mt-3">Talep tarihi: {formatCreated(req.created_at)}</p>
                  </div>

                  {/* Right: Actions (only for pending) */}
                  {req.status === 'bekliyor' && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={isProcessing}
                        className="h-9 px-4 bg-emerald-600 text-white rounded-lg text-[12px] font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        {isProcessing ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><CheckCircle size={13} /> Onayla</>
                        )}
                      </button>
                      <button
                        onClick={() => { setRejectModal(req); setRejectionReason(''); }}
                        disabled={isProcessing}
                        className="h-9 px-4 bg-white text-red-600 rounded-lg text-[12px] font-medium border border-red-200 hover:bg-red-50 disabled:opacity-50 flex items-center gap-1.5 transition-all"
                      >
                        <XCircle size={13} /> Reddet
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <button
              onClick={() => setRejectModal(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <X size={14} className="text-gray-600" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-gray-800">Randevu Talebini Reddet</h3>
                <p className="text-[12px] text-gray-400">{rejectModal.patient?.full_name} — {rejectModal.requested_date} {rejectModal.requested_time?.slice(0,5)}</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                Red Gerekçesi <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Örn: O gün müsait değilim, farklı bir tarih tercih eder misiniz?"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 h-10 border border-gray-200 rounded-xl text-[13px] text-gray-600 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleReject}
                disabled={processing === rejectModal.id}
                className="flex-1 h-10 bg-red-600 text-white rounded-xl text-[13px] font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing === rejectModal.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Reddet'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
