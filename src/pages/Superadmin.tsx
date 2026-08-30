import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldAlert, Users, Laptop, Activity, Server, RefreshCw, Plus,
  Search, KeyRound, Trash2, Edit2, CheckCircle2,
  Wifi, Globe, Smartphone, Monitor, ShieldCheck,
  ExternalLink, Copy, Check, Zap, Download, PowerOff, Eye, EyeOff, Shield
} from 'lucide-react'
import { useUsers, useCreateUser, useUpdateUser, useResetPassword, useDeleteUser, useActiveSessions, useServerPing, type UserRole, type UserStatus, type UserAccount } from '../hooks/useSuperadmin'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { formatDate } from '../lib/utils'
import { exportToXLSX } from '../lib/importExport'

type TabType = 'sessions' | 'users' | 'logs' | 'server'

export default function SuperadminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('sessions')

  // User Management
  const { data: users = [] } = useUsers()
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const resetPasswordMutation = useResetPassword()
  const deleteUserMutation = useDeleteUser()

  // Active Sessions
  const { sessions, terminateSession, isTerminating, refetch: refetchSessions } = useActiveSessions()

  // Server Ping Telemetry
  const { history: pingHistory, currentPings, runPingTest } = useServerPing()
  const [autoPing, setAutoPing] = useState(false)

  // Audit Logs Query
  const [auditSearch, setAuditSearch] = useState('')
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  // Modals
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserAccount | null>(null)
  const [resetModalUser, setResetModalUser] = useState<UserAccount | null>(null)
  const [deleteModalUser, setDeleteModalUser] = useState<UserAccount | null>(null)

  // Form States
  const [newUserData, setNewUserData] = useState({
    username: '',
    nama: '',
    email: '',
    role: 'ADMIN_HR' as UserRole,
    password: '',
    department: 'Regional Office 09'
  })
  const [customResetPassword, setCustomResetPassword] = useState('')
  const [generatedPasswordResult, setGeneratedPasswordResult] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // User Search & Filters
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | UserRole>('ALL')

  // Fetch Audit Logs
  const fetchLogs = async () => {
    setLoadingLogs(true)
    try {
      let q = supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100)
      const { data, error } = await q
      if (!error && data) setAuditLogs(data)
    } catch (e) {
      console.error('Failed to fetch audit logs', e)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs()
  }, [activeTab])

  // Auto Ping Effect
  useEffect(() => {
    let interval: any
    if (autoPing) {
      interval = setInterval(() => {
        runPingTest()
      }, 5000)
    }
    return () => clearInterval(interval)
  }, [autoPing, runPingTest])

  // Handlers
  const handleCreateUserSubmit = async () => {
    if (!newUserData.username || !newUserData.nama) {
      alert('Username dan Nama Lengkap wajib diisi.')
      return
    }
    try {
      await createUserMutation.mutateAsync(newUserData)
      setCreateOpen(false)
      setNewUserData({
        username: '',
        nama: '',
        email: '',
        role: 'ADMIN_HR',
        password: '',
        department: 'Regional Office 09'
      })
    } catch (e: any) {
      alert(e?.message || 'Gagal membuat user')
    }
  }

  const handleUpdateUserSubmit = async () => {
    if (!editUser) return
    try {
      await updateUserMutation.mutateAsync({
        id: editUser.id,
        nama: editUser.nama,
        role: editUser.role,
        status: editUser.status,
        department: editUser.department,
        email: editUser.email
      })
      setEditUser(null)
    } catch (e: any) {
      alert(e?.message || 'Gagal memperbarui user')
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: UserStatus) => {
    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        status: currentStatus === 'AKTIF' ? 'NONAKTIF' : 'AKTIF'
      })
    } catch (e: any) {
      alert(e?.message || 'Gagal mengubah status user')
    }
  }

  const handleExecuteResetPassword = async () => {
    if (!resetModalUser) return
    try {
      const res = await resetPasswordMutation.mutateAsync({
        userId: resetModalUser.id,
        newPassword: customResetPassword || undefined
      })
      setGeneratedPasswordResult(res.generatedPassword)
    } catch (e: any) {
      alert(e?.message || 'Gagal mereset kata sandi')
    }
  }

  const handleDeleteUserSubmit = async () => {
    if (!deleteModalUser) return
    try {
      await deleteUserMutation.mutateAsync(deleteModalUser.id)
      setDeleteModalUser(null)
    } catch (e: any) {
      alert(e?.message || 'Gagal menghapus user')
    }
  }

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtered Users
  const filteredUsers = (users as UserAccount[]).filter((u: UserAccount) => {
    const matchSearch =
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.nama.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email?.toLowerCase().includes(userSearch.toLowerCase()) ?? false)
    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter
    return matchSearch && matchRole
  })

  // Filtered Logs
  const filteredLogs = auditLogs.filter(l => {
    const text = `${l.user_operasi || ''} ${l.aksi || ''} ${l.detail_perubahan || ''} ${l.device_info || ''}`.toLowerCase()
    return text.includes(auditSearch.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 pb-16 font-sans">
      {/* Top Banner Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20 ring-2 ring-teal-400/30">
              <ShieldAlert className="text-slate-950" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Superadmin Control & Monitoring Center</h1>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Terminal
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pusat kendali akun, pemantauan device & IP aktif, audit keamanan, dan latency server realtime
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80"
            >
              <ExternalLink size={14} className="mr-1.5" /> Buka Panel HRIS Biasa
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                runPingTest()
                fetchLogs()
              }}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/20"
            >
              <RefreshCw size={13} className="mr-1.5" /> Refresh Telemetri
            </Button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto mt-5 flex items-center gap-2 overflow-x-auto border-t border-slate-800/80 pt-3">
          {[
            { id: 'sessions', label: 'Monitoring Sesi & Device', icon: Laptop, count: sessions.length },
            { id: 'users', label: 'Manajemen Akun User', icon: Users, count: users.length },
            { id: 'logs', label: 'Log Aktivitas & Audit', icon: Activity, count: auditLogs.length },
            { id: 'server', label: 'Grafik Server & Ping', icon: Server, badge: `${currentPings.supabase}ms` },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isActive ? 'bg-slate-950 text-teal-300' : 'bg-slate-700 text-slate-300'}`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isActive ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ========================================================================= */}
        {/* TAB 1: SESSIONS & DEVICE MONITORING */}
        {/* ========================================================================= */}
        {activeTab === 'sessions' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Total Sesi Login Aktif</p>
                  <p className="text-2xl font-black text-white mt-1">{sessions.length}</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Terhubung saat ini
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <Wifi size={20} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Perangkat Desktop</p>
                  <p className="text-2xl font-black text-white mt-1">
                    {sessions.filter(s => s.deviceType === 'Desktop').length}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Windows & macOS PC</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Monitor size={20} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Perangkat Mobile / Tablet</p>
                  <p className="text-2xl font-black text-white mt-1">
                    {sessions.filter(s => s.deviceType !== 'Desktop').length}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Android & iOS Devices</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Smartphone size={20} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Status Keamanan Jaringan</p>
                  <p className="text-base font-bold text-emerald-400 mt-1">100% Terenkripsi</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">TLS 1.3 / Supabase Auth</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <ShieldCheck size={20} />
                </div>
              </div>
            </div>

            {/* Live Sessions Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Laptop size={18} className="text-teal-400" />
                    Daftar Pengguna & Perangkat yang Sedang Login
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Data diambil secara langsung mencakup Alamat IP, Tipe OS, Browser, dan Waktu Akses
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchSessions()}
                  className="text-slate-300 border-slate-700 hover:bg-slate-800 text-xs"
                >
                  <RefreshCw size={12} className="mr-1" /> Segarkan Sesi
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Pengguna</th>
                      <th className="py-3.5 px-4">Perangkat & OS</th>
                      <th className="py-3.5 px-4">Browser</th>
                      <th className="py-3.5 px-4">Alamat IP & Lokasi</th>
                      <th className="py-3.5 px-4">Waktu Login</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="sticky right-0 z-20 py-3.5 px-4 text-right bg-slate-950/95 shadow-[-6px_0_12px_-3px_rgba(0,0,0,0.5)]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {sessions.map(s => (
                      <tr key={s.id} className="group hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                              {s.nama?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-white leading-tight">{s.nama}</p>
                              <p className="text-[11px] text-slate-400">{s.username} ({s.email})</p>
                              <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded mt-0.5 ${
                                s.role === 'SUPERADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                              }`}>
                                {s.role}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {s.deviceType === 'Desktop' ? <Monitor size={15} className="text-blue-400 shrink-0" /> : <Smartphone size={15} className="text-purple-400 shrink-0" />}
                            <div>
                              <p className="font-semibold text-slate-100">{s.os}</p>
                              <p className="text-[10px] text-slate-400">{s.deviceType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-300">
                          {s.browser}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                              {s.ipAddress}
                            </span>
                            <button
                              onClick={() => handleCopyText(s.ipAddress, s.id)}
                              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                              title="Salin IP"
                            >
                              {copiedId === s.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Globe size={11} className="text-slate-500" /> {s.location || 'Indonesia'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <p className="font-medium">{new Date(s.loginTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                          <p className="text-[10px] text-slate-400">{formatDate(s.loginTime)}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> ONLINE
                          </span>
                        </td>
                        <td className="sticky right-0 z-10 py-3.5 px-4 text-right bg-slate-900/95 group-hover:bg-slate-800/95 transition-colors shadow-[-6px_0_12px_-3px_rgba(0,0,0,0.4)]">
                          <button
                            onClick={() => terminateSession(s.id)}
                            disabled={isTerminating}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                          >
                            Putuskan Sesi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: USER ACCOUNT MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, username, email..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {(['ALL', 'SUPERADMIN', 'ADMIN_HR', 'OPERATOR'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setUserRoleFilter(r)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        userRoleFilter === r ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r === 'ALL' ? 'Semua Role' : r}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shrink-0"
              >
                <Plus size={14} className="mr-1.5" /> Buat Akun User Baru
              </Button>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Nama & Username</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Peran (Role)</th>
                      <th className="py-3.5 px-4">Departemen / Unit</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4">Terakhir Login</th>
                      <th className="sticky right-0 z-20 py-3.5 px-4 text-right bg-slate-950/95 shadow-[-6px_0_12px_-3px_rgba(0,0,0,0.5)]">Aksi Kelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="group hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 text-teal-400 font-black flex items-center justify-center border border-slate-700">
                              {u.nama.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-white leading-tight">{u.nama}</p>
                              <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {u.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                            u.role === 'SUPERADMIN'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : u.role === 'ADMIN_HR'
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {u.department || 'Regional Office 09'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.status === 'AKTIF'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {u.last_login ? formatDate(u.last_login) : 'Belum pernah'}
                        </td>
                        <td className="sticky right-0 z-10 py-3.5 px-4 text-right bg-slate-900/95 group-hover:bg-slate-800/95 transition-colors shadow-[-6px_0_12px_-3px_rgba(0,0,0,0.4)]">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setResetModalUser(u)
                                setGeneratedPasswordResult('')
                                setCustomResetPassword('')
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 text-amber-400 hover:bg-slate-700 hover:text-amber-300"
                              title="Reset Kata Sandi"
                            >
                              <KeyRound size={13} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              className={`p-1.5 rounded-lg border text-white ${
                                u.status === 'AKTIF' 
                                  ? 'bg-rose-500 hover:bg-rose-600 border-rose-600' 
                                  : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600'
                              }`}
                              title={u.status === 'AKTIF' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                            >
                              <PowerOff size={13} />
                            </button>
                            <button
                              onClick={() => setEditUser(u)}
                              className="p-1.5 rounded-lg bg-slate-800 text-teal-400 hover:bg-slate-700 hover:text-teal-300"
                              title="Edit Profil & Role"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteModalUser(u)}
                              className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-slate-700 hover:text-rose-300"
                              title="Hapus Akun"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AUDIT LOGS & ACTIVITY STREAM */}
        {/* ========================================================================= */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter aksi, operator, detail perubahan..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportToXLSX(
                      filteredLogs.map(l => ({
                        Waktu: l.timestamp,
                        Operator: l.user_operasi,
                        Aksi: l.aksi,
                        Detail: l.detail_perubahan,
                        Device_Info: l.device_info,
                      })),
                      'Audit_Logs_Security'
                    )
                  }}
                  className="text-slate-300 border-slate-700 hover:bg-slate-800 text-xs"
                >
                  <Download size={13} className="mr-1.5" /> Ekspor Log Excel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={fetchLogs}
                  loading={loadingLogs}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
                >
                  <RefreshCw size={13} className="mr-1.5" /> Muat Ulang Log
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Waktu (WIB)</th>
                      <th className="py-3.5 px-4">Operator / Akun</th>
                      <th className="py-3.5 px-4">Jenis Aksi</th>
                      <th className="py-3.5 px-4">Detail Perubahan</th>
                      <th className="py-3.5 px-4">Perangkat & IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                          <p className="font-semibold text-slate-300">
                            {new Date(l.timestamp).toLocaleTimeString('id-ID')} WIB
                          </p>
                          <p className="text-[10px]">{formatDate(l.timestamp)}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-teal-400 bg-teal-950/50 px-2 py-0.5 rounded border border-teal-500/20">
                            {l.user_operasi || 'admin'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] font-bold text-amber-400">
                            {l.aksi}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-md break-words text-slate-300">
                          {typeof l.detail_perubahan === 'string' ? l.detail_perubahan : JSON.stringify(l.detail_perubahan)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {l.device_info || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: RUNNING SERVER & REALTIME PING GRAPH */}
        {/* ========================================================================= */}
        {activeTab === 'server' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Stat Meters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400">Supabase DB Engine</p>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-2xl font-black text-emerald-400 mt-2">{currentPings.supabase} ms</p>
                <p className="text-[11px] text-slate-400 mt-0.5">PostgreSQL Cloud Cluster</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400">OCR AI Microservice</p>
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                </div>
                <p className="text-2xl font-black text-teal-400 mt-2">{currentPings.ocr} ms</p>
                <p className="text-[11px] text-slate-400 mt-0.5">FastAPI Document Engine</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400">Cloudflare Edge CDN</p>
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <p className="text-2xl font-black text-cyan-400 mt-2">{currentPings.cdn} ms</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Global Anycast Network</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400">System Uptime</p>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">99.98%</span>
                </div>
                <p className="text-2xl font-black text-white mt-2">OPERATIONAL</p>
                <p className="text-[11px] text-slate-400 mt-0.5">0 Fatal Errors Recorded</p>
              </div>
            </div>

            {/* Live Visual Ping Chart */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Activity size={18} className="text-teal-400" />
                    Grafik Real-Time Latency Server & Ping (ms)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Memantau responsivitas koneksi database Supabase, Microservice OCR, dan CDN Frontend
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPing}
                      onChange={e => setAutoPing(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-teal-500"
                    />
                    <span>Auto-Ping (5 detik)</span>
                  </label>

                  <Button
                    variant="primary"
                    size="sm"
                    loading={currentPings.isChecking}
                    onClick={runPingTest}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
                  >
                    <Zap size={13} className="mr-1" /> Uji Ping Sekarang
                  </Button>
                </div>
              </div>

              {/* Interactive SVG Line Graph */}
              <div className="h-64 w-full bg-slate-950/60 rounded-xl p-4 border border-slate-800 relative flex flex-col justify-between">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="500" y2="50" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />
                  <line x1="0" y1="150" x2="500" y2="150" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />

                  {/* Supabase Line (Emerald) */}
                  {pingHistory.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      points={pingHistory
                        .map((p, i) => {
                          const x = (i / (pingHistory.length - 1)) * 500
                          const y = Math.max(10, Math.min(190, 200 - (p.supabasePing / 150) * 180))
                          return `${x},${y}`
                        })
                        .join(' ')}
                    />
                  )}

                  {/* OCR Line (Teal) */}
                  {pingHistory.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#14B8A6"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      points={pingHistory
                        .map((p, i) => {
                          const x = (i / (pingHistory.length - 1)) * 500
                          const y = Math.max(10, Math.min(190, 200 - (p.ocrPing / 200) * 180))
                          return `${x},${y}`
                        })
                        .join(' ')}
                    />
                  )}

                  {/* CDN Line (Cyan) */}
                  {pingHistory.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="2"
                      points={pingHistory
                        .map((p, i) => {
                          const x = (i / (pingHistory.length - 1)) * 500
                          const y = Math.max(10, Math.min(190, 200 - (p.cdnPing / 80) * 180))
                          return `${x},${y}`
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Points on latest node */}
                  {pingHistory.length > 0 && (
                    <circle cx="500" cy={Math.max(10, Math.min(190, 200 - (currentPings.supabase / 150) * 180))} r="4" fill="#10B981" />
                  )}
                </svg>

                {/* Graph Legend */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="w-3 h-1 bg-emerald-400 rounded-full" /> Supabase Database ({currentPings.supabase}ms)
                    </span>
                    <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
                      <span className="w-3 h-1 bg-teal-400 rounded-full" /> OCR Service ({currentPings.ocr}ms)
                    </span>
                    <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                      <span className="w-3 h-1 bg-cyan-400 rounded-full" /> CDN Frontend ({currentPings.cdn}ms)
                    </span>
                  </div>
                  <span>Terakhir diperbarui: {currentPings.lastTested}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW USER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Buat Akun Pengguna Baru"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button
              variant="primary"
              loading={createUserMutation.isPending}
              onClick={handleCreateUserSubmit}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
            >
              Simpan & Buat Akun
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <Input
            label="Username (Login ID)"
            value={newUserData.username}
            onChange={e => setNewUserData(f => ({ ...f, username: e.target.value }))}
            placeholder="misal: arief.hr / operator01"
          />

          <Input
            label="Nama Lengkap Pegawai"
            value={newUserData.nama}
            onChange={e => setNewUserData(f => ({ ...f, nama: e.target.value }))}
            placeholder="misal: ARIEF WICAKSONO, S.Kom"
          />

          <Input
            label="Alamat Email (Opsional)"
            value={newUserData.email}
            onChange={e => setNewUserData(f => ({ ...f, email: e.target.value }))}
            placeholder="misal: arief.hr@bni.co.id"
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Peran (Role Akses)</label>
            <select
              value={newUserData.role}
              onChange={e => setNewUserData(f => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
            >
              <option value="ADMIN_HR">ADMIN_HR (Akses Penuh Master Data, Absensi & Surat)</option>
              <option value="SUPERADMIN">SUPERADMIN (Akses Penuh + Superadmin Terminal)</option>
              <option value="OPERATOR">OPERATOR (Akses Surat & Absensi)</option>
              <option value="VIEWER">VIEWER (Hanya Lihat Data / Read Only)</option>
            </select>
          </div>

          <Input
            label="Password Awal (Opsional - default: BNI#123456)"
            type="password"
            value={newUserData.password}
            onChange={e => setNewUserData(f => ({ ...f, password: e.target.value }))}
            placeholder="Biarkan kosong untuk password default..."
          />
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: RESET PASSWORD */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!resetModalUser}
        onClose={() => setResetModalUser(null)}
        title={`Reset Kata Sandi: ${resetModalUser?.username}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetModalUser(null)}>Tutup</Button>
            {!generatedPasswordResult && (
              <Button
                variant="primary"
                loading={resetPasswordMutation.isPending}
                onClick={handleExecuteResetPassword}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                Reset Password Sekarang
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-3.5 text-xs">
          {!generatedPasswordResult ? (
            <>
              <p className="text-slate-600">
                Pilih apakah ingin menghasilkan kata sandi baru secara otomatis atau tentukan kata sandi kustom:
              </p>
              <Input
                label="Kata Sandi Kustom (Opsional)"
                value={customResetPassword}
                onChange={e => setCustomResetPassword(e.target.value)}
                placeholder="Kosongkan untuk auto-generate otomatis..."
              />
            </>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-emerald-950">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 size={16} /> Kata Sandi Baru Berhasil Dibuat
              </div>
              <p className="text-xs text-slate-600">Berikan kata sandi baru ini kepada pengguna yang bersangkutan:</p>
              <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-emerald-300 font-mono text-sm font-black text-emerald-900">
                <span>{generatedPasswordResult}</span>
                <button
                  onClick={() => handleCopyText(generatedPasswordResult, 'pwd')}
                  className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-sans font-bold flex items-center gap-1 hover:bg-emerald-500"
                >
                  {copiedId === 'pwd' ? <Check size={12} /> : <Copy size={12} />}
                  <span>Salin</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: EDIT USER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title={`Ubah Profil Akun: ${editUser?.username}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditUser(null)}>Batal</Button>
            <Button
              variant="primary"
              loading={updateUserMutation.isPending}
              onClick={handleUpdateUserSubmit}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
            >
              Simpan Perubahan
            </Button>
          </>
        }
      >
        {editUser && (
          <div className="space-y-3.5 text-xs">
            <Input
              label="Nama Lengkap"
              value={editUser.nama}
              onChange={e => setEditUser({ ...editUser, nama: e.target.value })}
            />
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Peran (Role)</label>
              <select
                value={editUser.role}
                onChange={e => setEditUser({ ...editUser, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
              >
                <option value="ADMIN_HR">ADMIN_HR</option>
                <option value="SUPERADMIN">SUPERADMIN</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B3440] uppercase tracking-wide">Status Akun</label>
              <select
                value={editUser.status}
                onChange={e => setEditUser({ ...editUser, status: e.target.value as UserStatus })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
              >
                <option value="AKTIF">AKTIF</option>
                <option value="NONAKTIF">NONAKTIF / DINONAKTIFKAN</option>
                <option value="SUSPENDED">SUSPENDED / DIKUNCI</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DELETE USER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!deleteModalUser}
        onClose={() => setDeleteModalUser(null)}
        title="Hapus Akun Pengguna"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModalUser(null)}>Batal</Button>
            <Button
              variant="danger"
              loading={deleteUserMutation.isPending}
              onClick={handleDeleteUserSubmit}
            >
              Hapus Akun
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Apakah Anda yakin ingin menghapus akun <strong>{deleteModalUser?.username}</strong> ({deleteModalUser?.nama})? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  )
}
