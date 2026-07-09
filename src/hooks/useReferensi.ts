import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/utils'

export type KategoriReferensi = 'JENJANG' | 'JABATAN_KARYAWAN' | 'JABATAN_BINA' | 'OUTLET'

export interface Referensi {
  id: string
  kategori: KategoriReferensi
  nama_referensi: string
  status_aktif: boolean
  created_at: string
}

export function useReferensi(kategori?: KategoriReferensi) {
  return useQuery({
    queryKey: ['referensi', kategori],
    queryFn: async () => {
      let q = supabase.from('master_referensi').select('*').eq('status_aktif', true).order('nama_referensi')
      if (kategori) q = q.eq('kategori', kategori)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Referensi[]
    },
  })
}

export function useAddReferensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { kategori: KategoriReferensi; nama_referensi: string }) => {
      const { data, error } = await supabase.from('master_referensi').insert({ ...payload, status_aktif: true }).select().single()
      if (error) throw error
      await logAudit('TAMBAH_REFERENSI', JSON.stringify(payload))
      return data
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
