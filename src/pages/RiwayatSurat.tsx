import { useState, useRef } from 'react'
import { Search, Trash2, FileDown, FileText, FileCode, Eye, Printer, History } from 'lucide-react'
import { useRiwayatSurat, useDeleteRiwayatSurat, type RiwayatSurat } from '../hooks/useRiwayatSurat'
import { DataTable } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { formatDate } from '../lib/utils'
import { exportToXLSX, exportToPDF } from '../lib/importExport'
import { exportElementToWord } from '../lib/documentExport'
import { SkPgsTemplate, type SkPgsData } from '../components/templates/SkPgsTemplate'
import { SuratBalasanCutiTemplate, type SuratBalasanCutiData } from '../components/templates/SuratBalasanCutiTemplate'
import { SuratKeteranganKerjaTemplate, type SuratKeteranganKerjaData } from '../components/templates/SuratKeteranganKerjaTemplate'
import { useReactToPrint } from 'react-to-print'

export default function RiwayatSuratPage() {
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState<string>('ALL')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  // Preview Modal state
  const [previewItem, setPreviewItem] = useState<RiwayatSurat | null>(null)

  const modalPrintRef = useRef<HTMLDivElement>(null)

  const { data = [], isLoading } = useRiwayatSurat(search)
  const deleteMutation = useDeleteRiwayatSurat()

  const handlePrintModal = useReactToPrint({
    contentRef: modalPrintRef,
    documentTitle: previewItem ? `${previewItem.jenis_surat.replace(/\s+/g, '_')}_${previewItem.npp_pegawai}` : 'Surat'
  })

  // Apply filter
  const filtered = data.filter(item => {
    if (filterJenis !== 'ALL' && item.jenis_surat !== filterJenis) return false
    return true
  })

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const handleExportXLSX = () => {
    exportToXLSX(filtered.map(s => ({
      'Nomor Surat': s.nomor_surat,
      'Jenis Surat': s.jenis_surat,
      'Nama Pegawai': s.nama_pegawai,
      NPP: s.npp_pegawai,
      'Tanggal Surat': s.tanggal_surat,
      'Tanggal Dibuat/Dicetak': formatDate(s.created_at)
    })), 'Data_Riwayat_Surat')
  }

  const handleExportPDF = () => {
    exportToPDF(
      filtered.map(s => ({
        ...s,
        created_at: formatDate(s.created_at)
      })) as unknown as Record<string, unknown>[],
      [
        { header: 'Nomor Surat', dataKey: 'nomor_surat' },
        { header: 'Jenis Surat', dataKey: 'jenis_surat' },
        { header: 'Nama Pegawai', dataKey: 'nama_pegawai' },
        { header: 'NPP', dataKey: 'npp_pegawai' },
        { header: 'Tanggal Surat', dataKey: 'tanggal_surat' },
        { header: 'Waktu Cetak', dataKey: 'created_at' },
      ],
      'Laporan Riwayat Surat Keterangan',
      'Data_Riwayat_Surat'
    )
  }

  // Trigger Word download from history item payload
  const handleDownloadWordFromHistory = async (item: RiwayatSurat) => {
    // Render document in a hidden temporary container
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '-9999px'
    document.body.appendChild(container)

    try {
      if (item.jenis_surat === 'SK PGS') {
        const p = item.payload as unknown as SkPgsData
        const element = document.createElement('div')
        element.innerHTML = renderSkPgsHtml(p)
        await exportElementToWord(element, `SK_PGS_${item.npp_pegawai}_${item.nomor_surat.replace(/[\/\\]/g, '_')}`)
      } else if (item.jenis_surat === 'Surat Keterangan Kerja') {
        const p = item.payload as unknown as SuratKeteranganKerjaData
        const element = document.createElement('div')
        element.innerHTML = renderKeteranganKerjaHtml(p)
        await exportElementToWord(element, `Surat_Keterangan_Kerja_${item.npp_pegawai}_${item.nomor_surat.replace(/[\/\\]/g, '_')}`)
      } else {
        const p = item.payload as unknown as SuratBalasanCutiData
        const element = document.createElement('div')
        element.innerHTML = renderBalasanCutiHtml(p)
        await exportElementToWord(element, `Surat_Balasan_Cuti_${item.npp_pegawai}_${item.nomor_surat.replace(/[\/\\]/g, '_')}`)
      }
    } catch (e) {
      console.error(e)
      alert('Gagal mengunduh berkas Word')
    } finally {
      document.body.removeChild(container)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B3440] flex items-center gap-2">
            <History size={24} className="text-teal-600" /> Riwayat Surat Keterangan
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Daftar arsip pencetakan dan pembuatan surat keputusan/keterangan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" icon={<FileDown size={15} />} onClick={handleExportXLSX}>
            Excel
          </Button>
          <Button variant="outline" size="sm" icon={<FileText size={15} />} onClick={handleExportPDF}>
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Cari berdasarkan nomor surat, nama pegawai, NPP, atau jenis surat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all placeholder:text-[#64748B]"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterJenis}
            onChange={e => setFilterJenis(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">Semua Jenis Surat</option>
            <option value="SK PGS">SK PGS</option>
            <option value="Surat Balasan Cuti">Surat Balasan Cuti</option>
            <option value="Surat Keterangan Kerja">Surat Keterangan Kerja</option>
          </select>
          <div className="text-xs text-[#64748B] px-3 py-2 bg-white rounded-xl border border-gray-200 font-medium whitespace-nowrap">
            {filtered.length} riwayat
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        tableId="riwayat_surat"
        data={filtered as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="Belum ada riwayat pencetakan surat"
        emptyIcon={<History size={40} className="text-gray-200" />}
        columns={[
          { key: 'nomor_surat', header: 'Nomor Surat', render: r => <span className="font-bold text-teal-800">{String(r.nomor_surat)}</span> },
          { key: 'jenis_surat', header: 'Jenis Surat', render: r => {
            const isPgs = r.jenis_surat === 'SK PGS'
            const isKerja = r.jenis_surat === 'Surat Keterangan Kerja'
            return (
              <span className={`text-xs px-2.5 py-1 rounded-full font-extrabold ${
                isPgs ? 'bg-teal-100 text-teal-800' : isKerja ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {String(r.jenis_surat)}
              </span>
            )
          }},
          { key: 'nama_pegawai', header: 'Nama Pegawai', render: r => <span className="font-semibold">{String(r.nama_pegawai)}</span> },
          { key: 'npp_pegawai', header: 'NPP', render: r => <span>{String(r.npp_pegawai)}</span> },
          { key: 'tanggal_surat', header: 'Tanggal Surat', render: r => <span className="whitespace-nowrap">{String(r.tanggal_surat)}</span> },
          { key: 'created_at', header: 'Waktu Cetak', render: r => <span className="whitespace-nowrap text-xs text-[#64748B]">{formatDate(String(r.created_at))}</span> },
        ]}
        actions={row => {
          const item = row as unknown as RiwayatSurat
          return (
            <div className="flex items-center gap-1">
              <button
                title="Lihat Pratinjau / Cetak"
                onClick={() => setPreviewItem(item)}
                className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors"
              >
                <Eye size={15} />
              </button>
              <button
                title="Download Word (.doc)"
                onClick={() => handleDownloadWordFromHistory(item)}
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <FileCode size={15} />
              </button>
              <button
                title="Hapus Riwayat"
                onClick={() => setDeleteId(item.id)}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )
        }}
      />

      {/* Modal Preview Document */}
      <Modal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={`Pratinjau Dokumen: ${previewItem?.nomor_surat || ''}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPreviewItem(null)}>Tutup</Button>
            {previewItem && (
              <Button
                variant="outline"
                icon={<FileCode size={15} />}
                onClick={() => handleDownloadWordFromHistory(previewItem)}
              >
                Download Word (.doc)
              </Button>
            )}
            <Button variant="primary" icon={<Printer size={15} />} onClick={() => handlePrintModal()}>
              Cetak Dokumen
            </Button>
          </>
        }
      >
        {previewItem && (
          <div className="bg-gray-200/70 p-4 rounded-2xl overflow-x-auto flex justify-center max-h-[70vh] overflow-y-auto">
            <div className="transform scale-90 origin-top bg-white shadow-xl rounded-lg">
              {previewItem.jenis_surat === 'SK PGS' ? (
                <SkPgsTemplate ref={modalPrintRef} data={previewItem.payload as unknown as SkPgsData} />
              ) : previewItem.jenis_surat === 'Surat Keterangan Kerja' ? (
                <SuratKeteranganKerjaTemplate ref={modalPrintRef} data={previewItem.payload as unknown as SuratKeteranganKerjaData} />
              ) : (
                <SuratBalasanCutiTemplate ref={modalPrintRef} data={previewItem.payload as unknown as SuratBalasanCutiData} />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirm Delete */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Hapus Riwayat Surat"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#2B3440]">
          Apakah Anda yakin ingin menghapus data arsip riwayat surat ini dari sistem?
        </p>
      </Modal>
    </div>
  )
}

/** Helper to render SK PGS HTML string for Word export */
function renderSkPgsHtml(data: SkPgsData): string {
  const pgsTitle = (data.penugasan.jabatanPgs || '').replace(/^PGS\s+/i, '').trim()
  const gradeStr = data.penugasan.jenjangPgs && data.penugasan.gradePgs ? `(${data.penugasan.jenjangPgs} / ${data.penugasan.gradePgs})` : data.penugasan.gradePgs ? `(${data.penugasan.gradePgs})` : ''
  const unitText = data.penugasan.unitPgs || data.penugasan.lokasiPgs || ''
  const unitDiktumText = data.penugasan.unitDiktum || data.pegawai.unitAsal || ''

  return `
    <div style="font-family: Arial, sans-serif; font-size: 9.5pt; line-height: 1.35;">
      <div style="text-align: right; margin-bottom: 10px;">
        <img src="/logo-kop-bni.jpg" style="height: 1.25cm; width: 4.09cm; object-fit: contain;" />
      </div>
      <table style="width: 58%; margin-bottom: 12px;">
        <tr><td style="width: 85px;">Putusan</td><td>: REGIONAL OFFICE 09</td></tr>
        <tr><td>Nomor</td><td>: ${data.nomorSurat || ''}</td></tr>
        <tr><td>Tanggal</td><td>: ${data.tanggalSurat || ''}</td></tr>
        <tr><td>Hal</td><td>: Pengganti Sementara</td></tr>
      </table>
      <div style="text-align: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 11pt;"><b>SURAT KEPUTUSAN</b></h3>
        <h4 style="margin: 0; font-size: 10pt;"><b>REGIONAL OFFICE 09</b></h4>
        <h4 style="margin: 0; font-size: 10pt;"><b>PT. BANK NEGARA INDONESIA (PERSERO) Tbk</b></h4>
      </div>
      <div style="text-align: center; font-weight: bold; margin: 8px 0;">MEMUTUSKAN</div>
      <table style="width: 100%; margin-bottom: 8px;">
        <tr><td style="width: 110px;">Menetapkan</td><td style="width: 15px;">:</td><td></td></tr>
        <tr><td>Pertama</td><td>:</td><td>
          <div>Menunjuk :</div>
          <div style="text-align: center; margin: 4px 0 6px 0;">
            <u><b>Sdr. ${data.pegawai.nama} – NPP.${data.pegawai.npp}</b></u><br/>
            <b>${data.pegawai.jabatanAsal}</b><br/>
            <b>${data.pegawai.unitAsal}</b>
          </div>
          <table>
            <tr><td style="width: 70px;">Sebagai</td><td style="width: 15px;">:</td><td>PGS <b>${pgsTitle} ${gradeStr} ${unitText}</b></td></tr>
            <tr><td>Unit</td><td>:</td><td><b>${unitDiktumText}</b></td></tr>
            <tr><td>Lokasi</td><td>:</td><td><b>${data.penugasan.lokasiPgs}</b></td></tr>
          </table>
        </td></tr>
        <tr><td>Kedua</td><td>:</td><td>Penunjukkan pengganti sementara pada diktum Pertama berlaku tanggal ${data.penugasan.tanggalMulai} – ${data.penugasan.tanggalSelesai}.</td></tr>
      </table>
      <div style="margin-top: 14px; text-align: left;">
        <p style="margin: 0; font-weight: bold;">PT Bank Negara Indonesia (Persero) Tbk</p>
        <p style="margin: 0; font-weight: bold;">Regional Office 09, Area III, Kalimantan Barat</p>
        <br/><br/><br/><br/>
        ${data.penandatangan?.nama ? `
          <p style="margin: 0; font-weight: bold;"><u><b>${data.penandatangan.nama}</b></u></p>
          <p style="margin: 0; font-weight: bold;"><b>${data.penandatangan.jabatan}</b></p>
        ` : ''}
      </div>
    </div>
  `
}

/** Helper to render Surat Balasan Cuti HTML string for Word export */
function renderBalasanCutiHtml(data: SuratBalasanCutiData): string {
  return `
    <div style="font-family: Arial, sans-serif; font-size: 9.5pt; line-height: 1.35;">
      <div style="text-align: right; margin-bottom: 15px;">
        <img src="/logo-kop-bni.jpg" style="height: 1.25cm; width: 4.09cm; object-fit: contain;" />
      </div>
      <div style="margin-bottom: 14px;">Pontianak, <b>${data.tanggalSurat}</b></div>
      <table style="width: 100%; margin-bottom: 14px;">
        <tr><td style="width: 50px;">No.</td><td style="width: 15px;">:</td><td><b>${data.nomorSurat}</b></td></tr>
        <tr><td>Lamp.</td><td>:</td><td>-</td></tr>
      </table>
      <div style="margin-bottom: 16px;">
        Kepada :<br/>
        <b>Sdr/i. ${data.pegawai.nama} – NPP. ${data.pegawai.npp}</b><br/>
        PT. Bank Negara Indonesia (Persero) Tbk<br/>
        ${data.pegawai.unitAsal}<br/>
        <b><u>${data.pegawai.kotaUnit}</u></b>
      </div>
      <div style="margin-bottom: 16px;">
        Hal : Pelaksanaan Cuti Tahunan Tahun ${data.tahunCuti}<br/>
        <b><u>Cfm. Surat Permohonan Pelaksanaan Cuti Sdr. Tanggal ${data.tanggalPermohonan}</u></b>
      </div>
      <p>Menunjuk perihal pada pokok surat, dengan ini kami sampaikan sebagai berikut :</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; line-height: 1.35;">
        <tr><td style="width: 22px; vertical-align: top; padding-bottom: 5px;">1.</td><td style="text-align: justify; vertical-align: top; padding-bottom: 5px;">Pelaksanaan cuti tahunan Saudara tahun ${data.tahunCuti} dapat dilaksanakan selama <b>${String(data.cuti.jumlahHari || '5').padStart(2, '0')} (${data.cuti.jumlahHariTerbilang})</b> hari kerja terhitung sejak tanggal <b>${data.cuti.tanggalMulai} s/d ${data.cuti.tanggalSelesai}</b> dan aktif kembali bekerja pada tanggal <b>${data.cuti.tanggalAktif}</b></td></tr>
        <tr><td style="width: 22px; vertical-align: top; padding-bottom: 5px;">2.</td><td style="text-align: justify; vertical-align: top; padding-bottom: 5px;">Dengan dilaksanakan cuti tersebut diatas, maka sisa cuti tahunan Saudara untuk tahun ${data.tahunCuti} adalah <b>${data.cuti.sisaCuti} (${data.cuti.sisaCutiTerbilang})</b> hari kerja.</td></tr>
        <tr><td style="width: 22px; vertical-align: top; padding-bottom: 5px;">3.</td><td style="text-align: justify; vertical-align: top; padding-bottom: 5px;">Ongkos Perjalanan Cuti Tahunan (OPCT) ${data.tahunCuti} Saudara <u><b>${data.cuti.statusOpct || 'dapat'}</b></u> dibayarkan. Pengajuan pencairan OPCT tahun ${data.tahunCuti} dapat saudara ajukan melalui aplikasi DigiHc.</td></tr>
        <tr><td style="width: 22px; vertical-align: top; padding-bottom: 5px;">4.</td><td style="text-align: justify; vertical-align: top; padding-bottom: 5px;">Sebelum pelaksanaan cuti tersebut, harap Saudara mengisi form rencana ketidakhadiran pada aplikasi DigiHc.</td></tr>
        <tr><td style="width: 22px; vertical-align: top; padding-bottom: 5px;">5.</td><td style="text-align: justify; vertical-align: top; padding-bottom: 5px;">Jika diperlukan Saudara bersedia kami panggil dan Sisa Cuti Saudara akan kami perhitungkan kembali.</td></tr>
        <tr><td style="width: 22px; vertical-align: top; padding-bottom: 5px;">6.</td><td style="text-align: justify; vertical-align: top; padding-bottom: 5px;">Untuk selanjutnya selamat melaksanakan Cuti, semoga dapat dimanfaatkan sebaik-baiknya dengan harapan sekembalinya dari Cuti, Saudara akan bekerja lebih baik lagi.</td></tr>
      </table>
      <div style="margin-top: 16px; margin-bottom: 24px;">Demikian kami sampaikan untuk dimaklumi.</div>
      <div style="margin-top: 14px; text-align: left;">
        <p style="margin: 0; font-weight: bold;">PT Bank Negara Indonesia (Persero) Tbk</p>
        <p style="margin: 0; font-weight: bold;">Regional Office 09, Area III, Kalimantan Barat</p>
        <br/><br/><br/><br/>
        ${data.penandatangan?.nama ? `
          <p style="margin: 0; font-weight: bold;"><u><b>${data.penandatangan.nama}</b></u></p>
          <p style="margin: 0; font-weight: bold;"><b>${data.penandatangan.jabatan}</b></p>
        ` : ''}
      </div>
    </div>
  `
}

/** Helper to render Surat Keterangan Kerja HTML string for Word export */
function renderKeteranganKerjaHtml(data: SuratKeteranganKerjaData): string {
  const kotaText = data.kotaSurat || 'Pontianak'
  const fullNomor = data.nomorSurat ? (data.nomorSurat.startsWith('PNK') ? data.nomorSurat : `PNK / 12 / ${data.nomorSurat}`) : 'PNK / 12 / '

  return `
    <div style="font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4;">
      <div style="text-align: right; margin-bottom: 15px;">
        <img src="/logo-kop-bni.jpg" style="height: 1.25cm; width: 4.09cm; object-fit: contain;" />
      </div>
      <div style="margin-bottom: 10px;">${kotaText}, ${data.tanggalSurat}</div>
      <table style="width: 60%; margin-bottom: 20px;">
        <tr><td style="width: 70px;">Nomor</td><td style="width: 15px;">:</td><td>${fullNomor}</td></tr>
        <tr><td>Hal</td><td>:</td><td>${data.halSurat || 'Keterangan Bekerja'}</td></tr>
        <tr><td>Lamp</td><td>:</td><td>${data.lampiran || '---'}</td></tr>
      </table>
      <div style="text-align: center; margin: 15px 0 20px 0;">
        <h3 style="margin: 0; font-size: 11pt; text-decoration: underline;"><b>SURAT KETERANGAN</b></h3>
      </div>
      <p style="margin: 0 0 10px 0;">Yang bertanda tangan dibawah ini :</p>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 150px;">Nama</td><td style="width: 15px;">:</td><td>${data.pejabat?.nama || '[NAMA]'}</td></tr>
        <tr><td>NPP</td><td>:</td><td>${data.pejabat?.npp || '[NPP]'}</td></tr>
        <tr><td>Jabatan</td><td>:</td><td>
          ${data.pejabat?.jabatan || '[POSISI]'}<br/>
          ${data.pejabat?.unitOrgLine1 || 'PT. Bank Negara Indonesia (Persero) Tbk.'}<br/>
          ${data.pejabat?.unitOrgLine2 || 'Pontianak Branch Office'}
        </td></tr>
      </table>
      <p style="margin: 0 0 10px 0;">Menerangkan bahwa,</p>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 150px;">Nama</td><td style="width: 15px;">:</td><td>${data.pegawai?.nama || '[NAMA]'}</td></tr>
        <tr><td>NPP</td><td>:</td><td>${data.pegawai?.npp || '[NPP]'}</td></tr>
        <tr><td>Tempat/Tanggal Lahir</td><td>:</td><td>${data.pegawai?.ttl || '[TTL]'}</td></tr>
        <tr><td>Posisi</td><td>:</td><td>
          ${data.pegawai?.posisi || '[POSISI]'}<br/>
          ${data.pegawai?.unitOrgLine1 || 'PT. Bank Negara Indonesia (Persero) Tbk'}<br/>
          ${data.pegawai?.unitOrgLine2 || 'Pontianak Branch Office'}
        </td></tr>
      </table>
      <p style="text-align: justify; margin: 15px 0; line-height: 1.45;">
        Adalah benar tercatat sebagai pegawai PT. Bank Negara Indonesia (Persero) Tbk sejak tanggal ${data.keterangan?.tanggalMulai || '[Tanggal Mulai]'} sampai dengan ${data.keterangan?.tanggalSelesai || '[Tanggal Selesai]'}, yang bersangkutan mengundurkan diri dari PT. Bank Negara Indonesia (Persero) Tbk., dengan posisi terakhir sebagai ${data.keterangan?.posisiTerakhir || data.pegawai?.posisi || '[Posisi Terakhir]'}
      </p>
      <p style="text-align: justify; margin: 15px 0 35px 0; line-height: 1.45;">
        Demikianlah Surat Keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya, dengan tidak mengikat PT. Bank Negara Indonesia (Persero) Tbk.
      </p>
      <div style="margin-top: 14px; text-align: left;">
        <p style="margin: 0; font-weight: bold;">${data.penandatangan?.unitHeader1 || 'PT. Bank Negara Indonesia (Persero) Tbk.'}</p>
        <p style="margin: 0; font-weight: bold;">${data.penandatangan?.unitHeader2 || 'Pontianak Branch Office, Area III, Kalimantan Barat'}</p>
        <br/><br/><br/><br/>
        ${data.penandatangan?.nama ? `
          <p><u><b>${data.penandatangan.nama}</b></u></p>
          <p><b>${data.penandatangan.jabatan}</b></p>
        ` : ''}
      </div>
    </div>
  `
}
