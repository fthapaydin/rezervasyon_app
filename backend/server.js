const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://fizyotim.com',
  'https://www.fizyotim.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.endsWith(o.replace('https://', '')))) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET_KEY || 'fizyotim_super_secret_2026_key';

if (!supabaseUrl || !supabaseKey) {
  console.warn("UYARI: SUPABASE_URL veya SUPABASE_ANON_KEY environment variable olarak tanımlanmamış!");
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Helper: Extract clinic_id from headers or query
const getClinicId = (req) => {
  return req.headers['x-clinic-id'] || req.query.clinic_id || null;
};

// Superadmin Yetkilendirme Middleware'i
const verifySuperAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const superKey = req.headers['x-superadmin-key'];

  if (superKey && superKey === SUPERADMIN_SECRET) {
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token === SUPERADMIN_SECRET || token.startsWith('sat_')) {
      return next();
    }
  }

  // Token veya key eşleşmezse
  return res.status(403).json({ error: "Yetkisiz erişim: Superadmin yetkisi gereklidir." });
};

// --- AUTH & CLINICS ---

// Klinik Giriş
app.post('/api/auth/clinic-login', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "E-posta ve şifre zorunludur." });

  try {
    const { data: clinic, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('password', password)
      .maybeSingle();

    if (error) throw error;
    if (!clinic) {
      return res.status(401).json({ error: "E-posta veya şifre hatalı." });
    }

    if (clinic.status === 'pasif') {
      return res.status(403).json({ error: "Hesabınız pasife alınmıştır. Lütfen yöneticiyle iletişime geçiniz." });
    }

    res.json(clinic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tüm aktif klinikleri listele (İl/İlçe filtresi ile arama)
app.get('/api/clinics', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { city, district } = req.query;
  try {
    let query = supabase
      .from('clinics')
      .select('id, name, slug, owner_name, phone, address, city, district, logo_url, theme_color, status')
      .eq('status', 'aktif')
      .order('name', { ascending: true });

    if (city) query = query.ilike('city', `%${city}%`);
    if (district) query = query.ilike('district', `%${district}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Slug'a göre klinik bilgisi çek
app.get('/api/clinics/by-slug/:slug', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  try {
    const { data: clinic, error } = await supabase
      .from('clinics')
      .select('id, name, slug, owner_name, phone, address, city, district, logo_url, theme_color, work_start_time, work_end_time, working_days, status')
      .eq('slug', req.params.slug)
      .maybeSingle();

    if (error || !clinic) return res.status(404).json({ error: "Klinik bulunamadı." });
    res.json(clinic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Klinik Ayarlarını Güncelle (Tema, Logo, Çalışma Saatleri, Konum, WhatsApp)
app.put('/api/clinics/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { 
    name, owner_name, phone, address, city, district, logo_url, theme_color, 
    work_start_time, work_end_time, working_days, whatsapp_api_key, whatsapp_phone_id, auto_whatsapp_enabled 
  } = req.body;

  try {
    const { data, error } = await supabase
      .from('clinics')
      .update({
        name, owner_name, phone, address, city, district, logo_url, theme_color,
        work_start_time, work_end_time, working_days, whatsapp_api_key, whatsapp_phone_id, auto_whatsapp_enabled
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- STAFF / PERSONEL & TERAPİSTLER (RBAC) ---
app.get('/api/staff', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const clinicId = getClinicId(req);
  try {
    let query = supabase.from('staff').select('*').order('created_at', { ascending: true });
    if (clinicId) query = query.eq('clinic_id', clinicId);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const clinicId = req.body.clinic_id || getClinicId(req);
  const { full_name, email, phone, role, title, color } = req.body;
  if (!full_name) return res.status(400).json({ error: "Personel adı zorunludur." });

  try {
    const { data, error } = await supabase.from('staff').insert([{
      clinic_id: clinicId,
      full_name,
      email: email || null,
      phone: phone || null,
      role: role || 'therapist',
      title: title || 'Fizyoterapist',
      color: color || '#059669',
      is_active: true
    }]).select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/staff/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { full_name, email, phone, role, title, color, is_active } = req.body;
  try {
    const { data, error } = await supabase
      .from('staff')
      .update({ full_name, email, phone, role, title, color, is_active })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  try {
    const { error } = await supabase.from('staff').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: "Personel başarıyla silindi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PATIENTS ---
app.get('/api/patients', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const clinicId = getClinicId(req);
  try {
    let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
    if (clinicId) query = query.eq('clinic_id', clinicId);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/patients/by-phone/:phone', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase yapılandırılmamış.' });
  const clinicId = getClinicId(req);
  try {
    const cleanedPhone = req.params.phone.replace(/\D/g, '');
    let query = supabase
      .from('patients')
      .select('id, full_name, phone, complaint, total_sessions')
      .ilike('phone', `%${cleanedPhone}%`);
    
    if (clinicId) query = query.eq('clinic_id', clinicId);

    const { data, error } = await query.limit(1).maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'Hasta bulunamadı.' });
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'Hasta bulunamadı.' });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  try {
    const { data: patient, error: pErr } = await supabase
      .from('patients').select('*').eq('id', req.params.id).single();
    if (pErr) throw pErr;

    const { data: patientSessions, error: sErr } = await supabase
      .from('sessions')
      .select('*, treatment:treatments(name, price), therapist:staff(id, full_name, title, color)')
      .eq('patient_id', req.params.id)
      .order('session_date', { ascending: true });
    if (sErr) throw sErr;

    const { data: patientPayments, error: payErr } = await supabase
      .from('payments')
      .select('*, session:sessions(session_date, treatment:treatments(name))')
      .eq('patient_id', req.params.id)
      .order('payment_date', { ascending: false });
    if (payErr) throw payErr;

    res.json({ ...patient, sessions: patientSessions, payments: patientPayments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const clinicId = req.body.clinic_id || getClinicId(req);
  const { full_name, phone, email, age, gender, address, complaint, total_sessions, notes } = req.body;
  if (!full_name || !phone) return res.status(400).json({ error: "Ad Soyad ve Telefon zorunludur." });

  try {
    const { data, error } = await supabase.from('patients').insert([{
      clinic_id: clinicId, full_name, phone, email, age, gender, address, complaint, total_sessions: total_sessions || 10, notes
    }]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { full_name, phone, email, age, gender, address, complaint, total_sessions, notes } = req.body;
  try {
    const { data, error } = await supabase
      .from('patients')
      .update({ full_name, phone, email, age, gender, address, complaint, total_sessions, notes })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  try {
    const { error } = await supabase.from('patients').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: "Hasta başarıyla silindi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TREATMENTS ---
app.get('/api/treatments', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const clinicId = getClinicId(req);
  try {
    let query = supabase.from('treatments').select('*').order('created_at', { ascending: true });
    if (clinicId) query = query.eq('clinic_id', clinicId);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/treatments', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const clinicId = req.body.clinic_id || getClinicId(req);
  const { name, price, duration_minutes } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Ad ve Fiyat zorunludur." });

  try {
    const { data, error } = await supabase.from('treatments').insert([{
      clinic_id: clinicId, name, price, duration_minutes: duration_minutes || 60
    }]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/treatments/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { name, price, duration_minutes } = req.body;
  try {
    const { data, error } = await supabase
      .from('treatments')
      .update({ name, price, duration_minutes })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/treatments/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  try {
    const { error } = await supabase.from('treatments').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: "Tedavi başarıyla silindi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SESSIONS ---
app.get('/api/sessions', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const clinicId = getClinicId(req);
  try {
    let query = supabase
      .from('sessions')
      .select('*, patient:patients(id, full_name, phone, total_sessions), treatment:treatments(name, price), therapist:staff(id, full_name, title, color)')
      .order('session_date', { ascending: true })
      .order('session_time', { ascending: true });

    if (clinicId) query = query.eq('clinic_id', clinicId);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const clinicId = req.body.clinic_id || getClinicId(req);
  const { patient_id, treatment_id, therapist_id, session_date, session_time, notes } = req.body;
  if (!patient_id || !treatment_id || !session_date || !session_time)
    return res.status(400).json({ error: "Eksik alanlar var." });

  try {
    const { data, error } = await supabase.from('sessions').insert([{
      clinic_id: clinicId, patient_id, treatment_id, therapist_id: therapist_id || null, session_date, session_time, notes, status: 'bekliyor'
    }]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sessions/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { status, therapist_id, session_date, session_time, notes } = req.body;
  try {
    const updatePayload = {};
    if (status !== undefined) updatePayload.status = status;
    if (therapist_id !== undefined) updatePayload.therapist_id = therapist_id;
    if (session_date !== undefined) updatePayload.session_date = session_date;
    if (session_time !== undefined) updatePayload.session_time = session_time;
    if (notes !== undefined) updatePayload.notes = notes;

    const { data, error } = await supabase
      .from('sessions').update(updatePayload).eq('id', req.params.id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sessions/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  try {
    const { error } = await supabase.from('sessions').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: "Seans başarıyla silindi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PAYMENTS ---
app.get('/api/payments', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const clinicId = getClinicId(req);
  try {
    let query = supabase
      .from('payments')
      .select('*, patient:patients(full_name), session:sessions(session_date, treatment:treatments(name))')
      .order('payment_date', { ascending: false });

    if (clinicId) query = query.eq('clinic_id', clinicId);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const clinicId = req.body.clinic_id || getClinicId(req);
  const { session_id, patient_id, amount, payment_method, installments } = req.body;
  if (!session_id || !patient_id || !amount || !payment_method)
    return res.status(400).json({ error: "Eksik alanlar var." });

  try {
    const { data, error } = await supabase.from('payments').insert([{
      clinic_id: clinicId, session_id, patient_id, amount, payment_method, installments: installments || 1
    }]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RECURRING SESSIONS ---
app.post('/api/sessions/recurring', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const clinicId = req.body.clinic_id || getClinicId(req);
  const { patient_id, treatment_id, therapist_id, session_time, start_date, repeat_type, repeat_count } = req.body;
  if (!patient_id || !treatment_id || !session_time || !start_date || !repeat_type || !repeat_count)
    return res.status(400).json({ error: "Eksik alanlar var." });

  const sessions = [];
  const start = new Date(start_date);

  for (let i = 0; i < repeat_count; i++) {
    const d = new Date(start);
    if (repeat_type === 'weekly') d.setDate(d.getDate() + i * 7);
    else if (repeat_type === 'biweekly') d.setDate(d.getDate() + i * 3);
    else if (repeat_type === 'daily') d.setDate(d.getDate() + i);

    sessions.push({
      clinic_id: clinicId,
      patient_id,
      treatment_id,
      therapist_id: therapist_id || null,
      session_date: d.toISOString().split('T')[0],
      session_time,
      status: 'bekliyor'
    });
  }

  try {
    const { data, error } = await supabase.from('sessions').insert(sessions).select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SESSION REQUESTS (Hasta Self-Servis Talepleri) ---
app.get('/api/session-requests', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase yapılandırılmamış.' });
  const clinicId = getClinicId(req);
  try {
    let query = supabase
      .from('session_requests')
      .select('*, patient:patients(id, full_name, phone), treatment:treatments(name, price), therapist:staff(id, full_name, title, color)')
      .order('created_at', { ascending: false });

    if (clinicId) query = query.eq('clinic_id', clinicId);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/session-requests', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase yapılandırılmamış.' });
  const clinicId = req.body.clinic_id || getClinicId(req);
  const { patient_id, treatment_id, therapist_id, requested_date, requested_time, notes } = req.body;
  if (!patient_id || !treatment_id || !requested_date || !requested_time)
    return res.status(400).json({ error: 'Eksik alanlar var.' });

  try {
    const { data, error } = await supabase.from('session_requests').insert([{
      clinic_id: clinicId, patient_id, treatment_id, therapist_id: therapist_id || null, requested_date, requested_time, notes, status: 'bekliyor'
    }]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/session-requests/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase yapılandırılmamış.' });
  const { status, rejection_reason, therapist_id } = req.body;

  try {
    const updateData = { status, rejection_reason: rejection_reason || null };
    if (therapist_id !== undefined) updateData.therapist_id = therapist_id;

    const { data: updatedReq, error: updateErr } = await supabase
      .from('session_requests')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*, patient:patients(id, full_name, phone), treatment:treatments(name, price), therapist:staff(id, full_name)')
      .single();
    if (updateErr) throw updateErr;

    // Onaylandıysa sessions tablosuna da ekle
    if (status === 'onaylandi') {
      const { error: sessionErr } = await supabase.from('sessions').insert([{
        clinic_id: updatedReq.clinic_id,
        patient_id: updatedReq.patient_id,
        treatment_id: updatedReq.treatment_id,
        therapist_id: updatedReq.therapist_id || null,
        session_date: updatedReq.requested_date,
        session_time: updatedReq.requested_time,
        notes: updatedReq.notes,
        status: 'bekliyor'
      }]);
      if (sessionErr) throw sessionErr;
    }

    res.json(updatedReq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AUTOMATIC WHATSAPP BUSINESS API INTEGRATION ---
app.post('/api/whatsapp/send-template', async (req, res) => {
  const { clinic_id, to_phone, type, patient_name, date, time, therapist_name, treatment_name } = req.body;
  if (!to_phone) return res.status(400).json({ error: "Telefon numarası zorunludur." });

  try {
    // 1. Kliniğin WhatsApp ayarlarını kontrol et
    let clinicConfig = null;
    if (clinic_id && supabase) {
      const { data: cl } = await supabase.from('clinics').select('name, whatsapp_api_key, whatsapp_phone_id, auto_whatsapp_enabled').eq('id', clinic_id).maybeSingle();
      clinicConfig = cl;
    }

    const clinicTitle = clinicConfig?.name || "Fizyoterapi Kliniği";

    // Mesaj Metni Oluştur
    let messageText = '';
    if (type === 'approval') {
      messageText = `Merhaba Sn. ${patient_name}, ${clinicTitle} kliniğimizdeki ${date} saat ${time} için planlanan ${treatment_name || 'tedavi'} randevunuz ONAYLANMIŞTIR.${therapist_name ? ` (Terapistiniz: ${therapist_name})` : ''} Sağlıklı günler dileriz.`;
    } else if (type === 'reminder') {
      messageText = `Hatırlatma: Sn. ${patient_name}, ${clinicTitle} kliniğimizdeki seansınız bugün saat ${time}'dedir.${therapist_name ? ` (Terapist: ${therapist_name})` : ''} Lütfen 10 dk öncesinde hazır olunuz.`;
    } else if (type === 'completed') {
      messageText = `Sn. ${patient_name}, bugünkü seansınız tamamlandı. Ev egzersizlerinizi aksatmamanızı rica eder, sağlıklı günler dileriz. - ${clinicTitle}`;
    } else {
      messageText = `Sn. ${patient_name}, ${clinicTitle} kliniğinden randevu bilgilendirmesi: ${date} ${time}`;
    }

    // 2. Eğer WhatsApp Cloud API Key tanımlıysa doğrudan Meta Graph API'ye POST et
    if (clinicConfig?.auto_whatsapp_enabled && clinicConfig?.whatsapp_api_key && clinicConfig?.whatsapp_phone_id) {
      const cleanedPhone = to_phone.replace(/\D/g, '');
      const fullPhone = cleanedPhone.startsWith('90') ? cleanedPhone : `90${cleanedPhone.replace(/^0/, '')}`;

      await axios.post(
        `https://graph.facebook.com/v18.0/${clinicConfig.whatsapp_phone_id}/messages`,
        {
          messaging_product: "whatsapp",
          to: fullPhone,
          type: "text",
          text: { body: messageText }
        },
        {
          headers: {
            Authorization: `Bearer ${clinicConfig.whatsapp_api_key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return res.json({ success: true, mode: 'cloud_api', message: messageText });
    }

    // API Key yoksa simülasyon ve Web URL'i döndür
    const webUrl = `https://wa.me/90${to_phone.replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(messageText)}`;
    res.json({ success: true, mode: 'web_fallback', message: messageText, webUrl });
  } catch (err) {
    console.error("WhatsApp gönderme hatası:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// =========================================================
// SUPERADMIN API ROTalARI (/api/superadmin/*)
// =========================================================

// 1. Superadmin Giriş
app.post('/api/superadmin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "E-posta ve şifre zorunludur." });
  }

  try {
    // Önce superadmins tablosundan kontrol et
    let adminUser = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('superadmins')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('password', password)
        .maybeSingle();

      if (!error && data) {
        adminUser = data;
      }
    }

    // Sabit fallback admin kontrolü (fizyotim.com platform sahibi için)
    if (!adminUser && email.trim().toLowerCase() === 'admin@fizyotim.com' && (password === 'fizyotim2026!' || password === SUPERADMIN_SECRET)) {
      adminUser = {
        id: 'superadmin-master-id',
        email: 'admin@fizyotim.com',
        full_name: 'Fatih Apaydın',
        role: 'superadmin'
      };
    }

    if (!adminUser) {
      return res.status(401).json({ error: "Geçersiz Superadmin e-posta veya şifre." });
    }

    const token = `sat_${Buffer.from(`${adminUser.id}:${Date.now()}:${SUPERADMIN_SECRET}`).toString('base64')}`;

    res.json({
      success: true,
      superadmin: {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name,
        role: adminUser.role || 'superadmin'
      },
      token: SUPERADMIN_SECRET // veya üretilen token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Superadmin Yetki Doğrulama
app.get('/api/superadmin/me', verifySuperAdmin, (req, res) => {
  res.json({ authenticated: true, role: 'superadmin' });
});

// 3. Platform Genel İstatistikleri (KPIs)
app.get('/api/superadmin/stats', verifySuperAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });

  try {
    // Paralel sorgular ile platform metriklerini çek
    const [
      { data: clinics, error: cErr },
      { count: staffCount },
      { count: patientsCount },
      { count: sessionsCount },
      { data: payments },
      { data: demoRequests }
    ] = await Promise.all([
      supabase.from('clinics').select('id, status, plan, created_at'),
      supabase.from('staff').select('*', { count: 'exact', head: true }),
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('amount'),
      supabase.from('demo_requests').select('id, status, created_at')
    ]);

    if (cErr) throw cErr;

    const totalClinics = clinics?.length || 0;
    const activeClinics = clinics?.filter(c => c.status === 'aktif')?.length || 0;
    const trialClinics = clinics?.filter(c => c.status === 'deneme')?.length || 0;
    const passiveClinics = clinics?.filter(c => c.status === 'pasif')?.length || 0;

    // Tahmini Aylık Gelir (MRR) - Standart: 1.500₺, Premium: 3.500₺, Kurumsal: 6.000₺
    const estimatedMRR = clinics?.reduce((total, c) => {
      if (c.status !== 'aktif') return total;
      if (c.plan === 'kurumsal') return total + 6000;
      if (c.plan === 'premium') return total + 3500;
      return total + 1500;
    }, 0) || 0;

    const totalPlatformTurnover = payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
    const totalDemos = demoRequests?.length || 0;
    const pendingDemos = demoRequests?.filter(d => !d.status || d.status === 'bekliyor')?.length || 0;

    res.json({
      clinics: {
        total: totalClinics,
        active: activeClinics,
        trial: trialClinics,
        passive: passiveClinics
      },
      staffCount: staffCount || 0,
      patientsCount: patientsCount || 0,
      sessionsCount: sessionsCount || 0,
      totalPlatformTurnover,
      estimatedMRR,
      demos: {
        total: totalDemos,
        pending: pendingDemos
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Tüm Klinikler Listesi (Detaylı)
app.get('/api/superadmin/clinics', verifySuperAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });

  try {
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(clinics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Yeni Klinik Oluştur
app.post('/api/superadmin/clinics', verifySuperAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });

  const {
    name,
    slug,
    owner_name,
    phone,
    email,
    password,
    status = 'aktif',
    plan = 'standart',
    city = 'İstanbul',
    district = 'Kadıköy',
    theme_color = '#059669'
  } = req.body;

  if (!name || !owner_name || !email || !password) {
    return res.status(400).json({ error: "Klinik adı, sahip adı, e-posta ve şifre zorunludur." });
  }

  const generatedSlug = slug || name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

  try {
    const { data: clinic, error } = await supabase
      .from('clinics')
      .insert([{
        name,
        slug: generatedSlug,
        owner_name,
        phone: phone || '',
        email: email.trim().toLowerCase(),
        password,
        status,
        plan,
        city,
        district,
        theme_color
      }])
      .select()
      .single();

    if (error) throw error;

    // Otomatik ilk personel (Klinik Sahibi Terapist) oluştur
    await supabase.from('staff').insert([{
      clinic_id: clinic.id,
      full_name: owner_name,
      role: 'admin',
      title: 'Klinik Sahibi / Baş Fzt.',
      color: theme_color,
      email: email.trim().toLowerCase(),
      phone: phone || ''
    }]).catch(() => {});

    res.status(201).json(clinic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Klinik Durumu Değiştir (Aktif / Pasif / Deneme)
app.put('/api/superadmin/clinics/:id/status', verifySuperAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { status } = req.body;

  if (!['aktif', 'pasif', 'deneme'].includes(status)) {
    return res.status(400).json({ error: "Geçersiz durum değeri." });
  }

  try {
    const { data, error } = await supabase
      .from('clinics')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Klinik Abonelik Planı Değiştir
app.put('/api/superadmin/clinics/:id/plan', verifySuperAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { plan } = req.body;

  if (!['standart', 'premium', 'kurumsal'].includes(plan)) {
    return res.status(400).json({ error: "Geçersiz plan." });
  }

  try {
    const { data, error } = await supabase
      .from('clinics')
      .update({ plan })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Klinik Şifresi Sıfırla
app.put('/api/superadmin/clinics/:id/reset-password', verifySuperAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { new_password } = req.body;

  if (!new_password || new_password.length < 4) {
    return res.status(400).json({ error: "Yeni şifre en az 4 karakter olmalıdır." });
  }

  try {
    const { data, error } = await supabase
      .from('clinics')
      .update({ password: new_password })
      .eq('id', req.params.id)
      .select('id, name, email')
      .single();

    if (error) throw error;
    res.json({ message: "Şifre başarıyla güncellendi.", clinic: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Klinik Sil (Tüm bağlı veriler cascade silinir)
app.delete('/api/superadmin/clinics/:id', verifySuperAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });

  try {
    const { error } = await supabase
      .from('clinics')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: "Klinik başarıyla silindi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Gelen Demo Başvuruları Listesi
app.get('/api/superadmin/demo-requests', verifySuperAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });

  try {
    const { data, error } = await supabase
      .from('demo_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Demo Başvuru Durumunu Güncelle
app.put('/api/superadmin/demo-requests/:id', verifySuperAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { status, notes } = req.body;

  try {
    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (notes !== undefined) updatePayload.notes = notes;

    const { data, error } = await supabase
      .from('demo_requests')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Demo Başvurusunu Tek Tıkla Kliniğe Dönüştür!
app.post('/api/superadmin/demo-requests/:id/convert', verifySuperAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });

  try {
    const { data: demo, error: demoErr } = await supabase
      .from('demo_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (demoErr || !demo) return res.status(404).json({ error: "Demo başvurusu bulunamadı." });

    const clinicEmail = (demo.email || `klinik_${Date.now()}@fizyotim.com`).trim().toLowerCase();
    const cleanName = demo.clinic_name || `${demo.full_name} Kliniği`;
    const generatedSlug = cleanName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.floor(100 + Math.random() * 900);
    const tempPassword = `fizyo${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: newClinic, error: clinicErr } = await supabase
      .from('clinics')
      .insert([{
        name: cleanName,
        slug: generatedSlug,
        owner_name: demo.full_name,
        phone: demo.phone,
        email: clinicEmail,
        password: tempPassword,
        status: 'deneme',
        plan: demo.plan === 'yillik-kampanya' ? 'premium' : (demo.plan === 'ozel-teklif' ? 'kurumsal' : 'standart'),
        city: demo.city || 'İstanbul',
        district: 'Merkez',
        theme_color: '#059669'
      }])
      .select()
      .single();

    if (clinicErr) throw clinicErr;

    // Personel ekle
    await supabase.from('staff').insert([{
      clinic_id: newClinic.id,
      full_name: demo.full_name,
      role: 'admin',
      title: 'Klinik Yöneticisi',
      color: '#059669',
      email: clinicEmail,
      phone: demo.phone
    }]).catch(() => {});

    // Demo talebini onaylandı olarak işaretle
    await supabase
      .from('demo_requests')
      .update({ status: 'onaylandi', notes: `Klinik açıldı: ${cleanName} (Giriş: ${clinicEmail} / ${tempPassword})` })
      .eq('id', req.params.id);

    res.json({
      success: true,
      message: "Demo başvurusu başarıyla kliniğe dönüştürüldü!",
      clinic: newClinic,
      credentials: {
        email: clinicEmail,
        password: tempPassword,
        portal_url: `https://fizyotim.com/k/${generatedSlug}`
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Demo Başvuru Sil
app.delete('/api/superadmin/demo-requests/:id', verifySuperAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });

  try {
    const { error } = await supabase
      .from('demo_requests')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: "Başvuru silindi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Yeni Sistem Duyurusu Yayınla
app.post('/api/superadmin/announcements', verifySuperAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { title, message, type = 'info' } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: "Başlık ve mesaj zorunludur." });
  }

  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert([{ title, message, type, is_active: true }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 15. Sistem Duyurusunu Kaldır
app.delete('/api/superadmin/announcements/:id', verifySuperAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });

  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: "Duyuru kaldırıldı." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});
