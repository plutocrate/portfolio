import { useEffect, useRef, useState, useCallback } from 'react'
import { useGame } from '../hooks/useGameState'
import {
  SCENES, GAME_WIDTH, asset,
  PLAYER_MAX_SPEED, PLAYER_ACCEL, PLAYER_DECEL,
  PLAYER_SPRINT_SPEED, PLAYER_SPRINT_ACCEL,
} from '../utils/constants'
import { getMovementDirection } from '../utils/keyboard'
import { audioManager, RUN_VOLUME } from '../utils/audio'
import PlayerSprite from '../components/game/PlayerSprite'
import MobileControls from '../components/game/MobileControls'

const WORLD_MULT      = 4.0
const PLAYER_ANCHOR   = 0.35
const GROUND_RATIO    = 0.80
const MONKEY_FRAMES   = 14
const MONKEY_FPS      = 14
const MONKEY_MAX_SPD  = 900
const JUMP_HEIGHT     = 130
const JUMP_PERIOD     = 2.0
const MONKEY_TALK_DIST = 260
const TILE_W          = 80
const NUM_MONKEYS     = 10

const MONKEY_QUOTES = [
  'This is not ready, go back',
  'Hali Governor',
  'No needs of humans here, but you are',
  'Welcome buddy',
  'Governor trusts you.',
  'Governor is the best',
  'He needs your help, but later',
  "He's our GOD",
  'MUTBURRY! MUTBURRY!',
  'welcome welcome my friend!',
]

// Each monkey gets deterministic starting values based on index
function makeMonkey(idx, WORLD_WIDTH) {
  const spread = 0.90 / NUM_MONKEYS
  return {
    worldX:   WORLD_WIDTH * (0.05 + idx * spread),
    vel:      (idx % 2 === 0 ? 1 : -1) * (300 + idx * 60),
    noiseT:   idx * 7.3,
    jumpT:    idx * (JUMP_PERIOD / NUM_MONKEYS),
    facing:   idx % 2 === 0 ? 1 : -1,
    jumpY:    0,
    quote:    MONKEY_QUOTES[idx % MONKEY_QUOTES.length],
    talkCooldown: 0,
    screenX:  0,
  }
}

const isMobile = () =>
  /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (typeof window !== 'undefined' && window.innerWidth <= 1024 && 'ontouchstart' in window)

function noise1(t) {
  return (
    Math.sin(t * 1.7 + 0.5) * 0.5 +
    Math.sin(t * 0.9 + 1.2) * 0.3 +
    Math.sin(t * 3.1 + 0.9) * 0.2
  )
}

// ── Monkey sprite ─────────────────────────────────────────────────────────────
function MonkeySprite({ screenX, groundY, jumpY, facing, size }) {
  const cvRef  = useRef(null)
  const imgs   = useRef([])
  const frameI = useRef(0)
  const lastT  = useRef(0)

  useEffect(() => {
    imgs.current = []
    for (let i = 0; i < MONKEY_FRAMES; i++) {
      const img = new Image()
      img.src = asset('/assets/sprites/monkey_walk/Walk_' + String(i).padStart(4,'0') + '.png')
      imgs.current.push(img)
    }
    let raf
    const tick = (ts) => {
      if (ts - lastT.current >= 1000 / MONKEY_FPS) {
        frameI.current = (frameI.current + 1) % MONKEY_FRAMES
        lastT.current = ts
      }
      const cv = cvRef.current
      if (cv) {
        const ctx = cv.getContext('2d')
        const img = imgs.current[frameI.current]
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.clearRect(0, 0, size, size)
          ctx.save()
          if (facing === -1) { ctx.translate(size, 0); ctx.scale(-1, 1) }
          ctx.drawImage(img, 0, 0, size, size)
          ctx.restore()
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [size, facing])

  // Sprite has 25% transparent padding below feet, so feet are at 75% of height
  const cssTop = Math.round(groundY - size * 0.75 - jumpY)

  return (
    <canvas ref={cvRef} width={size} height={size} style={{
      position: 'absolute',
      left: screenX - size / 2,
      top:  cssTop,
      imageRendering: 'auto',
      pointerEvents: 'none',
      zIndex: 6,
      filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.55))',
    }} />
  )
}

// ── Speech bubble ─────────────────────────────────────────────────────────────
function SpeechBubble({ x, y, text, fading }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: 'translateX(-50%) translateY(-100%)',
      zIndex: 30, pointerEvents: 'none', whiteSpace: 'nowrap',
      animation: fading ? 'mat-fade 0.4s ease-out forwards' : 'mat-pop 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards',
    }}>
      <div style={{
        backdropFilter: 'blur(20px) saturate(2)', WebkitBackdropFilter: 'blur(20px) saturate(2)',
        background: 'rgba(255,255,255,0.78)', border: '2px solid rgba(255,255,255,0.92)',
        borderRadius: 16, padding: isMobile() ? '8px 16px' : '12px 22px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)', display: 'inline-block', position: 'relative',
      }}>
        <span style={{
          fontFamily: '"Cormorant Garamond","Palatino Linotype",Georgia,serif',
          fontStyle: 'italic', fontWeight: 700,
          fontSize: isMobile() ? 14 : 18, color: '#0d2e1a',
        }}>{text}</span>
        <div style={{
          position: 'absolute', bottom: -11, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '9px solid transparent', borderRight: '9px solid transparent',
          borderTop: '11px solid rgba(255,255,255,0.78)',
        }} />
      </div>
    </div>
  )
}

// ── MATBURRY area toast — bigger, stays longer ────────────────────────────────
function MatburryToast() {
  const [phase, setPhase] = useState('hidden')
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 200)   // show quickly after fade-in starts
    const t2 = setTimeout(() => setPhase('fade'), 4000)  // stay 3.8s
    const t3 = setTimeout(() => setPhase('gone'), 5000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])
  if (phase === 'gone') return null
  return (
    <div style={{
      position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)',
      zIndex: 60, pointerEvents: 'none',
      opacity: phase === 'show' ? 1 : 0,
      transition: phase === 'fade' ? 'opacity 0.9s ease' : 'opacity 0.4s ease',
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, padding: '10px 36px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      }}>
        <div style={{
          fontFamily: '"Cormorant Garamond","Palatino Linotype",Georgia,serif',
          fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>area</div>
        <div style={{
          fontFamily: '"Syne","Inter",sans-serif', fontWeight: 800, fontSize: 26,
          color: '#fff', letterSpacing: '-0.02em',
        }}>Matburry</div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function MatburryScene({ containerWidth, containerHeight }) {
  const { dispatch } = useGame()
  const WORLD_WIDTH  = containerWidth * WORLD_MULT

  const pressedKeys  = useRef(new Set())
  const worldXRef    = useRef(-80)
  const velRef       = useRef(0)
  const cameraXRef   = useRef(0)
  const lastTimeRef  = useRef(null)
  const rafRef       = useRef(null)
  const soundRef     = useRef(false)
  const entryLockRef = useRef(true)

  const [screenX,  setScreenX]  = useState(-80)
  const [facing,   setFacing]   = useState(1)
  const [isMoving, setIsMoving] = useState(false)
  const [isSprint, setSprint]   = useState(false)

  // 10 monkeys — state
  const monkeysRef    = useRef(null)
  const [monkeyStates, setMonkeyStates] = useState([])
  const [bubbles,      setBubbles]      = useState({})
  const bubbleTimers  = useRef({})
  const toldRef       = useRef(new Set())

  if (!monkeysRef.current) {
    const WW = containerWidth * WORLD_MULT
    monkeysRef.current = Array.from({ length: NUM_MONKEYS }, (_, i) => makeMonkey(i, WW))
  }

  // Fade from black
  const [fadeAlpha, setFadeAlpha] = useState(1)
  useEffect(() => {
    const id = setTimeout(() => setFadeAlpha(0), 40)
    setTimeout(() => { entryLockRef.current = false }, 900)
    return () => clearTimeout(id)
  }, [])

  const scaledSpeed = containerWidth / GAME_WIDTH
  const groundY     = Math.round(containerHeight * GROUND_RATIO)
  const floorH      = containerHeight - groundY

  // Audio: play instantly on entry
  useEffect(() => {
    // Play jungle music continuously — never stop it, it persists across scenes
    audioManager.play('matburry_bgm', { loop: true, volume: 0.28 })
    // No cleanup — music keeps playing when returning to GovernorWorld
  }, [])

  // Background canvas
  const bgRef = useRef(null)
  const bgImg = useRef(null)
  const drawBg = useCallback((camX) => {
    const cv = bgRef.current
    if (!cv || !bgImg.current || !bgImg.current.naturalWidth) return
    const ctx = cv.getContext('2d')
    const iW = bgImg.current.naturalWidth
    const iH = bgImg.current.naturalHeight
    const scale = containerHeight / iH
    const renderW = iW * scale
    ctx.fillStyle = '#1a4a30'
    ctx.fillRect(0, 0, containerWidth, containerHeight)
    const s = Math.floor(camX / renderW)
    const e = Math.ceil((camX + containerWidth) / renderW)
    for (let t = s; t <= e; t++) ctx.drawImage(bgImg.current, t * renderW - camX, 0, renderW, containerHeight)
  }, [containerWidth, containerHeight])

  useEffect(() => {
    const img = new Image()
    img.src = asset('/assets/parallax/jungle_flat.png')
    img.onload = () => { bgImg.current = img; drawBg(0) }
    bgImg.current = img
  }, [drawBg])

  // Keys
  useEffect(() => {
    const dn = (e) => pressedKeys.current.add(e.code)
    const up = (e) => pressedKeys.current.delete(e.code)
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [])



  // Main loop
  useEffect(() => {
    const anchorX = containerWidth * PLAYER_ANCHOR
    const loop = (ts) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = ts

      // Player
      const dx       = getMovementDirection(pressedKeys.current)
      const shifting = pressedKeys.current.has('ShiftLeft') || pressedKeys.current.has('ShiftRight')
      const sprinting = shifting && dx !== 0
      const maxSpd   = (sprinting ? PLAYER_SPRINT_SPEED : PLAYER_MAX_SPEED) * scaledSpeed
      const accel    = (sprinting ? PLAYER_SPRINT_ACCEL : PLAYER_ACCEL) * scaledSpeed
      if (dx !== 0) velRef.current = Math.max(-maxSpd, Math.min(maxSpd, velRef.current + dx * accel * dt))
      else {
        const brake = PLAYER_DECEL * scaledSpeed * dt
        velRef.current = Math.abs(velRef.current) <= brake ? 0 : velRef.current - Math.sign(velRef.current) * brake
      }
      worldXRef.current += velRef.current * dt
      const moving = Math.abs(velRef.current) > 4
      if (dx !== 0) setFacing(dx > 0 ? 1 : -1)
      setIsMoving(moving); setSprint(sprinting)

      const maxCam = WORLD_WIDTH - containerWidth
      let cam = cameraXRef.current
      const tR = worldXRef.current - anchorX
      if (tR > cam) cam = Math.min(tR, maxCam)
      const tL = worldXRef.current - containerWidth * (1 - PLAYER_ANCHOR)
      if (tL < cam) cam = Math.max(tL, 0)
      cam = Math.max(0, Math.min(maxCam, cam))
      cameraXRef.current = cam
      setScreenX(Math.round(worldXRef.current - cam))
      drawBg(cam)

      if (moving && !soundRef.current) { audioManager.play('run', { loop:true, volume: RUN_VOLUME }); soundRef.current = true }
      else if (!moving && soundRef.current) { audioManager.fadeOut('run', 150); soundRef.current = false }

      // 10 monkeys
      const monkeys = monkeysRef.current
      const nextStates = []
      for (let mi = 0; mi < monkeys.length; mi++) {
        const m = monkeys[mi]
        m.noiseT += dt * (1.1 + mi * 0.08)
        m.jumpT  += dt
        const nv = noise1(m.noiseT)
        m.vel += (nv * MONKEY_MAX_SPD - m.vel) * dt * 3.2
        m.vel  = Math.max(-MONKEY_MAX_SPD, Math.min(MONKEY_MAX_SPD, m.vel))
        const mMin = WORLD_WIDTH * 0.02 + mi * (WORLD_WIDTH * 0.09)
        const mMax = mMin + WORLD_WIDTH * 0.12
        if (m.worldX <= mMin) m.vel = Math.abs(m.vel)
        if (m.worldX >= mMax) m.vel = -Math.abs(m.vel)
        m.worldX += m.vel * dt
        if (Math.abs(m.vel) > 40) m.facing = m.vel > 0 ? 1 : -1
        const jp = (m.jumpT % JUMP_PERIOD) / JUMP_PERIOD
        m.jumpY = jp < 0.5 ? Math.sin(jp * Math.PI * 2) * JUMP_HEIGHT : 0
        m.screenX = Math.round(m.worldX - cam)

        // Talk when player is near, cooldown prevents spam
        const dist = Math.abs(worldXRef.current - m.worldX)
        if (dist < MONKEY_TALK_DIST && !toldRef.current.has(mi)) {
          toldRef.current.add(mi)
          const midx = mi
          setBubbles(b => ({ ...b, [midx]: m.quote }))
          if (bubbleTimers.current[mi]) clearTimeout(bubbleTimers.current[mi])
          bubbleTimers.current[mi] = setTimeout(() => {
            setBubbles(b => { const nb = {...b}; delete nb[midx]; return nb })
            setTimeout(() => toldRef.current.delete(midx), 4000)
          }, 3500)
        }

        nextStates.push({ screenX: m.screenX, jumpY: m.jumpY, facing: m.facing })
      }
      setMonkeyStates([...nextStates])

      // Exit left → back to GovernorWorld
      if (worldXRef.current < -20 && velRef.current < -30 && !entryLockRef.current) {
        dispatch({ type: 'SET_SCENE', scene: SCENES.GOVERNOR_WORLD, direction: -1, playerStartX: null, playerFacing: -1 })
        return
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [containerWidth, containerHeight, scaledSpeed, drawBg, dispatch, WORLD_WIDTH])

  const monkeySize = Math.round(containerHeight * 0.19)
  const tileCount  = Math.ceil(containerWidth / TILE_W) + 1

  return (
    <div style={{ position:'relative', width:containerWidth, height:containerHeight, overflow:'hidden' }}>
      <style>{`
        @keyframes mat-pop {
          0%  { opacity:0; transform:translateX(-50%) scale(0.82) translateY(10px); }
          60% { transform:translateX(-50%) scale(1.04) translateY(-2px); }
          100%{ opacity:1; transform:translateX(-50%) scale(1) translateY(0); }
        }
        @keyframes mat-fade {
          from { opacity:1; transform:translateX(-50%) translateY(0); }
          to   { opacity:0; transform:translateX(-50%) translateY(-8px); }
        }
      `}</style>

      {/* Background image tiled */}
      <canvas ref={bgRef} width={containerWidth} height={containerHeight}
        style={{ position:'absolute', inset:0, zIndex:0 }} />

      {/* Floor — jungle-toned tiles matching the image's dark-green ground strip */}
      <div style={{
        position:'absolute', left:0, top: groundY, width:containerWidth, height: floorH,
        background:'linear-gradient(to bottom, #0e2e18 0%, #081a0e 100%)',
        borderTop:'2px solid rgba(80,180,90,0.18)',
        zIndex: 3,
      }}>
        {Array.from({ length: tileCount }).map((_, i) => (
          <div key={i} style={{
            position:'absolute', left: i * TILE_W, top:0, width: TILE_W, height:'100%',
            borderLeft:'1px solid rgba(60,160,70,0.06)',
          }} />
        ))}
        {/* Subtle mossy highlights on tile edges */}
        {Array.from({ length: tileCount }).map((_, i) => (
          <div key={'h'+i} style={{
            position:'absolute', left: i * TILE_W + 2, top:0, width:2, height:6,
            background:'rgba(80,200,90,0.12)',
          }} />
        ))}
      </div>

      {/* Top vignette */}
      <div style={{
        position:'absolute', inset:0, zIndex:2, pointerEvents:'none',
        background:'radial-gradient(ellipse at 50% 0%, transparent 30%, rgba(4,18,9,0.38) 100%)',
      }} />

      <MatburryToast />

      {/* 10 monkeys */}
      {monkeyStates.map((m, i) => m && m.screenX > -200 && m.screenX < containerWidth + 200 && (
        <MonkeySprite key={i} screenX={m.screenX} groundY={groundY} jumpY={m.jumpY} facing={m.facing} size={monkeySize} />
      ))}
      {Object.entries(bubbles).map(([idx, text]) => {
        const m = monkeyStates[+idx]
        if (!m || m.screenX < -80 || m.screenX > containerWidth + 80) return null
        return <SpeechBubble key={idx} x={m.screenX} y={Math.round(groundY - monkeySize * 0.75 - m.jumpY - 12)} text={text} fading={false} />
      })}

      {/* Player */}
      <PlayerSprite
        x={screenX} y={groundY} facing={facing}
        isMoving={isMoving} isSprinting={isSprint}
        containerHeight={containerHeight}
      />

      <MobileControls
        pressedKeys={pressedKeys} visible={isMobile()}
        containerWidth={containerWidth} containerHeight={containerHeight}
      />

      {/* 1s fade-in overlay */}
      <div style={{
        position:'absolute', inset:0, zIndex:90, background:'#000',
        opacity:fadeAlpha, transition:'opacity 1s ease', pointerEvents:'none',
      }} />
    </div>
  )
}
