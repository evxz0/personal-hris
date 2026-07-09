import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Layout } from './components/layout/Layout'
import LoginPage from './pages/Login'
import Dashboard from './pages/Dashboard'
import KaryawanPage from './pages/Karyawan'
import BinaPage from './pages/Bina'
import MagangPage from './pages/Magang'
import AbsensiPage from './pages/Absensi'
import { RequestNaikLevelPage, RequestPinpadPage } from './pages/Request'
import SettingsPage from './pages/Settings'

function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
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
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />

        <Route path="/" element={<ProtectedRoute session={session}><Dashboard /></ProtectedRoute>} />
        <Route path="/karyawan" element={<ProtectedRoute session={session}><KaryawanPage /></ProtectedRoute>} />
        <Route path="/bina" element={<ProtectedRoute session={session}><BinaPage /></ProtectedRoute>} />
        <Route path="/magang" element={<ProtectedRoute session={session}><MagangPage /></ProtectedRoute>} />
        <Route path="/absensi" element={<ProtectedRoute session={session}><AbsensiPage /></ProtectedRoute>} />
        <Route path="/request/naik-level" element={<ProtectedRoute session={session}><RequestNaikLevelPage /></ProtectedRoute>} />
        <Route path="/request/pinpad" element={<ProtectedRoute session={session}><RequestPinpadPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute session={session}><SettingsPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
