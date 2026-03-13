import { useState, useEffect } from 'react'
import { useGame } from '../hooks/useGameState'
import { SCENES, asset } from '../utils/constants'

const D = {
  name:     'Pratham Purohit',
  title:    'Full Stack Software Engineer',
  location: 'Satna, MP, India',
  email:    'prathampurohitonline@outlook.com',
  phone:    '+91 93172 77524',
  github:   'github.com/plutocrate',
  linkedin: 'linkedin.com/in/prathammpurohit',
  summary:  'Full-Stack Software Engineer with 2+ years of experience building interactive web applications and real-time browser systems. Skilled in React, TypeScript, Node.js, and Canvas/WebGL for high-performance frontends and scalable backend services. Passionate about browser-based games, geospatial simulations, and creative coding tools.',
  skills: {
    Languages: ['JavaScript', 'TypeScript', 'C', 'PHP', 'Shell'],
    Frontend:  ['React', 'Canvas API', 'WebGL', 'Three.js', 'Tailwind', 'SASS'],
    Backend:   ['Node.js', 'Express', 'REST APIs', 'PostgreSQL', 'MySQL', 'Redis'],
    Tools:     ['Git', 'Linux', 'Nginx', 'Figma', 'Aseprite', 'Adobe Mixamo'],
  },
  experience: [
    {
      role: 'Web Development Trainee',
      company: 'The Inviolate LLP',
      period: 'Mar 2025 — Nov 2025',
      location: 'Indore, MP',
      bullets: [
        'Collaborated with CTO to deliver production-grade web interfaces, translating product requirements into scalable frontend solutions.',
        'Built modular, reusable UI components using React and shadcn/ui with responsive design and performance optimization.',
        'Engineered an internal NAS-based file sharing system using repurposed hardware for centralized asset storage and secure backups.',
        'Contributed to agile workflows, prototyping and deploying features across internal and client-facing applications.',
      ],
    },
    {
      role: 'Open Source Contributor',
      company: 'GirlScript Summer of Code & Community Projects',
      period: 'May 2023 — Jan 2024',
      location: 'Remote',
      bullets: [
        'Core contributor to "Doctorverse" — a healthcare platform for real-time hospital bed availability in Chandigarh.',
        'Designed Figma UI prototypes and implemented responsive React interfaces with GSAP animations.',
        'Contributed to Monkeytype: developed a custom UI color theme and improved WPM calculation logic.',
      ],
    },
    {
      role: 'Web Development Intern',
      company: 'FirstUniv (AADDOO.AI)',
      period: 'Aug 2022 — Jan 2023',
      location: 'Solan, HP',
      bullets: [
        'Developed frontend modules for a university management platform handling student, faculty, and exam workflows.',
        'Built responsive UI using PHP, Bootstrap, AdminLTE3, JavaScript, and jQuery; integrated REST APIs across portal modules.',
        'Implemented algorithms for Program Outcome / Course Outcome evaluation and a classroom availability system.',
        'Improved UI interactions with lightweight micro-animations using JavaScript and p5.js.',
      ],
    },
    {
      role: 'Technical Assistant Intern',
      company: 'Shoolini University — Journalism Dept.',
      period: 'Feb 2022 — Jul 2022',
      location: 'Solan, HP',
      bullets: [
        'Managed and maintained the department digital dashboard and teacher-student portal for academic administration.',
        'Configured online classrooms, assignments, and examination workflows within the university platform.',
        'Provided technical support improving workflow efficiency for faculty and students.',
      ],
    },
    {
      role: 'Solo Split Keyboard Builder',
      company: 'Solopreneurship',
      period: 'Aug 2025 — Present',
      location: 'Satna, MP',
      bullets: [
        'Built and sold custom mechanical and split keyboards using RP2040, ESP, STM32, and Pro Micro microcontrollers.',
        'Designed keyboard cases, handled hardware assembly, flashed open-source firmware, and managed direct customer sales.',
      ],
    },
  ],
  projects: [
    {
      name: 'GTutor',
      year: 'Mar 2026',
      tech: 'Three.js · Node.js · TensorFlow.js · Ml5.js · React Three Fiber · TypeScript',
      desc: 'Gesture-based Guitar Tutor Web App — control the interface via hand gestures as a virtual mouse. Covers all notes, chords, scales, circle of fifths, real-time pitch detection, and a Free Jam mode with metronome.',
      link: 'https://www.linkedin.com/posts/activity-7437057168048091137-l_Ey',
    },
    {
      name: 'Baba Is You (Web)',
      year: 'Feb 2026',
      tech: 'React · TypeScript · HTML Canvas · Node.js · Express · PostgreSQL · Redis · Zustand',
      desc: 'Web fan concept of Baba Is You with full rule-manipulation puzzle mechanics, a level editor, community publishing, and a voting/ranking system for custom maps.',
      link: 'https://iluvbaba-production.up.railway.app/',
    },
    {
      name: 'MrPhony',
      year: 'Feb 2026',
      tech: 'TypeScript · React · Zustand · Redis',
      desc: 'Linux-terminal-style investigative web game. Players solve missing-person cases using real CLI commands and authentic topographic survey data from Uttarakhand converted into ASCII maps. 50 procedurally generated scenarios.',
      link: 'https://plutocrate.github.io/mrphony/',
    },
  ],
  education: {
    degree: 'B.Tech — Computer Science, AI',
    school: 'Shoolini University, Solan, HP',
    year:   'Aug 2021 — Jul 2025',
  },
}

const C = {
  bg:         '#090909',
  surface:    '#101010',
  surfaceHov: '#161616',
  line:       'rgba(255,255,255,0.06)',
  lineMd:     'rgba(255,255,255,0.10)',
  white:      '#ffffff',
  hi:         'rgba(255,255,255,0.82)',
  mid:        'rgba(255,255,255,0.78)',
  low:        'rgba(255,255,255,0.55)',
  xlow:       'rgba(255,255,255,0.32)',
  F:          '"Syne", sans-serif',
  B:          '"Inter", sans-serif',
}

export default function ResumeScene({ onBack = null, embedded = false }) {
  const { dispatch } = useGame()
  const [in_, setIn] = useState(false)
  const [mob, setMob] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setIn(true), 40)
    const checkMob = () => setMob(window.innerWidth <= 768)
    checkMob()
    window.addEventListener('resize', checkMob)
    return () => { clearTimeout(t); window.removeEventListener('resize', checkMob) }
  }, [])

  const goBack = () => {
    if (onBack) onBack()
    else dispatch({ type: 'SET_SCENE', scene: SCENES.INTRO_MENU, direction: -1 })
  }

  return (
    <div
      className="allow-scroll"
      style={{
        position: 'absolute', inset: 0,
        overflowY: 'auto', overflowX: 'hidden',
        background: C.bg, color: C.white, fontFamily: C.B,
        opacity: in_ ? 1 : 0, transition: 'opacity 0.45s ease',
        scrollbarWidth: 'thin', scrollbarColor: `${C.xlow} transparent`,
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
      }}>
      <style>{`
        *::-webkit-scrollbar{width:3px}
        *::-webkit-scrollbar-track{background:transparent}
        *::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:2px}
      `}</style>

      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: mob ? '0 16px' : '0 clamp(24px,5vw,72px)',
        height: mob ? '52px' : '60px',
        background: 'rgba(9,9,9,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.line}`,
      }}>
        <BackButton onClick={goBack} />
        <span style={{ fontFamily: C.F, fontWeight: 600, fontSize: mob ? '11px' : '13px', color: C.low, letterSpacing: '-0.01em' }}>
          {D.name}
        </span>
        <DownloadBtn mob={mob} />
      </nav>

      <main style={{
        maxWidth: '800px', margin: '0 auto',
        padding: mob
          ? '28px 16px 80px'
          : 'clamp(48px,8vw,96px) clamp(24px,5vw,72px) 120px',
      }}>

        <header style={{ marginBottom: mob ? '40px' : '80px' }}>
          <p style={{ fontFamily: C.B, fontSize: '10px', fontWeight: 400, color: C.low, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: mob ? '12px' : '24px' }}>
            {D.location}
          </p>
          <h1 style={{ fontFamily: C.F, fontWeight: 800, fontSize: mob ? '32px' : 'clamp(44px,7vw,80px)', color: C.white, lineHeight: 0.96, letterSpacing: '-0.035em', marginBottom: mob ? '12px' : '20px' }}>
            {D.name}
          </h1>
          <p style={{ fontFamily: C.F, fontWeight: 500, fontSize: mob ? '14px' : 'clamp(17px,2.2vw,22px)', color: C.mid, letterSpacing: '-0.01em', marginBottom: mob ? '20px' : '40px' }}>
            {D.title}
          </p>

          {/* Contact links — stack on mobile */}
          <div style={{
            display: 'flex',
            flexDirection: mob ? 'column' : 'row',
            flexWrap: mob ? 'nowrap' : 'wrap',
            gap: mob ? '0' : '0 28px',
            borderTop: `1px solid ${C.line}`,
            borderBottom: `1px solid ${C.line}`,
          }}>
            {[
              { label: D.email,    href: `mailto:${D.email}` },
              { label: D.phone,    href: `tel:${D.phone}` },
              { label: D.github,   href: `https://${D.github}` },
              { label: D.linkedin, href: `https://${D.linkedin}` },
            ].map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer"
                style={{
                  fontFamily: C.B,
                  fontSize: mob ? '12px' : '14px',
                  fontWeight: 400, color: C.mid,
                  textDecoration: 'none',
                  padding: mob ? '10px 0' : '13px 0',
                  borderBottom: mob ? `1px solid ${C.line}` : 'none',
                  transition: 'color 0.16s',
                  display: 'block',
                }}
                onTouchStart={e => e.currentTarget.style.color = C.white}
                onTouchEnd={e => e.currentTarget.style.color = C.mid}
                onMouseEnter={e => e.currentTarget.style.color = C.white}
                onMouseLeave={e => e.currentTarget.style.color = C.mid}
              >{label}</a>
            ))}
          </div>

          <p style={{
            fontFamily: C.B, fontWeight: 300,
            fontSize: mob ? '13px' : '17px',
            lineHeight: 1.85, color: C.mid,
            marginTop: mob ? '20px' : '36px',
            maxWidth: '600px',
          }}>
            {D.summary}
          </p>
        </header>

        <Sect label="Experience" mob={mob}>
          {D.experience.map((e, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: mob ? '1fr' : 'minmax(100px,150px) 1fr',
              gap: mob ? '4px' : '0 40px',
              padding: mob ? '24px 0' : '40px 0',
              borderBottom: i < D.experience.length - 1 ? `1px solid ${C.line}` : 'none',
            }}>
              <div style={{ paddingTop: '3px', marginBottom: mob ? '8px' : 0 }}>
                <p style={{ fontFamily: C.B, fontSize: '12px', color: C.low, lineHeight: 1.7, marginBottom: '2px' }}>{e.period}</p>
                <p style={{ fontFamily: C.B, fontSize: '12px', color: C.xlow }}>{e.location}</p>
              </div>
              <div>
                <h3 style={{ fontFamily: C.F, fontWeight: 700, fontSize: mob ? '16px' : '20px', color: C.white, letterSpacing: '-0.02em', marginBottom: '4px' }}>{e.role}</h3>
                <p style={{ fontFamily: C.B, fontSize: mob ? '13px' : '15px', fontWeight: 400, color: C.low, marginBottom: mob ? '12px' : '20px' }}>{e.company}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: mob ? '8px' : '10px' }}>
                  {e.bullets.map((b, j) => (
                    <li key={j} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: C.xlow, flexShrink: 0, marginTop: '7px' }} />
                      <span style={{ fontFamily: C.B, fontSize: mob ? '13px' : '16px', fontWeight: 400, color: C.mid, lineHeight: 1.75 }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </Sect>

        <Sect label="Projects" mob={mob}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.line, borderRadius: '6px', overflow: 'hidden' }}>
            {D.projects.map((p, i) => <ProjectRow key={i} p={p} mob={mob} />)}
          </div>
        </Sect>

        <Sect label="Skills" mob={mob}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: mob ? 'repeat(2, 1fr)' : 'repeat(auto-fit,minmax(150px,1fr))',
            gap: mob ? '24px 16px' : '36px 28px',
          }}>
            {Object.entries(D.skills).map(([cat, items]) => (
              <div key={cat}>
                <p style={{ fontFamily: C.B, fontSize: '11px', fontWeight: 600, color: C.xlow, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '10px' }}>{cat}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {items.map(s => (
                    <span key={s} style={{ fontFamily: C.B, fontSize: mob ? '13px' : '16px', fontWeight: 400, color: C.mid }}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Sect>

        <Sect label="Education" mob={mob}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: mob ? '1fr' : 'minmax(100px,150px) 1fr',
            gap: mob ? '4px' : '0 40px',
            padding: mob ? '20px 0' : '32px 0',
          }}>
            <p style={{ fontFamily: C.B, fontSize: '12px', color: C.low, paddingTop: '4px', marginBottom: mob ? '8px' : 0 }}>{D.education.year}</p>
            <div>
              <h3 style={{ fontFamily: C.F, fontWeight: 700, fontSize: mob ? '15px' : '18px', color: C.white, letterSpacing: '-0.02em', marginBottom: '5px' }}>{D.education.degree}</h3>
              <p style={{ fontFamily: C.B, fontSize: mob ? '13px' : '15px', color: C.low }}>{D.education.school}</p>
            </div>
          </div>
        </Sect>

      </main>
    </div>
  )
}

function Sect({ label, children, mob }) {
  return (
    <section style={{ marginBottom: mob ? '40px' : '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: mob ? '20px' : '36px' }}>
        <h2 style={{ fontFamily: '"Inter",sans-serif', fontSize: '11px', fontWeight: 600, color: C.xlow, letterSpacing: '0.18em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {label}
        </h2>
        <div style={{ flex: 1, height: '1px', background: C.line }} />
      </div>
      {children}
    </section>
  )
}

function ProjectRow({ p, mob }) {
  const [hov, setHov] = useState(false)
  return (
    <a href={p.link} target="_blank" rel="noreferrer"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onTouchStart={() => setHov(true)} onTouchEnd={() => setHov(false)}
      style={{
        display: 'flex', alignItems: mob ? 'flex-start' : 'center',
        justifyContent: 'space-between', gap: mob ? '12px' : '24px',
        padding: mob ? '16px' : '26px 28px',
        background: hov ? C.surfaceHov : C.surface,
        textDecoration: 'none', transition: 'background 0.2s ease', cursor: 'pointer',
      }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <h3 style={{ fontFamily: '"Syne",sans-serif', fontWeight: 700, fontSize: mob ? '14px' : '16px', color: C.white, letterSpacing: '-0.01em' }}>{p.name}</h3>
          <span style={{ fontFamily: '"Inter",sans-serif', fontSize: '12px', color: C.xlow }}>{p.year}</span>
        </div>
        <p style={{ fontFamily: '"Inter",sans-serif', fontSize: mob ? '12px' : '15px', fontWeight: 400, color: C.mid, lineHeight: 1.7, marginBottom: '8px' }}>{p.desc}</p>
        <p style={{ fontFamily: '"Inter",sans-serif', fontSize: mob ? '11px' : '13px', color: C.xlow, letterSpacing: '0.03em' }}>{p.tech}</p>
      </div>
      <span style={{ fontSize: '16px', color: C.low, opacity: hov ? 1 : 0.4, flexShrink: 0, marginTop: mob ? '2px' : 0 }}>↗</span>
    </a>
  )
}

function BackButton({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: '"Inter",sans-serif', fontSize: '13px', fontWeight: 400,
        color: hov ? C.white : C.mid, padding: '8px 0', transition: 'color 0.18s',
        touchAction: 'manipulation',
      }}>
      <span style={{ fontSize: '15px', display: 'inline-block', transform: hov ? 'translateX(-2px)' : 'translateX(0)', transition: 'transform 0.18s' }}>←</span>
      Back
    </button>
  )
}

function DownloadBtn({ mob }) {
  const [hov, setHov] = useState(false)
  return (
    <a href={asset('/assets/pratham_purohit_resume.pdf')} download
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onTouchStart={() => setHov(true)} onTouchEnd={() => setHov(false)}
      style={{
        fontFamily: '"Inter",sans-serif',
        fontSize: mob ? '11px' : '12px',
        fontWeight: 500,
        color: hov ? '#000' : C.mid,
        background: hov ? C.white : 'transparent',
        border: `1px solid ${hov ? C.white : C.lineMd}`,
        borderRadius: '4px',
        padding: mob ? '6px 10px' : '7px 14px',
        cursor: 'pointer', letterSpacing: '0.01em',
        transition: 'all 0.2s ease',
        textDecoration: 'none', display: 'inline-block',
        touchAction: 'manipulation',
        whiteSpace: 'nowrap',
      }}>
      {mob ? '↓ PDF' : 'Download PDF'}
    </a>
  )
}
