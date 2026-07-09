import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type Database = {
  public: {
    Tables: {
      master_referensi: {
        Row: {
          id: string
          kategori: 'JENJANG' | 'JABATAN_KARYAWAN' | 'JABATAN_BINA' | 'OUTLET'
          nama_referensi: string
          status_aktif: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['master_referensi']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['master_referensi']['Insert']>
      }
      karyawan: {
        Row: {
          id: string
          npp: string
          nama: string
          kategori: 'FTE' | 'TAD'
          outlet: string
          tanggal_lahir: string
          posisi_saat_ini: string
          jenjang: string
          jabatan: string
          grade: number
          nik: string
          no_rek: string
          no_hp: string
          sisa_cuti: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['karyawan']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['karyawan']['Insert']>
      }
      bina: {
        Row: {
          id: string
          npp: string
          nama: string
          outlet: string
          jabatan: string
          tanggal_lahir: string
          no_rek: string
          no_hp: string
          sisa_cuti: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bina']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bina']['Insert']>
      }
      magang: {
        Row: {
          id: string
          nama: string
          fakultas: string
          universitas: string
          rumah: string
          penempatan: string
          tanggal_mulai: string
          tanggal_selesai: string
          total_lama_hari: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['magang']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['magang']['Insert']>
      }
      absensi: {
        Row: {
          id: string
          npp: string
          jenis: 'SAKIT' | 'CUTI'
          tanggal_mulai: string
          tanggal_selesai: string
          keterangan: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['absensi']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['absensi']['Insert']>
      }
      request_naik_level: {
        Row: {
          id: string
          tanggal_buat: string
          npp: string
          nama: string
          level_diajukan: string
          waktu_mulai: string
          waktu_selesai: string
          keterangan: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['request_naik_level']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['request_naik_level']['Insert']>
      }
      request_pinpad: {
        Row: {
          id: string
          keperluan: 'OPEN PINPAD' | 'FR'
          npp_user: string
          nama: string
          waktu_mulai: string
          waktu_selesai: string
          keterangan: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['request_pinpad']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['request_pinpad']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          user_operasi: string
          aksi: string
          detail_perubahan: string
          timestamp: string
          device_info: string
        }
      }
    }
  }
}
