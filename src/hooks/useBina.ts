import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/utils'

export interface Bina {
  id: string
  npp: string
  nama: string
  outlet: string | null
  jabatan: string | null
  tanggal_lahir: string | null
  no_rek: string | null
  no_hp: string | null
  sisa_cuti: number | null
  created_at: string
}

export type BinaInsert = Omit<Bina, 'id' | 'created_at'>

export function useBina(searchQuery = '') {
  return useQuery({
    queryKey: ['bina', searchQuery],
    queryFn: async () => {
      let q = supabase.from('bina').select('*').order('nama')
      if (searchQuery) {
        q = q.or(`nama.ilike.%${searchQuery}%,npp.ilike.%${searchQuery}%,jabatan.ilike.%${searchQuery}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Bina[]
    },
  })
}

export function useBinaByNPP(npp: string) {
  return useQuery({
    queryKey: ['bina-npp', npp],
    queryFn: async () => {
      if (!npp || npp.length < 3) return null
      const { data, error } = await supabase.from('bina').select('*').eq('npp', npp).maybeSingle()
      if (error) throw error
      return data as Bina | null
    },
    enabled: npp.length >= 3,
  })
}

export function useAddBina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: BinaInsert) => {
      const { data, error } = await supabase.from('bina').insert(payload).select().single()
      if (error) throw error
      await logAudit('TAMBAH_BINA', JSON.stringify({ npp: payload.npp, nama: payload.nama }))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bina'] }),
  })
}

export function useUpdateBina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<BinaInsert> }) => {
      const { data, error } = await supabase.from('bina').update(payload).eq('id', id).select().single()
      if (error) throw error
      await logAudit('UPDATE_BINA', JSON.stringify({ id, ...payload }))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bina'] }),
  })
}

export function useDeleteBina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bina').delete().eq('id', id)
      if (error) throw error
      await logAudit('HAPUS_BINA', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bina'] }),
  })
}

export function useBulkInsertBina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows: BinaInsert[]) => {
      const { data, error } = await supabase.from('bina').upsert(rows, { onConflict: 'npp' }).select()
      if (error) throw error
      await logAudit('BULK_IMPORT_BINA', `${rows.length} data diimport`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bina'] }),
  })
}
