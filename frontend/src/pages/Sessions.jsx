import { useState, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, X, ChevronLeft, ChevronRight, Clock, CheckCircle2, Repeat, 
  MessageCircle, Smartphone, Calendar, ListFilter, FileSpreadsheet,
  Edit2, Trash2, XCircle, Stethoscope, User
} from 'lucide-react';
import { sendWhatsAppReminder, sendSmsReminder } from '../lib/reminder';
import { exportSessionsToExcel } from '../lib/excelExport';
import { API_URL } from '../lib/api';

const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const SHORT_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff); date.setHours(0,0,0,0);
  return date;
}
function formatDate(d) { 
  const local = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
  return local.toISOString().split('T')[0];
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

export default function Sessions({ clinic, staff = [], sessions, requests = [], patients, treatments, refresh, onPatientClick }) {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [selectedTherapistId, setSelectedTherapistId] = useState('all'); // 'all' | staff.id
  const [modalMode, setModalMode] = useState(null); // null | 'single' | 'recurring' | 'edit'
  const [formData, setFormData] = useState({ patient_id: '', treatment_id: '', therapist_id: '', session_date: '', session_time: '', notes: '' });
  const [recurData, setRecurData] = useState({ patient_id: '', treatment_id: '', therapist_id: '', session_time: '', start_date: '', repeat_type: 'weekly', repeat_count: 8 });
  const [submitting, setSubmitting] = useState(false);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [editSession, setEditSession] = useState(null);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = formatDate(new Date());

  const filteredSessions = useMemo(() => {
    if (selectedTherapistId === 'all') return sessions;
    return sessions.filter(s => s.therapist_id === selectedTherapistId);
  }, [sessions, selectedTherapistId]);

  const filteredRequests = useMemo(() => {
    if (selectedTherapistId === 'all') return requests;
    return requests.filter(r => r.therapist_id === selectedTherapistId);
  }, [requests, selectedTherapistId]);

  const sessionMap = useMemo(() => {
    const map = {};
    filteredSessions.forEach(s => {
      const dk = s.session_date, tk = s.session_time?.substring(0, 5);
      if (!map[dk]) map[dk] = {};
      if (!map[dk][tk]) map[dk][tk] = [];
      map[dk][tk].push({ ...s, _type: 'session' });
    });
    (filteredRequests || []).forEach(r => {
      if (r.status === 'bekliyor') {
        const dk = r.requested_date, tk = r.requested_time?.substring(0, 5);
        if (!map[dk]) map[dk] = {};
        if (!map[dk][tk]) map[dk][tk] = [];
        map[dk][tk].push({ ...r, _type: 'request' });
      }
    });
    return map;
  }, [filteredSessions, filteredRequests]);

  const getSessionNumber = (session) => {
    if (session._type === 'request') return null;
    const ps = sessions.filter(s => s.patient_id === session.patient_id).sort((a, b) => a.session_date.localeCompare(b.session_date));
    const idx = ps.findIndex(s => s.id === session.id);
    return { current: idx + 1, total: session.patient?.total_sessions || ps.length };
  };

  const handleCellClick = (dateStr, hourStr) => {
    setFormData({
      patient_id: '',
      treatment_id: treatments[0]?.id || '',
      therapist_id: selectedTherapistId !== 'all' ? selectedTherapistId : (staff[0]?.id || ''),
      session_date: dateStr,
      session_time: hourStr,
      notes: ''
    });
    setModalMode('single');
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault(); 
    setSubmitting(true);
    try { 
      await axios.post(`${API_URL}/sessions`, {
        ...formData,
        clinic_id: clinic?.id,
        therapist_id: formData.therapist_id || null,
      }); 
      setModalMode(null); 
      refresh(); 
    } catch { 
      alert('Seans oluşturulurken bir hata oluştu'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleEditClick = (session) => {
    setEditSession(session);
    setFormData({
      id: session.id,
      patient_id: session.patient_id,
      treatment_id: session.treatment_id,
      therapist_id: session.therapist_id || '',
      session_date: session.session_date,
      session_time: session.session_time?.substring(0, 5),
      notes: session.notes || ''
    });
    setModalMode('edit');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault(); 
    setSubmitting(true);
    try { 
      await axios.put(`${API_URL}/sessions/${formData.id}`, {
        ...formData,
        therapist_id: formData.therapist_id || null,
      }); 
      setModalMode(null); 
      refresh(); 
    } catch { 
      alert('Seans güncellenirken bir hata oluştu'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const deleteSession = async (id) => {
    if (!window.confirm("Bu seansı silmek istediğinize emin misiniz?")) return;
    try { 
      await axios.delete(`${API_URL}/sessions/${id}`); 
      refresh(); 
    } catch { 
      alert('Silme işlemi başarısız'); 
    }
  };

  const handleRecurSubmit = async (e) => {
    e.preventDefault(); 
    setSubmitting(true);
    try { 
      await axios.post(`${API_URL}/sessions/recurring`, {
        ...recurData,
        clinic_id: clinic?.id,
        therapist_id: recurData.therapist_id || null,
      }); 
      setModalMode(null); 
      refresh(); 
    } catch { 
      alert('Tekrarlayan seanslar oluşturulurken bir hata oluştu'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const updateSessionStatus = async (id, status, sessionData) => {
    try {
      await axios.put(`${API_URL}/sessions/${id}`, { status });
      refresh();

      // Otomatik WhatsApp bildirim tetiklemesi
      if (status === 'tamamlandi' && sessionData?.patient?.phone) {
        axios.post(`${API_URL}/whatsapp/send-template`, {
          clinic_id: clinic?.id,
          to_phone: sessionData.patient.phone,
          type: 'completed',
          patient_name: sessionData.patient.full_name,
          date: sessionData.session_date,
          time: sessionData.session_time?.substring(0, 5),
          therapist_name: sessionData.therapist?.full_name,
          treatment_name: sessionData.treatment?.name
        }).catch(err => console.error(err));
      }
    } catch {
      alert('Durum güncellenemedi');
    }
  };

  const weekLabel = `${weekDays[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
        
        {/* Navigation & Therapist Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {viewMode === 'calendar' && (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors"
                title="Önceki Hafta"
              >
                <ChevronLeft size={16}/>
              </button>
              <button 
                onClick={() => setWeekStart(getMonday(new Date()))}
                className="h-8 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-[12px] font-semibold text-gray-700 transition-colors"
              >
                Bugün
              </button>
              <button 
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors"
                title="Sonraki Hafta"
              >
                <ChevronRight size={16}/>
              </button>
              <span className="text-[13px] font-bold text-gray-800 ml-1.5">{weekLabel}</span>
            </div>
          )}

          {/* Therapist Filter */}
          {staff.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Stethoscope size={15} className="text-gray-400" />
              <select
                value={selectedTherapistId}
                onChange={(e) => setSelectedTherapistId(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-[12px] font-semibold text-gray-700 outline-none shadow-2xs"
              >
                <option value="all">Tüm Terapistler ({staff.length})</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.title || 'Fzt.'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex bg-gray-100 p-0.5 rounded-xl text-[12px] font-medium text-gray-600">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'hover:text-gray-900'}`}
            >
              <Calendar size={13} /> Takvim
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'hover:text-gray-900'}`}
            >
              <ListFilter size={13} /> Liste ({filteredSessions.length})
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={() => exportSessionsToExcel(sessions)}
            className="h-8 px-3 rounded-lg text-[12px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-all"
            title="Tüm Seansları Excel Olarak İndir"
          >
            <FileSpreadsheet size={14} /> <span className="hidden sm:inline">Excel</span>
          </button>

          <button 
            onClick={() => {
              setFormData({ patient_id: '', treatment_id: treatments[0]?.id || '', therapist_id: staff[0]?.id || '', session_date: today, session_time: '09:00', notes: '' });
              setModalMode('single');
            }}
            className="h-8 px-3 rounded-lg text-[12px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Plus size={14}/> Tekli Seans
          </button>

          <button 
            onClick={() => {
              setRecurData({ patient_id: '', treatment_id: treatments[0]?.id || '', therapist_id: staff[0]?.id || '', session_time: '10:00', start_date: today, repeat_type: 'weekly', repeat_count: 8 });
              setModalMode('recurring');
            }}
            className="h-8 px-3 rounded-lg text-[12px] font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Repeat size={13}/> Tekrarlayan
          </button>
        </div>
      </div>

      {/* MODAL: Single Session */}
      {modalMode === 'single' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setModalMode(null)} />
          <form onSubmit={handleSingleSubmit} className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 w-full max-w-lg z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
              <h3 className="text-[16px] font-bold text-gray-900">Yeni Seans / Randevu Ekle</h3>
              <button type="button" onClick={() => setModalMode(null)} className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center">
                <X size={18}/>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Hasta *</label>
                <select required value={formData.patient_id} className="input-field" onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                  <option value="">Hasta seçiniz...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}{p.complaint ? ` — (${p.complaint})` : ''}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Tedavi *</label>
                  <select required value={formData.treatment_id} className="input-field" onChange={e => setFormData({...formData, treatment_id: e.target.value})}>
                    <option value="">Tedavi seçiniz...</option>
                    {treatments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.duration_minutes} dk) — {t.price} ₺</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Fizyoterapist</label>
                  <select value={formData.therapist_id} className="input-field" onChange={e => setFormData({...formData, therapist_id: e.target.value})}>
                    <option value="">Terapist seçiniz...</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.title || 'Fzt.'})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Tarih *</label>
                  <input required type="date" value={formData.session_date} className="input-field" onChange={e => setFormData({...formData, session_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Saat *</label>
                  <input required type="time" value={formData.session_time} className="input-field" onChange={e => setFormData({...formData, session_time: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Seans Notu</label>
                <input type="text" placeholder="Örn: 2. bölge uygulaması..." value={formData.notes || ''} className="input-field" onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setModalMode(null)} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Vazgeç
              </button>
              <button type="submit" disabled={submitting} className="h-10 px-6 rounded-xl text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors">
                {submitting ? 'Kaydediliyor...' : 'Randevuyu Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Recurring Session */}
      {modalMode === 'recurring' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setModalMode(null)} />
          <form onSubmit={handleRecurSubmit} className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 w-full max-w-xl z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
              <h3 className="text-[16px] font-bold text-gray-900">Tekrarlayan Seans Paketi</h3>
              <button type="button" onClick={() => setModalMode(null)} className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center">
                <X size={18}/>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Hasta *</label>
                <select required value={recurData.patient_id} className="input-field" onChange={e => setRecurData({...recurData, patient_id: e.target.value})}>
                  <option value="">Hasta seçiniz...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Tedavi *</label>
                  <select required value={recurData.treatment_id} className="input-field" onChange={e => setRecurData({...recurData, treatment_id: e.target.value})}>
                    <option value="">Tedavi seçiniz...</option>
                    {treatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Fizyoterapist</label>
                  <select value={recurData.therapist_id} className="input-field" onChange={e => setRecurData({...recurData, therapist_id: e.target.value})}>
                    <option value="">Terapist seçiniz...</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.title || 'Fzt.'})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Başlangıç Tarihi *</label>
                  <input required type="date" value={recurData.start_date} className="input-field" onChange={e => setRecurData({...recurData, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Saat *</label>
                  <input required type="time" value={recurData.session_time} className="input-field" onChange={e => setRecurData({...recurData, session_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Seans Sayısı *</label>
                  <input required type="number" min="2" max="30" value={recurData.repeat_count} className="input-field" onChange={e => setRecurData({...recurData, repeat_count: parseInt(e.target.value, 10) || 8})} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setModalMode(null)} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Vazgeç
              </button>
              <button type="submit" disabled={submitting} className="h-10 px-6 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors">
                {submitting ? 'Oluşturuluyor...' : 'Paketi Oluştur'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Edit Session */}
      {modalMode === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setModalMode(null)} />
          <form onSubmit={handleEditSubmit} className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 w-full max-w-lg z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
              <h3 className="text-[16px] font-bold text-gray-900">Seansı Düzenle</h3>
              <button type="button" onClick={() => setModalMode(null)} className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center">
                <X size={18}/>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Tarih *</label>
                  <input required type="date" value={formData.session_date} className="input-field" onChange={e => setFormData({...formData, session_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Saat *</label>
                  <input required type="time" value={formData.session_time} className="input-field" onChange={e => setFormData({...formData, session_time: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Fizyoterapist</label>
                <select value={formData.therapist_id} className="input-field" onChange={e => setFormData({...formData, therapist_id: e.target.value})}>
                  <option value="">Terapist seçiniz...</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.title || 'Fzt.'})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Not</label>
                <input type="text" value={formData.notes || ''} className="input-field" onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setModalMode(null)} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                İptal
              </button>
              <button type="submit" disabled={submitting} className="h-10 px-6 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors">
                {submitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main View: Calendar or List */}
      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden mt-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200/80">
                  <th className="w-16 px-2 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-r border-gray-200/60 text-center">
                    SAAT
                  </th>
                  {weekDays.map((day, i) => {
                    const dateStr = formatDate(day);
                    const isToday = dateStr === today;
                    return (
                      <th key={i} className={`px-2 py-2.5 text-center border-r border-gray-200/60 last:border-r-0 ${isToday ? 'bg-emerald-50/50' : ''}`}>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isToday ? 'text-emerald-700' : 'text-gray-500'}`}>
                          {SHORT_DAYS[i]}
                        </span>
                        <div className="mt-0.5 flex items-center justify-center">
                          <span className={`text-[13px] font-extrabold w-6 h-6 rounded-full flex items-center justify-center ${isToday ? 'text-white bg-emerald-600 shadow-2xs' : 'text-gray-800'}`}>
                            {day.getDate()}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60">
                {HOURS.map((hour) => (
                  <tr key={hour} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-2 py-1.5 text-[11px] font-bold text-gray-400 border-r border-gray-200/60 bg-gray-50/40 text-center align-top pt-2.5">
                      {hour}
                    </td>

                    {weekDays.map((day, di) => {
                      const dateStr = formatDate(day);
                      const isToday = dateStr === today;
                      const cellSessions = sessionMap[dateStr]?.[hour] || [];
                      return (
                        <td
                          key={di}
                          onClick={() => handleCellClick(dateStr, hour)}
                          className={`border-r border-gray-200/60 last:border-r-0 align-top transition-colors cursor-pointer relative ${
                            cellSessions.length === 0 
                              ? (isToday ? 'bg-emerald-100/60 hover:bg-emerald-200/70 text-emerald-800' : 'bg-emerald-50/40 hover:bg-emerald-100/60 text-emerald-700')
                              : (isToday ? 'bg-emerald-50/10' : 'bg-transparent')
                          }`}
                        >
                          <div className={`h-full min-h-[65px] ${cellSessions.length > 0 ? 'p-1 space-y-1' : 'flex flex-col items-center justify-center'}`}>
                            {cellSessions.map((s) => {
                              const isReq = s._type === 'request';
                              const sn = isReq ? null : getSessionNumber(s);
                              const isDone = !isReq && s.status === 'tamamlandi';

                              let cardClass = isReq 
                                ? 'bg-amber-50 border-amber-200 text-amber-950 border-l-4 border-l-amber-500'
                                : isDone 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950 border-l-4 border-l-emerald-500'
                                  : 'bg-white border-blue-200 text-slate-900 border-l-4 border-l-blue-500 shadow-2xs';

                              return (
                                <div
                                  key={isReq ? `req-${s.id}` : `ses-${s.id}`}
                                  onClick={(e) => e.stopPropagation()} 
                                  className={`text-[11px] rounded-lg p-2 border transition-all hover:shadow-sm flex flex-col gap-1 ${cardClass}`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <button 
                                      onClick={() => onPatientClick?.(s.patient_id || s.patient?.id)} 
                                      className="font-bold text-[11px] hover:underline text-left truncate flex-1 leading-tight"
                                      title={s.patient?.full_name}
                                    >
                                      {s.patient?.full_name}
                                    </button>
                                    {!isReq && sn && (
                                      <span className="text-[9px] font-bold px-1 py-0.5 rounded-sm bg-black/5 shrink-0">
                                        {sn.current}/{sn.total}
                                      </span>
                                    )}
                                    {isReq && (
                                      <span className="text-[9px] font-bold px-1 py-0.5 rounded-sm bg-amber-200/70 text-amber-800 shrink-0 uppercase">Talep</span>
                                    )}
                                  </div>

                                  <div className="text-[10px] opacity-75 truncate font-medium leading-none">
                                    {s.treatment?.name}
                                  </div>

                                  {/* Therapist Badge */}
                                  {s.therapist && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.therapist.color || '#059669' }} />
                                      <span className="text-[10px] font-semibold text-gray-700 truncate">{s.therapist.full_name}</span>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  {!isReq && (
                                    <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-black/5">
                                      <button
                                        onClick={() => updateSessionStatus(s.id, isDone ? 'bekliyor' : 'tamamlandi', s)}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                          isDone ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                      >
                                        {isDone ? '✓ Tamam' : 'Tamamla'}
                                      </button>

                                      <div className="flex items-center gap-0.5">
                                        <button
                                          onClick={() => handleEditClick(s)}
                                          className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                          title="Düzenle"
                                        >
                                          <Edit2 size={11} />
                                        </button>
                                        <button
                                          onClick={() => deleteSession(s.id)}
                                          className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                                          title="Sil"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Hasta</th>
                  <th className="text-left px-4 py-3">Tedavi</th>
                  <th className="text-left px-4 py-3">Fizyoterapist</th>
                  <th className="text-left px-4 py-3">Tarih &amp; Saat</th>
                  <th className="text-left px-4 py-3">Durum</th>
                  <th className="text-right px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px]">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Seans kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((s) => {
                    const isDone = s.status === 'tamamlandi';
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {s.patient?.full_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {s.treatment?.name}
                        </td>
                        <td className="px-4 py-3">
                          {s.therapist ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-semibold text-gray-800">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.therapist.color || '#059669' }} />
                              {s.therapist.full_name}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[12px]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-mono text-[12px]">
                          {s.session_date} {s.session_time?.substring(0, 5)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => updateSessionStatus(s.id, isDone ? 'bekliyor' : 'tamamlandi', s)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {isDone ? '✓ Tamamlandı' : '● Bekliyor'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEditClick(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => deleteSession(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
