import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://diznruaymwfvxmgbtyie.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpem5ydWF5bXdmdnhtZ2J0eWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MTUwMTgsImV4cCI6MjEwMjk5MTAxOH0.PiN8cL6tqrvfRFd95FQxVNoPBfzYrRDC-TEoApmBfKc';
const supabase = createClient(supabaseUrl, supabaseKey);

const announcement = {
  title: '🚀 Fizyotim v2.6 Yayında: WhatsApp Makbuz Paylaşımı, Toplu Ödeme ve Branş Yönetimi!',
  message: `Klinik yönetiminizi daha hızlı, profesyonel ve hatasız hale getirmek için yeni özellikler panelinize eklendi:

📄 Kurumsal PDF Makbuz & Raporlar:
• Makbuz ve raporlar artık kliniğinizin adı, logosu, hekim bilgisi ve iletişim detaylarıyla kurumsal şablonla oluşturulur.
• Uygulayan doktor/uzman adı, seans bilgisi ve detaylı tahsilat dökümü makbuzlara eklendi.
• Türkçe karakterlerdeki harf aralığı bozulmaları (kerning) tamamen giderildi.

📲 WhatsApp & E-Posta ile Tek Tıkla Makbuz Paylaşımı:
• Tahsilat alındığı anda hastanızın telefonuna tek tıkla resmi ve nazik WhatsApp makbuz mesajı gönderebilirsiniz.
• Dilerseniz e-posta taslağı açabilir veya resmi PDF makbuzu indirip doğrudan WhatsApp sohbetine aktarabilirsiniz.

💳 Toplu Ödeme & Akıllı Borç Dağıtımı (FIFO):
• Birden fazla seans borcu olan hastaların tüm borcunu tek tıkla kapatabilir; girilen tutar açık seanslara tarih sırasına göre otomatik paylaştırılır.
• Tahsilat hasta listesinden borcu olmayan hastalar temizlendi, yalnızca aktif borçlular listelenir.

🩺 Ekip Tedavi & Branş Atamaları:
• Hangi uzmanın hangi tedavileri uygulayabileceğini Ekip ekranından seçebilir, personel kartlarında branş rozetlerini görebilirsiniz.

📊 Personel Performans & Seans Raporlama:
• Hangi personelin hangi tedaviden kaç seans yaptığını ve ciro katkısını inceleyebilir, tek tıkla Excel/CSV olarak indirebilirsiniz.

💾 Hızlı Kaydet Çubuğu (Klinik Ayarları):
• Sayfa boyunca ekranın üstünde sizi takip eden yapışkan (sticky) kaydet butonu sayesinde sayfanın en altına inmeden tek tıkla ayarlarınızı kaydedebilirsiniz.

🧪 Canlı Sistem Teşhis Paneli:
• Yönetici üst barında yer alan [Sistem Testi] butonu ile kliniğinizin veri ve mesai altyapısını tek tıkla doğrulayabilirsiniz.`,
  type: 'info',
  is_active: true
};

async function main() {
  const { data, error } = await supabase.from('announcements').insert([announcement]).select();
  if (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
  console.log('BAŞARIYLA YAYINLANDI ID:', data[0]?.id);
}

main();
