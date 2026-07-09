import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Users, FileSpreadsheet, FileDown, FileText } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useKaryawan, useAddKaryawan, useUpdateKaryawan, useDeleteKaryawan, useBulkInsertKaryawan, type Karyawan, type KaryawanInsert } from '../hooks/useKaryawan'
import { useReferensi } from '../hooks/useReferensi'
import { DataTable } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ImportModal } from '../components/ui/ImportModal'
import { exportToXLSX, exportToPDF } from '../lib/importExport'
import { formatDate } from '../lib/utils'

const EMPTY: KaryawanInsert = {
  npp: '', nama: '', kategori: 'FTE', outlet: null, tanggal_lahir: null,
  posisi_saat_ini: null, jenjang: null, jabatan: null, grade: null,
  nik: null, no_rek: null, no_hp: null, sisa_cuti: 18,
}

const KARYAWAN_FIELD_MAPPING: Record<string, string> = {
  'NPP': 'npp', 'Nama': 'nama', 'Kategori': 'kategori',
  'Outlet': 'outlet', 'Tanggal Lahir': 'tanggal_lahir',
  'Posisi Saat Ini': 'posisi_saat_ini',
  'Jabatan': 'jabatan', 'Grade': 'grade', 'NIK': 'nik',
  'No Rekening': 'no_rek', 'No HP': 'no_hp',
}

const TEMPLATE_HEADERS = ['NPP','Nama','Kategori','Outlet','Tanggal Lahir','Posisi Saat Ini','Jabatan','Grade','NIK','No Rekening','No HP']

export default function KaryawanPage() {
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState<'ALL'|'FTE'|'TAD'>('ALL')
  const [filterOutlet, setFilterOutlet] = useState('ALL')
  const [filterJabatan, setFilterJabatan] = useState('ALL')
  const [filterGrade, setFilterGrade] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<KaryawanInsert>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: rawData = [], isLoading } = useKaryawan(search)
  const { data: outlets = [] } = useReferensi('OUTLET')
  const { data: jabatans = [] } = useReferensi('JABATAN_KARYAWAN')

  const addMutation      = useAddKaryawan()
  const updateMutation   = useUpdateKaryawan()
  const deleteMutation   = useDeleteKaryawan()
  const bulkInsert       = useBulkInsertKaryawan()

  const data = rawData.filter(k => {
    if (filterKategori !== 'ALL' && k.kategori !== filterKategori) return false
    if (filterOutlet !== 'ALL' && k.outlet !== filterOutlet) return false
    if (filterJabatan !== 'ALL' && k.jabatan !== filterJabatan) return false
    if (filterGrade !== 'ALL' && String(k.grade) !== filterGrade) return false
    return true
  })

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModalOpen(true) }
  const openEdit = (k: Karyawan) => {
    setForm({ ...k })
    setEditId(k.id)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (editId) {
      await updateMutation.mutateAsync({ id: editId, payload: form })
    } else {
      await addMutation.mutateAsync(form)
    }
    setModalOpen(false)
  }

  const handleDelete = async () => {
    if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) }
  }

  const handleImport = async (rows: Record<string, unknown>[]) => {
    const mapped = rows.map(r => {
      const gradeRaw = r.grade ? Number(r.grade) : null
      const validGrade = gradeRaw && gradeRaw >= 1 && gradeRaw <= 12 ? gradeRaw : null
      return {
        ...EMPTY,
        npp: String(r.npp ?? ''),
        nama: String(r.nama ?? ''),
        kategori: (String(r.kategori ?? 'FTE').toUpperCase() === 'TAD' ? 'TAD' : 'FTE') as 'FTE'|'TAD',
        outlet: r.outlet ? String(r.outlet) : null,
        tanggal_lahir: r.tanggal_lahir ? String(r.tanggal_lahir) : null,
        posisi_saat_ini: r.posisi_saat_ini ? String(r.posisi_saat_ini) : null,
        jenjang: null, // Jenjang removed from UI
        jabatan: r.jabatan ? String(r.jabatan) : null,
        grade: validGrade,
        nik: r.nik ? String(r.nik) : null,
        no_rek: r.no_rek ? String(r.no_rek) : null,
        no_hp: r.no_hp ? String(r.no_hp) : null,
        sisa_cuti: 18,
      }
    })
    await bulkInsert.mutateAsync(mapped)
  }

  const handleExportXLSX = () => {
    exportToXLSX(data.map(k => ({
      NPP: k.npp, Nama: k.nama, Kategori: k.kategori,
      Outlet: k.outlet, 'Tgl Lahir': formatDate(k.tanggal_lahir),
      'Posisi': k.posisi_saat_ini,
      Jabatan: k.jabatan, Grade: k.grade, NIK: k.nik,
      'No Rek': k.no_rek, 'No HP': k.no_hp,
    })), 'Master_Karyawan')
  }

  const handleExportPDF = () => {
    exportToPDF(
      data.map(k => ({ ...k, tanggal_lahir: formatDate(k.tanggal_lahir) })) as unknown as Record<string, unknown>[],
      [
        { header: 'NPP', dataKey: 'npp' },
        { header: 'Nama', dataKey: 'nama' },
        { header: 'Kategori', dataKey: 'kategori' },
        { header: 'Outlet', dataKey: 'outlet' },
        { header: 'Jabatan', dataKey: 'jabatan' },
        { header: 'Grade', dataKey: 'grade' },
        { header: 'Tgl Lahir', dataKey: 'tanggal_lahir' },
      ],
      'Master Data Karyawan (FTE & TAD)',
      'Master_Karyawan'
    )
  }

  const isBusy = addMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B3440] flex items-center gap-2">
            <Users size={24} className="text-teal-600" /> Master Karyawan
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Kelola data karyawan FTE & TAD</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<FileSpreadsheet size={15} />} onClick={() => setImportOpen(true)}>
            Import
          </Button>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Cari NPP, nama, jabatan..."
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
          {data.length} data
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={data as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="Belum ada data karyawan"
        emptyIcon={<Users size={40} className="text-gray-200" />}
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
          <>
            <button
              onClick={() => openEdit(row as unknown as Karyawan)}
              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => setDeleteId(String(row.id))}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" loading={isBusy} onClick={handleSave}>
              {editId ? 'Simpan Perubahan' : 'Tambah Karyawan'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="NPP" value={form.npp} onChange={e => setForm(f => ({ ...f, npp: e.target.value }))} placeholder="Contoh: 12345" />
          <Input label="Nama Lengkap" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Nama karyawan" />

          <Select
            label="Kategori"
            value={form.kategori}
            onChange={e => setForm(f => ({ ...f, kategori: e.target.value as 'FTE'|'TAD' }))}
            options={[{ value: 'FTE', label: 'FTE' }, { value: 'TAD', label: 'TAD' }]}
          />
          <Select
            label="Outlet"
            value={form.outlet || ''}
            onChange={e => setForm(f => ({ ...f, outlet: e.target.value }))}
            options={outlets.map(o => ({ value: o.nama_referensi, label: o.nama_referensi }))}
            placeholder="-- Pilih Outlet --"
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

          <Input label="Posisi Saat Ini" value={form.posisi_saat_ini || ''} onChange={e => setForm(f => ({ ...f, posisi_saat_ini: e.target.value }))} placeholder="Jabatan/posisi aktif" />

          <Select
            label="Jabatan"
            value={form.jabatan || ''}
            onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
            options={jabatans.map(j => ({ value: j.nama_referensi, label: j.nama_referensi }))}
            placeholder="-- Pilih Jabatan --"
          />

          <Select
            label="Grade"
            value={form.grade || ''}
            onChange={e => setForm(f => ({ ...f, grade: Number(e.target.value) }))}
            options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Grade ${i + 1}` }))}
          />
          <Input label="NIK" value={form.nik || ''} onChange={e => setForm(f => ({ ...f, nik: e.target.value }))} placeholder="Nomor Induk Kependudukan" type="number" />
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
        <p className="text-sm text-[#64748B]">Apakah Anda yakin ingin menghapus data karyawan ini? Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>

      {/* Import Modal */}
      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        title="Import Data Karyawan"
        templateHeaders={TEMPLATE_HEADERS}
        templateFilename="Template_Karyawan"
        fieldMapping={KARYAWAN_FIELD_MAPPING}
        requiredFields={['npp', 'nama']}
      />
    </div>
  )
}
