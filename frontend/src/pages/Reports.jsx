import { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Wallet, Users, CalendarDays, Activity, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

export default function Reports({ patients, sessions, payments, treatments }) {
  // --- KPIs ---
  const kpis = useMemo(() => {
    const totalGelir = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalHasta = patients.length;
    const totalSeans = sessions.length;
    
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
      { title: 'Toplam Hasta', value: totalHasta, trend: getTrend(thisMonthNewPatients, lastMonthNewPatients), icon: Users, color: 'blue' },
      { title: 'Gerçekleşen Seans', value: totalSeans, trend: getTrend(thisMonthSeans, lastMonthSeans), icon: CalendarDays, color: 'amber' },
      { title: 'Ortalama Seans', value: totalSeans > 0 ? (totalGelir / totalSeans).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺' : '0 ₺', trend: null, icon: Activity, color: 'purple' },
    ];
  }, [payments, patients, sessions]);

  // --- Monthly Revenue (last 6 months) ---
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

  // --- Weekly Session Count (last 8 weeks) ---
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

  // --- Treatment Distribution ---
  const treatmentData = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      const name = s.treatment?.name || 'Bilinmiyor';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [sessions]);

  // --- Monthly New Patients ---
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

  const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/90 text-white text-[12px] px-3 py-2 rounded-lg shadow-xl backdrop-blur-sm border border-gray-700">
          <p className="font-bold text-gray-300 mb-1">{label}</p>
          <p className="font-semibold text-white">
            {prefix}{payload[0].value.toLocaleString('tr-TR')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend > 0;
          const isNeutral = kpi.trend === 0;
          
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs relative overflow-hidden group">
              <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-${kpi.color}-50 transition-transform group-hover:scale-110`} />
              
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-bold text-gray-400 mb-1">{kpi.title}</p>
                  <h4 className="text-2xl font-black text-gray-900">{kpi.value}</h4>
                  
                  {kpi.trend !== null && (
                    <div className={`flex items-center gap-1 mt-2 text-[11px] font-bold ${isPositive ? 'text-emerald-600' : isNeutral ? 'text-gray-400' : 'text-rose-500'}`}>
                      {isPositive ? <ArrowUpRight size={12} /> : isNeutral ? <TrendingUp size={12} /> : <ArrowDownRight size={12} />}
                      <span>{isNeutral ? 'Değişim yok' : `%${Math.abs(kpi.trend)}`}</span>
                      <span className="text-gray-400 ml-1 font-medium">bu ay</span>
                    </div>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-xl bg-${kpi.color}-100 flex items-center justify-center text-${kpi.color}-600 shadow-inner`}>
                  <Icon size={18} strokeWidth={2.5} />
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
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => v > 1000 ? `${v/1000}k` : v} />
              <Tooltip content={<CustomTooltip prefix="₺" />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="gelir" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGelir)" />
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
              <Line type="monotone" dataKey="yeniHasta" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-[11px] font-medium text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
}
