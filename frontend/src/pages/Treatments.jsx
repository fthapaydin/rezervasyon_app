import { useState } from 'react';
import axios from 'axios';
import { Plus, X, Activity, Clock, CreditCard } from 'lucide-react';

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
    } catch (err) {
      alert('Tedavi eklenirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 text-indigo-600">
            <Activity size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Tedaviler & Hizmetler</h3>
            <p className="text-slate-500 text-xs font-medium">Kliniğinizin sunduğu tüm paketler.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className={`px-6 py-3 rounded-xl flex items-center text-sm font-bold transition-all shadow-sm ${
            showForm 
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/20 hover:-translate-y-0.5'
          }`}
        >
          {showForm ? <><X size={18} className="mr-2" /> Kapat</> : <><Plus size={18} className="mr-2" /> Yeni Hizmet Ekle</>}
        </button>
      </div>

      {/* Form Area */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl shadow-indigo-900/5 border border-indigo-100 animate-in slide-in-from-top-4 fade-in duration-300">
          <h4 className="text-xl font-bold text-slate-800 mb-6">Hizmet Detayları</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
               <label className="block text-sm font-bold text-slate-700">Hizmet Adı <span className="text-red-500">*</span></label>
               <input required type="text" placeholder="Örn: Manuel Terapi" className="w-full border-slate-200 bg-slate-50 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-3.5 border transition-colors" onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
               <label className="block text-sm font-bold text-slate-700">Seans Fiyatı (₺) <span className="text-red-500">*</span></label>
               <input required type="number" placeholder="500" className="w-full border-slate-200 bg-slate-50 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-3.5 border transition-colors font-bold text-indigo-700" onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div className="space-y-1.5">
               <label className="block text-sm font-bold text-slate-700">Süre (Dakika) <span className="text-red-500">*</span></label>
               <input required type="number" defaultValue="60" className="w-full border-slate-200 bg-slate-50 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-3.5 border transition-colors" onChange={e => setFormData({...formData, duration_minutes: e.target.value})} />
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button type="submit" disabled={submitting} className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70 flex items-center">
              {submitting ? 'Kaydediliyor...' : 'Hizmeti Kaydet'}
            </button>
          </div>
        </form>
      )}

      {/* Grid of Treatments */}
      {treatments.length === 0 && !showForm ? (
         <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
           <Activity size={48} className="mx-auto text-slate-300 mb-4" />
           <h3 className="text-lg font-bold text-slate-600">Henüz hizmet eklenmemiş</h3>
           <p className="text-slate-400 text-sm mt-1">Hizmet Ekle butonuna tıklayarak ilk hizmetinizi oluşturun.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {treatments.map(t => (
            <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100 transition-colors -z-10"></div>
              
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-5 border border-indigo-100 shadow-sm">
                <Activity size={20} strokeWidth={2.5}/>
              </div>
              
              <h4 className="font-black text-slate-800 text-lg mb-6 leading-tight">{t.name}</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="flex items-center text-slate-500 font-bold uppercase tracking-wider text-[10px]"><Clock size={14} className="mr-1.5 text-indigo-500"/> Süre</span>
                  <span className="font-black text-slate-700">{t.duration_minutes} Dk</span>
                </div>
                <div className="flex justify-between items-center text-sm bg-indigo-50/50 p-3 rounded-xl border border-indigo-50">
                  <span className="flex items-center text-slate-500 font-bold uppercase tracking-wider text-[10px]"><CreditCard size={14} className="mr-1.5 text-indigo-500"/> Fiyat</span>
                  <span className="font-black text-indigo-700 text-base">{t.price} ₺</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
