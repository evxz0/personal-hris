# Product Requirements Document (PRD)
## Sistem Manajemen SDM (HRIS) Realtime & Multi-Device (Optimasi Data Besar & Keamanan Maksimal)

---

## 1. Ringkasan Executif
Dokumen ini mendefinisikan kebutuhan fungsional dan non-fungsional untuk aplikasi Sistem Informasi SDM (HRIS) berbasis web. Sistem ini dirancang untuk menyelesaikan masalah administrasi manual (berbasis Excel) dengan menyediakan platform terpusat untuk mengelola Master Data yang terisolasi secara modular (Halaman Karyawan, Halaman Terpisah Bina, Halaman Magang), Laporan Harian, absensi (Sakit/Cuti), penugasan Pgs, serta pengajuan (Naik Level & Pinpad). Sistem dioptimalkan untuk efisiensi input data, waktu pemrosesan cepat, pemisahan halaman arsitektur UI yang jelas, fleksibilitas manajemen opsi referensi (dinamis), dan standar keamanan tingkat tinggi (Maximum Security).

---

## 2. Spesifikasi Teknis (Tech Stack)
* **Frontend Framework:** React.js (menggunakan **Vite**).
* **UI/UX & State Management:** Tailwind CSS, TanStack Query, TanStack Table.
* **Database & Realtime Engine:** **Supabase (PostgreSQL)**.
* **Cloud Storage:** Supabase Storage (Private Bucket).
* **Deployment & Hosting:** **Cloudflare Pages** (dengan CDN premium dan perlindungan DDoS).

---

## 3. Kebutuhan Akses & Infrastruktur (Multi-Device Access)
* **Akses Terdistribusi:** Sistem dapat diakses dari jaringan lokal kantor maupun internet publik (rumah/remote).
* **Sinkronisasi Perangkat:** Mendukung *multi-device login*. Pembaruan data disinkronkan secara *realtime*.

---

## 4. Kebutuhan Fungsional & Perilaku Antarmuka (UI/UX)

### 4.1. Modul Halaman Master Data Karyawan (FTE & TAD)
Form input dan tabel pengelolaan data karyawan tetap (FTE) dan tenaga ahli daya (TAD).
* **Atribut & Perilaku UI:**
    * **Outlet:** Pilihan *dropdown* nama outlet yang dikelola secara dinamis.
    * **NPP & Nama:** Input teks standar.
    * **Tanggal Lahir:** Menggunakan *Datepicker* (Kalender).
    * **Posisi Saat Ini:** Input teks standar.
    * **Jenjang/Jabatan:** *Dropdown* dinamis. Pilihan jenjang (FTE/TAD) dan jabatan (CS/TELER/PENYELIA/BM, dll) **tidak di-hardcode**, melainkan mengambil data dari Master Referensi sehingga Admin dapat **menambah atau menghapus opsi jenjang/jabatan baru** sewaktu-waktu sesuai kebutuhan.
    * **Grade:** *Dropdown* pilihan angka 1-12.
    * **NIK, No. Rekening, No. HP:** Input teks angka.

### 4.2. Modul Halaman Terpisah: Master Data Bina
*Sesuai usulan arsitektur terbaru, data Bina diisolasi penuh ke dalam halaman tersendiri dengan jalur navigasi dan menu terpisah dari karyawan FTE/TAD untuk meningkatkan efisiensi fokus kerja.*
* **Atribut & Perilaku UI:**
    * **Outlet:** Pilihan *dropdown* nama outlet (dinamis).
    * **NPP & Nama:** Input teks standar.
    * **Jabatan:** *Dropdown* dinamis khusus untuk Bina. Admin dapat menambah/menghapus pilihan jabatan Bina sesuai kebutuhan (tanpa pilihan jenjang FTE/TAD dan tanpa Grade).
    * **Tanggal Lahir:** *Datepicker* (Kalender).
    * **No. Rekening, No. HP:** Input teks angka.

### 4.3. Modul Halaman Master Data Magang
Form input untuk mengelola data mahasiswa/siswa magang (Halaman Terpisah).
* **Atribut & Perilaku UI:**
    * **Nama, Fakultas, Universitas, Rumah, Penempatan:** Input teks standar.
    * **Lama Magang:** Menggunakan *Date Range Picker* (Pilih Tanggal Mulai dan Tanggal Selesai).
    * **Total Lama Magang (Hari):** *Read-only/Auto-calculated* selisih hari otomatis.

### 4.4. Modul Manajemen Data Referensi (Settings/Konfigurasi)
Modul khusus bagi Admin untuk mengelola opsi *dropdown* yang digunakan di seluruh aplikasi.
* **Fitur Utama:** Form CRUD (Create, Read, Update, Delete) untuk mengelola daftar:
    * **Master Jenjang** (tambah/hapus opsi jenjang).
    * **Master Jabatan** (tambah/hapus opsi jabatan untuk Karyawan dan Bina).
    * **Master Outlet** (tambah/hapus daftar outlet).

### 4.5. Modul Absensi (Izin Sakit & Izin Cuti)
* **Izin Sakit & Izin Cuti:** Input NPP akan secara otomatis mengisi (**Auto-fill**) kolom Nama dan Jabatan/Jenjang.
* **Sisa Cuti:** Kuota *default* 18 hari, dapat diedit manual oleh Admin, dan otomatis berkurang berdasarkan kalkulasi kalender.

### 4.6. Modul Pengajuan (Request)
* **Request Naik Level:** Tanggal terisi otomatis, input NPP otomatis mengisi Nama.
* **Request Pinpad:** Pilihan keperluan dibatasi ketat (*OPEN PINPAD* dan *FR*).

---

## 5. Kebutuhan Keamanan Maksimal & Non-Fungsional
* **Row Level Security (RLS) & Isolasional Tabel:** Database tingkat tinggi diatur menggunakan RLS Supabase terpisah per tabel.
* **Keamanan File Lampiran:** Bukti dokumen menggunakan Private Bucket Supabase Storage dengan *Signed URL*.
* **Proteksi Jaringan:** WAF Cloudflare Pages untuk mencegah eksploitasi web.
* **Audit Trail:** Modifikasi data terekam detail di `AUDIT_LOGS`.

---

## 6. Rancangan Struktur Data (High-Level Schema)
*Skema dioptimalkan dengan penambahan tabel `MASTER_REFERENSI` untuk mendukung penambahan/penghapusan data Jenjang, Jabatan, dan Outlet secara dinamis tanpa mengubah kode program.*

1.  **Tabel `MASTER_REFERENSI`** (Pengaturan Dinamis Dropdown)
    * `id` (UUID, PK)
    * `kategori` (Enum: 'JENJANG', 'JABATAN_KARYAWAN', 'JABATAN_BINA', 'OUTLET')
    * `nama_referensi` (Varchar - e.g., 'FTE', 'CS', 'PENYELIA')
    * `status_aktif` (Boolean, Default True)

2.  **Tabel `KARYAWAN`** (Halaman Master Karyawan - FTE & TAD)
    * `id` (UUID, PK)
    * `npp` (Varchar, UK, **Indexed**)
    * `nama` (Varchar)
    * `kategori` (Enum: 'FTE', 'TAD')
    * `outlet` (Varchar, berelasi dengan MASTER_REFERENSI)
    * `tanggal_lahir` (Date)
    * `posisi_saat_ini` (Varchar)
    * `jenjang` (Varchar, berelasi dengan MASTER_REFERENSI)
    * `jabatan` (Varchar, berelasi dengan MASTER_REFERENSI)
    * `grade` (Integer 1-12)
    * `nik` (Varchar)
    * `no_rek` (Varchar)
    * `no_hp` (Varchar)
    * `sisa_cuti` (Integer, Default 18)

3.  **Tabel `BINA`** (Halaman Master Terpisah - Khusus Bina)
    * `id` (UUID, PK)
    * `npp` (Varchar, UK, **Indexed**)
    * `nama` (Varchar)
    * `outlet` (Varchar, berelasi dengan MASTER_REFERENSI)
    * `jabatan` (Varchar, berelasi dengan MASTER_REFERENSI)
    * `tanggal_lahir` (Date)
    * `no_rek` (Varchar)
    * `no_hp` (Varchar)
    * `sisa_cuti` (Integer, Default 18)

4.  **Tabel `MAGANG`**
    * `id` (UUID, PK), `nama`, `fakultas`, `universitas`, `tanggal_mulai`, `tanggal_selesai`, `total_lama_hari`, `rumah`, `penempatan`

5.  **Tabel `ABSENSI`** (Sakit & Cuti)
    * `id` (UUID, PK), `npp` (Varchar, **Indexed**), `jenis` (Enum: 'SAKIT', 'CUTI'), `tanggal_mulai`, `tanggal_selesai`, `keterangan`

6.  **Tabel `REQUEST_NAIK_LEVEL`**
    * `id` (UUID, PK), `tanggal_buat`, `npp`, `level_diajukan`, `waktu_mulai`, `waktu_selesai`, `keterangan`

7.  **Tabel `REQUEST_PINPAD`**
    * `id` (UUID, PK), `keperluan`, `npp_user`, `waktu_mulai`, `waktu_selesai`, `keterangan`

8.  **Tabel `AUDIT_LOGS`**
    * `id` (UUID, PK), `user_operasi`, `aksi`, `detail_perubahan`, `timestamp`, `device_info`

Sambungkan ke database di bawah ini jika di perlukan

    1. Install package
Run this command to install the required dependencies.
Details:
npm install @supabase/supabase-js
Code:
File: Code
```
npm install @supabase/supabase-js
```

2. Add Supabase UI components
Run this command to install the Supabase shadcn components.
Details:
npx shadcn@latest add @supabase/supabase-client-react-router
Code:
File: Code
```
npx shadcn@latest add @supabase/supabase-client-react-router
```

3. Set env variables
Add the following values to your env file.
Code:
File: .env
```
VITE_SUPABASE_URL=https://aldoyiiculserlfffavy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_kFk0Mu0pWxkZ8jrs_aZWbg_PW61QAKh
```

4. Check out more UI components
Add auth, realtime and storage functionality to your project
Details:
Explore supabase.com/ui

5. Install Agent Skills (Optional)
Agent Skills give AI coding tools ready-made instructions, scripts, and resources for working with Supabase more accurately and efficiently.
Details:
npx skills add supabase/agent-skills
Code:
File: Code
```
npx skills add supabase/agent-skills
```


buatlah ui nya enak di lihat dan efisien