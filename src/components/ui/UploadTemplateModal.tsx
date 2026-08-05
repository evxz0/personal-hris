import React, { useState, useRef } from 'react'
import mammoth from 'mammoth'
import { Upload, FileText, X, CheckCircle, Sparkles, Award, Tag, CheckSquare, Square } from 'lucide-react'
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
  const [kategori, setKategori] = useState('Surat Keterangan')
  const [deskripsi, setDeskripsi] = useState('')
  const [showLogo, setShowLogo] = useState(true)
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
    setKategori('Surat Keterangan')
    setDeskripsi('')
    setShowLogo(true)
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
      setErrorMsg('Harap pilih berkas template dengan format .docx atau .doc')
      setStatus('error')
      return
    }

    setFileName(file.name)
    const suggestedName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
    setNamaTemplate(suggestedName)
    setStatus('reading')
    setErrorMsg('')

    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "r[style-name='Strong'] => strong"
          ]
        }
      )
      const html = result.value

      if (!html || html.trim() === '') {
        throw new Error('Dokumen template kosong atau tidak memiliki teks yang terbaca.')
      }

      setParsedHtml(html)
      const foundPlaceholders = extractPlaceholdersFromHtml(html)
      setPlaceholders(foundPlaceholders)
      setStatus('preview')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err?.message || 'Gagal membaca isi dokumen template.')
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
      setErrorMsg('Nama template surat wajib diisi.')
      return
    }

    try {
      const created = await addMutation.mutateAsync({
        nama_template: namaTemplate.trim(),
        kategori: kategori,
        deskripsi: deskripsi.trim(),
        html_content: parsedHtml,
        detected_placeholders: placeholders,
        show_logo: showLogo
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
      title="Upload Template Surat"
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
                Drag & Drop Berkas Template (.docx) di Sini
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Atau klik untuk memilih dokumen template dari device Anda
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
              <Sparkles size={13} />
              BNI Kop Logo & Presisi Ukuran Cetak A4 Diterapkan Otomatis
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
                <p className="text-[11px] text-teal-700">Terdeteksi {placeholders.length} variabel placeholder</p>
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
            {/* Template Info & Options (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-teal-900 block mb-1">
                  Nama Template Surat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={namaTemplate}
                  onChange={e => setNamaTemplate(e.target.value)}
                  placeholder="misal: Surat Peringatan Karyawan"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-teal-900 block mb-1">Kategori Surat</label>
                <select
                  value={kategori}
                  onChange={e => setKategori(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="Surat Keterangan">Surat Keterangan</option>
                  <option value="Surat Keputusan">Surat Keputusan</option>
                  <option value="Surat Teguran / Peringatan">Surat Teguran / Peringatan</option>
                  <option value="Surat Mutasi">Surat Mutasi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-teal-900 block mb-1">Deskripsi (Opsional)</label>
                <input
                  type="text"
                  value={deskripsi}
                  onChange={e => setDeskripsi(e.target.value)}
                  placeholder="misal: Template khusus teguran atau penugasan"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Show BNI Logo Toggle */}
              <div
                onClick={() => setShowLogo(!showLogo)}
                className="flex items-center justify-between p-3 bg-teal-50/40 border border-teal-200/80 rounded-xl cursor-pointer hover:bg-teal-50/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {showLogo ? <CheckSquare size={16} className="text-teal-600" /> : <Square size={16} className="text-gray-400" />}
                  <span className="text-xs font-bold text-teal-950">Tampilkan Logo Kop BNI (Top-Right)</span>
                </div>
                <span className="text-[10px] text-teal-700 bg-white px-2 py-0.5 rounded-md border border-teal-200 font-mono">
                  {showLogo ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              {/* Detected Placeholders */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <p className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Tag size={13} className="text-teal-600" />
                  Variabel / Placeholder Terdeteksi ({placeholders.length})
                </p>
                <p className="text-[11px] text-[#64748B]">
                  Variabel ini akan otomatis menjadi isian saat pembuatan surat:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1 max-h-[120px] overflow-y-auto">
                  {placeholders.map((ph, idx) => (
                    <span key={idx} className="text-[11px] font-mono px-2 py-0.5 bg-white border border-teal-300 text-teal-900 rounded-lg shadow-2xs font-semibold">
                      [{ph}]
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Document Live Preview Column (7 Cols) */}
            <div className="lg:col-span-7 bg-[#64748B]/10 p-3 rounded-2xl border border-gray-200 flex flex-col items-center max-h-[480px] overflow-y-auto">
              <p className="text-xs font-semibold text-[#64748B] mb-2 self-start flex items-center gap-1">
                <Award size={13} className="text-teal-600" />
                Pratinjau Akurat Dokumen A4
              </p>
              <div className="transform scale-[0.7] origin-top shadow-xl rounded-sm">
                <CustomTemplateRenderer
                  htmlContent={parsedHtml}
                  placeholderValues={placeholders.reduce((acc, ph) => ({ ...acc, [ph]: `[${ph}]` }), {})}
                  hideLogo={!showLogo}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
