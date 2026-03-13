import { useEffect, useRef, useState } from 'react'
import PlayerSprite from '../components/game/PlayerSprite'
import { useGame } from '../hooks/useGameState'
import { SCENES, GAME_WIDTH, PLAYER_MAX_SPEED, PLAYER_ACCEL, PLAYER_DECEL, PLAYER_SPRINT_SPEED, PLAYER_SPRINT_ACCEL, GROUND_Y_RATIO, SPRITE_SCALE } from '../utils/constants'
import { getMovementDirection } from '../utils/keyboard'
import { audioManager, RUN_VOLUME } from '../utils/audio'

const PROJECTS = [
  { xRatio:0.20, name:'Project Alpha', tech:'React · Node · Postgres', desc:'Real-time collaborative whiteboard with conflict-free sync.', link:'github.com/you/alpha', color:'#44ff88' },
  { xRatio:0.48, name:'Project Beta',  tech:'Rust · WebAssembly',       desc:'High-performance image processing compiled to WASM.',   link:'github.com/you/beta',  color:'#88ffcc' },
  { xRatio:0.76, name:'Project Gamma', tech:'WebGL · GLSL · Three.js',   desc:'Procedural terrain with real-time erosion simulation.',  link:'github.com/you/gamma', color:'#55eeaa' },
]

export default function ProjectsScene({ containerWidth, containerHeight, startX, startFacing = 1 }) {
  const pressedKeys = useRef(new Set())
  const playerXRef  = useRef(startX ?? 70)
  const velRef      = useRef(0)
  const [playerX, setPlayerX]     = useState(startX ?? 70)
  const [playerFacing, setFacing] = useState(startFacing)
  const [isMoving, setIsMoving]   = useState(false)
  const [isSprinting, setSprinting] = useState(false)
  const [velocity, setVelocity]     = useState(0)
  const [nearIdx, setNearIdx]     = useState(null)
  const rafRef      = useRef(null)
  const lastTimeRef = useRef(null)
  const soundRef    = useRef(false)
  const { dispatch } = useGame()
  const endReached  = useRef(false)
  const scaledSpeed = containerWidth / GAME_WIDTH
  const groundY     = Math.round(containerHeight * 0.72)

  useEffect(() => {
    const dn = (e) => pressedKeys.current.add(e.code)
    const up = (e) => pressedKeys.current.delete(e.code)
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [])

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
      // Walking sound
      if (moving && !soundRef.current) {
        audioManager.play('run', { loop: true, volume: RUN_VOLUME })
        soundRef.current = true
      } else if (!moving && soundRef.current) {
        audioManager.fadeOut('run', 150)
        soundRef.current = false
      }
      // Wind on sprint

      if (!endReached.current && playerXRef.current > containerWidth - 40) {
        endReached.current = true
        dispatch({ type: 'SET_SCENE', scene: SCENES.CONTACT, direction: 1, playerStartX: 70 })
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [containerWidth, containerHeight, dispatch, scaledSpeed])

  return (
    <div style={{ position:'relative', width:containerWidth, height:containerHeight, background:'#000', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 60%, rgba(0,15,6,0.4) 0%, #000 65%)' }} />
      <div style={{ position:'absolute', top:'18px', left:'50%', transform:'translateX(-50%)', fontFamily:'"Press Start 2P", monospace', fontSize:'7px', color:'rgba(68,255,136,0.28)', letterSpacing:'0.15em' }}>— PROJECTS —</div>
      {PROJECTS.map((p, i) => {
        const active = nearIdx === i
        return (
          <div key={i} style={{ position:'absolute', left: p.xRatio * containerWidth, top: containerHeight * 0.08, transform:'translateX(-50%)', width:'200px', transition:'all 0.25s ease' }}>
            <div style={{ background: active ? 'rgba(0,22,10,0.92)' : 'rgba(0,10,4,0.7)', border:`1px solid ${active ? p.color : 'rgba(68,255,136,0.12)'}`, borderRadius:'4px', padding:'14px 16px', boxShadow: active ? `0 0 22px rgba(68,255,136,0.13)` : 'none', transition:'all 0.25s ease' }}>
              <p style={{ fontFamily:'"Press Start 2P", monospace', fontSize:'7px', color: p.color, marginBottom:'7px', textShadow: active ? `0 0 8px ${p.color}` : 'none' }}>{p.name}</p>
              <p style={{ fontFamily:'"JetBrains Mono", monospace', fontSize:'9px', color:'rgba(68,255,136,0.38)', marginBottom:'9px' }}>{p.tech}</p>
              <p style={{ fontFamily:'"JetBrains Mono", monospace', fontSize:'10px', color:'rgba(180,255,200,0.6)', lineHeight:1.6, marginBottom:'10px' }}>{p.desc}</p>
              <p style={{ fontFamily:'"JetBrains Mono", monospace', fontSize:'9px', color:'rgba(68,255,136,0.3)' }}>↗ {p.link}</p>
            </div>
            <div style={{ width:'1px', height: containerHeight * 0.44, background:`linear-gradient(to bottom, ${active ? p.color : 'rgba(68,255,136,0.15)'}, transparent)`, margin:'0 auto', opacity: active ? 0.55 : 0.18, transition:'all 0.25s ease' }} />
          </div>
        )
      })}
      <div style={{ position:'absolute', left:0, right:0, top: groundY - 2, height:'1px', background:'linear-gradient(to right, transparent, rgba(68,255,136,0.15), transparent)' }} />
      <PlayerSprite x={playerX} y={groundY} facing={playerFacing} isMoving={isMoving} isSprinting={isSprinting} velocity={velocity} scale={SPRITE_SCALE} />
      <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'3px', background:'linear-gradient(to bottom, transparent, rgba(68,255,136,0.5) 40%, rgba(68,255,136,0.5) 60%, transparent)' }} />
    </div>
  )
}
