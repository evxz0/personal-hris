import { useState } from 'react'
import { Plus, Search, Trash2, CalendarOff, FileDown, FileText, Edit2, UserCheck } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useAbsensi, useAddAbsensi, useDeleteAbsensi, useBulkDeleteAbsensi, useBulkInsertAbsensi, useUpdateAbsensi, type AbsensiInsert } from '../hooks/useAbsensi'
import { useKaryawan } from '../hooks/useKaryawan'
import { ImportModal } from '../components/ui/ImportModal'
import { ImportDropdown, type ImportMode } from '../components/ui/ImportDropdown'
import { exportToXLSX, exportToPDF } from '../lib/importExport'
import { DataTable } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { formatDate, calculateDays } from '../lib/utils'

const EMPTY: AbsensiInsert = {
  npp: '', jenis: 'SAKIT', tanggal_mulai: '', tanggal_selesai: '', keterangan: ''
}

const ABSENSI_FIELD_MAPPING: Record<string, string> = {
  'NPP': 'npp', 'Nama': 'nama', 'NIK': 'nik',
  'TTL': 'ttl', 'Tempat Tanggal Lahir': 'ttl',
  'Jenis Kelamin': 'jenis_kelamin', 'Alamat': 'alamat', 'Agama': 'agama',
  'Jenis': 'jenis', 'Tgl Mulai': 'tanggal_mulai', 
  'Tgl Selesai': 'tanggal_selesai', 'Keterangan': 'keterangan'
}
const TEMPLATE_HEADERS = ['NPP', 'Nama', 'NIK', 'TTL', 'Jenis Kelamin', 'Alamat', 'Agama', 'Jenis', 'Tgl Mulai', 'Tgl Selesai', 'Keterangan']

export default function AbsensiPage() {
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState<'ALL'|'SAKIT'|'CUTI'>('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('excel')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [form, setForm] = useState<AbsensiInsert>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: rawData = [], isLoading } = useAbsensi(search)
  const { data: allKaryawan = [] } = useKaryawan()
  const addMutation    = useAddAbsensi()
  const updateMutation = useUpdateAbsensi()
  const deleteMutation = useDeleteAbsensi()
  const bulkDeleteMutation = useBulkDeleteAbsensi()
  const bulkInsert     = useBulkInsertAbsensi()
  const data = filterJenis === 'ALL' ? rawData : rawData.filter(a => a.jenis === filterJenis)
  const sortedKaryawan = [...allKaryawan].sort((a, b) => (a.nama || '').localeCompare(b.nama || ''))
  const selectedKaryawan = allKaryawan.find(k => k.npp === form.npp)

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModalOpen(true) }
  
  const openEdit = (abs: any) => {
    setForm({
      npp: abs.npp,
      jenis: abs.jenis,
      tanggal_mulai: abs.tanggal_mulai,
      tanggal_selesai: abs.tanggal_selesai,
      keterangan: abs.keterangan || ''
    })
    setEditId(abs.id)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (editId) {
      await updateMutation.mutateAsync({ id: editId, payload: form })
    } else {
      await addMutation.mutateAsync(form)
    }
    setModalOpen(false)
    setForm(EMPTY)
    setEditId(null)
  }

  const handleDelete = async () => {
    if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) }
  }

  const handleBulkDelete = async (ids: string[]) => {
    if (confirm(`Apakah Anda yakin ingin menghapus ${ids.length} data absensi terpilih?`)) {
      await bulkDeleteMutation.mutateAsync(ids)
      setSelectedIds([])
    }
  }

  const handleImport = async (rows: Record<string, unknown>[]) => {
    const mapped = rows.map(r => ({
      ...EMPTY,
      npp: String(r.npp ?? ''),
      jenis: (String(r.jenis ?? 'SAKIT').toUpperCase() === 'CUTI' ? 'CUTI' : 'SAKIT') as 'SAKIT'|'CUTI',
      tanggal_mulai: r.tanggal_mulai ? String(r.tanggal_mulai) : null,
      tanggal_selesai: r.tanggal_selesai ? String(r.tanggal_selesai) : null,
      keterangan: String(r.keterangan ?? ''),
    }))
    // filter out null dates so we don't crash Supabase
    const validMapped = mapped.filter(m => m.tanggal_mulai && m.tanggal_selesai)
    await bulkInsert.mutateAsync(validMapped as any)
  }

  const handleExportXLSX = () => {
    exportToXLSX(data.map(a => ({
      NPP: a.npp, Nama: getNama(a.npp), Jenis: a.jenis, 
      'Tgl Mulai': formatDate(a.tanggal_mulai), 'Tgl Selesai': formatDate(a.tanggal_selesai),
      'Durasi': calculateDays(a.tanggal_mulai, a.tanggal_selesai),
      'Sisa Cuti': a.jenis === 'CUTI' ? getSisaCuti(a.npp) : '-',
      Keterangan: a.keterangan || '-'
    })), 'Data_Absensi')
  }

  const handleExportPDF = () => {
    exportToPDF(
      data.map(a => ({
        ...a,
        tanggal_mulai: formatDate(a.tanggal_mulai),
        tanggal_selesai: formatDate(a.tanggal_selesai),
        nama: getNama(a.npp),
        sisa_cuti: a.jenis === 'CUTI' ? getSisaCuti(a.npp) : '-'
      })) as unknown as Record<string, unknown>[],
      [
        { header: 'NPP', dataKey: 'npp' },
        { header: 'Nama', dataKey: 'nama' },
        { header: 'Jenis', dataKey: 'jenis' },
        { header: 'Mulai', dataKey: 'tanggal_mulai' },
        { header: 'Selesai', dataKey: 'tanggal_selesai' },
        { header: 'Sisa Cuti', dataKey: 'sisa_cuti' },
        { header: 'Keterangan', dataKey: 'keterangan' }
      ],
      'Laporan Absensi Karyawan',
      'Data_Absensi'
    )
  }

  const getNama = (npp: string) => {
    const k = allKaryawan.find(x => x.npp === npp)
    if (k) return k.nama
    return '-'
  }

  const getSisaCuti = (npp: string) => {
    const k = allKaryawan.find(x => x.npp === npp)
    if (k) return k.sisa_cuti ?? 18
    return '-'
  }

  const jumlahHari = calculateDays(form.tanggal_mulai, form.tanggal_selesai)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B3440] flex items-center gap-2">
            <CalendarOff size={24} className="text-red-500" /> Absensi
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Pencatatan izin sakit & cuti karyawan</p>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Cari NPP, keterangan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL','SAKIT','CUTI'] as const).map(j => (
            <button
              key={j}
              onClick={() => setFilterJenis(j)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${filterJenis === j ? 'bg-teal-600 text-white shadow-sm' : 'bg-white text-[#64748B] border border-gray-200 hover:border-teal-400'}`}
            >
              {j === 'ALL' ? 'Semua' : j}
            </button>
          ))}
        </div>
        <div className="text-xs text-[#64748B] self-center px-3 py-1.5 bg-white rounded-xl border border-gray-200 font-medium whitespace-nowrap">
          {data.length} catatan
        </div>
      </div>

      <DataTable
        tableId="master_absensi"
        data={data as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyMessage="Belum ada catatan absensi"
        emptyIcon={<CalendarOff size={40} className="text-gray-200" />}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkDelete={handleBulkDelete}
        columns={[
          { key: 'npp', header: 'NPP', width: 'w-24' },
          { key: 'nama', header: 'Nama', render: r => {
            const str = getNama(String(r.npp))
            const words = str.trim().split(/\s+/).filter(Boolean)
            const isNoWrap = words.length <= 3
            return (
              <span className={`font-semibold text-[#2B3440] ${isNoWrap ? 'whitespace-nowrap' : 'break-words max-w-[200px]'}`}>
                {str}
              </span>
            )
          }},
          { key: 'jenis', header: 'Jenis', render: r => (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${r.jenis === 'SAKIT' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {String(r.jenis)}
            </span>
          )},
          { key: 'alamat', header: 'Alamat', render: r => <span className="text-xs text-[#475569] max-w-[240px] inline-block truncate" title={String(r.alamat || r.rumah || '-')}>{String(r.alamat || r.rumah || '-')}</span> },
          { key: 'tanggal_mulai', header: 'Tgl Mulai', render: r => <span className="whitespace-nowrap">{formatDate(String(r.tanggal_mulai))}</span> },
          { key: 'tanggal_selesai', header: 'Tgl Selesai', render: r => <span className="whitespace-nowrap">{formatDate(String(r.tanggal_selesai))}</span> },
          { key: 'durasi', header: 'Durasi', render: r => {
            const d = calculateDays(String(r.tanggal_mulai), String(r.tanggal_selesai))
            return <span className="font-bold text-teal-700">{d} hari</span>
          }},
          { key: 'sisa_cuti', header: 'Sisa Cuti', render: r => {
            if (r.jenis !== 'CUTI') return <span className="text-[#94A3B8]">-</span>
            const sisa = getSisaCuti(String(r.npp))
            return <span className="font-bold text-orange-600">{sisa} hari</span>
          }},
          { key: 'keterangan', header: 'Keterangan', render: r => (
            <span className="text-[#64748B] text-xs">{String(r.keterangan) || '-'}</span>
          )},
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
        onClose={() => { setModalOpen(false); setForm(EMPTY); setEditId(null) }}
        title={editId ? "Ubah Catatan Absensi" : "Catat Absensi Karyawan"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" loading={addMutation.isPending || updateMutation.isPending} onClick={handleSave}>
              Simpan Absensi
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Dropdown Pilih Karyawan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B3440] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck size={14} className="text-teal-600" />
                Pilih Nama Karyawan <span className="text-red-500">*</span>
              </span>
              {selectedKaryawan && (
                <span className="text-[11px] font-normal text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  NPP: {selectedKaryawan.npp} {selectedKaryawan.kategori ? `· ${selectedKaryawan.kategori}` : ''}
                </span>
              )}
            </label>
            <select
              value={form.npp}
              onChange={e => setForm(f => ({ ...f, npp: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 bg-white font-medium text-[#2B3440]"
            >
              <option value="">-- Pilih Nama Karyawan --</option>
              {sortedKaryawan.map(k => (
                <option key={k.id || k.npp} value={k.npp}>
                  {k.nama} ({k.npp}) {k.jabatan ? `- ${k.jabatan}` : ''} {k.kategori ? `[${k.kategori}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Info Card Karyawan Terpilih */}
          {selectedKaryawan && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50/70 border border-teal-100 text-xs animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center shrink-0">
                {selectedKaryawan.nama ? selectedKaryawan.nama.charAt(0).toUpperCase() : 'K'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-teal-950 truncate">{selectedKaryawan.nama}</p>
                <p className="text-[#64748B] truncate">
                  NPP: <span className="font-semibold text-teal-800">{selectedKaryawan.npp}</span> · {selectedKaryawan.jabatan || 'Staff'} · {selectedKaryawan.outlet || 'Pontianak'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] text-teal-700 block">Sisa Cuti:</span>
                <span className="font-bold text-orange-600">{getSisaCuti(selectedKaryawan.npp)} hari</span>
              </div>
            </div>
          )}

          <Select
            label="Jenis Absensi"
            value={form.jenis}
            onChange={e => setForm(f => ({ ...f, jenis: e.target.value as 'SAKIT'|'CUTI' }))}
            options={[{ value: 'SAKIT', label: 'Sakit' }, { value: 'CUTI', label: 'Cuti' }]}
          />

          <div className="grid grid-cols-2 gap-4">
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
                minDate={form.tanggal_mulai ? new Date(form.tanggal_mulai) : undefined}
                placeholderText="Pilih tanggal selesai"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          {jumlahHari > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-[#F4F7F6]">
              <CalendarOff size={16} className="text-teal-600 shrink-0" />
              <span className="text-sm text-[#64748B]">Durasi: <strong className="text-teal-700">{jumlahHari} hari</strong>
                {form.jenis === 'CUTI' && <span className="text-xs text-orange-600 ml-2">· Sisa cuti akan otomatis berkurang</span>}
              </span>
            </div>
          )}

          <Textarea
            label="Keterangan (opsional)"
            value={form.keterangan}
            onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
            placeholder="Tambahkan catatan atau keterangan..."
          />
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Catatan Absensi" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-[#64748B]">Hapus catatan absensi ini? Sisa cuti tidak akan dipulihkan secara otomatis.</p>
      </Modal>

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        title="Import Data Absensi"
        templateHeaders={TEMPLATE_HEADERS}
        templateFilename="Template_Absensi"
        fieldMapping={ABSENSI_FIELD_MAPPING}
        requiredFields={['npp', 'jenis', 'tanggal_mulai', 'tanggal_selesai']}
        initialMode={importMode}
      />
    </div>
  )
}
