import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, Users, Calendar, Wallet, ShieldCheck, 
  Sparkles, CheckCircle2, XCircle, AlertCircle, Clock, 
  Phone, Mail, MapPin, Key, Plus, RefreshCw, Trash2, 
  ExternalLink, Search, Filter, LogOut, ArrowRight, 
  Send, MessageSquare, Check, X, ShieldAlert, ArrowUpRight
} from 'lucide-react';
import { API_URL } from '../lib/api';

export default function SuperAdmin() {
  // Auth State
  const [token, setToken] = useState(() => localStorage.getItem('fizyotim_superadmin_token') || '');
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fizyotim_superadmin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // App Tabs
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'clinics' | 'demos' | 'announcements'

  // Data States
  const [stats, setStats] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [demos, setDemos] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals & Action States
  const [showAddClinicModal, setShowAddClinicModal] = useState(false);
  const [newClinicForm, setNewClinicForm] = useState({
    name: '',
    owner_name: '',
    phone: '',
    email: '',
    password: '',
    plan: 'standart',
    status: 'aktif',
    city: 'İstanbul',
    district: 'Kadıköy',
    theme_color: '#059669'
  });
  const [modalLoading, setModalLoading] = useState(false);

  // Password Reset Modal
  const [resetModal, setResetModal] = useState({ open: false, clinicId: null, clinicName: '', newPassword: '' });

  // Convert Success Banner
  const [conversionResult, setConversionResult] = useState(null);

  // New Announcement Form
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'info' });
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);

  // Axios config with superadmin headers
  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
      'x-superadmin-key': token
    }
  });

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await axios.post(`${API_URL}/superadmin/login`, {
        email: loginEmail,
        password: loginPassword
      });

      if (res.data?.success) {
        const authToken = res.data.token;
        const user = res.data.superadmin;
        setToken(authToken);
        setAdminUser(user);
        localStorage.setItem('fizyotim_superadmin_token', authToken);
        localStorage.setItem('fizyotim_superadmin_user', JSON.stringify(user));
      }
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setAdminUser(null);
    localStorage.removeItem('fizyotim_superadmin_token');
    localStorage.removeItem('fizyotim_superadmin_user');
  };

  // Fetch All Platform Data
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, clinicsRes, demosRes] = await Promise.all([
        axios.get(`${API_URL}/superadmin/stats`, getAuthHeaders()).catch(() => ({ data: null })),
        axios.get(`${API_URL}/superadmin/clinics`, getAuthHeaders()).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/superadmin/demo-requests`, getAuthHeaders()).catch(() => ({ data: [] }))
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (clinicsRes?.data) setClinics(clinicsRes.data);
      if (demosRes?.data) setDemos(demosRes.data);

      // Duyuruları çek
      const annRes = await axios.get(`${API_URL}/announcements`).catch(() => ({ data: [] }));
      if (annRes?.data) setAnnouncements(annRes.data);
    } catch (err) {
      console.error("Superadmin veri çekme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Status Change
  const handleStatusChange = async (clinicId, currentStatus) => {
    const nextStatus = currentStatus === 'aktif' ? 'pasif' : 'aktif';
    try {
      await axios.put(`${API_URL}/superadmin/clinics/${clinicId}/status`, { status: nextStatus }, getAuthHeaders());
      fetchData();
    } catch (err) {
      alert("Durum güncellenemedi: " + (err.response?.data?.error || err.message));
    }
  };

  // Plan Change
  const handlePlanChange = async (clinicId, newPlan) => {
    try {
      await axios.put(`${API_URL}/superadmin/clinics/${clinicId}/plan`, { plan: newPlan }, getAuthHeaders());
      fetchData();
    } catch (err) {
      alert("Plan güncellenemedi: " + (err.response?.data?.error || err.message));
    }
  };

  // Reset Password Submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetModal.newPassword) return;

    try {
      await axios.put(
        `${API_URL}/superadmin/clinics/${resetModal.clinicId}/reset-password`, 
        { new_password: resetModal.newPassword }, 
        getAuthHeaders()
      );
      alert(`Şifre başarıyla güncellendi! Yeni şifre: ${resetModal.newPassword}`);
      setResetModal({ open: false, clinicId: null, clinicName: '', newPassword: '' });
      fetchData();
    } catch (err) {
      alert("Şifre sıfırlanamadı: " + (err.response?.data?.error || err.message));
    }
  };

  // Delete Clinic
  const handleDeleteClinic = async (clinicId, name) => {
    if (!window.confirm(`DİKKAT: "${name}" kliniğini ve bağlı tüm hasta, seans ve personel verilerini kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/superadmin/clinics/${clinicId}`, getAuthHeaders());
      fetchData();
    } catch (err) {
      alert("Klinik silinemedi: " + (err.response?.data?.error || err.message));
    }
  };

  // Add Clinic Submit
  const handleAddClinicSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      await axios.post(`${API_URL}/superadmin/clinics`, newClinicForm, getAuthHeaders());
      setShowAddClinicModal(false);
      setNewClinicForm({
        name: '',
        owner_name: '',
        phone: '',
        email: '',
        password: '',
        plan: 'standart',
        status: 'aktif',
        city: 'İstanbul',
        district: 'Kadıköy',
        theme_color: '#059669'
      });
      fetchData();
      alert("Yeni klinik başarıyla oluşturuldu!");
    } catch (err) {
      alert("Klinik eklenemedi: " + (err.response?.data?.error || err.message));
    } finally {
      setModalLoading(false);
    }
  };

  // Convert Demo Request to Live Clinic
  const handleConvertDemo = async (demoId) => {
    if (!window.confirm("Bu demo başvurusunu otomatik olarak sisteme yeni bir klinik olarak eklemek istiyor musunuz?")) {
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/superadmin/demo-requests/${demoId}/convert`, {}, getAuthHeaders());
      if (res.data?.success) {
        setConversionResult(res.data);
        fetchData();
      }
    } catch (err) {
      alert("Dönüştürme başarısız: " + (err.response?.data?.error || err.message));
    }
  };

  // Delete Demo
  const handleDeleteDemo = async (demoId) => {
    if (!window.confirm("Bu demo başvurusunu silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`${API_URL}/superadmin/demo-requests/${demoId}`, getAuthHeaders());
      fetchData();
    } catch (err) {
      alert("Başvuru silinemedi.");
    }
  };

  // Create Announcement
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.message) return;
    setAnnouncementSubmitting(true);

    try {
      await axios.post(`${API_URL}/superadmin/announcements`, newAnnouncement, getAuthHeaders());
      setNewAnnouncement({ title: '', message: '', type: 'info' });
      fetchData();
      alert("Sistem duyurusu tüm kliniklerin paneline anında yayınlandı!");
    } catch (err) {
      alert("Duyuru yayınlanamadı: " + (err.response?.data?.error || err.message));
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Bu duyuruyu yayından kaldırmak istiyor musunuz?")) return;
    try {
      await axios.delete(`${API_URL}/superadmin/announcements/${id}`, getAuthHeaders());
      fetchData();
    } catch (err) {
      alert("Duyuru silinemedi.");
    }
  };

  // Filtered Clinics
  const filteredClinics = clinics.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.owner_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ─── 1. GİRİŞ EKRANI (AUTH YOKSA) ───────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-[Inter] flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 mb-4">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">fizyotim.com</h1>
            <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mt-1">Platform Superadmin Portalı</p>
            <p className="text-xs text-slate-400 mt-2">Bu alana yalnızca platform yöneticisi erişebilir.</p>
          </div>

          {loginError && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Superadmin E-Posta</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@fizyotim.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Yönetici Şifresi</label>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loginLoading ? 'Yetki Doğrulanıyor...' : 'Superadmin Girişi Yap'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Kolay Test Doldurucu Buton */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => {
                setLoginEmail('admin@fizyotim.com');
                setLoginPassword('fizyotim2026!');
              }}
              className="text-[11px] text-slate-400 hover:text-emerald-400 transition underline underline-offset-4"
            >
              Varsayılan Giriş Bilgilerini Doldur (admin@fizyotim.com)
            </button>
            <div className="mt-3">
              <a href="/" className="text-[11px] text-slate-500 hover:text-slate-300 transition">
                ← fizyotim.com Ana Sayfasına Dön
              </a>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ─── 2. SUPERADMIN DASHBOARD (ANA PANEL) ──────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-[Inter] antialiased">
      
      {/* ÜST HEADER */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md">
                FT
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-base tracking-tight">fizyotim.com</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Superadmin
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Merkezi SaaS & Klinik Operasyon Yönetimi</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              title="Yenile"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl transition text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Verileri Yenile</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl transition text-xs flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Canlı Siteyi Gör</span>
            </a>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            <div className="flex items-center gap-2 text-right">
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white">{adminUser?.full_name || 'Fatih Apaydın'}</div>
                <div className="text-[10px] text-emerald-400 font-mono">{adminUser?.email || 'admin@fizyotim.com'}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Çıkış Yap"
                className="p-2 text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 rounded-xl transition"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* SEKME NAVİGASYONU */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={15} /> Genel Bakış & Büyüme
          </button>
          <button
            onClick={() => setActiveTab('clinics')}
            className={`px-4 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'clinics'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 size={15} /> Klinikler ({clinics.length})
          </button>
          <button
            onClick={() => setActiveTab('demos')}
            className={`px-4 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'demos'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={15} /> Demo Başvuruları ({demos.length})
            {demos.filter(d => !d.status || d.status === 'bekliyor').length > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full">
                {demos.filter(d => !d.status || d.status === 'bekliyor').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'announcements'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={15} /> Sistem Duyuruları
          </button>
        </div>
      </header>

      {/* BAŞARILI DÖNÜŞTÜRME BİLGİ KARTI */}
      {conversionResult && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="p-5 rounded-2xl bg-emerald-950/80 border border-emerald-600/80 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <h3 className="font-bold text-sm text-emerald-300">{conversionResult.message}</h3>
              </div>
              <p className="text-xs text-emerald-100/80 mt-1">
                Klinik: <strong>{conversionResult.clinic?.name}</strong> | E-posta: <code className="bg-emerald-900/60 px-1.5 py-0.5 rounded font-mono">{conversionResult.credentials?.email}</code> | Geçici Şifre: <code className="bg-emerald-900/60 px-1.5 py-0.5 rounded font-mono font-bold text-amber-300">{conversionResult.credentials?.password}</code>
              </p>
            </div>
            <button
              onClick={() => setConversionResult(null)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-xs font-bold rounded-lg transition"
            >
              Tamamdır
            </button>
          </div>
        </div>
      )}

      {/* ANA İÇERİK */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ─── TAB 1: GENEL BAKIŞ & BÜYÜME METRİKLERİ ────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI KARTLARI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Toplam Klinik */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Toplam Kayıtlı Klinik</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Building2 size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-white mt-3">{stats?.clinics?.total || clinics.length}</div>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                  <span className="text-emerald-400 font-bold">{stats?.clinics?.active || clinics.filter(c=>c.status==='aktif').length} Aktif</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">{stats?.clinics?.trial || clinics.filter(c=>c.status==='deneme').length} Deneme</span>
                  <span>•</span>
                  <span className="text-slate-500">{stats?.clinics?.passive || clinics.filter(c=>c.status==='pasif').length} Pasif</span>
                </div>
              </div>

              {/* Tahmini MRR (Aylık Gelir) */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Tahmini Aylık Ciro (MRR)</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Wallet size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-white mt-3">
                  {(stats?.estimatedMRR || 0).toLocaleString('tr-TR')} ₺
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Aktif SaaS abonelik paketlerinden</p>
              </div>

              {/* Toplam Fizyoterapist & Uzman */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Aktif Terapist & Ekip</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Users size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-white mt-3">{stats?.staffCount || 0}</div>
                <p className="text-[11px] text-slate-400 mt-2">Kliniklerin kayıtlı uzmanları</p>
              </div>

              {/* Bekleyen Demo Başvuruları */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Bekleyen Demo Talepleri</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-white mt-3">{stats?.demos?.pending || demos.filter(d=>!d.status||d.status==='bekliyor').length}</div>
                <p className="text-[11px] text-amber-400 mt-2 font-medium">Görüşme bekleyen klinikler</p>
              </div>

            </div>

            {/* HIZLI AKSİYONLAR VE CANLIYA ALMA DURUMU */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Canlıya Alma & Domain Durumu */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">fizyotim.com Canlıya Alma Mimarisi</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Prod Hazır
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Root Domain</div>
                    <div className="text-xs font-bold text-white mt-1">fizyotim.com</div>
                    <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                      <Check size={12} /> Frontend (Vercel)
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Backend API</div>
                    <div className="text-xs font-bold text-white mt-1">api.fizyotim.com</div>
                    <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                      <Check size={12} /> Express (Render/VPS)
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Veritabanı</div>
                    <div className="text-xs font-bold text-white mt-1">Supabase Cloud</div>
                    <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                      <Check size={12} /> Aktif & SSL Korumalı
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowAddClinicModal(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <Plus size={15} /> Yeni Klinik Ekle
                  </button>
                  <button
                    onClick={() => setActiveTab('demos')}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Users size={15} /> Demo Başvurularını İncele
                  </button>
                </div>
              </div>

              {/* Son Gelen Demo Başvurusu */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-xs text-slate-300">En Son Demo Başvurusu</h3>
                    <span className="text-[10px] text-emerald-400">Yeni</span>
                  </div>

                  {demos.length > 0 ? (
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <div className="font-bold text-sm text-white">{demos[0].full_name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Building2 size={13} /> {demos[0].clinic_name || 'Belirtilmedi'}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Phone size={13} /> {demos[0].phone}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-semibold">
                        Paket: {demos[0].plan || '14 Günlük Deneme'}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-6 text-center">Henüz başvuru yok.</p>
                  )}
                </div>

                {demos.length > 0 && (
                  <button
                    onClick={() => setActiveTab('demos')}
                    className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1"
                  >
                    Tüm Başvuruları Gör <ArrowRight size={14} />
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ─── TAB 2: KLİNİKLER LİSTESİ & YÖNETİMİ ────────────────────── */}
        {activeTab === 'clinics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white">Kayıtlı Klinikler</h2>
                <p className="text-xs text-slate-400">Sistemdeki tüm kliniklerin hesap durumları, paketleri ve şifreleri</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddClinicModal(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Plus size={15} /> Yeni Klinik Ekle
                </button>
              </div>
            </div>

            {/* ARAMA VE FİLTRE */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Klinik adı, sahip, e-posta veya şehir ara..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="aktif">Yalnızca Aktif</option>
                  <option value="deneme">Yalnızca Deneme</option>
                  <option value="pasif">Yalnızca Pasif</option>
                </select>
              </div>
            </div>

            {/* TABLO */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="p-4">Klinik & Konum</th>
                      <th className="p-4">Yönetici & İletişim</th>
                      <th className="p-4">Paket</th>
                      <th className="p-4">Durum</th>
                      <th className="p-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredClinics.map((clinic) => (
                      <tr key={clinic.id} className="hover:bg-slate-850/50 transition">
                        
                        {/* Klinik Adı ve Slug */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ backgroundColor: clinic.theme_color || '#059669' }}
                            >
                              {clinic.name?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{clinic.name}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin size={11} className="text-slate-500" />
                                {clinic.city || 'İstanbul'} / {clinic.district || 'Kadıköy'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Sahibi & İletişim */}
                        <td className="p-4">
                          <div className="font-medium text-slate-200">{clinic.owner_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{clinic.email}</div>
                          <div className="text-[11px] text-slate-500">{clinic.phone}</div>
                        </td>

                        {/* Abonelik Planı */}
                        <td className="p-4">
                          <select
                            value={clinic.plan || 'standart'}
                            onChange={(e) => handlePlanChange(clinic.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="standart">Standart (1.500₺)</option>
                            <option value="premium">Premium (3.500₺)</option>
                            <option value="kurumsal">Kurumsal (6.000₺)</option>
                          </select>
                        </td>

                        {/* Durum Toggle */}
                        <td className="p-4">
                          <button
                            onClick={() => handleStatusChange(clinic.id, clinic.status)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider transition ${
                              clinic.status === 'aktif'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                : clinic.status === 'deneme'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                            }`}
                          >
                            {clinic.status?.toUpperCase() || 'AKTİF'}
                          </button>
                        </td>

                        {/* Butonlar */}
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          {/* Şifre Sıfırla */}
                          <button
                            onClick={() => setResetModal({ open: true, clinicId: clinic.id, clinicName: clinic.name, newPassword: '' })}
                            title="Şifre Sıfırla"
                            className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700/80 rounded-lg transition"
                          >
                            <Key size={14} />
                          </button>

                          {/* Hasta Portalı */}
                          <a
                            href={`/portal?clinic=${clinic.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Hasta Portalını Aç"
                            className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700/80 rounded-lg transition inline-block"
                          >
                            <ExternalLink size={14} />
                          </a>

                          {/* Sil */}
                          <button
                            onClick={() => handleDeleteClinic(clinic.id, clinic.name)}
                            title="Kliniği Sil"
                            className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700/80 rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: DEMO BAŞVURULARI & DÖNÜŞTÜRÜCÜ ─────────────────── */}
        {activeTab === 'demos' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-white">Gelen Demo Başvuruları (Satış Hunisi)</h2>
              <p className="text-xs text-slate-400">fizyotim.com tanıtım sayfasından başvuru yapan fizyoterapistler ve klinikler</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {demos.map((demo) => (
                <div key={demo.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        demo.status === 'onaylandi' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {demo.status ? demo.status.toUpperCase() : 'BEKLİYOR'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(demo.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-white mt-3">{demo.full_name}</h3>
                    <p className="text-xs font-semibold text-emerald-400">{demo.clinic_name || 'Klinik Adı Yok'}</p>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-500" />
                        <a href={`tel:${demo.phone}`} className="hover:text-emerald-400 font-mono underline">
                          {demo.phone}
                        </a>
                      </div>
                      {demo.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-slate-500" />
                          <span className="font-mono text-[11px] truncate">{demo.email}</span>
                        </div>
                      )}
                      {demo.city && (
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-slate-500" />
                          <span>{demo.city}</span>
                        </div>
                      )}
                    </div>

                    {demo.notes && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 italic">
                        "{demo.notes}"
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={`https://wa.me/90${demo.phone?.replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent('Merhaba, Fizyotim klinik yönetim sistemi demo başvurunuz için iletişime geçiyorum.')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-700/60 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <MessageSquare size={13} /> WhatsApp
                    </a>

                    {demo.status !== 'onaylandi' && (
                      <button
                        onClick={() => handleConvertDemo(demo.id)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-md shadow-emerald-500/20"
                      >
                        <Sparkles size={13} /> Kliniği Aç
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteDemo(demo.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition"
                      title="Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {demos.length === 0 && (
                <div className="col-span-full p-12 text-center text-slate-500 text-xs">
                  Henüz gelen bir demo başvurusu bulunmamaktadır.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: SİSTEM DUYURULARI (ANNOUNCEMENTS) ────────────────── */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-white">Tüm Klinikler İçin Sistem Duyuruları</h2>
              <p className="text-xs text-slate-400">Buradan yayınlayacağınız duyurular anında tüm kliniklerin panellerinde üst bildirim bandı olarak görünür.</p>
            </div>

            {/* Yeni Duyuru Formu */}
            <form onSubmit={handleCreateAnnouncement} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">Yeni Duyuru Yayınla</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duyuru Başlığı</label>
                  <input
                    type="text"
                    required
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                    placeholder="Örn: 🎉 Fizyotim 2.0 Güncellemesi Yayında!"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duyuru Türü</label>
                  <select
                    value={newAnnouncement.type}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, type: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="campaign">Kampanya (Mor)</option>
                    <option value="info">Bilgi (Mavi)</option>
                    <option value="warning">Uyarı (Sarı)</option>
                    <option value="success">Başarı (Yeşil)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mesaj İçeriği</label>
                <textarea
                  required
                  rows={2}
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                  placeholder="Klinik panellerinde görünecek detaylı mesaj metni..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={announcementSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  <Send size={14} /> Duyuruyu Yayına Al
                </button>
              </div>
            </form>

            {/* Yayındaki Duyurular Listesi */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-400">Aktif Yayındaki Duyurular</h3>
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{ann.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                        {ann.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{ann.message}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition"
                    title="Duyuruyu Kaldır"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ─── 3. YENİ KLİNİK EKLEME MODALI ──────────────────────────────── */}
      {showAddClinicModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus size={16} className="text-emerald-400" /> Yeni Klinik Tanımla
              </h3>
              <button onClick={() => setShowAddClinicModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddClinicSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Klinik Adı *</label>
                <input
                  type="text"
                  required
                  value={newClinicForm.name}
                  onChange={(e) => setNewClinicForm({...newClinicForm, name: e.target.value})}
                  placeholder="Örn: Kadıköy Manuel Terapi Merkezi"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Klinik Sahibi / Baş Fzt. *</label>
                  <input
                    type="text"
                    required
                    value={newClinicForm.owner_name}
                    onChange={(e) => setNewClinicForm({...newClinicForm, owner_name: e.target.value})}
                    placeholder="Uzm. Fzt. Fatih Apaydın"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Telefon Numarası</label>
                  <input
                    type="text"
                    value={newClinicForm.phone}
                    onChange={(e) => setNewClinicForm({...newClinicForm, phone: e.target.value})}
                    placeholder="0555 555 55 55"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Giriş E-Postası *</label>
                  <input
                    type="email"
                    required
                    value={newClinicForm.email}
                    onChange={(e) => setNewClinicForm({...newClinicForm, email: e.target.value})}
                    placeholder="klinik@fizyotim.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Giriş Şifresi *</label>
                  <input
                    type="text"
                    required
                    value={newClinicForm.password}
                    onChange={(e) => setNewClinicForm({...newClinicForm, password: e.target.value})}
                    placeholder="fizyo123"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Şehir</label>
                  <input
                    type="text"
                    value={newClinicForm.city}
                    onChange={(e) => setNewClinicForm({...newClinicForm, city: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">İlçe</label>
                  <input
                    type="text"
                    value={newClinicForm.district}
                    onChange={(e) => setNewClinicForm({...newClinicForm, district: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Abonelik Planı</label>
                  <select
                    value={newClinicForm.plan}
                    onChange={(e) => setNewClinicForm({...newClinicForm, plan: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="standart">Standart (1.500₺)</option>
                    <option value="premium">Premium (3.500₺)</option>
                    <option value="kurumsal">Kurumsal (6.000₺)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Hesap Durumu</label>
                  <select
                    value={newClinicForm.status}
                    onChange={(e) => setNewClinicForm({...newClinicForm, status: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="deneme">14 Günlük Deneme</option>
                    <option value="pasif">Pasif</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClinicModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl transition disabled:opacity-50"
                >
                  {modalLoading ? 'Oluşturuluyor...' : 'Kliniği Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 4. ŞİFRE SIFIRLAMA MODALI ─────────────────────────────────── */}
      {resetModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Key size={16} className="text-amber-400" /> Şifre Sıfırla
              </h3>
              <button onClick={() => setResetModal({ open: false, clinicId: null, clinicName: '', newPassword: '' })} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <p className="text-slate-400">
                <strong>{resetModal.clinicName}</strong> kliniği için yeni giriş şifresi belirleyin:
              </p>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Yeni Şifre</label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={resetModal.newPassword}
                  onChange={(e) => setResetModal({...resetModal, newPassword: e.target.value})}
                  placeholder="Yeni şifreyi giriniz..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetModal({ open: false, clinicId: null, clinicName: '', newPassword: '' })}
                  className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition"
                >
                  Şifreyi Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
