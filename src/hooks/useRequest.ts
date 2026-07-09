import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/utils'

export interface RequestNaikLevel {
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

export interface RequestPinpad {
  id: string
  keperluan: 'OPEN PINPAD' | 'FR'
  npp_user: string
  nama: string
  waktu_mulai: string
  waktu_selesai: string
  keterangan: string
  created_at: string
  tanggal_buat?: string
}

export function useRequestNaikLevel(search = '') {
  return useQuery({
    queryKey: ['request_naik_level', search],
    queryFn: async () => {
      let q = supabase.from('request_naik_level').select('*').order('created_at', { ascending: false })
      if (search) q = q.or(`npp.ilike.%${search}%,nama.ilike.%${search}%`)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as RequestNaikLevel[]
    },
  })
}

export function useAddRequestNaikLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<RequestNaikLevel, 'id' | 'created_at' | 'tanggal_buat'>) => {
      const { data, error } = await supabase.from('request_naik_level')
        .insert({ ...payload, tanggal_buat: new Date().toISOString().split('T')[0] })
        .select().single()
      if (error) throw error
      await logAudit('REQUEST_NAIK_LEVEL', JSON.stringify({ npp: payload.npp, level: payload.level_diajukan }))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['request_naik_level'] }),
  })
}

export function useDeleteRequestNaikLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('request_naik_level').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['request_naik_level'] }),
  })
}

export function useRequestPinpad(search = '') {
  return useQuery({
    queryKey: ['request_pinpad', search],
    queryFn: async () => {
      let q = supabase.from('request_pinpad').select('*').order('created_at', { ascending: false })
      if (search) q = q.or(`npp_user.ilike.%${search}%,nama.ilike.%${search}%`)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as RequestPinpad[]
    },
  })
}

export function useAddRequestPinpad() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<RequestPinpad, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('request_pinpad').insert(payload).select().single()
      if (error) throw error
      await logAudit('REQUEST_PINPAD', JSON.stringify({ npp: payload.npp_user, keperluan: payload.keperluan }))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['request_pinpad'] }),
  })
}

export function useDeleteRequestPinpad() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('request_pinpad').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['request_pinpad'] }),
  })
}

export function useBulkInsertRequestNaikLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows: any[]) => {
      const prepared = rows.map(r => ({
        npp: String(r.npp ?? ''),
        nama: String(r.nama ?? ''),
        level_diajukan: String(r.level_diajukan ?? ''),
        waktu_mulai: String(r.waktu_mulai ?? ''),
        waktu_selesai: String(r.waktu_selesai ?? ''),
        keterangan: String(r.keterangan ?? ''),
        tanggal_buat: r.tanggal_buat ? String(r.tanggal_buat) : new Date().toISOString().split('T')[0]
      }))
      const { data, error } = await supabase.from('request_naik_level').insert(prepared).select()
      if (error) throw error
      await logAudit('IMPORT_REQUEST_NAIK_LEVEL', `${rows.length} request naik level diimport`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['request_naik_level'] }),
  })
}

export function useBulkInsertRequestPinpad() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows: any[]) => {
      const prepared = rows.map(r => ({
        keperluan: (String(r.keperluan ?? 'OPEN PINPAD').toUpperCase() === 'FR' ? 'FR' : 'OPEN PINPAD') as 'OPEN PINPAD'|'FR',
        npp_user: String(r.npp_user ?? ''),
        nama: String(r.nama ?? ''),
        waktu_mulai: String(r.waktu_mulai ?? ''),
        waktu_selesai: String(r.waktu_selesai ?? ''),
        keterangan: String(r.keterangan ?? ''),
      }))
      const { data, error } = await supabase.from('request_pinpad').insert(prepared).select()
      if (error) throw error
      await logAudit('IMPORT_REQUEST_PINPAD', `${rows.length} request pinpad diimport`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['request_pinpad'] }),
  })
}

export function useUpdateRequestNaikLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data, error } = await supabase.from('request_naik_level')
        .update(payload)
        .eq('id', id)
        .select().single()
      if (error) throw error
      await logAudit('UPDATE_REQUEST_NAIK_LEVEL', JSON.stringify({ id, npp: payload.npp, level: payload.level_diajukan }))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['request_naik_level'] }),
  })
}

export function useUpdateRequestPinpad() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data, error } = await supabase.from('request_pinpad')
        .update(payload)
        .eq('id', id)
        .select().single()
      if (error) throw error
      await logAudit('UPDATE_REQUEST_PINPAD', JSON.stringify({ id, npp: payload.npp_user, keperluan: payload.keperluan }))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['request_pinpad'] }),
  })
}
