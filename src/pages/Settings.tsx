import { useState } from 'react'
import { Settings, Plus, Trash2, Tag } from 'lucide-react'
import { useReferensi, useAddReferensi, useDeleteReferensi, type KategoriReferensi } from '../hooks/useReferensi'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

const KATEGORI_CONFIG: { key: KategoriReferensi; label: string; color: string; desc: string }[] = [
  { key: 'JABATAN_KARYAWAN', label: 'Jabatan Karyawan', color: 'bg-blue-50 border-blue-200 text-blue-700', desc: 'Jabatan untuk karyawan FTE/TAD (CS, TELER, PENYELIA, BM, dll)' },
  { key: 'JABATAN_BINA', label: 'Jabatan Bina', color: 'bg-orange-50 border-orange-200 text-orange-700', desc: 'Jabatan khusus untuk karyawan Bina' },
  { key: 'OUTLET', label: 'Master Outlet', color: 'bg-purple-50 border-purple-200 text-purple-700', desc: 'Daftar outlet/cabang yang tersedia' },
]

function ReferensiCard({ kategori, label, color, desc }: { kategori: KategoriReferensi; label: string; color: string; desc: string }) {
  const { data = [], isLoading } = useReferensi(kategori)
  const addMutation = useAddReferensi()
  const deleteMutation = useDeleteReferensi()
  const [addOpen, setAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [newValue, setNewValue] = useState('')

  const handleAdd = async () => {
    if (!newValue.trim()) return
    await addMutation.mutateAsync({ kategori, nama_referensi: newValue.trim().toUpperCase() })
    setNewValue('')
    setAddOpen(false)
  }

  const handleDelete = async () => {
    if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) }
  }

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between border-b ${color.split(' ')[1]}`}>
        <div>
          <div className="flex items-center gap-2">
            <Tag size={15} className={color.split(' ')[2]} />
            <h3 className={`font-bold text-sm ${color.split(' ')[2]}`}>{label}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${color}`}>{data.length}</span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">{desc}</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setAddOpen(true)}>
          Tambah
        </Button>
      </div>

      {/* List */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-9 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-6 text-center text-sm text-[#64748B]">Belum ada data. Klik Tambah untuk menambahkan.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.map(item => (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${color.split(' ')[1]} ${color.split(' ')[0]} group`}
              >
                <span className={`text-sm font-semibold ${color.split(' ')[2]}`}>{item.nama_referensi}</span>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity ${color.split(' ')[2]} hover:text-red-500`}
                >
                  <Trash2 size={12} />
                </button>
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
            <Button variant="primary" loading={addMutation.isPending} onClick={handleAdd}>Tambah</Button>
          </>
        }
      >
        <Input
          label={`Nama ${label}`}
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          placeholder={`Contoh: ${kategori === 'OUTLET' ? 'KANTOR PUSAT' : kategori === 'JENJANG' ? 'FTE' : 'CS'}`}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Referensi" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button><Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>Hapus</Button></>}
      >
        <p className="text-sm text-[#64748B]">Hapus opsi ini? Karyawan yang memiliki nilai ini tidak akan terpengaruh, namun opsi tidak akan muncul di dropdown.</p>
      </Modal>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-[#2B3440] flex items-center gap-2">
          <Settings size={24} className="text-teal-600" /> Pengaturan Referensi
        </h1>
        <p className="text-sm text-[#64748B] mt-1">Kelola opsi dropdown yang digunakan di seluruh aplikasi</p>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 flex gap-3">
        <Settings size={18} className="text-teal-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-teal-700">Manajemen Data Referensi Dinamis</p>
          <p className="text-xs text-teal-600 mt-0.5">Tambah atau hapus opsi referensi tanpa perlu mengubah kode program. Perubahan langsung berlaku di seluruh dropdown aplikasi.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {KATEGORI_CONFIG.map(cfg => (
          <ReferensiCard key={cfg.key} kategori={cfg.key} label={cfg.label} color={cfg.color} desc={cfg.desc} />
        ))}
      </div>
    </div>
  )
}
