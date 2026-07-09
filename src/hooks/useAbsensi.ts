import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/utils'

export interface Absensi {
  id: string
  npp: string
  jenis: 'SAKIT' | 'CUTI'
  tanggal_mulai: string
  tanggal_selesai: string
  keterangan: string
  created_at: string
}

export type AbsensiInsert = Omit<Absensi, 'id' | 'created_at'>

export function useAbsensi(searchQuery = '') {
  return useQuery({
    queryKey: ['absensi', searchQuery],
    queryFn: async () => {
      let q = supabase.from('absensi').select('*').order('created_at', { ascending: false })
      if (searchQuery) {
        q = q.or(`npp.ilike.%${searchQuery}%,keterangan.ilike.%${searchQuery}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Absensi[]
    },
  })
}

export function useAddAbsensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AbsensiInsert) => {
      const { data, error } = await supabase.from('absensi').insert(payload).select().single()
      if (error) throw error
      // Reduce sisa_cuti if jenis = CUTI
      if (payload.jenis === 'CUTI') {
        const start = new Date(payload.tanggal_mulai)
        const end   = new Date(payload.tanggal_selesai)
        const days  = Math.ceil((end.getTime() - start.getTime()) / (1000*60*60*24)) + 1
        // Try karyawan first, then bina
        const { data: k } = await supabase.from('karyawan').select('id, sisa_cuti').eq('npp', payload.npp).maybeSingle()
        if (k) {
          await supabase.from('karyawan').update({ sisa_cuti: Math.max(0, (k.sisa_cuti ?? 18) - days) }).eq('id', k.id)
        } else {
          const { data: b } = await supabase.from('bina').select('id, sisa_cuti').eq('npp', payload.npp).maybeSingle()
          if (b) await supabase.from('bina').update({ sisa_cuti: Math.max(0, (b.sisa_cuti ?? 18) - days) }).eq('id', b.id)
        }
      }
      await logAudit('TAMBAH_ABSENSI', JSON.stringify({ npp: payload.npp, jenis: payload.jenis }))
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absensi'] })
      qc.invalidateQueries({ queryKey: ['karyawan'] })
      qc.invalidateQueries({ queryKey: ['bina'] })
    },
  })
}

export function useUpdateAbsensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: AbsensiInsert }) => {
      // 1. Fetch original record
      const { data: original, error: fetchErr } = await supabase
        .from('absensi')
        .select('*')
        .eq('id', id)
        .single()
      if (fetchErr) throw fetchErr

      // 2. Perform the update
      const { data, error } = await supabase
        .from('absensi')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      // 3. Refund original if it was CUTI
      if (original.jenis === 'CUTI') {
        const start = new Date(original.tanggal_mulai)
        const end = new Date(original.tanggal_selesai)
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        
        const { data: k } = await supabase.from('karyawan').select('id, sisa_cuti').eq('npp', original.npp).maybeSingle()
        if (k) {
          await supabase.from('karyawan').update({ sisa_cuti: (k.sisa_cuti ?? 18) + days }).eq('id', k.id)
        } else {
          const { data: b } = await supabase.from('bina').select('id, sisa_cuti').eq('npp', original.npp).maybeSingle()
          if (b) {
            await supabase.from('bina').update({ sisa_cuti: (b.sisa_cuti ?? 18) + days }).eq('id', b.id)
          }
        }
      }

      // 4. Deduct new if it is CUTI
      if (payload.jenis === 'CUTI') {
        const start = new Date(payload.tanggal_mulai)
        const end = new Date(payload.tanggal_selesai)
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

        const { data: k } = await supabase.from('karyawan').select('id, sisa_cuti').eq('npp', payload.npp).maybeSingle()
        if (k) {
          await supabase.from('karyawan').update({ sisa_cuti: Math.max(0, (k.sisa_cuti ?? 18) - days) }).eq('id', k.id)
        } else {
          const { data: b } = await supabase.from('bina').select('id, sisa_cuti').eq('npp', payload.npp).maybeSingle()
          if (b) {
            await supabase.from('bina').update({ sisa_cuti: Math.max(0, (b.sisa_cuti ?? 18) - days) }).eq('id', b.id)
          }
        }
      }

      await logAudit('UPDATE_ABSENSI', JSON.stringify({ id, payload }))
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absensi'] })
      qc.invalidateQueries({ queryKey: ['karyawan'] })
      qc.invalidateQueries({ queryKey: ['bina'] })
    },
  })
}

export function useDeleteAbsensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('absensi').delete().eq('id', id)
      if (error) throw error
      await logAudit('HAPUS_ABSENSI', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absensi'] }),
  })
}

export function useBulkInsertAbsensi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows: AbsensiInsert[]) => {
      const { data, error } = await supabase.from('absensi').insert(rows).select()
      if (error) throw error

      // Process sisa_cuti deduction for imported CUTI rows
      const cutiRows = rows.filter(r => r.jenis === 'CUTI')
      for (const row of cutiRows) {
        if (!row.tanggal_mulai || !row.tanggal_selesai) continue
        const start = new Date(row.tanggal_mulai)
        const end   = new Date(row.tanggal_selesai)
        const days  = Math.ceil((end.getTime() - start.getTime()) / (1000*60*60*24)) + 1
        
        const { data: k } = await supabase.from('karyawan').select('id, sisa_cuti').eq('npp', row.npp).maybeSingle()
        if (k) {
          await supabase.from('karyawan').update({ sisa_cuti: Math.max(0, (k.sisa_cuti ?? 18) - days) }).eq('id', k.id)
        } else {
          const { data: b } = await supabase.from('bina').select('id, sisa_cuti').eq('npp', row.npp).maybeSingle()
          if (b) await supabase.from('bina').update({ sisa_cuti: Math.max(0, (b.sisa_cuti ?? 18) - days) }).eq('id', b.id)
        }
      }

      await logAudit('IMPORT_ABSENSI', `${rows.length} data absensi diimport`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absensi'] })
      qc.invalidateQueries({ queryKey: ['karyawan'] })
      qc.invalidateQueries({ queryKey: ['bina'] })
    },
  })
}
