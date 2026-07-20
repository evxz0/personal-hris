import { useState, useRef, useEffect } from 'react'
import { FileSpreadsheet, ScanLine, ChevronDown, Sparkles } from 'lucide-react'
import type { ImportMode } from './ImportModal'

export type { ImportMode }

interface ImportDropdownProps {
  onSelectExcel: () => void
  onSelectOcr: () => void
  label?: string
}

export function ImportDropdown({ onSelectExcel, onSelectOcr, label = 'Import' }: ImportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold
          bg-white text-[#2B3440] border border-gray-200 shadow-xs
          hover:bg-gray-50 hover:border-teal-500 hover:text-teal-700
          focus:outline-none focus:ring-2 focus:ring-teal-100 active:scale-[0.98]
          transition-all duration-150 cursor-pointer
        `}
      >
        <FileSpreadsheet size={15} className="text-teal-600" />
        <span>{label}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-gray-100 py-2 z-50 animate-fade-in-up">
          <div className="px-3 py-1.5 border-b border-gray-100 mb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Pilih Metode Import</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onSelectExcel()
            }}
            className="w-full text-left px-3 py-2.5 hover:bg-teal-50/60 transition-colors flex items-start gap-3 group"
          >
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors mt-0.5">
              <FileSpreadsheet size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#2B3440] group-hover:text-teal-700">Upload Excel / CSV / Word</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Import massal via spreadsheet .xlsx, .csv, atau .docx</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onSelectOcr()
            }}
            className="w-full text-left px-3 py-2.5 hover:bg-purple-50/60 transition-colors flex items-start gap-3 group"
          >
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors mt-0.5 relative">
              <ScanLine size={16} />
              <Sparkles size={10} className="absolute -top-0.5 -right-0.5 text-purple-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-[#2B3440] group-hover:text-purple-700">Scan Dokumen (OCR AI)</p>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-purple-100 text-purple-700">NEW</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">Ekstrak & auto-fill data dari scan KTP / SK / Gambar via Gemini AI</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
