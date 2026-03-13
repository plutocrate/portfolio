import { useEffect, useRef, useState } from 'react'
import PlayerSprite from '../components/game/PlayerSprite'
import { GAME_WIDTH, PLAYER_MAX_SPEED, PLAYER_ACCEL, PLAYER_DECEL, PLAYER_SPRINT_SPEED, PLAYER_SPRINT_ACCEL, GROUND_Y_RATIO, SPRITE_SCALE } from '../utils/constants'
import { getMovementDirection } from '../utils/keyboard'
import { audioManager, RUN_VOLUME } from '../utils/audio'

export default function ContactScene({ containerWidth, containerHeight, startX, startFacing = 1 }) {
  const pressedKeys = useRef(new Set())
  const playerXRef  = useRef(startX ?? 70)
  const velRef      = useRef(0)
  const [playerX, setPlayerX]     = useState(startX ?? 70)
  const [playerFacing, setFacing] = useState(startFacing)
  const [isMoving, setIsMoving]   = useState(false)
  const [isSprinting, setSprinting] = useState(false)
  const [velocity, setVelocity]     = useState(0)
  const rafRef      = useRef(null)
  const lastTimeRef = useRef(null)
  const soundRef    = useRef(false)
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
      playerXRef.current = Math.max(40, Math.min(containerWidth - 60, playerXRef.current + velRef.current * dt))
      setPlayerX(Math.round(playerXRef.current))
      if (dx !== 0) setFacing(dx > 0 ? 1 : -1)
      setIsMoving(moving)
      setSprinting(sprinting)
      setVelocity(velRef.current)
      // Walking sound
      if (moving && !soundRef.current) { audioManager.play('run', { loop: true, volume: RUN_VOLUME }); soundRef.current = true }
      else if (!moving && soundRef.current) { audioManager.fadeOut('run', 150); soundRef.current = false }
      // Wind on sprint
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [containerWidth, containerHeight, scaledSpeed])

  return (
    <div style={{ position:'relative', width:containerWidth, height:containerHeight, background:'#000', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 50%, rgba(0,20,10,0.5) 0%, #000 70%)' }} />
      <div style={{ position:'absolute', left:'50%', top:'45%', transform:'translate(-50%, -55%)', textAlign:'center', maxWidth:'480px' }}>
        <p style={{ fontFamily:'"Press Start 2P", monospace', fontSize:'7px', color:'rgba(68,255,136,0.38)', letterSpacing:'0.2em', marginBottom:'14px' }}>— CONTACT —</p>
        <h2 style={{ fontFamily:'"Press Start 2P", monospace', fontSize:'clamp(13px,2vw,18px)', color:'#44ff88', textShadow:'0 0 20px rgba(68,255,136,0.45)', marginBottom:'14px', lineHeight:1.6 }}>let's build<br/>something.</h2>
        <p style={{ fontFamily:'"JetBrains Mono", monospace', fontSize:'12px', color:'rgba(180,255,200,0.55)', lineHeight:1.8, marginBottom:'36px' }}>Open to interesting projects,<br/>collaborations, and full-time roles.</p>
        <div style={{ display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap' }}>
          {[{ label:'Email', value:'you@example.com', href:'mailto:you@example.com' }, { label:'GitHub', value:'github.com/you', href:'#' }, { label:'LinkedIn', value:'linkedin.com/in/you', href:'#' }].map(({ label, value, href }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" style={{ display:'block', background:'rgba(0,18,7,0.8)', border:'1px solid rgba(68,255,136,0.22)', borderRadius:'3px', padding:'12px 18px', textDecoration:'none', transition:'all 0.18s ease', minWidth:'130px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(68,255,136,0.65)'; e.currentTarget.style.boxShadow='0 0 14px rgba(68,255,136,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(68,255,136,0.22)'; e.currentTarget.style.boxShadow='none' }}>
              <p style={{ fontFamily:'"Press Start 2P", monospace', fontSize:'6px', color:'rgba(68,255,136,0.45)', marginBottom:'5px' }}>{label}</p>
              <p style={{ fontFamily:'"JetBrains Mono", monospace', fontSize:'11px', color:'rgba(180,255,200,0.7)' }}>{value}</p>
            </a>
          ))}
        </div>
      </div>
      <div style={{ position:'absolute', left:0, right:0, top: groundY - 2, height:'1px', background:'linear-gradient(to right, transparent, rgba(68,255,136,0.15), transparent)' }} />
      <PlayerSprite x={playerX} y={groundY} facing={playerFacing} isMoving={isMoving} isSprinting={isSprinting} velocity={velocity} scale={SPRITE_SCALE} />
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'3px', background:'linear-gradient(to bottom, transparent, rgba(68,255,136,0.3) 40%, rgba(68,255,136,0.3) 60%, transparent)' }} />
    </div>
  )
}
