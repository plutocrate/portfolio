import { useEffect, useState, useCallback, useRef } from 'react'
import { GameProvider, useGame } from './hooks/useGameState'
import { SCENES, asset } from './utils/constants'
import { audioManager } from './utils/audio'

import IntroMenuScene     from './scenes/IntroMenuScene'
import EntryScene         from './scenes/EntryScene'
import ParallaxWorldScene from './scenes/ParallaxWorldScene'
import ModeSelectScene    from './scenes/ModeSelectScene'
import AboutScene         from './scenes/AboutScene'
import ProjectsScene      from './scenes/ProjectsScene'
import ContactScene       from './scenes/ContactScene'
import ResumeScene        from './scenes/ResumeScene'
import GovernorWorldScene  from './scenes/GovernorWorldScene'

import ModeSelectDialog from './components/ui/ModeSelectDialog'
import LoadingScreen    from './components/ui/LoadingScreen'
import SceneTransition  from './components/game/SceneTransition'
import BloomOverlay     from './components/game/BloomOverlay'

function GameApp() {
  const { state, dispatch } = useGame()
  const [dimensions, setDimensions] = useState({
    width:  window.innerWidth,
    height: window.innerHeight,
  })
  const [transitioning,   setTransitioning]   = useState(false)
  const [displayScene,    setDisplayScene]     = useState(SCENES.INTRO_MENU)
  const [showLoading,     setShowLoading]      = useState(false)
  const [playerStartX,    setPlayerStartX]     = useState(null)
  const [playerVelocity,  setPlayerVelocity]   = useState(0)
  const [playerSprinting, setPlayerSprinting]  = useState(false)
  const [playerFacing,    setPlayerFacing]     = useState(1)
  const audioUnlocked     = useRef(false)
  const bgmStarted        = useRef(false)

  // ── Load all audio ────────────────────────────────────────────────────────
  useEffect(() => {
    audioManager.load('run',     asset('/assets/audio/Grass_Running.wav'))
    audioManager.load('bigrun',  asset('/assets/audio/Grass_Running.wav'))
    audioManager.load('bgm',     asset('/assets/audio/bgm.mp3'))
  }, [])

  // ── Unlock AudioContext on first user gesture ────────────────────────────
  useEffect(() => {
    const unlock = () => {
      if (audioUnlocked.current) return
      audioUnlocked.current = true
      audioManager.unlock()  // creates WebAudio ctx + decodes all pending buffers
    }
    window.addEventListener('click',   unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('click',   unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // ── Browser back from Resume ──────────────────────────────────────────────
  useEffect(() => {
    if (displayScene === SCENES.RESUME)
      window.history.pushState({ pgResume: true }, '')
  }, [displayScene])

  useEffect(() => {
    const onPop = () => {
      if (displayScene === SCENES.RESUME)
        dispatch({ type: 'SET_SCENE', scene: SCENES.INTRO_MENU, direction: -1 })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [displayScene, dispatch])

  // ── Scene transition watcher ──────────────────────────────────────────────
  useEffect(() => {
    if (state.isTransitioning && state.currentScene !== displayScene) {
      setTransitioning(true)
    }
  }, [state.isTransitioning, state.currentScene, displayScene])

  const handleTransitionDone = useCallback(() => {
    setDisplayScene(state.currentScene)
    setPlayerStartX(state.playerStartX    ?? null)
    setPlayerVelocity(state.playerVelocity  ?? 0)
    setPlayerSprinting(state.playerSprinting ?? false)
    setPlayerFacing(state.playerFacing    ?? 1)
    setTransitioning(false)
    dispatch({ type: 'TRANSITION_DONE' })
  }, [state, dispatch])

  // ── Intro mode selection ──────────────────────────────────────────────────
  const handleIntroSelect = useCallback((mode) => {
    dispatch({ type: 'SET_MODE', mode })

    if (mode === 'resume') {
      dispatch({ type: 'SET_SCENE', scene: SCENES.RESUME, direction: 1 })
    } else {
      // Unlock audio immediately on click gesture
      if (!audioUnlocked.current) {
        audioUnlocked.current = true
        audioManager.unlock()
      }
      bgmStarted.current = true
      // Show loading screen — it will call handleLoadingReady when done
      setShowLoading(true)
    }
  }, [dispatch])

  const handleLoadingReady = useCallback(() => {
    setShowLoading(false)
    dispatch({ type: 'SET_SCENE', scene: SCENES.ENTRY, direction: 1, playerStartX: 80 })
  }, [dispatch])

  // ── Entry → ParallaxWorld ─────────────────────────────────────────────────
  const handleEntryEnd = useCallback((velocity = 0, sprinting = false) => {
    if (bgmStarted.current) {
      audioManager.play('bgm', { loop: true, volume: 0.20 })
    }
    dispatch({
      type:            'SET_SCENE',
      scene:           SCENES.PARALLAX_WORLD,
      direction:       1,
      playerStartX:    60,
      playerVelocity:  velocity,
      playerSprinting: sprinting,
      playerFacing:    1,
    })
  }, [dispatch])

  const { width, height } = dimensions
  const isResume = displayScene === SCENES.RESUME

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      overflow: isResume ? 'visible' : 'hidden',
      background: '#000',
    }}>
      {displayScene === SCENES.INTRO_MENU && (
        <IntroMenuScene onSelect={handleIntroSelect} />
      )}
      {displayScene === SCENES.ENTRY && (
        <EntryScene containerWidth={width} containerHeight={height} onReachEnd={handleEntryEnd} startX={playerStartX} startFacing={playerFacing} />
      )}
      {displayScene === SCENES.PARALLAX_WORLD && (
        <ParallaxWorldScene
          containerWidth={width}
          containerHeight={height}
          startVelocity={playerVelocity}
          startFacing={playerFacing}
          startSprinting={playerSprinting}
        />
      )}
      {displayScene === SCENES.GOVERNOR_WORLD && (
        <GovernorWorldScene
          containerWidth={width}
          containerHeight={height}
          startX={playerStartX}
          startFacing={playerFacing}
          startVelocity={playerVelocity}
        />
      )}
      {displayScene === SCENES.MODE_SELECT && (
        <ModeSelectScene containerWidth={width} containerHeight={height} startX={playerStartX} startFacing={playerFacing} />
      )}
      {displayScene === SCENES.ABOUT && (
        <AboutScene containerWidth={width} containerHeight={height} startX={playerStartX} startFacing={playerFacing} />
      )}
      {displayScene === SCENES.PROJECTS && (
        <ProjectsScene containerWidth={width} containerHeight={height} startX={playerStartX} startFacing={playerFacing} />
      )}
      {displayScene === SCENES.CONTACT && (
        <ContactScene containerWidth={width} containerHeight={height} startX={playerStartX} startFacing={playerFacing} />
      )}
      {displayScene === SCENES.RESUME && (
        <ResumeScene />
      )}

      <ModeSelectDialog />
      <SceneTransition active={transitioning} onDone={handleTransitionDone} />
      <BloomOverlay />
      {showLoading && <LoadingScreen onReady={handleLoadingReady} />}
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  )
}
