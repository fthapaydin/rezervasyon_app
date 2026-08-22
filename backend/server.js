const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Uyarı: Supabase URL veya Key .env dosyasında bulunamadı.");
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Tüm hizmetleri getir
app.get('/api/services', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  try {
    const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Belirli bir tarihteki randevuları getir (boş saatleri hesaplamak için)
app.get('/api/appointments', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { date } = req.query; // YYYY-MM-DD formatında bekliyoruz
  
  try {
    let query = supabase.from('appointments').select('appointment_time, duration_minutes:services(duration_minutes)');
    if (date) {
        query = query.eq('appointment_date', date);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yeni randevu oluştur
app.post('/api/appointments', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { customer_name, customer_phone, service_id, appointment_date, appointment_time } = req.body;

  if (!customer_name || !customer_phone || !service_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: "Tüm alanlar zorunludur." });
  }

  try {
    const { data, error } = await supabase
        .from('appointments')
        .insert([{
            customer_name,
            customer_phone,
            service_id,
            appointment_date,
            appointment_time,
            status: 'pending'
        }])
        .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});
