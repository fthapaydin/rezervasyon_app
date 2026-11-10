import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, X, Phone, Search, ArrowLeft, Mail, MapPin, CheckCircle2, Clock, FileDown, 
  AlertTriangle, MessageCircle, MessageSquare, Pencil, Trash2, Copy, FileText, Printer,
  Activity, Scale, Heart, Sparkles, Send, Check
} from 'lucide-react';
import { generateSessionReport, generatePatientSummary } from '../lib/pdfGenerator';
import { sendWhatsAppReminder } from '../lib/reminder';
import { useToast } from '../components/ui/Toast';
import ConfirmModal from '../components/ui/ConfirmModal';
import { supabase } from '../lib/supabase';
import { API_URL } from '../lib/api';
import { getSessionLocation, cleanSessionNotes, encodeSessionNotes } from '../lib/sessionLocationUtils';
import LocationSelector, { LocationBadge } from '../components/common/LocationSelector';
import { 
  getClinicSectorConfig, calculateBMI, buildDirectWhatsAppUrl, formatAppointmentWhatsAppText 
} from '../lib/sectorUtils';

export default function Patients({ clinic, patients, sessions, staff = [], treatments = [], selectedPatientId, setSelectedPatientId, refresh }) {
  if (selectedPatientId) {
    return <PatientDetail id={selectedPatientId} onBack={() => setSelectedPatientId(null)} refresh={refresh} allPatients={patients} staff={staff} treatments={treatments} clinic={clinic} />;
  }

  return <PatientList clinic={clinic} patients={patients} sessions={sessions} onSelect={setSelectedPatientId} refresh={refresh} />;
}

// ─── Patient List ────────────────────────────────────────
function PatientList({ clinic, patients, sessions, onSelect, refresh }) {
  const sector = getClinicSectorConfig(clinic);
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    full_name: '', phone: '', email: '', age: '', gender: '', address: '', complaint: '', total_sessions: 10, notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search) ||
    (p.complaint && p.complaint.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Strict phone validation & Duplicate check
    const cleanedPhone = formData.phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10 || cleanedPhone.length > 11) {
      toast.warning('Lütfen geçerli bir telefon numarası giriniz (10 veya 11 haneli sayı, Örn: 05XXXXXXXXX).', 'Geçersiz Telefon');
      return;
    }

    const last10 = cleanedPhone.slice(-10);
    const existingWithPhone = patients.find(p => p.phone && p.phone.replace(/\D/g, '').slice(-10) === last10);
    if (existingWithPhone) {
      toast.error(
        `Bu telefon numarası (${cleanedPhone}) zaten "${existingWithPhone.full_name}" adlı ${sector.clientSingular.toLowerCase()}a aittir. Aynı numarayla mükerrer kayıt oluşturulamaz.`,
        'Mükerrer Telefon Uyarısı'
      );
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/patients`, {
        ...formData,
        clinic_id: clinic?.id,
        phone: cleanedPhone,
        age: formData.age ? parseInt(formData.age, 10) : null,
        total_sessions: parseInt(formData.total_sessions, 10) || 10
      });
      toast.success(`"${formData.full_name}" başarıyla kaydedildi.`, `${sector.clientSingular} Eklendi`);
      setShowForm(false);
      setFormData({ full_name: '', phone: '', email: '', age: '', gender: '', address: '', complaint: '', total_sessions: 10, notes: '' });
      refresh();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Kayıt sırasında hata oluştu';
      toast.error(errorMsg, 'Kayıt Hatası');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const handlePhoneChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 11);
    set('phone', cleaned);
  };

  const getSessionInfo = (patientId) => {
    const patientSessions = sessions.filter(s => s.patient_id === patientId);
    const completed = patientSessions.filter(s => s.status === 'tamamlandi').length;
    const total = patientSessions.length;
    return { completed, total };
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder={`${sector.clientSingular} adı, telefon veya ${sector.complaintLabel.toLowerCase()} ara...`} 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-[13px] placeholder:text-gray-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-2xs" 
          />
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`h-10 px-4 rounded-xl text-[13px] font-semibold transition-all shrink-0 cursor-pointer ${
            showForm ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
          }`}
        >
          {showForm ? 'İptal' : `+ Yeni ${sector.clientSingular}`}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200/80 p-5 md:p-6 shadow-sm animate-in fade-in duration-200">
          <h3 className="text-[15px] font-bold text-gray-800 mb-1">Yeni {sector.clientSingular} Kaydı</h3>
          <p className="text-[12px] text-gray-400 mb-5">İletişim bilgilerini ve seans planlamasını tanımlayın.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Ad Soyad <span className="text-red-500">*</span></label>
              <input required type="text" placeholder="Ahmet Yılmaz" value={formData.full_name} className="input-field" onChange={e => set('full_name', e.target.value)} />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Telefon (10-11 Hane) <span className="text-red-500">*</span></label>
              <input 
                required 
                type="tel" 
                inputMode="numeric"
                maxLength={11}
                placeholder="05XXXXXXXXX" 
                value={formData.phone} 
                className="input-field font-medium tracking-wide" 
                onChange={handlePhoneChange} 
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">E-posta</label>
              <input type="email" placeholder="ornek@mail.com" value={formData.email} className="input-field" onChange={e => set('email', e.target.value)} />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Yaş</label>
              <input 
                type="number" 
                min={0} 
                max={120} 
                placeholder="32" 
                value={formData.age} 
                className="input-field" 
                onChange={e => {
                  const val = e.target.value;
                  set('age', val === '' ? '' : Math.max(0, Math.min(120, parseInt(val, 10) || 0)));
                }} 
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Cinsiyet</label>
              <select className="input-field bg-white" value={formData.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Seçiniz</option>
                <option value="Erkek">Erkek</option>
                <option value="Kadın">Kadın</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Adres</label>
              <input type="text" placeholder="İlçe / Mahalle" value={formData.address} className="input-field" onChange={e => set('address', e.target.value)} />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">{sector.complaintLabel}</label>
              <input type="text" placeholder={sector.complaintPlaceholder || 'Açıklama / tanı...'} value={formData.complaint} className="input-field" onChange={e => set('complaint', e.target.value)} />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Planlanan Seans Sayısı</label>
              <input 
                type="number" 
                min={1} 
                max={100} 
                value={formData.total_sessions} 
                className="input-field font-bold text-emerald-700" 
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  set('total_sessions', isNaN(val) ? '' : Math.max(1, Math.min(100, val)));
                }} 
              />
            </div>
          </div>

          <div className="flex justify-end mt-5 gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">Vazgeç</button>
            <button type="submit" disabled={submitting} className="h-9 px-5 rounded-xl text-[13px] font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 shadow-2xs">
              {submitting ? 'Kaydediliyor...' : `${sector.clientSingular} Kaydet`}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-50/60">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{sector.clientSingular}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">İletişim &amp; WhatsApp</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{sector.complaintLabel}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Seans İlerlemesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-[13px] text-gray-400">
                    {search ? `Eşleşen ${sector.clientSingular.toLowerCase()} bulunamadı.` : `Henüz ${sector.clientSingular.toLowerCase()} kaydı yok.`}
                  </td>
                </tr>
              )}
              {filtered.map(p => {
                const info = getSessionInfo(p.id);
                const totalPlanned = p.total_sessions || 10;
                const pct = Math.min(100, Math.round((info.completed / totalPlanned) * 100));
                const waUrl = buildDirectWhatsAppUrl(
                  p.phone,
                  `Merhaba Sayın ${p.full_name}, ${clinic?.name || sector.businessSingular} üzerinden iletişime geçiyoruz.`
                );

                return (
                  <tr key={p.id} onClick={() => onSelect(p.id)} className="hover:bg-slate-50/70 cursor-pointer transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 font-bold text-[13px] flex items-center justify-center shrink-0 border border-slate-200/60">
                          {p.full_name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-[13px] font-bold text-gray-900 block group-hover:text-emerald-700 transition-colors">{p.full_name}</span>
                          {p.age && <span className="text-[11px] text-gray-400">{p.age} yaş{p.gender ? ` · ${p.gender}` : ''}</span>}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-[13px] text-gray-700 font-mono font-medium">{p.phone}</p>
                          {p.email && <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{p.email}</p>}
                        </div>
                        {p.phone && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer shrink-0"
                            title="Tek Tıkla WhatsApp Aç"
                          >
                            <MessageCircle size={14} />
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {p.complaint ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 text-[11px] font-medium max-w-[200px] truncate">
                          {p.complaint}
                        </span>
                      ) : (
                        <span className="text-[12px] text-gray-300">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[90px]">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${info.completed >= totalPlanned ? 'bg-slate-900' : 'bg-emerald-500'}`} 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[12px] text-gray-600 font-bold font-mono whitespace-nowrap">{info.completed}/{totalPlanned}</span>
                        {info.completed >= totalPlanned && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white shadow-2xs">
                            Tamamlandı
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Patient Detail ────────────────────────────────────
function PatientDetail({ id, onBack, refresh, allPatients = [], staff = [], treatments = [], clinic = null }) {
  const sector = getClinicSectorConfig(clinic);
  const { toast } = useToast();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Klinik Değerlendirme & Ölçüm Form State (SOAP / Intake)
  const [clinicalState, setClinicalState] = useState({
    vas_pain: 5,
    pain_location: '',
    rom_notes: '',
    height: '',
    weight: '',
    target_weight: '',
    body_fat: '',
    flexibility_score: 6,
    core_strength: 5,
    posture_assessment: '',
    mood_score: 6,
    session_target: '',
    homework_notes: '',
    skin_type: '',
    treated_area: '',
    tooth_number: '',
    target_phoneme: '',
    fluency_score: 5,
  });
  const [savingClinical, setSavingClinical] = useState(false);

  // Randevu Kopyalama Durumları
  const [copyModalSession, setCopyModalSession] = useState(null);
  const [copyDate, setCopyDate] = useState('');
  const [copyTime, setCopyTime] = useState('');
  const [copyTherapistId, setCopyTherapistId] = useState('');
  const [copyTreatmentId, setCopyTreatmentId] = useState('');
  const [copyLocation, setCopyLocation] = useState('klinik');
  const [copyNotes, setCopyNotes] = useState('');
  const [copying, setCopying] = useState(false);

  // Paket Yenileme / Seans Ekleme Durumları
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [addedSessions, setAddedSessions] = useState(8);
  const [packageNote, setPackageNote] = useState('');
  const [renewing, setRenewing] = useState(false);

  const [staffList, setStaffList] = useState(staff);
  const [treatmentList, setTreatmentList] = useState(treatments);

  useEffect(() => {
    if (staffList.length === 0) {
      supabase.from('staff').select('*').order('created_at', { ascending: true }).then(({ data }) => {
        if (data && data.length > 0) setStaffList(data);
      });
    }
    if (treatmentList.length === 0) {
      supabase.from('treatments').select('*').order('created_at', { ascending: true }).then(({ data }) => {
        if (data && data.length > 0) setTreatmentList(data);
      });
    }
  }, []);

  function addDays(dateStr, days) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    const nextD = String(date.getDate()).padStart(2, '0');
    return `${nextY}-${nextM}-${nextD}`;
  }

  function formatTurkishDate(dateStr) {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    } catch {
      return dateStr;
    }
  }

  const openCopyModal = (session) => {
    const targetDate = addDays(session.session_date, 7);
    const targetTime = session.session_time ? session.session_time.substring(0, 5) : '18:00';
    setCopyModalSession(session);
    setCopyDate(targetDate);
    setCopyTime(targetTime);
    setCopyTherapistId(session.therapist_id || session.therapist?.id || (staffList[0]?.id || ''));
    setCopyTreatmentId(session.treatment_id || session.treatment?.id || (treatmentList[0]?.id || ''));
    setCopyLocation(getSessionLocation(session));
    setCopyNotes(cleanSessionNotes(session.notes || ''));
  };

  const setQuickWeeks = (weeks) => {
    if (!copyModalSession) return;
    setCopyDate(addDays(copyModalSession.session_date, weeks * 7));
  };

  const handleCopySubmit = async (e) => {
    e.preventDefault();
    if (!copyDate || !copyTime) {
      toast.warning('Lütfen randevu tarihi ve saati seçiniz.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (copyDate < todayStr) {
      toast.warning('Geçmiş bir tarihe randevu kopyalanamaz.', 'Geçmiş Tarih Engeli');
      return;
    }

    setCopying(true);
    try {
      if (copyTherapistId) {
        const { data: conflicts } = await supabase
          .from('sessions')
          .select('id, patient:patients(full_name)')
          .eq('session_date', copyDate)
          .eq('session_time', copyTime)
          .eq('therapist_id', copyTherapistId)
          .neq('status', 'iptal');

        if (conflicts && conflicts.length > 0) {
          const conflictingName = conflicts[0]?.patient?.full_name || 'Başka bir danışan';
          toast.warning(
            `Seçilen saatte bu uzmanın zaten bir randevusu var (${conflictingName}). Lütfen farklı bir saat seçiniz.`,
            'Saat Çakışması'
          );
          setCopying(false);
          return;
        }
      }

      const { error: insertErr } = await supabase
        .from('sessions')
        .insert([{
          patient_id: patient.id,
          treatment_id: copyTreatmentId || null,
          therapist_id: copyTherapistId || null,
          session_date: copyDate,
          session_time: copyTime,
          status: 'bekliyor',
          notes: encodeSessionNotes(copyNotes, copyLocation)
        }]);

      if (insertErr) throw insertErr;

      toast.success(
        `"${patient.full_name}" için ${formatTurkishDate(copyDate)} saat ${copyTime} randevusu başarıyla oluşturuldu.`,
        'Randevu Kopyalandı'
      );
      setCopyModalSession(null);
      await fetchPatientDetail();
      if (refresh) refresh();
    } catch (err) {
      console.error('Randevu kopyalama hatası:', err);
      toast.error(err.message || 'Randevu kopyalanırken hata oluştu.', 'Hata');
    } finally {
      setCopying(false);
    }
  };

  const openRenewPackageModal = () => {
    setAddedSessions(8);
    setPackageNote('');
    setRenewModalOpen(true);
  };

  const applySuggestedPackage = (pkg) => {
    setAddedSessions(pkg.sessions);
    setPackageNote(pkg.name);
  };

  const handleRenewPackageSubmit = async (e) => {
    e.preventDefault();
    const count = parseInt(addedSessions, 10);
    if (!count || count <= 0) {
      toast.warning('Lütfen en az 1 seans giriniz.', 'Geçersiz Seans');
      return;
    }

    setRenewing(true);
    try {
      const currentTotal = parseInt(patient.total_sessions, 10) || 10;
      const newTotal = currentTotal + count;
      const currentCompleted = (patient.sessions || []).filter(s => s.status === 'tamamlandi').length;
      const newRemaining = Math.max(0, newTotal - currentCompleted);

      const dateStr = new Date().toLocaleDateString('tr-TR');
      const logLine = `[${dateStr}] +${count} seans paketi tanımlandı${packageNote ? ` (${packageNote})` : ''}.`;
      const updatedNotes = patient.notes ? `${patient.notes}\n${logLine}` : logLine;

      const { error: pErr } = await supabase
        .from('patients')
        .update({
          total_sessions: newTotal,
          notes: updatedNotes
        })
        .eq('id', patient.id);

      if (pErr) throw pErr;

      toast.success(
        `+${count} seans başarıyla eklendi. Yeni toplam: ${newTotal} seans (Kullanılabilir: ${newRemaining})`,
        'Paket Yenilendi'
      );
      setRenewModalOpen(false);
      await fetchPatientDetail();
      if (refresh) refresh();
    } catch (err) {
      console.error('Paket yenileme hatası:', err);
      toast.error(err.message || 'Seans paketi eklenirken bir hata oluştu.', 'Hata');
    } finally {
      setRenewing(false);
    }
  };

  const fetchPatientDetail = async () => {
    try {
      const res = await axios.get(`${API_URL}/patients/${id}`);
      setPatient(res.data);
      setEditData(res.data);

      // Parse clinical notes if saved as structured text/JSON
      if (res.data?.notes) {
        try {
          const match = res.data.notes.match(/\[CLINICAL_DATA\](.*?)\[\/CLINICAL_DATA\]/s);
          if (match && match[1]) {
            const parsed = JSON.parse(match[1]);
            setClinicalState(prev => ({ ...prev, ...parsed }));
          }
        } catch {}
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetail();
  }, [id]);

  const handleSaveClinicalNotes = async () => {
    setSavingClinical(true);
    try {
      const clinicalPayload = JSON.stringify(clinicalState);
      const cleanExistingNotes = (patient.notes || '').replace(/\[CLINICAL_DATA\].*?\[\/CLINICAL_DATA\]/s, '').trim();
      const finalNotes = `${cleanExistingNotes}\n\n[CLINICAL_DATA]${clinicalPayload}[/CLINICAL_DATA]`.trim();

      await supabase.from('patients').update({ notes: finalNotes }).eq('id', patient.id);
      toast.success('Klinik değerlendirme ve ölçüm verileri başarıyla kaydedildi.', 'Klinik Kayıt Güncellendi');
      await fetchPatientDetail();
    } catch (err) {
      toast.error(err.message || 'Ölçüm verileri kaydedilemedi.', 'Hata');
    } finally {
      setSavingClinical(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const cleanedPhone = editData.phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10 || cleanedPhone.length > 11) {
      toast.warning('Lütfen geçerli bir telefon numarası giriniz (Örn: 05XXXXXXXXX).', 'Geçersiz Telefon');
      return;
    }

    const last10 = cleanedPhone.slice(-10);
    const conflictPatient = allPatients.find(p => p.id !== id && p.phone && p.phone.replace(/\D/g, '').slice(-10) === last10);
    if (conflictPatient) {
      toast.error(
        `Bu telefon numarası (${cleanedPhone}) zaten "${conflictPatient.full_name}" adlı başka bir ${sector.clientSingular.toLowerCase()}a aittir.`,
        'Mükerrer Telefon Uyarısı'
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        full_name: editData.full_name,
        phone: cleanedPhone,
        email: editData.email,
        age: editData.age ? parseInt(editData.age, 10) : null,
        gender: editData.gender,
        address: editData.address,
        complaint: editData.complaint,
        total_sessions: parseInt(editData.total_sessions, 10) || 10,
        notes: editData.notes
      };
      await axios.put(`${API_URL}/patients/${id}`, payload);
      toast.success(`${sector.clientSingular} bilgileri güncellendi.`, 'Başarılı');
      setShowEditModal(false);
      fetchPatientDetail();
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Güncelleme sırasında hata oluştu.', 'Hata');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!patient) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/patients/${id}`);
      toast.success(`"${patient.full_name}" ve tüm geçmiş kayıtları silindi.`, `${sector.clientSingular} Silindi`);
      setShowDeleteModal(false);
      refresh();
      onBack();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Silme işlemi sırasında hata oluştu.', 'Silme Başarısız');
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!patient) return <p className="text-center text-gray-400 py-12">{sector.clientSingular} bulunamadı.</p>;

  const sessions = patient.sessions || [];
  const payments = patient.payments || [];
  const completedCount = sessions.filter(s => s.status === 'tamamlandi').length;
  const totalPlanned = patient.total_sessions || 10;
  const remaining = Math.max(0, totalPlanned - completedCount);
  const pct = Math.min(100, Math.round((completedCount / totalPlanned) * 100));
  
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalSessionCost = sessions.reduce((s, ses) => s + Number(ses.treatment?.price || 0), 0);
  const balanceDebt = Math.max(0, totalSessionCost - totalPaid);

  const bmiResult = (clinicalState.weight && clinicalState.height) 
    ? calculateBMI(clinicalState.weight, clinicalState.height) 
    : null;

  const directWaUrl = buildDirectWhatsAppUrl(
    patient.phone,
    `Merhaba Sayın ${patient.full_name},\n${clinic?.name || sector.businessSingular} bünyesindeki seans planınız hakkında iletişime geçiyoruz.`
  );

  return (
    <div className="space-y-5">
      {/* Header Bar with Action & PDF Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button onClick={onBack} className="h-9 px-3.5 rounded-xl text-[12px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs">
          ← {sector.clientPlural} Listesine Dön
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={directWaUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[12px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
          >
            <MessageCircle size={14} />
            <span>WhatsApp Aç</span>
          </a>
          <button 
            onClick={openRenewPackageModal}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>+ Seans / Paket Ekle</span>
          </button>
          <button 
            onClick={() => {
              setEditData(patient);
              setShowEditModal(true);
            }}
            className="h-9 px-3 rounded-xl text-[12px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            Düzenle
          </button>
          <button 
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-medium text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Trash2 size={13} className="text-rose-500" />
            <span>Sil</span>
          </button>
          <button 
            onClick={() => generateSessionReport(patient, sessions, clinic)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <FileText size={13} className="text-slate-500" />
            <span>Seans Raporu PDF</span>
          </button>
          <button 
            onClick={() => generatePatientSummary(patient, sessions, payments, clinic)}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[12px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer size={13} className="text-slate-500" />
            <span>Özet PDF</span>
          </button>
        </div>
      </div>

      {/* ─── Paket Seansları Tamamlandı Uyarı Bannerı ─── */}
      {remaining <= 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-[14px] font-bold tracking-tight">
                  Paket Seansları Tamamlandı ({completedCount}/{totalPlanned})
                </h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dönem Sonu
                </span>
              </div>
              <p className="text-[12px] text-slate-400 mt-0.5">
                {sector.clientSingular}ın bu dönemki seans hakkı bitti. Yeni dönem seanslarını tanımlamak için butona tıklayın.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openRenewPackageModal}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-[12px] transition-colors shrink-0 cursor-pointer shadow-2xs self-end sm:self-auto"
          >
            <Plus size={14} />
            <span>+ Yeni Paket / Seans Ekle</span>
          </button>
        </div>
      )}

      {/* Patient Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center text-lg font-bold shrink-0">
              {patient.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{patient.full_name}</h2>
                <a
                  href={directWaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle size={12} />
                  <span>WhatsApp Hattı</span>
                </a>
              </div>
              {patient.complaint && (
                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 text-[12px] font-medium">
                  {sector.complaintLabel}: {patient.complaint}
                </span>
              )}

              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[12px] text-gray-500">
                <span className="flex items-center gap-1.5"><Phone size={13}/> {patient.phone}</span>
                {patient.email && <span className="flex items-center gap-1.5"><Mail size={13}/> {patient.email}</span>}
                {patient.address && <span className="flex items-center gap-1.5"><MapPin size={13}/> {patient.address}</span>}
                {patient.age && <span>{patient.age} yaş{patient.gender ? ` · ${patient.gender}` : ''}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats with Debt Status */}
        <div className="border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div className="px-5 py-4 text-center relative group">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Planlanan Seans</p>
            <p className="text-xl font-black text-gray-900">{totalPlanned} Seans</p>
            <button
              type="button"
              onClick={openRenewPackageModal}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer mt-0.5 inline-block"
            >
              + Paket Ekle
            </button>
          </div>
          <Stat label="Tamamlanan" value={`${completedCount} Seans`} />
          <Stat 
            label="Kalan Seans" 
            value={`${remaining} Seans`} 
            highlight={remaining > 0} 
            danger={remaining === 0} 
            subtitle={remaining === 0 ? 'Paket Doldu' : `Tamamlanma: %${pct}`} 
          />
          <Stat 
            label="Kalan Bakiye / Borç" 
            value={`${balanceDebt.toLocaleString('tr-TR')} ₺`} 
            danger={balanceDebt > 0} 
            subtitle={`Tahsil Edilen: ${totalPaid.toLocaleString('tr-TR')} ₺`}
          />
        </div>
      </div>

      {/* ─── YENİ: Sektöre Özel Klinik Değerlendirme & Ölçümler Modülü (SOAP Notes / Intake) ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Activity size={16} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-slate-900">
                {sector.badge} — Klinik Ölçüm &amp; Değerlendirme
              </h3>
              <p className="text-[11px] text-slate-400">
                {sector.clientSingular}ın seans takibinde kullanılacak klinik parametreleri ve ölçüm geçmişini güncelleyin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveClinicalNotes}
            disabled={savingClinical}
            className="h-8.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[12px] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Check size={13} />
            <span>{savingClinical ? 'Kaydediliyor...' : 'Ölçümleri Kaydet'}</span>
          </button>
        </div>

        {/* Branşa Özel Dinamik Alanlar */}
        {sector.sectorKey === 'diyetisyen' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Boy (cm)</label>
                <input
                  type="number"
                  placeholder="172"
                  value={clinicalState.height || ''}
                  onChange={e => setClinicalState({ ...clinicalState, height: e.target.value })}
                  className="input-field font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Güncel Kilo (kg)</label>
                <input
                  type="number"
                  placeholder="78.5"
                  value={clinicalState.weight || ''}
                  onChange={e => setClinicalState({ ...clinicalState, weight: e.target.value })}
                  className="input-field font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hedef Kilo (kg)</label>
                <input
                  type="number"
                  placeholder="65"
                  value={clinicalState.target_weight || ''}
                  onChange={e => setClinicalState({ ...clinicalState, target_weight: e.target.value })}
                  className="input-field font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Yağ Oranı (%)</label>
                <input
                  type="number"
                  placeholder="24"
                  value={clinicalState.body_fat || ''}
                  onChange={e => setClinicalState({ ...clinicalState, body_fat: e.target.value })}
                  className="input-field font-mono"
                />
              </div>
            </div>

            {/* Dinamik VKİ Rozeti */}
            {bmiResult && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[12px]">
                <span className="text-slate-600 font-medium">Hesaplanan Vücut Kitle İndeksi (VKİ):</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900 text-sm">{bmiResult.bmi} kg/m²</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${bmiResult.color}`}>
                    {bmiResult.category}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {sector.sectorKey === 'fizyoterapi' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  VAS Ağrı Skoru: <strong className="text-emerald-700 font-mono text-sm">{clinicalState.vas_pain} / 10</strong>
                </label>
                <span className="text-[11px] text-slate-400">
                  {clinicalState.vas_pain <= 3 ? 'Hafif Ağrı' : clinicalState.vas_pain <= 6 ? 'Orta Düzey Ağrı' : 'Şiddetli Ağrı'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={clinicalState.vas_pain || 5}
                onChange={e => setClinicalState({ ...clinicalState, vas_pain: parseInt(e.target.value, 10) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ağrı / Patoloji Bölgesi</label>
                <input
                  type="text"
                  placeholder="Örn: L4-L5 Bel Fıtığı, Sağ Omuz Rotator Cuff"
                  value={clinicalState.pain_location || ''}
                  onChange={e => setClinicalState({ ...clinicalState, pain_location: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Eklem Açıklığı (ROM) &amp; Test Notu</label>
                <input
                  type="text"
                  placeholder="Örn: Lasegue (+), Fleksiyon 60° kısıtlı"
                  value={clinicalState.rom_notes || ''}
                  onChange={e => setClinicalState({ ...clinicalState, rom_notes: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        )}

        {sector.sectorKey === 'pilates' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Esneklik Skoru (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={clinicalState.flexibility_score || 6}
                onChange={e => setClinicalState({ ...clinicalState, flexibility_score: parseInt(e.target.value, 10) })}
                className="input-field font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Postür Analizi &amp; Kısıtlılık</label>
              <input
                type="text"
                placeholder="Örn: Anterior Pelvik Tilt, Kifoz"
                value={clinicalState.posture_assessment || ''}
                onChange={e => setClinicalState({ ...clinicalState, posture_assessment: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        )}

        {sector.sectorKey === 'psikoloji' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Seans Duygudurum Puanı (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={clinicalState.mood_score || 6}
                onChange={e => setClinicalState({ ...clinicalState, mood_score: parseInt(e.target.value, 10) })}
                className="input-field font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Haftalık Ev Ödevi / Seans Teması</label>
              <input
                type="text"
                placeholder="Örn: Düşünce günlüğü tutulacak, 4-7-8 nefes"
                value={clinicalState.homework_notes || ''}
                onChange={e => setClinicalState({ ...clinicalState, homework_notes: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        )}
      </div>

      {/* Edit Patient Modal */}
      {showEditModal && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <h3 className="text-[16px] font-bold text-gray-800">{sector.clientSingular} Bilgilerini Düzenle</h3>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Ad Soyad *</label>
                  <input
                    required
                    type="text"
                    value={editData.full_name || ''}
                    onChange={e => setEditData({ ...editData, full_name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Telefon *</label>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={editData.phone || ''}
                    onChange={e => setEditData({ ...editData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">E-posta</label>
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={e => setEditData({ ...editData, email: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Yaş</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={editData.age ?? ''}
                    onChange={e => setEditData({ ...editData, age: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Cinsiyet</label>
                  <select
                    value={editData.gender || ''}
                    onChange={e => setEditData({ ...editData, gender: e.target.value })}
                    className="input-field bg-white"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Erkek">Erkek</option>
                    <option value="Kadın">Kadın</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Adres</label>
                  <input
                    type="text"
                    value={editData.address || ''}
                    onChange={e => setEditData({ ...editData, address: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">{sector.complaintLabel}</label>
                  <input
                    type="text"
                    value={editData.complaint || ''}
                    onChange={e => setEditData({ ...editData, complaint: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Planlanan Seans Sayısı</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editData.total_sessions || 10}
                    onChange={e => setEditData({ ...editData, total_sessions: parseInt(e.target.value, 10) || 10 })}
                    className="input-field font-bold text-emerald-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Notlar</label>
                  <textarea
                    rows={2}
                    value={editData.notes || ''}
                    onChange={e => setEditData({ ...editData, notes: e.target.value })}
                    className="input-field resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="h-9 px-4 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-5 rounded-xl text-[13px] font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Patient Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeletePatient}
        isLoading={deleting}
        title={`${sector.clientSingular}ı Silmek İstediğinize Emin misiniz?`}
        message={`"${patient?.full_name}" isimli ${sector.clientSingular.toLowerCase()}ı ve bu kayda ait TÜM randevu geçmişini silmek üzeresiniz. Bu işlem geri alınamaz.`}
        confirmText={`Evet, ${sector.clientSingular}ı Sil`}
        cancelText="Vazgeç"
        type="danger"
      />

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Seans Geçmişi &amp; Randevular</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Seansları haftaya aynı güne tek tıkla kopyalayabilir veya WhatsApp ile hatırlatma iletebilirsiniz.</p>
          </div>
          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">{sessions.length} seans</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="text-left px-5 py-3">#</th>
                <th className="text-left px-5 py-3">Tarih &amp; Gün</th>
                <th className="text-left px-5 py-3">Saat</th>
                <th className="text-left px-5 py-3">{sector.serviceSingular}</th>
                <th className="text-left px-5 py-3">Hizmet Yeri</th>
                <th className="text-left px-5 py-3">{sector.staffSingular}</th>
                <th className="text-left px-5 py-3">Durum</th>
                <th className="text-right px-5 py-3">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    Kayıtlı seans bulunmuyor.
                  </td>
                </tr>
              ) : (
                sessions.map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-400 font-bold text-[12px]">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{formatTurkishDate(s.session_date)}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-medium text-slate-700">
                      {s.session_time?.substring(0, 5)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {s.treatment?.name || 'Genel Seans'}
                    </td>
                    <td className="px-5 py-3.5">
                      <LocationBadge location={getSessionLocation(s)} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-[12px]">
                      {s.therapist ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.therapist.color || '#059669' }} />
                          <span className="font-medium text-slate-800">{s.therapist.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.status === 'tamamlandi' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Tamamlandı
                        </span>
                      ) : s.status === 'ertelendi' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          ⏰ Ertelendi
                        </span>
                      ) : s.status === 'iptal' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          ✕ İptal Edildi
                        </span>
                      ) : s.status === 'gelmedi' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          🚫 Gelmedi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          ● Bekliyor
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openCopyModal(s)}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                          title="Bu seansı haftaya aynı güne veya istediğiniz tarihe kopyalar"
                        >
                          <Copy size={11} className="text-slate-500" />
                          <span>Kopyala</span>
                        </button>
                        {s.status === 'bekliyor' && (
                          <button
                            onClick={() => {
                              const patientSession = { ...s, patient };
                              sendWhatsAppReminder(patientSession);
                            }}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="WhatsApp Randevu Hatırlatması Gönder"
                          >
                            <MessageCircle size={12} className="text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ Randevuyu Kopyala Modal ═══ */}
      {copyModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setCopyModalSession(null)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">Randevuyu Kopyala</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{patient.full_name} için seans kopyalanıyor</p>
              </div>
              <button
                onClick={() => setCopyModalSession(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCopySubmit} className="space-y-4 text-[13px]">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Kopyalanacak Kaynak Seans</span>
                  <span className="text-slate-600 font-medium">{copyModalSession.treatment?.name}</span>
                </div>
                <p className="text-slate-700">
                  {formatTurkishDate(copyModalSession.session_date)} — Saat: <strong className="text-slate-900 font-mono">{copyModalSession.session_time?.substring(0, 5)}</strong>
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Hedef Randevu Tarihi *</label>
                  <span className="text-[11px] text-emerald-700 font-medium">Varsayılan: Haftaya Aynı Gün</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[
                    { weeks: 1, label: '+1 Hafta (Önerilen)' },
                    { weeks: 2, label: '+2 Hafta' },
                    { weeks: 3, label: '+3 Hafta' },
                    { weeks: 4, label: '+4 Hafta' },
                  ].map(btn => {
                    const btnTargetDate = addDays(copyModalSession.session_date, btn.weeks * 7);
                    const isSelected = copyDate === btnTargetDate;
                    return (
                      <button
                        key={btn.weeks}
                        type="button"
                        onClick={() => setQuickWeeks(btn.weeks)}
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
                  min={new Date().toISOString().split('T')[0]}
                  value={copyDate}
                  onChange={e => setCopyDate(e.target.value)}
                  className="input-field font-medium text-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Seçilen gün: <strong className="text-slate-800">{formatTurkishDate(copyDate)}</strong>
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Hedef Randevu Saati *</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCopyTime(t)}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-medium border transition-colors cursor-pointer ${
                        copyTime === t
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
                  value={copyTime}
                  onChange={e => setCopyTime(e.target.value)}
                  className="input-field font-mono font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">{sector.staffSingular}</label>
                  <select
                    value={copyTherapistId}
                    onChange={e => setCopyTherapistId(e.target.value)}
                    className="input-field text-[12px] bg-white"
                  >
                    <option value="">{sector.staffSingular} seçiniz...</option>
                    {staffList.map(st => (
                      <option key={st.id} value={st.id}>{st.full_name} ({st.title || sector.staffTitle})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">{sector.serviceSingular}</label>
                  <select
                    value={copyTreatmentId}
                    onChange={e => setCopyTreatmentId(e.target.value)}
                    className="input-field text-[12px] bg-white"
                  >
                    <option value="">{sector.serviceSingular} seçiniz...</option>
                    {treatmentList.map(tr => (
                      <option key={tr.id} value={tr.id}>{tr.name} {tr.price ? `(₺${tr.price})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <LocationSelector 
                value={copyLocation} 
                onChange={setCopyLocation} 
                clinic={clinic}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCopyModalSession(null)}
                  className="h-9 px-4 rounded-xl text-[12px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={copying}
                  className="h-9 px-5 rounded-xl text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {copying ? 'Kopyalanıyor...' : 'Randevuyu Kopyala & Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Yeni Seans Paketi Tanımlama / Yenileme Modalı ═══ */}
      {renewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setRenewModalOpen(false)} />
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 sm:p-7 z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900">Yeni {sector.serviceSingular} Paketi Tanımla</h3>
                <p className="text-[12px] text-gray-500 mt-0.5">{patient.full_name} için seans hakkı ekleyin</p>
              </div>
              <button 
                onClick={() => setRenewModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Sektöre Özel Önerilen Hazır Paketler */}
            {sector.suggestedPackages && sector.suggestedPackages.length > 0 && (
              <div className="mb-5 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {sector.badge} — Önerilen Paketler
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {sector.suggestedPackages.map((pkg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applySuggestedPackage(pkg)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-slate-800 bg-slate-50 hover:bg-white text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="text-[13px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {pkg.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {pkg.sessions} Seans · {pkg.discountLabel}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-800 text-[13px]">
                        {pkg.price ? `${pkg.price} ₺` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl mb-5 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mevcut Toplam</span>
                <span className="text-base font-black text-slate-800 font-mono block mt-0.5">{totalPlanned} Seans</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tamamlanan</span>
                <span className="text-base font-black text-slate-800 font-mono block mt-0.5">{completedCount} Seans</span>
              </div>
              <div className="rounded-lg bg-white border border-slate-200/90 py-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Şu Anki Kalan</span>
                <span className={`text-base font-black font-mono block mt-0.5 ${remaining === 0 ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
                  {remaining} Seans
                </span>
              </div>
            </div>

            <form onSubmit={handleRenewPackageSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                  Eklenecek Seans Sayısı <span className="text-rose-500">*</span>
                </label>
                
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {[4, 8, 10, 12, 16].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAddedSessions(num)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                        Number(addedSessions) === num
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      +{num} Seans {num === 8 ? '(Standart Paket)' : ''}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    required
                    type="number"
                    min="1"
                    max="100"
                    value={addedSessions}
                    onChange={e => setAddedSessions(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-[15px] font-bold font-mono outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                  <span className="text-[13px] font-medium text-gray-500 whitespace-nowrap">Seans</span>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                  Dönem / Paket Notu (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: 2. Dönem Devam Paketi"
                  value={packageNote}
                  onChange={e => setPackageNote(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-2xs space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Güncelleme Sonrası Durum</span>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-300">Yeni Toplam Seans:</span>
                  <span className="font-bold font-mono text-white text-base">
                    {totalPlanned + (parseInt(addedSessions, 10) || 0)} Seans
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px] pt-1.5 border-t border-slate-800">
                  <span className="text-emerald-400 font-semibold">Yeni Kullanılabilir Kalan:</span>
                  <span className="font-black font-mono text-emerald-400 text-lg">
                    {remaining + (parseInt(addedSessions, 10) || 0)} Seans
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-[13px] font-semibold transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={renewing}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {renewing ? 'Tanımlanıyor...' : `+ ${parseInt(addedSessions, 10) || 0} Seansı Onayla ve Tanımla`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight, danger, subtitle }) {
  return (
    <div className="px-5 py-4 text-center">
      <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-black ${danger ? 'text-red-500' : highlight ? 'text-emerald-600' : 'text-gray-900'}`}>{value}</p>
      {subtitle && <p className="text-[11px] text-gray-400 font-medium mt-0.5">{subtitle}</p>}
    </div>
  );
}
