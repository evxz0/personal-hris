import { supabase } from '../lib/supabase'

export async function logAudit(
  aksi: string,
  detail_perubahan: string,
  user_operasi = 'admin'
) {
  const deviceInfo = `${navigator.userAgent} | ${window.location.hostname}`
  await supabase.from('audit_logs').insert({
    user_operasi,
    aksi,
    detail_perubahan: JSON.stringify(detail_perubahan),
    timestamp: new Date().toISOString(),
    device_info: deviceInfo,
  })
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function calculateDays(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  const diff = e.getTime() - s.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1)
}

export function calculateWorkingDays(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  if (e < s) return 0
  
  let count = 0
  const current = new Date(s)
  while (current <= e) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 is Sunday, 6 is Saturday
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  return count
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
