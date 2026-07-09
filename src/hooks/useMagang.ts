import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { calculateDays, logAudit } from '../lib/utils'

export interface Magang {
  id: string
  nama: string
  fakultas: string
  jurusan: string
  universitas: string
  rumah: string
  penempatan: string
  tanggal_mulai: string
  tanggal_selesai: string
  total_lama_hari: number
  created_at: string
}

export type MagangInsert = Omit<Magang, 'id' | 'created_at'>

export function useMagang(searchQuery = '') {
  return useQuery({
    queryKey: ['magang', searchQuery],
    queryFn: async () => {
      let q = supabase.from('magang').select('*').order('nama')
      if (searchQuery) {
        q = q.or(`nama.ilike.%${searchQuery}%,universitas.ilike.%${searchQuery}%,penempatan.ilike.%${searchQuery}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Magang[]
    },
  })
}

export function useAddMagang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<MagangInsert, 'total_lama_hari'>) => {
      const total_lama_hari = calculateDays(payload.tanggal_mulai, payload.tanggal_selesai)
      const { data, error } = await supabase.from('magang').insert({ ...payload, total_lama_hari }).select().single()
      if (error) throw error
      await logAudit('TAMBAH_MAGANG', JSON.stringify({ nama: payload.nama }))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['magang'] }),
  })
}

export function useUpdateMagang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Omit<MagangInsert, 'total_lama_hari'>> }) => {
      const total_lama_hari = payload.tanggal_mulai && payload.tanggal_selesai
        ? calculateDays(payload.tanggal_mulai, payload.tanggal_selesai)
        : undefined
      const { data, error } = await supabase.from('magang')
        .update({ ...payload, ...(total_lama_hari !== undefined ? { total_lama_hari } : {}) })
        .eq('id', id).select().single()
      if (error) throw error
      await logAudit('UPDATE_MAGANG', JSON.stringify({ id, ...payload }))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['magang'] }),
  })
}

export function useDeleteMagang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('magang').delete().eq('id', id)
      if (error) throw error
      await logAudit('HAPUS_MAGANG', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['magang'] }),
  })
}

export function useBulkInsertMagang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows: any[]) => {
      const prepared = rows.map(r => {
        const start = r.tanggal_mulai ? String(r.tanggal_mulai) : null
        const end = r.tanggal_selesai ? String(r.tanggal_selesai) : null
        const total = start && end ? calculateDays(start, end) : 0
        return {
          nama: String(r.nama ?? ''),
          fakultas: String(r.fakultas ?? ''),
          jurusan: String(r.jurusan ?? ''),
          universitas: String(r.universitas ?? ''),
          rumah: String(r.rumah ?? ''),
          penempatan: String(r.penempatan ?? ''),
          tanggal_mulai: start,
          tanggal_selesai: end,
          total_lama_hari: total
        }
      })
      const { data, error } = await supabase.from('magang').insert(prepared).select()
      if (error) throw error
      await logAudit('IMPORT_MAGANG', `${rows.length} data magang diimport`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['magang'] }),
  })
}
