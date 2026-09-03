import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, Phone, Search, ArrowLeft, Mail, MapPin, CheckCircle2, Clock, FileDown, AlertTriangle, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { generateSessionReport, generatePatientSummary } from '../lib/pdfGenerator';
import { sendWhatsAppReminder } from '../lib/reminder';
import { useToast } from '../components/ui/Toast';
import ConfirmModal from '../components/ui/ConfirmModal';
import EmptyState from '../components/ui/EmptyState';

import { API_URL } from '../lib/api';

export default function Patients({ clinic, patients, sessions, selectedPatientId, setSelectedPatientId, refresh }) {
  if (selectedPatientId) {
    return <PatientDetail id={selectedPatientId} onBack={() => setSelectedPatientId(null)} refresh={refresh} allPatients={patients} />;
  }

  return <PatientList clinic={clinic} patients={patients} sessions={sessions} onSelect={setSelectedPatientId} refresh={refresh} />;
}

// ─── Patient List ────────────────────────────────────────
function PatientList({ clinic, patients, sessions, onSelect, refresh }) {
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
      toast.warning('Lütfen geçerli bir telefon numarası giriniz (10 veya 11 haneli sayı, Örn: 05551234567).', 'Geçersiz Telefon');
      return;
    }

    const last10 = cleanedPhone.slice(-10);
    const existingWithPhone = patients.find(p => p.phone && p.phone.replace(/\D/g, '').slice(-10) === last10);
    if (existingWithPhone) {
      toast.error(
        `Bu telefon numarası (${cleanedPhone}) zaten "${existingWithPhone.full_name}" adlı hastaya aittir. Aynı numarayla mükerrer kayıt oluşturulamaz.`,
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
      toast.success(`"${formData.full_name}" başarıyla kaydedildi.`, 'Hasta Eklendi');
      setShowForm(false);
      setFormData({ full_name: '', phone: '', email: '', age: '', gender: '', address: '', complaint: '', total_sessions: 10, notes: '' });
      refresh();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Hasta kaydedilirken hata oluştu';
      toast.error(errorMsg, 'Kayıt Hatası');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const handlePhoneChange = (e) => {
    // Only allow numbers, maximum 11 digits
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
          <input type="text" placeholder="Hasta ara..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 bg-white text-[13px] placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className={`h-10 px-4 rounded-lg text-[13px] font-semibold transition-colors shrink-0 cursor-pointer ${showForm ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xs'}`}>
          {showForm ? 'İptal' : '+ Yeni Hasta'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200/80 p-5 md:p-6">
          <h3 className="text-[14px] font-semibold text-gray-800 mb-1">Yeni Hasta Kaydı</h3>
          <p className="text-[12px] text-gray-400 mb-5">Tüm iletişim bilgilerini ve tedavi planını girin.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Ad Soyad <span className="text-red-400">*</span></label>
              <input required type="text" placeholder="Ahmet Yılmaz" value={formData.full_name} className="input-field" onChange={e => set('full_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Telefon (10-11 Hane) <span className="text-red-400">*</span></label>
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
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">E-posta</label>
              <input type="email" placeholder="ornek@mail.com" value={formData.email} className="input-field" onChange={e => set('email', e.target.value)} />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Yaş (0-120)</label>
              <input 
                type="number" 
                min={0} 
                max={120} 
                placeholder="34" 
                value={formData.age} 
                className="input-field" 
                onChange={e => {
                  const val = e.target.value;
                  set('age', val === '' ? '' : Math.max(0, Math.min(120, parseInt(val, 10) || 0)));
                }} 
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Cinsiyet</label>
              <select className="input-field" value={formData.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Seçiniz</option>
                <option value="Erkek">Erkek</option>
                <option value="Kadın">Kadın</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Adres</label>
              <input type="text" placeholder="İlçe / Mahalle" value={formData.address} className="input-field" onChange={e => set('address', e.target.value)} />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Şikayeti / Ön Tanı</label>
              <input type="text" placeholder="Bel fıtığı, Boyun düzleşmesi, Kırık sonrası rehabilitasyon..." value={formData.complaint} className="input-field" onChange={e => set('complaint', e.target.value)} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Planlanan Seans (1-100)</label>
              <input 
                type="number" 
                min={1} 
                max={100} 
                value={formData.total_sessions} 
                className="input-field font-semibold text-emerald-700" 
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  set('total_sessions', isNaN(val) ? '' : Math.max(1, Math.min(100, val)));
                }} 
              />
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hasta</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">İletişim</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tanı</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Seans İlerlemesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-[13px] text-gray-400">
                  {search ? 'Eşleşen hasta bulunamadı.' : 'Henüz hasta kaydı yok.'}
                </td></tr>
              )}
              {filtered.map(p => {
                const info = getSessionInfo(p.id);
                const totalPlanned = p.total_sessions || 10;
                const pct = Math.min(100, Math.round((info.completed / totalPlanned) * 100));
                return (
                  <tr key={p.id} onClick={() => onSelect(p.id)} className="hover:bg-gray-50/60 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-[12px] font-bold shrink-0">
                          {p.full_name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-[13px] font-semibold text-gray-800 block">{p.full_name}</span>
                          {p.age && <span className="text-[11px] text-gray-400">{p.age} yaş{p.gender ? ` · ${p.gender}` : ''}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] text-gray-600">{p.phone}</p>
                      {p.email && <p className="text-[11px] text-gray-400">{p.email}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.complaint
                        ? <span className="inline-block px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[12px] font-medium">{p.complaint}</span>
                        : <span className="text-[12px] text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-[12px] text-gray-500 font-medium whitespace-nowrap">{info.completed}/{totalPlanned}</span>
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
function PatientDetail({ id, onBack, refresh, allPatients = [] }) {
  const { toast } = useToast();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPatientDetail = async () => {
    try {
      const res = await axios.get(`${API_URL}/patients/${id}`);
      setPatient(res.data);
      setEditData(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetail();
  }, [id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const cleanedPhone = editData.phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10 || cleanedPhone.length > 11) {
      toast.warning('Lütfen geçerli bir telefon numarası giriniz (Örn: 05XXXXXXXXX).', 'Geçersiz Telefon');
      return;
    }

    // Başka bir hastada bu numara kayıtlı mı kontrolü
    const last10 = cleanedPhone.slice(-10);
    const conflictPatient = allPatients.find(p => p.id !== id && p.phone && p.phone.replace(/\D/g, '').slice(-10) === last10);
    if (conflictPatient) {
      toast.error(
        `Bu telefon numarası (${cleanedPhone}) zaten "${conflictPatient.full_name}" adlı başka bir hastaya aittir.`,
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
      toast.success('Hasta bilgileri güncellendi.', 'Başarılı');
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
      toast.success(`"${patient.full_name}" ve tüm geçmiş kayıtları silindi.`, 'Hasta Silindi');
      setShowDeleteModal(false);
      refresh();
      onBack();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Silme işlemi sırasında hata oluştu.', 'Silme Başarısız');
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!patient) return <p className="text-center text-gray-400 py-12">Hasta bulunamadı.</p>;

  const sessions = patient.sessions || [];
  const payments = patient.payments || [];
  const completedCount = sessions.filter(s => s.status === 'tamamlandi').length;
  const totalPlanned = patient.total_sessions || 10;
  const remaining = Math.max(0, totalPlanned - completedCount);
  const pct = Math.min(100, Math.round((completedCount / totalPlanned) * 100));
  
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalSessionCost = sessions.reduce((s, ses) => s + Number(ses.treatment?.price || 0), 0);
  const balanceDebt = Math.max(0, totalSessionCost - totalPaid);

  return (
    <div className="space-y-5">
      {/* Header Bar with Action & PDF Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button onClick={onBack} className="h-9 px-3.5 rounded-lg text-[12px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
          ← Hasta Listesine Dön
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => {
              setEditData(patient);
              setShowEditModal(true);
            }}
            className="h-9 px-3 rounded-lg text-[12px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            Düzenle
          </button>
          <button 
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
            className="h-9 px-3 rounded-lg text-[12px] font-medium text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hastayı Sil
          </button>
          <button 
            onClick={() => generateSessionReport(patient, sessions)}
            className="h-9 px-3 rounded-lg text-[12px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            Seans Raporu PDF
          </button>
          <button 
            onClick={() => generatePatientSummary(patient, sessions, payments)}
            className="h-9 px-3.5 rounded-lg text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer"
          >
            Hasta Özeti PDF
          </button>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center text-lg font-bold shrink-0">
              {patient.full_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{patient.full_name}</h2>
              {patient.complaint && <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[12px] font-medium">{patient.complaint}</span>}

              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[12px] text-gray-500">
                <span className="flex items-center gap-1"><Phone size={13}/> {patient.phone}</span>
                {patient.email && <span className="flex items-center gap-1"><Mail size={13}/> {patient.email}</span>}
                {patient.address && <span className="flex items-center gap-1"><MapPin size={13}/> {patient.address}</span>}
                {patient.age && <span>{patient.age} yaş{patient.gender ? ` · ${patient.gender}` : ''}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats with Debt Status */}
        <div className="border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <Stat label="Planlanan Seans" value={totalPlanned} />
          <Stat label="Tamamlanan" value={completedCount} />
          <Stat label="Kalan Seans" value={remaining} highlight />
          <Stat 
            label="Kalan Borç / Bakiye" 
            value={`${balanceDebt.toLocaleString('tr-TR')} ₺`} 
            danger={balanceDebt > 0} 
            subtitle={`Ödenen: ${totalPaid.toLocaleString('tr-TR')} ₺`}
          />
        </div>
      </div>

      {/* Edit Patient Modal */}
      {showEditModal && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <h3 className="text-[16px] font-semibold text-gray-800">Hasta Bilgilerini Düzenle</h3>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">Ad Soyad *</label>
                  <input
                    required
                    type="text"
                    value={editData.full_name || ''}
                    onChange={e => setEditData({ ...editData, full_name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">Telefon *</label>
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
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">E-posta</label>
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={e => setEditData({ ...editData, email: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">Yaş</label>
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
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">Cinsiyet</label>
                  <select
                    value={editData.gender || ''}
                    onChange={e => setEditData({ ...editData, gender: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Erkek">Erkek</option>
                    <option value="Kadın">Kadın</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">Adres</label>
                  <input
                    type="text"
                    value={editData.address || ''}
                    onChange={e => setEditData({ ...editData, address: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">Şikayeti / Ön Tanı</label>
                  <input
                    type="text"
                    value={editData.complaint || ''}
                    onChange={e => setEditData({ ...editData, complaint: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">Planlanan Seans Sayısı</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editData.total_sessions || 10}
                    onChange={e => setEditData({ ...editData, total_sessions: parseInt(e.target.value, 10) || 10 })}
                    className="input-field font-semibold text-emerald-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">Notlar</label>
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
                  className="h-9 px-4 rounded-lg text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-5 rounded-lg text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
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
        title="Hastayı Silmek İstediğinize Emin misiniz?"
        message={`"${patient?.full_name}" isimli hastayı ve bu hastaya ait TÜM randevu ve ödeme geçmişi kalıcı olarak silinecektir. Bu işlem geri alınamaz.`}
        confirmText="Evet, Hastayı Sil"
        cancelText="Vazgeç"
        type="danger"
      />
      <div className="bg-white rounded-xl border border-gray-200/80 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-gray-500">Tedavi İlerlemesi</span>
          <span className="text-[13px] font-bold text-emerald-600">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-gray-800">Seans Geçmişi</h3>
          <span className="text-[11px] text-gray-400">{sessions.length} kayıt</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">#</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tarih</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Saat</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tedavi</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Durum</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hatırlat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-[13px] text-gray-400">Seans kaydı yok.</td></tr>
              )}
              {sessions.map((s, i) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-[13px] font-bold text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3 text-[13px] font-medium text-gray-800">{new Date(s.session_date).toLocaleDateString('tr-TR')}</td>
                  <td className="px-5 py-3 text-[13px] text-gray-500">{s.session_time?.substring(0,5)}</td>
                  <td className="px-5 py-3 text-[13px] text-gray-600">{s.treatment?.name}</td>
                  <td className="px-5 py-3">
                    {s.status === 'tamamlandi'
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold"><CheckCircle2 size={11}/> Tamamlandı</span>
                      : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-semibold"><Clock size={11}/> Bekliyor</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {s.status === 'bekliyor' && (
                      <button
                        onClick={() => {
                          const patientSession = { ...s, patient };
                          sendWhatsAppReminder(patientSession);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold border border-emerald-200 transition-colors"
                        title="WhatsApp Randevu Hatırlatması Gönder"
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight, danger, subtitle }) {
  return (
    <div className="px-5 py-4 text-center">
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${danger ? 'text-red-500' : highlight ? 'text-emerald-600' : 'text-gray-900'}`}>{value}</p>
      {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}
