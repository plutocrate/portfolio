import { useEffect, useState, useRef } from 'react'
import { asset } from '../../utils/constants'

// All images that need to be preloaded before the game starts
const IMAGE_ASSETS = [
  // Player run frames
  ...Array.from({ length: 14 }, (_, i) => asset(`/assets/sprites/run/Run_${String(i).padStart(4, '0')}.png`)),
  // Player sprint frames
  ...Array.from({ length: 9  }, (_, i) => asset(`/assets/sprites/sprint/Big_Run_${String(i).padStart(4, '0')}.png`)),
  // Player idle frames
  ...Array.from({ length: 20 }, (_, i) => asset(`/assets/sprites/idle/Idle_Body_${String(i).padStart(4, '0')}.png`)),
  // NPC sprites
  ...Array.from({ length: 7  }, (_, i) => asset(`/assets/sprites/npc1_romeo/walk_${i}.png`)),
  ...Array.from({ length: 8  }, (_, i) => asset(`/assets/sprites/npc2_juliet/walk_${i}.png`)),
  ...Array.from({ length: 12 }, (_, i) => asset(`/assets/sprites/npc3_barbarian/walk_${String(i).padStart(2, '0')}.png`)),
  // Governor sprites
  ...Array.from({ length: 4  }, (_, i) => asset(`/assets/sprites/npc4_governor/walk_0${i}.png`)),
  ...Array.from({ length: 2  }, (_, i) => asset(`/assets/sprites/npc4_governor/idle_0${i}.png`)),
  ...Array.from({ length: 2  }, (_, i) => asset(`/assets/sprites/npc4_governor/happy_0${i}.png`)),
  // Tiles & backgrounds
  asset('/assets/tiles/TileSet.png'),
  asset('/assets/tiles/TileSetApart.png'),
  asset('/assets/parallax/Flat.png'),
  asset('/assets/parallax/Parallax_1.png'),
  asset('/assets/parallax/Parallax_2.png'),
  asset('/assets/parallax/Parallax_3.png'),
  asset('/assets/parallax/Parallax_4.png'),
  asset('/assets/parallax/Parallax_5.png'),
]

const TIPS = [
  'Use Shift to sprint',
  'Talk to NPCs by walking near them',
  'Press M to mute the music',
  'Each zone has something to discover',
  'Try sprinting through the forest',
]

export default function LoadingScreen({ onReady }) {
  const [progress, setProgress]   = useState(0)
  const [tip]                      = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)])
  const [fadeOut, setFadeOut]      = useState(false)
  const loadedRef                  = useRef(0)
  const total                      = IMAGE_ASSETS.length

  useEffect(() => {
    let cancelled = false

    const onLoad = () => {
      if (cancelled) return
      loadedRef.current += 1
      setProgress(loadedRef.current / total)
      if (loadedRef.current >= total) {
        // Small delay so bar visually hits 100% before fade
        setTimeout(() => {
          if (!cancelled) setFadeOut(true)
        }, 400)
      }
    }

    IMAGE_ASSETS.forEach(src => {
      const img = new Image()
      img.onload  = onLoad
      img.onerror = onLoad  // count errors too so we never get stuck
      img.src = src
    })

    return () => { cancelled = true }
  }, [])

  // After fade-out animation, notify parent
  const handleTransitionEnd = () => {
    if (fadeOut) onReady()
  }

  const pct = Math.round(progress * 100)

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#050a05',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.6s ease',
        pointerEvents: fadeOut ? 'none' : 'all',
      }}
    >
      {/* Subtle scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
      }} />

      {/* Glow blob */}
      <div style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(68,255,136,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', width: 'min(420px, 80vw)', textAlign: 'center' }}>

        {/* Title */}
        <p style={{
          fontFamily: '"Syne", sans-serif', fontWeight: 800,
          fontSize: 'clamp(28px, 4vw, 38px)',
          color: '#ffffff', letterSpacing: '-0.02em',
          marginBottom: '8px',
        }}>
          Loading World
        </p>

        {/* Tip */}
        <p style={{
          fontFamily: '"Inter", sans-serif', fontWeight: 300,
          fontSize: '13px', color: 'rgba(255,255,255,0.38)',
          letterSpacing: '0.04em', marginBottom: '40px',
          minHeight: '20px',
        }}>
          {tip}
        </p>

        {/* Progress bar track */}
        <div style={{
          width: '100%', height: '2px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '2px', overflow: 'hidden',
          marginBottom: '14px',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, rgba(68,255,136,0.6), rgba(68,255,136,1))',
            borderRadius: '2px',
            transition: 'width 0.15s ease',
            boxShadow: '0 0 8px rgba(68,255,136,0.6)',
          }} />
        </div>

        {/* Percentage */}
        <p style={{
          fontFamily: '"Syne", sans-serif', fontWeight: 700,
          fontSize: '12px',
          color: pct === 100 ? 'rgba(68,255,136,0.9)' : 'rgba(255,255,255,0.3)',
          letterSpacing: '0.12em',
          transition: 'color 0.3s ease',
        }}>
          {pct === 100 ? 'READY' : `${pct}%`}
        </p>
      </div>
    </div>
  )
}
