import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Scissors, User, Phone, CheckCircle, ChevronLeft } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hizmetleri getir
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${API_URL}/services`);
        setServices(response.data);
      } catch (err) {
        console.error("Hizmetler yüklenirken hata:", err);
        setError("Hizmetler yüklenemedi. Sunucu bağlantısını kontrol edin.");
      }
    };
    fetchServices();
  }, []);

  // Seçili tarihe göre uygun saatleri hesapla
  useEffect(() => {
    if (!selectedDate || !selectedService) return;

    const fetchAppointments = async () => {
      try {
        const response = await axios.get(`${API_URL}/appointments?date=${selectedDate}`);
        const bookedAppointments = response.data;
        
        // Basit saat dilimleri (09:00 - 18:00 arası her saat başı)
        // Gerçek uygulamada hizmet süresine göre dinamik hesaplanır
        const allTimes = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
        
        // Dolu saatleri filtrele
        const bookedTimes = bookedAppointments.map(app => app.appointment_time.substring(0,5)); // "10:00:00" -> "10:00"
        
        const free = allTimes.filter(t => !bookedTimes.includes(t));
        setAvailableTimes(free);
      } catch (err) {
        console.error("Randevular yüklenirken hata:", err);
      }
    };
    fetchAppointments();
  }, [selectedDate, selectedService]);

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/appointments`, {
        customer_name: customer.name,
        customer_phone: customer.phone,
        service_id: selectedService.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime
      });
      setStep(4);
    } catch (err) {
      alert("Randevu oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Randevu Sistemi</h1>
            <p className="text-sm opacity-80">Hızlı ve kolay randevu alın</p>
          </div>
          {step > 1 && step < 4 && (
            <button onClick={() => setStep(step - 1)} className="flex items-center text-sm bg-indigo-700 px-3 py-1 rounded hover:bg-indigo-800 transition">
              <ChevronLeft size={16} /> Geri
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 m-4 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <div className="p-6">
          {/* Adım 1: Hizmet Seçimi */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">1. Hizmet Seçin</h2>
              {services.length === 0 && !error ? (
                <p className="text-center text-gray-500 py-10">Yükleniyor...</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map(service => (
                    <div 
                      key={service.id}
                      onClick={() => { setSelectedService(service); setStep(2); }}
                      className={`border p-4 rounded-lg cursor-pointer hover:border-indigo-500 hover:shadow-md transition ${selectedService?.id === service.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center text-indigo-600">
                          <Scissors size={20} className="mr-2" />
                          <h3 className="font-medium text-gray-900">{service.name}</h3>
                        </div>
                        <span className="font-bold text-gray-700">{service.price} ₺</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 flex items-center">
                        <Clock size={14} className="mr-1" /> {service.duration_minutes} dakika
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Adım 2: Tarih ve Saat Seçimi */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">2. Tarih ve Saat Belirleyin</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih Seçin</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    min={getMinDate()}
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                  />
                </div>
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Uygun Saatler</label>
                  {availableTimes.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableTimes.map(time => (
                         <button
                           key={time}
                           onClick={() => setSelectedTime(time)}
                           className={`py-2 rounded-md text-sm font-medium border transition ${selectedTime === time ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                         >
                           {time}
                         </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 bg-red-50 p-3 rounded">Seçtiğiniz tarihte boş saat bulunmamaktadır. Lütfen başka bir tarih seçin.</p>
                  )}
                </div>
              )}

              <div className="pt-4">
                <button
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Devam Et
                </button>
              </div>
            </div>
          )}

          {/* Adım 3: Müşteri Bilgileri */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">3. İletişim Bilgileriniz</h2>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4 text-sm text-gray-700 border">
                <strong>Özet:</strong> {selectedService?.name} için {selectedDate} günü saat {selectedTime}'a randevu oluşturuyorsunuz.
              </div>

              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adınız Soyadınız</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={customer.name}
                      onChange={(e) => setCustomer({...customer, name: e.target.value})}
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                      placeholder="Örn: Ahmet Yılmaz"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Numaranız</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={customer.phone}
                      onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? 'İşleniyor...' : 'Randevuyu Onayla'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Adım 4: Başarılı */}
          {step === 4 && (
            <div className="text-center py-10">
              <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Randevunuz Onaylandı!</h2>
              <p className="text-gray-600 mb-6">
                Sayın <strong>{customer.name}</strong>, randevunuz başarıyla oluşturuldu. Sizi bekliyoruz!
              </p>
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedService(null);
                  setSelectedDate('');
                  setSelectedTime('');
                  setCustomer({name: '', phone: ''});
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
              >
                Yeni Randevu Al
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;
