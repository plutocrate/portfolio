import { useEffect, useRef, useState, useCallback } from 'react'
import { useGame } from '../hooks/useGameState'
import { SCENES, GAME_WIDTH, PLAYER_MAX_SPEED, PLAYER_ACCEL, PLAYER_DECEL,
         PLAYER_SPRINT_SPEED, PLAYER_SPRINT_ACCEL, GROUND_Y_RATIO, SPRITE_SCALE } from '../utils/constants'
import { getMovementDirection } from '../utils/keyboard'
import { audioManager, RUN_VOLUME } from '../utils/audio'
import PlayerSprite    from '../components/game/PlayerSprite'
import GovernorSprite, { GOV_CANVAS_PX, GOV_CX_IN_CANVAS, GOV_HEAD_IN_CANVAS, GOV_FOOT_FROM_BOT } from '../components/game/GovernorSprite'
import CRTComputer     from '../components/game/CRTComputer'
import GovernorHUD     from '../components/game/GovernorHUD'
import MobileControls  from '../components/game/MobileControls'
import ResumeScene     from './ResumeScene'

const isMobile = () =>
  /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (typeof window !== 'undefined' && window.innerWidth <= 1024 && 'ontouchstart' in window)

const TRIGGER_DIST   = 130
const DIALOGUE_DIST  = 160
const HUD_LOCK_DIST  = 220

export default function GovernorWorldScene({ containerWidth, containerHeight, startX, startFacing = 1, startVelocity = 0 }) {
  const { dispatch }  = useGame()
  const pressedKeys   = useRef(new Set())
  const playerXRef    = useRef(startX ?? 120)
  const velRef        = useRef(0)   // always start at rest — don't carry velocity into this scene
  const lastTimeRef   = useRef(null)
  const rafRef        = useRef(null)
  const soundRef        = useRef(false)
  const rightWallHitRef = useRef(false)
  const wallTimerRef    = useRef(null)
  // Grace period — prevent instant left-exit on scene entry
  const entryLockedRef  = useRef(true)
  const entryTimerRef   = useRef(null)
  const eHandledRef   = useRef(false)  // prevent rapid-fire on hold

  const [playerX,    setPlayerX]    = useState(startX ?? 120)
  const [facing,     setFacing]     = useState(startFacing)
  const [isMoving,   setIsMoving]   = useState(false)
  const [isSprinting,setSprinting]  = useState(false)

  const [nearGov,    setNearGov]    = useState(false)
  const [wallDialogue, setWallDialogue] = useState(false)
  const [hudOpen,    setHudOpen]    = useState(false)
  const [govAnim,    setGovAnim]    = useState('walk')
  const [govFacing,  setGovFacing]  = useState(-1)
  const [showBubble, setShowBubble] = useState(false)
  const [bubbleFade, setBubbleFade] = useState(false)
  const [showResume, setShowResume] = useState(false)
  const [resumeBack, setResumeBack] = useState(false)

  // ── Entry toast ───────────────────────────────────────────────────────────
  const [entryToast,      setEntryToast]      = useState('in')   // 'in' | 'out' | 'gone'
  const [entryToastPhase, setEntryToastPhase] = useState('pre')  // 'pre' | 'show' | 'fade'
  useEffect(() => {
    const t1 = setTimeout(() => setEntryToastPhase('show'),  200)
    const t2 = setTimeout(() => setEntryToastPhase('fade'), 2200)
    const t3 = setTimeout(() => setEntryToast('gone'),      3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const scaledSpeed  = containerWidth / GAME_WIDTH
  const groundY      = Math.round(containerHeight * GROUND_Y_RATIO)
  const governorX    = Math.round(containerWidth * 0.62)   // NPC position
  const computerX    = Math.round(containerWidth * 0.75)   // computer to right of NPC
  const computerY    = groundY - 8                          // sits on ground

  // ── Show bubble when player approaches, hide when HUD opens ──────────────
  useEffect(() => {
    if (hudOpen) {
      setBubbleFade(true)
      setTimeout(() => { setShowBubble(false); setBubbleFade(false) }, 500)
    }
  }, [hudOpen])

  // ── Keys ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Lock left exit for 600ms so carry-over velocity doesn't instantly send player back
    entryLockedRef.current = true
    entryTimerRef.current  = setTimeout(() => { entryLockedRef.current = false }, 600)
    return () => clearTimeout(entryTimerRef.current)
  }, [])

  useEffect(() => {
    pressedKeys.current.clear()
    const dn = (e) => {
      pressedKeys.current.add(e.code)
      // E to open HUD
      if ((e.code === 'KeyE') && nearGov && !hudOpen && !eHandledRef.current) {
        eHandledRef.current = true
        setHudOpen(true)
        setGovAnim('idle')
        setGovFacing(playerXRef.current < governorX ? 1 : -1)
      }
      // Escape closes HUD
      if (e.code === 'Escape' && hudOpen) setHudOpen(false)
    }
    const up = (e) => {
      pressedKeys.current.delete(e.code)
      if (e.code === 'KeyE') eHandledRef.current = false
    }
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup',   up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [nearGov, hudOpen, governorX])

  // ── Mobile: tap on governor to interact ────────────────────────────────────
  const handleTap = useCallback((tapPos) => {
    if (hudOpen) return
    // Map tap screen X to governor screen X — check proximity
    const dist = Math.abs(tapPos.x - govXRef.current)
    if (dist < HUD_LOCK_DIST * 1.5) {
      setHudOpen(true)
      setGovAnim('idle')
      setGovFacing(playerXRef.current < govXRef.current ? 1 : -1)
    }
  }, [hudOpen])

  // ── Governor wanders slightly left/right when not talking ─────────────────
  const govXRef    = useRef(governorX)
  const govVelRef  = useRef(-30)
  const govNoiseT  = useRef(0)
  const [govScreenX, setGovScreenX] = useState(governorX)

  // ── Main game loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = (ts) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = ts

      // ── Player movement (locked while HUD open) ──
      let sx = playerXRef.current
      if (!hudOpen) {
        const dx       = getMovementDirection(pressedKeys.current)
        const shifting = pressedKeys.current.has('ShiftLeft') || pressedKeys.current.has('ShiftRight')
        const sprinting = shifting && dx !== 0
        const maxSpd   = (sprinting ? PLAYER_SPRINT_SPEED : PLAYER_MAX_SPEED) * scaledSpeed
        const accelVal = (sprinting ? PLAYER_SPRINT_ACCEL : PLAYER_ACCEL) * scaledSpeed
        if (dx !== 0) velRef.current = Math.max(-maxSpd, Math.min(maxSpd, velRef.current + dx * accelVal * dt))
        else {
          const d = PLAYER_DECEL * scaledSpeed * dt
          velRef.current = Math.abs(velRef.current) <= d ? 0 : velRef.current - Math.sign(velRef.current) * d
        }
        const moving = Math.abs(velRef.current) > 2
        playerXRef.current = Math.max(0, Math.min(containerWidth - 40, playerXRef.current + velRef.current * dt))
        sx = playerXRef.current
        setPlayerX(Math.round(sx))
        if (dx !== 0) setFacing(dx > 0 ? 1 : -1)
        setIsMoving(moving)
        setSprinting(sprinting)

        if (moving && !soundRef.current) {
          audioManager.play('run', { loop: true, volume: RUN_VOLUME })
          soundRef.current = true
        } else if (!moving && soundRef.current) {
          audioManager.fadeOut('run', 150)
          soundRef.current = false
        }

        // ── Scene exits ──
        if (sx <= 10 && velRef.current < 0 && !entryLockedRef.current) {
          dispatch({ type:'SET_SCENE', scene: SCENES.PARALLAX_WORLD, direction: -1, playerStartX: containerWidth - 110, playerFacing: -1 })
        }
        // Right wall — bounce + governor comment
        if (sx >= containerWidth - 40) {
          playerXRef.current = containerWidth - 40
          velRef.current = -Math.abs(velRef.current) * 0.4
          if (!rightWallHitRef.current) {
            rightWallHitRef.current = true
            setWallDialogue(true)
            if (wallTimerRef.current) clearTimeout(wallTimerRef.current)
            wallTimerRef.current = setTimeout(() => {
              setWallDialogue(false)
              rightWallHitRef.current = false
            }, 2200)
          }
        }
      }

      // ── Governor wander (only when HUD closed) ──
      if (!hudOpen) {
        govNoiseT.current += dt * 0.4
        const n = Math.sin(govNoiseT.current * 1.5) * 0.6 + Math.sin(govNoiseT.current * 0.7) * 0.4
        const target = n * 80
        govVelRef.current += (target - govVelRef.current) * dt * 1.0
        govVelRef.current  = Math.max(-90, Math.min(90, govVelRef.current))
        const gMin = governorX - 80, gMax = governorX + 80
        if (govXRef.current <= gMin && govVelRef.current < 0) govVelRef.current = Math.abs(govVelRef.current)
        if (govXRef.current >= gMax && govVelRef.current > 0) govVelRef.current = -Math.abs(govVelRef.current)
        govXRef.current += govVelRef.current * dt
        if (Math.abs(govVelRef.current) > 6) setGovFacing(govVelRef.current > 0 ? 1 : -1)
        setGovScreenX(Math.round(govXRef.current))
      }

      // ── Proximity checks ──
      const distToGov = Math.abs(sx - govXRef.current)
      const isNear    = distToGov < HUD_LOCK_DIST
      setNearGov(isNear)

      if (isNear && !hudOpen) setShowBubble(true)
      else if (!isNear && !hudOpen) {
        setBubbleFade(true)
        setTimeout(() => { setShowBubble(false); setBubbleFade(false) }, 400)
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      audioManager.fadeOut('run', 100)
    }
  }, [containerWidth, containerHeight, dispatch, scaledSpeed, hudOpen, governorX])

  // Resume open/close callbacks
  const handleResumeOpen = useCallback(() => {
    setShowResume(true)
    setHudOpen(false)
  }, [])
  const handleResumeBack = useCallback(() => {
    setShowResume(false)
    setHudOpen(true)
    setResumeBack(true)
    setGovAnim('happy')
  }, [])

  const spriteH   = Math.round(SPRITE_SCALE * 240 * (containerHeight / 720))
  const bubbleX   = govScreenX
  const bubbleY   = groundY - GOV_CANVAS_PX + GOV_HEAD_IN_CANVAS - 8

  // ── Background palette — indoor/room feel ────────────────────────────────
  const floorY    = Math.round(containerHeight * GROUND_Y_RATIO)
  const wallColor = 'linear-gradient(to bottom, #1a1a2e 0%, #16213e 55%, #0f3460 100%)'

  return (
    <div style={{ position:'relative', width:containerWidth, height:containerHeight, overflow:'hidden', background:'#0a0a18' }}>

      {/* Keyframe styles */}
      <style>{`
        @keyframes npcPop {
          0%   { opacity:0; transform:translateX(-50%) scale(0.82) translateY(12px); }
          60%  { transform:translateX(-50%) scale(1.04) translateY(-3px); }
          100% { opacity:1; transform:translateX(-50%) scale(1) translateY(0); }
        }
        @keyframes npcFade {
          from { opacity:1; transform:translateX(-50%) translateY(0); }
          to   { opacity:0; transform:translateX(-50%) translateY(-8px); }
        }
        @keyframes crtFlicker { 0%,100%{opacity:1} 92%{opacity:0.97} 94%{opacity:0.92} 96%{opacity:0.98} }
      `}</style>

      {/* Entry toast — above player's head */}
      {entryToast !== 'gone' && (
        <div style={{
          position:      'absolute',
          left:          playerX,
          top:           groundY - 180,
          transform:     'translateX(-50%) translateY(-100%)',
          zIndex:        80,
          pointerEvents: 'none',
          animation: entryToastPhase === 'show'
            ? 'npcPop 0.4s cubic-bezier(0.16,1,0.3,1) forwards'
            : entryToastPhase === 'fade'
            ? 'npcFade 0.8s ease forwards'
            : 'none',
          opacity: entryToastPhase === 'pre' ? 0 : 1,
        }}>
          <div style={{
            backdropFilter:       'blur(24px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            background:           'rgba(255,255,255,0.60)',
            border:               '2px solid rgba(255,255,255,0.92)',
            borderRadius:         '14px',
            padding:              '10px 20px 9px',
            boxShadow:            '0 8px 40px rgba(0,0,0,0.25), inset 0 1.5px 0 rgba(255,255,255,0.95)',
            whiteSpace:           'nowrap',
            position:             'relative',
            display:              'inline-block',
          }}>
            <span style={{
              fontFamily:    '"Cormorant Garamond","Palatino Linotype",Georgia,serif',
              fontStyle:     'italic',
              fontWeight:    700,
              fontSize:      'clamp(13px,2vw,20px)',
              color:         '#0d0d1a',
              letterSpacing: '0.01em',
            }}>
              what the hell is this world?
            </span>
            {/* Tail pointing down toward character */}
            <div style={{
              position: 'absolute', bottom: '-12px', left: '50%',
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '12px solid rgba(255,255,255,0.75)',
              filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.12))',
            }} />
          </div>
        </div>
      )}

      {/* Room wall background */}
      <div style={{ position:'absolute', inset:0, background: wallColor }} />

      {/* Ambient CRT glow spill on wall */}
      <div style={{
        position:'absolute',
        left: computerX - 160, top: containerHeight * 0.1,
        width: 320, height: containerHeight * 0.7,
        background:'radial-gradient(ellipse, rgba(40,255,160,0.10) 0%, transparent 70%)',
        pointerEvents:'none', animation:'crtFlicker 4s infinite',
      }} />

      {/* Floor */}
      <div style={{
        position:'absolute', left:0, top: floorY, width:containerWidth, height: containerHeight - floorY,
        background:'linear-gradient(to bottom,#1a1020 0%,#120c18 100%)',
        borderTop:'2px solid rgba(255,255,255,0.06)',
      }}>
        {/* Floor tiles */}
        {Array.from({ length: Math.ceil(containerWidth / 80) + 1 }).map((_, i) => (
          <div key={i} style={{
            position:'absolute', left: i * 80, top:0, width:80, height:'100%',
            borderLeft:'1px solid rgba(255,255,255,0.04)',
          }} />
        ))}
      </div>

      {/* CRT Computer */}
      <CRTComputer x={computerX} y={computerY} width={200} active />

      {/* Governor NPC */}
      <GovernorSprite
        x={govScreenX}
        y={groundY}
        facing={govFacing}
        animState={hudOpen ? (resumeBack ? 'happy' : 'idle') : 'walk'}
      />

      {/* Speech bubble — "interact with me" */}
      {showBubble && !hudOpen && (
        <div style={{
          position:'absolute',
          left: bubbleX, top: bubbleY,
          transform:'translateX(-50%) translateY(-100%)',
          zIndex:30, pointerEvents:'none', whiteSpace:'nowrap',
          animation: bubbleFade
            ? 'npcFade 0.4s ease-out forwards'
            : 'npcPop 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          <div style={{
            backdropFilter:'blur(28px) saturate(2.2) brightness(1.15)',
            WebkitBackdropFilter:'blur(28px) saturate(2.2) brightness(1.15)',
            background:'rgba(255,255,255,0.60)',
            border:'2px solid rgba(255,255,255,0.92)',
            borderRadius: isMobile() ? 12 : 18,
            padding: isMobile() ? '8px 14px 7px' : '14px 26px 12px',
            boxShadow:'0 8px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15), inset 0 1.5px 0 rgba(255,255,255,0.95)',
            position:'relative', display:'inline-block',
          }}>
            <div style={{
              fontFamily:'"Cormorant Garamond","Palatino Linotype",Georgia,serif',
              fontStyle:'italic', fontWeight:700,
              fontSize: isMobile() ? 13 : 20,
              lineHeight:1, letterSpacing:'0.015em', color:'#0d0d1a', whiteSpace:'nowrap',
            }}>
              {isMobile()
                ? 'tap me to chat'
                : 'I was waiting for you. PRESS E, and we can talk.'}
            </div>
            <div style={{
              position:'absolute', bottom:-12, left:'50%', transform:'translateX(-50%)',
              width:0, height:0,
              borderLeft:'10px solid transparent', borderRight:'10px solid transparent',
              borderTop:'12px solid rgba(255,255,255,0.75)',
              filter:'drop-shadow(0 3px 3px rgba(0,0,0,0.12))',
            }} />
          </div>
        </div>
      )}

      {/* Right wall — governor dialogue bubble */}
      {wallDialogue && (
        <div style={{
          position:'absolute',
          left: govScreenX, top: bubbleY,
          transform:'translateX(-50%) translateY(-100%)',
          zIndex:30, pointerEvents:'none', whiteSpace:'nowrap',
          animation:'npcPop 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          <div style={{
            backdropFilter:'blur(28px) saturate(2.2) brightness(1.15)',
            WebkitBackdropFilter:'blur(28px) saturate(2.2) brightness(1.15)',
            background:'rgba(255,255,255,0.60)',
            border:'2px solid rgba(255,255,255,0.92)',
            borderRadius: isMobile() ? 12 : 18,
            padding: isMobile() ? '8px 14px 7px' : '14px 26px 12px',
            boxShadow:'0 8px 40px rgba(0,0,0,0.25), inset 0 1.5px 0 rgba(255,255,255,0.95)',
            position:'relative', display:'inline-block',
          }}>
            <div style={{
              fontFamily:'"Cormorant Garamond","Palatino Linotype",Georgia,serif',
              fontStyle:'italic', fontWeight:700,
              fontSize: isMobile() ? 13 : 20,
              lineHeight:1, color:'#0d0d1a', whiteSpace:'nowrap',
            }}>
              i'm still building it.
            </div>
            <div style={{
              position:'absolute', bottom:-12, left:'50%', transform:'translateX(-50%)',
              width:0, height:0,
              borderLeft:'10px solid transparent', borderRight:'10px solid transparent',
              borderTop:'12px solid rgba(255,255,255,0.75)',
            }} />
          </div>
        </div>
      )}

      {/* E key prompt — desktop only; mobile uses tap */}
      {nearGov && !hudOpen && !isMobile() && (
        <div style={{
          position:'absolute', bottom: containerHeight * 0.12, left:'50%', transform:'translateX(-50%)',
          background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.2)',
          borderRadius:8, padding:'6px 16px', color:'rgba(255,255,255,0.75)',
          fontSize:13, fontFamily:'"Courier New",monospace', letterSpacing:'0.08em',
          pointerEvents:'none', zIndex:20,
        }}>
          [E] talk
        </div>
      )}

      {/* Player */}
      <PlayerSprite
        x={playerX}
        y={groundY}
        facing={facing}
        isMoving={isMoving && !hudOpen}
        isSprinting={isSprinting && !hudOpen}
        containerHeight={containerHeight}
      />

      {/* Mobile touch zones — movement + tap-to-interact */}
      <MobileControls
        pressedKeys={pressedKeys}
        visible={isMobile() && !hudOpen}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
      />

      {/* Mobile tap-to-interact overlay on governor */}
      {isMobile() && nearGov && !hudOpen && (
        <div
          onClick={() => handleTap({ x: govScreenX, y: groundY })}
          style={{
            position:   'absolute',
            left:       govScreenX - 60,
            top:        groundY - 200,
            width:      120,
            height:     220,
            zIndex:     45,
            cursor:     'pointer',
          }}
        />
      )}

      {/* Governor HUD */}
      {hudOpen && (
        <GovernorHUD
          onClose={() => { setHudOpen(false); setGovAnim('walk') }}
          onResumeOpen={handleResumeOpen}
          onAnimState={setGovAnim}
          resumeBack={resumeBack}
        />
      )}

      {/* Resume overlay */}
      {showResume && (
        <div style={{ position:'fixed', inset:0, zIndex:200, background:'#000', overflowY:'auto' }}>
          <ResumeScene onBack={handleResumeBack} embedded />
        </div>
      )}
    </div>
  )
}
