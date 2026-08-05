import React, { useState, useRef } from 'react'
import mammoth from 'mammoth'
import { Upload, FileText, X, CheckCircle, Sparkles, Award, Tag } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { useAddCustomTemplate } from '../../hooks/useCustomTemplates'
import { CustomTemplateRenderer } from '../templates/CustomTemplateRenderer'

interface UploadTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (templateId: string) => void
}

/**
 * Extract placeholders from HTML text.
 * Finds patterns like [NAMA], [NPP], {JABATAN}, %TANGGAL%, etc.
 */
export function extractPlaceholdersFromHtml(html: string): string[] {
  if (!html) return []

  const matches = html.match(/(?:\[|\{|%)([A-Z0-9_]{2,30})(?:\]|\}|%)/gi) || []
  const cleanSet = new Set<string>()

  matches.forEach(m => {
    const rawKey = m.replace(/^[\[\{%]|[\}\]%]$/g, '').trim().toUpperCase()
    if (rawKey && !/^(P|DIV|SPAN|STYLE|TABLE|TR|TD|BR|STRONG|EM|U|B|I|H1|H2|H3|H4|H5|H6)$/i.test(rawKey)) {
      cleanSet.add(rawKey)
    }
  })

  // Provide default essential placeholders if none found
  if (cleanSet.size === 0) {
    cleanSet.add('NAMA')
    cleanSet.add('NPP')
    cleanSet.add('JABATAN')
    cleanSet.add('NOMOR_SURAT')
    cleanSet.add('TANGGAL_SURAT')
  }

  return Array.from(cleanSet)
}

export function UploadTemplateModal({ isOpen, onClose, onSuccess }: UploadTemplateModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [namaTemplate, setNamaTemplate] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [parsedHtml, setParsedHtml] = useState('')
  const [placeholders, setPlaceholders] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'reading' | 'preview' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const addMutation = useAddCustomTemplate()

  if (!isOpen) return null

  const handleReset = () => {
    setFileName('')
    setNamaTemplate('')
    setDeskripsi('')
    setParsedHtml('')
    setPlaceholders([])
    setStatus('idle')
    setErrorMsg('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const processWordFile = async (file: File) => {
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setErrorMsg('Harap pilih berkas Microsoft Word dengan format .docx atau .doc')
      setStatus('error')
      return
    }

    setFileName(file.name)
    setNamaTemplate(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '))
    setStatus('reading')
    setErrorMsg('')

    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      const html = result.value

      if (!html || html.trim() === '') {
        throw new Error('Dokumen Word kosong atau tidak memiliki teks yang terbaca.')
      }

      setParsedHtml(html)
      const foundPlaceholders = extractPlaceholdersFromHtml(html)
      setPlaceholders(foundPlaceholders)
      setStatus('preview')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err?.message || 'Gagal membaca isi dokumen Word.')
      setStatus('error')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processWordFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processWordFile(file)
  }

  const handleSave = async () => {
    if (!namaTemplate.trim()) {
      setErrorMsg('Nama template tidak boleh kosong.')
      return
    }

    try {
      const created = await addMutation.mutateAsync({
        nama_template: namaTemplate.trim(),
        deskripsi: deskripsi.trim(),
        html_content: parsedHtml,
        detected_placeholders: placeholders
      })

      if (onSuccess) onSuccess(created.id)
      handleClose()
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menyimpan template baru.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Template Surat (Word .docx)"
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Batal</Button>
          {status === 'preview' && (
            <Button
              variant="primary"
              loading={addMutation.isPending}
              icon={<CheckCircle size={16} />}
              onClick={handleSave}
            >
              Simpan Template Ke Sistem
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* Drag and Drop Zone */}
        {status === 'idle' || status === 'reading' || status === 'error' ? (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3
              ${isDragging ? 'border-teal-500 bg-teal-50/60 scale-[0.99]' : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50/50'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc"
              onChange={handleInputChange}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-teal-100/80 text-teal-700 flex items-center justify-center shadow-inner">
              <Upload size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-teal-950">
                Drag & Drop Berkas Word (.docx) di Sini
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Atau klik untuk memilih dokumen Word dari laptop/device Anda
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
              <Sparkles size={13} />
              BNI Kop Logo & Settingan Ukuran A4 Otomatis Diterapkan
            </div>
          </div>
        ) : (
          /* File Uploaded Header */
          <div className="flex items-center justify-between p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-teal-950">{fileName}</p>
                <p className="text-[11px] text-teal-700">Tersedia {placeholders.length} variabel placeholder terdeteksi</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Ganti Berkas
            </Button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')}><X size={14} /></button>
          </div>
        )}

        {/* Template Settings & Live Preview (When Preview Mode) */}
        {status === 'preview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Template Info & Detected Fields (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-teal-900 block mb-1">Nama Template Surat</label>
                <input
                  type="text"
                  value={namaTemplate}
                  onChange={e => setNamaTemplate(e.target.value)}
                  placeholder="misal: Surat Peringatan Karyawan"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-teal-900 block mb-1">Deskripsi (Opsional)</label>
                <input
                  type="text"
                  value={deskripsi}
                  onChange={e => setDeskripsi(e.target.value)}
                  placeholder="misal: Digunakan untuk pemberian teguran tertulis"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Detected Placeholders */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <p className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Tag size={13} className="text-teal-600" />
                  Variabel / Placeholder Terdeteksi ({placeholders.length})
                </p>
                <p className="text-[11px] text-[#64748B]">
                  Variabel ini akan otomatis dijadikan kolom isian saat membuat surat:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {placeholders.map((ph, idx) => (
                    <span key={idx} className="text-[11px] font-mono px-2 py-0.5 bg-white border border-teal-300 text-teal-900 rounded-lg shadow-2xs font-semibold">
                      [{ph}]
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Document Live Preview Column (7 Cols) */}
            <div className="lg:col-span-7 bg-[#64748B]/10 p-3 rounded-2xl border border-gray-200 flex flex-col items-center max-h-[450px] overflow-y-auto">
              <p className="text-xs font-semibold text-[#64748B] mb-2 self-start flex items-center gap-1">
                <Award size={13} className="text-teal-600" />
                Pratinjau Tata Letak A4 & Logo BNI
              </p>
              <div className="transform scale-[0.7] origin-top shadow-xl rounded-sm">
                <CustomTemplateRenderer
                  htmlContent={parsedHtml}
                  placeholderValues={placeholders.reduce((acc, ph) => ({ ...acc, [ph]: `[${ph}]` }), {})}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
