import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/utils'

export interface CutiConfig {
  kuotaDefault: number // e.g. 18 hari
  periodeResetBulan: number // e.g. 18 bulan (1.5 tahun)
  tanggalResetTerakhir: string // e.g. '2025-01-01'
  tanggalResetBerikutnya: string // e.g. '2026-07-01'
  autoResetEnabled: boolean
}

const STORAGE_KEY = 'phris_cuti_config_v1'

const DEFAULT_CONFIG: CutiConfig = {
  kuotaDefault: 18,
  periodeResetBulan: 18, // 1.5 Tahun
  tanggalResetTerakhir: '2025-01-01',
  tanggalResetBerikutnya: '2026-07-01',
  autoResetEnabled: true,
}

export function getLocalCutiConfig(): CutiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_CONFIG, ...parsed }
    }
  } catch (e) {
    console.error('Failed to read cuti config from storage', e)
  }
  return DEFAULT_CONFIG
}

export function setLocalCutiConfig(config: CutiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (e) {
    console.error('Failed to write cuti config to storage', e)
  }
}

export function calculateNextResetDate(startDateStr: string, months: number): string {
  try {
    const d = new Date(startDateStr)
    if (isNaN(d.getTime())) return '2026-07-01'
    d.setMonth(d.getMonth() + months)
    return d.toISOString().split('T')[0]
  } catch {
    return '2026-07-01'
  }
}

export function getCutiDefaultQuota(): number {
  return getLocalCutiConfig().kuotaDefault
}

export function useCutiConfig() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['cuti-config'],
    queryFn: () => getLocalCutiConfig(),
    staleTime: Infinity,
  })

  const saveMutation = useMutation({
    mutationFn: async (newConfig: Partial<CutiConfig>) => {
      const current = getLocalCutiConfig()
      const updated: CutiConfig = {
        ...current,
        ...newConfig,
      }
      
      // Recalculate next reset date if last reset or period changed
      if (newConfig.tanggalResetTerakhir || newConfig.periodeResetBulan) {
        updated.tanggalResetBerikutnya = calculateNextResetDate(
          updated.tanggalResetTerakhir,
          updated.periodeResetBulan
        )
      }

      setLocalCutiConfig(updated)
      await logAudit('UPDATE_PENGATURAN_CUTI', JSON.stringify(updated))
      return updated
    },
    onSuccess: (data) => {
      qc.setQueryData(['cuti-config'], data)
    },
  })

  // Bulk reset all employees' sisa_cuti to current quota
  const resetAllCutiMutation = useMutation({
    mutationFn: async ({ customQuota }: { customQuota?: number } = {}) => {
      const config = getLocalCutiConfig()
      const targetQuota = customQuota !== undefined ? customQuota : config.kuotaDefault
      const today = new Date().toISOString().split('T')[0]

      // 1. Update all employees in Supabase
      const { error, count } = await supabase
        .from('karyawan')
        .update({ sisa_cuti: targetQuota })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (error) throw error

      // 2. Update config reset dates
      const nextDate = calculateNextResetDate(today, config.periodeResetBulan)
      const updatedConfig: CutiConfig = {
        ...config,
        kuotaDefault: targetQuota,
        tanggalResetTerakhir: today,
        tanggalResetBerikutnya: nextDate,
      }
      setLocalCutiConfig(updatedConfig)

      // 3. Log audit
      await logAudit(
        'RESET_MASSAL_CUTI',
        `Reset massal kuota cuti ke ${targetQuota} hari untuk seluruh karyawan. Periode reset berikutnya: ${nextDate}`
      )

      return { updatedConfig, count }
    },
    onSuccess: (res) => {
      qc.setQueryData(['cuti-config'], res.updatedConfig)
      qc.invalidateQueries({ queryKey: ['karyawan'] })
      qc.invalidateQueries({ queryKey: ['absensi'] })
    },
  })

  return {
    config: query.data ?? DEFAULT_CONFIG,
    isLoading: query.isLoading,
    saveConfig: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    resetAllCuti: resetAllCutiMutation.mutateAsync,
    isResetting: resetAllCutiMutation.isPending,
  }
}
