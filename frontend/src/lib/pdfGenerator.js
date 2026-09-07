import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getSessionLocation, getSessionLocationMeta } from './sessionLocationUtils';

// --- Türkçe Karakter Güvenli Dönüştürücü (PDF standard font kerning & mojibake düzeltici) ---
export function toPdfText(str) {
  if (str === null || str === undefined) return '';
  const map = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'I': 'I', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
    '’': "'", '‘': "'", '“': '"', '”': '"',
    '₺': 'TL'
  };
  return String(str).replace(/[çÇğĞıIİöÖşŞüÜ’‘“”₺]/g, match => map[match] || match);
}

// --- Telefon Numarasını WhatsApp Formatına Getir (905...) ---
export function formatPhoneForWhatsApp(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '90' + cleaned.slice(1);
  } else if (cleaned.length === 10 && cleaned.startsWith('5')) {
    cleaned = '90' + cleaned;
  } else if (!cleaned.startsWith('90') && cleaned.length >= 10) {
    cleaned = '90' + cleaned;
  }
  return cleaned;
}

// --- Makbuz İçin WhatsApp Mesajı Oluşturucu ---
export function createReceiptWhatsAppMessage(payment, clinic) {
  const patient = payment.patient || {};
  const session = payment.session || {};
  const therapist = session.therapist || {};
  const clinicName = clinic?.name || 'Fizyotim Kliniği';
  const patientName = patient.full_name || 'Değerli Danışanımız';
  const doctorName = therapist.full_name 
    ? `${therapist.title ? therapist.title + ' ' : ''}${therapist.full_name}`
    : (clinic?.owner_name || 'Klinik Uzmanı');
  const treatmentName = session.treatment?.name || 'Seans / Tedavi Hizmeti';
  const locationMeta = getSessionLocationMeta(getSessionLocation(session));
  
  const receiptId = payment.id ? payment.id.slice(0, 8).toUpperCase() : '00000000';
  const payDate = payment.payment_date ? new Date(payment.payment_date) : new Date();
  const dateStr = payDate.toLocaleDateString('tr-TR');
  const timeStr = payDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const amountStr = Number(payment.amount || 0).toLocaleString('tr-TR');

  return `Sayın *${patientName}*,

*${clinicName}* bünyesinde gerçekleştirilen seansınız için ödeme tahsilatınız başarıyla alınmıştır.

📄 *Makbuz No:* #MAK-${receiptId}
📅 *Tarih:* ${dateStr} - ${timeStr}
🩺 *Uygulayan Uzman:* ${doctorName}
🏷️ *Hizmet:* ${treatmentName} (${locationMeta.label})
💳 *Ödeme Yöntemi:* ${payment.payment_method || 'Nakit'} (${payment.installments > 1 ? `${payment.installments} Taksit` : 'Peşin'})
💰 *Tahsil Edilen Tutar:* ${amountStr} ₺

Bizi tercih ettiğiniz için teşekkür eder, sağlıklı günler dileriz.

*${clinicName}*
${clinic?.phone ? `📞 İletişim: ${clinic.phone}` : ''}
${clinic?.address ? `📍 Adres: ${clinic.address}` : ''}`;
}

// --- Makbuz İçin E-Posta Taslağı Oluşturucu ---
export function createReceiptEmailDraft(payment, clinic) {
  const patient = payment.patient || {};
  const session = payment.session || {};
  const therapist = session.therapist || {};
  const clinicName = clinic?.name || 'Fizyotim Kliniği';
  const patientName = patient.full_name || 'Değerli Danışanımız';
  const doctorName = therapist.full_name 
    ? `${therapist.title ? therapist.title + ' ' : ''}${therapist.full_name}`
    : (clinic?.owner_name || 'Klinik Uzmanı');
  const treatmentName = session.treatment?.name || 'Seans / Tedavi Hizmeti';
  const locationMeta = getSessionLocationMeta(getSessionLocation(session));
  
  const receiptId = payment.id ? payment.id.slice(0, 8).toUpperCase() : '00000000';
  const payDate = payment.payment_date ? new Date(payment.payment_date) : new Date();
  const dateStr = payDate.toLocaleDateString('tr-TR');
  const timeStr = payDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const amountStr = Number(payment.amount || 0).toLocaleString('tr-TR');

  const subject = `Tahsilat Makbuzu - ${clinicName} (#MAK-${receiptId})`;
  const body = `Sayın ${patientName},

${clinicName} bünyesinde gerçekleştirilen seansınız için ödeme tahsilatı başarıyla gerçekleştirilmiştir.

ÖDEME VE SEANS DETAYLARI
--------------------------------------------------
• Makbuz No: #MAK-${receiptId}
• İşlem Tarihi: ${dateStr} ${timeStr}
• Uygulayan Uzman: ${doctorName}
• Alınan Hizmet: ${treatmentName} (${locationMeta.label})
• Ödeme Yöntemi: ${payment.payment_method || 'Nakit'} (${payment.installments > 1 ? `${payment.installments} Taksit` : 'Peşin'})
• Tahsil Edilen Tutar: ${amountStr} TL
--------------------------------------------------

Bizi tercih ettiğiniz için teşekkür eder, sağlıklı ve ağrısız günler dileriz.

${clinicName}
${clinic?.phone ? `Telefon: ${clinic.phone}\n` : ''}${clinic?.email ? `E-posta: ${clinic.email}\n` : ''}${clinic?.address ? `Adres: ${clinic.address}\n` : ''}`;

  return { subject, body, email: patient.email || '' };
}

// ─────────────────────────────────────────────────────────────
// 1. ÖDEME MAKBUZU PDF (Profesyonel Kurumsal Tasarım)
// ─────────────────────────────────────────────────────────────
export function generatePaymentReceipt(payment, clinic = null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const patient = payment.patient || {};
  const session = payment.session || {};
  const therapist = session.therapist || {};
  
  const receiptId = payment.id ? payment.id.slice(0, 8).toUpperCase() : Math.random().toString(36).substring(2, 10).toUpperCase();
  const receiptNo = `#MAK-2026-${receiptId}`;
  
  const payDate = payment.payment_date ? new Date(payment.payment_date) : new Date();
  const dateStr = payDate.toLocaleDateString('tr-TR');
  const timeStr = payDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  
  const clinicName = clinic?.name || 'Fizyotim Saglik & Rehabilitasyon Klinigi';
  const clinicOwner = clinic?.owner_name || '';
  const doctorName = therapist.full_name 
    ? `${therapist.title ? therapist.title + ' ' : ''}${therapist.full_name}`
    : (clinicOwner || 'Klinik Sorumlu Uzmani');
  
  const treatmentName = session.treatment?.name || 'Fizyoterapi ve Rehabilitasyon Seansi';
  const sessionDateStr = session.session_date ? new Date(session.session_date).toLocaleDateString('tr-TR') : dateStr;
  const sessionTimeStr = session.session_time ? session.session_time.substring(0, 5) : '';
  const amountNum = Number(payment.amount || 0);

  // --- Üst Kurumsal Renk Bandı ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 6, 'F');
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(0, 6, 210, 1.5, 'F');

  // --- Üst Başlık & Klinik Bilgileri ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText(clinicName), 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  
  let headerY = 25;
  if (clinicOwner) {
    doc.text(toPdfText(`Bashekim / Yonetici: ${clinicOwner}`), 14, headerY);
    headerY += 4.5;
  }
  
  const contactParts = [];
  if (clinic?.phone) contactParts.push(`Tel: ${clinic.phone}`);
  if (clinic?.email) contactParts.push(`E-posta: ${clinic.email}`);
  if (contactParts.length > 0) {
    doc.text(toPdfText(contactParts.join('  |  ')), 14, headerY);
    headerY += 4.5;
  }
  
  const addressParts = [clinic?.address, clinic?.district, clinic?.city].filter(Boolean);
  if (addressParts.length > 0) {
    doc.text(toPdfText(addressParts.join(', ')), 14, headerY);
  }

  // --- Sağ Taraf: Belge Başlığı & Makbuz Bilgileri ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(5, 150, 105);
  doc.text('TAHSILAT MAKBUZU', 196, 20, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(toPdfText(receiptNo), 196, 26, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(toPdfText(`Duzenlenme: ${dateStr} ${timeStr}`), 196, 31, { align: 'right' });

  // Onay Rozeti (Badge)
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.3);
  doc.roundedRect(148, 34.5, 48, 6.5, 1.2, 1.2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text('TAHSIL EDILDI / ODENDI', 172, 38.8, { align: 'center' });

  // Ayırıcı İnce Çizgi
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 46, 196, 46);

  // --- İki Sütunlu Bilgi Kartları (Hasta ve Seans/Doktor) ---
  const cardY = 51;
  const cardW = 88;
  const cardH = 36;

  // Sol Kart: Hasta Bilgileri
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('HASTA BILGILERI', 19, cardY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text(toPdfText(patient.full_name || 'Bilinmiyor'), 19, cardY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(toPdfText(`Telefon: ${patient.phone || '-'}`), 19, cardY + 20);
  doc.text(toPdfText(`E-posta: ${patient.email || '-'}`), 19, cardY + 25.5);
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(toPdfText(patient.id ? `Hasta No: #HST-${patient.id.slice(0, 8).toUpperCase()}` : ''), 19, cardY + 31);

  // Sağ Kart: Seans & Doktor Bilgileri
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(108, cardY, cardW, cardH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('SEANS & DOKTOR BILGILERI', 113, cardY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text(toPdfText(doctorName), 113, cardY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(toPdfText(`Hizmet: ${treatmentName} (${locationMeta.label})`), 113, cardY + 20);
  doc.text(toPdfText(`Seans Tarihi: ${sessionDateStr} ${sessionTimeStr}`.trim()), 113, cardY + 25.5);
  doc.text(toPdfText(`Odeme Yolu: ${payment.payment_method || 'Nakit'} (${payment.installments > 1 ? `${payment.installments} Taksit` : 'Pesin'})`), 113, cardY + 31);

  // --- Hizmet & Tahsilat Kalemleri Tablosu ---
  autoTable(doc, {
    startY: 93,
    head: [['#', 'Hizmet / Seans Aciklamasi', 'Uygulayan Uzman', 'Odeme Yontemi', 'Taksit', 'Tutar (TL)']],
    body: [
      [
        '1',
        toPdfText(`${treatmentName} (${locationMeta.label})`),
        toPdfText(doctorName),
        toPdfText(payment.payment_method || 'Nakit'),
        payment.installments > 1 ? `${payment.installments} Taksit` : 'Pesin',
        `${amountNum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`
      ]
    ],
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 46 },
      3: { cellWidth: 26 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    }
  });

  // --- Toplam ve Özet Kartı ---
  const endY = doc.lastAutoTable.finalY + 6;

  // Sağ Toplam Vurgu Kutusu
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.6);
  doc.roundedRect(120, endY, 76, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TAHSIL EDILEN TOPLAM TUTAR:', 124, endY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(5, 150, 105);
  doc.text(`${amountNum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 192, endY + 13, { align: 'right' });

  // Sol Açıklama & Not Alanı
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Tahsilat Notu:', 14, endY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(toPdfText('Belirtilen tutar klinigimiz tarafindan basariyla tahsil edilerek hasta hesabina islenmistir.'), 14, endY + 11);
  doc.text(toPdfText(`Islem Takip Referansi: #${payment.id ? payment.id : 'N/A'}`), 14, endY + 16);

  // --- Yetkili İmza & Kaşe Alanı ---
  const signY = endY + 32;

  // Sol: Tahsil Eden Kurum
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Tahsil Eden Kurum / Yetkili', 45, signY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(toPdfText(clinicName), 45, signY + 5, { align: 'center' });
  doc.text(toPdfText(doctorName), 45, signY + 9.5, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(20, signY + 18, 70, signY + 18);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(7.5);
  doc.text('Kase & Imza', 45, signY + 22, { align: 'center' });

  // Sağ: Ödeme Yapan Hasta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Odeme Yapan Hasta / Danisan', 165, signY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(toPdfText(patient.full_name || 'Hasta'), 165, signY + 5, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(140, signY + 18, 190, signY + 18);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(7.5);
  doc.text('Imza', 165, signY + 22, { align: 'center' });

  // --- Alt Bilgi (Footer) ---
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 280, 196, 280);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(toPdfText(`Bu makbuz ${clinicName} yonetim sistemi uzerinden elektronik ortamda uretilmistir. Resmi kayit gecerliligi tasir.`), 14, 285);
  doc.text(toPdfText(`Sayfa 1 / 1`), 196, 285, { align: 'right' });

  // İndir
  const safePatientName = toPdfText(patient.full_name || 'Hasta').replace(/\s+/g, '_');
  const safeDate = dateStr.replace(/\./g, '-');
  doc.save(`Makbuz_${safePatientName}_${safeDate}.pdf`);
}

// ─────────────────────────────────────────────────────────────
// 2. SEANS RAPORU PDF (Kurumsal Klinik & Doktor Bilgileriyle)
// ─────────────────────────────────────────────────────────────
export function generateSessionReport(patient, patientSessions, clinic = null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const clinicName = clinic?.name || 'Fizyotim Saglik & Rehabilitasyon Klinigi';
  const clinicOwner = clinic?.owner_name || '';
  const dateStr = new Date().toLocaleDateString('tr-TR');

  // Üst Renk Bandı
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 6, 'F');
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 6, 210, 1.5, 'F');

  // Klinik Başlığı
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText(clinicName), 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  let hY = 25;
  if (clinicOwner) {
    doc.text(toPdfText(`Bashekim / Yonetici: ${clinicOwner}`), 14, hY);
    hY += 4.5;
  }
  if (clinic?.phone) {
    doc.text(toPdfText(`Tel: ${clinic.phone}`), 14, hY);
  }

  // Belge Başlığı
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(5, 150, 105);
  doc.text('HASTA SEANS RAPORU', 196, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(toPdfText(`Rapor Tarihi: ${dateStr}`), 196, 26, { align: 'right' });

  // Çizgi
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 38, 196, 38);

  // Hasta Bilgi Kartı
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 42, 182, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text(toPdfText(`Hasta: ${patient.full_name}`), 19, 49);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(toPdfText(`Telefon: ${patient.phone || '-'}`), 19, 55);
  if (patient.complaint) {
    doc.text(toPdfText(`Tani / Sikayet: ${patient.complaint}`), 19, 61);
  }

  const completed = patientSessions.filter(s => s.status === 'tamamlandi').length;
  const totalPlanned = patient.total_sessions || patientSessions.length || 10;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105);
  doc.text(toPdfText(`Seans Durumu: ${completed} / ${totalPlanned} Tamamlandi`), 190, 49, { align: 'right' });

  // Seans Tablosu
  autoTable(doc, {
    startY: 71,
    head: [['#', 'Tarih', 'Saat', 'Tedavi / Hizmet', 'Yer', 'Uygulayan Uzman', 'Durum']],
    body: patientSessions.map((s, i) => {
      const docName = s.therapist?.full_name 
        ? `${s.therapist.title ? s.therapist.title + ' ' : ''}${s.therapist.full_name}`
        : '-';
      const locMeta = getSessionLocationMeta(getSessionLocation(s));
      const statusLabel = s.status === 'tamamlandi' ? 'Tamamlandi' 
        : s.status === 'ertelendi' ? 'Ertelendi' 
        : s.status === 'iptal' ? 'Iptal' 
        : s.status === 'gelmedi' ? 'Gelmedi' 
        : 'Bekliyor';

      return [
        i + 1,
        new Date(s.session_date).toLocaleDateString('tr-TR'),
        s.session_time ? s.session_time.substring(0, 5) : '-',
        toPdfText(s.treatment?.name || '-'),
        toPdfText(locMeta.label),
        toPdfText(docName),
        statusLabel
      ];
    }),
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 3.5 },
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Dipnot & Kayıt
  const y = doc.lastAutoTable.finalY + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`Genel Ozet: Toplam ${patientSessions.length} seans planlamasindan ${completed} seans basariyla tamamlanmistir.`, 14, y);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 280, 196, 280);
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(toPdfText(`Bu rapor ${clinicName} tarafindan saglanmistir.`), 14, 285);

  const safeName = toPdfText(patient.full_name).replace(/\s+/g, '_');
  doc.save(`${safeName}_seans_raporu.pdf`);
}

// ─────────────────────────────────────────────────────────────
// 3. HASTA GENEL ÖZET & HESAP RAPORU PDF
// ─────────────────────────────────────────────────────────────
export function generatePatientSummary(patient, patientSessions, patientPayments, clinic = null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const clinicName = clinic?.name || 'Fizyotim Saglik & Rehabilitasyon Klinigi';
  const clinicOwner = clinic?.owner_name || '';
  const dateStr = new Date().toLocaleDateString('tr-TR');

  // Üst Renk Bandı
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 6, 'F');
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 6, 210, 1.5, 'F');

  // Klinik Başlığı
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText(clinicName), 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  let hY = 25;
  if (clinicOwner) {
    doc.text(toPdfText(`Bashekim / Yonetici: ${clinicOwner}`), 14, hY);
    hY += 4.5;
  }
  if (clinic?.phone) {
    doc.text(toPdfText(`Tel: ${clinic.phone}`), 14, hY);
  }

  // Belge Başlığı
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(5, 150, 105);
  doc.text('HASTA KART & TEDAVI OZETI', 196, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(toPdfText(`Tarih: ${dateStr}`), 196, 26, { align: 'right' });

  // Çizgi
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 38, 196, 38);

  // Finansal & Seans Hesaplama
  const completed = patientSessions.filter(s => s.status === 'tamamlandi').length;
  const totalPlanned = patient.total_sessions || 10;
  const totalPaid = patientPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalDebt = patientSessions.reduce((s, ses) => s + Number(ses.treatment?.price || 0), 0);
  const balance = totalDebt - totalPaid;

  // 3 KPI Kartı Yan Yana (x=14, 76, 138)
  // 1. Seans Durumu
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 43, 56, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SEANS TAMAMLANMA', 18, 49);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`${completed} / ${totalPlanned} Seans`, 18, 59);

  // 2. Toplam Ödenen
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(77, 43, 56, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text('TOPLAM TAHSILAT', 81, 49);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(5, 150, 105);
  doc.text(`${totalPaid.toLocaleString('tr-TR')} TL`, 81, 59);

  // 3. Kalan Borç
  const isDebt = balance > 0;
  if (isDebt) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
  } else {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
  }
  doc.roundedRect(140, 43, 56, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  if (isDebt) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(100, 116, 139);
  }
  doc.text('KALAN BAKIYE / BORC', 144, 49);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  if (isDebt) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(30, 41, 59);
  }
  doc.text(`${Math.max(0, balance).toLocaleString('tr-TR')} TL`, 144, 59);

  // Hasta Bilgileri Çubuğu
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(toPdfText(`Hasta: ${patient.full_name}   |   Tel: ${patient.phone || '-'}   |   E-posta: ${patient.email || '-'}`), 14, 73);

  // Seanslar Tablosu
  autoTable(doc, {
    startY: 78,
    head: [['#', 'Seans Tarihi', 'Tedavi / Hizmet', 'Ucret (TL)', 'Durum']],
    body: patientSessions.map((s, i) => [
      i + 1,
      new Date(s.session_date).toLocaleDateString('tr-TR'),
      toPdfText(s.treatment?.name || '-'),
      `${Number(s.treatment?.price || 0).toLocaleString('tr-TR')} TL`,
      s.status === 'tamamlandi' ? 'Tamamlandi' : s.status === 'ertelendi' ? 'Ertelendi' : s.status === 'iptal' ? 'Iptal' : 'Bekliyor'
    ]),
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Ödemeler Tablosu (Varsa)
  if (patientPayments.length > 0) {
    const payStartY = doc.lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Tahsilat ve Odeme Gecmisi', 14, payStartY - 2);

    autoTable(doc, {
      startY: payStartY,
      head: [['#', 'Odeme Tarihi', 'Yontem', 'Taksit', 'Tahsil Edilen Tutar']],
      body: patientPayments.map((p, i) => [
        i + 1,
        new Date(p.payment_date).toLocaleDateString('tr-TR'),
        toPdfText(p.payment_method || 'Nakit'),
        p.installments > 1 ? `${p.installments} Taksit` : 'Pesin',
        `${Number(p.amount || 0).toLocaleString('tr-TR')} TL`
      ]),
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 280, 196, 280);
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(toPdfText(`Bu hesap ozeti ${clinicName} tarafindan hazirlanmistir.`), 14, 285);

  const safeName = toPdfText(patient.full_name).replace(/\s+/g, '_');
  doc.save(`${safeName}_hesap_ozeti.pdf`);
}
