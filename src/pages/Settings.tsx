import { useState } from 'react'
import { Settings, Plus, Trash2, Tag, Edit2 } from 'lucide-react'
import { useReferensi, useAddReferensi, useUpdateReferensi, useDeleteReferensi, type KategoriReferensi } from '../hooks/useReferensi'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

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

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-[#2B3440] flex items-center gap-2">
          <Settings size={24} className="text-teal-600" /> Pengaturan Referensi
        </h1>
        <p className="text-sm text-[#64748B] mt-1">Kelola data master referensi dan daftar outlet yang digunakan di seluruh aplikasi</p>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 flex gap-3">
        <Settings size={18} className="text-teal-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-teal-700">Manajemen Master Outlet Dinamis</p>
          <p className="text-xs text-teal-600 mt-0.5">Tambah, ubah nama, atau hapus outlet tanpa perlu mengubah kode program. Perubahan nama outlet langsung berlaku di seluruh pilihan dropdown aplikasi.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {KATEGORI_CONFIG.map(cfg => (
          <ReferensiCard key={cfg.key} kategori={cfg.key} label={cfg.label} color={cfg.color} desc={cfg.desc} />
        ))}
      </div>
    </div>
  )
}
