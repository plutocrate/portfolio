import { useEffect, useRef, useState } from 'react'
import PlayerSprite from '../components/game/PlayerSprite'
import { useGame } from '../hooks/useGameState'
import { SCENES, GAME_WIDTH, PLAYER_MAX_SPEED, PLAYER_ACCEL, PLAYER_DECEL, PLAYER_SPRINT_SPEED, PLAYER_SPRINT_ACCEL, GROUND_Y_RATIO, SPRITE_SCALE } from '../utils/constants'
import { getMovementDirection } from '../utils/keyboard'
import { audioManager, RUN_VOLUME } from '../utils/audio'

export default function ModeSelectScene({ containerWidth, containerHeight, startX, startFacing = 1 }) {
  const pressedKeys = useRef(new Set())
  const playerXRef  = useRef(startX ?? 80)
  const velRef      = useRef(0)
  const [playerX, setPlayerX]     = useState(startX ?? 80)
  const [playerFacing, setFacing] = useState(startFacing)
  const [isMoving, setIsMoving]   = useState(false)
  const [isSprinting, setSprinting] = useState(false)
  const [velocity, setVelocity]     = useState(0)
  const [nearTerminal, setNear]   = useState(false)
  const rafRef      = useRef(null)
  const lastTimeRef = useRef(null)
  const soundRef    = useRef(false)
  const { dispatch } = useGame()
  const scaledSpeed = containerWidth / GAME_WIDTH
  const groundY     = Math.round(containerHeight * 0.72)
  const terminalX   = containerWidth * 0.5

  useEffect(() => {
    pressedKeys.current.clear()
  }, [])

  useEffect(() => {
    const dn = (e) => {
      pressedKeys.current.add(e.code)
      if ((e.code === 'KeyE' || e.code === 'Enter') && nearTerminal) dispatch({ type: 'SHOW_MODE_SELECT' })
    }
    const up = (e) => pressedKeys.current.delete(e.code)
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [nearTerminal, dispatch])

  useEffect(() => {
    const loop = (ts) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = ts
      const dx = getMovementDirection(pressedKeys.current)
      const shifting = pressedKeys.current.has('ShiftLeft') || pressedKeys.current.has('ShiftRight')
      const sprinting = shifting && dx !== 0
      const maxSpd = (sprinting ? PLAYER_SPRINT_SPEED : PLAYER_MAX_SPEED) * scaledSpeed
      const accelVal = (sprinting ? PLAYER_SPRINT_ACCEL : PLAYER_ACCEL) * scaledSpeed
      if (dx !== 0) velRef.current = Math.max(-maxSpd, Math.min(maxSpd, velRef.current + dx * accelVal * dt))
      else { const d = PLAYER_DECEL * scaledSpeed * dt; velRef.current = Math.abs(velRef.current) <= d ? 0 : velRef.current - Math.sign(velRef.current) * d }
      const moving = Math.abs(velRef.current) > 2
      playerXRef.current = Math.max(40, Math.min(containerWidth - 40, playerXRef.current + velRef.current * dt))
      setPlayerX(Math.round(playerXRef.current))
      if (dx !== 0) setFacing(dx > 0 ? 1 : -1)
      setIsMoving(moving)
      setSprinting(sprinting)
      setVelocity(velRef.current)

      if (moving && !soundRef.current) {
        audioManager.play('run', { loop: true, volume: RUN_VOLUME })
        soundRef.current = true
      } else if (!moving && soundRef.current) {
        audioManager.fadeOut('run', 150)
        soundRef.current = false
      }

      setNear(Math.abs(playerXRef.current - terminalX) < 85)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [containerWidth, containerHeight, terminalX, scaledSpeed])

  return (
    <div style={{ position:'relative', width:containerWidth, height:containerHeight, background:'#000', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 80%, rgba(0,15,6,0.7) 0%, #000 70%)' }} />
      {/* Terminal */}
      <div style={{ position:'absolute', left: terminalX, bottom: containerHeight * (1 - GROUND_Y_RATIO) + 12, transform:'translateX(-50%)' }}>
        <div style={{ width:'175px', height:'125px', background:'rgba(0,18,7,0.96)', border:`2px solid ${nearTerminal ? 'rgba(68,255,136,0.75)' : 'rgba(68,255,136,0.22)'}`, borderRadius:'4px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'12px', boxShadow: nearTerminal ? '0 0 28px rgba(68,255,136,0.25), inset 0 0 16px rgba(68,255,136,0.04)' : '0 0 8px rgba(68,255,136,0.08)', transition:'all 0.25s ease', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,100,0.018) 3px, rgba(0,255,100,0.018) 4px)', pointerEvents:'none' }} />
          <p style={{ fontFamily:'"Press Start 2P", monospace', fontSize:'5px', color:'rgba(68,255,136,0.4)', marginBottom:'7px', letterSpacing:'0.1em' }}>SYSTEM v1.0</p>
          <p style={{ fontFamily:'"JetBrains Mono", monospace', fontSize:'10px', color:'#44ff88', textAlign:'center', lineHeight:1.5 }}>select<br/>your path</p>
          {nearTerminal && <p style={{ fontFamily:'"Press Start 2P", monospace', fontSize:'5px', color:'rgba(68,255,136,0.55)', marginTop:'9px' }}>[ E ] interact</p>}
        </div>
        <div style={{ width:'18px', height:'18px', background:'rgba(68,255,136,0.1)', margin:'0 auto', borderLeft:'1px solid rgba(68,255,136,0.18)', borderRight:'1px solid rgba(68,255,136,0.18)' }} />
        <div style={{ width:'55px', height:'7px', background:'rgba(68,255,136,0.08)', margin:'0 auto', border:'1px solid rgba(68,255,136,0.12)', borderRadius:'2px' }} />
      </div>
      {/* Floor glow under terminal */}
      <div style={{ position:'absolute', left: terminalX, top: groundY - 8, transform:'translateX(-50%)', width: nearTerminal ? '190px' : '110px', height:'16px', background:'radial-gradient(ellipse, rgba(68,255,136,0.18) 0%, transparent 70%)', transition:'all 0.4s ease', filter:'blur(3px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', left:0, right:0, top: groundY - 2, height:'1px', background:'linear-gradient(to right, transparent, rgba(68,255,136,0.1), transparent)' }} />
      <PlayerSprite x={playerX} y={groundY} facing={playerFacing} isMoving={isMoving} isSprinting={isSprinting} velocity={velocity} scale={SPRITE_SCALE} />
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'3px', background:'linear-gradient(to bottom, transparent, rgba(68,255,136,0.28) 40%, rgba(68,255,136,0.28) 60%, transparent)' }} />
    </div>
  )
}
