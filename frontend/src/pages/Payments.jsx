import { useState } from 'react';
import axios from 'axios';
import { Plus, X, CheckCircle } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

export default function Payments({ payments, sessions, patients, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ patient_id: '', session_id: '', amount: '', payment_method: 'Nakit', installments: 1 });
  const [submitting, setSubmitting] = useState(false);

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/payments`, formData);
      setShowForm(false);
      refresh();
    } catch {
      alert('Hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-5">
      {/* Summary + Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[12px] text-gray-400 font-medium">Toplam Tahsilat</p>
            <p className="text-xl font-bold text-gray-900">{totalRevenue.toLocaleString('tr-TR')} ₺</p>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div>
            <p className="text-[12px] text-gray-400 font-medium">İşlem Sayısı</p>
            <p className="text-xl font-bold text-gray-900">{payments.length}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`h-10 px-4 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-all ${
            showForm ? 'bg-gray-100 text-gray-600' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
          }`}
        >
          {showForm ? <><X size={15}/> İptal</> : <><Plus size={15}/> Tahsilat Gir</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h3 className="text-[14px] font-semibold text-gray-800 mb-5">Yeni Tahsilat</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Hasta <span className="text-red-400">*</span></label>
              <select required className="input-field" onChange={e => set('patient_id', e.target.value)}>
                <option value="">Seçiniz...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Seans <span className="text-red-400">*</span></label>
              <select required className="input-field" onChange={e => set('session_id', e.target.value)}>
                <option value="">Önce hasta seçin...</option>
                {sessions.filter(s => s.patient_id === formData.patient_id).map(s => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.session_date).toLocaleDateString('tr-TR')} — {s.treatment?.name} ({s.treatment?.price} ₺)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Tutar (₺) <span className="text-red-400">*</span></label>
              <input required type="number" placeholder="1500" className="input-field font-semibold" onChange={e => set('amount', e.target.value)} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Ödeme Yöntemi <span className="text-red-400">*</span></label>
              <select className="input-field" onChange={e => set('payment_method', e.target.value)}>
                <option value="Nakit">Nakit</option>
                <option value="Kredi Kartı">Kredi Kartı</option>
                <option value="Havale/EFT">Havale / EFT</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Taksit</label>
              <select className="input-field" onChange={e => set('installments', parseInt(e.target.value) || 1)}>
                <option value="1">Peşin / Tek Çekim</option>
                <option value="2">2 Taksit</option>
                <option value="3">3 Taksit</option>
                <option value="4">4 Taksit</option>
                <option value="6">6 Taksit</option>
                <option value="12">12 Taksit</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-5 gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 rounded-lg text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Vazgeç</button>
            <button type="submit" disabled={submitting} className="h-9 px-5 rounded-lg text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-1.5">
              {submitting ? 'İşleniyor...' : <><CheckCircle size={14}/> Onayla</>}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tarih</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hasta</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hizmet</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Yöntem</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tutar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payments.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-[13px] text-gray-400">Henüz ödeme kaydı yok.</td></tr>
            )}
            {payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3.5 text-[13px] text-gray-500">{new Date(p.payment_date).toLocaleDateString('tr-TR')}</td>
                <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-800">{p.patient?.full_name}</td>
                <td className="px-5 py-3.5 text-[13px] text-gray-500">{p.session?.treatment?.name || '—'}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-block px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[11px] font-medium">
                    {p.payment_method}
                  </span>
                  {p.installments > 1 && (
                    <span className="ml-1.5 text-[11px] text-emerald-600 font-semibold">{p.installments}x</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="text-[14px] font-bold text-gray-900">{Number(p.amount).toLocaleString('tr-TR')} ₺</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
