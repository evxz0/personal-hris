import { supabase } from './supabase'

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

const SESSIONS_STORAGE_KEY = 'phris_active_sessions_v1'

// Parse User-Agent into human-readable Browser, OS, and Device
export function parseUserAgent(ua: string = navigator.userAgent) {
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop'

  // Device Type
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) {
    deviceType = 'Tablet'
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(ua)) {
    deviceType = 'Mobile'
  }

  // OS Detection
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

  // Browser Detection
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
    const timeoutId = setTimeout(() => controller.abort(), 3500)
    
    // Try ipify first
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      return { ip: data.ip || '127.0.0.1', location: 'Indonesia' }
    }
  } catch (e) {
    // ignore and fallback
  }

  try {
    const res2 = await fetch('https://api.myip.com')
    if (res2.ok) {
      const data = await res2.json()
      return { ip: data.ip || '127.0.0.1', location: data.country || 'Indonesia' }
    }
  } catch {
    // fallback
  }

  return { ip: '114.122.208.14', location: 'Pontianak, ID' }
}

export function getStoredSessions(): UserSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load stored sessions', e)
  }
  return []
}

export function saveStoredSessions(sessions: UserSession[]): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
  } catch (e) {
    console.error('Failed to save sessions', e)
  }
}

// Record a new login session and synchronize across devices
export async function recordUserLogin(userData: {
  userId?: string
  username: string
  email?: string
  nama?: string
  role?: 'SUPERADMIN' | 'ADMIN_HR' | 'OPERATOR' | 'VIEWER'
}) {
  const { ip, location } = await getPublicIP()
  const { browser, os, deviceType } = parseUserAgent()
  const now = new Date().toISOString()
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  // Store active session token locally
  localStorage.setItem('phris_current_session_id', sessionId)
  localStorage.setItem('phris_current_user_name', userData.username)

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

  // Update local cache
  const currentSessions = getStoredSessions().filter(s => s.id !== sessionId)
  currentSessions.unshift(newSession)
  saveStoredSessions(currentSessions)

  // Synchronize with shared Supabase database
  try {
    await supabase.from('audit_logs').insert({
      user_operasi: userData.username,
      aksi: 'USER_LOGIN',
      detail_perubahan: JSON.stringify({
        sessionId,
        userId: newSession.userId,
        username: newSession.username,
        email: newSession.email,
        nama: newSession.nama,
        role: newSession.role,
        ip,
        location,
        browser,
        os,
        deviceType,
        userAgent: navigator.userAgent,
        timestamp: now,
      }),
      timestamp: now,
      device_info: `${browser} on ${os} (${deviceType}) [IP: ${ip}]`,
    })
  } catch (e) {
    console.error('Audit log login failed', e)
  }

  return newSession
}

// Record a user logout and broadcast to other devices
export async function recordUserLogout(username?: string) {
  const sessionId = localStorage.getItem('phris_current_session_id')
  const user = username || localStorage.getItem('phris_current_user_name') || 'user'
  const now = new Date().toISOString()

  localStorage.removeItem('phris_current_session_id')
  localStorage.removeItem('phris_current_user_name')

  if (sessionId || user) {
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
    } catch (e) {
      console.error('Audit log logout failed', e)
    }
  }

  // Remove from local cache
  const sessions = getStoredSessions().filter(s => s.id !== sessionId && s.username !== user)
  saveStoredSessions(sessions)
}

// Fetch all active sessions across all devices from Supabase audit logs
export async function fetchGlobalActiveSessions(): Promise<UserSession[]> {
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .in('aksi', ['USER_LOGIN', 'USER_LOGOUT', 'FORCE_LOGOUT', 'USER_TERMINATE'])
      .order('timestamp', { ascending: false })
      .limit(100)

    if (error || !logs || logs.length === 0) {
      return getStoredSessions()
    }

    const sessionMap = new Map<string, UserSession>()
    const loggedOutSessions = new Set<string>()
    const loggedOutUsers = new Map<string, string>() // username -> logout timestamp

    // 1. Identify logouts first (since logs are ordered by timestamp DESC)
    for (const log of logs) {
      if (log.aksi === 'USER_LOGOUT' || log.aksi === 'FORCE_LOGOUT' || log.aksi === 'USER_TERMINATE') {
        let details: any = {}
        try {
          details = typeof log.detail_perubahan === 'string' ? JSON.parse(log.detail_perubahan) : log.detail_perubahan || {}
        } catch {}

        if (details?.sessionId) {
          loggedOutSessions.add(details.sessionId)
        }
        if (log.user_operasi && (!loggedOutUsers.has(log.user_operasi) || new Date(log.timestamp) > new Date(loggedOutUsers.get(log.user_operasi)!))) {
          loggedOutUsers.set(log.user_operasi, log.timestamp)
        }
      }
    }

    // 2. Process login events
    const nowMs = Date.now()
    for (const log of logs) {
      if (log.aksi === 'USER_LOGIN') {
        let details: any = {}
        try {
          details = typeof log.detail_perubahan === 'string' ? JSON.parse(log.detail_perubahan) : log.detail_perubahan || {}
        } catch {}

        const sessionId = details.sessionId || `sess_${log.id || log.timestamp}`
        const username = log.user_operasi || details.username || 'user'
        const loginTime = log.timestamp || details.timestamp || new Date().toISOString()
        const loginTimeMs = new Date(loginTime).getTime()

        // Check if session was logged out
        const isSessionLoggedOut = loggedOutSessions.has(sessionId)
        const userLogoutTime = loggedOutUsers.get(username)
        const isUserLoggedOutAfterLogin = userLogoutTime && new Date(userLogoutTime).getTime() >= loginTimeMs

        // If session was explicitly logged out or older than 18 hours, skip or mark offline
        const elapsedHours = (nowMs - loginTimeMs) / (1000 * 60 * 60)
        if (isSessionLoggedOut || isUserLoggedOutAfterLogin || elapsedHours > 18) {
          continue
        }

        // We only want the most recent active login per device/user
        const sessionKey = `${username}_${details.os || 'os'}_${details.deviceType || 'dev'}`
        if (sessionMap.has(sessionKey)) {
          continue
        }

        const elapsedMinutes = (nowMs - loginTimeMs) / (1000 * 60)
        let status: 'ONLINE' | 'IDLE' | 'OFFLINE' = 'ONLINE'
        if (elapsedMinutes > 90) status = 'IDLE'

        sessionMap.set(sessionKey, {
          id: sessionId,
          userId: details.userId || username,
          username,
          email: details.email || `${username}@phris.local`,
          nama: details.nama || username.toUpperCase(),
          role: details.role || (username.toLowerCase().includes('super') ? 'SUPERADMIN' : 'ADMIN_HR'),
          ipAddress: details.ip || '114.122.208.14',
          location: details.location || 'Indonesia',
          browser: details.browser || 'Browser',
          os: details.os || 'Unknown OS',
          deviceType: details.deviceType || 'Desktop',
          userAgent: details.userAgent || '',
          loginTime,
          lastActiveTime: loginTime,
          status,
        })
      }
    }

    const result = Array.from(sessionMap.values())
    if (result.length > 0) {
      saveStoredSessions(result)
      return result
    }
  } catch (e) {
    console.error('Failed to fetch global active sessions:', e)
  }

  return getStoredSessions()
}

// Update last active time of current user
export function touchCurrentSession(username: string) {
  const sessions = getStoredSessions()
  const idx = sessions.findIndex(s => s.username === username)
  if (idx !== -1) {
    sessions[idx].lastActiveTime = new Date().toISOString()
    sessions[idx].status = 'ONLINE'
    saveStoredSessions(sessions)
  }
}
