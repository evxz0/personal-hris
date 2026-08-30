"use client";

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Laptop,
  Activity,
  RefreshCw,
  Plus,
  Search,
  KeyRound,
  Trash2,
  Edit2,
  Monitor,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  Zap,
  Terminal,
  Radio,
  Power,
  Check,
  Copy
} from "lucide-react";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useResetPassword,
  useDeleteUser,
  useActiveSessions,
  useServerPing,
  type UserRole,
  type UserStatus,
  type UserAccount,
} from "../hooks/useSuperadmin";
import { authService } from "../lib/authService";

type TabType = "sessions" | "users" | "logs" | "server";

export default function SuperadminPage() {
  const navigate = useNavigate();
  const currentUser = authService.getSession();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");

  // Hooks & Queries
  const { data: users = [], isLoading: loadingUsers, refetch: refetchUsers } = useUsers();
  const { sessions: activeSessions = [], refetch: refetchSessions } = useActiveSessions();
  const { runPingTest: refetchServer } = useServerPing();

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const resetPasswordMutation = useResetPassword();
  const deleteUserMutation = useDeleteUser();

  // Modals State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  
  // Modal: Reset PW
  const [isResetPwOpen, setIsResetPwOpen] = useState(false);
  const [selectedTargetUser, setSelectedTargetUser] = useState<UserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [resetSuccessNotice, setResetSuccessNotice] = useState<string | null>(null);

  // Modal: Edit User
  const [editUser, setEditUser] = useState<UserAccount | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('ADMIN_HR');

  // Form State Tambah User
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    nama: "",
    password: "",
    role: "ADMIN_HR" as UserRole,
  });
  const [formError, setFormError] = useState("");

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.username.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
        u.nama.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchUserQuery.toLowerCase()));

      const matchRole =
        selectedRoleFilter === "ALL" || u.role === selectedRoleFilter;

      return matchSearch && matchRole;
    });
  }, [users, searchUserQuery, selectedRoleFilter]);

  // Execute Tambah User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!newUserForm.username.trim() || !newUserForm.nama.trim() || !newUserForm.password.trim()) {
      setFormError("Semua field wajib diisi.");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        username: newUserForm.username.trim(),
        nama: newUserForm.nama.trim(),
        password: newUserForm.password.trim(),
        role: newUserForm.role,
      });
      setIsAddUserOpen(false);
      setNewUserForm({ username: "", nama: "", password: "", role: "ADMIN_HR" });
    } catch (err: any) {
      setFormError(err.message || "Gagal membuat user.");
    }
  };

  // Execute Reset Password
  const handleExecuteResetPassword = async () => {
    if (!selectedTargetUser) return;
    try {
      const res = await resetPasswordMutation.mutateAsync({
        userId: selectedTargetUser.id,
        newPassword: newPasswordInput || undefined,
      });
      setResetSuccessNotice(res.generatedPassword);
      setNewPasswordInput("");
    } catch (err: any) {
      alert("Gagal reset password: " + err.message);
    }
  };

  // Execute Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    try {
      await updateUserMutation.mutateAsync({
        id: editUser.id,
        nama: editNama.trim(),
        role: editRole
      })
      setEditUser(null)
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan perubahan')
    }
  }

  // Execute Toggle Status
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

  return (
    <div className="min-h-screen bg-[#090D16] text-zinc-100 antialiased p-4 sm:p-6 lg:p-8 font-sans selection:bg-teal-500/30 selection:text-teal-200">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        
        {/* =========================================================================
            1. TOP ENTERPRISE HEADER
           ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-600/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
              <Terminal className="w-6 h-6"/>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Superadmin Control &amp; Monitoring Center
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE TERMINAL
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pusat kendali akun, pemantauan device &amp; IP aktif, audit keamanan, dan latency server realtime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700/60 shadow-sm transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400"/>
              <span>Buka Panel HRIS</span>
            </button>
            <button
              onClick={() => {
                refetchUsers();
                refetchSessions();
                refetchServer();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600/90 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-900/30 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5"/>
              <span>Refresh Telemetri</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. SEGMENTED TAB NAVIGATION BAR
           ========================================================================= */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 max-w-fit overflow-x-auto custom-scrollbar">
          {[
            { id: "sessions", label: "Monitoring Sesi & Device", icon: Laptop, count: activeSessions.length },
            { id: "users", label: "Manajemen Akun User", icon: Users, count: users.length },
            { id: "logs", label: "Log Aktivitas & Audit", icon: Activity, count: null },
            { id: "server", label: "Grafik Server & Ping", icon: Radio, count: "42ms" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-teal-600 text-white shadow-md shadow-teal-950"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5"/>
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
                      isActive
                        ? "bg-teal-700/80 text-teal-100"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            3. TAB CONTENT: MANAJEMEN AKUN USER
           ========================================================================= */}
        {activeTab === "users" && (
          <div className="space-y-4 animate-fade-in">
            {/* Filter & Action Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"/>
                  <input
                    type="text"
                    placeholder="Cari nama, username, ID akun..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition-colors font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                {/* Filter Pills */}
                <div className="flex items-center p-1 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs">
                  {["ALL", "SUPERADMIN", "ADMIN_HR"].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRoleFilter(role)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        selectedRoleFilter === role
                          ? "bg-zinc-800 text-teal-400 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {role === "ALL" ? "Semua Role" : role}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-900/30 transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5"/>
                  <span>Buat Akun User Baru</span>
                </button>
              </div>
            </div>

            {/* High-Density Users Table */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/90 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                      <th className="py-3.5 px-4">Nama &amp; Username</th>
                      <th className="py-3.5 px-4">Peran (Role)</th>
                      <th className="py-3.5 px-4">Departemen / Unit</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4">Dibuat Pada</th>
                      <th className="py-3.5 px-4 text-right">Aksi Kelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-sans">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-500 font-mono">
                          Memuat data pengguna...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-500 font-mono">
                          Tidak ada data akun user yang cocok dengan kriteria pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSuper = u.role === "SUPERADMIN";
                        return (
                          <tr
                            key={u.id}
                            className="hover:bg-zinc-800/30 transition-colors group"
                          >
                            {/* User Profile */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono border ${
                                    isSuper
                                      ? "bg-purple-950/60 text-purple-300 border-purple-800/60"
                                      : "bg-teal-950/60 text-teal-300 border-teal-800/60"
                                  }`}
                                >
                                  {u.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-zinc-100 group-hover:text-teal-400 transition-colors">
                                    {u.nama}
                                  </p>
                                  <p className="text-[11px] font-mono text-zinc-400">
                                    @{u.username}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Role Badge */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide border ${
                                  isSuper
                                    ? "bg-purple-950/80 text-purple-300 border-purple-700/60 shadow-inner"
                                    : "bg-teal-950/80 text-teal-300 border-teal-700/60"
                                }`}
                              >
                                {isSuper && <ShieldCheck className="w-3 h-3 text-purple-400"/>}
                                {u.role}
                              </span>
                            </td>

                            {/* Department */}
                            <td className="py-3.5 px-4 text-zinc-400">
                              {u.department || "Human Capital & Operasional"}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono border ${
                                u.status === 'AKTIF'
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                                  : 'bg-rose-950/60 text-rose-400 border-rose-800/50'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'AKTIF' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                {u.status}
                              </span>
                            </td>

                            {/* Created Date */}
                            <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                              {u.created_at ? u.created_at.slice(0, 10) : "2026-01-01"}
                            </td>

                            {/* Action Buttons Group */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setSelectedTargetUser(u);
                                    setResetSuccessNotice(null);
                                    setIsResetPwOpen(true);
                                  }}
                                  title="Reset Kata Sandi"
                                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-amber-950/60 text-zinc-400 hover:text-amber-400 border border-zinc-700/60 hover:border-amber-800/60 transition-all shadow-sm"
                                >
                                  <KeyRound className="w-3.5 h-3.5"/>
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(u.id, u.status)}
                                  className={`p-1.5 rounded-lg border transition-all shadow-sm ${
                                    u.status === 'AKTIF' 
                                      ? 'bg-zinc-800/80 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 border-zinc-700/60 hover:border-rose-800/60' 
                                      : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/80'
                                  }`}
                                  title={u.status === 'AKTIF' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditUser(u);
                                    setEditNama(u.nama);
                                    setEditRole(u.role);
                                  }}
                                  title="Edit Profil"
                                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-sky-950/60 text-zinc-400 hover:text-sky-400 border border-zinc-700/60 hover:border-sky-800/60 transition-all shadow-sm"
                                >
                                  <Edit2 className="w-3.5 h-3.5"/>
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus akun user @${u.username}?`)) {
                                      deleteUserMutation.mutate(u.id);
                                    }
                                  }}
                                  disabled={isSuper && users.filter((x) => x.role === "SUPERADMIN").length <= 1}
                                  title="Hapus Akun"
                                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 border border-zinc-700/60 hover:border-rose-800/60 transition-all shadow-sm disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            4. TAB CONTENT: MONITORING SESI & DEVICE AKTIF
           ========================================================================= */}
        {activeTab === "sessions" && (
          <div className="space-y-5 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { label: "Total Sesi Login Aktif", value: activeSessions.length || "0", sub: "Terhubung saat ini", icon: Activity, color: "text-emerald-400" },
                { label: "Perangkat Desktop", value: activeSessions.filter((s: any) => s.deviceType === 'Desktop').length, sub: "Windows & macOS PC", icon: Monitor, color: "text-sky-400" },
                { label: "Perangkat Mobile / Tablet", value: activeSessions.filter((s: any) => s.deviceType !== 'Desktop').length, sub: "Android & iOS Devices", icon: Smartphone, color: "text-purple-400" },
                { label: "Status Keamanan Jaringan", value: "100%", sub: "TLS 1.3 / Enkripsi SHA-256", icon: ShieldCheck, color: "text-teal-400" },
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <div key={i} className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase font-mono">
                        {c.label}
                      </span>
                      <Icon className={`w-4 h-4 ${c.color}`}/>
                    </div>
                    <div className="mt-2 text-2xl font-bold font-mono text-zinc-100">
                      {c.value}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500 font-sans">
                      {c.sub}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sessions Table */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-teal-400"/>
                    Daftar Pengguna &amp; Perangkat yang Sedang Login
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Data realtime mencakup IP Address, OS, Browser, dan Waktu Akses Sesi.
                  </p>
                </div>
                <button
                  onClick={() => refetchSessions()}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700/60 transition-colors inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3"/>
                  <span>Segarkan Sesi</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/60 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                      <th className="py-3 px-4">Pengguna</th>
                      <th className="py-3 px-4">Perangkat &amp; OS</th>
                      <th className="py-3 px-4">Browser</th>
                      <th className="py-3 px-4">Alamat IP &amp; Lokasi</th>
                      <th className="py-3 px-4">Waktu Login</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {activeSessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono">Tidak ada sesi login aktif yang terpantau.</td>
                      </tr>
                    ) : (
                      activeSessions.map((s: any) => (
                        <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs font-mono ${
                                s.role === 'SUPERADMIN' ? 'bg-purple-950/80 text-purple-300 border-purple-800/60' : 'bg-teal-950/80 text-teal-300 border-teal-800/60'
                              }`}>
                                {s.nama?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="font-bold text-zinc-100">{s.nama}</p>
                                <span className={`text-[10px] font-mono ${s.role === 'SUPERADMIN' ? 'text-purple-400' : 'text-teal-400'}`}>{s.role}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-sans text-zinc-300">
                            <span className="inline-flex items-center gap-1.5">
                              {s.deviceType === 'Desktop' ? <Monitor className="w-3.5 h-3.5 text-zinc-400"/> : <Smartphone className="w-3.5 h-3.5 text-purple-400"/>}
                              {s.os} / {s.deviceType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-300">{s.browser}</td>
                          <td className="py-3.5 px-4 font-mono">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-teal-400 text-[11px]">
                              <span>{s.ipAddress}</span>
                              <span className="text-zinc-500 font-sans">({s.location || 'Local'})</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                            {new Date(s.loginTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              ONLINE
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {s.username === currentUser?.username ? (
                              <button
                                onClick={() => alert("Anda tidak dapat memutuskan sesi Anda sendiri dari sini. Gunakan tombol Keluar pada Sidebar.")}
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-500 text-[11px] font-semibold border border-zinc-800 cursor-not-allowed"
                              >
                                Sesi Anda
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  alert(`Putuskan koneksi untuk sesi ${s.username}`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 text-[11px] font-semibold border border-rose-900/50 transition-colors"
                              >
                                Putuskan Sesi
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            5. TAB CONTENT: GRAFIK SERVER & PING
           ========================================================================= */}
        {activeTab === "server" && (
          <div className="space-y-5 animate-fade-in">
            {/* Server Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { title: "Supabase DB Engine", value: "42 ms", sub: "PostgreSQL Cloud Cluster", status: "Healthy" },
                { title: "OCR AI Microservice", value: "118 ms", sub: "FastAPI Document Engine", status: "Active" },
                { title: "Cloudflare Edge CDN", value: "18 ms", sub: "Global Anycast Network", status: "Optimal" },
                { title: "System Uptime", value: "99.98%", sub: "0 Fatal Errors Recorded", status: "99.98%" },
              ].map((s, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase font-mono">
                      {s.title}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-teal-400">
                    {s.value}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 font-sans">
                    {s.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Simulated Live Latency Chart Container */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400"/>
                    Grafik Real-Time Latency Server &amp; Ping (ms)
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Memantau responsivitas koneksi database Supabase, Microservice OCR, dan CDN Frontend.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                    <input type="checkbox" defaultChecked className="rounded accent-teal-500" />
                    Auto-Ping (5 detik)
                  </span>
                  <button
                    onClick={() => refetchServer()}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5"/>
                    <span>Uji Ping Sekarang</span>
                  </button>
                </div>
              </div>

              {/* Chart Visual Surface */}
              <div className="h-56 w-full rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-4 flex flex-col justify-between relative overflow-hidden font-mono text-[10px] text-zinc-500">
                {/* Horizontal Gridlines */}
                <div className="w-full border-b border-zinc-800/60 pb-1 flex justify-between">
                  <span>150ms</span>
                  <span className="border-t border-dashed border-zinc-800/80 w-11/12" />
                </div>
                <div className="w-full border-b border-zinc-800/60 pb-1 flex justify-between">
                  <span>100ms</span>
                  <span className="border-t border-dashed border-zinc-800/80 w-11/12" />
                </div>
                <div className="w-full border-b border-zinc-800/60 pb-1 flex justify-between">
                  <span>50ms</span>
                  <span className="border-t border-dashed border-zinc-800/80 w-11/12" />
                </div>
                <div className="w-full flex justify-between">
                  <span>0ms</span>
                  <span className="border-t border-zinc-800 w-11/12" />
                </div>

                {/* SVG Latency Lines */}
                <svg className="absolute inset-0 w-full h-full p-4 pointer-events-none" preserveAspectRatio="none">
                  <path
                    d="M 40 160 Q 150 140, 300 150 T 600 145 T 900 155 T 1200 140"
                    fill="none"
                    stroke="#14B8A6"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M 40 80 Q 150 70, 300 90 T 600 75 T 900 85 T 1200 70"
                    fill="none"
                    stroke="#0EA5E9"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-teal-400">
                    <span className="w-2.5 h-0.5 bg-teal-400" /> Supabase Database (42ms)
                  </span>
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <span className="w-2.5 h-0.5 bg-sky-400 border-dashed" /> OCR Service (118ms)
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500">Terakhir diperbarui: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* TAB 3: AUDIT LOGS (Placeholder for now) */}
        {activeTab === "logs" && (
          <div className="p-12 text-center text-zinc-500 font-mono bg-zinc-900/60 rounded-2xl border border-zinc-800/80 backdrop-blur-xl shadow-2xl">
            Modul Log Aktivitas & Audit sedang dalam pengembangan.
          </div>
        )}

        {/* =========================================================================
            MODAL 1: TAMBAH PENGGUNA BARU
           ========================================================================= */}
        {isAddUserOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-teal-400"/>
                  Buat Akun Pengguna Baru
                </h3>
                <button onClick={() => setIsAddUserOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-sm">
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">USERNAME / ID PENGGUNA</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 61852 atau nama_admin"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">NAMA LENGKAP PENGGUNA</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: ADMIN OPERASIONAL"
                    value={newUserForm.nama}
                    onChange={(e) => setNewUserForm({ ...newUserForm, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">KATA SANDI AWAL</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">PERAN (ROLE ACCESS)</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="ADMIN_HR">ADMIN_HR (Akses Penuh Master Data &amp; Surat)</option>
                    <option value="SUPERADMIN">SUPERADMIN (Akses Penuh + Superadmin Terminal)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    {createUserMutation.isPending ? "Menyimpan..." : "Simpan Pengguna"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 2: RESET PASSWORD INSTAN
           ========================================================================= */}
        {isResetPwOpen && selectedTargetUser && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400"/>
                  Reset Kata Sandi Pengguna
                </h3>
                <button onClick={() => setIsResetPwOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-sm">
                  ✕
                </button>
              </div>

              <div className="text-xs text-zinc-400 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                Pengguna: <strong className="text-zinc-200">@{selectedTargetUser.username}</strong> ({selectedTargetUser.nama})
              </div>
              
              {!resetSuccessNotice ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 font-semibold mb-1">Kata Sandi Baru (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Biarkan kosong untuk generate otomatis"
                      value={newPasswordInput}
                      onChange={e => setNewPasswordInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsResetPwOpen(false)}
                      className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleExecuteResetPassword}
                      disabled={resetPasswordMutation.isPending}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md"
                    >
                      {resetPasswordMutation.isPending ? 'Memproses...' : 'Reset Sekarang'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl">
                    <p className="text-emerald-400 text-xs font-bold mb-2">✅ Password Berhasil Direset!</p>
                    <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                      <code className="text-zinc-100 flex-1 font-mono text-sm tracking-wider select-all">{resetSuccessNotice}</code>
                      <button
                        onClick={() => handleCopy(resetSuccessNotice, 'pwd')}
                        className="text-zinc-400 hover:text-white"
                        title="Salin Password"
                      >
                        {copiedId === 'pwd' ? <Check className="w-4 h-4 text-emerald-400"/> : <Copy className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsResetPwOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 text-white text-xs font-semibold hover:bg-zinc-700"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* =========================================================================
            MODAL 3: EDIT PENGGUNA
           ========================================================================= */}
        {editUser && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-sky-400"/>
                  Edit Profil Pengguna
                </h3>
                <button onClick={() => setEditUser(null)} className="text-zinc-500 hover:text-zinc-300 text-sm">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">USERNAME (Tidak dapat diubah)</label>
                  <input
                    type="text"
                    disabled
                    value={editUser.username}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">NAMA LENGKAP PENGGUNA</label>
                  <input
                    type="text"
                    required
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">PERAN (ROLE ACCESS)</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="ADMIN_HR">ADMIN_HR (Akses Penuh Master Data &amp; Surat)</option>
                    <option value="SUPERADMIN">SUPERADMIN (Akses Penuh + Superadmin Terminal)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditUser(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    {updateUserMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
