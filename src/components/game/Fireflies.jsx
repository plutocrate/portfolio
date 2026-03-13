import { useEffect, useRef } from 'react'

// ── Vertex shader ─────────────────────────────────────────────────────────────
const VERT = `
precision highp float;
attribute vec2  a_pos;      // particle center, 0..1 UV
attribute float a_phase;    // unique phase offset per firefly
attribute float a_size;     // base radius in pixels
attribute vec3  a_color;    // base RGB

uniform vec2  u_res;
uniform float u_time;

varying float v_phase;
varying float v_size;
varying vec3  v_color;
varying vec2  v_center;     // screen-space center for fragment

void main() {
  // Drift: each firefly wanders in a Lissajous-like figure
  float t  = u_time + a_phase;
  float ox = sin(t * 0.7 + a_phase * 1.3) * 0.018
           + sin(t * 1.1 + a_phase * 0.7) * 0.008;
  float oy = cos(t * 0.5 + a_phase * 2.1) * 0.022
           + cos(t * 0.9 + a_phase * 1.5) * 0.009;

  vec2 uv = a_pos + vec2(ox, oy);
  // Clamp gently so they don't leave the frame
  uv = clamp(uv, vec2(0.02), vec2(0.98));

  vec2 screen = uv * u_res;
  v_center    = screen;

  // Pulse brightness: fireflies blink in and out
  float blink = 0.5 + 0.5 * sin(t * 2.3 + a_phase * 3.7);
  blink = pow(blink, 2.5);  // sharp off, quick bright

  v_phase = blink;
  v_size  = a_size * (0.7 + 0.6 * blink);  // size pulses with brightness
  v_color = a_color;

  // gl_PointSize in pixels — WebGL points are always squares in clip space
  // We'll draw a point quad sized to the glow diameter
  gl_PointSize = v_size * 4.0;  // room for the glow radius
  gl_Position  = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;  // flip Y (WebGL is bottom-up)
}
`

// ── Fragment shader ───────────────────────────────────────────────────────────
// Each firefly is a smooth radial gradient — a real blur circle, not a rect
const FRAG = `
precision highp float;
varying float v_phase;
varying float v_size;
varying vec3  v_color;

void main() {
  // gl_PointCoord: 0..1 within the point square, (0.5,0.5) = center
  vec2 uv   = gl_PointCoord - 0.5;      // -0.5..0.5
  float r   = length(uv);               // distance from center

  // Normalised radius within the glow area
  // v_size is the "core" radius; the point is 4x that, so glow fills 0..0.5
  float nr  = r / 0.5;                  // 0 = center, 1 = edge of point quad

  if (nr > 1.0) discard;                // outside circle → perfect round!

  // Multi-layer profile — sharp inner core + wide soft bloom
  float core  = exp(-nr * nr * 28.0);   // tight bright dot
  float bloom = exp(-nr * nr *  4.5);   // wide soft glow
  float outer = exp(-nr * nr *  1.2);   // very wide faint halo

  float intensity = core * 1.0 + bloom * 0.55 + outer * 0.18;
  intensity *= v_phase;                 // blink

  // Color: warm peach core → muted rose mid → dusty lilac outer halo
  vec3 coreCol  = vec3(1.00, 0.88, 0.75);  // warm peach-cream
  vec3 glowCol  = vec3(0.85, 0.55, 0.52);  // muted rose
  vec3 haloCol  = vec3(0.62, 0.42, 0.55);  // dusty mauve halo

  float coreBlend = exp(-nr * nr * 12.0);
  float haloBlend = clamp((nr - 0.3) / 0.7, 0.0, 1.0);

  vec3 col = mix(glowCol, coreCol, coreBlend);
  col      = mix(col,    haloCol, haloBlend * 0.5);
  col      = col * v_color;             // tint by per-firefly color variant

  float alpha = clamp(intensity, 0.0, 1.0);
  if (alpha < 0.004) discard;

  // Pre-multiply for additive-style blending (screen blend looks great)
  gl_FragColor = vec4(col * alpha, alpha);
}
`

// ── Firefly data ───────────────────────────────────────────────────────────────
function makeFireflies(count, containerWidth, containerHeight, groundY, lightX) {
  const positions = new Float32Array(count * 2)
  const phases    = new Float32Array(count)
  const sizes     = new Float32Array(count)
  const colors    = new Float32Array(count * 3)

  const glowU = lightX / containerWidth      // glow X in 0..1

  for (let i = 0; i < count; i++) {
    // Cluster fireflies near the glow source, sparse elsewhere
    // Use exponential distribution: most near the glow, a few scattered far
    const spread = Math.random()
    let x, y

    if (spread < 0.65) {
      // Near the glow: tight cluster
      const r   = Math.random() * 0.4
      const ang = (Math.random() - 0.5) * Math.PI * 1.2
      x = glowU + Math.cos(ang) * r * 0.5
      y = 0.2 + Math.random() * 0.6
    } else {
      // Scattered ambient fireflies across left half
      x = 0.02 + Math.random() * 0.85
      y = 0.1  + Math.random() * 0.75
    }

    // Keep above ground
    const groundUV = groundY / containerHeight
    y = Math.min(y, groundUV - 0.04)

    positions[i * 2]     = x
    positions[i * 2 + 1] = y
    phases[i]            = Math.random() * Math.PI * 2
    sizes[i]             = 3.5 + Math.random() * 4.5   // px radius 3.5–8

    // Color variation: peachy-rose smoke shades — warm peach, rose, dusty mauve
    const warm = Math.random()
    colors[i * 3]     = 0.75 + warm * 0.25   // R: always warm
    colors[i * 3 + 1] = 0.40 + warm * 0.35   // G: peach (high warm) → rose (low warm)
    colors[i * 3 + 2] = 0.45 + (1 - warm) * 0.35  // B: more blue = cooler mauve
  }

  return { positions, phases, sizes, colors }
}

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Firefly shader error:', gl.getShaderInfoLog(s))
    gl.deleteShader(s); return null
  }
  return s
}

export default function Fireflies({ containerWidth, containerHeight, groundY, lightX }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width  = containerWidth
    canvas.height = containerHeight

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    })
    if (!gl) return

    // ── Check if gl_PointSize is supported (it always is in WebGL, just confirm) ──
    const vs = compile(gl, gl.VERTEX_SHADER,   VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const prog = gl.createProgram()
    gl.attachShader(prog, vs); gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Firefly link error:', gl.getProgramInfoLog(prog)); return
    }
    gl.useProgram(prog)

    const COUNT = 48
    const { positions, phases, sizes, colors } = makeFireflies(
      COUNT, containerWidth, containerHeight, groundY, lightX
    )

    // Buffers
    const mkBuf = (data) => {
      const b = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, b)
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
      return b
    }

    const posBuf   = mkBuf(positions)
    const phaseBuf = mkBuf(phases)
    const sizeBuf  = mkBuf(sizes)
    const colBuf   = mkBuf(colors)

    const aPos   = gl.getAttribLocation(prog, 'a_pos')
    const aPhase = gl.getAttribLocation(prog, 'a_phase')
    const aSize  = gl.getAttribLocation(prog, 'a_size')
    const aColor = gl.getAttribLocation(prog, 'a_color')
    const uRes   = gl.getUniformLocation(prog, 'u_res')
    const uTime  = gl.getUniformLocation(prog, 'u_time')

    gl.enable(gl.BLEND)
    // Screen-like additive blend — fireflies glow additively over the dark scene
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    const t0 = performance.now()

    const render = () => {
      const t = (performance.now() - t0) * 0.001

      gl.viewport(0, 0, containerWidth, containerHeight)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.uniform2f(uRes,  containerWidth, containerHeight)
      gl.uniform1f(uTime, t)

      // Bind attribs
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, phaseBuf)
      gl.enableVertexAttribArray(aPhase)
      gl.vertexAttribPointer(aPhase, 1, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf)
      gl.enableVertexAttribArray(aSize)
      gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, colBuf)
      gl.enableVertexAttribArray(aColor)
      gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0)

      gl.drawArrays(gl.POINTS, 0, COUNT)

      rafRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(rafRef.current)
      gl.deleteProgram(prog)
      ;[posBuf, phaseBuf, sizeBuf, colBuf].forEach(b => gl.deleteBuffer(b))
    }
  }, [containerWidth, containerHeight, groundY, lightX])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'absolute',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        5,
        // CSS mix-blend-mode: screen — firefly light adds to whatever is beneath
        mixBlendMode:  'screen',
      }}
    />
  )
}
