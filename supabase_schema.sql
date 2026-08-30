-- ============================================================
-- P-HRIS Database Schema
-- Jalankan semua perintah ini di Supabase SQL Editor
-- ============================================================
-- 1. MASTER REFERENSI (Dynamic Dropdowns)
CREATE TABLE IF NOT EXISTS master_referensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori TEXT NOT NULL CHECK (
    kategori IN (
      'JENJANG',
      'JABATAN_KARYAWAN',
      'JABATAN_BINA',
      'OUTLET',
      'OUTLET_SK'
    )
  ),
  nama_referensi VARCHAR(100) NOT NULL,
  status_aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referensi_kategori ON master_referensi(kategori);
-- 2. KARYAWAN (FTE, TAD, BINA)
CREATE TABLE IF NOT EXISTS karyawan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npp VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('FTE', 'TAD', 'BINA')),
  outlet VARCHAR(255),
  tanggal_lahir DATE,
  posisi_saat_ini VARCHAR(255),
  jenjang VARCHAR(100),
  jabatan VARCHAR(255),
  grade INTEGER CHECK (
    grade BETWEEN 1 AND 12
  ),
  nik VARCHAR(50),
  npp_digi_hc VARCHAR(100),
  npp_webmail VARCHAR(100),
  jenis_kelamin VARCHAR(20),
  tanggal_mulai DATE,
  tanggal_berakhir DATE,
  kd_wil VARCHAR(50),
  batch VARCHAR(50),
  no_rek VARCHAR(50),
  no_hp VARCHAR(50),
  sisa_cuti INTEGER DEFAULT 18,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_karyawan_npp ON karyawan(npp);
-- 3. MUTASI
CREATE TABLE IF NOT EXISTS mutasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npp VARCHAR(20) NOT NULL,
  nama VARCHAR(200) NOT NULL,
  kategori VARCHAR(50),
  outlet VARCHAR(100),
  jenjang VARCHAR(50),
  jabatan VARCHAR(100),
  grade INTEGER,
  tanggal_lahir DATE,
  nik VARCHAR(20),
  no_rek VARCHAR(30),
  no_hp VARCHAR(20),
  sisa_cuti INTEGER,
  keterangan TEXT,
  tanggal_aktif DATE,
  jenis_aksi VARCHAR(50) DEFAULT 'MUTASI',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mutasi_npp ON mutasi(npp);
ALTER TABLE mutasi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_mutasi" ON mutasi FOR ALL TO authenticated USING (true) WITH CHECK (true);
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
  jenis TEXT NOT NULL CHECK (jenis IN ('SAKIT', 'CUTI')),
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
  keperluan TEXT NOT NULL CHECK (keperluan IN ('OPEN PINPAD', 'FR')),
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
ALTER TABLE magang ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_naik_level ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_pinpad ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- Policy: authenticated users can do everything
CREATE POLICY "auth_all_referensi" ON master_referensi FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_karyawan" ON karyawan FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_magang" ON magang FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_absensi" ON absensi FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_naik_level" ON request_naik_level FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_pinpad" ON request_pinpad FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_audit" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- ============================================================
-- SEED DATA: Master Referensi (Contoh data awal)
-- ============================================================
INSERT INTO master_referensi (kategori, nama_referensi)
VALUES ('JENJANG', 'FTE'),
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
  ('OUTLET', 'CAPEM') ON CONFLICT DO NOTHING;

-- --------------------------------------------------------
-- Table: riwayat_surat
-- Description: Records generated/printed HRIS letters (SK PGS, Balasan Cuti)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.riwayat_surat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_surat TEXT NOT NULL,
  jenis_surat TEXT NOT NULL,
  nama_pegawai TEXT NOT NULL,
  npp_pegawai TEXT NOT NULL,
  tanggal_surat TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.riwayat_surat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on riwayat_surat" ON public.riwayat_surat FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------
-- 9. APP USERS (Custom Database Authentication)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPERADMIN', 'ADMIN_HR', 'OPERATOR', 'VIEWER')),
  status_aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to app_users" ON public.app_users FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access to app_users" ON public.app_users FOR ALL USING (true) WITH CHECK (true);

-- Seed Initial Users
-- Passwords are SHA-256 hashed
INSERT INTO public.app_users (username, nama, password_hash, role, status_aktif)
VALUES 
(
  'superadmin',
  'Super Administrator',
  '03cfaeb5fcbc23602fc5f03d2740203f1917b2b8d54c1cc8f921473fb114d7ff', -- Superadmin09908
  'SUPERADMIN',
  true
),
(
  'oric',
  'ADMIN ORIC',
  '80c540282d8e72a7b5d9e45a5efcd7455f896948d1ead9b9b8a3c00062ae4524', -- Oric2026**
  'ADMIN_HR',
  true
),
(
  '61852',
  'ADMIN 61852',
  '827408e6380ed7771e2b1732513a7f51e3ce7e15686e81658f7f904280dd3c46', -- Celine2026**
  'ADMIN_HR',
  true
),
(
  '54806',
  'ADMIN 54806',
  'cf5aface12ff4e2dfde17f9ecbb33441b00f74265f34c809a81b580df568bf9e', -- Bosku2026**
  'ADMIN_HR',
  true
)
ON CONFLICT (username) DO NOTHING;