import { useState } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Plus, X, CheckCircle2, Clock } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

export default function Sessions({ sessions, patients, treatments, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ patient_id: '', treatment_id: '', session_date: '', session_time: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/sessions`, formData);
      setShowForm(false);
      refresh();
    } catch (err) {
      alert('Seans eklenirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const completeSession = async (id) => {
    try {
      await axios.put(`${API_URL}/sessions/${id}`, { status: 'tamamlandi' });
      refresh();
    } catch (err) {
      alert('İşlem başarısız');
    }
  };

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <div className="bg-orange-50 p-2.5 rounded-xl border border-orange-100 text-orange-600">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Seans Takvimi</h3>
            <p className="text-slate-500 text-xs font-medium">Yaklaşan ve geçmiş tüm randevular.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className={`px-6 py-3 rounded-xl flex items-center text-sm font-bold transition-all shadow-sm ${
            showForm 
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
              : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-orange-500/20 hover:-translate-y-0.5'
          }`}
        >
          {showForm ? <><X size={18} className="mr-2" /> Kapat</> : <><Plus size={18} className="mr-2" /> Randevu Oluştur</>}
        </button>
      </div>

      {/* Form Area */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-100 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5 lg:col-span-2">
              <label className="block text-sm font-bold text-slate-700">Hasta Seçin <span className="text-red-500">*</span></label>
              <select required className="w-full border-slate-200 bg-slate-50 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 p-3.5 border transition-colors font-medium text-slate-700" onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                <option value="">Seçiniz...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} {p.complaint ? `(${p.complaint})` : ''}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="block text-sm font-bold text-slate-700">Uygulanacak Tedavi <span className="text-red-500">*</span></label>
              <select required className="w-full border-slate-200 bg-slate-50 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 p-3.5 border transition-colors font-medium text-slate-700" onChange={e => setFormData({...formData, treatment_id: e.target.value})}>
                <option value="">Seçiniz...</option>
                {treatments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.duration_minutes} dk)</option>)}
              </select>
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="block text-sm font-bold text-slate-700">Tarih <span className="text-red-500">*</span></label>
              <input required type="date" className="w-full border-slate-200 bg-slate-50 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 p-3.5 border transition-colors font-bold text-slate-700" onChange={e => setFormData({...formData, session_date: e.target.value})} />
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="block text-sm font-bold text-slate-700">Saat <span className="text-red-500">*</span></label>
              <input required type="time" className="w-full border-slate-200 bg-slate-50 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 p-3.5 border transition-colors font-bold text-slate-700" onChange={e => setFormData({...formData, session_time: e.target.value})} />
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button type="submit" disabled={submitting} className="px-8 py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all disabled:opacity-70 flex items-center">
              {submitting ? 'Kaydediliyor...' : 'Randevuyu Kaydet'}
            </button>
          </div>
        </form>
      )}

      {/* List of Sessions */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
        {sessions.length === 0 ? (
           <div className="text-center py-20">
             <CalendarIcon size={48} className="mx-auto text-slate-300 mb-4" />
             <p className="text-slate-500 font-medium">Henüz randevu kaydı bulunmuyor.</p>
           </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Tarih / Saat</th>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Hasta Bilgisi</th>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Hizmet</th>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Durum</th>
                <th className="px-8 py-5 text-right text-xs font-black text-slate-500 uppercase tracking-widest">İşlem</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100/80">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="font-bold text-slate-800 text-base">{new Date(s.session_date).toLocaleDateString('tr-TR')}</div>
                    <div className="text-sm text-orange-600 font-bold flex items-center mt-1"><Clock size={14} className="mr-1"/> {s.session_time.substring(0,5)}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="font-bold text-slate-900 text-base">{s.patient?.full_name}</div>
                    <div className="text-xs text-slate-500 font-medium mt-1">{s.patient?.phone}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200">
                      {s.treatment?.name}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    {s.status === 'tamamlandi' ? (
                       <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-50 text-teal-700 font-bold text-xs border border-teal-200 shadow-sm">
                         <CheckCircle2 size={14} /> <span>Tamamlandı</span>
                       </span>
                    ) : (
                       <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-orange-50 text-orange-700 font-bold text-xs border border-orange-200 shadow-sm">
                         <Clock size={14} /> <span>Bekliyor</span>
                       </span>
                    )}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-right">
                    {s.status === 'bekliyor' && (
                      <button 
                        onClick={() => completeSession(s.id)} 
                        className="text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all hover:-translate-y-0.5"
                      >
                        Seansı Bitir
                      </button>
                    )}
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
