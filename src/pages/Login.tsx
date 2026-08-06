import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Shield, Clock, User, Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const isTimeout = new URLSearchParams(window.location.search).get('reason') === 'timeout'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // User ID "61582" → email format for Supabase
    const email = `${userId}@phris.local`

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('ID Pengguna atau kata sandi tidak sesuai.')
    } else {
      navigate('/')
    }
    setLoading(false)
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
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <span className="text-white font-black text-xl tracking-tight">P</span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-wide leading-none text-white">P-HRIS</h1>
                <p className="text-xs text-teal-200 mt-1 font-medium">PT Bank Negara Indonesia (Persero) Tbk</p>
              </div>
            </div>
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
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-md">
                <span className="text-white font-extrabold text-base">P</span>
              </div>
              <div>
                <h1 className="text-base font-extrabold text-[#2B3440] leading-none">P-HRIS</h1>
                <p className="text-[11px] text-[#64748B] mt-0.5">Sistem Informasi SDM</p>
              </div>
            </div>

            {/* Timeout Banner */}
            {isTimeout && (
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold mb-6 shadow-sm animate-fade-in">
                <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug">Sesi Anda telah berakhir karena tidak ada aktivitas selama 25 menit. Silakan masuk kembali.</span>
              </div>
            )}

            {/* Login Card Title Header */}
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

            {/* Login Form */}
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
                <label htmlFor="password" className="block text-[11px] font-bold text-[#2B3440] uppercase tracking-wider mb-1.5">
                  Kata Sandi
                </label>
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

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold animate-fade-in flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
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
