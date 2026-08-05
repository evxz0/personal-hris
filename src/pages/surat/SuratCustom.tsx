import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useReactToPrint } from 'react-to-print'
import { supabase } from '../../lib/supabase'
import { useCustomTemplates, useDeleteCustomTemplate } from '../../hooks/useCustomTemplates'
import { CustomTemplateRenderer } from '../../components/templates/CustomTemplateRenderer'
import { UploadTemplateModal } from '../../components/ui/UploadTemplateModal'
import { DocumentDownloadDropdown } from '../../components/ui/DocumentDownloadDropdown'
import { exportElementToPDF, exportElementToWord } from '../../lib/documentExport'
import { useAddRiwayatSurat } from '../../hooks/useRiwayatSurat'
import { Printer, UserCheck, Plus, Trash2, Sparkles, FileUp, Award, Layers } from 'lucide-react'

export default function SuratCustomPage() {
  const printRef = useRef<HTMLDivElement>(null)
  const addRiwayatSurat = useAddRiwayatSurat()

  const { data: templates = [] } = useCustomTemplates()
  const deleteMutation = useDeleteCustomTemplate()

  // Fetch employees list
  const { data: karyawanList = [], isLoading: isLoadingKaryawan } = useQuery({
    queryKey: ['karyawan-select-custom'],
    queryFn: async () => {
      const { data } = await supabase.from('karyawan').select('*').order('nama', { ascending: true })
      return data ?? []
    }
  })

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [selectedKaryawanId, setSelectedKaryawanId] = useState<string>('')
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({})
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Active Template Object
  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0] || null

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id)
    }
  }, [templates, selectedTemplateId])

  // Initialize placeholder values when active template changes
  useEffect(() => {
    if (activeTemplate) {
      const initialValues: Record<string, string> = {
        NOMOR_SURAT: 'PNK / 12 / 001 / H-R',
        TANGGAL_SURAT: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        KOTA_SURAT: 'Pontianak',
        PENANDATANGAN_NAMA: 'Rinna Elvianty',
        PENANDATANGAN_JABATAN: 'Pj. Branch Manager',
        ...placeholderValues
      }

      activeTemplate.detected_placeholders.forEach(ph => {
        if (!(ph in initialValues)) {
          initialValues[ph] = `[${ph}]`
        }
      })

      setPlaceholderValues(initialValues)
    }
  }, [activeTemplate?.id])

  // Auto fill employee data
  const handleSelectKaryawan = (id: string) => {
    setSelectedKaryawanId(id)
    if (!id) return

    const emp = karyawanList.find(k => k.id === id)
    if (emp) {
      setPlaceholderValues(prev => ({
        ...prev,
        NAMA: emp.nama || '',
        NPP: emp.npp || '',
        JABATAN: emp.jabatan || 'STAFF',
        POSISI: emp.jabatan || 'STAFF',
        UNIT: emp.outlet || 'Pontianak Branch Office',
        OUTLET: emp.outlet || 'Pontianak Branch Office',
        NIK: emp.nik || '',
        TTL: emp.tanggal_lahir
          ? `Pontianak, ${new Date(emp.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
          : 'Pontianak, -'
      }))
    }
  }

  const handlePlaceholderChange = (key: string, val: string) => {
    setPlaceholderValues(prev => ({ ...prev, [key]: val }))
  }

  // Record history
  const recordHistory = async () => {
    if (!activeTemplate) return
    const namaPegawai = placeholderValues['NAMA'] || placeholderValues['nama'] || 'Pegawai'
    const nppPegawai = placeholderValues['NPP'] || placeholderValues['npp'] || '-'
    const nomorSurat = placeholderValues['NOMOR_SURAT'] || 'CUSTOM/001'

    try {
      await addRiwayatSurat.mutateAsync({
        nomor_surat: nomorSurat,
        jenis_surat: `Custom: ${activeTemplate.nama_template}` as any,
        nama_pegawai: namaPegawai,
        npp_pegawai: nppPegawai,
        tanggal_surat: placeholderValues['TANGGAL_SURAT'] || '-',
        payload: {
          templateName: activeTemplate.nama_template,
          htmlContent: activeTemplate.html_content,
          placeholderValues
        }
      })
    } catch (e) {
      console.error('Failed to log history', e)
    }
  }

  // Actions
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: activeTemplate ? `${activeTemplate.nama_template.replace(/\s+/g, '_')}` : 'Surat_Custom',
    onAfterPrint: () => recordHistory()
  })

  const handleDownloadPDF = async () => {
    if (printRef.current && activeTemplate) {
      await exportElementToPDF(
        printRef.current,
        `${activeTemplate.nama_template.replace(/\s+/g, '_')}_${placeholderValues['NPP'] || 'Doc'}`
      )
      recordHistory()
    }
  }

  const handleDownloadWord = async () => {
    if (printRef.current && activeTemplate) {
      await exportElementToWord(
        printRef.current,
        `${activeTemplate.nama_template.replace(/\s+/g, '_')}_${placeholderValues['NPP'] || 'Doc'}`
      )
      recordHistory()
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    await deleteMutation.mutateAsync(id)
    setDeleteConfirmId(null)
    setSelectedTemplateId('')
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <FileUp size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1E293B]">Template Surat Custom (Word Upload)</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Tambah dan buat surat secara fleksibel hanya dengan mengunggah file Word (.docx)
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 shadow-md transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Upload Template Word Baru</span>
          </button>

          {activeTemplate && (
            <>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-700 to-teal-800 text-white rounded-xl text-xs font-semibold hover:from-teal-800 hover:to-teal-900 shadow-md transition-all active:scale-95"
              >
                <Printer size={15} />
                <span>Cetak</span>
              </button>

              <DocumentDownloadDropdown
                onDownloadPDF={handleDownloadPDF}
                onDownloadWord={handleDownloadWord}
              />
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {templates.length === 0 ? (
        /* Empty State: Prompt user to upload Word Template */
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-inner">
            <FileUp size={40} />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-bold text-teal-950">Belum Ada Template Custom yang Diunggah</h3>
            <p className="text-xs text-[#64748B] mt-1">
              Unggah berkas Microsoft Word (.docx) surat organisasi Anda. Logo BNI dan format ukuran A4 akan otomatis disesuaikan!
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 shadow-lg transition-all active:scale-95 mt-2"
          >
            <Sparkles size={16} />
            <span>Upload Berkas Word (.docx) Sekarang</span>
          </button>
        </div>
      ) : (
        /* Grid Layout: Template Selector & Controls (Left) vs Live Preview (Right) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column (5 Cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            {/* Template Dropdown Selector */}
            <div className="space-y-1.5 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                  <Layers size={14} />
                  Pilih Template Custom
                </label>
                {activeTemplate && (
                  <button
                    onClick={() => setDeleteConfirmId(activeTemplate.id)}
                    className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 size={13} />
                    Hapus Template
                  </button>
                )}
              </div>
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-teal-200 rounded-xl focus:outline-none focus:border-teal-500 bg-teal-50/30 text-teal-950 font-bold"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    📄 {t.nama_template}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Select Employee */}
            <div className="space-y-1.5 pb-3 border-b border-gray-100">
              <label className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                <UserCheck size={14} />
                Isi Otomatis dari Master Karyawan
              </label>
              <select
                value={selectedKaryawanId}
                onChange={e => handleSelectKaryawan(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
              >
                <option value="">-- Pilih Karyawan --</option>
                {isLoadingKaryawan ? (
                  <option disabled>Memuat data karyawan...</option>
                ) : (
                  karyawanList.map(k => (
                    <option key={k.id} value={k.id}>
                      {k.nama} ({k.npp}) - {k.jabatan || 'Karyawan'}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Dynamic Placeholder Form Fields */}
            {activeTemplate && (
              <div className="space-y-3">
                <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide border-l-2 border-teal-600 pl-2">
                  Variabel & Isian Template Surat
                </p>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {activeTemplate.detected_placeholders.map(ph => (
                    <div key={ph}>
                      <label className="text-[11px] font-semibold text-[#64748B]">
                        Variabel [{ph}]
                      </label>
                      <input
                        type="text"
                        value={placeholderValues[ph] ?? ''}
                        onChange={e => handlePlaceholderChange(ph, e.target.value)}
                        placeholder={`Isi nilai untuk [${ph}]`}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Document Preview Column (7 Cols) */}
          <div className="lg:col-span-7 bg-[#64748B]/10 p-4 rounded-2xl border border-gray-200 flex flex-col items-center overflow-x-auto min-h-[700px]">
            <p className="text-xs font-semibold text-[#64748B] mb-3 flex items-center gap-1.5 self-start">
              <Award size={14} className="text-teal-600" />
              Live Preview A4 Document (Siap Cetak)
            </p>

            {activeTemplate && (
              <div className="transform scale-[0.85] origin-top shadow-2xl rounded-sm">
                <CustomTemplateRenderer
                  ref={printRef}
                  htmlContent={activeTemplate.html_content}
                  placeholderValues={placeholderValues}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadTemplateModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={newId => {
          setSelectedTemplateId(newId)
        }}
      />

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Hapus Template Custom</h3>
            <p className="text-xs text-gray-600">
              Apakah Anda yakin ingin menghapus template ini dari sistem?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteTemplate(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
