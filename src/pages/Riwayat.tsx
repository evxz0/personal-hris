import { useState } from 'react'
import { Search, Trash2, FileDown, FileText, ArrowRightLeft } from 'lucide-react'
import { useMutasi, useDeleteMutasi } from '../hooks/useMutasi'
import { useReferensi } from '../hooks/useReferensi'
import { DataTable } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { formatDate } from '../lib/utils'
import { exportToXLSX, exportToPDF } from '../lib/importExport'
import { MultiSelect } from '../components/ui/Input'

export default function RiwayatPage() {
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState<string[]>([])
  const [filterOutlet, setFilterOutlet] = useState<string[]>([])
  const [filterJabatan, setFilterJabatan] = useState<string[]>([])
  const [filterGrade, setFilterGrade] = useState<string[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data = [], isLoading } = useMutasi(search)
  const { data: outlets = [] } = useReferensi('OUTLET')
  const { data: jabatans = [] } = useReferensi('JABATAN_KARYAWAN')
  const deleteMutation = useDeleteMutasi()

  // Apply filters client-side
  const filtered = data.filter(k => {
    if (filterKategori.length > 0 && !filterKategori.includes(k.kategori)) return false
    if (filterOutlet.length > 0 && (!k.outlet || !filterOutlet.includes(k.outlet))) return false
    if (filterJabatan.length > 0 && (!k.jabatan || !filterJabatan.includes(k.jabatan))) return false
    if (filterGrade.length > 0 && (k.grade === null || k.grade === undefined || !filterGrade.includes(String(k.grade)))) return false
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
      NPP: k.npp, Nama: k.nama, Aksi: k.jenis_aksi || 'MUTASI', Kategori: k.kategori,
      Outlet: k.outlet, 'Tgl Proses': formatDate(k.created_at),
      'Masa Berlaku': k.tanggal_aktif ? formatDate(k.tanggal_aktif) : '-',
      Jenjang: k.jenjang, Jabatan: k.jabatan, Grade: k.grade,
      NIK: k.nik || '-', 'No Rek': k.no_rek || '-', 'No HP': k.no_hp || '-',
      Keterangan: k.keterangan || '-'
    })), 'Data_Riwayat_Karyawan')
  }

  const handleExportPDF = () => {
    exportToPDF(
      filtered.map(k => ({
        ...k,
        jenis_aksi: k.jenis_aksi || 'MUTASI',
        created_at: formatDate(k.created_at),
        tanggal_aktif: k.tanggal_aktif ? formatDate(k.tanggal_aktif) : '-'
      })) as unknown as Record<string, unknown>[],
      [
        { header: 'NPP', dataKey: 'npp' },
        { header: 'Nama', dataKey: 'nama' },
        { header: 'Aksi', dataKey: 'jenis_aksi' },
        { header: 'Tipe', dataKey: 'kategori' },
        { header: 'Outlet', dataKey: 'outlet' },
        { header: 'Jenjang', dataKey: 'jenjang' },
        { header: 'Jabatan', dataKey: 'jabatan' },
        { header: 'Grade', dataKey: 'grade' },
        { header: 'Masa Berlaku', dataKey: 'tanggal_aktif' },
        { header: 'Tgl Proses', dataKey: 'created_at' },
      ],
      'Laporan Riwayat Aksi Karyawan',
      'Data_Riwayat_Karyawan'
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B3440] flex items-center gap-2">
            <ArrowRightLeft size={24} className="text-teal-600" /> Riwayat Karyawan
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Daftar riwayat mutasi dan penghapusan karyawan</p>
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
            placeholder="Cari NPP, nama..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <MultiSelect
            selectedValues={filterKategori}
            onChange={setFilterKategori}
            placeholder="Semua Tipe"
            options={[
              { value: 'FTE', label: 'FTE' },
              { value: 'TAD', label: 'TAD' },
            ]}
          />
          <MultiSelect
            selectedValues={filterOutlet}
            onChange={setFilterOutlet}
            placeholder="Semua Outlet"
            options={outlets.map(o => ({ value: o.nama_referensi, label: o.nama_referensi }))}
          />
          <MultiSelect
            selectedValues={filterJabatan}
            onChange={setFilterJabatan}
            placeholder="Semua Jabatan"
            options={jabatans.map(j => ({ value: j.nama_referensi, label: j.nama_referensi }))}
          />
          <MultiSelect
            selectedValues={filterGrade}
            onChange={setFilterGrade}
            placeholder="Semua Grade"
            options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Grade ${i + 1}` }))}
          />
        </div>
        <div className="text-xs text-[#64748B] self-center px-3 py-1.5 bg-white rounded-xl border border-gray-200 font-medium whitespace-nowrap">
          {filtered.length} data
        </div>
      </div>

      {/* Table */}
      <DataTable
        tableId="riwayat_mutasi"
        data={filtered as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="Belum ada riwayat"
        emptyIcon={<ArrowRightLeft size={40} className="text-gray-200" />}
        columns={[
          { key: 'npp', header: 'NPP', width: 'w-28' },
          { key: 'nama', header: 'Nama', render: (r) => <span className="font-semibold">{String(r.nama)}</span> },
          { key: 'jenis_aksi', header: 'Aksi', render: (r) => {
            const val = r.jenis_aksi || 'MUTASI'
            const bg = val === 'HAPUS' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'
            return (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${bg}`}>
                {String(val)}
              </span>
            )
          }},
          { key: 'kategori', header: 'Tipe', render: (r) => (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${r.kategori === 'FTE' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}>
              {String(r.kategori)}
            </span>
          )},
          { key: 'outlet', header: 'Outlet' },
          { key: 'jenjang', header: 'Jenjang' },
          { key: 'jabatan', header: 'Jabatan' },
          { key: 'grade', header: 'Grade', render: (r) => (
            <span className="font-bold text-teal-700">{String(r.grade)}</span>
          )},
          { key: 'tanggal_aktif', header: 'Masa Berlaku', render: (r) => (
            <span className="font-semibold text-teal-600">{r.tanggal_aktif ? formatDate(String(r.tanggal_aktif)) : '-'}</span>
          )},
          { key: 'nik', header: 'NIK' },
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
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Riwayat Aksi" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-[#64748B]">Apakah Anda yakin ingin menghapus data riwayat aksi ini?</p>
      </Modal>
    </div>
  )
}
