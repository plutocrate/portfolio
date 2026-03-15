import { useEffect, useState } from 'react'

const LINES = [
  'reconnecting to governor-world.local...',
  'mounting /dev/portfolio...',
  'loading kernel modules... ok',
  'restoring session state... ok',
  'pratham@portfolio — welcome back.',
]

export default function ReturnLoadingScreen({ onReady }) {
  const [visibleLines, setVisibleLines] = useState([])
  const [fadeOut,      setFadeOut]      = useState(false)
  const [cursor,       setCursor]       = useState(true)

  useEffect(() => {
    // Reveal lines one by one
    const timers = []
    LINES.forEach((line, i) => {
      timers.push(setTimeout(() => {
        setVisibleLines(v => [...v, line])
      }, 220 + i * 280))
    })
    // Start fade out after all lines shown
    timers.push(setTimeout(() => setFadeOut(true), 220 + LINES.length * 280 + 400))
    // Blink cursor
    const cursorId = setInterval(() => setCursor(c => !c), 500)
    return () => { timers.forEach(clearTimeout); clearInterval(cursorId) }
  }, [])

  return (
    <div
      onTransitionEnd={() => { if (fadeOut) onReady() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#00100a',
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', justifyContent: 'center',
        padding: 'clamp(32px, 8vw, 80px)',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.55s ease',
        pointerEvents: fadeOut ? 'none' : 'all',
        fontFamily: '"Geist Mono","Fira Code","Courier New",monospace',
      }}
    >
      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.12) 0px,rgba(0,0,0,0.12) 1px,transparent 1px,transparent 3px)',
      }}/>

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '20%',
        width: 'min(500px, 60vw)', height: 'min(300px, 40vw)',
        borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(40,255,140,0.05) 0%, transparent 70%)',
      }}/>

      <div style={{ position: 'relative', maxWidth: 560 }}>
        {/* Boot lines */}
        {visibleLines.map((line, i) => {
          const isLast = i === LINES.length - 1
          return (
            <div key={i} style={{
              fontSize: 'clamp(12px, 2vw, 15px)',
              lineHeight: 1.9,
              color: isLast
                ? 'rgba(120,255,180,0.95)'
                : i < LINES.length - 2
                  ? 'rgba(60,200,120,0.6)'
                  : 'rgba(60,220,130,0.8)',
              letterSpacing: '0.02em',
              fontWeight: isLast ? 700 : 400,
              animation: 'fadeLineIn 0.18s ease forwards',
            }}>
              {isLast ? '' : '> '}{line}
              {isLast && <span style={{ opacity: cursor ? 1 : 0, transition: 'opacity 0.08s' }}> _</span>}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes fadeLineIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
