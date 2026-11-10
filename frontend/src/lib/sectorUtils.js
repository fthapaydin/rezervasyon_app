/**
 * Çoklu Branş & Dinamik Sektör Şablon Motoru (sectorUtils.js)
 * -----------------------------------------------------------
 * Fizyoterapi, Diyetisyen, Psikolog, Pilates/Yoga Stüdyosu, Güzellik Merkezi,
 * Diş Kliniği, Dil & Konuşma Terapisi ve Özel Randevulu İşletmeler için
 * tüm uygulama içi terimleri, unvanları, hızlı etiketleri, klinik ölçüm
 * ve anamnez alanlarını, seans paketlerini ve WhatsApp bildirimlerini üretir.
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
    clinicalMetrics: [
      { id: 'vas_pain', label: 'VAS Ağrı Skoru (1-10)', type: 'range', min: 1, max: 10, default: 5, unit: '/10' },
      { id: 'pain_location', label: 'Ağrı / Patoloji Bölgesi', type: 'text', placeholder: 'Örn: L4-L5 Bel Fıtığı, Sağ Diz Menisküs' },
      { id: 'rom_notes', label: 'Eklem Açıklığı (ROM) & Klinik Testler', type: 'textarea', placeholder: 'Örn: Lasegue (+), Fleksiyon 60° kısıtlı' }
    ],
    suggestedPackages: [
      { name: '5 Seans Manuel Terapi Paketi', sessions: 5, price: 5500, discountLabel: '%10 İndirimli' },
      { name: '10 Seans Kapsamlı Rehabilitasyon Paketi', sessions: 10, price: 10000, discountLabel: '%17 İndirimli • Popüler' },
      { name: '20 Seans Uzun Dönem Omurga Protokolü', sessions: 20, price: 18500, discountLabel: '%23 Avantajlı' }
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
    clinicalMetrics: [
      { id: 'height', label: 'Boy (cm)', type: 'number', placeholder: 'Örn: 172', unit: 'cm' },
      { id: 'weight', label: 'Kilo (kg)', type: 'number', placeholder: 'Örn: 78.5', unit: 'kg' },
      { id: 'target_weight', label: 'Hedef Kilo (kg)', type: 'number', placeholder: 'Örn: 65', unit: 'kg' },
      { id: 'body_fat', label: 'Vücut Yağ Oranı (%)', type: 'number', placeholder: 'Örn: 24.5', unit: '%' },
      { id: 'diet_notes', label: 'Beslenme Alışkanlıkları & Notlar', type: 'textarea', placeholder: 'Örn: Su tüketimi 1.5L, laktoz intoleransı var' }
    ],
    suggestedPackages: [
      { name: '1 Aylık Başlangıç & Detoks Paketi (4 Seans)', sessions: 4, price: 3200, discountLabel: 'Haftalık Takip' },
      { name: '3 Aylık İdeal Kilo Programı (12 Seans)', sessions: 12, price: 8400, discountLabel: '%15 İndirimli • En Çok Satan' },
      { name: 'Online Diyet & WhatsApp Soru-Cevap Paketi', sessions: 8, price: 5800, discountLabel: 'Kesintisiz Destek' }
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
      portalHeadline: 'Uzman Diyetisyeninizi Bulun, Sağlıklı Yaşama Adım Atın',
      portalSub: 'Şehrinizdeki ve online hizmet veren diyetisyenleri inceleyin, canlı takvimden ilk seansınızı hemen ayırtın.',
      demoRolePlaceholder: 'Örn: Dyt. Ceren Kaya',
      demoBusinessPlaceholder: 'Örn: Fit Yaşam Beslenme Kliniği'
    }
  },

  psikoloji: {
    id: 'psikoloji',
    badge: 'Psikolojik Danışmanlık & Terapi',
    shortLabel: 'Psikolog',
    icon: '🧠',
    clientSingular: 'Danışan',
    clientPlural: 'Danışanlar',
    clientManagementTitle: 'Danışan Yönetimi',
    clientSubtitle: 'Danışan randevularını, seans bloklarını ve anamnez kayıtlarını yönetin',
    staffSingular: 'Psikolog / Terapist',
    staffPlural: 'Psikologlar & Terapistler',
    staffTitle: 'Psk.',
    staffSubtitle: 'Terapistleri ve oda rezervasyonlarını yönetin',
    serviceSingular: 'Seans Türü',
    servicePlural: 'Terapi Seansları',
    serviceSubtitle: 'Bireysel, çift ve çocuk terapi seans formatlarını düzenleyin',
    businessSingular: 'Merkez',
    businessSystemTitle: 'PSİKOLOJİK DANIŞMANLIK SİSTEMİ',
    navSectionTitle: 'MERKEZ YÖNETİMİ',
    complaintLabel: 'Danışmanlık Konusu / Başvuru Nedeni',
    complaintPlaceholder: 'Kaygı, Depresyon, Panik atak, Çift terapisi, Özgüven...',
    quickTags: [
      '🧠 Bireysel Terapi',
      '👥 Çift & Aile Terapisi',
      '🧸 Çocuk & Ergen Terapisi',
      '⚡ Anksiyete & Panik Atak',
      '🌧️ Depresyon & Yas Süreci',
      '💻 Online Terapi',
      '✨ Ön Görüşme'
    ],
    clinicalMetrics: [
      { id: 'mood_score', label: 'Seans Duygudurum Puanı (1-10)', type: 'range', min: 1, max: 10, default: 6, unit: '/10' },
      { id: 'session_target', label: 'Çalışılan Ana Tema', type: 'text', placeholder: 'Örn: Bilişsel Çarpıtmalar, Sınır Koyma' },
      { id: 'homework_notes', label: 'Haftalık Ev Ödevi & Egzersiz Notu', type: 'textarea', placeholder: 'Örn: Otomatik düşünce kaydı tutulacak, 4-7-8 nefes egzersizi' }
    ],
    suggestedPackages: [
      { name: '4 Seanslık Aylık Terapi Paketi', sessions: 4, price: 4800, discountLabel: 'Haftalık Düzenli' },
      { name: '8 Seans Bilişsel Davranışçı Terapi (BDT)', sessions: 8, price: 9200, discountLabel: '%12 İndirimli' },
      { name: 'Çift Terapisi Paketi (6 Seans)', sessions: 6, price: 8500, discountLabel: 'Özel Protokol' }
    ],
    sampleServices: [
      { name: 'Bireysel Psikoterapi (Yetişkin)', price: 1400, duration_minutes: 50 },
      { name: 'Çift & Aile Danışmanlığı', price: 1800, duration_minutes: 60 },
      { name: 'Online Terapi Görüşmesi', price: 1300, duration_minutes: 50 },
      { name: 'EMDR Terapi Seansı', price: 1600, duration_minutes: 60 }
    ],
    marketing: {
      heroBadge: 'Psikologlar & Terapi Merkezleri İçin',
      heroTitle: 'Psikolojik Danışmanlık Merkezinizi Kolayca Yönetin',
      heroHighlight: 'Gizlilik ve KVKK Güvencesi',
      heroDesc: 'Danışanlarınız bekleme odasında beklemeden online randevu alsın, seans blokları çakışmasın, SMS/WhatsApp ile nazik onay bildirimleri gönderilsin.',
      portalHeadline: 'Uzman Psikoloğunuzla Seansınızı Hemen Planlayın',
      portalSub: 'Alanında uzman klinik psikologları görüntüleyin, yüz yüze veya online terapi seansınızı güvenle oluşturun.',
      demoRolePlaceholder: 'Örn: Psk. Selin Eren',
      demoBusinessPlaceholder: 'Örn: Denge Psikolojik Danışmanlık'
    }
  },

  pilates: {
    id: 'pilates',
    badge: 'Reformer Pilates & Yoga Stüdyosu',
    shortLabel: 'Pilates & Yoga',
    icon: '🧘‍♀️',
    clientSingular: 'Üye',
    clientPlural: 'Üyeler',
    clientManagementTitle: 'Üye Yönetimi',
    clientSubtitle: 'Üye kayıtlarını, ders paketlerini ve katılım geçmişini yönetin',
    staffSingular: 'Eğitmen',
    staffPlural: 'Eğitmenler',
    staffTitle: 'Eğt.',
    staffSubtitle: 'Stüdyo eğitmenlerini ve ders saatlerini yönetin',
    serviceSingular: 'Ders & Paket',
    servicePlural: 'Ders Programları',
    serviceSubtitle: 'Birebir reformer, düet ders ve grup paketlerini düzenleyin',
    businessSingular: 'Stüdyo',
    businessSystemTitle: 'PİLATES & YOGA STÜDYO SİSTEMİ',
    navSectionTitle: 'STÜDYO YÖNETİMİ',
    complaintLabel: 'Hedef / Katılım Nedeni',
    complaintPlaceholder: 'Sıkılaşma, Postür düzeltme, Boyun/Bel rahatlatma, Esneklik...',
    quickTags: [
      '🧘‍♀️ Birebir Reformer (1:1)',
      '👯‍♀️ Düet Reformer (1:2)',
      '🤸 Mat Pilates & Core',
      '🧘 Vinyasa / Hatha Yoga',
      '🤰 Hamile Pilatesi',
      '📐 Postür & Omurga Düzeltme',
      '✨ Deneme Dersi'
    ],
    clinicalMetrics: [
      { id: 'flexibility_score', label: 'Esneklik Skoru (1-10)', type: 'range', min: 1, max: 10, default: 6, unit: '/10' },
      { id: 'core_strength', label: 'Core / Denge Skoru (1-10)', type: 'range', min: 1, max: 10, default: 5, unit: '/10' },
      { id: 'posture_assessment', label: 'Postür & Kısıtlılık Değerlendirmesi', type: 'textarea', placeholder: 'Örn: Kifotik duruş, hamstring kısalığı var' }
    ],
    suggestedPackages: [
      { name: '8 Derslik Aylık Birebir Reformer Paketi', sessions: 8, price: 6400, discountLabel: 'Haftada 2 Gün • Popüler' },
      { name: '12 Derslik Aylık Yoğun Paket', sessions: 12, price: 9000, discountLabel: 'Haftada 3 Gün' },
      { name: '16 Derslik 2 Aylık Avantajlı Paket', sessions: 16, price: 11500, discountLabel: '%15 İndirimli' }
    ],
    sampleServices: [
      { name: 'Birebir (1:1) Reformer Pilates', price: 900, duration_minutes: 50 },
      { name: 'Düet (1:2) Reformer Pilates', price: 1300, duration_minutes: 50 },
      { name: 'Klinik & Postür Pilates Seansı', price: 950, duration_minutes: 50 },
      { name: 'Hamile (Prenatal) Pilatesi', price: 950, duration_minutes: 50 }
    ],
    marketing: {
      heroBadge: 'Pilates, Reformer & Yoga Stüdyoları İçin',
      heroTitle: 'Stüdyonuzun Ders ve Üye Paketlerini Kolayca Yönetin',
      heroHighlight: 'Ders Kopyalama ve Devamsızlık Takibi',
      heroDesc: 'Üyeleriniz reformer saatlerini canlı görsün, tükenen paket seansları otomatik uyarsın ve eğitmenlerinizin ders programı asla çakışmasın.',
      portalHeadline: 'Reformer Pilates & Yoga Dersinizi Online Ayırtın',
      portalSub: 'En iyi stüdyoları ve eğitmenleri keşfedin, size uygun ders saatine hemen rezervasyon yapın.',
      demoRolePlaceholder: 'Örn: Eğt. Burcu Demir',
      demoBusinessPlaceholder: 'Örn: Pure Form Reformer Pilates'
    }
  },

  guzellik: {
    id: 'guzellik',
    badge: 'Güzellik, Estetik & Cilt Bakımı',
    shortLabel: 'Güzellik Merkezi',
    icon: '✨',
    clientSingular: 'Danışan',
    clientPlural: 'Danışanlar',
    clientManagementTitle: 'Danışan Yönetimi',
    clientSubtitle: 'Danışan seanslarını, bakım paketlerini ve oda kullanımını yönetin',
    staffSingular: 'Uzman / Estetisyen',
    staffPlural: 'Uzmanlar & Estetisyenler',
    staffTitle: 'Uzm.',
    staffSubtitle: 'Estetisyenleri, cihaz ve oda yetkilerini yönetin',
    serviceSingular: 'İşlem & Seans',
    servicePlural: 'İşlemler & Paketler',
    serviceSubtitle: 'Lazer, cilt bakımı ve bölgesel incelme seanslarını düzenleyin',
    businessSingular: 'Merkez',
    businessSystemTitle: 'GÜZELLİK & ESTETİK YÖNETİM SİSTEMİ',
    navSectionTitle: 'MERKEZ YÖNETİMİ',
    complaintLabel: 'İşlem Tercihi / İhtiyaç',
    complaintPlaceholder: 'Lazer epilasyon, Medikal cilt bakımı, Hydrafacial, Bölgesel incelme...',
    quickTags: [
      '✨ Medikal Cilt Bakımı',
      '⚡ Lazer Epilasyon',
      '💧 Hydrafacial Derin Temizlik',
      '🔥 Bölgesel İncelme (G5 / Lenf)',
      '👁️ Kaş Tasarım & Kirpik Lifting',
      '💆‍♀️ Masaj & Rahatlama',
      '✨ Ön Görüşme & Cilt Analizi'
    ],
    clinicalMetrics: [
      { id: 'skin_type', label: 'Cilt Tipi', type: 'text', placeholder: 'Örn: Karma, Kuru, Hassas, Akneye Meyilli' },
      { id: 'treated_area', label: 'Uygulama Bölgesi', type: 'text', placeholder: 'Örn: Tüm Yüz, Bacak, Koltuk Altı' },
      { id: 'device_settings', label: 'Cihaz & Doz Notu', type: 'text', placeholder: 'Örn: Diode 16J, 30ms pulse' }
    ],
    suggestedPackages: [
      { name: '6 Seans Tüm Vücut Lazer Paketi', sessions: 6, price: 7500, discountLabel: '%20 İndirimli' },
      { name: '4 Seans Hydrafacial & Cilt Bakımı', sessions: 4, price: 4200, discountLabel: 'Aylık Rutin' },
      { name: '8 Seans G5 Bölgesel İncelme', sessions: 8, price: 5600, discountLabel: 'Sıkılaşma Protokolü' }
    ],
    sampleServices: [
      { name: 'Medikal Cilt Bakımı (Hydrafacial)', price: 1200, duration_minutes: 60 },
      { name: 'Lazer Epilasyon Tüm Vücut Seansı', price: 1500, duration_minutes: 60 },
      { name: 'G5 Bölgesel Masaj & Sıkılaşma', price: 800, duration_minutes: 40 },
      { name: 'Dermapen & Kolajen Bakımı', price: 1400, duration_minutes: 50 }
    ],
    marketing: {
      heroBadge: 'Güzellik Salonları & Estetik Merkezleri İçin',
      heroTitle: 'Güzellik Merkezinizde Randevu Karmaşasına Son',
      heroHighlight: 'Cihaz, Oda ve Seans Yönetimi',
      heroDesc: 'Danışanlarınız müsait seansları online görsün, çoklu seans paketleri ve bakiyeler şeffafça takip edilsin, randevu hatırlatmaları otomatik iletilsin.',
      portalHeadline: 'Bakım ve Güzellik Seansınız İçin Randevu Alın',
      portalSub: 'Güzellik merkezlerini ve uzman estetisyenleri keşfedin, istediğiniz bakım için hemen yerinizi ayırtın.',
      demoRolePlaceholder: 'Örn: Uzm. Gamze Tekin',
      demoBusinessPlaceholder: 'Örn: Işıltı Estetik & Güzellik'
    }
  },

  dis: {
    id: 'dis',
    badge: 'Diş Kliniği & Ağız Sağlığı',
    shortLabel: 'Diş Kliniği',
    icon: '🦷',
    clientSingular: 'Hasta',
    clientPlural: 'Hastalar',
    clientManagementTitle: 'Hasta Yönetimi',
    clientSubtitle: 'Hasta kayıtlarını, diş tedavi planlarını ve hekim randevularını yönetin',
    staffSingular: 'Diş Hekimi',
    staffPlural: 'Diş Hekimleri',
    staffTitle: 'Dt.',
    staffSubtitle: 'Hekimleri, üniteleri ve klinik sekreterliğini yönetin',
    serviceSingular: 'Tedavi & İşlem',
    servicePlural: 'Diş Tedavileri',
    serviceSubtitle: 'Dolgu, kanal, implant ve estetik diş hekimliği işlemlerini düzenleyin',
    businessSingular: 'Klinik',
    businessSystemTitle: 'DİŞ KLİNİĞİ YÖNETİM SİSTEMİ',
    navSectionTitle: 'KLİNİK YÖNETİMİ',
    complaintLabel: 'Şikayet / Tedavi Talebi',
    complaintPlaceholder: 'Diş ağrısı, Dolgu, Diş beyazlatma, İmplant, 20lik diş...',
    quickTags: [
      '🦷 Rutin Muayene & Kontrol',
      '💎 Diş Taşı Temizliği & Polisaj',
      '✨ Diş Beyazlatma (Bleaching)',
      '🩹 Kompozit Dolgu',
      '⚡ Kanal Tedavisi (Endodonti)',
      '🔩 İmplant & Cerrahi',
      '🚨 Acil Diş Ağrısı'
    ],
    clinicalMetrics: [
      { id: 'tooth_number', label: 'Diş Numarası / Bölge', type: 'text', placeholder: 'Örn: 16 No Molar, Üst Ön Bölge' },
      { id: 'treatment_phase', label: 'Tedavi Aşaması', type: 'text', placeholder: 'Örn: Pansuman yapıldı, ölçü alındı' },
      { id: 'anesthesia_notes', label: 'Anestezi & Reçete Notu', type: 'text', placeholder: 'Örn: 1 ampul Artikain, amoksisilin reçete edildi' }
    ],
    suggestedPackages: [
      { name: 'Kapsamlı Ağız Bakımı & Temizlik Paketi', sessions: 2, price: 2000, discountLabel: 'Yıllık Rutin' },
      { name: 'Estetik Gülüş & Beyazlatma Protokolü', sessions: 3, price: 6500, discountLabel: 'Özel Estetik' }
    ],
    sampleServices: [
      { name: 'Genel Muayene & Panoramik Kontrol', price: 600, duration_minutes: 30 },
      { name: 'Detartraj (Diş Taşı Temizliği)', price: 1200, duration_minutes: 40 },
      { name: 'Lazer Destekli Ofis Tipi Beyazlatma', price: 4000, duration_minutes: 60 },
      { name: 'Kompozit Dolgu Tedavisi', price: 1500, duration_minutes: 45 }
    ],
    marketing: {
      heroBadge: 'Diş Hekimleri & Ağız Sağlığı Poliklinikleri İçin',
      heroTitle: 'Diş Kliniğinizi Dijital Çağa Taşıyın',
      heroHighlight: 'Ünite ve Hekim Bazlı Randevu',
      heroDesc: 'Hastalarınız hekiminizin müsait saatlerine anında randevu alsın, koltuk süreleri verimli yönetilsin ve SMS hatırlatmalarıyla randevu kaçırma sıfırlansın.',
      portalHeadline: 'Diş Hekiminizden Sıra Beklemeden Canlı Randevu Alın',
      portalSub: 'Şehrinizdeki diş hekimlerini listeleyin, tedavi için müsait saatleri canlı görerek randevunuzu ayırtın.',
      demoRolePlaceholder: 'Örn: Dt. Emre Koç',
      demoBusinessPlaceholder: 'Örn: İnci Ağız ve Diş Sağlığı'
    }
  },

  dil_konusma: {
    id: 'dil_konusma',
    badge: 'Dil, Konuşma & Ergoterapi',
    shortLabel: 'Dil & Konuşma',
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
    clinicalMetrics: [
      { id: 'target_phoneme', label: 'Çalışılan Ses / Fonem', type: 'text', placeholder: 'Örn: /r/, /s/, /k/ sesleri' },
      { id: 'fluency_score', label: 'Akıcılık Derecesi (1-10)', type: 'range', min: 1, max: 10, default: 5, unit: '/10' },
      { id: 'home_exercise', label: 'Ev Egzersizi & Veli Talimatı', type: 'textarea', placeholder: 'Örn: Günde 10 dk ayna karşısında dil egzersizi' }
    ],
    suggestedPackages: [
      { name: '8 Seanslık Aylık Konuşma Terapisi', sessions: 8, price: 8800, discountLabel: 'Haftada 2 Gün' },
      { name: '16 Seans Kapsamlı Gelişim Paketi', sessions: 16, price: 16000, discountLabel: '%15 İndirimli' }
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
 * Diyetisyen & Sağlık için Vücut Kitle İndeksi (VKİ) hesaplama fonksiyonu
 */
export function calculateBMI(weightKg, heightCm) {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  if (!w || !h || h <= 0) return null;

  const heightInMeters = h / 100;
  const bmi = (w / (heightInMeters * heightInMeters)).toFixed(1);
  const numBmi = parseFloat(bmi);

  let category = 'Normal Kilo';
  let color = 'text-emerald-600 bg-emerald-50 border-emerald-200';

  if (numBmi < 18.5) {
    category = 'Zayıf';
    color = 'text-blue-600 bg-blue-50 border-blue-200';
  } else if (numBmi >= 25 && numBmi < 30) {
    category = 'Fazla Kilolu';
    color = 'text-amber-600 bg-amber-50 border-amber-200';
  } else if (numBmi >= 30) {
    category = 'Obezite';
    color = 'text-rose-600 bg-rose-50 border-rose-200';
  }

  return { bmi: numBmi, category, color };
}

/**
 * Temiz, doğrudan WhatsApp Web/App bağlantısı üretir (API gerektirmez)
 */
export function buildDirectWhatsAppUrl(rawPhone, messageText) {
  if (!rawPhone) return '';
  const cleaned = rawPhone.replace(/\D/g, '');
  const finalPhone = cleaned.startsWith('90') ? cleaned : cleaned.startsWith('0') ? `9${cleaned}` : `90${cleaned}`;
  return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(messageText)}`;
}

/**
 * Sektöre uyumlu kurumsal WhatsApp randevu bildirim metni üretir
 */
export function formatAppointmentWhatsAppText({
  clinicName = 'Merkezimiz',
  clientName = 'Değerli Danışanımız',
  date = '',
  time = '',
  staffName = '',
  serviceName = '',
  sectorConfig = null
}) {
  const staffTitle = sectorConfig?.staffSingular || 'Uzmanımız';
  const serviceTitle = sectorConfig?.serviceSingular || 'Randevu';

  let text = `Sayın ${clientName},\n\n`;
  text += `${clinicName} bünyesindeki randevunuz onaylanmıştır.\n\n`;
  if (date) text += `📅 Tarih: ${date}\n`;
  if (time) text += `⏰ Saat: ${time}\n`;
  if (serviceName) text += `🏷️ ${serviceTitle}: ${serviceName}\n`;
  if (staffName) text += `👤 ${staffTitle}: ${staffName}\n`;
  text += `\nRandevunuza vaktinde gelmenizi rica eder, sağlıklı günler dileriz.\n`;
  text += `— ${clinicName}`;

  return text;
}

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
