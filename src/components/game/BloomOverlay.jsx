// BloomOverlay — lightweight vignette only
// backdropFilter blur caused severe rendering degradation on Chromium browsers
// The WebGL shaders produce their own glow; this just adds edge darkening
export default function BloomOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        9999,
        pointerEvents: 'none',
        background:    'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)',
        mixBlendMode:  'multiply',
      }}
    />
  )
}
