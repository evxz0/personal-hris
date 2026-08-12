import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface UserSession {
  id: string
  userId: string
  username: string
  email: string
  nama: string
  role: 'SUPERADMIN' | 'ADMIN_HR' | 'OPERATOR' | 'VIEWER'
  ipAddress: string
  location?: string
  browser: string
  os: string
  deviceType: 'Desktop' | 'Mobile' | 'Tablet'
  userAgent: string
  loginTime: string
  lastActiveTime: string
  status: 'ONLINE' | 'IDLE' | 'OFFLINE'
}

let globalPresenceChannel: RealtimeChannel | null = null
let presenceListeners: Array<(sessions: UserSession[]) => void> = []

// Parse User-Agent into human-readable Browser, OS, and Device
export function parseUserAgent(ua: string = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  let browser = 'Chrome'
  let os = 'Windows 11'
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop'

  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) {
    deviceType = 'Tablet'
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(ua)) {
    deviceType = 'Mobile'
  }

  if (/Windows NT 10.0|Windows NT 11.0/i.test(ua)) os = 'Windows 11/10'
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1'
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7'
  else if (/Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X ([\d_]+)/)
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS'
  } else if (/Android/i.test(ua)) {
    const match = ua.match(/Android ([\d.]+)/)
    os = match ? `Android ${match[1]}` : 'Android'
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    const match = ua.match(/OS ([\d_]+)/)
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS'
  } else if (/Linux/i.test(ua)) {
    os = 'Linux'
  }

  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge'
  else if (/Chrome\//i.test(ua) && !/Chromium|Edg/i.test(ua)) browser = 'Google Chrome'
  else if (/Safari\//i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua)) browser = 'Apple Safari'
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox'
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera'

  return { browser, os, deviceType }
}

// Fetch public IP address with multiple fallbacks
export async function getPublicIP(): Promise<{ ip: string; location?: string }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      return { ip: data.ip || '114.122.208.14', location: 'Pontianak, ID' }
    }
  } catch {}

  try {
    const res2 = await fetch('https://api.myip.com')
    if (res2.ok) {
      const data = await res2.json()
      return { ip: data.ip || '114.122.208.14', location: data.country || 'Indonesia' }
    }
  } catch {}

  return { ip: '114.122.208.14', location: 'Pontianak, ID' }
}

export function getCurrentSessionId(): string {
  let id = localStorage.getItem('phris_current_session_id')
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    localStorage.setItem('phris_current_session_id', id)
  }
  return id
}

// Get or build live session object for current user
export function getLocalLiveSession(): UserSession {
  const sessionId = getCurrentSessionId()
  const authUserRaw = localStorage.getItem('phris_authenticated_user')
  let username = localStorage.getItem('phris_current_user_name') || 'superadmin'
  let nama = 'SUPER ADMINISTRATOR BNI'
  let role: 'SUPERADMIN' | 'ADMIN_HR' | 'OPERATOR' | 'VIEWER' = 'SUPERADMIN'
  let email = `${username}@phris.local`

  if (authUserRaw) {
    try {
      const parsed = JSON.parse(authUserRaw)
      username = parsed.username || username
      nama = parsed.nama || nama
      role = parsed.role || (username.toLowerCase().includes('super') ? 'SUPERADMIN' : 'ADMIN_HR')
      email = parsed.email || `${username}@phris.local`
    } catch {}
  }

  const { browser, os, deviceType } = parseUserAgent()
  const loginTime = localStorage.getItem('phris_login_time') || new Date().toISOString()

  return {
    id: sessionId,
    userId: username,
    username,
    email,
    nama,
    role,
    ipAddress: '114.122.208.14',
    location: 'Pontianak, Kalimantan Barat',
    browser,
    os,
    deviceType,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    loginTime,
    lastActiveTime: new Date().toISOString(),
    status: 'ONLINE',
  }
}

// Initialize Supabase Realtime Presence & Remote Logout Broadcast Listener
export function initRealtimeSessionTracker(user?: {
  id?: string
  email?: string
  user_metadata?: any
}) {
  if (globalPresenceChannel) {
    return globalPresenceChannel
  }

  const sessionId = getCurrentSessionId()
  const username = user?.email ? user.email.split('@')[0] : (localStorage.getItem('phris_current_user_name') || 'superadmin')
  const email = user?.email || `${username}@phris.local`
  const isSuperadmin = email.toLowerCase().includes('superadmin') || user?.user_metadata?.role?.toLowerCase() === 'superadmin'
  const role = isSuperadmin ? 'SUPERADMIN' : (user?.user_metadata?.role || 'ADMIN_HR')
  const nama = user?.user_metadata?.nama || username.toUpperCase()

  localStorage.setItem('phris_current_user_name', username)
  if (!localStorage.getItem('phris_login_time')) {
    localStorage.setItem('phris_login_time', new Date().toISOString())
  }

  const channel = supabase.channel('phris_realtime_presence_v1', {
    config: {
      presence: {
        key: sessionId,
      },
    },
  })

  // Listen to remote force logout commands
  channel.on('broadcast', { event: 'FORCE_LOGOUT' }, async (payload: any) => {
    const targetSessionId = payload?.payload?.sessionId
    const targetUsername = payload?.payload?.username

    const mySessionId = localStorage.getItem('phris_current_session_id')
    const myUsername = localStorage.getItem('phris_current_user_name')

    if (
      (targetSessionId && targetSessionId === mySessionId) ||
      (targetUsername && targetUsername.toLowerCase() === myUsername?.toLowerCase())
    ) {
      try {
        await supabase.auth.signOut()
      } catch {}
      localStorage.removeItem('phris_authenticated_user')
      localStorage.removeItem('phris_current_session_id')
      localStorage.removeItem('phris_current_user_name')
      localStorage.removeItem('phris_login_time')
      window.location.href = '/login?reason=terminated'
    }
  })

  // Listen to Presence Sync events
  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState<UserSession>()
    const activeSessions: UserSession[] = []

    Object.values(state).forEach(presenceList => {
      presenceList.forEach(item => {
        if (item && item.id) {
          activeSessions.push(item)
        }
      })
    })

    // Deduplicate by sessionId
    const uniqueMap = new Map<string, UserSession>()
    activeSessions.forEach(s => uniqueMap.set(s.id, s))

    // Always ensure current session is present
    const current = getLocalLiveSession()
    if (!uniqueMap.has(current.id)) {
      uniqueMap.set(current.id, current)
    }

    const result = Array.from(uniqueMap.values())
    presenceListeners.forEach(listener => listener(result))
  })

  // Subscribe and track presence
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      const { ip, location } = await getPublicIP()
      const { browser, os, deviceType } = parseUserAgent()
      const loginTime = localStorage.getItem('phris_login_time') || new Date().toISOString()

      const currentSession: UserSession = {
        id: sessionId,
        userId: user?.id || username,
        username,
        email,
        nama,
        role: role as any,
        ipAddress: ip,
        location,
        browser,
        os,
        deviceType,
        userAgent: navigator.userAgent,
        loginTime,
        lastActiveTime: new Date().toISOString(),
        status: 'ONLINE',
      }

      await channel.track(currentSession)
    }
  })

  globalPresenceChannel = channel
  return channel
}

// Subscribe component to live realtime sessions
export function subscribeToRealtimeSessions(callback: (sessions: UserSession[]) => void) {
  presenceListeners.push(callback)

  // Trigger immediately with current state or fallback
  if (globalPresenceChannel) {
    const state = globalPresenceChannel.presenceState<UserSession>()
    const activeSessions: UserSession[] = []
    Object.values(state).forEach(presenceList => {
      presenceList.forEach(item => {
        if (item && item.id) activeSessions.push(item)
      })
    })
    if (activeSessions.length > 0) {
      callback(activeSessions)
    } else {
      callback([getLocalLiveSession()])
    }
  } else {
    callback([getLocalLiveSession()])
  }

  return () => {
    presenceListeners = presenceListeners.filter(l => l !== callback)
  }
}

// Record login and broadcast presence
export async function recordUserLogin(userData: {
  userId?: string
  username: string
  email?: string
  nama?: string
  role?: 'SUPERADMIN' | 'ADMIN_HR' | 'OPERATOR' | 'VIEWER'
}) {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const now = new Date().toISOString()

  localStorage.setItem('phris_current_session_id', sessionId)
  localStorage.setItem('phris_current_user_name', userData.username)
  localStorage.setItem('phris_login_time', now)

  const { ip, location } = await getPublicIP()
  const { browser, os, deviceType } = parseUserAgent()

  const newSession: UserSession = {
    id: sessionId,
    userId: userData.userId || userData.username,
    username: userData.username,
    email: userData.email || `${userData.username}@phris.local`,
    nama: userData.nama || userData.username.toUpperCase(),
    role: userData.role || (userData.username.toLowerCase().includes('super') ? 'SUPERADMIN' : 'ADMIN_HR'),
    ipAddress: ip,
    location,
    browser,
    os,
    deviceType,
    userAgent: navigator.userAgent,
    loginTime: now,
    lastActiveTime: now,
    status: 'ONLINE',
  }

  // Track via channel if active
  if (globalPresenceChannel) {
    try {
      await globalPresenceChannel.track(newSession)
    } catch {}
  }

  // Insert audit log
  try {
    await supabase.from('audit_logs').insert({
      user_operasi: userData.username,
      aksi: 'USER_LOGIN',
      detail_perubahan: JSON.stringify({
        sessionId,
        ip,
        browser,
        os,
        deviceType,
        timestamp: now,
      }),
      timestamp: now,
      device_info: `${browser} on ${os} (${deviceType}) [IP: ${ip}]`,
    })
  } catch {}

  return newSession
}

// Record user logout and broadcast untrack
export async function recordUserLogout(username?: string) {
  const sessionId = localStorage.getItem('phris_current_session_id')
  const user = username || localStorage.getItem('phris_current_user_name') || 'user'
  const now = new Date().toISOString()

  localStorage.removeItem('phris_current_session_id')
  localStorage.removeItem('phris_current_user_name')
  localStorage.removeItem('phris_login_time')

  if (globalPresenceChannel) {
    try {
      await globalPresenceChannel.untrack()
    } catch {}
  }

  try {
    await supabase.from('audit_logs').insert({
      user_operasi: user,
      aksi: 'USER_LOGOUT',
      detail_perubahan: JSON.stringify({
        sessionId,
        username: user,
        timestamp: now,
      }),
      timestamp: now,
      device_info: `Logout manual [Sesi: ${sessionId || 'active'}]`,
    })
  } catch {}
}

// Terminate a session (Local or Remote)
export async function terminateTargetSession(sessionId: string) {
  const currentSessionId = localStorage.getItem('phris_current_session_id')

  // Log in database
  try {
    await supabase.from('audit_logs').insert({
      user_operasi: 'superadmin',
      aksi: 'FORCE_LOGOUT',
      detail_perubahan: JSON.stringify({
        sessionId,
        timestamp: new Date().toISOString(),
      }),
      timestamp: new Date().toISOString(),
      device_info: `Diputus paksa oleh Superadmin [Sesi: ${sessionId}]`,
    })
  } catch {}

  // Broadcast to all devices via realtime channel
  if (globalPresenceChannel) {
    try {
      await globalPresenceChannel.send({
        type: 'broadcast',
        event: 'FORCE_LOGOUT',
        payload: { sessionId },
      })
    } catch {}
  }

  // If terminating own session, immediately logout and redirect
  if (!sessionId || sessionId === currentSessionId || sessionId.includes('live')) {
    try {
      await supabase.auth.signOut()
    } catch {}
    localStorage.removeItem('phris_authenticated_user')
    localStorage.removeItem('phris_current_session_id')
    localStorage.removeItem('phris_current_user_name')
    localStorage.removeItem('phris_login_time')
    window.location.href = '/login?reason=terminated'
  }
}
