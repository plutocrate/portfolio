import { useState } from 'react'
import emailjs from '@emailjs/browser'

const DIALOGUE = {
  intro:      "feels good to see someone in here, really.... really. i'm governer, the people here call me governer, my real name's... my real name.... i don't remember, i created this world btw. how may i help?",
  emailForm:  "and your message is.....",
  emailSent:  "well that was easy.",
  resumeBack: "wasn't i right about him? anything more at your service",
  emailErr:   "hmm... something broke. try again?",
}

const FONT = '"Courier New", monospace'

const inputStyle = {
  background:   'rgba(255,255,255,0.04)',
  border:       '1px solid rgba(255,255,255,0.15)',
  borderRadius: 6,
  padding:      '12px 16px',
  color:        '#ffffff',
  fontSize:     15,
  fontFamily:   FONT,
  outline:      'none',
  width:        '100%',
  boxSizing:    'border-box',
  transition:   'border-color 0.15s',
}

function OptionButton({ label, onClick, disabled }) {
  const [hover, setHover] = useState(false)
  const active = hover && !disabled
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        width:        '100%',
        background:   active ? 'rgba(255,255,255,0.06)' : 'transparent',
        border:       `1px solid rgba(255,255,255,${disabled ? '0.08' : active ? '0.28' : '0.14'})`,
        borderRadius: 8,
        padding:      '14px 20px',
        cursor:       disabled ? 'default' : 'pointer',
        transition:   'all 0.15s ease',
        textAlign:    'left',
        whiteSpace:   'nowrap',
        overflow:     'hidden',
        minWidth:     0,
      }}
    >
      <span style={{
        fontFamily: FONT, fontSize: 13, flexShrink: 0,
        color:      disabled ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.40)',
        transform:  active ? 'translateX(3px)' : 'none',
        transition: 'transform 0.15s ease',
      }}>›</span>
      <span style={{
        fontFamily:   FONT, fontSize: 15, flex: 1,
        color:        disabled ? 'rgba(255,255,255,0.25)' : '#ffffff',
        overflow:     'hidden',
        textOverflow: 'ellipsis',
        whiteSpace:   'nowrap',
      }}>{label}</span>
      {disabled && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>✓</span>}
    </button>
  )
}

function SendButton({ onClick, disabled, sending }) {
  const [hover, setHover] = useState(false)
  const active = hover && !disabled
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex:           1,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            8,
        background:     active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
        border:         `1px solid rgba(255,255,255,${disabled ? '0.10' : '0.28'})`,
        borderRadius:   8,
        padding:        '14px 20px',
        color:          disabled ? 'rgba(255,255,255,0.30)' : '#ffffff',
        fontSize:       15,
        fontFamily:     FONT,
        cursor:         disabled ? 'default' : 'pointer',
        transition:     'all 0.15s ease',
        whiteSpace:     'nowrap',
      }}
    >{sending ? 'sending...' : 'send message'}</button>
  )
}

export default function GovernorHUD({ onClose, onResumeOpen, onAnimState, resumeBack }) {
  const [dialogue,  setDialogue]  = useState(resumeBack ? DIALOGUE.resumeBack : DIALOGUE.intro)
  const [view,      setView]      = useState('menu')
  const [emailData, setEmailData] = useState({ name: '', email: '', message: '' })
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)

  const sendEmail = async () => {
    if (!emailData.name || !emailData.email || !emailData.message) return
    setSending(true)
    try {
      await emailjs.send(
        'service_06d6y58',
        'pq490pc',
        { from_name: emailData.name, from_email: emailData.email, message: emailData.message, to_email: 'prathampurohitonline@outlook.com' },
        'HgsszHkvHyhtMtI--'
      )
      setSent(true); setView('menu')
      setDialogue(DIALOGUE.emailSent); onAnimState('happy')
    } catch (err) { console.error("EmailJS error:", err); setDialogue(DIALOGUE.emailErr) }
    setSending(false)
  }

  const W = Math.min(window.innerWidth * 0.88, 640)

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:99 }} onClick={onClose} />

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:W, maxHeight:'82vh', overflowY:'auto',
          background:'#0a0f0a',
          border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:12,
          boxShadow:'0 32px 80px rgba(0,0,0,0.9)',
          zIndex:100,
          display:'flex', flexDirection:'column',
          scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.1) transparent',
        }}
      >
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 24px',
          borderBottom:'1px solid rgba(255,255,255,0.08)',
          flexShrink:0,
        }}>
          <span style={{
            fontFamily:FONT, fontSize:11,
            color:'rgba(255,255,255,0.30)',
            letterSpacing:'0.16em', textTransform:'uppercase',
          }}>Governor</span>
          <button onClick={onClose} style={{
            background:'transparent', border:'none',
            color:'rgba(255,255,255,0.30)', cursor:'pointer',
            fontSize:18, lineHeight:1, padding:'2px 4px', transition:'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.70)'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.30)'}
          >✕</button>
        </div>

        {/* Dialogue */}
        <div style={{
          padding:'28px 28px 24px',
          fontFamily:FONT, fontSize:17, lineHeight:1.8,
          color:'#ffffff', letterSpacing:'0.01em', flexShrink:0,
        }}>
          {dialogue}
        </div>

        {/* Divider */}
        <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'0 28px', flexShrink:0 }} />

        {/* Content */}
        <div style={{ padding:'20px 28px 28px', flexShrink:0 }}>

          {view === 'menu' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <OptionButton
                label={sent ? 'message delivered' : 'reach out to pratham'}
                disabled={sent}
                onClick={() => { setView('email'); setDialogue(DIALOGUE.emailForm); onAnimState('idle') }}
              />
              <OptionButton
                label="see his resume"
                onClick={() => { onResumeOpen(); onAnimState('happy') }}
              />
            </div>
          )}

          {view === 'email' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <input
                placeholder="your name" value={emailData.name}
                onChange={e => setEmailData(p => ({ ...p, name: e.target.value }))}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor='rgba(255,255,255,0.40)'}
                onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.15)'}
              />
              <input
                placeholder="your email" type="email" value={emailData.email}
                onChange={e => setEmailData(p => ({ ...p, email: e.target.value }))}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor='rgba(255,255,255,0.40)'}
                onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.15)'}
              />
              <textarea
                placeholder="your message..." value={emailData.message}
                onChange={e => setEmailData(p => ({ ...p, message: e.target.value }))}
                rows={5} style={{ ...inputStyle, resize:'vertical', minHeight:110 }}
                onFocus={e => e.target.style.borderColor='rgba(255,255,255,0.40)'}
                onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.15)'}
              />
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <OptionButton
                  label="back"
                  disabled={sending}
                  onClick={() => { setView('menu'); setDialogue(DIALOGUE.intro) }}
                />
                <SendButton
                  onClick={sendEmail}
                  sending={sending}
                  disabled={sending || !emailData.name || !emailData.email || !emailData.message}
                />
              </div>
            </div>
          )}

        </div>

        {/* Scanlines */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', borderRadius:12,
          background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.008) 3px,rgba(255,255,255,0.008) 4px)',
        }} />
      </div>
    </>
  )
}
