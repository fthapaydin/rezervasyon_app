/**
 * Fizyotim 81 İl & 973 İlçe Fizyoterapi / Fizik Tedavi E-Posta Toplama Botu
 * -------------------------------------------------------------------------
 * frontend/src/lib/turkeyCities.js içindeki 81 il ve tüm ilçeleri tek tek
 * ("<ilçe> fizyoterapi", "<ilçe> fizyoterapist", "<ilçe> fizik tedavi")
 * anahtar kelimeleriyle tarar, bulunan klinik sitelerinin ana sayfa ve
 * iletişim sayfalarına girerek SADECE geçerli e-posta adreslerini toplar.
 *
 * Özellikler:
 *   - Canlı Kayıt (Auto-Save): Bulunan her yeni e-posta anında dosyaya yazılır.
 *   - Kaldığı Yerden Devam Etme (Resume): Durdurulup tekrar çalıştırıldığında
 *     daha önce taranmış il/ilçeleri atlar, kaldığı ilçeden devam eder.
 *   - Çıktılar:
 *       1) dokuman/sadece_mailler.txt (Her satırda 1 tekil e-posta - kopyala/yapıştır için)
 *       2) dokuman/il_ilce_fizyoterapi_mailleri.csv (E-Posta ; İl ; İlçe ; Kaynak Site)
 *       3) dokuman/tarama_durumu.json (İlerleme ve önbellek dosyası)
 *
 * Kullanım:
 *   node scripts/klinik-rehber-botu.js                 -> Tüm 81 il ve ilçeleri sırayla tarar
 *   node scripts/klinik-rehber-botu.js --city=Kocaeli  -> Sadece belirtilen ili ve tüm ilçelerini tarar
 *   node scripts/klinik-rehber-botu.js --reset         -> Sıfırdan başlar (mevcut mailleri korur)
 */

import fs from 'fs';
import path from 'path';
import { TURKEY_CITIES } from '../frontend/src/lib/turkeyCities.js';

const OUT_DIR = path.resolve('dokuman');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TXT_EMAILS_PATH = path.join(OUT_DIR, 'sadece_mailler.txt');
const CSV_EMAILS_PATH = path.join(OUT_DIR, 'il_ilce_fizyoterapi_mailleri.csv');
const STATE_PATH = path.join(OUT_DIR, 'tarama_durumu.json');
const LEGACY_JSON_PATH = path.join(OUT_DIR, 'turkiye_fizyoterapi_klinikleri.json');

const IGNORED_EMAIL_DOMAINS = [
  'sentry.io', 'wixpress.com', 'example.com', 'domain.com', 'email.com', 'ornek.com',
  'eposta.com', 'adresiniz.com', 'siteniz.com', 'mailiniz.com', 'firmaadi.com',
  'wordpress.org', 'w3.org', 'schema.org', 'googleapis.com', 'google.com', 'uservoice.com',
  'facebook.com', 'instagram.com', 'cloudflare.com', 'jsdelivr.net', 'godaddy.com',
  'latofonts.com', 'mysite.com', 'yourdomain.com', 'mastodon.social', 'tavsiyemiz.com',
  'aratsana.com', 'hekimdoktor.com', 'enyakinnerde.com', 'doktortakvimi.com', 'doktorsitesi.com',
  'eniyihekim.com', 'armut.com', 'sikayetvar.com', 'bulurum.com', 'iyifirma.com', 'firmasec.com',
  'yellowpages.com.tr', 'haritamap.com', 'neredekal.com', 'kobi.com.tr', 'saglik.gov.tr',
  'hs01.kep.tr', 'hs02.kep.tr', 'hs03.kep.tr', 'kep.tr', 'doktorumveben.com', 'uzmanadresi.com',
  'uzmanburda.com', 'ilcemde.com', 'bisaglik.tr', 'doktorasistan.com', 'yorum.com',
  'hastadostu.com', 'tabela360.com', 'ustaradar.com', 'yerler.tr', 'zavis.ai',
  'meditopia.com', 'nerede360.com', 'ucuztaxi.com', 'birmilyonnokta.com', 'rehber.com',
  'whichclinic.net', 'morsayfa.com', 'tuzlali.net', 'ilceler.org', 'iletisimadresleri.com.tr',
  'tikla.com.tr', 'firmadetay.net', 'bestofankara.com', 'mestassistance.com',
  'ihaledunyasi.net', 'karmava.com', 'bakiciburada.com', 'tersanedijital.com',
  'hekimhane.com.tr', 'bioyla.com', 'gigbi.com', 'sektorreferans.com.tr', 'yakinsube.com',
  'abanozmedya.com', 'emaksbilisim.com', 'pixelspread.com', 'rfuenzalida.com', 'fizyoterapistrehberi.com',
  'edu.tr', 'gov.tr', 'bel.tr', 'turktelekombys.com.tr', 'sanliurfa.com', 'usakservis.com.tr',
  'sosyalislerplus.com', 'doktortavsiyesi.net'
];

const IGNORED_EMAIL_PREFIXES = [
  'noreply@', 'no-reply@', 'donotreply@', 'webmaster@', 'postmaster@', 'hostmaster@',
  'abuse@', 'privacy@', 'legal@', 'kvkk@', 'dpo@', 'reklam@', 'ilan@', 'haber@',
  'ornek@', 'e-posta@', 'eposta@', 'example@', 'test@', 'deneme@', 'duzelt@', 'sabagrup@',
  'enyakinnerde@', 'antalyadoktorlari.com.tr@', 'ihale@', 'impallari@', 'testyorumu@',
  'doktortavsiyesi.net@', 'mehmetbozkurtdev@', 'bilkentftrsempozyum2024@'
];

const ALLOWED_TLDS = new Set([
  'com', 'tr', 'net', 'org', 'info', 'co', 'fit', 'health', 'clinic', 'me', 'io', 'biz', 'ai', 'istanbul', 'eu', 'de', 'uk'
]);

const IGNORED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js', '.woff', '.woff2', '.ttf', '.avif', '.mp4', '.pdf'
];

const EXCLUDED_HOSTNAMES = [
  'instagram.com', 'facebook.com', 'youtube.com', 'twitter.com', 'x.com', 'linkedin.com',
  'doktortakvimi.com', 'doktorsitesi.com', 'eniyihekim.com', 'armut.com', 'sikayetvar.com',
  'kariyer.net', 'bulurum.com', 'yandex.com', 'yandex.com.tr', 'google.com', 'wikipedia.org', 'saglik.gov.tr',
  'medicana.com.tr', 'acibadem.com.tr', 'memorial.com.tr', 'medicalpark.com.tr', 'livhospital.com',
  'florence.com.tr', 'npistanbul.com', 'bing.com', 'duckduckgo.com', 'yahoo.com', 'microsoft.com',
  'apple.com', 'pinterest.com', 'tiktok.com', 'haberler.com', 'milliyet.com.tr', 'hurriyet.com.tr',
  'sabah.com.tr', 'sozcu.com.tr', 'ntv.com.tr', 'cnnturk.com', 'haberturk.com', 'tavsiyemiz.com',
  'aratsana.com', 'hekimdoktor.com', 'enyakinnerde.com', 'uservoice.com', 'iyifirma.com',
  'firmasec.com', 'haritamap.com', 'birmilyonnokta.com', 'trendyol.com', 'hepsiburada.com',
  'doktorumveben.com', 'uzmanadresi.com', 'uzmanburda.com', 'ilcemde.com', 'bisaglik.tr',
  'doktorasistan.com', 'yorum.com', 'hastadostu.com', 'tabela360.com', 'ustaradar.com',
  'yerler.tr', 'zavis.ai', 'meditopia.com', 'nerede360.com', 'ucuztaxi.com'
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function extractValidEmails(html) {
  if (!html) return [];
  const decoded = html
    .replace(/&#64;/g, '@')
    .replace(/&#46;/g, '.')
    .replace(/\\u0040/gi, '@')
    .replace(/\s*\[at\]\s*/gi, '@')
    .replace(/\s*\(at\)\s*/gi, '@');
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}/g;
  const matches = decoded.match(regex) || [];
  const cleaned = new Set();

  for (const raw of matches) {
    const email = raw.toLowerCase().trim()
      .replace(/^(mailto:|u003e|u002f|3a|20)+/i, '')
      .replace(/[.,;)>\]"'\\]+$/, '');
    if (email.length < 6 || email.length > 70) continue;
    if (IGNORED_EXTENSIONS.some(ext => email.endsWith(ext))) continue;
    if (IGNORED_EMAIL_PREFIXES.some(pre => email.startsWith(pre))) continue;
    const [local, domain] = email.split('@');
    if (!local || !domain || !domain.includes('.')) continue;
    if (local.length < 2 || domain.length < 4) continue;
    const tld = domain.split('.').pop();
    if (!ALLOWED_TLDS.has(tld)) continue;
    if (IGNORED_EMAIL_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))) continue;
    if (/^\d+x\d+/.test(email) || /^[0-9a-f]{16,}/.test(local) || /^\d+$/.test(local)) continue;
    cleaned.add(email);
  }

  return Array.from(cleaned);
}

async function fetchWithTimeout(url, timeoutMs = 5500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Durum & E-posta Veritabanı Yöneticisi
 */
function loadState(resetFlag = false) {
  const emailMap = new Map(); // email -> { email, city, district, website }
  const completedKeys = new Set();
  const visitedHosts = new Set();

  // Önceki JSON dosyasındaki mailleri koru
  if (fs.existsSync(LEGACY_JSON_PATH)) {
    try {
      const legacy = JSON.parse(fs.readFileSync(LEGACY_JSON_PATH, 'utf8')) || [];
      for (const item of legacy) {
        for (const e of (item.emails || [])) {
          for (const valid of extractValidEmails(e)) {
            if (!emailMap.has(valid)) {
              emailMap.set(valid, {
                email: valid,
                city: item.city || '',
                district: item.district || '',
                website: item.website || ''
              });
            }
          }
        }
      }
    } catch {}
  }

  if (fs.existsSync(STATE_PATH)) {
    try {
      const st = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
      for (const rec of (st.emails || [])) {
        for (const valid of extractValidEmails(rec.email)) {
          if (!emailMap.has(valid)) {
            emailMap.set(valid, {
              email: valid,
              city: rec.city || '',
              district: rec.district || '',
              website: rec.website || ''
            });
          }
        }
      }
      if (!resetFlag) {
        for (const k of (st.completedKeys || [])) completedKeys.add(k);
        for (const h of (st.visitedHosts || [])) visitedHosts.add(h);
      }
    } catch {}
  }

  return { emailMap, completedKeys, visitedHosts };
}

function saveState(state) {
  const emailList = Array.from(state.emailMap.values());

  // 1) sadece_mailler.txt -> Sadece tekil e-posta adresleri (alt alta)
  const sortedEmails = emailList.map(r => r.email).sort();
  fs.writeFileSync(TXT_EMAILS_PATH, sortedEmails.join('\r\n') + '\r\n', 'utf8');

  // 2) il_ilce_fizyoterapi_mailleri.csv -> E-Posta ; İl ; İlçe ; Web Sitesi
  const csvRows = [
    'E-Posta;İl;İlçe;Kaynak Web Sitesi',
    ...emailList.map(r => `${r.email};${r.city};${r.district};${r.website}`)
  ];
  fs.writeFileSync(CSV_EMAILS_PATH, '\uFEFF' + csvRows.join('\r\n') + '\r\n', 'utf8');

  // 3) tarama_durumu.json -> Kaldığı yerden devam etmesi için durum kaydı
  fs.writeFileSync(STATE_PATH, JSON.stringify({
    updatedAt: new Date().toISOString(),
    totalUniqueEmails: emailList.length,
    completedCount: state.completedKeys.size,
    completedKeys: Array.from(state.completedKeys),
    visitedHosts: Array.from(state.visitedHosts),
    emails: emailList
  }, null, 2), 'utf8');
}

/**
 * Bir web sitesinin ana sayfası ve iletişim sayfalarından e-posta adreslerini çek
 */
async function scrapeWebsiteForEmails(originUrl) {
  const found = new Set();
  const paths = ['', '/iletisim', '/iletisim/', '/bize-ulasin', '/contact'];

  for (const p of paths) {
    try {
      const target = p ? new URL(p, originUrl).href : originUrl;
      const res = await fetchWithTimeout(target, 5000);
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('text/html')) continue;
      const html = await res.text();
      for (const e of extractValidEmails(html)) found.add(e);
      if (found.size > 0) break;
    } catch {}
  }
  return Array.from(found);
}

/**
 * Bir lokasyon (Örn: "Kocaeli Darıca") için 3 anahtar kelimeyle arama yap ve e-postaları topla
 */
async function scanDistrict(city, district, state) {
  const locName = district === 'Merkez' ? city : `${city} ${district}`;
  const keywords = [
    `${locName} fizyoterapi`,
    `${locName} fizyoterapist`,
    `${locName} fizik tedavi`
  ];

  const candidateOrigins = new Set();

  for (const kw of keywords) {
    try {
      const yahooUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(kw + ' iletişim')}&n=15`;
      const res = await fetchWithTimeout(yahooUrl, 6500);
      if (!res.ok) continue;
      const html = await res.text();

      // 1) Arama sonuç özetlerinde (snippet) doğrudan geçen e-posta varsa hemen al
      for (const e of extractValidEmails(html)) {
        if (!state.emailMap.has(e)) {
          state.emailMap.set(e, { email: e, city, district, website: 'Arama Özeti' });
          console.log(`   🎯 [Yeni Mail] ${e} (${city} / ${district})`);
        }
      }

      // 2) Arama sonuçlarındaki klinik web sitelerini çıkar
      for (const m of html.matchAll(/RU=([^/]+)\/RK=/g)) {
        try {
          const decodedUrl = decodeURIComponent(m[1]);
          const u = new URL(decodedUrl);
          if (!['http:', 'https:'].includes(u.protocol)) continue;
          const host = u.hostname.replace(/^www\./i, '').toLowerCase();
          if (state.visitedHosts.has(host)) continue;
          if (EXCLUDED_HOSTNAMES.some(ex => host === ex || host.endsWith('.' + ex))) continue;
          if (host.endsWith('.gov.tr') || host.endsWith('.edu.tr') || host.endsWith('.bel.tr') || host.endsWith('.org.tr')) continue;

          state.visitedHosts.add(host);
          candidateOrigins.add(u.origin);
        } catch {}
      }
    } catch {}
    await sleep(120);
  }

  // Keşfedilen yeni web sitelerini paralel (8'li grup halinde) tara
  const origins = Array.from(candidateOrigins);
  let idx = 0;
  async function worker() {
    while (idx < origins.length) {
      const origin = origins[idx++];
      const emails = await scrapeWebsiteForEmails(origin);
      for (const e of emails) {
        if (!state.emailMap.has(e)) {
          state.emailMap.set(e, { email: e, city, district, website: origin });
          console.log(`   📧 [Yeni Mail] ${e} (${city} / ${district} -> ${origin})`);
        }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, origins.length) }, () => worker()));
}

async function main() {
  const args = process.argv.slice(2);
  const cityFilter = args.find(a => a.startsWith('--city='))?.split('=')[1]?.trim() || '';
  const maxDistricts = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0', 10);
  const resetFlag = args.includes('--reset');

  const state = loadState(resetFlag);
  saveState(state);

  // Öncelikli iller (Kocaeli/Darıca ve büyükşehirler ilk sırada taranır, ardından tüm 81 il ve ilçeleri)
  const priorityCityNames = [
    'Kocaeli', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya',
    'Gaziantep', 'Mersin', 'Kayseri', 'Eskişehir', 'Samsun', 'Denizli', 'Sakarya',
    'Tekirdağ', 'Muğla', 'Aydın', 'Balıkesir', 'Manisa', 'Hatay', 'Trabzon', 'Diyarbakır'
  ];

  const orderedCities = [...TURKEY_CITIES].sort((a, b) => {
    const ia = priorityCityNames.indexOf(a.name);
    const ib = priorityCityNames.indexOf(b.name);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.name.localeCompare(b.name, 'tr');
  });

  // 81 ilin merkez ve yoğun klinik bulunan ilçelerini 1. dalgada, kalan tüm ilçeleri 2. dalgada kuyruğa ekle (Toplam 973 ilçe)
  const popularDistricts = new Set([
    'Merkez',
    'Darıca', 'Gebze', 'İzmit', 'Çayırova', 'Başiskele', 'Körfez', 'Gölcük', 'Kartepe', 'Derince',
    'Kadıköy', 'Şişli', 'Beşiktaş', 'Ataşehir', 'Bakırköy', 'Üsküdar', 'Maltepe', 'Pendik', 'Kartal', 'Beylikdüzü', 'Bahçelievler', 'Ümraniye', 'Sarıyer', 'Fatih', 'Küçükçekmece', 'Başakşehir', 'Esenyurt', 'Zeytinburnu', 'Tuzla',
    'Çankaya', 'Yenimahalle', 'Keçiören', 'Etimesgut', 'Gölbaşı', 'Mamak', 'Sincan', 'Altındağ',
    'Konak', 'Karşıyaka', 'Bornova', 'Bayraklı', 'Buca', 'Balçova', 'Çiğli', 'Karabağlar', 'Gaziemir', 'Narlıdere', 'Torbalı', 'Menemen',
    'Nilüfer', 'Osmangazi', 'Yıldırım', 'İnegöl', 'Mudanya', 'Gemlik',
    'Muratpaşa', 'Konyaaltı', 'Kepez', 'Alanya', 'Manavgat', 'Serik',
    'Seyhan', 'Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan',
    'Selçuklu', 'Meram', 'Karatay', 'Ereğli',
    'Şehitkamil', 'Şahinbey',
    'Yenişehir', 'Mezitli', 'Toroslar', 'Akdeniz', 'Tarsus', 'Erdemli',
    'Melikgazi', 'Kocasinan', 'Talas',
    'Odunpazarı', 'Tepebaşı',
    'Atakum', 'İlkadım', 'Canik', 'Bafra',
    'Pamukkale', 'Merkezefendi',
    'Adapazarı', 'Serdivan', 'Erenler',
    'Çorlu', 'Süleymanpaşa', 'Çerkezköy', 'Kapaklı',
    'Bodrum', 'Fethiye', 'Marmaris', 'Menteşe', 'Milas',
    'Efeler', 'Kuşadası', 'Söke', 'Nazilli',
    'Altıeylül', 'Karesi', 'Bandırma', 'Edremit', 'Ayvalık',
    'Yunusemre', 'Şehzadeler', 'Akhisar', 'Turgutlu', 'Salihli',
    'Antakya', 'İskenderun', 'Defne', 'Dörtyol',
    'Ortahisar', 'Akçaabat',
    'Kayapınar', 'Bağlar', 'Yenişehir',
    'Haliliye', 'Karaköprü', 'Eyyübiye',
    'Battalgazi', 'Yeşilyurt',
    'Onikişubat', 'Dulkadiroğlu',
    'Yakutiye', 'Palandöken',
    'İpekyolu', 'Tuşba', 'Edremit'
  ]);

  const firstWave = [];
  const secondWave = [];

  for (const c of orderedCities) {
    if (cityFilter && c.name.toLowerCase() !== cityFilter.toLowerCase()) continue;
    for (const d of c.districts) {
      const key = `${c.name}|${d}`;
      if (state.completedKeys.has(key)) continue;
      if (popularDistricts.has(d)) {
        firstWave.push({ city: c.name, district: d, key });
      } else {
        secondWave.push({ city: c.name, district: d, key });
      }
    }
  }

  const queue = [...firstWave, ...secondWave];

  console.log('===================================================================');
  console.log(`🚀 81 İL & TÜM İLÇELER FİZYOTERAPİ E-POSTA TARAMASI BAŞLADI`);
  console.log(`   • Mevcut Kayıtlı Tekil E-Posta : ${state.emailMap.size}`);
  console.log(`   • Daha Önce Tamamlanan İlçe    : ${state.completedKeys.size}`);
  console.log(`   • Kuyruktaki Kalan İlçe Sayısı : ${queue.length}`);
  console.log(`   • Sadece Mailler Dosyası       : ${TXT_EMAILS_PATH}`);
  console.log('===================================================================\n');

  let processedNow = 0;
  for (const item of queue) {
    processedNow++;
    console.log(`🔎 [${state.completedKeys.size + 1}/973] Taranıyor: ${item.city} / ${item.district} (Toplam Mail: ${state.emailMap.size})...`);
    await scanDistrict(item.city, item.district, state);
    state.completedKeys.add(item.key);
    saveState(state);

    if (maxDistricts > 0 && processedNow >= maxDistricts) {
      console.log(`\n⏸️ Belirtilen ilçe sınırı (${maxDistricts}) tamamlandı. Tekrar çalıştırdığınızda kaldığı ilçeden devam edecektir.`);
      break;
    }
  }

  console.log('\n===================================================================');
  console.log(`✅ İŞLEM ÖZETİ:`);
  console.log(`   • Toplam Tekil E-Posta Sayısı : ${state.emailMap.size}`);
  console.log(`   • Taranmış Toplam İlçe Sayısı : ${state.completedKeys.size} / 973`);
  console.log(`   • Sadece Mailler (TXT)        : ${TXT_EMAILS_PATH}`);
  console.log(`   • İl/İlçe Tablosu (CSV)       : ${CSV_EMAILS_PATH}`);
  console.log('===================================================================\n');
}

main().catch(err => {
  console.error('Beklenmeyen hata:', err);
  process.exit(1);
});
