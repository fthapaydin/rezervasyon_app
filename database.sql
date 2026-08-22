-- Eski tablolari silmek istersen (opsiyonel, onceki verilerin gidecektir!):
-- DROP TABLE IF EXISTS appointments;
-- DROP TABLE IF EXISTS services;

-- 1. Hastalar Tablosu
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  email VARCHAR,
  age INTEGER,
  complaint TEXT, -- Şikayeti / Tanı
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tedaviler Tablosu (Örn: Manuel Terapi, Egzersiz, Klinik Masaj)
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  price DECIMAL NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Seanslar Tablosu
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id),
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  status VARCHAR DEFAULT 'bekliyor', -- bekliyor, tamamlandi, iptal
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ödemeler Tablosu
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  payment_method VARCHAR NOT NULL, -- Nakit, Kredi Kartı, Havale
  installments INTEGER DEFAULT 1, -- Taksit Sayısı (1 = Tek Çekim/Peşin)
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
