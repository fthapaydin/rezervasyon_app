import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Mail, Lock, Loader2, Sparkles, UserPlus, LogIn } from 'lucide-react';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const DEMO_EMAIL = 'demo@fizyopanel.com';
  const DEMO_PASS = 'demo123456';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (mode === 'login') {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError('E-posta veya şifre hatalı.');
        setLoading(false);
        return;
      }
      if (data.user) onLogin(data.user);
    } else {
      // Register
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(authError.message || 'Kayıt sırasında bir hata oluştu.');
        setLoading(false);
        return;
      }
      if (data.user) {
        if (data.session) {
          onLogin(data.user);
        } else {
          setMessage('Kayıt oluşturuldu! Şimdi giriş yapabilirsiniz.');
          setMode('login');
        }
      }
    }
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError('');
    setMessage('');

    // 1. Try to login with demo credentials
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASS,
    });

    if (!signInErr && signInData.user) {
      onLogin(signInData.user);
      setDemoLoading(false);
      return;
    }

    // 2. If user doesn't exist, create demo account automatically
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: DEMO_EMAIL,
      password: DEMO_PASS,
    });

    if (signUpErr) {
      setError('Demo hesaba bağlanılamadı: ' + signUpErr.message);
      setDemoLoading(false);
      return;
    }

    if (signUpData.session) {
      onLogin(signUpData.user);
    } else {
      // Try signing in once more
      const { data: retryData } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASS,
      });
      if (retryData?.user) onLogin(retryData.user);
      else {
        setEmail(DEMO_EMAIL);
        setPassword(DEMO_PASS);
        setMessage('Demo hesap oluşturuldu. "Giriş Yap" butonuna basarak girebilirsiniz.');
      }
    }
    setDemoLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] flex items-center justify-center p-4 font-[Inter]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm shadow-emerald-600/20">
            <Activity size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">FizyoPanel</h1>
          <p className="text-[13px] text-gray-400 mt-1">Klinik Yönetim Sistemi</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg mb-5 text-[13px] font-medium text-gray-600">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                mode === 'login' ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'hover:text-gray-900'
              }`}
            >
              <LogIn size={14} /> Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setMessage(''); }}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                mode === 'register' ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'hover:text-gray-900'
              }`}
            >
              <UserPlus size={14} /> Kayıt Ol
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[12px] px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] px-3 py-2 rounded-lg mb-4">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">E-posta</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@klinik.com"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-[13px] placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Şifre</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-[13px] placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> {mode === 'login' ? 'Giriş yapılıyor...' : 'Kayıt yapılıyor...'}</>
              ) : (
                mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-semibold text-[10px]">Veya</span></div>
          </div>

          {/* One-Click Demo Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading || demoLoading}
            className="w-full h-10 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[12px] font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {demoLoading ? (
              <><Loader2 size={15} className="animate-spin text-amber-600" /> Demo Hesaba Bağlanıyor...</>
            ) : (
              <><Sparkles size={15} className="text-amber-600" /> Tek Tıkla Demo Giriş</>
            )}
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">FizyoPanel v3.0 &copy; 2026</p>
      </div>
    </div>
  );
}
