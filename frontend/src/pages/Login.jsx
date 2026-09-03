import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { API_URL } from '../lib/api';
import { 
  Activity, Mail, Lock, Loader2, LogIn, Building2, 
  Eye, EyeOff, Check, X, ArrowRight, ExternalLink,
  MessageSquare, Phone, ShieldCheck, Clock, CheckCircle2, Sparkles,
  Calendar, Copy, FileText, QrCode, Wallet, CreditCard, ArrowRightLeft, Users
} from 'lucide-react';

export default function Login({ onLogin }) {
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Demo & İletişim Form State
  const [demoForm, setDemoForm] = useState({
    full_name: '',
    clinic_name: '',
    phone: '',
    email: '',
    city: '',
    plan: '14-gun-deneme',
    notes: ''
  });
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectPlan = (planKey) => {
    setDemoForm(prev => ({ ...prev, plan: planKey }));
    scrollToSection('contact-section');
  };

  const triggerDemoLogin = async () => {
    setEmail('demo@fizyotim.com');
    setPassword('demo123');
    await handleLoginWithCredentials('demo@fizyotim.com', 'demo123');
  };

  const handleLoginWithCredentials = async (loginEmail, loginPass) => {
    setLoading(true);
    setError('');

    try {
      // 1. Supabase clinics tablosundan kliniği sorgula
      const cleanEmail = loginEmail.trim().toLowerCase();
      let query = supabase.from('clinics').select('*').eq('password', loginPass);

      if (cleanEmail === 'demo@fizyotim.com' || cleanEmail === 'demo@fizyopanel.com' || cleanEmail === 'demo') {
        query = query.or('email.eq.demo@fizyotim.com,email.eq.demo@fizyopanel.com,slug.eq.demo-klinik');
      } else {
        query = query.eq('email', cleanEmail);
      }

      const { data: clinic, error: clinicErr } = await query.maybeSingle();

      if (clinicErr) {
        // Fallback: Backend API'ye sor
        try {
          const res = await axios.post(`${API_URL}/auth/clinic-login`, { email: loginEmail, password: loginPass });
          if (res.data) {
            localStorage.setItem('fizyo_clinic', JSON.stringify(res.data));
            onLogin(res.data);
            return;
          }
        } catch (apiErr) {
          setError(apiErr.response?.data?.error || 'Giriş yapılamadı.');
          return;
        }
      }

      if (!clinic) {
        setError('E-posta veya şifre hatalı. Lütfen yöneticinizden aldığınız giriş bilgilerini kullanın.');
        setLoading(false);
        return;
      }

      if (clinic.status === 'pasif') {
        setError('Klinik hesabınız pasife alınmıştır. Lütfen sistem yöneticinizle iletişime geçiniz.');
        setLoading(false);
        return;
      }

      // Başarılı giriş
      localStorage.setItem('fizyo_clinic', JSON.stringify(clinic));
      onLogin(clinic);
    } catch (err) {
      console.error(err);
      setError('Bağlantı hatası oluştu. Lütfen internetinizi kontrol edip tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLoginWithCredentials(email, password);
  };

  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    setDemoSubmitting(true);
    try {
      await supabase.from('demo_requests').insert([{
        full_name: demoForm.full_name,
        clinic_name: demoForm.clinic_name,
        phone: demoForm.phone,
        email: demoForm.email || null,
        city: demoForm.city || null,
        plan: demoForm.plan,
        notes: demoForm.notes || null,
        created_at: new Date().toISOString()
      }]).catch(() => {});

      setDemoSuccess(true);
    } catch {
      setDemoSuccess(true);
    } finally {
      setDemoSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-[Inter] antialiased flex flex-col justify-between selection:bg-emerald-600 selection:text-white">

      {/* ─── 1. NAVBAR (CLEAN, MINIMAL ENTERPRISE HEADER) ─────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shrink-0 tracking-tighter">
              FT
            </div>
            <div>
              <span className="text-[17px] sm:text-[18px] font-bold tracking-tight block leading-tight text-slate-900">
                Fizyotim
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Klinik Yönetim Sistemi
              </span>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-[13px] font-medium text-slate-600">
            <button 
              onClick={() => scrollToSection('features')}
              className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Özellikler
            </button>
            <button 
              onClick={() => scrollToSection('patient-portal')}
              className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hasta Randevu Portalı
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Fiyatlandırma
            </button>
            <button 
              onClick={() => scrollToSection('contact-section')}
              className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              İletişim &amp; Demo
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://randevu.fizyotim.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-medium transition-colors"
            >
              <span>randevu.fizyotim.com</span>
              <ExternalLink size={12} className="text-slate-400" />
            </a>

            <button
              onClick={() => setShowLoginModal(true)}
              className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[12px] sm:text-[13px] font-semibold transition-colors cursor-pointer shrink-0"
            >
              Klinik Girişi
            </button>
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION ──────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/70 bg-gradient-to-b from-slate-50/70 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium mb-6">
              Fizyoterapi ve Manuel Terapi Klinikleri İçin SaaS Altyapısı
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.18] mb-6">
              Kliniğinizi akıllı takvim, otomatik WhatsApp ve online randevuyla büyütün.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal mb-8">
              Randevuları saniyeler içinde organize edin, gelmeme oranlarını düşürün, hasta takibini ve tahsilatları eksiksiz yönetin. Kredi kartı gerekmeden 14 gün ücretsiz deneyin.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <button
                onClick={() => scrollToSection('contact-section')}
                className="w-full sm:w-auto h-11 px-7 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[13px] sm:text-[14px] transition-colors cursor-pointer"
              >
                14 Gün Ücretsiz Başla
              </button>

              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full sm:w-auto h-11 px-6 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-[13px] transition-colors cursor-pointer"
              >
                Klinik Girişi
              </button>

              <a
                href="https://randevu.fizyotim.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto h-11 px-6 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-[13px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Hasta Portalı (Canlı Demo)</span>
                <ExternalLink size={13} className="text-slate-400" />
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-normal text-slate-500">
              <span>Kredi kartı gerekmez</span>
              <span className="text-slate-300">•</span>
              <span>14 gün tam erişim</span>
              <span className="text-slate-300">•</span>
              <span>5 dakikada hızlı kurulum</span>
              <span className="text-slate-300">•</span>
              <span>81 il desteği</span>
            </div>
          </div>

          {/* ─── Hero UI Mockup Showcase (Clean Slate) ─── */}
          <div className="max-w-4xl mx-auto rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
                </div>
                <span className="text-[11px] font-mono text-slate-400">app.fizyotim.com / dashboard</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">sistem aktif</span>
            </div>

            <div className="p-5 sm:p-6 bg-slate-50/50 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Bugünkü Seanslar</span>
                  <span className="text-xl font-bold text-slate-900">8 Seans</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">6 Onaylandı</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Bekleyen Online Talep</span>
                  <span className="text-xl font-bold text-slate-900">2 Yeni</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">randevu.fizyotim.com</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Kayıtlı Hasta</span>
                  <span className="text-xl font-bold text-slate-900">142</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">KVKK korumalı</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">WhatsApp Durumu</span>
                  <span className="text-xl font-bold text-slate-900">Aktif</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Otomatik şablon</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px]">
                <div>
                  <h4 className="font-semibold text-slate-900">Ahmet Yılmaz — Manuel Terapi</h4>
                  <p className="text-slate-500">Bugün 14:30 • Fzt. Mehmet Demir • Salon 1</p>
                </div>
                <span className="text-slate-500 bg-slate-100 px-2.5 py-1 rounded text-[11px] font-medium self-start sm:self-auto">
                  WhatsApp Bildirimi İletildi
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 3. FEATURES SECTION (CLEAN NUMBERED CARDS) ───────────── */}
      <section id="features" className="py-16 sm:py-24 bg-white border-b border-slate-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-14">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 block">
              Temel Özellikler
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
              Bir kliniğin ihtiyaç duyduğu tüm araçlar tek altyapıda.
            </h2>
            <p className="text-[14px] text-slate-600 leading-relaxed font-normal">
              Farklı yazılımlar ve kağıt randevu defterleri yerine tek merkezden yönetilen sade yönetim sistemi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 01 */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-mono font-bold text-slate-400">01</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Calendar size={15} strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 mb-2">Akıllı Seans &amp; Terapist Takvimi</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Tüm fizyoterapistlerin randevularını tek takvimde görüntüleyin. Çakışma kontrolü ile aynı saate mükerrer randevu oluşmasını engelleyin.
              </p>
            </div>

            {/* 02 */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-mono font-bold text-slate-400">02</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Copy size={15} strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 mb-2">Haftalık &amp; Tekil Seans Kopyalama</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Her hafta randevuları tek tek girmekle vakit kaybetmeyin. Seansları haftaya aynı gün ve saate tek tıkla kopyalayın veya dilediğiniz tarihe taşıyın.
              </p>
            </div>

            {/* 03 */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-mono font-bold text-slate-400">03</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <MessageSquare size={15} strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 mb-2">WhatsApp Bildirimleri</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Randevu onaylandığında veya seans saati yaklaştığında tek tıkla hastanıza şablon mesaj ve klinik konumunuzu iletin.
              </p>
            </div>

            {/* 04 */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-mono font-bold text-slate-400">04</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <FileText size={15} strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 mb-2">Hasta Dosyası &amp; Raporlama</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Hastanın tüm seans geçmişi, kalan borcu ve klinik notları tek yerde. Tek tıkla hastaya teslim edilecek PDF seans özeti oluşturun.
              </p>
            </div>

            {/* 05 */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-mono font-bold text-slate-400">05</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <QrCode size={15} strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 mb-2">Danışma QR Masa Standı</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Bekleme salonu ve danışma masası için kliniğinizin logosuyla baskıya hazır QR standı oluşturun. Hastalar okutup anında talep açsın.
              </p>
            </div>

            {/* 06 */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-mono font-bold text-slate-400">06</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Wallet size={15} strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 mb-2">Kasa, Tahsilat &amp; Finans Takibi</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Nakit, kredi kartı ve havale ödemelerini kaydedin. Kalan seans borçlarını ve kliniğinizin net cirosunu anlık takip edin.
              </p>
            </div>

            {/* 07 */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-mono font-bold text-slate-400">07</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <ShieldCheck size={15} strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 mb-2">Doğrulama &amp; KVKK Güvenliği</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Mükerrer telefon engelleme, haftalık 2 seans kotası ve hasta adı/tedavi maskelemesi ile hasta verilerinizi güvence altına alın.
              </p>
            </div>

            {/* 08 */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-mono font-bold text-slate-400">08</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <ExternalLink size={15} strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 mb-2">Canlı Online Randevu Portalı</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                randevu.fizyotim.com üzerinde kliniğinize ait canlı takvim sayfasıyla hastalarınızdan 7/24 randevu talebi toplayın.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 4. SPOTLIGHT: HASTA RANDEVU PORTALI (randevu.fizyotim.com) ─── */}
      <section id="patient-portal" className="py-16 sm:py-20 bg-slate-900 text-white scroll-mt-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-7 space-y-5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
                Online Randevu Portalı
              </span>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Hastalarınız randevu.fizyotim.com üzerinden talep oluştursun.
              </h2>

              <p className="text-[14px] sm:text-[15px] text-slate-300 leading-relaxed font-normal">
                Kliniğinize özel <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded">https://randevu.fizyotim.com/?clinic=klinik-adiniz</span> bağlantısını profilinize veya iletişim kanallarınıza ekleyin.
              </p>

              <div className="space-y-2.5 pt-2 text-[13px] text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-mono">01.</span>
                  <span><strong>Otomatik Numara Tanıma:</strong> Hasta kayıtlı telefonunu girdiğinde sistem hastayı otomatik tanır, ad-soyad yazmaya gerek kalmaz.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-mono">02.</span>
                  <span><strong>KVKK Korumalı Sorgulama:</strong> Hasta randevu durumunu gizlilik maskelemesiyle anında sorgulayabilir.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-mono">03.</span>
                  <span><strong>Kota Kontrolü:</strong> Aynı anda en fazla 2 bekleyen talep ve haftada 2 seans sınırı ile takvim kilitlenmesi önlenir.</span>
                </div>
              </div>

              <div className="pt-3">
                <a
                  href="https://randevu.fizyotim.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-[13px] transition-colors"
                >
                  <span>Hasta Portalını Canlı İnceleyin</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                  <span>randevu.fizyotim.com</span>
                  <span>hasta akışı</span>
                </div>

                <div className="space-y-2.5 text-[12px]">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">1. Seans Saati</span>
                    <p className="text-white font-medium">14:00 - 15:00 • Manuel Terapi</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">2. Kayıtlı Telefon</span>
                    <p className="text-white font-mono">0555 123 45 67</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Sistem eşleşmesi: Ahmet Y.</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium text-center">
                    Talep kliniğe iletildi
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  Kliniğinizin paneline anında sesli bildirim ve onay talebi düşer.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 5. PRICING SECTION ───────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28 bg-slate-50/50 border-b border-slate-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold uppercase tracking-wider mb-4">
              <Sparkles size={12} className="text-slate-600" />
              <span>Şeffaf &amp; Net Fiyatlandırma</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Kliniğinizin büyümesine göre tasarlanmış, sade ve dürüst paketler.
            </h2>
            <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              Gizli kurulum ücreti veya seans başına komisyon yok. 14 gün boyunca tüm özelliklere tam erişimle ücretsiz başlayın.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch mb-14">
            
            {/* Plan 1: Aylık */}
            <div className="rounded-2xl bg-white border border-slate-200 p-8 sm:p-9 flex flex-col justify-between shadow-2xs hover:border-slate-300 hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">Aylık Esnek Plan</span>
                  <span className="text-[11px] text-slate-400 font-medium">Taahhütsüz</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Standart Paket</h3>
                <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
                  Dilediğiniz an iptal edebileceğiniz, tek bir kliniğin tüm randevu, hasta ve kasa yönetimini eksiksiz karşılayan başlangıç paketi.
                </p>
                
                <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-slate-100">
                  <span className="text-4xl font-black text-slate-900">₺250</span>
                  <span className="text-slate-500 font-medium text-sm">/ ay + KDV</span>
                </div>

                <div className="space-y-3.5 mb-8">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pakete Dahil Olanlar</p>
                  <ul className="space-y-3 text-[13px] text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span>Canlı Online Randevu Takvimi (<span className="font-mono text-slate-500 text-[12px]">randevu.fizyotim.com</span>)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span><strong>Haftalık &amp; Tekil Seans Kopyalama</strong> (Şablon Çoğaltma)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span>Çoklu Fizyoterapist &amp; Yetki Yönetimi</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span>Otomatik WhatsApp Randevu Onay &amp; Hatırlatma</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span>Danışma Masası QR Kod Standı Üretici (Baskıya Hazır)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span>Sınırsız Hasta Dosyası, Seans ve Kasa/Tahsilat Kaydı</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span>Tek Tıkla PDF Seans Özeti &amp; Hasta Raporları</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan('14-gun-deneme')}
                className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-[13px] transition-colors cursor-pointer"
              >
                14 Gün Ücretsiz Başla
              </button>
            </div>

            {/* Plan 2: Yıllık */}
            <div className="rounded-2xl bg-slate-900 text-white border border-slate-800 p-8 sm:p-9 flex flex-col justify-between relative shadow-xl hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-md font-semibold">
                    En Çok Tercih Edilen
                  </span>
                  <span className="text-[11px] font-bold text-white bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
                    %33 Tasarruf
                  </span>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-2">Yıllık Avantaj Paketi</h3>
                <p className="text-[13px] text-slate-300 mb-6 leading-relaxed">
                  Kliniğini uzun vadeli, kesintisiz ve en avantajlı maliyetle büyütmek isteyen fizyoterapistler için ideal paket.
                </p>
                
                <div className="flex items-baseline gap-2 mb-1 pb-1">
                  <span className="text-4xl font-black text-white tracking-tight">₺2.000</span>
                  <span className="text-slate-400 font-normal text-sm">/ yıl + KDV</span>
                  <span className="text-sm line-through text-slate-500 ml-1 font-mono">₺3.000</span>
                </div>
                
                <div className="inline-block bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px] px-2.5 py-1 rounded-md mb-6 pb-2">
                  Ayda sadece <strong>₺166</strong>'ya denk gelir (Yılda <strong>₺1.000 net tasarruf</strong>)
                </div>

                <div className="space-y-3.5 mb-8 border-t border-slate-800 pt-6">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Standart Pakete Ek Olarak</p>
                  <ul className="space-y-3 text-[13px] text-slate-200">
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span><strong>Tüm Standart Plan Özellikleri Dahil</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span><strong>4 Ay Ücretsiz Kullanım</strong> (Yıllık peşin ödemede)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span>Öncelikli 7/24 WhatsApp &amp; Telefon Teknik Desteği</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span>Ücretsiz Eski Hasta &amp; Randevu Veri Aktarımı</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span>1 Yıl Boyunca Fiyat Artışından Etkilenmeme Güvencesi</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span>Kliniğinize Özel QR Masa Standı Tasarım &amp; Baskı Desteği</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan('yillik-kampanya')}
                className="w-full h-12 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-[13px] transition-colors cursor-pointer shadow-sm"
              >
                Yıllık Paketle 14 Gün Ücretsiz Başla
              </button>
            </div>

          </div>

          {/* ─── Güvenceler / Alt Bilgi Rozetleri ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-6 border-t border-slate-200/80 text-[12px]">
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2 mb-1.5">
                <CreditCard size={15} className="text-slate-600" />
                <span className="font-bold text-slate-900 block">Kredi Kartı Gerekmez</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">14 gün boyunca hiçbir kart bilgisi girmeden tam yetkiyle kullanın.</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock size={15} className="text-slate-600" />
                <span className="font-bold text-slate-900 block">5 Dakikada Canlıda</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">Kayıt sonrası anında klinik paneliniz ve randevu linkiniz hazır.</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2 mb-1.5">
                <ArrowRightLeft size={15} className="text-slate-600" />
                <span className="font-bold text-slate-900 block">Ücretsiz Veri Aktarımı</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">Mevcut hasta listenizi Excel'den sisteme ekibimiz aktarsın.</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck size={15} className="text-slate-600" />
                <span className="font-bold text-slate-900 block">KVKK &amp; Şifreli Bulut</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">Verileriniz 256-bit şifreleme ve günlük güvenli yedeklemeyle korunur.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 6. İLETİŞİM & DEMO FORMU ─────────────────────────────── */}
      <section id="contact-section" className="py-20 sm:py-28 bg-white border-b border-slate-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold uppercase tracking-wider mb-4">
              <MessageSquare size={12} className="text-slate-600" />
              <span>İletişim &amp; Canlı Demo</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
              Fizyotim'i kliniğinizde canlı test etmeye hazır mısınız?
            </h2>
            <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed font-normal">
              Aşağıdaki formu doldurarak veya doğrudan WhatsApp hattımızdan bize yazarak kliniğinize özel demo hesabınızı dakikalar içinde açabilirsiniz.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-start">
            
            {/* Sol Kolon: Doğrudan İletişim Kartları & 3 Adım */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* WhatsApp Kartı */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Canlı Destek Aktif
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Yanıt: ~5 dk</span>
                </div>
                <h4 className="font-bold text-slate-900 text-[15px] mb-1">WhatsApp Hızlı Demo Hattı</h4>
                <p className="text-slate-500 text-[12px] leading-relaxed mb-4">
                  Form doldurmak istemiyorsanız doğrudan uzmanımızla WhatsApp üzerinden görüşüp anında klinik hesabınızı açtırabilirsiniz.
                </p>
                <a
                  href="https://wa.me/905321350616?text=Merhaba,%20Fizyotim%20klinik%20y%C3%B6netim%20sistemi%20hakk%C4%B1nda%20demo%20ve%20bilgi%20almak%20istiyorum."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-colors shadow-2xs"
                >
                  <MessageSquare size={14} />
                  <span>WhatsApp'tan Anında Yazın</span>
                  <ArrowRight size={13} className="text-slate-400" />
                </a>
              </div>

              {/* Kurumsal E-posta Kartı */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Kurumsal İletişim</span>
                <h4 className="font-bold text-slate-900 text-[14px] mb-1">E-Posta &amp; Teklif</h4>
                <p className="text-slate-500 text-[12px] leading-relaxed mb-3">
                  Resmi teklif, çok şubeli klinikler veya özel entegrasyon talepleriniz için:
                </p>
                <a
                  href="mailto:fatalsoft.inc@gmail.com?subject=Fizyotim%20Demo%20ve%20Kurumsal%20Teklif"
                  className="inline-flex items-center gap-1.5 text-slate-900 font-mono text-[12px] font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg transition-colors"
                >
                  <Mail size={13} className="text-slate-500" />
                  <span>fatalsoft.inc@gmail.com</span>
                </a>
              </div>

              {/* 3 Adımda Demo Süreci */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-[12px] space-y-3">
                <span className="font-bold text-slate-900 text-[13px] block">Demo Süreci Nasıl İşler?</span>
                <div className="space-y-2.5 text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-slate-900 text-[12px] bg-white border border-slate-200 w-5 h-5 rounded flex items-center justify-center shrink-0">1</span>
                    <p>Yetkili bilgilerinizi formdan iletin veya WhatsApp'tan yazın.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-slate-900 text-[12px] bg-white border border-slate-200 w-5 h-5 rounded flex items-center justify-center shrink-0">2</span>
                    <p>Kliniğinize özel panel şifresi ve rezervasyon linkiniz 5 dakikada oluşturulsun.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-slate-900 text-[12px] bg-white border border-slate-200 w-5 h-5 rounded flex items-center justify-center shrink-0">3</span>
                    <p>14 gün boyunca ekibinizle ve hastalarınızla sınırsız test edin.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Sağ Kolon: Form */}
            <div className="lg:col-span-7">
              <div className="p-7 sm:p-9 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-900 mb-1">Kliniğiniz İçin Demo Hesabı Açın</h3>
                  <p className="text-[13px] text-slate-500">14 gün boyunca kredi kartı olmadan tam yetkiyle kullanın.</p>
                </div>

                {demoSuccess ? (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-xl font-bold">
                      ✓
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Talebiniz Başarıyla Alındı</h3>
                    <p className="text-[13px] text-slate-600 max-w-md mx-auto leading-relaxed">
                      Sayın <strong>{demoForm.full_name}</strong>, talebiniz ekibimize iletildi. En kısa sürede <span className="font-mono font-semibold text-slate-900">{demoForm.phone}</span> numaranız üzerinden kliniğinize özel giriş bilgileriyle iletişime geçeceğiz.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoSuccess(false);
                        setDemoForm({
                          full_name: '',
                          clinic_name: '',
                          phone: '',
                          email: '',
                          city: '',
                          plan: '14-gun-deneme',
                          notes: ''
                        });
                      }}
                      className="mt-2 h-10 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-[12px] font-semibold transition-colors cursor-pointer"
                    >
                      Yeni Talep Gönder
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleDemoSubmit} className="space-y-4">
                    
                    {/* Seçenek Seçimi */}
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                        İlgilendiğiniz Plan *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setDemoForm({ ...demoForm, plan: '14-gun-deneme' })}
                          className={`p-3 rounded-xl border text-[12px] text-left transition-all cursor-pointer ${
                            demoForm.plan === '14-gun-deneme'
                              ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="block font-bold">14 Gün Deneme</span>
                          <span className="text-[10px] opacity-70">Ücretsiz Başlangıç</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDemoForm({ ...demoForm, plan: 'yillik-kampanya' })}
                          className={`p-3 rounded-xl border text-[12px] text-left transition-all cursor-pointer ${
                            demoForm.plan === 'yillik-kampanya'
                              ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="block font-bold">Yıllık Plan</span>
                          <span className="text-[10px] opacity-70">%33 Tasarruf</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDemoForm({ ...demoForm, plan: 'ozel-teklif' })}
                          className={`p-3 rounded-xl border text-[12px] text-left transition-all cursor-pointer ${
                            demoForm.plan === 'ozel-teklif'
                              ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="block font-bold">Özel Teklif</span>
                          <span className="text-[10px] opacity-70">Çoklu Şube</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                          Yetkili Ad Soyad *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: Fatih Apaydın"
                          value={demoForm.full_name}
                          onChange={(e) => setDemoForm({ ...demoForm, full_name: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-[13px] outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                          Klinik / Merkez Adı *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: Yaşam Fizyoterapi"
                          value={demoForm.clinic_name}
                          onChange={(e) => setDemoForm({ ...demoForm, clinic_name: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-[13px] outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                          Telefon Numarası *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="05XXXXXXXXX"
                          value={demoForm.phone}
                          onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-[13px] font-mono outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                          E-posta Adresi
                        </label>
                        <input
                          type="email"
                          placeholder="ornek@klinik.com"
                          value={demoForm.email}
                          onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-[13px] outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                        Bulunduğunuz Şehir
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: İstanbul, Kadıköy"
                        value={demoForm.city}
                        onChange={(e) => setDemoForm({ ...demoForm, city: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-[13px] outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                        Not / Belirtmek İstediğiniz Detay (Opsiyonel)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Örn: 2 terapistimiz var, eski hasta verilerini aktarmak istiyoruz..."
                        value={demoForm.notes}
                        onChange={(e) => setDemoForm({ ...demoForm, notes: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-[13px] outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={demoSubmitting}
                      className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[13px] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                      {demoSubmitting ? 'Talebiniz İletiliyor...' : '14 Günlük Demo Talebini Gönder'}
                      {!demoSubmitting && <ArrowRight size={14} />}
                    </button>

                    <p className="text-[11px] text-slate-400 text-center pt-1">
                      🔒 Bilgileriniz 6698 sayılı KVKK kapsamında güvence altındadır. Asla spam gönderilmez.
                    </p>
                  </form>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 7. FOOTER ────────────────────────────────────────────── */}
      <footer className="bg-white text-slate-500 border-t border-slate-200 py-10 text-[12px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            
            <div>
              <span className="text-slate-900 font-semibold">Fizyotim</span> — Klinik Yönetim &amp; Randevu Altyapısı
            </div>

            <div className="flex items-center gap-6">
              <a href="https://randevu.fizyotim.com/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">
                randevu.fizyotim.com
              </a>
              <button onClick={() => scrollToSection('features')} className="hover:text-slate-900 cursor-pointer">
                Özellikler
              </button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-slate-900 cursor-pointer">
                Fiyatlandırma
              </button>
              <button onClick={() => setShowLoginModal(true)} className="hover:text-slate-900 cursor-pointer font-medium text-slate-900">
                Klinik Girişi
              </button>
            </div>

            <p className="text-slate-400">
              © 2026 FatalSoft Bilişim Teknolojileri. Tüm hakları saklıdır.
            </p>

          </div>
        </div>
      </footer>

      {/* ─── 8. KLİNİK GİRİŞİ MODALI (CLEAN, PROFESSIONAL) ────────── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setShowLoginModal(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-7 z-10 animate-in zoom-in-95 duration-150 border border-slate-200">
            
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Klinik Girişi</span>
              <h2 className="text-xl font-bold text-slate-900">Hesabınıza Giriş Yapın</h2>
              <p className="text-[13px] text-slate-500 mt-1">
                Klinik paneline erişmek için bilgilerinizi giriniz.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Klinik E-Posta
                </label>
                <input
                  type="email"
                  required
                  placeholder="ornek@fizyotim.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 text-[13px] outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Giriş Şifresi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 pl-3 pr-9 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 text-[13px] outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-[13px] transition-colors cursor-pointer disabled:opacity-50 mt-1"
              >
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={triggerDemoLogin}
                disabled={loading}
                className="w-full h-9 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12px] font-medium transition-colors cursor-pointer"
              >
                Demo Klinik Girişi
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
