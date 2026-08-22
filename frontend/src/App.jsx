import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Stethoscope, 
  Calendar as CalendarIcon, 
  CreditCard, 
  LayoutDashboard,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Activity
} from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // States
  const [patients, setPatients] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);
  
  const [loading, setLoading] = useState(false);

  // Fetch all data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes, sRes, payRes] = await Promise.all([
        axios.get(`${API_URL}/patients`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/treatments`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/sessions`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/payments`).catch(() => ({ data: [] }))
      ]);
      setPatients(pRes.data);
      setTreatments(tRes.data);
      setSessions(sRes.data);
      setPayments(payRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Özet', icon: LayoutDashboard },
    { id: 'patients', label: 'Hastalar', icon: Users },
    { id: 'sessions', label: 'Seanslar', icon: CalendarIcon },
    { id: 'treatments', label: 'Tedaviler', icon: Activity },
    { id: 'payments', label: 'Ödemeler', icon: CreditCard },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar - Health Theme (Teal/Emerald) */}
      <aside className="w-64 bg-teal-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-teal-500 p-2 rounded-lg text-white shadow-sm">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">FizyoPanel</h1>
            <p className="text-teal-200 text-xs mt-0.5">Klinik Yönetim Sistemi</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-teal-500 text-white shadow-md' 
                    : 'text-teal-100 hover:bg-teal-800 hover:text-white hover:translate-x-1'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-teal-800 text-xs text-teal-400 text-center">
          FizyoPanel v2.1.0 &copy; 2026
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-slate-800 capitalize">
            {navItems.find(i => i.id === activeTab)?.label}
          </h2>
          <button 
            onClick={fetchData} 
            className="flex items-center text-sm text-teal-700 hover:text-teal-900 font-medium bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-lg transition-colors"
          >
            <Clock size={16} className="mr-2" /> Yenile
          </button>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
              <p className="text-teal-600 font-medium animate-pulse">Veriler Yükleniyor...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'dashboard' && <DashboardView patients={patients} sessions={sessions} payments={payments} />}
              {activeTab === 'patients' && <PatientsView patients={patients} refresh={fetchData} />}
              {activeTab === 'treatments' && <TreatmentsView treatments={treatments} refresh={fetchData} />}
              {activeTab === 'sessions' && <SessionsView sessions={sessions} patients={patients} treatments={treatments} refresh={fetchData} />}
              {activeTab === 'payments' && <PaymentsView payments={payments} sessions={sessions} patients={patients} refresh={fetchData} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function DashboardView({ patients, sessions, payments }) {
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingSessions = sessions.filter(s => s.status === 'bekliyor').length;
  const completedSessions = sessions.filter(s => s.status === 'tamamlandi').length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users size={28}/></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Toplam Hasta</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{patients.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-orange-50 text-orange-500 rounded-xl"><CalendarIcon size={28}/></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Bekleyen Seans</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{pendingSessions}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-teal-50 text-teal-600 rounded-xl"><CheckCircle size={28}/></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Tamamlanan</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{completedSessions}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl"><CreditCard size={28}/></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Toplam Gelir</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{totalRevenue.toLocaleString()} ₺</h3>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Fizyoterapist Hoş Geldiniz</h3>
          <p className="text-slate-500 text-sm mt-1">Hastalarınızın genel durumu ve günlük seans analizleri burada yer almaktadır.</p>
        </div>
        <div className="p-6">
          <p className="text-slate-600">Hastalarınızın yaşı ve şikayetleri gibi daha detaylı bilgileri <span className="font-semibold text-teal-600">Hastalar</span> sekmesinden ekleyebilir, tedavilerinizi "Manuel Terapi", "Klinik Masaj" gibi özel olarak belirleyebilirsiniz.</p>
        </div>
      </div>
    </div>
  );
}

function PatientsView({ patients, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '', email: '', age: '', complaint: '', notes: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/patients`, formData);
    setShowForm(false);
    setFormData({ full_name: '', phone: '', email: '', age: '', complaint: '', notes: '' });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <p className="text-slate-500 text-sm">Toplam {patients.length} hasta kayıtlı.</p>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-semibold hover:bg-teal-700 hover:shadow-lg transition-all">
          <Plus size={18} className="mr-2" /> Yeni Hasta Kaydı
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-teal-100 animate-in slide-in-from-top-4 fade-in">
          <h4 className="text-lg font-bold text-slate-800 mb-6">Hasta Bilgileri</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad *</label>
              <input required type="text" className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 p-2.5 border" onChange={e => setFormData({...formData, full_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon *</label>
              <input required type="tel" className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 p-2.5 border" onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Yaş</label>
              <input type="number" className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 p-2.5 border" onChange={e => setFormData({...formData, age: e.target.value})} />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Şikayeti / Ön Tanı</label>
              <input type="text" placeholder="Örn: Bel fıtığı, Boyun düzleşmesi..." className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 p-2.5 border" onChange={e => setFormData({...formData, complaint: e.target.value})} />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium">İptal</button>
            <button type="submit" className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium shadow-md">Kaydet</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-teal-300 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                {p.full_name.charAt(0).toUpperCase()}
              </div>
              {p.age && <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">{p.age} Yaş</span>}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">{p.full_name}</h3>
            <p className="text-slate-500 text-sm mb-4">{p.phone}</p>
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Şikayeti</p>
              <p className="text-slate-700 text-sm font-medium">{p.complaint || 'Belirtilmedi'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TreatmentsView({ treatments, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', duration_minutes: 60 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/treatments`, formData);
    setShowForm(false);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <p className="text-slate-500 text-sm">Hizmetlerinizi, paketlerinizi ve seans türlerini buradan yönetin.</p>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-semibold hover:bg-teal-700 hover:shadow-lg transition-all">
          <Plus size={18} className="mr-2" /> Yeni Hizmet Ekle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-teal-100 animate-in slide-in-from-top-4 fade-in grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Hizmet Adı *</label>
             <input required type="text" placeholder="Örn: Manuel Terapi" className="w-full border p-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500" onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Seans Fiyatı (₺) *</label>
             <input required type="number" className="w-full border p-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500" onChange={e => setFormData({...formData, price: e.target.value})} />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Süre (Dakika) *</label>
             <input required type="number" defaultValue="60" className="w-full border p-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500" onChange={e => setFormData({...formData, duration_minutes: e.target.value})} />
          </div>
          <div className="md:col-span-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 rounded-xl font-medium">İptal</button>
            <button type="submit" className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-medium">Kaydet</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {treatments.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-2xl border-2 border-transparent shadow-sm hover:border-teal-200 hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-teal-50 rounded-bl-full -z-10 group-hover:bg-teal-100 transition-colors"></div>
            <h4 className="font-bold text-slate-800 text-lg mb-4">{t.name}</h4>
            <div className="space-y-2">
              <p className="flex justify-between text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                <span className="flex items-center text-slate-500"><Clock size={16} className="mr-2 text-teal-600"/> Süre</span>
                <span className="font-semibold text-slate-800">{t.duration_minutes} dk</span>
              </p>
              <p className="flex justify-between text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                <span className="flex items-center text-slate-500"><CreditCard size={16} className="mr-2 text-teal-600"/> Fiyat</span>
                <span className="font-bold text-teal-700">{t.price} ₺</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionsView({ sessions, patients, treatments, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ patient_id: '', treatment_id: '', session_date: '', session_time: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/sessions`, formData);
    setShowForm(false);
    refresh();
  };

  const completeSession = async (id) => {
    await axios.put(`${API_URL}/sessions/${id}`, { status: 'tamamlandi' });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">Randevu ve Seans Takvimi</h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-semibold hover:bg-teal-700 hover:shadow-lg transition-all">
          <CalendarIcon size={18} className="mr-2" /> Randevu Oluştur
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-teal-100 animate-in slide-in-from-top-4 fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hasta Seçin *</label>
              <select required className="w-full border p-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500" onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                <option value="">Seçiniz...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} {p.complaint ? `(${p.complaint})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Uygulanacak Tedavi *</label>
              <select required className="w-full border p-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500" onChange={e => setFormData({...formData, treatment_id: e.target.value})}>
                <option value="">Seçiniz...</option>
                {treatments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.duration_minutes} dk)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tarih *</label>
              <input required type="date" className="w-full border p-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500" onChange={e => setFormData({...formData, session_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Saat *</label>
              <input required type="time" className="w-full border p-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500" onChange={e => setFormData({...formData, session_time: e.target.value})} />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 rounded-xl font-medium">İptal</button>
            <button type="submit" className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-medium">Randevu Kaydet</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tarih / Saat</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Hasta</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Hizmet</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Durum</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksiyon</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {sessions.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-800">{new Date(s.session_date).toLocaleDateString('tr-TR')}</div>
                  <div className="text-sm text-teal-600 font-medium">{s.session_time.substring(0,5)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-slate-900">{s.patient?.full_name}</div>
                  <div className="text-xs text-slate-500">{s.patient?.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium bg-slate-50/50">
                  {s.treatment?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${s.status === 'tamamlandi' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                    {s.status === 'tamamlandi' ? 'Tamamlandı' : 'Bekliyor'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {s.status === 'bekliyor' && (
                    <button onClick={() => completeSession(s.id)} className="text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg shadow-sm transition-colors">Seansı Bitir</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsView({ payments, sessions, patients, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ patient_id: '', session_id: '', amount: '', payment_method: 'Nakit', installments: 1 });

  const availableSessions = sessions; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/payments`, formData);
    setShowForm(false);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex space-x-4 items-center">
           <div className="p-3 bg-teal-100 text-teal-700 rounded-lg"><CreditCard size={24} /></div>
           <div>
             <h3 className="text-lg font-bold text-slate-800">Muhasebe ve Ödemeler</h3>
             <p className="text-slate-500 text-sm">Nakit, Kart veya Taksitli tahsilatlarınızı işleyin.</p>
           </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-semibold hover:bg-teal-700 hover:shadow-lg transition-all">
          <Plus size={18} className="mr-2" /> Tahsilat Gir
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-teal-100 animate-in slide-in-from-top-4 fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hasta Seçin *</label>
              <select required className="w-full border p-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500" onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                <option value="">Seçiniz...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Hangi Seans İçin? *</label>
              <select required className="w-full border p-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500" onChange={e => setFormData({...formData, session_id: e.target.value})}>
                <option value="">Seçiniz...</option>
                {availableSessions.filter(s => s.patient_id === formData.patient_id).map(s => (
                  <option key={s.id} value={s.id}>{new Date(s.session_date).toLocaleDateString('tr-TR')} - {s.treatment?.name} ({s.treatment?.price} ₺)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tahsil Edilen Tutar (₺) *</label>
              <input required type="number" className="w-full border p-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-bold text-teal-700" onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Yöntemi *</label>
              <select required className="w-full border p-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500" onChange={e => setFormData({...formData, payment_method: e.target.value})}>
                <option value="Nakit">Nakit</option>
                <option value="Kredi Kartı">Kredi Kartı</option>
                <option value="Havale/EFT">Havale/EFT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Taksit Sayısı</label>
              <select className="w-full border p-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500" onChange={e => setFormData({...formData, installments: parseInt(e.target.value) || 1})}>
                <option value="1">Tek Çekim / Peşin</option>
                <option value="2">2 Taksit</option>
                <option value="3">3 Taksit</option>
                <option value="4">4 Taksit</option>
                <option value="5">5 Taksit</option>
                <option value="6">6 Taksit</option>
                <option value="12">12 Taksit</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 rounded-xl font-medium">İptal</button>
            <button type="submit" className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-md flex items-center">Tahsilatı Onayla</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">İşlem Tarihi</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Hasta & Hizmet</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tutar</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ödeme Tipi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {payments.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">{new Date(p.payment_date).toLocaleDateString('tr-TR')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-bold text-slate-800">{p.patient?.full_name}</div>
                  <div className="text-xs text-slate-500">{p.session?.treatment?.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-lg font-bold text-teal-700">{p.amount} ₺</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="inline-flex flex-col">
                    <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md border border-slate-200">{p.payment_method}</span>
                    {p.installments > 1 && (
                      <span className="text-xs text-teal-600 font-medium mt-1 pl-1">{p.installments} Taksit</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
