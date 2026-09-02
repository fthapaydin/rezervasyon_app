import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { API_URL } from '../lib/api';
import { Activity, Mail, Lock, Loader2, LogIn, Sparkles, Building2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-[#f8fafb] flex items-center justify-center p-4 font-[Inter]">
      <div className="w-full max-w-sm">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-600/20">
            <Activity size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Fizyotim</h1>
          <p className="text-[13px] text-gray-400 mt-1">Klinik Yönetim & Rezervasyon Sistemi</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
            <Building2 size={16} className="text-emerald-600" />
            <span className="text-[13px] font-semibold text-gray-700">Klinik Girişi</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Klinik E-Posta
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="klinik@ornek.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-200 text-[13px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Giriş Şifresi
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-200 text-[13px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-[12px] text-red-600 leading-relaxed flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-[13px] font-semibold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Doğrulanıyor...</span>
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  <span>Kliniğe Giriş Yap</span>
                </>
              )}
            </button>
          </form>

          {/* Info note */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Hesabınız yoksa veya giriş bilgilerinizi unuttuysanız lütfen sistem yöneticiniz ile iletişime geçiniz.
            </p>
          </div>

          {/* Quick Demo Login */}
          <button
            type="button"
            onClick={triggerDemoLogin}
            disabled={loading}
            className="mt-3 w-full h-9 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-[12px] font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles size={13} className="text-emerald-600" />
            <span>Tek Tıkla Demo Klinik Girişi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
