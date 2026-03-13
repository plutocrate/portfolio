import { useEffect, useRef, useState } from 'react'
import PlayerSprite from '../components/game/PlayerSprite'
import { useGame } from '../hooks/useGameState'
import { SCENES, GAME_WIDTH, PLAYER_MAX_SPEED, PLAYER_ACCEL, PLAYER_DECEL, PLAYER_SPRINT_SPEED, PLAYER_SPRINT_ACCEL, GROUND_Y_RATIO, SPRITE_SCALE } from '../utils/constants'
import { getMovementDirection } from '../utils/keyboard'
import { audioManager, RUN_VOLUME } from '../utils/audio'

const PANELS = [
  { xRatio: 0.22, title: 'hello.', body: "I'm a developer who loves\nbuilding interactive experiences." },
  { xRatio: 0.52, title: 'I build things.', body: 'Web apps, games, tools.\nFrontend to backend, shader to socket.' },
  { xRatio: 0.80, title: 'Keep going →', body: 'More rooms ahead.\nProjects, skills, contact.' },
]

export default function AboutScene({ containerWidth, containerHeight, startX, startFacing = 1 }) {
  const pressedKeys = useRef(new Set())
  const playerXRef  = useRef(startX ?? 80)
  const velRef      = useRef(0)
  const [playerX, setPlayerX]       = useState(startX ?? 80)
  const [playerFacing, setFacing]   = useState(startFacing)
  const [isMoving, setIsMoving]     = useState(false)
  const [isSprinting, setSprinting] = useState(false)
  const [visited, setVisited]       = useState(new Set())
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
      if (dx !== 0) {
        velRef.current = Math.max(-maxSpd, Math.min(maxSpd, velRef.current + dx * accelVal * dt))
      } else {
        const d = PLAYER_DECEL * scaledSpeed * dt
        velRef.current = Math.abs(velRef.current) <= d ? 0 : velRef.current - Math.sign(velRef.current) * d
      }
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
        dispatch({ type: 'SET_SCENE', scene: SCENES.PROJECTS, direction: 1, playerStartX: 70 })
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [containerWidth, containerHeight, dispatch, scaledSpeed])

  return (
    <div style={{ position:'relative', width:containerWidth, height:containerHeight, background:'#000', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 80%, rgba(0,20,8,0.4) 0%, #000 65%)' }} />
      <div style={{ position:'absolute', left:0, right:0, top: groundY - 2, height:'1px', background:'linear-gradient(to right, transparent, rgba(68,255,136,0.12), transparent)' }} />
      {PANELS.map((p, i) => (
        <div key={i} style={{
          position:'absolute', left: p.xRatio * containerWidth, top: containerHeight * 0.1,
          transform:'translateX(-50%)', opacity: visited.has(i) ? 1 : 0, transition:'opacity 0.8s ease', maxWidth:'220px', textAlign:'center'
        }}>
          <h3 style={{ fontFamily:'"Press Start 2P", monospace', fontSize:'9px', color:'#44ff88', marginBottom:'10px', textShadow:'0 0 12px rgba(68,255,136,0.4)' }}>{p.title}</h3>
          <p style={{ fontFamily:'"JetBrains Mono", monospace', fontSize:'11px', color:'rgba(180,255,200,0.6)', lineHeight:1.8, whiteSpace:'pre-line' }}>{p.body}</p>
          <div style={{ width:'1px', height: containerHeight * 0.45, background:'linear-gradient(to bottom, rgba(68,255,136,0.25), transparent)', margin:'14px auto 0' }} />
        </div>
      ))}
      <PlayerSprite x={playerX} y={groundY} facing={playerFacing} isMoving={isMoving} isSprinting={isSprinting} velocity={velocity} scale={SPRITE_SCALE} />
      <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'3px', background:'linear-gradient(to bottom, transparent, rgba(68,255,136,0.5) 40%, rgba(68,255,136,0.5) 60%, transparent)' }} />
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'3px', background:'linear-gradient(to bottom, transparent, rgba(68,255,136,0.3) 40%, rgba(68,255,136,0.3) 60%, transparent)' }} />
    </div>
  )
}
