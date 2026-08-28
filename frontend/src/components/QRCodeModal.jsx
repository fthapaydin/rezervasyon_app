import { useRef, useState } from 'react';
import { QrCode, Printer, Download, Copy, Check, X, Building2, Sparkles, Smartphone } from 'lucide-react';

export default function QRCodeModal({ clinic, onClose }) {
  const [copied, setCopied] = useState(false);
  const printRef = useRef(null);

  const bookingUrl = clinic?.slug 
    ? `https://fizyo-booking.vercel.app/?clinic=${clinic.slug}`
    : 'https://fizyo-booking.vercel.app';

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(bookingUrl)}&margin=10`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clinic?.slug || 'klinik'}-randevu-karekodu.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      window.open(qrImageUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8 z-10 animate-in zoom-in-95 duration-200 border border-gray-100 max-h-[92vh] overflow-y-auto font-[Inter]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <QrCode size={18} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-gray-900">Masaüstü / Danışma QR Standı</h3>
            <p className="text-[12px] text-gray-400">Bekleme salonu ve danışma masası için hazır stand</p>
          </div>
        </div>

        {/* PRINTABLE STAND CONTAINER */}
        <div 
          ref={printRef}
          className="bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 border-2 border-emerald-600/30 rounded-3xl p-6 text-center shadow-md relative overflow-hidden"
        >
          {/* Clinic Brand Header */}
          <div className="flex flex-col items-center gap-2 mb-4">
            {clinic?.logo_url ? (
              <img src={clinic.logo_url} alt="Logo" className="w-12 h-12 rounded-2xl object-contain shadow-2xs border border-gray-200 p-1 bg-white" />
            ) : (
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md"
                style={{ backgroundColor: clinic?.theme_color || '#059669' }}
              >
                {clinic?.name?.charAt(0) || 'F'}
              </div>
            )}
            <div>
              <h4 className="text-[17px] font-extrabold text-gray-900">{clinic?.name || 'Fizyoterapi Kliniği'}</h4>
              <p className="text-[11px] text-emerald-700 font-semibold tracking-wide uppercase">Online Randevu Standı</p>
            </div>
          </div>

          {/* Slogan */}
          <div className="bg-emerald-600 text-white rounded-2xl py-2 px-3 mb-4 shadow-sm">
            <p className="text-[13px] font-bold tracking-tight">
              Bir Sonraki Seansınızı Beklemeden Alın!
            </p>
          </div>

          {/* QR Code Frame */}
          <div className="w-48 h-48 bg-white p-3 rounded-2xl border-2 border-gray-200/90 shadow-sm mx-auto mb-4 flex items-center justify-center">
            <img 
              src={qrImageUrl} 
              alt="Randevu Karekodu" 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Instructions */}
          <div className="space-y-1.5 text-[11px] text-gray-600 max-w-xs mx-auto">
            <div className="flex items-center gap-2 text-left bg-white/80 p-1.5 px-2.5 rounded-xl border border-gray-100">
              <Smartphone size={14} className="text-emerald-600 shrink-0" />
              <span>Telefonunuzun kamerasını karekoda tutun.</span>
            </div>
            <div className="flex items-center gap-2 text-left bg-white/80 p-1.5 px-2.5 rounded-xl border border-gray-100">
              <Sparkles size={14} className="text-emerald-600 shrink-0" />
              <span>Müsait saati seçip anında randevu oluşturun.</span>
            </div>
          </div>

          {/* Stand Footer */}
          <div className="mt-4 pt-3 border-t border-emerald-100 text-[10px] text-gray-400 font-medium flex items-center justify-between px-2">
            <span>{clinic?.phone || ''}</span>
            <span>FizyoPanel ile Güvenli Randevu</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5">
          <button
            onClick={handlePrint}
            className="h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="A5 / Masaüstü Standı Formatında Yazdır"
          >
            <Printer size={14} />
            <span>Yazdır / PDF</span>
          </button>

          <button
            onClick={handleDownloadImage}
            className="h-10 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Sadece QR Kod Görselini İndir"
          >
            <Download size={14} />
            <span>QR İndir</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="h-10 px-3 rounded-xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Kopyalandı!' : 'Linki Kopyala'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
