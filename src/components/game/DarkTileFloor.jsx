import { useEffect, useRef } from 'react'
import { asset } from '../../utils/constants'

// TileSet.png is 840x840.
// Measured content: col 130-599, row 116-597 (470x482)
// Top strip (sandy edge + dark body top): rows 116-240, ~124px tall — this is the "surface" tile
// We tile this strip horizontally. The TOP of row 0 = groundY (player stands on top of tiles)

const TILE_SRC = {
  // Source rect in TileSet.png for the top-surface strip
  x: 130, y: 116,
  w: 470, h: 124,   // full top block including edge + dark body top
}

const TILE_RENDER_W = 94   // rendered width per tile
const TILE_RENDER_H = 96   // rendered height per tile (maintains rough aspect)

export default function DarkTileFloor({
  containerWidth,
  containerHeight,
  groundY,          // player feet Y — tiles start HERE (top edge = groundY)
  lightX,
}) {
  const canvasRef  = useRef(null)
  const tileRef    = useRef(null)
  const rafRef     = useRef(null)
  const lightXRef  = useRef(lightX)

  useEffect(() => { lightXRef.current = lightX }, [lightX])

  useEffect(() => {
    const img = new Image()
    img.src = asset('/assets/tiles/TileSet.png')
    img.onload = () => { tileRef.current = img }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = containerWidth
    canvas.height = containerHeight

    const cols = Math.ceil(containerWidth / TILE_RENDER_W) + 2
    // How many rows fill from groundY to bottom of screen
    const rows = Math.ceil((containerHeight - groundY) / TILE_RENDER_H) + 1

    const draw = () => {
      const lx = lightXRef.current
      ctx.clearRect(0, 0, containerWidth, containerHeight)

      if (!tileRef.current) { rafRef.current = requestAnimationFrame(draw); return }

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const dx = col * TILE_RENDER_W
          const dy = groundY + row * TILE_RENDER_H   // top of row 0 = groundY ✓

          // ── Draw tile ──────────────────────────────────────────────────
          ctx.save()
          ctx.drawImage(
            tileRef.current,
            TILE_SRC.x, TILE_SRC.y, TILE_SRC.w, TILE_SRC.h,
            dx, dy, TILE_RENDER_W, TILE_RENDER_H
          )

          // ── Heavy dark multiply — almost black in darkness ────────────
          ctx.globalCompositeOperation = 'multiply'
          ctx.globalAlpha = 0.92
          ctx.fillStyle   = '#020805'
          ctx.fillRect(dx, dy, TILE_RENDER_W, TILE_RENDER_H)
          ctx.globalCompositeOperation = 'source-over'
          ctx.globalAlpha = 1

          // ── Peachy-rose light from glow source (matches smoke palette) ──
          const tileCx   = dx + TILE_RENDER_W / 2
          const dist     = Math.abs(tileCx - lx)
          const maxDist  = containerWidth * 0.88
          const f        = Math.max(0, 1 - dist / maxDist)
          const light    = f * f * f * f  // quartic — very focused near source

          if (light > 0.003) {
            ctx.globalCompositeOperation = 'screen'
            ctx.globalAlpha = light * 0.45

            const grad = ctx.createRadialGradient(
              lx, groundY + 20, 0,
              lx, groundY + 20, containerWidth * 0.5
            )
            grad.addColorStop(0,   'rgba(200,230,215,1)')   // teal-mint core light
            grad.addColorStop(0.3, 'rgba(180,165,210,0.6)')  // lavender-purple mid
            grad.addColorStop(1,   'rgba(0,0,0,0)')
            ctx.fillStyle = grad
            ctx.fillRect(dx, dy, TILE_RENDER_W, TILE_RENDER_H)

            ctx.globalCompositeOperation = 'source-over'
            ctx.globalAlpha = 1
          }

          ctx.restore()
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [containerWidth, containerHeight, groundY])

  return (
    <canvas
      ref={canvasRef}
      style={{ position:'absolute', inset:0, pointerEvents:'none' }}
    />
  )
}
