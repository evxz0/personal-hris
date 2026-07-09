import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Users, UserCheck, GraduationCap, CalendarOff, ArrowUpCircle, Fingerprint, Clock, Activity, PlusCircle, Edit, Trash2, UploadCloud } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { formatDate } from '../lib/utils'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'

function StatCard({ icon, label, value, color, sub }: {
  icon: React.ReactNode; label: string; value: number | string; color: string; sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow duration-200 animate-fade-in-up">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-[#64748B] font-medium">{label}</p>
        <p className="text-2xl font-extrabold text-[#2B3440]">{value}</p>
        {sub && <p className="text-xs text-[#64748B] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function renderLogItem(log: any) {
  const isTambah = log.aksi.includes('TAMBAH')
  const isUpdate = log.aksi.includes('UPDATE') || log.aksi.includes('UBAH')
  const isDelete = log.aksi.includes('HAPUS')
  const isImport = log.aksi.includes('IMPORT')
  
  let Icon = Activity
  let iconColor = 'text-gray-500'
  let bgColor = 'bg-gray-50'

  if (isTambah) { Icon = PlusCircle; iconColor = 'text-green-600'; bgColor = 'bg-green-50' }
  else if (isUpdate) { Icon = Edit; iconColor = 'text-blue-600'; bgColor = 'bg-blue-50' }
  else if (isDelete) { Icon = Trash2; iconColor = 'text-red-500'; bgColor = 'bg-red-50' }
  else if (isImport) { Icon = UploadCloud; iconColor = 'text-teal-600'; bgColor = 'bg-teal-50' }

  let displayDetail = log.detail_perubahan.replace(/\\"/g, '"').replace(/^"|"$/g, '')
  try {
    const obj = JSON.parse(displayDetail)
    if (obj && typeof obj === 'object') {
      if (log.aksi.includes('ABSENSI')) {
        displayDetail = `NPP: ${obj.npp} | Jenis: ${obj.jenis}`
      } else if (obj.nama && obj.npp) {
        displayDetail = `${obj.nama} (NPP: ${obj.npp})`
      } else if (obj.nama) {
        displayDetail = String(obj.nama)
      } else {
        const entries = Object.entries(obj).filter(([k]) => k !== 'id' && k !== 'created_at' && k !== 'updated_at')
        displayDetail = entries.map(([k, v]) => `${k}: ${v}`).join(' | ')
      }
    }
  } catch (e) {
    // Keep the original cleaned string if not JSON
  }

  return (
    <div key={log.id} className="px-5 py-3 flex items-start gap-4 hover:bg-[#F4F7F6] transition-colors">
      <div className={`p-2 rounded-full shrink-0 ${bgColor}`}>
        <Icon size={14} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#2B3440]">
          {log.aksi.replace(/_/g, ' ')}
        </p>
        <p className="text-xs text-[#64748B] mt-0.5 truncate">
          {displayDetail}
        </p>
      </div>
      <div className="flex items-center gap-1 text-[11px] font-medium text-[#94A3B8] shrink-0 pt-1">
        <Clock size={12} />
        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {formatDate(log.timestamp)}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logDateFilter, setLogDateFilter] = useState<Date | null>(null)
  const { data: karyawan = [] } = useQuery({
    queryKey: ['karyawan'],
    queryFn: async () => { const { data } = await supabase.from('karyawan').select('id, kategori'); return data ?? [] },
  })
  const { data: bina = [] } = useQuery({
    queryKey: ['bina-count'],
    queryFn: async () => { const { data } = await supabase.from('bina').select('id'); return data ?? [] },
  })
  const { data: magang = [] } = useQuery({
    queryKey: ['magang-count'],
    queryFn: async () => { const { data } = await supabase.from('magang').select('id'); return data ?? [] },
  })
  const { data: absensi = [] } = useQuery({
    queryKey: ['absensi-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('absensi').select('*').gte('tanggal_mulai', today)
      return data ?? []
    },
  })
  const { data: requests = { naikLevel: [], pinpad: [] } } = useQuery({
    queryKey: ['requests-recent'],
    queryFn: async () => {
      const { data: nl } = await supabase.from('request_naik_level').select('*').order('created_at', { ascending: false }).limit(5)
      const { data: pp } = await supabase.from('request_pinpad').select('*').order('created_at', { ascending: false }).limit(5)
      return { naikLevel: nl ?? [], pinpad: pp ?? [] }
    },
  })
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(6)
      return data ?? []
    },
  })

  const { data: allAuditLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['audit-logs-all', logDateFilter],
    queryFn: async () => {
      let q = supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200)
      if (logDateFilter) {
        const start = new Date(logDateFilter)
        start.setHours(0, 0, 0, 0)
        const end = new Date(logDateFilter)
        end.setHours(23, 59, 59, 999)
        q = q.gte('timestamp', start.toISOString()).lte('timestamp', end.toISOString())
      }
      const { data } = await q
      return data ?? []
    },
    enabled: logModalOpen,
  })

  const fte = karyawan.filter((k: { kategori: string }) => k.kategori === 'FTE').length
  const tad = karyawan.filter((k: { kategori: string }) => k.kategori === 'TAD').length

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#2B3440]">Dashboard</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Selamat datang · {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard icon={<Users size={22} className="text-teal-600" />} label="Total Karyawan" value={karyawan.length}
          color="bg-teal-50" sub={`FTE: ${fte} | TAD: ${tad}`} />
        <StatCard icon={<UserCheck size={22} className="text-orange-500" />} label="Data Bina" value={bina.length}
          color="bg-orange-50" />
        <StatCard icon={<GraduationCap size={22} className="text-purple-600" />} label="Magang Aktif" value={magang.length}
          color="bg-purple-50" />
        <StatCard icon={<CalendarOff size={22} className="text-red-500" />} label="Absensi Hari Ini" value={absensi.length}
          color="bg-red-50" sub="Sakit & Cuti" />
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Naik Level */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50">
              <ArrowUpCircle size={16} className="text-teal-600" />
            </div>
            <h2 className="font-bold text-sm text-[#2B3440]">Request Naik Level Terbaru</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(requests as { naikLevel: { id: string; npp: string; nama: string; level_diajukan: string; tanggal_buat: string }[]; pinpad: { id: string; npp_user: string; nama: string; keperluan: string; created_at: string }[] }).naikLevel.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#64748B]">Belum ada request</div>
            ) : (
              (requests as { naikLevel: { id: string; npp: string; nama: string; level_diajukan: string; tanggal_buat: string }[]; pinpad: unknown[] }).naikLevel.map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F4F7F6] transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-[#2B3440]">{r.nama}</p>
                    <p className="text-xs text-[#64748B]">NPP: {r.npp} · Level: {r.level_diajukan}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#64748B]">
                    <Clock size={12} />
                    {formatDate(r.tanggal_buat)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Pinpad */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50">
              <Fingerprint size={16} className="text-orange-500" />
            </div>
            <h2 className="font-bold text-sm text-[#2B3440]">Request Pinpad Terbaru</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(requests as { naikLevel: unknown[]; pinpad: { id: string; npp_user: string; nama: string; keperluan: string; created_at: string }[] }).pinpad.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#64748B]">Belum ada request</div>
            ) : (
              (requests as { naikLevel: unknown[]; pinpad: { id: string; npp_user: string; nama: string; keperluan: string; created_at: string }[] }).pinpad.map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F4F7F6] transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-[#2B3440]">{r.nama}</p>
                    <p className="text-xs text-[#64748B]">NPP: {r.npp_user}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${r.keperluan === 'FR' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                    {r.keperluan}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50">
              <Activity size={16} className="text-blue-600" />
            </div>
            <h2 className="font-bold text-sm text-[#2B3440]">Log Aktivitas Sistem</h2>
          </div>
          <button onClick={() => setLogModalOpen(true)} className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
            Lihat Semua
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#64748B]">Belum ada aktivitas</div>
          ) : (
            auditLogs.map((log: any) => renderLogItem(log))
          )}
        </div>
      </div>

      {/* Full Audit Logs Modal */}
      <Modal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title="Semua Log Aktivitas"
        size="xl"
        footer={
          <Button variant="ghost" onClick={() => setLogModalOpen(false)}>Tutup</Button>
        }
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Filter Tanggal</label>
            <div className="flex items-center gap-2">
              <DatePicker
                selected={logDateFilter}
                onChange={(date: Date | null) => setLogDateFilter(date)}
                dateFormat="dd MMMM yyyy"
                placeholderText="Semua tanggal"
                className="w-48 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#2B3440] focus:outline-none focus:border-teal-500"
                isClearable
              />
            </div>
          </div>
          <div className="text-xs text-[#64748B] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 self-end mb-0.5">
            Menampilkan {allAuditLogs.length} aktivitas
          </div>
        </div>

        <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto">
          {isLoadingLogs ? (
            <div className="py-12 text-center text-sm text-[#64748B]">Memuat log...</div>
          ) : allAuditLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#64748B]">Belum ada aktivitas pada tanggal ini</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {allAuditLogs.map((log: any) => renderLogItem(log))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
