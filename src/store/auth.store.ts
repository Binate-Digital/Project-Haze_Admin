import { create } from 'zustand'
import { STORAGE_KEYS } from '@/config'
import type { AdminUser } from '@/types/auth'

function readStoredUser(): AdminUser | null {
  const raw =
    localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminUser
  } catch {
    return null
  }
}

function readStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN)
}

type AuthState = {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  login: (user: AdminUser, token: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  hydrate: () => {
    const user = readStoredUser()
    const token = readStoredToken()
    set({
      user,
      token,
      isAuthenticated: !!(user && token),
    })
  },

  login: (user, token) => set({ user, token, isAuthenticated: true }),

  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    }),
}))
