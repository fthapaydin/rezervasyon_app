import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { API_URL } from '../lib/api';
import { 
  Activity, Mail, Lock, Loader2, LogIn, Sparkles, Building2, 
  Eye, EyeOff, CheckCircle2, Shield, Calendar, Users, MessageSquareText
} from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const triggerDemoLogin = async () => {
    setEmail('demo@fizyotim.com');
    setPassword('demo123');
    await handleLoginWithCredentials('demo@fizyotim.com', 'demo123');
  };

  const handleLoginWithCredentials = async (loginEmail, loginPass) => {
    setLoading(true);
    setError('');

    try {
      // 1. Supabase clinics tablosundan kliniği sorgula
      const { data: clinic, error: clinicErr } = await supabase
        .from('clinics')
        .select('*')
        .eq('email', loginEmail.trim().toLowerCase())
        .eq('password', loginPass)
        .maybeSingle();

      if (clinicErr) {
        // Fallback: Backend API'ye sor
        try {
          const res = await axios.post(`${API_URL}/auth/clinic-login`, { email: loginEmail, password: loginPass });
          if (res.data) {
            localStorage.setItem('fizyo_clinic', JSON.stringify(res.data));
            onLogin(res.data);
            return;
          }
        } catch (apiErr) {
          setError(apiErr.response?.data?.error || 'Giriş yapılamadı.');
          return;
        }
      }

      if (!clinic) {
        setError('E-posta veya şifre hatalı. Lütfen yöneticinizden aldığınız giriş bilgilerini kullanın.');
        setLoading(false);
        return;
      }

      if (clinic.status === 'pasif') {
        setError('Klinik hesabınız pasife alınmıştır. Lütfen sistem yöneticinizle iletişime geçiniz.');
        setLoading(false);
        return;
      }

      // Başarılı giriş
      localStorage.setItem('fizyo_clinic', JSON.stringify(clinic));
      onLogin(clinic);
    } catch (err) {
      console.error(err);
      setError('Bağlantı hatası oluştu. Lütfen internetinizi kontrol edip tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLoginWithCredentials(email, password);
  };

  return (
    <div className="min-h-screen bg-[#fafcfb] flex font-[Inter]">
      {/* ─── LEFT PANEL: Feature & Brand Showcase (Visible on lg+) ─── */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 p-12 flex-col justify-between relative overflow-hidden text-white select-none">
        {/* Background glow & mesh */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

        {/* Top: Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
              <Activity size={22} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-[20px] font-black tracking-tight block leading-tight text-white">
                Fizyotim
              </span>
              <span className="text-[11px] font-medium text-emerald-400 tracking-wide uppercase block">
                Klinik Yönetim Sistemi
              </span>
            </div>
          </div>
        </div>

        {/* Center: Value Propositions & Live Highlights */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[12px] font-semibold mb-6 backdrop-blur-xs">
            <Sparkles size={14} className="text-emerald-400" />
            <span>Fizyoterapi ve Klinik Yönetiminde Yeni Nesil Standart</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-snug mb-4">
            Kliniğinizi akıllı takvim ve otomatik randevuyla büyütün.
          </h2>

          <p className="text-slate-300 text-[14px] leading-relaxed max-w-lg mb-8">
            Randevuları tek tıkla organize edin, WhatsApp onaylarıyla no-show oranlarını düşürün, hasta takibini ve tahsilatları eksiksiz yönetin.
          </p>

          <div className="grid grid-cols-1 gap-4 max-w-md">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Calendar size={18} />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-white">Sürükle-Bırak Seans Takvimi</h4>
                <p className="text-[12px] text-slate-400">Çoklu terapist desteğiyle randevuları anında planlayın ve taşıyın.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                <MessageSquareText size={18} />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-white">Otomatik WhatsApp Hatırlatmaları</h4>
                <p className="text-[12px] text-slate-400">Hastalarınıza seans öncesi tek tıkla profesyonel şablon bildirimleri yollayın.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Users size={18} />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-white">QR Masa Standı & Online Portal</h4>
                <p className="text-[12px] text-slate-400">Danışma masası için anında A5 QR baskısı alın, hastalar kolayca talep oluştursun.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Trust & Security badge */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[12px] text-slate-400">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-emerald-400" />
            <span>256-bit Güvenli ve Şifreli Veri İletişimi</span>
          </div>
          <span className="text-slate-500">v2.4 Pro</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Authentication Form ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-600/20 text-white">
              <Activity size={24} />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Fizyotim</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Klinik Yönetim & Randevu Portalı</p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-10 shadow-xl shadow-gray-100/60">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Building2 size={13} />
                <span>Klinik Yönetici Paneli</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Hoş Geldiniz
              </h2>
              <p className="text-[13px] text-gray-500 mt-1">
                Kliniğinizi yönetmek için giriş bilgilerinizi giriniz.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  Klinik E-Posta
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="ornek@fizyotim.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-200 text-[13px] bg-gray-50/50 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 outline-none transition-all placeholder:text-gray-400 text-gray-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-bold text-gray-700">
                    Giriş Şifresi
                  </label>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-200 text-[13px] bg-gray-50/50 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 outline-none transition-all placeholder:text-gray-400 text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-[12px] text-red-700 leading-relaxed flex items-start gap-2.5 animate-in fade-in duration-200">
                  <span className="shrink-0 mt-0.5 text-red-600 font-bold">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white text-[13px] font-bold transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Giriş Yapılıyor...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Giriş Yap</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Login */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hızlı Erişim</span>
                <span className="text-[11px] text-emerald-600 font-medium">Test Hesabı</span>
              </div>

              <button
                type="button"
                onClick={triggerDemoLogin}
                disabled={loading}
                className="w-full h-10 rounded-xl border border-emerald-200/90 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-800 text-[12px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Sparkles size={14} className="text-emerald-600" />
                <span>Tek Tıkla Demo Klinik Girişi</span>
              </button>
            </div>
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-6">
            © 2026 Fizyotim Bilişim Teknolojileri. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}
