import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/utils'

export interface Karyawan {
  id: string
  npp: string
  nama: string
  kategori: 'FTE' | 'TAD'
  outlet: string | null
  tanggal_lahir: string | null
  posisi_saat_ini: string | null
  jenjang: string | null
  jabatan: string | null
  grade: number | null
  nik: string | null
  no_rek: string | null
  no_hp: string | null
  sisa_cuti: number | null
  created_at: string
}

export type KaryawanInsert = Omit<Karyawan, 'id' | 'created_at'>

export function useKaryawan(searchQuery = '') {
  return useQuery({
    queryKey: ['karyawan', searchQuery],
    queryFn: async () => {
      let q = supabase.from('karyawan').select('*').order('nama')
      if (searchQuery) {
        q = q.or(`nama.ilike.%${searchQuery}%,npp.ilike.%${searchQuery}%,jabatan.ilike.%${searchQuery}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Karyawan[]
    },
  })
}

export function useKaryawanByNPP(npp: string) {
  return useQuery({
    queryKey: ['karyawan-npp', npp],
    queryFn: async () => {
      if (!npp || npp.length < 3) return null
      const { data, error } = await supabase.from('karyawan').select('*').eq('npp', npp).maybeSingle()
      if (error) throw error
      return data as Karyawan | null
    },
    enabled: npp.length >= 3,
  })
}

export function useAddKaryawan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: KaryawanInsert) => {
      const { data, error } = await supabase.from('karyawan').insert(payload).select().single()
      if (error) throw error
      await logAudit('TAMBAH_KARYAWAN', JSON.stringify({ npp: payload.npp, nama: payload.nama }))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['karyawan'] }),
  })
}

export function useUpdateKaryawan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<KaryawanInsert> }) => {
      const { data, error } = await supabase.from('karyawan').update(payload).eq('id', id).select().single()
      if (error) throw error
      await logAudit('UPDATE_KARYAWAN', JSON.stringify({ id, ...payload }))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['karyawan'] }),
  })
}

export function useDeleteKaryawan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('karyawan').delete().eq('id', id)
      if (error) throw error
      await logAudit('HAPUS_KARYAWAN', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['karyawan'] }),
  })
}

export function useBulkInsertKaryawan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows: KaryawanInsert[]) => {
      const { data, error } = await supabase.from('karyawan').upsert(rows, { onConflict: 'npp' }).select()
      if (error) throw error
      await logAudit('BULK_IMPORT_KARYAWAN', `${rows.length} data diimport`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['karyawan'] }),
  })
}
