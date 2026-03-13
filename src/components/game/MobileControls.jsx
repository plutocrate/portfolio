import { useRef, useEffect, useCallback } from 'react'

/**
 * MobileControls — transparent touch zones that inject keys into pressedKeys.
 * Left half of screen = ArrowLeft, right half = ArrowRight.
 * Minimal UI — just subtle edge indicators so players know the zones.
 */
export default function MobileControls({ pressedKeys, visible = true, containerWidth, containerHeight }) {
  const leftRef  = useRef(false)
  const rightRef = useRef(false)

  const press = useCallback((dir) => {
    if (dir === 'left') {
      if (!leftRef.current) { leftRef.current = true; pressedKeys.current.add('ArrowLeft') }
    } else {
      if (!rightRef.current) { rightRef.current = true; pressedKeys.current.add('ArrowRight') }
    }
  }, [pressedKeys])

  const release = useCallback((dir) => {
    if (dir === 'left') {
      leftRef.current = false; pressedKeys.current.delete('ArrowLeft')
    } else {
      rightRef.current = false; pressedKeys.current.delete('ArrowRight')
    }
  }, [pressedKeys])

  const releaseAll = useCallback(() => {
    leftRef.current = false; rightRef.current = false
    pressedKeys.current.delete('ArrowLeft')
    pressedKeys.current.delete('ArrowRight')
  }, [pressedKeys])

  useEffect(() => () => releaseAll(), [releaseAll])

  if (!visible) return null

  const zoneH = Math.round(containerHeight * 0.55)  // bottom 55% is the touch zone
  const zoneW = Math.round(containerWidth  * 0.4)   // each zone 40% wide

  const zoneStyle = (side) => ({
    position:       'absolute',
    bottom:         0,
    [side]:         0,
    width:          zoneW,
    height:         zoneH,
    zIndex:         40,
    userSelect:     'none',
    WebkitUserSelect: 'none',
    touchAction:    'none',
    // Subtle visual affordance
    background:     'transparent',
  })

  // Arrow indicator at edge
  const arrowStyle = (side) => ({
    position:        'absolute',
    bottom:          '14%',
    [side]:          '10px',
    opacity:         0.18,
    fontSize:        '28px',
    color:           '#fff',
    pointerEvents:   'none',
    userSelect:      'none',
    fontFamily:      'monospace',
  })

  const makeHandlers = (dir) => ({
    onTouchStart:  (e) => { e.stopPropagation(); press(dir) },
    onTouchEnd:    (e) => { e.stopPropagation(); release(dir) },
    onTouchCancel: (e) => { e.stopPropagation(); release(dir) },
  })

  return (
    <>
      {/* Left zone */}
      <div style={zoneStyle('left')} {...makeHandlers('left')}>
        <span style={arrowStyle('left')}>◀</span>
      </div>
      {/* Right zone */}
      <div style={zoneStyle('right')} {...makeHandlers('right')}>
        <span style={arrowStyle('right')}>▶</span>
      </div>
    </>
  )
}
