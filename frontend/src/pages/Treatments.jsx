import { useState } from 'react';
import axios from 'axios';
import { Plus, X, Clock, Wallet, Pencil, Trash2 } from 'lucide-react';

import { API_URL } from '../lib/api';

export default function Treatments({ treatments, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', duration_minutes: 60 });
  const [editItem, setEditItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editItem) {
        await axios.put(`${API_URL}/treatments/${editItem.id}`, formData);
      } else {
        await axios.post(`${API_URL}/treatments`, formData);
      }
      setShowForm(false);
      setEditItem(null);
      setFormData({ name: '', price: '', duration_minutes: 60 });
      refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'İşlem sırasında hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (t) => {
    setEditItem(t);
    setFormData({ name: t.name, price: t.price, duration_minutes: t.duration_minutes || 60 });
    setShowForm(true);
  };

  const handleDeleteClick = async (t) => {
    if (!window.confirm(`"${t.name}" tedavisini silmek istediğinize emin misiniz?`)) return;
    try {
      await axios.delete(`${API_URL}/treatments/${t.id}`);
      refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Silme sırasında hata oluştu.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-400">{treatments.length} hizmet kayıtlı</p>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditItem(null);
            } else {
              setEditItem(null);
              setFormData({ name: '', price: '', duration_minutes: 60 });
              setShowForm(true);
            }
          }}
          className={`h-9 md:h-10 px-3.5 md:px-4 rounded-lg text-[12px] md:text-[13px] font-medium flex items-center gap-2 transition-all ${
            showForm ? 'bg-gray-100 text-gray-600' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
          }`}
        >
          {showForm ? <><X size={15}/> İptal</> : <><Plus size={15}/> Yeni Hizmet</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200/80 p-5 md:p-6 shadow-sm">
          <h3 className="text-[14px] font-semibold text-gray-800 mb-4">
            {editItem ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Hizmet Adı <span className="text-red-400">*</span></label>
              <input
                required
                type="text"
                placeholder="Manuel Terapi"
                value={formData.name}
                className="input-field"
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Seans Fiyatı (₺) <span className="text-red-400">*</span></label>
              <input
                required
                type="number"
                placeholder="500"
                value={formData.price}
                className="input-field"
                onChange={e => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Süre (dk)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                className="input-field"
                onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value, 10) || 60 })}
              />
            </div>
          </div>
          <div className="flex justify-end mt-5 gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditItem(null); }}
              className="h-9 px-4 rounded-lg text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-5 rounded-lg text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'Kaydediliyor...' : editItem ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}

      {/* Cards Grid */}
      {treatments.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-[13px] text-gray-400">Henüz hizmet eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {treatments.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200/80 p-5 hover:shadow-md transition-all group relative">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-[14px] font-semibold text-gray-800">{t.name}</h4>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditClick(t)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-emerald-600 transition-colors"
                    title="Düzenle"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(t)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-1.5 text-gray-400"><Clock size={14}/> Süre</span>
                  <span className="font-semibold text-gray-700">{t.duration_minutes} dk</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-1.5 text-gray-400"><Wallet size={14}/> Fiyat</span>
                  <span className="font-bold text-emerald-600">{t.price} ₺</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

