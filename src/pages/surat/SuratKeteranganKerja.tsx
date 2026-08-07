import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useReactToPrint } from 'react-to-print'
import { supabase } from '../../lib/supabase'
import { SuratKeteranganKerjaTemplate, type SuratKeteranganKerjaData } from '../../components/templates/SuratKeteranganKerjaTemplate'
import { DocumentDownloadDropdown } from '../../components/ui/DocumentDownloadDropdown'
import { exportElementToPDF, exportElementToWord } from '../../lib/documentExport'
import { useAddRiwayatSurat } from '../../hooks/useRiwayatSurat'
import { Printer, FileText, UserCheck, Award } from 'lucide-react'
import { getTodayIndonesian } from '../../lib/dateUtils'
import { DatePickerInput } from '../../components/ui/DocumentFormControls'

export default function SuratKeteranganKerjaPage() {
  const printRef = useRef<HTMLDivElement>(null)
  const addRiwayatSurat = useAddRiwayatSurat()

  // Fetch employees list to easily select employee
  const { data: karyawanList = [], isLoading: isLoadingKaryawan } = useQuery({
    queryKey: ['karyawan-select-kerja'],
    queryFn: async () => {
      const { data } = await supabase.from('karyawan').select('*').order('nama', { ascending: true })
      return (data ?? []).map(k => ({
        ...k,
        nama: k.nama ? String(k.nama).toUpperCase() : ''
      }))
    }
  })

  // State for Surat Data
  const [formData, setFormData] = useState<SuratKeteranganKerjaData>({
    kotaSurat: 'Pontianak',
    tanggalSurat: getTodayIndonesian(),
    nomorSurat: 'PNK / 12 / 145 / H-R',
    halSurat: 'Keterangan Bekerja',
    lampiran: '---',
    pejabat: {
      nama: 'RINNA ELVIANTY',
      npp: 'P054321',
      jabatan: 'Pj. Branch Manager',
      unitOrgLine1: 'PT. Bank Negara Indonesia (Persero) Tbk.',
      unitOrgLine2: 'Pontianak Branch Office'
    },
    pegawai: {
      nama: 'TIARA TESALONIKA PASARIBU',
      npp: 'K070341',
      ttl: 'Pontianak, 15 Mei 1995',
      posisi: 'PROGRAM RELATIONSHIP MANAGER',
      unitOrgLine1: 'PT. Bank Negara Indonesia (Persero) Tbk',
      unitOrgLine2: 'Pontianak Branch Office'
    },
    keterangan: {
      tanggalMulai: '01 Januari 2020',
      tanggalSelesai: getTodayIndonesian(),
      posisiTerakhir: 'PROGRAM RELATIONSHIP MANAGER'
    },
    penandatangan: {
      nama: 'Rinna Elvianty',
      jabatan: 'Pj. Branch Manager',
      unitHeader1: 'PT. Bank Negara Indonesia (Persero) Tbk.',
      unitHeader2: 'Pontianak Branch Office, Area III, Kalimantan Barat'
    }
  })

  const [selectedKaryawanId, setSelectedKaryawanId] = useState<string>('')
  const [selectedPenandatanganType, setSelectedPenandatanganType] = useState<string>('rinna')

  // Auto-fill form when employee selected
  const handleSelectKaryawan = (id: string) => {
    setSelectedKaryawanId(id)
    if (!id) return

    const emp = karyawanList.find(k => k.id === id)
    if (emp) {
      // Build TTL string
      const ttlStr = emp.tanggal_lahir
        ? `Pontianak, ${new Date(emp.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
        : 'Pontianak, -'

      setFormData(prev => ({
        ...prev,
        pegawai: {
          ...prev.pegawai,
          nama: (emp.nama || '').toUpperCase(),
          npp: emp.npp || '',
          ttl: ttlStr,
          posisi: (emp.jabatan || 'STAFF').toUpperCase()
        },
        keterangan: {
          ...prev.keterangan,
          posisiTerakhir: (emp.jabatan || 'STAFF').toUpperCase()
        }
      }))
    }
  }

  // Handle Penandatangan Preset Selection
  const handlePenandatanganChange = (type: string) => {
    setSelectedPenandatanganType(type)
    if (type === 'kosong') {
      setFormData(prev => ({
        ...prev,
        penandatangan: {
          nama: '',
          jabatan: '',
          unitHeader1: 'PT. Bank Negara Indonesia (Persero) Tbk.',
          unitHeader2: 'Pontianak Branch Office, Area III, Kalimantan Barat'
        }
      }))
    } else if (type === 'rinna') {
      setFormData(prev => ({
        ...prev,
        penandatangan: {
          nama: 'Rinna Elvianty',
          jabatan: 'Pj. Branch Manager',
          unitHeader1: 'PT. Bank Negara Indonesia (Persero) Tbk.',
          unitHeader2: 'Pontianak Branch Office, Area III, Kalimantan Barat'
        }
      }))
    } else if (type === 'novachristo') {
      setFormData(prev => ({
        ...prev,
        penandatangan: {
          nama: 'NOVACHRISTO JOSEPH SILANGEN',
          jabatan: 'AREA HEAD',
          unitHeader1: 'PT. Bank Negara Indonesia (Persero) Tbk.',
          unitHeader2: 'Regional Office 09, Area III, Kalimantan Barat'
        }
      }))
    }
  }

  // Helper to record history log
  const recordHistory = async () => {
    try {
      await addRiwayatSurat.mutateAsync({
        nomor_surat: formData.nomorSurat,
        jenis_surat: 'Surat Keterangan Kerja' as any,
        nama_pegawai: formData.pegawai.nama,
        npp_pegawai: formData.pegawai.npp,
        tanggal_surat: formData.tanggalSurat,
        payload: formData as unknown as Record<string, unknown>
      })
    } catch (e) {
      console.error('Failed to log history', e)
    }
  }

  // Print Action
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Surat_Keterangan_Kerja_${formData.pegawai.npp}`,
    onAfterPrint: () => {
      recordHistory()
    }
  })

  // PDF Export Action
  const handleDownloadPDF = async () => {
    if (printRef.current) {
      await exportElementToPDF(
        printRef.current,
        `Surat_Keterangan_Kerja_${formData.pegawai.npp}_${formData.nomorSurat.replace(/[\/\\]/g, '_')}`
      )
      recordHistory()
    }
  }

  // Word Export Action
  const handleDownloadWord = async () => {
    if (printRef.current) {
      await exportElementToWord(
        printRef.current,
        `Surat_Keterangan_Kerja_${formData.pegawai.npp}_${formData.nomorSurat.replace(/[\/\\]/g, '_')}`
      )
      recordHistory()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1E293B]">Surat Keterangan Kerja</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Buat dan cetak Surat Keterangan Kerja (Pengunduran Diri / Pengalaman Kerja)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl text-xs font-semibold hover:from-teal-700 hover:to-teal-800 shadow-md transition-all active:scale-95"
          >
            <Printer size={15} />
            <span>Cetak Surat</span>
          </button>

          <DocumentDownloadDropdown
            onDownloadPDF={handleDownloadPDF}
            onDownloadWord={handleDownloadWord}
          />
        </div>
      </div>

      {/* Main Grid: Form Inputs (Left) & Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Controls Column (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
          {/* Quick Select Employee */}
          <div className="space-y-1.5 pb-3 border-b border-gray-100">
            <label className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
              <UserCheck size={14} />
              Pilih Pegawai (Master Data)
            </label>
            <select
              value={selectedKaryawanId}
              onChange={e => handleSelectKaryawan(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-teal-200 rounded-xl focus:outline-none focus:border-teal-500 bg-teal-50/30 text-teal-950 font-medium"
            >
              <option value="">-- Pilih dari Master Karyawan --</option>
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

          {/* Section 1: Header Surat */}
          <div className="space-y-3">
            <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide border-l-2 border-teal-600 pl-2">
              1. Header & Nomor Surat
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Kota Surat</label>
                <input
                  type="text"
                  value={formData.kotaSurat}
                  onChange={e => setFormData({ ...formData, kotaSurat: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>
              <DatePickerInput
                label="Tanggal Surat"
                value={formData.tanggalSurat}
                onChange={val => setFormData({ ...formData, tanggalSurat: val })}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#64748B]">Nomor Surat</label>
              <input
                type="text"
                value={formData.nomorSurat}
                onChange={e => setFormData({ ...formData, nomorSurat: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Hal</label>
                <input
                  type="text"
                  value={formData.halSurat}
                  onChange={e => setFormData({ ...formData, halSurat: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Lampiran</label>
                <input
                  type="text"
                  value={formData.lampiran}
                  onChange={e => setFormData({ ...formData, lampiran: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Data Pejabat Yang Bertanda Tangan */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide border-l-2 border-teal-600 pl-2">
              2. Data Pejabat Pemberi Keterangan
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Nama Pejabat</label>
                <input
                  type="text"
                  value={formData.pejabat.nama}
                  onChange={e => setFormData({ ...formData, pejabat: { ...formData.pejabat, nama: e.target.value } })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">NPP Pejabat</label>
                  <input
                    type="text"
                    value={formData.pejabat.npp}
                    onChange={e => setFormData({ ...formData, pejabat: { ...formData.pejabat, npp: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Jabatan Pejabat</label>
                  <input
                    type="text"
                    value={formData.pejabat.jabatan}
                    onChange={e => setFormData({ ...formData, pejabat: { ...formData.pejabat, jabatan: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Data Pegawai Yang Diterangkan */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide border-l-2 border-teal-600 pl-2">
              3. Data Pegawai Yang Diterangkan
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Nama Pegawai</label>
                <input
                  type="text"
                  value={formData.pegawai.nama}
                  onChange={e => setFormData({ ...formData, pegawai: { ...formData.pegawai, nama: e.target.value } })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">NPP</label>
                  <input
                    type="text"
                    value={formData.pegawai.npp}
                    onChange={e => setFormData({ ...formData, pegawai: { ...formData.pegawai, npp: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Tempat/Tanggal Lahir</label>
                  <input
                    type="text"
                    value={formData.pegawai.ttl}
                    onChange={e => setFormData({ ...formData, pegawai: { ...formData.pegawai, ttl: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Posisi / Jabatan</label>
                <input
                  type="text"
                  value={formData.pegawai.posisi}
                  onChange={e => setFormData({ ...formData, pegawai: { ...formData.pegawai, posisi: e.target.value } })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Detail Masa Kerja */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide border-l-2 border-teal-600 pl-2">
              4. Detail Masa Kerja & Posisi Terakhir
            </p>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <DatePickerInput
                  label="Tanggal Mulai Kerja"
                  value={formData.keterangan.tanggalMulai}
                  onChange={val => setFormData({ ...formData, keterangan: { ...formData.keterangan, tanggalMulai: val } })}
                />
                <DatePickerInput
                  label="Tanggal Selesai Kerja"
                  value={formData.keterangan.tanggalSelesai}
                  onChange={val => setFormData({ ...formData, keterangan: { ...formData.keterangan, tanggalSelesai: val } })}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Posisi Terakhir</label>
                <input
                  type="text"
                  value={formData.keterangan.posisiTerakhir}
                  onChange={e => setFormData({ ...formData, keterangan: { ...formData.keterangan, posisiTerakhir: e.target.value } })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Pejabat Penandatangan */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide border-l-2 border-teal-600 pl-2">
              5. Pejabat Penandatangan Surat
            </p>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-[#64748B]">Pilih Pejabat Penandatangan</label>
              <select
                value={selectedPenandatanganType}
                onChange={e => handlePenandatanganChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
              >
                <option value="rinna">1. Rinna Elvianty (Pj. Branch Manager)</option>
                <option value="novachristo">2. NOVACHRISTO JOSEPH SILANGEN (AREA HEAD)</option>
                <option value="kosong">3. -- Kosong (Tanpa Nama & Jabatan) --</option>
              </select>

              {selectedPenandatanganType !== 'kosong' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B]">Nama Penandatangan</label>
                    <input
                      type="text"
                      value={formData.penandatangan?.nama || ''}
                      onChange={e => setFormData({ ...formData, penandatangan: { ...formData.penandatangan!, nama: e.target.value } })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B]">Jabatan Penandatangan</label>
                    <input
                      type="text"
                      value={formData.penandatangan?.jabatan || ''}
                      onChange={e => setFormData({ ...formData, penandatangan: { ...formData.penandatangan!, jabatan: e.target.value } })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Document Preview Column (7 Cols) */}
        <div className="lg:col-span-7 bg-[#64748B]/10 p-4 rounded-2xl border border-gray-200 flex flex-col items-center overflow-x-auto min-h-[700px]">
          <p className="text-xs font-semibold text-[#64748B] mb-3 flex items-center gap-1.5 self-start">
            <Award size={14} className="text-teal-600" />
            Live Preview A4 Document (Siap Cetak)
          </p>

          <div className="transform scale-[0.85] origin-top shadow-2xl rounded-sm">
            <SuratKeteranganKerjaTemplate ref={printRef} data={formData} />
          </div>
        </div>
      </div>
    </div>
  )
}
