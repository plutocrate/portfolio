// Site-wide start time — persists across scene changes
export const SITE_START_TIME = Date.now()

// Base URL for assets (respects Vite's base config for GitHub Pages deployment)
export const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, '')

// Helper to build asset paths correctly for any deployment base
export const asset = (path) => `${BASE_URL}${path}`

// Game constants
export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720

// Sprite config
export const SPRITE_FRAME_WIDTH = 240
export const SPRITE_FRAME_HEIGHT = 240
export const SPRITE_SCALE = 1.2        // reduced by /1.5 from original 1.8
export const TOTAL_RUN_FRAMES = 14

// Player physics — acceleration-based for natural feel
export const PLAYER_MAX_SPEED = 380    // px/s top sprint speed
export const PLAYER_ACCEL = 1800       // px/s² ramp up
export const PLAYER_DECEL = 2600       // px/s² ramp down (snappier stop than start)

// Tile config
export const TILE_SIZE = 64
export const FLOOR_TILE_ROWS = 2

// Scene transition zone width
export const TRANSITION_ZONE = 40

// Ground ratio
export const GROUND_Y_RATIO = 0.72

// Scenes
export const VISIT_KEY = 'pratham_portfolio_visited'

export const SCENES = {
  ENTRY: 'entry',
  PARALLAX_WORLD: 'parallax_world',
  INTRO_MENU: 'intro_menu',   // NEW: first screen — pick mode before anything moves
  MODE_SELECT: 'mode_select',
  RESUME: 'resume',
  ABOUT: 'about',
  PROJECTS: 'projects',
  CONTACT: 'contact',
  GOVERNOR_WORLD: 'governor_world',
  MATBURRY_WORLD: 'matburry_world',
  MOBILE_TERMINAL: 'mobile_terminal',
}

export const COLORS = {
  forestGlow: 0x44ff88,
  forestGlowDark: 0x1a6633,
  skyDark: 0x050a0a,
  groundDark: 0x0a1a0a,
}

// Sprint physics
export const PLAYER_SPRINT_SPEED = 680   // px/s
export const PLAYER_SPRINT_ACCEL = 2800  // px/s² — snaps to sprint faster
