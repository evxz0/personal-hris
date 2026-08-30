"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Clock,
  FileCheck2,
  Zap,
  AlertCircle,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { authService } from "../lib/authService";

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isTimeoutNotice, setIsTimeoutNotice] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("reason") === "timeout") {
      setIsTimeoutNotice(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authService.login(username, password);
      setLoading(false);

      if (!res.success || !res.user) {
        setError(res.message || "ID Pengguna atau kata sandi tidak sesuai.");
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      }

      if (res.user.role === "SUPERADMIN") {
        navigate("/superadmin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Terjadi kesalahan internal pada koneksi database.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F1F5F9] p-4 sm:p-6 lg:p-8 font-sans antialiased relative overflow-hidden">
      {/* Subtle Corporate Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Dual-Pane Split Card */}
      <div className="w-full max-w-5xl bg-white rounded-[28px] border border-slate-200/80 shadow-2xl shadow-slate-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* =========================================================================
            LEFT PANE: BRAND PRESENTATION & VALUE PROPOSITION (5 Cols)
           ========================================================================= */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#064E3B] via-[#042F2E] to-[#0F172A] p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Decorative Subtle Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <div className="relative z-10 space-y-8">
            {/* Logo & Corporate Identity */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#E85022] flex items-center justify-center shadow-lg shadow-[#E85022]/30 shrink-0">
                  <img
                    src="/logo-bni.png"
                    alt="BNI TALOS"
                    className="w-7 h-7 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-wider text-white leading-none">
                    TALOS
                  </h1>
                  <p className="text-[10px] tracking-wide text-teal-200/90 font-medium uppercase mt-1">
                    Talent Administration &amp; Legal Operations System
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-[11px] font-semibold text-teal-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sistem Informasi Manajemen SDM Terpadu
              </div>
            </div>

            {/* Main Value Proposition Title */}
            <div className="space-y-2.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white">
                Kelola Data Pegawai &amp; Penerbitan SK Secara Efisien.
              </h2>
              <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed font-normal">
                Platform terintegrasi untuk pengelolaan administrasi kepegawaian, cetak otomatis SK PGS, Cuti, dan Keterangan Kerja dengan enkripsi perbankan.
              </p>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md space-y-1">
                <div className="flex items-center gap-2 text-teal-300">
                  <FileCheck2 className="w-4 h-4 text-teal-400 shrink-0"/>
                  <span className="text-xs font-bold text-white">Cetak Dokumen Presisi</span>
                </div>
                <p className="text-[11px] text-teal-100/70 leading-normal">
                  Generate berkas SK PDF &amp; Word 1 halaman siap cetak.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md space-y-1">
                <div className="flex items-center gap-2 text-teal-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span className="text-xs font-bold text-white">Enkripsi &amp; Proteksi</span>
                </div>
                <p className="text-[11px] text-teal-100/70 leading-normal">
                  Autentikasi aman dengan isolasi sesi perangkat.
                </p>
              </div>
            </div>
          </div>

          {/* Left Footer */}
          <div className="relative z-10 pt-8 mt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-teal-200/60 font-medium">
            <span>Regional Office 09 - Kalimantan Barat</span>
            <span className="font-mono">v2.5 Enterprise</span>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANE: AUTHENTICATION FORM (7 Cols)
           ========================================================================= */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between bg-white space-y-6">
          <div className="space-y-6">
            
            {/* Header Form */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Selamat Datang
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Silakan masukkan akun ID Pengguna dan kata sandi Anda.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Koneksi Aman</span>
              </div>
            </div>

            {/* Session Timeout Notice Banner */}
            {isTimeoutNotice && (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-sm">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"/>
                <div>
                  <p className="font-semibold text-amber-900">Sesi Telah Berakhir</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Sesi Anda telah kedaluwarsa karena tidak ada aktivitas selama 25 menit. Silakan masuk kembali.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message Banner */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-shake shadow-sm">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5"/>
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {/* Form Input */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Field 1: ID Pengguna (NPP / Username) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                  ID Pengguna (NPP)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan ID Pengguna / NPP..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Field 2: Kata Sandi */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => alert("Silakan hubungi Superadmin untuk mereset kata sandi akun Anda.")}
                    className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    title={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-800 to-slate-900 hover:from-teal-700 hover:to-slate-800 text-white text-xs font-bold tracking-wide shadow-lg shadow-teal-950/20 hover:shadow-teal-950/30 transition-all flex items-center justify-center gap-2 group active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>Memverifikasi Kredensial...</span>
                ) : (
                  <>
                    <span>MASUK KE SISTEM</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Footer Security Badges */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Shield className="w-3.5 h-3.5 text-teal-600"/>
              <span>Proteksi Data Terenkripsi</span>
            </div>
            <span>© 2026 TALOS</span>
          </div>
        </div>

      </div>
    </div>
  );
}
