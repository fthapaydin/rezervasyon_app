import { useState, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, X, ChevronLeft, ChevronRight, Clock, CheckCircle2, Repeat, 
  MessageCircle, Smartphone, Calendar, ListFilter, FileSpreadsheet,
  Edit2, Trash2 
} from 'lucide-react';
import { sendWhatsAppReminder, sendSmsReminder } from '../lib/reminder';
import { exportSessionsToExcel } from '../lib/excelExport';
import { API_URL } from '../lib/api';

const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const SHORT_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff); date.setHours(0,0,0,0);
  return date;
}
function formatDate(d) { return d.toISOString().split('T')[0]; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

export default function Sessions({ sessions, patients, treatments, refresh, onPatientClick }) {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [modalMode, setModalMode] = useState(null); // null | 'single' | 'recurring' | 'edit'
  const [formData, setFormData] = useState({ patient_id: '', treatment_id: '', session_date: '', session_time: '', notes: '' });
  const [recurData, setRecurData] = useState({ patient_id: '', treatment_id: '', session_time: '', start_date: '', repeat_type: 'weekly', repeat_count: 8 });
  const [submitting, setSubmitting] = useState(false);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = formatDate(new Date());

  const sessionMap = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      const dk = s.session_date, tk = s.session_time?.substring(0, 5);
      if (!map[dk]) map[dk] = {};
      if (!map[dk][tk]) map[dk][tk] = [];
      map[dk][tk].push({ ...s, _type: 'session' });
    });
    (requests || []).forEach(r => {
      if (r.status === 'bekliyor') {
        const dk = r.requested_date, tk = r.requested_time?.substring(0, 5);
        if (!map[dk]) map[dk] = {};
        if (!map[dk][tk]) map[dk][tk] = [];
        map[dk][tk].push({ ...r, _type: 'request' });
      }
    });
    return map;
  }, [sessions, requests]);

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
      await axios.post(`${API_URL}/sessions`, formData); 
      setModalMode(null); 
      refresh(); 
    } catch { 
      alert('Seans oluşturulurken bir hata oluştu'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleEditClick = (session) => {
    setFormData({
      id: session.id,
      patient_id: session.patient_id,
      treatment_id: session.treatment_id,
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
      await axios.put(`${API_URL}/sessions/${formData.id}`, formData); 
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
      await axios.post(`${API_URL}/sessions/recurring`, recurData); 
      setModalMode(null); 
      refresh(); 
    } catch { 
      alert('Tekrarlayan seanslar oluşturulurken bir hata oluştu'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const completeSession = async (id) => {
    try { 
      await axios.put(`${API_URL}/sessions/${id}`, { status: 'tamamlandi' }); 
      refresh(); 
    } catch { 
      alert('İşlem başarısız'); 
    }
  };

  const approveRequest = async (id) => {
    try {
      await axios.put(`${API_URL}/session-requests/${id}`, { status: 'onaylandi' });
      refresh();
    } catch {
      alert('Onaylama işlemi başarısız');
    }
  };

  const weekLabel = `${weekDays[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} – ${weekDays[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  return (
    <div className="space-y-5">
      {/* Top Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {viewMode === 'calendar' && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors shadow-2xs">
                <ChevronLeft size={16}/>
              </button>
              <button onClick={() => setWeekStart(getMonday(new Date()))} className="h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-semibold text-gray-700 transition-colors shadow-2xs">
                Bugün
              </button>
              <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors shadow-2xs">
                <ChevronRight size={16}/>
              </button>
              <span className="text-[14px] font-bold text-gray-800 ml-2">{weekLabel}</span>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex bg-gray-100 p-0.5 rounded-xl text-[12px] font-medium text-gray-600 ml-0 lg:ml-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'hover:text-gray-900'}`}
            >
              <Calendar size={14} /> Takvim Görünümü
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'hover:text-gray-900'}`}
            >
              <ListFilter size={14} /> Liste ({sessions.length})
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Excel Export Button */}
          <button
            onClick={() => exportSessionsToExcel(sessions)}
            className="h-9 px-3.5 rounded-xl text-[12px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.98]"
            title="Tüm Seansları Excel Olarak İndir"
          >
            <FileSpreadsheet size={15} /> Excel İndir
          </button>

          <button 
            onClick={() => {
              setFormData({ patient_id: '', treatment_id: treatments[0]?.id || '', session_date: today, session_time: '09:00', notes: '' });
              setModalMode('single');
            }}
            className="h-9 px-3.5 rounded-xl text-[12px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus size={15}/> Tekli Seans Ekle
          </button>

          <button 
            onClick={() => {
              setRecurData({ patient_id: '', treatment_id: treatments[0]?.id || '', session_time: '10:00', start_date: today, repeat_type: 'weekly', repeat_count: 8 });
              setModalMode('recurring');
            }}
            className="h-9 px-3.5 rounded-xl text-[12px] font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
          >
            <Repeat size={14}/> Tekrarlayan Seans
          </button>
        </div>
      </div>

      {/* MODAL DIALOG: Single Session */}
      {modalMode === 'single' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in" onClick={() => setModalMode(null)} />
          <form onSubmit={handleSingleSubmit} className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 w-full max-w-lg z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
              <div>
                <h3 className="text-[16px] font-bold text-gray-900">Yeni Randevu Oluştur</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">Seçilen saat ve güne randevu tanımlayın.</p>
              </div>
              <button type="button" onClick={() => setModalMode(null)} className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center">
                <X size={18}/>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Hasta Seçin <span className="text-red-500">*</span></label>
                <select required value={formData.patient_id} className="input-field font-medium text-gray-800" onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                  <option value="">Hasta seçiniz...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}{p.complaint ? ` — (${p.complaint})` : ''}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Uygulanacak Tedavi <span className="text-red-500">*</span></label>
                <select required value={formData.treatment_id} className="input-field font-medium text-gray-800" onChange={e => setFormData({...formData, treatment_id: e.target.value})}>
                  <option value="">Tedavi seçiniz...</option>
                  {treatments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.duration_minutes} dk) — {t.price} ₺</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Randevu Tarihi <span className="text-red-500">*</span></label>
                  <input required type="date" value={formData.session_date} className="input-field font-medium" onChange={e => setFormData({...formData, session_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Saat <span className="text-red-500">*</span></label>
                  <input required type="time" value={formData.session_time} className="input-field font-medium" onChange={e => setFormData({...formData, session_time: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Seans Notu (Opsiyonel)</label>
                <input type="text" placeholder="Örn: 2. bölge masajı uygulanacak..." value={formData.notes || ''} className="input-field" onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setModalMode(null)} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Vazgeç
              </button>
              <button type="submit" disabled={submitting} className="h-10 px-6 rounded-xl text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors flex items-center gap-1.5">
                {submitting ? 'Kaydediliyor...' : 'Randevuyu Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DIALOG: Recurring Session */}
      {modalMode === 'recurring' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in" onClick={() => setModalMode(null)} />
          <form onSubmit={handleRecurSubmit} className="relative bg-white rounded-2xl border border-blue-200 shadow-2xl p-6 w-full max-w-xl z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
              <div>
                <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                  <Repeat size={16} className="text-blue-600" /> Tekrarlayan Randevu Planı
                </h3>
                <p className="text-[12px] text-gray-400 mt-0.5">Tek tıkla haftalık veya günlük periyotlarda toplu seans oluşturun.</p>
              </div>
              <button type="button" onClick={() => setModalMode(null)} className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center">
                <X size={18}/>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Hasta Seçin <span className="text-red-500">*</span></label>
                <select required value={recurData.patient_id} className="input-field font-medium text-gray-800" onChange={e => setRecurData({...recurData, patient_id: e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Tedavi <span className="text-red-500">*</span></label>
                <select required value={recurData.treatment_id} className="input-field font-medium text-gray-800" onChange={e => setRecurData({...recurData, treatment_id: e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {treatments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.price} ₺)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Başlangıç Tarihi <span className="text-red-500">*</span></label>
                <input required type="date" value={recurData.start_date} className="input-field font-medium" onChange={e => setRecurData({...recurData, start_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Saat <span className="text-red-500">*</span></label>
                <input required type="time" value={recurData.session_time} className="input-field font-medium" onChange={e => setRecurData({...recurData, session_time: e.target.value})} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Tekrar Periyodu</label>
                <select value={recurData.repeat_type} className="input-field font-medium" onChange={e => setRecurData({...recurData, repeat_type: e.target.value})}>
                  <option value="weekly">Her Hafta Aynı Gün</option>
                  <option value="biweekly">Haftada 2 Kez</option>
                  <option value="daily">Her Gün</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Toplam Seans Sayısı</label>
                <input type="number" value={recurData.repeat_count} min={1} max={52} className="input-field font-bold text-blue-700" onChange={e => setRecurData({...recurData, repeat_count: parseInt(e.target.value) || 1})} />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setModalMode(null)} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Vazgeç
              </button>
              <button type="submit" disabled={submitting} className="h-10 px-6 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors">
                {submitting ? 'Oluşturuluyor...' : `${recurData.repeat_count || 8} Seans Planla`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DIALOG: Edit Session */}
      {modalMode === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in" onClick={() => setModalMode(null)} />
          <form onSubmit={handleEditSubmit} className="relative bg-white rounded-2xl border border-blue-200 shadow-2xl p-6 w-full max-w-lg z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
              <div>
                <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                  <Edit2 size={16} className="text-blue-600" /> Seans Düzenle
                </h3>
              </div>
              <button type="button" onClick={() => setModalMode(null)} className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center">
                <X size={18}/>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Hasta Seçin <span className="text-red-500">*</span></label>
                <select required value={formData.patient_id} className="input-field font-medium text-gray-800" onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                  <option value="">Hasta seçiniz...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Uygulanacak Tedavi <span className="text-red-500">*</span></label>
                <select required value={formData.treatment_id} className="input-field font-medium text-gray-800" onChange={e => setFormData({...formData, treatment_id: e.target.value})}>
                  <option value="">Tedavi seçiniz...</option>
                  {treatments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.duration_minutes} dk) — {t.price} ₺</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Randevu Tarihi <span className="text-red-500">*</span></label>
                  <input required type="date" value={formData.session_date} className="input-field font-medium" onChange={e => setFormData({...formData, session_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Saat <span className="text-red-500">*</span></label>
                  <input required type="time" value={formData.session_time} className="input-field font-medium" onChange={e => setFormData({...formData, session_time: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Seans Notu (Opsiyonel)</label>
                <input type="text" placeholder="Örn: 2. bölge masajı uygulanacak..." value={formData.notes || ''} className="input-field" onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setModalMode(null)} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                İptal
              </button>
              <button type="submit" disabled={submitting} className="h-10 px-6 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors flex items-center gap-1.5">
                {submitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main View: Large Weekly Calendar or List */}
      {viewMode === 'calendar' ? (
        /* EXPANDED LARGE WEEKLY CALENDAR VIEW */
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="w-20 px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-r border-gray-200 text-center">
                    SAAT
                  </th>
                  {weekDays.map((day, i) => {
                    const dateStr = formatDate(day);
                    const isToday = dateStr === today;
                    return (
                      <th key={i} className={`px-3 py-3.5 text-center border-r border-gray-200 last:border-r-0 ${isToday ? 'bg-emerald-50/60' : ''}`}>
                        <span className={`text-[12px] font-bold uppercase tracking-wider ${isToday ? 'text-emerald-700' : 'text-gray-500'}`}>
                          {DAY_NAMES[i]}
                        </span>
                        <div className="mt-1 flex items-center justify-center">
                          <span className={`text-[15px] font-black w-8 h-8 rounded-full flex items-center justify-center transition-all ${isToday ? 'text-white bg-emerald-600 shadow-sm' : 'text-gray-800'}`}>
                            {day.getDate()}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {HOURS.map(hour => (
                  <tr key={hour} className="group hover:bg-slate-50/30 transition-colors">
                    {/* Hour Column */}
                    <td className="px-3 py-2 text-[12px] font-bold text-gray-400 border-r border-gray-200 bg-gray-50/40 text-center align-top pt-3">
                      {hour}
                    </td>

                    {/* Day Slots */}
                    {weekDays.map((day, di) => {
                      const dateStr = formatDate(day);
                      const isToday = dateStr === today;
                      const cellSessions = sessionMap[dateStr]?.[hour] || [];
                      return (
                        <td
                          key={di}
                          onClick={() => handleCellClick(dateStr, hour)}
                          className={`p-1 border-r border-gray-100 last:border-r-0 align-top transition-colors cursor-pointer relative group/cell min-h-[70px] ${
                            isToday ? 'bg-emerald-50/20 hover:bg-emerald-50/50' : 'hover:bg-teal-50/30'
                          }`}
                        >
                          <div className="space-y-1 h-full">
                            {cellSessions.map(s => {
                              const isReq = s._type === 'request';
                              const sn = isReq ? null : getSessionNumber(s);
                              const isDone = !isReq && s.status === 'tamamlandi';
                              
                              let cardClass = isReq 
                                ? 'bg-amber-50 border-amber-200/80 text-amber-950 border-l-4 border-l-amber-500'
                                : isDone 
                                  ? 'bg-emerald-50 border-emerald-200/80 text-emerald-950 border-l-4 border-l-emerald-500'
                                  : 'bg-white border-blue-200/90 text-slate-900 border-l-4 border-l-blue-500 shadow-sm';

                              return (
                                <div
                                  key={isReq ? `req-${s.id}` : `ses-${s.id}`}
                                  onClick={(e) => e.stopPropagation()} 
                                  className={`text-[11px] rounded-lg p-2 border transition-all hover:shadow-md flex flex-col gap-1 ${cardClass}`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <button 
                                      onClick={() => onPatientClick?.(s.patient_id || s.patient?.id)} 
                                      className="font-bold text-[11px] hover:underline text-left truncate flex-1 leading-tight"
                                      title={s.patient?.full_name}
                                    >
                                      {s.patient?.full_name}
                                    </button>
                                    {!isReq && (
                                      <span className="text-[9px] font-bold px-1 py-0.5 rounded-sm bg-black/5 shrink-0">
                                        {sn.current}/{sn.total}
                                      </span>
                                    )}
                                    {isReq && (
                                      <span className="text-[9px] font-bold px-1 py-0.5 rounded-sm bg-amber-200/50 text-amber-800 shrink-0 uppercase">Talep</span>
                                    )}
                                  </div>

                                  <div className="text-[10px] opacity-70 truncate font-medium leading-none mb-1">
                                    {s.treatment?.name}
                                  </div>

                                  <div className="flex flex-col gap-1 mt-auto pt-1 border-t border-black/5">
                                    {isReq ? (
                                      <div className="flex items-center gap-1">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); approveRequest(s.id); }} 
                                          className="flex-1 text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded py-1 transition-colors flex items-center justify-center gap-1 shadow-sm"
                                        >
                                          <CheckCircle2 size={11}/> Onayla
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-1">
                                          {!isDone && (
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); completeSession(s.id); }} 
                                              className="flex-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/50 hover:bg-emerald-100 rounded py-0.5 transition-colors flex items-center justify-center gap-1"
                                            >
                                              <CheckCircle2 size={10}/> Bitir
                                            </button>
                                          )}
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); sendWhatsAppReminder(s); }} 
                                            className="px-1.5 py-0.5 flex-1 text-[9px] font-bold text-emerald-800 bg-emerald-100/50 hover:bg-emerald-100 rounded flex items-center justify-center gap-1 transition-colors"
                                          >
                                            <MessageCircle size={10} className="text-emerald-700" />
                                            WA
                                          </button>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditClick(s); }} 
                                            className="flex-1 text-[9px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded py-0.5 transition-colors flex items-center justify-center gap-1"
                                          >
                                            <Edit2 size={9}/> Düzenle
                                          </button>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} 
                                            className="px-1.5 py-0.5 text-[9px] font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded flex items-center justify-center transition-colors"
                                          >
                                            <Trash2 size={10}/>
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {cellSessions.length === 0 && (
                              <div className="h-full min-h-[40px] rounded-lg border border-dashed border-transparent group-hover/cell:border-emerald-300 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-all text-emerald-600 text-[10px] font-bold gap-1 bg-emerald-50/50">
                                <Plus size={12} /> Ekle
                              </div>
                            )}
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
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tarih & Saat</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Hasta</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tedavi / Hizmet</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Seans Sırası</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="text-center px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Hatırlatma</th>
                  <th className="text-right px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-[13px] text-gray-400">Henüz randevu kaydı bulunmuyor.</td></tr>
                )}
                {sessions.map(s => {
                  const sn = getSessionNumber(s);
                  const isDone = s.status === 'tamamlandi';
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-[13px] font-bold text-gray-800">{new Date(s.session_date).toLocaleDateString('tr-TR')}</p>
                        <p className="text-[12px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5"><Clock size={12}/> {s.session_time?.substring(0,5)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => onPatientClick?.(s.patient_id || s.patient?.id)} className="text-[13px] font-bold text-gray-900 hover:text-emerald-700 hover:underline transition-colors block text-left">
                          {s.patient?.full_name}
                        </button>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">{s.patient?.phone}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[13px] font-medium text-gray-700">{s.treatment?.name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-[11px] font-bold">
                          {sn.current} / {sn.total}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            <CheckCircle2 size={12}/> Tamamlandı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                            <Clock size={12}/> Bekliyor
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => sendWhatsAppReminder(s)}
                            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                            title="WhatsApp ile Hatırlat"
                          >
                            <MessageCircle size={13} /> WhatsApp
                          </button>
                          <button
                            onClick={() => sendSmsReminder(s)}
                            className="h-8 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="SMS ile Hatırlat"
                          >
                            <Smartphone size={13} /> SMS
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isDone && (
                            <button
                              onClick={() => completeSession(s.id)}
                              className="h-8 px-2 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="Tamamla"
                            >
                              <CheckCircle2 size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditClick(s)}
                            className="h-8 px-2 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => deleteSession(s.id)}
                            className="h-8 px-2 rounded-lg text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
