import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from './lib/supabase';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import AnnouncementBanner from './components/AnnouncementBanner';
import AnnouncementsModal from './components/AnnouncementsModal';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Treatments from './pages/Treatments';
import Sessions from './pages/Sessions';
import Staff from './pages/Staff';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Requests from './pages/Requests';
import Settings from './pages/Settings';
import PatientPortal from './pages/PatientPortal';

import { API_URL } from './lib/api';

const pageMeta = {
  dashboard:  { title: 'Dashboard',           subtitle: 'Klinik performansınızın genel görünümü' },
  patients:   { title: 'Hasta Yönetimi',       subtitle: 'Hasta kayıtlarını görüntüleyin ve yönetin' },
  sessions:   { title: 'Seans Takvimi',        subtitle: 'Haftalık takvim üzerinden randevu planlayın' },
  treatments: { title: 'Tedavi & Hizmetler',   subtitle: 'Sunduğunuz hizmetleri düzenleyin' },
  staff:      { title: 'Ekip & Personel',      subtitle: 'Fizyoterapistleri ve çalışan yetkilerini yönetin' },
  payments:   { title: 'Ödemeler',             subtitle: 'Tahsilat ve finans takibi' },
  reports:    { title: 'Raporlar',             subtitle: 'Grafikler ve istatistikler' },
  requests:   { title: 'Randevu Talepleri',    subtitle: 'Hastaların randevu taleplerini onaylayın veya reddedin' },
  settings:   { title: 'Klinik Ayarları',      subtitle: 'Logo, tema rengi, çalışma saatleri ve WhatsApp entegrasyonu' },
};

function App() {
  const [clinic, setClinic] = useState(() => {
    try {
      const saved = localStorage.getItem('fizyo_clinic');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  const [patients, setPatients] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // Check if we're on the /portal route BEFORE auth check
  const isPortal = window.location.pathname === '/portal';
  if (isPortal) {
    return <PatientPortal />;
  }

  useEffect(() => {
    if (clinic?.id) {
      fetchData();
    }
  }, [clinic?.id]);

  // 🔔 Yeni randevu talebi geldiğinde ses bildirimi
  useEffect(() => {
    if (!clinic?.id) return;

    const channel = supabase
      .channel('new_request_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_requests' },
        async (payload) => {
          // Ses çal
          try {
            const { playNotificationSound } = await import('./lib/notificationSound');
            playNotificationSound();
          } catch {}

          // Verileri yenile
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinic?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Supabase üzerinden doğrudan verileri çek
      const [pRes, tRes, staffRes, sRes, payRes, reqRes] = await Promise.all([
        supabase.from('patients').select('*').order('created_at', { ascending: false }),
        supabase.from('treatments').select('*').order('created_at', { ascending: true }),
        supabase.from('staff').select('*').order('created_at', { ascending: true }),
        supabase.from('sessions').select('*, patient:patients(id, full_name, phone, total_sessions), treatment:treatments(name, price), therapist:staff(id, full_name, role, title, color)').order('session_date', { ascending: true }),
        supabase.from('payments').select('*, patient:patients(full_name), session:sessions(session_date, treatment:treatments(name))').order('payment_date', { ascending: false }),
        supabase.from('session_requests').select('*, patient:patients(id, full_name, phone), treatment:treatments(name, price), therapist:staff(id, full_name, role, title, color)').order('created_at', { ascending: false }),
      ]);

      setPatients(pRes.data || []);
      setTreatments(tRes.data || []);
      setStaff(staffRes.data || []);
      setSessions(sRes.data || []);
      setPayments(payRes.data || []);
      setRequests(reqRes.data || []);
    } catch (e) {
      console.error('Veri çekme hatası:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClinicUpdated = (updatedClinic) => {
    localStorage.setItem('fizyo_clinic', JSON.stringify(updatedClinic));
    setClinic(updatedClinic);
  };

  const handleLogout = () => {
    localStorage.removeItem('fizyo_clinic');
    setClinic(null);
  };

  const openPatientDetail = (id) => {
    setSelectedPatientId(id);
    setActiveTab('patients');
  };

  const pendingCount = requests.filter(r => r.status === 'bekliyor').length;

  // Not logged in -> Show clinic login screen
  if (!clinic) {
    return <Login onLogin={setClinic} />;
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
        pendingCount={pendingCount}
        clinic={clinic}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          clinic={clinic}
          onRefresh={fetchData}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={handleLogout}
          onOpenAnnouncements={() => setShowAnnouncementsModal(true)}
        />

        <AnnouncementBanner onOpenModal={() => setShowAnnouncementsModal(true)} />

        <main className="flex-1 overflow-y-auto bg-[#f8fafb]">
          <div className="max-w-[1200px] mx-auto p-4 md:p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {activeTab === 'dashboard'  && <Dashboard clinic={clinic} patients={patients} sessions={sessions} payments={payments} onPatientClick={openPatientDetail} />}
                {activeTab === 'patients'   && <Patients clinic={clinic} patients={patients} sessions={sessions} selectedPatientId={selectedPatientId} setSelectedPatientId={setSelectedPatientId} refresh={fetchData} />}
                {activeTab === 'treatments' && <Treatments clinic={clinic} treatments={treatments} refresh={fetchData} />}
                {activeTab === 'staff'      && <Staff clinic={clinic} staff={staff} refresh={fetchData} />}
                {activeTab === 'sessions'   && <Sessions clinic={clinic} staff={staff} sessions={sessions} requests={requests} patients={patients} treatments={treatments} refresh={fetchData} onPatientClick={openPatientDetail} />}
                {activeTab === 'payments'   && <Payments clinic={clinic} payments={payments} sessions={sessions} patients={patients} refresh={fetchData} />}
                {activeTab === 'reports'    && <Reports clinic={clinic} patients={patients} sessions={sessions} payments={payments} treatments={treatments} />}
                {activeTab === 'requests'   && <Requests clinic={clinic} staff={staff} requests={requests} refresh={fetchData} />}
                {activeTab === 'settings'   && <Settings clinic={clinic} onClinicUpdated={handleClinicUpdated} onOpenAnnouncements={() => setShowAnnouncementsModal(true)} />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Announcements & Changelog Modal */}
      <AnnouncementsModal
        isOpen={showAnnouncementsModal}
        onClose={() => setShowAnnouncementsModal(false)}
      />
    </div>
  );
}

export default App;
