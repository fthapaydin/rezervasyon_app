import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { 
  Wallet, Users, CalendarDays, Activity, ArrowUpRight, ArrowDownRight, 
  TrendingUp, Stethoscope, Award, FileSpreadsheet, CheckCircle2, 
  Clock, AlertTriangle, Filter, Search, UserCheck, Layers,
  ChevronRight
} from 'lucide-react';
import { exportStaffReportToExcel } from '../lib/excelExport';
import { useToast } from '../components/ui/Toast';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ea580c', '#6366f1'];

export default function Reports({ 
  clinic, 
  patients = [], 
  sessions = [], 
  payments = [], 
  treatments = [], 
  staff = [], 
  activeUser 
}) {
  const { toast } = useToast();

  // Görünüm Modu: 'overview' (Genel Analiz) veya 'staff' (Personel Performansı)
  const [activeView, setActiveView] = useState('overview');

  // Dönem Filtresi: 'all', 'this_month', 'last_month', 'last_30_days', 'last_7_days'
  const [dateRange, setDateRange] = useState('all');

  // Personel Sekmesi Filtreleri
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Tarih Filtreleme Fonksiyonu ---
  const isDateInRange = (dateStr, range) => {
    if (!dateStr || range === 'all') return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const now = new Date();

    if (range === 'this_month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (range === 'last_month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
    }
    if (range === 'last_30_days') {
      const t30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return d >= t30;
    }
    if (range === 'last_7_days') {
      const t7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= t7;
    }
    return true;
  };

  // Filtrelenmiş Veriler
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => isDateInRange(s.session_date, dateRange));
  }, [sessions, dateRange]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => isDateInRange(p.payment_date, dateRange));
  }, [payments, dateRange]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => isDateInRange(p.created_at, dateRange));
  }, [patients, dateRange]);

  // --- GENEL KLİNİK KPI'LARI ---
  const kpis = useMemo(() => {
    const totalGelir = filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalHasta = filteredPatients.length;
    const totalSeans = filteredSessions.length;
    
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPrefix = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    
    let thisMonthRev = 0, lastMonthRev = 0;
    let thisMonthSeans = 0, lastMonthSeans = 0;
    let thisMonthNewPatients = 0, lastMonthNewPatients = 0;

    payments.forEach(p => {
      const ym = p.payment_date?.substring(0, 7);
      if (ym === currentMonthPrefix) thisMonthRev += Number(p.amount);
      if (ym === lastMonthPrefix) lastMonthRev += Number(p.amount);
    });

    sessions.forEach(s => {
      const ym = s.session_date?.substring(0, 7);
      if (ym === currentMonthPrefix) thisMonthSeans++;
      if (ym === lastMonthPrefix) lastMonthSeans++;
    });

    patients.forEach(p => {
      const ym = p.created_at?.substring(0, 7);
      if (ym === currentMonthPrefix) thisMonthNewPatients++;
      if (ym === lastMonthPrefix) lastMonthNewPatients++;
    });

    const getTrend = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    return [
      { title: 'Toplam Gelir', value: `${totalGelir.toLocaleString('tr-TR')} ₺`, trend: getTrend(thisMonthRev, lastMonthRev), icon: Wallet, color: 'emerald' },
      { title: 'Hasta Sayısı', value: totalHasta, trend: getTrend(thisMonthNewPatients, lastMonthNewPatients), icon: Users, color: 'blue' },
      { title: 'Toplam Seans', value: totalSeans, trend: getTrend(thisMonthSeans, lastMonthSeans), icon: CalendarDays, color: 'amber' },
      { title: 'Ortalama Seans Değeri', value: totalSeans > 0 ? (totalGelir / totalSeans).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺' : '0 ₺', trend: null, icon: Activity, color: 'purple' },
    ];
  }, [filteredPayments, filteredPatients, filteredSessions, payments, sessions, patients]);

  // --- Aylık Gelir Tablosu ---
  const revenueData = useMemo(() => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      months[key] = { month: label, gelir: 0 };
    }
    payments.forEach(p => {
      const key = p.payment_date?.substring(0, 7);
      if (months[key]) months[key].gelir += Number(p.amount);
    });
    return Object.values(months);
  }, [payments]);

  // --- Haftalık Seans Sayısı ---
  const weeklyData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const count = sessions.filter(s => {
        const d = new Date(s.session_date);
        return d >= start && d < end;
      }).length;
      weeks.push({ hafta: `H${8 - i}`, seans: count });
    }
    return weeks;
  }, [sessions]);

  // --- Tedavi Dağılımı ---
  const treatmentData = useMemo(() => {
    const map = {};
    filteredSessions.forEach(s => {
      const name = s.treatment?.name || treatments.find(t => t.id === s.treatment_id)?.name || 'Bilinmiyor';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredSessions, treatments]);

  // --- Aylık Yeni Hasta Artışı ---
  const patientTrend = useMemo(() => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('tr-TR', { month: 'short' });
      months[key] = { ay: label, yeniHasta: 0 };
    }
    patients.forEach(p => {
      const key = p.created_at?.substring(0, 7);
      if (months[key]) months[key].yeniHasta += 1;
    });
    return Object.values(months);
  }, [patients]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 👨‍⚕️ PERSONEL BAZLI ANALİZ & KIRILIM (Staff Performance Analysis)
  // ═══════════════════════════════════════════════════════════════════════════

  const staffAnalysis = useMemo(() => {
    // 1. Her bir kayıtlı personel için seansları topla
    const list = staff.map(member => {
      const memberSessions = filteredSessions.filter(s => 
        s.therapist_id === member.id || s.therapist?.id === member.id
      );

      const total = memberSessions.length;
      const completed = memberSessions.filter(s => s.status === 'tamamlandi').length;
      const pending = memberSessions.filter(s => s.status === 'bekliyor').length;
      const postponed = memberSessions.filter(s => s.status === 'ertelendi').length;
      const cancelled = memberSessions.filter(s => s.status === 'iptal').length;
      const noShow = memberSessions.filter(s => s.status === 'gelmedi').length;
      const other = postponed + cancelled + noShow;

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const uniquePatients = new Set(memberSessions.map(s => s.patient_id).filter(Boolean)).size;

      // Hangi tedavilerden kaç adet yapmış?
      const treatmentsMap = {};
      let estimatedRevenue = 0;

      memberSessions.forEach(s => {
        const trObj = s.treatment || treatments.find(t => t.id === s.treatment_id);
        const trName = trObj?.name || 'Genel Seans';
        const trPrice = Number(trObj?.price || 0);

        estimatedRevenue += trPrice;

        if (!treatmentsMap[trName]) {
          treatmentsMap[trName] = {
            treatment_name: trName,
            treatment_id: trObj?.id,
            count: 0,
            completed: 0,
            pending: 0,
            other: 0,
            unit_price: trPrice,
            total_price: 0
          };
        }

        treatmentsMap[trName].count += 1;
        treatmentsMap[trName].total_price += trPrice;
        if (s.status === 'tamamlandi') treatmentsMap[trName].completed += 1;
        else if (s.status === 'bekliyor') treatmentsMap[trName].pending += 1;
        else treatmentsMap[trName].other += 1;
      });

      const treatmentBreakdown = Object.values(treatmentsMap).sort((a, b) => b.count - a.count);
      const topTreatment = treatmentBreakdown[0] || null;

      return {
        id: member.id,
        full_name: member.full_name,
        title: member.title || 'Fizyoterapist',
        role: member.role || 'therapist',
        color: member.color || '#3b82f6',
        total_sessions: total,
        completed_sessions: completed,
        pending_sessions: pending,
        postponed_sessions: postponed,
        cancelled_sessions: cancelled,
        no_show_sessions: noShow,
        other_sessions: other,
        completion_rate: completionRate,
        unique_patients: uniquePatients,
        estimated_revenue: estimatedRevenue,
        treatment_breakdown: treatmentBreakdown,
        top_treatment: topTreatment
      };
    });

    // 2. Terapisti atanmamış seanslar varsa onları da tespit et
    const unassignedSessions = filteredSessions.filter(s => {
      const sId = s.therapist_id || s.therapist?.id;
      return !sId || !staff.some(m => m.id === sId);
    });

    if (unassignedSessions.length > 0) {
      const total = unassignedSessions.length;
      const completed = unassignedSessions.filter(s => s.status === 'tamamlandi').length;
      const pending = unassignedSessions.filter(s => s.status === 'bekliyor').length;
      const other = total - (completed + pending);

      const treatmentsMap = {};
      let estimatedRevenue = 0;
      unassignedSessions.forEach(s => {
        const trObj = s.treatment || treatments.find(t => t.id === s.treatment_id);
        const trName = trObj?.name || 'Genel Seans';
        const trPrice = Number(trObj?.price || 0);
        estimatedRevenue += trPrice;

        if (!treatmentsMap[trName]) {
          treatmentsMap[trName] = {
            treatment_name: trName,
            treatment_id: trObj?.id,
            count: 0,
            completed: 0,
            pending: 0,
            other: 0,
            unit_price: trPrice,
            total_price: 0
          };
        }
        treatmentsMap[trName].count += 1;
        treatmentsMap[trName].total_price += trPrice;
        if (s.status === 'tamamlandi') treatmentsMap[trName].completed += 1;
        else if (s.status === 'bekliyor') treatmentsMap[trName].pending += 1;
        else treatmentsMap[trName].other += 1;
      });

      list.push({
        id: 'unassigned',
        full_name: 'Atanmamış / Genel',
        title: 'Terapist Seçilmemiş Seanslar',
        role: 'unassigned',
        color: '#94a3b8',
        total_sessions: total,
        completed_sessions: completed,
        pending_sessions: pending,
        postponed_sessions: 0,
        cancelled_sessions: 0,
        no_show_sessions: 0,
        other_sessions: other,
        completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        unique_patients: new Set(unassignedSessions.map(s => s.patient_id).filter(Boolean)).size,
        estimated_revenue: estimatedRevenue,
        treatment_breakdown: Object.values(treatmentsMap).sort((a, b) => b.count - a.count),
        top_treatment: Object.values(treatmentsMap).sort((a, b) => b.count - a.count)[0] || null
      });
    }

    // Toplam seans sayısına göre sırala
    return list.sort((a, b) => b.total_sessions - a.total_sessions);
  }, [filteredSessions, staff, treatments]);

  // Grafik Verisi: Personel Seans Karşılaştırma Çubuk Grafiği (Stacked Bar)
  const staffChartData = useMemo(() => {
    return staffAnalysis.map(member => ({
      name: member.full_name.split(' ')[0] + (member.full_name.split(' ')[1] ? ` ${member.full_name.split(' ')[1][0]}.` : ''),
      fullName: member.full_name,
      Tamamlandı: member.completed_sessions,
      Bekliyor: member.pending_sessions,
      Diğer: member.other_sessions,
      Toplam: member.total_sessions,
      color: member.color
    }));
  }, [staffAnalysis]);

  // Pasta Grafik Verisi: Personeller Arası Seans Payı
  const staffPieData = useMemo(() => {
    return staffAnalysis
      .filter(m => m.total_sessions > 0)
      .map((member, idx) => ({
        name: member.full_name,
        value: member.total_sessions,
        color: member.color || COLORS[idx % COLORS.length]
      }));
  }, [staffAnalysis]);

  // Düz Tablo Verisi (Hangi personel, hangi seanstan kaç adet yapmış)
  const flattenedTreatmentRows = useMemo(() => {
    const rows = [];
    staffAnalysis.forEach(member => {
      // Eğer belirli bir personel filtresi seçilmişse sadece onu al
      if (selectedStaffFilter !== 'all' && member.id !== selectedStaffFilter) {
        return;
      }

      if (member.treatment_breakdown.length === 0) {
        rows.push({
          staff_id: member.id,
          staff_name: member.full_name,
          staff_title: member.title,
          staff_color: member.color,
          treatment_name: 'Henüz Seans Kaydı Yok',
          total_sessions: 0,
          percentage: 0,
          completed_sessions: 0,
          pending_sessions: 0,
          cancelled_or_postponed: 0,
          estimated_revenue: 0,
          is_empty: true
        });
      } else {
        member.treatment_breakdown.forEach(tr => {
          const percentage = member.total_sessions > 0 
            ? Math.round((tr.count / member.total_sessions) * 100) 
            : 0;

          rows.push({
            staff_id: member.id,
            staff_name: member.full_name,
            staff_title: member.title,
            staff_color: member.color,
            treatment_name: tr.treatment_name,
            total_sessions: tr.count,
            percentage,
            completed_sessions: tr.completed,
            pending_sessions: tr.pending,
            cancelled_or_postponed: tr.other,
            estimated_revenue: tr.total_price,
            unit_price: tr.unit_price,
            is_empty: false
          });
        });
      }
    });

    // Arama filtresi uygula (Personel adı veya tedavi adı)
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase().trim();
    return rows.filter(r => 
      r.staff_name.toLowerCase().includes(q) || 
      r.treatment_name.toLowerCase().includes(q) ||
      r.staff_title.toLowerCase().includes(q)
    );
  }, [staffAnalysis, selectedStaffFilter, searchQuery]);

  // Excel'e Aktar
  const handleExportStaffExcel = () => {
    const success = exportStaffReportToExcel(flattenedTreatmentRows, 'fizyotim_personel_seans_raporu');
    if (success) {
      toast.success('Personel seans ve tedavi performans raporu Excel (CSV) formatında indirildi.');
    } else {
      toast.error('Dışa aktarılacak personel seans kaydı bulunamadı.');
    }
  };

  const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white text-[12px] px-3.5 py-2.5 rounded-xl shadow-xl border border-gray-700">
          <p className="font-bold text-gray-200 mb-1.5">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-xs flex items-center justify-between gap-4 py-0.5" style={{ color: entry.color || '#fff' }}>
              <span>{entry.name}:</span>
              <span className="font-bold">{prefix}{entry.value.toLocaleString('tr-TR')}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* ─── Üst Başlık, Görünüm Sekmeleri ve Dönem Filtresi ─── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Activity className="text-blue-600" size={22} />
            İstatistikler & Performans Raporları
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Klinik doluluk oranları, gelir grafikleri ve uzman fizyoterapist seans dağılımları
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Görünüm Geçiş Butonları */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeView === 'overview'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp size={14} />
              Genel Klinik Analizi
            </button>
            <button
              onClick={() => setActiveView('staff')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeView === 'staff'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope size={14} />
              Personel Performansı
            </button>
          </div>

          {/* Tarih / Dönem Seçici */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="this_month">Bu Ay</option>
              <option value="last_month">Geçen Ay</option>
              <option value="last_30_days">Son 30 Gün</option>
              <option value="last_7_days">Son 7 Gün</option>
            </select>
            <Filter size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* 1. GÖRÜNÜM: GENEL KLİNİK ANALİZİ */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Genel KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => {
              const Icon = kpi.icon;
              const isPositive = kpi.trend > 0;
              const isNeutral = kpi.trend === 0;
              
              return (
                <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-semibold text-slate-500 mb-1">{kpi.title}</p>
                      <h4 className="text-2xl font-black text-slate-900">{kpi.value}</h4>
                      
                      {kpi.trend !== null && (
                        <div className={`flex items-center gap-1 mt-2 text-[11px] font-bold ${isPositive ? 'text-emerald-600' : isNeutral ? 'text-slate-400' : 'text-rose-500'}`}>
                          {isPositive ? <ArrowUpRight size={13} /> : isNeutral ? <TrendingUp size={13} /> : <ArrowDownRight size={13} />}
                          <span>{isNeutral ? 'Değişim yok' : `%${Math.abs(kpi.trend)}`}</span>
                          <span className="text-slate-400 ml-1 font-medium">bu ay</span>
                        </div>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <Icon size={18} strokeWidth={2} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue */}
            <ChartCard title="Aylık Gelir Tablosu" subtitle="Son 6 ay içindeki kazanç trendi">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => v > 1000 ? `${v/1000}k` : v} />
                  <Tooltip content={<CustomTooltip prefix="₺" />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="gelir" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGelir)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Weekly Sessions */}
            <ChartCard title="Haftalık Seans Sayısı" subtitle="Son 8 haftadaki doluluk oranları">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hafta" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip prefix="Seans: " />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="seans" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Treatment Distribution */}
            <ChartCard title="Tedavi Dağılımı" subtitle="En çok tercih edilen tedavi türleri">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie 
                    data={treatmentData} cx="50%" cy="50%" 
                    innerRadius={60} outerRadius={90} 
                    paddingAngle={3} dataKey="value" 
                    label={({ name, percent }) => `${name} (%${(percent * 100).toFixed(0)})`} 
                    labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }} 
                    fontSize={10}
                  >
                    {treatmentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Patient Trend */}
            <ChartCard title="Yeni Hasta Kayıtları" subtitle="Aylık sisteme eklenen yeni hastalar">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={patientTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="ay" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip prefix="Kişi: " />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Line type="monotone" dataKey="yeniHasta" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* 2. GÖRÜNÜM: PERSONEL PERFORMANS & SEANS/TEDAVİ RAPORU */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeView === 'staff' && (
        <div className="space-y-6">

          {/* Personel Genel İstatistik Şeridi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-slate-500 mb-1">Toplam Uzman Kadro</p>
                  <h4 className="text-2xl font-black text-slate-900">{staff.length} Kişi</h4>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Aktif fizyoterapist & doktorlar</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserCheck size={18} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-slate-500 mb-1">Uzmanlara Atanan Seans</p>
                  <h4 className="text-2xl font-black text-slate-900">
                    {staffAnalysis.filter(s => s.id !== 'unassigned').reduce((sum, s) => sum + s.total_sessions, 0)} Seans
                  </h4>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1.5">
                    {filteredSessions.length > 0 
                      ? `%${Math.round((staffAnalysis.filter(s => s.id !== 'unassigned').reduce((sum, s) => sum + s.total_sessions, 0) / filteredSessions.length) * 100)} atama oranı`
                      : '0 seans'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CalendarDays size={18} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-slate-500 mb-1">Başarıyla Tamamlanan</p>
                  <h4 className="text-2xl font-black text-slate-900">
                    {staffAnalysis.reduce((sum, s) => sum + s.completed_sessions, 0)} Seans
                  </h4>
                  <p className="text-[11px] text-blue-600 font-semibold mt-1.5">
                    {filteredSessions.length > 0
                      ? `%${Math.round((staffAnalysis.reduce((sum, s) => sum + s.completed_sessions, 0) / filteredSessions.length) * 100)} tamamlanma oranı`
                      : '%0'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-slate-500 mb-1">En Yüksek Seans Yapan</p>
                  <h4 className="text-base font-bold text-slate-900 truncate max-w-[160px]">
                    {staffAnalysis[0]?.total_sessions > 0 ? staffAnalysis[0].full_name : 'Henüz Veri Yok'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                    {staffAnalysis[0]?.total_sessions > 0 
                      ? `${staffAnalysis[0].total_sessions} seans (${staffAnalysis[0].top_treatment?.treatment_name || ''})`
                      : 'Kayıt bulunamadı'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* ─── Grafikler: Karşılaştırmalı Çubuk & Pay Pastası ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personel Seans Karşılaştırma Grafiği (2 Kolon) */}
            <div className="lg:col-span-2">
              <ChartCard 
                title="Personellere Göre Seans Dağılımı" 
                subtitle="Tamamlanan, bekleyen ve diğer seansların uzman bazında karşılaştırması"
              >
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600 mb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> Tamamlandı
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block" /> Bekliyor
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-slate-400 inline-block" /> Ertelendi / İptal
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={staffChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="Tamamlandı" stackId="a" fill="#10b981" />
                    <Bar dataKey="Bekliyor" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="Diğer" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Seans Payı Pastası (1 Kolon) */}
            <div className="lg:col-span-1">
              <ChartCard 
                title="Personel Seans Payı (%)" 
                subtitle="Klinikteki seans hacminin uzmanlara göre oranı"
              >
                {staffPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie 
                        data={staffPieData} cx="50%" cy="50%" 
                        innerRadius={55} outerRadius={85} 
                        paddingAngle={3} dataKey="value" 
                        label={({ name, percent }) => `${name.split(' ')[0]} (%${(percent * 100).toFixed(0)})`} 
                        labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }} 
                        fontSize={10}
                      >
                        {staffPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Layers size={32} className="opacity-40 mb-2" />
                    Seçilen dönemde kayıtlı seans bulunamadı
                  </div>
                )}
              </ChartCard>
            </div>
          </div>

          {/* ─── Personel Özet Kartları Grid ─── */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope size={16} className="text-blue-600" />
                Uzman Fizyoterapist Performans Kartları
              </h3>
              <span className="text-xs text-slate-500 font-medium">{staffAnalysis.length} uzman listeleniyor</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffAnalysis.map((member) => {
                const isSelected = selectedStaffFilter === member.id;

                return (
                  <div 
                    key={member.id}
                    onClick={() => setSelectedStaffFilter(isSelected ? 'all' : member.id)}
                    className={`bg-white rounded-xl border transition-all p-5 cursor-pointer shadow-2xs relative overflow-hidden ${
                      isSelected 
                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Üst Kısım: Avatar + İsim + Rol */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0"
                          style={{ backgroundColor: member.color || '#3b82f6' }}
                        >
                          {member.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{member.full_name}</h4>
                          <p className="text-xs text-slate-500 truncate">{member.title}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                        member.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700'
                          : member.role === 'secretary'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {member.role === 'admin' ? 'Yönetici' : member.role === 'secretary' ? 'Sekreter' : 'Fzt.'}
                      </span>
                    </div>

                    {/* Ana Metrikler: Toplam Seans ve Tamamlanma Yüzdesi */}
                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 mb-3">
                      <div>
                        <span className="text-[11px] text-slate-500 font-medium block">Toplam Seans</span>
                        <span className="text-xl font-black text-slate-900">{member.total_sessions}</span>
                        <span className="text-[10px] text-slate-500 ml-1">randevu</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 font-medium block">Tamamlanma Oranı</span>
                        <span className="text-xl font-black text-emerald-600">%{member.completion_rate}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({member.completed_sessions} seans)</span>
                      </div>
                    </div>

                    {/* Mini Durum Dağılım Rozetleri */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60 flex items-center gap-1">
                        <CheckCircle2 size={11} /> {member.completed_sessions} Tamam
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200/60 flex items-center gap-1">
                        <Clock size={11} /> {member.pending_sessions} Bekliyor
                      </span>
                      {member.other_sessions > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200/60 flex items-center gap-1">
                          <AlertTriangle size={11} /> {member.other_sessions} Diğer
                        </span>
                      )}
                    </div>

                    {/* En Çok Yaptığı Tedavi Türü */}
                    <div className="bg-slate-50 rounded-lg p-2.5 text-xs flex items-center justify-between border border-slate-100">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                          En Çok Uygulanan Tedavi
                        </span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {member.top_treatment ? member.top_treatment.treatment_name : 'Kayıt Yok'}
                        </span>
                      </div>
                      {member.top_treatment && (
                        <span className="text-[11px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs shrink-0">
                          {member.top_treatment.count} seans
                        </span>
                      )}
                    </div>

                    {/* Alt Çizgi & Buton */}
                    <div className="mt-3 pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        Tekil Hasta: <strong className="text-slate-800">{member.unique_patients}</strong>
                      </span>
                      <button 
                        type="button" 
                        className={`text-xs font-bold flex items-center gap-1 ${
                          isSelected ? 'text-blue-600' : 'text-slate-600 group-hover:text-blue-600'
                        }`}
                      >
                        {isSelected ? 'Seçimi Kaldır' : 'Detay Tablosu'}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Detaylı Tedavi Dağılım Tablosu (Kullanıcının İstediği Temel Özellik) ─── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Tablo Üst Başlık & Araç Çubuğu */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-blue-600" />
                  Personel & Tedavi Dağılım Tablosu
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hangi uzmanın hangi tedaviden kaç seans yaptığı ve tamamlanma dökümü
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                {/* Personel Filtresi Çipleri */}
                <select
                  value={selectedStaffFilter}
                  onChange={(e) => setSelectedStaffFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 hover:border-slate-300 focus:outline-hidden"
                >
                  <option value="all">Tüm Personeller ({staffAnalysis.length})</option>
                  {staffAnalysis.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.total_sessions} seans)
                    </option>
                  ))}
                </select>

                {/* Arama */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tedavi veya personel ara..."
                    className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-44"
                  />
                </div>

                {/* Excel'e Aktar Butonu */}
                <button
                  onClick={handleExportStaffExcel}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <FileSpreadsheet size={13} />
                  Excel'e Aktar
                </button>
              </div>
            </div>

            {/* Tablo Gövdesi */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">Fizyoterapist / Doktor</th>
                    <th className="py-3 px-4 font-bold">Uygulanan Tedavi</th>
                    <th className="py-3 px-4 font-bold text-center">Seans Adedi</th>
                    <th className="py-3 px-4 font-bold">Personel İçi Payı</th>
                    <th className="py-3 px-4 font-bold text-center">Durum Dağılımı</th>
                    <th className="py-3 px-4 font-bold text-right">Tahmini Değer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {flattenedTreatmentRows.length > 0 ? (
                    flattenedTreatmentRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        {/* Personel Bilgisi */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ backgroundColor: row.staff_color || '#3b82f6' }}
                            >
                              {row.staff_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{row.staff_name}</div>
                              <div className="text-[10px] text-slate-500">{row.staff_title}</div>
                            </div>
                          </div>
                        </td>

                        {/* Tedavi Adı */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">
                            {row.treatment_name}
                          </span>
                        </td>

                        {/* Toplam Seans Adedi */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-900 text-xs">
                            {row.total_sessions}
                          </span>
                        </td>

                        {/* Personel İçi Yüzde Dağılımı */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(row.percentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 w-9 text-right">
                              %{row.percentage}
                            </span>
                          </div>
                        </td>

                        {/* Durum Dağılımı */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 font-bold" title="Tamamlanan Seans">
                              ✓ {row.completed_sessions}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 font-bold" title="Bekleyen Randevu">
                              ● {row.pending_sessions}
                            </span>
                            {row.cancelled_or_postponed > 0 && (
                              <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 font-bold" title="Ertelenen veya İptal">
                                ✕ {row.cancelled_or_postponed}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Tahmini Değer */}
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-slate-900">
                            {row.estimated_revenue > 0 
                              ? `${row.estimated_revenue.toLocaleString('tr-TR')} ₺` 
                              : '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Arama kriterlerine uygun personel ve tedavi kaydı bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tablo Alt Bilgi */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex items-center justify-between">
              <span>Toplam <strong>{flattenedTreatmentRows.length}</strong> tedavi kırılım satırı</span>
              <span>Klinik Performans Verisi · Fizyotim</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col hover:shadow-xs transition-shadow">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-[11px] font-medium text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
}
