import { useEffect, useRef, useState, useCallback } from 'react'
import { asset } from '../../utils/constants'

const NPC_FPS = 12

// ── Character configs ──────────────────────────────────────────────────────
// displayH  = final rendered height in CSS px (character body only)
// All position maths use DISPLAY dimensions, not canvas dimensions.
// For large NPCs we keep canvas at srcSize and use CSS scale — cheaper GPU path.
const CHARS = {
  romeo: {
    frameCount: 7, frameStart: 1, namePad: (i) => `${i}`,
    dir:     asset('/assets/sprites/npc1_romeo'),
    srcSize: 2048,
    charH: 736, footYSrc: 1785, headYSrc: 1049, cxSrc: 1026,
    displayH: 140,   // desired character height on screen
  },
  juliet: {
    frameCount: 8, frameStart: 0, namePad: (i) => `${i}`,
    dir:     asset('/assets/sprites/npc2_juliet'),
    srcSize: 2048,
    charH: 650, footYSrc: 1750, headYSrc: 1100, cxSrc: 1008,
    displayH: 140,
  },
  barbarian: {
    frameCount: 12, frameStart: 1, namePad: (i) => String(i).padStart(2, '0'),
    dir:     asset('/assets/sprites/npc3_barbarian'),
    srcSize: 512,
    charH: 331, footYSrc: 458, headYSrc: 127, cxSrc: 232,
    displayH: 480,   // 3× original ~160px
  },
}

// Derive layout in DISPLAY-pixel space
function makeLayout(cfg) {
  const { srcSize, charH, footYSrc, headYSrc, cxSrc, displayH } = cfg
  const scale          = displayH / charH                           // char scale
  const displayCanvas  = Math.round(srcSize * scale)               // full canvas in display px
  const footFromBottom = Math.round((srcSize - footYSrc) * scale)  // gap below feet (display px)
  const headInCanvas   = Math.round(headYSrc * scale)              // head Y from canvas top (display px)
  const cxInCanvas     = Math.round(cxSrc    * scale)              // char centre X (display px)
  return { displayCanvas, footFromBottom, headInCanvas, cxInCanvas }
}

const LAYOUTS = Object.fromEntries(Object.entries(CHARS).map(([k,v]) => [k, makeLayout(v)]))

const DIALOGUE_MS  = 8000
const TRIGGER_DIST = 200

export default function NpcSprite({
  character     = 'romeo',
  dialogue      = '',
  x, y,
  facing        = 1,
  isMoving      = true,
  playerScreenX = null,
}) {
  const cfg = CHARS[character]
  const lay = LAYOUTS[character]

  const canvasRef    = useRef(null)
  const framesRef    = useRef([])
  const frameIdxRef  = useRef(0)
  const lastFrameRef = useRef(0)
  const rafRef       = useRef(null)
  const stateRef     = useRef({ facing, isMoving })
  const timerRef     = useRef(null)
  const nearRef      = useRef(false)

  const [show,   setShow]   = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => { stateRef.current = { facing, isMoving } }, [facing, isMoving])

  const triggerDialogue = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setFading(false)
    setShow(true)
    timerRef.current = setTimeout(() => {
      setFading(true)
      setTimeout(() => { setShow(false); setFading(false) }, 700)
    }, DIALOGUE_MS)
  }, [])

  useEffect(() => {
    if (playerScreenX === null) return
    const near = Math.abs(playerScreenX - x) < TRIGGER_DIST
    if (near && !nearRef.current) triggerDialogue()
    nearRef.current = near
  }, [playerScreenX, x, triggerDialogue])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  // Load frames
  useEffect(() => {
    framesRef.current = []
    for (let i = 0; i < cfg.frameCount; i++) {
      const img = new Image()
      img.src = `${cfg.dir}/walk_${cfg.namePad(cfg.frameStart + i)}.png`
      framesRef.current[i] = img
    }
  }, [character])

  // Render loop — canvas stays at native srcSize, CSS handles display scale
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Native resolution canvas — no upscaling in drawImage
    canvas.width  = cfg.srcSize
    canvas.height = cfg.srcSize

    const loop = (ts) => {
      const { facing: f, isMoving: mv } = stateRef.current
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, cfg.srcSize, cfg.srcSize)

      if (mv && ts - lastFrameRef.current >= 1000 / NPC_FPS) {
        frameIdxRef.current = (frameIdxRef.current + 1) % cfg.frameCount
        lastFrameRef.current = ts
      }

      const img = framesRef.current[frameIdxRef.current]
      if (img?.complete && img.naturalWidth > 0) {
        ctx.save()
        if (f === -1) { ctx.translate(cfg.srcSize, 0); ctx.scale(-1, 1) }
        // Draw at native 1:1 — no scaling cost
        ctx.drawImage(img, 0, 0)
        ctx.restore()
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [character])

  // CSS position using display-pixel layout
  const cssLeft       = Math.round(x - lay.cxInCanvas)
  const cssTop        = Math.round(y - lay.displayCanvas + lay.footFromBottom)
  // Bubble tail points at head top
  const bubbleAnchorY = cssTop + lay.headInCanvas - 8

  return (
    <>
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

      {/* Dialogue bubble */}
      {show && dialogue && (
        <div style={{
          position:      'absolute',
          left:          x,
          top:           bubbleAnchorY,
          transform:     'translateX(-50%) translateY(-100%)',
          zIndex:        30,
          pointerEvents: 'none',
          whiteSpace:    'nowrap',   // NO wrapping — single line always
          animation: fading
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
              whiteSpace:    'nowrap',   // enforce no wrap on text too
            }}>
              {dialogue}
            </div>
            {/* Tail */}
            <div style={{
              position:    'absolute',
              bottom:      '-12px',
              left:        '50%',
              transform:   'translateX(-50%)',
              width: 0, height: 0,
              borderLeft:  '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop:   '12px solid rgba(255,255,255,0.75)',
              filter:      'drop-shadow(0 3px 3px rgba(0,0,0,0.12))',
            }} />
          </div>
        </div>
      )}

      {/* Sprite canvas — native resolution, CSS scales to display size */}
      <canvas ref={canvasRef} style={{
        position:      'absolute',
        left:          cssLeft,
        top:           cssTop,
        width:         lay.displayCanvas,   // CSS display size
        height:        lay.displayCanvas,
        imageRendering:'auto',              // browser smooths the upscale
        pointerEvents: 'none',
        zIndex:        3,
      }} />
    </>
  )
}
