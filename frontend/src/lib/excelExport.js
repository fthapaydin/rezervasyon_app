// Excel CSV Export with UTF-8 BOM for full Turkish character support
export function exportSessionsToExcel(sessions, filename = 'seanslar_listesi') {
  if (!sessions || sessions.length === 0) {
    console.warn('Dışa aktarılacak seans kaydı bulunamadı.');
    return false;
  }

  const headers = [
    'Tarih',
    'Saat',
    'Hasta Adı Soyadı',
    'Telefon',
    'Tedavi / Hizmet',
    'Seans Ücreti (TL)',
    'Durum'
  ];

  const rows = sessions.map(s => [
    s.session_date ? new Date(s.session_date).toLocaleDateString('tr-TR') : '',
    s.session_time ? s.session_time.substring(0, 5) : '',
    `"${(s.patient?.full_name || '').replace(/"/g, '""')}"`,
    `"${(s.patient?.phone || '').replace(/"/g, '""')}"`,
    `"${(s.treatment?.name || '').replace(/"/g, '""')}"`,
    s.treatment?.price ? Number(s.treatment.price).toLocaleString('tr-TR') : '0',
    s.status === 'tamamlandi' ? 'Tamamlandı' : s.status === 'ertelendi' ? 'Ertelendi' : s.status === 'iptal' ? 'İptal Edildi' : s.status === 'gelmedi' ? 'Gelmedi' : 'Bekliyor'
  ]);

  // Semicolon delimiter (Standard for Turkish Excel) with UTF-8 BOM
  const csvContent = '\uFEFF' + [
    headers.join(';'),
    ...rows.map(r => r.join(';'))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Excel CSV Export for Staff Performance & Treatment Breakdown
export function exportStaffReportToExcel(data, filename = 'personel_seans_raporu') {
  if (!data || data.length === 0) {
    console.warn('Dışa aktarılacak personel performans kaydı bulunamadı.');
    return false;
  }

  const headers = [
    'Personel Adı Soyadı',
    'Unvan / Rol',
    'Tedavi / Hizmet',
    'Toplam Seans',
    'Tamamlanan',
    'Bekleyen',
    'Ertelenen / İptal',
    'Tahmini Tutar (TL)'
  ];

  const rows = data.map(item => [
    `"${(item.staff_name || '').replace(/"/g, '""')}"`,
    `"${(item.staff_title || '').replace(/"/g, '""')}"`,
    `"${(item.treatment_name || '').replace(/"/g, '""')}"`,
    item.total_sessions || 0,
    item.completed_sessions || 0,
    item.pending_sessions || 0,
    item.cancelled_or_postponed || 0,
    item.estimated_revenue ? Number(item.estimated_revenue).toLocaleString('tr-TR') : '0'
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(';'),
    ...rows.map(r => r.join(';'))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
