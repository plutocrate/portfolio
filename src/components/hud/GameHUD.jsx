import { useState, useEffect } from 'react'

const CONTROLS = [
  { key: 'A / ←', label: 'Move Left' },
  { key: 'D / →', label: 'Move Right' },
  { key: 'E',     label: 'Interact' },
]

export default function GameHUD({ visible }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setShow(true), 600)
      return () => clearTimeout(t)
    } else {
      setShow(false)
    }
  }, [visible])

  return (
    <div style={{
      position: 'fixed',
      bottom: '28px',
      left: '50%',
      transform: 'translateX(-50%)',
      opacity: show ? 1 : 0,
      transition: 'opacity 0.8s ease',
      pointerEvents: 'none',
      zIndex: 50,
    }}>
      {/* Glassmorphic container */}
      <div style={{
        background: 'rgba(0, 8, 4, 0.55)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '6px',
        padding: '12px 24px',
        display: 'flex',
        gap: '28px',
        alignItems: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Top shimmer */}
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)',
        }} />

        {CONTROLS.map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <kbd style={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              fontSize: '11px',
              color: 'rgba(255,255,255,0.85)',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '3px',
              padding: '3px 8px',
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}>
              {key}
            </kbd>
            <span style={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 300,
              fontSize: '11px',
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
