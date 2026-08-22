import { useState, useEffect } from 'react';
import axios from 'axios';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Treatments from './pages/Treatments';
import Sessions from './pages/Sessions';
import Payments from './pages/Payments';

const API_URL = 'http://localhost:5001/api';

const pageMeta = {
  dashboard:  { title: 'Dashboard',           subtitle: 'Klinik performansınızın genel görünümü' },
  patients:   { title: 'Hasta Yönetimi',       subtitle: 'Hasta kayıtlarını görüntüleyin ve yönetin' },
  sessions:   { title: 'Seans Takvimi',        subtitle: 'Randevuları planlayın ve takip edin' },
  treatments: { title: 'Tedavi & Hizmetler',   subtitle: 'Sunduğunuz hizmetleri düzenleyin' },
  payments:   { title: 'Ödemeler',             subtitle: 'Tahsilat ve finans takibi' },
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const meta = pageMeta[activeTab];

  return (
    <div className="flex h-screen overflow-hidden font-[Inter]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title={meta.title} subtitle={meta.subtitle} onRefresh={fetchData} />

        <main className="flex-1 overflow-y-auto bg-[#f8fafb]">
          <div className="max-w-[1200px] mx-auto p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {activeTab === 'dashboard'  && <Dashboard patients={patients} sessions={sessions} payments={payments} />}
                {activeTab === 'patients'   && <Patients patients={patients} refresh={fetchData} />}
                {activeTab === 'treatments' && <Treatments treatments={treatments} refresh={fetchData} />}
                {activeTab === 'sessions'   && <Sessions sessions={sessions} patients={patients} treatments={treatments} refresh={fetchData} />}
                {activeTab === 'payments'   && <Payments payments={payments} sessions={sessions} patients={patients} refresh={fetchData} />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
