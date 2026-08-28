const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

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

// Slug'a göre klinik bilgisi çek
app.get('/api/clinics/by-slug/:slug', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  try {
    const { data: clinic, error } = await supabase
      .from('clinics')
      .select('id, name, slug, owner_name, phone, address, logo_url, theme_color, work_start_time, work_end_time, working_days, status')
      .eq('slug', req.params.slug)
      .maybeSingle();

    if (error || !clinic) return res.status(404).json({ error: "Klinik bulunamadı." });
    res.json(clinic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Klinik Ayarlarını Güncelle (Tema, Logo, Çalışma Saatleri, WhatsApp)
app.put('/api/clinics/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { 
    name, owner_name, phone, address, logo_url, theme_color, 
    work_start_time, work_end_time, working_days, whatsapp_api_key, whatsapp_phone_id, auto_whatsapp_enabled 
  } = req.body;

  try {
    const { data, error } = await supabase
      .from('clinics')
      .update({
        name, owner_name, phone, address, logo_url, theme_color,
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

app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});
