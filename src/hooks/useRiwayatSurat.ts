import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface RiwayatSurat {
  id: string
  nomor_surat: string
  jenis_surat: 'SK PGS' | 'Surat Balasan Cuti' | 'Surat Keterangan Kerja'
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

        // Auto-sync offline/local storage entries to Supabase cloud if table exists
        const localList = getLocalHistory()
        if (localList.length > 0 && Array.isArray(data)) {
          const supabaseKeys = new Set(data.map(d => `${d.nomor_surat}-${d.npp_pegawai}-${d.tanggal_surat}`))
          const unsynced = localList.filter(l => !supabaseKeys.has(`${l.nomor_surat}-${l.npp_pegawai}-${l.tanggal_surat}`))
          
          if (unsynced.length > 0) {
            const rowsToInsert = unsynced.map(u => ({
              nomor_surat: u.nomor_surat,
              jenis_surat: u.jenis_surat,
              nama_pegawai: u.nama_pegawai,
              npp_pegawai: u.npp_pegawai,
              tanggal_surat: u.tanggal_surat,
              payload: u.payload,
              created_at: u.created_at
            }))
            supabase.from('riwayat_surat').insert(rowsToInsert).then(({ error: syncErr }) => {
              if (!syncErr) {
                // All local entries synced to cloud successfully
              }
            })
          }
        }

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
      let savedCloudItem: RiwayatSurat | null = null

      // 1. Try to save directly to Supabase cloud
      try {
        const { data, error } = await supabase.from('riwayat_surat').insert([{
          nomor_surat: payload.nomor_surat,
          jenis_surat: payload.jenis_surat,
          nama_pegawai: payload.nama_pegawai,
          npp_pegawai: payload.npp_pegawai,
          tanggal_surat: payload.tanggal_surat,
          payload: payload.payload
        }]).select().single()

        if (!error && data) {
          savedCloudItem = data as RiwayatSurat
        }
      } catch (err) {
        console.warn('Supabase cloud insert failed:', err)
      }

      // 2. Keep local backup in localStorage
      const newItem: RiwayatSurat = savedCloudItem || {
        ...payload,
        id: 'RS-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        created_at: new Date().toISOString()
      }

      const localList = getLocalHistory()
      const isDuplicate = localList.some(item =>
        item.nomor_surat === newItem.nomor_surat &&
        item.npp_pegawai === newItem.npp_pegawai &&
        (new Date(newItem.created_at).getTime() - new Date(item.created_at).getTime()) < 5000
      )
      if (!isDuplicate) {
        localList.unshift(newItem)
        saveLocalHistory(localList)
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

export function useBulkDeleteRiwayatSurat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const setIds = new Set(ids)
      const localList = getLocalHistory().filter(item => !setIds.has(item.id))
      saveLocalHistory(localList)

      try {
        await supabase.from('riwayat_surat').delete().in('id', ids)
      } catch (err) {
        console.warn('Supabase bulk delete failed:', err)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['riwayat-surat'] })
    },
  })
}
