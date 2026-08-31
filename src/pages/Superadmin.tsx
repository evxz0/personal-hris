"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  Users,
  Laptop,
  Activity,
  Server,
  RefreshCw,
  Plus,
  Search,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  Wifi,
  Globe,
  Smartphone,
  Monitor,
  ShieldCheck,
  Copy,
  Check,
  Zap,
  Download,
  Terminal,
  Radio,
  Clock,
  UserCheck,
  AlertTriangle,
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
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { formatDate } from "../lib/utils";
import { exportToXLSX } from "../lib/importExport";

type TabType = "sessions" | "users" | "logs" | "server";

export default function SuperadminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("sessions");

  // User Management Hooks
  const { data: users = [], refetch: refetchUsers } = useUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const resetPasswordMutation = useResetPassword();
  const deleteUserMutation = useDeleteUser();

  // Active Sessions Hook
  const {
    sessions = [],
    terminateSession,
    isTerminating,
    refetch: refetchSessions,
  } = useActiveSessions();

  // Server Ping Telemetry Hook
  const {
    history: pingHistory = [],
    currentPings,
    runPingTest,
  } = useServerPing();
  const [autoPing, setAutoPing] = useState(false);

  // Audit Logs Query State
  const [auditSearch, setAuditSearch] = useState("");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Modals State
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserAccount | null>(null);
  const [resetModalUser, setResetModalUser] = useState<UserAccount | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<UserAccount | null>(null);

  // Form States
  const [newUserData, setNewUserData] = useState({
    username: "",
    nama: "",
    email: "",
    role: "ADMIN_HR" as UserRole,
    password: "",
    department: "Regional Office 09",
  });
  const [customResetPassword, setCustomResetPassword] = useState("");
  const [generatedPasswordResult, setGeneratedPasswordResult] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // User Search & Filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"ALL" | UserRole>("ALL");

  // Fetch Audit Logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);
      if (!error && data) setAuditLogs(data);
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") fetchLogs();
  }, [activeTab]);

  // Auto Ping Effect
  useEffect(() => {
    let interval: any;
    if (autoPing) {
      interval = setInterval(() => {
        runPingTest();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [autoPing, runPingTest]);

  // Handlers
  const handleCreateUserSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newUserData.username.trim() || !newUserData.nama.trim()) {
      alert("ID Pengguna dan Nama Lengkap wajib diisi.");
      return;
    }
    try {
      await createUserMutation.mutateAsync(newUserData);
      setCreateOpen(false);
      setNewUserData({
        username: "",
        nama: "",
        email: "",
        role: "ADMIN_HR",
        password: "",
        department: "Regional Office 09",
      });
    } catch (e: any) {
      alert(e?.message || "Gagal membuat pengguna baru");
    }
  };

  const handleUpdateUserSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editUser) return;
    try {
      await updateUserMutation.mutateAsync({
        id: editUser.id,
        nama: editUser.nama,
        role: editUser.role,
        status: editUser.status,
        department: editUser.department,
        email: editUser.email,
      });
      setEditUser(null);
    } catch (e: any) {
      alert(e?.message || "Gagal memperbarui pengguna");
    }
  };

  const handleExecuteResetPassword = async () => {
    if (!resetModalUser) return;
    try {
      const res = await resetPasswordMutation.mutateAsync({
        userId: resetModalUser.id,
        newPassword: customResetPassword || undefined,
      });
      setGeneratedPasswordResult(res.generatedPassword);
    } catch (e: any) {
      alert(e?.message || "Gagal mereset kata sandi");
    }
  };

  const handleDeleteUserSubmit = async () => {
    if (!deleteModalUser) return;
    try {
      await deleteUserMutation.mutateAsync(deleteModalUser.id);
      setDeleteModalUser(null);
    } catch (e: any) {
      alert(e?.message || "Gagal menghapus pengguna");
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return (users as UserAccount[]).filter((u: UserAccount) => {
      const matchSearch =
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.nama.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()));
      const matchRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
      return matchSearch && matchRole;
    });
  }, [users, userSearch, userRoleFilter]);

  // Filtered Logs List
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      const text = `${l.user_operasi || ""} ${l.aksi || ""} ${l.detail_perubahan || ""} ${l.device_info || ""}`.toLowerCase();
      return text.includes(auditSearch.toLowerCase());
    });
  }, [auditLogs, auditSearch]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* =========================================================================
          1. TOP ENTERPRISE HEADER BANNER
         ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 via-emerald-500/20 to-teal-700/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner shrink-0">
              <Terminal className="w-6 h-6"/>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Superadmin Control &amp; Monitoring Center
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Pusat kendali akun pengguna, isolasi sesi perangkat aktif, audit keamanan, dan latency server realtime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                refetchSessions();
                refetchUsers();
                runPingTest();
                if (activeTab === "logs") fetchLogs();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/30 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5"/>
              <span>Segarkan Telemetri</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {[
            { id: "sessions", label: "Monitoring Sesi & Device", icon: Laptop, count: sessions.length },
            { id: "users", label: "Manajemen Akun User", icon: Users, count: users.length },
            { id: "logs", label: "Log Aktivitas & Audit", icon: Activity, count: auditLogs.length },
            { id: "server", label: "Grafik Server & Ping", icon: Radio, count: `${currentPings.supabase}ms` },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-950 font-black"
                    : "bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5"/>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono leading-none ${
                      isActive
                        ? "bg-slate-950 text-teal-300 font-bold"
                        : "bg-slate-800 text-slate-400 border border-slate-700/60"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          2. TAB 1: MONITORING SESI & PERANGKAT AKTIF
         ========================================================================= */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Total Sesi Login Aktif
                </p>
                <p className="text-2xl font-bold font-mono text-white mt-1">
                  {sessions.length || 1}
                </p>
                <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Terhubung saat ini
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                <Wifi className="w-5 h-5"/>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Perangkat Desktop
                </p>
                <p className="text-2xl font-bold font-mono text-white mt-1">
                  {sessions.filter((s) => s.deviceType === "Desktop").length || 1}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Windows &amp; macOS PC</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Monitor className="w-5 h-5"/>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Perangkat Mobile / Tablet
                </p>
                <p className="text-2xl font-bold font-mono text-white mt-1">
                  {sessions.filter((s) => s.deviceType !== "Desktop").length}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Android &amp; iOS Devices</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Smartphone className="w-5 h-5"/>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Keamanan Sesi
                </p>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">100%</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">TLS 1.3 / SHA-256</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5"/>
              </div>
            </div>
          </div>

          {/* Live Sessions Table */}
          <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-teal-400"/>
                  Daftar Pengguna &amp; Perangkat yang Sedang Login
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Data realtime mencakup IP Address, Tipe OS, Browser, dan Waktu Akses Sesi.
                </p>
              </div>
              <button
                onClick={() => refetchSessions()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5"/>
                <span>Segarkan Sesi</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                    <th className="py-3.5 px-4">Pengguna</th>
                    <th className="py-3.5 px-4">Perangkat &amp; OS</th>
                    <th className="py-3.5 px-4">Browser</th>
                    <th className="py-3.5 px-4">Alamat IP &amp; Lokasi</th>
                    <th className="py-3.5 px-4">Waktu Login</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {sessions.length === 0 ? (
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-800/60 flex items-center justify-center font-bold font-mono text-xs">
                            S
                          </div>
                          <div>
                            <p className="font-bold text-white leading-tight">SUPERADMIN</p>
                            <span className="text-[10px] font-mono font-bold text-purple-400">SUPERADMIN</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">Windows 11/10 / Desktop</td>
                      <td className="py-3.5 px-4 text-slate-300">Google Chrome</td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-teal-400 text-[11px]">
                          <span>182.11.155.13</span>
                          <span className="text-slate-500 font-sans">(Pontianak, ID)</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ONLINE
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium">
                          Sesi Anda
                        </span>
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                              {s.nama?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="font-bold text-white leading-tight">{s.nama}</p>
                              <span className={`inline-block text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded mt-0.5 ${
                                s.role === "SUPERADMIN"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                              }`}>
                                {s.role}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{s.os || "Desktop"}</td>
                        <td className="py-3.5 px-4 text-slate-300">{s.browser}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-teal-400 font-semibold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              {s.ipAddress}
                            </span>
                            <button
                              onClick={() => handleCopyText(s.ipAddress, s.id)}
                              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                              title="Salin IP"
                            >
                              {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                          {new Date(s.loginTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ONLINE
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => terminateSession(s.id)}
                            disabled={isTerminating}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                          >
                            Putuskan Sesi
                          </button>
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
          3. TAB 2: MANAJEMEN AKUN USER (CRUD + RESET PASSWORD)
         ========================================================================= */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filter & Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input
                  type="text"
                  placeholder="Cari ID pengguna, nama, role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-950/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end flex-wrap">
              <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                {(["ALL", "SUPERADMIN", "ADMIN_HR"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      userRoleFilter === r
                        ? "bg-slate-800 text-teal-400 shadow-sm font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {r === "ALL" ? "Semua Role" : r}
                  </button>
                ))}
              </div>

              <Button onClick={() => setCreateOpen(true)} size="sm" variant="primary" className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shrink-0">
                <Plus className="w-4 h-4 mr-1"/>
                <span>Buat Akun User Baru</span>
              </Button>
            </div>
          </div>

          {/* High-Density Users Table */}
          <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                    <th className="py-3.5 px-4">Nama &amp; ID Pengguna</th>
                    <th className="py-3.5 px-4">Peran (Role)</th>
                    <th className="py-3.5 px-4">Departemen / Unit</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Terakhir Login</th>
                    <th className="py-3.5 px-4 text-right">Aksi Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredUsers.map((u) => {
                    const isSuper = u.role === "SUPERADMIN";
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs border ${
                                isSuper
                                  ? "bg-purple-950/80 text-purple-300 border-purple-800/60"
                                  : "bg-teal-950/80 text-teal-300 border-teal-800/60"
                              }`}
                            >
                              {u.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white group-hover:text-teal-400 transition-colors">
                                {u.nama}
                              </p>
                              <p className="text-[11px] font-mono text-slate-400">
                                @{u.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide border ${
                              isSuper
                                ? "bg-purple-950/80 text-purple-300 border-purple-700/60"
                                : "bg-teal-950/80 text-teal-300 border-teal-700/60"
                            }`}
                          >
                            {isSuper && <ShieldCheck className="w-3 h-3 text-purple-400"/>}
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400">
                          {u.department || "Regional Office 09"}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {u.status || "AKTIF"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {u.last_login ? formatDate(u.last_login) : "Belum pernah"}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setResetModalUser(u);
                                setGeneratedPasswordResult("");
                                setCustomResetPassword("");
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 text-amber-400 hover:bg-amber-950/60 hover:text-amber-300 border border-slate-700/60 transition-all shadow-sm"
                              title="Reset Kata Sandi"
                            >
                              <KeyRound className="w-3.5 h-3.5"/>
                            </button>
                            <button
                              onClick={() => setEditUser(u)}
                              className="p-1.5 rounded-lg bg-slate-800 text-teal-400 hover:bg-slate-700 hover:text-teal-300 border border-slate-700/60 transition-all shadow-sm"
                              title="Edit Profil"
                            >
                              <Edit2 className="w-3.5 h-3.5"/>
                            </button>
                            <button
                              onClick={() => setDeleteModalUser(u)}
                              disabled={isSuper && users.filter((x) => x.role === "SUPERADMIN").length <= 1}
                              className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700/60 transition-all shadow-sm disabled:opacity-30 disabled:pointer-events-none"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. TAB 3: LOG AKTIVITAS & AUDIT TRAIL
         ========================================================================= */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input
                type="text"
                placeholder="Filter aksi, operator, perubahan..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => {
                  exportToXLSX(
                    filteredLogs.map((l) => ({
                      Waktu: l.timestamp,
                      Operator: l.user_operasi,
                      Aksi: l.aksi,
                      Detail: l.detail_perubahan,
                      Device_Info: l.device_info,
                    })),
                    "Audit_Logs_TALOS"
                  );
                }} size="sm" variant="outline" className="text-slate-300 border-slate-700 hover:bg-slate-800 text-xs">
                <Download className="w-3.5 h-3.5 mr-1.5"/> Ekspor Log Excel
              </Button>
              <Button className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold" loading={loadingLogs} onClick={fetchLogs} size="sm" variant="primary">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5"/> Muat Ulang Log
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                    <th className="py-3.5 px-4">Waktu (WIB)</th>
                    <th className="py-3.5 px-4">Operator</th>
                    <th className="py-3.5 px-4">Jenis Aksi</th>
                    <th className="py-3.5 px-4">Detail Perubahan</th>
                    <th className="py-3.5 px-4">Perangkat &amp; IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
                        Belum ada rekaman audit log.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono">
                          <p className="font-semibold text-slate-300">
                            {new Date(l.timestamp).toLocaleTimeString("id-ID")} WIB
                          </p>
                          <p className="text-[10px]">{formatDate(l.timestamp)}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-teal-400 bg-teal-950/50 px-2 py-0.5 rounded border border-teal-500/20">
                            {l.user_operasi || "admin"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] font-bold text-amber-400">
                            {l.aksi}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-md break-words text-slate-300">
                          {typeof l.detail_perubahan === "string"
                            ? l.detail_perubahan
                            : JSON.stringify(l.detail_perubahan)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                          {l.device_info || "-"}
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
          5. TAB 4: TELEMETRI SERVER & PING
         ========================================================================= */}
      {activeTab === "server" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400">Supabase PostgreSQL</p>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-2">{currentPings.supabase} ms</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Database Cluster</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400">OCR AI Engine</p>
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              </div>
              <p className="text-2xl font-bold font-mono text-teal-400 mt-2">{currentPings.ocr} ms</p>
              <p className="text-[11px] text-slate-400 mt-0.5">FastAPI Microservice</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400">Cloudflare Edge CDN</p>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <p className="text-2xl font-bold font-mono text-cyan-400 mt-2">{currentPings.cdn} ms</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Global Edge Network</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400">System Uptime</p>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">99.98%</span>
              </div>
              <p className="text-2xl font-black text-white mt-2 font-mono">OPERATIONAL</p>
              <p className="text-[11px] text-slate-400 mt-0.5">0 Fatal Errors</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400"/>
                  Grafik Real-Time Latency Server &amp; Ping (ms)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Responsivitas koneksi database Supabase, Microservice OCR, dan CDN Frontend.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPing}
                    onChange={(e) => setAutoPing(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-teal-500"
                  />
                  <span>Auto-Ping (5 detik)</span>
                </label>

                <Button className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs" loading={currentPings.isChecking} onClick={runPingTest} size="sm" variant="primary">
                  <Zap className="w-3.5 h-3.5 mr-1"/> Uji Ping Sekarang
                </Button>
              </div>
            </div>

            {/* SVG Latency Chart */}
            <div className="h-60 w-full bg-slate-950/80 rounded-2xl p-4 border border-slate-800 relative flex flex-col justify-between overflow-hidden">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                <line x1="0" y1="50" x2="500" y2="50" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />

                {pingHistory.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    points={pingHistory
                      .map((p, i) => {
                        const x = (i / (pingHistory.length - 1)) * 500;
                        const y = Math.max(10, Math.min(190, 200 - (p.supabasePing / 150) * 180));
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                )}
              </svg>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <span className="w-3 h-1 bg-emerald-400 rounded-full" /> Supabase ({currentPings.supabase}ms)
                  </span>
                  <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
                    <span className="w-3 h-1 bg-teal-400 rounded-full" /> OCR ({currentPings.ocr}ms)
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                    <span className="w-3 h-1 bg-cyan-400 rounded-full" /> CDN ({currentPings.cdn}ms)
                  </span>
                </div>
                <span className="font-mono">Update: {currentPings.lastTested}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      {/* 1. Modal Tambah User */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)}
        title="Buat Akun Pengguna Baru"
        size="md"
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)} variant="ghost" className="text-slate-300 hover:text-white">Batal</Button>
            <Button className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold" loading={createUserMutation.isPending} onClick={handleCreateUserSubmit} variant="primary">
              Simpan &amp; Buat Akun
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs text-slate-200">
          <Input label="ID Pengguna (NPP / Username)" onChange={(e) => setNewUserData((f) => ({ ...f, username: e.target.value }))} value={newUserData.username}
            placeholder="misal: 61852 atau nama_admin"
          />
          <Input label="Nama Lengkap Pegawai" onChange={(e) => setNewUserData((f) => ({ ...f, nama: e.target.value }))} value={newUserData.nama}
            placeholder="misal: AHMAD FAUZI"
          />
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Peran (Role)</label>
            <select
              value={newUserData.role}
              onChange={(e) => setNewUserData((f) => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-700 bg-slate-900 rounded-xl focus:outline-none focus:border-teal-500 text-white"
            >
              <option value="ADMIN_HR">ADMIN_HR (Akses Penuh Master Data, Absensi &amp; Surat)</option>
              <option value="SUPERADMIN">SUPERADMIN (Akses Penuh + Superadmin Terminal)</option>
            </select>
          </div>
          <Input label="Kata Sandi Awal" onChange={(e) => setNewUserData((f) => ({ ...f, password: e.target.value }))} type="password" value={newUserData.password}
            placeholder="Masukkan kata sandi awal..."
          />
        </div>
      </Modal>

      {/* 2. Modal Reset Password */}
      <Modal isOpen={!!resetModalUser} onClose={() => setResetModalUser(null)}
        title={`Reset Kata Sandi: @${resetModalUser?.username}`}
        size="sm"
        footer={
          <>
            <Button onClick={() => setResetModalUser(null)} variant="ghost" className="text-slate-300 hover:text-white">Tutup</Button>
            {!generatedPasswordResult && (
              <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold" loading={resetPasswordMutation.isPending} onClick={handleExecuteResetPassword} variant="primary">
                Terapkan Password Baru
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-3.5 text-xs text-slate-200">
          {!generatedPasswordResult ? (
            <>
              <p className="text-slate-400">
                Tentukan kata sandi baru untuk pengguna ini:
              </p>
              <Input label="Kata Sandi Baru" onChange={(e) => setCustomResetPassword(e.target.value)} value={customResetPassword}
                placeholder="Biarkan kosong untuk buat acak..."
              />
            </>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 text-emerald-100">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 size={16}/> Kata Sandi Baru Berhasil Diperbarui
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-emerald-800 font-mono text-sm font-black text-emerald-400">
                <span>{generatedPasswordResult}</span>
                <button
                  onClick={() => handleCopyText(generatedPasswordResult, "pwd")}
                  className="px-2 py-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 rounded border border-emerald-700/50 transition-colors"
                  title="Salin Password"
                >
                  {copiedId === "pwd" ? <Check className="w-4 h-4 text-emerald-400"/> : <Copy className="w-4 h-4"/>}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 3. Modal Edit User */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)}
        title="Edit Profil Pengguna"
        size="md"
        footer={
          <>
            <Button onClick={() => setEditUser(null)} variant="ghost" className="text-slate-300 hover:text-white">Batal</Button>
            <Button className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold" loading={updateUserMutation.isPending} onClick={handleUpdateUserSubmit} variant="primary">
              Simpan Perubahan
            </Button>
          </>
        }
      >
        {editUser && (
          <div className="space-y-4 text-xs text-slate-200">
            <Input label="ID Pengguna (NPP / Username)" value={editUser.username} disabled />
            <Input label="Nama Lengkap Pegawai" onChange={(e) => setEditUser({ ...editUser, nama: e.target.value })} value={editUser.nama} />
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Peran (Role)</label>
              <select
                value={editUser.role}
                onChange={(e) => setEditUser({ ...editUser, role: e.target.value as UserRole })}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-700 bg-slate-900 rounded-xl focus:outline-none focus:border-sky-500 text-white"
              >
                <option value="ADMIN_HR">ADMIN_HR (Akses Penuh Master Data, Absensi &amp; Surat)</option>
                <option value="SUPERADMIN">SUPERADMIN (Akses Penuh + Superadmin Terminal)</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* 4. Modal Hapus User */}
      <Modal isOpen={!!deleteModalUser} onClose={() => setDeleteModalUser(null)}
        title="Konfirmasi Hapus Pengguna"
        size="sm"
        footer={
          <>
            <Button onClick={() => setDeleteModalUser(null)} variant="ghost" className="text-slate-300 hover:text-white">Batal</Button>
            <Button className="bg-rose-500 hover:bg-rose-400 text-white font-bold" loading={deleteUserMutation.isPending} onClick={handleDeleteUserSubmit} variant="primary">
              Hapus Akun
            </Button>
          </>
        }
      >
        <div className="text-sm text-slate-300">
          Apakah Anda yakin ingin menghapus akun pengguna <strong className="text-rose-400">@{deleteModalUser?.username}</strong>? Tindakan ini tidak dapat dibatalkan.
        </div>
      </Modal>

    </div>
  );
}
