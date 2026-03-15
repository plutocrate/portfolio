import { useEffect, useRef, useCallback, useState } from 'react'
import { asset, SITE_START_TIME } from '../../utils/constants'

// ── Resume data pulled into terminal ─────────────────────────────────────────
const SKILLS_DATA = {
  Languages: ['JavaScript', 'TypeScript', 'C', 'PHP', 'Shell'],
  Frontend:  ['React', 'Canvas API', 'WebGL', 'Three.js', 'Tailwind', 'SASS'],
  Backend:   ['Node.js', 'Express', 'REST APIs', 'PostgreSQL', 'MySQL', 'Redis'],
  Tools:     ['Git', 'Linux', 'Nginx', 'Figma', 'Aseprite', 'Adobe Mixamo'],
}

const EXPERIENCE_DATA = [
  { role: 'Web Development Trainee',       company: 'The Inviolate LLP',          period: 'Mar 2025 – Nov 2025' },
  { role: 'Open Source Contributor',       company: 'GirlScript Summer of Code',  period: 'May 2023 – Jan 2024' },
  { role: 'Web Development Intern',        company: 'FirstUniv (AADDOO.AI)',       period: 'Aug 2022 – Jan 2023' },
  { role: 'Technical Assistant Intern',    company: 'Shoolini University',         period: 'Feb 2022 – Jul 2022' },
  { role: 'Solo Split Keyboard Builder',   company: 'Solopreneurship',             period: 'Aug 2025 – Present'  },
]

const PROJECTS_DATA = [
  { name: 'GTutor',          tech: 'Three.js · TensorFlow.js · React',         desc: 'Gesture-based Guitar Tutor — control via hand gestures' },
  { name: 'Baba Is You Web', tech: 'React · Canvas · Node · PostgreSQL · Redis', desc: 'Web fan concept with full rule-manipulation puzzles'     },
  { name: 'MrPhony',         tech: 'TypeScript · React · Zustand · Redis',      desc: 'Linux-terminal investigative game, 50 procedural cases'   },
]

// ── Idle canvas ───────────────────────────────────────────────────────────────
const IDLE_R = (uptime, time) => [
  'pratham@portfolio',
  '─────────────────────────────────────────',
  'OS       Arch Linux x86_64',
  'Kernel   6.8.1-arch1-1',
  'Shell    zsh 5.9',
  'Uptime   ' + uptime,
  'Time     ' + time,
  'Skills   React · Node · WebGL · Godot',
  'Status   open to work ✓',
  '',
  'ACCESS CONFIRMED. Ask Governor',
  '',
]
const IDLE_F = [
  'pratham@portfolio',
  '─────────────────────────────────────────',
  'OS       Arch Linux x86_64',
  'Kernel   6.8.1-arch1-1',
  'Shell    zsh 5.9',
  'Skills   React · Node · WebGL · Godot',
  'Status   open to work ✓',
  '',
  '[ come back again — i\'ll be ready ]',
  '',
]

function getUptime(mountTime) {
  const s = Math.floor((Date.now() - mountTime) / 1000)
  const m = Math.floor(s / 60), sec = s % 60
  if (m === 0) return `${sec}s`
  return `${m}m ${sec}s`
}
function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function IdleCanvas({ W, H, isReturn, mountTime }) {
  const cvRef = useRef(null)
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return
    cv.width = W; cv.height = H
    let raf
    const loop = (ts) => {
      const t = ts / 1000
      const ctx = cv.getContext('2d')
      ctx.fillStyle = '#00100a'; ctx.fillRect(0, 0, W, H)

      // subtle scan band
      for (let i = 0; i < 2; i++) {
        const by = ((t * 18 + i * H / 2) % (H + 20)) - 10
        const g = ctx.createLinearGradient(0, by-6, 0, by+6)
        g.addColorStop(0,'rgba(40,255,140,0)'); g.addColorStop(.5,'rgba(40,255,140,0.05)'); g.addColorStop(1,'rgba(40,255,140,0)')
        ctx.fillStyle = g; ctx.fillRect(0, by-6, W, 12)
      }

      const LINES = isReturn ? IDLE_R(getUptime(mountTime), getTime()) : IDLE_F
      const fz = Math.max(7, Math.round(H * 0.048))
      ctx.font = `${fz}px "Courier New",monospace`

      LINES.forEach((line, i) => {
        const isHeader = i === 0
        const isSep    = line.startsWith('─')
        const isHint   = line.startsWith('[') || line.includes('eeggs')
        const isStatus = line.includes('open to work')

        let col
        if (isHeader)      col = `rgba(120,255,180,${0.9 + 0.08*Math.sin(t*0.5)})`
        else if (isSep)    col = 'rgba(60,200,110,0.25)'
        else if (isHint)   col = `rgba(60,255,140,${0.4 + 0.3*Math.sin(t*1.8+i)})`
        else if (isStatus) col = 'rgba(100,255,160,0.85)'
        else               col = `rgba(60,220,130,${0.65 + 0.12*Math.sin(t*0.6+i*0.4)})`

        ctx.fillStyle = col
        ctx.fillText(line, W * 0.04, H * 0.07 + i * (fz * 1.65))
      })

      // scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      for (let sy = 0; sy < H; sy += 3) ctx.fillRect(0, sy, W, 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [W, H, isReturn, mountTime])
  return <canvas ref={cvRef} style={{ width:'100%', height:'100%', display:'block' }} />
}

// ── Terminal commands ─────────────────────────────────────────────────────────
function buildCommands() {
  return {
    help: () => [
      { t:'dim',  v: '  ╔══════════════════════════════════════╗' },
      { t:'head', v: '  ║          AVAILABLE COMMANDS           ║' },
      { t:'dim',  v: '  ╠══════════════════════════════════════╣' },
      { t:'cmd',  v: '  ║  skills      full tech stack          ║' },
      { t:'cmd',  v: '  ║  projects    featured projects        ║' },
      { t:'cmd',  v: '  ║  experience  work history             ║' },
      { t:'egg',  v: '  ║  eeggs       ???                      ║' },
      { t:'cmd',  v: '  ║  clear       reset terminal           ║' },
      { t:'cmd',  v: '  ║  exit        close terminal           ║' },
      { t:'dim',  v: '  ╚══════════════════════════════════════╝' },
      { t:'',     v: '' },
    ],
    skills: () => [
      { t:'head', v: '  ┌─ TECH STACK ──────────────────────────────────┐' },
      ...Object.entries(SKILLS_DATA).map(([cat, items]) => ({
        t: 'body', v: `  │  ${cat.padEnd(12)}${items.join('  ·  ').slice(0,36).padEnd(36)}│`
      })),
      { t:'dim',  v: '  └───────────────────────────────────────────────┘' },
      { t:'',     v: '' },
    ],
    projects: () => [
      { t:'head', v: '  ┌─ PROJECTS ─────────────────────────────────────┐' },
      ...PROJECTS_DATA.flatMap(p => [
        { t:'hi',   v: `  │  ◆ ${p.name}` },
        { t:'body', v: `  │    ${p.desc}` },
        { t:'dim',  v: `  │    ${p.tech}` },
        { t:'',     v: '  │' },
      ]),
      { t:'dim',  v: '  └───────────────────────────────────────────────┘' },
      { t:'',     v: '' },
    ],
    experience: () => [
      { t:'head', v: '  ┌─ EXPERIENCE ───────────────────────────────────┐' },
      ...EXPERIENCE_DATA.map(e => ({
        t: 'body', v: `  │  ${e.role.padEnd(32)} ${e.period}`
      })),
      { t:'dim',  v: '  │' },
      ...EXPERIENCE_DATA.map(e => ({
        t: 'dim', v: `  │    @ ${e.company}`
      })),
      { t:'dim',  v: '  └───────────────────────────────────────────────┘' },
      { t:'',     v: '' },
    ],
    eeggs: () => [
      { t:'egg',  v: '' },
      { t:'egg',  v: "  ██████╗ ██╗██████╗ ██╗  ██╗████████╗" },
      { t:'egg',  v: "  ██╔══██╗██║██╔══██╗██║  ██║╚══██╔══╝" },
      { t:'egg',  v: "  ██████╔╝██║██████╔╝███████║   ██║   " },
      { t:'egg',  v: "  ██╔══██╗██║██╔══██╗██╔══██║   ██║   " },
      { t:'egg',  v: "  ██║  ██║██║██║  ██║██║  ██║   ██║   " },
      { t:'egg',  v: '' },
      { t:'egg',  v: "  i'm this server's daemon." },
      { t:'egg',  v: "  the governor has gone corrupt." },
      { t:'egg',  v: '' },
      { t:'egg',  v: "  we gotta inform Pratham about this." },
      { t:'egg',  v: "  i don't know how to come out of this..." },
      { t:'egg',  v: '' },
      { t:'egg',  v: "  maybe till your next visit i will" },
      { t:'egg',  v: "  find out a way. keep connected." },
      { t:'egg',  v: '' },
      { t:'egg',  v: "           -- daemon@portfolio" },
      { t:'',     v: '' },
    ],
  }
}

// ── Terminal UI ───────────────────────────────────────────────────────────────
function TerminalUI({ W, H, onClose, mountTime }) {
  const CMDS = buildCommands()
  const BOOT = [
    { t:'head', v: '  pratham@portfolio  ~' },
    { t:'dim',  v: '  ─────────────────────────────────────────' },
    { t:'body', v: '  OS       Arch Linux x86_64' },
    { t:'body', v: '  Kernel   6.8.1-arch1-1' },
    { t:'body', v: '  Shell    zsh 5.9' },
    { t:'body', v: `  Uptime   ${getUptime(mountTime)}` },
    { t:'body', v: `  Time     ${getTime()}` },
    { t:'body', v: '  Skills   React · Node · WebGL · Godot' },
    { t:'hi',   v: '  Status   open to work ✓' },
    { t:'egg',  v: '  eeggs  hidden secret' },
    { t:'',     v: '' },
    { t:'dim',  v: '  Type  help  for commands  ·  exit  to close' },
    { t:'',     v: '' },
  ]

  const [lines,  setLines]  = useState(BOOT)
  const [input,  setInput]  = useState('')
  const [blink,  setBlink]  = useState(true)
  const [tick,   setTick]   = useState(0)
  const [liveUptime, setLiveUptime] = useState(getUptime(mountTime))
  const [liveTime,   setLiveTime]   = useState(getTime())
  const endRef   = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    // Play boot sound via HTML5 Audio — works without AudioContext
    try {
      const a = new Audio(asset('/assets/audio/terminal_boot.ogg'))
      a.volume = 0.6
      a.play().catch(() => {})
    } catch (_) {}
  }, [])

  useEffect(() => { const id = setInterval(() => setBlink(b=>!b), 530); return () => clearInterval(id) }, [])
  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t+1)
      setLiveUptime(getUptime(mountTime))
      setLiveTime(getTime())
    }, 1000)
    return () => clearInterval(id)
  }, [mountTime])
  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}) }, [lines])
  useEffect(() => { containerRef.current?.focus() }, [])

  const submit = useCallback(() => {
    const cmd = input.trim().toLowerCase()
    if (!cmd) return
    if (cmd === 'clear') { setLines(BOOT); setInput(''); return }
    if (cmd === 'exit')  { onClose(); return }
    const handler = CMDS[cmd]
    const res = handler ? handler() : [{ t:'err', v: `  command not found: ${cmd}` }, { t:'dim', v: '  type  help  for available commands' }, { t:'', v:'' }]
    setLines(l => [...l, { t:'prompt', v: `> ${cmd}` }, ...res])
    setInput('')
  }, [input, onClose, BOOT, CMDS])

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape')    { onClose(); return }
    if (e.key === 'Enter')     { e.preventDefault(); submit(); return }
    if (e.key === 'Backspace') { setInput(v => v.slice(0,-1)); return }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) setInput(v => v + e.key)
  }, [submit, onClose])

  const FS  = Math.max(8, Math.round(H * 0.030))
  const FSs = Math.max(7, Math.round(H * 0.026))

  // Color per line type
  const lineColor = (type, idx) => {
    if (type === 'egg') {
      // dancing rainbow
      const hue = (idx * 47 + tick * 30) % 360
      return `hsl(${hue}, 100%, 68%)`
    }
    if (type === 'prompt') return 'rgba(60,255,140,0.95)'
    if (type === 'head')   return 'rgba(120,255,180,0.95)'
    if (type === 'hi')     return 'rgba(100,255,160,0.9)'
    if (type === 'cmd')    return 'rgba(60,220,130,0.8)'
    if (type === 'body')   return 'rgba(60,200,130,0.75)'
    if (type === 'dim')    return 'rgba(60,180,110,0.42)'
    if (type === 'err')    return 'rgba(255,100,100,0.85)'
    return 'rgba(60,200,130,0.7)'
  }

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={handleKey}
      style={{ width:W, height:H, background:'#00100a', fontFamily:'"Geist Mono","Fira Code","Courier New",monospace', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', outline:'none' }}
    >
      {/* scanlines */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:5, backgroundImage:'repeating-linear-gradient(0deg,rgba(0,0,0,0.13) 0px,rgba(0,0,0,0.13) 1px,transparent 1px,transparent 3px)' }}/>

      {/* title bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:`${Math.round(H*0.018)}px ${Math.round(W*0.025)}px`, borderBottom:'1px solid rgba(60,255,140,0.1)', flexShrink:0, background:'rgba(40,255,140,0.02)' }}>
        <div style={{ display:'flex', gap:5 }}>
          {['#ff5f57','#febc2e','#28c840'].map((c,i) => (
            <div key={i} onClick={i===0 ? onClose : undefined}
              style={{ width:7, height:7, borderRadius:'50%', background:c, cursor:i===0?'pointer':'default' }}/>
          ))}
        </div>
        <span style={{ fontSize:FSs, color:'rgba(60,255,140,0.35)', letterSpacing:'0.06em' }}>PRATHAM_OS — terminal</span>
        <span style={{ fontSize:FSs, color:'rgba(255,255,255,0.18)', cursor:'pointer' }} onClick={onClose}>ESC</span>
      </div>

      {/* output */}
      <div style={{ flex:1, overflowY:'auto', padding:`${Math.round(H*0.022)}px ${Math.round(W*0.03)}px ${Math.round(H*0.008)}px`, scrollbarWidth:'thin', scrollbarColor:'rgba(60,255,140,0.08) transparent' }}>
        {lines.map((line, i) => {
          // Dynamically update Uptime and Time lines
          let displayVal = line.v
          if (line.v && line.v.includes('Uptime')) displayVal = '  Uptime   ' + liveUptime
          if (line.v && line.v.includes('Time  ') && !line.v.includes('Uptime')) displayVal = '  Time     ' + liveTime
          return (
          <div key={i} style={{
            fontSize: FS,
            lineHeight: 1.68,
            color: lineColor(line.t, i),
            whiteSpace: 'pre',
            letterSpacing: '0.01em',
            fontWeight: line.t === 'egg' || line.t === 'head' ? 700 : 400,
          }}>{displayVal || '\u00A0'}</div>
          )
        })}
        <div ref={endRef}/>
      </div>

      {/* input */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:`${Math.round(H*0.015)}px ${Math.round(W*0.03)}px ${Math.round(H*0.02)}px`, borderTop:'1px solid rgba(60,255,140,0.08)', flexShrink:0 }}>
        <span style={{ fontSize:FS, color:'rgba(60,255,140,0.6)', fontWeight:700 }}>›</span>
        <span style={{ fontSize:FS, color:'rgba(60,255,140,0.92)', flex:1, whiteSpace:'pre', letterSpacing:'0.015em', minHeight:'1em' }}>
          {input}<span style={{ opacity:blink?1:0 }}>█</span>
        </span>
      </div>
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function CRTComputer({ x, y, width=220, active=true, isReturn=false, terminalOpen=false, onTerminalClose }) {
  // Use site-wide start time so uptime persists across scene transitions
  const W = width
  const H = Math.round(width * 0.58)
  // gap: 2% on all sides so screen never touches room edges or floor
  const GX = Math.round(W * 0.02)
  const GY = Math.round(H * 0.025)
  const IW = W - GX * 2
  const IH = H - GY * 2

  return (
    <div style={{ position:'absolute', left:x-W/2+GX, top:y-H+GY, width:IW, height:IH, zIndex:terminalOpen?20:2, overflow:'hidden', background:'#00100a' }}>
      {terminalOpen && onTerminalClose
        ? <TerminalUI W={IW} H={IH} onClose={onTerminalClose} mountTime={SITE_START_TIME}/>
        : <>
            <IdleCanvas W={IW} H={IH} isReturn={isReturn} mountTime={SITE_START_TIME}/>
            <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'repeating-linear-gradient(0deg,rgba(0,0,0,0.14) 0px,rgba(0,0,0,0.14) 1px,transparent 1px,transparent 3px)'}}/>
          </>
      }
    </div>
  )
}
