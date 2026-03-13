import { useEffect, useRef } from 'react'
import { asset } from '../../utils/constants'

const isMobile = () =>
  /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (typeof window !== 'undefined' && window.innerWidth <= 1024 && 'ontouchstart' in window)

// Scale sprite down on mobile proportionally to screen width
const mobileScaleFactor = () => isMobile() ? Math.min(1, window.innerWidth / 900) : 1

// ── Normal run (14 frames) ─────────────────────────────────────────────────────
const RUN_FRAMES    = 14
const RUN_SRC_X     = 55
const RUN_SRC_Y     = 16
const RUN_SRC_W     = 130
const RUN_SRC_H     = 172
const RUN_FOOT_Y    = 182
const RUN_FOOT_FRAC = (RUN_FOOT_Y - RUN_SRC_Y) / RUN_SRC_H
const RUN_BASE_FPS  = 18
const RUN_MAX_FPS   = 24

// ── Big sprint (9 frames) ──────────────────────────────────────────────────────
const BIG_FRAMES    = 9
const BIG_SRC_X     = 36
const BIG_SRC_Y     = 21
const BIG_SRC_W     = 162
const BIG_SRC_H     = 165
const BIG_FOOT_Y    = 182
const BIG_FOOT_FRAC = (BIG_FOOT_Y - BIG_SRC_Y) / BIG_SRC_H
const BIG_BASE_FPS  = 22
const BIG_MAX_FPS   = 30

// ── Idle (20 frames, 240×240 full frame — draw entire image, transparent bg) ──
const IDLE_FRAMES    = 20
const IDLE_SRC_X     = 0
const IDLE_SRC_Y     = 0
const IDLE_SRC_W     = 240
const IDLE_SRC_H     = 240
// Foot is at pixel y=181 in the 240px tall frame
const IDLE_FOOT_FRAC = 181 / 240
const IDLE_FPS       = 14

export default function PlayerSprite({
  x,
  y,
  facing      = 1,
  isMoving    = false,
  isSprinting = false,
  velocity    = 0,
  scale       = 1.2,
  greenTint   = 0,
  darkness    = 0.7,
}) {
  // Reduce sprite size dynamically on mobile
  const effectiveScale = scale * mobileScaleFactor()

  const canvasRef        = useRef(null)
  const stateRef         = useRef({ facing, isMoving, isSprinting, velocity, greenTint, darkness })
  const runFramesRef     = useRef([])
  const bigFramesRef     = useRef([])
  const idleFramesRef    = useRef([])
  const frameIdxRef      = useRef(0)
  const lastFrameTimeRef = useRef(0)
  const rafRef           = useRef(null)

  useEffect(() => {
    stateRef.current = { facing, isMoving, isSprinting, velocity, greenTint, darkness }
  }, [facing, isMoving, isSprinting, velocity, greenTint, darkness])

  // Load all frames once
  useEffect(() => {
    for (let i = 0; i < RUN_FRAMES; i++) {
      const img = new Image()
      img.src = asset(`/assets/sprites/run/Run_${String(i).padStart(4, '0')}.png`)
      runFramesRef.current[i] = img
    }
    for (let i = 0; i < BIG_FRAMES; i++) {
      const img = new Image()
      img.src = asset(`/assets/sprites/sprint/Big_Run_${String(i).padStart(4, '0')}.png`)
      bigFramesRef.current[i] = img
    }
    for (let i = 0; i < IDLE_FRAMES; i++) {
      const img = new Image()
      img.src = asset(`/assets/sprites/idle/Idle_Body_${String(i).padStart(4, '0')}.png`)
      idleFramesRef.current[i] = img
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const maxW = Math.round(Math.max(RUN_SRC_W, BIG_SRC_W, IDLE_SRC_W) * effectiveScale)
    const maxH = Math.round(Math.max(RUN_SRC_H, BIG_SRC_H, IDLE_SRC_H) * effectiveScale)
    canvas.width  = maxW
    canvas.height = maxH

    let prevMode = null  // 'idle' | 'run' | 'sprint'

    const draw = (ts) => {
      const { facing, isMoving, isSprinting, velocity, greenTint, darkness } = stateRef.current
      ctx.clearRect(0, 0, maxW, maxH)

      const mode = !isMoving ? 'idle' : isSprinting ? 'sprint' : 'run'

      // Reset frame on mode change
      if (prevMode !== mode) {
        frameIdxRef.current = 0
        lastFrameTimeRef.current = ts
      }
      prevMode = mode

      let frames, TOTAL, SRC_X, SRC_Y, SRC_W, SRC_H, fps

      if (mode === 'idle') {
        frames = idleFramesRef.current
        TOTAL  = IDLE_FRAMES
        SRC_X  = IDLE_SRC_X; SRC_Y = IDLE_SRC_Y
        SRC_W  = IDLE_SRC_W; SRC_H = IDLE_SRC_H
        fps    = IDLE_FPS
      } else if (mode === 'sprint') {
        frames = bigFramesRef.current
        TOTAL  = BIG_FRAMES
        SRC_X  = BIG_SRC_X; SRC_Y = BIG_SRC_Y
        SRC_W  = BIG_SRC_W; SRC_H = BIG_SRC_H
        const maxSpd   = 680
        const speedFrac = Math.min(Math.abs(velocity) / maxSpd, 1)
        fps = BIG_BASE_FPS + (BIG_MAX_FPS - BIG_BASE_FPS) * speedFrac
      } else {
        frames = runFramesRef.current
        TOTAL  = RUN_FRAMES
        SRC_X  = RUN_SRC_X; SRC_Y = RUN_SRC_Y
        SRC_W  = RUN_SRC_W; SRC_H = RUN_SRC_H
        const maxSpd   = 380
        const speedFrac = Math.min(Math.abs(velocity) / maxSpd, 1)
        fps = RUN_BASE_FPS + (RUN_MAX_FPS - RUN_BASE_FPS) * speedFrac
      }

      // Advance frame
      if (ts - lastFrameTimeRef.current > 1000 / fps) {
        frameIdxRef.current = (frameIdxRef.current + 1) % TOTAL
        lastFrameTimeRef.current = ts
      }

      const frame = frames[frameIdxRef.current]
      if (!frame?.complete || frame.naturalWidth === 0) {
        rafRef.current = requestAnimationFrame(draw); return
      }

      const drawW = Math.round(SRC_W * effectiveScale)
      const drawH = Math.round(SRC_H * effectiveScale)
      const offX  = Math.round((maxW - drawW) / 2)
      const offY  = Math.round((maxH - drawH) / 2)

      // Draw sprite — flip via transform only, no manual X adjustment
      ctx.save()
      if (facing === -1) {
        ctx.translate(maxW, 0)
        ctx.scale(-1, 1)
      }

      ctx.drawImage(frame, SRC_X, SRC_Y, SRC_W, SRC_H, offX, offY, drawW, drawH)

      // Sprint motion blur — drawn inside same transform so facing is correct
      if (mode === 'sprint') {
        ctx.globalAlpha = 0.18
        for (let g = 1; g <= 3; g++) {
          // Ghost trails go behind the player (opposite to movement direction)
          // In transform space, facing=1 moves right so ghosts offset left (negative X)
          // facing=-1 is mirrored so same negative offset produces correct trailing direction
          ctx.drawImage(frame, SRC_X, SRC_Y, SRC_W, SRC_H, offX - g * 6, offY, drawW, drawH)
        }
        ctx.globalAlpha = 1
      }

      ctx.restore()

      // Overlays — applied after restore, in normal (unflipped) canvas space
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1

      // Darkness overlay
      if (darkness > 0.05) {
        ctx.globalCompositeOperation = 'source-atop'
        ctx.globalAlpha = Math.min(darkness, 0.90)
        ctx.fillStyle   = '#000005'
        ctx.fillRect(0, 0, maxW, maxH)
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
      }

      // Peach rim light
      if (greenTint > 0.05) {
        const rimStart = facing === 1 ? maxW * 0.4 : 0
        const rimEnd   = facing === 1 ? maxW       : maxW * 0.6
        const rim = ctx.createLinearGradient(rimStart, 0, rimEnd, 0)
        rim.addColorStop(0, 'rgba(240,160,110,0)')
        rim.addColorStop(1, `rgba(240,160,110,${(greenTint * 0.55).toFixed(3)})`)
        ctx.globalCompositeOperation = 'source-atop'
        ctx.fillStyle = rim
        ctx.fillRect(0, 0, maxW, maxH)
        ctx.globalAlpha = greenTint * 0.12
        ctx.fillStyle   = '#e8a070'
        ctx.fillRect(0, 0, maxW, maxH)
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [effectiveScale])

  const maxW = Math.round(Math.max(RUN_SRC_W, BIG_SRC_W, IDLE_SRC_W) * effectiveScale)
  const maxH = Math.round(Math.max(RUN_SRC_H, BIG_SRC_H, IDLE_SRC_H) * effectiveScale)

  const activeSrcH     = !isMoving ? IDLE_SRC_H : isSprinting ? BIG_SRC_H : RUN_SRC_H
  const activeFootFrac = !isMoving ? IDLE_FOOT_FRAC : isSprinting ? BIG_FOOT_FRAC : RUN_FOOT_FRAC
  const drawH          = Math.round(activeSrcH * effectiveScale)
  const offY           = Math.round((maxH - drawH) / 2)
  const footPx         = offY + Math.round(drawH * activeFootFrac)

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'absolute',
        left:          Math.round(x - maxW / 2),
        top:           Math.round(y - footPx),
        pointerEvents: 'none',
        zIndex:        10,
      }}
    />
  )
}
