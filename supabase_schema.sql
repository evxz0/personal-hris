-- ============================================================
-- P-HRIS Database Schema
-- Jalankan semua perintah ini di Supabase SQL Editor
-- ============================================================

-- 1. MASTER REFERENSI (Dynamic Dropdowns)
CREATE TABLE IF NOT EXISTS master_referensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori TEXT NOT NULL CHECK (kategori IN ('JENJANG','JABATAN_KARYAWAN','JABATAN_BINA','OUTLET')),
  nama_referensi VARCHAR(100) NOT NULL,
  status_aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referensi_kategori ON master_referensi(kategori);

-- 2. KARYAWAN (FTE & TAD)
CREATE TABLE IF NOT EXISTS karyawan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npp VARCHAR(20) UNIQUE NOT NULL,
  nama VARCHAR(200) NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('FTE','TAD')),
  outlet VARCHAR(100),
  tanggal_lahir DATE,
  posisi_saat_ini VARCHAR(100),
  jenjang VARCHAR(50),
  jabatan VARCHAR(50),
  grade INTEGER CHECK (grade BETWEEN 1 AND 12),
  nik VARCHAR(20),
  no_rek VARCHAR(30),
  no_hp VARCHAR(20),
  sisa_cuti INTEGER DEFAULT 18,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_karyawan_npp ON karyawan(npp);

-- 3. BINA
CREATE TABLE IF NOT EXISTS bina (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npp VARCHAR(20) UNIQUE NOT NULL,
  nama VARCHAR(200) NOT NULL,
  outlet VARCHAR(100),
  jabatan VARCHAR(50),
  tanggal_lahir DATE,
  no_rek VARCHAR(30),
  no_hp VARCHAR(20),
  sisa_cuti INTEGER DEFAULT 18,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bina_npp ON bina(npp);

-- 4. MAGANG
CREATE TABLE IF NOT EXISTS magang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(200) NOT NULL,
  fakultas VARCHAR(200),
  universitas VARCHAR(200),
  rumah VARCHAR(200),
  penempatan VARCHAR(200),
  tanggal_mulai DATE,
  tanggal_selesai DATE,
  total_lama_hari INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ABSENSI
CREATE TABLE IF NOT EXISTS absensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npp VARCHAR(20) NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('SAKIT','CUTI')),
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_absensi_npp ON absensi(npp);

-- 6. REQUEST NAIK LEVEL
CREATE TABLE IF NOT EXISTS request_naik_level (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal_buat DATE DEFAULT CURRENT_DATE,
  npp VARCHAR(20) NOT NULL,
  nama VARCHAR(200),
  level_diajukan VARCHAR(50),
  waktu_mulai DATE,
  waktu_selesai DATE,
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REQUEST PINPAD
CREATE TABLE IF NOT EXISTS request_pinpad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keperluan TEXT NOT NULL CHECK (keperluan IN ('OPEN PINPAD','FR')),
  npp_user VARCHAR(20) NOT NULL,
  nama VARCHAR(200),
  waktu_mulai DATE,
  waktu_selesai DATE,
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_operasi VARCHAR(100) DEFAULT 'admin',
  aksi VARCHAR(100) NOT NULL,
  detail_perubahan TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  device_info TEXT
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE master_referensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE karyawan ENABLE ROW LEVEL SECURITY;
ALTER TABLE bina ENABLE ROW LEVEL SECURITY;
ALTER TABLE magang ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_naik_level ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_pinpad ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can do everything
CREATE POLICY "auth_all_referensi" ON master_referensi FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_karyawan" ON karyawan FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_bina" ON bina FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_magang" ON magang FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_absensi" ON absensi FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_naik_level" ON request_naik_level FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_pinpad" ON request_pinpad FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_audit" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA: Master Referensi (Contoh data awal)
-- ============================================================
INSERT INTO master_referensi (kategori, nama_referensi) VALUES
  ('JENJANG', 'FTE'),
  ('JENJANG', 'TAD'),
  ('JABATAN_KARYAWAN', 'CS'),
  ('JABATAN_KARYAWAN', 'TELER'),
  ('JABATAN_KARYAWAN', 'PENYELIA'),
  ('JABATAN_KARYAWAN', 'BM'),
  ('JABATAN_KARYAWAN', 'CAPEM'),
  ('JABATAN_BINA', 'STAFF'),
  ('JABATAN_BINA', 'SUPERVISOR'),
  ('JABATAN_BINA', 'MANAGER'),
  ('OUTLET', 'KANTOR PUSAT'),
  ('OUTLET', 'CABANG UTAMA'),
  ('OUTLET', 'CAPEM')
ON CONFLICT DO NOTHING;

-- ============================================================
-- AUTH: Buat User Admin (Jalankan di Supabase Dashboard > Auth > Users)
-- Atau via SQL (catatan: gunakan Supabase Dashboard untuk membuat user):
-- Email: 61582@phris.local
-- Password: Celine021*
-- ============================================================
-- Jika menggunakan SQL (Supabase hanya mendukung insert via auth.users dengan service role):
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role)
-- VALUES ('61582@phris.local', crypt('Celine021*', gen_salt('bf')), now(), 'authenticated');
