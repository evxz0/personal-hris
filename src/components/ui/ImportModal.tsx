import React, { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, FileText, File, X, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { parseXLSX, parseWord, downloadTemplate } from '../../lib/importExport'
import { Button } from './Button'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (rows: Record<string, unknown>[]) => Promise<void>
  title: string
  templateHeaders: string[]
  templateFilename: string
  fieldMapping: Record<string, string> // { 'NPP': 'npp', 'Nama': 'nama', ... }
  requiredFields: string[] // column keys required
}

type FileStatus = 'idle' | 'reading' | 'preview' | 'importing' | 'success' | 'error'

export function ImportModal({
  isOpen, onClose, onImport, title,
  templateHeaders, templateFilename, fieldMapping, requiredFields,
}: ImportModalProps) {
  const [status, setStatus] = useState<FileStatus>('idle')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState('')
  const [successCount, setSuccessCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFile = async (file: File) => {
    setError('')
    setFileName(file.name)
    setStatus('reading')
    try {
      let raw: Record<string, unknown>[] = []
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        raw = await parseWord(file)
      } else {
        raw = await parseXLSX(file)
      }
      if (raw.length === 0) throw new Error('File kosong atau format tidak dikenali.')

      // Map columns
      const mapped = raw.map(row => {
        const obj: Record<string, unknown> = {}
        for (const [header, key] of Object.entries(fieldMapping)) {
          const val = row[header] ?? row[header.toLowerCase()] ?? row[key] ?? ''
          obj[key] = val
        }
        return obj
      })
      // Filter rows that have required fields
      const valid = mapped.filter(r => requiredFields.every(f => r[f] && String(r[f]).trim() !== ''))
      if (valid.length === 0) throw new Error('Tidak ada data valid. Periksa header kolom file Anda.')
      setRows(valid)
      setStatus('preview')
    } catch (e) {
      const msg = e instanceof Error ? e.message : (typeof e === 'object' && e !== null && 'message' in e ? String((e as any).message) : 'Gagal membaca file')
      setError(msg)
      setStatus('error')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    setStatus('importing')
    try {
      await onImport(rows)
      setSuccessCount(rows.length)
      setStatus('success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : (typeof e === 'object' && e !== null && 'message' in e ? String((e as any).message) : 'Gagal mengimport data')
      setError(msg)
      setStatus('error')
    }
  }

  const handleReset = () => {
    setStatus('idle')
    setFileName('')
    setRows([])
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const previewHeaders = Object.values(fieldMapping)
  const previewData = rows.slice(0, 5)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl animate-fade-in-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Upload size={18} />
            </div>
            <h2 className="text-base font-bold text-[#2B3440]">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#64748B] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Template Download */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 border border-teal-100">
            <div>
              <p className="text-sm font-semibold text-teal-700">Unduh Template Excel</p>
              <p className="text-xs text-teal-600">Gunakan template ini agar format kolom sesuai</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              onClick={() => downloadTemplate(templateHeaders, templateFilename)}
            >
              Template
            </Button>
          </div>

          {/* Format Info */}
          <div className="flex gap-3 text-xs text-[#64748B]">
            {[
              { icon: <FileSpreadsheet size={14} className="text-green-600" />, label: '.xlsx / .xls' },
              { icon: <File size={14} className="text-blue-600" />, label: '.csv' },
              { icon: <FileText size={14} className="text-indigo-600" />, label: '.docx / .doc' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                {f.icon}
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Drop Zone */}
          {(status === 'idle' || status === 'error') && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
                ${isDragging ? 'border-teal-500 bg-teal-50 scale-[1.01]' : 'border-gray-200 hover:border-teal-400 hover:bg-teal-50/50'}
              `}
            >
              <Upload size={36} className={`mx-auto mb-3 ${isDragging ? 'text-teal-500' : 'text-gray-300'}`} />
              <p className="text-sm font-semibold text-[#2B3440]">
                {isDragging ? 'Lepaskan file di sini' : 'Seret & lepas file atau klik untuk pilih'}
              </p>
              <p className="text-xs text-[#64748B] mt-1">Mendukung .xlsx, .xls, .csv, .docx</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.docx,.doc"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
          )}

          {/* Reading */}
          {status === 'reading' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-[#64748B]">Membaca file: {fileName}…</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">Terjadi Kesalahan</p>
                <p className="text-xs text-red-600 mt-0.5 whitespace-pre-wrap">{error}</p>
                <button onClick={handleReset} className="text-xs text-red-700 underline mt-2">Coba lagi</button>
              </div>
            </div>
          )}

          {/* Preview */}
          {status === 'preview' && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-teal-600" />
                  <span className="text-sm font-semibold text-[#2B3440]">{fileName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">
                    {rows.length} baris valid
                  </span>
                </div>
                <button onClick={handleReset} className="text-xs text-[#64748B] hover:text-red-500 transition-colors flex items-center gap-1">
                  <X size={12} /> Ganti file
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-[#F4F7F6] px-4 py-2 border-b border-gray-200">
                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                    Preview {Math.min(5, rows.length)} dari {rows.length} baris
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-teal-600 text-white">
                        {previewHeaders.map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap capitalize">
                            {h.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F4F7F6]'}>
                          {previewHeaders.map(h => (
                            <td key={h} className="px-3 py-2 text-[#2B3440] whitespace-nowrap">
                              {String(row[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="text-center py-8 animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <p className="text-lg font-bold text-[#2B3440]">Import Berhasil!</p>
              <p className="text-sm text-[#64748B] mt-1">{successCount} data berhasil disimpan ke database</p>
            </div>
          )}

          {/* Importing */}
          {status === 'importing' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-[#64748B]">Menyimpan {rows.length} data ke database…</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          {status === 'success' ? (
            <Button variant="primary" onClick={onClose}>Selesai</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose}>Batal</Button>
              {status === 'preview' && (
                <Button
                  variant="primary"
                  icon={<Upload size={15} />}
                  onClick={handleImport}
                >
                  Import {rows.length} Data
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
