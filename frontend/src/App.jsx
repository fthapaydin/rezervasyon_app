import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from './lib/supabase';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Treatments from './pages/Treatments';
import Sessions from './pages/Sessions';
import Payments from './pages/Payments';
import Reports from './pages/Reports';

const API_URL = 'http://localhost:5001/api';

const pageMeta = {
  dashboard:  { title: 'Dashboard',           subtitle: 'Klinik performansınızın genel görünümü' },
  patients:   { title: 'Hasta Yönetimi',       subtitle: 'Hasta kayıtlarını görüntüleyin ve yönetin' },
  sessions:   { title: 'Seans Takvimi',        subtitle: 'Haftalık takvim üzerinden randevu planlayın' },
  treatments: { title: 'Tedavi & Hizmetler',   subtitle: 'Sunduğunuz hizmetleri düzenleyin' },
  payments:   { title: 'Ödemeler',             subtitle: 'Tahsilat ve finans takibi' },
  reports:    { title: 'Raporlar',             subtitle: 'Grafikler ve istatistikler' },
};

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const [patients, setPatients] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // Auth check
  useEffect(() => {
    const localDemoUser = localStorage.getItem('fizyo_demo_user');
    if (localDemoUser) {
      try {
        setUser(JSON.parse(localDemoUser));
        setAuthLoading(false);
        return;
      } catch (e) {}
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!localStorage.getItem('fizyo_demo_user')) {
        setUser(session?.user ?? null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, t, s, pay] = await Promise.all([
        axios.get(`${API_URL}/patients`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/treatments`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/sessions`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/payments`).catch(() => ({ data: [] })),
      ]);
      setPatients(p.data);
      setTreatments(t.data);
      setSessions(s.data);
      setPayments(pay.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    localStorage.removeItem('fizyo_demo_user');
    await supabase.auth.signOut();
    setUser(null);
  };

  const openPatientDetail = (id) => {
    setSelectedPatientId(id);
    setActiveTab('patients');
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafb]">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const meta = pageMeta[activeTab] || pageMeta.dashboard;

  return (
    <div className="flex h-screen overflow-hidden font-[Inter]">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setSelectedPatientId(null); }}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onRefresh={fetchData}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto bg-[#f8fafb]">
          <div className="max-w-[1200px] mx-auto p-4 md:p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {activeTab === 'dashboard'  && <Dashboard patients={patients} sessions={sessions} payments={payments} onPatientClick={openPatientDetail} />}
                {activeTab === 'patients'   && <Patients patients={patients} sessions={sessions} selectedPatientId={selectedPatientId} setSelectedPatientId={setSelectedPatientId} refresh={fetchData} />}
                {activeTab === 'treatments' && <Treatments treatments={treatments} refresh={fetchData} />}
                {activeTab === 'sessions'   && <Sessions sessions={sessions} patients={patients} treatments={treatments} refresh={fetchData} onPatientClick={openPatientDetail} />}
                {activeTab === 'payments'   && <Payments payments={payments} sessions={sessions} patients={patients} refresh={fetchData} />}
                {activeTab === 'reports'    && <Reports patients={patients} sessions={sessions} payments={payments} treatments={treatments} />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
