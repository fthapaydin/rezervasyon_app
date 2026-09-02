import { useState } from 'react';
import axios from 'axios';
import { Plus, X, Clock, Wallet, Pencil, Trash2, Activity } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import ConfirmModal from '../components/ui/ConfirmModal';
import EmptyState from '../components/ui/EmptyState';

import { API_URL } from '../lib/api';

export default function Treatments({ clinic, treatments, refresh }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', duration_minutes: 60 });
  const [editItem, setEditItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editItem) {
        await axios.put(`${API_URL}/treatments/${editItem.id}`, formData);
        toast.success(`"${formData.name}" tedavisi güncellendi.`, 'Tedavi Güncellendi');
      } else {
        await axios.post(`${API_URL}/treatments`, {
          ...formData,
          clinic_id: clinic?.id,
        });
        toast.success(`"${formData.name}" tedavisi eklendi.`, 'Tedavi Eklendi');
      }
      setShowForm(false);
      setEditItem(null);
      setFormData({ name: '', price: '', duration_minutes: 60 });
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'İşlem sırasında hata oluştu', 'Hata');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (t) => {
    setEditItem(t);
    setFormData({ name: t.name, price: t.price, duration_minutes: t.duration_minutes || 60 });
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
              setFormData({ name: '', price: '', duration_minutes: 60 });
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
          {treatments.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-md transition-all group relative">
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
          ))}
        </div>
      )}
    </div>
  );
}
