import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;

uniform float u_time;
uniform vec2  u_res;
uniform vec2  u_origin;

// ── Smooth gradient noise — no hash banding ───────────────────────────────────
float gradNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u2 = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i,             vec2(127.1,311.7))) * 43758.5453);
  float b = fract(sin(dot(i+vec2(1,0),   vec2(127.1,311.7))) * 43758.5453);
  float c = fract(sin(dot(i+vec2(0,1),   vec2(127.1,311.7))) * 43758.5453);
  float d = fract(sin(dot(i+vec2(1,1),   vec2(127.1,311.7))) * 43758.5453);
  return mix(mix(a,b,u2.x), mix(c,d,u2.x), u2.y);
}

// ── FBM — 7 octaves for denser detail ────────────────────────────────────────
float fbm(vec2 p) {
  float v = 0.0, amp = 0.54, freq = 1.0;
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 7; i++) {
    v   += amp * gradNoise(p * freq);
    p    = rot * p;
    freq *= 2.07;
    amp  *= 0.47;
  }
  return v;
}

// ── Triple-warped smoke — creates dramatic billowing tendrils ─────────────────
float warpedSmoke(vec2 p, float t) {
  // Pass 1
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + vec2(t*0.13, t*0.09)),
    fbm(p + vec2(5.2, 1.3) + vec2(t*0.10, t*0.14))
  );
  // Pass 2
  vec2 r = vec2(
    fbm(p + 4.8*q + vec2(1.7, 9.2) + vec2(t*0.07, 0.0)),
    fbm(p + 4.8*q + vec2(8.3, 2.8) + vec2(0.0,    t*0.08))
  );
  // Pass 3 — the extra warp creates more dramatic rolling
  vec2 s = vec2(
    fbm(p + 3.5*r + vec2(3.1, 6.4) + vec2(t*0.05, t*0.06)),
    fbm(p + 3.5*r + vec2(9.7, 4.1) + vec2(t*0.06, t*0.04))
  );
  return fbm(p + 5.0*s);
}

// ── Second smoke layer — larger, slower billows ───────────────────────────────
float slowBillow(vec2 p, float t) {
  vec2 q = vec2(
    fbm(p + vec2(2.3, 7.1) + vec2(t*0.07, t*0.05)),
    fbm(p + vec2(4.1, 0.8) + vec2(t*0.05, t*0.08))
  );
  return fbm(p + 3.0*q + vec2(t*0.04, 0.0));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  float t = u_time;

  // ── Distance from origin ──────────────────────────────────────────────────
  vec2 d = (uv - u_origin) * vec2(aspect, 1.0);
  float dist = length(d);
  float angle = atan(d.y, d.x); // -π..π

  // ── Radial falloffs — much wider to fill screen ───────────────────────────
  float core    = exp(-dist*dist * 12.0);          // tight bright core (was 22)
  float midGlow = exp(-dist*dist *  2.8);          // medium halo — wider (was 6)
  float scatter = exp(-dist*dist *  0.8);          // very wide scatter across screen (was 2.2)
  float golden  = exp(-dist*dist * 32.0);          // tiny gold hotspot

  // ── Smoke coordinate space — stretched to push tendrils to left edge ──────
  vec2 smokeUV = (uv - u_origin) * vec2(1.6*aspect, 2.5);  // wider reach (was 2.8, 4.2)
  smokeUV += vec2(-t * 0.10, sin(t*0.3)*0.05);

  // ── Two smoke layers ──────────────────────────────────────────────────────
  float smoke1 = warpedSmoke(smokeUV * 1.2 + vec2(t*0.08), t);  // coarser (was 1.5)
  smoke1 = smoothstep(0.22, 0.78, smoke1);  // lower threshold = more visible (was 0.28, 0.82)

  float smoke2 = slowBillow(smokeUV * 0.55 + vec2(1.3, 2.7) + vec2(t*0.04, 0.0), t);
  smoke2 = smoothstep(0.30, 0.80, smoke2);

  float smoke = smoke1 * 0.7 + smoke2 * 0.45;
  smoke = clamp(smoke, 0.0, 1.0);

  // ── Distance fading — tendrils visible far but fade gracefully ───────────
  float distFade  = exp(-dist * 0.9);   // much gentler falloff (was 1.5)
  float smokeMask = smoke * distFade;

  // ── Wisps — reach far across screen ──────────────────────────────────────
  vec2 wispUV = (uv - u_origin) * vec2(3.0*aspect, 3.5);  // wider (was 5.0, 6.0)
  wispUV += vec2(-t*0.14, 0.0);
  float wisps = warpedSmoke(wispUV * 1.5, t * 1.2);  // coarser (was 2.0)
  wisps = smoothstep(0.38, 0.85, wisps) * exp(-dist * 1.4);  // gentler fade (was 2.8)

  // ── Light intensity ───────────────────────────────────────────────────────
  float light = core * 1.1
              + smokeMask * midGlow * 1.6   // boosted (was 1.4)
              + wisps * scatter * 0.8;      // boosted (was 0.6)
  light = clamp(light, 0.0, 1.0);

  // ── Color palette — peachy-pink ethereal smoke ────────────────────────────
  // Inspired by the parallax scene's surreal, dreamlike color field
  vec3 deepShadow   = vec3(0.08, 0.07, 0.10);   // dark purple-shadow base
  vec3 smokeBase    = vec3(0.76, 0.71, 0.80);   // purple-lavender tree tone
  vec3 smokeMid     = vec3(0.82, 0.94, 0.88);   // teal-mint mid haze
  vec3 peachBright  = vec3(0.97, 0.92, 0.93);   // soft pink-white bright zone
  vec3 hotCore      = vec3(1.00, 0.98, 0.98);   // near-white cloud core
  // Cool teal accent — the mint mountain haze
  vec3 tealAccent   = vec3(0.72, 0.95, 0.84);   // bright mint-teal wisp tips
  vec3 lilacFar     = vec3(0.85, 0.80, 0.90);   // soft lilac outer haze

  // ── Build color by layer ──────────────────────────────────────────────────
  vec3 color = deepShadow;

  // Smoke body transitions rose → peach toward the source
  color = mix(color, smokeBase,   clamp(smokeMask * 2.8, 0.0, 1.0));
  color = mix(color, smokeMid,    clamp(smokeMask * 2.0, 0.0, 1.0) * midGlow);
  color = mix(color, peachBright, clamp(midGlow * 1.4, 0.0, 1.0) * core * 2.0);

  // Tendril tips: cool teal flash (like glimpsing color through smoke)
  color = mix(color, tealAccent, wisps * 0.65 * (1.0 - dist * 1.5));

  // Far haze: purple-lilac bleeds into the edges
  float farHaze = clamp((dist - 0.2) / 0.6, 0.0, 1.0) * scatter;
  color = mix(color, lilacFar, farHaze * smokeMask * 0.5);

  // Hot core: warm near-white at the very source center
  color = mix(color, peachBright, core * 0.7);
  color = mix(color, hotCore,     golden * 0.85);

  // ── Animated color breathing — smoke shifts between rose and peach ────────
  float breathe = sin(u_time * 0.6) * 0.5 + 0.5;
  float pulse2  = sin(u_time * 1.7 + 1.4) * 0.5 + 0.5;
  // Slow color shift: rose → warm peach → back
  color = mix(color, smokeMid,   smoke1 * scatter * 0.22 * breathe);  // teal wash breathing
  color = mix(color, tealAccent, wisps * (1.0 - midGlow) * 0.35);  // mint on wisp edges

  // ── Wide ambient wash — whole screen gets soft pink-teal haze ────────────
  float ambient = exp(-dist * 0.45) * 0.28;
  color = mix(color, peachBright, ambient * 0.45);  // pink-white ambient wash

  // ── Alpha ─────────────────────────────────────────────────────────────────
  float alpha = light;
  float pulse = 1.0 + 0.07 * sin(t * 1.3) + 0.04 * sin(t * 2.9 + 0.8);
  alpha *= pulse;
  alpha = max(alpha, ambient * 0.65);   // stronger ambient floor (was 0.55)
  alpha = clamp(alpha, 0.0, 0.97);
  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color * alpha, alpha);
}
`

function compileShader(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader error:', gl.getShaderInfoLog(s))
    gl.deleteShader(s)
    return null
  }
  return s
}

function buildProgram(gl) {
  const prog = gl.createProgram()
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return null
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Link error:', gl.getProgramInfoLog(prog))
    return null
  }
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  return prog
}

const ForestGlow = forwardRef(function ForestGlow(
  { originX = 0.92, originY = 0.5, style = {} },
  ref
) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useImperativeHandle(ref, () => canvasRef.current)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl', {
      alpha: true, premultipliedAlpha: true, antialias: false,
    })
    if (!gl) { console.warn('WebGL unavailable'); return }

    const prog = buildProgram(gl)
    if (!prog) return

    gl.useProgram(prog)

    const quad = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1])
    const buf  = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)

    const aPos    = gl.getAttribLocation(prog, 'a_pos')
    const uTime   = gl.getUniformLocation(prog, 'u_time')
    const uRes    = gl.getUniformLocation(prog, 'u_res')
    const uOrigin = gl.getUniformLocation(prog, 'u_origin')

    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    const startTime = performance.now()

    const render = () => {
      const w = canvas.clientWidth  | 0
      const h = canvas.clientHeight | 0
      if (!w || !h) { rafRef.current = requestAnimationFrame(render); return }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h
        gl.viewport(0, 0, w, h)
      }
      const t = (performance.now() - startTime) * 0.001
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(uTime, t)
      gl.uniform2f(uRes, w, h)
      gl.uniform2f(uOrigin, originX, originY)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      rafRef.current = requestAnimationFrame(render)
    }

    render()
    return () => {
      cancelAnimationFrame(rafRef.current)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
    }
  }, [originX, originY])

  return (
    <canvas
      ref={canvasRef}
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', ...style }}
    />
  )
})

export default ForestGlow
