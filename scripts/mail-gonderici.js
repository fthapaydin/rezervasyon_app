/**
 * Fizyotim Toplu Tanıtım E-Postası & PDF Doküman Gönderim Programı
 * ----------------------------------------------------------------
 * dokuman/sadece_mailler.txt ve dokuman/il_ilce_fizyoterapi_mailleri.csv
 * içindeki fizyoterapist e-posta adreslerine, kendi e-posta hesabınızla
 * (Gmail, Yandex, Outlook, iCloud veya Kurumsal SMTP) giriş yaparak
 * dokuman/Fizyotim_Tanitim_Dokumani.pdf ekiyle birlikte kurumsal tanıtım
 * e-postası gönderir.
 *
 * Özellikler:
 *   1) İnteraktif Hesap Girişi:
 *      - İlk çalıştırmada terminal üzerinden e-posta adresinizi ve şifrenizi
 *        (veya Google/Yandex Uygulama Şifrenizi) sorar, SMTP bağlantısını doğrular
 *        ve isterse .env dosyasına kaydeder.
 *   2) Tekrar Gönderim Koruması (Resume / Auto-Save):
 *      - Gönderilen her e-posta anında dokuman/mail_gonderim_durumu.json dosyasına
 *        kaydedilir. Program durdurulup tekrar çalıştırıldığında veya yeni mailler
 *        eklendiğinde daha önce mail atılmış adreslere tekrar mail göndermez.
 *   3) Anti-Spam Hız Koruması:
 *      - E-posta sağlayıcınızın (Gmail/Yandex vb.) spam engeline takılmamak için
 *        her gönderim arasında rastgele güvenli bekleme süresi (varsayılan 10-16 sn) uygular.
 *   4) PDF Tanıtım Dokümanı Eki:
 *      - dokuman/Fizyotim_Tanitim_Dokumani.pdf dosyasını otomatik olarak maile ekler.
 *
 * Kullanım Komutları:
 *   npm run mail:send                                        -> Tüm gönderilmemiş adreslere sırayla gönderir
 *   node scripts/mail-gonderici.js --test=mailim@gmail.com   -> Önce kendi adresinize 1 adet PDF'li test maili atar
 *   node scripts/mail-gonderici.js --city=Kocaeli            -> Sadece belirtilen ildeki fizyoterapistlere mail atar
 *   node scripts/mail-gonderici.js --limit=40                -> Tek seferde en fazla 40 mail gönderip durur (günlük kota için)
 *   node scripts/mail-gonderici.js --delay=15                -> Mailler arası ortalama bekleme süresini (saniye) ayarlar
 *   node scripts/mail-gonderici.js --login                   -> Kayıtlı mail hesabını değiştirip yeni hesapla giriş yapar
 *   node scripts/mail-gonderici.js --dry-run                 -> Mail atmadan gönderilecek listeyi ve özeti gösterir
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env') });

const OUT_DIR = path.resolve('dokuman');
const TXT_EMAILS_PATH = path.join(OUT_DIR, 'sadece_mailler.txt');
const CSV_EMAILS_PATH = path.join(OUT_DIR, 'il_ilce_fizyoterapi_mailleri.csv');
const PDF_ATTACHMENT_PATH = path.join(OUT_DIR, 'Fizyotim_Tanitim_Dokumani.pdf');
const SEND_STATE_PATH = path.join(OUT_DIR, 'mail_gonderim_durumu.json');
const ENV_PATH = path.resolve('.env');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function createPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const ask = (question) => new Promise(resolve => rl.question(question, ans => resolve(ans.trim())));
  return { rl, ask };
}

/**
 * E-posta adresinin uzantısına göre otomatik SMTP ayarlarını algılar
 */
function detectSmtpConfig(email) {
  const domain = (email.split('@')[1] || '').toLowerCase();

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return {
      providerName: 'Gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      needsAppPasswordHint: true
    };
  }
  if (domain.startsWith('yandex.')) {
    return {
      providerName: 'Yandex Mail',
      host: 'smtp.yandex.com',
      port: 465,
      secure: true,
      needsAppPasswordHint: true
    };
  }
  if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'windowslive.com'].includes(domain)) {
    return {
      providerName: 'Outlook / Hotmail',
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      needsAppPasswordHint: false
    };
  }
  if (['icloud.com', 'me.com', 'mac.com'].includes(domain)) {
    return {
      providerName: 'Apple iCloud Mail',
      host: 'smtp.mail.me.com',
      port: 587,
      secure: false,
      needsAppPasswordHint: true
    };
  }

  return {
    providerName: 'Kurumsal / Özel SMTP',
    host: process.env.MAIL_HOST || '',
    port: parseInt(process.env.MAIL_PORT || '465', 10),
    secure: (process.env.MAIL_SECURE || 'true') !== 'false',
    needsAppPasswordHint: false
  };
}

/**
 * Kullanıcıdan e-posta hesabı bilgilerini alır veya .env dosyasından okur
 */
async function resolveMailCredentials(forceLogin = false) {
  let user = forceLogin ? '' : (process.env.MAIL_USER || '').trim();
  let pass = forceLogin ? '' : (process.env.MAIL_PASS || '').trim();
  let senderName = (process.env.MAIL_SENDER_NAME || 'Fizyotim | Klinik Yönetim Sistemi').trim();
  let customHost = forceLogin ? '' : (process.env.MAIL_HOST || '').trim();
  let customPort = forceLogin ? '' : (process.env.MAIL_PORT || '').trim();

  if (user && pass) {
    const detected = detectSmtpConfig(user);
    return {
      user,
      pass,
      senderName,
      host: customHost || detected.host,
      port: customPort ? parseInt(customPort, 10) : detected.port,
      secure: (customPort ? parseInt(customPort, 10) : detected.port) === 465,
      providerName: detected.providerName
    };
  }

  const { rl, ask } = createPrompt();
  try {
    console.log('\n=========================================================================');
    console.log('🔐 GÖNDERİCİ E-POSTA HESABI GİRİŞİ');
    console.log('=========================================================================');

    while (!user || !user.includes('@')) {
      user = await ask('1) Gönderici E-Posta Adresiniz (örn: fatalsoft.inc@gmail.com): ');
    }

    const detected = detectSmtpConfig(user);
    console.log(`   ℹ️ Algılanan Sağlayıcı: ${detected.providerName}`);

    if (detected.needsAppPasswordHint) {
      console.log('   💡 NOT: Gmail veya Yandex kullanıyorsanız ve 2 Adımlı Doğrulama açıksa,');
      console.log('      normal şifreniz yerine 16 haneli "Uygulama Şifresi (App Password)" giriniz.');
      console.log('      • Gmail Uygulama Şifresi: https://myaccount.google.com/apppasswords');
      console.log('      • Yandex Uygulama Şifresi: https://id.yandex.com/security/app-passwords');
    }

    while (!pass) {
      pass = await ask('2) E-Posta Şifreniz / Uygulama Şifreniz: ');
      // Gmail uygulama şifrelerindeki boşlukları temizle (örn: "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
      if (detected.providerName === 'Gmail' && /^[a-z]{4}\s+[a-z]{4}\s+[a-z]{4}\s+[a-z]{4}$/i.test(pass)) {
        pass = pass.replace(/\s+/g, '');
      }
    }

    let host = detected.host;
    let port = detected.port;

    if (!host) {
      host = await ask(`3) SMTP Sunucu Adresi (örn: mail.${user.split('@')[1]}): `);
      const portAns = await ask('4) SMTP Portu (Varsayılan 465 - SSL için 465, TLS için 587): ');
      port = parseInt(portAns || '465', 10);
    }

    const nameAns = await ask(`Gönderici Görünür Adı [Varsayılan: ${senderName}]: `);
    if (nameAns) senderName = nameAns;

    const saveAns = await ask('Bu giriş bilgileri bir sonraki çalıştırma için .env dosyasına kaydedilsin mi? (E/h): ');
    if (!saveAns || saveAns.toLowerCase().startsWith('e') || saveAns.toLowerCase().startsWith('y')) {
      const envLines = [
        `MAIL_USER=${user}`,
        `MAIL_PASS=${pass}`,
        `MAIL_SENDER_NAME="${senderName}"`,
        `MAIL_HOST=${host}`,
        `MAIL_PORT=${port}`,
        `MAIL_SECURE=${port === 465}`
      ];
      fs.writeFileSync(ENV_PATH, envLines.join('\n') + '\n', 'utf8');
      console.log('   ✅ Giriş bilgileri .env dosyasına kaydedildi.');
    }

    return {
      user,
      pass,
      senderName,
      host,
      port,
      secure: port === 465,
      providerName: detected.providerName
    };
  } finally {
    rl.close();
  }
}

/**
 * Gönderilecek hedef fizyoterapist e-posta listesini (il ve ilçe bilgileriyle birlikte) yükler
 */
function loadRecipientList(cityFilter = '') {
  const recipientsMap = new Map(); // email -> { email, city, district, website }

  // 1) CSV dosyasından il/ilçe detaylarıyla oku
  if (fs.existsSync(CSV_EMAILS_PATH)) {
    const lines = fs.readFileSync(CSV_EMAILS_PATH, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const [emailRaw, cityRaw, districtRaw, websiteRaw] = line.split(';');
      const email = (emailRaw || '').trim().toLowerCase();
      if (!email || !email.includes('@')) continue;
      recipientsMap.set(email, {
        email,
        city: (cityRaw || '').trim(),
        district: (districtRaw || '').trim(),
        website: (websiteRaw || '').trim()
      });
    }
  }

  // 2) sadece_mailler.txt içinde olup CSV'de olmayan adres varsa onları da ekle
  if (fs.existsSync(TXT_EMAILS_PATH)) {
    const lines = fs.readFileSync(TXT_EMAILS_PATH, 'utf8').split(/\r?\n/);
    for (const raw of lines) {
      const email = raw.trim().toLowerCase();
      if (!email || !email.includes('@')) continue;
      if (!recipientsMap.has(email)) {
        recipientsMap.set(email, { email, city: '', district: '', website: '' });
      }
    }
  }

  let list = Array.from(recipientsMap.values());
  if (cityFilter) {
    list = list.filter(r => r.city.toLowerCase() === cityFilter.toLowerCase());
  }

  return list;
}

/**
 * Gönderim geçmişini (daha önce gönderilen mailleri) yükler ve kaydeder
 */
function loadSendState() {
  const sentMap = new Map(); // email -> { email, city, sentAt, messageId }
  const failedMap = new Map(); // email -> { email, error, failedAt }

  if (fs.existsSync(SEND_STATE_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(SEND_STATE_PATH, 'utf8'));
      for (const s of (data.sentEmails || [])) {
        if (s.email) sentMap.set(s.email.toLowerCase(), s);
      }
      for (const f of (data.failedEmails || [])) {
        if (f.email) failedMap.set(f.email.toLowerCase(), f);
      }
    } catch {}
  }

  return { sentMap, failedMap };
}

function saveSendState(sendState) {
  const sentEmails = Array.from(sendState.sentMap.values());
  const failedEmails = Array.from(sendState.failedMap.values());

  fs.writeFileSync(SEND_STATE_PATH, JSON.stringify({
    updatedAt: new Date().toISOString(),
    totalSentCount: sentEmails.length,
    totalFailedCount: failedEmails.length,
    sentEmails,
    failedEmails
  }, null, 2), 'utf8');
}

/**
 * Kurumsal Tanıtım E-Postası Şablonu (HTML + Düz Metin)
 * Ek: dokuman/Fizyotim_Tanitim_Dokumani.pdf
 */
function buildEmailContent(recipient, senderEmail) {
  const cityLabel = recipient.city ? `${recipient.city} bölgesindeki kliniğiniz` : 'kliniğiniz';
  const subject = 'Fizyoterapi Klinikleri İçin Bulut Randevu, Seans & Paket Yönetim Sistemi | Fizyotim';

  const text = [
    'Sayın Fizyoterapistimiz / Değerli Klinik Yöneticisi,',
    '',
    `Fizyoterapi ve rehabilitasyon merkezlerinin yoğun seans, paket ve randevu temposu için özel olarak geliştirilen bulut tabanlı "Fizyotim – Randevu & Klinik Yönetim Sistemi"ni ${cityLabel} ile paylaşmak isteriz.`,
    '',
    'Defter, Excel ve dağınık WhatsApp mesajlaşmalarında yaşanan randevu çakışmalarına, "Kaç seansı kaldı, ne kadar ödedi?" karmaşasına son vermek için tüm süreçleri tek ekranda topladık:',
    '',
    '• Dinamik Sürükle-Bırak Takvim & Otomatik Öğle Molası Koruması',
    '• Tekrarlayan Seans Paketi (8-10 seanslık paketlerin tek tıkla planlanması ve otomatik seans düşümü)',
    '• 7/24 Çalışan Paralel Online Randevu & Danışan Keşif Portalı (Danışma masası QR standı dahil)',
    '• Kasa, Tahsilat, Bakiye & FIFO Borçlu Takibi',
    '• Tek Tıkla Kurumsal Antetli PDF Hasta Özeti Raporu & Tahsilat Makbuzu',
    '• Rol Bazlı Ekip Yetkilendirme (RBAC – Personelin kasa ve ciro verilerini görmesini engelleme)',
    '',
    'Sistemi tüm ekran görüntüleri ve modül detaylarıyla inceleyebilmeniz için hazırladığımız "Fizyotim Ürün & Sistem Tanıtım Dokümanı (PDF)" bu e-postanın ekinde yer almaktadır.',
    '',
    '🎁 14 Gün Ücretsiz Deneme:',
    'Hiçbir kurulum ücreti, seans komisyonu veya kredi kartı bilgisi gerekmeden kliniğinizin hesabını ve online randevu sayfasını 5 dakika içinde açıp 14 gün boyunca ücretsiz test edebilirsiniz.',
    '',
    'Ücretsiz demo hesabınızın tanımlanması veya sorularınız için bu e-postayı yanıtlamanız yeterlidir.',
    '',
    'İyi çalışmalar ve bol şifalı günler dileriz.',
    '',
    '---',
    'Fizyotim – Randevu & Klinik Yönetim Sistemi',
    `E-Posta: ${senderEmail}`,
    'FatalSoft Bilişim Teknolojileri'
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color:#0f172a; line-height:1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9; padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px; width:100%; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 20px rgba(15,23,42,0.08); border:1px solid #e2e8f0;">
          
          <!-- ÜST BAŞLIK (KAPAK BANNER) -->
          <tr>
            <td style="background:linear-gradient(145deg, #052e22 0%, #064e3b 55%, #059669 100%); background-color:#064e3b; padding:32px 32px 28px; color:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="display:inline-block; background-color:#ffffff; color:#064e3b; font-weight:800; font-size:15px; padding:6px 10px; border-radius:8px; margin-right:8px;">FT</span>
                    <span style="font-size:20px; font-weight:800; color:#ffffff; letter-spacing:-0.3px;">Fizyotim</span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block; border:1px solid rgba(255,255,255,0.35); border-radius:99px; padding:4px 12px; font-size:12px; color:#d1fae5;">%100 Bulut Klinik Yazılımı</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:20px 0 10px; font-size:24px; line-height:1.25; font-weight:800; color:#ffffff;">
                Randevu, seans/paket takibi ve tahsilat — tek ekranda.
              </h1>
              <p style="margin:0; font-size:14.5px; color:#d1fae5; line-height:1.55;">
                Defter, Excel ve dağınık mesajlaşma karmaşasına son. Dinamik takvim, otomatik seans düşümü, kasa &amp; resmî makbuz ve 7/24 online randevu portalı tek ekosistemde.
              </p>
            </td>
          </tr>

          <!-- ANA İÇERİK -->
          <tr>
            <td style="padding:30px 32px;">
              <p style="margin:0 0 16px; font-size:15px; color:#1e293b;">
                <strong>Sayın Fizyoterapistimiz / Değerli Klinik Yöneticisi,</strong>
              </p>
              <p style="margin:0 0 18px; font-size:14.5px; color:#334155;">
                Fizyoterapi, manuel terapi ve klinik pilates merkezlerinin yoğun seans temposu için özel olarak geliştirdiğimiz <strong>Fizyotim – Randevu &amp; Klinik Yönetim Sistemi</strong>'ni ${cityLabel} ile paylaşmak isteriz.
              </p>

              <!-- ÖNE ÇIKAN ÖZELLİKLER KUTUSU -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px 22px; margin:20px 0;">
                <tr>
                  <td>
                    <div style="font-size:13px; font-weight:800; color:#059669; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;">
                      Fizyotim Kliniğinize Neler Kazandırır?
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px; color:#1e293b;">
                      <tr>
                        <td style="padding:5px 0;">✅ <strong>Dinamik Haftalık Takvim:</strong> Sürükle-bırak planlama, uzman filtreleme ve otomatik öğle molası koruması</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;">✅ <strong>Tekrarlayan Seans Paketi:</strong> 8-10 seanslık tedavi paketlerini tek tıkla takvime yayma ve otomatik seans düşümü</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;">✅ <strong>7/24 Online Randevu Portalı &amp; QR Stand:</strong> Mesai dışında bile danışanlarınızın boş saatlerinize randevu talebi göndermesi</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;">✅ <strong>Kasa, Bakiye &amp; Borçlu Takibi:</strong> Kimin kaç seansı kaldı, ne kadar ödedi, ne kadar bakiyesi var anında görüntüleme</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;">✅ <strong>Tek Tıkla Antetli PDF Rapor:</strong> Danışanlarınıza kliniğinizin adıyla resmî <em>Hasta Özeti PDF</em> ve <em>Tahsilat Makbuzu</em> üretme</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;">✅ <strong>Rol Bazlı Ekip Yetkisi (RBAC):</strong> Personelinizin veya fizyoterapistlerinizin sadece takvimi görüp kasa/ciro rakamlarını görmemesi</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- EKTEKİ PDF DOKÜMAN BİLGİSİ -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px 20px; margin:18px 0;">
                <tr>
                  <td style="font-size:14px; color:#334155;">
                    📎 <strong>Ekli Tanıtım Dokümanı:</strong> Sistemin tüm ekran görüntülerini, çalışma mimarisini ve şeffaf paket detaylarını (<em>Aylık ₺250 veya Yıllık Avantaj Paketi ₺2.000</em>) bu e-postanın ekinde yer alan <strong>Fizyotim_Tanitim_Dokumani.pdf</strong> dosyasında detaylıca inceleyebilirsiniz.
                  </td>
                </tr>
              </table>

              <!-- 14 GÜN ÜCRETSİZ DENEME ÇAĞRISI -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a; border-radius:12px; padding:22px 24px; margin:22px 0; color:#ffffff;">
                <tr>
                  <td>
                    <span style="display:inline-block; background-color:#10b981; color:#ffffff; font-size:11px; font-weight:700; padding:3px 10px; border-radius:99px; margin-bottom:8px;">14 GÜN ÜCRETSİZ DENEME · KREDİ KARTI GEREKMEZ</span>
                    <div style="font-size:17px; font-weight:800; color:#ffffff; margin-bottom:6px;">
                      Kliniğinizin Hesabını 5 Dakikada Ücretsiz Açalım
                    </div>
                    <p style="margin:0; font-size:13.5px; color:#cbd5e1; line-height:1.55;">
                      Kurulum ücreti veya seans başına komisyon yoktur. 14 günlük ücretsiz demo hesabınızın ve kliniğinize özel online randevu sayfanızın hemen tanımlanması için <strong>bu e-postayı klinik adınızla yanıtlamanız</strong> yeterlidir.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:18px 0 0; font-size:14px; color:#475569;">
                İyi çalışmalar ve bol şifalı günler dileriz.<br>
                <strong style="color:#0f172a;">Fizyotim Ekibi · FatalSoft Bilişim Teknolojileri</strong>
              </p>
            </td>
          </tr>

          <!-- ALT BİLGİ (FOOTER) -->
          <tr>
            <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:16px 32px; font-size:12px; color:#64748b; text-align:center;">
              Fizyotim – Randevu &amp; Klinik Yönetim Sistemi · İletişim: <a href="mailto:${senderEmail}" style="color:#059669; text-decoration:none; font-weight:600;">${senderEmail}</a><br>
              <span style="font-size:11px; color:#94a3b8;">Bu e-posta, fizyoterapi ve rehabilitasyon merkezlerine yönelik kurumsal yazılım bilgilendirmesi amacıyla gönderilmiştir.</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

async function main() {
  const args = process.argv.slice(2);
  const testEmail = args.find(a => a.startsWith('--test=') || a.startsWith('--to='))?.split('=')[1]?.trim() || '';
  const cityFilter = args.find(a => a.startsWith('--city='))?.split('=')[1]?.trim() || '';
  const maxSend = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0', 10);
  const avgDelaySec = parseInt(args.find(a => a.startsWith('--delay='))?.split('=')[1] || '12', 10);
  const forceLogin = args.includes('--login');
  const dryRun = args.includes('--dry-run');

  // 1) PDF tanıtım dokümanının varlığını kontrol et
  if (!fs.existsSync(PDF_ATTACHMENT_PATH)) {
    console.error(`❌ HATA: Tanıtım dokümanı bulunamadı: ${PDF_ATTACHMENT_PATH}`);
    process.exit(1);
  }
  const pdfSizeMb = (fs.statSync(PDF_ATTACHMENT_PATH).size / (1024 * 1024)).toFixed(2);

  // 2) Gönderim durumunu ve alıcı listesini yükle
  const sendState = loadSendState();
  const allRecipients = testEmail
    ? [{ email: testEmail.toLowerCase(), city: cityFilter || 'Test', district: 'Test', website: 'Test Gönderimi' }]
    : loadRecipientList(cityFilter);

  const pendingRecipients = testEmail
    ? allRecipients
    : allRecipients.filter(r => !sendState.sentMap.has(r.email));

  console.log('=========================================================================');
  console.log('📨 FİZYOTİM TOPLU TANITIM MAİLİ & PDF GÖNDERİM PROGRAMI');
  console.log(`   • Ekli Tanıtım Dokümanı         : Fizyotim_Tanitim_Dokumani.pdf (${pdfSizeMb} MB)`);
  console.log(`   • Toplam Kayıtlı Fizyoterapist  : ${allRecipients.length}`);
  console.log(`   • Daha Önce Gönderilen Mail     : ${sendState.sentMap.size}`);
  console.log(`   • Gönderilmeyi Bekleyen Kuyruk  : ${pendingRecipients.length}${cityFilter ? ` (İl Filtresi: ${cityFilter})` : ''}`);
  console.log('=========================================================================');

  if (pendingRecipients.length === 0) {
    console.log('\n✅ Kuyruktaki tüm e-posta adreslerine daha önce gönderim yapılmış!');
    console.log(`   Yeni e-posta toplamak için: npm run scrape:emails`);
    return;
  }

  if (dryRun) {
    console.log('\n🔍 [DRY-RUN / SİMÜLASYON MODU] İlk 20 alıcı önizlemesi:');
    for (const r of pendingRecipients.slice(0, 20)) {
      console.log(`   -> ${r.email} (${r.city || 'İl Belirtilmemiş'} / ${r.district || 'İl Geneli'})`);
    }
    console.log(`\nToplam ${pendingRecipients.length} adrese gönderim hazır. Gerçek gönderim için --dry-run olmadan çalıştırın.`);
    return;
  }

  // 3) Kullanıcı e-posta giriş bilgilerini al ve SMTP bağlantısını doğrula
  const creds = await resolveMailCredentials(forceLogin);

  console.log(`\n🔌 SMTP Bağlantısı doğrulanıyor (${creds.providerName} -> ${creds.host}:${creds.port} | Hesap: ${creds.user})...`);

  const transporter = nodemailer.createTransport({
    host: creds.host,
    port: creds.port,
    secure: creds.secure,
    auth: {
      user: creds.user,
      pass: creds.pass
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 50
  });

  try {
    await transporter.verify();
    console.log('✅ E-posta hesabınıza başarıyla giriş yapıldı! Gönderim başlıyor...\n');
  } catch (err) {
    console.error('\n❌ E-POSTA GİRİŞ HATASI:', err.message);
    console.error('   👉 Eğer Gmail veya Yandex kullanıyorsanız:');
    console.error('      1) Normal şifreniz yerine 16 haneli "Uygulama Şifresi (App Password)" kullandığınızdan emin olun.');
    console.error('      2) Gmail Uygulama Şifresi oluşturmak için: https://myaccount.google.com/apppasswords');
    console.error('      3) Tekrar yeni şifre girmek için: node scripts/mail-gonderici.js --login\n');
    process.exit(1);
  }

  // 4) Sırayla PDF ekli tanıtım maillerini gönder
  const targetCount = maxSend > 0 ? Math.min(maxSend, pendingRecipients.length) : pendingRecipients.length;
  let sentNow = 0;
  let failedNow = 0;

  for (let i = 0; i < targetCount; i++) {
    const recipient = pendingRecipients[i];
    const { subject, text, html } = buildEmailContent(recipient, creds.user);
    const locLabel = recipient.city ? `${recipient.city}${recipient.district ? ' / ' + recipient.district : ''}` : 'Türkiye';

    process.stdout.write(`📤 [${i + 1}/${targetCount}] Gönderiliyor: ${recipient.email} (${locLabel})... `);

    try {
      const info = await transporter.sendMail({
        from: `"${creds.senderName}" <${creds.user}>`,
        to: recipient.email,
        replyTo: creds.user,
        subject,
        text,
        html,
        attachments: [
          {
            filename: 'Fizyotim_Tanitim_Dokumani.pdf',
            path: PDF_ATTACHMENT_PATH,
            contentType: 'application/pdf'
          }
        ]
      });

      sentNow++;
      console.log(`✅ Gönderildi!`);

      if (!testEmail) {
        sendState.sentMap.set(recipient.email, {
          email: recipient.email,
          city: recipient.city,
          district: recipient.district,
          sentBy: creds.user,
          sentAt: new Date().toISOString(),
          messageId: info.messageId || ''
        });
        sendState.failedMap.delete(recipient.email);
        saveSendState(sendState);
      }
    } catch (err) {
      failedNow++;
      console.log(`❌ Hata: ${err.message}`);

      if (!testEmail) {
        sendState.failedMap.set(recipient.email, {
          email: recipient.email,
          city: recipient.city,
          error: err.message,
          failedAt: new Date().toISOString()
        });
        saveSendState(sendState);
      }

      // Eğer günlük gönderim limiti veya kimlik doğrulama hatası alındıysa döngüyü güvenli şekilde durdur
      if (/daily user sending quota|too many|rate limit|authentication|535|550 5\.4\.5|421/i.test(err.message)) {
        console.log('\n⚠️ E-posta sağlayıcınızın günlük/saatlik gönderim limitine ulaşıldı.');
        console.log('   Gönderilen tüm adresler kaydedildi. Daha sonra tekrar çalıştırdığınızda kaldığı yerden devam edecektir.');
        break;
      }
    }

    // Son mail değilse spam koruması için rastgele bekle
    if (i < targetCount - 1) {
      const jitter = Math.floor(Math.random() * 5) - 2; // -2 ile +2 sn arası rastgelelik
      const waitSec = Math.max(4, avgDelaySec + jitter);
      await sleep(waitSec * 1000);
    }
  }

  transporter.close();

  console.log('\n=========================================================================');
  console.log('📊 GÖNDERİM ÖZETİ:');
  console.log(`   • Bu Oturumda Gönderilen  : ${sentNow}`);
  console.log(`   • Bu Oturumda Hata Alınan : ${failedNow}`);
  console.log(`   • Toplam Gönderilmiş Mail : ${sendState.sentMap.size} / ${allRecipients.length}`);
  console.log(`   • Durum Kayıt Dosyası     : ${SEND_STATE_PATH}`);
  console.log('=========================================================================\n');
}

main().catch(err => {
  console.error('Beklenmeyen hata:', err);
  process.exit(1);
});
