import { useEffect, useRef, useState } from 'react'
import PlayerSprite from '../components/game/PlayerSprite'
import NpcSprite from '../components/game/NpcSprite'
import { useGame } from '../hooks/useGameState'
import {
  SCENES, GAME_WIDTH,
  PLAYER_MAX_SPEED, PLAYER_ACCEL, PLAYER_DECEL,
  PLAYER_SPRINT_SPEED, PLAYER_SPRINT_ACCEL,
  SPRITE_SCALE, asset,
} from '../utils/constants'
import { getMovementDirection } from '../utils/keyboard'
import { audioManager, RUN_VOLUME } from '../utils/audio'

const GROUND_Y_RATIO = 0.80
const TILE_RENDER    = 72
// World is 2× screen width — camera scrolls, player anchors at 35% once scrolling
const WORLD_MULT     = 3.0
const PLAYER_ANCHOR  = 0.35  // screen fraction where camera starts scrolling

export default function ParallaxWorldScene({
  containerWidth,
  containerHeight,
  startVelocity  = 0,
  startFacing    = 1,
  startSprinting = false,
}) {
  const WORLD_WIDTH  = containerWidth * WORLD_MULT

  const pressedKeys  = useRef(new Set())
  // world-space player position — entering from left: near left edge; from right: near right edge
  const worldXRef    = useRef(startFacing === -1 ? WORLD_WIDTH - 100 : -80)
  const velRef       = useRef(0)  // always start stopped — player re-presses to move
  const cameraXRef   = useRef(startFacing === -1 ? WORLD_WIDTH - containerWidth : 0)

  const [screenX,      setScreenX]   = useState(startFacing === -1 ? containerWidth - 100 : -80)
  const [playerFacing, setFacing]    = useState(startFacing)
  const [isMoving,     setIsMoving]  = useState(false)
  const [isSprinting,  setSprinting] = useState(false)
  const [velocity,     setVelocity]  = useState(0)
  const [bgOffset,     setBgOffset]  = useState(startFacing === -1 ? -(WORLD_WIDTH - containerWidth) : 0)
  const [titlePhase,   setTitlePhase] = useState('premount') // premount → fadein → fading → hidden

  const tileCanvasRef = useRef(null)
  const bgCanvasRef   = useRef(null)
  const bgImgRef      = useRef(null)
  const tileImgRef    = useRef(null)
  const rafRef        = useRef(null)
  const lastTimeRef   = useRef(null)
  const endReached    = useRef(false)
  const soundRef      = useRef(false)

  // ── Player dialogue — triggered when passing Barbarian ───────────────────
  const [playerDialogue,        setPlayerDialogue]        = useState(false)
  const [playerDialogueFading,  setPlayerDialogueFading]  = useState(false)
  const playerNearBarbarianRef  = useRef(false)
  const playerDialogueTimerRef  = useRef(null)

  // ── NPC state — Romeo near entry, Barbarian at mid, Juliet near end ─────
  // Each NPC has: worldX, vel, facing, noiseT (Perlin time)
  // Barbarian also gets patrolMin/patrolMax so he walks a wide zone at his scale
  const barbarianMid = containerWidth * WORLD_MULT * 0.50
  const NPCS_INIT = [
    { worldX: 480,              vel:  60,  facing:  1, noiseT: 0,    patrolMin: 80,                patrolMax: containerWidth * 0.9 },
    { worldX: barbarianMid,     vel: -180, facing: -1, noiseT: 55.0, patrolMin: barbarianMid - 600, patrolMax: barbarianMid + 600 },
    { worldX: containerWidth * WORLD_MULT * 0.82, vel: -50, facing: -1, noiseT: 99.1, patrolMin: containerWidth * WORLD_MULT * 0.65, patrolMax: containerWidth * WORLD_MULT * 0.95 },
  ]
  const npcRef = useRef(NPCS_INIT.map(n => ({ ...n })))
  const [npcScreenPositions, setNpcScreenPositions] = useState(
    npcRef.current.map(n => ({
      x: Math.round(n.worldX - cameraXRef.current),
      facing: n.facing,
      isMoving: true,
    }))
  )
  const { dispatch }  = useGame()
  const scaledSpeed   = containerWidth / GAME_WIDTH
  const groundY       = Math.round(containerHeight * GROUND_Y_RATIO)

  // ── Sync physically-held keys on mount so carry-over momentum doesn't self-drive ──
  useEffect(() => {
    // Clear any keys that were held in the previous scene — player must re-press to move
    pressedKeys.current.clear()
  }, [])

  // Map title popup: 800ms delay → visible → total 3s inc fade → hidden
  // Timeline: 0ms wait → 800ms appear (0.5s fade-in) → 800+1800=2600ms start fade → 2600+700=3300ms remove
  useEffect(() => {
    // element mounts at opacity:0 (premount), then fades in after 1s delay
    const t1 = setTimeout(() => setTitlePhase('fadein'),  1000)
    const t2 = setTimeout(() => setTitlePhase('fading'),  1000 + 800 + 2000)
    const t3 = setTimeout(() => setTitlePhase('hidden'),  1000 + 800 + 2000 + 800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  // Load tileset and background — re-draw immediately on load (handles return-to-scene)
  useEffect(() => {
    const tileImg = new Image()
    tileImg.src = asset('/assets/tiles/TileSetApart.png')
    tileImg.onload = () => {
      tileImgRef.current = tileImg
      drawTiles(cameraXRef.current)
    }

    const bgImg = new Image()
    bgImg.src = asset('/assets/parallax/Flat.png')
    bgImg.onload = () => {
      bgImgRef.current = bgImg
      drawBg(cameraXRef.current)
    }
  }, [])

  // Draw background — Flat.png tiled twice across world width
  const drawBg = (camX) => {
    const canvas = bgCanvasRef.current
    const img    = bgImgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, containerWidth, containerHeight)
    // Each tile = containerWidth wide, draw 3 copies to cover any camera position
    const tileW  = containerWidth
    const offset = -(camX % tileW)
    for (let i = -1; i <= 2; i++) {
      ctx.drawImage(img, offset + i * tileW, 0, tileW, containerHeight)
    }
  }
  const drawTiles = (camX) => {
    const canvas = tileCanvasRef.current
    const img    = tileImgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, containerWidth, containerHeight)
    const cols = Math.ceil(containerWidth / TILE_RENDER) + 2
    const rows = Math.ceil((containerHeight - groundY) / TILE_RENDER) + 1
    const tileOffsetX = -(camX % TILE_RENDER)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const srcY = r === 0 ? 126 : 360
        const srcH = r === 0 ? 114 : 120
        ctx.drawImage(img, 120, srcY, 120, srcH,
          tileOffsetX + c * TILE_RENDER, groundY + r * TILE_RENDER,
          TILE_RENDER, TILE_RENDER)
      }
    }
  }

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current
    if (bgCanvas) { bgCanvas.width = containerWidth; bgCanvas.height = containerHeight }
    const canvas = tileCanvasRef.current
    if (!canvas) return
    canvas.width  = containerWidth
    canvas.height = containerHeight
    drawTiles(cameraXRef.current)
    // Draw bg immediately if image already loaded (handles return-to-scene)
    if (bgImgRef.current) drawBg(cameraXRef.current)
  }, [containerWidth, containerHeight, groundY])

  useEffect(() => {
    const dn = (e) => pressedKeys.current.add(e.code)
    const up = (e) => pressedKeys.current.delete(e.code)
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup',   up)
    return () => {
      window.removeEventListener('keydown', dn)
      window.removeEventListener('keyup',   up)
    }
  }, [])

  // startSprinting is intentionally not injected into pressedKeys —
  // the player must re-press keys after scene transition

  useEffect(() => {
    const anchorScreenX = containerWidth * PLAYER_ANCHOR

    const loop = (ts) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = ts

      const dx        = getMovementDirection(pressedKeys.current)
      const shifting  = pressedKeys.current.has('ShiftLeft') || pressedKeys.current.has('ShiftRight')
      const sprinting = shifting && dx !== 0
      const maxSpd    = (sprinting ? PLAYER_SPRINT_SPEED : PLAYER_MAX_SPEED) * scaledSpeed
      const accelVal  = (sprinting ? PLAYER_SPRINT_ACCEL : PLAYER_ACCEL)     * scaledSpeed

      if (dx !== 0) {
        velRef.current = Math.max(-maxSpd, Math.min(maxSpd, velRef.current + dx * accelVal * dt))
      } else {
        const brake = PLAYER_DECEL * scaledSpeed * dt
        velRef.current = Math.abs(velRef.current) <= brake ? 0 : velRef.current - Math.sign(velRef.current) * brake
      }

      const moving = Math.abs(velRef.current) > 4
      worldXRef.current += velRef.current * dt

      // Camera: clamp to world bounds, scroll when player past anchor
      const maxCam = WORLD_WIDTH - containerWidth
      let cam = cameraXRef.current

      const targetCam = worldXRef.current - anchorScreenX
      if (targetCam > cam) cam = Math.min(targetCam, maxCam)
      // Also scroll left with player
      const leftAnchor = worldXRef.current - (containerWidth * (1 - PLAYER_ANCHOR))
      if (leftAnchor < cam) cam = Math.max(leftAnchor, 0)

      cam = Math.max(0, Math.min(maxCam, cam))
      cameraXRef.current = cam

      const sx = worldXRef.current - cam
      setScreenX(Math.round(sx))
      setVelocity(velRef.current)
      setSprinting(sprinting)
      if (dx !== 0) setFacing(dx > 0 ? 1 : -1)
      setIsMoving(moving)
      setBgOffset(-cam)
      drawBg(cam)
      drawTiles(cam)

      // ── Sounds: follow movement ──
      if (moving && !soundRef.current) {
        audioManager.play('run', { loop: true, volume: RUN_VOLUME })
        soundRef.current = true
      } else if (!moving && soundRef.current) {
        audioManager.fadeOut('run', 150)
        soundRef.current = false
      }


      // ── NPC movement — each NPC patrols its own zone with Perlin noise ────
      const updatedNpcs = npcRef.current.map((npc, idx) => {
        const isBarbarian = idx === 1

        if (isBarbarian) {
          // Barbarian: slow heavy walk — big guy moves deliberately
          // Simple constant velocity, flips direction cleanly at patrol edges
          const BARB_SPEED = 80    // px/s — slow, heavy stride
          const ACCEL      = 160   // px/s² — gradual ramp, no snapping

          // Maintain constant direction, gently ramp to target speed
          const targetVel = npc.vel >= 0 ? BARB_SPEED : -BARB_SPEED
          npc.vel += (targetVel - npc.vel) * Math.min(1, ACCEL / Math.abs(targetVel - npc.vel + 0.001) * dt)
          npc.vel  = Math.max(-BARB_SPEED, Math.min(BARB_SPEED, npc.vel))

          // Reached boundary: smooth stop, flip direction, resume
          if (npc.worldX <= npc.patrolMin) {
            npc.worldX = npc.patrolMin + 1   // push 1px inside so condition clears
            npc.vel    = BARB_SPEED * 0.3    // start slow walking right
          }
          if (npc.worldX >= npc.patrolMax) {
            npc.worldX = npc.patrolMax - 1
            npc.vel    = -BARB_SPEED * 0.3   // start slow walking left
          }
        } else {
          // Romeo & Juliet: smooth Perlin noise within their patrol zone
          npc.noiseT += dt * 0.35
          const n         = Math.sin(npc.noiseT * 1.7) * 0.6 + Math.sin(npc.noiseT * 0.9) * 0.4
          const targetVel = n * 180
          npc.vel        += (targetVel - npc.vel) * dt * 1.1
          npc.vel         = Math.max(-200, Math.min(200, npc.vel))
          // Bounce at patrol bounds
          if (npc.worldX <= npc.patrolMin && npc.vel < 0) npc.vel = Math.abs(npc.vel)
          if (npc.worldX >= npc.patrolMax && npc.vel > 0) npc.vel = -Math.abs(npc.vel)
        }

        npc.worldX += npc.vel * dt
        if (Math.abs(npc.vel) > 10) npc.facing = npc.vel > 0 ? 1 : -1
        return npc
      })
      npcRef.current = updatedNpcs
      setNpcScreenPositions(updatedNpcs.map(npc => ({
        x: Math.round(npc.worldX - cameraXRef.current),
        facing: npc.facing,
        isMoving: Math.abs(npc.vel) > 8,
      })))

      // ── Player dialogue trigger — fires when player crosses Barbarian ──────
      const barbarianScreenX = npcRef.current[1]
        ? Math.round(npcRef.current[1].worldX - cameraXRef.current)
        : -9999
      const nearBarbarian = Math.abs(sx - barbarianScreenX) < 220
      if (nearBarbarian && !playerNearBarbarianRef.current) {
        // Player just entered barbarian zone
        playerNearBarbarianRef.current = true
        // Clear any pending show timer so we only trigger on exit
        if (playerDialogueTimerRef.current) clearTimeout(playerDialogueTimerRef.current)
      }
      if (!nearBarbarian && playerNearBarbarianRef.current) {
        // Player just LEFT barbarian — wait 2s then show dialogue
        playerNearBarbarianRef.current = false
        if (playerDialogueTimerRef.current) clearTimeout(playerDialogueTimerRef.current)
        playerDialogueTimerRef.current = setTimeout(() => {
          setPlayerDialogueFading(false)
          setPlayerDialogue(true)
          // Auto-fade after 8s
          playerDialogueTimerRef.current = setTimeout(() => {
            setPlayerDialogueFading(true)
            setTimeout(() => { setPlayerDialogue(false); setPlayerDialogueFading(false) }, 700)
          }, 8000)
        }, 2000)
      }

      // Exit right — past world right edge
      if (!endReached.current && worldXRef.current > WORLD_WIDTH + 20) {
        endReached.current = true
        dispatch({ type: 'SET_SCENE', scene: SCENES.GOVERNOR_WORLD, direction: 1, playerStartX: 80, playerFacing: 1, playerVelocity: velRef.current })
      }
      // Exit left — past world left edge
      if (!endReached.current && worldXRef.current < -100 && velRef.current < -20) {
        endReached.current = true
        dispatch({ type: 'SET_SCENE', scene: SCENES.ENTRY, direction: -1, playerStartX: containerWidth - 110, playerFacing: -1 })
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [containerWidth, containerHeight, dispatch, scaledSpeed, WORLD_WIDTH])

  return (
    <div style={{
      position: 'relative', width: containerWidth, height: containerHeight,
      overflow: 'hidden', background: '#cde7db',
    }}>
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
      `}</style>

      {/* Background canvas — Flat.png tiled twice across 2× world width */}
      <canvas
        ref={bgCanvasRef}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
      />

      {/* Tile floor canvas */}
      <canvas
        ref={tileCanvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}
      />

      {/* Map title popup — glassmorphism card lifted OUT of overflow:hidden via portal-like absolute */}
      {titlePhase !== 'hidden' && (
        <div style={{
          position: 'absolute',
          top: '7%',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 100,
          opacity: titlePhase === 'fadein' ? 1 : 0,
          transition: titlePhase === 'premount' ? 'none' : 'opacity 0.8s ease-in-out',
        }}>
          <div style={{
            position: 'relative',
            padding: 'clamp(22px, 3vw, 40px) clamp(44px, 7vw, 96px)',
            borderRadius: '20px',
            overflow: 'hidden',
          }}>
            {/* Blur layer — absolute fill, blurs the canvas pixels beneath */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '20px',
              backdropFilter: 'blur(20px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
              background: 'rgba(220, 235, 255, 0.35)',
              border: '1.5px solid rgba(255,255,255,0.70)',
              boxShadow: '0 12px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.85)',
            }} />
            {/* Content — sits above blur layer */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '52px', height: '1.5px', background: 'rgba(20,20,50,0.45)' }} />
              <h1 style={{
                fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
                fontWeight: 300,
                fontStyle: 'italic',
                fontSize: 'clamp(56px, 8vw, 100px)',
                letterSpacing: '0.2em',
                color: '#0f0f28',
                textShadow: '0 1px 2px rgba(255,255,255,0.6), 0 4px 16px rgba(0,0,0,0.12)',
                margin: 0,
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}>
                Junction
              </h1>
              <div style={{ width: '52px', height: '1px', background: 'rgba(20,20,50,0.25)' }} />
              <p style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontWeight: 600,
                fontStyle: 'italic',
                fontSize: 'clamp(15px, 1.9vw, 22px)',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: '#0f0f28',
                margin: 0,
                whiteSpace: 'nowrap',
              }}>
                Take whatever path you want
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Romeo — near scene entry */}
      {npcScreenPositions[0] && (
        <NpcSprite
          character="romeo"
          dialogue="juliet, i can't... i can't move towards you. [ROBOTIC VOICE] gO RiGht, RIGHT"
          x={npcScreenPositions[0].x}
          y={groundY}
          facing={npcScreenPositions[0].facing}
          isMoving={npcScreenPositions[0].isMoving}
          playerScreenX={screenX}
        />
      )}
      {/* Barbarian — mid world */}
      {npcScreenPositions[1] && (
        <NpcSprite
          character="barbarian"
          dialogue="arghh, i don't remember how i got here... spits, and why am I glitching...."
          x={npcScreenPositions[1].x}
          y={groundY}
          facing={npcScreenPositions[1].facing}
          isMoving={npcScreenPositions[1].isMoving}
          playerScreenX={screenX}
        />
      )}
      {/* Juliet — near end of world */}
      {npcScreenPositions[2] && (
        <NpcSprite
          character="juliet"
          dialogue="romeo, are we in a simulation? my footsteps... they are... it's not me doing it."
          x={npcScreenPositions[2].x}
          y={groundY}
          facing={npcScreenPositions[2].facing}
          isMoving={npcScreenPositions[2].isMoving}
          playerScreenX={screenX}
        />
      )}

      {/* Player dialogue — shown when near Barbarian */}
      {playerDialogue && (() => {
        const { SPRITE_SCALE: sc } = { SPRITE_SCALE }
        const bubbleX = screenX + 60  // offset right of player centre
        const bubbleY = groundY - 200  // above player head
        return (
          <div style={{
            position:      'absolute',
            left:          bubbleX,
            top:           bubbleY,
            transform:     'translateX(-50%) translateY(-100%)',
            zIndex:        30,
            pointerEvents: 'none',
            whiteSpace:    'nowrap',
            animation:     playerDialogueFading
              ? 'npcFade 0.7s ease-out forwards'
              : 'npcPop 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}>
            <div style={{
              backdropFilter:       'blur(28px) saturate(2.2) brightness(1.15)',
              WebkitBackdropFilter: 'blur(28px) saturate(2.2) brightness(1.15)',
              background:           'rgba(255,255,255,0.60)',
              border:               '2px solid rgba(255,255,255,0.92)',
              borderRadius:         '18px',
              padding:              '14px 26px 12px',
              boxShadow:            '0 8px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15), inset 0 1.5px 0 rgba(255,255,255,0.95)',
              position:             'relative',
              display:              'inline-block',
            }}>
              <div style={{
                fontFamily:    '"Cormorant Garamond", "Palatino Linotype", Georgia, serif',
                fontStyle:     'italic',
                fontWeight:    700,
                fontSize:      '22px',
                lineHeight:    1,
                letterSpacing: '0.015em',
                color:         '#0d0d1a',
                whiteSpace:    'nowrap',
              }}>
                is this even a portfolio site? now i don&apos;t remember why i&apos;m here
              </div>
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
        )
      })()}

      <PlayerSprite
        x={screenX} y={groundY}
        facing={playerFacing}
        isMoving={isMoving} isSprinting={isSprinting} velocity={velocity}
        scale={SPRITE_SCALE} greenTint={0} darkness={0}
      />
    </div>
  )
}
