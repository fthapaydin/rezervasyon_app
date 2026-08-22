import { useState, useMemo } from 'react';
import axios from 'axios';
import { Plus, X, ChevronLeft, ChevronRight, Clock, CheckCircle2, Repeat } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';
const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const HOURS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

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
  const [formMode, setFormMode] = useState(null); // null | 'single' | 'recurring'
  const [formData, setFormData] = useState({ patient_id: '', treatment_id: '', session_date: '', session_time: '' });
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
      map[dk][tk].push(s);
    });
    return map;
  }, [sessions]);

  const getSessionNumber = (session) => {
    const ps = sessions.filter(s => s.patient_id === session.patient_id).sort((a, b) => a.session_date.localeCompare(b.session_date));
    const idx = ps.findIndex(s => s.id === session.id);
    return { current: idx + 1, total: session.patient?.total_sessions || ps.length };
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try { await axios.post(`${API_URL}/sessions`, formData); setFormMode(null); refresh(); }
    catch { alert('Hata'); } finally { setSubmitting(false); }
  };

  const handleRecurSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try { await axios.post(`${API_URL}/sessions/recurring`, recurData); setFormMode(null); refresh(); }
    catch { alert('Hata'); } finally { setSubmitting(false); }
  };

  const completeSession = async (id) => {
    try { await axios.put(`${API_URL}/sessions/${id}`, { status: 'tamamlandi' }); refresh(); }
    catch { alert('Hata'); }
  };

  const weekLabel = `${weekDays[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500"><ChevronLeft size={16}/></button>
          <button onClick={() => setWeekStart(getMonday(new Date()))} className="h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-medium text-gray-600">Bugün</button>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500"><ChevronRight size={16}/></button>
          <span className="text-[13px] font-semibold text-gray-700 ml-2 hidden sm:inline">{weekLabel}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFormMode(formMode === 'single' ? null : 'single')}
            className={`h-9 px-3 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-all ${formMode === 'single' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'}`}>
            {formMode === 'single' ? <><X size={14}/> İptal</> : <><Plus size={14}/> Tekli Seans</>}
          </button>
          <button onClick={() => setFormMode(formMode === 'recurring' ? null : 'recurring')}
            className={`h-9 px-3 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-all ${formMode === 'recurring' ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}>
            {formMode === 'recurring' ? <><X size={14}/> İptal</> : <><Repeat size={14}/> Tekrarlayan</>}
          </button>
        </div>
      </div>

      {/* Single form */}
      {formMode === 'single' && (
        <form onSubmit={handleSingleSubmit} className="bg-white rounded-xl border border-gray-200/80 p-5">
          <h3 className="text-[13px] font-semibold text-gray-800 mb-4">Tekli Randevu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Hasta *</label>
              <select required className="input-field" onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                <option value="">Seçiniz</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}{p.complaint ? ` — ${p.complaint}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Tedavi *</label>
              <select required className="input-field" onChange={e => setFormData({...formData, treatment_id: e.target.value})}>
                <option value="">Seçiniz</option>
                {treatments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.duration_minutes}dk)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Tarih *</label>
              <input required type="date" className="input-field" onChange={e => setFormData({...formData, session_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Saat *</label>
              <input required type="time" className="input-field" onChange={e => setFormData({...formData, session_time: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" disabled={submitting} className="h-9 px-4 rounded-lg text-[12px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm">
              {submitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}

      {/* Recurring form */}
      {formMode === 'recurring' && (
        <form onSubmit={handleRecurSubmit} className="bg-white rounded-xl border border-blue-200 p-5">
          <h3 className="text-[13px] font-semibold text-gray-800 mb-1 flex items-center gap-1.5"><Repeat size={14} className="text-blue-600"/> Tekrarlayan Randevu</h3>
          <p className="text-[11px] text-gray-400 mb-4">Otomatik olarak birden fazla seans oluşturur.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Hasta *</label>
              <select required className="input-field" onChange={e => setRecurData({...recurData, patient_id: e.target.value})}>
                <option value="">Seçiniz</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Tedavi *</label>
              <select required className="input-field" onChange={e => setRecurData({...recurData, treatment_id: e.target.value})}>
                <option value="">Seçiniz</option>
                {treatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Saat *</label>
              <input required type="time" className="input-field" onChange={e => setRecurData({...recurData, session_time: e.target.value})} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Başlangıç Tarihi *</label>
              <input required type="date" className="input-field" onChange={e => setRecurData({...recurData, start_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Tekrar Sıklığı</label>
              <select className="input-field" onChange={e => setRecurData({...recurData, repeat_type: e.target.value})}>
                <option value="weekly">Her Hafta</option>
                <option value="biweekly">Haftada 2</option>
                <option value="daily">Her Gün</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Kaç Seans?</label>
              <input type="number" defaultValue={8} min={1} max={52} className="input-field" onChange={e => setRecurData({...recurData, repeat_count: parseInt(e.target.value)})} />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" disabled={submitting} className="h-9 px-4 rounded-lg text-[12px] font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm">
              {submitting ? 'Oluşturuluyor...' : `${recurData.repeat_count || 8} Seans Oluştur`}
            </button>
          </div>
        </form>
      )}

      {/* Weekly Calendar */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr>
                <th className="w-14 px-2 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-r border-gray-100 bg-gray-50/50 text-left">Saat</th>
                {weekDays.map((day, i) => {
                  const isToday = formatDate(day) === today;
                  return (
                    <th key={i} className={`px-1 py-2.5 text-center border-b border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-emerald-50/50' : 'bg-gray-50/50'}`}>
                      <span className={`text-[10px] font-semibold uppercase ${isToday ? 'text-emerald-600' : 'text-gray-400'}`}>{DAY_NAMES[i]}</span>
                      <br/>
                      <span className={`text-[13px] font-bold inline-block mt-0.5 ${isToday ? 'text-white bg-emerald-600 w-6 h-6 rounded-full leading-6' : 'text-gray-700'}`}>{day.getDate()}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td className="px-2 py-0.5 text-[10px] font-medium text-gray-400 border-r border-b border-gray-100 bg-gray-50/30 align-top pt-1.5">{hour}</td>
                  {weekDays.map((day, di) => {
                    const dateStr = formatDate(day);
                    const isToday = dateStr === today;
                    const cellSessions = sessionMap[dateStr]?.[hour] || [];
                    return (
                      <td key={di} className={`px-0.5 py-0.5 border-r border-b border-gray-100 last:border-r-0 align-top ${isToday ? 'bg-emerald-50/20' : ''}`} style={{ minHeight: 40 }}>
                        {cellSessions.map(s => {
                          const sn = getSessionNumber(s);
                          const isDone = s.status === 'tamamlandi';
                          return (
                            <div key={s.id} className={`text-[10px] rounded-md px-1.5 py-1 mb-0.5 border ${isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                              <div className="font-bold truncate">
                                <button onClick={() => onPatientClick?.(s.patient_id || s.patient?.id)} className="hover:underline truncate text-left w-full">{s.patient?.full_name}</button>
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="opacity-70 truncate">{s.treatment?.name}</span>
                                <span className="font-bold ml-1 shrink-0">{sn.current}/{sn.total}</span>
                              </div>
                              {!isDone && (
                                <button onClick={(e) => { e.stopPropagation(); completeSession(s.id); }} className="mt-0.5 w-full text-[9px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded py-0.5">
                                  ✓ Tamamla
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
