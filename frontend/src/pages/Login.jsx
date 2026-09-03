import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { API_URL } from '../lib/api';
import { 
  Activity, Mail, Lock, Loader2, LogIn, Sparkles, Building2, 
  Eye, EyeOff, CheckCircle2, Shield, Calendar, Users, MessageSquareText,
  ArrowRight, ExternalLink, QrCode, Phone, Check, Star, Clock, 
  ChevronRight, ArrowUpRight, Zap, ShieldCheck, HeartPulse, X, Tag
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
      const { data: clinic, error: clinicErr } = await supabase
        .from('clinics')
        .select('*')
        .eq('email', loginEmail.trim().toLowerCase())
        .eq('password', loginPass)
        .maybeSingle();

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
    <div className="min-h-screen bg-[#fafcfb] text-slate-800 font-[Inter] antialiased flex flex-col justify-between selection:bg-emerald-500 selection:text-white">

      {/* ─── 1. NAVBAR (STICKY HEADER) ────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white shrink-0">
              <Activity size={22} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-[17px] sm:text-[19px] font-black tracking-tight block leading-tight text-gray-900">
                Fizyotim
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 tracking-wider uppercase block">
                Klinik Yönetim Sistemi
              </span>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-[13px] font-semibold text-gray-600">
            <button 
              onClick={() => scrollToSection('features')}
              className="px-3 py-1.5 rounded-lg hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Özellikler
            </button>
            <button 
              onClick={() => scrollToSection('patient-portal')}
              className="px-3 py-1.5 rounded-lg hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <HeartPulse size={15} className="text-teal-600" />
              <span>Hasta Randevu Portalı</span>
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="px-3 py-1.5 rounded-lg hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Fiyatlandırma
            </button>
            <button 
              onClick={() => scrollToSection('contact-section')}
              className="px-3 py-1.5 rounded-lg hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              İletişim &amp; Demo
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct Patient Portal Link */}
            <a
              href="https://randevu.fizyotim.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-teal-200 bg-teal-50/80 hover:bg-teal-100/80 text-teal-800 text-[12px] font-bold transition-all shadow-2xs"
              title="Hasta Randevu Portalını Canlı İncele"
            >
              <span>randevu.fizyotim.com</span>
              <ExternalLink size={13} className="text-teal-600" />
            </a>

            {/* Login Button */}
            <button
              onClick={() => setShowLoginModal(true)}
              className="h-10 px-4 sm:px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-[12px] sm:text-[13px] font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <LogIn size={15} />
              <span>Klinik Girişi</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION (HIGH CONVERTING ADS LANDING) ────────── */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden border-b border-gray-100 bg-gradient-to-b from-teal-50/50 via-white to-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] sm:text-[12px] font-bold mb-6 shadow-2xs">
              <Sparkles size={14} className="text-emerald-600" />
              <span>Fizyoterapi ve Manuel Terapi Klinikleri İçin #1 SaaS Yazılımı</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.15] mb-6">
              Kliniğinizi <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">Akıllı Takvim</span>, Otomatik WhatsApp ve Online Randevuyla Büyütün.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal mb-8">
              Randevuları tek tıkla organize edin, no-show (gelmeme) oranlarını %75 düşürün, hasta takibini ve tahsilatları eksiksiz yönetin. Kredi kartı gerekmeden 14 gün ücretsiz deneyin.
            </p>

            {/* Hero Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8">
              <button
                onClick={() => scrollToSection('contact-section')}
                className="w-full sm:w-auto h-13 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[14px] sm:text-[15px] shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>14 Gün Ücretsiz Başla</span>
                <ArrowRight size={17} />
              </button>

              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full sm:w-auto h-13 px-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 font-bold text-[14px] flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <LogIn size={17} className="text-emerald-600" />
                <span>Klinik Girişi Yap</span>
              </button>

              <a
                href="https://randevu.fizyotim.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto h-13 px-6 rounded-2xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-teal-800 font-bold text-[14px] flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <HeartPulse size={17} className="text-teal-600" />
                <span>Hasta Portalı (Canlı Demo)</span>
                <ExternalLink size={14} className="text-teal-600" />
              </a>
            </div>

            {/* Micro Trust Proofs */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> Kredi Kartı Gerekmez</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> 14 Gün Sınırsız Kullanım</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> 5 Dakikada Hızlı Kurulum</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> 81 İl Desteği</span>
            </div>
          </div>

          {/* ─── Hero UI Mockup Showcase ─── */}
          <div className="max-w-5xl mx-auto rounded-3xl bg-slate-900 p-2 sm:p-4 shadow-2xl border border-slate-800 relative">
            <div className="rounded-2xl bg-slate-950 overflow-hidden border border-slate-800/80 text-white p-4 sm:p-6">
              
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-[12px] font-mono text-slate-400 hidden sm:inline">app.fizyotim.com / dashboard</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Canlı Klinik Paneli</span>
                </div>
              </div>

              {/* Mockup Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Bugünkü Seanslar</span>
                  <span className="text-xl sm:text-2xl font-black text-white">8 Seans</span>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">● 6 Onaylandı</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Bekleyen Online Talep</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-400">2 Yeni</span>
                  <span className="text-[10px] text-amber-300 font-bold block mt-1">randevu.fizyotim.com</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Toplam Hasta</span>
                  <span className="text-xl sm:text-2xl font-black text-blue-400">142 Kayıt</span>
                  <span className="text-[10px] text-slate-400 block mt-1">KVKK Korumalı</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">WhatsApp Bildirim</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400">%100 Aktif</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">Otomatik Şablon</span>
                </div>
              </div>

              {/* Mockup Appointment Item Preview */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    AY
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Ahmet Yılmaz — Manuel Terapi (60 Dk)</h4>
                    <p className="text-[11px] text-slate-400">Bugün 14:30 • Fzt. Mehmet Demir • Salon 1</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                    WhatsApp Onayı Gönderildi
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── 3. FEATURES SECTION ──────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 bg-white border-b border-gray-100 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] sm:text-[12px] font-black tracking-widest text-emerald-600 uppercase mb-2 block">
              Eksiksiz Klinik Altyapısı
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-4">
              Bir Fizyoterapi Kliniğinin İhtiyacı Olan Her Şey Tek Ekranda.
            </h2>
            <p className="text-[14px] sm:text-[15px] text-gray-600 leading-relaxed">
              Birden fazla dağınık program, Excel dosyaları ve kağıt randevu defterleri yerine modern, senkronize bir SaaS deneyimi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Feature 1 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50/70 border border-gray-200/80 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-5 font-bold">
                <Calendar size={22} className="text-emerald-700" />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 mb-2">Akıllı Seans &amp; Terapist Takvimi</h3>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                Çoklu fizyoterapist randevularını aynı takvimde görün. Çakışma koruması ile aynı saate iki randevu verilmesini engelleyin.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50/70 border border-gray-200/80 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-5 font-bold">
                <MessageSquareText size={22} className="text-teal-700" />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 mb-2">Otomatik WhatsApp Bildirimleri</h3>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                Randevu onaylandığında veya seans saati yaklaştığında tek tıkla hastanıza profesyonel WhatsApp şablonu ve klinik konumunuzu iletin.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50/70 border border-gray-200/80 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-5 font-bold">
                <Users size={22} className="text-blue-700" />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 mb-2">Hasta Dosyası &amp; PDF Raporlama</h3>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                Hastanın tüm seans geçmişi, kalan borcu, tanı ve notları tek yerde. Tek tıkla hastaya teslim edilecek PDF seans özeti indirin.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50/70 border border-gray-200/80 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mb-5 font-bold">
                <QrCode size={22} className="text-purple-700" />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 mb-2">Danışma QR Masa Standı Üretici</h3>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                Danışma ve bekleme salonu için kliniğinizin logosuyla baskıya hazır QR standı oluşturun. Hastalar okutup anında randevu alsın.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50/70 border border-gray-200/80 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-5 font-bold">
                <Zap size={22} className="text-amber-700" />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 mb-2">Kasa, Tahsilat &amp; Finans Takibi</h3>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                Nakit, kredi kartı ve havale ödemelerini kaydedin. Kalan seans borçlarını ve kliniğinizin net cirosunu anlık takip edin.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50/70 border border-gray-200/80 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mb-5 font-bold">
                <ShieldCheck size={22} className="text-rose-700" />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 mb-2">Akıllı Kontroller &amp; KVKK Güvenliği</h3>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                Mükerrer telefon engelleme, haftalık 2 seans kotası ve hasta adı/tedavi maskeleme ile verileriniz %100 güvende.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 4. SPOTLIGHT: HASTA RANDEVU PORTALI (randevu.fizyotim.com) ─── */}
      <section id="patient-portal" className="py-16 sm:py-24 bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white scroll-mt-20 relative overflow-hidden border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[12px] font-bold">
                <HeartPulse size={15} />
                <span>Hastalarınıza Özel Canlı Randevu Sayfası</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Hastalarınız 7/24 <br className="hidden sm:inline" />
                <span className="text-teal-400">randevu.fizyotim.com</span> Üzerinden Randevu Alsın.
              </h2>

              <p className="text-[14px] sm:text-[16px] text-slate-300 leading-relaxed font-normal">
                Kliniğinize özel <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded-md">https://randevu.fizyotim.com/?clinic=klinik-adiniz</span> bağlantısını WhatsApp durumunuza, Instagram profilinize veya Google Maps açıklamanıza ekleyin.
              </p>

              <div className="space-y-3.5 pt-2 text-[13px] sm:text-[14px] text-slate-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Ad Soyad Yazmaya Gerek Yok:</strong> Hasta kayıtlı telefonunu girdiğinde sistem hastayı otomatik tanır.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>KVKK Korumalı Randevu Sorgulama:</strong> Hasta randevu durumunu gizlilik maskelemesiyle anında sorgulayabilir.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Akıllı Talep Sınırlaması:</strong> Aynı anda en fazla 2 bekleyen talep ve haftada en fazla 2 seans kotasıyla takvim kilitlenmez.</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3.5">
                <a
                  href="https://randevu.fizyotim.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto h-12 px-7 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
                >
                  <span>Canlı Hasta Portalını Test Edin</span>
                  <ExternalLink size={16} />
                </a>

                <span className="text-[12px] text-slate-400">
                  (Örnek hasta randevusu açmayı deneyebilirsiniz)
                </span>
              </div>
            </div>

            {/* Right Card / Visual */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-slate-800/80 border border-slate-700 p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                  <span className="text-[12px] font-mono text-teal-400">randevu.fizyotim.com</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    Hasta Ekranı
                  </span>
                </div>

                <div className="space-y-3 text-[12px]">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                    <span className="text-slate-400 block font-medium">1. Adım: Seans Saati Seçimi</span>
                    <p className="text-white font-bold">14:00 - 15:00 • Manuel Terapi</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                    <span className="text-slate-400 block font-medium">2. Adım: Kayıtlı Telefon</span>
                    <p className="text-white font-mono font-bold">0555 123 45 67</p>
                    <span className="text-[10px] text-emerald-400 block">✓ Sistem hastayı tanıdı: Ahmet Y.</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-center font-bold">
                    🚀 Randevu Talebi Kliniğe İletildi!
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  Kliniğiniz panelinde anında melodik çağrı zili çalar ve talep listenize düşer.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 5. PRICING SECTION ───────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24 bg-white border-b border-gray-100 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] sm:text-[12px] font-black tracking-widest text-emerald-600 uppercase mb-2 block">
              Şeffaf Fiyatlandırma
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-4">
              Gizli Maliyet Yok. Küçük veya Büyük Her Kliniğe Uygun.
            </h2>
            <p className="text-[14px] sm:text-[15px] text-gray-600 leading-relaxed">
              14 gün boyunca tüm özellikleri hiçbir kısıtlama olmadan deneyin. Memnun kalırsanız size en uygun paketle devam edin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            
            {/* Plan 1: Aylık */}
            <div className="rounded-3xl bg-white border-2 border-gray-200 p-8 flex flex-col justify-between hover:border-gray-300 transition-all shadow-sm">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Esnek Başlangıç</span>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Aylık Standart Plan</h3>
                
                <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-gray-100">
                  <span className="text-4xl font-black text-gray-900">₺250</span>
                  <span className="text-gray-500 font-medium text-sm">/ ay</span>
                </div>

                <ul className="space-y-3.5 text-[13px] text-gray-700 mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Canlı Online Randevu Takvimi</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Çoklu Terapist &amp; Yetki Yönetimi</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Otomatik WhatsApp Randevu Onayları</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Masaüstü Danışma QR Standı Üretici</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Sınırsız Hasta &amp; Seans Kaydı</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan('14-gun-deneme')}
                className="w-full h-12 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <span>14 Gün Ücretsiz Başla</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Plan 2: Yıllık Avantajlı */}
            <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-indigo-950 text-white border-2 border-indigo-500/50 p-8 flex flex-col justify-between relative shadow-2xl overflow-hidden">
              
              {/* Campaign Tag */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide shadow-md">
                %33 İNDİRİM • 4 AY HEDİYE
              </div>

              <div>
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">Lansman Kampanyası</span>
                <h3 className="text-2xl font-black text-white mb-3">Yıllık Avantajlı Plan</h3>
                
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-black text-white">₺2.000</span>
                  <span className="text-slate-400 font-medium text-sm">/ yıl</span>
                  <span className="text-xs line-through text-slate-400">₺3.000</span>
                </div>
                <p className="text-[12px] text-emerald-400 font-semibold mb-6 pb-6 border-b border-slate-800">
                  Ayda sadece ~₺166'ya denk gelir!
                </p>

                <ul className="space-y-3.5 text-[13px] text-slate-200 mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span><strong>Tüm Standart Plan Özellikleri</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span><strong>4 Ay Ücretsiz</strong> Kullanım Avantajı</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Öncelikli 7/24 Teknik &amp; Canlı Destek</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Ücretsiz Kurulum &amp; Eski Hasta Veri Aktarımı</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>1 Yıl Boyunca Fiyat Artışından Etkilenmeme</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan('yillik-kampanya')}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-[14px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <span>Kampanyadan Faydalan &amp; Başla</span>
                <ArrowRight size={16} />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 6. REKLAM DÖNÜŞÜM & İLETİŞİM / DEMO FORMU ─────────────── */}
      <section id="contact-section" className="py-16 sm:py-24 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white scroll-mt-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[12px] font-bold mb-3">
              <Sparkles size={13} />
              <span>14 Gün Koşulsuz Ücretsiz Deneme</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              Kliniğiniz İçin Demo &amp; İletişim Talebi
            </h2>
            <p className="text-[14px] text-slate-300 leading-relaxed font-normal">
              Fizyotim'i merkezinizde deneyimlemek, size özel fiyat teklifi almak veya aklınızdaki soruları iletmek için formu doldurun. Uzman danışmanımız aynı gün içinde sizinle iletişime geçsin.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
            
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-800/60 border border-slate-700/80 space-y-5">
                <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                  <Building2 size={18} className="text-emerald-400" />
                  <span>Neden Fizyotim?</span>
                </h3>

                <ul className="space-y-3.5 text-[13px] text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Dakikalar İçinde Kurulum:</strong> Kredi kartı gerekmeden hemen başlayın.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Canlı Hasta Takvimi:</strong> Hastalarınız 7/24 randevu alsın, tek tıkla onaylayın.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Otomatik WhatsApp:</strong> Hatırlatmalar ve randevu onayları hastanın cebine gitsin.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Masaüstü QR Standı:</strong> Danışma ve bekleme salonu için baskıya hazır stand üretici.</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-800/40 space-y-3">
                <h4 className="text-[14px] font-bold text-emerald-300 flex items-center gap-2">
                  <Phone size={16} />
                  <span>Hızlı Destek &amp; Doğrudan İletişim</span>
                </h4>
                <p className="text-[12px] text-emerald-100/80 leading-relaxed">
                  Form doldurmak yerine doğrudan ekibimize ulaşmak isterseniz kurumsal e-posta üzerinden de yazabilirsiniz:
                </p>
                <div className="flex flex-col gap-2 pt-1 text-[13px]">
                  <a
                    href="mailto:fatalsoft.inc@gmail.com?subject=Fizyotim%20Demo%20Talebi"
                    className="text-white hover:text-emerald-300 font-mono font-medium flex items-center gap-2 transition-colors"
                  >
                    <Mail size={14} className="text-emerald-400" />
                    <span>fatalsoft.inc@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/80 border border-slate-700 shadow-2xl backdrop-blur-md">
                {demoSuccess ? (
                  <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-white">Talebiniz Başarıyla Alındı!</h3>
                    <p className="text-[14px] text-slate-300 max-w-md mx-auto leading-relaxed">
                      Sayın <strong className="text-emerald-400">{demoForm.full_name}</strong>, talebiniz danışman ekibimize iletildi. En kısa sürede <span className="font-mono text-white">{demoForm.phone}</span> numaranızdan sizinle iletişime geçeceğiz.
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
                      className="h-10 px-5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-[12px] font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Yeni Bir Talep Gönder</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleDemoSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-300 mb-1">
                          Yetkili Ad Soyad *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: Dr. Fatih Apaydın"
                          value={demoForm.full_name}
                          onChange={(e) => setDemoForm({ ...demoForm, full_name: e.target.value })}
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-[13px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-semibold text-slate-300 mb-1">
                          Klinik / Merkez Adı *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: Yaşam Fizyoterapi Merkezi"
                          value={demoForm.clinic_name}
                          onChange={(e) => setDemoForm({ ...demoForm, clinic_name: e.target.value })}
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-[13px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-300 mb-1">
                          Telefon Numarası *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="05XXXXXXXXX"
                          value={demoForm.phone}
                          onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-[13px] font-mono outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-semibold text-slate-300 mb-1">
                          E-posta Adresi
                        </label>
                        <input
                          type="email"
                          placeholder="ornek@klinik.com"
                          value={demoForm.email}
                          onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-[13px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-slate-300 mb-1">
                        Şehir / İlçe
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: İstanbul / Kadıköy"
                        value={demoForm.city}
                        onChange={(e) => setDemoForm({ ...demoForm, city: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-[13px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-slate-300 mb-1.5">
                        İlgilendiğiniz Paket / Seçenek
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setDemoForm({ ...demoForm, plan: '14-gun-deneme' })}
                          className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all text-left cursor-pointer ${
                            demoForm.plan === '14-gun-deneme'
                              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <span className="block font-bold">14 Gün Ücretsiz Deneme</span>
                          <span className="text-[10px] font-normal opacity-80">Taahhüt yok</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDemoForm({ ...demoForm, plan: 'yillik-kampanya' })}
                          className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all text-left cursor-pointer ${
                            demoForm.plan === 'yillik-kampanya'
                              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <span className="block font-bold">Yıllık Avantajlı Plan</span>
                          <span className="text-[10px] font-normal opacity-80">%33 indirim</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDemoForm({ ...demoForm, plan: 'ozel-teklif' })}
                          className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all text-left cursor-pointer ${
                            demoForm.plan === 'ozel-teklif'
                              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <span className="block font-bold">Özel Fiyat &amp; Teklif</span>
                          <span className="text-[10px] font-normal opacity-80">Görüşme talep et</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-slate-300 mb-1">
                        Not / İhtiyaç Notu (Opsiyonel)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Kliniğinizde kaç terapist çalışıyor veya sormak istediğiniz bir soru var mı?"
                        value={demoForm.notes}
                        onChange={(e) => setDemoForm({ ...demoForm, notes: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-[13px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={demoSubmitting}
                      className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-[14px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {demoSubmitting ? (
                        <span>Gönderiliyor...</span>
                      ) : (
                        <>
                          <span>🚀 Demo &amp; Bilgi Talebini İlet</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 7. FOOTER ────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <Activity size={16} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-white font-bold text-[15px] block leading-tight">Fizyotim</span>
                <span className="text-[11px] text-slate-400 block">Klinik Yönetim &amp; Randevu Sistemi</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-[12px]">
              <a href="https://randevu.fizyotim.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                randevu.fizyotim.com
              </a>
              <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">
                Özellikler
              </button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors cursor-pointer">
                Fiyatlandırma
              </button>
              <button onClick={() => setShowLoginModal(true)} className="hover:text-emerald-400 font-bold transition-colors cursor-pointer">
                Klinik Girişi
              </button>
              <a href="mailto:fatalsoft.inc@gmail.com" className="hover:text-white transition-colors font-mono">
                fatalsoft.inc@gmail.com
              </a>
            </div>

            <p className="text-[11px] text-slate-500">
              © 2026 <strong className="text-slate-300">FatalSoft Bilişim Teknolojileri</strong>. Tüm hakları saklıdır.
            </p>

          </div>
        </div>
      </footer>

      {/* ─── 8. KLİNİK YÖNETİCİ GİRİŞİ MODALI (SEAMLESS LOGIN MODAL) ── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setShowLoginModal(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-200 border border-gray-100 max-h-[95vh] overflow-y-auto">
            
            {/* Close */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-3">
                <Building2 size={13} />
                <span>Klinik Yönetici Paneli</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Hoş Geldiniz</h2>
              <p className="text-[13px] text-gray-500 mt-1">
                Kliniğinizi yönetmek için giriş bilgilerinizi giriniz.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-start gap-2 animate-in fade-in">
                <span className="font-bold shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                  Klinik E-Posta
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="ornek@fizyotim.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                  Giriş Şifresi
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[13px] flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Giriş Yapılıyor...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Giriş Yap</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Demo Login */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hızlı Erişim</span>
                <span className="text-[11px] text-emerald-600 font-semibold">Test Hesabı</span>
              </div>
              <button
                type="button"
                onClick={triggerDemoLogin}
                disabled={loading}
                className="w-full h-10 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 text-[12px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles size={14} className="text-emerald-600" />
                <span>Tek Tıkla Demo Klinik Girişi</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
