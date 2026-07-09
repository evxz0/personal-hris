import { useState } from 'react'
import { Search, Trash2, FileSpreadsheet, FileDown, FileText, ArrowRightLeft } from 'lucide-react'
import { useMutasi, useDeleteMutasi, type Mutasi } from '../hooks/useMutasi'
import { useReferensi } from '../hooks/useReferensi'
import { DataTable } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { formatDate } from '../lib/utils'
import { exportToXLSX, exportToPDF } from '../lib/importExport'

export default function MutasiPage() {
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState<'ALL' | 'FTE' | 'TAD'>('ALL')
  const [filterOutlet, setFilterOutlet] = useState('ALL')
  const [filterJabatan, setFilterJabatan] = useState('ALL')
  const [filterGrade, setFilterGrade] = useState('ALL')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data = [], isLoading } = useMutasi(search)
  const { data: outlets = [] } = useReferensi('OUTLET')
  const { data: jabatans = [] } = useReferensi('JABATAN_KARYAWAN')
  const deleteMutation = useDeleteMutasi()

  // Apply filters client-side
  const filtered = data.filter(k => {
    if (filterKategori !== 'ALL' && k.kategori !== filterKategori) return false
    if (filterOutlet !== 'ALL' && k.outlet !== filterOutlet) return false
    if (filterJabatan !== 'ALL' && k.jabatan !== filterJabatan) return false
    if (filterGrade !== 'ALL' && String(k.grade) !== filterGrade) return false
    return true
  })

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const handleExportXLSX = () => {
    exportToXLSX(filtered.map(k => ({
      NPP: k.npp, Nama: k.nama, Kategori: k.kategori,
      Outlet: k.outlet, 'Tgl Mutasi': formatDate(k.created_at),
      Posisi: k.posisi_saat_ini, Jabatan: k.jabatan, Grade: k.grade,
      NIK: k.nik || '-', 'No Rek': k.no_rek || '-', 'No HP': k.no_hp || '-',
      Keterangan: k.keterangan || '-'
    })), 'Data_Mutasi_Karyawan')
  }

  const handleExportPDF = () => {
    exportToPDF(
      filtered.map(k => ({ ...k, created_at: formatDate(k.created_at) })) as unknown as Record<string, unknown>[],
      [
        { header: 'NPP', dataKey: 'npp' },
        { header: 'Nama', dataKey: 'nama' },
        { header: 'Tipe', dataKey: 'kategori' },
        { header: 'Outlet', dataKey: 'outlet' },
        { header: 'Jabatan', dataKey: 'jabatan' },
        { header: 'Grade', dataKey: 'grade' },
        { header: 'Tgl Mutasi', dataKey: 'created_at' },
      ],
      'Laporan Riwayat Mutasi Karyawan',
      'Data_Mutasi_Karyawan'
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B3440] flex items-center gap-2">
            <ArrowRightLeft size={24} className="text-teal-600" /> Riwayat Mutasi Karyawan
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Daftar mutasi posisi, jabatan, dan outlet karyawan</p>
        </div>
        <div className="flex items-center gap-2">
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
            placeholder="Cari NPP, nama..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filterKategori} onChange={e => setFilterKategori(e.target.value as 'ALL'|'FTE'|'TAD')} className="px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-white text-[#2B3440] focus:outline-none focus:border-teal-500">
            <option value="ALL">Semua Tipe</option>
            <option value="FTE">FTE</option>
            <option value="TAD">TAD</option>
          </select>
          <select value={filterOutlet} onChange={e => setFilterOutlet(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-white text-[#2B3440] focus:outline-none focus:border-teal-500">
            <option value="ALL">Semua Outlet</option>
            {outlets.map(o => <option key={o.id} value={o.nama_referensi}>{o.nama_referensi}</option>)}
          </select>
          <select value={filterJabatan} onChange={e => setFilterJabatan(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-white text-[#2B3440] focus:outline-none focus:border-teal-500">
            <option value="ALL">Semua Jabatan</option>
            {jabatans.map(j => <option key={j.id} value={j.nama_referensi}>{j.nama_referensi}</option>)}
          </select>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-white text-[#2B3440] focus:outline-none focus:border-teal-500">
            <option value="ALL">Semua Grade</option>
            {Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1)}>Grade {i + 1}</option>)}
          </select>
        </div>
        <div className="text-xs text-[#64748B] self-center px-3 py-1.5 bg-white rounded-xl border border-gray-200 font-medium whitespace-nowrap">
          {filtered.length} data
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filtered as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="Belum ada riwayat mutasi"
        emptyIcon={<ArrowRightLeft size={40} className="text-gray-200" />}
        columns={[
          { key: 'npp', header: 'NPP', width: 'w-28' },
          { key: 'nama', header: 'Nama', render: (r) => <span className="font-semibold">{String(r.nama)}</span> },
          { key: 'kategori', header: 'Tipe', render: (r) => (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${r.kategori === 'FTE' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}>
              {String(r.kategori)}
            </span>
          )},
          { key: 'outlet', header: 'Outlet' },
          { key: 'jabatan', header: 'Jabatan' },
          { key: 'grade', header: 'Grade', render: (r) => (
            <span className="font-bold text-teal-700">{String(r.grade)}</span>
          )},
          { key: 'no_hp', header: 'No HP' },
        ]}
        actions={(row) => (
          <button
            onClick={() => setDeleteId(String(row.id))}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      />

      {/* Delete Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Riwayat Mutasi" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-[#64748B]">Apakah Anda yakin ingin menghapus data riwayat mutasi ini?</p>
      </Modal>
    </div>
  )
}
