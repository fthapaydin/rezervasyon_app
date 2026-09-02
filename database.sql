-- =========================================================
-- FİZYOPANEL GELİŞMİŞ SAAS VERİTABANI & RBAC ŞEMASI
-- =========================================================

-- 1. KLİNİKLER TABLOSU
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  owner_name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'aktif',      -- 'aktif' | 'pasif' | 'deneme'
  plan VARCHAR DEFAULT 'standart',     -- 'standart' | 'premium' | 'kurumsal'
  city VARCHAR DEFAULT 'İstanbul',     -- İl
  district VARCHAR DEFAULT 'Kadıköy',  -- İlçe
  address TEXT,
  logo_url TEXT,                       -- Özel Logo URL
  theme_color VARCHAR DEFAULT '#059669', -- Tema Rengi (#059669, #2563eb, #7c3aed vb.)
  work_start_time VARCHAR DEFAULT '08:00',
  work_end_time VARCHAR DEFAULT '20:00',
  working_days JSONB DEFAULT '["Pzt","Sal","Çar","Per","Cum","Cmt"]'::jsonb,
  whatsapp_api_key TEXT,               -- Meta Cloud API Token
  whatsapp_phone_id TEXT,              -- Meta Phone ID
  auto_whatsapp_enabled BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PERSONEL & FİZYOTERAPİSTLER TABLOSU (RBAC)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  full_name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  role VARCHAR NOT NULL DEFAULT 'therapist', -- 'admin' | 'therapist' | 'secretary'
  title VARCHAR DEFAULT 'Fizyoterapist',     -- 'Uzm. Fzt.', 'Manuel Terapist', 'Sekreter' vb.
  color VARCHAR DEFAULT '#059669',          -- Takvimdeki terapist rengi
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HASTALAR TABLOSU
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  full_name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  email VARCHAR,
  age INTEGER,
  gender VARCHAR,
  address TEXT,
  complaint TEXT,
  total_sessions INTEGER DEFAULT 10,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TEDAVİLER TABLOSU
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  price DECIMAL NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SEANSLAR TABLOSU
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  therapist_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  status VARCHAR DEFAULT 'bekliyor',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ÖDEMELER TABLOSU
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  payment_method VARCHAR NOT NULL,
  installments INTEGER DEFAULT 1,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. HASTA RANDEVU TALEPLERİ TABLOSU
CREATE TABLE IF NOT EXISTS session_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  therapist_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  status VARCHAR DEFAULT 'bekliyor',
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TÜM KLİNİKLER İÇİN GENEL DUYURU & KAMPANYA TABLOSU
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR DEFAULT 'info',        -- 'info' | 'warning' | 'success' | 'campaign'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. VAR OLAN TABLOLARDA EKSİK SÜTUNLARI GÜVENLE EKLE
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS city VARCHAR DEFAULT 'İstanbul';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS district VARCHAR DEFAULT 'Kadıköy';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS theme_color VARCHAR DEFAULT '#059669';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS work_start_time VARCHAR DEFAULT '08:00';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS work_end_time VARCHAR DEFAULT '20:00';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS working_days JSONB DEFAULT '["Pzt","Sal","Çar","Per","Cum","Cmt"]'::jsonb;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_phone_id TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS auto_whatsapp_enabled BOOLEAN DEFAULT false;

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS therapist_id UUID REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE session_requests ADD COLUMN IF NOT EXISTS therapist_id UUID REFERENCES staff(id) ON DELETE SET NULL;

-- 10. VARSAYILAN DEMO KLİNİK & DEMO PERSONEL
INSERT INTO clinics (id, name, slug, owner_name, phone, email, password, status, plan, city, district, theme_color)
VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'KlinikBul Demo Klinik',
  'demo-klinik',
  'Dr. Fatih Apaydın',
  '05555555555',
  'demo@fizyotim.com',
  'demo123',
  'aktif',
  'premium',
  'İstanbul',
  'Kadıköy',
  '#059669'
)
ON CONFLICT (email) DO UPDATE SET city = 'İstanbul', district = 'Kadıköy';

-- Demo Terapistler Ekle
INSERT INTO staff (id, clinic_id, full_name, role, title, color, phone, email)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Dr. Fatih Apaydın', 'admin', 'Klinik Sahibi / Baş Fzt.', '#059669', '05555555555', 'fatih@fizyotim.com'),
  ('a2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'Fzt. Ayşe Yılmaz', 'therapist', 'Manuel Terapist', '#2563eb', '05554443322', 'ayse@fizyotim.com'),
  ('a3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'Fzt. Mehmet Demir', 'therapist', 'Spor Fizyoterapisti', '#ea580c', '05553332211', 'mehmet@fizyotim.com')
ON CONFLICT (id) DO NOTHING;

-- Varsayılan Örnek Duyuru
INSERT INTO announcements (title, message, type, is_active)
VALUES (
  '🎉 FizyoPanel 2.0 Güncellemesi Yayında!',
  '81 İl ve İlçe desteği, Masaüstü QR Standı ve Çoklu Terapist filtreleme özellikleri panelinize eklendi.',
  'campaign',
  true
)
ON CONFLICT DO NOTHING;

-- 11. RLS (ROW LEVEL SECURITY) İZİNLERİ
ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatments DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all clinics" ON clinics;
CREATE POLICY "Allow public all clinics" ON clinics FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all staff" ON staff;
CREATE POLICY "Allow public all staff" ON staff FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all patients" ON patients;
CREATE POLICY "Allow public all patients" ON patients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all treatments" ON treatments;
CREATE POLICY "Allow public all treatments" ON treatments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all sessions" ON sessions;
CREATE POLICY "Allow public all sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all payments" ON payments;
CREATE POLICY "Allow public all payments" ON payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all session_requests" ON session_requests;
CREATE POLICY "Allow public all session_requests" ON session_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all announcements" ON announcements;
CREATE POLICY "Allow public all announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
