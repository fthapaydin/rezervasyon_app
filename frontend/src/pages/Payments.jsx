import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { Plus, X, CheckCircle, FileText, AlertCircle, Filter, Sparkles, Layers, MessageSquare, FileDown, Share2, Eye, EyeOff } from 'lucide-react';
import { generatePaymentReceipt, formatPhoneForWhatsApp, createReceiptWhatsAppMessage } from '../lib/pdfGenerator';
import ReceiptModal from '../components/common/ReceiptModal';
import { useToast } from '../components/ui/Toast';

import { API_URL } from '../lib/api';

export default function Payments({ clinic, payments, sessions, patients, staff = [], refresh }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'debtors'
  const [formData, setFormData] = useState({ patient_id: '', session_id: '', amount: '', payment_method: 'Nakit', installments: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);

  const [hideFinancials, setHideFinancials] = useState(() => {
    return localStorage.getItem('fizyo_hide_financials') === 'true';
  });

  useEffect(() => {
    const handleStorage = () => {
      setHideFinancials(localStorage.getItem('fizyo_hide_financials') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('fizyo_hide_financials_changed', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('fizyo_hide_financials_changed', handleStorage);
    };
  }, []);

  const toggleHideFinancials = () => {
    setHideFinancials(prev => {
      const next = !prev;
      localStorage.setItem('fizyo_hide_financials', String(next));
      window.dispatchEvent(new Event('fizyo_hide_financials_changed'));
      return next;
    });
  };

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

  const selectedDebtor = debtors.find(d => d.id === formData.patient_id);
  const patientSessions = sessions.filter(s => s.patient_id === formData.patient_id);
  const unpaidPatientSessions = patientSessions.filter(s => {
    const sPaid = payments.filter(p => p.session_id === s.id).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return Number(s.treatment?.price || 0) - sPaid > 0;
  });

  const resolvePaymentDetails = (p) => {
    const pPatient = p.patient?.phone 
      ? p.patient 
      : (patients.find(pt => pt.id === p.patient_id) || p.patient || {});
    const pSession = p.session?.session_date 
      ? p.session 
      : (sessions.find(s => s.id === p.session_id) || p.session || {});
    const pTherapist = pSession?.therapist?.full_name 
      ? pSession.therapist 
      : (staff.find(st => st.id === pSession?.therapist_id) || {
          full_name: clinic?.owner_name || 'Klinik Yetkilisi',
          title: 'Uzman / Hekim'
        });
    return {
      ...p,
      patient: pPatient,
      session: {
        ...pSession,
        therapist: pTherapist
      }
    };
  };

  const handleQuickWhatsApp = (p, e) => {
    e.stopPropagation();
    const fullP = resolvePaymentDetails(p);
    const cleanPhone = formatPhoneForWhatsApp(fullP.patient?.phone);
    if (!cleanPhone) {
      setSelectedReceiptPayment(fullP);
      toast.warning('Hastanın telefon numarası eksik. Lütfen açılan panelden numarayı giriniz.');
      return;
    }
    const msg = createReceiptWhatsAppMessage(fullP, clinic);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    toast.success(`${fullP.patient?.full_name || 'Hastaya'} WhatsApp makbuzu açıldı!`);
  };

  const handleQuickPdf = (p, e) => {
    e.stopPropagation();
    const fullP = resolvePaymentDetails(p);
    try {
      generatePaymentReceipt(fullP, clinic);
      toast.success('Kurumsal PDF makbuzu indirildi.');
    } catch (err) {
      console.error('PDF indirme hatası:', err);
      toast.error('PDF oluşturulurken hata oluştu.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id) {
      toast.warning('Lütfen bir hasta seçin.');
      return;
    }
    const enteredAmount = Number(formData.amount);
    if (!enteredAmount || enteredAmount <= 0) {
      toast.warning('Lütfen geçerli bir ödeme tutarı girin.');
      return;
    }

    setSubmitting(true);
    try {
      if (formData.session_id === 'all') {
        // TOPLU ÖDEME (FIFO - First In First Out Borç Kapatma Dağıtımı)
        const sortedSessions = [...patientSessions].sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
        let remainingToAllocate = enteredAmount;
        const paymentRows = [];

        for (const s of sortedSessions) {
          if (remainingToAllocate <= 0) break;
          const sPaid = payments.filter(p => p.session_id === s.id).reduce((sum, p) => sum + Number(p.amount || 0), 0);
          const sCost = Number(s.treatment?.price || 0);
          const sUnpaid = Math.max(0, sCost - sPaid);

          if (sUnpaid > 0) {
            const payThis = Math.min(sUnpaid, remainingToAllocate);
            paymentRows.push({
              session_id: s.id,
              patient_id: formData.patient_id,
              amount: payThis,
              payment_method: formData.payment_method,
              installments: formData.installments || 1,
            });
            remainingToAllocate -= payThis;
          }
        }

        // Kalan tutar varsa son seansa bağla
        if (remainingToAllocate > 0) {
          const fallbackSession = sortedSessions[sortedSessions.length - 1] || sortedSessions[0];
          if (paymentRows.length > 0) {
            paymentRows[paymentRows.length - 1].amount += remainingToAllocate;
          } else if (fallbackSession) {
            paymentRows.push({
              session_id: fallbackSession.id,
              patient_id: formData.patient_id,
              amount: remainingToAllocate,
              payment_method: formData.payment_method,
              installments: formData.installments || 1,
            });
          }
        }

        if (paymentRows.length === 0) {
          throw new Error('Tahsilat atanabilecek açık seans bulunamadı.');
        }

        // Doğrudan Supabase ile batch insert
        const { error: insErr } = await supabase.from('payments').insert(paymentRows);
        if (insErr) {
          for (const row of paymentRows) {
            await axios.post(`${API_URL}/payments`, { ...row, clinic_id: clinic?.id });
          }
        }

        toast.success(
          `${enteredAmount.toLocaleString('tr-TR')} ₺ tutarındaki toplu tahsilat başarıyla kaydedildi (${paymentRows.length} seans kapatıldı).`,
          'Toplu Ödeme Alındı'
        );
      } else {
        // TEKİL SEANS TAHSİLATI
        const payload = {
          session_id: formData.session_id,
          patient_id: formData.patient_id,
          amount: enteredAmount,
          payment_method: formData.payment_method,
          installments: formData.installments || 1,
        };

        const { error: insErr } = await supabase.from('payments').insert([payload]);
        if (insErr) {
          await axios.post(`${API_URL}/payments`, { ...payload, clinic_id: clinic?.id });
        }

        toast.success(`${enteredAmount.toLocaleString('tr-TR')} ₺ tutarındaki tahsilat kaydedildi.`, 'Ödeme Alındı');
      }

      setShowForm(false);
      setFormData({ patient_id: '', session_id: '', amount: '', payment_method: 'Nakit', installments: 1 });
      refresh();
    } catch (err) {
      toast.error(err.message || 'Ödeme kaydedilirken hata oluştu', 'Hata');
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
            <div className="flex items-center gap-1.5">
              <p className="text-[12px] text-gray-400 font-medium">Toplam Tahsilat</p>
              <button
                type="button"
                onClick={toggleHideFinancials}
                title={hideFinancials ? "Tutarları Göster" : "Tutarları Gizle"}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                {hideFinancials ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <p className={`text-xl font-bold text-gray-900 ${hideFinancials ? 'font-mono tracking-wider' : ''}`}>
              {hideFinancials ? '•••• ₺' : `${totalRevenue.toLocaleString('tr-TR')} ₺`}
            </p>
          </div>
          <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
          <div>
            <p className="text-[12px] text-gray-400 font-medium">Toplam Alacak (Kalan)</p>
            <p className={`text-xl font-bold text-red-500 ${hideFinancials ? 'font-mono tracking-wider' : ''}`}>
              {hideFinancials ? '•••• ₺' : `${totalDebt.toLocaleString('tr-TR')} ₺`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Tab Filter */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-[12px] font-medium text-slate-600">
            <button 
              onClick={() => setActiveFilter('all')} 
              className={`px-3 py-1.5 rounded-md transition-all ${activeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-900'}`}
            >
              Ödemeler ({payments.length})
            </button>
            <button 
              onClick={() => setActiveFilter('debtors')} 
              className={`px-3 py-1.5 rounded-md transition-all ${activeFilter === 'debtors' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-900'}`}
            >
              Borçlular ({debtors.length})
            </button>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className={`h-9 px-3.5 rounded-lg text-[12px] font-semibold transition-colors shrink-0 cursor-pointer ${
              showForm ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xs'
            }`}
          >
            {showForm ? 'İptal' : '+ Tahsilat Gir'}
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
              <select 
                required 
                className="input-field" 
                value={formData.patient_id}
                onChange={e => {
                  const pid = e.target.value;
                  const debtor = debtors.find(d => d.id === pid);
                  if (debtor) {
                    // Varsayılan olarak Toplu Ödeme ('all') seçili gelsin ve tüm borcu doldursun
                    setFormData(prev => ({ 
                      ...prev, 
                      patient_id: pid, 
                      session_id: 'all', 
                      amount: String(debtor.debt) 
                    }));
                  } else {
                    setFormData(prev => ({ ...prev, patient_id: '', session_id: '', amount: '' }));
                  }
                }}
              >
                <option value="">Seçiniz...</option>
                {debtors.length === 0 ? (
                  <option value="" disabled>Borcu olan hasta bulunmuyor</option>
                ) : (
                  debtors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} (Borç: {d.debt.toLocaleString('tr-TR')} ₺)
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                Seans / Ödeme Türü <span className="text-red-400">*</span>
              </label>
              <select 
                required 
                className="input-field font-medium" 
                value={formData.session_id}
                onChange={e => {
                  const sid = e.target.value;
                  if (sid === 'all') {
                    const debtor = debtors.find(d => d.id === formData.patient_id);
                    setFormData(prev => ({ 
                      ...prev, 
                      session_id: 'all', 
                      amount: debtor ? String(debtor.debt) : prev.amount 
                    }));
                  } else {
                    const selectedSession = sessions.find(s => s.id === sid);
                    if (selectedSession) {
                      const sPayments = payments.filter(p => p.session_id === sid);
                      const sPaid = sPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                      const sCost = Number(selectedSession.treatment?.price || 0);
                      const sRemaining = Math.max(0, sCost - sPaid);
                      setFormData(prev => ({ 
                        ...prev, 
                        session_id: sid, 
                        amount: sRemaining > 0 ? String(sRemaining) : prev.amount 
                      }));
                    } else {
                      setFormData(prev => ({ ...prev, session_id: '', amount: '' }));
                    }
                  }
                }}
              >
                <option value="">Önce hasta seçin...</option>
                {selectedDebtor && (
                  <option value="all" className="font-bold text-emerald-800 bg-emerald-50">
                    ⭐ Tüm Seanslar (Toplu Ödeme — Kalan Borç: {selectedDebtor.debt.toLocaleString('tr-TR')} ₺)
                  </option>
                )}
                {sessions
                  .filter(s => s.patient_id === formData.patient_id)
                  .map(s => {
                    const sPayments = payments.filter(p => p.session_id === s.id);
                    const sPaid = sPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    const sCost = Number(s.treatment?.price || 0);
                    const sRemaining = sCost - sPaid;
                    const isFullyPaid = sRemaining <= 0;

                    return (
                      <option key={s.id} value={s.id} disabled={isFullyPaid}>
                        {new Date(s.session_date).toLocaleDateString('tr-TR')} — {s.treatment?.name || 'Seans'} {isFullyPaid ? '(Tamamen Ödendi)' : `(Kalan: ${sRemaining.toLocaleString('tr-TR')} ₺)`}
                      </option>
                    );
                  })}
              </select>

              {formData.session_id === 'all' && selectedDebtor && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                  <Sparkles size={13} className="text-emerald-600 shrink-0" />
                  <span>
                    <strong>Toplu Ödeme Modu:</strong> Girilen {Number(formData.amount || selectedDebtor.debt).toLocaleString('tr-TR')} ₺ tutar hastanın {unpaidPatientSessions.length} açık seansına sırayla dağıtılarak kapatılacaktır.
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Tutar (₺) <span className="text-red-400">*</span></label>
              <input 
                required 
                type="number" 
                placeholder="1500" 
                className="input-field font-semibold" 
                value={formData.amount}
                onChange={e => set('amount', e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Ödeme Yöntemi <span className="text-red-400">*</span></label>
              <select className="input-field" value={formData.payment_method} onChange={e => set('payment_method', e.target.value)}>
                <option value="Nakit">Nakit</option>
                <option value="Kredi Kartı">Kredi Kartı</option>
                <option value="Havale/EFT">Havale / EFT</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Taksit</label>
              <select className="input-field" value={formData.installments} onChange={e => set('installments', parseInt(e.target.value) || 1)}>
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
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Makbuz & Paylaş</th>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          type="button"
                          onClick={(e) => handleQuickWhatsApp(p, e)}
                          title="WhatsApp ile Makbuz Gönder"
                          className="h-8 w-8 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-all flex items-center justify-center cursor-pointer border border-[#25D366]/20 shadow-2xs"
                        >
                          <MessageSquare size={13} />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => handleQuickPdf(p, e)}
                          title="Kurumsal PDF Makbuzu İndir"
                          className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-900 text-slate-600 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-slate-200 shadow-2xs"
                        >
                          <FileDown size={13} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setSelectedReceiptPayment(p)}
                          title="Makbuz Detayı & Paylaşım Paneli"
                          className="h-8 px-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-600 text-emerald-800 hover:text-white text-[12px] font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <FileText size={13} />
                          <span>Makbuz & Paylaş</span>
                        </button>
                      </div>
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
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {debtors.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-[13px] text-gray-400">Harika! Borcu olan hasta bulunmuyor.</td></tr>
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
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              patient_id: d.id,
                              session_id: 'all',
                              amount: String(d.debt),
                              payment_method: 'Nakit',
                              installments: 1
                            });
                            setShowForm(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          title="Tüm kalan borcu toplu kapatmak için tahsilat formunu açar"
                        >
                          <Sparkles size={12} />
                          <span>Toplu Kapat ({d.debt.toLocaleString('tr-TR')} ₺)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const debtorSessions = sessions.filter(s => s.patient_id === d.id);
                            const firstUnpaid = debtorSessions.find(s => {
                              const sPaid = payments.filter(p => p.session_id === s.id).reduce((sum, p) => sum + Number(p.amount || 0), 0);
                              return Number(s.treatment?.price || 0) - sPaid > 0;
                            });
                            const rem = firstUnpaid 
                              ? Math.max(0, Number(firstUnpaid.treatment?.price || 0) - payments.filter(p => p.session_id === firstUnpaid.id).reduce((sum, p) => sum + Number(p.amount || 0), 0))
                              : d.debt;

                            setFormData({
                              patient_id: d.id,
                              session_id: firstUnpaid?.id || '',
                              amount: String(rem),
                              payment_method: 'Nakit',
                              installments: 1
                            });
                            setShowForm(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                          title="Tek bir seans tahsilatı girmek için formu açar"
                        >
                          Tek Seans
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Makbuz & Paylaşım Modalı */}
      <ReceiptModal
        isOpen={Boolean(selectedReceiptPayment)}
        onClose={() => setSelectedReceiptPayment(null)}
        payment={selectedReceiptPayment}
        clinic={clinic}
        patients={patients}
        sessions={sessions}
        staff={staff}
      />
    </div>
  );
}
