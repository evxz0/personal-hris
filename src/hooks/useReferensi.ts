import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/utils'

export type KategoriReferensi = 'JENJANG' | 'JABATAN_KARYAWAN' | 'JABATAN_BINA' | 'OUTLET' | 'OUTLET_SK'

export interface Referensi {
  id: string
  kategori: KategoriReferensi
  nama_referensi: string
  status_aktif: boolean
  created_at: string
}

// Map virtual categories to existing DB enum values to satisfy Postgres CHECK constraints
function toDbKategori(kategori?: KategoriReferensi): string | undefined {
  if (!kategori) return undefined
  if (kategori === 'OUTLET_SK') return 'JABATAN_BINA'
  return kategori
}

function fromDbKategori(kategori: string): KategoriReferensi {
  if (kategori === 'JABATAN_BINA') return 'OUTLET_SK'
  return kategori as KategoriReferensi
}

export function useReferensi(kategori?: KategoriReferensi) {
  const dbKategori = toDbKategori(kategori)
  return useQuery({
    queryKey: ['referensi', kategori],
    queryFn: async () => {
      let q = supabase.from('master_referensi').select('*').eq('status_aktif', true).order('nama_referensi')
      if (dbKategori) q = q.eq('kategori', dbKategori)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []).map(d => ({
        ...d,
        kategori: fromDbKategori(d.kategori)
      })) as Referensi[]
    },
  })
}

export function useAddReferensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { kategori: KategoriReferensi; nama_referensi: string }) => {
      const dbKategori = toDbKategori(payload.kategori) as string
      const { data, error } = await supabase.from('master_referensi').insert({
        kategori: dbKategori,
        nama_referensi: payload.nama_referensi.trim().toUpperCase(),
        status_aktif: true
      }).select().single()
      if (error) throw error
      await logAudit('TAMBAH_REFERENSI', JSON.stringify(payload))
      return {
        ...data,
        kategori: fromDbKategori(data.kategori)
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referensi'] }),
  })
}

export function useUpdateReferensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, nama_referensi }: { id: string; nama_referensi: string }) => {
      const { data, error } = await supabase
        .from('master_referensi')
        .update({ nama_referensi: nama_referensi.trim().toUpperCase() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      await logAudit('UPDATE_REFERENSI', JSON.stringify({ id, nama_referensi }))
      return {
        ...data,
        kategori: fromDbKategori(data.kategori)
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referensi'] }),
  })
}

export function useDeleteReferensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('master_referensi').update({ status_aktif: false }).eq('id', id)
      if (error) throw error
      await logAudit('HAPUS_REFERENSI', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referensi'] }),
  })
}

export function useCloneOutletToSk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: outlets, error: fetchErr } = await supabase
        .from('master_referensi')
        .select('nama_referensi')
        .eq('kategori', 'OUTLET')
        .eq('status_aktif', true)
      if (fetchErr) throw fetchErr

      if (!outlets || outlets.length === 0) return []

      const payloads = outlets.map(o => ({
        kategori: 'JABATAN_BINA', // maps to OUTLET_SK
        nama_referensi: o.nama_referensi,
        status_aktif: true,
      }))

      const { data, error } = await supabase.from('master_referensi').insert(payloads).select()
      if (error) throw error
      await logAudit('CLONE_OUTLET_TO_SK', `Menyalin ${payloads.length} outlet ke Master Outlet SK`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referensi'] }),
  })
}

export function useOutletSK() {
  const querySk = useReferensi('OUTLET_SK')
  const queryDefault = useReferensi('OUTLET')

  const data = (querySk.data && querySk.data.length > 0) ? querySk.data : (queryDefault.data ?? [])

  return {
    ...querySk,
    data,
    isLoading: querySk.isLoading && queryDefault.isLoading,
  }
}
