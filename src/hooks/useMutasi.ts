import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/utils'

export interface Mutasi {
  id: string
  npp: string
  nama: string
  kategori: string
  outlet: string
  posisi_saat_ini: string
  jabatan: string
  grade: number
  tanggal_lahir?: string
  nik?: string
  no_rek?: string
  no_hp?: string
  sisa_cuti?: number
  keterangan?: string
  created_at: string
}

export function useMutasi(searchQuery = '') {
  return useQuery({
    queryKey: ['mutasi', searchQuery],
    queryFn: async () => {
      let q = supabase.from('mutasi').select('*').order('created_at', { ascending: false })
      if (searchQuery) {
        q = q.or(`nama.ilike.%${searchQuery}%,npp.ilike.%${searchQuery}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Mutasi[]
    },
  })
}

export function useAddMutasi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<Mutasi, 'id' | 'created_at'>) => {
      const prepared = {
        npp: payload.npp,
        nama: payload.nama,
        kategori: payload.kategori || null,
        outlet: payload.outlet || null,
        posisi_saat_ini: payload.posisi_saat_ini || null,
        jabatan: payload.jabatan || null,
        grade: payload.grade ? Number(payload.grade) : null,
        tanggal_lahir: payload.tanggal_lahir || null,
        nik: payload.nik || null,
        no_rek: payload.no_rek || null,
        no_hp: payload.no_hp || null,
        sisa_cuti: payload.sisa_cuti !== undefined ? Number(payload.sisa_cuti) : 18,
        keterangan: payload.keterangan || null
      }
      const { data, error } = await supabase.from('mutasi').insert(prepared).select().single()
      if (error) throw error
      
      const { error: deleteError } = await supabase.from('karyawan')
        .delete()
        .eq('npp', payload.npp)
      if (deleteError) throw deleteError
      
      await logAudit('MUTASI_KARYAWAN', JSON.stringify({ npp: payload.npp, nama: payload.nama, outlet: payload.outlet }))
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mutasi'] })
      qc.invalidateQueries({ queryKey: ['karyawan'] })
    },
  })
}

export function useDeleteMutasi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mutasi').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mutasi'] }),
  })
}
