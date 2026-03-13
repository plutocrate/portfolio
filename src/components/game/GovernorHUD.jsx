import { useState } from 'react'
import emailjs from '@emailjs/browser'

const DIALOGUE = {
  intro:       "feels good to see someone in here, really.... really. i'm governer, the people here call me governer, my real name's... my real name.... i don't remember, i created this world btw. how may i help?",
  emailForm:   "and your message is.....",
  emailSent:   "well that was easy.",
  resumeBack:  "wasn't i right about him? anything more at your service",
  emailErr:    "hmm... something broke. try again?",
}

export default function GovernorHUD({ onClose, onResumeOpen, onAnimState, resumeBack }) {
  const [dialogue,  setDialogue]  = useState(resumeBack ? DIALOGUE.resumeBack : DIALOGUE.intro)
  const [view,      setView]      = useState('menu')
  const [emailData, setEmailData] = useState({ name:'', email:'', message:'' })
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)

  const sendEmail = async () => {
    if (!emailData.name || !emailData.email || !emailData.message) return
    setSending(true)
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE  || 'service_portfolio',
        import.meta.env.VITE_EMAILJS_TEMPLATE || 'template_contact',
        { from_name: emailData.name, from_email: emailData.email, message: emailData.message, to_email: 'prathampurohitonline@outlook.com' },
        import.meta.env.VITE_EMAILJS_KEY || ''
      )
      setSent(true); setView('menu')
      setDialogue(DIALOGUE.emailSent); onAnimState('happy')
    } catch { setDialogue(DIALOGUE.emailErr) }
    setSending(false)
  }

  const W = Math.min(window.innerWidth * 0.90, 820)

  const inp = {
    background:'rgba(10,25,15,0.85)', border:'1px solid rgba(60,255,160,0.22)',
    borderRadius:6, padding:'12px 16px', color:'rgba(180,255,210,0.9)',
    fontSize:16, fontFamily:'"Courier New",monospace', outline:'none',
    width:'100%', boxSizing:'border-box', transition:'border-color 0.15s',
  }

  const optBtn = (label, onClick, disabled) => (
    <button onClick={onClick} disabled={disabled} style={{
      background:'transparent',
      border:`1.5px solid rgba(60,255,160,${disabled ? '0.12' : '0.32'})`,
      borderRadius:8, padding:'16px 22px',
      color: disabled ? 'rgba(60,255,160,0.30)' : 'rgba(160,255,200,0.90)',
      fontSize:17, cursor: disabled ? 'default' : 'pointer',
      textAlign:'left', fontFamily:'"Courier New",monospace',
      letterSpacing:'0.02em', transition:'all 0.15s', width:'100%',
    }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background='rgba(60,255,160,0.07)'; e.currentTarget.style.borderColor='rgba(60,255,160,0.65)' }}}
    onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor=`rgba(60,255,160,${disabled?'0.12':'0.32'})` }}
    >{label}</button>
  )

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:99 }} onClick={onClose} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:W, maxHeight:'80vh', overflowY:'auto',
          background:'linear-gradient(160deg,rgba(8,14,10,0.97) 0%,rgba(4,10,7,0.98) 100%)',
          border:'2px solid rgba(60,255,160,0.28)',
          borderRadius:14,
          boxShadow:'0 0 70px rgba(40,255,140,0.13), 0 24px 60px rgba(0,0,0,0.88)',
          padding:'36px 40px 36px',
          zIndex:100,
          fontFamily:'"Courier New",monospace',
          color:'rgba(180,255,210,0.92)',
          display:'flex', flexDirection:'column', gap:24,
          scrollbarWidth:'thin', scrollbarColor:'rgba(60,255,160,0.15) transparent',
        }}
      >
        {/* Close button only — no title */}
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{
            background:'transparent', border:'none',
            color:'rgba(255,100,100,0.45)', cursor:'pointer', fontSize:20, lineHeight:1,
          }}>✕</button>
        </div>

        {/* Governor dialogue — just text, no box */}
        <div style={{
          fontSize:20, lineHeight:1.75,
          color:'rgba(210,255,225,0.95)',
          letterSpacing:'0.01em',
          padding:'0 4px',
        }}>
          <span style={{ fontSize:11, opacity:0.35, letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:10 }}>
            governor
          </span>
          {dialogue}
        </div>

        {/* Divider */}
        <div style={{ height:1, background:'rgba(60,255,160,0.12)', margin:'0 -4px' }} />

        {/* Menu */}
        {view === 'menu' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {optBtn(
              sent ? '> message delivered ✓' : '> do you want to reach out to pratham?',
              () => { setView('email'); setDialogue(DIALOGUE.emailForm); onAnimState('idle') },
              sent
            )}
            {optBtn(
              "> want to see his resume? the boy's got good talent.",
              () => { onResumeOpen(); onAnimState('happy') }
            )}
          </div>
        )}

        {/* Email form */}
        {view === 'email' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <input placeholder="your name" value={emailData.name}
              onChange={e => setEmailData(p=>({...p, name:e.target.value}))} style={inp}
              onFocus={e=>e.target.style.borderColor='rgba(60,255,160,0.55)'}
              onBlur={e=>e.target.style.borderColor='rgba(60,255,160,0.22)'} />
            <input placeholder="your email" type="email" value={emailData.email}
              onChange={e => setEmailData(p=>({...p, email:e.target.value}))} style={inp}
              onFocus={e=>e.target.style.borderColor='rgba(60,255,160,0.55)'}
              onBlur={e=>e.target.style.borderColor='rgba(60,255,160,0.22)'} />
            <textarea placeholder="your message..." value={emailData.message}
              onChange={e => setEmailData(p=>({...p, message:e.target.value}))}
              rows={5} style={{...inp, resize:'vertical', minHeight:110}}
              onFocus={e=>e.target.style.borderColor='rgba(60,255,160,0.55)'}
              onBlur={e=>e.target.style.borderColor='rgba(60,255,160,0.22)'} />
            <div style={{ display:'flex', gap:12, marginTop:4 }}>
              {optBtn('← back', () => { setView('menu'); setDialogue(DIALOGUE.emailForm) }, sending)}
              <button onClick={sendEmail}
                disabled={sending || !emailData.name || !emailData.email || !emailData.message}
                style={{
                  flex:1, background:'rgba(40,255,140,0.09)',
                  border:'1.5px solid rgba(40,255,140,0.38)', borderRadius:8,
                  padding:'16px 22px', color:'rgba(180,255,210,0.95)',
                  fontSize:17, cursor:'pointer', fontFamily:'"Courier New",monospace',
                  transition:'all 0.15s',
                  opacity:(sending||!emailData.name||!emailData.email||!emailData.message)?0.35:1,
                }}
                onMouseEnter={e=>{ if(!sending) e.currentTarget.style.background='rgba(40,255,140,0.17)' }}
                onMouseLeave={e=>{ e.currentTarget.style.background='rgba(40,255,140,0.09)' }}
              >{sending ? '> sending...' : '> send message'}</button>
            </div>
          </div>
        )}

        {/* Subtle scanlines */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', borderRadius:14,
          background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,100,0.009) 3px,rgba(0,255,100,0.009) 4px)',
        }} />
      </div>
    </>
  )
}
