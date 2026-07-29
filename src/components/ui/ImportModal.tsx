import React, { useState, useRef, useEffect } from 'react'
import { Upload, FileSpreadsheet, FileText, File, X, CheckCircle, AlertCircle, ScanLine, Sparkles, Code, Edit3 } from 'lucide-react'
import { parseXLSX, parseWord } from '../../lib/importExport'
import { extractDocumentScan, importExcelSmart } from '../../lib/ocrService'
import { parseOcrText, cleanMarkdownText } from '../../lib/ocrParser'
import { parseSpreadsheetSmart, matchHeaderToKey } from '../../lib/dataMiningParser'
import { Button } from './Button'

export type ImportMode = 'excel' | 'ocr'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (rows: Record<string, unknown>[]) => Promise<void>
  title: string
  templateHeaders?: string[]
  templateFilename?: string
  fieldMapping: Record<string, string> // { 'NPP': 'npp', 'Nama': 'nama', ... }
  requiredFields: string[] // column keys required
  initialMode?: ImportMode
}

type FileStatus = 'idle' | 'reading' | 'preview' | 'importing' | 'success' | 'error'

export function ImportModal({
  isOpen, onClose, onImport, title,
  fieldMapping, requiredFields,
  initialMode = 'excel'
}: ImportModalProps) {
  const [mode, setMode] = useState<ImportMode>(initialMode)
  const [status, setStatus] = useState<FileStatus>('idle')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [ocrRawText, setOcrRawText] = useState('')
  const [ocrParsedForm, setOcrParsedForm] = useState<Record<string, string>>({})
  const [activeOcrTab, setActiveOcrTab] = useState<'form' | 'raw'>('form')
  const [error, setError] = useState('')
  const [successCount, setSuccessCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      handleReset()
    }
  }, [isOpen, initialMode])

  if (!isOpen) return null

  const handleReset = () => {
    setStatus('idle')
    setFileName('')
    setRows([])
    setOcrRawText('')
    setOcrParsedForm({})
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleModeChange = (newMode: ImportMode) => {
    setMode(newMode)
    handleReset()
  }

  const handleFileExcel = async (file: File) => {
    setError('')
    setFileName(file.name)
    setStatus('reading')
    try {
      // 1. Coba gunakan Smart AI Column Mapper dari backend Vercel FastAPI jika online
      if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
        try {
          const res = await importExcelSmart(file)
          if (res.success && res.data && res.data.length > 0) {
            setRows(res.data)
            setStatus('preview')
            return
          }
        } catch {
          // Fallback ke Data Mining Engine lokal
        }
      }

      // 2. Data Mining Engine & Fuzzy AI Header Matcher Lokal
      let rawRows: Record<string, unknown>[] = []

      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        const rawWord = await parseWord(file)
        rawRows = rawWord.map(row => {
          const obj: Record<string, unknown> = {}
          for (const [colHeader, val] of Object.entries(row)) {
            const matchedKey = matchHeaderToKey(colHeader, fieldMapping)
            if (matchedKey) {
              obj[matchedKey] = val
            } else {
              obj[colHeader] = val
            }
          }
          return obj
        })
      } else {
        const arrayBuffer = await file.arrayBuffer()
        rawRows = parseSpreadsheetSmart(arrayBuffer, fieldMapping, requiredFields)
      }

      if (rawRows.length === 0) {
        // Fallback ketiga: coba parse standard XLSX jika data mining tidak mendeteksi baris khusus
        const standardRaw = await parseXLSX(file)
        if (standardRaw.length > 0) {
          rawRows = standardRaw.map(row => {
            const obj: Record<string, unknown> = {}
            for (const [colHeader, val] of Object.entries(row)) {
              const matchedKey = matchHeaderToKey(colHeader, fieldMapping)
              if (matchedKey) {
                obj[matchedKey] = val
              } else {
                obj[colHeader] = val
              }
            }
            return obj
          })
        }
      }

      if (rawRows.length === 0) {
        throw new Error('Tidak ada data valid yang dapat dibaca. Periksa isi file Anda.')
      }

      setRows(rawRows)
      setStatus('preview')
    } catch (e) {
      const msg = e instanceof Error ? e.message : (typeof e === 'object' && e !== null && 'message' in e ? String((e as any).message) : 'Gagal membaca file')
      setError(msg)
      setStatus('error')
    }
  }

  const handleFileOcr = async (file: File) => {
    setError('')
    setFileName(file.name)
    setStatus('reading')

    const res = await extractDocumentScan(file)
    if (!res.success || !res.extracted_text) {
      const msg = res.error || 'Terjadi kendala keamanan atau server saat membaca dokumen.'
      setError(msg)
      setStatus('error')
      return
    }

    const rawText = cleanMarkdownText(res.extracted_text)
    setOcrRawText(rawText)

    // Parse extracted text to fields mapping
    const parsed = parseOcrText(rawText, fieldMapping)
    
    // Prepare form fields for editing
    const formValues: Record<string, string> = {}
    for (const key of Object.values(fieldMapping)) {
      formValues[key] = cleanMarkdownText(String(parsed.parsedRow[key] ?? ''))
    }
    
    setOcrParsedForm(formValues)
    setRows([formValues])
    setStatus('preview')
  }

  const handleFile = (file: File) => {
    if (mode === 'ocr') {
      handleFileOcr(file)
    } else {
      handleFileExcel(file)
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

  const handleOcrFormChange = (key: string, val: string) => {
    const updated = { ...ocrParsedForm, [key]: val }
    setOcrParsedForm(updated)
    setRows([updated])
  }

  const handleImport = async () => {
    setStatus('importing')
    try {
      const payload = mode === 'ocr' ? [ocrParsedForm] : rows
      await onImport(payload)
      setSuccessCount(payload.length)
      setStatus('success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : (typeof e === 'object' && e !== null && 'message' in e ? String((e as any).message) : 'Gagal mengimport data')
      setError(msg)
      setStatus('error')
    }
  }

  const previewHeaders = Array.from(new Set(Object.values(fieldMapping)))
  const previewData = rows.slice(0, 5)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl animate-fade-in-up max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${mode === 'ocr' ? 'bg-purple-50 text-purple-600' : 'bg-teal-50 text-teal-600'}`}>
              {mode === 'ocr' ? <ScanLine size={18} /> : <Upload size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2B3440]">{title}</h2>
              <p className="text-xs text-[#64748B]">
                {mode === 'ocr' ? 'Scan dokumen fisik/gambar via Gemini OCR Vercel API' : 'Import data dari berkas Spreadsheet/Word'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#64748B] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        {status === 'idle' && (
          <div className="flex border-b border-gray-100 px-6 pt-3 bg-gray-50/50">
            <button
              onClick={() => handleModeChange('excel')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                mode === 'excel'
                  ? 'border-teal-600 text-teal-700 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileSpreadsheet size={15} />
              <span>Upload Excel / CSV / Word</span>
            </button>
            <button
              onClick={() => handleModeChange('ocr')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                mode === 'ocr'
                  ? 'border-purple-600 text-purple-700 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ScanLine size={15} />
              <span>Scan Dokumen (OCR AI)</span>
              <Sparkles size={12} className="text-purple-500 animate-pulse" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Mode Excel: Format Info */}
          {mode === 'excel' && status === 'idle' && (
            <>

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
            </>
          )}

          {/* Mode OCR: Info Box */}
          {mode === 'ocr' && status === 'idle' && (
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-800 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-purple-900">
                <Sparkles size={14} className="text-purple-600" />
                <span>Fitur Ekstraksi Dokumen Otomatis (Gemini OCR)</span>
              </div>
              <p className="text-purple-700">
                Unggah foto atau berkas scan dokumen (KTP, SK, Memorandum, Form). Sistem akan mengekstrak teks dan mengisikan kolom data secara otomatis.
              </p>
            </div>
          )}

          {/* Drop Zone */}
          {(status === 'idle' || status === 'error') && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
                ${isDragging
                  ? (mode === 'ocr' ? 'border-purple-500 bg-purple-50 scale-[1.01]' : 'border-teal-500 bg-teal-50 scale-[1.01]')
                  : (mode === 'ocr' ? 'border-purple-200 hover:border-purple-400 hover:bg-purple-50/40' : 'border-gray-200 hover:border-teal-400 hover:bg-teal-50/50')}
              `}
            >
              {mode === 'ocr' ? (
                <ScanLine size={38} className={`mx-auto mb-3 ${isDragging ? 'text-purple-500' : 'text-purple-400'}`} />
              ) : (
                <Upload size={36} className={`mx-auto mb-3 ${isDragging ? 'text-teal-500' : 'text-gray-300'}`} />
              )}
              
              <p className="text-sm font-semibold text-[#2B3440]">
                {isDragging ? 'Lepaskan file di sini' : 'Seret & lepas file scan/dokumen atau klik untuk pilih'}
              </p>
              
              <p className="text-xs text-[#64748B] mt-1">
                {mode === 'ocr' ? 'Mendukung format gambar (.jpg, .jpeg, .png, .webp) & PDF / Scan' : 'Mendukung .xlsx, .xls, .csv, .docx'}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept={mode === 'ocr' ? 'image/*,.pdf' : '.xlsx,.xls,.csv,.docx,.doc'}
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
          )}

          {/* Reading Status */}
          {status === 'reading' && (
            <div className="text-center py-10">
              <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-3 ${mode === 'ocr' ? 'border-purple-100 border-t-purple-600' : 'border-teal-100 border-t-teal-500'}`} />
              <p className="text-sm font-medium text-[#2B3440]">
                {mode === 'ocr' ? 'Mengirim & mengekstrak teks via Vercel Gemini OCR…' : `Membaca file: ${fileName}…`}
              </p>
              <p className="text-xs text-[#64748B] mt-1">Mohon tunggu beberapa saat</p>
            </div>
          )}

          {/* Error View */}
          {status === 'error' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">Terjadi Kesalahan</p>
                <p className="text-xs text-red-600 mt-0.5 whitespace-pre-wrap">{error}</p>
                <button onClick={handleReset} className="text-xs text-red-700 underline mt-2 font-medium">Coba lagi</button>
              </div>
            </div>
          )}

          {/* Mode OCR Preview View */}
          {mode === 'ocr' && status === 'preview' && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScanLine size={16} className="text-purple-600" />
                  <span className="text-sm font-semibold text-[#2B3440]">{fileName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium flex items-center gap-1">
                    <Sparkles size={10} /> OCR Berhasil Extracted
                  </span>
                </div>
                <button onClick={handleReset} className="text-xs text-[#64748B] hover:text-red-500 transition-colors flex items-center gap-1">
                  <X size={12} /> Scan Ulang
                </button>
              </div>

              {/* Sub-tabs for Form Auto-fill vs Raw Text */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveOcrTab('form')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                    activeOcrTab === 'form' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Edit3 size={13} />
                  <span>Hasil Parsing Form</span>
                </button>
                <button
                  onClick={() => setActiveOcrTab('raw')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                    activeOcrTab === 'raw' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Code size={13} />
                  <span>Teks Hasil Scan Mentah</span>
                </button>
              </div>

              {/* Tab 1: Form Auto-fill */}
              {activeOcrTab === 'form' && (
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <p className="text-xs text-[#64748B] font-medium">
                    Periksa dan sesuaikan data terdeteksi dari hasil scan sebelum disimpan:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                    {Object.entries(fieldMapping).map(([header, key]) => (
                      <div key={key} className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs">
                        <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                          {header}
                        </label>
                        <input
                          type="text"
                          value={ocrParsedForm[key] ?? ''}
                          onChange={e => handleOcrFormChange(key, e.target.value)}
                          placeholder={`Isi ${header}`}
                          className="w-full text-xs text-[#2B3440] font-medium bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Raw Extracted Text */}
              {activeOcrTab === 'raw' && (
                <div className="rounded-xl border border-gray-200 bg-[#1E1E1E] p-4 text-xs font-mono text-gray-200 max-h-[250px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {ocrRawText}
                </div>
              )}
            </div>
          )}

          {/* Mode Excel Preview View */}
          {mode === 'excel' && status === 'preview' && (
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

          {/* Success Status */}
          {status === 'success' && (
            <div className="text-center py-8 animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <p className="text-lg font-bold text-[#2B3440]">Import Berhasil!</p>
              <p className="text-sm text-[#64748B] mt-1">{successCount} data berhasil disimpan ke database</p>
            </div>
          )}

          {/* Importing Status */}
          {status === 'importing' && (
            <div className="text-center py-8">
              <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-3 ${mode === 'ocr' ? 'border-purple-100 border-t-purple-600' : 'border-teal-100 border-t-teal-500'}`} />
              <p className="text-sm font-medium text-[#64748B]">Menyimpan data ke database…</p>
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
                  icon={mode === 'ocr' ? <Sparkles size={15} /> : <Upload size={15} />}
                  onClick={handleImport}
                >
                  {mode === 'ocr' ? 'Import Data (Hasil Scan)' : `Import ${rows.length} Data`}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
