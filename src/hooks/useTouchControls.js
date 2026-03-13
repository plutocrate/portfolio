import { useEffect, useRef } from 'react'

/**
 * useTouchControls — injects swipe/touch into a pressedKeys Set
 * so all existing keyboard-based movement logic works unchanged.
 *
 * On mobile:
 *  - Swipe/hold left  → ArrowLeft
 *  - Swipe/hold right → ArrowRight
 *  - Tap on governor  → triggers 'KeyE'
 */

const SWIPE_THRESHOLD = 12   // px before direction is committed
const TAP_MAX_DIST    = 20   // px — tap vs drag distinction

export function useTouchControls(pressedKeys, options = {}) {
  const { onTap, enabled = true } = options
  const touchStartRef  = useRef(null)
  const activeKeyRef   = useRef(null)
  const isTapRef       = useRef(false)

  useEffect(() => {
    if (!enabled) return

    const injectKey = (code) => {
      if (activeKeyRef.current === code) return
      // Release previous
      if (activeKeyRef.current) {
        pressedKeys.current.delete(activeKeyRef.current)
        activeKeyRef.current = null
      }
      if (code) {
        pressedKeys.current.add(code)
        activeKeyRef.current = code
      }
    }

    const releaseKey = () => {
      if (activeKeyRef.current) {
        pressedKeys.current.delete(activeKeyRef.current)
        activeKeyRef.current = null
      }
    }

    const onTouchStart = (e) => {
      const t = e.touches[0]
      touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() }
      isTapRef.current = true
    }

    const onTouchMove = (e) => {
      if (!touchStartRef.current) return
      const t   = e.touches[0]
      const dx  = t.clientX - touchStartRef.current.x
      const adx = Math.abs(dx)
      const ady = Math.abs(t.clientY - touchStartRef.current.y)

      if (adx > TAP_MAX_DIST || ady > TAP_MAX_DIST) isTapRef.current = false

      if (adx > SWIPE_THRESHOLD && adx > ady) {
        injectKey(dx > 0 ? 'ArrowRight' : 'ArrowLeft')
      }
    }

    const onTouchEnd = (e) => {
      if (isTapRef.current && onTap) {
        const t = e.changedTouches[0]
        onTap({ x: t.clientX, y: t.clientY })
      }
      releaseKey()
      touchStartRef.current = null
      isTapRef.current = false
    }

    const onTouchCancel = () => {
      releaseKey()
      touchStartRef.current = null
    }

    window.addEventListener('touchstart',  onTouchStart,  { passive: true })
    window.addEventListener('touchmove',   onTouchMove,   { passive: true })
    window.addEventListener('touchend',    onTouchEnd,    { passive: true })
    window.addEventListener('touchcancel', onTouchCancel, { passive: true })

    return () => {
      window.removeEventListener('touchstart',  onTouchStart)
      window.removeEventListener('touchmove',   onTouchMove)
      window.removeEventListener('touchend',    onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
      releaseKey()
    }
  }, [pressedKeys, onTap, enabled])
}
