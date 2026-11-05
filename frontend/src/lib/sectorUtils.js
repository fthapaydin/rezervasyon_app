/**
 * Çoklu Branş & Dinamik Sektör Şablon Motoru (sectorUtils.js)
 * -----------------------------------------------------------
 * Fizyoterapi, Diyetisyen, Psikolog, Pilates/Yoga Stüdyosu, Güzellik Merkezi,
 * Diş Kliniği, Dil & Konuşma Terapisi ve Özel Randevulu İşletmeler için
 * tüm uygulama içi terimleri, unvanları, hızlı etiketleri ve pazarlama
 * metinlerini dinamik olarak üretir.
 */

export const SECTOR_PRESETS = {
  fizyoterapi: {
    id: 'fizyoterapi',
    badge: 'Fizyoterapi & Rehabilitasyon',
    shortLabel: 'Fizyoterapi',
    icon: '🩺',
    clientSingular: 'Hasta',
    clientPlural: 'Hastalar',
    clientManagementTitle: 'Hasta Yönetimi',
    clientSubtitle: 'Hasta kayıtlarını, seans paketlerini ve klinik öykülerini yönetin',
    staffSingular: 'Fizyoterapist',
    staffPlural: 'Fizyoterapistler',
    staffTitle: 'Fzt.',
    staffSubtitle: 'Fizyoterapistleri ve çalışan yetkilerini yönetin',
    serviceSingular: 'Tedavi',
    servicePlural: 'Tedavi & Hizmetler',
    serviceSubtitle: 'Sunduğunuz fizyoterapi ve rehabilitasyon hizmetlerini düzenleyin',
    businessSingular: 'Klinik',
    businessSystemTitle: 'KLİNİK YÖNETİM SİSTEMİ',
    navSectionTitle: 'KLİNİK YÖNETİMİ',
    complaintLabel: 'Şikayeti / Ön Tanı',
    complaintPlaceholder: 'Bel fıtığı, Boyun düzleşmesi, Ön çapraz bağ rehabilitasyonu...',
    quickTags: [
      '🦴 Bel / Fıtık',
      '💆‍♂️ Boyun Ağrısı',
      '🦵 Diz & Menisküs',
      '🏃 Omuz / Kol',
      '📐 Postür & Skolyoz',
      '🦶 Ayak / Topuk Dikeni',
      '✨ Genel Kontrol'
    ],
    sampleServices: [
      { name: 'Manuel Terapi & Mobilizasyon', price: 1200, duration_minutes: 60 },
      { name: 'Klinik Reformer Pilates', price: 900, duration_minutes: 50 },
      { name: 'Skolyoz (3D Schroth) Terapisi', price: 1300, duration_minutes: 60 },
      { name: 'Ortopedik & Sporcu Rehabilitasyonu', price: 1250, duration_minutes: 60 },
      { name: 'Kuru İğneleme & Miyofasiyal Terapi', price: 1000, duration_minutes: 45 }
    ],
    marketing: {
      heroBadge: 'Fizyoterapi Klinikleri & Rehabilitasyon Merkezleri İçin',
      heroTitle: 'Fizyoterapi Kliniğinizi Tek Ekrandan Yönetin',
      heroHighlight: 'Sıfır Karmaşa, Maksimum Verim',
      heroDesc: 'Hastalarınız canlı takvimden 7/24 randevu talebi oluştursun, paket seanslar ve FIFO tahsilatlar otomatik takip edilsin, kurumsal PDF raporlar ve WhatsApp bildirimleri tek tıkla gönderilsin.',
      portalHeadline: 'Doğru Fizyoterapisti Bulun, Dakikalar İçinde Randevu Alın',
      portalSub: 'Şehrinizdeki uzman fizyoterapistleri keşfedin, müsait seans saatlerini canlı görün ve online randevunuzu planlayın.',
      demoRolePlaceholder: 'Örn: Fzt. Fatih Apaydın',
      demoBusinessPlaceholder: 'Örn: Yaşam Fizyoterapi Merkezi'
    }
  },

  diyetisyen: {
    id: 'diyetisyen',
    badge: 'Beslenme & Diyet Danışmanlığı',
    shortLabel: 'Diyetisyen',
    icon: '🥗',
    clientSingular: 'Danışan',
    clientPlural: 'Danışanlar',
    clientManagementTitle: 'Danışan Yönetimi',
    clientSubtitle: 'Danışan kayıtlarını, beslenme paketlerini ve ölçüm geçmişini yönetin',
    staffSingular: 'Diyetisyen',
    staffPlural: 'Diyetisyenler',
    staffTitle: 'Dyt.',
    staffSubtitle: 'Diyetisyenleri ve ofis çalışan yetkilerini yönetin',
    serviceSingular: 'Program / Hizmet',
    servicePlural: 'Beslenme Programları',
    serviceSubtitle: 'Sunduğunuz diyet paketlerini ve ölçüm hizmetlerini düzenleyin',
    businessSingular: 'Merkez',
    businessSystemTitle: 'DİYET & DANIŞMANLIK SİSTEMİ',
    navSectionTitle: 'MERKEZ YÖNETİMİ',
    complaintLabel: 'Hedef / Beslenme Öyküsü',
    complaintPlaceholder: 'Kilo verme, İnsülin direnci, Sporcu beslenmesi, Gebelik takibi...',
    quickTags: [
      '🥗 Kilo Kontrolü & Zayıflama',
      '📊 InBody Vücut Analizi',
      '💪 Sporcu Beslenmesi',
      '🩸 İnsülin Direnci / Diyabet',
      '🤰 Gebelik & Emzirme',
      '🌱 Eliminasyon / Fonksiyonel',
      '✨ Kontrol Görüşmesi'
    ],
    sampleServices: [
      { name: 'İlk Muayene & Detaylı Vücut Analizi', price: 1200, duration_minutes: 60 },
      { name: 'Haftalık Kontrol & Liste Yenileme', price: 800, duration_minutes: 30 },
      { name: 'Online Beslenme Danışmanlığı', price: 950, duration_minutes: 45 },
      { name: 'Sporcu Beslenmesi Programı', price: 1300, duration_minutes: 60 }
    ],
    marketing: {
      heroBadge: 'Diyetisyenler & Beslenme Danışmanlığı Merkezleri İçin',
      heroTitle: 'Beslenme & Diyet Ofisinizi Dijitalleştirin',
      heroHighlight: 'Danışan Takibi Artık Çok Kolay',
      heroDesc: 'Danışanlarınız müsait saatlerinize 7/24 online randevu alsın, haftalık kontrol paketleri, yüz yüze/online görüşmeler ve ödemeler tek ekrandan otomatik takip edilsin.',
      portalHeadline: 'Uzman Diyetisyeninizi Bulun, Hemen Online Randevu Alın',
      portalSub: 'Şehrinizdeki beslenme ve diyet uzmanlarını keşfedin, canlı takvimden size uygun görüşme saatini seçin.',
      demoRolePlaceholder: 'Örn: Dyt. Ayşe Kaya',
      demoBusinessPlaceholder: 'Örn: FitYaşam Beslenme & Diyet Merkezi'
    }
  },

  psikoloji: {
    id: 'psikoloji',
    badge: 'Psikoloji & Psikoterapi Merkezi',
    shortLabel: 'Psikolog',
    icon: '🧠',
    clientSingular: 'Danışan',
    clientPlural: 'Danışanlar',
    clientManagementTitle: 'Danışan Yönetimi',
    clientSubtitle: 'Danışan kayıtlarını, terapi süreçlerini ve seans paketlerini KVKK uyumlu yönetin',
    staffSingular: 'Psikolog / Uzman',
    staffPlural: 'Psikologlar & Uzmanlar',
    staffTitle: 'Psk.',
    staffSubtitle: 'Psikologları, terapistleri ve asistan yetkilerini yönetin',
    serviceSingular: 'Terapi / Seans',
    servicePlural: 'Terapi & Seans Türleri',
    serviceSubtitle: 'Bireysel, çift, çocuk/ergen ve online terapi seanslarını düzenleyin',
    businessSingular: 'Merkez',
    businessSystemTitle: 'PSİKOLOJİ & DANIŞMANLIK SİSTEMİ',
    navSectionTitle: 'MERKEZ YÖNETİMİ',
    complaintLabel: 'Danışmanlık Konusu / Not',
    complaintPlaceholder: 'Bireysel terapi, Çift danışmanlığı, Sınav kaygısı, Oyun terapisi...',
    quickTags: [
      '🧠 Bireysel Yetişkin Terapisi',
      '💑 Çift & Evlilik Terapisi',
      '🧸 Çocuk & Oyun Terapisi',
      '🌱 Ergen & Sınav Danışmanlığı',
      '💻 Online Terapi Seansı',
      '✨ İlk Değerlendirme Görüşmesi'
    ],
    sampleServices: [
      { name: 'Bireysel Psikoterapi Seansı', price: 1500, duration_minutes: 50 },
      { name: 'Çift & Aile Terapisi', price: 2200, duration_minutes: 60 },
      { name: 'Çocuk & Ergen Danışmanlığı', price: 1500, duration_minutes: 50 },
      { name: 'Online Psikoterapi Görüşmesi', price: 1400, duration_minutes: 50 }
    ],
    marketing: {
      heroBadge: 'Psikologlar, Psikoterapi & Aile Danışmanlığı Merkezleri İçin',
      heroTitle: 'Psikoterapi & Danışmanlık Merkezinizi Kolayca Yönetin',
      heroHighlight: 'KVKK Uyumlu, Sade & Güvenli',
      heroDesc: 'Danışanlarınız yüz yüze veya online terapi saatlerine 7/24 randevu oluştursun; çoklu uzman takvimi, oda/lokasyon planlaması ve seans ödemeleri tek merkezde toplansın.',
      portalHeadline: 'Uzman Psikolog & Terapistlerden Online Randevu Alın',
      portalSub: 'Müsait seans saatlerini canlı takvimden inceleyin, yüz yüze veya online terapi randevunuzu güvenle oluşturun.',
      demoRolePlaceholder: 'Örn: Uzm. Kl. Psk. Selin Demir',
      demoBusinessPlaceholder: 'Örn: Denge Psikoloji & Danışmanlık'
    }
  },

  pilates: {
    id: 'pilates',
    badge: 'Reformer Pilates & Yoga Stüdyosu',
    shortLabel: 'Pilates & Yoga',
    icon: '🧘‍♀️',
    clientSingular: 'Üye',
    clientPlural: 'Üyeler',
    clientManagementTitle: 'Üye & Paket Yönetimi',
    clientSubtitle: 'Stüdyo üyelerini, kalan ders paketlerini ve devamlılık durumunu yönetin',
    staffSingular: 'Eğitmen',
    staffPlural: 'Eğitmenler',
    staffTitle: 'Eğt.',
    staffSubtitle: 'Pilates/Yoga eğitmenlerini ve stüdyo yetkilerini yönetin',
    serviceSingular: 'Ders / Paket',
    servicePlural: 'Dersler & Paketler',
    serviceSubtitle: 'Birebir Reformer, Düet, Grup Mat ve özel ders türlerini düzenleyin',
    businessSingular: 'Stüdyo',
    businessSystemTitle: 'STÜDYO & REZERVASYON SİSTEMİ',
    navSectionTitle: 'STÜDYO YÖNETİMİ',
    complaintLabel: 'Üye Hedefi & Sağlık Notu',
    complaintPlaceholder: 'Postür düzeltme, Sıkılaşma, Hamile pilatesi, Bel hassasiyeti...',
    quickTags: [
      '🧘‍♀️ Birebir Reformer Pilates',
      '👯‍♀️ Düet (2 Kişilik) Reformer',
      '🤸‍♀️ Cadillac & Tower Ders',
      '🤰 Hamile Pilatesi',
      '📐 Postür & Esneklik Analizi',
      '✨ Deneme Dersi Talebi'
    ],
    sampleServices: [
      { name: 'Birebir (Private) Reformer Pilates', price: 900, duration_minutes: 50 },
      { name: 'Düet Reformer Pilates', price: 1400, duration_minutes: 50 },
      { name: 'Hamile (Prenatal) Pilatesi', price: 950, duration_minutes: 50 },
      { name: 'Deneme Dersi & Postür Analizi', price: 500, duration_minutes: 45 }
    ],
    marketing: {
      heroBadge: 'Reformer Pilates, Yoga & Personal Training Stüdyoları İçin',
      heroTitle: 'Pilates & Egzersiz Stüdyonuz İçin Akıllı Takvim',
      heroHighlight: 'Paket Ders & Eğitmen Takibi',
      heroDesc: 'Üyeleriniz telefonlarından kalan ders haklarını sorgulasın ve boş saatlere randevu alsın; eğitmen ders sayıları, haftalık şablon kopyalama ve paket yenilemeler saniyeler sürsün.',
      portalHeadline: 'Stüdyo Takvimini Görüntüleyin, Dersinizi Hemen Ayırtın',
      portalSub: 'Eğitmenlerin müsait ders saatlerini canlı görün, kalan paket hakkınızı sorgulayın ve ders randevunuzu oluşturun.',
      demoRolePlaceholder: 'Örn: Eğt. Elif Yılmaz',
      demoBusinessPlaceholder: 'Örn: Core Studio Reformer Pilates'
    }
  },

  guzellik: {
    id: 'guzellik',
    badge: 'Güzellik, Cilt Bakımı & Estetik Merkezi',
    shortLabel: 'Güzellik & Estetik',
    icon: '✨',
    clientSingular: 'Danışan',
    clientPlural: 'Danışanlar',
    clientManagementTitle: 'Danışan & Müşteri Yönetimi',
    clientSubtitle: 'Müşteri kayıtlarını, seans paketlerini ve uygulama geçmişini yönetin',
    staffSingular: 'Uzman / Estetisyen',
    staffPlural: 'Uzmanlar & Estetisyenler',
    staffTitle: 'Uzm.',
    staffSubtitle: 'Estetisyenleri, uzmanları ve danışma yetkilerini yönetin',
    serviceSingular: 'İşlem / Bakım',
    servicePlural: 'İşlem & Bakım Hizmetleri',
    serviceSubtitle: 'Cilt bakımı, lazer, bölgesel incelme ve estetik işlemlerinizi düzenleyin',
    businessSingular: 'Merkez',
    businessSystemTitle: 'MERKEZ & RANDEVU SİSTEMİ',
    navSectionTitle: 'MERKEZ YÖNETİMİ',
    complaintLabel: 'İşlem Talebi / Cilt & Bölge Notu',
    complaintPlaceholder: 'Hydrafacial cilt bakımı, Lazer epilasyon paketi, G5 masajı...',
    quickTags: [
      '✨ Medikal Cilt Bakımı',
      '💧 Hydrafacial & Nem Terapisi',
      '⚡ Lazer Epilasyon Seansı',
      '🌿 Bölgesel İncelme / G5',
      '💆‍♀️ Somon DNA / Mezoterapi',
      '🔍 Ücretsiz Cilt Analizi'
    ],
    sampleServices: [
      { name: 'Medikal Cilt Bakımı & Hydrafacial', price: 1500, duration_minutes: 60 },
      { name: 'Lazer Epilasyon Seansı', price: 1200, duration_minutes: 45 },
      { name: 'Bölgesel İncelme (G5 & Lenf Drenaj)', price: 1100, duration_minutes: 45 },
      { name: 'Leke & Akne Protokolü', price: 1600, duration_minutes: 60 }
    ],
    marketing: {
      heroBadge: 'Güzellik Salonları, Medikal Estetik & Bakım Merkezleri İçin',
      heroTitle: 'Güzellik & Estetik Merkezinizde Randevu Kaosuna Son',
      heroHighlight: 'Seans Paketi, Kabin & Kasa Takibi',
      heroDesc: 'Danışanlarınız 7/24 online randevu alsın, WhatsApp onay ve hatırlatma mesajlarıyla randevuya gelmeme (No-Show) oranları düşsün, paket seanslar ve kasa tahsilatları kusursuz yönetilsin.',
      portalHeadline: 'Bakım & Estetik Randevunuzu Dakikalar İçinde Oluşturun',
      portalSub: 'Uzmanlarımızın müsait saatlerini canlı takvimden seçin, işlem ve kalan paket seanslarınızı anında görüntüleyin.',
      demoRolePlaceholder: 'Örn: Uzm. Est. Синем Arslan',
      demoBusinessPlaceholder: 'Örn: Aura Güzellik & Estetik Merkezi'
    }
  },

  dis: {
    id: 'dis',
    badge: 'Diş Kliniği & Ağız Sağlığı Polikliniği',
    shortLabel: 'Diş Kliniği',
    icon: '🦷',
    clientSingular: 'Hasta',
    clientPlural: 'Hastalar',
    clientManagementTitle: 'Hasta Yönetimi',
    clientSubtitle: 'Hasta kayıtlarını, tedavi planlarını ve ödeme geçmişini yönetin',
    staffSingular: 'Diş Hekimi',
    staffPlural: 'Diş Hekimleri',
    staffTitle: 'Dt.',
    staffSubtitle: 'Diş hekimlerini ve klinik personel yetkilerini yönetin',
    serviceSingular: 'Tedavi / İşlem',
    servicePlural: 'Tedavi & İşlemler',
    serviceSubtitle: 'Muayene, implant, ortodonti ve estetik diş işlemlerini düzenleyin',
    businessSingular: 'Klinik',
    businessSystemTitle: 'DİŞ KLİNİĞİ YÖNETİM SİSTEMİ',
    navSectionTitle: 'KLİNİK YÖNETİMİ',
    complaintLabel: 'Şikayeti / Tedavi Planı',
    complaintPlaceholder: 'Diş ağrısı, İmplant kontrolü, Diş taşı temizliği, Şeffaf plak...',
    quickTags: [
      '🦷 İlk Muayene & Röntgen',
      '✨ Diş Taşı Temizliği & Beyazlatma',
      '💎 İmplant & Cerrahi Kontrol',
      '😁 Ortodonti / Şeffaf Plak',
      '🛡️ Kanal & Dolgu Tedavisi',
      '🚨 Ağrı / Acil Randevu'
    ],
    sampleServices: [
      { name: 'Diş Hekimi Muayene & Planlama', price: 800, duration_minutes: 30 },
      { name: 'Diş Taşı Temizliği (Detartraj)', price: 1500, duration_minutes: 45 },
      { name: 'Kompozit Dolgu & Restorasyon', price: 1800, duration_minutes: 60 },
      { name: 'Profesyonel Diş Beyazlatma (Bleaching)', price: 4500, duration_minutes: 60 }
    ],
    marketing: {
      heroBadge: 'Diş Hekimleri & Ağız ve Diş Sağlığı Poliklinikleri İçin',
      heroTitle: 'Diş Kliniğiniz İçin Modern Randevu & Hasta Takip Sistemi',
      heroHighlight: 'Çoklu Hekim, Ünit & Finans Yönetimi',
      heroDesc: 'Hekim bazlı renkli takvim, ünit/oda seçimi, tedavi taksit ve FIFO bakiye takibi, kurumsal PDF makbuz ve WhatsApp randevu hatırlatmalarıyla kliniğinizi hızlandırın.',
      portalHeadline: 'Diş Hekiminizden Online Randevu Alın',
      portalSub: 'Hekimlerimizin müsait saatlerini canlı takvimden görüntüleyin ve randevunuzu beklemeden oluşturun.',
      demoRolePlaceholder: 'Örn: Dt. Burak Özkan',
      demoBusinessPlaceholder: 'Örn: DentNova Ağız ve Diş Sağlığı'
    }
  },

  dil_konusma: {
    id: 'dil_konusma',
    badge: 'Dil, Konuşma Terapisi & Ergoterapi',
    shortLabel: 'Dil & Ergoterapi',
    icon: '🗣️',
    clientSingular: 'Danışan',
    clientPlural: 'Danışanlar',
    clientManagementTitle: 'Danışan Yönetimi',
    clientSubtitle: 'Çocuk/yetişkin danışan kayıtlarını ve seans paketlerini yönetin',
    staffSingular: 'Terapist / Uzman',
    staffPlural: 'Terapistler & Uzmanlar',
    staffTitle: 'Dkt.',
    staffSubtitle: 'Dil konuşma terapistlerini, ergoterapistleri ve yetkileri yönetin',
    serviceSingular: 'Terapi Seansı',
    servicePlural: 'Terapi & Değerlendirmeler',
    serviceSubtitle: 'Dil konuşma, duyu bütünleme ve ergoterapi seanslarını düzenleyin',
    businessSingular: 'Merkez',
    businessSystemTitle: 'TERAPİ & REHABİLİTASYON SİSTEMİ',
    navSectionTitle: 'MERKEZ YÖNETİMİ',
    complaintLabel: 'Değerlendirme / Terapi Alanı',
    complaintPlaceholder: 'Gecikmiş konuşma, Artikülasyon, Kekemelik, Duyu bütünleme...',
    quickTags: [
      '🗣️ Dil & Konuşma Değerlendirmesi',
      '🔤 Artikülasyon / Harf Söyleyememe',
      '💬 Gecikmiş Konuşma Terapisi',
      '🌊 Akıcılık / Kekemelik Terapisi',
      '🧩 Ergoterapi & Duyu Bütünleme',
      '✨ Veli Görüşmesi & Takip'
    ],
    sampleServices: [
      { name: 'Dil ve Konuşma İlk Değerlendirme', price: 1500, duration_minutes: 60 },
      { name: 'Bireysel Dil ve Konuşma Terapisi', price: 1200, duration_minutes: 45 },
      { name: 'Ergoterapi & Duyu Bütünleme Seansı', price: 1300, duration_minutes: 50 }
    ],
    marketing: {
      heroBadge: 'Dil ve Konuşma Terapistleri & Ergoterapi Merkezleri İçin',
      heroTitle: 'Dil, Konuşma & Ergoterapi Merkezleri İçin Akıllı Yönetim',
      heroHighlight: 'Haftalık Seans & Paket Takibi',
      heroDesc: 'Her hafta düzenli gelen danışanlarınızın seanslarını tek tıkla kopyalayın, kalan paket haklarını otomatik takip edin ve velilere kurumsal PDF gelişim/seans dökümü paylaşın.',
      portalHeadline: 'Dil, Konuşma & Ergoterapi Randevunuzu Online Planlayın',
      portalSub: 'Uzman terapistlerimizin müsait seans saatlerini canlı görün ve randevu talebinizi hemen oluşturun.',
      demoRolePlaceholder: 'Örn: Dkt. Zeynep Yıldız',
      demoBusinessPlaceholder: 'Örn: Söz & Duyu Terapi Merkezi'
    }
  }
};

export const SECTOR_LIST = Object.values(SECTOR_PRESETS);

/**
 * URL'den (?sektor=diyetisyen vb.) veya localStorage'dan aktif pazarlama/demo sektörünü okur
 */
export function getMarketingSectorKey() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('sektor') || params.get('sector') || params.get('brans');
    if (fromUrl && SECTOR_PRESETS[fromUrl.toLowerCase()]) {
      try {
        localStorage.setItem('fizyo_marketing_sector', fromUrl.toLowerCase());
      } catch {}
      return fromUrl.toLowerCase();
    }
    try {
      const saved = localStorage.getItem('fizyo_marketing_sector');
      if (saved && SECTOR_PRESETS[saved]) return saved;
    } catch {}
  }
  return 'fizyoterapi';
}

export function setMarketingSectorKey(sectorKey) {
  const validKey = SECTOR_PRESETS[sectorKey] ? sectorKey : 'fizyoterapi';
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('fizyo_marketing_sector', validKey);
      const url = new URL(window.location.href);
      if (validKey === 'fizyoterapi') {
        url.searchParams.delete('sektor');
      } else {
        url.searchParams.set('sektor', validKey);
      }
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }
  return SECTOR_PRESETS[validKey];
}

/**
 * Bir kliniğin kayıtlı ayarlarından (working_days.sector_type ve working_days.custom_terms)
 * tüm dinamik terim ve şablon yapılandırmasını döndürür.
 */
export function getClinicSectorConfig(clinic) {
  const wd = clinic?.working_schedule || clinic?.working_days;
  let sectorKey = 'fizyoterapi';
  let customTerms = {};

  if (wd && typeof wd === 'object' && !Array.isArray(wd)) {
    if (wd.sector_type && SECTOR_PRESETS[wd.sector_type]) {
      sectorKey = wd.sector_type;
    }
    if (wd.custom_terms && typeof wd.custom_terms === 'object') {
      customTerms = wd.custom_terms;
    }
  }

  // Eğer demo kliniğiyse ve ziyaretçi landing page'de bir sektör seçtiyse onu baz al
  if (
    typeof window !== 'undefined' &&
    (!wd?.sector_type) &&
    (clinic?.slug === 'demo-klinik' || clinic?.email?.includes('demo@'))
  ) {
    try {
      const demoSector = localStorage.getItem('fizyo_marketing_sector');
      if (demoSector && SECTOR_PRESETS[demoSector]) {
        sectorKey = demoSector;
      }
    } catch {}
  }

  const preset = SECTOR_PRESETS[sectorKey] || SECTOR_PRESETS.fizyoterapi;

  const clientSingular = customTerms.clientSingular?.trim() || preset.clientSingular;
  const clientPlural = customTerms.clientPlural?.trim() || preset.clientPlural;
  const staffSingular = customTerms.staffSingular?.trim() || preset.staffSingular;
  const staffPlural = customTerms.staffPlural?.trim() || preset.staffPlural;
  const staffTitle = customTerms.staffTitle?.trim() || preset.staffTitle;
  const serviceSingular = customTerms.serviceSingular?.trim() || preset.serviceSingular;
  const servicePlural = customTerms.servicePlural?.trim() || preset.servicePlural;
  const businessSingular = customTerms.businessSingular?.trim() || preset.businessSingular;
  const complaintLabel = customTerms.complaintLabel?.trim() || preset.complaintLabel;

  return {
    ...preset,
    sectorKey,
    clientSingular,
    clientPlural,
    clientManagementTitle: `${clientSingular} Yönetimi`,
    staffSingular,
    staffPlural,
    staffTitle,
    serviceSingular,
    servicePlural,
    businessSingular,
    complaintLabel,
    customTerms
  };
}
