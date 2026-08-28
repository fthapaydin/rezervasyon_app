import { useState } from 'react';
import { RefreshCw, Link2, Check, QrCode } from 'lucide-react';
import { MobileMenuButton } from './Sidebar';
import QRCodeModal from '../QRCodeModal';

export default function Header({ title, subtitle, clinic, onRefresh, onMenuClick, onLogout }) {
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const bookingUrl = clinic?.slug 
    ? `https://fizyo-booking.vercel.app/?clinic=${clinic.slug}` 
    : 'https://fizyo-booking.vercel.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200/80 px-4 md:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          <MobileMenuButton onClick={onMenuClick} />
          <div>
            <h1 className="text-[14px] md:text-[15px] font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {clinic && (
            <>
              {/* QR Stand Button */}
              <button
                onClick={() => setShowQRModal(true)}
                className="h-8 px-2.5 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-800 text-[11px] md:text-[12px] font-medium flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Masaüstü / Danışma QR Standı İndir ve Yazdır"
              >
                <QrCode size={13} className="text-purple-600" />
                <span className="hidden sm:inline">QR Standı</span>
              </button>

              {/* Booking Link Copy Button */}
              <button
                onClick={handleCopyLink}
                className="h-8 px-3 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 text-[11px] md:text-[12px] font-medium flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Hastalarınıza göndereceğiniz randevu linkini kopyalar"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-600 font-bold" />
                    <span className="font-semibold text-emerald-700">Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Link2 size={13} className="text-emerald-600" />
                    <span className="hidden sm:inline">Randevu Linki</span>
                    <span className="sm:hidden">Link</span>
                  </>
                )}
              </button>
            </>
          )}

          <button
            onClick={onRefresh}
            className="h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 text-[12px] font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw size={13}/> <span className="hidden sm:inline">Yenile</span>
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
