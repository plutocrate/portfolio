import { useState, useEffect } from 'react'

const isMobile = () =>
  /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (typeof window !== 'undefined' && window.innerWidth <= 1024 && 'ontouchstart' in window)

export default function IntroMenuScene({ onSelect }) {
  const [visible,    setVisible]    = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [isPortrait, setIsPortrait] = useState(() => window.innerHeight > window.innerWidth)
  const mobile = isMobile()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 250)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const check = () => setTimeout(() => setIsPortrait(window.innerHeight > window.innerWidth), 100)
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  // Normal mode is locked on mobile portrait
  const normalLocked = mobile && isPortrait

  const choose = (mode) => {
    if (selected) return
    if (mode === 'normal' && normalLocked) return
    setSelected(mode)

    // Request fullscreen synchronously in click handler
    const el = document.documentElement
    try {
      if (el.requestFullscreen)           el.requestFullscreen()
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
      else if (el.mozRequestFullScreen)    el.mozRequestFullScreen()
      else if (el.msRequestFullscreen)     el.msRequestFullscreen()
    } catch (_) {}

    setTimeout(() => onSelect(mode), 480)
  }

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: '#000', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(105deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.78) 45%, rgba(0,0,0,0.2) 75%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        width: 'min(520px, 90vw)',
        marginLeft: mobile ? '0' : 'clamp(-120px, -15vw, 0px)',
      }}>
        <p style={{ fontFamily: '"Inter", sans-serif', fontWeight: 400, fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '20px' }}>
          Select Mode
        </p>
        <h1 style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: 'clamp(36px, 5.5vw, 64px)', color: '#ffffff', lineHeight: 1.05, marginBottom: '16px', letterSpacing: '-0.02em' }}>
          Who<br />are you?
        </h1>
        <p style={{ fontFamily: '"Inter", sans-serif', fontWeight: 300, fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginBottom: '32px', lineHeight: 1.6 }}>
          Choose how you'd like to explore.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          {/* Resume Mode — always available */}
          <MenuButton
            label="Resume Mode"
            sub="For recruiters — single-page overview"
            index="01"
            active={selected === 'resume'}
            locked={false}
            onClick={() => choose('resume')}
          />

          {/* Normal Mode — locked on mobile portrait */}
          <MenuButton
            label="Normal Mode"
            sub="For humans — explore the world"
            index="02"
            active={selected === 'normal'}
            locked={normalLocked}
            onClick={() => choose('normal')}
          />
        </div>

        {/* Mobile disclaimer — always shown on mobile */}
        {mobile && (
          <div style={{
            marginTop: '20px',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px',
            width: '100%',
          }}>
            {/* Landscape requirement */}
            {normalLocked && (
              <p style={{
                fontFamily: '"Inter", sans-serif', fontSize: '12px', fontWeight: 400,
                color: 'rgba(255,160,60,0.85)',
                lineHeight: 1.6, marginBottom: '10px',
                display: 'flex', gap: '8px', alignItems: 'flex-start',
              }}>
                <span style={{ flexShrink: 0, marginTop: '1px' }}>↻</span>
                Rotate to landscape to unlock Normal Mode
              </p>
            )}
            {/* Desktop recommendation — always */}
            <p style={{
              fontFamily: '"Inter", sans-serif', fontSize: '11px', fontWeight: 300,
              color: 'rgba(255,255,255,0.35)',
              lineHeight: 1.6,
              display: 'flex', gap: '8px', alignItems: 'flex-start',
            }}>
              <span style={{ flexShrink: 0 }}>💻</span>
              Best experienced on desktop — visit there for the full game world
            </p>
          </div>
        )}

        <p style={{ fontFamily: '"Inter", sans-serif', fontWeight: 400, fontSize: '12px', color: 'rgba(255,255,255,0.28)', marginTop: '20px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '15px' }}>🎧</span>
          Headphones recommended
        </p>
      </div>
    </div>
  )
}

function MenuButton({ label, sub, index, active, locked, onClick }) {
  const [hover, setHover] = useState(false)
  const lit = (hover || active) && !locked

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => !locked && setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={locked}
      style={{
        position: 'relative', background: 'transparent', borderRadius: '2px',
        padding: '22px 28px', cursor: locked ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', textAlign: 'left',
        width: '100%', overflow: 'hidden',
        border: `1px solid ${locked ? 'rgba(255,255,255,0.06)' : lit ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
        transition: 'border-color 0.3s ease',
        opacity: locked ? 0.45 : 1,
      }}
    >
      <span style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.06)', transformOrigin: 'left center', transform: lit ? 'scaleX(1)' : 'scaleX(0)', transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)', pointerEvents: 'none' }} />
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: 'rgba(100,255,160,0.9)', transform: lit ? 'scaleY(1)' : 'scaleY(0)', transformOrigin: 'top center', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' }} />
      <span style={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '12px', color: lit ? 'rgba(100,255,160,0.9)' : 'rgba(255,255,255,0.20)', letterSpacing: '0.05em', marginRight: '24px', transition: 'color 0.25s ease', flexShrink: 0, position: 'relative' }}>
        {index}
      </span>
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: 'clamp(15px, 4vw, 22px)', color: locked ? 'rgba(255,255,255,0.4)' : '#ffffff', marginBottom: '5px', letterSpacing: '-0.01em' }}>
          {label}
          {locked && <span style={{ fontFamily: '"Inter", sans-serif', fontSize: '11px', fontWeight: 400, color: 'rgba(255,160,60,0.7)', marginLeft: '10px', letterSpacing: '0.04em' }}>landscape only</span>}
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', fontWeight: 400, fontSize: '12px', color: lit ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)', letterSpacing: '0.01em', transition: 'color 0.25s ease' }}>
          {sub}
        </div>
      </div>
      {!locked && (
        <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', color: 'rgba(100,255,160,0.9)', opacity: lit ? 1 : 0, transform: lit ? 'translateX(0)' : 'translateX(-8px)', transition: 'opacity 0.25s ease, transform 0.25s ease', marginLeft: '16px', position: 'relative' }}>→</span>
      )}
      {locked && (
        <span style={{ fontSize: '16px', opacity: 0.4, marginLeft: '16px', flexShrink: 0 }}>🔒</span>
      )}
    </button>
  )
}
