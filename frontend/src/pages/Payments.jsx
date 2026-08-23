import { useState, useMemo } from 'react';
import axios from 'axios';
import { Plus, X, CheckCircle, FileText, AlertCircle, Filter } from 'lucide-react';
import { generatePaymentReceipt } from '../lib/pdfGenerator';

import { API_URL } from '../lib/api';

export default function Payments({ payments, sessions, patients, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'debtors'
  const [formData, setFormData] = useState({ patient_id: '', session_id: '', amount: '', payment_method: 'Nakit', installments: 1 });
  const [submitting, setSubmitting] = useState(false);

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Calculate debtors
  const debtors = useMemo(() => {
    return patients.map(p => {
      const pSessions = sessions.filter(s => s.patient_id === p.id);
      const pPayments = payments.filter(pay => pay.patient_id === p.id);
      const totalCost = pSessions.reduce((acc, s) => acc + Number(s.treatment?.price || 0), 0);
      const paid = pPayments.reduce((acc, pay) => acc + Number(pay.amount || 0), 0);
      const debt = totalCost - paid;
      return { ...p, totalCost, paid, debt, sessionCount: pSessions.length };
    }).filter(p => p.debt > 0);
  }, [patients, sessions, payments]);

  const totalDebt = debtors.reduce((acc, d) => acc + d.debt, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/payments`, formData);
      setShowForm(false);
      setFormData({ patient_id: '', session_id: '', amount: '', payment_method: 'Nakit', installments: 1 });
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
      {/* Summary Stats + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div>
            <p className="text-[12px] text-gray-400 font-medium">Toplam Tahsilat</p>
            <p className="text-xl font-bold text-gray-900">{totalRevenue.toLocaleString('tr-TR')} ₺</p>
          </div>
          <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
          <div>
            <p className="text-[12px] text-gray-400 font-medium">Toplam Alacak (Kalan)</p>
            <p className="text-xl font-bold text-red-500">{totalDebt.toLocaleString('tr-TR')} ₺</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Tab Filter */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg text-[12px] font-medium text-gray-600">
            <button 
              onClick={() => setActiveFilter('all')} 
              className={`px-3 py-1.5 rounded-md transition-all ${activeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-900'}`}
            >
              Ödemeler ({payments.length})
            </button>
            <button 
              onClick={() => setActiveFilter('debtors')} 
              className={`px-3 py-1.5 rounded-md transition-all ${activeFilter === 'debtors' ? 'bg-white text-red-600 shadow-sm font-semibold' : 'hover:text-gray-900'}`}
            >
              Borçlular ({debtors.length})
            </button>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className={`h-9 px-3.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              showForm ? 'bg-gray-100 text-gray-600' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
            }`}
          >
            {showForm ? <><X size={14}/> İptal</> : <><Plus size={14}/> Tahsilat Gir</>}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200/80 p-5 md:p-6">
          <h3 className="text-[14px] font-semibold text-gray-800 mb-4">Yeni Tahsilat</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Hasta <span className="text-red-400">*</span></label>
              <select required className="input-field" onChange={e => set('patient_id', e.target.value)}>
                <option value="">Seçiniz...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
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

      {/* Main Table Content */}
      {activeFilter === 'all' ? (
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tarih</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hasta</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hizmet</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Yöntem</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tutar</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Makbuz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-[13px] text-gray-400">Henüz ödeme kaydı yok.</td></tr>
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
                    <td className="px-5 py-3.5 text-right">
                      <button 
                        onClick={() => generatePaymentReceipt(p)}
                        title="PDF Makbuz İndir"
                        className="h-8 px-2.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 text-[12px] font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <FileText size={13} className="text-emerald-600" /> Makbuz
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Debtors Table */
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hasta</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Telefon</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Seans Sayısı</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Toplam Tutar</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Ödenen</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Kalan Borç</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {debtors.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-[13px] text-gray-400">Harika! Borcu olan hasta bulunmuyor.</td></tr>
                )}
                {debtors.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-800">{d.full_name}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500">{d.phone}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-600">{d.sessionCount} seans</td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-gray-700">{d.totalCost.toLocaleString('tr-TR')} ₺</td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-emerald-600">{d.paid.toLocaleString('tr-TR')} ₺</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-[14px] font-bold text-red-500">{d.debt.toLocaleString('tr-TR')} ₺</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
