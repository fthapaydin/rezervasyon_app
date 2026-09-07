import { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  MessageSquare, 
  Mail, 
  FileDown, 
  Copy, 
  Check, 
  User, 
  Stethoscope, 
  Calendar, 
  CreditCard, 
  Building2, 
  Phone,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  generatePaymentReceipt, 
  formatPhoneForWhatsApp, 
  createReceiptWhatsAppMessage, 
  createReceiptEmailDraft 
} from '../../lib/pdfGenerator';
import { useToast } from '../ui/Toast';
import { getSessionLocation } from '../../lib/sessionLocationUtils';
import { LocationBadge } from './LocationSelector';

export default function ReceiptModal({ 
  isOpen, 
  onClose, 
  payment, 
  clinic, 
  patients = [], 
  sessions = [], 
  staff = [] 
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState('');
  const [showPhoneEdit, setShowPhoneEdit] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [showEmailEdit, setShowEmailEdit] = useState(false);

  if (!isOpen || !payment) return null;

  // Resolve patient details
  const resolvedPatient = payment.patient?.phone 
    ? payment.patient 
    : (patients.find(pt => pt.id === payment.patient_id) || payment.patient || {});

  // Resolve session details
  const resolvedSession = payment.session?.session_date 
    ? payment.session 
    : (sessions.find(s => s.id === payment.session_id) || payment.session || {});

  // Resolve therapist/doctor details
  const resolvedTherapist = resolvedSession.therapist?.full_name 
    ? resolvedSession.therapist 
    : (staff.find(st => st.id === resolvedSession.therapist_id) || {
        full_name: clinic?.owner_name || 'Klinik Yetkilisi',
        title: 'Uzman / Hekim'
      });

  // Consolidated payment payload for generator functions
  const fullPayment = {
    ...payment,
    patient: resolvedPatient,
    session: {
      ...resolvedSession,
      therapist: resolvedTherapist
    }
  };

  const receiptId = payment.id ? payment.id.slice(0, 8).toUpperCase() : '00000000';
  const receiptNo = `#MAK-2026-${receiptId}`;
  const payDate = payment.payment_date ? new Date(payment.payment_date) : new Date();
  const dateStr = payDate.toLocaleDateString('tr-TR');
  const timeStr = payDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  const patientPhone = customPhone || resolvedPatient.phone || '';
  const patientEmail = customEmail || resolvedPatient.email || '';
  const doctorName = resolvedTherapist.full_name 
    ? `${resolvedTherapist.title ? resolvedTherapist.title + ' ' : ''}${resolvedTherapist.full_name}`
    : (clinic?.owner_name || 'Klinik Uzmanı');
  const treatmentName = resolvedSession.treatment?.name || 'Seans / Tedavi Hizmeti';
  const amountStr = Number(payment.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });

  // 1. WhatsApp Paylaşımı
  const handleShareWhatsApp = () => {
    const rawPhone = patientPhone;
    if (!rawPhone) {
      setShowPhoneEdit(true);
      toast.warning('Hastanın kayıtlı telefon numarası bulunamadı. Lütfen numarayı girin.');
      return;
    }

    const cleanPhone = formatPhoneForWhatsApp(rawPhone);
    const msg = createReceiptWhatsAppMessage(fullPayment, clinic);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    toast.success(`${resolvedPatient.full_name || 'Hastaya'} WhatsApp makbuzu hazırlandı!`);
  };

  // 2. E-Posta Paylaşımı
  const handleShareEmail = () => {
    const rawEmail = patientEmail;
    if (!rawEmail) {
      setShowEmailEdit(true);
      toast.warning('Hastanın kayıtlı e-posta adresi bulunamadı. Lütfen e-posta girin.');
      return;
    }

    const { subject, body } = createReceiptEmailDraft(fullPayment, clinic);
    const mailtoUrl = `mailto:${encodeURIComponent(rawEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    toast.success('E-posta taslağı açıldı!');
  };

  // 3. Kurumsal PDF İndirme
  const handleDownloadPdf = () => {
    try {
      generatePaymentReceipt(fullPayment, clinic);
      toast.success('Kurumsal PDF makbuzu başarıyla oluşturuldu ve indirildi.');
    } catch (err) {
      console.error('PDF oluşturma hatası:', err);
      toast.error('PDF oluşturulurken bir hata meydana geldi.');
    }
  };

  // 4. Metni Panoya Kopyalama
  const handleCopyText = async () => {
    try {
      const msg = createReceiptWhatsAppMessage(fullPayment, clinic);
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      toast.success('Makbuz metni panoya kopyalandı.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Panoya kopyalanamadı.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white leading-tight">Tahsilat Makbuzu & Paylaşım</h2>
              <p className="text-[11px] text-slate-400">{receiptNo} • {dateStr} {timeStr}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
            title="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal İçerik (Kaydırılabilir) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Makbuz Kartı Önizlemesi */}
          <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-slate-900" />
            
            {/* Klinik & Durum Bilgisi */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/70">
              <div className="flex items-center gap-2 text-slate-900">
                <Building2 size={16} className="text-emerald-600 shrink-0" />
                <span className="font-bold text-[14px]">{clinic?.name || 'Fizyotim Kliniği'}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold self-start sm:self-auto">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>Tahsil Edildi / Ödendi</span>
              </div>
            </div>

            {/* İki Sütunlu Bilgiler */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-[13px]">
              {/* Sol: Hasta */}
              <div className="space-y-1.5 bg-white p-3.5 rounded-lg border border-slate-100 shadow-2xs">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px] uppercase tracking-wider">
                  <User size={12} />
                  <span>Hasta / Danışan</span>
                </div>
                <p className="font-bold text-slate-900 text-[14px]">{resolvedPatient.full_name || 'Bilinmiyor'}</p>
                <div className="text-[12px] text-slate-600 space-y-0.5 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Telefon:</span>
                    <span className="font-medium text-slate-700">{patientPhone || 'Belirtilmedi'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">E-posta:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[170px]" title={patientEmail}>{patientEmail || 'Belirtilmedi'}</span>
                  </div>
                </div>
              </div>

              {/* Sağ: Seans & Doktor */}
              <div className="space-y-1.5 bg-white p-3.5 rounded-lg border border-slate-100 shadow-2xs">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px] uppercase tracking-wider">
                  <Stethoscope size={12} />
                  <span>Seans & Doktor</span>
                </div>
                <p className="font-bold text-slate-900 text-[14px]">{doctorName}</p>
                <div className="text-[12px] text-slate-600 space-y-0.5 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Hizmet:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[170px]" title={treatmentName}>{treatmentName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Hizmet Yeri:</span>
                    <LocationBadge location={getSessionLocation(resolvedSession)} size="small" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Yöntem:</span>
                    <span className="font-medium text-slate-700">
                      {payment.payment_method || 'Nakit'} {payment.installments > 1 ? `(${payment.installments} Taksit)` : '(Peşin)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tutar Vurgusu */}
            <div className="mt-1 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Tahsil Edilen Toplam Tutar</p>
                <p className="text-[12px] text-slate-500">Tüm vergiler ve hizmet bedeli dahil</p>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{amountStr} ₺</span>
              </div>
            </div>
          </div>

          {/* İletişim Bilgisi Güncelleme Çekmecesi (Eğer telefon veya mail eksikse) */}
          {(showPhoneEdit || showEmailEdit) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[12px] space-y-2">
              <p className="font-semibold text-amber-900">İletişim Bilgilerini Düzenle:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-amber-800 block mb-1">WhatsApp Telefonu</label>
                  <input 
                    type="text" 
                    value={patientPhone} 
                    onChange={e => setCustomPhone(e.target.value)} 
                    placeholder="05454163841"
                    className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-amber-800 block mb-1">E-Posta Adresi</label>
                  <input 
                    type="email" 
                    value={patientEmail} 
                    onChange={e => setCustomEmail(e.target.value)} 
                    placeholder="ornek@mail.com"
                    className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-[12px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aksiyon Butonları (Grid) */}
          <div className="space-y-2.5">
            <p className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Makbuzu Gönder veya İndir</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp Butonu */}
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-start gap-3 p-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[13px] text-white">WhatsApp ile Gönder</span>
                    <ExternalLink size={12} className="opacity-70 group-hover:opacity-100" />
                  </div>
                  <p className="text-[11px] text-white/80 truncate">
                    {patientPhone ? `${patientPhone} numarasına gönder` : 'Telefon numarasını girin'}
                  </p>
                </div>
              </button>

              {/* E-Posta Butonu */}
              <button
                onClick={handleShareEmail}
                className="flex items-center justify-start gap-3 p-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Mail size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[13px] text-white">E-Posta ile Gönder</span>
                    <ExternalLink size={12} className="opacity-70 group-hover:opacity-100" />
                  </div>
                  <p className="text-[11px] text-white/80 truncate">
                    {patientEmail ? `${patientEmail} adresine ilet` : 'E-posta adresini girin'}
                  </p>
                </div>
              </button>

              {/* Kurumsal PDF İndir */}
              <button
                onClick={handleDownloadPdf}
                className="flex items-center justify-start gap-3 p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow-md transition-all cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-emerald-400">
                  <FileDown size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-[13px] text-white block">Kurumsal PDF İndir</span>
                  <p className="text-[11px] text-slate-400 truncate">Resmi onaylı, kaşeli PDF belgesi</p>
                </div>
              </button>

              {/* Metni Kopyala */}
              <button
                onClick={handleCopyText}
                className="flex items-center justify-start gap-3 p-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                  {copied ? <Check size={20} className="text-emerald-600" /> : <Copy size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-[13px] text-slate-900 block">
                    {copied ? 'Kopyalandı!' : 'Makbuz Metnini Kopyala'}
                  </span>
                  <p className="text-[11px] text-slate-500 truncate">WhatsApp veya mesajlaşma için hazır metin</p>
                </div>
              </button>
            </div>
          </div>

          {/* Akıllı İpucu */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-[12px] text-emerald-900">
            <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Pratik İpucu:</strong> &quot;Kurumsal PDF İndir&quot; butonuna bastıktan sonra inen PDF belgesini, açılan WhatsApp sohbetine dosya olarak da sürükleyip doğrudan hastanıza ulaştırabilirsiniz.
            </div>
          </div>
        </div>

        {/* Modal Alt Kapatma Çubuğu */}
        <div className="px-6 py-3 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowPhoneEdit(!showPhoneEdit);
              setShowEmailEdit(!showEmailEdit);
            }}
            className="text-[12px] text-slate-600 hover:text-slate-900 font-medium cursor-pointer underline"
          >
            {showPhoneEdit ? 'Düzenlemeyi Kapat' : 'Hasta İletişimini Düzenle'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[12px] font-semibold transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
