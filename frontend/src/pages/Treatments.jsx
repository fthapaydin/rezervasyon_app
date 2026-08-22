import { useState } from 'react';
import axios from 'axios';
import { Plus, X, Clock, Wallet } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

export default function Treatments({ treatments, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', duration_minutes: 60 });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/treatments`, formData);
      setShowForm(false);
      setFormData({ name: '', price: '', duration_minutes: 60 });
      refresh();
    } catch {
      alert('Hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-400">{treatments.length} hizmet kayıtlı</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`h-9 md:h-10 px-3.5 md:px-4 rounded-lg text-[12px] md:text-[13px] font-medium flex items-center gap-2 transition-all ${
            showForm ? 'bg-gray-100 text-gray-600' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
          }`}
        >
          {showForm ? <><X size={15}/> İptal</> : <><Plus size={15}/> Yeni Hizmet</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200/80 p-5 md:p-6">
          <h3 className="text-[14px] font-semibold text-gray-800 mb-4">Yeni Hizmet Ekle</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Hizmet Adı <span className="text-red-400">*</span></label>
              <input required type="text" placeholder="Manuel Terapi" className="input-field" onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Seans Fiyatı (₺) <span className="text-red-400">*</span></label>
              <input required type="number" placeholder="500" className="input-field" onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Süre (dk)</label>
              <input type="number" defaultValue={60} className="input-field" onChange={e => setFormData({...formData, duration_minutes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end mt-5 gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 rounded-lg text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Vazgeç</button>
            <button type="submit" disabled={submitting} className="h-9 px-5 rounded-lg text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm">
              {submitting ? 'Kaydediliyor...' : 'Kaydet'}
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
            <div key={t.id} className="bg-white rounded-xl border border-gray-200/80 p-5 hover:shadow-sm transition-shadow group">
              <h4 className="text-[14px] font-semibold text-gray-800 mb-4">{t.name}</h4>
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
