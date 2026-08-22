import { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports({ patients, sessions, payments, treatments }) {
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
    return Object.entries(map).map(([name, value]) => ({ name, value }));
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <ChartCard title="Aylık Gelir" subtitle="Son 6 ay">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v.toLocaleString('tr-TR')} ₺`} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Weekly Sessions */}
        <ChartCard title="Haftalık Seans Sayısı" subtitle="Son 8 hafta">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hafta" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="seans" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Treatment Distribution */}
        <ChartCard title="Tedavi Dağılımı" subtitle="Hangi tedavi ne kadar yapıldı">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={treatmentData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {treatmentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Patient Trend */}
        <ChartCard title="Yeni Hasta Trendi" subtitle="Aylık yeni kayıt sayısı">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={patientTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="ay" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="yeniHasta" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-[13px] font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
