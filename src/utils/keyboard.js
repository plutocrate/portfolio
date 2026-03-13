// QWERTY key code mapping - ensures physical key position, not layout
// Maps physical key codes to logical game actions regardless of OS keyboard layout
const QWERTY_MAP = {
  // Arrow / movement - physical positions
  KeyA: 'left',
  KeyD: 'right',
  KeyW: 'jump',
  KeyS: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'jump',
  ArrowDown: 'down',
  Space: 'jump',
  Enter: 'confirm',
  Escape: 'pause',
  KeyE: 'interact',
}

export function getGameAction(event) {
  // Use event.code (physical key position) not event.key (layout-dependent)
  return QWERTY_MAP[event.code] || null
}

export function isMovementKey(event) {
  return ['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(event.code)
}

export function getMovementDirection(pressedKeys) {
  let dx = 0
  if (pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft')) dx -= 1
  if (pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight')) dx += 1
  return dx
}
