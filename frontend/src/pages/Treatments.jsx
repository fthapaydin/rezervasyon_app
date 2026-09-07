import { useState } from 'react';
import axios from 'axios';
import { Plus, X, Clock, Wallet, Pencil, Trash2, Activity, Users, CheckCircle2 } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import ConfirmModal from '../components/ui/ConfirmModal';
import EmptyState from '../components/ui/EmptyState';
import { API_URL } from '../lib/api';
import { getTreatmentAssignedStaff, syncTreatmentStaffToClinic } from '../lib/rbacUtils';

export default function Treatments({ clinic, treatments = [], staff = [], refresh }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    duration_minutes: 60,
    assigned_staff_ids: []
  });
  const [editItem, setEditItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Hizmet uygulayabilecek personeller (Terapistler ve Yöneticiler)
  const eligibleStaff = staff.filter(s => s.role === 'therapist' || s.role === 'admin');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let savedTreatmentId = editItem?.id;
      if (editItem) {
        await axios.put(`${API_URL}/treatments/${editItem.id}`, formData);
        toast.success(`"${formData.name}" tedavisi güncellendi.`, 'Tedavi Güncellendi');
      } else {
        const res = await axios.post(`${API_URL}/treatments`, {
          ...formData,
          clinic_id: clinic?.id,
        });
        savedTreatmentId = res.data?.id;
        toast.success(`"${formData.name}" tedavisi eklendi.`, 'Tedavi Eklendi');
      }

      if (savedTreatmentId) {
        await syncTreatmentStaffToClinic(clinic, savedTreatmentId, formData.assigned_staff_ids || []);
      }

      setShowForm(false);
      setEditItem(null);
      setFormData({ name: '', price: '', duration_minutes: 60, assigned_staff_ids: [] });
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'İşlem sırasında hata oluştu', 'Hata');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (t) => {
    setEditItem(t);
    const assigned = getTreatmentAssignedStaff(t, clinic);
    setFormData({ 
      name: t.name, 
      price: t.price, 
      duration_minutes: t.duration_minutes || 60,
      assigned_staff_ids: assigned || []
    });
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/treatments/${itemToDelete.id}`);
      toast.success(`"${itemToDelete.name}" tedavisi silindi.`, 'Tedavi Silindi');
      setShowDeleteModal(false);
      setItemToDelete(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Silme sırasında hata oluştu.', 'Hata');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        isLoading={deleting}
        title="Tedavi / Hizmeti Sil"
        message={`"${itemToDelete?.name}" tedavisini silmek istediğinize emin misiniz?`}
        confirmText="Evet, Sil"
        type="danger"
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500 font-medium">{treatments.length} aktif hizmet kayıtlı</p>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditItem(null);
            } else {
              setFormData({ name: '', price: '', duration_minutes: 60, assigned_staff_ids: [] });
              setShowForm(true);
            }
          }}
          className="h-10 px-4 rounded-xl text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          <span>{showForm ? 'Formu Kapat' : 'Yeni Tedavi Ekle'}</span>
        </button>
      </div>

      {/* Add / Edit Form Modal/Card */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-800">
              {editItem ? 'Tedavi Bilgilerini Düzenle' : 'Yeni Tedavi & Hizmet Tanımla'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1">Tedavi Adı</label>
              <input
                type="text"
                required
                placeholder="Örn: Manuel Terapi"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1">Seans Ücreti (₺)</label>
              <input
                type="number"
                required
                placeholder="Örn: 800"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1">Seans Süresi (Dakika)</label>
              <input
                type="number"
                required
                placeholder="60"
                value={formData.duration_minutes}
                onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value, 10) || 60 })}
                className="input-field"
              />
            </div>
          </div>

          {/* Terapist / Doktor Atama */}
          {eligibleStaff.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1.5">
                  <Users size={14} className="text-emerald-600" />
                  <span>Bu Tedaviyi Uygulayan Uzmanlar</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.assigned_staff_ids?.length === eligibleStaff.length) {
                        setFormData({ ...formData, assigned_staff_ids: [] });
                      } else {
                        setFormData({ ...formData, assigned_staff_ids: eligibleStaff.map(s => s.id) });
                      }
                    }}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    {formData.assigned_staff_ids?.length === eligibleStaff.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mb-2.5">
                Tedaviyi sadece seçili terapistler uygulayabilir. Boş bırakırsanız kliniğin tüm uzmanları için geçerli olur.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {eligibleStaff.map(s => {
                  const isChecked = formData.assigned_staff_ids?.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'border-emerald-300 bg-emerald-50/60 text-emerald-950 font-semibold'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50/40 text-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                        checked={isChecked}
                        onChange={e => {
                          const next = e.target.checked
                            ? [...(formData.assigned_staff_ids || []), s.id]
                            : (formData.assigned_staff_ids || []).filter(id => id !== s.id);
                          setFormData({ ...formData, assigned_staff_ids: next });
                        }}
                      />
                      <div
                        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: s.color || '#059669' }}
                      >
                        {s.full_name?.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] truncate">{s.full_name}</div>
                        <div className="text-[10px] text-gray-400 truncate">{s.title || (s.role === 'admin' ? 'Yönetici' : 'Fizyoterapist')}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditItem(null); }}
              className="h-10 px-4 rounded-xl text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {submitting ? 'Kaydediliyor...' : editItem ? 'Değişiklikleri Kaydet' : 'Tedaviyi Kaydet'}
            </button>
          </div>
        </form>
      )}

      {/* Cards Grid */}
      {treatments.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Henüz tedavi veya hizmet eklenmemiş"
          description="Kliniğinizde sunulan manuel terapi, kuru iğneleme, pilates gibi hizmetleri buradan tanımlayabilirsiniz."
          actionText="İlk Tedaviyi Ekle"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {treatments.map(t => {
            const assigned = getTreatmentAssignedStaff(t, clinic);
            const matchedStaff = staff.filter(s => assigned.includes(s.id));

            return (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-md transition-all group relative flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-[14px] font-bold text-gray-900 leading-snug">{t.name}</h4>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(t)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-emerald-700 transition-colors cursor-pointer"
                        title="Düzenle"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete(t);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-1.5 text-gray-400"><Clock size={14}/> Süre</span>
                      <span className="font-semibold text-gray-700">{t.duration_minutes} dk</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-1.5 text-gray-400"><Wallet size={14}/> Fiyat</span>
                      <span className="font-black text-emerald-600 font-mono">{t.price} ₺</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Therapists Badge */}
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 font-medium">Uygulayanlar:</span>
                  {matchedStaff.length === 0 ? (
                    <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      Tüm Uzmanlar
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {matchedStaff.slice(0, 3).map(m => (
                          <div
                            key={m.id}
                            className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white shadow-2xs shrink-0"
                            style={{ backgroundColor: m.color || '#059669' }}
                            title={`${m.full_name} (${m.title || 'Fzt.'})`}
                          >
                            {m.full_name?.charAt(0)}
                          </div>
                        ))}
                      </div>
                      <span className="font-medium text-gray-700 truncate max-w-[90px] ml-1">
                        {matchedStaff.length === 1 ? matchedStaff[0].full_name.split(' ')[0] : `${matchedStaff.length} Uzman`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
