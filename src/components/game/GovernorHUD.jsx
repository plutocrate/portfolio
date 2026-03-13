import { useState } from 'react'
import emailjs from '@emailjs/browser'

const DIALOGUE = {
  intro:      "I am still building this world, the folks you saw outside they are my creation. I know their brains are a little messed up, I will write a 'purpose' algorithm for them, later. Anyways, I work for Pratham, he rented me this place. What can I do for you?",
  emailForm:  "and your message is.....",
  emailSent:  "And.... sent.",
  resumeBack: "wasn't I right about him? anything more at your service",
  emailErr:   "hmm... something broke. try again?",
}

const FONT = '"Courier New", monospace'

const isMobile = () =>
  /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (typeof window !== 'undefined' && window.innerWidth <= 1024 && 'ontouchstart' in window)

export default function GovernorHUD({ onClose, onResumeOpen, onAnimState, resumeBack }) {
  const [dialogue,  setDialogue]  = useState(resumeBack ? DIALOGUE.resumeBack : DIALOGUE.intro)
  const [view,      setView]      = useState('menu')
  const [emailData, setEmailData] = useState({ name: '', email: '', message: '' })
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)

  const mob = isMobile()

  const sendEmail = async () => {
    if (!emailData.name || !emailData.email || !emailData.message) return
    setSending(true)
    try {
      await emailjs.send(
        'service_06d6y58',
        'template_kfcibfh',
        { from_name: emailData.name, from_email: emailData.email, message: emailData.message, to_email: 'prathampurohitonline@outlook.com' },
        'HgsszHkvHyhtMtI--'
      )
      setSent(true); setView('menu')
      setDialogue(DIALOGUE.emailSent); onAnimState('happy')
    } catch (err) { console.error("EmailJS error:", err); setDialogue(DIALOGUE.emailErr) }
    setSending(false)
  }

  const W = Math.min(window.innerWidth * 0.92, 640)

  // Responsive sizes
  const fs = {
    header:    mob ? 10  : 12,
    dialogue:  mob ? 13  : 19,
    btnLabel:  mob ? 13  : 17,
    btnArrow:  mob ? 12  : 15,
    input:     mob ? 13  : 17,
  }
  const pad = {
    header:    mob ? '10px 16px' : '16px 24px',
    dialogue:  mob ? '16px 16px 12px' : '28px 28px 24px',
    content:   mob ? '12px 16px 16px' : '20px 28px 28px',
    btn:       mob ? '10px 14px' : '14px 20px',
    divider:   mob ? '0 16px' : '0 28px',
  }

  const inputStyle = {
    background:   'rgba(0,0,0,0.06)',
    border:       '1px solid rgba(0,0,0,0.15)',
    borderRadius: 6,
    padding:      mob ? '8px 12px' : '12px 16px',
    color:        '#000000',
    fontSize:     fs.input,
    fontWeight:   700,
    fontFamily:   FONT,
    outline:      'none',
    width:        '100%',
    boxSizing:    'border-box',
    transition:   'border-color 0.15s',
  }

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:99 }} onClick={onClose} />

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:W, maxHeight: mob ? '88vh' : '82vh', overflowY:'auto',
          backdropFilter:       'blur(28px) saturate(2.2) brightness(1.15)',
          WebkitBackdropFilter: 'blur(28px) saturate(2.2) brightness(1.15)',
          background:    'rgba(255,255,255,0.92)',
          border:        '2px solid rgba(255,255,255,0.92)',
          borderRadius:  12,
          boxShadow:     '0 8px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15), inset 0 1.5px 0 rgba(255,255,255,0.95)',
          zIndex:100,
          display:'flex', flexDirection:'column',
          scrollbarWidth:'thin', scrollbarColor:'rgba(0,0,0,0.1) transparent',
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding: pad.header,
          borderBottom:'1px solid rgba(0,0,0,0.08)',
          flexShrink:0,
        }}>
          <span style={{
            fontFamily:FONT, fontSize: fs.header, fontWeight: 700,
            color:'rgba(0,0,0,0.35)',
            letterSpacing:'0.16em', textTransform:'uppercase',
          }}>Governor</span>
          <button onClick={onClose} style={{
            background:'transparent', border:'none',
            color:'rgba(0,0,0,0.35)', cursor:'pointer',
            fontSize: mob ? 16 : 18, lineHeight:1, padding:'2px 4px', transition:'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color='rgba(0,0,0,0.75)'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(0,0,0,0.35)'}
          >✕</button>
        </div>

        {/* Dialogue */}
        <div style={{
          padding: pad.dialogue,
          fontFamily:FONT, fontSize: fs.dialogue, fontWeight: 700, lineHeight: mob ? 1.6 : 1.8,
          color:'#000000', letterSpacing:'0.01em', flexShrink:0,
        }}>
          {dialogue}
        </div>

        {/* Divider */}
        <div style={{ height:1, background:'rgba(0,0,0,0.08)', margin: pad.divider, flexShrink:0 }} />

        {/* Content */}
        <div style={{ padding: pad.content, flexShrink:0 }}>

          {view === 'menu' && (
            <div style={{ display:'flex', flexDirection:'column', gap: mob ? 8 : 10 }}>
              <OptionButton
                label={sent ? 'message delivered' : 'Reach out to Pratham? I will deliver your message to him in no time.'}
                disabled={sent}
                onClick={() => { setView('email'); setDialogue(DIALOGUE.emailForm); onAnimState('idle') }}
                btnPad={pad.btn} fontSize={fs.btnLabel} arrowSize={fs.btnArrow}
              />
              <OptionButton
                label="The lad got a good resume, wanna see?"
                onClick={() => { onResumeOpen(); onAnimState('happy') }}
                btnPad={pad.btn} fontSize={fs.btnLabel} arrowSize={fs.btnArrow}
              />
            </div>
          )}

          {view === 'email' && (
            <div style={{ display:'flex', flexDirection:'column', gap: mob ? 8 : 12 }}>
              <input
                placeholder="your name" value={emailData.name}
                onChange={e => setEmailData(p => ({ ...p, name: e.target.value }))}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.40)'}
                onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.15)'}
              />
              <input
                placeholder="your email" type="email" value={emailData.email}
                onChange={e => setEmailData(p => ({ ...p, email: e.target.value }))}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.40)'}
                onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.15)'}
              />
              <textarea
                placeholder="your message..." value={emailData.message}
                onChange={e => setEmailData(p => ({ ...p, message: e.target.value }))}
                rows={mob ? 3 : 5} style={{ ...inputStyle, resize:'vertical', minHeight: mob ? 70 : 110 }}
                onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.40)'}
                onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.15)'}
              />
              <div style={{ display:'flex', gap: mob ? 8 : 10, marginTop: mob ? 2 : 4 }}>
                <OptionButton
                  label="back"
                  disabled={sending}
                  onClick={() => { setView('menu'); setDialogue(DIALOGUE.intro) }}
                  btnPad={pad.btn} fontSize={fs.btnLabel} arrowSize={fs.btnArrow}
                />
                <SendButton
                  onClick={sendEmail}
                  sending={sending}
                  disabled={sending || !emailData.name || !emailData.email || !emailData.message}
                  fontSize={fs.btnLabel} btnPad={pad.btn}
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

function OptionButton({ label, onClick, disabled, btnPad, fontSize, arrowSize }) {
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
        gap:          10,
        width:        '100%',
        background:   active ? 'rgba(0,0,0,0.07)' : 'transparent',
        border:       `1px solid rgba(0,0,0,${disabled ? '0.08' : active ? '0.28' : '0.14'})`,
        borderRadius: 8,
        padding:      btnPad || '14px 20px',
        cursor:       disabled ? 'default' : 'pointer',
        transition:   'all 0.15s ease',
        textAlign:    'left',
        overflow:     'hidden',
        minWidth:     0,
      }}
    >
      <span style={{
        fontFamily: FONT, fontSize: arrowSize || 13, fontWeight: 700, flexShrink: 0,
        color:      disabled ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.40)',
        transform:  active ? 'translateX(3px)' : 'none',
        transition: 'transform 0.15s ease',
      }}>›</span>
      <span style={{
        fontFamily:   FONT, fontSize: fontSize || 15, fontWeight: 700, flex: 1,
        color:        disabled ? 'rgba(0,0,0,0.30)' : '#000000',
        overflow:     'hidden',
        textOverflow: 'ellipsis',
        whiteSpace:   'nowrap',
      }}>{label}</span>
      {disabled && <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.25)', flexShrink: 0 }}>✓</span>}
    </button>
  )
}

function SendButton({ onClick, disabled, sending, fontSize, btnPad }) {
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
        background:     active ? 'rgba(0,0,0,0.10)' : 'rgba(0,0,0,0.05)',
        border:         `1px solid rgba(0,0,0,${disabled ? '0.10' : '0.28'})`,
        borderRadius:   8,
        padding:        btnPad || '14px 20px',
        color:          disabled ? 'rgba(0,0,0,0.30)' : '#000000',
        fontSize:       fontSize || 15,
        fontWeight:     700,
        fontFamily:     FONT,
        cursor:         disabled ? 'default' : 'pointer',
        transition:     'all 0.15s ease',
        whiteSpace:     'nowrap',
      }}
    >{sending ? 'sending...' : 'send message'}</button>
  )
}
