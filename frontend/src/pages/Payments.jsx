import { useState } from 'react';
import axios from 'axios';
import { CreditCard, Plus, X, Receipt, CheckCircle } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

export default function Payments({ payments, sessions, patients, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ patient_id: '', session_id: '', amount: '', payment_method: 'Nakit', installments: 1 });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/payments`, formData);
      setShowForm(false);
      refresh();
    } catch (err) {
      alert('Ödeme kaydedilirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-emerald-600">
            <CreditCard size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Finans & Muhasebe</h3>
            <p className="text-slate-500 text-xs font-medium">Tahsilat işlemlerinizi buradan takip edin.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className={`px-6 py-3 rounded-xl flex items-center text-sm font-bold transition-all shadow-sm ${
            showForm 
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-500/20 hover:-translate-y-0.5'
          }`}
        >
          {showForm ? <><X size={18} className="mr-2" /> Kapat</> : <><Plus size={18} className="mr-2" /> Tahsilat Gir</>}
        </button>
      </div>

      {/* Form Area */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl shadow-emerald-900/5 border border-emerald-100 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Hasta Seçin <span className="text-red-500">*</span></label>
              <select required className="w-full border-slate-200 bg-slate-50 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-3.5 border transition-colors font-medium text-slate-700" onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                <option value="">Seçiniz...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="block text-sm font-bold text-slate-700">Hangi Seans İçin? <span className="text-red-500">*</span></label>
              <select required className="w-full border-slate-200 bg-slate-50 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-3.5 border transition-colors font-medium text-slate-700" onChange={e => setFormData({...formData, session_id: e.target.value})}>
                <option value="">Seçiniz...</option>
                {sessions.filter(s => s.patient_id === formData.patient_id).map(s => (
                  <option key={s.id} value={s.id}>{new Date(s.session_date).toLocaleDateString('tr-TR')} - {s.treatment?.name} (Tutar: {s.treatment?.price} ₺)</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Tahsil Edilen Tutar (₺) <span className="text-red-500">*</span></label>
              <input required type="number" placeholder="Örn: 1500" className="w-full border-emerald-200 bg-emerald-50 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-3.5 border transition-colors font-black text-emerald-700 text-lg" onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Ödeme Yöntemi <span className="text-red-500">*</span></label>
              <select required className="w-full border-slate-200 bg-slate-50 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-3.5 border transition-colors font-bold text-slate-700" onChange={e => setFormData({...formData, payment_method: e.target.value})}>
                <option value="Nakit">Nakit</option>
                <option value="Kredi Kartı">Kredi Kartı</option>
                <option value="Havale/EFT">Havale/EFT</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Taksit Sayısı</label>
              <select className="w-full border-slate-200 bg-slate-50 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-3.5 border transition-colors font-bold text-slate-700" onChange={e => setFormData({...formData, installments: parseInt(e.target.value) || 1})}>
                <option value="1">Tek Çekim / Peşin</option>
                <option value="2">2 Taksit</option>
                <option value="3">3 Taksit</option>
                <option value="4">4 Taksit</option>
                <option value="6">6 Taksit</option>
                <option value="12">12 Taksit</option>
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button type="submit" disabled={submitting} className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-70 flex items-center tracking-wide">
              {submitting ? 'İşleniyor...' : <><CheckCircle size={20} className="mr-2"/> Tahsilatı Onayla</>}
            </button>
          </div>
        </form>
      )}

      {/* List of Payments */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
        {payments.length === 0 ? (
           <div className="text-center py-20">
             <Receipt size={48} className="mx-auto text-slate-300 mb-4" />
             <p className="text-slate-500 font-medium">Henüz bir ödeme kaydı bulunmuyor.</p>
           </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-widest">İşlem Tarihi</th>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Hasta Bilgisi</th>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Ödeme Detayı</th>
                <th className="px-8 py-5 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Tahsilat Tutarı</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100/80">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="font-bold text-slate-700">{new Date(p.payment_date).toLocaleDateString('tr-TR')}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="font-black text-slate-900 text-base">{p.patient?.full_name}</div>
                    <div className="text-xs text-slate-500 font-medium mt-1">İşlem: <span className="text-slate-700">{p.session?.treatment?.name}</span></div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="inline-flex flex-col items-start space-y-1">
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                        {p.payment_method}
                      </span>
                      {p.installments > 1 && (
                        <span className="text-xs text-emerald-600 font-black px-1">
                          {p.installments} Taksit
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-right">
                    <span className="text-xl font-black text-emerald-600 tracking-tight">{p.amount} ₺</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
