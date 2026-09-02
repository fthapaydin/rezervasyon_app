import { useState } from 'react';
import { RefreshCw, Link2, Check, QrCode, ExternalLink } from 'lucide-react';
import { MobileMenuButton } from './Sidebar';
import QRCodeModal from '../QRCodeModal';
import { useToast } from '../ui/Toast';

export default function Header({ title, subtitle, clinic, onRefresh, onMenuClick, onLogout }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const bookingUrl = clinic?.slug 
    ? `https://fizyo-booking.vercel.app/?clinic=${clinic.slug}` 
    : 'https://fizyo-booking.vercel.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success('Randevu linki panoya kopyalandı.', 'Link Kopyalandı');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    toast.info('Veriler güncellendi.', 'Yenilendi');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200/80 px-4 md:px-8 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center">
          <MobileMenuButton onClick={onMenuClick} />
          <div>
            <h1 className="text-[15px] md:text-[16px] font-black text-gray-900 tracking-tight leading-tight">{title}</h1>
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {clinic && (
            <>
              {/* QR Stand Button */}
              <button
                onClick={() => setShowQRModal(true)}
                className="h-9 px-3 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100/70 text-purple-800 text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Masaüstü / Danışma QR Standı İndir ve Yazdır"
              >
                <QrCode size={14} className="text-purple-600" />
                <span className="hidden sm:inline">QR Standı</span>
              </button>

              {/* Booking Link Copy Button */}
              <button
                onClick={handleCopyLink}
                className="h-9 px-3.5 rounded-xl border border-emerald-200/90 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Hastalarınıza göndereceğiniz online randevu linkini kopyalar"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-600 font-bold" />
                    <span className="font-bold text-emerald-700">Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Link2 size={14} className="text-emerald-600" />
                    <span className="hidden sm:inline">Randevu Linki</span>
                    <span className="sm:hidden">Link</span>
                  </>
                )}
              </button>
            </>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-[12px] font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Tüm verileri yeniden yükle"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-emerald-600' : ''} /> 
            <span className="hidden sm:inline">Yenile</span>
          </button>
        </div>
      </header>

      {/* QR Code Stand Modal */}
      {showQRModal && (
        <QRCodeModal clinic={clinic} onClose={() => setShowQRModal(false)} />
      )}
    </>
  );
}
