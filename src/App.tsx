import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { useIdleTimeout } from './hooks/useIdleTimeout'
import { Layout } from './components/layout/Layout'
import LoginPage from './pages/Login'
import Dashboard from './pages/Dashboard'
import KaryawanPage from './pages/Karyawan'
import BinaPage from './pages/Bina'
import MagangPage from './pages/Magang'
import AbsensiPage from './pages/Absensi'
import SettingsPage from './pages/Settings'
import RiwayatPage from './pages/Riwayat'
import RiwayatSuratPage from './pages/RiwayatSurat'
import SuratPgsPage from './pages/surat/SuratPgs'
import SuratBalasanCutiPage from './pages/surat/SuratBalasanCuti'
import SuratKeteranganKerjaPage from './pages/surat/SuratKeteranganKerja'
import SuratCustomPage from './pages/surat/SuratCustom'
import SuperadminPage from './pages/Superadmin'

function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  const localAuth = localStorage.getItem('phris_authenticated_user')
  if (!session && !localAuth) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function SuperadminRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  const localAuth = localStorage.getItem('phris_authenticated_user')
  if (!session && !localAuth) return <Navigate to="/login?redirect=/superadmin" replace />
  return <>{children}</>
}

function LoginRoute({ session }: { session: Session | null }) {
  const localAuth = localStorage.getItem('phris_authenticated_user')
  const user = session?.user || (localAuth ? JSON.parse(localAuth) : null)
  
  if (user) {
    const email = (user.email || '').toLowerCase()
    const name = (user.user_metadata?.name || '').toLowerCase()
    if (email.includes('superadmin') || name.includes('superadmin')) {
      return <Navigate to="/superadmin" replace />
    }
    return <Navigate to="/" replace />
  }
  return <LoginPage />
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const local = localStorage.getItem('phris_authenticated_user')
      if (local) return { user: JSON.parse(local) } as any
    } catch {}
    return null
  })
  const [loading, setLoading] = useState(true)

  // Attach 1-hour idle timeout listener when session is active
  useIdleTimeout(!!session)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session)
      } else {
        const local = localStorage.getItem('phris_authenticated_user')
        if (local) setSession({ user: JSON.parse(local) } as any)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session)
      } else {
        const local = localStorage.getItem('phris_authenticated_user')
        if (local) setSession({ user: JSON.parse(local) } as any)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-xl animate-pulse">
            <span className="text-white font-black text-2xl">P</span>
          </div>
          <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-[#64748B] font-medium">Memuat P-HRIS...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute session={session} />} />

        <Route path="/" element={<ProtectedRoute session={session}><Dashboard /></ProtectedRoute>} />
        <Route path="/karyawan" element={<ProtectedRoute session={session}><KaryawanPage /></ProtectedRoute>} />
        <Route path="/bina" element={<ProtectedRoute session={session}><BinaPage /></ProtectedRoute>} />
        <Route path="/magang" element={<ProtectedRoute session={session}><MagangPage /></ProtectedRoute>} />
        <Route path="/absensi" element={<ProtectedRoute session={session}><AbsensiPage /></ProtectedRoute>} />
        
        {/* Surat Keterangan Routes */}
        <Route path="/surat/pgs" element={<ProtectedRoute session={session}><SuratPgsPage /></ProtectedRoute>} />
        <Route path="/surat/balasan-cuti" element={<ProtectedRoute session={session}><SuratBalasanCutiPage /></ProtectedRoute>} />
        <Route path="/surat/keterangan-kerja" element={<ProtectedRoute session={session}><SuratKeteranganKerjaPage /></ProtectedRoute>} />
        <Route path="/surat/custom" element={<ProtectedRoute session={session}><SuratCustomPage /></ProtectedRoute>} />

        {/* Riwayat Dropdown Routes */}
        <Route path="/riwayat" element={<Navigate to="/riwayat/karyawan" replace />} />
        <Route path="/riwayat/karyawan" element={<ProtectedRoute session={session}><RiwayatPage /></ProtectedRoute>} />
        <Route path="/riwayat/surat" element={<ProtectedRoute session={session}><RiwayatSuratPage /></ProtectedRoute>} />

        <Route path="/settings" element={<ProtectedRoute session={session}><SettingsPage /></ProtectedRoute>} />
        <Route path="/superadmin" element={<SuperadminRoute session={session}><SuperadminPage /></SuperadminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
