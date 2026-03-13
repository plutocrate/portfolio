import { useEffect, useRef } from 'react'

export default function CRTComputer({ x, y, width = 220, active = true }) {
  const screenRef = useRef(null)
  const rafRef    = useRef(null)
  const tRef      = useRef(0)

  const screenW = Math.round(width * 0.72)
  const screenH = Math.round(screenW * 0.72)
  const totalH  = Math.round(width * 1.05)

  useEffect(() => {
    const canvas = screenRef.current
    if (!canvas) return
    canvas.width  = screenW
    canvas.height = screenH

    const loop = (ts) => {
      tRef.current = ts / 1000
      const t = tRef.current
      const ctx = canvas.getContext('2d')

      // CRT bg — very bright phosphor green/teal
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, screenW, screenH)

      // Scrolling scan bands — bright glow
      for (let i = 0; i < 6; i++) {
        const bandY = ((t * 38 + i * screenH / 3) % (screenH + 60)) - 30
        const g = ctx.createLinearGradient(0, bandY - 18, 0, bandY + 18)
        g.addColorStop(0,   'rgba(80,255,200,0)')
        g.addColorStop(0.5, 'rgba(80,255,200,0.18)')
        g.addColorStop(1,   'rgba(80,255,200,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, bandY - 18, screenW, 36)
      }

      // Ambient glow fills — big blobs drifting
      const blobs = [
        { cx: screenW*0.3 + Math.sin(t*0.7)*screenW*0.1, cy: screenH*0.4 + Math.cos(t*0.5)*screenH*0.1, r: screenW*0.55, c: 'rgba(50,255,180,0.12)' },
        { cx: screenW*0.7 + Math.sin(t*0.4+1)*screenW*0.08, cy: screenH*0.6 + Math.cos(t*0.6)*screenH*0.12, r: screenW*0.4, c: 'rgba(100,220,255,0.10)' },
        { cx: screenW*0.5, cy: screenH*0.5 + Math.sin(t*0.3)*screenH*0.08, r: screenW*0.7, c: 'rgba(60,255,160,0.07)' },
      ]
      blobs.forEach(b => {
        const g = ctx.createRadialGradient(b.cx, b.cy, 0, b.cx, b.cy, b.r)
        g.addColorStop(0, b.c); g.addColorStop(1, 'transparent')
        ctx.fillStyle = g; ctx.fillRect(0, 0, screenW, screenH)
      })

      // Bright flickering "text" lines
      ctx.font = `${Math.round(screenH * 0.085)}px "Courier New", monospace`
      const lines = [
        '> PRATHAM.EXE',
        '> LOADING...',
        '> PORTFOLIO v2.3',
        '> PRESS E TO INTERACT',
        '> OK',
        '██████████ 100%',
        '> SYSTEM READY',
      ]
      lines.forEach((line, i) => {
        const flicker = 0.6 + 0.4 * Math.sin(t * 3.1 + i * 0.8)
        const alpha   = active ? (0.55 + 0.35 * Math.sin(t * 1.2 + i)) * flicker : 0.15
        ctx.fillStyle = `rgba(80,255,190,${alpha})`
        const yPos = screenH * 0.1 + i * screenH * 0.125
        ctx.fillText(line, screenW * 0.06, yPos)
      })

      // Horizontal scanlines overlay
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      for (let sy = 0; sy < screenH; sy += 3) {
        ctx.fillRect(0, sy, screenW, 1)
      }

      // Vignette
      const vig = ctx.createRadialGradient(screenW/2, screenH/2, screenH*0.2, screenW/2, screenH/2, screenH*0.85)
      vig.addColorStop(0, 'transparent')
      vig.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.fillStyle = vig; ctx.fillRect(0, 0, screenW, screenH)

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, screenW, screenH])

  // Desk depth (3D-ish)
  const deskD  = Math.round(width * 0.06)
  const legW   = Math.round(width * 0.07)
  const legH   = Math.round(totalH * 0.22)
  const monH   = Math.round(totalH * 0.60)
  const standH = Math.round(totalH * 0.12)
  const standW = Math.round(width * 0.18)
  const baseW  = Math.round(width * 0.36)
  const baseH  = Math.round(totalH * 0.06)

  return (
    <div style={{ position:'absolute', left: x - width/2, top: y - totalH, width, height: totalH, pointerEvents:'none', zIndex: 2 }}>

      {/* Monitor outer bezel */}
      <div style={{
        position:'absolute', top:0, left: width*0.08,
        width: width*0.84, height: monH,
        background: 'linear-gradient(160deg,#2a2a2e 0%,#1a1a1c 60%,#111 100%)',
        borderRadius: '10px 10px 6px 6px',
        boxShadow: '0 6px 28px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)',
        border: '2px solid #333',
      }}>
        {/* Bezel depth top */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:deskD,
          background:'linear-gradient(#3a3a3e,#2a2a2e)', borderRadius:'10px 10px 0 0' }} />

        {/* Screen inset */}
        <div style={{
          position:'absolute',
          top: monH*0.08, left: width*0.84*0.07,
          width: screenW, height: screenH,
          borderRadius: '4px',
          overflow:'hidden',
          boxShadow: active
            ? '0 0 32px rgba(60,255,180,0.55), 0 0 8px rgba(60,255,180,0.3), inset 0 0 12px rgba(60,255,180,0.15)'
            : '0 0 6px rgba(60,255,180,0.1)',
          border: '2px solid #222',
          background: '#000',
        }}>
          <canvas ref={screenRef} style={{ width:'100%', height:'100%', display:'block' }} />
          {/* CRT glass reflection */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)',
          }} />
        </div>

        {/* Power LED */}
        <div style={{
          position:'absolute', bottom: monH*0.05, right: width*0.84*0.1,
          width:7, height:7, borderRadius:'50%',
          background: active ? '#4fffe0' : '#333',
          boxShadow: active ? '0 0 8px #4fffe0, 0 0 3px #fff' : 'none',
        }} />
      </div>

      {/* Monitor stand neck */}
      <div style={{
        position:'absolute', top: monH, left:'50%', transform:'translateX(-50%)',
        width: standW, height: standH,
        background:'linear-gradient(to right,#222,#333,#222)',
        clipPath:'polygon(20% 0%,80% 0%,100% 100%,0% 100%)',
      }} />
      {/* Stand base */}
      <div style={{
        position:'absolute', top: monH + standH, left:'50%', transform:'translateX(-50%)',
        width: baseW, height: baseH,
        background:'linear-gradient(to bottom,#2a2a2a,#1a1a1a)',
        borderRadius:'3px 3px 6px 6px',
        boxShadow:'0 4px 12px rgba(0,0,0,0.5)',
      }} />

      {/* Desk surface */}
      <div style={{
        position:'absolute', top: monH + standH + baseH, left:-width*0.1,
        width: width*1.2, height: Math.round(totalH*0.07),
        background:'linear-gradient(to bottom,#3d2b1a,#2a1e10)',
        borderRadius:'4px',
        boxShadow:'0 6px 20px rgba(0,0,0,0.6)',
      }} />
    </div>
  )
}
