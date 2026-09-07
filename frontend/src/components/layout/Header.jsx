import { useState, useRef, useEffect } from 'react';
import { 
  RefreshCw, Link2, Check, QrCode, Megaphone, Bell, Volume2, 
  ArrowRight, ExternalLink, KeyRound, User, LogOut, ChevronDown, Lock, X, ShieldCheck, Stethoscope, UserCheck, Eye, EyeOff
} from 'lucide-react';
import { MobileMenuButton } from './Sidebar';
import QRCodeModal from '../QRCodeModal';
import { useToast } from '../ui/Toast';
import { playNotificationSound } from '../../lib/notificationSound';
import { supabase } from '../../lib/supabase';
import { syncStaffMetaToClinic } from '../../lib/rbacUtils';

export default function Header({ 
  title, 
  subtitle, 
  clinic, 
  activeUser,
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
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Şifre Değiştir Formu State
  const [passData, setPassData] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passSubmitting, setPassSubmitting] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown]);

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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passData.newPassword.length < 4) {
      toast.warning('Şifre en az 4 karakterden oluşmalıdır.', 'Geçersiz Şifre');
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      toast.warning('Girdiğiniz şifreler birbiriyle uyuşmuyor.', 'Şifre Uyuşmazlığı');
      return;
    }

    setPassSubmitting(true);
    try {
      if (activeUser?.is_owner || activeUser?.role === 'admin' && !activeUser?.staff_id) {
        // Klinik sahibi şifresini günceller
        const { error } = await supabase
          .from('clinics')
          .update({ password: passData.newPassword })
          .eq('id', clinic.id);
        if (error) throw error;
        toast.success('Klinik yönetici şifreniz başarıyla değiştirildi.', 'Şifre Güncellendi');
      } else if (activeUser?.staff_id) {
        // Personel kendi şifresini günceller
        let { error } = await supabase
          .from('staff')
          .update({ password: passData.newPassword })
          .eq('id', activeUser.staff_id);

        // Fallback sync
        await syncStaffMetaToClinic(clinic, activeUser.staff_id, {
          password: passData.newPassword
        });

        toast.success('Giriş şifreniz başarıyla değiştirildi.', 'Şifre Güncellendi');
      }

      setShowPasswordModal(false);
      setPassData({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Şifre güncellenirken hata oluştu.', 'Hata');
    } finally {
      setPassSubmitting(false);
    }
  };

  const userDisplayName = activeUser?.full_name || clinic?.owner_name || clinic?.name || 'Kullanıcı';
  const userRole = activeUser?.role || 'admin';
  const roleLabel = userRole === 'therapist' ? 'Fizyoterapist' : userRole === 'secretary' ? 'Sekreterlik' : 'Yönetici';
  const RoleIcon = userRole === 'therapist' ? Stethoscope : userRole === 'secretary' ? UserCheck : ShieldCheck;

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
              className="h-9 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs animate-pulse"
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

          {/* Active User Badge & Dropdown */}
          <div className="relative ml-1" ref={dropdownRef}>
            <button
              onClick={() => setShowUserDropdown(prev => !prev)}
              className="h-9 px-2.5 rounded-xl border border-gray-200/90 bg-white hover:bg-gray-50 flex items-center gap-2 transition-all cursor-pointer shadow-2xs group"
              title={`${userDisplayName} (${roleLabel})`}
            >
              <div 
                className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-black shadow-2xs shrink-0"
                style={{ backgroundColor: activeUser?.color || (userRole === 'admin' ? '#1e293b' : '#059669') }}
              >
                {userDisplayName.charAt(0)}
              </div>
              <div className="text-left hidden lg:block max-w-[130px]">
                <div className="text-[12px] font-bold text-gray-800 truncate leading-tight">{userDisplayName}</div>
                <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                  <RoleIcon size={10} className="text-emerald-600" />
                  <span className="truncate">{roleLabel}</span>
                </div>
              </div>
              <ChevronDown size={13} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                  <p className="text-[12px] font-bold text-gray-900 truncate">{userDisplayName}</p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{activeUser?.email || clinic?.email}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <RoleIcon size={11} /> {roleLabel}
                  </span>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <KeyRound size={14} className="text-emerald-600" />
                    <span>Şifre Değiştir</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} className="text-rose-500" />
                    <span>Güvenli Çıkış Yap</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* QR Code Stand Modal */}
      {showQRModal && (
        <QRCodeModal clinic={clinic} onClose={() => setShowQRModal(false)} />
      )}

      {/* Şifre Değiştir Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-emerald-600" />
                <h3 className="text-[15px] font-bold text-gray-900">Giriş Şifresini Değiştir</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <p className="text-[12px] text-gray-500 leading-relaxed">
                <strong>{userDisplayName}</strong> hesabınız için yeni bir giriş şifresi belirleyin.
              </p>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">Yeni Şifre</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="En az 4 karakter"
                    value={passData.newPassword}
                    onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
                    className="input-field pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    title={showNewPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">Yeni Şifre (Tekrar)</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Şifreyi tekrar yazın"
                    value={passData.confirmPassword}
                    onChange={e => setPassData({ ...passData, confirmPassword: e.target.value })}
                    className="input-field pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    title={showConfirmPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="h-10 px-4 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={passSubmitting}
                  className="h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {passSubmitting ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
