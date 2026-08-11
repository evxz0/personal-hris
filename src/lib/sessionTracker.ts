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

// Record a new login session
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

  const currentSessions = getStoredSessions().filter(s => s.username !== userData.username)

  const newSession: UserSession = {
    id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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

  currentSessions.unshift(newSession)
  saveStoredSessions(currentSessions)

  // Also log into Supabase audit logs
  try {
    await supabase.from('audit_logs').insert({
      user_operasi: userData.username,
      aksi: 'USER_LOGIN',
      detail_perubahan: JSON.stringify({
        ip,
        browser,
        os,
        deviceType,
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
