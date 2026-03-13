import { useState, useEffect } from 'react'

const isMobile = () =>
  /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (typeof window !== 'undefined' && window.innerWidth <= 1024 && 'ontouchstart' in window)

const CONTROLS_DESKTOP = [
  { key: 'A / ←', label: 'Move Left' },
  { key: 'D / →', label: 'Move Right' },
  { key: 'E',     label: 'Interact' },
]

const CONTROLS_MOBILE = [
  { key: '← swipe', label: 'Move Left' },
  { key: 'swipe →', label: 'Move Right' },
  { key: 'tap NPC', label: 'Interact' },
]

export default function GameHUD({ visible }) {
  const [show, setShow] = useState(false)
  const mobile = isMobile()
  const CONTROLS = mobile ? CONTROLS_MOBILE : CONTROLS_DESKTOP

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setShow(true), 600)
      return () => clearTimeout(t)
    } else {
      setShow(false)
    }
  }, [visible])

  const fontSize = mobile ? '10px' : '11px'
  const padding  = mobile ? '8px 14px' : '12px 24px'
  const gap      = mobile ? '14px' : '28px'

  return (
    <div style={{
      position: 'fixed',
      bottom: mobile ? '16px' : '28px',
      left: '50%',
      transform: 'translateX(-50%)',
      opacity: show ? 1 : 0,
      transition: 'opacity 0.8s ease',
      pointerEvents: 'none',
      zIndex: 50,
    }}>
      <div style={{
        background: 'rgba(0, 8, 4, 0.55)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '6px',
        padding,
        display: 'flex',
        gap,
        alignItems: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)',
        }} />
        {CONTROLS.map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <kbd style={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              fontSize,
              color: 'rgba(255,255,255,0.85)',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '3px',
              padding: mobile ? '2px 6px' : '3px 8px',
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}>
              {key}
            </kbd>
            <span style={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 300,
              fontSize,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.02em',
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
