import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { authService } from './authService'

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
  deviceToken?: string
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

export function getCurrentDeviceToken(): string {
  let token = localStorage.getItem('phris_device_token')
  if (!token) {
    token = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    localStorage.setItem('phris_device_token', token)
  }
  return token
}

// Get or build live session object for current user
export function getLocalLiveSession(): UserSession {
  const authUserRaw = localStorage.getItem('phris_authenticated_user')
  let username = localStorage.getItem('phris_current_user_name') || 'superadmin'
  let nama = 'SUPER ADMINISTRATOR BNI'
  let role: 'SUPERADMIN' | 'ADMIN_HR' | 'OPERATOR' | 'VIEWER' = 'SUPERADMIN'
  let email = `${username}@phris.local`
  const deviceToken = getCurrentDeviceToken()

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
    id: `sess_${username.toLowerCase()}`,
    userId: username,
    username: username.toLowerCase(),
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
    deviceToken,
  }
}

export interface ActiveDeviceInfo {
  isActive: boolean
  deviceInfo?: string
  ipAddress?: string
  browser?: string
  os?: string
  deviceType?: string
  loginTime?: string
}

// Check if account is actively logged in on another device
export async function checkActiveDeviceSession(username: string): Promise<ActiveDeviceInfo> {
  const clean = username.toLowerCase().trim()
  const myToken = getCurrentDeviceToken()

  // Ensure Realtime Channel is initialized and listening
  const channel = initRealtimeSessionTracker()

  // 1. Check Realtime Presence Channel state immediately
  if (channel) {
    const state = channel.presenceState<UserSession>()
    const userPresence = state[clean]
    if (userPresence && userPresence.length > 0) {
      const active = userPresence[userPresence.length - 1]
      if (active && active.deviceToken && active.deviceToken !== myToken) {
        return {
          isActive: true,
          deviceInfo: `${active.browser} di ${active.os} (${active.deviceType})`,
          ipAddress: active.ipAddress || '114.122.208.14',
          browser: active.browser || 'Browser',
          os: active.os || 'OS',
          deviceType: active.deviceType || 'Desktop',
          loginTime: active.loginTime || new Date().toISOString(),
        }
      }
    }
  }

  // 2. Realtime Active Handshake (Broadcast PING and await PONG from active device)
  if (channel) {
    try {
      const pongPromise = new Promise<ActiveDeviceInfo | null>((resolve) => {
        let timeoutId: any = null
        const handler = (payload: any) => {
          const resp = payload?.payload
          if (
            resp &&
            resp.username?.toLowerCase() === clean &&
            resp.deviceToken &&
            resp.deviceToken !== myToken
          ) {
            clearTimeout(timeoutId)
            resolve({
              isActive: true,
              deviceInfo: `${resp.browser || 'Browser'} di ${resp.os || 'OS'} (${resp.deviceType || 'Desktop'})`,
              ipAddress: resp.ipAddress || '36.85.132.38',
              browser: resp.browser || 'Google Chrome',
              os: resp.os || 'Windows 11/10',
              deviceType: resp.deviceType || 'Desktop',
              loginTime: resp.loginTime || new Date().toISOString(),
            })
          }
        }

        channel.on('broadcast', { event: 'PONG_ACTIVE_SESSION' }, handler)

        // Broadcast PING
        channel.send({
          type: 'broadcast',
          event: 'PING_ACTIVE_SESSION',
          payload: { username: clean, queryingDeviceToken: myToken },
        }).catch(() => {})

        // Wait max 450ms for active device to respond
        timeoutId = setTimeout(() => {
          resolve(null)
        }, 450)
      })

      const pongResult = await pongPromise
      if (pongResult && pongResult.isActive) {
        return pongResult
      }
    } catch {}
  }

  // 3. Fallback: Check Supabase Audit Logs for recent login without logout
  try {
    const { data: logs } = await supabase
      .from('audit_logs')
      .select('*')
      .or(`user_operasi.eq.${clean},user_operasi.eq.${clean}@phris.local`)
      .in('aksi', ['USER_LOGIN', 'USER_LOGOUT', 'FORCE_LOGOUT'])
      .order('timestamp', { ascending: false })
      .limit(5)

    if (logs && logs.length > 0) {
      const latest = logs[0]
      if (latest.aksi === 'USER_LOGIN') {
        const timeDiffMinutes = (Date.now() - new Date(latest.timestamp).getTime()) / (1000 * 60)
        let details: any = {}
        try {
          details = typeof latest.detail_perubahan === 'string' ? JSON.parse(latest.detail_perubahan) : latest.detail_perubahan || {}
        } catch {}

        // If logged in within last 30 minutes on a different device token
        if (timeDiffMinutes < 30 && details?.deviceToken && details?.deviceToken !== myToken) {
          return {
            isActive: true,
            deviceInfo: latest.device_info || 'Perangkat Lain',
            ipAddress: details?.ip || '36.85.132.38',
            browser: details?.browser || 'Google Chrome',
            os: details?.os || 'Windows 11/10',
            deviceType: details?.deviceType || 'Desktop',
            loginTime: latest.timestamp,
          }
        }
      }
    }
  } catch {}

  return { isActive: false }
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

  const rawUsername = user?.email ? user.email.split('@')[0] : (localStorage.getItem('phris_current_user_name') || 'superadmin')
  const username = rawUsername.toLowerCase().trim()
  const email = user?.email || `${username}@phris.local`
  const isSuperadmin = email.toLowerCase().includes('superadmin') || user?.user_metadata?.role?.toLowerCase() === 'superadmin'
  const role = isSuperadmin ? 'SUPERADMIN' : (user?.user_metadata?.role || 'ADMIN_HR')
  const nama = user?.user_metadata?.nama || username.toUpperCase()
  const deviceToken = getCurrentDeviceToken()

  if (user) {
    localStorage.setItem('phris_current_user_name', username)
    if (!localStorage.getItem('phris_login_time')) {
      localStorage.setItem('phris_login_time', new Date().toISOString())
    }
  }

  // Key presence by username so 1 user = 1 presence slot on server!
  const channel = supabase.channel('phris_realtime_presence_v2', {
    config: {
      presence: {
        key: username,
      },
    },
  })

  // 1. Respond to PING from other devices checking if this account is currently alive
  channel.on('broadcast', { event: 'PING_ACTIVE_SESSION' }, async (payload: any) => {
    const target = payload?.payload?.username?.toLowerCase()
    const queryingToken = payload?.payload?.queryingDeviceToken
    const myUsername = (localStorage.getItem('phris_current_user_name') || '').toLowerCase()
    const myDeviceToken = localStorage.getItem('phris_device_token')
    const isLoggedIn = !!localStorage.getItem('phris_authenticated_user') || !!localStorage.getItem('phris_current_user_name')

    if (isLoggedIn && target === myUsername && queryingToken && queryingToken !== myDeviceToken) {
      const { browser, os, deviceType } = parseUserAgent()
      const { ip } = await getPublicIP()
      const loginTime = localStorage.getItem('phris_login_time') || new Date().toISOString()

      try {
        await channel.send({
          type: 'broadcast',
          event: 'PONG_ACTIVE_SESSION',
          payload: {
            username: myUsername,
            deviceToken: myDeviceToken,
            browser,
            os,
            deviceType,
            ipAddress: ip,
            loginTime,
          },
        })
      } catch {}
    }
  })

  // 2. Listen for remote force logout commands from Superadmin
  channel.on('broadcast', { event: 'FORCE_LOGOUT' }, async (payload: any) => {
    const targetUsername = payload?.payload?.username?.toLowerCase()
    const targetSessionId = payload?.payload?.sessionId
    const myUsername = (localStorage.getItem('phris_current_user_name') || '').toLowerCase()

    if (
      (targetUsername && targetUsername === myUsername) ||
      (targetSessionId && (targetSessionId === `sess_${myUsername}` || targetSessionId === myUsername))
    ) {
      authService.logout();
      localStorage.removeItem('phris_authenticated_user')
      localStorage.removeItem('phris_current_user_name')
      localStorage.removeItem('phris_login_time')
      localStorage.removeItem('phris_device_token')
      window.location.href = '/login?reason=terminated'
    }
  })

  // Listen to Presence Sync events (1 User = 1 Row)
  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState<UserSession>()
    const activeMap = new Map<string, UserSession>()

    // presenceState has keys = username. We take the latest item for each user!
    Object.entries(state).forEach(([_, presenceList]) => {
      if (presenceList && presenceList.length > 0) {
        const latest = presenceList[presenceList.length - 1]
        if (latest && latest.username) {
          activeMap.set(latest.username.toLowerCase(), {
            ...latest,
            id: `sess_${latest.username.toLowerCase()}`
          })
        }
      }
    })

    // Ensure current user is present
    const current = getLocalLiveSession()
    if (!activeMap.has(current.username.toLowerCase())) {
      activeMap.set(current.username.toLowerCase(), current)
    }

    const result = Array.from(activeMap.values())
    presenceListeners.forEach(listener => listener(result))
  })

  // Subscribe and track current device presence
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      const { ip, location } = await getPublicIP()
      const { browser, os, deviceType } = parseUserAgent()
      const loginTime = localStorage.getItem('phris_login_time') || new Date().toISOString()

      const currentSession: UserSession = {
        id: `sess_${username}`,
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
        deviceToken,
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

  if (globalPresenceChannel) {
    const state = globalPresenceChannel.presenceState<UserSession>()
    const activeMap = new Map<string, UserSession>()
    Object.entries(state).forEach(([_, presenceList]) => {
      if (presenceList && presenceList.length > 0) {
        const latest = presenceList[presenceList.length - 1]
        if (latest && latest.username) {
          activeMap.set(latest.username.toLowerCase(), {
            ...latest,
            id: `sess_${latest.username.toLowerCase()}`
          })
        }
      }
    })

    const current = getLocalLiveSession()
    if (!activeMap.has(current.username.toLowerCase())) {
      activeMap.set(current.username.toLowerCase(), current)
    }

    callback(Array.from(activeMap.values()))
  } else {
    callback([getLocalLiveSession()])
  }

  return () => {
    presenceListeners = presenceListeners.filter(l => l !== callback)
  }
}

// Record login, generate fresh device token and kick out older devices
export async function recordUserLogin(userData: {
  userId?: string
  username: string
  email?: string
  nama?: string
  role?: 'SUPERADMIN' | 'ADMIN_HR' | 'OPERATOR' | 'VIEWER'
}) {
  const username = userData.username.toLowerCase().trim()
  const freshDeviceToken = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  const now = new Date().toISOString()

  localStorage.setItem('phris_current_user_name', username)
  localStorage.setItem('phris_device_token', freshDeviceToken)
  localStorage.setItem('phris_login_time', now)

  const { ip, location } = await getPublicIP()
  const { browser, os, deviceType } = parseUserAgent()

  const newSession: UserSession = {
    id: `sess_${username}`,
    userId: userData.userId || username,
    username,
    email: userData.email || `${username}@phris.local`,
    nama: userData.nama || username.toUpperCase(),
    role: userData.role || (username.includes('super') ? 'SUPERADMIN' : 'ADMIN_HR'),
    ipAddress: ip,
    location,
    browser,
    os,
    deviceType,
    userAgent: navigator.userAgent,
    loginTime: now,
    lastActiveTime: now,
    status: 'ONLINE',
    deviceToken: freshDeviceToken,
  }

  // Track via channel if active and broadcast kick signal to previous device
  if (globalPresenceChannel) {
    try {
      await globalPresenceChannel.track(newSession)
      await globalPresenceChannel.send({
        type: 'broadcast',
        event: 'DEVICE_LOGIN_CONFLICT',
        payload: { username, deviceToken: freshDeviceToken },
      })
    } catch {}
  }

  // Insert audit log
  try {
    await supabase.from('audit_logs').insert({
      user_operasi: username,
      aksi: 'USER_LOGIN',
      detail_perubahan: JSON.stringify({
        deviceToken: freshDeviceToken,
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
  const user = (username || localStorage.getItem('phris_current_user_name') || 'user').toLowerCase()
  const now = new Date().toISOString()

  localStorage.removeItem('phris_current_user_name')
  localStorage.removeItem('phris_login_time')
  localStorage.removeItem('phris_device_token')

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
        username: user,
        timestamp: now,
      }),
      timestamp: now,
      device_info: `Logout manual [User: ${user}]`,
    })
  } catch {}
}

// Terminate a session (Local or Remote)
export async function terminateTargetSession(sessionIdOrUsername: string) {
  const cleanTarget = sessionIdOrUsername.replace('sess_', '').toLowerCase().trim()
  const myUsername = (localStorage.getItem('phris_current_user_name') || '').toLowerCase().trim()

  // Log in database
  try {
    await supabase.from('audit_logs').insert({
      user_operasi: 'superadmin',
      aksi: 'FORCE_LOGOUT',
      detail_perubahan: JSON.stringify({
        targetUser: cleanTarget,
        timestamp: new Date().toISOString(),
      }),
      timestamp: new Date().toISOString(),
      device_info: `Diputus paksa oleh Superadmin [User: ${cleanTarget}]`,
    })
  } catch {}

  // Broadcast to all devices via realtime channel
  if (globalPresenceChannel) {
    try {
      await globalPresenceChannel.send({
        type: 'broadcast',
        event: 'FORCE_LOGOUT',
        payload: { username: cleanTarget, sessionId: sessionIdOrUsername },
      })
    } catch {}
  }

  // If terminating own session, immediately logout and redirect
  if (!cleanTarget || cleanTarget === myUsername || cleanTarget === 'superadmin') {
    authService.logout();
    localStorage.removeItem('phris_authenticated_user')
    localStorage.removeItem('phris_current_user_name')
    localStorage.removeItem('phris_login_time')
    localStorage.removeItem('phris_device_token')
    window.location.href = '/login?reason=terminated'
  }
}
