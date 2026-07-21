import { Plus, Search, Edit2, Trash2, GraduationCap, FileDown, FileText } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useMagang, useAddMagang, useUpdateMagang, useDeleteMagang, useBulkInsertMagang, type Magang } from '../hooks/useMagang'
import { DataTable } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { formatDate, calculateDays } from '../lib/utils'
import { ImportModal } from '../components/ui/ImportModal'
import { ImportDropdown, type ImportMode } from '../components/ui/ImportDropdown'
import { exportToXLSX, exportToPDF } from '../lib/importExport'

const MAGANG_FIELD_MAPPING: Record<string, string> = {
  'Nama': 'nama', 'NIK': 'nik', 'TTL': 'ttl', 'Tempat Tanggal Lahir': 'ttl',
  'Jenis Kelamin': 'jenis_kelamin', 'Alamat': 'rumah', 'Rumah': 'rumah', 'Agama': 'agama',
  'Fakultas': 'fakultas', 'Jurusan': 'jurusan', 'Universitas': 'universitas',
  'Penempatan': 'penempatan', 'Tgl Mulai': 'tanggal_mulai', 'Tgl Selesai': 'tanggal_selesai'
}
const MAGANG_TEMPLATE_HEADERS = ['Nama', 'NIK', 'TTL', 'Jenis Kelamin', 'Alamat', 'Agama', 'Fakultas', 'Jurusan', 'Universitas', 'Penempatan', 'Tgl Mulai', 'Tgl Selesai']

const EMPTY = {
  nama: '', fakultas: '', jurusan: '', universitas: '', rumah: '',
  penempatan: '', tanggal_mulai: '', tanggal_selesai: '',
}

import { useState } from 'react'

export default function MagangPage() {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('excel')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)

  const { data = [], isLoading } = useMagang(search)
  const addMutation    = useAddMagang()
  const updateMutation = useUpdateMagang()
  const deleteMutation = useDeleteMagang()
  const bulkInsert     = useBulkInsertMagang()

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModalOpen(true) }
  const openEdit = (m: Magang) => {
    setForm({
      nama: m.nama,
      fakultas: m.fakultas || '',
      jurusan: m.jurusan || '',
      universitas: m.universitas,
      rumah: m.rumah,
      penempatan: m.penempatan,
      tanggal_mulai: m.tanggal_mulai,
      tanggal_selesai: m.tanggal_selesai
    })
    setEditId(m.id); setModalOpen(true)
  }

  const handleSave = async () => {
    if (editId) { await updateMutation.mutateAsync({ id: editId, payload: form }) }
    else        { await addMutation.mutateAsync(form) }
    setModalOpen(false)
  }

  const handleDelete = async () => {
    if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) }
  }

  const handleImport = async (rows: Record<string, unknown>[]) => {
    await bulkInsert.mutateAsync(rows)
  }

  const handleExportXLSX = () => {
    exportToXLSX(data.map(m => ({
      Nama: m.nama,
      Fakultas: m.fakultas,
      Jurusan: m.jurusan,
      Universitas: m.universitas,
      Rumah: m.rumah,
      Penempatan: m.penempatan,
      'Tanggal Mulai': formatDate(m.tanggal_mulai),
      'Tanggal Selesai': formatDate(m.tanggal_selesai),
      'Total Hari': m.total_lama_hari
    })), 'Data_Magang')
  }

  const handleExportPDF = () => {
    exportToPDF(
      data.map(m => ({
        ...m,
        tanggal_mulai: formatDate(m.tanggal_mulai),
        tanggal_selesai: formatDate(m.tanggal_selesai)
      })) as unknown as Record<string, unknown>[],
      [
        { header: 'Nama', dataKey: 'nama' },
        { header: 'Universitas', dataKey: 'universitas' },
        { header: 'Fakultas', dataKey: 'fakultas' },
        { header: 'Jurusan', dataKey: 'jurusan' },
        { header: 'Penempatan', dataKey: 'penempatan' },
        { header: 'Mulai', dataKey: 'tanggal_mulai' },
        { header: 'Selesai', dataKey: 'tanggal_selesai' },
        { header: 'Durasi (Hari)', dataKey: 'total_lama_hari' }
      ],
      'Laporan Data Peserta Magang',
      'Data_Magang'
    )
  }

  const totalHari = calculateDays(form.tanggal_mulai, form.tanggal_selesai)
  const isBusy = addMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B3440] flex items-center gap-2">
            <GraduationCap size={24} className="text-purple-600" /> Master Magang
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Kelola data mahasiswa/siswa magang</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportDropdown
            onSelectExcel={() => { setImportMode('excel'); setImportOpen(true); }}
            onSelectOcr={() => { setImportMode('ocr'); setImportOpen(true); }}
          />
          <Button variant="outline" size="sm" icon={<FileDown size={15} />} onClick={handleExportXLSX}>
            Excel
          </Button>
          <Button variant="outline" size="sm" icon={<FileText size={15} />} onClick={handleExportPDF}>
            PDF
          </Button>
          <Button variant="secondary" size="sm" icon={<Plus size={15} />} onClick={openAdd}>
            Tambah
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Cari nama, universitas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
        <div className="text-xs text-[#64748B] self-center px-3 py-1.5 bg-white rounded-xl border border-gray-200 font-medium">
          {data.length} magang aktif
        </div>
      </div>

      <DataTable
        tableId="master_magang"
        data={data as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="Belum ada data magang"
        emptyIcon={<GraduationCap size={40} className="text-gray-200" />}
        columns={[
          { key: 'nama', header: 'Nama', render: r => {
            const str = String(r.nama || '')
            if (!str) return '-'
            const words = str.trim().split(/\s+/).filter(Boolean)
            const isNoWrap = words.length <= 3
            return (
              <span className={`font-semibold ${isNoWrap ? 'whitespace-nowrap' : 'break-words max-w-[200px]'}`}>
                {str}
              </span>
            )
          }},
          { key: 'universitas', header: 'Universitas' },
          { key: 'fakultas', header: 'Fakultas' },
          { key: 'jurusan', header: 'Jurusan' },
          { key: 'penempatan', header: 'Penempatan', render: r => (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">{String(r.penempatan)}</span>
          )},
          { key: 'rumah', header: 'Alamat', render: r => <span className="text-xs text-[#475569] max-w-[240px] inline-block truncate" title={String(r.rumah || r.alamat || '-')}>{String(r.rumah || r.alamat || '-')}</span> },
          { key: 'tanggal_mulai', header: 'Mulai', render: r => <span className="whitespace-nowrap">{formatDate(String(r.tanggal_mulai))}</span> },
          { key: 'tanggal_selesai', header: 'Selesai', render: r => <span className="whitespace-nowrap">{formatDate(String(r.tanggal_selesai))}</span> },
          { key: 'total_lama_hari', header: 'Durasi', render: r => (
            <span className="font-bold text-teal-700">{String(r.total_lama_hari)} hari</span>
          )},
        ]}
        actions={row => (
          <>
            <button onClick={() => openEdit(row as unknown as Magang)} className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors">
              <Edit2 size={14} />
            </button>
            <button onClick={() => setDeleteId(String(row.id))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Data Magang' : 'Tambah Peserta Magang'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" loading={isBusy} onClick={handleSave}>
              {editId ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nama Lengkap" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Nama peserta magang" className="sm:col-span-2" />
          <Input label="Universitas/Sekolah" value={form.universitas} onChange={e => setForm(f => ({ ...f, universitas: e.target.value }))} placeholder="Nama institusi" />
          <Input label="Fakultas" value={form.fakultas} onChange={e => setForm(f => ({ ...f, fakultas: e.target.value }))} placeholder="Nama fakultas" />
          <Input label="Jurusan" value={form.jurusan} onChange={e => setForm(f => ({ ...f, jurusan: e.target.value }))} placeholder="Nama jurusan" />
          <Input label="Asal Kota/Rumah" value={form.rumah} onChange={e => setForm(f => ({ ...f, rumah: e.target.value }))} placeholder="Kota asal" />
          <Input label="Penempatan" value={form.penempatan} onChange={e => setForm(f => ({ ...f, penempatan: e.target.value }))} placeholder="Unit/divisi penempatan" />

          {/* Date Range */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Tanggal Mulai</label>
            <DatePicker
              selected={form.tanggal_mulai ? new Date(form.tanggal_mulai) : null}
              onChange={(date: Date | null) => setForm(f => ({ ...f, tanggal_mulai: date ? date.toISOString().split('T')[0] : '' }))}
              dateFormat="dd MMMM yyyy"
              placeholderText="Pilih tanggal mulai"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Tanggal Selesai</label>
            <DatePicker
              selected={form.tanggal_selesai ? new Date(form.tanggal_selesai) : null}
              onChange={(date: Date | null) => setForm(f => ({ ...f, tanggal_selesai: date ? date.toISOString().split('T')[0] : '' }))}
              dateFormat="dd MMMM yyyy"
              placeholderText="Pilih tanggal selesai"
              minDate={form.tanggal_mulai ? new Date(form.tanggal_mulai) : undefined}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Auto-calculated duration */}
          {totalHari > 0 && (
            <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-teal-50 border border-teal-100">
              <GraduationCap size={18} className="text-teal-600 shrink-0" />
              <div>
                <p className="text-xs text-teal-600 font-medium">Total Lama Magang (Auto-kalkulasi)</p>
                <p className="text-xl font-extrabold text-teal-700">{totalHari} Hari</p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-[#64748B]">Apakah Anda yakin ingin menghapus data magang ini?</p>
      </Modal>

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        title="Import Data Magang"
        templateHeaders={MAGANG_TEMPLATE_HEADERS}
        templateFilename="Template_Magang"
        fieldMapping={MAGANG_FIELD_MAPPING}
        requiredFields={['nama', 'universitas']}
        initialMode={importMode}
      />
    </div>
  )
}
