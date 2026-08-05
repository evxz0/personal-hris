import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, LogIn, Shield, Clock } from 'lucide-react'

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
      setError('ID Pengguna atau kata sandi salah.')
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-teal-300/5 blur-2xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          <div className="px-8 py-10">

            {/* Timeout Notification */}
            {isTimeout && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold mb-5 shadow-2xs">
                <Clock size={18} className="text-amber-600 shrink-0" />
                <span>Sesi Anda telah berakhir karena tidak ada aktivitas selama 1 jam. Silakan masuk kembali.</span>
              </div>
            )}

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-xl bg-teal-50 border border-teal-100">
              <Shield size={14} className="text-teal-600" />
              <span className="text-xs text-teal-700 font-medium">Koneksi Aman & Terenkripsi</span>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="userId" className="block text-xs font-semibold text-[#2B3440] uppercase tracking-wide mb-1.5">
                  ID Pengguna
                </label>
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  placeholder="Masukkan ID Pengguna"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#2B3440] placeholder:text-[#64748B] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[#2B3440] uppercase tracking-wide mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    required
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm text-[#2B3440] placeholder:text-[#64748B] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-teal-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-medium animate-fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-teal-200 hover:shadow-teal-300"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                  </svg>
                ) : <LogIn size={18} />}
                {loading ? 'Masuk...' : 'Masuk'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-[#F4F7F6] text-center">
            <p className="text-xs text-[#64748B]">© 2026 P-HRIS · Sistem Informasi SDM · Confidential</p>
          </div>
        </div>
      </div>
    </div>
  )
}
