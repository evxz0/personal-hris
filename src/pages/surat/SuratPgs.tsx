import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useReactToPrint } from 'react-to-print'
import { supabase } from '../../lib/supabase'
import { SkPgsTemplate, type SkPgsData } from '../../components/templates/SkPgsTemplate'
import { DocumentDownloadDropdown } from '../../components/ui/DocumentDownloadDropdown'
import { exportElementToPDF, exportElementToWord } from '../../lib/documentExport'
import { Printer, FileText, UserCheck, Briefcase, Award } from 'lucide-react'

import { useAddRiwayatSurat } from '../../hooks/useRiwayatSurat'
import { useReferensi } from '../../hooks/useReferensi'

export default function SuratPgsPage() {
  const printRef = useRef<HTMLDivElement>(null)
  const addRiwayatSurat = useAddRiwayatSurat()

  // Fetch Master Outlet referensi
  const { data: outlets = [] } = useReferensi('OUTLET')

  // Fetch employees list to easily select employee
  const { data: karyawanList = [], isLoading: isLoadingKaryawan } = useQuery({
    queryKey: ['karyawan-select'],
    queryFn: async () => {
      const { data } = await supabase.from('karyawan').select('*').order('nama', { ascending: true })
      return data ?? []
    }
  })

  // State for Surat Data
  const [formData, setFormData] = useState<SkPgsData>({
    nomorSurat: 'KP/015/7.3/H-R',
    tanggalSurat: '27 Juli 2026',
    pegawai: {
      nama: 'TIARA TESALONIKA PASARIBU',
      npp: 'K070341',
      jabatanAsal: 'PROGRAM RELATIONSHIP MANAGER',
      jenjangAsal: '',
      gradeAsal: 'NON GRADE',
      unitAsal: 'PONTIANAK BRANCH OFFICE'
    },
    penugasan: {
      jabatanPgs: 'PGS PROGRAM RELATIONSHIP MANAGER',
      jenjangPgs: 'ASST',
      gradePgs: 'NON GRADE',
      unitPgs: 'SUNGAI PINYUH BRANCH OFFICE',
      unitDiktum: 'PONTIANAK BRANCH OFFICE',
      lokasiPgs: 'SUNGAI PINYUH BRANCH OFFICE',
      tanggalMulai: '27 Juli 2026',
      tanggalSelesai: '31 Juli 2026'
    },
    penandatangan: {
      nama: 'NOVACHRISTO JOSEPH SILANGEN',
      jabatan: 'AREA HEAD'
    }
  })

  const [selectedNpp, setSelectedNpp] = useState<string>('')
  const [downloading, setDownloading] = useState(false)

  const logHistory = () => {
    addRiwayatSurat.mutate({
      nomor_surat: formData.nomorSurat,
      jenis_surat: 'SK PGS',
      nama_pegawai: formData.pegawai.nama,
      npp_pegawai: formData.pegawai.npp,
      tanggal_surat: formData.tanggalSurat,
      payload: formData as any
    })
  }

  // Handle employee selection from dropdown
  const handleSelectEmployee = (npp: string) => {
    setSelectedNpp(npp)
    const emp = karyawanList.find(k => k.npp === npp)
    if (emp) {
      const rawGrade = emp.grade !== null && emp.grade !== undefined ? String(emp.grade).trim() : ''
      const gradeStr = rawGrade ? (rawGrade.toUpperCase().includes('GRADE') ? rawGrade : `GRADE ${rawGrade}`) : 'NON GRADE'
      const unitVal = emp.outlet || (emp as any).departemen || 'REGIONAL OFFICE 09'
      setFormData(prev => ({
        ...prev,
        pegawai: {
          nama: emp.nama || '',
          npp: emp.npp || '',
          jabatanAsal: emp.jabatan || 'STAFF',
          jenjangAsal: emp.jenjang || '',
          gradeAsal: gradeStr,
          unitAsal: unitVal
        },
        penugasan: {
          ...prev.penugasan,
          unitDiktum: unitVal
        }
      }))
    }
  }

  // Handle print
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `SK_PGS_${formData.pegawai.npp || 'Surat'}`
  })

  const triggerPrint = () => {
    logHistory()
    handlePrint()
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    try {
      setDownloading(true)
      logHistory()
      await exportElementToPDF(printRef.current, `SK_PGS_${formData.pegawai.npp || 'Surat'}`)
    } catch (e) {
      console.error(e)
      alert('Gagal mengunduh dokumen PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadWord = async () => {
    if (!printRef.current) return
    try {
      logHistory()
      exportElementToWord(printRef.current, `SK_PGS_${formData.pegawai.npp || 'Surat'}`)
    } catch (e) {
      console.error(e)
      alert('Gagal mengunduh dokumen Word')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider mb-1">
            <FileText size={16} /> Surat Keterangan
          </div>
          <h1 className="text-2xl font-extrabold text-[#2B3440]">Untuk Pengganti Sementara (PGS)</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Buat dan cetak Surat Keputusan Penugasan Pengganti Sementara (PGS) BNI Regional Office 09.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Form Editor, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Editor (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-base font-bold text-[#2B3440] border-b border-gray-100 pb-3 flex items-center gap-2">
            <Briefcase size={18} className="text-teal-600" /> Form Data SK PGS
          </h2>

          {/* Employee Auto-select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B3440] flex items-center gap-1.5">
              <UserCheck size={14} className="text-teal-600" /> Pilih dari Master Karyawan
            </label>
            <select
              value={selectedNpp}
              onChange={e => handleSelectEmployee(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
            >
              <option value="">-- Manual / Pilih Karyawan --</option>
              {isLoadingKaryawan ? (
                <option disabled>Memuat karyawan...</option>
              ) : (
                karyawanList.map(k => (
                  <option key={k.id || k.npp} value={k.npp}>
                    {k.nama} ({k.npp}) - {k.jabatan || 'Pegawai'}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Section 1: Header Metadata */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide border-l-2 border-teal-600 pl-2">
              1. Metadata Surat
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Nomor Surat</label>
                <input
                  type="text"
                  value={formData.nomorSurat}
                  onChange={e => setFormData({ ...formData, nomorSurat: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Tanggal Surat</label>
                <input
                  type="text"
                  value={formData.tanggalSurat}
                  onChange={e => setFormData({ ...formData, tanggalSurat: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 mt-1"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Data Pegawai */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide border-l-2 border-teal-600 pl-2">
              2. Data Pegawai Yang Ditunjuk
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.pegawai.nama}
                  onChange={e => setFormData({ ...formData, pegawai: { ...formData.pegawai, nama: e.target.value } })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
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
                  <label className="text-[11px] font-semibold text-[#64748B]">Jabatan Asal</label>
                  <input
                    type="text"
                    value={formData.pegawai.jabatanAsal}
                    onChange={e => setFormData({ ...formData, pegawai: { ...formData.pegawai, jabatanAsal: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Jenjang Asal (Optional)</label>
                  <input
                    type="text"
                    placeholder="misal: ASST"
                    value={formData.pegawai.jenjangAsal || ''}
                    onChange={e => setFormData({ ...formData, pegawai: { ...formData.pegawai, jenjangAsal: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Grade Asal</label>
                  <input
                    type="text"
                    placeholder="misal: GRADE 6"
                    value={formData.pegawai.gradeAsal}
                    onChange={e => setFormData({ ...formData, pegawai: { ...formData.pegawai, gradeAsal: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Unit Pegawai (Tampil di bagian 'Menunjuk')</label>
                <select
                  value={formData.pegawai.unitAsal ?? ''}
                  onChange={e => setFormData({ ...formData, pegawai: { ...formData.pegawai, unitAsal: e.target.value } })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="">-- Kosong (Tanpa Unit) --</option>
                  {formData.pegawai.unitAsal && !outlets.some(o => o.nama_referensi === formData.pegawai.unitAsal) && (
                    <option value={formData.pegawai.unitAsal}>{formData.pegawai.unitAsal}</option>
                  )}
                  {outlets.map(o => (
                    <option key={o.id} value={o.nama_referensi}>
                      {o.nama_referensi}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Data Penugasan PGS */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide border-l-2 border-teal-600 pl-2">
              3. Data Penugasan PGS
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Jabatan PGS</label>
                <input
                  type="text"
                  value={formData.penugasan.jabatanPgs}
                  onChange={e => setFormData({ ...formData, penugasan: { ...formData.penugasan, jabatanPgs: e.target.value } })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Jenjang PGS</label>
                  <input
                    type="text"
                    value={formData.penugasan.jenjangPgs}
                    onChange={e => setFormData({ ...formData, penugasan: { ...formData.penugasan, jenjangPgs: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Grade PGS</label>
                  <input
                    type="text"
                    value={formData.penugasan.gradePgs}
                    onChange={e => setFormData({ ...formData, penugasan: { ...formData.penugasan, gradePgs: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Unit PGS (Untuk 'Sebagai')</label>
                <select
                  value={formData.penugasan.unitPgs ?? formData.penugasan.lokasiPgs ?? ''}
                  onChange={e => setFormData({ ...formData, penugasan: { ...formData.penugasan, unitPgs: e.target.value } })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="">-- Kosong (Tanpa Unit) --</option>
                  {formData.penugasan.unitPgs && !outlets.some(o => o.nama_referensi === formData.penugasan.unitPgs) && (
                    <option value={formData.penugasan.unitPgs}>{formData.penugasan.unitPgs}</option>
                  )}
                  {outlets.map(o => (
                    <option key={o.id} value={o.nama_referensi}>
                      {o.nama_referensi}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Unit (Untuk Diktum 'Unit')</label>
                  <select
                    value={formData.penugasan.unitDiktum ?? formData.pegawai.unitAsal ?? ''}
                    onChange={e => setFormData({ ...formData, penugasan: { ...formData.penugasan, unitDiktum: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
                  >
                    <option value="">-- Kosong (Tanpa Unit) --</option>
                    {formData.penugasan.unitDiktum && !outlets.some(o => o.nama_referensi === formData.penugasan.unitDiktum) && (
                      <option value={formData.penugasan.unitDiktum}>{formData.penugasan.unitDiktum}</option>
                    )}
                    {outlets.map(o => (
                      <option key={o.id} value={o.nama_referensi}>
                        {o.nama_referensi}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Lokasi PGS (Untuk 'Lokasi')</label>
                  <select
                    value={formData.penugasan.lokasiPgs ?? ''}
                    onChange={e => setFormData({ ...formData, penugasan: { ...formData.penugasan, lokasiPgs: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
                  >
                    <option value="">-- Kosong (Tanpa Lokasi) --</option>
                    {formData.penugasan.lokasiPgs && !outlets.some(o => o.nama_referensi === formData.penugasan.lokasiPgs) && (
                      <option value={formData.penugasan.lokasiPgs}>{formData.penugasan.lokasiPgs}</option>
                    )}
                    {outlets.map(o => (
                      <option key={o.id} value={o.nama_referensi}>
                        {o.nama_referensi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Tanggal Mulai</label>
                  <input
                    type="text"
                    value={formData.penugasan.tanggalMulai}
                    onChange={e => setFormData({ ...formData, penugasan: { ...formData.penugasan, tanggalMulai: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Tanggal Selesai</label>
                  <input
                    type="text"
                    value={formData.penugasan.tanggalSelesai}
                    onChange={e => setFormData({ ...formData, penugasan: { ...formData.penugasan, tanggalSelesai: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Pejabat Penandatangan */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide border-l-2 border-teal-600 pl-2 flex items-center gap-1.5">
              <Award size={14} className="text-teal-600" /> 4. Pejabat Penandatangan
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#64748B]">Pilih Pejabat Penandatangan</label>
              <select
                value={formData.penandatangan?.nama ? (formData.penandatangan.nama.includes('UCOK') ? 'UCOK' : 'NOVACHRISTO') : 'KOSONG'}
                onChange={e => {
                  const val = e.target.value
                  if (val === 'UCOK') {
                    setFormData({
                      ...formData,
                      penandatangan: { nama: 'UCOK PARLINDUNGAN SIANIPAR', jabatan: 'Area Business Support Team Leader' }
                    })
                  } else if (val === 'NOVACHRISTO') {
                    setFormData({
                      ...formData,
                      penandatangan: { nama: 'NOVACHRISTO JOSEPH SILANGEN', jabatan: 'AREA HEAD' }
                    })
                  } else {
                    setFormData({
                      ...formData,
                      penandatangan: { nama: '', jabatan: '' }
                    })
                  }
                }}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white font-medium"
              >
                <option value="NOVACHRISTO">1. NOVACHRISTO JOSEPH SILANGEN (AREA HEAD)</option>
                <option value="UCOK">2. UCOK PARLINDUNGAN SIANIPAR (Area Business Support Team Leader)</option>
                <option value="KOSONG">3. -- Kosong (Tanpa Nama & Jabatan) --</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-[#64748B] flex items-center gap-1.5">
              <FileText size={14} className="text-teal-600" /> Pratinjau Dokumen SK PGS (A4)
            </span>
            <div className="flex items-center gap-2">
              <DocumentDownloadDropdown
                onDownloadPDF={handleDownloadPDF}
                onDownloadWord={handleDownloadWord}
                loading={downloading}
              />
              <button
                type="button"
                onClick={() => triggerPrint()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors cursor-pointer"
              >
                <Printer size={13} /> Cetak
              </button>
            </div>
          </div>

          <div className="bg-gray-200/70 p-4 rounded-2xl overflow-x-auto shadow-inner flex justify-center">
            <div className="transform scale-[0.85] origin-top sm:scale-90 md:scale-95 transition-all">
              <SkPgsTemplate ref={printRef} data={formData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
