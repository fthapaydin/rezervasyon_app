-- =========================================================
-- FİZYOPANEL MULTI-TENANT VERİTABANI & SÜPER ADMİN ŞEMASI
-- =========================================================

-- 1. KLİNİKLER TABLOSU
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,               -- Klinik Adı (Örn: Apaydın Fizyoterapi)
  slug VARCHAR UNIQUE NOT NULL,        -- URL Slug (Örn: apaydin-fizyo)
  owner_name VARCHAR NOT NULL,         -- Yetkili Ad Soyad
  phone VARCHAR NOT NULL,              -- İletişim Telefonu
  email VARCHAR UNIQUE NOT NULL,       -- Giriş E-postası
  password VARCHAR NOT NULL,           -- Giriş Şifresi
  status VARCHAR DEFAULT 'aktif',      -- 'aktif' | 'pasif' | 'deneme'
  plan VARCHAR DEFAULT 'standart',     -- 'standart' | 'premium' | 'kurumsal'
  address TEXT,                        -- Klinik Adresi
  notes TEXT,                          -- Yönetici Notları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HASTALAR TABLOSU
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

-- 3. TEDAVİLER TABLOSU
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  price DECIMAL NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SEANSLAR TABLOSU
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  status VARCHAR DEFAULT 'bekliyor',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ÖDEMELER TABLOSU
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

-- 6. HASTA RANDEVU TALEPLERİ TABLOSU
CREATE TABLE IF NOT EXISTS session_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  status VARCHAR DEFAULT 'bekliyor',
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. VAR OLAN TABLOLARDA EKSİK SÜTUNLARI GÜVENLE EKLE
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender VARCHAR;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS complaint TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 10;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE treatments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1;
ALTER TABLE session_requests ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

-- 8. VARSAYILAN DEMO KLİNİK OLUŞTUR & ESKİ VERİLERİ BAĞLA
INSERT INTO clinics (id, name, slug, owner_name, phone, email, password, status, plan)
VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'FizyoPanel Demo Klinik',
  'demo-klinik',
  'Dr. Fatih Apaydın',
  '05555555555',
  'demo@fizyopanel.com',
  'demo123',
  'aktif',
  'premium'
)
ON CONFLICT (email) DO NOTHING;

-- clinic_id'si boş olan eski kayıtları varsayılan kliniğe ata
UPDATE patients SET clinic_id = 'c1111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
UPDATE treatments SET clinic_id = 'c1111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
UPDATE sessions SET clinic_id = 'c1111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
UPDATE payments SET clinic_id = 'c1111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
UPDATE session_requests SET clinic_id = 'c1111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;

-- 9. RLS (ROW LEVEL SECURITY) İZİNLERİ
ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatments DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_requests DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all clinics" ON clinics;
CREATE POLICY "Allow public all clinics" ON clinics FOR ALL USING (true) WITH CHECK (true);

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
