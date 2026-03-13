import { useEffect, useRef } from 'react'

export default function SceneTransition({ active, direction = 1, duration = 600, onDone }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (!el) return

    // Fade to black then back
    el.style.transition = 'none'
    el.style.opacity = '0'
    el.style.pointerEvents = 'all'

    requestAnimationFrame(() => {
      el.style.transition = `opacity ${duration / 2}ms ease`
      el.style.opacity = '1'

      setTimeout(() => {
        onDone?.()
        el.style.opacity = '0'
        setTimeout(() => {
          el.style.pointerEvents = 'none'
        }, duration / 2)
      }, duration / 2)
    })
  }, [active])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: 200,
        transition: 'opacity 0.3s ease',
      }}
    />
  )
}
