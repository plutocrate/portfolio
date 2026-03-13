import { useEffect, useRef } from 'react'

// Each cloud = cluster of overlapping soft ellipses
// Covers the entire top portion of screen with layered dramatic depth
// Three depth layers: far (small, pale, slow), mid, near (large, dark, fast)

const CLOUD_LAYERS = [
  // Far layer — pale, slow, small
  { count: 6,  speedMult: 0.4, scaleRange: [0.4, 0.7], yRange: [0.0, 0.18], opacityRange: [0.25, 0.40], colorSet: 'pale'  },
  // Mid layer — medium depth
  { count: 7,  speedMult: 0.7, scaleRange: [0.7, 1.2], yRange: [0.0, 0.28], opacityRange: [0.45, 0.65], colorSet: 'mid'   },
  // Near layer — large, dramatic, fast-moving
  { count: 5,  speedMult: 1.2, scaleRange: [1.1, 1.9], yRange: [0.0, 0.35], opacityRange: [0.55, 0.80], colorSet: 'dark'  },
]

// Dramatic color palettes per depth layer
const COLOR_SETS = {
  // Far clouds — near-white with faint pink blush (sky_top tone)
  pale: [
    { core: 'rgba(250,242,244,0.90)', mid: 'rgba(237,228,232,0.55)', outer: 'rgba(220,215,225,0.18)' },
    { core: 'rgba(248,245,250,0.88)', mid: 'rgba(232,228,240,0.50)', outer: 'rgba(215,212,228,0.15)' },
  ],
  // Mid clouds — teal-mint haze (teal_haze tone)
  mid: [
    { core: 'rgba(220,245,235,0.92)', mid: 'rgba(190,230,215,0.62)', outer: 'rgba(160,210,195,0.22)' },
    { core: 'rgba(210,238,228,0.90)', mid: 'rgba(182,222,208,0.58)', outer: 'rgba(155,200,188,0.20)' },
    { core: 'rgba(225,242,235,0.88)', mid: 'rgba(195,228,215,0.55)', outer: 'rgba(165,208,198,0.18)' },
  ],
  // Near clouds — purple-lavender (mountains tone), dramatic shadows
  dark: [
    { core: 'rgba(210,200,225,0.95)', mid: 'rgba(178,165,198,0.72)', outer: 'rgba(145,132,168,0.32)' },
    { core: 'rgba(205,195,220,0.92)', mid: 'rgba(172,158,192,0.68)', outer: 'rgba(138,125,162,0.28)' },
    { core: 'rgba(215,205,228,0.90)', mid: 'rgba(182,168,202,0.65)', outer: 'rgba(148,135,172,0.26)' },
  ],
}

function makeCloud(id, containerWidth, containerHeight, layerCfg) {
  const { scaleRange, yRange, opacityRange, colorSet, speedMult } = layerCfg
  const scale     = scaleRange[0] + Math.random() * (scaleRange[1] - scaleRange[0])
  const baseX     = Math.random() * containerWidth * 1.3 - containerWidth * 0.15
  const baseY     = containerHeight * (yRange[0] + Math.random() * (yRange[1] - yRange[0]))
  const opacity   = opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0])
  const driftSpeed = (10 + Math.random() * 18) * speedMult
  const palette   = COLOR_SETS[colorSet]
  const colors    = palette[Math.floor(Math.random() * palette.length)]
  const blobCount = 5 + Math.floor(Math.random() * 6)

  const blobs = []
  for (let b = 0; b < blobCount; b++) {
    // Spread blobs to fill wide horizontal area — clouds should span full width
    const spreadX = containerWidth * 0.28 * scale
    blobs.push({
      ox:    (Math.random() - 0.5) * spreadX * 2,
      oy:    (Math.random() - 0.5) * 60 * scale * 0.5,
      rx:    55 + Math.random() * 110 * scale,
      ry:    35 + Math.random() * 65  * scale,
      phase: Math.random() * Math.PI * 2,
    })
  }

  return { id, x: baseX, y: baseY, scale, driftSpeed, opacity, blobs, colors, colorSet }
}

function drawCloud(ctx, cloud, t) {
  const { x, y, opacity, blobs, colors } = cloud
  ctx.save()
  ctx.globalAlpha = opacity

  blobs.forEach(blob => {
    const breathe = 1 + 0.025 * Math.sin(t * 0.35 + blob.phase)
    const bx = x + blob.ox
    const by = y + blob.oy
    const rx = blob.rx * breathe
    const ry = blob.ry * breathe * 0.75  // squish vertically for cloud shape

    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, Math.max(rx, ry))
    grad.addColorStop(0.00, colors.core)
    grad.addColorStop(0.40, colors.mid)
    grad.addColorStop(0.75, colors.outer)
    grad.addColorStop(1.00, 'rgba(0,0,0,0)')

    ctx.save()
    ctx.scale(1, ry / rx)
    ctx.beginPath()
    ctx.arc(bx, by * (rx / ry), rx, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()
  })

  ctx.restore()
}

export default function ProceduralClouds({ containerWidth, containerHeight, cameraSpeed, zIndex = 6 }) {
  const canvasRef = useRef(null)
  const cloudsRef = useRef([])
  const rafRef    = useRef(null)
  const t0        = useRef(performance.now())

  useEffect(() => {
    const all = []
    CLOUD_LAYERS.forEach((layerCfg, li) => {
      for (let i = 0; i < layerCfg.count; i++) {
        all.push({ ...makeCloud(`${li}-${i}`, containerWidth, containerHeight, layerCfg), layerCfg })
      }
    })
    cloudsRef.current = all
  }, [containerWidth, containerHeight])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = containerWidth
    canvas.height = containerHeight
    const ctx = canvas.getContext('2d')
    let lastTs = null

    const render = (ts) => {
      if (!lastTs) lastTs = ts
      const dt = Math.min((ts - lastTs) / 1000, 0.05)
      lastTs = ts
      const t = (ts - t0.current) * 0.001

      ctx.clearRect(0, 0, containerWidth, containerHeight)

      const camVel = cameraSpeed?.current ?? 0

      cloudsRef.current.forEach(cloud => {
        cloud.x += (cloud.driftSpeed + camVel * 0.05) * dt

        const cloudWidth = cloud.scale * containerWidth * 0.4
        if (cloud.x - cloudWidth > containerWidth * 1.1) {
          cloud.x = -cloudWidth
          cloud.y = containerHeight * (cloud.layerCfg.yRange[0] + Math.random() * (cloud.layerCfg.yRange[1] - cloud.layerCfg.yRange[0]))
        }
        if (cloud.x + cloudWidth < -containerWidth * 0.15) {
          cloud.x = containerWidth + cloudWidth
        }

        drawCloud(ctx, cloud, t)
      })

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [containerWidth, containerHeight])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex }}
    />
  )
}
