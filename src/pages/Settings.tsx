import { useState, useEffect } from 'react'
import { Settings, Plus, Trash2, Tag, Edit2, CalendarClock, RotateCcw, CheckCircle2, ShieldCheck, Sparkles, Clock, AlertTriangle } from 'lucide-react'
import { useReferensi, useAddReferensi, useUpdateReferensi, useDeleteReferensi, type KategoriReferensi } from '../hooks/useReferensi'
import { useCutiConfig, type CutiConfig } from '../hooks/useCutiSettings'
import { useKaryawan } from '../hooks/useKaryawan'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { formatDate } from '../lib/utils'

const KATEGORI_CONFIG: { key: KategoriReferensi; label: string; color: string; desc: string }[] = [
  { key: 'OUTLET', label: 'Master Outlet', color: 'bg-purple-50 border-purple-200 text-purple-700', desc: 'Daftar outlet, cabang, dan unit kerja yang tersedia' },
]

function ReferensiCard({ kategori, label, color, desc }: { kategori: KategoriReferensi; label: string; color: string; desc: string }) {
  const { data = [], isLoading } = useReferensi(kategori)
  const addMutation = useAddReferensi()
  const updateMutation = useUpdateReferensi()
  const deleteMutation = useDeleteReferensi()
  
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<{ id: string; name: string } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [newValue, setNewValue] = useState('')

  const handleAdd = async () => {
    if (!newValue.trim()) return
    await addMutation.mutateAsync({ kategori, nama_referensi: newValue.trim().toUpperCase() })
    setNewValue('')
    setAddOpen(false)
  }

  const handleEdit = async () => {
    if (!editItem || !editItem.name.trim()) return
    await updateMutation.mutateAsync({ id: editItem.id, nama_referensi: editItem.name.trim().toUpperCase() })
    setEditItem(null)
  }

  const handleDelete = async () => {
    if (deleteId) { 
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null) 
    }
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden border-gray-200">
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between border-b ${color.split(' ')[1]}`}>
        <div>
          <div className="flex items-center gap-2">
            <Tag size={15} className={color.split(' ')[2]} />
            <h3 className={`font-bold text-base ${color.split(' ')[2]}`}>{label}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${color}`}>{data.length} Outlet</span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">{desc}</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setAddOpen(true)}>
          Tambah Outlet
        </Button>
      </div>

      {/* List */}
      <div className="p-5">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#64748B]">Belum ada data outlet. Klik tombol Tambah Outlet untuk menambahkan.</div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {data.map(item => (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${color.split(' ')[1]} ${color.split(' ')[0]} group hover:shadow-xs transition-all`}
              >
                <span className={`text-sm font-semibold ${color.split(' ')[2]}`}>{item.nama_referensi}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <button
                    title="Ubah nama outlet"
                    onClick={() => setEditItem({ id: item.id, name: item.nama_referensi })}
                    className={`p-1 rounded-md hover:bg-white/80 ${color.split(' ')[2]} hover:text-teal-600 transition-colors`}
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    title="Hapus outlet"
                    onClick={() => setDeleteId(item.id)}
                    className={`p-1 rounded-md hover:bg-white/80 ${color.split(' ')[2]} hover:text-red-500 transition-colors`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={addOpen}
        onClose={() => { setAddOpen(false); setNewValue('') }}
        title={`Tambah ${label}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setAddOpen(false); setNewValue('') }}>Batal</Button>
            <Button variant="primary" loading={addMutation.isPending} onClick={handleAdd}>Tambah Outlet</Button>
          </>
        }
      >
        <Input
          label={`Nama ${label}`}
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          placeholder="Contoh: KCU PONTIANAK / KCP KUBURAYA"
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={`Ubah Nama ${label}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditItem(null)}>Batal</Button>
            <Button variant="primary" loading={updateMutation.isPending} onClick={handleEdit}>Simpan Perubahan</Button>
          </>
        }
      >
        <Input
          label={`Nama ${label}`}
          value={editItem?.name || ''}
          onChange={e => setEditItem(prev => prev ? { ...prev, name: e.target.value } : null)}
          placeholder="Ketik nama outlet baru..."
          onKeyDown={e => { if (e.key === 'Enter') handleEdit() }}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        title="Hapus Referensi Outlet" 
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-[#64748B]">Apakah Anda yakin ingin menghapus outlet ini? Data karyawan yang sudah ada tidak akan terhapus, namun opsi outlet ini tidak akan muncul lagi di pilihan dropdown baru.</p>
      </Modal>
    </div>
  )
}

function CutiSettingsCard() {
  const { config, saveConfig, isSaving, resetAllCuti, isResetting } = useCutiConfig()
  const { data: karyawanList = [] } = useKaryawan()

  const [form, setForm] = useState<CutiConfig>(config)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetSuccessMessage, setResetSuccessMessage] = useState('')

  // Sync state if config changes from storage
  useEffect(() => {
    setForm(config)
  }, [config])

  const handleSaveSettings = async () => {
    try {
      await saveConfig({
        kuotaDefault: Number(form.kuotaDefault) || 18,
        periodeResetBulan: Number(form.periodeResetBulan) || 18,
        tanggalResetTerakhir: form.tanggalResetTerakhir || '2025-01-01',
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e: any) {
      alert(`Gagal menyimpan pengaturan cuti: ${e?.message || JSON.stringify(e)}`)
    }
  }

  const handleExecuteResetAll = async () => {
    try {
      const targetQuota = Number(form.kuotaDefault) || 18
      await resetAllCuti({ customQuota: targetQuota })
      setResetModalOpen(false)
      setResetSuccessMessage(`Berhasil menyetel ulang sisa cuti ${karyawanList.length} karyawan ke ${targetQuota} hari!`)
      setTimeout(() => setResetSuccessMessage(''), 5000)
    } catch (e: any) {
      alert(`Gagal mereset kuota cuti: ${e?.message || JSON.stringify(e)}`)
    }
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden border-gray-200">
      {/* Header */}
      <div className="px-6 py-4.5 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 border-b border-teal-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <CalendarClock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-teal-950">Pengaturan Kuota & Siklus Jatah Cuti</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                <Sparkles size={11} /> Siklus {form.periodeResetBulan || 18} Bulan (1.5 Tahun)
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Atur jatah kuota cuti standar untuk seluruh karyawan dan kelola periode reset otomatis setiap 1.5 tahun
            </p>
          </div>
        </div>

        {saveSuccess && (
          <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 size={14} /> Pengaturan Tersimpan
          </span>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Kuota Default */}
          <div className="space-y-1.5 p-4 rounded-xl bg-gray-50/80 border border-gray-200">
            <label className="text-xs font-bold text-teal-950 block">
              Kuota Jatah Cuti Standar (Hari) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={60}
                value={form.kuotaDefault}
                onChange={e => setForm(f => ({ ...f, kuotaDefault: parseInt(e.target.value, 10) || 0 }))}
                className="w-full px-3 py-2 text-sm font-bold text-teal-950 border border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
              />
              <span className="text-xs font-semibold text-gray-500 shrink-0">Hari / Periode</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              Jumlah hari cuti default saat karyawan baru ditambahkan atau saat siklus reset cuti berjalan.
            </p>
          </div>

          {/* 2. Periode Reset */}
          <div className="space-y-1.5 p-4 rounded-xl bg-gray-50/80 border border-gray-200">
            <label className="text-xs font-bold text-teal-950 block">
              Siklus Periode Reset Jatah Cuti <span className="text-red-500">*</span>
            </label>
            <select
              value={form.periodeResetBulan}
              onChange={e => setForm(f => ({ ...f, periodeResetBulan: parseInt(e.target.value, 10) || 18 }))}
              className="w-full px-3 py-2 text-sm font-semibold text-teal-950 border border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
            >
              <option value={18}>18 Bulan (1.5 Tahun) - Standar BNI</option>
              <option value={12}>12 Bulan (1 Tahun / Tahunan)</option>
              <option value={24}>24 Bulan (2 Tahun)</option>
              <option value={6}>6 Bulan (Setengah Tahun)</option>
            </select>
            <p className="text-[11px] text-[#64748B] mt-1">
              Frekuensi waktu sistem me-reset ulang akumulasi sisa cuti karyawan.
            </p>
          </div>

          {/* 3. Tanggal Awal Periode */}
          <div className="space-y-1.5 p-4 rounded-xl bg-gray-50/80 border border-gray-200">
            <label className="text-xs font-bold text-teal-950 block">
              Tanggal Awal Periode Berjalan <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.tanggalResetTerakhir}
              onChange={e => setForm(f => ({ ...f, tanggalResetTerakhir: e.target.value }))}
              className="w-full px-3 py-2 text-sm font-medium text-teal-950 border border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
            />
            <p className="text-[11px] text-[#64748B] mt-1">
              Titik awal dimulainya periode cuti 1.5 tahun saat ini.
            </p>
          </div>
        </div>

        {/* Live Cycle Information Card */}
        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-950 uppercase tracking-wide">
                Status Siklus Cuti Berjalan (1.5 Tahun)
              </p>
              <p className="text-xs text-teal-800 mt-0.5">
                Periode Aktif: <strong className="text-teal-950">{formatDate(config.tanggalResetTerakhir)}</strong> s/d{' '}
                <strong className="text-teal-950">{formatDate(config.tanggalResetBerikutnya)}</strong>
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Jadwal Reset Otomatis Berikutnya:{' '}
                <span className="font-bold text-teal-700">{formatDate(config.tanggalResetBerikutnya)}</span> ({config.periodeResetBulan} bulan dari awal periode)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Button
              variant="primary"
              size="sm"
              loading={isSaving}
              onClick={handleSaveSettings}
              className="w-full md:w-auto"
            >
              Simpan Pengaturan Cuti
            </Button>
          </div>
        </div>

        {resetSuccessMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{resetSuccessMessage}</span>
          </div>
        )}

        {/* Bulk Action: Reset All Employees */}
        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
              <RotateCcw size={14} className="text-orange-600" />
              Tindakan Massal: Reset Kuota Seluruh Karyawan
            </h4>
            <p className="text-xs text-[#64748B] mt-0.5">
              Terapkan langsung kuota <strong>{form.kuotaDefault} hari</strong> ke seluruh <strong>{karyawanList.length} karyawan aktif</strong> sekaligus menyetel ulang siklus periode cuti per hari ini.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetModalOpen(true)}
            className="text-orange-700 border-orange-200 hover:bg-orange-50 shrink-0 font-semibold"
          >
            <RotateCcw size={13} className="mr-1.5 text-orange-600" /> Reset Cuti Seluruh Karyawan
          </Button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Konfirmasi Reset Kuota Cuti Massal"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              loading={isResetting}
              onClick={handleExecuteResetAll}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Ya, Reset Sisa Cuti Sekarang
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div className="flex items-start gap-3 p-3.5 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900">
            <AlertTriangle size={18} className="text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Perhatian: Tindakan Berskala Massal</p>
              <p className="mt-0.5 text-orange-800">
                Tindakan ini akan mengatur ulang sisa cuti untuk <strong>{karyawanList.length} karyawan</strong> menjadi <strong>{form.kuotaDefault} hari</strong>.
              </p>
            </div>
          </div>

          <p className="text-xs text-[#64748B] leading-relaxed">
            Tanggal reset periode cuti akan diperbarui menjadi <strong>hari ini</strong>, dan siklus reset 1.5 tahun berikutnya akan dijadwalkan otomatis pada <strong>{formatDate(new Date(Date.now() + form.periodeResetBulan * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}</strong>.
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-[#2B3440] flex items-center gap-2">
          <Settings size={24} className="text-teal-600" /> Pengaturan Sistem & Referensi
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Kelola kuota cuti karyawan, siklus reset 1.5 tahun, dan master data outlet operasional
        </p>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 flex gap-3">
        <ShieldCheck size={20} className="text-teal-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-teal-800">Manajemen Kuota Cuti & Master Data Terpusat</p>
          <p className="text-xs text-teal-700 mt-0.5">
            Perubahan kuota cuti standar dan nama outlet akan otomatis langsung tersinkronisasi ke seluruh menu Karyawan, Bina, Absensi, dan Dokumen SK.
          </p>
        </div>
      </div>

      {/* Section 1: Pengaturan Cuti Karyawan */}
      <CutiSettingsCard />

      {/* Section 2: Master Outlet */}
      <div className="grid grid-cols-1 gap-5">
        {KATEGORI_CONFIG.map(cfg => (
          <ReferensiCard key={cfg.key} kategori={cfg.key} label={cfg.label} color={cfg.color} desc={cfg.desc} />
        ))}
      </div>
    </div>
  )
}
