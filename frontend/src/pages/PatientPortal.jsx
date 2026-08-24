import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { Phone, Calendar, Clock, Stethoscope, CheckCircle, ArrowLeft, Search } from 'lucide-react';

const HOURS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00'
];

export default function PatientPortal() {
  const [step, setStep] = useState('phone'); // phone | form | success
  const [phone, setPhone] = useState('');
  const [patient, setPatient] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    treatment_id: '',
    requested_date: '',
    requested_time: '',
    notes: ''
  });

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Lütfen geçerli bir telefon numarası giriniz.');
      return;
    }
    setLoading(true);
    try {
      const [patientRes, treatmentsRes] = await Promise.all([
        axios.get(`${API_URL}/patients/by-phone/${cleaned}`),
        axios.get(`${API_URL}/treatments`)
      ]);
      setPatient(patientRes.data);
      setTreatments(treatmentsRes.data);
      setStep('form');
    } catch {
      setError('Bu telefon numarasına kayıtlı hasta bulunamadı. Lütfen kliniğinizle iletişime geçin.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.treatment_id || !form.requested_date || !form.requested_time) {
      setError('Lütfen tüm alanları doldurunuz.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/session-requests`, {
        patient_id: patient.id,
        treatment_id: form.treatment_id,
        requested_date: form.requested_date,
        requested_time: form.requested_time,
        notes: form.notes
      });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Talep oluşturulurken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-200">
            <span className="text-white font-bold text-xl">FP</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FizyoPanel</h1>
          <p className="text-sm text-gray-500 mt-1">Online Randevu Talebi</p>
        </div>

        {/* STEP 1: Phone */}
        {step === 'phone' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Phone size={18} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-gray-800">Kimlik Doğrulama</h2>
                <p className="text-[12px] text-gray-400">Kayıtlı telefon numaranızı girin</p>
              </div>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Telefon Numaranız</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="05XXXXXXXXX"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                      setError('');
                    }}
                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-[14px] font-medium tracking-wide focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[12px] text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || phone.replace(/\D/g, '').length < 10}
                className="w-full h-11 bg-emerald-600 text-white rounded-xl text-[14px] font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Search size={15} /> Devam Et</>
                )}
              </button>
            </form>

            <p className="text-center text-[11px] text-gray-400 mt-6">
              Sisteme kayıtlı değilseniz lütfen kliniğimizi arayın.
            </p>
          </div>
        )}

        {/* STEP 2: Booking Form */}
        {step === 'form' && patient && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Patient greeting */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                {patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-emerald-800">Merhaba, {patient.full_name}!</p>
                {patient.complaint && (
                  <p className="text-[11px] text-emerald-600">{patient.complaint}</p>
                )}
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              {/* Treatment */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                  Tedavi / Hizmet
                </label>
                <select
                  required
                  value={form.treatment_id}
                  onChange={e => set('treatment_id', e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 text-[13px] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white"
                >
                  <option value="">Tedavi seçiniz...</option>
                  {treatments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                  İstediğiniz Tarih
                </label>
                <input
                  required
                  type="date"
                  min={today}
                  max={maxDateStr}
                  value={form.requested_date}
                  onChange={e => set('requested_date', e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 text-[13px] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                />
              </div>

              {/* Time Grid */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-2">
                  İstediğiniz Saat
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {HOURS.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => set('requested_time', h)}
                      className={`h-9 rounded-lg text-[12px] font-medium border transition-all ${
                        form.requested_time === h
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Not (İsteğe Bağlı)</label>
                <textarea
                  rows={2}
                  placeholder="Ek bir bilgi eklemek ister misiniz?"
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[12px] text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setError(''); }}
                  className="h-11 px-4 rounded-xl border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Geri
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.treatment_id || !form.requested_date || !form.requested_time}
                  className="flex-1 h-11 bg-emerald-600 text-white rounded-xl text-[14px] font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Randevu Talebi Gönder'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Talebiniz Alındı!</h2>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
              Randevu talebiniz kliniğimize iletildi. Fizyoterapistiniz en kısa sürede
              talebinizi inceleyerek onaylayacak ve sizinle iletişime geçecektir.
            </p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-[12px] text-emerald-700 mb-6">
              📅 İstediğiniz tarih ve saat için randevunuz onay beklemektedir.
            </div>
            <button
              onClick={() => {
                setStep('phone');
                setPhone('');
                setPatient(null);
                setForm({ treatment_id:'', requested_date:'', requested_time:'', notes:'' });
              }}
              className="w-full h-11 border border-gray-200 rounded-xl text-[13px] text-gray-600 hover:bg-gray-50 transition-all"
            >
              Yeni Talep Oluştur
            </button>
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400 mt-6">
          FizyoPanel — Fizyoterapi Klinik Yönetim Sistemi
        </p>
      </div>
    </div>
  );
}
