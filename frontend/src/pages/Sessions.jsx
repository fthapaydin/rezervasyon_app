import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  DndContext, useDraggable, useDroppable, DragOverlay,
  PointerSensor, useSensor, useSensors, pointerWithin
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, X, ChevronLeft, ChevronRight, ChevronDown, Clock, CheckCircle2, Repeat, 
  MessageCircle, Calendar, List, ListFilter, FileSpreadsheet,
  Edit2, Trash2, XCircle, Stethoscope, GripVertical, Move,
  Copy, ClipboardCheck, Layers, Check, UserX, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendWhatsAppReminder } from '../lib/reminder';
import { exportSessionsToExcel } from '../lib/excelExport';
import { useToast } from '../components/ui/Toast';
import ConfirmModal from '../components/ui/ConfirmModal';
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
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedTherapistId, setSelectedTherapistId] = useState('all');
  const [modalMode, setModalMode] = useState(null);
  const [formData, setFormData] = useState({ patient_id: '', treatment_id: '', therapist_id: '', session_date: '', session_time: '', notes: '' });
  const [recurData, setRecurData] = useState({ patient_id: '', treatment_id: '', therapist_id: '', session_time: '', start_date: '', repeat_type: 'weekly', repeat_count: 8 });
  const [submitting, setSubmitting] = useState(false);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [editSession, setEditSession] = useState(null);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDeleteId, setSessionToDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Haftalık Randevuları Kopyalama & Geleceğe Çoğaltma
  const [copiedWeek, setCopiedWeek] = useState(null);
  const [showCopyWeekModal, setShowCopyWeekModal] = useState(false);
  const [copyingWeek, setCopyingWeek] = useState(false);

  // Tekil Randevu Kopyalama
  const [sessionToCopy, setSessionToCopy] = useState(null);
  const [copySessionDate, setCopySessionDate] = useState('');
  const [copySessionTime, setCopySessionTime] = useState('');
  const [showCopySessionModal, setShowCopySessionModal] = useState(false);
  const [copyingSingle, setCopyingSingle] = useState(false);

  // Randevu Durum Menüsü & Geçmiş Tarih İzni
  const [activeStatusDropdown, setActiveStatusDropdown] = useState(null);
  const [allowPastBooking, setAllowPastBooking] = useState(false);

  useEffect(() => {
    const closeDropdown = () => setActiveStatusDropdown(null);
    if (activeStatusDropdown) {
      window.addEventListener('click', closeDropdown);
      return () => window.removeEventListener('click', closeDropdown);
    }
  }, [activeStatusDropdown]);

  const openSingleCopy = (s) => {
    const srcDate = new Date(s.session_date + 'T00:00:00');
    const targetDateStr = formatDate(addDays(srcDate, 7));
    const targetTimeStr = s.session_time ? s.session_time.substring(0, 5) : '18:00';
    setSessionToCopy(s);
    setCopySessionDate(targetDateStr);
    setCopySessionTime(targetTimeStr);
    setShowCopySessionModal(true);
  };

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
      toast.warning('Lütfen randevuyu yönetecek fizyoterapisti seçiniz.', 'Terapist Seçimi');
      return;
    }

    const timeFormatted = formData.session_time?.substring(0, 5);

    // Geçmiş Tarih Kontrolü
    if (formData.session_date < today && !allowPastBooking) {
      toast.warning(
        `Seçtiğiniz tarih geçmiş bir güne aittir (${formData.session_date}). Geçmişe dönük randevu kaydetmek için 'Geçmişe dönük kayıt' kutucuğunu işaretleyiniz.`,
        'Geçmiş Tarih Koruması'
      );
      return;
    }

    // Çakışma Kontrolü 1: Aynı hastanın aynı gün ve saatte başka seansı var mı?
    const patientConflict = sessions.find(s => 
      s.session_date === formData.session_date && 
      s.session_time?.substring(0, 5) === timeFormatted && 
      s.patient_id === formData.patient_id &&
      s.status !== 'iptal'
    );
    if (patientConflict) {
      toast.warning(
        `Bu hastanın ${formData.session_date} günü saat ${timeFormatted}'da zaten randevusu bulunmaktadır.`,
        'Randevu Çakışması'
      );
      return;
    }

    // Çakışma Kontrolü 2: Seçilen fizyoterapistin aynı gün ve saatte başka seansı var mı?
    if (formData.therapist_id) {
      const therapistConflict = sessions.find(s => 
        s.session_date === formData.session_date && 
        s.session_time?.substring(0, 5) === timeFormatted && 
        s.therapist_id === formData.therapist_id &&
        s.status !== 'iptal'
      );
      if (therapistConflict) {
        const therapistName = staff.find(st => st.id === formData.therapist_id)?.full_name || 'Seçilen fizyoterapist';
        toast.warning(
          `${therapistName} ${formData.session_date} günü saat ${timeFormatted}'da başka bir seanstadır. Lütfen farklı bir saat veya terapist seçiniz.`,
          'Terapist Meşgul'
        );
        return;
      }
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
      toast.success('Yeni seans randevusu takvime eklendi.', 'Seans Oluşturuldu');
      setModalMode(null); 
      refresh(); 
    }
    catch (err) {
      console.error(err);
      toast.error('Seans oluşturulurken bir hata oluştu', 'Hata'); 
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
      status: session.status || 'bekliyor',
      notes: session.notes || ''
    });
    setModalMode('edit');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault(); 
    if (staff.length > 1 && !formData.therapist_id) {
      toast.warning('Lütfen bir fizyoterapist seçiniz.', 'Terapist Seçimi');
      return;
    }

    if (formData.status === 'tamamlandi' && isSessionInFuture(formData.session_date, formData.session_time)) {
      toast.warning('Zamanı henüz gelmemiş ileri tarihli bir randevu tamamlandı olarak kaydedilemez.', 'Randevu Zamanı Gelmedi');
      return;
    }

    const timeFormatted = formData.session_time?.substring(0, 5);

    // Düzenlemede çakışma kontrolü (kendi seansı hariç)
    const patientConflict = sessions.find(s => 
      s.id !== formData.id &&
      s.session_date === formData.session_date && 
      s.session_time?.substring(0, 5) === timeFormatted && 
      s.patient_id === formData.patient_id &&
      s.status !== 'iptal'
    );
    if (patientConflict) {
      toast.warning(
        `Bu hastanın ${formData.session_date} günü saat ${timeFormatted}'da başka bir randevusu bulunmaktadır.`,
        'Randevu Çakışması'
      );
      return;
    }

    if (formData.therapist_id) {
      const therapistConflict = sessions.find(s => 
        s.id !== formData.id &&
        s.session_date === formData.session_date && 
        s.session_time?.substring(0, 5) === timeFormatted && 
        s.therapist_id === formData.therapist_id &&
        s.status !== 'iptal'
      );
      if (therapistConflict) {
        const therapistName = staff.find(st => st.id === formData.therapist_id)?.full_name || 'Seçilen fizyoterapist';
        toast.warning(
          `${therapistName} ${formData.session_date} saat ${timeFormatted}'da başka bir seanstadır.`,
          'Terapist Meşgul'
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        patient_id: formData.patient_id,
        treatment_id: formData.treatment_id,
        therapist_id: formData.therapist_id || null,
        session_date: formData.session_date,
        session_time: formData.session_time,
        status: formData.status || 'bekliyor',
        notes: formData.notes || null,
      };

      const { error } = await supabase
        .from('sessions')
        .update(payload)
        .eq('id', formData.id);
      
      if (error) throw error;

      axios.put(`${API_URL}/sessions/${formData.id}`, payload).catch(() => {});
      toast.success('Seans randevusu güncellendi.', 'Güncellendi');
      setModalMode(null); 
      refresh(); 
    }
    catch (err) {
      console.error(err);
      toast.error('Seans güncellenirken bir hata oluştu', 'Hata'); 
    } 
    finally { setSubmitting(false); }
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDeleteId) return;
    setDeleting(true);
    try {
      await supabase.from('sessions').delete().eq('id', sessionToDeleteId);
      axios.delete(`${API_URL}/sessions/${sessionToDeleteId}`).catch(() => {});
      toast.success('Seans randevusu takvimden silindi.', 'Seans Silindi');
      setShowDeleteModal(false);
      setSessionToDeleteId(null);
      refresh();
    } catch { 
      toast.error('Silme işlemi başarısız', 'Hata'); 
    } finally {
      setDeleting(false);
    }
  };

  const handleRecurSubmit = async (e) => {
    e.preventDefault(); 
    if (staff.length > 1 && !recurData.therapist_id) {
      toast.warning('Lütfen bir fizyoterapist seçiniz.', 'Terapist Seçimi');
      return;
    }
    setSubmitting(true);
    try { 
      const rows = [];
      let cur = new Date(recurData.start_date + 'T00:00:00');
      const count = parseInt(recurData.repeat_count, 10) || 8;
      const stepDays = recurData.repeat_type === 'biweekly' ? 14 : 7;

      for (let i = 0; i < count; i++) {
        rows.push({
          patient_id: recurData.patient_id,
          treatment_id: recurData.treatment_id,
          therapist_id: recurData.therapist_id || null,
          session_date: formatDate(cur),
          session_time: recurData.session_time,
          status: 'bekliyor',
          notes: `Tekrarlayan Seans (${i + 1}/${count})`
        });
        cur = addDays(cur, stepDays);
      }

      const { error: insertErr } = await supabase.from('sessions').insert(rows);
      if (insertErr) throw insertErr;

      axios.post(`${API_URL}/sessions/recurring`, { ...recurData, clinic_id: clinic?.id, therapist_id: recurData.therapist_id || null }).catch(() => {});
      toast.success(`${count} adet tekrarlı seans takvime eklendi.`, 'Seans Paketi Oluşturuldu');
      setModalMode(null); 
      refresh(); 
    }
    catch (err) { 
      console.error(err);
      toast.error('Tekrarlayan seanslar oluşturulurken bir hata oluştu: ' + (err.message || ''), 'Hata'); 
    } 
    finally { setSubmitting(false); }
  };

  // 1. Mevcut Haftanın Randevularını Kopyala
  const handleCopyCurrentWeek = () => {
    const weekDateStrings = weekDays.map(d => formatDate(d));
    const currentWeekSessions = sessions.filter(s => 
      weekDateStrings.includes(s.session_date) && 
      s.status !== 'iptal'
    );

    if (currentWeekSessions.length === 0) {
      toast.warning('Görüntülenen bu haftada kopyalanacak aktif randevu bulunamadı.', 'Boş Hafta');
      return;
    }

    setCopiedWeek({
      sourceMonday: weekStart,
      sourceLabel: weekLabel,
      sessions: currentWeekSessions
    });

    toast.success(
      `${currentWeekSessions.length} adet randevu kopyalandı. İstediğiniz haftaya geçip "Haftayı Buraya Yapıştır" butonuna tıklayınız.`,
      'Hafta Kopyalandı'
    );
  };

  // 2. Kopyalanan Haftayı Hedef Haftaya Yapıştır
  const handlePasteToCurrentWeek = async () => {
    if (!copiedWeek || copiedWeek.sessions.length === 0) {
      toast.warning('Panoda kopyalanmış randevu bulunamadı. Önce bir haftayı kopyalayınız.', 'Pano Boş');
      return;
    }

    setCopyingWeek(true);
    try {
      const targetMonday = weekStart;
      const payloads = [];
      let skippedCount = 0;

      copiedWeek.sessions.forEach(s => {
        const sourceDate = new Date(s.session_date + 'T00:00:00');
        const dayIdx = (sourceDate.getDay() + 6) % 7; // 0 = Pzt, 6 = Paz
        const targetDateStr = formatDate(addDays(targetMonday, dayIdx));
        const timeStr = s.session_time?.substring(0, 5);

        // Çakışma kontrolü
        const conflict = sessions.some(ex => 
          ex.session_date === targetDateStr && 
          ex.session_time?.substring(0, 5) === timeStr && 
          ex.status !== 'iptal' &&
          (
            ex.patient_id === s.patient_id || 
            (s.therapist_id && ex.therapist_id === s.therapist_id)
          )
        );

        if (conflict) {
          skippedCount++;
        } else {
          payloads.push({
            patient_id: s.patient_id,
            treatment_id: s.treatment_id,
            therapist_id: s.therapist_id || null,
            session_date: targetDateStr,
            session_time: s.session_time,
            notes: s.notes || null,
            status: 'bekliyor'
          });
        }
      });

      if (payloads.length === 0) {
        toast.warning(
          `Hedef haftadaki saatler çakışıyor (${skippedCount} çakışma atlandı).`,
          'Randevu Eklenemedi'
        );
        return;
      }

      const { error: insertErr } = await supabase.from('sessions').insert(payloads);
      if (insertErr) throw insertErr;

      toast.success(
        `${payloads.length} randevu bu haftaya başarıyla yapıştırıldı.${skippedCount > 0 ? ` (${skippedCount} çakışan atlandı)` : ''}`,
        'Hafta Yapıştırıldı'
      );
      refresh();
    } catch (err) {
      console.error(err);
      toast.error('Hafta yapıştırılırken hata oluştu: ' + (err.message || ''), 'Hata');
    } finally {
      setCopyingWeek(false);
    }
  };

  // 3. Haftayı Önümüzdeki Haftalara Otomatik Kopyala (1, 2, 4, 8 Hafta)
  const handleBatchCopyNextWeeks = async (numWeeks) => {
    const weekDateStrings = weekDays.map(d => formatDate(d));
    const currentWeekSessions = sessions.filter(s => 
      weekDateStrings.includes(s.session_date) && 
      s.status !== 'iptal'
    );

    if (currentWeekSessions.length === 0) {
      toast.warning('Bu haftada çoğaltılacak aktif randevu bulunmuyor.', 'Boş Hafta');
      return;
    }

    setCopyingWeek(true);
    try {
      const payloads = [];
      let skippedCount = 0;

      for (let w = 1; w <= numWeeks; w++) {
        const offsetDays = w * 7;
        currentWeekSessions.forEach(s => {
          const sourceDate = new Date(s.session_date + 'T00:00:00');
          const targetDateStr = formatDate(addDays(sourceDate, offsetDays));
          const timeStr = s.session_time?.substring(0, 5);

          const conflict = sessions.some(ex => 
            ex.session_date === targetDateStr && 
            ex.session_time?.substring(0, 5) === timeStr && 
            ex.status !== 'iptal' &&
            (
              ex.patient_id === s.patient_id || 
              (s.therapist_id && ex.therapist_id === s.therapist_id)
            )
          );

          if (conflict) {
            skippedCount++;
          } else {
            payloads.push({
              patient_id: s.patient_id,
              treatment_id: s.treatment_id,
              therapist_id: s.therapist_id || null,
              session_date: targetDateStr,
              session_time: s.session_time,
              notes: s.notes || null,
              status: 'bekliyor'
            });
          }
        });
      }

      if (payloads.length === 0) {
        toast.warning('Gelecek haftalardaki saatler dolu olduğu için yeni randevu eklenemedi.', 'Çakışma');
        return;
      }

      const { error: insertErr } = await supabase.from('sessions').insert(payloads);
      if (insertErr) throw insertErr;

      toast.success(
        `Önümüzdeki ${numWeeks} haftaya toplam ${payloads.length} randevu başarıyla kopyalandı.${skippedCount > 0 ? ` (${skippedCount} çakışma atlandı)` : ''}`,
        'Geleceğe Kopyalandı'
      );
      setShowCopyWeekModal(false);
      refresh();
    } catch (err) {
      console.error(err);
      toast.error('Gelecek haftalara kopyalanırken hata oluştu: ' + (err.message || ''), 'Hata');
    } finally {
      setCopyingWeek(false);
    }
  };

  // 4. Tekil Bir Seansı Kopyalama (Özelleştirilebilir Tarih & Saat)
  const handleCopySingleSessionCustom = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!sessionToCopy || !copySessionDate || !copySessionTime) {
      toast.warning('Lütfen randevu tarihi ve saati seçiniz.');
      return;
    }

    // Geçmiş Tarih Engeli
    if (copySessionDate < today) {
      toast.warning('Geçmiş bir tarihe randevu kopyalanamaz.', 'Geçmiş Tarih Engeli');
      return;
    }

    setCopyingSingle(true);
    try {
      // Çakışma kontrolü
      const conflict = sessions.some(ex => 
        ex.session_date === copySessionDate && 
        ex.session_time?.substring(0, 5) === copySessionTime && 
        ex.status !== 'iptal' &&
        (
          ex.patient_id === sessionToCopy.patient_id || 
          (sessionToCopy.therapist_id && ex.therapist_id === sessionToCopy.therapist_id)
        )
      );

      if (conflict) {
        toast.warning('Seçilen tarih ve saatte bu fizyoterapistin veya hastanın başka bir randevusu var.', 'Saat Çakışması');
        setCopyingSingle(false);
        return;
      }

      const { error: insertErr } = await supabase.from('sessions').insert([{
        patient_id: sessionToCopy.patient_id,
        treatment_id: sessionToCopy.treatment_id,
        therapist_id: sessionToCopy.therapist_id || null,
        session_date: copySessionDate,
        session_time: copySessionTime,
        notes: sessionToCopy.notes || null,
        status: 'bekliyor'
      }]);

      if (insertErr) throw insertErr;

      toast.success(
        `"${sessionToCopy.patient?.full_name}" için ${copySessionDate} saat ${copySessionTime} randevusu oluşturuldu.`,
        'Randevu Kopyalandı'
      );
      setShowCopySessionModal(false);
      setSessionToCopy(null);
      refresh();
    } catch (err) {
      console.error(err);
      toast.error('Randevu kopyalanırken hata oluştu: ' + (err.message || ''), 'Hata');
    } finally {
      setCopyingSingle(false);
    }
  };

  const isSessionInFuture = (dateStr, timeStr) => {
    if (!dateStr) return false;
    try {
      const time = timeStr ? timeStr.substring(0, 5) : '00:00';
      const [hours, minutes] = time.split(':').map(Number);
      const [year, month, day] = dateStr.split('-').map(Number);
      
      const sessionDateTime = new Date(year, month - 1, day, hours || 0, minutes || 0);
      const now = new Date();
      return sessionDateTime > now;
    } catch {
      return false;
    }
  };

  const updateSessionStatus = async (id, status, sessionData) => {
    // Zamanı henüz gelmemiş ileri tarihli seansların tamamlanmasını engelle
    if (status === 'tamamlandi' && isSessionInFuture(sessionData?.session_date, sessionData?.session_time)) {
      const time = sessionData?.session_time ? sessionData.session_time.substring(0, 5) : '';
      toast.warning(
        `Zamanı henüz gelmemiş ileri tarihli bir randevu tamamlandı olarak işaretlenemez! (${sessionData?.session_date} ${time})`,
        'Randevu Zamanı Gelmedi'
      );
      return;
    }

    try {
      await supabase.from('sessions').update({ status }).eq('id', id);
      axios.put(`${API_URL}/sessions/${id}`, { status }).catch(() => {});
      refresh();
      if (status === 'tamamlandi') {
        toast.success(`"${sessionData?.patient?.full_name}" seansı tamamlandı olarak işaretlendi.`, 'Seans Tamamlandı');
        if (sessionData?.patient?.phone) {
          axios.post(`${API_URL}/whatsapp/send-template`, { clinic_id: clinic?.id, to_phone: sessionData.patient.phone, type: 'completed', patient_name: sessionData.patient.full_name, date: sessionData.session_date, time: sessionData.session_time?.substring(0, 5), therapist_name: sessionData.therapist?.full_name, treatment_name: sessionData.treatment?.name }).catch(err => console.error(err));
        }
      } else if (status === 'ertelendi') {
        toast.info(`"${sessionData?.patient?.full_name}" seansı ertelendi olarak güncellendi.`, 'Seans Ertelendi');
      } else if (status === 'iptal') {
        toast.warning(`"${sessionData?.patient?.full_name}" seansı iptal edildi.`, 'Randevu İptal');
      } else if (status === 'gelmedi') {
        toast.warning(`"${sessionData?.patient?.full_name}" randevuya gelmedi (No-Show) olarak kaydedildi.`, 'Hasta Gelmedi');
      } else {
        toast.info('Seans durumu "Bekliyor" olarak güncellendi.', 'Durum Değişti');
      }
    } catch { 
      toast.error('Durum güncellenemedi', 'Hata'); 
    }
  };

  const approveRequest = async (id) => {
    try {
      // Talebi bul
      const req = requests.find(r => r.id === id);

      // 1. Talebi onayla
      const { error: updateErr } = await supabase
        .from('session_requests')
        .update({ status: 'onaylandi' })
        .eq('id', id);
      if (updateErr) throw updateErr;

      // 2. Takvime seans ekle (kaybolma sorunu düzeltildi)
      if (req) {
        const { error: sessionErr } = await supabase
          .from('sessions')
          .insert([{
            patient_id: req.patient_id,
            treatment_id: req.treatment_id,
            therapist_id: req.therapist_id || null,
            session_date: req.requested_date,
            session_time: req.requested_time,
            notes: req.notes || null,
            status: 'bekliyor'
          }]);
        if (sessionErr) console.error('Seans ekleme hatası:', sessionErr);
      }

      toast.success('Randevu talebi onaylandı ve takvime işlendi.', 'Talep Onaylandı');
      refresh(); 
    }
    catch (err) {
      console.error('Onaylama hatası:', err);
      toast.error('Onaylama işlemi başarısız', 'Hata'); 
    }
  };

  const rejectRequest = async (id) => {
    try { 
      const { error } = await supabase
        .from('session_requests')
        .update({ status: 'reddedildi' })
        .eq('id', id);
      if (error) throw error;
      toast.info('Randevu talebi reddedildi.', 'Talep Reddedildi');
      refresh(); 
    }
    catch (err) {
      console.error('Reddetme hatası:', err);
      toast.error('Reddetme işlemi başarısız', 'Hata'); 
    }
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

    // Geçmiş tarihe taşıma engeli
    if (targetDate < today) {
      toast.warning(
        `Randevular geçmiş bir güne taşınamaz! (Hedef: ${targetDate})`,
        'Geçmiş Tarih Engeli'
      );
      return;
    }

    // Çakışma Kontrolü
    const conflict = sessions.some(ex => 
      ex.id !== session.id &&
      ex.session_date === targetDate && 
      ex.session_time?.substring(0, 5) === targetTime && 
      ex.status !== 'iptal' &&
      (
        ex.patient_id === session.patient_id || 
        (session.therapist_id && ex.therapist_id === session.therapist_id)
      )
    );
    if (conflict) {
      toast.warning(
        `Seçilen saatte (${targetTime}) terapistin veya hastanın başka bir randevusu bulunmaktadır.`,
        'Saat Çakışması'
      );
      return;
    }

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
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-[12px] font-medium text-slate-600">
            <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-900'}`}>
              <Calendar size={13} className={viewMode === 'calendar' ? 'text-slate-900' : 'text-slate-500'} />
              <span>Takvim</span>
            </button>
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-900'}`}>
              <List size={13} className={viewMode === 'list' ? 'text-slate-900' : 'text-slate-500'} />
              <span>Liste ({filteredSessions.length})</span>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <button onClick={() => exportSessionsToExcel(sessions)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer shadow-2xs">
            <FileSpreadsheet size={13} className="text-slate-500" />
            <span>Excel'e Aktar</span>
          </button>
          <button onClick={() => { setFormData({ patient_id: '', treatment_id: treatments[0]?.id || '', therapist_id: selectedTherapistId !== 'all' ? selectedTherapistId : (staff.length === 1 ? staff[0]?.id : ''), session_date: today, session_time: '09:00', notes: '' }); setModalMode('single'); }} className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer">
            <Plus size={13} />
            <span>+ Tekli Seans</span>
          </button>
          <button onClick={() => { setRecurData({ patient_id: '', treatment_id: treatments[0]?.id || '', therapist_id: selectedTherapistId !== 'all' ? selectedTherapistId : (staff.length === 1 ? staff[0]?.id : ''), session_time: '10:00', start_date: today, repeat_type: 'weekly', repeat_count: 8 }); setModalMode('recurring'); }} className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer">
            <Repeat size={13} className="text-slate-500" />
            <span>Tekrarlayan Paket</span>
          </button>
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
              <FormField label="Tarih *">
                <input 
                  required 
                  type="date" 
                  min={allowPastBooking ? undefined : today}
                  value={formData.session_date} 
                  className="input-field" 
                  onChange={e => setFormData({...formData, session_date: e.target.value})} 
                />
              </FormField>
              <FormField label="Saat *"><input required type="time" value={formData.session_time} className="input-field" onChange={e => setFormData({...formData, session_time: e.target.value})} /></FormField>
            </div>
            <label className="flex items-center gap-2 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowPastBooking}
                onChange={e => setAllowPastBooking(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
              />
              <span>Geçmişe dönük randevu girişi yapıyorum</span>
            </label>
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
              <FormField label="Başlangıç *"><input required type="date" min={today} value={recurData.start_date} className="input-field" onChange={e => setRecurData({...recurData, start_date: e.target.value})} /></FormField>
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
              <FormField label="Tarih *"><input required type="date" value={formData.session_date} className="input-field border-blue-200 focus:border-blue-500" onChange={e => setFormData({...formData, session_date: e.target.value})} /></FormField>
              <FormField label="Saat *"><input required type="time" value={formData.session_time} className="input-field border-blue-200 focus:border-blue-500" onChange={e => setFormData({...formData, session_time: e.target.value})} /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={`Fizyoterapist ${staff.length > 1 ? '*' : ''}`}>
                <select required={staff.length > 1} value={formData.therapist_id} className="input-field border-blue-200 focus:border-blue-500" onChange={e => setFormData({...formData, therapist_id: e.target.value})}>
                  <option value="">{staff.length > 1 ? 'Fizyoterapist seçiniz *' : 'Terapist seçiniz...'}</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.title || 'Fzt.'})</option>)}
                </select>
              </FormField>
              <FormField label="Randevu Durumu">
                <select value={formData.status || 'bekliyor'} className="input-field border-blue-200 focus:border-blue-500 font-semibold text-slate-800" onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="bekliyor">● Bekliyor (Planlandı)</option>
                  <option value="tamamlandi">✓ Tamamlandı</option>
                  <option value="ertelendi">⏰ Ertelendi</option>
                  <option value="gelmedi">🚫 Gelmedi (No-Show)</option>
                  <option value="iptal">✕ İptal Edildi</option>
                </select>
              </FormField>
            </div>
            <FormField label="Not"><input type="text" value={formData.notes || ''} className="input-field" onChange={e => setFormData({...formData, notes: e.target.value})} /></FormField>
            <ModalActions onCancel={() => setModalMode(null)} submitLabel={submitting ? 'Kaydediliyor...' : 'Kaydet'} submitting={submitting} color="blue" />
          </form>
        </ModalShell>
      )}

      {/* ═══ Calendar View (Drag & Drop) ═══ */}
      {viewMode === 'calendar' ? (
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Legend bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px]">
              <div className="text-slate-500 font-medium">
                Seansları <span className="text-slate-900 font-semibold">sürükle & bırak</span> ile taşıyabilirsiniz
              </div>
              <div className="flex items-center gap-4 text-slate-600 font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-900"></span> Aktif</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tamamlandı</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Talep</span>
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
                                const isDelayed = !isReq && s.status === 'ertelendi';
                                const isCancelled = !isReq && s.status === 'iptal';
                                const isNoShow = !isReq && s.status === 'gelmedi';
                                const isFuture = !isReq && isSessionInFuture(s.session_date, s.session_time);

                                const cardBorder = isReq
                                  ? 'border-l-amber-500'
                                  : isDone
                                  ? 'border-l-emerald-500'
                                  : isDelayed
                                  ? 'border-l-amber-500'
                                  : isCancelled
                                  ? 'border-l-rose-400'
                                  : isNoShow
                                  ? 'border-l-purple-500'
                                  : 'border-l-blue-500';

                                const cardBg = isReq
                                  ? 'bg-amber-50/80 hover:bg-amber-50'
                                  : isDone
                                  ? 'bg-emerald-50/60 hover:bg-emerald-50'
                                  : isDelayed
                                  ? 'bg-amber-50/70 hover:bg-amber-100/60'
                                  : isCancelled
                                  ? 'bg-rose-50/30 hover:bg-rose-50/50 opacity-60'
                                  : isNoShow
                                  ? 'bg-purple-50/50 hover:bg-purple-100/50'
                                  : 'bg-white hover:bg-blue-50/40';

                                return (
                                  <DraggableCard key={isReq ? `req-${s.id}` : `ses-${s.id}`} session={s}>
                                    <div onClick={(e) => e.stopPropagation()} className={`text-[11px] rounded-lg p-2 border border-gray-200/80 border-l-[3px] ${cardBorder} ${cardBg} transition-all shadow-xs hover:shadow-md flex flex-col gap-0.5 relative`}>
                                      <div className="flex items-start justify-between gap-1">
                                        <button onClick={() => onPatientClick?.(s.patient_id || s.patient?.id)} className={`font-bold text-[11px] hover:underline text-left truncate flex-1 leading-tight ${isCancelled ? 'line-through text-slate-400' : ''}`}>{s.patient?.full_name}</button>
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
                                          <div className="relative">
                                            <button 
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveStatusDropdown(activeStatusDropdown === s.id ? null : s.id);
                                              }}
                                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 cursor-pointer shadow-2xs transition-all ${
                                                isDone
                                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                  : isDelayed
                                                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                                                  : isCancelled
                                                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                                                  : isNoShow
                                                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                  : isFuture
                                                  ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                                                  : 'bg-slate-900 text-white hover:bg-slate-800'
                                              }`}
                                              title="Durumu değiştir"
                                            >
                                              <span>
                                                {isDone
                                                  ? '✓ Tamam'
                                                  : isDelayed
                                                  ? '⏰ Ertelendi'
                                                  : isCancelled
                                                  ? '✕ İptal'
                                                  : isNoShow
                                                  ? '🚫 Gelmedi'
                                                  : isFuture
                                                  ? 'Bekliyor'
                                                  : 'Tamamla'}
                                              </span>
                                              <ChevronDown size={8} />
                                            </button>

                                            {activeStatusDropdown === s.id && (
                                              <div 
                                                onClick={(e) => e.stopPropagation()} 
                                                className="absolute left-0 bottom-full mb-1 w-36 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                                              >
                                                <button
                                                  type="button"
                                                  onClick={() => { updateSessionStatus(s.id, 'tamamlandi', s); setActiveStatusDropdown(null); }}
                                                  className="w-full px-2 py-1 text-left text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                                                >
                                                  <CheckCircle2 size={12} className="text-emerald-600" />
                                                  <span>Tamamlandı</span>
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => { updateSessionStatus(s.id, 'ertelendi', s); setActiveStatusDropdown(null); }}
                                                  className="w-full px-2 py-1 text-left text-[11px] font-semibold text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                                                >
                                                  <Clock size={12} className="text-amber-600" />
                                                  <span>Ertelendi</span>
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => { updateSessionStatus(s.id, 'gelmedi', s); setActiveStatusDropdown(null); }}
                                                  className="w-full px-2 py-1 text-left text-[11px] font-semibold text-purple-700 hover:bg-purple-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                                                >
                                                  <UserX size={12} className="text-purple-600" />
                                                  <span>Gelmedi</span>
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => { updateSessionStatus(s.id, 'iptal', s); setActiveStatusDropdown(null); }}
                                                  className="w-full px-2 py-1 text-left text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                                                >
                                                  <XCircle size={12} className="text-rose-500" />
                                                  <span>İptal Edildi</span>
                                                </button>
                                                <div className="my-1 border-t border-slate-100" />
                                                <button
                                                  type="button"
                                                  onClick={() => { updateSessionStatus(s.id, 'bekliyor', s); setActiveStatusDropdown(null); }}
                                                  className="w-full px-2 py-1 text-left text-[11px] font-medium text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                                                >
                                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-0.5" />
                                                  <span>Bekliyor</span>
                                                </button>
                                              </div>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-0.5">
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); openSingleCopy(s); }} 
                                              className="p-0.5 text-gray-400 hover:text-emerald-600 rounded hover:bg-emerald-50 cursor-pointer" 
                                              title="Randevuyu Geleceğe Kopyala"
                                            >
                                              <Copy size={10} />
                                            </button>
                                            <button onClick={() => handleEditClick(s)} className="p-0.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 cursor-pointer"><Edit2 size={10} /></button>
                                            <button onClick={() => { setSessionToDeleteId(s.id); setShowDeleteModal(true); }} className="p-0.5 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"><Trash2 size={10} /></button>
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
                  const isFuture = isSessionInFuture(s.session_date, s.session_time);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{s.patient?.full_name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.treatment?.name}</td>
                      <td className="px-4 py-3">{s.therapist ? <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-semibold text-gray-800"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.therapist.color || '#059669' }} />{s.therapist.full_name}</span> : <span className="text-gray-400 text-[12px]">-</span>}</td>
                      <td className="px-4 py-3 text-gray-700 font-mono text-[12px]">{s.session_date} {s.session_time?.substring(0, 5)}</td>
                      <td className="px-4 py-3">
                        <div className="relative inline-block">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStatusDropdown(activeStatusDropdown === `list-${s.id}` ? null : `list-${s.id}`);
                            }}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors ${
                              s.status === 'tamamlandi'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : s.status === 'ertelendi'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                                : s.status === 'iptal'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                : s.status === 'gelmedi'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                                : isFuture
                                ? 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                            title="Durumu değiştir"
                          >
                            <span>
                              {s.status === 'tamamlandi'
                                ? '✓ Tamamlandı'
                                : s.status === 'ertelendi'
                                ? '⏰ Ertelendi'
                                : s.status === 'iptal'
                                ? '✕ İptal Edildi'
                                : s.status === 'gelmedi'
                                ? '🚫 Gelmedi'
                                : isFuture
                                ? '● Bekliyor (Gelecek)'
                                : 'Tamamla'}
                            </span>
                            <ChevronDown size={10} />
                          </button>

                          {activeStatusDropdown === `list-${s.id}` && (
                            <div 
                              onClick={(e) => e.stopPropagation()} 
                              className="absolute left-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                            >
                              <button
                                type="button"
                                onClick={() => { updateSessionStatus(s.id, 'tamamlandi', s); setActiveStatusDropdown(null); }}
                                className="w-full px-2 py-1 text-left text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 size={12} className="text-emerald-600" />
                                <span>Tamamlandı</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { updateSessionStatus(s.id, 'ertelendi', s); setActiveStatusDropdown(null); }}
                                className="w-full px-2 py-1 text-left text-[11px] font-semibold text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                              >
                                <Clock size={12} className="text-amber-600" />
                                <span>Ertelendi</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { updateSessionStatus(s.id, 'gelmedi', s); setActiveStatusDropdown(null); }}
                                className="w-full px-2 py-1 text-left text-[11px] font-semibold text-purple-700 hover:bg-purple-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                              >
                                <UserX size={12} className="text-purple-600" />
                                <span>Gelmedi</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { updateSessionStatus(s.id, 'iptal', s); setActiveStatusDropdown(null); }}
                                className="w-full px-2 py-1 text-left text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                              >
                                <XCircle size={12} className="text-rose-500" />
                                <span>İptal Edildi</span>
                              </button>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                type="button"
                                onClick={() => { updateSessionStatus(s.id, 'bekliyor', s); setActiveStatusDropdown(null); }}
                                className="w-full px-2 py-1 text-left text-[11px] font-medium text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-0.5" />
                                <span>Bekliyor</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openSingleCopy(s)} 
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 cursor-pointer" 
                            title="Randevuyu Geleceğe Kopyala"
                          >
                            <Copy size={13} />
                          </button>
                          <button onClick={() => handleEditClick(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 cursor-pointer"><Edit2 size={13} /></button>
                          <button onClick={() => { setSessionToDeleteId(s.id); setShowDeleteModal(true); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 cursor-pointer"><Trash2 size={13} /></button>
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

      {/* ═══ Copy Week Modal (Geleceğe Çoğalt) ═══ */}
      {showCopyWeekModal && (
        <ModalShell title="Haftalık Randevuları Geleceğe Çoğalt" onClose={() => setShowCopyWeekModal(false)}>
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Kaynak Hafta</span>
                <span className="text-[12px] font-bold text-slate-800">{weekLabel}</span>
              </div>
              <p className="text-[12px] text-slate-600 mt-1">
                Bu haftada toplam <b className="text-slate-900 font-bold">{sessions.filter(s => weekDays.map(d => formatDate(d)).includes(s.session_date) && s.status !== 'iptal').length} adet</b> aktif randevu bulunmaktadır.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-2">
                Bu randevular önümüzdeki kaç haftaya kopyalansın?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { count: 1, label: '1 Hafta (Gelecek Hafta)' },
                  { count: 2, label: '2 Hafta Boyunca' },
                  { count: 4, label: '4 Hafta (1 Ay Boyunca)' },
                  { count: 8, label: '8 Hafta (2 Ay Boyunca)' },
                ].map(opt => (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => handleBatchCopyNextWeeks(opt.count)}
                    disabled={copyingWeek}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-left transition-all cursor-pointer disabled:opacity-50"
                  >
                    <p className="font-bold text-slate-900 text-[13px]">{opt.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Her seans aynı gün ve saatinde oluşturulur</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Otomatik Çakışma Koruması:</p>
              <p>Gelecek haftalarda hastanın veya terapistin dolu olduğu saatler tespit edilerek çakışmalar otomatik olarak atlanır, çift randevu oluşmaz.</p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCopyWeekModal(false)}
                className="h-9 px-4 rounded-xl text-[12px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ═══ Copy Single Session Modal ═══ */}
      {showCopySessionModal && sessionToCopy && (
        <ModalShell title="Randevuyu Kopyala" onClose={() => { setShowCopySessionModal(false); setSessionToCopy(null); }}>
          <form onSubmit={handleCopySingleSessionCustom} className="space-y-4 text-[13px]">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-slate-900">{sessionToCopy.patient?.full_name}</span>
                <span className="text-[11px] font-medium text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded">{sessionToCopy.treatment?.name}</span>
              </div>
              <p className="text-[12px] text-slate-600">
                Mevcut: <span className="font-semibold text-slate-800">{new Date(sessionToCopy.session_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</span> saat <span className="font-semibold text-slate-800 font-mono">{sessionToCopy.session_time?.substring(0, 5)}</span>
              </p>
              {sessionToCopy.therapist && (
                <p className="text-[11px] text-slate-500">Terapist: {sessionToCopy.therapist.full_name}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-semibold text-slate-700">Hedef Randevu Tarihi *</label>
                <span className="text-[11px] text-emerald-700 font-medium">Varsayılan: Haftaya Aynı Gün</span>
              </div>

              {/* Quick Week Selectors */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[
                  { weeks: 1, label: '+1 Hafta' },
                  { weeks: 2, label: '+2 Hafta' },
                  { weeks: 3, label: '+3 Hafta' },
                  { weeks: 4, label: '+4 Hafta' },
                ].map(btn => {
                  const targetStr = formatDate(addDays(new Date(sessionToCopy.session_date + 'T00:00:00'), btn.weeks * 7));
                  const isSelected = copySessionDate === targetStr;
                  return (
                    <button
                      key={btn.weeks}
                      type="button"
                      onClick={() => setCopySessionDate(targetStr)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {btn.label}
                    </button>
                  );
                })}
              </div>

              <input
                required
                type="date"
                min={today}
                value={copySessionDate}
                onChange={e => setCopySessionDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-semibold text-slate-700">Hedef Randevu Saati *</label>
                <span className="text-[11px] text-slate-400">Varsayılan: Aynı Saat</span>
              </div>

              {/* Quick Time Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCopySessionTime(t)}
                    className={`px-2 py-1 rounded text-[11px] font-mono font-medium border transition-colors cursor-pointer ${
                      copySessionTime === t
                        ? 'bg-slate-900 text-white border-slate-900 font-bold'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <input
                required
                type="time"
                value={copySessionTime}
                onChange={e => setCopySessionTime(e.target.value)}
                className="input-field font-mono font-semibold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowCopySessionModal(false); setSessionToCopy(null); }}
                className="h-9 px-4 rounded-lg text-[12px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={copyingSingle}
                className="h-9 px-5 rounded-lg text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
              >
                {copyingSingle ? 'Kopyalanıyor...' : 'Randevuyu Kopyala & Kaydet'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteSession}
        isLoading={deleting}
        title="Seansı Takvimden Sil"
        message="Bu seans randevusunu takvimden kalıcı olarak silmek istediğinize emin misiniz?"
        confirmText="Evet, Seansı Sil"
        cancelText="Vazgeç"
        type="danger"
      />
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
