import { useState } from 'react';
import { RefreshCw, Link2, Check, QrCode, Megaphone, Bell, Volume2, ArrowRight, ExternalLink } from 'lucide-react';
import { MobileMenuButton } from './Sidebar';
import QRCodeModal from '../QRCodeModal';
import { useToast } from '../ui/Toast';
import { playNotificationSound } from '../../lib/notificationSound';

export default function Header({ 
  title, 
  subtitle, 
  clinic, 
  onRefresh, 
  onMenuClick, 
  onLogout, 
  onOpenAnnouncements, 
  pendingCount = 0, 
  onNavigateToRequests 
}) {
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

  const handleTestSound = () => {
    playNotificationSound();
    toast.info('Klinik randevu bildirim sesi çalındı.', 'Ses Testi');
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

        <div className="flex items-center gap-2">
          {/* Pending Requests Badge */}
          {pendingCount > 0 && (
            <button
              onClick={onNavigateToRequests}
              className="h-9 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={`${pendingCount} adet onay bekleyen randevu talebi var.`}
            >
              <Bell size={13} />
              <span>{pendingCount} Yeni Randevu</span>
            </button>
          )}

          {/* Sound Test Button */}
          <button
            onClick={handleTestSound}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-[12px] font-medium transition-colors cursor-pointer hidden xl:inline-flex items-center"
            title="Randevu bildirim sesini test et"
          >
            Zil Testi
          </button>

          {/* Announcements Button */}
          {onOpenAnnouncements && (
            <button
              onClick={onOpenAnnouncements}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-[12px] font-medium transition-colors cursor-pointer hidden sm:inline-flex items-center"
              title="Sistem Duyuruları & Güncelleme Geçmişi"
            >
              Duyurular
            </button>
          )}

          {clinic && (
            <>
              {/* QR Stand Button */}
              <button
                onClick={() => setShowQRModal(true)}
                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-[12px] font-medium transition-colors cursor-pointer hidden sm:inline-flex items-center"
                title="Danışma QR Standı"
              >
                QR Standı
              </button>

              {/* Booking Link Copy Button */}
              <button
                onClick={handleCopyLink}
                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-[12px] font-medium transition-colors cursor-pointer hidden sm:inline-flex items-center"
                title="Online randevu linkini kopyalar"
              >
                {copied ? 'Kopyalandı' : 'Randevu Linki'}
              </button>

              {/* Direct Open in New Tab Button */}
              <a
                href={bookingUrl}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-[12px] font-medium transition-colors cursor-pointer hidden sm:inline-flex items-center gap-1.5"
                title="Online randevu takvimini yeni sekmede aç"
              >
                <ExternalLink size={12} className="text-slate-500" />
                <span className="hidden md:inline">Sayfaya Git</span>
              </a>
            </>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            title="Verileri Yenile"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
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
