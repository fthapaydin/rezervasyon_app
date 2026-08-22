import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Mail, Lock, Loader2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('E-posta veya şifre hatalı.');
      setLoading(false);
      return;
    }

    onLogin(data.user);
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] flex items-center justify-center p-4 font-[Inter]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Activity size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">FizyoPanel</h1>
          <p className="text-[13px] text-gray-400 mt-1">Klinik Yönetim Sistemine Giriş</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200/80 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

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
                placeholder="••••••••"
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-[13px] placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-sm"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Giriş yapılıyor...</> : 'Giriş Yap'}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-400 mt-6">FizyoPanel v3.0 &copy; 2026</p>
      </div>
    </div>
  );
}
