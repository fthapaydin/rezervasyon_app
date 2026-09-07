import { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkConnection = useCallback(async () => {
    setChecking(true);
    try {
      // Hafif bir ping isteği (cache-busting ile)
      await fetch('/favicon.svg?ping=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
      setIsOffline(false);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3500);
      }
    } catch {
      setIsOffline(!navigator.onLine);
    } finally {
      setChecking(false);
    }
  }, [wasOffline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3500);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periyodik kontrol (sadece çevrimdışı iken 10 sn'de bir)
    let interval = null;
    if (isOffline) {
      interval = setInterval(checkConnection, 10000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (interval) clearInterval(interval);
    };
  }, [isOffline, wasOffline, checkConnection]);

  // Çevrimiçi ve yeniden bağlanma mesajı yoksa hiçbir şey gösterme
  if (!isOffline && !showReconnected) {
    return null;
  }

  // Yeniden bağlandı bildirimi (Yeşil)
  if (showReconnected && !isOffline) {
    return (
      <div className="fixed top-0 inset-x-0 z-[9999] bg-emerald-600 text-white px-4 py-2 text-xs font-semibold shadow-lg flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
        <Wifi size={15} className="animate-bounce" />
        <span>İnternet bağlantınız yeniden kuruldu. Verileriniz güncel.</span>
      </div>
    );
  }

  // Çevrimdışı bildirimi (Amber / Kırmızı Uyarı)
  return (
    <div className="fixed top-0 inset-x-0 z-[9999] bg-gradient-to-r from-amber-600 via-amber-700 to-red-700 text-white px-4 py-2.5 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <WifiOff size={14} className="text-white" />
        </div>
        <div>
          <span className="font-bold uppercase tracking-wider">İnternet Bağlantısı Yok:</span>
          <span className="ml-1.5 opacity-90">
            Şu anda çevrimdışısınız. Bağlantınız geri geldiğinde randevu ve bildirimleriniz otomatik eşitlenecektir.
          </span>
        </div>
      </div>

      <button
        onClick={checkConnection}
        disabled={checking}
        className="h-7 px-3 rounded-lg bg-white text-slate-900 hover:bg-amber-50 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50"
      >
        <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
        <span>{checking ? 'Kontrol Ediliyor...' : 'Bağlantıyı Yenile'}</span>
      </button>
    </div>
  );
}
