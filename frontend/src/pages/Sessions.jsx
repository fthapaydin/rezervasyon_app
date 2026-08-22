import { useState, useMemo } from 'react';
import axios from 'axios';
import { Plus, X, ChevronLeft, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const HOURS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0,0,0,0);
  return date;
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export default function Sessions({ sessions, patients, treatments, refresh, onPatientClick }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ patient_id: '', treatment_id: '', session_date: '', session_time: '' });
  const [submitting, setSubmitting] = useState(false);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const today = formatDate(new Date());

  // Build session map: { 'YYYY-MM-DD': { 'HH:MM': [session, ...] } }
  const sessionMap = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      const dateKey = s.session_date;
      const timeKey = s.session_time?.substring(0, 5);
      if (!map[dateKey]) map[dateKey] = {};
      if (!map[dateKey][timeKey]) map[dateKey][timeKey] = [];
      map[dateKey][timeKey].push(s);
    });
    return map;
  }, [sessions]);

  // Session counter for a patient
  const getSessionNumber = (session) => {
    const patientSessions = sessions
      .filter(s => s.patient_id === session.patient_id)
      .sort((a, b) => a.session_date.localeCompare(b.session_date) || a.session_time.localeCompare(b.session_time));
    const idx = patientSessions.findIndex(s => s.id === session.id);
    const total = session.patient?.total_sessions || patientSessions.length;
    return { current: idx + 1, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/sessions`, formData);
      setShowForm(false);
      refresh();
    } catch { alert('Hata'); }
    finally { setSubmitting(false); }
  };

  const completeSession = async (id) => {
    try {
      await axios.put(`${API_URL}/sessions/${id}`, { status: 'tamamlandi' });
      refresh();
    } catch { alert('Hata'); }
  };

  const prevWeek = () => setWeekStart(addDays(weekStart, -7));
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));
  const goToday = () => setWeekStart(getMonday(new Date()));

  // Format week label
  const weekLabel = `${weekDays[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors">
            <ChevronLeft size={16}/>
          </button>
          <button onClick={goToday} className="h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-medium text-gray-600 transition-colors">
            Bugün
          </button>
          <button onClick={nextWeek} className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors">
            <ChevronRight size={16}/>
          </button>
          <span className="text-[13px] font-semibold text-gray-700 ml-2">{weekLabel}</span>
        </div>

        <button onClick={() => setShowForm(!showForm)}
          className={`h-10 px-4 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-all ${showForm ? 'bg-gray-100 text-gray-600' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'}`}>
          {showForm ? <><X size={15}/> İptal</> : <><Plus size={15}/> Yeni Seans</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h3 className="text-[14px] font-semibold text-gray-800 mb-5">Yeni Randevu</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Hasta <span className="text-red-400">*</span></label>
              <select required className="input-field" onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                <option value="">Seçiniz...</option>
                {patients.map(p => {
                  const done = sessions.filter(s => s.patient_id === p.id && s.status === 'tamamlandi').length;
                  const plan = p.total_sessions || 10;
                  return <option key={p.id} value={p.id}>{p.full_name} ({done}/{plan} seans){p.complaint ? ` — ${p.complaint}` : ''}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Tedavi <span className="text-red-400">*</span></label>
              <select required className="input-field" onChange={e => setFormData({...formData, treatment_id: e.target.value})}>
                <option value="">Seçiniz...</option>
                {treatments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.duration_minutes} dk)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Tarih <span className="text-red-400">*</span></label>
              <input required type="date" className="input-field" onChange={e => setFormData({...formData, session_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Saat <span className="text-red-400">*</span></label>
              <input required type="time" className="input-field" onChange={e => setFormData({...formData, session_time: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end mt-5 gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 rounded-lg text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">Vazgeç</button>
            <button type="submit" disabled={submitting} className="h-9 px-5 rounded-lg text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm">
              {submitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}

      {/* Weekly Calendar */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="w-16 px-3 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-r border-gray-100 bg-gray-50/50 text-left">Saat</th>
                {weekDays.map((day, i) => {
                  const dateStr = formatDate(day);
                  const isToday = dateStr === today;
                  return (
                    <th key={i} className={`px-2 py-3 text-center border-b border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-emerald-50/50' : 'bg-gray-50/50'}`}>
                      <span className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? 'text-emerald-600' : 'text-gray-400'}`}>{DAY_NAMES[i]}</span>
                      <br/>
                      <span className={`text-[14px] font-bold ${isToday ? 'text-emerald-700 bg-emerald-100 w-7 h-7 rounded-full inline-flex items-center justify-center' : 'text-gray-700'}`}>
                        {day.getDate()}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td className="px-3 py-1 text-[11px] font-medium text-gray-400 border-r border-b border-gray-100 bg-gray-50/30 align-top pt-2">{hour}</td>
                  {weekDays.map((day, di) => {
                    const dateStr = formatDate(day);
                    const isToday = dateStr === today;
                    const cellSessions = sessionMap[dateStr]?.[hour] || [];
                    return (
                      <td key={di} className={`px-1 py-1 border-r border-b border-gray-100 last:border-r-0 align-top min-h-[48px] ${isToday ? 'bg-emerald-50/20' : ''}`}>
                        {cellSessions.map(s => {
                          const sn = getSessionNumber(s);
                          const isDone = s.status === 'tamamlandi';
                          return (
                            <div
                              key={s.id}
                              className={`text-[11px] rounded-lg px-2 py-1.5 mb-1 border cursor-default transition-colors ${
                                isDone
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-blue-50 border-blue-200 text-blue-800'
                              }`}
                            >
                              <div className="font-bold truncate leading-tight">
                                {onPatientClick
                                  ? <button onClick={() => onPatientClick(s.patient_id || s.patient?.id)} className="hover:underline text-left w-full truncate">{s.patient?.full_name}</button>
                                  : s.patient?.full_name
                                }
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[10px] opacity-70 truncate">{s.treatment?.name}</span>
                                <span className="text-[10px] font-bold ml-1 shrink-0">{sn.current}/{sn.total}</span>
                              </div>
                              {!isDone && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); completeSession(s.id); }}
                                  className="mt-1 w-full text-[10px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded py-0.5 transition-colors"
                                >
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
