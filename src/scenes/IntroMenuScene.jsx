import { useState, useEffect } from 'react'

export default function IntroMenuScene({ onSelect }) {
  const [visible, setVisible] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 250)
    return () => clearTimeout(t)
  }, [])

  const choose = (mode) => {
    if (selected) return
    setSelected(mode)

    // Fullscreen on scene 1 button click — synchronous in click handler
    const el = document.documentElement
    try {
      if (el.requestFullscreen) el.requestFullscreen()
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
      else if (el.mozRequestFullScreen) el.mozRequestFullScreen()
      else if (el.msRequestFullscreen) el.msRequestFullscreen()
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
        width: 'min(520px, 82vw)', marginLeft: '-15vw',
      }}>
        <p style={{ fontFamily: '"Inter", sans-serif', fontWeight: 400, fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '20px' }}>
          Select Mode
        </p>
        <h1 style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: 'clamp(40px, 5.5vw, 64px)', color: '#ffffff', lineHeight: 1.05, marginBottom: '16px', letterSpacing: '-0.02em' }}>
          Who<br />are you?
        </h1>
        <p style={{ fontFamily: '"Inter", sans-serif', fontWeight: 300, fontSize: '15px', color: 'rgba(255,255,255,0.45)', marginBottom: '40px', lineHeight: 1.6 }}>
          Choose how you'd like to explore.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
          <MenuButton label="Resume Mode" sub="For recruiters — single-page overview" index="01" active={selected === 'resume'} onClick={() => choose('resume')} />
          <MenuButton label="Normal Mode" sub="For humans — explore the world" index="02" active={selected === 'normal'} onClick={() => choose('normal')} />
        </div>

        <p style={{ fontFamily: '"Inter", sans-serif', fontWeight: 400, fontSize: '12px', color: 'rgba(255,255,255,0.30)', marginTop: '28px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '15px' }}>🎧</span>
          Headphones recommended
        </p>
      </div>
    </div>
  )
}

function MenuButton({ label, sub, index, active, onClick }) {
  const [hover, setHover] = useState(false)
  const lit = hover || active
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', background: 'transparent', borderRadius: '2px',
        padding: '26px 32px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', textAlign: 'left',
        width: '100%', overflow: 'hidden',
        border: `1px solid ${lit ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
        transition: 'border-color 0.3s ease',
      }}
    >
      <span style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.06)', transformOrigin: 'left center', transform: lit ? 'scaleX(1)' : 'scaleX(0)', transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)', pointerEvents: 'none' }} />
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: 'rgba(100,255,160,0.9)', transform: lit ? 'scaleY(1)' : 'scaleY(0)', transformOrigin: 'top center', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' }} />
      <span style={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '12px', color: lit ? 'rgba(100,255,160,0.9)' : 'rgba(255,255,255,0.25)', letterSpacing: '0.05em', marginRight: '28px', transition: 'color 0.25s ease', flexShrink: 0, position: 'relative' }}>
        {index}
      </span>
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: 'clamp(18px, 2.2vw, 24px)', color: '#ffffff', marginBottom: '6px', letterSpacing: '-0.01em' }}>
          {label}
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', fontWeight: 400, fontSize: '13px', color: lit ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.42)', letterSpacing: '0.01em', transition: 'color 0.25s ease' }}>
          {sub}
        </div>
      </div>
      <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '20px', color: 'rgba(100,255,160,0.9)', opacity: lit ? 1 : 0, transform: lit ? 'translateX(0)' : 'translateX(-8px)', transition: 'opacity 0.25s ease, transform 0.25s ease', marginLeft: '20px', position: 'relative' }}>→</span>
    </button>
  )
}
