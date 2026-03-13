import { useEffect, useRef, useState } from 'react'
import { getGameAction } from '../utils/keyboard'

export function useKeyboard() {
  const pressedKeys = useRef(new Set())
  const listeners = useRef([])

  useEffect(() => {
    const onDown = (e) => {
      pressedKeys.current.add(e.code)
      const action = getGameAction(e)
      if (action) {
        listeners.current.forEach(fn => fn({ type: 'press', action, code: e.code }))
      }
      // Prevent page scroll on game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault()
      }
    }
    const onUp = (e) => {
      pressedKeys.current.delete(e.code)
      const action = getGameAction(e)
      if (action) {
        listeners.current.forEach(fn => fn({ type: 'release', action, code: e.code }))
      }
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  function subscribe(fn) {
    listeners.current.push(fn)
    return () => {
      listeners.current = listeners.current.filter(f => f !== fn)
    }
  }

  return { pressedKeys, subscribe }
}
