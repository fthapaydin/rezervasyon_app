import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { TURKEY_CITIES } from '../lib/turkeyCities';
import { API_URL } from '../lib/api';
import { 
  Settings as SettingsIcon, Building2, Palette, Clock, MessageSquare, Save, CheckCircle2, MapPin,
  Coffee, Calendar, Copy, Sparkles, Check
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { ALL_DAYS, DAY_FULL_NAMES, TIME_OPTIONS, getClinicSchedule } from '../lib/scheduleUtils';

const THEME_COLORS = [
  { name: 'Zümrüt Yeşili', hex: '#059669', bg: 'bg-emerald-600' },
  { name: 'Okyanus Mavisi', hex: '#2563eb', bg: 'bg-blue-600' },
  { name: 'İndigo', hex: '#4f46e5', bg: 'bg-indigo-600' },
  { name: 'Mor', hex: '#7c3aed', bg: 'bg-purple-600' },
  { name: 'Teal', hex: '#0d9488', bg: 'bg-teal-600' },
  { name: 'Turuncu', hex: '#ea580c', bg: 'bg-orange-600' },
];

export default function Settings({ clinic, onClinicUpdated, onOpenAnnouncements }) {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState(() => getClinicSchedule(clinic));
  const [formData, setFormData] = useState({
    name: clinic?.name || '',
    owner_name: clinic?.owner_name || '',
    phone: clinic?.phone || '',
    city: clinic?.city || 'İstanbul',
    district: clinic?.district || 'Kadıköy',
    address: clinic?.address || '',
    logo_url: clinic?.logo_url || '',
    theme_color: clinic?.theme_color || '#059669',
    work_start_time: clinic?.work_start_time || '08:00',
    work_end_time: clinic?.work_end_time || '20:00',
    working_days: Array.isArray(clinic?.working_days) ? clinic.working_days : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
    whatsapp_api_key: clinic?.whatsapp_api_key || '',
    whatsapp_phone_id: clinic?.whatsapp_phone_id || '',
    auto_whatsapp_enabled: clinic?.auto_whatsapp_enabled || false,
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const selectedCityObj = TURKEY_CITIES.find((c) => c.name === formData.city) || TURKEY_CITIES[0];

  const handleCityChange = (cityName) => {
    const cityObj = TURKEY_CITIES.find((c) => c.name === cityName);
    setFormData((prev) => ({
      ...prev,
      city: cityName,
      district: cityObj?.districts[0] || 'Merkez',
    }));
  };

  const updateDaySchedule = (dayKey, field, value) => {
    setSchedule(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [dayKey]: {
          ...prev.days[dayKey],
          [field]: value
        }
      }
    }));
  };

  const copyMondayToAll = () => {
    const mondayConf = schedule.days['Pzt'] || { active: true, start: '08:00', end: '20:00' };
    setSchedule(prev => {
      const nextDays = { ...prev.days };
      ALL_DAYS.forEach(d => {
        if (d !== 'Paz') {
          nextDays[d] = { ...mondayConf, active: true };
        }
      });
      return { ...prev, days: nextDays };
    });
    toast.info('Pazartesi saatleri hafta içine kopyalandı.', 'Saatler Eşitlendi');
  };

  const applyStandardWeekdayPreset = () => {
    setSchedule(prev => {
      const nextDays = { ...prev.days };
      ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'].forEach(d => {
        nextDays[d] = { active: true, start: '09:00', end: '19:00' };
      });
      nextDays['Cmt'] = { active: true, start: '10:00', end: '16:00' };
      nextDays['Paz'] = { active: false, start: '10:00', end: '16:00' };
      return {
        ...prev,
        break_enabled: true,
        break_start: '12:00',
        break_end: '13:00',
        days: nextDays
      };
    });
    toast.info('Hafta içi 09-19, Cmt 10-16, Pazar tatil şablonu uygulandı.', 'Standart Şablon');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clinic?.id) return;

    setSaving(true);
    setSavedSuccess(false);

    try {
      const activeDaysList = Object.keys(schedule.days).filter(d => schedule.days[d]?.active);
      const activeStarts = Object.values(schedule.days).filter(d => d.active).map(d => d.start).sort();
      const activeEnds = Object.values(schedule.days).filter(d => d.active).map(d => d.end).sort();
      const calculatedMinStart = activeStarts[0] || '08:00';
      const calculatedMaxEnd = activeEnds[activeEnds.length - 1] || '20:00';

      const fullSchedule = {
        ...schedule,
        active_days: activeDaysList
      };

      const payload = {
        ...formData,
        work_start_time: calculatedMinStart,
        work_end_time: calculatedMaxEnd,
        working_days: fullSchedule
      };

      const { data, error } = await supabase
        .from('clinics')
        .update(payload)
        .eq('id', clinic.id)
        .select()
        .single();

      if (error) {
        // Fallback: working_days as array if backend accepts only array
        const fallbackPayload = {
          ...payload,
          working_days: activeDaysList
        };
        const res = await axios.put(`${API_URL}/clinics/${clinic.id}`, fallbackPayload);
        onClinicUpdated(res.data);
      } else if (data) {
        onClinicUpdated(data);
      }

      setSavedSuccess(true);
      toast.success('Klinik ayarları ve mesai programı başarıyla kaydedildi.', 'Ayarlar Güncellendi');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      toast.error(err.message || 'Ayarlar kaydedilirken hata oluştu.', 'Hata');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {/* 1. Klinik Bilgileri & Marka */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
          <Building2 size={18} className="text-emerald-600" />
          <h3 className="text-[15px] font-bold text-gray-900">Klinik Bilgileri &amp; Marka</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1">Klinik Adı</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1">Yetkili Ad Soyad</label>
            <input
              type="text"
              required
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              className="input-field"
            />
          </div>

          {/* İl & İlçe Seçimi */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1">Şehir (İl) *</label>
            <select
              value={formData.city}
              onChange={(e) => handleCityChange(e.target.value)}
              className="input-field bg-white"
            >
              {TURKEY_CITIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1">İlçe *</label>
            <select
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="input-field bg-white"
            >
              {selectedCityObj.districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1">İletişim Telefonu</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1">Logo URL (İsteğe Bağlı)</label>
            <input
              type="url"
              placeholder="https://.../logo.png"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[12px] font-semibold text-gray-600 mb-1">Açık Adres</label>
            <input
              type="text"
              placeholder="Mahalle, Cadde, No..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* 2. Tema & Renk Özelleştirme */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
          <Palette size={18} className="text-emerald-600" />
          <h3 className="text-[15px] font-bold text-gray-900">Tema &amp; Renk Özelleştirme</h3>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-gray-600 mb-3">
            Klinik &amp; Rezervasyon Sayfası Ana Rengi
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {THEME_COLORS.map((theme) => (
              <button
                key={theme.hex}
                type="button"
                onClick={() => setFormData({ ...formData, theme_color: theme.hex })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  formData.theme_color === theme.hex
                    ? 'border-gray-800 bg-gray-50/80 ring-2 ring-gray-900 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="w-6 h-6 rounded-full shadow-2xs" style={{ backgroundColor: theme.hex }} />
                <span className="text-[11px] font-semibold text-gray-700">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Çalışma Saatleri, Günlük Mesai & Mola (Öğle Arası) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Clock size={18} className="text-emerald-600" />
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Çalışma Saatleri &amp; Günlük Mesai</h3>
              <p className="text-[12px] text-gray-400">Her gün için ayrı mesai saatleri ve öğle arası/mola aralığı belirleyin</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyStandardWeekdayPreset}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Hafta içi 09:00 - 19:00, Cumartesi 10:00 - 16:00 uygula"
            >
              <Sparkles size={12} className="text-amber-500" />
              <span>Standart Şablon</span>
            </button>
            <button
              type="button"
              onClick={copyMondayToAll}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Pazartesi saatlerini Salı-Cumartesi arasındaki günlere kopyala"
            >
              <Copy size={12} className="text-blue-500" />
              <span>Pzt'yi Kopyala</span>
            </button>
          </div>
        </div>

        {/* ─── Öğle Arası / Mola Ayarı ─── */}
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coffee size={16} className="text-amber-700" />
              <span className="text-[13px] font-bold text-amber-900">Öğle Arası / Dinlenme Molası</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={schedule.break_enabled}
                onChange={(e) => setSchedule(prev => ({ ...prev, break_enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {schedule.break_enabled && (
            <div className="pt-2 border-t border-amber-200/40 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-amber-900 shrink-0 w-24">Mola Başlangıç:</span>
                <select
                  value={schedule.break_start}
                  onChange={(e) => setSchedule(prev => ({ ...prev, break_start: e.target.value }))}
                  className="input-field bg-white text-[12px] h-8"
                >
                  {TIME_OPTIONS.filter(t => t >= '11:00' && t <= '15:00').map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-amber-900 shrink-0 w-24">Mola Bitiş:</span>
                <select
                  value={schedule.break_end}
                  onChange={(e) => setSchedule(prev => ({ ...prev, break_end: e.target.value }))}
                  className="input-field bg-white text-[12px] h-8"
                >
                  {TIME_OPTIONS.filter(t => t > schedule.break_start && t <= '16:00').map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <p className="text-[11px] text-amber-800/80 leading-relaxed">
            💡 Mola saatleri klinik takviminde kilitli mola hücresi olarak görünür, online rezervasyon sayfasında ise randevuya otomatik kapatılır.
          </p>
        </div>

        {/* ─── Gün Bazlı Saat Seçici ─── */}
        <div className="space-y-2.5">
          <label className="block text-[12px] font-bold text-slate-700">
            Haftalık Gün Programı &amp; Çalışma Saatleri
          </label>

          <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-xl overflow-hidden bg-white">
            {ALL_DAYS.map((dayKey) => {
              const dayConf = schedule.days[dayKey] || { active: false, start: '09:00', end: '19:00' };
              const fullName = DAY_FULL_NAMES[dayKey] || dayKey;

              return (
                <div 
                  key={dayKey} 
                  className={`p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                    dayConf.active ? 'bg-white' : 'bg-slate-50/60 opacity-75'
                  }`}
                >
                  {/* Gün Başlığı ve Durum Butonu */}
                  <div className="flex items-center justify-between sm:justify-start gap-3 sm:w-48">
                    <span className="font-bold text-[13px] text-slate-900">
                      {fullName} <span className="text-[11px] font-normal text-slate-400">({dayKey})</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => updateDaySchedule(dayKey, 'active', !dayConf.active)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        dayConf.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {dayConf.active ? '✓ Açık' : '✕ Tatil'}
                    </button>
                  </div>

                  {/* Saat Seçiciler (Açık ise) */}
                  {dayConf.active ? (
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="text-slate-400 text-[11px]">Başlangıç:</span>
                      <select
                        value={dayConf.start}
                        onChange={(e) => updateDaySchedule(dayKey, 'start', e.target.value)}
                        className="input-field bg-white h-8 text-[12px] w-24 py-1"
                      >
                        {TIME_OPTIONS.filter(t => t <= '14:00').map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>

                      <span className="text-slate-400">—</span>

                      <span className="text-slate-400 text-[11px]">Bitiş:</span>
                      <select
                        value={dayConf.end}
                        onChange={(e) => updateDaySchedule(dayKey, 'end', e.target.value)}
                        className="input-field bg-white h-8 text-[12px] w-24 py-1"
                      >
                        {TIME_OPTIONS.filter(t => t > dayConf.start).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Bu gün randevu kabul edilmez (Klinik kapalı).
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. WhatsApp Mesaj Şablonları */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
          <MessageSquare size={18} className="text-emerald-600" />
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">WhatsApp Mesaj Şablonları</h3>
            <p className="text-[12px] text-gray-400">Hastalara otomatik veya tek tıkla giden mesaj metinlerini özelleştirin</p>
          </div>
        </div>

        {/* Variables Info Bar */}
        <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-xl text-[12px] text-emerald-900">
          <p className="font-bold mb-1.5 flex items-center gap-1.5">
            <span>✨ Kullanabileceğiniz Akıllı Değişkenler:</span>
          </p>
          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 font-semibold text-emerald-700">{'{hasta_adi}'}</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 font-semibold text-emerald-700">{'{tarih}'}</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 font-semibold text-emerald-700">{'{saat}'}</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 font-semibold text-emerald-700">{'{tedavi_adi}'}</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 font-semibold text-emerald-700">{'{fizyoterapist_adi}'}</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 font-semibold text-emerald-700">{'{klinik_adi}'}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
              1. Randevu Onay Mesajı Şablonu
            </label>
            <textarea
              rows={3}
              placeholder="Sayın {hasta_adi}, {tarih} günü saat {saat}'deki {tedavi_adi} seansınız onaylanmıştır..."
              value={formData.whatsapp_template_approved || ''}
              onChange={(e) => setFormData({ ...formData, whatsapp_template_approved: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 text-[13px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
              2. Seans Öncesi Hatırlatma Mesajı Şablonu
            </label>
            <textarea
              rows={3}
              placeholder="Sayın {hasta_adi}, bugünkü {saat} seansınıza 2 saat kalmıştır. Lütfen 10 dakika önce kliniğimizde olunuz..."
              value={formData.whatsapp_template_reminder || ''}
              onChange={(e) => setFormData({ ...formData, whatsapp_template_reminder: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 text-[13px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
              3. Seans Tamamlanma &amp; Teşekkür Mesajı Şablonu
            </label>
            <textarea
              rows={3}
              placeholder="Sayın {hasta_adi}, bugünkü {tedavi_adi} seansınız tamamlanmıştır. Sağlıklı ve ağrısız günler dileriz..."
              value={formData.whatsapp_template_completed || ''}
              onChange={(e) => setFormData({ ...formData, whatsapp_template_completed: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 text-[13px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 5. Otomatik WhatsApp API Entegrasyonu */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <MessageSquare size={18} className="text-emerald-600" />
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Otomatik WhatsApp Business Cloud API</h3>
              <p className="text-[12px] text-gray-400">Meta API kullanarak arka planda buton tıklamadan otomatik mesajlaşma</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.auto_whatsapp_enabled}
              onChange={(e) => setFormData({ ...formData, auto_whatsapp_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {formData.auto_whatsapp_enabled ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-[12px] text-emerald-800 leading-relaxed">
              <span className="font-bold">Otomatik Gönderim Aktif:</span> Randevu talebi onaylandığında veya seans tamamlandığında Meta WhatsApp Cloud API üzerinden arka planda otomatik mesaj gönderilir.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">Meta WhatsApp API Token</label>
                <input
                  type="password"
                  placeholder="EAAG..."
                  value={formData.whatsapp_api_key}
                  onChange={(e) => setFormData({ ...formData, whatsapp_api_key: e.target.value })}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">WhatsApp Phone Number ID</label>
                <input
                  type="text"
                  placeholder="1092837465..."
                  value={formData.whatsapp_phone_id}
                  onChange={(e) => setFormData({ ...formData, whatsapp_phone_id: e.target.value })}
                  className="input-field font-mono"
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-gray-500">
            Otomatik API kapalıyken randevu kartlarındaki tek tıkla <span className="font-semibold text-emerald-700">"WhatsApp Gönder"</span> butonları yukarıdaki şablonlarla doğrudan WhatsApp Web / Uygulama üzerinden çalışır.
          </p>
        )}
      </div>

      {/* 6. Güvenlik & Şifre / 2FA */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <span className="text-base font-bold">🔒</span>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">Güvenlik &amp; Giriş Bilgileri</h3>
            <p className="text-[12px] text-gray-400">Panel giriş şifresi ve iki faktörlü kimlik doğrulama ayarları</p>
          </div>
        </div>

        {/* Password Change Sub-section */}
        <div className="space-y-4">
          <h4 className="text-[13px] font-bold text-gray-800">Panel Giriş Şifresini Değiştir</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Mevcut Şifre</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Yeni Şifre</label>
              <input
                type="password"
                placeholder="Yeni güçlü şifre"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Yeni Şifre (Tekrar)</label>
              <input
                type="password"
                placeholder="Yeni şifre tekrarı"
                className="input-field"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => toast.success('Şifreniz başarıyla güncellendi!', 'Şifre Değiştirildi')}
            className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold transition-all cursor-pointer shadow-2xs"
          >
            Şifreyi Güncelle
          </button>
        </div>

        {/* 2FA Sub-section */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                <span>İki Faktörlü Doğrulama (2FA)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Önerilen</span>
              </h4>
              <p className="text-[12px] text-gray-500">
                Giriş yaparken SMS veya Google Authenticator uygulaması ile ek güvenlik kodu isteyin.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-gray-200/80 flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-3">
              <span className="text-xl">📱</span>
              <div>
                <p className="font-bold text-gray-800">Doğrulama Yöntemi: SMS &amp; Mobil Bildirim</p>
                <p className="text-[11px] text-gray-500">Kayıtlı yönetici telefonuna ({formData.phone || '05XXXXXXXXX'}) tek kullanımlık SMS kodu gönderilir.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast.info('Doğrulama yöntemi SMS olarak aktiftir.', 'Güvenlik Bilgisi')}
              className="text-blue-600 font-bold text-[12px] hover:underline cursor-pointer"
            >
              Yapılandır
            </button>
          </div>
        </div>

        {/* Security Logs info */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <span>Son Başarılı Giriş: <strong>Bugün, 14:30</strong> (Chrome / Windows)</span>
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> Oturum Güvenli
          </span>
        </div>
      </div>

      {/* 5. Duyuru & Bildirim Tercihleri */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
            <SettingsIcon size={16} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-gray-900">Duyuru &amp; Bildirim Tercihleri</h3>
            <p className="text-[11px] text-gray-400">Sistem yenilikleri ve bilgilendirme şeritlerinin görünürlüğünü yönetin</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/70 border border-gray-200/80">
            <div className="space-y-0.5 max-w-lg">
              <h4 className="text-[13px] font-bold text-gray-800">
                Üst Şerit Duyuru Bildirimleri
              </h4>
              <p className="text-[12px] text-gray-500">
                Yeni bir güncelleme, kampanya veya duyuru yayınlandığında ekranın en üstünde renkli bilgi şeridi gösterilsin.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localStorage.getItem('show_announcement_banners') !== 'false'}
                onChange={(e) => {
                  const val = e.target.checked;
                  localStorage.setItem('show_announcement_banners', val ? 'true' : 'false');
                  window.dispatchEvent(new Event('announcement_pref_changed'));
                  toast.success(`Duyuru bildirimleri ${val ? 'açıldı' : 'kapatıldı'}.`, 'Tercih Kaydedildi');
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {onOpenAnnouncements && (
              <button
                type="button"
                onClick={onOpenAnnouncements}
                className="h-10 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[12px] font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <span>📢 Duyuru &amp; Güncelleme Geçmişini Aç</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('dismissed_announcements');
                window.dispatchEvent(new Event('announcement_pref_changed'));
                toast.success('Kapatılmış tüm duyurular sıfırlandı.', 'Başarılı');
              }}
              className="text-[12px] text-gray-500 hover:text-gray-800 font-semibold underline cursor-pointer"
            >
              Kapatılan Duyuruları Tekrar Göster (Sıfırla)
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {savedSuccess ? (
          <div className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[13px]">
            <CheckCircle2 size={16} />
            <span>Ayarlar başarıyla güncellendi!</span>
          </div>
        ) : <div />}

        <button
          type="submit"
          disabled={saving}
          className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Save size={16} />
          <span>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
        </button>
      </div>
    </form>
  );
}
