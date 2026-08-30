import { useEffect, useRef } from 'react'
import { authService } from '../lib/authService'

// Default idle timeout: 1 Hour (60 minutes = 3,600,000 ms)
const IDLE_TIMEOUT_MS = 60 * 60 * 1000

export function useIdleTimeout(enabled: boolean = true) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLogout = async () => {
    try {
      authService.logout()
    } catch (e) {
      console.error('Failed to sign out on idle timeout', e)
    } finally {
      // Redirect to login with reason parameter
      window.location.href = '/login?reason=timeout'
    }
  }

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (enabled) {
      timerRef.current = setTimeout(() => {
        handleLogout()
      }, IDLE_TIMEOUT_MS)
    }
  }

  useEffect(() => {
    if (!enabled) return

    // Track user motion and interaction events across desktop & mobile devices
    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'touchmove',
      'scroll',
      'wheel',
      'click',
      'visibilitychange'
    ]

    const onUserActivity = () => {
      resetTimer()
    }

    // Initialize timer
    resetTimer()

    // Attach listeners
    events.forEach(evt => {
      window.addEventListener(evt, onUserActivity, { passive: true })
    })

    // Clean up
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      events.forEach(evt => {
        window.removeEventListener(evt, onUserActivity)
      })
    }
  }, [enabled])
}
