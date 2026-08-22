import { useState } from 'react';
import axios from 'axios';
import { Plus, X, Phone, Search } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

export default function Patients({ patients, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ full_name: '', phone: '', email: '', age: '', complaint: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search) ||
    (p.complaint && p.complaint.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/patients`, formData);
      setShowForm(false);
      setFormData({ full_name: '', phone: '', email: '', age: '', complaint: '', notes: '' });
      refresh();
    } catch {
      alert('Hasta eklenirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Hasta ara... (ad, telefon veya tanı)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 bg-white text-[13px] placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`h-10 px-4 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-all ${
            showForm
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
          }`}
        >
          {showForm ? <><X size={15}/> İptal</> : <><Plus size={15}/> Yeni Hasta</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h3 className="text-[14px] font-semibold text-gray-800 mb-5">Yeni Hasta Kaydı</h3>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Ad Soyad" required>
              <input required type="text" placeholder="Ahmet Yılmaz" className="input-field" onChange={e => set('full_name', e.target.value)} />
            </Field>
            <Field label="Telefon" required>
              <input required type="tel" placeholder="05XX XXX XX XX" className="input-field" onChange={e => set('phone', e.target.value)} />
            </Field>
            <Field label="Yaş">
              <input type="number" placeholder="34" className="input-field" onChange={e => set('age', e.target.value)} />
            </Field>
            <Field label="E-posta" span={1}>
              <input type="email" placeholder="ornek@mail.com" className="input-field" onChange={e => set('email', e.target.value)} />
            </Field>
            <Field label="Şikayeti / Ön Tanı" span={2}>
              <input type="text" placeholder="Bel fıtığı, Boyun düzleşmesi..." className="input-field" onChange={e => set('complaint', e.target.value)} />
            </Field>
          </div>
          <div className="flex justify-end mt-5 gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 rounded-lg text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Vazgeç</button>
            <button type="submit" disabled={submitting} className="h-9 px-5 rounded-lg text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm">
              {submitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hasta</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Telefon</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Yaş</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tanı / Şikayet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-[13px] text-gray-400">
                {search ? 'Aramayla eşleşen hasta bulunamadı.' : 'Henüz hasta kaydı yok.'}
              </td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-[12px] font-bold shrink-0">
                      {p.full_name.charAt(0)}
                    </div>
                    <span className="text-[13px] font-semibold text-gray-800">{p.full_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[13px] text-gray-500">{p.phone}</td>
                <td className="px-5 py-3.5 text-[13px] text-gray-500">{p.age || '—'}</td>
                <td className="px-5 py-3.5">
                  {p.complaint ? (
                    <span className="inline-block px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[12px] font-medium">{p.complaint}</span>
                  ) : (
                    <span className="text-[12px] text-gray-300">Belirtilmedi</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, required, span = 1, children }) {
  return (
    <div className={span === 2 ? 'col-span-2' : span === 3 ? 'col-span-3' : ''}>
      <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
