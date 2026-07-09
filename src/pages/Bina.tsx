import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, UserCheck, FileSpreadsheet, FileDown, FileText } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useBina, useAddBina, useUpdateBina, useDeleteBina, useBulkInsertBina, type Bina, type BinaInsert } from '../hooks/useBina'
import { useReferensi } from '../hooks/useReferensi'
import { DataTable } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ImportModal } from '../components/ui/ImportModal'
import { exportToXLSX, exportToPDF } from '../lib/importExport'
import { formatDate } from '../lib/utils'

const EMPTY: BinaInsert = {
  npp: '', nama: '', outlet: null, jabatan: null,
  tanggal_lahir: null, no_rek: null, no_hp: null, sisa_cuti: 18,
}

const BINA_FIELD_MAPPING: Record<string, string> = {
  'NPP': 'npp', 'Nama': 'nama', 'Outlet': 'outlet',
  'Jabatan': 'jabatan', 'Tanggal Lahir': 'tanggal_lahir',
  'No Rekening': 'no_rek', 'No HP': 'no_hp',
}

const TEMPLATE_HEADERS = ['NPP','Nama','Outlet','Jabatan','Tanggal Lahir','No Rekening','No HP']

export default function BinaPage() {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<BinaInsert>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)

  const { data = [], isLoading } = useBina(search)
  const { data: outlets = [] } = useReferensi('OUTLET')
  const { data: jabatans = [] } = useReferensi('JABATAN_BINA')

  const addMutation    = useAddBina()
  const updateMutation = useUpdateBina()
  const deleteMutation = useDeleteBina()
  const bulkInsert     = useBulkInsertBina()

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModalOpen(true) }
  const openEdit = (b: Bina) => { setForm({ ...b }); setEditId(b.id); setModalOpen(true) }

  const handleSave = async () => {
    if (editId) { await updateMutation.mutateAsync({ id: editId, payload: form }) }
    else        { await addMutation.mutateAsync(form) }
    setModalOpen(false)
  }

  const handleDelete = async () => {
    if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) }
  }

  const handleImport = async (rows: Record<string, unknown>[]) => {
    const mapped = rows.map(r => ({
      ...EMPTY,
      npp: String(r.npp ?? ''),
      nama: String(r.nama ?? ''),
      outlet: r.outlet ? String(r.outlet) : null,
      jabatan: r.jabatan ? String(r.jabatan) : null,
      tanggal_lahir: r.tanggal_lahir ? String(r.tanggal_lahir) : null,
      no_rek: r.no_rek ? String(r.no_rek) : null,
      no_hp: r.no_hp ? String(r.no_hp) : null,
      sisa_cuti: 18,
    }))
    await bulkInsert.mutateAsync(mapped)
  }

  const handleExportXLSX = () => {
    exportToXLSX(data.map(b => ({
      NPP: b.npp, Nama: b.nama, Outlet: b.outlet,
      Jabatan: b.jabatan, 'Tgl Lahir': formatDate(b.tanggal_lahir),
      'No Rek': b.no_rek, 'No HP': b.no_hp,
    })), 'Master_Bina')
  }

  const handleExportPDF = () => {
    exportToPDF(
      data.map(b => ({ ...b, tanggal_lahir: formatDate(b.tanggal_lahir) })) as unknown as Record<string, unknown>[],
      [
        { header: 'NPP', dataKey: 'npp' },
        { header: 'Nama', dataKey: 'nama' },
        { header: 'Outlet', dataKey: 'outlet' },
        { header: 'Jabatan', dataKey: 'jabatan' },
        { header: 'Tgl Lahir', dataKey: 'tanggal_lahir' },
        { header: 'No HP', dataKey: 'no_hp' },
      ],
      'Master Data Bina',
      'Master_Bina'
    )
  }

  const isBusy = addMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B3440] flex items-center gap-2">
            <UserCheck size={24} className="text-orange-500" /> Master Bina
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Kelola data karyawan Bina secara terpisah</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" icon={<FileText size={14} />} onClick={() => setImportOpen(true)}>
            Import
          </Button>
          <Button variant="outline" size="sm" icon={<FileSpreadsheet size={14} />} onClick={handleExportXLSX}>
            Excel
          </Button>
          <Button variant="outline" size="sm" icon={<FileDown size={14} />} onClick={handleExportPDF}>
            PDF
          </Button>
          <Button variant="secondary" size="sm" icon={<Plus size={15} />} onClick={openAdd}>
            Tambah
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Cari NPP, nama, jabatan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
        <div className="text-xs text-[#64748B] self-center px-3 py-1.5 bg-white rounded-xl border border-gray-200 font-medium">
          {data.length} data
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={data as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="Belum ada data Bina"
        emptyIcon={<UserCheck size={40} className="text-gray-200" />}
        columns={[
          { key: 'npp', header: 'NPP', width: 'w-28' },
          { key: 'nama', header: 'Nama', render: (r) => <span className="font-semibold">{String(r.nama)}</span> },
          { key: 'outlet', header: 'Outlet' },
          { key: 'jabatan', header: 'Jabatan', render: (r) => (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
              {String(r.jabatan)}
            </span>
          )},
          { key: 'tanggal_lahir', header: 'Tgl Lahir', render: (r) => formatDate(String(r.tanggal_lahir)) },
          { key: 'no_hp', header: 'No HP' },
        ]}
        actions={(row) => (
          <>
            <button onClick={() => openEdit(row as unknown as Bina)} className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors">
              <Edit2 size={14} />
            </button>
            <button onClick={() => setDeleteId(String(row.id))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Data Bina' : 'Tambah Data Bina Baru'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="secondary" loading={isBusy} onClick={handleSave}>
              {editId ? 'Simpan Perubahan' : 'Tambah Bina'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="NPP" value={form.npp} onChange={e => setForm(f => ({ ...f, npp: e.target.value }))} placeholder="Nomor Pokok Pegawai" />
          <Input label="Nama Lengkap" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Nama karyawan Bina" />

          <Select
            label="Outlet"
            value={form.outlet || ''}
            onChange={e => setForm(f => ({ ...f, outlet: e.target.value }))}
            options={outlets.map(o => ({ value: o.nama_referensi, label: o.nama_referensi }))}
            placeholder="-- Pilih Outlet --"
          />
          <Select
            label="Jabatan"
            value={form.jabatan || ''}
            onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
            options={jabatans.map(j => ({ value: j.nama_referensi, label: j.nama_referensi }))}
            placeholder="-- Pilih Jabatan --"
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Tanggal Lahir</label>
            <DatePicker
              selected={form.tanggal_lahir ? new Date(form.tanggal_lahir) : null}
              onChange={(date: Date | null) => setForm(f => ({ ...f, tanggal_lahir: date ? date.toISOString().split('T')[0] : '' }))}
              dateFormat="dd MMMM yyyy"
              placeholderText="Pilih tanggal lahir"
              showYearDropdown
              yearDropdownItemNumber={60}
              scrollableYearDropdown
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#2B3440] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <Input label="No. Rekening" value={form.no_rek || ''} onChange={e => setForm(f => ({ ...f, no_rek: e.target.value }))} placeholder="Nomor rekening bank" />
          <Input label="No. HP" value={form.no_hp || ''} onChange={e => setForm(f => ({ ...f, no_hp: e.target.value }))} placeholder="08xx-xxxx-xxxx" type="tel" />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-[#64748B]">Apakah Anda yakin ingin menghapus data Bina ini?</p>
      </Modal>

      {/* Import Modal */}
      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        title="Import Data Bina"
        templateHeaders={TEMPLATE_HEADERS}
        templateFilename="Template_Bina"
        fieldMapping={BINA_FIELD_MAPPING}
        requiredFields={['npp', 'nama']}
      />
    </div>
  )
}
