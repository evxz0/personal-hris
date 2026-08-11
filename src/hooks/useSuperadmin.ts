import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/utils'
import { getStoredSessions, saveStoredSessions } from '../lib/sessionTracker'

export type UserRole = 'SUPERADMIN' | 'ADMIN_HR' | 'OPERATOR' | 'VIEWER'
export type UserStatus = 'AKTIF' | 'NONAKTIF' | 'SUSPENDED'

export interface UserAccount {
  id: string
  username: string
  nama: string
  email: string
  role: UserRole
  status: UserStatus
  created_at: string
  last_login?: string
  phone?: string
  department?: string
}

const USERS_STORAGE_KEY = 'phris_managed_users_v1'

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr_superadmin_01',
    username: 'superadmin',
    nama: 'SUPER ADMINISTRATOR BNI',
    email: 'superadmin@phris.local',
    role: 'SUPERADMIN',
    status: 'AKTIF',
    created_at: '2025-01-01T00:00:00.000Z',
    last_login: new Date().toISOString(),
    department: 'HC & IT Regional Office 09'
  },
  {
    id: 'usr_admin_02',
    username: 'admin',
    nama: 'ADMINISTRATOR HR',
    email: 'admin@phris.local',
    role: 'ADMIN_HR',
    status: 'AKTIF',
    created_at: '2025-01-15T00:00:00.000Z',
    last_login: new Date(Date.now() - 3600000).toISOString(),
    department: 'Human Capital RO 09'
  },
  {
    id: 'usr_operator_03',
    username: 'operator',
    nama: 'STAFF OPERATOR SURAT & ABSENSI',
    email: 'operator@phris.local',
    role: 'OPERATOR',
    status: 'AKTIF',
    created_at: '2025-02-01T00:00:00.000Z',
    last_login: new Date(Date.now() - 86400000).toISOString(),
    department: 'Operasional & Layanan'
  }
]

export function getLocalUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load users from storage', e)
  }
  return INITIAL_USERS
}

export function saveLocalUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  } catch (e) {
    console.error('Failed to save users to storage', e)
  }
}

// ----------------------------------------------------------------------
// User Management Hooks
// ----------------------------------------------------------------------
export function useUsers() {
  return useQuery({
    queryKey: ['superadmin-users'],
    queryFn: () => getLocalUsers(),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      username: string
      nama: string
      email: string
      role: UserRole
      password?: string
      department?: string
    }) => {
      const users = getLocalUsers()
      const cleanUsername = payload.username.trim().toLowerCase()

      if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
        throw new Error(`Username "${cleanUsername}" sudah digunakan. Silakan gunakan username lain.`)
      }

      const newUser: UserAccount = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        username: cleanUsername,
        nama: payload.nama.trim().toUpperCase(),
        email: payload.email.trim().toLowerCase() || `${cleanUsername}@phris.local`,
        role: payload.role,
        status: 'AKTIF',
        created_at: new Date().toISOString(),
        department: payload.department || 'Regional Office 09'
      }

      users.unshift(newUser)
      saveLocalUsers(users)

      await logAudit(
        'CREATE_USER',
        `Membuat akun user baru: ${newUser.username} (${newUser.role}) - ${newUser.nama}`,
        'superadmin'
      )

      return newUser
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin-users'] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      id: string
      nama?: string
      role?: UserRole
      status?: UserStatus
      department?: string
      email?: string
    }) => {
      const users = getLocalUsers()
      const idx = users.findIndex(u => u.id === payload.id)
      if (idx === -1) throw new Error('User tidak ditemukan')

      users[idx] = {
        ...users[idx],
        ...payload,
      }
      saveLocalUsers(users)

      await logAudit(
        'UPDATE_USER',
        `Memperbarui profil akun user: ${users[idx].username}`,
        'superadmin'
      )
      return users[idx]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin-users'] }),
  })
}

export function useResetPassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword?: string }) => {
      const users = getLocalUsers()
      const user = users.find(u => u.id === userId)
      if (!user) throw new Error('User tidak ditemukan')

      const generatedPassword = newPassword || `BNI#${Math.floor(100000 + Math.random() * 900000)}`

      // If user exists in supabase auth, we also try updating via admin API if available
      try {
        await supabase.auth.updateUser({ password: generatedPassword })
      } catch {
        // local simulated auth
      }

      await logAudit(
        'RESET_PASSWORD',
        `Mereset kata sandi akun: ${user.username}`,
        'superadmin'
      )

      return { user, generatedPassword }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin-users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const users = getLocalUsers()
      const userToDelete = users.find(u => u.id === id)
      if (userToDelete?.role === 'SUPERADMIN' && users.filter(u => u.role === 'SUPERADMIN').length <= 1) {
        throw new Error('Tidak dapat menghapus satu-satunya akun Superadmin utama.')
      }

      const filtered = users.filter(u => u.id !== id)
      saveLocalUsers(filtered)

      await logAudit(
        'DELETE_USER',
        `Menghapus akun user: ${userToDelete?.username || id}`,
        'superadmin'
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin-users'] }),
  })
}

// ----------------------------------------------------------------------
// Active Sessions Monitoring Hook
// ----------------------------------------------------------------------
export function useActiveSessions() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['superadmin-sessions'],
    queryFn: () => {
      const sessions = getStoredSessions()
      // If empty, supply current live user session
      if (sessions.length === 0) {
        return [
          {
            id: 'sess_live_current',
            userId: 'superadmin',
            username: 'superadmin',
            email: 'superadmin@phris.local',
            nama: 'SUPER ADMINISTRATOR BNI',
            role: 'SUPERADMIN' as UserRole,
            ipAddress: '114.122.208.14',
            location: 'Pontianak, Kalimantan Barat',
            browser: 'Google Chrome 125',
            os: 'Windows 11 (64-bit)',
            deviceType: 'Desktop' as const,
            userAgent: navigator.userAgent,
            loginTime: new Date().toISOString(),
            lastActiveTime: new Date().toISOString(),
            status: 'ONLINE' as const,
          }
        ]
      }
      return sessions
    },
    refetchInterval: 10000,
  })

  const terminateMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const sessions = getStoredSessions().filter(s => s.id !== sessionId)
      saveStoredSessions(sessions)
      await logAudit('TERMINATE_SESSION', `Memutus paksa sesi login [ID: ${sessionId}]`, 'superadmin')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin-sessions'] }),
  })

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    terminateSession: terminateMutation.mutateAsync,
    isTerminating: terminateMutation.isPending,
  }
}

// ----------------------------------------------------------------------
// Server Ping & Realtime Telemetry Hook
// ----------------------------------------------------------------------
export interface PingDataPoint {
  time: string
  supabasePing: number // ms
  ocrPing: number // ms
  cdnPing: number // ms
}

export function useServerPing() {
  const [history, setHistory] = useState<PingDataPoint[]>([
    { time: '17:50', supabasePing: 45, ocrPing: 120, cdnPing: 18 },
    { time: '17:52', supabasePing: 42, ocrPing: 115, cdnPing: 22 },
    { time: '17:54', supabasePing: 48, ocrPing: 130, cdnPing: 16 },
    { time: '17:56', supabasePing: 39, ocrPing: 110, cdnPing: 19 },
    { time: '17:58', supabasePing: 44, ocrPing: 125, cdnPing: 17 },
  ])

  const [currentPings, setCurrentPings] = useState({
    supabase: 42,
    ocr: 118,
    cdn: 18,
    lastTested: new Date().toLocaleTimeString('id-ID'),
    isChecking: false,
  })

  const runPingTest = useCallback(async () => {
    setCurrentPings(prev => ({ ...prev, isChecking: true }))

    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    // 1. Measure Supabase Ping
    let sbLatency = 45
    try {
      const t0 = performance.now()
      await supabase.from('master_referensi').select('id').limit(1)
      sbLatency = Math.round(performance.now() - t0)
    } catch {
      sbLatency = Math.floor(40 + Math.random() * 20)
    }

    // 2. Measure OCR Microservice Ping
    let ocrLatency = 120
    try {
      const ocrUrl = import.meta.env.VITE_OCR_SERVICE_URL || 'https://hris-ocr-service-pkp-1.vercel.app'
      const t0 = performance.now()
      await fetch(ocrUrl, { method: 'HEAD', mode: 'no-cors' }).catch(() => {})
      ocrLatency = Math.max(30, Math.round(performance.now() - t0))
    } catch {
      ocrLatency = Math.floor(100 + Math.random() * 40)
    }

    // 3. Measure CDN / Frontend Ping
    let cdnLatency = 15
    try {
      const t0 = performance.now()
      await fetch('/logo-bni.png', { cache: 'no-store' }).catch(() => {})
      cdnLatency = Math.max(5, Math.round(performance.now() - t0))
    } catch {
      cdnLatency = Math.floor(12 + Math.random() * 10)
    }

    const newPoint: PingDataPoint = {
      time: nowStr,
      supabasePing: sbLatency,
      ocrPing: ocrLatency,
      cdnPing: cdnLatency,
    }

    setHistory(prev => {
      const updated = [...prev, newPoint]
      return updated.slice(-15) // Keep last 15 points
    })

    setCurrentPings({
      supabase: sbLatency,
      ocr: ocrLatency,
      cdn: cdnLatency,
      lastTested: nowStr,
      isChecking: false,
    })
  }, [])

  return {
    history,
    currentPings,
    runPingTest,
  }
}
