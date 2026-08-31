import { useState, useRef, useEffect } from 'react'
import { Download, ChevronDown, FileText, FileCode } from 'lucide-react'

interface DocumentDownloadDropdownProps {
  onDownloadPDF: () => void | Promise<void>
  onDownloadWord?: () => void | Promise<void>
  onPrint?: () => void | Promise<void>
  loading?: boolean
}

export function DocumentDownloadDropdown({
  onDownloadPDF,
  onDownloadWord,
  onPrint,
  loading = false,
}: DocumentDownloadDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen(prev => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-colors cursor-pointer disabled:opacity-50"
      >
        <Download size={13} />
        <span>{loading ? 'Mengunduh...' : 'Download'}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white shadow-xl border border-gray-100 py-1.5 z-30 animate-fade-in">
          <button
            type="button"
            onClick={async () => {
              setOpen(false)
              await onDownloadPDF()
            }}
            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#2B3440] hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <FileText size={14} className="text-red-500" />
            <span>Dokumen PDF (.pdf)</span>
          </button>

          {onDownloadWord && (
            <button
              type="button"
              onClick={async () => {
                setOpen(false)
                await onDownloadWord()
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#2B3440] hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-gray-50"
            >
              <FileCode size={14} className="text-blue-600" />
              <span>Dokumen Word (.docx)</span>
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={async () => {
                setOpen(false)
                await onPrint()
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#2B3440] hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-gray-50"
            >
              <FileText size={14} className="text-slate-600" />
              <span>Cetak Langsung (Print)</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
