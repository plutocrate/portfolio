import { useEffect, useRef } from 'react'
import { asset } from '../../utils/constants'

const isMobile = () =>
  /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (typeof window !== 'undefined' && window.innerWidth <= 1024 && 'ontouchstart' in window)

const FPS = 8
const SRC = 512
// Layout (renderH=150, charH=453)
const RENDER_H_BASE  = 150
const CHAR_H         = 453
const RENDER_H = (() => {
  const mob = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof window !== 'undefined' && window.innerWidth <= 1024 && 'ontouchstart' in window)
  if (!mob) return RENDER_H_BASE
  const wScale = window.innerWidth  / 1280
  const hScale = window.innerHeight / 720
  return Math.round(RENDER_H_BASE * Math.min(wScale, hScale, 1))
})()
const SCALE          = RENDER_H / CHAR_H
const CANVAS_PX      = Math.round(SRC * SCALE)
const FOOT_FROM_BOT  = Math.round((SRC - 505) * SCALE)
const HEAD_IN_CANVAS = Math.round(52 * SCALE)
const CX_IN_CANVAS   = Math.round(269 * SCALE)

export const GOV_CANVAS_PX      = CANVAS_PX
export const GOV_FOOT_FROM_BOT  = FOOT_FROM_BOT
export const GOV_HEAD_IN_CANVAS = HEAD_IN_CANVAS
export const GOV_CX_IN_CANVAS   = CX_IN_CANVAS

// animation states: 'walk' | 'idle' | 'happy'
export default function GovernorSprite({ x, y, facing = 1, animState = 'walk' }) {
  const canvasRef   = useRef(null)
  const framesRef   = useRef({ walk: [], idle: [], happy: [] })
  const frameIdxRef = useRef(0)
  const lastFrameRef = useRef(0)
  const rafRef      = useRef(null)
  const stateRef    = useRef({ facing, animState })

  useEffect(() => { stateRef.current = { facing, animState } }, [facing, animState])

  useEffect(() => {
    // Walk: 4 frames
    for (let i = 0; i < 4; i++) {
      const img = new Image(); img.src = asset(`/assets/sprites/npc4_governor/walk_0${i}.png`)
      framesRef.current.walk[i] = img
    }
    // Idle: 2 frames
    for (let i = 0; i < 2; i++) {
      const img = new Image(); img.src = asset(`/assets/sprites/npc4_governor/idle_0${i}.png`)
      framesRef.current.idle[i] = img
    }
    // Happy: 2 frames
    for (let i = 0; i < 2; i++) {
      const img = new Image(); img.src = asset(`/assets/sprites/npc4_governor/happy_0${i}.png`)
      framesRef.current.happy[i] = img
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.height = SRC

    const loop = (ts) => {
      const { facing: f, animState: as } = stateRef.current
      const set = framesRef.current[as] || framesRef.current.idle
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, SRC, SRC)

      if (ts - lastFrameRef.current >= 1000 / FPS) {
        frameIdxRef.current = (frameIdxRef.current + 1) % set.length
        lastFrameRef.current = ts
      }
      const img = set[frameIdxRef.current]
      if (img?.complete && img.naturalWidth > 0) {
        ctx.save()
        if (f === -1) { ctx.translate(SRC, 0); ctx.scale(-1, 1) }
        ctx.drawImage(img, 0, 0)
        ctx.restore()
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const cssLeft = Math.round(x - CX_IN_CANVAS)
  const cssTop  = Math.round(y - CANVAS_PX + FOOT_FROM_BOT)

  return (
    <canvas ref={canvasRef} style={{
      position:      'absolute',
      left:          cssLeft,
      top:           cssTop,
      width:         CANVAS_PX,
      height:        CANVAS_PX,
      imageRendering: 'auto',
      pointerEvents: 'none',
      zIndex:        4,
    }} />
  )
}
