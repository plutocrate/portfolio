import { useState, useEffect, useRef, useCallback } from 'react'
import emailjs from '@emailjs/browser'

const DIALOGUE = {
  intro:      "I created this world. I know a little uncooked, but I'm working on it. Anyways, I work for Pratham, he rented me this place. What can I do for you?",
  emailForm:  "and your message is.....",
  emailSent:  "And.... sent.",
  resumeBack: "wasn't I right about him? anything more at your service",
  emailErr:   "hmm... something broke. try again?",
}

const isMobile = () =>
  /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (typeof window !== 'undefined' && window.innerWidth <= 1024 && 'ontouchstart' in window)

// Typewriter hook
function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(id); setDone(true) }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return { displayed, done }
}

export default function GovernorHUD({ onClose, onResumeOpen, onAnimState, resumeBack, onRhythmBattle }) {
  const [dialogue,  setDialogue]  = useState(resumeBack ? DIALOGUE.resumeBack : DIALOGUE.intro)
  const [view,      setView]      = useState('menu')
  const [emailData, setEmailData] = useState({ name: '', email: '', message: '' })
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const mob = isMobile()
  const { displayed, done } = useTypewriter(dialogue, 14)

  useEffect(() => { requestAnimationFrame(() => setMounted(true)) }, [])

  const sendEmail = async () => {
    if (!emailData.name || !emailData.email || !emailData.message) return
    setSending(true)
    try {
      await emailjs.send(
        'service_06d6y58', 'template_kfcibfh',
        { from_name: emailData.name, from_email: emailData.email, message: emailData.message, to_email: 'prathampurohitonline@outlook.com' },
        'HgsszHkvHyhtMtI--'
      )
      setSent(true); setView('menu')
      setDialogue(DIALOGUE.emailSent); onAnimState('happy')
    } catch (err) { setDialogue(DIALOGUE.emailErr) }
    setSending(false)
  }

  const allFilled = emailData.name && emailData.email && emailData.message

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: mounted
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -48%) scale(0.97)',
          opacity: mounted ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
          width: Math.min(window.innerWidth * (mob ? 0.94 : 0.88), 580),
          maxHeight: mob ? '88vh' : '85vh',
          overflowY: 'auto',
          zIndex: 100,
          // Deep dark glass — the hero aesthetic
          background: 'rgba(9,11,17,0.92)',
          backdropFilter: 'blur(40px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 32px 80px rgba(0,0,0,0.7),
            0 0 120px rgba(139,92,246,0.08)
          `,
          scrollbarWidth: 'none',
          touchAction: 'pan-y',
        }}
      >
        {/* Ambient top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(99,179,237,0.4), transparent)',
          borderRadius: 1,
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: mob ? '14px 18px' : '18px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Status dot */}
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#4ade80',
              boxShadow: '0 0 8px #4ade80, 0 0 16px rgba(74,222,128,0.4)',
              animation: 'hud-pulse 2s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: '"Geist Mono", "Fira Code", monospace',
              fontSize: mob ? 9 : 10,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}>Governor</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: 13,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            }}
          >✕</button>
        </div>

        {/* Dialogue box */}
        <div style={{ padding: mob ? '20px 18px 16px' : '28px 24px 20px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: mob ? '14px 16px' : '18px 20px',
            minHeight: mob ? 80 : 100,
            position: 'relative',
          }}>
            {/* Decorative corner */}
            <div style={{
              position: 'absolute', top: 10, left: 10,
              width: 16, height: 16,
              borderTop: '1.5px solid rgba(139,92,246,0.5)',
              borderLeft: '1.5px solid rgba(139,92,246,0.5)',
              borderRadius: '3px 0 0 0',
            }} />
            <div style={{
              position: 'absolute', bottom: 10, right: 10,
              width: 16, height: 16,
              borderBottom: '1.5px solid rgba(99,179,237,0.5)',
              borderRight: '1.5px solid rgba(99,179,237,0.5)',
              borderRadius: '0 0 3px 0',
            }} />

            <p style={{
              fontFamily: '"Geist Mono", "Fira Code", monospace',
              fontSize: mob ? 12 : 14,
              fontWeight: 400,
              lineHeight: 1.9,
              color: 'rgba(255,255,255,0.82)',
              margin: 0,
              letterSpacing: '0.015em',
            }}>
              {displayed}
              {!done && (
                <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'rgba(139,92,246,0.9)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'hud-blink .7s step-end infinite' }} />
              )}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: mob ? '0 18px' : '0 24px' }} />

        {/* Options / Form */}
        <div style={{ padding: mob ? '16px 18px 20px' : '20px 24px 28px' }}>

          {view === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: mob ? 6 : 8 }}>
              <GhostOption
                index={0}
                label={sent ? '✓ message delivered' : 'Reach out to Pratham? I will deliver your message.'}
                disabled={sent}
                onClick={() => { setView('email'); setDialogue(DIALOGUE.emailForm); onAnimState('idle') }}
                mob={mob}
              />
              <GhostOption
                index={1}
                label="The lad got a good resume, wanna see?"
                onClick={() => { onResumeOpen(); onAnimState('happy') }}
                mob={mob}
              />
              {mob ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: mob ? '10px 14px' : '12px 16px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.04)',
                  opacity: 0.4,
                }}>
                  <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '.05em' }}>02</span>
                  <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: mob ? 11 : 13, color: 'rgba(255,255,255,0.25)', flex: 1 }}>let's play a rhythm game?</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '2px 6px', fontFamily: 'monospace', letterSpacing: '.05em' }}>PC only</span>
                </div>
              ) : (
                <GhostOption
                  index={2}
                  label="let's play a rhythm game?"
                  onClick={() => { onClose(); onRhythmBattle && onRhythmBattle() }}
                  mob={mob}
                  accent
                />
              )}
            </div>
          )}

          {view === 'email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: mob ? 8 : 10 }}>
              <DarkInput
                placeholder="your name"
                value={emailData.name}
                onChange={v => setEmailData(p => ({ ...p, name: v }))}
                mob={mob}
              />
              <DarkInput
                placeholder="your email"
                type="email"
                value={emailData.email}
                onChange={v => setEmailData(p => ({ ...p, email: v }))}
                mob={mob}
              />
              <DarkTextarea
                placeholder="your message..."
                value={emailData.message}
                onChange={v => setEmailData(p => ({ ...p, message: v }))}
                rows={mob ? 3 : 5}
                mob={mob}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => { setView('menu'); setDialogue(DIALOGUE.intro) }}
                  style={ghostBtn(mob, false)}
                  onMouseEnter={e => applyHover(e, false)}
                  onMouseLeave={e => removeHover(e, false)}
                >← back</button>
                <button
                  onClick={sendEmail}
                  disabled={sending || !allFilled}
                  style={sendBtn(mob, allFilled && !sending)}
                  onMouseEnter={e => { if (allFilled && !sending) e.currentTarget.style.background = 'rgba(139,92,246,0.28)' }}
                  onMouseLeave={e => { if (allFilled && !sending) e.currentTarget.style.background = 'rgba(139,92,246,0.14)' }}
                >
                  {sending ? (
                    <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ display:'inline-block', width:12, height:12, border:'1.5px solid rgba(255,255,255,0.3)', borderTopColor:'rgba(255,255,255,0.8)', borderRadius:'50%', animation:'hud-spin .7s linear infinite' }} />
                      sending
                    </span>
                  ) : 'send message →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ambient bottom shimmer */}
        <div style={{
          position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(99,179,237,0.3), transparent)',
        }} />
      </div>

      <style>{`
        @keyframes hud-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.5; transform:scale(.8); }
        }
        @keyframes hud-blink {
          0%,100% { opacity:1; }
          50%      { opacity:0; }
        }
        @keyframes hud-spin {
          to { transform:rotate(360deg); }
        }
        @keyframes hud-slide-in {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes hud-scan {
          0%   { transform: translateY(-100%); opacity:0.6; }
          100% { transform: translateY(100%);  opacity:0; }
        }
      `}</style>
    </>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function GhostOption({ label, onClick, disabled, mob, index, accent }) {
  const [hover,  setHover]  = useState(false)
  const [active, setActive] = useState(false)
  const num = String(index).padStart(2, '0')

  // Each button gets a unique accent colour cycling through the palette
  const PALETTE = [
    { line: '#a78bfa', fill: 'rgba(139,92,246,0.12)', text: '#c4b5fd', corner: '#7c3aed' },
    { line: '#67e8f9', fill: 'rgba(103,232,249,0.10)', text: '#a5f3fc', corner: '#0891b2' },
    { line: '#86efac', fill: 'rgba(134,239,172,0.10)', text: '#bbf7d0', corner: '#16a34a' },
  ]
  const pal = disabled
    ? { line: 'rgba(255,255,255,0.1)', fill: 'transparent', text: 'rgba(255,255,255,0.25)', corner: 'rgba(255,255,255,0.12)' }
    : PALETTE[index % PALETTE.length]

  const C = 7   // corner bracket size px
  const T = 1.5 // corner line thickness px

  const cornerStyle = (pos) => {
    const isTop    = pos.includes('top')
    const isLeft   = pos.includes('left')
    return {
      position: 'absolute',
      [isTop  ? 'top'    : 'bottom']: 0,
      [isLeft ? 'left'   : 'right']:  0,
      width:  C, height: C,
      borderTop:    isTop  ? `${T}px solid ${hover && !disabled ? pal.line : 'rgba(255,255,255,0.18)'}` : 'none',
      borderBottom: !isTop ? `${T}px solid ${hover && !disabled ? pal.line : 'rgba(255,255,255,0.18)'}` : 'none',
      borderLeft:   isLeft ? `${T}px solid ${hover && !disabled ? pal.line : 'rgba(255,255,255,0.18)'}` : 'none',
      borderRight:  !isLeft? `${T}px solid ${hover && !disabled ? pal.line : 'rgba(255,255,255,0.18)'}` : 'none',
      transition: 'border-color 0.22s ease, width 0.22s ease, height 0.22s ease',
      ...(hover && !disabled ? { width: C + 4, height: C + 4 } : {}),
      zIndex: 2, pointerEvents: 'none',
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        animation: `hud-slide-in 0.4s cubic-bezier(0.22,1,0.36,1) ${index * 0.09}s both`,
      }}
    >
      <button
        onMouseEnter={() => !disabled && setHover(true)}
        onMouseLeave={() => { setHover(false); setActive(false) }}
        onMouseDown={()  => !disabled && setActive(true)}
        onMouseUp={()    => setActive(false)}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        style={{
          position:   'relative',
          display:    'flex',
          alignItems: 'center',
          gap: 14,
          width:  '100%',
          textAlign: 'left',
          padding: mob ? '12px 16px' : '15px 18px',
          borderRadius: 2,
          cursor:  disabled ? 'default' : 'pointer',
          border:  'none',
          outline: 'none',
          overflow: 'hidden',
          // Background: solid fill slides in from left on hover
          background: hover && !disabled ? pal.fill : 'transparent',
          transition: 'background 0.28s ease, transform 0.12s ease',
          transform: active ? 'scale(0.985)' : 'scale(1)',
        }}
      >
        {/* Thin full border — subtle always-on */}
        <div style={{
          position: 'absolute', inset: 0,
          border: `1px solid ${hover && !disabled ? pal.line : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 2,
          transition: 'border-color 0.22s ease',
          pointerEvents: 'none',
          boxShadow: hover && !disabled ? `0 0 20px -4px ${pal.line}55, inset 0 0 20px -8px ${pal.line}22` : 'none',
        }} />

        {/* Corner brackets — grow on hover */}
        <div style={cornerStyle('top-left')} />
        <div style={cornerStyle('top-right')} />
        <div style={cornerStyle('bottom-left')} />
        <div style={cornerStyle('bottom-right')} />

        {/* Horizontal scan line that wipes across on hover */}
        <div style={{
          position: 'absolute',
          top: 0, bottom: 0,
          left: 0,
          width: hover && !disabled ? '100%' : '0%',
          background: `linear-gradient(90deg, transparent, ${pal.line}18, transparent)`,
          transition: 'width 0.38s cubic-bezier(0.22,1,0.36,1)',
          pointerEvents: 'none',
        }} />

        {/* Index tag */}
        <span style={{
          fontFamily: '"Geist Mono", "Fira Code", monospace',
          fontSize: 8, fontWeight: 700,
          letterSpacing: '.14em',
          color: disabled ? 'rgba(255,255,255,0.15)'
               : hover    ? pal.text
               :            'rgba(255,255,255,0.2)',
          flexShrink: 0, minWidth: 18,
          transition: 'color 0.22s',
        }}>
          {disabled ? '✓' : `_${num}`}
        </span>

        {/* Vertical rule */}
        <div style={{
          width: T, flexShrink: 0,
          alignSelf: 'stretch',
          background: hover && !disabled
            ? `linear-gradient(to bottom, transparent, ${pal.line}, transparent)`
            : 'rgba(255,255,255,0.07)',
          transition: 'background 0.22s',
        }} />

        {/* Label */}
        <span style={{
          fontFamily: '"Geist Mono", "Fira Code", monospace',
          fontSize: mob ? 11 : 13,
          fontWeight: 400,
          color: disabled    ? 'rgba(255,255,255,0.22)'
               : hover       ? 'rgba(255,255,255,0.98)'
               :               'rgba(255,255,255,0.6)',
          flex: 1,
          transition: 'color 0.22s',
          letterSpacing: '0.015em',
          lineHeight: 1.4,
          position: 'relative',
        }}>{label}</span>

        {/* Arrow — two-part, double chevron effect */}
        {!disabled && (
          <span style={{
            fontFamily: 'monospace',
            fontSize: 15,
            color: hover ? pal.text : 'rgba(255,255,255,0.15)',
            flexShrink: 0,
            display: 'inline-flex', gap: hover ? 1 : -4,
            transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
            transform: hover ? 'translateX(4px)' : 'translateX(0)',
            letterSpacing: hover ? '0px' : '-4px',
          }}>››</span>
        )}
      </button>
    </div>
  )
}

function DarkInput({ placeholder, value, onChange, type = 'text', mob }) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{
      position: 'relative',
      border: `1px solid ${focus ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 8,
      background: focus ? 'rgba(139,92,246,0.04)' : 'rgba(255,255,255,0.03)',
      transition: 'all 0.18s',
      boxShadow: focus ? '0 0 0 3px rgba(139,92,246,0.12)' : 'none',
    }}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'transparent', border: 'none', outline: 'none',
          padding: mob ? '10px 14px' : '12px 16px',
          fontFamily: '"Geist Mono", "Fira Code", monospace',
          fontSize: mob ? 12 : 13,
          color: 'rgba(255,255,255,0.88)',
          letterSpacing: '0.02em',
        }}
      />
    </div>
  )
}

function DarkTextarea({ placeholder, value, onChange, rows, mob }) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{
      border: `1px solid ${focus ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 8,
      background: focus ? 'rgba(139,92,246,0.04)' : 'rgba(255,255,255,0.03)',
      transition: 'all 0.18s',
      boxShadow: focus ? '0 0 0 3px rgba(139,92,246,0.12)' : 'none',
    }}>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        rows={rows}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'transparent', border: 'none', outline: 'none',
          resize: 'none',
          padding: mob ? '10px 14px' : '12px 16px',
          fontFamily: '"Geist Mono", "Fira Code", monospace',
          fontSize: mob ? 12 : 13,
          color: 'rgba(255,255,255,0.88)',
          letterSpacing: '0.02em',
          lineHeight: 1.7,
        }}
      />
    </div>
  )
}

const ghostBtn = (mob, _) => ({
  flex: 1,
  padding: mob ? '10px 14px' : '12px 16px',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: 'rgba(255,255,255,0.5)',
  fontFamily: '"Geist Mono", "Fira Code", monospace',
  fontSize: mob ? 11 : 12,
  cursor: 'pointer',
  transition: 'all 0.18s',
  letterSpacing: '0.04em',
})
const applyHover = (e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }
const removeHover = (e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }

const sendBtn = (mob, active) => ({
  flex: 2,
  padding: mob ? '10px 14px' : '12px 20px',
  borderRadius: 8,
  background: active ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.04)',
  border: `1px solid ${active ? 'rgba(139,92,246,0.45)' : 'rgba(255,255,255,0.08)'}`,
  color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.25)',
  fontFamily: '"Geist Mono", "Fira Code", monospace',
  fontSize: mob ? 11 : 12,
  cursor: active ? 'pointer' : 'default',
  transition: 'all 0.2s',
  letterSpacing: '0.04em',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: active ? '0 0 20px rgba(139,92,246,0.15)' : 'none',
})
