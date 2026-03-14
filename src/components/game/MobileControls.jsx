import { useRef, useEffect, useCallback } from 'react'

/**
 * MobileControls — robust touch zones using touch identifier tracking.
 * Each zone tracks its own touch ID so overlapping touches don't cancel each other.
 * Left 45% = move left, Right 45% = move right. Centre 10% = neutral buffer.
 */
export default function MobileControls({ pressedKeys, visible = true, containerWidth, containerHeight }) {
  const leftTouchId  = useRef(null)
  const rightTouchId = useRef(null)

  const pressLeft = useCallback(() => {
    pressedKeys.current.add('ArrowLeft')
    pressedKeys.current.delete('ArrowRight')  // can't go both ways
  }, [pressedKeys])

  const pressRight = useCallback(() => {
    pressedKeys.current.add('ArrowRight')
    pressedKeys.current.delete('ArrowLeft')
  }, [pressedKeys])

  const releaseLeft = useCallback(() => {
    pressedKeys.current.delete('ArrowLeft')
    leftTouchId.current = null
  }, [pressedKeys])

  const releaseRight = useCallback(() => {
    pressedKeys.current.delete('ArrowRight')
    rightTouchId.current = null
  }, [pressedKeys])

  const releaseAll = useCallback(() => {
    pressedKeys.current.delete('ArrowLeft')
    pressedKeys.current.delete('ArrowRight')
    leftTouchId.current  = null
    rightTouchId.current = null
  }, [pressedKeys])

  // ── Left zone handlers ────────────────────────────────────────────────────
  const onLeftStart = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    // Track the first new touch on this zone
    for (const t of e.changedTouches) {
      if (leftTouchId.current === null) {
        leftTouchId.current = t.identifier
        pressLeft()
        break
      }
    }
  }, [pressLeft])

  const onLeftEnd = useCallback((e) => {
    e.stopPropagation()
    for (const t of e.changedTouches) {
      if (t.identifier === leftTouchId.current) {
        releaseLeft()
        break
      }
    }
  }, [releaseLeft])

  // ── Right zone handlers ───────────────────────────────────────────────────
  const onRightStart = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (rightTouchId.current === null) {
        rightTouchId.current = t.identifier
        pressRight()
        break
      }
    }
  }, [pressRight])

  const onRightEnd = useCallback((e) => {
    e.stopPropagation()
    for (const t of e.changedTouches) {
      if (t.identifier === rightTouchId.current) {
        releaseRight()
        break
      }
    }
  }, [releaseRight])

  // Safety: release everything on window touchend in case touch leaves the zone
  useEffect(() => {
    const safeRelease = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === leftTouchId.current)  releaseLeft()
        if (t.identifier === rightTouchId.current) releaseRight()
      }
    }
    window.addEventListener('touchend',    safeRelease, { passive: true })
    window.addEventListener('touchcancel', safeRelease, { passive: true })
    return () => {
      window.removeEventListener('touchend',    safeRelease)
      window.removeEventListener('touchcancel', safeRelease)
      releaseAll()
    }
  }, [releaseLeft, releaseRight, releaseAll])

  if (!visible) return null

  const zoneH = Math.round(containerHeight * 0.60)
  const zoneW = Math.round(containerWidth  * 0.44)  // 44% each side, 12% neutral gap

  const base = {
    position:   'absolute',
    bottom:     0,
    height:     zoneH,
    width:      zoneW,
    zIndex:     40,
    touchAction: 'none',
    userSelect:  'none',
    WebkitUserSelect: 'none',
    // Debug: set to rgba(255,0,0,0.1) to see zones
    background: 'transparent',
  }

  return (
    <>
      {/* Left zone */}
      <div
        style={{ ...base, left: 0 }}
        onTouchStart={onLeftStart}
        onTouchEnd={onLeftEnd}
        onTouchCancel={onLeftEnd}
      >
        <span style={{
          position: 'absolute', bottom: '14%', left: 12,
          fontSize: 26, color: '#fff', opacity: 0.18,
          pointerEvents: 'none', fontFamily: 'monospace',
        }}>◀</span>
      </div>

      {/* Right zone — starts at 56% so it never overlaps the interact tap area
          which is centred on the governor at ~62% of containerWidth            */}
      <div
        style={{ ...base, right: 0 }}
        onTouchStart={onRightStart}
        onTouchEnd={onRightEnd}
        onTouchCancel={onRightEnd}
      >
        <span style={{
          position: 'absolute', bottom: '14%', right: 12,
          fontSize: 26, color: '#fff', opacity: 0.18,
          pointerEvents: 'none', fontFamily: 'monospace',
        }}>▶</span>
      </div>
    </>
  )
}
