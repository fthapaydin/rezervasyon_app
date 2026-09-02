export function formatPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '90' + cleaned.substring(1);
  } else if (cleaned.length === 10) {
    cleaned = '90' + cleaned;
  }
  return cleaned;
}

export function generateReminderText(session) {
  const patientName = session.patient?.full_name || 'Hastamız';
  const dateFormatted = session.session_date
    ? new Date(session.session_date).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        weekday: 'long',
      })
    : '';
  const timeFormatted = session.session_time ? session.session_time.substring(0, 5) : '';
  const treatmentName = session.treatment?.name || 'Fizyoterapi Seansı';

  return `Merhaba Sayın ${patientName},\n\nFizyotim Kliniği'nden randevu hatırlatmasıdır:\n📅 Tarih: ${dateFormatted}\n⏰ Saat: ${timeFormatted}\n🩺 Tedavi: ${treatmentName}\n\nRandevu saatinizde kliniğimizde bulunmanızı rica eder, sağlıklı günler dileriz.`;
}

export function sendWhatsAppReminder(session) {
  const phone = formatPhoneNumber(session.patient?.phone);
  if (!phone) {
    alert('Hastaya ait geçerli bir telefon numarası bulunamadı.');
    return;
  }
  const text = generateReminderText(session);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

export function sendSmsReminder(session) {
  const phone = formatPhoneNumber(session.patient?.phone);
  if (!phone) {
    alert('Hastaya ait geçerli bir telefon numarası bulunamadı.');
    return;
  }
  const text = generateReminderText(session);
  const url = `sms:${phone}?body=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
