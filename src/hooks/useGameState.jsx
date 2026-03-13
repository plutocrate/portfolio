import React, { createContext, useContext, useReducer } from 'react'
import { SCENES } from '../utils/constants'

const initialState = {
  currentScene: SCENES.INTRO_MENU,
  previousScene: null,
  mode: null,
  isTransitioning: false,
  transitionDirection: 1,
  showModeSelect: false,
  playerStartX: null,
  playerFacing: 1,
  playerVelocity: 0,       // carry velocity into next scene
  playerSprinting: false,  // carry sprint state into next scene
  hudVisible: false,
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_SCENE':
      return {
        ...state,
        previousScene:    state.currentScene,
        currentScene:     action.scene,
        isTransitioning:  true,
        transitionDirection: action.direction ?? 1,
        playerStartX:     action.playerStartX    ?? null,
        playerFacing:     action.playerFacing     ?? 1,
        playerVelocity:   action.playerVelocity   ?? 0,
        playerSprinting:  action.playerSprinting  ?? false,
      }
    case 'TRANSITION_DONE':
      return { ...state, isTransitioning: false }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'SHOW_MODE_SELECT':
      return { ...state, showModeSelect: true }
    case 'HIDE_MODE_SELECT':
      return { ...state, showModeSelect: false }
    case 'SET_HUD_VISIBLE':
      return { ...state, hudVisible: action.visible }
    default:
      return state
  }
}

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}
