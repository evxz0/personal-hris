import { useState } from 'react'
import { Plus, Search, Trash2, ArrowUpCircle, Fingerprint, FileDown, FileText, Edit2 } from 'lucide-react'
import {
  useRequestNaikLevel, useAddRequestNaikLevel, useDeleteRequestNaikLevel, useBulkInsertRequestNaikLevel, useUpdateRequestNaikLevel,
  useRequestPinpad, useAddRequestPinpad, useDeleteRequestPinpad, useBulkInsertRequestPinpad, useUpdateRequestPinpad,
} from '../hooks/useRequest'
import { DataTable } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { formatDate } from '../lib/utils'
import { ImportModal } from '../components/ui/ImportModal'
import { ImportDropdown, type ImportMode } from '../components/ui/ImportDropdown'
import { exportToXLSX, exportToPDF } from '../lib/importExport'

const NAIK_LEVEL_FIELD_MAPPING: Record<string, string> = {
  'NPP': 'npp', 'Nama': 'nama', 'NIK': 'nik',
  'TTL': 'ttl', 'Tempat Tanggal Lahir': 'ttl',
  'Jenis Kelamin': 'jenis_kelamin', 'Alamat': 'alamat', 'Agama': 'agama',
  'Level Diajukan': 'level_diajukan',
  'Waktu Mulai': 'waktu_mulai', 'Waktu Selesai': 'waktu_selesai', 'Keterangan': 'keterangan'
}
const NAIK_LEVEL_TEMPLATE_HEADERS = ['NPP', 'Nama', 'NIK', 'TTL', 'Jenis Kelamin', 'Alamat', 'Agama', 'Level Diajukan', 'Waktu Mulai', 'Waktu Selesai', 'Keterangan']

const PINPAD_FIELD_MAPPING: Record<string, string> = {
  'Keperluan': 'keperluan', 'NPP User': 'npp_user', 'Nama': 'nama', 'NIK': 'nik',
  'TTL': 'ttl', 'Tempat Tanggal Lahir': 'ttl',
  'Jenis Kelamin': 'jenis_kelamin', 'Alamat': 'alamat', 'Agama': 'agama',
  'Waktu Mulai': 'waktu_mulai', 'Waktu Selesai': 'waktu_selesai', 'Keterangan': 'keterangan'
}
const PINPAD_TEMPLATE_HEADERS = ['Keperluan', 'NPP User', 'Nama', 'NIK', 'TTL', 'Jenis Kelamin', 'Alamat', 'Agama', 'Waktu Mulai', 'Waktu Selesai', 'Keterangan']

// ─── Naik Level ───────────────────────────────────────────────────────────────
// Removed NPPAutoFillRow and resolveNama as inputs are now manual

export function RequestNaikLevelPage() {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('excel')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ npp: '', nama: '', level_diajukan: '', waktu_mulai: '', waktu_selesai: '', keterangan: '' })
  const [editId, setEditId] = useState<string | null>(null)

  const { data = [], isLoading } = useRequestNaikLevel(search)
  const addMutation    = useAddRequestNaikLevel()
  const updateMutation = useUpdateRequestNaikLevel()
  const deleteMutation = useDeleteRequestNaikLevel()
  const bulkInsert     = useBulkInsertRequestNaikLevel()

  const openAdd = () => {
    setForm({ npp: '', nama: '', level_diajukan: '', waktu_mulai: '', waktu_selesai: '', keterangan: '' })
    setEditId(null)
    setModalOpen(true)
  }

  const openEdit = (row: any) => {
    setForm({
      npp: row.npp,
      nama: row.nama,
      level_diajukan: row.level_diajukan,
      waktu_mulai: row.waktu_mulai ?? '',
      waktu_selesai: row.waktu_selesai ?? '',
      keterangan: row.keterangan ?? ''
    })
    setEditId(row.id)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (editId) {
      await updateMutation.mutateAsync({ id: editId, payload: form })
    } else {
      await addMutation.mutateAsync(form)
    }
    setModalOpen(false)
    setForm({ npp: '', nama: '', level_diajukan: '', waktu_mulai: '', waktu_selesai: '', keterangan: '' })
    setEditId(null)
  }

  const handleDelete = async () => {
    if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) }
  }

  const handleImport = async (rows: Record<string, unknown>[]) => {
    await bulkInsert.mutateAsync(rows)
  }

  const handleExportXLSX = () => {
    exportToXLSX(data.map(r => ({
      'Tanggal Buat': formatDate(r.tanggal_buat),
      NPP: r.npp,
      Nama: r.nama,
      'Level Diajukan': r.level_diajukan,
      'Waktu Mulai': r.waktu_mulai,
      'Waktu Selesai': r.waktu_selesai,
      Keterangan: r.keterangan || '-'
    })), 'Request_Naik_Level')
  }

  const handleExportPDF = () => {
    exportToPDF(
      data.map(r => ({ ...r, tanggal_buat: formatDate(r.tanggal_buat) })) as unknown as Record<string, unknown>[],
      [
        { header: 'Tanggal', dataKey: 'tanggal_buat' },
        { header: 'NPP', dataKey: 'npp' },
        { header: 'Nama', dataKey: 'nama' },
        { header: 'Level', dataKey: 'level_diajukan' },
        { header: 'Mulai', dataKey: 'waktu_mulai' },
        { header: 'Selesai', dataKey: 'waktu_selesai' },
        { header: 'Keterangan', dataKey: 'keterangan' }
      ],
      'Laporan Request Naik Level',
      'Request_Naik_Level'
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B3440] flex items-center gap-2">
            <ArrowUpCircle size={24} className="text-teal-600" /> Request Naik Level
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Pengajuan kenaikan level karyawan</p>
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

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          placeholder="Cari NPP atau nama..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
        />
      </div>

      <DataTable
        tableId="request_naik_level"
        data={data as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="Belum ada request naik level"
        emptyIcon={<ArrowUpCircle size={40} className="text-gray-200" />}
        columns={[
          { key: 'tanggal_buat', header: 'Tanggal', render: r => formatDate(String(r.tanggal_buat)) },
          { key: 'npp', header: 'NPP' },
          { key: 'nama', header: 'Nama', render: r => <span className="font-semibold">{String(r.nama)}</span> },
          { key: 'level_diajukan', header: 'Level Diajukan', render: r => (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-semibold">{String(r.level_diajukan)}</span>
          )},
          { key: 'waktu_mulai', header: 'Mulai', render: r => String(r.waktu_mulai ?? '-') },
          { key: 'waktu_selesai', header: 'Selesai', render: r => String(r.waktu_selesai ?? '-') },
          { key: 'keterangan', header: 'Keterangan', render: r => <span className="text-xs text-[#64748B]">{String(r.keterangan) || '-'}</span> },
        ]}
        actions={row => (
          <div className="flex items-center gap-1">
            <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
              <Edit2 size={14} />
            </button>
            <button onClick={() => setDeleteId(String(row.id))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setForm({ npp: '', nama: '', level_diajukan: '', waktu_mulai: '', waktu_selesai: '', keterangan: '' }); setEditId(null); }}
        title={editId ? "Ubah Request Naik Level" : "Buat Request Naik Level"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" loading={addMutation.isPending || updateMutation.isPending} onClick={handleSave}>Ajukan</Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Auto-date */}
          <div className="px-3 py-2.5 rounded-xl bg-[#F4F7F6] border border-gray-200 text-sm">
            <span className="text-[#64748B]">Tanggal Request: </span>
            <span className="font-bold text-[#2B3440]">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="NPP Karyawan"
                value={form.npp}
                onChange={e => setForm(f => ({ ...f, npp: e.target.value }))}
                placeholder="Contoh: 12345"
              />
              <Input
                label="Nama Lengkap"
                value={form.nama}
                onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                placeholder="Nama karyawan"
              />
            </div>

            <Input label="Level Diajukan" value={form.level_diajukan} onChange={e => setForm(f => ({ ...f, level_diajukan: e.target.value }))} placeholder="Contoh: Level 3" />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Waktu Mulai</label>
              <input
                type="time"
                value={form.waktu_mulai}
                onChange={e => setForm(f => ({ ...f, waktu_mulai: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Waktu Selesai</label>
              <input
                type="time"
                value={form.waktu_selesai}
                onChange={e => setForm(f => ({ ...f, waktu_selesai: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          <Textarea label="Keterangan" value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} placeholder="Alasan pengajuan naik level..." />
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Request" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button><Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>Hapus</Button></>}
      >
        <p className="text-sm text-[#64748B]">Hapus request naik level ini?</p>
      </Modal>

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        title="Import Request Naik Level"
        templateHeaders={NAIK_LEVEL_TEMPLATE_HEADERS}
        templateFilename="Template_Request_Naik_Level"
        fieldMapping={NAIK_LEVEL_FIELD_MAPPING}
        requiredFields={['npp', 'nama', 'level_diajukan']}
        initialMode={importMode}
      />
    </div>
  )
}

// ─── Pinpad ───────────────────────────────────────────────────────────────────
export function RequestPinpadPage() {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('excel')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ keperluan: 'OPEN PINPAD' as 'OPEN PINPAD'|'FR', npp_user: '', nama: '', waktu_mulai: '', waktu_selesai: '', keterangan: '' })
  const [editId, setEditId] = useState<string | null>(null)

  const { data = [], isLoading } = useRequestPinpad(search)
  const addMutation    = useAddRequestPinpad()
  const updateMutation = useUpdateRequestPinpad()
  const deleteMutation = useDeleteRequestPinpad()
  const bulkInsert     = useBulkInsertRequestPinpad()

  const openAdd = () => {
    setForm({ keperluan: 'OPEN PINPAD', npp_user: '', nama: '', waktu_mulai: '', waktu_selesai: '', keterangan: '' })
    setEditId(null)
    setModalOpen(true)
  }

  const openEdit = (row: any) => {
    setForm({
      keperluan: row.keperluan || 'OPEN PINPAD',
      npp_user: row.npp_user,
      nama: row.nama,
      waktu_mulai: row.waktu_mulai ?? '',
      waktu_selesai: row.waktu_selesai ?? '',
      keterangan: row.keterangan ?? ''
    })
    setEditId(row.id)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (editId) {
      await updateMutation.mutateAsync({ id: editId, payload: form })
    } else {
      await addMutation.mutateAsync(form)
    }
    setModalOpen(false)
    setForm({ keperluan: 'OPEN PINPAD', npp_user: '', nama: '', waktu_mulai: '', waktu_selesai: '', keterangan: '' })
    setEditId(null)
  }

  const handleDelete = async () => {
    if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) }
  }

  const handleImport = async (rows: Record<string, unknown>[]) => {
    await bulkInsert.mutateAsync(rows)
  }

  const handleExportXLSX = () => {
    exportToXLSX(data.map(r => ({
      Tanggal: formatDate(r.created_at || r.tanggal_buat),
      Tipe: r.keperluan,
      NPP: r.npp_user,
      Nama: r.nama,
      'Waktu Mulai': r.waktu_mulai,
      'Waktu Selesai': r.waktu_selesai,
      Keterangan: r.keterangan || '-'
    })), 'Request_Pinpad')
  }

  const handleExportPDF = () => {
    exportToPDF(
      data.map(r => ({ ...r, tanggal: formatDate(r.created_at || r.tanggal_buat) })) as unknown as Record<string, unknown>[],
      [
        { header: 'Tanggal', dataKey: 'tanggal' },
        { header: 'Tipe', dataKey: 'keperluan' },
        { header: 'NPP', dataKey: 'npp_user' },
        { header: 'Nama', dataKey: 'nama' },
        { header: 'Mulai', dataKey: 'waktu_mulai' },
        { header: 'Selesai', dataKey: 'waktu_selesai' },
        { header: 'Keterangan', dataKey: 'keterangan' }
      ],
      'Laporan Request Pinpad',
      'Request_Pinpad'
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B3440] flex items-center gap-2">
            <Fingerprint size={24} className="text-orange-500" /> Request Pinpad
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Pengajuan Open Pinpad & FR</p>
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

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          placeholder="Cari NPP atau nama..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
        />
      </div>

      <DataTable
        tableId="request_pinpad"
        data={data as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="Belum ada request pinpad"
        emptyIcon={<Fingerprint size={40} className="text-gray-200" />}
        columns={[
          { key: 'created_at', header: 'Tanggal', render: r => formatDate(String(r.created_at || r.tanggal_buat)) },
          { key: 'npp_user', header: 'NPP' },
          { key: 'nama', header: 'Nama', render: r => <span className="font-semibold">{String(r.nama)}</span> },
          { key: 'keperluan', header: 'Tipe', render: r => (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${r.keperluan === 'FR' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
              {String(r.keperluan)}
            </span>
          )},
          { key: 'waktu_mulai', header: 'Mulai', render: r => String(r.waktu_mulai ?? '-') },
          { key: 'waktu_selesai', header: 'Selesai', render: r => String(r.waktu_selesai ?? '-') },
          { key: 'keterangan', header: 'Keterangan', render: r => <span className="text-xs text-[#64748B]">{String(r.keterangan) || '-'}</span> },
        ]}
        actions={row => (
          <div className="flex items-center gap-1">
            <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
              <Edit2 size={14} />
            </button>
            <button onClick={() => setDeleteId(String(row.id))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setForm({ keperluan: 'OPEN PINPAD', npp_user: '', nama: '', waktu_mulai: '', waktu_selesai: '', keterangan: '' }); setEditId(null); }}
        title={editId ? "Ubah Request Pinpad" : "Buat Request Pinpad"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="secondary" loading={addMutation.isPending || updateMutation.isPending} onClick={handleSave}>Ajukan</Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Auto-date */}
          <div className="px-3 py-2.5 rounded-xl bg-[#F4F7F6] border border-gray-200 text-sm">
            <span className="text-[#64748B]">Tanggal Request: </span>
            <span className="font-bold text-[#2B3440]">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          <Select
            label="Tipe"
            value={form.keperluan}
            onChange={e => setForm(f => ({ ...f, keperluan: e.target.value as 'OPEN PINPAD'|'FR' }))}
            options={[{ value: 'OPEN PINPAD', label: 'Open Pinpad' }, { value: 'FR', label: 'FR' }]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="NPP Pengguna"
              value={form.npp_user}
              onChange={e => setForm(f => ({ ...f, npp_user: e.target.value }))}
              placeholder="Contoh: 12345"
            />
            <Input
              label="Nama Lengkap"
              value={form.nama}
              onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              placeholder="Nama karyawan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Waktu Mulai</label>
              <input
                type="time"
                value={form.waktu_mulai}
                onChange={e => setForm(f => ({ ...f, waktu_mulai: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Waktu Selesai</label>
              <input
                type="time"
                value={form.waktu_selesai}
                onChange={e => setForm(f => ({ ...f, waktu_selesai: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          <Textarea label="Keterangan" value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} placeholder="Keterangan tambahan..." />
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Request" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button><Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>Hapus</Button></>}
      >
        <p className="text-sm text-[#64748B]">Hapus request pinpad ini?</p>
      </Modal>

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        title="Import Request Pinpad"
        templateHeaders={PINPAD_TEMPLATE_HEADERS}
        templateFilename="Template_Request_Pinpad"
        fieldMapping={PINPAD_FIELD_MAPPING}
        requiredFields={['keperluan', 'npp_user']}
        initialMode={importMode}
      />
    </div>
  )
}
