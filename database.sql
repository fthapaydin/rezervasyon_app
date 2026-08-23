-- =========================================================
-- FİZYOPANEL VERİTABANI & RLS İZİN SCRİPTİ
-- =========================================================

-- 1. Tablolar henüz yoksa oluştur
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  price DECIMAL NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id),
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  status VARCHAR DEFAULT 'bekliyor',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  payment_method VARCHAR NOT NULL,
  installments INTEGER DEFAULT 1,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Var olan tablolarda eksik sütunlar varsa GÜVENLE EKLE
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender VARCHAR;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS complaint TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 10;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1;

-- 3. RLS (Row Level Security) İzinleri ve Politikaları
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatments DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Politikaları da açık olarak herkese izin verecek şekilde ayarla
DROP POLICY IF EXISTS "Allow public all patients" ON patients;
CREATE POLICY "Allow public all patients" ON patients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all treatments" ON treatments;
CREATE POLICY "Allow public all treatments" ON treatments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all sessions" ON sessions;
CREATE POLICY "Allow public all sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all payments" ON payments;
CREATE POLICY "Allow public all payments" ON payments FOR ALL USING (true) WITH CHECK (true);
