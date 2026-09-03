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
