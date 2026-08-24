const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

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

// --- PATIENTS ---
app.get('/api/patients', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  try {
    const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      .select('*, treatment:treatments(name, price)')
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
  const { full_name, phone, email, age, gender, address, complaint, total_sessions, notes } = req.body;
  if (!full_name || !phone) return res.status(400).json({ error: "Ad Soyad ve Telefon zorunludur." });

  try {
    const { data, error } = await supabase.from('patients').insert([{
      full_name, phone, email, age, gender, address, complaint, total_sessions: total_sessions || 10, notes
    }]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TREATMENTS ---
app.get('/api/treatments', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  try {
    const { data, error } = await supabase.from('treatments').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/treatments', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { name, price, duration_minutes } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Ad ve Fiyat zorunludur." });

  try {
    const { data, error } = await supabase.from('treatments').insert([{
      name, price, duration_minutes: duration_minutes || 60
    }]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SESSIONS ---
app.get('/api/sessions', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, patient:patients(id, full_name, phone, total_sessions), treatment:treatments(name, price)')
      .order('session_date', { ascending: true })
      .order('session_time', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { patient_id, treatment_id, session_date, session_time, notes } = req.body;
  if (!patient_id || !treatment_id || !session_date || !session_time)
    return res.status(400).json({ error: "Eksik alanlar var." });

  try {
    const { data, error } = await supabase.from('sessions').insert([{
      patient_id, treatment_id, session_date, session_time, notes, status: 'bekliyor'
    }]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sessions/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { status } = req.body;
  try {
    const { data, error } = await supabase
      .from('sessions').update({ status }).eq('id', req.params.id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PAYMENTS ---
app.get('/api/payments', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, patient:patients(full_name), session:sessions(session_date, treatment:treatments(name))')
      .order('payment_date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase yapılandırılmamış." });
  const { session_id, patient_id, amount, payment_method, installments } = req.body;
  if (!session_id || !patient_id || !amount || !payment_method)
    return res.status(400).json({ error: "Eksik alanlar var." });

  try {
    const { data, error } = await supabase.from('payments').insert([{
      session_id, patient_id, amount, payment_method, installments: installments || 1
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
  const { patient_id, treatment_id, session_time, start_date, repeat_type, repeat_count } = req.body;
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
      patient_id,
      treatment_id,
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

// Telefona göre hasta ara (hasta portalı için)
app.get('/api/patients/by-phone/:phone', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase yapılandırılmamış.' });
  try {
    const cleanedPhone = req.params.phone.replace(/\D/g, '');
    const { data, error } = await supabase
      .from('patients')
      .select('id, full_name, phone, complaint, total_sessions')
      .ilike('phone', `%${cleanedPhone}%`)
      .limit(1)
      .single();
    if (error) return res.status(404).json({ error: 'Hasta bulunamadı.' });
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'Hasta bulunamadı.' });
  }
});

// Tüm talepleri listele (admin için)
app.get('/api/session-requests', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase yapılandırılmamış.' });
  try {
    const { data, error } = await supabase
      .from('session_requests')
      .select('*, patient:patients(id, full_name, phone), treatment:treatments(name, price)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yeni randevu talebi oluştur (hasta portalından)
app.post('/api/session-requests', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase yapılandırılmamış.' });
  const { patient_id, treatment_id, requested_date, requested_time, notes } = req.body;
  if (!patient_id || !treatment_id || !requested_date || !requested_time)
    return res.status(400).json({ error: 'Eksik alanlar var.' });

  try {
    const { data, error } = await supabase.from('session_requests').insert([{
      patient_id, treatment_id, requested_date, requested_time, notes, status: 'bekliyor'
    }]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Talebi onayla veya reddet (admin için)
app.put('/api/session-requests/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase yapılandırılmamış.' });
  const { status, rejection_reason } = req.body;

  try {
    // Talebi güncelle
    const { data: updatedReq, error: updateErr } = await supabase
      .from('session_requests')
      .update({ status, rejection_reason: rejection_reason || null })
      .eq('id', req.params.id)
      .select('*, patient:patients(id, full_name), treatment:treatments(name, price)')
      .single();
    if (updateErr) throw updateErr;

    // Onaylandıysa sessions tablosuna da ekle
    if (status === 'onaylandi') {
      const { error: sessionErr } = await supabase.from('sessions').insert([{
        patient_id: updatedReq.patient_id,
        treatment_id: updatedReq.treatment_id,
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

app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});
