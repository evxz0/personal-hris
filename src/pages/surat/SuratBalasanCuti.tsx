import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useReactToPrint } from 'react-to-print'
import { supabase } from '../../lib/supabase'
import { SuratBalasanCutiTemplate, type SuratBalasanCutiData } from '../../components/templates/SuratBalasanCutiTemplate'
import { DocumentDownloadDropdown } from '../../components/ui/DocumentDownloadDropdown'
import { exportElementToPDF, exportElementToWord } from '../../lib/documentExport'
import { useAddRiwayatSurat } from '../../hooks/useRiwayatSurat'
import { useReferensi } from '../../hooks/useReferensi'
import { Printer, FileText, UserCheck, Calendar, Award } from 'lucide-react'

// Helper function to convert numbers to Indonesian words (Terbilang)
function terbilang(n: number | string): string {
  const num = typeof n === 'string' ? parseInt(n, 10) : n;
  if (isNaN(num) || num < 0) return '';
  if (num === 0) return 'nol';
  
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  
  if (num < 12) return satuan[num];
  if (num < 20) return terbilang(num - 10) + ' belas';
  if (num < 100) return terbilang(Math.floor(num / 10)) + ' puluh' + (num % 10 !== 0 ? ' ' + terbilang(num % 10) : '');
  if (num < 200) return 'seratus' + (num % 100 !== 0 ? ' ' + terbilang(num % 100) : '');
  if (num < 1000) return terbilang(Math.floor(num / 100)) + ' ratus' + (num % 100 !== 0 ? ' ' + terbilang(num % 100) : '');
  
  return String(num);
}

export default function SuratBalasanCutiPage() {
  const printRef = useRef<HTMLDivElement>(null)
  const addRiwayatSurat = useAddRiwayatSurat()

  // Fetch Master Outlet referensi
  const { data: outlets = [] } = useReferensi('OUTLET')

  // Fetch employees list to easily select employee
  const { data: karyawanList = [], isLoading: isLoadingKaryawan } = useQuery({
    queryKey: ['karyawan-select-cuti'],
    queryFn: async () => {
      const { data } = await supabase.from('karyawan').select('*').order('nama', { ascending: true })
      return (data ?? []).map(k => ({
        ...k,
        nama: k.nama ? String(k.nama).toUpperCase() : ''
      }))
    }
  })

  // State for Surat Balasan Cuti Data
  const [formData, setFormData] = useState<SuratBalasanCutiData>({
    tanggalSurat: '28 Juli 2026',
    nomorSurat: 'W09/10.3/014/2026',
    pegawai: {
      nama: 'Feri Wahyudi',
      npp: 'P036191',
      unitAsal: 'Pontianak Branch Office',
      kotaUnit: 'PONTIANAK'
    },
    tahunCuti: '2026',
    tanggalPermohonan: '16 Juli 2026',
    cuti: {
      jumlahHari: '5',
      jumlahHariTerbilang: 'lima',
      tanggalMulai: '03 Agustus 2026',
      tanggalSelesai: '07 Agustus 2026',
      tanggalAktif: '10 Agustus 2026',
      sisaCuti: '5',
      sisaCutiTerbilang: 'lima',
      statusOpct: 'dapat'
    },
    penandatangan: {
      nama: 'Ucok P. Sianipar',
      jabatan: 'ABS Team Leader'
    }
  })

  const [selectedNpp, setSelectedNpp] = useState<string>('')
  const [downloading, setDownloading] = useState(false)

  const logHistory = () => {
    addRiwayatSurat.mutate({
      nomor_surat: formData.nomorSurat,
      jenis_surat: 'Surat Balasan Cuti',
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
      setFormData(prev => ({
        ...prev,
        pegawai: {
          nama: (emp.nama || '').toUpperCase(),
          npp: emp.npp || '',
          unitAsal: (emp.outlet || emp.departemen || 'Pontianak Branch Office').toUpperCase(),
          kotaUnit: (emp.outlet || 'PONTIANAK').toUpperCase()
        }
      }))
    }
  }

  // Handle print
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Surat_Balasan_Cuti_${formData.pegawai.npp || 'Surat'}`
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
      await exportElementToPDF(printRef.current, `Surat_Balasan_Cuti_${formData.pegawai.npp || 'Surat'}`)
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
      exportElementToWord(printRef.current, `Surat_Balasan_Cuti_${formData.pegawai.npp || 'Surat'}`)
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
          <h1 className="text-2xl font-extrabold text-[#2B3440]">Untuk Balasan Cuti</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Buat dan cetak Surat Balasan Pelaksanaan Cuti Tahunan BNI Regional Office 09.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Form Editor, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Editor (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-base font-bold text-[#2B3440] border-b border-gray-100 pb-3 flex items-center gap-2">
            <Calendar size={18} className="text-teal-600" /> Form Balasan Cuti Tahunan
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

          {/* Section 1: Metadata Surat */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide border-l-2 border-teal-600 pl-2">
              1. Metadata Surat
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Tanggal Surat</label>
                <input
                  type="text"
                  value={formData.tanggalSurat}
                  onChange={e => setFormData({ ...formData, tanggalSurat: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Nomor Surat</label>
                <input
                  type="text"
                  value={formData.nomorSurat}
                  onChange={e => setFormData({ ...formData, nomorSurat: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Tahun Cuti</label>
                <input
                  type="text"
                  value={formData.tahunCuti}
                  onChange={e => setFormData({ ...formData, tahunCuti: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Tanggal Permohonan</label>
                <input
                  type="text"
                  value={formData.tanggalPermohonan}
                  onChange={e => setFormData({ ...formData, tanggalPermohonan: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Data Pegawai Pemohon */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide border-l-2 border-teal-600 pl-2">
              2. Data Pegawai Pemohon
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
                  <label className="text-[11px] font-semibold text-[#64748B]">Kota Unit</label>
                  <input
                    type="text"
                    value={formData.pegawai.kotaUnit}
                    onChange={e => setFormData({ ...formData, pegawai: { ...formData.pegawai, kotaUnit: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Unit / Kantor Asal</label>
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

          {/* Section 3: Detail Pelaksanaan & Sisa Cuti */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide border-l-2 border-teal-600 pl-2">
              3. Detail Pelaksanaan & Sisa Cuti
            </p>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Lama Cuti (Angka)</label>
                  <input
                    type="text"
                    placeholder="misal: 5"
                    value={formData.cuti.jumlahHari}
                    onChange={e => {
                      const val = e.target.value
                      const autoTerbilang = terbilang(val)
                      setFormData({
                        ...formData,
                        cuti: {
                          ...formData.cuti,
                          jumlahHari: val,
                          jumlahHariTerbilang: autoTerbilang || formData.cuti.jumlahHariTerbilang
                        }
                      })
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Terbilang Hari</label>
                  <input
                    type="text"
                    placeholder="misal: lima"
                    value={formData.cuti.jumlahHariTerbilang}
                    onChange={e => setFormData({ ...formData, cuti: { ...formData.cuti, jumlahHariTerbilang: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Tanggal Mulai Cuti</label>
                  <input
                    type="text"
                    value={formData.cuti.tanggalMulai}
                    onChange={e => setFormData({ ...formData, cuti: { ...formData.cuti, tanggalMulai: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Tanggal Selesai Cuti</label>
                  <input
                    type="text"
                    value={formData.cuti.tanggalSelesai}
                    onChange={e => setFormData({ ...formData, cuti: { ...formData.cuti, tanggalSelesai: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Tanggal Aktif Bekerja</label>
                  <input
                    type="text"
                    value={formData.cuti.tanggalAktif}
                    onChange={e => setFormData({ ...formData, cuti: { ...formData.cuti, tanggalAktif: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Status Pencairan OPCT</label>
                  <select
                    value={formData.cuti.statusOpct}
                    onChange={e => setFormData({ ...formData, cuti: { ...formData.cuti, statusOpct: e.target.value } })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
                  >
                    <option value="dapat">dapat</option>
                    <option value="tidak dapat">tidak dapat</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Sisa Cuti (Angka)</label>
                  <input
                    type="text"
                    placeholder="misal: 5"
                    value={formData.cuti.sisaCuti}
                    onChange={e => {
                      const val = e.target.value
                      const autoTerbilang = terbilang(val)
                      setFormData({
                        ...formData,
                        cuti: {
                          ...formData.cuti,
                          sisaCuti: val,
                          sisaCutiTerbilang: autoTerbilang || formData.cuti.sisaCutiTerbilang
                        }
                      })
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Sisa Cuti (Terbilang)</label>
                  <input
                    type="text"
                    placeholder="misal: lima"
                    value={formData.cuti.sisaCutiTerbilang}
                    onChange={e => setFormData({ ...formData, cuti: { ...formData.cuti, sisaCutiTerbilang: e.target.value } })}
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
                value={formData.penandatangan?.nama ? (formData.penandatangan.nama.includes('NOVACHRISTO') ? 'NOVACHRISTO' : 'UCOK') : 'KOSONG'}
                onChange={e => {
                  const val = e.target.value
                  if (val === 'NOVACHRISTO') {
                    setFormData({
                      ...formData,
                      penandatangan: { nama: 'NOVACHRISTO JOSEPH SILANGEN', jabatan: 'AREA HEAD' }
                    })
                  } else if (val === 'UCOK') {
                    setFormData({
                      ...formData,
                      penandatangan: { nama: 'Ucok P. Sianipar', jabatan: 'Area Business Support Team Leader' }
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
                <option value="UCOK">1. Ucok P. Sianipar (Area Business Support Team Leader)</option>
                <option value="NOVACHRISTO">2. NOVACHRISTO JOSEPH SILANGEN (AREA HEAD)</option>
                <option value="KOSONG">3. -- Kosong (Tanpa Nama & Jabatan) --</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-[#64748B] flex items-center gap-1.5">
              <FileText size={14} className="text-teal-600" /> Pratinjau Dokumen Surat Balasan Cuti (A4)
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
              <SuratBalasanCutiTemplate ref={printRef} data={formData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
