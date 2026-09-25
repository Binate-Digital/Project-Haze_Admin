import { create } from 'zustand'
import { STORAGE_KEYS } from '@/config'
import type { AdminUser } from '@/types/auth'

function activeStorage(): Storage {
  if (localStorage.getItem(STORAGE_KEYS.TOKEN)) return localStorage
  if (sessionStorage.getItem(STORAGE_KEYS.TOKEN)) return sessionStorage
  return localStorage.getItem(STORAGE_KEYS.REMEMBER) === '1' ? localStorage : sessionStorage
}

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

const initialUser = readStoredUser()
const initialToken = readStoredToken()

type AuthState = {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  login: (user: AdminUser, token: string) => void
  setUser: (user: AdminUser) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Hydrate synchronously so refresh keeps the current route (no flash to login/dashboard)
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!(initialUser && initialToken),

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

  setUser: (user) => {
    const storage = activeStorage()
    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    set({ user, isAuthenticated: !!(user && get().token) })
  },

  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    }),
}))
