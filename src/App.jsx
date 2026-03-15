import { useEffect, useState, useCallback, useRef } from 'react'
import { GameProvider, useGame } from './hooks/useGameState'
import { SCENES, asset, VISIT_KEY } from './utils/constants'
import { audioManager } from './utils/audio'

import IntroMenuScene     from './scenes/IntroMenuScene'
import EntryScene         from './scenes/EntryScene'
import ParallaxWorldScene from './scenes/ParallaxWorldScene'
import ModeSelectScene    from './scenes/ModeSelectScene'
import AboutScene         from './scenes/AboutScene'
import ProjectsScene      from './scenes/ProjectsScene'
import ContactScene       from './scenes/ContactScene'
import ResumeScene        from './scenes/ResumeScene'
import GovernorWorldScene from './scenes/GovernorWorldScene'
import MatburryScene      from './scenes/MatburryScene'

import ModeSelectDialog from './components/ui/ModeSelectDialog'
import LoadingScreen    from './components/ui/LoadingScreen'
import SceneTransition  from './components/game/SceneTransition'
import BloomOverlay     from './components/game/BloomOverlay'

// Mobile detection
export const isMobile = () =>
  /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (typeof window !== 'undefined' && window.innerWidth <= 1024 && 'ontouchstart' in window)

// All game scenes that require landscape (intro menu handles itself internally)
const GAME_SCENES = new Set([
  SCENES.ENTRY, SCENES.PARALLAX_WORLD, SCENES.GOVERNOR_WORLD,
  SCENES.MODE_SELECT, SCENES.ABOUT, SCENES.PROJECTS, SCENES.CONTACT,
  SCENES.MATBURRY_WORLD,
])

function OrientationWrapper({ needsLandscape, children }) {
  const [isPortrait, setIsPortrait] = useState(() => window.innerHeight > window.innerWidth)

  useEffect(() => {
    const check = () => {
      // Small delay for iOS — orientation fires before dimensions update
      setTimeout(() => {
        setIsPortrait(window.innerHeight > window.innerWidth)
      }, 100)
    }
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    // Also run immediately in case dimensions are already settled
    check()
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  // Show rotate wall: mobile + game scene + portrait
  if (isMobile() && needsLandscape && isPortrait) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '24px', zIndex: 9999,
      }}>
        <style>{`
          @keyframes rotateHint {
            0%   { transform: rotate(0deg); }
            35%  { transform: rotate(0deg); }
            55%  { transform: rotate(90deg); }
            80%  { transform: rotate(90deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div style={{
          fontSize: '56px',
          animation: 'rotateHint 2s ease-in-out infinite',
          transformOrigin: 'center',
        }}>
          📱
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          animation: 'fadeInUp 0.5s ease forwards',
        }}>
          <p style={{
            fontFamily: '"Syne", sans-serif',
            fontSize: '18px', fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.01em',
          }}>
            Rotate your phone
          </p>
          <p style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px', fontWeight: 300,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.04em',
            textAlign: 'center',
            maxWidth: '220px',
            lineHeight: 1.6,
          }}>
            This experience is designed for landscape mode
          </p>
        </div>

        {/* Landscape icon hint */}
        <div style={{
          marginTop: '8px',
          width: '56px', height: '36px',
          border: '2px solid rgba(255,255,255,0.25)',
          borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '4px', height: '4px',
            borderRadius: '50%',
            background: 'rgba(100,255,160,0.8)',
          }} />
        </div>
      </div>
    )
  }

  return children
}

function GameApp() {
  const { state, dispatch } = useGame()
  const [dimensions, setDimensions]   = useState({ width: window.innerWidth, height: window.innerHeight })
  const [transitioning, setTransitioning] = useState(false)
  const [displayScene, setDisplayScene]   = useState(SCENES.INTRO_MENU)
  const [showLoading, setShowLoading]     = useState(false)
  const [playerStartX, setPlayerStartX]   = useState(null)
  const [playerVelocity, setPlayerVelocity] = useState(0)
  const [playerSprinting, setPlayerSprinting] = useState(false)
  const [playerFacing, setPlayerFacing]   = useState(1)
  const audioUnlocked = useRef(false)
  const bgmStarted    = useRef(false)

  const needsLandscape = isMobile() && GAME_SCENES.has(displayScene)

  useEffect(() => {
    audioManager.load('run',          asset('/assets/audio/Grass_Running.wav'))
    audioManager.load('bigrun',        asset('/assets/audio/Grass_Running.wav'))
    audioManager.load('bgm',           asset('/assets/audio/bgm.mp3'))
    audioManager.load('click',         asset('/assets/audio/click.ogg'))
    audioManager.load('terminal_boot', asset('/assets/audio/terminal_boot.ogg'))
    // Smart loading: load matburry assets only if return visitor (they'll go there directly)
    try {
      if (localStorage.getItem(VISIT_KEY)) {
        audioManager.load('matburry_bgm', asset('/assets/audio/matburry_bgm.mp3'))
      }
    } catch {}
  }, [])

  useEffect(() => {
    const unlock = () => {
      if (audioUnlocked.current) return
      audioUnlocked.current = true
      audioManager.unlock()
    }
    window.addEventListener('click',      unlock, { once: true })
    window.addEventListener('keydown',    unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })
    return () => {
      window.removeEventListener('click',      unlock)
      window.removeEventListener('keydown',    unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [])

  useEffect(() => {
    const fn = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
    const delayed = () => setTimeout(fn, 150)
    window.addEventListener('resize', fn)
    window.addEventListener('orientationchange', delayed)
    return () => {
      window.removeEventListener('resize', fn)
      window.removeEventListener('orientationchange', delayed)
    }
  }, [])

  useEffect(() => {
    if (displayScene === SCENES.RESUME) window.history.pushState({ pgResume: true }, '')
  }, [displayScene])

  useEffect(() => {
    const onPop = () => {
      if (displayScene === SCENES.RESUME)
        dispatch({ type: 'SET_SCENE', scene: SCENES.INTRO_MENU, direction: -1 })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [displayScene, dispatch])

  useEffect(() => {
    if (state.isTransitioning && state.currentScene !== displayScene) setTransitioning(true)
  }, [state.isTransitioning, state.currentScene, displayScene])

  const handleTransitionDone = useCallback(() => {
    setDisplayScene(state.currentScene)
    setPlayerStartX(state.playerStartX ?? null)
    setPlayerVelocity(state.playerVelocity ?? 0)
    setPlayerSprinting(state.playerSprinting ?? false)
    setPlayerFacing(state.playerFacing ?? 1)
    setTransitioning(false)
    dispatch({ type: 'TRANSITION_DONE' })
  }, [state, dispatch])

  const handleIntroSelect = useCallback((mode) => {
    dispatch({ type: 'SET_MODE', mode })
    if (mode === 'resume') {
      dispatch({ type: 'SET_SCENE', scene: SCENES.RESUME, direction: 1 })
      return
    }
    if (!audioUnlocked.current) { audioUnlocked.current = true; audioManager.unlock() }
    bgmStarted.current = true
    // Read visit flag fresh — never use a cached value
    let isReturn = false
    try { isReturn = localStorage.getItem(VISIT_KEY) === '1' } catch {}
    console.log('[Visit]', isReturn ? 'RETURN visitor → GovernorWorld' : 'FIRST visitor → Entry')
    if (isReturn) {
      // Governor is silent on return — no bgm started, matburry_bgm loaded for later
      audioManager.load('matburry_bgm', asset('/assets/audio/matburry_bgm.mp3'))
      dispatch({ type: 'SET_SCENE', scene: SCENES.GOVERNOR_WORLD, direction: 1, playerStartX: 120, playerFacing: 1 })
    } else {
      setShowLoading(true)
    }
  }, [dispatch])

  const handleLoadingReady = useCallback(() => {
    setShowLoading(false)
    dispatch({ type: 'SET_SCENE', scene: SCENES.ENTRY, direction: 1, playerStartX: 80 })
  }, [dispatch])

  const handleEntryEnd = useCallback((velocity = 0, sprinting = false) => {
    if (bgmStarted.current) audioManager.play('bgm', { loop: true, volume: 0.20 })
    // Load matburry assets now since player is entering the game world
    audioManager.load('matburry_bgm', asset('/assets/audio/matburry_bgm.mp3'))
    dispatch({ type:'SET_SCENE', scene:SCENES.PARALLAX_WORLD, direction:1, playerStartX:200, playerVelocity:velocity, playerSprinting:sprinting, playerFacing:1 })
  }, [dispatch])

  const { width, height } = dimensions
  const isResume = displayScene === SCENES.RESUME

  return (
    <OrientationWrapper needsLandscape={needsLandscape}>
      <div style={{ width:'100%', height:'100%', position:'relative', overflow: isResume ? 'visible' : 'hidden', background:'#000' }}>
        {displayScene === SCENES.INTRO_MENU && <IntroMenuScene onSelect={handleIntroSelect} />}
        {displayScene === SCENES.ENTRY && <EntryScene containerWidth={width} containerHeight={height} onReachEnd={handleEntryEnd} startX={playerStartX} startFacing={playerFacing} />}
        {displayScene === SCENES.PARALLAX_WORLD && <ParallaxWorldScene containerWidth={width} containerHeight={height} startVelocity={playerVelocity} startFacing={playerFacing} startSprinting={playerSprinting} />}
        {displayScene === SCENES.GOVERNOR_WORLD && <GovernorWorldScene containerWidth={width} containerHeight={height} startX={playerStartX} startFacing={playerFacing} startVelocity={playerVelocity} />}
        {displayScene === SCENES.MATBURRY_WORLD && <MatburryScene containerWidth={width} containerHeight={height} />}
        {displayScene === SCENES.MODE_SELECT && <ModeSelectScene containerWidth={width} containerHeight={height} startX={playerStartX} startFacing={playerFacing} />}
        {displayScene === SCENES.ABOUT && <AboutScene containerWidth={width} containerHeight={height} startX={playerStartX} startFacing={playerFacing} />}
        {displayScene === SCENES.PROJECTS && <ProjectsScene containerWidth={width} containerHeight={height} startX={playerStartX} startFacing={playerFacing} />}
        {displayScene === SCENES.CONTACT && <ContactScene containerWidth={width} containerHeight={height} startX={playerStartX} startFacing={playerFacing} />}
        {displayScene === SCENES.RESUME && <ResumeScene />}
        <ModeSelectDialog />
        <SceneTransition active={transitioning} onDone={handleTransitionDone} />
        <BloomOverlay />
        {showLoading && <LoadingScreen onReady={handleLoadingReady} />}
      </div>
    </OrientationWrapper>
  )
}

export default function App() {
  return <GameProvider><GameApp /></GameProvider>
}
