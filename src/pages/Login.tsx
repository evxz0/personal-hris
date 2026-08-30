import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Eye, EyeOff, Shield, Clock, User, Lock, Sparkles, CheckCircle2,
  ArrowRight, ArrowLeft, KeyRound, Mail, ShieldAlert, RefreshCw, Laptop
} from 'lucide-react'
import { formatDate } from '../lib/utils'
import { authService } from '../lib/authService'
import { recordUserLogin, checkActiveDeviceSession, initRealtimeSessionTracker, type ActiveDeviceInfo } from '../lib/sessionTracker'

type AuthMode = 'login' | 'forgot_email' | 'reset_password' | 'success' | 'device_blocked'

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [blockedSession, setBlockedSession] = useState<ActiveDeviceInfo | null>(null)
  
  // Login State
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Reset Password State
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Status & Messaging State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetEmailInput, setResetEmailInput] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  const searchParamsObj = new URLSearchParams(window.location.search)
  const isTimeout = searchParamsObj.get('reason') === 'timeout'
  const isConcurrent = searchParamsObj.get('reason') === 'concurrent_device'
  const isTerminated = searchParamsObj.get('reason') === 'terminated'

  // Initialize Realtime Presence listener on mount so presence state is ready
  useEffect(() => {
    initRealtimeSessionTracker()
  }, [])

  // Automatically detect recovery link from email & transition to reset password view
  useEffect(() => {
    const checkAuthCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search)
      const hashStr = window.location.hash.replace('#', '?')
      const hashParams = new URLSearchParams(hashStr)

      const isRecovery =
        window.location.hash.includes('type=recovery') ||
        hashParams.get('type') === 'recovery' ||
        searchParams.get('type') === 'recovery' ||
        !!searchParams.get('code') ||
        !!hashParams.get('access_token')

      // 1. Check for PKCE flow auth code (?code=...)
      const code = searchParams.get('code')
      if (code) {
        setLoading(true)
        const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code)
        setLoading(false)
        if (!exchangeErr && data.session) {
          setError('')
          setAuthMode('reset_password')
          setInfoMessage('Tautan pemulihan terverifikasi. Silakan buat kata sandi baru Anda di bawah ini.')
          return
        }
      }

      // 2. Check for implicit hash fragment or active recovery session
      if (isRecovery) {
        const { data } = await supabase.auth.getSession()
        if (data.session || hashParams.get('access_token')) {
          setError('')
          setAuthMode('reset_password')
          setInfoMessage('Tautan pemulihan terverifikasi. Silakan buat kata sandi baru Anda di bawah ini.')
          return
        }
      }

      // 3. Check for URL error parameters
      const hashError = hashParams.get('error_description') || searchParams.get('error_description')
      if (hashError && !isRecovery) {
        const decoded = decodeURIComponent(hashError)
        setError(decoded)
      }
    }

    checkAuthCallback()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && (window.location.hash.includes('type=recovery') || window.location.search.includes('code=')))) {
        setError('')
        setAuthMode('reset_password')
        setInfoMessage('Tautan pemulihan terverifikasi. Silakan buat kata sandi baru Anda di bawah ini.')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Helper to format NPP to email
  const formatEmail = (input: string) => {
    const trimmed = input.trim()
    if (trimmed.includes('@')) return trimmed
    return `${trimmed}@phris.local`
  }

  // Handle Login Submit
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')

    const cleanUser = userId.trim().toLowerCase()
    const cleanPass = password.trim()

    if (!cleanUser || !cleanPass) {
      setError('Harap masukkan ID Pengguna dan kata sandi Anda.')
      setLoading(false)
      return
    }

    // 1. PRE-AUTH CHECK: Strict 1 User = 1 Device (BEFORE contacting Supabase Auth)
    // If account is already active on another device, BLOCK and redirect to dedicated conflict screen immediately!
    const activeCheck = await checkActiveDeviceSession(cleanUser)
    if (activeCheck.isActive) {
      setBlockedSession(activeCheck)
      setAuthMode('device_blocked')
      setLoading(false)
      return
    }

    // 2. Authenticate with Custom DB Auth
    const { success, user: activeUser, message } = await authService.login(cleanUser, cleanPass)

    if (!success || !activeUser) {
      setError(message || 'ID Pengguna atau kata sandi tidak sesuai.')
      setLoading(false)
      return
    }

    // Record session tracking & telemetry in Supabase audit_logs
    await recordUserLogin({
      userId: activeUser.id,
      username: cleanUser,
      email: `${cleanUser}@phris.local`,
      nama: activeUser.nama || cleanUser.toUpperCase(),
      role: activeUser.role,
    }).catch(console.error)

    const isSuper = activeUser.role === 'SUPERADMIN'
    const searchParams = new URLSearchParams(window.location.search)
    const redirectParam = searchParams.get('redirect')

    if (redirectParam && (redirectParam !== '/superadmin' || isSuper)) {
      window.location.href = redirectParam
    } else if (isSuper) {
      window.location.href = '/superadmin'
    } else {
      window.location.href = '/'
    }
    setLoading(false)
  }

  // Step 1: Send Reset Password Email (Direct Link)
  const handleRequestResetLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfoMessage('')

    const email = formatEmail(resetEmailInput)

    try {
      // With custom DB Auth, we don't send emails. We just tell them to contact superadmin.
      setInfoMessage(`P-HRIS kini menggunakan autentikasi internal. Harap hubungi Superadmin / IT Support untuk melakukan reset kata sandi akun ${email}.`)
    } catch (err: unknown) {
      setError('Gagal memproses permintaan.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Save New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal harus 6 karakter.')
      setLoading(false)
      return
    }

    if (newPassword !== confirmNewPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok.')
      setLoading(false)
      return
    }

    try {
      // Feature disabled for custom auth flow without email links
      setError('Fitur ini dinonaktifkan. Hubungi Superadmin.')
      setLoading(false)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal memperbarui kata sandi. Silakan coba lagi.'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F4F5] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      {/* Dynamic Animated Ambient Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-teal-600/15 blur-[120px] animate-pulse duration-1000" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-orange-500/15 blur-[120px] animate-pulse duration-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-400/5 blur-[150px]" />
        
        {/* Subtle SVG Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `radial-gradient(#006677 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-5xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden grid lg:grid-cols-12 animate-fade-in z-10">
        
        {/* Left Hero Panel (Desktop Showcase) */}
        <div className="hidden lg:flex lg:col-span-7 bg-gradient-to-br from-[#004d5a] via-[#006677] to-[#00323c] p-10 flex-col justify-between relative overflow-hidden text-white">
          {/* Background Decorative Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <img src="/logo-bni.png" alt="BNI Logo" className="h-8 w-auto object-contain bg-white/95 px-2 py-1 rounded-xl shadow-md" />
              <h1 className="text-2xl font-black tracking-wide text-white">P-HRIS</h1>
            </div>
            <p className="text-xs text-teal-200 mt-1 font-medium">PT Bank Negara Indonesia (Persero) Tbk</p>
          </div>

          {/* Middle Content Showcase */}
          <div className="relative z-10 my-8 space-y-6">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-teal-200 font-semibold mb-4 backdrop-blur-md">
                <Sparkles size={14} className="text-orange-400" />
                Sistem Informasi SDM Terpadu
              </span>
              <h2 className="text-3xl font-extrabold leading-tight text-white tracking-tight">
                Kelola Data Pegawai & Pembuatan Surat SK Secara Efisien.
              </h2>
              <p className="text-sm text-teal-100/80 mt-3 leading-relaxed">
                Platform terintegrasi untuk pengelolaan administrasi kepegawaian, pencetakan otomatis SK PGS, Cuti, dan Keterangan Kerja dengan standar enkripsi aman.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/15 transition-all">
                <div className="flex items-center gap-2.5 text-xs font-bold text-white mb-1">
                  <CheckCircle2 size={16} className="text-orange-400 shrink-0" />
                  <span>Cetak SK Otomatis</span>
                </div>
                <p className="text-[11px] text-teal-200/80 leading-snug">Generate dokumen SK PDF & Word presisi 1 halaman.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/15 transition-all">
                <div className="flex items-center gap-2.5 text-xs font-bold text-white mb-1">
                  <CheckCircle2 size={16} className="text-orange-400 shrink-0" />
                  <span>Enkripsi Secure Login</span>
                </div>
                <p className="text-[11px] text-teal-200/80 leading-snug">Autentikasi terenkripsi dengan proteksi auto timeout 25 menit.</p>
              </div>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-teal-200/70">
            <span>Regional Office 09 · Kalimantan Barat</span>
            <span>v2.5 Enterprise</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between bg-white/90">
          <div>
            {/* Mobile Header Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <img src="/logo-bni.png" alt="BNI Logo" className="h-7 w-auto object-contain bg-white p-1 rounded-lg border border-gray-100 shadow-xs" />
              <div>
                <h1 className="text-lg font-extrabold text-[#2B3440] leading-none">P-HRIS</h1>
                <p className="text-[11px] text-[#64748B] mt-0.5">Personal Human Resource Information System</p>
              </div>
            </div>

            {/* Session Expiry / Single-Device Conflict Banner */}
            {isTimeout && authMode === 'login' && (
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold mb-6 shadow-sm animate-fade-in">
                <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug">Sesi Anda telah berakhir karena tidak ada aktivitas selama 25 menit. Silakan masuk kembali.</span>
              </div>
            )}
            {isConcurrent && authMode === 'login' && (
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-semibold mb-6 shadow-sm animate-fade-in">
                <Shield size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">Akun Anda baru saja digunakan untuk login di perangkat lain. Sistem menerapkan kebijakan ketat <strong>1 Akun = 1 Perangkat</strong>, sehingga sesi pada perangkat ini telah dinonaktifkan.</span>
              </div>
            )}
            {isTerminated && authMode === 'login' && (
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-100 border border-slate-300 text-xs text-slate-900 font-semibold mb-6 shadow-sm animate-fade-in">
                <Shield size={18} className="text-slate-600 shrink-0 mt-0.5" />
                <span className="leading-snug">Sesi login Anda telah diputuskan oleh Superadmin. Silakan hubungi administrator jika Anda memerlukan akses kembali.</span>
              </div>
            )}

            {/* MODE 1: Standard Login Form */}
            {authMode === 'login' && (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-black text-[#2B3440] tracking-tight">Selamat Datang</h2>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100 text-[11px] font-bold text-teal-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Koneksi Aman
                    </div>
                  </div>
                  <p className="text-xs text-[#64748B]">Silakan masukkan akun ID Pengguna dan kata sandi Anda.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="userId" className="block text-[11px] font-bold text-[#2B3440] uppercase tracking-wider mb-1.5">
                      ID Pengguna (NPP)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <User size={18} />
                      </div>
                      <input
                        id="userId"
                        type="text"
                        value={userId}
                        onChange={e => setUserId(e.target.value)}
                        placeholder="Masukkan ID Pengguna"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-[#2B3440] placeholder:text-gray-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 bg-gray-50/50 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="password" className="block text-[11px] font-bold text-[#2B3440] uppercase tracking-wider">
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot_email')
                          setError('')
                          setInfoMessage('')
                        }}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline transition-colors cursor-pointer"
                      >
                        Lupa Kata Sandi?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock size={18} />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Masukkan kata sandi"
                        required
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-[#2B3440] placeholder:text-gray-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 bg-gray-50/50 focus:bg-white transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors p-1"
                        title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold animate-fade-in flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-700 via-teal-800 to-teal-900 hover:from-teal-800 hover:to-teal-950 text-white font-bold text-xs tracking-wide uppercase shadow-lg shadow-teal-900/20 hover:shadow-teal-900/40 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer group mt-2"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                      </svg>
                    ) : (
                      <>
                        <span>Masuk ke Sistem</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* MODE: Panel Khusus Akun Sedang Aktif di Perangkat Lain */}
            {authMode === 'device_blocked' && (
              <div className="animate-fade-in py-1 space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login')
                    setError('')
                    setBlockedSession(null)
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 font-bold hover:underline transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Kembali ke Halaman Login</span>
                </button>

                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                    <ShieldAlert size={30} className="text-rose-600 animate-pulse" />
                  </div>
                  <h2 className="text-lg font-black text-rose-950 tracking-tight">Akses Masuk Ditolak</h2>
                  <p className="text-xs text-rose-700 font-medium max-w-sm mx-auto leading-relaxed">
                    Akun <strong className="text-rose-950 font-bold">"{userId.trim()}"</strong> saat ini sedang aktif digunakan pada perangkat lain.
                  </p>
                </div>

                {/* Detail Perangkat yang Sedang Aktif */}
                <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-md space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Laptop size={13} className="text-teal-400" /> Perangkat Sedang Aktif
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> ONLINE
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Sistem Operasi:</span>
                      <span className="font-semibold text-white">{blockedSession?.os || 'Windows 11/10'} ({blockedSession?.deviceType || 'Desktop'})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Peramban (Browser):</span>
                      <span className="font-semibold text-teal-300">{blockedSession?.browser || 'Google Chrome'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Alamat IP:</span>
                      <span className="font-mono text-emerald-400 font-bold bg-slate-800 px-2 py-0.5 rounded text-[11px]">{blockedSession?.ipAddress || '36.85.132.38'}</span>
                    </div>
                    {blockedSession?.loginTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Waktu Login:</span>
                        <span className="font-medium text-slate-300 text-[11px]">{formatDate(blockedSession.loginTime)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Petunjuk Kebijakan Keamanan */}
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed space-y-1">
                  <p className="font-bold flex items-center gap-1 text-amber-950">
                    <Lock size={13} className="text-amber-700 shrink-0" /> Kebijakan Keamanan 1 Akun = 1 Perangkat
                  </p>
                  <p className="text-[10.5px]">
                    Sistem P-HRIS melarang login ganda demi keamanan perbankan. Silakan <strong>Keluar (Logout)</strong> dari perangkat di atas terlebih dahulu untuk masuk di perangkat ini.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleLogin()}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-teal-700 via-teal-800 to-teal-900 hover:from-teal-800 hover:to-teal-950 text-white font-bold text-xs tracking-wide uppercase transition-all shadow-md active:scale-[0.99] cursor-pointer"
                  >
                    {loading ? (
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                      </svg>
                    ) : (
                      <>
                        <RefreshCw size={14} />
                        <span>Cek Ulang & Masuk Kembali</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login')
                      setError('')
                      setBlockedSession(null)
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-[#64748B] hover:text-[#2B3440] font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Gunakan Akun Lain
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: Request Reset Password Link */}
            {authMode === 'forgot_email' && (
              <div className="animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login')
                    setError('')
                    setInfoMessage('')
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 font-bold mb-4 hover:underline transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Kembali ke Halaman Login</span>
                </button>

                <div className="mb-6">
                  <h2 className="text-xl font-black text-[#2B3440] tracking-tight flex items-center gap-2">
                    <KeyRound size={22} className="text-teal-600" />
                    Lupa Kata Sandi
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1.5">
                    Masukkan ID Pengguna (NPP) atau Email terdaftar Anda. Tautan pemulihan kata sandi akan langsung dikirimkan ke email Anda.
                  </p>
                </div>

                {infoMessage && (
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-800 font-medium mb-5 animate-fade-in flex items-start gap-2.5 shadow-xs">
                    <Mail size={18} className="text-teal-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span>{infoMessage}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleRequestResetLink} className="space-y-4">
                  <div>
                    <label htmlFor="resetEmailInput" className="block text-[11px] font-bold text-[#2B3440] uppercase tracking-wider mb-1.5">
                      ID Pengguna (NPP) / Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <User size={18} />
                      </div>
                      <input
                        id="resetEmailInput"
                        type="text"
                        value={resetEmailInput}
                        onChange={e => setResetEmailInput(e.target.value)}
                        placeholder="Contoh: P057760 atau email@bni.co.id"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-[#2B3440] placeholder:text-gray-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 bg-gray-50/50 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium animate-fade-in space-y-2">
                      <div className="flex items-center gap-2 font-bold text-red-800">
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-700 via-teal-800 to-teal-900 hover:from-teal-800 hover:to-teal-950 text-white font-bold text-xs tracking-wide uppercase shadow-lg shadow-teal-900/20 hover:shadow-teal-900/40 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer group mt-2"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                      </svg>
                    ) : (
                      <>
                        <span>Kirim Tautan Reset Password</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* MODE 3: Halaman Ganti Password Baru (Diakses Otomatis dari Link Email) */}
            {authMode === 'reset_password' && (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-xl font-black text-[#2B3440] tracking-tight flex items-center gap-2">
                    <Lock size={22} className="text-teal-600" />
                    Buat Kata Sandi Baru
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1.5">
                    Tautan email terverifikasi. Masukkan kata sandi baru untuk akun Anda.
                  </p>
                </div>

                {infoMessage && (
                  <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-800 font-medium mb-4 animate-fade-in flex items-center gap-2">
                    <Sparkles size={16} className="text-teal-600 shrink-0" />
                    <span>{infoMessage}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label htmlFor="newPassword" className="block text-[11px] font-bold text-[#2B3440] uppercase tracking-wider mb-1.5">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock size={18} />
                      </div>
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Masukkan kata sandi baru (min 6 karakter)"
                        required
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-[#2B3440] placeholder:text-gray-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 bg-gray-50/50 focus:bg-white transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(s => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors p-1"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmNewPassword" className="block text-[11px] font-bold text-[#2B3440] uppercase tracking-wider mb-1.5">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock size={18} />
                      </div>
                      <input
                        id="confirmNewPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        required
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-[#2B3440] placeholder:text-gray-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 bg-gray-50/50 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold animate-fade-in flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-700 via-teal-800 to-teal-900 hover:from-teal-800 hover:to-teal-950 text-white font-bold text-xs tracking-wide uppercase shadow-lg shadow-teal-900/20 hover:shadow-teal-900/40 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer group mt-2"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                      </svg>
                    ) : (
                      <>
                        <span>Simpan Kata Sandi Baru</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* MODE 4: Halaman Sukses Password Berhasil Diperbarui */}
            {authMode === 'success' && (
              <div className="animate-fade-in py-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#2B3440] tracking-tight">Kata Sandi Berhasil Diperbarui!</h2>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed px-4">
                    Kata sandi Anda telah berhasil diubah. Silakan masuk menggunakan ID Pengguna dan kata sandi baru Anda.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login')
                      setError('')
                      setInfoMessage('')
                      window.history.replaceState(null, '', window.location.pathname)
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs tracking-wide uppercase transition-all shadow-md cursor-pointer"
                  >
                    <span>Masuk ke Halaman Login</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Card Footer */}
          <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <div className="flex items-center gap-1.5 text-teal-700 font-medium">
              <Shield size={13} />
              <span>Proteksi Data Terenkripsi</span>
            </div>
            <span>© 2026 P-HRIS</span>
          </div>
        </div>
      </div>
    </div>
  )
}
