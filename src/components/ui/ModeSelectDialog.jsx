import { useEffect, useState } from 'react'
import { useGame } from '../../hooks/useGameState'
import { SCENES } from '../../utils/constants'

export default function ModeSelectDialog() {
  const { state, dispatch } = useGame()
  const [visible, setVisible] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (state.showModeSelect) {
      setTimeout(() => setVisible(true), 80)
    } else {
      setVisible(false)
      setSelected(null)
    }
  }, [state.showModeSelect])

  const handleSelect = (mode) => {
    if (selected) return
    setSelected(mode)

    setTimeout(() => {
      dispatch({ type: 'SET_MODE', mode })
      dispatch({ type: 'HIDE_MODE_SELECT' })
      dispatch({
        type: 'SET_SCENE',
        scene: mode === 'resume' ? SCENES.RESUME : SCENES.ABOUT,
        direction: 1,
        playerStartX: null,
      })
    }, 420)
  }

  if (!state.showModeSelect) return null

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 100,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Glassmorphic card */}
        <div style={{
          background: 'rgba(8, 18, 12, 0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '52px 56px',
          maxWidth: '520px',
          width: '90%',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          position: 'relative',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.98)',
          transition: 'opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Top shimmer line */}
          <div style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)',
          }} />

          <p style={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 400,
            fontSize: '11px',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginBottom: '18px',
          }}>
            Select Mode
          </p>

          <h2 style={{
            fontFamily: '"Syne", sans-serif',
            fontWeight: 800,
            fontSize: '36px',
            color: '#ffffff',
            marginBottom: '10px',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}>
            Who are you?
          </h2>

          <p style={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 300,
            fontSize: '14px',
            color: 'rgba(255,255,255,0.42)',
            marginBottom: '40px',
            lineHeight: 1.6,
          }}>
            Choose your path through this world.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <DialogButton
              label="Resume Mode"
              sub="Single-page overview for recruiters"
              index="01"
              active={selected === 'resume'}
              onClick={() => handleSelect('resume')}
            />
            <DialogButton
              label="Normal Mode"
              sub="Explore the world as a human"
              index="02"
              active={selected === 'normal'}
              onClick={() => handleSelect('normal')}
            />
          </div>

          <p style={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 300,
            fontSize: '11px',
            color: 'rgba(255,255,255,0.2)',
            marginTop: '32px',
            textAlign: 'center',
            letterSpacing: '0.08em',
          }}>
            Press Enter or click to select
          </p>
        </div>
      </div>

      <style>{`
        @keyframes sweep { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      `}</style>
    </>
  )
}

function DialogButton({ label, sub, index, active, onClick }) {
  const [hover, setHover] = useState(false)
  const lit = hover || active

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: 'transparent',
        border: '1px solid',
        borderColor: lit ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.09)',
        borderRadius: '4px',
        padding: '20px 24px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        textAlign: 'left',
        width: '100%',
        overflow: 'hidden',
        transition: 'border-color 0.28s ease',
      }}
    >
      {/* Fill wipe from left */}
      <span style={{
        position: 'absolute', inset: 0,
        background: 'rgba(255,255,255,0.055)',
        transformOrigin: 'left',
        transform: lit ? 'scaleX(1)' : 'scaleX(0)',
        transition: 'transform 0.32s cubic-bezier(0.16,1,0.3,1)',
        pointerEvents: 'none',
      }} />

      {/* Left accent bar */}
      <span style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px',
        background: 'linear-gradient(to bottom, rgba(100,255,160,0.3), rgba(100,255,160,0.9), rgba(100,255,160,0.3))',
        transform: lit ? 'scaleY(1)' : 'scaleY(0)',
        transformOrigin: 'top',
        transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1)',
      }} />

      <span style={{
        fontFamily: '"Syne", sans-serif',
        fontWeight: 700,
        fontSize: '11px',
        color: lit ? 'rgba(100,255,160,0.85)' : 'rgba(255,255,255,0.18)',
        marginRight: '22px',
        flexShrink: 0,
        position: 'relative',
        transition: 'color 0.25s',
        letterSpacing: '0.04em',
      }}>
        {index}
      </span>

      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{
          fontFamily: '"Syne", sans-serif',
          fontWeight: 600,
          fontSize: '18px',
          color: '#ffffff',
          marginBottom: '3px',
          letterSpacing: '-0.01em',
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: '"Inter", sans-serif',
          fontWeight: 300,
          fontSize: '12px',
          color: 'rgba(255,255,255,0.35)',
        }}>
          {sub}
        </div>
      </div>

      <span style={{
        fontSize: '16px',
        color: 'rgba(100,255,160,0.8)',
        opacity: lit ? 1 : 0,
        transform: lit ? 'translateX(0)' : 'translateX(-10px)',
        transition: 'opacity 0.22s, transform 0.22s',
        marginLeft: '14px',
        position: 'relative',
      }}>→</span>
    </button>
  )
}
