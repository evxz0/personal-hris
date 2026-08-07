const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

/**
 * Get today's date formatted in Indonesian: e.g. "7 Agustus 2026"
 */
export function getTodayIndonesian(): string {
  const now = new Date()
  const day = now.getDate()
  const month = MONTHS_ID[now.getMonth()]
  const year = now.getFullYear()
  return `${day} ${month} ${year}`
}

/**
 * Convert ISO Date string (YYYY-MM-DD) to Indonesian format: e.g. "2026-08-07" -> "7 Agustus 2026"
 */
export function formatIsoToIndonesian(isoStr: string): string {
  if (!isoStr) return ''
  const parts = isoStr.split('-')
  if (parts.length !== 3) return isoStr
  const year = parts[0]
  const monthIndex = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)

  if (monthIndex < 0 || monthIndex > 11 || isNaN(day)) return isoStr
  return `${day} ${MONTHS_ID[monthIndex]} ${year}`
}

/**
 * Convert Indonesian format ("27 Juli 2026") to YYYY-MM-DD for <input type="date">
 */
export function formatIndonesianToIso(indoStr: string): string {
  if (!indoStr) return ''
  const monthsMap: Record<string, string> = {
    januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
    juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12'
  }

  const parts = indoStr.trim().split(/\s+/)
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0')
    const monthKey = parts[1].toLowerCase()
    const month = monthsMap[monthKey]
    const year = parts[2]
    if (month && year.length === 4) {
      return `${year}-${month}-${day}`
    }
  }
  return ''
}
