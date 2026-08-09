import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/utils'

export interface Karyawan {
  id: string
  npp: string
  nama: string
  kategori: 'FTE' | 'TAD' | 'BINA'
  outlet: string | null
  tanggal_lahir: string | null
  posisi_saat_ini: string | null
  jenjang: string | null
  jabatan: string | null
  grade: string | number | null
  nik: string | null
  npp_digi_hc: string | null
  npp_webmail: string | null
  jenis_kelamin: string | null
  tanggal_mulai: string | null
  tanggal_berakhir: string | null
  kd_wil: string | null
  batch: string | null
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
      const rows = (data ?? []) as Karyawan[]
      return rows.map(k => ({
        ...k,
        nama: k.nama ? String(k.nama).toUpperCase() : ''
      }))
    },
  })
}

export function useUppercaseAllNames() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from('karyawan').select('id, nama')
      if (error) throw error
      if (data && data.length > 0) {
        const needsUpdate = data.filter(k => k.nama && k.nama !== k.nama.toUpperCase())
        if (needsUpdate.length > 0) {
          const updates = needsUpdate.map(k =>
            supabase.from('karyawan').update({ nama: k.nama.toUpperCase().trim() }).eq('id', k.id)
          )
          await Promise.all(updates)
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['karyawan'] })
    }
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
      const { id: _id, created_at: _cat, ...cleanPayload } = payload as any
      const { data, error } = await supabase.from('karyawan').insert(cleanPayload).select()
      if (error) throw error
      await logAudit('TAMBAH_KARYAWAN', JSON.stringify({ npp: cleanPayload.npp, nama: cleanPayload.nama }))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['karyawan'] }),
  })
}

export function useUpdateKaryawan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<KaryawanInsert> }) => {
      const { id: _id, created_at: _cat, ...cleanPayload } = payload as any
      const { data, error } = await supabase.from('karyawan').update(cleanPayload).eq('id', id)
      if (error) throw error
      await logAudit('UPDATE_KARYAWAN', JSON.stringify({ id, ...cleanPayload }))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['karyawan'] }),
  })
}

export function useDeleteKaryawan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: emp, error: fetchError } = await supabase.from('karyawan').select('*').eq('id', id).single()
      if (fetchError) throw fetchError

      if (emp) {
        const prepared = {
          npp: emp.npp,
          nama: emp.nama,
          kategori: emp.kategori || null,
          outlet: emp.outlet || null,
          jenjang: emp.jenjang || null,
          jabatan: emp.jabatan || null,
          grade: emp.grade ? Number(emp.grade) : null,
          tanggal_lahir: emp.tanggal_lahir || null,
          nik: emp.nik || null,
          no_rek: emp.no_rek || null,
          no_hp: emp.no_hp || null,
          sisa_cuti: emp.sisa_cuti !== null && emp.sisa_cuti !== undefined ? Number(emp.sisa_cuti) : 18,
          keterangan: 'Karyawan Dihapus dari Master',
          tanggal_aktif: null,
          jenis_aksi: 'HAPUS'
        }
        const { error: mutasiError } = await supabase.from('mutasi').insert(prepared)
        if (mutasiError) throw mutasiError
      }

      const { error } = await supabase.from('karyawan').delete().eq('id', id)
      if (error) throw error
      await logAudit('HAPUS_KARYAWAN', JSON.stringify({ id, npp: emp?.npp, nama: emp?.nama }))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['karyawan'] })
      qc.invalidateQueries({ queryKey: ['mutasi'] })
    },
  })
}

export function useBulkDeleteKaryawan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: emps, error: fetchError } = await supabase.from('karyawan').select('*').in('id', ids)
      if (fetchError) throw fetchError

      if (emps && emps.length > 0) {
        const prepared = emps.map(emp => ({
          npp: emp.npp,
          nama: emp.nama,
          kategori: emp.kategori || null,
          outlet: emp.outlet || null,
          jenjang: emp.jenjang || null,
          jabatan: emp.jabatan || null,
          grade: emp.grade ? Number(emp.grade) : null,
          tanggal_lahir: emp.tanggal_lahir || null,
          nik: emp.nik || null,
          no_rek: emp.no_rek || null,
          no_hp: emp.no_hp || null,
          sisa_cuti: emp.sisa_cuti !== null && emp.sisa_cuti !== undefined ? Number(emp.sisa_cuti) : 18,
          keterangan: 'Karyawan Dihapus dari Master (Massal)',
          tanggal_aktif: null,
          jenis_aksi: 'HAPUS'
        }))
        const { error: mutasiError } = await supabase.from('mutasi').insert(prepared)
        if (mutasiError) throw mutasiError
      }

      const { error } = await supabase.from('karyawan').delete().in('id', ids)
      if (error) throw error
      await logAudit('BULK_DELETE_KARYAWAN', `${ids.length} data karyawan dihapus`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['karyawan'] })
      qc.invalidateQueries({ queryKey: ['mutasi'] })
    },
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
