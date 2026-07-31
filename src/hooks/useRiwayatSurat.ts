import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface RiwayatSurat {
  id: string
  nomor_surat: string
  jenis_surat: 'SK PGS' | 'Surat Balasan Cuti'
  nama_pegawai: string
  npp_pegawai: string
  tanggal_surat: string
  payload: Record<string, unknown>
  created_at: string
}

export type RiwayatSuratInsert = Omit<RiwayatSurat, 'id' | 'created_at'>

const LOCAL_STORAGE_KEY = 'phris_riwayat_surat'

function getLocalHistory(): RiwayatSurat[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalHistory(list: RiwayatSurat[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Failed to save local history', e)
  }
}

export function useRiwayatSurat(searchQuery = '') {
  return useQuery({
    queryKey: ['riwayat-surat', searchQuery],
    queryFn: async () => {
      try {
        let q = supabase.from('riwayat_surat').select('*').order('created_at', { ascending: false })
        if (searchQuery) {
          q = q.or(`nomor_surat.ilike.%${searchQuery}%,nama_pegawai.ilike.%${searchQuery}%,npp_pegawai.ilike.%${searchQuery}%,jenis_surat.ilike.%${searchQuery}%`)
        }
        const { data, error } = await q
        if (error) throw error
        return (data ?? []) as RiwayatSurat[]
      } catch (err) {
        console.warn('Supabase riwayat_surat query failed or table missing, using local storage fallback:', err)
        let list = getLocalHistory()
        if (searchQuery) {
          const sq = searchQuery.toLowerCase()
          list = list.filter(item =>
            item.nomor_surat.toLowerCase().includes(sq) ||
            item.nama_pegawai.toLowerCase().includes(sq) ||
            item.npp_pegawai.toLowerCase().includes(sq) ||
            item.jenis_surat.toLowerCase().includes(sq)
          )
        }
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }
    },
  })
}

export function useAddRiwayatSurat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: RiwayatSuratInsert) => {
      const newItem: RiwayatSurat = {
        ...payload,
        id: 'RS-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        created_at: new Date().toISOString()
      }

      // Save to localStorage fallback
      const localList = getLocalHistory()
      // Avoid exact duplicate within 5 seconds
      const isDuplicate = localList.some(item =>
        item.nomor_surat === newItem.nomor_surat &&
        item.npp_pegawai === newItem.npp_pegawai &&
        (new Date(newItem.created_at).getTime() - new Date(item.created_at).getTime()) < 5000
      )
      if (!isDuplicate) {
        localList.unshift(newItem)
        saveLocalHistory(localList)
      }

      // Save to Supabase if table exists
      try {
        const { error } = await supabase.from('riwayat_surat').insert([{
          nomor_surat: payload.nomor_surat,
          jenis_surat: payload.jenis_surat,
          nama_pegawai: payload.nama_pegawai,
          npp_pegawai: payload.npp_pegawai,
          tanggal_surat: payload.tanggal_surat,
          payload: payload.payload
        }])
        if (error) {
          console.warn('Could not insert to Supabase riwayat_surat table, stored locally:', error)
        }
      } catch (err) {
        console.warn('Supabase insert failed:', err)
      }

      return newItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['riwayat-surat'] })
    },
  })
}

export function useDeleteRiwayatSurat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // Local storage delete
      const localList = getLocalHistory().filter(item => item.id !== id)
      saveLocalHistory(localList)

      // Supabase delete
      try {
        await supabase.from('riwayat_surat').delete().eq('id', id)
      } catch (err) {
        console.warn('Supabase delete failed:', err)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['riwayat-surat'] })
    },
  })
}
