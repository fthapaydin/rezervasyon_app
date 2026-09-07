import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { API_URL } from '../lib/api';
import { 
  Users, Plus, X, Pencil, Trash2, ShieldCheck, Stethoscope, UserCheck, Phone, Mail, 
  CheckCircle2, KeyRound, Layers, Check, Copy, Shield, Lock
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import ConfirmModal from '../components/ui/ConfirmModal';
import { 
  ALL_TABS, getDefaultTabsForRole, getStaffPassword, getStaffAllowedTabs, syncStaffMetaToClinic 
} from '../lib/rbacUtils';

const ROLE_MAP = {
  admin:     { label: 'Klinik Sahibi / Yönetici', icon: ShieldCheck, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  therapist: { label: 'Fizyoterapist',           icon: Stethoscope,  bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  secretary: { label: 'Sekreterlik / Danışma',    icon: UserCheck,    bg: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const COLOR_PRESETS = [
  '#059669', // Emerald
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#ea580c', // Orange
  '#db2777', // Pink
  '#0d9488', // Teal
  '#4b5563', // Gray
];

export default function Staff({ clinic, staff = [], refresh }) {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedPassId, setCopiedPassId] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    role: 'therapist',
    title: 'Fizyoterapist',
    color: '#059669',
    phone: '',
    email: '',
    password: '123456',
    allowed_tabs: getDefaultTabsForRole('therapist'),
  });

  const openAdd = () => {
    setModalMode('add');
    setSelectedStaff(null);
    setFormData({
      full_name: '',
      role: 'therapist',
      title: 'Fizyoterapist',
      color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
      phone: '',
      email: '',
      password: '123456',
      allowed_tabs: getDefaultTabsForRole('therapist'),
    });
    setShowModal(true);
  };

  const openEdit = (member) => {
    setModalMode('edit');
    setSelectedStaff(member);
    const pass = getStaffPassword(member, clinic);
    const tabs = getStaffAllowedTabs(member, clinic);
    setFormData({
      full_name: member.full_name || '',
      role: member.role || 'therapist',
      title: member.title || '',
      color: member.color || '#059669',
      phone: member.phone || '',
      email: member.email || '',
      password: pass,
      allowed_tabs: tabs,
    });
    setShowModal(true);
  };

  const handleRoleChange = (newRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      title: newRole === 'admin' 
        ? 'Klinik Sahibi / Yönetici' 
        : newRole === 'secretary' 
        ? 'Sekreter / Danışma' 
        : 'Fizyoterapist',
      allowed_tabs: getDefaultTabsForRole(newRole),
    }));
  };

  const toggleTab = (tabId) => {
    setFormData(prev => {
      const current = prev.allowed_tabs || [];
      const next = current.includes(tabId)
        ? current.filter(id => id !== tabId)
        : [...current, tabId];
      return { ...prev, allowed_tabs: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) return;

    setSubmitting(true);
    try {
      let targetStaffId = selectedStaff?.id;

      if (modalMode === 'add') {
        const payload = {
          ...formData,
          clinic_id: clinic?.id,
          is_active: true,
        };

        let { data, error } = await supabase.from('staff').insert([payload]).select();

        // Eğer veritabanında password veya allowed_tabs kolonları henüz eklenmemişse
        if (error && (error.message?.includes('password') || error.message?.includes('allowed_tabs'))) {
          delete payload.password;
          delete payload.allowed_tabs;
          const retry = await supabase.from('staff').insert([payload]).select();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          // Backend API fallback
          try {
            const apiRes = await axios.post(`${API_URL}/staff`, { ...payload, clinic_id: clinic?.id });
            targetStaffId = apiRes.data?.id;
          } catch (apiErr) {
            throw new Error(apiErr.response?.data?.error || error.message);
          }
        } else if (data?.[0]) {
          targetStaffId = data[0].id;
        }

        // Yedek JSONB senkronizasyonu
        if (targetStaffId) {
          await syncStaffMetaToClinic(clinic, targetStaffId, {
            password: formData.password,
            allowed_tabs: formData.allowed_tabs
          });
        }

        toast.success(`"${formData.full_name}" ekibe eklendi.`, 'Personel Kaydedildi');
      } else {
        const payload = { ...formData };
        let { error } = await supabase
          .from('staff')
          .update(payload)
          .eq('id', selectedStaff.id);

        if (error && (error.message?.includes('password') || error.message?.includes('allowed_tabs'))) {
          delete payload.password;
          delete payload.allowed_tabs;
          const retry = await supabase
            .from('staff')
            .update(payload)
            .eq('id', selectedStaff.id);
          error = retry.error;
        }

        if (error) {
          try {
            await axios.put(`${API_URL}/staff/${selectedStaff.id}`, payload);
          } catch (apiErr) {
            throw new Error(apiErr.response?.data?.error || error.message);
          }
        }

        // Yedek JSONB senkronizasyonu
        await syncStaffMetaToClinic(clinic, selectedStaff.id, {
          password: formData.password,
          allowed_tabs: formData.allowed_tabs
        });

        toast.success(`"${formData.full_name}" bilgileri güncellendi.`, 'Personel Güncellendi');
      }

      setShowModal(false);
      refresh();
    } catch (err) {
      toast.error(err.message || 'Personel kaydedilirken hata oluştu.', 'Hata');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('staff').delete().eq('id', staffToDelete.id);
      if (error) {
        await axios.delete(`${API_URL}/staff/${staffToDelete.id}`);
      }
      toast.success(`"${staffToDelete.full_name}" başarıyla silindi.`, 'Personel Silindi');
      setShowDeleteModal(false);
      setStaffToDelete(null);
      refresh();
    } catch (err) {
      toast.error(err.message || 'Silme işlemi sırasında hata oluştu.', 'Hata');
    } finally {
      setDeleting(false);
    }
  };

  const copyPassword = (staffId, pass) => {
    navigator.clipboard.writeText(pass);
    setCopiedPassId(staffId);
    toast.info('Personel başlangıç şifresi panoya kopyalandı.', 'Şifre Kopyalandı');
    setTimeout(() => setCopiedPassId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Personeli Sil"
        message={`"${staffToDelete?.full_name}" isimli personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        loading={deleting}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[13px] text-gray-500">
            Fizyoterapistlerinizi ve sekreterlerinizi ekleyin; kendi e-postalarıyla giriş yapıp sadece yetkili oldukları sekmeleri yönetebilirler.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Yeni Ekip Üyesi</span>
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            Henüz personel eklenmemiş. Yukarıdaki butondan fizyoterapist veya sekreter ekleyebilirsiniz.
          </div>
        ) : (
          staff.map((member) => {
            const roleInfo = ROLE_MAP[member.role] || ROLE_MAP.therapist;
            const RoleIcon = roleInfo.icon;
            const staffPass = getStaffPassword(member, clinic);
            const staffTabs = getStaffAllowedTabs(member, clinic);

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-[15px] shadow-sm shrink-0"
                        style={{ backgroundColor: member.color || '#059669' }}
                      >
                        {member.full_name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-[15px]">{member.full_name}</h4>
                        <p className="text-[12px] text-gray-400 font-medium">{member.title || 'Fizyoterapist'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(member)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Düzenle"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setStaffToDelete(member);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Role Badge & Color */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${roleInfo.bg}`}>
                      <RoleIcon size={12} />
                      <span>{roleInfo.label}</span>
                    </span>

                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                      style={{ backgroundColor: member.color || '#059669' }}
                      title="Takvim Rengi"
                    />
                  </div>

                  {/* Allowed Tabs Summary */}
                  <div className="mb-3 py-2 px-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <Layers size={13} className="text-slate-500" />
                      <span>Erişim İzinleri:</span>
                    </span>
                    <span className="font-bold text-slate-700">
                      {member.role === 'admin' ? 'Tam Yetki (9/9)' : `${staffTabs.length} Sekme`}
                    </span>
                  </div>

                  {/* Contact Info & Password */}
                  <div className="space-y-2 pt-3 border-t border-gray-100 text-[12px] text-gray-500">
                    {member.email && (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail size={13} className="text-gray-400 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-gray-400 shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-mono">
                        <KeyRound size={12} className="text-slate-400" /> Şifre: <strong className="text-slate-700">{staffPass}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => copyPassword(member.id, staffPass)}
                        className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                        title="Giriş şifresini kopyala"
                      >
                        {copiedPassId === member.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        <span>{copiedPassId === member.id ? 'Kopyalandı' : 'Kopyala'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                <h3 className="text-[16px] font-bold text-gray-900">
                  {modalMode === 'add' ? 'Yeni Personel Tanımla' : 'Personel Bilgilerini ve Yetkilerini Düzenle'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">Ad Soyad *</label>
                <input
                  required
                  type="text"
                  placeholder="Örn: Fzt. Ayşe Yılmaz"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Rol (Görev) *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="input-field bg-white"
                  >
                    <option value="therapist">Fizyoterapist (Kendi takvimi &amp; hastaları)</option>
                    <option value="secretary">Sekreterlik / Danışma (Randevu yönetimi)</option>
                    <option value="admin">Yönetici / Baş Hekim (Tüm yetkiler)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Unvan / Uzmanlık</label>
                  <input
                    type="text"
                    placeholder="Manuel Terapi Uzmanı"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Login Credentials: Email & Password */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-[13px]">
                  <KeyRound size={15} className="text-emerald-600" />
                  <span>Sisteme Giriş Bilgileri</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Personeliniz kliniğe giriş yaparken bu e-posta ve şifreyi kullanacaktır. Dilediğinde kendi ekranından şifresini değiştirebilir.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-600 mb-1">Giriş E-Postası *</label>
                    <input
                      required
                      type="email"
                      placeholder="ayse@klinik.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-gray-600 mb-1">Başlangıç Şifresi *</label>
                    <input
                      required
                      type="text"
                      placeholder="123456"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-field bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">İletişim Telefonu</label>
                  <input
                    type="tel"
                    placeholder="05XXXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field bg-white"
                  />
                </div>
              </div>

              {/* Calendar Color Picker */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-2">Takvimde Terapist Rengi</label>
                <div className="flex items-center gap-3">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-emerald-600 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formData.color === color && <CheckCircle2 size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* RBAC Allowed Tabs Selection */}
              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[12px] font-bold text-gray-800 flex items-center gap-1.5">
                      <Shield size={14} className="text-emerald-600" />
                      <span>Erişebileceği Sekmeler &amp; Sayfalar</span>
                    </label>
                    <p className="text-[11px] text-gray-400">
                      Personelin sol menüde görebileceği sekmeleri belirleyin.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allowed_tabs: ALL_TABS.map(t => t.id) })}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                    >
                      Tümü
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allowed_tabs: getDefaultTabsForRole(formData.role) })}
                      className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 hover:underline cursor-pointer"
                    >
                      Varsayılan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_TABS.map((tab) => {
                    const isChecked = formData.allowed_tabs?.includes(tab.id);
                    return (
                      <label
                        key={tab.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950 font-medium'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50/30 text-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                          checked={isChecked}
                          onChange={() => toggleTab(tab.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-bold leading-tight">{tab.label}</div>
                          <div className="text-[10px] text-gray-400 truncate mt-0.5">{tab.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-10 px-4 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 rounded-xl text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Kaydediliyor...' : modalMode === 'add' ? 'Personeli Ekle' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
