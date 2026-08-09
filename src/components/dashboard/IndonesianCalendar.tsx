import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, CheckCircle, AlertCircle, Sun } from 'lucide-react'
import {
  getHoliday,
  isWeekend,
  isWorkday,
  getHolidaysForMonth,
  getNextWorkday,
  type HolidayInfo
} from '../../lib/holidays'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export function IndonesianCalendar() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date>(today)

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const handleToday = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
    setSelectedDate(now)
  }

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

  const holidaysThisMonth = getHolidaysForMonth(currentYear, currentMonth)

  // Information about selected date
  const selectedHoliday = getHoliday(selectedDate)
  const selectedIsWeekend = isWeekend(selectedDate)
  const selectedIsWorkday = isWorkday(selectedDate)
  const nextWorkday = getNextWorkday(selectedDate)

  const isToday = (d: number, m: number, y: number) => {
    return d === today.getDate() && m === today.getMonth() && y === today.getFullYear()
  }

  const isSelected = (d: number, m: number, y: number) => {
    return d === selectedDate.getDate() && m === selectedDate.getMonth() && y === selectedDate.getFullYear()
  }

  // Days grid generation
  const calendarDays: Array<{
    dayNumber: number
    month: number
    year: number
    isCurrentMonth: boolean
    holiday: HolidayInfo | null
    isSun: boolean
    isSat: boolean
  }> = []

  // 1. Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const m = currentMonth === 0 ? 11 : currentMonth - 1
    const y = currentMonth === 0 ? currentYear - 1 : currentYear
    const dt = new Date(y, m, d)
    calendarDays.push({
      dayNumber: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      holiday: getHoliday(dt),
      isSun: dt.getDay() === 0,
      isSat: dt.getDay() === 6
    })
  }

  // 2. Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(currentYear, currentMonth, d)
    calendarDays.push({
      dayNumber: d,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
      holiday: getHoliday(dt),
      isSun: dt.getDay() === 0,
      isSat: dt.getDay() === 6
    })
  }

  // 3. Next month leading days (to complete 35 or 42 grid cells)
  const remainingCells = 42 - calendarDays.length
  if (remainingCells < 7) {
    for (let d = 1; d <= remainingCells; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1
      const y = currentMonth === 11 ? currentYear + 1 : currentYear
      const dt = new Date(y, m, d)
      calendarDays.push({
        dayNumber: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        holiday: getHoliday(dt),
        isSun: dt.getDay() === 0,
        isSat: dt.getDay() === 6
      })
    }
  } else {
    const targetCells = 35
    const rem = targetCells - calendarDays.length
    for (let d = 1; d <= rem; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1
      const y = currentMonth === 11 ? currentYear + 1 : currentYear
      const dt = new Date(y, m, d)
      calendarDays.push({
        dayNumber: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        holiday: getHoliday(dt),
        isSun: dt.getDay() === 0,
        isSat: dt.getDay() === 6
      })
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
            <CalendarIcon size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-[#2B3440] leading-tight">Kalender & Hari Libur</h2>
            <p className="text-[11px] text-[#64748B]">Panduan tanggal aktif masuk kerja</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer mr-1"
            title="Kembali ke hari ini"
          >
            Hari Ini
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-[#64748B] hover:text-[#2B3440] transition-colors cursor-pointer"
            title="Bulan sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-extrabold text-[#2B3440] min-w-[110px] text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-[#64748B] hover:text-[#2B3440] transition-colors cursor-pointer"
            title="Bulan berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {DAY_NAMES.map((name, i) => (
              <div
                key={name}
                className={`text-[11px] font-extrabold uppercase py-1 ${
                  i === 0 ? 'text-red-600' : i === 6 ? 'text-orange-500' : 'text-[#64748B]'
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              const activeToday = isToday(cell.dayNumber, cell.month, cell.year)
              const activeSelected = isSelected(cell.dayNumber, cell.month, cell.year)
              const isRedDay = cell.isSun || (cell.holiday && !cell.holiday.isCutiBersama)
              const isOrangeDay = cell.isSat || (cell.holiday && cell.holiday.isCutiBersama)

              return (
                <button
                  key={`${cell.year}-${cell.month}-${cell.dayNumber}-${idx}`}
                  onClick={() => setSelectedDate(new Date(cell.year, cell.month, cell.dayNumber))}
                  className={`relative flex flex-col items-center justify-center h-10 rounded-xl transition-all cursor-pointer group ${
                    !cell.isCurrentMonth
                      ? 'opacity-30 hover:opacity-70'
                      : 'hover:bg-teal-50/60'
                  } ${
                    activeSelected
                      ? 'bg-teal-600 !text-white shadow-md shadow-teal-600/20 font-black ring-2 ring-teal-600/30 ring-offset-1'
                      : activeToday
                      ? 'bg-teal-50 border border-teal-300 font-extrabold text-teal-900'
                      : isRedDay
                      ? 'text-red-600 font-bold'
                      : isOrangeDay
                      ? 'text-orange-600 font-bold'
                      : 'text-[#2B3440] font-medium'
                  }`}
                  title={cell.holiday ? `${cell.holiday.name}` : undefined}
                >
                  <span className="text-xs leading-none">
                    {cell.dayNumber}
                  </span>

                  {/* Holiday / Cuti Dot Indicator */}
                  {cell.holiday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        activeSelected
                          ? 'bg-white'
                          : cell.holiday.isCutiBersama
                          ? 'bg-orange-500 ring-1 ring-white'
                          : 'bg-red-600 ring-1 ring-white'
                      }`}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Date Detail Box */}
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2.5">
          <div className="flex items-start justify-between gap-2 p-3 rounded-xl bg-gray-50/80 border border-gray-200/70">
            <div className="space-y-0.5 min-w-0">
              <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                Tanggal Terpilih:
              </p>
              <p className="text-xs font-extrabold text-[#2B3440]">
                {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              {selectedHoliday ? (
                <div className="flex items-center gap-1 text-[11px] font-bold text-red-600 pt-0.5">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{selectedHoliday.name} {selectedHoliday.isCutiBersama && '(Cuti Bersama)'}</span>
                </div>
              ) : selectedIsWeekend ? (
                <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 pt-0.5">
                  <Sun size={13} className="shrink-0" />
                  <span>Libur Akhir Pekan ({selectedDate.getDay() === 0 ? 'Minggu' : 'Sabtu'})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] font-bold text-teal-700 pt-0.5">
                  <CheckCircle size={13} className="shrink-0" />
                  <span>Hari Kerja Aktif (Operasional BNI)</span>
                </div>
              )}
            </div>

            {/* Next Workday Calculation Pill */}
            <div className="bg-white px-2.5 py-1.5 rounded-lg border border-teal-200 text-right shrink-0 shadow-2xs">
              <span className="text-[10px] font-semibold text-[#64748B] block">Masuk Kerja:</span>
              <span className="text-xs font-black text-teal-800">
                {selectedIsWorkday
                  ? 'Hari Ini Aktif'
                  : nextWorkday.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>

          {/* List of Holidays in this month */}
          {holidaysThisMonth.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#64748B] uppercase tracking-wide">
                <Info size={12} className="text-teal-600" />
                <span>Hari Libur Bulan {MONTH_NAMES[currentMonth]} {currentYear}:</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {holidaysThisMonth.map((h) => {
                  const dNum = parseInt(h.date.split('-')[2], 10)
                  return (
                    <div
                      key={h.date}
                      onClick={() => setSelectedDate(new Date(currentYear, currentMonth, dNum))}
                      className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-red-50/50 hover:bg-red-50 text-red-900 border border-red-100/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="truncate">{h.name}</span>
                      </div>
                      <span className="font-extrabold text-red-700 shrink-0 ml-2">
                        {dNum} {MONTH_NAMES[currentMonth].substring(0, 3)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
