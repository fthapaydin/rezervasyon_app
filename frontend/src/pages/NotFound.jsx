import { Home, ArrowLeft, SearchX, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export default function NotFound({ onGoHome }) {
  const handleHomeClick = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-[Inter]">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 md:p-10 text-center relative overflow-hidden">
          {/* Subtle Top Glow Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-full" />

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold uppercase tracking-wider mb-4 border border-slate-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Hata Kodu: 404</span>
          </div>

          {/* Large Stylized 404 */}
          <div className="relative my-2">
            <h1 className="text-7xl md:text-8xl font-black text-slate-900 tracking-tight select-none">
              4<span className="text-emerald-600">0</span>4
            </h1>
          </div>

          {/* Message */}
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight mt-1 mb-2">
            Aradığınız Sayfa Bulunamadı
          </h2>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-md mx-auto mb-8">
            Ulaşmaya çalıştığınız adres silinmiş, taşınmış, adı değiştirilmiş veya bağlantı hatalı girilmiş olabilir.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              onClick={handleHomeClick}
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-all shadow-md shadow-slate-900/15 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Home size={16} />
              <span>Anasayfaya Dön</span>
            </button>

            <button
              onClick={() => window.history.length > 1 ? window.history.back() : handleHomeClick()}
              className="w-full sm:w-auto h-11 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Geri Git</span>
            </button>
          </div>

          {/* Quick Nav Links */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-[12px] text-slate-500">
            <a href="/" className="hover:text-emerald-600 transition-colors font-medium">Klinik Girişi</a>
            <span className="text-slate-300">•</span>
            <a href="/portal" className="hover:text-emerald-600 transition-colors font-medium">Hasta Randevu Portalı</a>
            <span className="text-slate-300">•</span>
            <a href="/superadmin" className="hover:text-emerald-600 transition-colors font-medium">Süper Admin</a>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          Fizyotim — Fizyoterapi ve Klinik Yönetim Platformu
        </p>
      </div>
    </div>
  );
}
