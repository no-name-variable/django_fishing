/**
 * Store для игровой сессии
 */
import { create } from 'zustand'
import type { GameState, FightState, Location, CatchResult } from '../types'

interface GameStore {
  // Состояние сессии
  isConnected: boolean
  gameState: GameState
  currentLocation: Location | null
  castDistance: number
  castDepth: number

  // Состояние вываживания
  fightState: FightState | null
  hookedFish: { name: string; weight: number } | null

  // Результат
  lastCatchResult: CatchResult | null

  // Ошибки
  error: string | null

  // Действия
  setConnected: (connected: boolean) => void
  setGameState: (state: GameState) => void
  setLocation: (location: Location | null) => void
  setCastResult: (distance: number, depth: number) => void
  setBite: (fishName: string, intensity: number) => void
  setFightStarted: (fishName: string, weight: number) => void
  updateFightState: (state: FightState) => void
  setCatchResult: (result: CatchResult) => void
  clearCatchResult: () => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  isConnected: false,
  gameState: 'idle' as GameState,
  currentLocation: null,
  castDistance: 0,
  castDepth: 0,
  fightState: null,
  hookedFish: null,
  lastCatchResult: null,
  error: null,
}

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setConnected: (connected) => set({ isConnected: connected }),

  setGameState: (state) => set({ gameState: state }),

  setLocation: (location) => set({ currentLocation: location }),

  setCastResult: (distance, depth) =>
    set({
      castDistance: distance,
      castDepth: depth,
      gameState: 'waiting',
    }),

  setBite: (fishName, _intensity) =>
    set({
      gameState: 'bite',
      hookedFish: { name: fishName, weight: 0 },
    }),

  setFightStarted: (fishName, weight) =>
    set({
      gameState: 'fighting',
      hookedFish: { name: fishName, weight },
    }),

  updateFightState: (state) => set({ fightState: state }),

  setCatchResult: (result) =>
    set({
      lastCatchResult: result,
      gameState: 'idle',
      fightState: null,
      hookedFish: null,
    }),

  clearCatchResult: () => set({ lastCatchResult: null }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}))
