import { useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Sun, Info, CalendarDays } from 'lucide-react'
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

interface Props {
  onSelectDate?: (dateStrIndo: string, rawDate: Date) => void
}

export function CalendarPopupHelper({ onSelectDate }: Props) {
  const [isOpen, setIsOpen] = useState(false)
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

  // Selected date details
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

  // Grid generation
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

  // 3. Next month leading days (fill up 35 or 42 grid cells)
  const remaining = 35 - calendarDays.length
  const totalSlots = remaining < 0 ? 42 : 35
  const needed = totalSlots - calendarDays.length
  for (let d = 1; d <= needed; d++) {
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

  const handleDayClick = (year: number, month: number, day: number) => {
    const d = new Date(year, month, day)
    setSelectedDate(d)
    if (onSelectDate) {
      const indoStr = `${day} ${MONTH_NAMES[month]} ${year}`
      onSelectDate(indoStr, d)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5 pointer-events-none">
      {/* Pop-up Calendar Floating Card (Stays open while user types in form) */}
      {isOpen && (
        <div
          className="pointer-events-auto w-[330px] sm:w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in-up flex flex-col max-h-[calc(100vh-130px)]"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          {/* Header (Clean, without X button as requested) */}
          <div className="bg-gradient-to-r from-teal-800 to-teal-900 px-4 py-3 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-teal-300" />
              <div>
                <h3 className="text-xs font-black tracking-wide leading-tight">Kalender & Hari Libur</h3>
                <p className="text-[10px] text-teal-200">Panduan tanggal cuti & surat</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-700/80 text-teal-100 border border-teal-600/50">
              Tetap Terbuka
            </span>
          </div>

          {/* Month Navigation */}
          <div className="px-3.5 py-2 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleToday}
              className="px-2 py-0.5 text-[11px] font-bold text-teal-800 hover:bg-teal-100 rounded-md transition-colors cursor-pointer"
            >
              Hari Ini
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-md hover:bg-teal-100 text-teal-900 transition-colors cursor-pointer"
                title="Bulan sebelumnya"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="font-extrabold text-teal-950 text-xs min-w-[95px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-md hover:bg-teal-100 text-teal-900 transition-colors cursor-pointer"
                title="Bulan berikutnya"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-3 overflow-y-auto space-y-3 custom-scrollbar">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {DAY_NAMES.map((name, i) => (
                <div
                  key={name}
                  className={`text-[10px] font-extrabold uppercase py-0.5 ${
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
                    type="button"
                    onClick={() => handleDayClick(cell.year, cell.month, cell.dayNumber)}
                    className={`relative flex flex-col items-center justify-center h-8 rounded-lg transition-all cursor-pointer ${
                      !cell.isCurrentMonth
                        ? 'opacity-25 hover:opacity-70'
                        : 'hover:bg-teal-50'
                    } ${
                      activeSelected
                        ? 'bg-teal-700 !text-white font-black shadow-xs ring-2 ring-teal-600/30'
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
                    <span className="text-[11px] leading-none">
                      {cell.dayNumber}
                    </span>

                    {/* Indicator Dot */}
                    {cell.holiday && (
                      <span
                        className={`w-1 h-1 rounded-full mt-0.5 ${
                          activeSelected
                            ? 'bg-white'
                            : cell.holiday.isCutiBersama
                            ? 'bg-orange-500'
                            : 'bg-red-600'
                        }`}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected Date Info Card */}
            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Tanggal Dipilih:</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  selectedIsWorkday ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-700'
                }`}>
                  {selectedIsWorkday ? 'Hari Kerja Aktif' : 'Libur'}
                </span>
              </div>
              <p className="font-extrabold text-[#2B3440] text-xs leading-tight">
                {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              {selectedHoliday ? (
                <div className="flex items-center gap-1 text-[11px] font-bold text-red-600">
                  <AlertCircle size={12} className="shrink-0" />
                  <span className="truncate">{selectedHoliday.name} {selectedHoliday.isCutiBersama && '(Cuti Bersama)'}</span>
                </div>
              ) : selectedIsWeekend ? (
                <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600">
                  <Sun size={12} className="shrink-0" />
                  <span>Akhir Pekan ({selectedDate.getDay() === 0 ? 'Minggu' : 'Sabtu'})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] font-bold text-teal-700">
                  <CheckCircle size={12} className="shrink-0" />
                  <span>Hari Kerja Operasional BNI</span>
                </div>
              )}

              {/* Workday Recommendation */}
              <div className="pt-1.5 border-t border-gray-200 flex items-center justify-between text-[11px]">
                <span className="text-[#64748B] text-[10px]">Tanggal Masuk Kerja:</span>
                <span className="font-extrabold text-teal-800">
                  {selectedIsWorkday
                    ? 'Hari Ini Aktif'
                    : nextWorkday.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>

            {/* List of Holidays in current month */}
            {holidaysThisMonth.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wide">
                  <Info size={11} className="text-teal-600" />
                  <span>Hari Libur Bulan Ini:</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                  {holidaysThisMonth.map(h => {
                    const dNum = parseInt(h.date.split('-')[2], 10)
                    return (
                      <div
                        key={h.date}
                        onClick={() => handleDayClick(currentYear, currentMonth, dNum)}
                        className="flex items-center justify-between text-[10px] py-1 px-2 rounded-md bg-red-50 text-red-900 border border-red-100 hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <span className="truncate pr-1">• {h.name}</span>
                        <span className="font-extrabold text-red-700 shrink-0">
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
      )}

      {/* Floating Toggle Button (Always clearly visible, never covered by popup) */}
      <div className="pointer-events-auto">
        <button
          id="toggle-calendar-btn"
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-full font-extrabold text-xs shadow-xl transition-all duration-200 cursor-pointer active:scale-95 ${
            isOpen
              ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-500/25 shadow-red-900/30'
              : 'bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white ring-4 ring-teal-700/15 shadow-teal-900/30'
          }`}
          title={isOpen ? 'Tutup Kalender' : 'Buka Kalender Hari Libur & Kerja'}
        >
          <CalendarDays size={17} className={isOpen ? '' : 'animate-pulse'} />
          <span>{isOpen ? '✕ Tutup Kalender' : '📅 Kalender Hari Libur'}</span>
          {holidaysThisMonth.length > 0 && !isOpen && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-black">
              {holidaysThisMonth.length}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
