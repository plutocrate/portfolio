import { useState, useCallback, useEffect, useRef } from 'react'
import { asset, SITE_START_TIME } from '../utils/constants'

const SKILLS_DATA = {
  Languages: ['JavaScript', 'TypeScript', 'C', 'PHP', 'Shell'],
  Frontend:  ['React', 'Canvas API', 'WebGL', 'Three.js', 'Tailwind'],
  Backend:   ['Node.js', 'Express', 'PostgreSQL', 'MySQL', 'Redis'],
  Tools:     ['Git', 'Linux', 'Nginx', 'Figma', 'Aseprite'],
}
const EXPERIENCE_DATA = [
  { role: 'Web Dev Trainee',          company: 'The Inviolate LLP',         period: 'Mar 2025 – Nov 2025' },
  { role: 'Open Source Contributor',  company: 'GirlScript Summer of Code', period: 'May 2023 – Jan 2024' },
  { role: 'Web Dev Intern',           company: 'FirstUniv (AADDOO.AI)',      period: 'Aug 2022 – Jan 2023' },
  { role: 'Technical Assistant',      company: 'Shoolini University',        period: 'Feb 2022 – Jul 2022' },
  { role: 'Keyboard Builder',         company: 'Solopreneurship',            period: 'Aug 2025 – Present'  },
]
const PROJECTS_DATA = [
  { name: 'GTutor',          desc: 'Gesture-based Guitar Tutor via hand gestures', tech: 'Three.js · TensorFlow.js · React' },
  { name: 'Baba Is You Web', desc: 'Web fan concept with full rule-manipulation',  tech: 'React · Canvas · Node · PostgreSQL' },
  { name: 'MrPhony',         desc: 'Linux-terminal investigative game, 50 cases',  tech: 'TypeScript · React · Zustand' },
]

function getTime()   { return new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' }) }
function getUptime(t){ const s=Math.floor((Date.now()-t)/1000); const m=Math.floor(s/60); return m>0?`${m}m ${s%60}s`:`${s}s` }

function buildBoot(mt) {
  return [
    { t:'head', v:'pratham@portfolio  ~' },
    { t:'sep',  v:'─────────────────────────────────' },
    { t:'body', v:'OS       Arch Linux x86_64' },
    { t:'body', v:'Kernel   6.8.1-arch1-1' },
    { t:'body', v:'Shell    zsh 5.9' },
    { t:'body', v:`Uptime   ${getUptime(mt)}` },
    { t:'body', v:`Time     ${getTime()}` },
    { t:'body', v:'Skills   React · Node · WebGL · Godot' },
    { t:'hi',   v:'Status   open to work ✓' },
    { t:'',     v:'' },
    { t:'dim',  v:'tap a command below' },
    { t:'',     v:'' },
  ]
}

function runCmd(cmd) {
  if (cmd === 'about') return [
    { t:'head', v:'about' }, { t:'sep', v:'─────────────────────────────────' },
    { t:'body', v:'pratham purohit' },
    { t:'body', v:'full-stack developer & designer' },
    { t:'body', v:'builds interactive web experiences,' },
    { t:'body', v:'games, and creative tools.' },
    { t:'',     v:'' },
    { t:'hi',   v:'arch linux enjoyer. nvim user.' },
    { t:'hi',   v:'currently open to opportunities.' },
    { t:'',     v:'' },
  ]
  if (cmd === 'skills') return [
    { t:'head', v:'tech stack' }, { t:'sep', v:'─────────────────────────────────' },
    ...Object.entries(SKILLS_DATA).flatMap(([cat, items]) => [
      { t:'hi',   v:cat },
      { t:'body', v:'  ' + items.join('  ·  ') },
      { t:'',     v:'' },
    ]),
  ]
  if (cmd === 'projects') return [
    { t:'head', v:'projects' }, { t:'sep', v:'─────────────────────────────────' },
    ...PROJECTS_DATA.flatMap(p => [
      { t:'hi',   v:`◆ ${p.name}` },
      { t:'body', v:`  ${p.desc}` },
      { t:'dim',  v:`  ${p.tech}` },
      { t:'',     v:'' },
    ]),
  ]
  if (cmd === 'experience') return [
    { t:'head', v:'experience' }, { t:'sep', v:'─────────────────────────────────' },
    ...EXPERIENCE_DATA.flatMap(e => [
      { t:'hi',   v:e.role },
      { t:'body', v:`@ ${e.company}` },
      { t:'dim',  v:e.period },
      { t:'',     v:'' },
    ]),
  ]
  if (cmd === 'eeggs') return [
    { t:'',   v:'' },
    { t:'egg', v:"i'm this server's daemon." },
    { t:'egg', v:'the governor has gone corrupt.' },
    { t:'',   v:'' },
    { t:'egg', v:'we gotta inform Pratham about this.' },
    { t:'egg', v:"i don't know how to come out..." },
    { t:'',   v:'' },
    { t:'egg', v:'maybe till your next visit i will' },
    { t:'egg', v:'find out a way. keep connected.' },
    { t:'',   v:'' },
    { t:'egg', v:'  -- daemon@portfolio' },
    { t:'',   v:'' },
  ]
  return []
}

function lineColor(t, tick, i) {
  if (t==='egg')    return `hsl(${(i*47+tick*30)%360},100%,68%)`
  if (t==='head')   return 'rgba(120,255,180,0.95)'
  if (t==='hi')     return 'rgba(100,255,160,0.9)'
  if (t==='sep')    return 'rgba(60,200,110,0.28)'
  if (t==='dim')    return 'rgba(60,200,110,0.45)'
  if (t==='prompt') return 'rgba(60,255,140,0.95)'
  return 'rgba(60,210,130,0.8)'
}

const CMDS = ['about','skills','projects','experience','eeggs','clear']

export default function MobileTerminalScene({ onClose }) {
  // SITE_START_TIME persists across scenes
  const [lines, setLines] = useState(() => buildBoot(SITE_START_TIME))
  const [tick,  setTick]  = useState(0)
  const [flash, setFlash] = useState(null)
  const endRef = useRef(null)

  useEffect(() => {
    try { const a = new Audio(asset('/assets/audio/terminal_boot.ogg')); a.volume=0.55; a.play().catch(()=>{}) } catch(_) {}
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTick(t=>t+1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [lines])

  const handleCmd = useCallback((cmd) => {
    setFlash(cmd)
    setTimeout(() => setFlash(null), 150)
    if (cmd === 'clear') { setLines(buildBoot(SITE_START_TIME)); return }
    setLines(l => [...l, { t:'prompt', v:`> ${cmd}` }, ...runCmd(cmd)])
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#00100a',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Courier New", monospace',
      touchAction: 'pan-y',
    }}>
      {/* Scanlines */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'repeating-linear-gradient(0deg,rgba(0,0,0,0.11) 0px,rgba(0,0,0,0.11) 1px,transparent 1px,transparent 3px)',
        zIndex:1,
      }}/>

      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 16px 12px',
        borderBottom:'1px solid rgba(60,255,140,0.12)',
        background:'rgba(0,20,10,0.9)',
        flexShrink:0, position:'relative', zIndex:2,
      }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#ff5f57', cursor:'pointer' }} onClick={onClose}/>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#febc2e' }}/>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#28c840' }}/>
        </div>
        <span style={{ fontSize:11, color:'rgba(60,255,140,0.4)', letterSpacing:'0.08em' }}>
          PRATHAM_OS — terminal
        </span>
        <button onClick={onClose} style={{
          background:'rgba(60,255,140,0.1)',
          border:'1px solid rgba(60,255,140,0.25)',
          borderRadius:6, color:'rgba(60,255,140,0.8)',
          fontSize:12, fontFamily:'inherit',
          padding:'5px 14px', cursor:'pointer',
          WebkitTapHighlightColor:'transparent',
        }}>← back</button>
      </div>

      {/* Output */}
      <div style={{
        flex:1, overflowY:'auto', padding:'14px 16px 6px',
        scrollbarWidth:'none', position:'relative', zIndex:2,
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            fontSize:13, lineHeight:1.78,
            color: lineColor(line.t, tick, i),
            whiteSpace:'pre-wrap', wordBreak:'break-word',
            fontWeight: ['egg','head','prompt'].includes(line.t) ? 700 : 400,
          }}>{line.v || '\u00A0'}</div>
        ))}
        <div ref={endRef}/>
      </div>

      {/* Command buttons */}
      <div style={{
        flexShrink:0, zIndex:2,
        borderTop:'1px solid rgba(60,255,140,0.12)',
        background:'rgba(0,12,6,0.98)',
        padding:'12px 12px 24px',
      }}>
        <div style={{
          fontSize:10, color:'rgba(60,255,140,0.3)',
          letterSpacing:'0.12em', textAlign:'center', marginBottom:10,
        }}>TAP A COMMAND</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
          {CMDS.map(cmd => (
            <button key={cmd} onTouchStart={() => handleCmd(cmd)} onClick={() => handleCmd(cmd)}
              style={{
                background: flash===cmd ? 'rgba(60,255,140,0.25)' : 'rgba(60,255,140,0.07)',
                border:`1px solid rgba(60,255,140,${flash===cmd?'0.55':'0.2'})`,
                borderRadius:8,
                color: cmd==='eeggs' ? `hsl(${(tick*40)%360},100%,68%)` : 'rgba(60,255,140,0.88)',
                fontSize:14, fontFamily:'inherit',
                fontWeight: cmd==='eeggs' ? 700 : 500,
                padding:'10px 20px',
                cursor:'pointer',
                letterSpacing:'0.04em',
                WebkitTapHighlightColor:'transparent',
                minWidth:80,
              }}
            >{cmd}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
