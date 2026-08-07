import { useState, useRef } from 'react'
import { Calendar } from 'lucide-react'
import { formatIsoToIndonesian, formatIndonesianToIso } from '../../lib/dateUtils'

export const JENJANG_OPTIONS = ['', 'VP', 'AVP', 'MGR', 'AMGR', 'ASST']

export const GRADE_OPTIONS = [
  '',
  '.GRADE.12',
  '.GRADE.11',
  '.GRADE.10',
  '.GRADE.9',
  '.GRADE.8',
  '.GRADE.7',
  '.GRADE.6',
  '.GRADE.5',
  '.GRADE.4',
  '.NON.GRADE'
]

interface DatePickerInputProps {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

export function DatePickerInput({ label, value, onChange, placeholder = "misal: 27 Juli 2026" }: DatePickerInputProps) {
  const isoValue = formatIndonesianToIso(value)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const handleOpenPicker = () => {
    try {
      if (dateInputRef.current && typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker()
      }
    } catch {
      // Fallback for browsers that block trigger
    }
  }

  return (
    <div>
      <label className="text-[11px] font-semibold text-[#64748B]">{label}</label>
      <div
        className="relative flex items-center mt-1 cursor-pointer group"
        onClick={handleOpenPicker}
      >
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-3 pr-9 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white font-medium cursor-pointer"
        />
        <div className="absolute right-2.5 flex items-center justify-center text-gray-400 group-hover:text-teal-600 pointer-events-none">
          <Calendar size={15} />
        </div>
        <input
          ref={dateInputRef}
          type="date"
          value={isoValue}
          onChange={e => {
            if (e.target.value) {
              onChange(formatIsoToIndonesian(e.target.value))
            }
          }}
          className="absolute right-1 w-7 h-7 opacity-0 cursor-pointer pointer-events-auto"
          title="Pilih Tanggal dari Kalender"
        />
      </div>
    </div>
  )
}

interface UnitSelectInputProps {
  label: string
  value: string
  onChange: (val: string) => void
  outlets: { id: string; nama_referensi: string }[]
  placeholder?: string
}

export function UnitSelectInput({
  label,
  value,
  onChange,
  outlets,
  placeholder = "Ketik nama unit/cabang manual..."
}: UnitSelectInputProps) {
  const isPreset = outlets.some(o => o.nama_referensi === value)
  const isCustom = Boolean(value && !isPreset)
  const [isManualMode, setIsManualMode] = useState(isCustom)

  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-[#64748B]">{label}</label>
      <select
        value={isManualMode || isCustom ? '__MANUAL__' : (value || '')}
        onChange={e => {
          const val = e.target.value
          if (val === '__MANUAL__') {
            setIsManualMode(true)
          } else {
            setIsManualMode(false)
            onChange(val)
          }
        }}
        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white font-medium"
      >
        <option value="">-- Kosong (Tanpa Unit) --</option>
        {outlets.map(o => (
          <option key={o.id} value={o.nama_referensi}>
            {o.nama_referensi}
          </option>
        ))}
        <option value="__MANUAL__">-- Isi Manual / Custom Unit --</option>
      </select>

      {(isManualMode || isCustom) && (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-1.5 text-xs border border-teal-300 rounded-xl focus:outline-none focus:border-teal-600 bg-teal-50/40 mt-1 animate-fade-in font-medium"
        />
      )}
    </div>
  )
}

interface JenjangSelectProps {
  label?: string
  value: string
  onChange: (val: string) => void
}

export function JenjangSelect({ label = "Jenjang", value, onChange }: JenjangSelectProps) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-[#64748B]">{label}</label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white font-medium mt-1"
      >
        <option value="">-- Tanpa Jenjang --</option>
        {JENJANG_OPTIONS.filter(Boolean).map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        {value && !JENJANG_OPTIONS.includes(value) && (
          <option value={value}>{value}</option>
        )}
      </select>
    </div>
  )
}

interface GradeSelectProps {
  label?: string
  value: string
  onChange: (val: string) => void
}

export function GradeSelect({ label = "Grade", value, onChange }: GradeSelectProps) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-[#64748B]">{label}</label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white font-medium mt-1"
      >
        <option value="">-- Tanpa Grade --</option>
        {GRADE_OPTIONS.filter(Boolean).map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        {value && !GRADE_OPTIONS.includes(value) && (
          <option value={value}>{value}</option>
        )}
      </select>
    </div>
  )
}
