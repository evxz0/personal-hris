import { Plus, Search, Edit2, Trash2, UserCheck, FileDown, FileText, ArrowRightLeft } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useKaryawan, useAddKaryawan, useUpdateKaryawan, useDeleteKaryawan, useBulkDeleteKaryawan, useBulkInsertKaryawan, type Karyawan, type KaryawanInsert } from '../hooks/useKaryawan'
import { useAddMutasi } from '../hooks/useMutasi'
import { useReferensi } from '../hooks/useReferensi'
import { DataTable } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea, MultiSelect } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ImportModal } from '../components/ui/ImportModal'
import { ImportDropdown, type ImportMode } from '../components/ui/ImportDropdown'
import { exportToXLSX, exportToPDF } from '../lib/importExport'
import { formatDate } from '../lib/utils'
import { useState, useEffect } from 'react'

const EMPTY: KaryawanInsert = {
  npp: '', nama: '', kategori: 'BINA', outlet: null, tanggal_lahir: null,
  posisi_saat_ini: null, jenjang: null, jabatan: null, grade: null,
  nik: null, npp_digi_hc: null, npp_webmail: null,
  jenis_kelamin: null, tanggal_mulai: null, tanggal_berakhir: null, kd_wil: null, batch: null,
  no_rek: null, no_hp: null, sisa_cuti: 18,
}

const parseDateStringToISO = (val: any): string | null => {
  if (!val) return null
  const str = String(val).trim()
  if (!str) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str
  }

  const dmyMatch = str.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/)
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch
    const formattedDay = day.padStart(2, '0')
    const formattedMonth = month.padStart(2, '0')
    return `${year}-${formattedMonth}-${formattedDay}`
  }

  if (/^\d+(\.\d+)?$/.test(str)) {
    const num = Number(str)
    if (num > 20000 && num < 60000) {
      const date = new Date((num - 25569) * 86400 * 1000)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    }
  }

  try {
    const parsed = new Date(str)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  } catch (e) {
    // Ignore
  }
  return null
}

const BINA_FIELD_MAPPING: Record<string, string> = {
  'NPP': 'npp', 'Nama': 'nama', 'NIK': 'nik',
  'TTL': 'ttl', 'Tempat Tanggal Lahir': 'ttl',
  'Jenis Kelamin': 'jenis_kelamin', 'Alamat': 'alamat', 'Agama': 'agama',
  'Outlet': 'outlet', 'Tanggal Mulai': 'tanggal_mulai', 'Tanggal Berakhir': 'tanggal_berakhir',
  'KD Wil': 'kd_wil', 'Batch': 'batch',
}

const TEMPLATE_HEADERS = ['NPP','Nama','NIK','TTL','Jenis Kelamin','Alamat','Agama','Outlet','Tanggal Mulai','Tanggal Berakhir','KD Wil','Batch']

export default function BinaPage() {
  const [search, setSearch] = useState('')
  const [filterOutlet, setFilterOutlet] = useState<string[]>([])
  const [filterJabatan, setFilterJabatan] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('excel')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [form, setForm] = useState<KaryawanInsert>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  
  const [mutasiOpen, setMutasiOpen] = useState(false)
  const [mutasiForm, setMutasiForm] = useState({
    npp: '', nama: '', kategori: 'BINA', outlet: '', jenjang: '',
    jabatan: '', grade: 1, tanggal_lahir: '', nik: '', no_rek: '', no_hp: '',
    sisa_cuti: 18, keterangan: '', tanggal_aktif: ''
  })

  const { data: rawData = [], isLoading } = useKaryawan(search)
  const { data: outlets = [] } = useReferensi('OUTLET')
  const { data: jabatansBina = [] } = useReferensi('JABATAN_BINA')
  const { data: jenjangs = [] } = useReferensi('JENJANG')

  const addMutation      = useAddKaryawan()
  const updateMutation   = useUpdateKaryawan()
  const deleteMutation   = useDeleteKaryawan()
  const bulkDeleteMutation = useBulkDeleteKaryawan()
  const bulkInsert       = useBulkInsertKaryawan()
  const mutasiMutation   = useAddMutasi()

  // Filter BINA only
  const data = rawData
    .filter(k => k.kategori === 'BINA')
    .filter(k => {
      if (filterOutlet.length > 0 && (!k.outlet || !filterOutlet.includes(k.outlet))) return false
      if (filterJabatan.length > 0 && (!k.jabatan || !filterJabatan.includes(k.jabatan))) return false
      return true
    })

  const openAdd = () => {
    setForm({
      ...EMPTY,
      kategori: 'BINA'
    })
    setEditId(null)
    setModalOpen(true)
  }

  const openEdit = (k: Karyawan) => {
    setForm({ ...k })
    setEditId(k.id)
    setModalOpen(true)
  }

  const openMutasi = (k: Karyawan) => {
    setMutasiForm({
      npp: k.npp,
      nama: k.nama,
      kategori: k.kategori,
      outlet: k.outlet || '',
      jenjang: k.jenjang || '',
      jabatan: k.jabatan || '',
      grade: k.grade || 1,
      tanggal_lahir: k.tanggal_lahir || '',
      nik: k.nik || '',
      no_rek: k.no_rek || '',
      no_hp: k.no_hp || '',
      sisa_cuti: k.sisa_cuti || 18,
      keterangan: '',
      tanggal_aktif: ''
    })
    setMutasiOpen(true)
  }

  const handleSave = async () => {
    if (editId) {
      await updateMutation.mutateAsync({ id: editId, payload: form })
    } else {
      await addMutation.mutateAsync(form)
    }
    setModalOpen(false)
  }

  const handleSaveMutasi = async () => {
    try {
      await mutasiMutation.mutateAsync(mutasiForm)
      setMutasiOpen(false)
    } catch (err: any) {
      console.error(err)
      alert(`Gagal memproses mutasi: ${err?.message || JSON.stringify(err)}`)
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteMutation.mutateAsync(deleteId)
      } catch (err: any) {
        console.error(err)
        alert(`Gagal menghapus karyawan: ${err?.message || JSON.stringify(err)}`)
      } finally {
        setDeleteId(null)
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length > 0) {
      try {
        await bulkDeleteMutation.mutateAsync(selectedIds)
      } catch (err: any) {
        console.error(err)
        alert(`Gagal menghapus massal karyawan: ${err?.message || JSON.stringify(err)}`)
      } finally {
        setSelectedIds([])
        setBulkDeleteOpen(false)
      }
    }
  }

  useEffect(() => {
    setSelectedIds([])
  }, [search, filterOutlet, filterJabatan])

  const handleImport = async (rows: Record<string, unknown>[]) => {
    const mapped = rows.map(r => {
      let nppVal = String(r.npp ?? '').trim()
      if (!nppVal) {
        nppVal = `GEN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      }

      return {
        ...EMPTY,
        npp: nppVal,
        nama: String(r.nama ?? ''),
        kategori: 'BINA' as const,
        outlet: r.outlet ? String(r.outlet) : null,
        jenis_kelamin: r.jenis_kelamin ? String(r.jenis_kelamin) : null,
        tanggal_mulai: parseDateStringToISO(r.tanggal_mulai),
        tanggal_berakhir: parseDateStringToISO(r.tanggal_berakhir),
        kd_wil: r.kd_wil ? String(r.kd_wil) : null,
        batch: r.batch ? String(r.batch) : null,
      }
    })

    const uniqueMapped: typeof mapped = []
    const seenNpps = new Set<string>()
    for (const item of mapped) {
      if (!seenNpps.has(item.npp)) {
        seenNpps.add(item.npp)
        uniqueMapped.push(item)
      }
    }

    await bulkInsert.mutateAsync(uniqueMapped)
  }

  const handleExportXLSX = () => {
    exportToXLSX(data.map(k => ({
      NPP: k.npp,
      Nama: k.nama,
      Kategori: k.kategori,
      Outlet: k.outlet || '-',
      'Jenis Kelamin': k.jenis_kelamin || '-',
      Jabatan: k.jabatan || '-',
      'Tanggal Mulai': k.tanggal_mulai ? formatDate(k.tanggal_mulai) : '-',
      'Tanggal Berakhir': k.tanggal_berakhir ? formatDate(k.tanggal_berakhir) : '-',
      'KD Wil': k.kd_wil || '-',
      Batch: k.batch ? `Batch ${k.batch}` : '-',
    })), 'Master_Bina')
  }

  const handleExportPDF = () => {
    exportToPDF(
      data.map(k => ({
        ...k,
        tanggal_mulai: k.tanggal_mulai ? formatDate(k.tanggal_mulai) : '-',
        tanggal_berakhir: k.tanggal_berakhir ? formatDate(k.tanggal_berakhir) : '-',
        batch: k.batch ? `Batch ${k.batch}` : '-',
      })) as unknown as Record<string, unknown>[],
      [
        { header: 'NPP', dataKey: 'npp' },
        { header: 'Nama', dataKey: 'nama' },
        { header: 'Jenis Kelamin', dataKey: 'jenis_kelamin' },
        { header: 'Outlet', dataKey: 'outlet' },
        { header: 'Jabatan', dataKey: 'jabatan' },
        { header: 'Tgl Mulai', dataKey: 'tanggal_mulai' },
        { header: 'Tgl Berakhir', dataKey: 'tanggal_berakhir' },
        { header: 'Kd Wil', dataKey: 'kd_wil' },
        { header: 'Batch', dataKey: 'batch' },
      ],
      'Laporan Data Bina',
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
            <UserCheck size={24} className="text-teal-600" /> Master Bina
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Kelola data karyawan kategori BINA</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      {/* Bulk Delete Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200 animate-fade-in mb-4">
          <span className="text-sm font-semibold text-red-800">
            {selectedIds.length} data karyawan terpilih
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-100" onClick={() => setSelectedIds([])}>
              Batal
            </Button>
            <Button variant="primary" size="sm" className="bg-red-600 hover:bg-red-700 border-red-600 text-white" icon={<Trash2 size={14} />} onClick={() => setBulkDeleteOpen(true)} loading={bulkDeleteMutation.isPending}>
              Hapus Terpilih
            </Button>
          </div>
        </div>
      )}

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
        <div className="flex flex-wrap gap-2 items-center">
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
            options={jabatansBina.map(j => ({ value: j.nama_referensi, label: j.nama_referensi }))}
          />
        </div>
        <div className="text-xs text-[#64748B] self-center px-3 py-1.5 bg-white rounded-xl border border-gray-200 font-medium whitespace-nowrap">
          {data.length} data
        </div>
      </div>

      {/* Table */}
      <DataTable
        tableId="master_bina"
        data={data as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="Belum ada data karyawan Bina"
        emptyIcon={<UserCheck size={40} className="text-gray-200" />}
        columns={[
          { key: 'npp', header: 'NPP', width: 'w-28' },
          { key: 'nama', header: 'Nama', render: (r: any) => {
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
          { key: 'jenis_kelamin', header: 'Jenis Kelamin', render: (r: any) => <span>{String(r.jenis_kelamin || '-')}</span> },
          { key: 'outlet', header: 'Outlet' },
          { key: 'alamat', header: 'Alamat', render: (r: any) => <span className="text-xs text-[#475569] max-w-[240px] inline-block truncate" title={String(r.alamat || r.rumah || '-')}>{String(r.alamat || r.rumah || '-')}</span> },
          { key: 'jabatan', header: 'Jabatan' },
          { key: 'tanggal_mulai', header: 'Tgl Mulai', render: (r: any) => <span className="whitespace-nowrap">{r.tanggal_mulai ? formatDate(r.tanggal_mulai) : '-'}</span> },
          { key: 'tanggal_berakhir', header: 'Tgl Berakhir', render: (r: any) => <span className="whitespace-nowrap">{r.tanggal_berakhir ? formatDate(r.tanggal_berakhir) : '-'}</span> },
          { key: 'kd_wil', header: 'Kd Wil', render: (r: any) => <span>{String(r.kd_wil || '-')}</span> },
          { key: 'batch', header: 'Batch', render: (r: any) => <span>{r.batch ? `Batch ${r.batch}` : '-'}</span> },
        ]}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <button onClick={() => openMutasi(row as unknown as Karyawan)} title="Mutasi Karyawan" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
              <ArrowRightLeft size={14} />
            </button>
            <button onClick={() => openEdit(row as unknown as Karyawan)} className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors">
              <Edit2 size={14} />
            </button>
            <button onClick={() => setDeleteId(String(row.id))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Data Karyawan Bina' : 'Tambah Karyawan Bina Baru'}
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
            label="Outlet"
            value={form.outlet || ''}
            onChange={e => setForm(f => ({ ...f, outlet: e.target.value }))}
            options={outlets.map(o => ({ value: o.nama_referensi, label: o.nama_referensi }))}
            placeholder="-- Pilih Outlet --"
          />

          <Select
            label="Jenis Kelamin"
            value={form.jenis_kelamin || ''}
            onChange={e => setForm(f => ({ ...f, jenis_kelamin: e.target.value }))}
            options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]}
            placeholder="-- Pilih Jenis Kelamin --"
          />

          <Select
            label="Jabatan"
            value={form.jabatan || ''}
            onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
            options={jabatansBina.map(j => ({ value: j.nama_referensi, label: j.nama_referensi }))}
            placeholder="-- Pilih Jabatan --"
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Tanggal Mulai</label>
            <DatePicker
              selected={form.tanggal_mulai ? new Date(form.tanggal_mulai) : null}
              onChange={(date: Date | null) => setForm(f => ({ ...f, tanggal_mulai: date ? date.toISOString().split('T')[0] : '' }))}
              dateFormat="dd MMMM yyyy"
              placeholderText="Pilih tanggal mulai"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#2B3440] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Tanggal Berakhir</label>
            <DatePicker
              selected={form.tanggal_berakhir ? new Date(form.tanggal_berakhir) : null}
              onChange={(date: Date | null) => setForm(f => ({ ...f, tanggal_berakhir: date ? date.toISOString().split('T')[0] : '' }))}
              dateFormat="dd MMMM yyyy"
              placeholderText="Pilih tanggal berakhir"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#2B3440] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <Input label="KD Wil" value={form.kd_wil || ''} onChange={e => setForm(f => ({ ...f, kd_wil: e.target.value }))} placeholder="Kode Wilayah" />

          <Select
            label="Batch"
            value={form.batch || ''}
            onChange={e => setForm(f => ({ ...f, batch: e.target.value }))}
            options={[{ value: '1', label: 'Batch 1' }, { value: '2', label: 'Batch 2' }]}
            placeholder="-- Pilih Batch --"
          />
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

      {/* Bulk Delete Confirm */}
      <Modal isOpen={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} title="Konfirmasi Hapus Massal" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBulkDeleteOpen(false)}>Batal</Button>
            <Button variant="danger" loading={bulkDeleteMutation.isPending} onClick={handleBulkDelete}>Hapus Semua ({selectedIds.length})</Button>
          </>
        }
      >
        <p className="text-sm text-[#64748B]">Apakah Anda yakin ingin menghapus <strong>{selectedIds.length}</strong> data karyawan terpilih? Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>

      {/* Import Modal */}
      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        title="Import Data Karyawan Bina"
        templateHeaders={TEMPLATE_HEADERS}
        templateFilename="Template_Bina"
        fieldMapping={BINA_FIELD_MAPPING}
        requiredFields={['nama']}
        initialMode={importMode}
      />

      {/* Mutasi Modal */}
      <Modal
        isOpen={mutasiOpen}
        onClose={() => setMutasiOpen(false)}
        title="Mutasi Karyawan"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setMutasiOpen(false)}>Batal</Button>
            <Button variant="primary" loading={mutasiMutation.isPending} onClick={handleSaveMutasi}>
              Proses Mutasi
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm">
            <div>
              <span className="text-gray-500">NPP:</span> <span className="font-bold text-[#2B3440]">{mutasiForm.npp}</span>
            </div>
            <div>
              <span className="text-gray-500">Nama:</span> <span className="font-bold text-[#2B3440]">{mutasiForm.nama}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Outlet Baru"
              value={mutasiForm.outlet}
              onChange={e => setMutasiForm(f => ({ ...f, outlet: e.target.value }))}
              options={outlets.map(o => ({ value: o.nama_referensi, label: o.nama_referensi }))}
              placeholder="-- Pilih Outlet Baru --"
            />
            <Select
              label="Jabatan Baru"
              value={mutasiForm.jabatan}
              onChange={e => setMutasiForm(f => ({ ...f, jabatan: e.target.value }))}
              options={jabatansBina.map(j => ({ value: j.nama_referensi, label: j.nama_referensi }))}
              placeholder="-- Pilih Jabatan Baru --"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Jenjang Baru"
              value={mutasiForm.jenjang}
              onChange={e => setMutasiForm(f => ({ ...f, jenjang: e.target.value }))}
              options={jenjangs.map(j => ({ value: j.nama_referensi, label: j.nama_referensi }))}
              placeholder="-- Pilih Jenjang Baru --"
            />
            <Select
              label="Grade Baru"
              value={mutasiForm.grade}
              onChange={e => setMutasiForm(f => ({ ...f, grade: Number(e.target.value) }))}
              options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Grade ${i + 1}` }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Tanggal Aktif (Masa Berlaku)</label>
              <DatePicker
                selected={mutasiForm.tanggal_aktif ? new Date(mutasiForm.tanggal_aktif) : null}
                onChange={(date: Date | null) => setMutasiForm(f => ({ ...f, tanggal_aktif: date ? date.toISOString().split('T')[0] : '' }))}
                dateFormat="dd MMMM yyyy"
                placeholderText="Pilih tanggal aktif mutasi"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#2B3440] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          <Textarea
            label="Keterangan Mutasi"
            value={mutasiForm.keterangan}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMutasiForm(f => ({ ...f, keterangan: e.target.value }))}
            placeholder="Alasan mutasi/keterangan tambahan..."
          />
        </div>
      </Modal>
    </div>
  )
}
