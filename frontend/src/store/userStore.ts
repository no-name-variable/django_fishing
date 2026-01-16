/**
 * Store для данных пользователя
 */
import { create } from 'zustand'
import { api } from '../api/client'
import type { User } from '../types'

interface UserState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Действия
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  fetchProfile: () => Promise<void>
  updateMoney: (amount: number) => void
  addExperience: (amount: number) => void
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null })
    try {
      await api.login(username, password)
      set({ isAuthenticated: true })
      await get().fetchProfile()
    } catch (e) {
      set({ error: (e as Error).message })
      throw e
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null })
    try {
      await api.register(username, email, password)
    } catch (e) {
      set({ error: (e as Error).message })
      throw e
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    api.logout()
    set({ user: null, isAuthenticated: false })
  },

  fetchProfile: async () => {
    try {
      const data = await api.getProfile()
      set({
        user: {
          id: data.id,
          username: data.username,
          email: data.email,
          level: data.level,
          experience: data.experience,
          money: data.money,
          totalFishCaught: data.total_fish_caught,
          biggestFishWeight: data.biggest_fish_weight,
          experienceForNextLevel: data.experience_for_next_level,
        },
      })
    } catch (e) {
      // Если ошибка авторизации - разлогиниваем
      set({ user: null, isAuthenticated: false })
      api.logout()
    }
  },

  updateMoney: (amount) => {
    const user = get().user
    if (user) {
      set({ user: { ...user, money: user.money + amount } })
    }
  },

  addExperience: (amount) => {
    const user = get().user
    if (user) {
      let newExp = user.experience + amount
      let newLevel = user.level
      let nextLevelExp = user.experienceForNextLevel

      // Проверяем повышение уровня
      while (newExp >= nextLevelExp) {
        newExp -= nextLevelExp
        newLevel += 1
        nextLevelExp = Math.floor(100 * Math.pow(newLevel, 1.5))
      }

      set({
        user: {
          ...user,
          experience: newExp,
          level: newLevel,
          experienceForNextLevel: nextLevelExp,
        },
      })
    }
  },
}))
