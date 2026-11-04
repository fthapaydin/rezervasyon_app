/**
 * Fizyotim 81 İl & 973 İlçe Fizyoterapist E-Posta Toplama Botu (Google SEO & Çoklu Motor)
 * ---------------------------------------------------------------------------------------
 * Bu araç SADECE Türkiye'deki fizyoterapist ve fizyoterapi kliniklerinin e-posta adreslerini toplar.
 * Telefon, açık adres veya e-postası olmayan klinik kayıtlarını tutmaz.
 *
 * Temel Özellikler:
 *   1) 81 İlin Tamamını Garantili Tarama (3 Aşamalı Dalga & Round-Robin Mimarisi):
 *      - 1. Dalga: 81 ilin tamamı için "İl Geneli" Google SEO taraması
 *        (Önce henüz hiç e-posta bulunmamış iller taranır, ardından diğer illerin İl Geneli taraması yapılır)
 *      - 2. Dalga: 81 ilin merkez ve yoğun ilçeleri (iller arası Round-Robin dengeli sırayla)
 *      - 3. Dalga: Kalan tüm ilçeler (bir ilin 30 ilçesine saplanıp kalmadan iller arası Round-Robin sırayla)
 *   2) Google SEO Odaklı Arama Matrisi:
 *      - Fizyoterapistlerin Google SEO'da hedeflediği unvan ve uzmanlık kelimeleri:
 *        ("fizyoterapi", "fizyoterapist", "uzman fizyoterapist", "fzt", "fizik tedavi",
 *         "manuel terapi", "klinik pilates", "reformer pilates", "skolyoz tedavisi",
 *         "evde fizik tedavi", "kayropraktik", "osteopati", "pediatrik fizyoterapi")
 *   3) Çoklu Arama Motoru & Rate-Limit Koruması:
 *      - Yahoo TR (tr.search.yahoo.com), DuckDuckGo HTML ve Yahoo Global birlikte kullanılır.
 *      - Arama motoru yanıt vermezse veya engellerse o il/ilçe "tamamlandı" işaretlenmez, atlanmaz.
 *   4) Derin Site İçi E-Posta Kazıma & Türkçe Fizyoterapi Doğrulaması (On-Page SEO Extractor):
 *      - Sadece Türkçe fizyoterapi / fizik tedavi / rehabilitasyon / manuel terapi / klinik pilates
 *        içeriği doğrulanan sitelerden mail alır (yabancı siteleri ve tema/eklenti maillerini eler).
 *      - Cloudflare Email Protection (data-cfemail / email-protection#) XOR şifre çözücü
 *      - Schema.org / JSON-LD (Yoast SEO, RankMath application/ld+json) e-posta ayrıştırıcı
 *      - Arama motorunun bulduğu spesifik alt sayfa (u.href) + ana sayfadaki gerçek iletişim
 *        linklerini (<a href="...">İletişim / Hakkımızda / Randevu</a>) otomatik keşfetme
 *
 * Çıktılar (Sadece E-Posta Odaklı):
 *   1) dokuman/sadece_mailler.txt               -> Her satırda 1 tekil e-posta (kopyala/yapıştır için)
 *   2) dokuman/il_ilce_fizyoterapi_mailleri.csv -> E-Posta ; İl ; İlçe ; Kaynak Site
 *   3) dokuman/tarama_durumu.json               -> 81 il kapsama istatistiği ve kaldığı yerden devam durumu
 *
 * Kullanım:
 *   node scripts/klinik-rehber-botu.js                  -> 81 il ve tüm ilçeleri sırayla tarar
 *   node scripts/klinik-rehber-botu.js --cities-only    -> Sadece 81 ilin il geneli + merkez dalgasını tarar
 *   node scripts/klinik-rehber-botu.js --city=Çanakkale -> Sadece belirtilen ili ve ilçelerini tarar
 *   node scripts/klinik-rehber-botu.js --limit=25       -> Belirtilen sayıda lokasyon tarayıp durur
 *   node scripts/klinik-rehber-botu.js --reset          -> Tarama geçmişini sıfırlar (mevcut mailleri korur)
 */

import fs from 'fs';
import path from 'path';
import { TURKEY_CITIES } from '../frontend/src/lib/turkeyCities.js';

const OUT_DIR = path.resolve('dokuman');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TXT_EMAILS_PATH = path.join(OUT_DIR, 'sadece_mailler.txt');
const CSV_EMAILS_PATH = path.join(OUT_DIR, 'il_ilce_fizyoterapi_mailleri.csv');
const STATE_PATH = path.join(OUT_DIR, 'tarama_durumu.json');

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
  'sosyalislerplus.com', 'doktortavsiyesi.net', 'cybo.com', 'infobel.com', 'findglocal.com',
  'listelese.com', 'doktorbilgisi.com', 'firmarehberim.com', 'trhastane.com', 'hastane.com.tr',
  'hastanelerim.com', 'tavsiyeediyorum.com', 'firmaatlas.com', 'firmahizmeti.com', 'hastahanem.com',
  'usakrehberi.com', 'spor-salonlari.com.tr', 'hemen.app', 'bursaca.com', 'budiyet.com',
  'hekimara.com', 'hastaneveri.com', 'valid.tr', 'ehlinibul.com', 'hizmetgo.app', 'local.gen.tr',
  'sirketx.com', 'uzmango.com', 'medikalakademi.com.tr', 'haritane.com', 'turkiye.rehberi.tr',
  'tekirdag.info', 'wowturkey.com', 'com.com.tr', 'bakimevleri.com', 'rehabilitasyon.com',
  'pilatesrehberi.com', 'pilatesyap.com', 'dijital.link', 'saglikkampi.com', 'evdesaglikhizmetleri.com',
  'duckduckgo.com', 'yahoo.com', 'bing.com', 'yandex.com', 'yandex.com.tr', 'wikimedia.org',
  'wikipedia.org', 'gravatar.com', 'wp.com', 'woocommerce.com', 'elementor.com', 'theme.com',
  'quadlayers.com', 'church.com', 'turkiye-rehberi.com', 'bigvikinggames.com', 'somakomur.com',
  'mignews.info', 'yoworld.info', 'dostats.info', 'info-physio.com', 'aybrospsikoloji.com',
  'envato.com', 'themeforest.net', 'templatemonster.com', 'bootstrap.com', 'fontawesome.com',
  'jquery.com', 'wordpress.com', 'wix.com', 'squarespace.com', 'shopify.com', 'eticaret.com',
  'randevuhastane.org', 'eniyipilates.com', 'talepx.com', 'ozelcocukrehberi.com',
  'fizyoterapistimol.com', 'yogakesfet.com', 'saglikkatalogu.com', 'idilluxury.com',
  'biarz.com', 'eklinisyen.com', 'dentiacare.com', 'firmafihristi.com.tr', 'firmam.org',
  'elazighaberkent.com', 'elazigfirat.com', 'masajara.com', 'pilatestopu.com', 'bakimeviara.com'
];

const IGNORED_EMAIL_PREFIXES = [
  'noreply@', 'no-reply@', 'donotreply@', 'webmaster@', 'postmaster@', 'hostmaster@',
  'abuse@', 'privacy@', 'legal@', 'kvkk@', 'dpo@', 'reklam@', 'ilan@', 'haber@',
  'ornek@', 'e-posta@', 'eposta@', 'example@', 'test@', 'deneme@', 'duzelt@', 'sabagrup@',
  'enyakinnerde@', 'antalyadoktorlari.com.tr@', 'ihale@', 'impallari@', 'testyorumu@',
  'doktortavsiyesi.net@', 'mehmetbozkurtdev@', 'bilkentftrsempozyum2024@', 'wordpress@',
  'admin@example', 'user@', 'name@', 'email@', 'mail@domain', 'info@domain', 'info@example',
  'info@siteniz', 'destek@wordpress', 'hello@church', 'hello@quadlayers', 'physio-gellis@',
  'bilg@semadanisik.com.tr', 'haberkent_23@'
];

const ALLOWED_TLDS = new Set([
  'com', 'tr', 'net', 'org', 'co', 'fit', 'health', 'clinic', 'me', 'io', 'biz', 'ai', 'istanbul'
]);

const IGNORED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js', '.woff', '.woff2', '.ttf', '.avif', '.mp4', '.pdf', '.ico', '.xml', '.json'
];

const EXCLUDED_HOSTNAMES = [
  'instagram.com', 'facebook.com', 'youtube.com', 'twitter.com', 'x.com', 'linkedin.com',
  'doktortakvimi.com', 'doktorsitesi.com', 'eniyihekim.com', 'armut.com', 'sikayetvar.com',
  'kariyer.net', 'bulurum.com', 'yandex.com', 'yandex.com.tr', 'google.com', 'google.com.tr',
  'wikipedia.org', 'saglik.gov.tr', 'medicana.com.tr', 'acibadem.com.tr', 'memorial.com.tr',
  'medicalpark.com.tr', 'livhospital.com', 'florence.com.tr', 'npistanbul.com', 'bing.com',
  'duckduckgo.com', 'yahoo.com', 'microsoft.com', 'apple.com', 'pinterest.com', 'tiktok.com',
  'haberler.com', 'milliyet.com.tr', 'hurriyet.com.tr', 'sabah.com.tr', 'sozcu.com.tr',
  'ntv.com.tr', 'cnnturk.com', 'haberturk.com', 'tavsiyemiz.com', 'aratsana.com',
  'hekimdoktor.com', 'enyakinnerde.com', 'uservoice.com', 'iyifirma.com', 'firmasec.com',
  'haritamap.com', 'birmilyonnokta.com', 'trendyol.com', 'hepsiburada.com', 'doktorumveben.com',
  'uzmanadresi.com', 'uzmanburda.com', 'ilcemde.com', 'bisaglik.tr', 'doktorasistan.com',
  'yorum.com', 'hastadostu.com', 'tabela360.com', 'ustaradar.com', 'yerler.tr', 'yerler.com.tr',
  'zavis.ai', 'meditopia.com', 'nerede360.com', 'ucuztaxi.com', 'whichclinic.net', 'morsayfa.com',
  'tuzlali.net', 'ilceler.org', 'iletisimadresleri.com.tr', 'tikla.com.tr', 'firmadetay.net',
  'bestofankara.com', 'mestassistance.com', 'ihaledunyasi.net', 'karmava.com', 'bakiciburada.com',
  'tersanedijital.com', 'hekimhane.com.tr', 'bioyla.com', 'gigbi.com', 'sektorreferans.com.tr',
  'yakinsube.com', 'fizyoterapistrehberi.com', 'doktortavsiyesi.net', 'cybo.com', 'infobel.com',
  'findglocal.com', 'listelese.com', 'doktorbilgisi.com', 'firmarehberim.com', 'trhastane.com',
  'hastane.com.tr', 'hastanelerim.com', 'tavsiyeediyorum.com', 'firmaatlas.com', 'firmahizmeti.com',
  'hastahanem.com', 'usakrehberi.com', 'spor-salonlari.com.tr', 'hemen.app', 'bursaca.com',
  'budiyet.com', 'hekimara.com', 'hastaneveri.com', 'valid.tr', 'ehlinibul.com', 'hizmetgo.app',
  'local.gen.tr', 'sirketx.com', 'uzmango.com', 'medikalakademi.com.tr', 'haritane.com',
  'turkiye.rehberi.tr', 'turkiye-rehberi.com', 'tekirdag.info', 'wowturkey.com', 'com.com.tr',
  'bakimevleri.com', 'rehabilitasyon.com', 'pilatesrehberi.com', 'pilatesyap.com', 'dijital.link',
  'saglikkampi.com', 'evdesaglikhizmetleri.com', 'enuygun.com', 'yolcu360.com', 'tatilbudur.com',
  'etstur.com', 'tripadvisor.com', 'tripadvisor.com.tr', 'foursquare.com', 'yelp.com', 'yelp.com.tr',
  'sahibinden.com', 'zingat.com', 'emlakjet.com', 'eleman.net', 'isinolsun.com', 'secretcv.com',
  'info-physio.com', 'ikomt.net', 'mignews.info', 'yoworld.info', 'dostats.info',
  'randevuhastane.org', 'eniyipilates.com', 'talepx.com', 'ozelcocukrehberi.com',
  'fizyoterapistimol.com', 'yogakesfet.com', 'saglikkatalogu.com', 'idilluxury.com',
  'biarz.com', 'eklinisyen.com', 'firmafihristi.com.tr', 'firmam.org', 'elazighaberkent.com',
  'elazigfirat.com', 'masajara.com', 'pilatestopu.com', 'bakimeviara.com'
];

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Cloudflare Email Protection (data-cfemail / /cdn-cgi/l/email-protection#...) XOR çözücü
 */
function decodeCloudflareEmails(html) {
  if (!html) return [];
  const decodedEmails = [];
  const cfRegex = /(?:data-cfemail=["']|email-protection#)([0-9a-fA-F]{6,120})/g;
  for (const match of html.matchAll(cfRegex)) {
    try {
      const hex = match[1];
      const key = parseInt(hex.slice(0, 2), 16);
      let email = '';
      for (let i = 2; i < hex.length; i += 2) {
        const charCode = parseInt(hex.slice(i, i + 2), 16) ^ key;
        email += String.fromCharCode(charCode);
      }
      if (email.includes('@')) decodedEmails.push(email);
    } catch {}
  }
  return decodedEmails;
}

/**
 * Bir web sayfasının gerçekten Türkçe fizyoterapi / fizik tedavi / rehabilitasyon / klinik pilates
 * içeriğine sahip olup olmadığını doğrular. Yabancı veya alakasız siteleri eler.
 */
function isTurkishPhysioHtml(html) {
  if (!html) return false;
  const hasPhysioKeyword = /(?:fizyo|fizik\s*tedavi|manuel\s*terapi|rehabilitasyon|klinik\s*pilates|reformer\s*pilates|skolyoz|kayropraktik|osteopati|lenfödem|pelvik|\bfzt\b|ortopedik\s*rehabilitasyon)/i.test(html);
  const hasTurkishContext = /(?:iletişim|iletisim|randevu|hakkımızda|hakkimizda|tedavi|sağlık|saglik|merkez|klinik|uzman|[ığüşöçİĞÜŞÖÇ])/i.test(html);
  return hasPhysioKeyword && hasTurkishContext;
}

/**
 * HTML içerisinden (düz metin, mailto:, JSON-LD Schema.org, Cloudflare cfemail, HTML entity)
 * tüm geçerli fizyoterapist / klinik e-posta adreslerini ayıklar.
 */
function extractValidEmails(html) {
  if (!html) return [];

  // 1) Cloudflare korumalı mailleri çöz ve metne ekle
  const cfEmails = decodeCloudflareEmails(html);

  // 2) HTML entity, URL-encoding (%20 vb.) ve gizlenmiş @ / . işaretlerini çöz
  const decoded = (html + ' ' + cfEmails.join(' '))
    .replace(/%20|%3a|%2f|%22|%3c|%3e/gi, ' ')
    .replace(/&#64;|&#x40;|%40|\\u0040/gi, '@')
    .replace(/&#46;|&#x2e;|\\u002e/gi, '.')
    .replace(/\\u003e|\\u002f|\\n|\\r|\\t/gi, ' ')
    .replace(/\s*\[\s*(?:at|et)\s*\]\s*/gi, '@')
    .replace(/\s*\(\s*(?:at|et)\s*\)\s*/gi, '@')
    .replace(/\s*\[\s*(?:dot|nokta)\s*\]\s*/gi, '.')
    .replace(/\s*\(\s*(?:dot|nokta)\s*\)\s*/gi, '.');

  const regex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}/g;
  const matches = decoded.match(regex) || [];
  const cleaned = new Set();

  for (const raw of matches) {
    const email = raw.toLowerCase().trim()
      .replace(/^(?:mailto:|u003e|u002f|3a|20)+/i, '')
      .replace(/^[._-]+/, '')
      .replace(/[.,;)>\]"'\\]+$/, '');

    if (email.length < 6 || email.length > 70) continue;
    if (IGNORED_EXTENSIONS.some(ext => email.endsWith(ext))) continue;
    if (IGNORED_EMAIL_PREFIXES.some(pre => email.startsWith(pre))) continue;

    const [local, domain] = email.split('@');
    if (!local || !domain || !domain.includes('.')) continue;
    if (local.length < 2 || domain.length < 4) continue;
    if (/[+%]/.test(local)) continue;

    const tld = domain.split('.').pop();
    if (!ALLOWED_TLDS.has(tld)) continue;
    if (IGNORED_EMAIL_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))) continue;

    // Görsel boyutları (200x200@2x.png) veya rastgele hash değerlerini filtrele
    if (/^\d+x\d+/.test(email) || /^[0-9a-f]{16,}/.test(local) || /^\d+$/.test(local)) continue;

    cleaned.add(email);
  }

  return Array.from(cleaned);
}

async function fetchWithTimeout(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
  } finally {
    clearTimeout(id);
  }
}

function isAllowedClinicHost(hostname) {
  const host = hostname.replace(/^www\./i, '').toLowerCase();
  if (!host || !host.includes('.')) return false;
  const tld = host.split('.').pop();
  if (!ALLOWED_TLDS.has(tld)) return false;
  if (EXCLUDED_HOSTNAMES.some(ex => host === ex || host.endsWith('.' + ex))) return false;
  if (host.endsWith('.gov.tr') || host.endsWith('.edu.tr') || host.endsWith('.bel.tr') || host.endsWith('.pol.tr') || host.endsWith('.tsk.tr')) return false;
  return true;
}

/**
 * Durum & E-posta Veritabanı Yöneticisi (Sadece E-Posta Odaklı)
 */
function loadState(resetFlag = false) {
  const emailMap = new Map(); // email -> { email, city, district, website }
  const completedKeys = new Set();
  const visitedHosts = new Set();

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
        // Sadece daha önce e-posta bulunmuş siteleri visitedHosts'ta tut,
        // Cloudflare vb. yüzünden 0 e-posta çekilmiş sitelerin yeni derin kazıyıcıyla tekrar taranmasına izin ver
        for (const rec of emailMap.values()) {
          try {
            const h = new URL(rec.website).hostname.replace(/^www\./i, '').toLowerCase();
            if (h) visitedHosts.add(h);
          } catch {}
        }
      }
    } catch {}
  }

  // Daha önceki taramada arama motoru rate-limit engeli yüzünden 0 e-posta kalmış illerin
  // "Merkez" / "İl Geneli" anahtarlarını completedKeys'ten çıkar ki 81 ilin tamamı gerçekten taransın
  if (!resetFlag) {
    const citiesWithEmails = new Set();
    for (const r of emailMap.values()) {
      if (r.city) citiesWithEmails.add(r.city);
    }
    for (const c of TURKEY_CITIES) {
      if (!citiesWithEmails.has(c.name)) {
        completedKeys.delete(`${c.name}|İl Geneli`);
        completedKeys.delete(`${c.name}|Merkez`);
      }
    }
  }

  return { emailMap, completedKeys, visitedHosts };
}

function saveState(state) {
  const emailList = Array.from(state.emailMap.values());

  // 1) sadece_mailler.txt -> Sadece tekil e-posta adresleri (alt alta, kopyala/yapıştır için)
  const sortedEmails = emailList.map(r => r.email).sort();
  fs.writeFileSync(TXT_EMAILS_PATH, sortedEmails.join('\r\n') + '\r\n', 'utf8');

  // 2) il_ilce_fizyoterapi_mailleri.csv -> E-Posta ; İl ; İlçe ; Kaynak Site (Sadece mail odaklı)
  const csvRows = [
    'E-Posta;İl;İlçe;Kaynak Web Sitesi',
    ...emailList.map(r => `${r.email};${r.city};${r.district || 'İl Geneli'};${r.website}`)
  ];
  fs.writeFileSync(CSV_EMAILS_PATH, '\uFEFF' + csvRows.join('\r\n') + '\r\n', 'utf8');

  // 3) 81 İl Kapsama İstatistiği
  const cityCounts = {};
  for (const c of TURKEY_CITIES) cityCounts[c.name] = 0;
  for (const r of emailList) {
    if (r.city && cityCounts[r.city] !== undefined) {
      cityCounts[r.city]++;
    }
  }
  const coveredCitiesCount = Object.values(cityCounts).filter(v => v > 0).length;

  // 4) tarama_durumu.json -> Kaldığı yerden devam ve 81 il kapsama raporu
  fs.writeFileSync(STATE_PATH, JSON.stringify({
    updatedAt: new Date().toISOString(),
    totalUniqueEmails: emailList.length,
    coveredCitiesCount: `${coveredCitiesCount} / ${TURKEY_CITIES.length}`,
    completedCount: state.completedKeys.size,
    cityEmailCounts: cityCounts,
    completedKeys: Array.from(state.completedKeys),
    visitedHosts: Array.from(state.visitedHosts),
    emails: emailList
  }, null, 2), 'utf8');
}

/**
 * Ana sayfa HTML'inden iletişim, hakkımızda, randevu gibi e-posta barındırma ihtimali yüksek
 * site içi alt sayfaları otomatik keşfeder.
 */
function discoverInternalContactUrls(html, originUrl) {
  const urls = new Set();
  if (!html) return [];
  const hrefRegex = /href=["']([^"'#]+)["']/gi;
  const contactKeywordRegex = /(?:iletisim|contact|ulasin|bize-ulas|hakkimizda|hakkimda|hakkinda|about|randevu|klinik|merkez|uzman|fzt|ekibimiz|kadromuz)/i;

  for (const m of html.matchAll(hrefRegex)) {
    const rawHref = m[1].trim();
    if (!rawHref || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) continue;
    if (!contactKeywordRegex.test(rawHref)) continue;
    try {
      const resolved = new URL(rawHref, originUrl);
      if (resolved.origin !== originUrl) continue;
      if (IGNORED_EXTENSIONS.some(ext => resolved.pathname.toLowerCase().endsWith(ext))) continue;
      urls.add(resolved.href);
      if (urls.size >= 5) break;
    } catch {}
  }
  return Array.from(urls);
}

/**
 * Bir klinik web sitesinin arama sonucunda çıkan sayfasını, ana sayfasını ve
 * dinamik keşfedilen iletişim sayfalarını tarayarak e-posta adreslerini çıkarır.
 */
async function scrapeWebsiteForEmails(targetInfo) {
  const { origin, initialUrls } = targetInfo;
  const found = new Set();
  const checkedUrls = new Set();
  let verifiedTurkishPhysioSite = false;

  // 1. Öncelik: Ana sayfa (Türkçe fizyoterapi sitesi doğrulaması + link keşfi için) ve arama motorunun bulduğu alt sayfa
  const queue = [
    origin,
    ...initialUrls,
    `${origin}/iletisim`,
    `${origin}/iletisim/`,
    `${origin}/bize-ulasin`,
    `${origin}/contact`,
    `${origin}/hakkimizda`
  ];

  for (let i = 0; i < queue.length && checkedUrls.size < 6; i++) {
    const targetUrl = queue[i];
    if (!targetUrl || checkedUrls.has(targetUrl)) continue;
    checkedUrls.add(targetUrl);

    try {
      const res = await fetchWithTimeout(targetUrl, 5500);
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('text/html') && !ct.includes('application/xhtml')) continue;

      const html = await res.text();
      if (isTurkishPhysioHtml(html)) {
        verifiedTurkishPhysioSite = true;
      }

      // Eğer ana sayfa bile Türkçe fizyoterapi/sağlık içeriği taşımıyorsa ve ilk sayfalar alakasızsa atla
      if (!verifiedTurkishPhysioSite && checkedUrls.size >= 2) break;

      if (verifiedTurkishPhysioSite) {
        for (const e of extractValidEmails(html)) found.add(e);
      }

      // Ana sayfadaysak ve henüz mail bulamadıysak, sayfadaki gerçek iletişim linklerini kuyruğun başına ekle
      if ((targetUrl === origin || targetUrl === `${origin}/`) && found.size === 0 && verifiedTurkishPhysioSite) {
        const internalUrls = discoverInternalContactUrls(html, origin);
        for (const iu of internalUrls) {
          if (!checkedUrls.has(iu)) queue.splice(i + 1, 0, iu);
        }
      }

      if (found.size > 0) break;
    } catch {}
  }

  return Array.from(found);
}

/**
 * Çoklu Arama Motoru (Yahoo TR + DuckDuckGo HTML + Yahoo Global) üzerinden
 * bir Google SEO sorgusunu çalıştırır; arama özetlerindeki (snippet) e-postaları
 * ve klinik web sitesi URL'lerini döndürür.
 */
async function runMultiEngineQuery(query) {
  const snippetEmails = new Set();
  const discoveredUrls = new Set();
  let engineSuccess = false;

  // 1) Yahoo Türkiye (tr.search.yahoo.com) - Türkçe yerel SEO sonuçları için birincil motor
  const yahooEngines = [
    `https://tr.search.yahoo.com/search?p=${encodeURIComponent(query)}&n=20`,
    `https://search.yahoo.com/search?p=${encodeURIComponent(query)}&n=20`
  ];

  for (const yUrl of yahooEngines) {
    try {
      const res = await fetchWithTimeout(yUrl, 6500);
      if (!res.ok) continue;
      const html = await res.text();
      if (html.length < 2000) continue;
      engineSuccess = true;

      for (const e of extractValidEmails(html)) snippetEmails.add(e);

      for (const m of html.matchAll(/RU=([^/]+)\/RK=/g)) {
        try {
          const decodedUrl = decodeURIComponent(m[1]);
          const u = new URL(decodedUrl);
          if (!['http:', 'https:'].includes(u.protocol)) continue;
          if (!isAllowedClinicHost(u.hostname)) continue;
          discoveredUrls.add(u.href);
        } catch {}
      }
      if (discoveredUrls.size > 0 || snippetEmails.size > 0) break;
    } catch {}
  }

  // 2) DuckDuckGo HTML (Tamamlayıcı & Farklı SEO İndeksi / Rate-limit Yedeği)
  if (discoveredUrls.size < 4) {
    try {
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetchWithTimeout(ddgUrl, 6500);
      if (res.ok) {
        const html = await res.text();
        if (html.length > 1500) {
          engineSuccess = true;
          for (const e of extractValidEmails(html)) snippetEmails.add(e);

          for (const m of html.matchAll(/uddg=([^&"']+)/g)) {
            try {
              const decodedUrl = decodeURIComponent(m[1]);
              const u = new URL(decodedUrl);
              if (!['http:', 'https:'].includes(u.protocol)) continue;
              if (!isAllowedClinicHost(u.hostname)) continue;
              discoveredUrls.add(u.href);
            } catch {}
          }
        }
      }
    } catch {}
  }

  return {
    engineSuccess,
    snippetEmails: Array.from(snippetEmails),
    discoveredUrls: Array.from(discoveredUrls)
  };
}

/**
 * Google SEO Anahtar Kelime Üretici:
 * Türkiye'deki fizyoterapistlerin ve fizik tedavi / manuel terapi / klinik pilates merkezlerinin
 * Google'da indeks aldığı SEO başlıklarına ve meta açıklamalarına göre sorgular üretir.
 */
function buildGoogleSeoQueries(city, district, isCityWide = false) {
  if (isCityWide || district === 'Merkez' || district === 'İl Geneli') {
    return [
      `${city} fizyoterapi iletişim`,
      `${city} fizyoterapist iletişim`,
      `${city} fizik tedavi merkezi iletişim`,
      `${city} manuel terapi fizyoterapist`,
      `${city} klinik pilates skolyoz fizyoterapist`,
      `${city} evde fizik tedavi fizyoterapist`,
      `${city} uzman fizyoterapist iletişim e-posta`
    ];
  }

  const locName = `${city} ${district}`;
  return [
    `${locName} fizyoterapi iletişim`,
    `${locName} fizyoterapist iletişim`,
    `${locName} fizik tedavi manuel terapi`,
    `${locName} uzman fizyoterapist klinik pilates`
  ];
}

/**
 * Bir il veya ilçeyi Google SEO sorgularıyla tarar ve bulunan e-postaları kaydeder.
 */
async function scanLocation(item, state) {
  const { city, district, isCityWide } = item;
  const queries = buildGoogleSeoQueries(city, district, isCityWide);
  const candidateTargets = new Map(); // host -> { origin, initialUrls: Set }
  let successfulQueries = 0;

  for (const q of queries) {
    const { engineSuccess, snippetEmails, discoveredUrls } = await runMultiEngineQuery(q);
    if (engineSuccess) successfulQueries++;

    // 1) Arama sonuç özetlerinde (meta description / snippet) doğrudan geçen e-postaları kaydet
    for (const e of snippetEmails) {
      if (!state.emailMap.has(e)) {
        state.emailMap.set(e, {
          email: e,
          city,
          district: isCityWide ? 'İl Geneli' : district,
          website: 'SEO Arama Özeti'
        });
        console.log(`   🎯 [SEO Snippet Mail] ${e} (${city} / ${isCityWide ? 'İl Geneli' : district})`);
      }
    }

    // 2) Arama sonuçlarındaki klinik web sitelerini ve alt sayfalarını grupla
    for (const href of discoveredUrls) {
      try {
        const u = new URL(href);
        const host = u.hostname.replace(/^www\./i, '').toLowerCase();
        if (state.visitedHosts.has(host)) continue;

        if (!candidateTargets.has(host)) {
          candidateTargets.set(host, { origin: u.origin, initialUrls: new Set() });
        }
        if (u.pathname && u.pathname !== '/') {
          candidateTargets.get(host).initialUrls.add(u.href);
        }
      } catch {}
    }

    await sleep(220);
  }

  // Keşfedilen yeni klinik sitelerini paralel (6'lı worker grubu halinde) derinlemesine tara
  const entries = Array.from(candidateTargets.entries());
  let idx = 0;

  async function worker() {
    while (idx < entries.length) {
      const [host, info] = entries[idx++];
      state.visitedHosts.add(host);
      const emails = await scrapeWebsiteForEmails({
        origin: info.origin,
        initialUrls: Array.from(info.initialUrls)
      });

      for (const e of emails) {
        if (!state.emailMap.has(e)) {
          state.emailMap.set(e, {
            email: e,
            city,
            district: isCityWide ? 'İl Geneli' : district,
            website: info.origin
          });
          console.log(`   📧 [Site İçi Mail] ${e} (${city} / ${isCityWide ? 'İl Geneli' : district} -> ${info.origin})`);
        }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(6, entries.length) }, () => worker()));
  return successfulQueries > 0;
}

/**
 * 81 İlin Tamamını Eksiksiz ve Dengeli Tarayan 3 Aşamalı Kuyruk Oluşturucu:
 *   - 1. Dalga A: Henüz 0 e-postası olan illerin "İl Geneli" SEO taraması (81 il kapsaması için en yüksek öncelik!)
 *   - 1. Dalga B: Diğer illerin tamamlanmamış "İl Geneli" SEO taraması
 *   - 2. Dalga  : 81 ilin merkez ve büyük ilçeleri (İller arası Round-Robin dengeli sırayla)
 *   - 3. Dalga  : Kalan tüm ilçeler (Round-Robin: Her ilden sırayla 1'er ilçe alarak ilerler)
 */
function buildBalancedQueue(cityFilter, citiesOnly, completedKeys, emailMap) {
  const citiesWithEmails = new Set();
  for (const r of emailMap.values()) {
    if (r.city) citiesWithEmails.add(r.city);
  }

  const priorityCityNames = [
    'Kocaeli', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya',
    'Gaziantep', 'Mersin', 'Kayseri', 'Eskişehir', 'Samsun', 'Denizli', 'Sakarya',
    'Tekirdağ', 'Muğla', 'Aydın', 'Balıkesir', 'Manisa', 'Hatay', 'Trabzon', 'Diyarbakır',
    'Şanlıurfa', 'Kahramanmaraş', 'Malatya', 'Erzurum', 'Van', 'Ordu', 'Mardin',
    'Çanakkale', 'Bolu', 'Edirne', 'Afyonkarahisar', 'Isparta', 'Düzce', 'Elazığ',
    'Zonguldak', 'Yalova', 'Rize', 'Giresun', 'Çorum', 'Kütahya', 'Sivas', 'Tokat'
  ];

  const orderedCities = [...TURKEY_CITIES].sort((a, b) => {
    const ia = priorityCityNames.indexOf(a.name);
    const ib = priorityCityNames.indexOf(b.name);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.name.localeCompare(b.name, 'tr');
  });

  const filteredCities = orderedCities.filter(
    c => !cityFilter || c.name.toLowerCase() === cityFilter.toLowerCase()
  );

  // 81 ilin tamamındaki merkez ve yoğun nüfuslu ilçeler (Ordu ve Mardin dahil eksiksiz)
  const majorDistricts = new Set([
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
    'Efeler', 'Kuşadası', 'Söke', 'Nazilli', 'Didim',
    'Altıeylül', 'Karesi', 'Bandırma', 'Edremit', 'Ayvalık',
    'Yunusemre', 'Şehzadeler', 'Akhisar', 'Turgutlu', 'Salihli',
    'Antakya', 'İskenderun', 'Defne', 'Dörtyol',
    'Ortahisar', 'Akçaabat',
    'Kayapınar', 'Bağlar',
    'Haliliye', 'Karaköprü', 'Eyyübiye',
    'Battalgazi', 'Yeşilyurt',
    'Onikişubat', 'Dulkadiroğlu', 'Elbistan',
    'Yakutiye', 'Palandöken',
    'İpekyolu', 'Tuşba',
    'Altınordu', 'Fatsa', 'Ünye',
    'Artuklu', 'Kızıltepe', 'Midyat', 'Nusaybin'
  ]);

  const wave1MissingCities = [];
  const wave1OtherCities = [];
  const wave2MajorByCity = new Map();
  const wave3RemainingByCity = new Map();

  for (const c of filteredCities) {
    // 1. DALGA: 81 ilin her biri için doğrudan İl Geneli SEO taraması
    const hasMerkezDistrict = c.districts.includes('Merkez');
    const cityWideKey = hasMerkezDistrict ? `${c.name}|Merkez` : `${c.name}|İl Geneli`;
    const cityWideDistrict = hasMerkezDistrict ? 'Merkez' : 'İl Geneli';

    if (!completedKeys.has(cityWideKey)) {
      const item = {
        city: c.name,
        district: cityWideDistrict,
        key: cityWideKey,
        isCityWide: true
      };
      if (!citiesWithEmails.has(c.name)) {
        wave1MissingCities.push(item);
      } else {
        wave1OtherCities.push(item);
      }
    }

    if (citiesOnly) continue;

    wave2MajorByCity.set(c.name, []);
    wave3RemainingByCity.set(c.name, []);

    for (const d of c.districts) {
      if (d === 'Merkez') continue; // 1. dalgada İl Geneli olarak zaten eklendi
      const key = `${c.name}|${d}`;
      if (completedKeys.has(key)) continue;

      if (majorDistricts.has(d)) {
        wave2MajorByCity.get(c.name).push({ city: c.name, district: d, key, isCityWide: false });
      } else {
        wave3RemainingByCity.get(c.name).push({ city: c.name, district: d, key, isCityWide: false });
      }
    }
  }

  // Round-Robin (Her ilden sırayla 1'er ilçe alarak) birleştirici:
  function interleaveRoundRobin(cityMap) {
    const result = [];
    const lists = Array.from(cityMap.values()).filter(arr => arr.length > 0);
    let maxLen = 0;
    for (const arr of lists) {
      if (arr.length > maxLen) maxLen = arr.length;
    }
    for (let i = 0; i < maxLen; i++) {
      for (const arr of lists) {
        if (i < arr.length) result.push(arr[i]);
      }
    }
    return result;
  }

  const wave2Major = interleaveRoundRobin(wave2MajorByCity);
  const wave3Remaining = interleaveRoundRobin(wave3RemainingByCity);

  return [...wave1MissingCities, ...wave1OtherCities, ...wave2Major, ...wave3Remaining];
}

async function main() {
  const args = process.argv.slice(2);
  const cityFilter = args.find(a => a.startsWith('--city='))?.split('=')[1]?.trim() || '';
  const maxLocations = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0', 10);
  const citiesOnly = args.includes('--cities-only');
  const resetFlag = args.includes('--reset');

  const state = loadState(resetFlag);
  saveState(state);

  const queue = buildBalancedQueue(cityFilter, citiesOnly, state.completedKeys, state.emailMap);

  // Mevcut durumda kaç ilde en az 1 e-posta bulunduğunu hesapla
  const getCoveredCityCount = () => {
    const s = new Set();
    for (const r of state.emailMap.values()) {
      if (r.city) s.add(r.city);
    }
    return s.size;
  };

  console.log('=========================================================================');
  console.log('🚀 81 İL FİZYOTERAPİST E-POSTA TARAMA BOTU (GOOGLE SEO & ÇOKLU MOTOR)');
  console.log(`   • Mevcut Tekil E-Posta Sayısı  : ${state.emailMap.size}`);
  console.log(`   • E-Posta Bulunan İl Kapsaması : ${getCoveredCityCount()} / 81 İl`);
  console.log(`   • Kuyruktaki Hedef Lokasyon    : ${queue.length}`);
  console.log(`   • Sadece Mailler (TXT)         : ${TXT_EMAILS_PATH}`);
  console.log(`   • İl/İlçe Mail Tablosu (CSV)   : ${CSV_EMAILS_PATH}`);
  console.log('=========================================================================\n');

  let processedNow = 0;
  for (const item of queue) {
    processedNow++;
    const label = item.isCityWide ? `${item.city} (İl Geneli SEO)` : `${item.city} / ${item.district}`;
    console.log(`🔎 [${processedNow}/${queue.length}] Taranıyor: ${label} (Toplam Mail: ${state.emailMap.size} | Kapsanan İl: ${getCoveredCityCount()}/81)...`);

    const ok = await scanLocation(item, state);
    if (ok) {
      state.completedKeys.add(item.key);
    } else {
      console.log(`   ⚠️ [Uyarı] ${label} için arama motoru yanıtı alınamadı, daha sonra tekrar denenecek.`);
    }
    saveState(state);

    if (maxLocations > 0 && processedNow >= maxLocations) {
      console.log(`\n⏸️ Belirtilen tarama sınırı (${maxLocations}) tamamlandı. Tekrar çalıştırdığınızda kaldığı yerden devam edecektir.`);
      break;
    }
  }

  console.log('\n=========================================================================');
  console.log('✅ TARAMA ÖZETİ (SADECE E-POSTA):');
  console.log(`   • Toplam Tekil E-Posta Sayısı  : ${state.emailMap.size}`);
  console.log(`   • E-Posta Bulunan İl Kapsaması : ${getCoveredCityCount()} / 81 İl`);
  console.log(`   • Sadece Mailler (TXT)         : ${TXT_EMAILS_PATH}`);
  console.log(`   • İl/İlçe Mail Tablosu (CSV)   : ${CSV_EMAILS_PATH}`);
  console.log('=========================================================================\n');
}

main().catch(err => {
  console.error('Beklenmeyen hata:', err);
  process.exit(1);
});
