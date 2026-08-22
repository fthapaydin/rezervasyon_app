import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Seans Raporu PDF ---
export function generateSessionReport(patient, patientSessions) {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FizyoPanel - Seans Raporu', 14, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Hasta: ${patient.full_name}`, 14, 32);
  doc.text(`Telefon: ${patient.phone}`, 14, 38);
  if (patient.complaint) doc.text(`Tani: ${patient.complaint}`, 14, 44);

  const startY = patient.complaint ? 52 : 46;

  autoTable(doc, {
    startY,
    head: [['#', 'Tarih', 'Saat', 'Tedavi', 'Durum']],
    body: patientSessions.map((s, i) => [
      i + 1,
      new Date(s.session_date).toLocaleDateString('tr-TR'),
      s.session_time?.substring(0, 5),
      s.treatment?.name || '-',
      s.status === 'tamamlandi' ? 'Tamamlandi' : 'Bekliyor'
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] },
  });

  const completed = patientSessions.filter(s => s.status === 'tamamlandi').length;
  const total = patient.total_sessions || patientSessions.length;
  const y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Tamamlanan: ${completed} / ${total} seans`, 14, y);

  doc.save(`${patient.full_name.replace(/\s+/g, '_')}_seans_raporu.pdf`);
}

// --- Odeme Makbuzu PDF ---
export function generatePaymentReceipt(payment) {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FizyoPanel - Odeme Makbuzu', 14, 20);

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(14, 25, 196, 25);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const info = [
    ['Hasta', payment.patient?.full_name || '-'],
    ['Hizmet', payment.session?.treatment?.name || '-'],
    ['Seans Tarihi', payment.session?.session_date ? new Date(payment.session.session_date).toLocaleDateString('tr-TR') : '-'],
    ['Odeme Tarihi', new Date(payment.payment_date).toLocaleDateString('tr-TR')],
    ['Odeme Yontemi', payment.payment_method],
    ['Taksit', payment.installments > 1 ? `${payment.installments} taksit` : 'Pesin'],
    ['Tutar', `${Number(payment.amount).toLocaleString('tr-TR')} TL`],
  ];

  let y = 35;
  info.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, y);
    y += 8;
  });

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Bu belge FizyoPanel sistemi tarafindan otomatik olusturulmustur.', 14, 280);

  doc.save(`makbuz_${new Date(payment.payment_date).toISOString().split('T')[0]}.pdf`);
}

// --- Hasta Ozet Raporu PDF ---
export function generatePatientSummary(patient, patientSessions, patientPayments) {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FizyoPanel - Hasta Ozet Raporu', 14, 20);

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(14, 25, 196, 25);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Hasta: ${patient.full_name}`, 14, 35);
  doc.text(`Telefon: ${patient.phone}`, 14, 42);
  if (patient.email) doc.text(`E-posta: ${patient.email}`, 14, 49);
  if (patient.complaint) doc.text(`Tani: ${patient.complaint}`, 14, 56);

  const completed = patientSessions.filter(s => s.status === 'tamamlandi').length;
  const totalPlanned = patient.total_sessions || 10;
  const totalPaid = patientPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalDebt = patientSessions.reduce((s, ses) => s + Number(ses.treatment?.price || 0), 0);
  const balance = totalDebt - totalPaid;

  let y = patient.complaint ? 66 : patient.email ? 59 : 52;
  doc.setFont('helvetica', 'bold');
  doc.text('Seans Durumu:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${completed} / ${totalPlanned} tamamlandi`, 60, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Toplam Odeme:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalPaid.toLocaleString('tr-TR')} TL`, 60, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Kalan Borc:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${Math.max(0, balance).toLocaleString('tr-TR')} TL`, 60, y);

  // Sessions table
  y += 14;
  autoTable(doc, {
    startY: y,
    head: [['#', 'Tarih', 'Tedavi', 'Durum']],
    body: patientSessions.map((s, i) => [
      i + 1,
      new Date(s.session_date).toLocaleDateString('tr-TR'),
      s.treatment?.name || '-',
      s.status === 'tamamlandi' ? 'Tamamlandi' : 'Bekliyor'
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] },
  });

  doc.save(`${patient.full_name.replace(/\s+/g, '_')}_ozet.pdf`);
}
