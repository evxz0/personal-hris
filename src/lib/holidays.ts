export interface HolidayInfo {
  date: string // YYYY-MM-DD
  name: string
  isCutiBersama?: boolean
}

export const INDONESIAN_HOLIDAYS: Record<string, { name: string; isCutiBersama?: boolean }> = {
  // 2025
  '2025-01-01': { name: 'Tahun Baru 2025 Masehi' },
  '2025-01-27': { name: 'Isra Mi\'raj Nabi Muhammad SAW' },
  '2025-01-28': { name: 'Cuti Bersama Tahun Baru Imlek 2576', isCutiBersama: true },
  '2025-01-29': { name: 'Tahun Baru Imlek 2576 Kongzili' },
  '2025-03-28': { name: 'Cuti Bersama Hari Suci Nyepi', isCutiBersama: true },
  '2025-03-29': { name: 'Hari Suci Nyepi Tahun Baru Saka 1947' },
  '2025-03-31': { name: 'Hari Raya Idul Fitri 1446 H' },
  '2025-04-01': { name: 'Hari Raya Idul Fitri 1446 H' },
  '2025-04-02': { name: 'Cuti Bersama Idul Fitri 1446 H', isCutiBersama: true },
  '2025-04-03': { name: 'Cuti Bersama Idul Fitri 1446 H', isCutiBersama: true },
  '2025-04-04': { name: 'Cuti Bersama Idul Fitri 1446 H', isCutiBersama: true },
  '2025-04-07': { name: 'Cuti Bersama Idul Fitri 1446 H', isCutiBersama: true },
  '2025-04-18': { name: 'Wafat Yesus Kristus (Jumat Agung)' },
  '2025-04-20': { name: 'Kebangkitan Yesus Kristus (Paskah)' },
  '2025-05-01': { name: 'Hari Buruh Internasional' },
  '2025-05-12': { name: 'Hari Raya Waisak 2569 BE' },
  '2025-05-13': { name: 'Cuti Bersama Hari Raya Waisak', isCutiBersama: true },
  '2025-05-29': { name: 'Kenaikan Yesus Kristus' },
  '2025-05-30': { name: 'Cuti Bersama Kenaikan Yesus Kristus', isCutiBersama: true },
  '2025-06-01': { name: 'Hari Lahir Pancasila' },
  '2025-06-06': { name: 'Hari Raya Idul Adha 1446 H' },
  '2025-06-09': { name: 'Cuti Bersama Hari Raya Idul Adha', isCutiBersama: true },
  '2025-06-27': { name: '1 Muharam Tahun Baru Islam 1447 H' },
  '2025-08-17': { name: 'Hari Kemerdekaan Republik Indonesia ke-80' },
  '2025-09-05': { name: 'Maulid Nabi Muhammad SAW' },
  '2025-12-25': { name: 'Hari Raya Natal' },
  '2025-12-26': { name: 'Cuti Bersama Hari Raya Natal', isCutiBersama: true },

  // 2026
  '2026-01-01': { name: 'Tahun Baru 2026 Masehi' },
  '2026-01-16': { name: 'Isra Mi\'raj Nabi Muhammad SAW' },
  '2026-02-16': { name: 'Cuti Bersama Tahun Baru Imlek 2577', isCutiBersama: true },
  '2026-02-17': { name: 'Tahun Baru Imlek 2577 Kongzili' },
  '2026-03-19': { name: 'Hari Suci Nyepi Tahun Baru Saka 1948' },
  '2026-03-20': { name: 'Hari Raya Idul Fitri 1447 H' },
  '2026-03-21': { name: 'Hari Raya Idul Fitri 1447 H' },
  '2026-03-23': { name: 'Cuti Bersama Idul Fitri 1447 H', isCutiBersama: true },
  '2026-03-24': { name: 'Cuti Bersama Idul Fitri 1447 H', isCutiBersama: true },
  '2026-03-25': { name: 'Cuti Bersama Idul Fitri 1447 H', isCutiBersama: true },
  '2026-04-03': { name: 'Wafat Yesus Kristus (Jumat Agung)' },
  '2026-04-05': { name: 'Hari Paskah' },
  '2026-05-01': { name: 'Hari Buruh Internasional' },
  '2026-05-14': { name: 'Kenaikan Yesus Kristus' },
  '2026-05-15': { name: 'Cuti Bersama Kenaikan Yesus Kristus', isCutiBersama: true },
  '2026-05-27': { name: 'Hari Raya Idul Adha 1447 H' },
  '2026-05-28': { name: 'Cuti Bersama Hari Raya Idul Adha', isCutiBersama: true },
  '2026-05-31': { name: 'Hari Raya Waisak 2570 BE' },
  '2026-06-01': { name: 'Hari Lahir Pancasila & Cuti Bersama Waisak' },
  '2026-06-16': { name: 'Tahun Baru Islam 1448 H (1 Muharram)' },
  '2026-08-17': { name: 'Proklamasi Kemerdekaan RI (HUT RI ke-81)' },
  '2026-08-25': { name: 'Maulid Nabi Muhammad SAW' },
  '2026-12-24': { name: 'Cuti Bersama Hari Raya Natal', isCutiBersama: true },
  '2026-12-25': { name: 'Hari Raya Natal' },

  // 2027
  '2027-01-01': { name: 'Tahun Baru 2027 Masehi' },
  '2027-01-06': { name: 'Isra Mi\'raj Nabi Muhammad SAW' },
  '2027-02-06': { name: 'Tahun Baru Imlek 2578 Kongzili' },
  '2027-03-09': { name: 'Hari Suci Nyepi Tahun Baru Saka 1949' },
  '2027-03-10': { name: 'Hari Raya Idul Fitri 1448 H' },
  '2027-03-11': { name: 'Hari Raya Idul Fitri 1448 H' },
  '2027-03-26': { name: 'Wafat Yesus Kristus' },
  '2027-03-28': { name: 'Kebangkitan Yesus Kristus (Paskah)' },
  '2027-05-01': { name: 'Hari Buruh Internasional' },
  '2027-05-06': { name: 'Kenaikan Yesus Kristus' },
  '2027-05-17': { name: 'Hari Raya Idul Adha 1448 H' },
  '2027-05-20': { name: 'Hari Raya Waisak 2571 BE' },
  '2027-06-01': { name: 'Hari Lahir Pancasila' },
  '2027-06-06': { name: 'Tahun Baru Islam 1449 H' },
  '2027-08-15': { name: 'Maulid Nabi Muhammad SAW' },
  '2027-08-17': { name: 'Hari Kemerdekaan RI ke-82' },
  '2027-12-25': { name: 'Hari Raya Natal' },
}

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export function formatToDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Check if a date string or Date object is a recognized Indonesian holiday
 */
export function getHoliday(dateOrStr: Date | string): HolidayInfo | null {
  const key = typeof dateOrStr === 'string' ? dateOrStr : formatToDateKey(dateOrStr)
  
  if (INDONESIAN_HOLIDAYS[key]) {
    return {
      date: key,
      ...INDONESIAN_HOLIDAYS[key]
    }
  }

  // Fallback for fixed annual national holidays in any year
  const mmdd = key.substring(5)
  if (mmdd === '01-01') return { date: key, name: 'Tahun Baru Masehi' }
  if (mmdd === '05-01') return { date: key, name: 'Hari Buruh Internasional' }
  if (mmdd === '06-01') return { date: key, name: 'Hari Lahir Pancasila' }
  if (mmdd === '08-17') return { date: key, name: 'Hari Kemerdekaan RI' }
  if (mmdd === '12-25') return { date: key, name: 'Hari Raya Natal' }

  return null
}

/**
 * Check if a day is Sunday (0) or Saturday (6)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Check if date is a standard working day (Monday - Friday and not a public holiday)
 */
export function isWorkday(date: Date): boolean {
  if (isWeekend(date)) return false
  if (getHoliday(date)) return false
  return true
}

/**
 * Get list of holidays in a specific month
 */
export function getHolidaysForMonth(year: number, monthIndex: number): HolidayInfo[] {
  const list: HolidayInfo[] = []
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, monthIndex, d)
    const hol = getHoliday(dt)
    if (hol) {
      list.push(hol)
    }
  }
  
  return list
}

/**
 * Calculate the next working day after a given date
 */
export function getNextWorkday(startDate: Date): Date {
  const next = new Date(startDate)
  next.setDate(next.getDate() + 1)
  while (!isWorkday(next)) {
    next.setDate(next.getDate() + 1)
  }
  return next
}
