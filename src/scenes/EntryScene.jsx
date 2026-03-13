import { useEffect, useRef, useState } from 'react'
import ForestGlow from '../components/game/ForestGlow'
import PlayerSprite from '../components/game/PlayerSprite'
import DarkTileFloor from '../components/game/DarkTileFloor'
import Fireflies from '../components/game/Fireflies'
import MobileControls from '../components/game/MobileControls'
import {
  GAME_WIDTH, PLAYER_MAX_SPEED, PLAYER_ACCEL, PLAYER_DECEL,
  PLAYER_SPRINT_SPEED, PLAYER_SPRINT_ACCEL,
  TRANSITION_ZONE, SPRITE_SCALE,
} from '../utils/constants'
import { getMovementDirection } from '../utils/keyboard'
import { audioManager, RUN_VOLUME } from '../utils/audio'

const GROUND_Y_RATIO = 0.72
const isMobile = () =>
  /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (typeof window !== 'undefined' && window.innerWidth <= 1024 && 'ontouchstart' in window)

export default function EntryScene({ containerWidth, containerHeight, onReachEnd, startX = null, startFacing = 1 }) {
  const pressedKeys   = useRef(new Set())
  const initX = startX !== null ? startX : (startFacing === -1 ? containerWidth - 110 : 110)
  const playerXRef    = useRef(initX)
  const velRef        = useRef(0)
  const [playerX,       setPlayerX]    = useState(initX)
  const [playerFacing,  setFacing]     = useState(startFacing)
  const [isMoving,      setIsMoving]   = useState(false)
  const [isSprinting,   setSprinting]  = useState(false)
  const [velocity,      setVelocity]   = useState(0)
  const [greenTint,     setGreenTint]  = useState(0)
  const [darkness,      setDarkness]   = useState(0.88)
  const rafRef        = useRef(null)
  const lastTimeRef   = useRef(null)
  const endReached    = useRef(false)
  const soundRef      = useRef(false)

  const scaledSpeed = containerWidth / GAME_WIDTH
  const groundY     = Math.round(containerHeight * GROUND_Y_RATIO)

  // Keys
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

  // Clear any held keys from previous scene — prevents self-driving player
  useEffect(() => {
    pressedKeys.current.clear()
  }, [])

  useEffect(() => {
    const loop = (ts) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = ts

      const dx       = getMovementDirection(pressedKeys.current)
      const shifting = pressedKeys.current.has('ShiftLeft') ||
                       pressedKeys.current.has('ShiftRight')

      // Sprint only while moving
      const sprinting = shifting && dx !== 0

      const maxSpd  = (sprinting ? PLAYER_SPRINT_SPEED : PLAYER_MAX_SPEED) * scaledSpeed
      const accel   = (sprinting ? PLAYER_SPRINT_ACCEL : PLAYER_ACCEL)     * scaledSpeed

      if (dx !== 0) {
        velRef.current = Math.max(-maxSpd, Math.min(maxSpd,
          velRef.current + dx * accel * dt))
      } else {
        // Decelerate — faster brake when sprinting to avoid sliding
        const brake = PLAYER_DECEL * scaledSpeed * (sprinting ? 1.4 : 1.0) * dt
        velRef.current = Math.abs(velRef.current) <= brake
          ? 0
          : velRef.current - Math.sign(velRef.current) * brake
      }

      const moving = Math.abs(velRef.current) > 4

      playerXRef.current = Math.max(50, Math.min(
        containerWidth - 20,
        playerXRef.current + velRef.current * dt
      ))

      setPlayerX(Math.round(playerXRef.current))
      setVelocity(velRef.current)
      setSprinting(sprinting)
      if (dx !== 0) setFacing(dx > 0 ? 1 : -1)
      setIsMoving(moving)


      // Sound — run audio follows movement
      if (moving && !soundRef.current) {
        audioManager.play('run', { loop: true, volume: RUN_VOLUME })
        soundRef.current = true
      } else if (!moving && soundRef.current) {
        audioManager.fadeOut('run', 150)
        soundRef.current = false
      }

      // Proximity lighting
      const glowX  = containerWidth * 0.92
      const raw    = Math.max(0, 1 - Math.max(0, glowX - playerXRef.current) / (containerWidth * 0.78))
      const tint   = raw * raw
      setGreenTint(tint)
      setDarkness(Math.max(0, 0.88 - tint * 0.82))

      // Scene exit
      if (!endReached.current && playerXRef.current > containerWidth - TRANSITION_ZONE) {
        endReached.current = true
        onReachEnd?.(velRef.current, pressedKeys.current.has('ShiftLeft') || pressedKeys.current.has('ShiftRight'))
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [containerWidth, containerHeight, onReachEnd, scaledSpeed])

  return (
    <div style={{
      position: 'relative',
      width: containerWidth, height: containerHeight,
      background: '#000', overflow: 'hidden',
    }}>
      {/* WebGL glow — desktop only; replaced by CSS radial gradient on mobile */}
      {!isMobile() && <ForestGlow originX={0.92} originY={0.5} />}
      {isMobile() && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 55% 70% at 92% 50%,
            rgba(44,255,120,0.18) 0%,
            rgba(20,180,80,0.10) 35%,
            rgba(0,30,10,0.0) 70%)`,
        }} />
      )}

      <DarkTileFloor
        containerWidth={containerWidth}
        containerHeight={containerHeight}
        groundY={groundY}
        lightX={containerWidth * 0.92}
      />

      {/* Fireflies — desktop only; too GPU-heavy for mobile */}
      {!isMobile() && (
        <Fireflies
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          groundY={groundY}
          lightX={containerWidth * 0.92}
        />
      )}

      {/* Darkness veil */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `rgba(0,2,1,${darkness.toFixed(3)})`,
        maskImage: 'radial-gradient(ellipse 48% 65% at 92% 50%, transparent 25%, black 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 48% 65% at 92% 50%, transparent 25%, black 75%)',
        pointerEvents: 'none',
      }} />

      <PlayerSprite
        x={playerX}
        y={groundY}
        facing={playerFacing}
        isMoving={isMoving}
        isSprinting={isSprinting}
        velocity={velocity}
        scale={SPRITE_SCALE}
        greenTint={greenTint}
        darkness={darkness * 0.9}
      />

      {/* Right door glow */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '3px',
        background: 'linear-gradient(to bottom, transparent, rgba(68,255,136,0.5) 30%, rgba(68,255,136,0.7) 50%, rgba(68,255,136,0.5) 70%, transparent)',
        boxShadow: '0 0 10px 2px rgba(68,255,136,0.22)',
        pointerEvents: 'none',
      }} />

      {/* Mobile touch zones */}
      <MobileControls
        pressedKeys={pressedKeys}
        visible={isMobile()}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
      />
    </div>

  )
}
