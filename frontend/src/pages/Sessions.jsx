import { useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  DndContext, useDraggable, useDroppable, DragOverlay,
  PointerSensor, useSensor, useSensors, pointerWithin
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, X, ChevronLeft, ChevronRight, Clock, CheckCircle2, Repeat, 
  MessageCircle, Calendar, ListFilter, FileSpreadsheet,
  Edit2, Trash2, XCircle, Stethoscope, GripVertical, Move
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendWhatsAppReminder } from '../lib/reminder';
import { exportSessionsToExcel } from '../lib/excelExport';
import { API_URL } from '../lib/api';

const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const SHORT_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

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

/* ─── Draggable Session Card ─── */
function DraggableCard({ session, children }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: session._type === 'request' ? `req-${session.id}` : `ses-${session.id}`,
    data: session,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="relative group/card">
        {session._type !== 'request' && (
          <button
            {...listeners}
            className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-4 h-8 rounded-r-md bg-gray-200/80 hover:bg-blue-500 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-40 group-hover/card:opacity-100 transition-all z-20"
            title="Sürükle & Bırak"
          >
            <GripVertical size={10} className="text-gray-600 group-hover/card:text-white" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

/* ─── Droppable Cell ─── */
function DroppableCell({ id, date, hour, children, onClick, className }) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { date, hour }
  });

  return (
    <td
      ref={setNodeRef}
      onClick={onClick}
      className={`${className} ${isOver ? '!bg-blue-100 ring-2 ring-blue-500 ring-inset shadow-inner' : ''}`}
    >
      {children}
    </td>
  );
}

/* ─── Drag Overlay Card ─── */
function DragOverlayCard({ session }) {
  if (!session) return null;
  const isReq = session._type === 'request';
  const isDone = !isReq && session.status === 'tamamlandi';
  return (
    <div className={`w-[140px] text-[11px] rounded-xl p-2.5 border-2 shadow-2xl rotate-2 ${isReq ? 'bg-amber-50 border-amber-400' : isDone ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-blue-400'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Move size={11} className="text-blue-500 animate-pulse" />
        <span className="font-bold truncate">{session.patient?.full_name}</span>
      </div>
      <div className="text-[10px] opacity-60 truncate">{session.treatment?.name}</div>
      <div className="mt-1.5 text-[10px] font-bold text-blue-600 text-center bg-blue-50 rounded py-0.5">Yeni konuma bırakın</div>
    </div>
  );
}


export default function Sessions({ clinic, staff = [], sessions, requests = [], patients, treatments, refresh, onPatientClick }) {
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedTherapistId, setSelectedTherapistId] = useState('all');
  const [modalMode, setModalMode] = useState(null);
  const [formData, setFormData] = useState({ patient_id: '', treatment_id: '', therapist_id: '', session_date: '', session_time: '', notes: '' });
  const [recurData, setRecurData] = useState({ patient_id: '', treatment_id: '', therapist_id: '', session_time: '', start_date: '', repeat_type: 'weekly', repeat_count: 8 });
  const [submitting, setSubmitting] = useState(false);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [editSession, setEditSession] = useState(null);
  const [activeDragItem, setActiveDragItem] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = formatDate(new Date());

  const filteredSessions = useMemo(() => {
    if (selectedTherapistId === 'all') return sessions;
    return sessions.filter(s => (s.therapist_id === selectedTherapistId || s.therapist?.id === selectedTherapistId));
  }, [sessions, selectedTherapistId]);

  const filteredRequests = useMemo(() => {
    if (selectedTherapistId === 'all') return requests;
    return requests.filter(r => (r.therapist_id === selectedTherapistId || r.therapist?.id === selectedTherapistId));
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
      therapist_id: selectedTherapistId !== 'all' ? selectedTherapistId : (staff.length === 1 ? staff[0]?.id : ''),
      session_date: dateStr,
      session_time: hourStr,
      notes: ''
    });
    setModalMode('single');
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault(); 
    if (staff.length > 1 && !formData.therapist_id) {
      alert('Lütfen bir fizyoterapist seçiniz.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        patient_id: formData.patient_id,
        treatment_id: formData.treatment_id,
        therapist_id: formData.therapist_id || null,
        session_date: formData.session_date,
        session_time: formData.session_time,
        notes: formData.notes || null,
        status: 'bekliyor'
      };
      
      const { error } = await supabase.from('sessions').insert([payload]);
      if (error) throw error;
      
      axios.post(`${API_URL}/sessions`, payload).catch(() => {});
      setModalMode(null); 
      refresh(); 
    }
    catch (err) {
      console.error(err);
      alert('Seans oluşturulurken bir hata oluştu'); 
    } 
    finally { setSubmitting(false); }
  };

  const handleEditClick = (session) => {
    setEditSession(session);
    setFormData({
      id: session.id,
      patient_id: session.patient_id,
      treatment_id: session.treatment_id,
      therapist_id: session.therapist_id || session.therapist?.id || (staff.length === 1 ? staff[0]?.id : ''),
      session_date: session.session_date,
      session_time: session.session_time?.substring(0, 5),
      notes: session.notes || ''
    });
    setModalMode('edit');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault(); 
    if (staff.length > 1 && !formData.therapist_id) {
      alert('Lütfen bir fizyoterapist seçiniz.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        patient_id: formData.patient_id,
        treatment_id: formData.treatment_id,
        therapist_id: formData.therapist_id || null,
        session_date: formData.session_date,
        session_time: formData.session_time,
        notes: formData.notes || null,
      };

      const { error } = await supabase
        .from('sessions')
        .update(payload)
        .eq('id', formData.id);
      
      if (error) throw error;

      axios.put(`${API_URL}/sessions/${formData.id}`, payload).catch(() => {});
      setModalMode(null); 
      refresh(); 
    }
    catch (err) {
      console.error(err);
      alert('Seans güncellenirken bir hata oluştu'); 
    } 
    finally { setSubmitting(false); }
  };

  const deleteSession = async (id) => {
    if (!window.confirm("Bu seansı silmek istediğinize emin misiniz?")) return;
    try {
      await supabase.from('sessions').delete().eq('id', id);
      axios.delete(`${API_URL}/sessions/${id}`).catch(() => {});
      refresh();
    } catch { 
      alert('Silme işlemi başarısız'); 
    }
  };

  const handleRecurSubmit = async (e) => {
    e.preventDefault(); 
    if (staff.length > 1 && !recurData.therapist_id) {
      alert('Lütfen bir fizyoterapist seçiniz.');
      return;
    }
    setSubmitting(true);
    try { await axios.post(`${API_URL}/sessions/recurring`, { ...recurData, clinic_id: clinic?.id, therapist_id: recurData.therapist_id || null }); setModalMode(null); refresh(); }
    catch { alert('Tekrarlayan seanslar oluşturulurken bir hata oluştu'); } finally { setSubmitting(false); }
  };

  const updateSessionStatus = async (id, status, sessionData) => {
    try {
      await supabase.from('sessions').update({ status }).eq('id', id);
      axios.put(`${API_URL}/sessions/${id}`, { status }).catch(() => {});
      refresh();
      if (status === 'tamamlandi' && sessionData?.patient?.phone) {
        axios.post(`${API_URL}/whatsapp/send-template`, { clinic_id: clinic?.id, to_phone: sessionData.patient.phone, type: 'completed', patient_name: sessionData.patient.full_name, date: sessionData.session_date, time: sessionData.session_time?.substring(0, 5), therapist_name: sessionData.therapist?.full_name, treatment_name: sessionData.treatment?.name }).catch(err => console.error(err));
      }
    } catch { alert('Durum güncellenemedi'); }
  };

  const approveRequest = async (id) => {
    try { 
      await supabase.from('session_requests').update({ status: 'onaylandi' }).eq('id', id);
      axios.put(`${API_URL}/session-requests/${id}`, { status: 'onaylandi' }).catch(() => {});
      refresh(); 
    }
    catch { alert('Onaylama işlemi başarısız'); }
  };

  const rejectRequest = async (id) => {
    const reason = window.prompt("Reddetme gerekçesi (isteğe bağlı):");
    if (reason === null) return;
    try { 
      await supabase.from('session_requests').update({ status: 'reddedildi', rejection_reason: reason || null }).eq('id', id);
      axios.put(`${API_URL}/session-requests/${id}`, { status: 'reddedildi', rejection_reason: reason || null }).catch(() => {});
      refresh(); 
    }
    catch { alert('Reddetme işlemi başarısız'); }
  };

  /* ─── Drag & Drop ─── */
  const handleDragStart = useCallback((event) => { setActiveDragItem(event.active.data.current); }, []);

  const handleDragEnd = useCallback(async (event) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over || !active.data.current) return;

    const session = active.data.current;
    if (session._type === 'request') return;

    let targetDate = null;
    let targetTime = null;

    // 1. Droppable data kontrolü
    if (over.data?.current?.date && over.data?.current?.hour) {
      targetDate = over.data.current.date;
      targetTime = over.data.current.hour;
    } 
    // 2. ID string kontrolü (cell|2026-08-25|14:00)
    else if (typeof over.id === 'string' && over.id.startsWith('cell|')) {
      const parts = over.id.split('|');
      targetDate = parts[1];
      targetTime = parts[2];
    }
    // 3. Başka bir seans kartı üzerine bırakıldıysa
    else if (over.data?.current?.session_date && over.data?.current?.session_time) {
      targetDate = over.data.current.session_date;
      targetTime = over.data.current.session_time.substring(0, 5);
    }

    if (!targetDate || !targetTime) return;

    const oldDate = session.session_date;
    const oldTime = session.session_time?.substring(0, 5);
    if (targetDate === oldDate && targetTime === oldTime) return;

    try {
      // 1. Supabase'i doğrudan güncelle
      await supabase
        .from('sessions')
        .update({ session_date: targetDate, session_time: targetTime })
        .eq('id', session.id);

      // 2. Backend'e de güncelleme gönder
      axios.put(`${API_URL}/sessions/${session.id}`, {
        session_date: targetDate,
        session_time: targetTime
      }).catch(() => {});

      // 3. Verileri anında yenile
      refresh();
    } catch (err) {
      console.error('Drag drop error:', err);
      alert('Seans taşınırken bir hata oluştu');
    }
  }, [refresh]);

  const weekLabel = `${weekDays[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="space-y-4">
      {/* ═══ Top Toolbar ═══ */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {viewMode === 'calendar' && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors"><ChevronLeft size={16}/></button>
              <button onClick={() => setWeekStart(getMonday(new Date()))} className="h-8 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-[12px] font-semibold text-gray-700 transition-colors">Bugün</button>
              <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors"><ChevronRight size={16}/></button>
              <span className="text-[13px] font-bold text-gray-800 ml-1.5">{weekLabel}</span>
            </div>
          )}
          {staff.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Stethoscope size={15} className="text-gray-400" />
              <select value={selectedTherapistId} onChange={(e) => setSelectedTherapistId(e.target.value)} className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-[12px] font-semibold text-gray-700 outline-none">
                <option value="all">Tüm Terapistler ({staff.length})</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.title || 'Fzt.'})</option>)}
              </select>
            </div>
          )}
          <div className="flex bg-gray-100 p-0.5 rounded-xl text-[12px] font-medium text-gray-600">
            <button onClick={() => setViewMode('calendar')} className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'hover:text-gray-900'}`}><Calendar size={13} /> Takvim</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'hover:text-gray-900'}`}><ListFilter size={13} /> Liste ({filteredSessions.length})</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <button onClick={() => exportSessionsToExcel(sessions)} className="h-8 px-3 rounded-lg text-[12px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-all"><FileSpreadsheet size={14} /> <span className="hidden sm:inline">Excel</span></button>
          <button onClick={() => { setFormData({ patient_id: '', treatment_id: treatments[0]?.id || '', therapist_id: selectedTherapistId !== 'all' ? selectedTherapistId : (staff.length === 1 ? staff[0]?.id : ''), session_date: today, session_time: '09:00', notes: '' }); setModalMode('single'); }} className="h-8 px-3 rounded-lg text-[12px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"><Plus size={14}/> Tekli Seans</button>
          <button onClick={() => { setRecurData({ patient_id: '', treatment_id: treatments[0]?.id || '', therapist_id: selectedTherapistId !== 'all' ? selectedTherapistId : (staff.length === 1 ? staff[0]?.id : ''), session_time: '10:00', start_date: today, repeat_type: 'weekly', repeat_count: 8 }); setModalMode('recurring'); }} className="h-8 px-3 rounded-lg text-[12px] font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"><Repeat size={13}/> Tekrarlayan</button>
        </div>
      </div>

      {/* ═══ Modals ═══ */}
      {modalMode === 'single' && (
        <ModalShell title="Yeni Seans / Randevu Ekle" onClose={() => setModalMode(null)}>
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <FormField label="Hasta *"><select required value={formData.patient_id} className="input-field" onChange={e => setFormData({...formData, patient_id: e.target.value})}><option value="">Hasta seçiniz...</option>{patients.map(p => <option key={p.id} value={p.id}>{p.full_name}{p.complaint ? ` — (${p.complaint})` : ''}</option>)}</select></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tedavi *"><select required value={formData.treatment_id} className="input-field" onChange={e => setFormData({...formData, treatment_id: e.target.value})}><option value="">Tedavi seçiniz...</option>{treatments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.duration_minutes} dk) — {t.price} ₺</option>)}</select></FormField>
              <FormField label={`Fizyoterapist ${staff.length > 1 ? '*' : ''}`}>
                <select required={staff.length > 1} value={formData.therapist_id} className="input-field" onChange={e => setFormData({...formData, therapist_id: e.target.value})}>
                  <option value="">{staff.length > 1 ? 'Fizyoterapist seçiniz *' : 'Terapist seçiniz...'}</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.title || 'Fzt.'})</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tarih *"><input required type="date" value={formData.session_date} className="input-field" onChange={e => setFormData({...formData, session_date: e.target.value})} /></FormField>
              <FormField label="Saat *"><input required type="time" value={formData.session_time} className="input-field" onChange={e => setFormData({...formData, session_time: e.target.value})} /></FormField>
            </div>
            <FormField label="Not"><input type="text" placeholder="Opsiyonel..." value={formData.notes || ''} className="input-field" onChange={e => setFormData({...formData, notes: e.target.value})} /></FormField>
            <ModalActions onCancel={() => setModalMode(null)} submitLabel={submitting ? 'Kaydediliyor...' : 'Randevuyu Kaydet'} submitting={submitting} />
          </form>
        </ModalShell>
      )}

      {modalMode === 'recurring' && (
        <ModalShell title="Tekrarlayan Seans Paketi" onClose={() => setModalMode(null)}>
          <form onSubmit={handleRecurSubmit} className="space-y-4">
            <FormField label="Hasta *"><select required value={recurData.patient_id} className="input-field" onChange={e => setRecurData({...recurData, patient_id: e.target.value})}><option value="">Hasta seçiniz...</option>{patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tedavi *"><select required value={recurData.treatment_id} className="input-field" onChange={e => setRecurData({...recurData, treatment_id: e.target.value})}><option value="">Tedavi...</option>{treatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></FormField>
              <FormField label={`Fizyoterapist ${staff.length > 1 ? '*' : ''}`}>
                <select required={staff.length > 1} value={recurData.therapist_id} className="input-field" onChange={e => setRecurData({...recurData, therapist_id: e.target.value})}>
                  <option value="">{staff.length > 1 ? 'Fizyoterapist seçiniz *' : 'Terapist...'}</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.title || 'Fzt.'})</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Başlangıç *"><input required type="date" value={recurData.start_date} className="input-field" onChange={e => setRecurData({...recurData, start_date: e.target.value})} /></FormField>
              <FormField label="Saat *"><input required type="time" value={recurData.session_time} className="input-field" onChange={e => setRecurData({...recurData, session_time: e.target.value})} /></FormField>
              <FormField label="Seans Sayısı *"><input required type="number" min="2" max="30" value={recurData.repeat_count} className="input-field" onChange={e => setRecurData({...recurData, repeat_count: parseInt(e.target.value, 10) || 8})} /></FormField>
            </div>
            <ModalActions onCancel={() => setModalMode(null)} submitLabel={submitting ? 'Oluşturuluyor...' : 'Paketi Oluştur'} submitting={submitting} color="blue" />
          </form>
        </ModalShell>
      )}

      {modalMode === 'edit' && (
        <ModalShell title="Seansı Düzenle" onClose={() => setModalMode(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editSession && (
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200/50 flex items-center justify-between text-[12px]">
                <div><span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Mevcut</span><p className="font-bold text-blue-900 mt-0.5">{new Date(editSession.session_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</p></div>
                <div className="text-right"><span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Saat</span><p className="font-bold text-blue-900 mt-0.5">{editSession.session_time?.substring(0,5)}</p></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Yeni Tarih *"><input required type="date" value={formData.session_date} className="input-field border-blue-200 focus:border-blue-500" onChange={e => setFormData({...formData, session_date: e.target.value})} /></FormField>
              <FormField label="Yeni Saat *"><input required type="time" value={formData.session_time} className="input-field border-blue-200 focus:border-blue-500" onChange={e => setFormData({...formData, session_time: e.target.value})} /></FormField>
            </div>
            <FormField label={`Fizyoterapist ${staff.length > 1 ? '*' : ''}`}>
              <select required={staff.length > 1} value={formData.therapist_id} className="input-field border-blue-200 focus:border-blue-500" onChange={e => setFormData({...formData, therapist_id: e.target.value})}>
                <option value="">{staff.length > 1 ? 'Fizyoterapist seçiniz *' : 'Terapist seçiniz...'}</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.title || 'Fzt.'})</option>)}
              </select>
            </FormField>
            <FormField label="Not"><input type="text" value={formData.notes || ''} className="input-field" onChange={e => setFormData({...formData, notes: e.target.value})} /></FormField>
            <ModalActions onCancel={() => setModalMode(null)} submitLabel={submitting ? 'Kaydediliyor...' : 'Kaydet'} submitting={submitting} color="blue" />
          </form>
        </ModalShell>
      )}

      {/* ═══ Calendar View (Drag & Drop) ═══ */}
      {viewMode === 'calendar' ? (
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md overflow-hidden">
            {/* Legend bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 border-b-2 border-gray-200 text-[11px]">
              <div className="flex items-center gap-2 text-gray-500">
                <Move size={13} className="text-blue-500" />
                <span>Seansları <b className="text-gray-700">sürükle & bırak</b> ile taşıyın</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-blue-500"></span> Aktif</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-emerald-500"></span> Tamamlandı</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-amber-500"></span> Talep</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b-2 border-gray-200">
                    <th className="w-16 px-2 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r-2 border-gray-200 text-center">Saat</th>
                    {weekDays.map((day, i) => {
                      const dateStr = formatDate(day);
                      const isToday = dateStr === today;
                      return (
                        <th key={i} className={`px-2 py-2.5 text-center border-r-2 border-gray-200 last:border-r-0 ${isToday ? 'bg-emerald-50/60' : ''}`}>
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${isToday ? 'text-emerald-700' : 'text-gray-500'}`}>{SHORT_DAYS[i]}</span>
                          <div className="mt-0.5 flex items-center justify-center">
                            <span className={`text-[14px] font-extrabold w-7 h-7 rounded-full flex items-center justify-center ${isToday ? 'text-white bg-emerald-600 shadow-sm' : 'text-gray-800'}`}>{day.getDate()}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-200">
                  {HOURS.map((hour) => (
                    <tr key={hour}>
                      <td className="px-2 py-1.5 text-[12px] font-bold text-gray-400 border-r-2 border-gray-200 bg-gray-50/40 text-center align-top pt-3">{hour}</td>
                      {weekDays.map((day, di) => {
                        const dateStr = formatDate(day);
                        const isToday = dateStr === today;
                        const cellSessions = sessionMap[dateStr]?.[hour] || [];
                        const cellId = `cell|${dateStr}|${hour}`;
                        return (
                          <DroppableCell
                            key={di}
                            id={cellId}
                            date={dateStr}
                            hour={hour}
                            onClick={() => cellSessions.length === 0 && handleCellClick(dateStr, hour)}
                            className={`border-r-2 border-gray-200 last:border-r-0 align-top transition-all cursor-pointer relative ${
                              cellSessions.length === 0
                                ? (isToday ? 'bg-emerald-100/70 hover:bg-emerald-200/80' : 'bg-emerald-50/50 hover:bg-emerald-100/70')
                                : 'bg-white'
                            }`}
                          >
                            <div className={`min-h-[68px] ${cellSessions.length > 0 ? 'p-1 space-y-1' : 'flex items-center justify-center text-emerald-600/50 hover:text-emerald-600'}`}>
                              {cellSessions.map((s) => {
                                const isReq = s._type === 'request';
                                const sn = isReq ? null : getSessionNumber(s);
                                const isDone = !isReq && s.status === 'tamamlandi';
                                const cardBorder = isReq ? 'border-l-amber-500' : isDone ? 'border-l-emerald-500' : 'border-l-blue-500';
                                const cardBg = isReq ? 'bg-amber-50/80 hover:bg-amber-50' : isDone ? 'bg-emerald-50/60 hover:bg-emerald-50' : 'bg-white hover:bg-blue-50/40';

                                return (
                                  <DraggableCard key={isReq ? `req-${s.id}` : `ses-${s.id}`} session={s}>
                                    <div onClick={(e) => e.stopPropagation()} className={`text-[11px] rounded-lg p-2 border border-gray-200/80 border-l-[3px] ${cardBorder} ${cardBg} transition-all shadow-xs hover:shadow-md flex flex-col gap-0.5`}>
                                      <div className="flex items-start justify-between gap-1">
                                        <button onClick={() => onPatientClick?.(s.patient_id || s.patient?.id)} className="font-bold text-[11px] hover:underline text-left truncate flex-1 leading-tight">{s.patient?.full_name}</button>
                                        {!isReq && sn && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-black/5 shrink-0">{sn.current}/{sn.total}</span>}
                                        {isReq && <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-200/70 text-amber-800 shrink-0 uppercase">Talep</span>}
                                      </div>
                                      <div className="text-[10px] opacity-60 truncate font-medium">{s.treatment?.name}</div>
                                      {s.therapist && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.therapist.color || '#059669' }} />
                                          <span className="text-[10px] font-semibold text-gray-600 truncate">{s.therapist.full_name}</span>
                                        </div>
                                      )}
                                      {isReq ? (
                                        <div className="flex items-center gap-1 mt-1 pt-1 border-t border-black/5">
                                          <button onClick={(e) => { e.stopPropagation(); approveRequest(s.id); }} className="flex-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 rounded py-0.5 flex items-center justify-center gap-0.5"><CheckCircle2 size={9}/> Onayla</button>
                                          <button onClick={(e) => { e.stopPropagation(); rejectRequest(s.id); }} className="flex-1 text-[9px] font-bold text-red-600 bg-red-100/70 hover:bg-red-200 rounded py-0.5 flex items-center justify-center gap-0.5"><XCircle size={9}/> Reddet</button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-black/5">
                                          <button onClick={() => updateSessionStatus(s.id, isDone ? 'bekliyor' : 'tamamlandi', s)} className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${isDone ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>{isDone ? '✓ Tamam' : 'Tamamla'}</button>
                                          <div className="flex items-center gap-0.5">
                                            <button onClick={() => handleEditClick(s)} className="p-0.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"><Edit2 size={10} /></button>
                                            <button onClick={() => deleteSession(s.id)} className="p-0.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 size={10} /></button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </DraggableCard>
                                );
                              })}
                              {cellSessions.length === 0 && <Plus size={15} className="transition-transform group-hover:scale-110" strokeWidth={2} />}
                            </div>
                          </DroppableCell>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DragOverlay><DragOverlayCard session={activeDragItem} /></DragOverlay>
        </DndContext>
      ) : (
        /* ═══ List View ═══ */
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Hasta</th><th className="text-left px-4 py-3">Tedavi</th><th className="text-left px-4 py-3">Fizyoterapist</th><th className="text-left px-4 py-3">Tarih &amp; Saat</th><th className="text-left px-4 py-3">Durum</th><th className="text-right px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px]">
                {filteredSessions.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Seans kaydı bulunamadı.</td></tr>
                ) : filteredSessions.map((s) => {
                  const isDone = s.status === 'tamamlandi';
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{s.patient?.full_name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.treatment?.name}</td>
                      <td className="px-4 py-3">{s.therapist ? <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-semibold text-gray-800"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.therapist.color || '#059669' }} />{s.therapist.full_name}</span> : <span className="text-gray-400 text-[12px]">-</span>}</td>
                      <td className="px-4 py-3 text-gray-700 font-mono text-[12px]">{s.session_date} {s.session_time?.substring(0, 5)}</td>
                      <td className="px-4 py-3"><button onClick={() => updateSessionStatus(s.id, isDone ? 'bekliyor' : 'tamamlandi', s)} className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{isDone ? '✓ Tamamlandı' : '● Bekliyor'}</button></td>
                      <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => handleEditClick(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Edit2 size={13} /></button><button onClick={() => deleteSession(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={13} /></button></div></td>
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

/* ─── Shared UI ─── */
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 w-full max-w-lg z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
          <h3 className="text-[16px] font-bold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center"><X size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (<div><label className="block text-[12px] font-semibold text-gray-600 mb-1.5">{label}</label>{children}</div>);
}

function ModalActions({ onCancel, submitLabel, submitting, color = 'emerald' }) {
  const btn = color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700';
  return (
    <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
      <button type="button" onClick={onCancel} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Vazgeç</button>
      <button type="submit" disabled={submitting} className={`h-10 px-6 rounded-xl text-[13px] font-semibold text-white ${btn} disabled:opacity-50 shadow-sm transition-colors`}>{submitLabel}</button>
    </div>
  );
}
