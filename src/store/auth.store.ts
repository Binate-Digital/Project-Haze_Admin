import { create } from 'zustand'
import { STORAGE_KEYS } from '@/config'
import type { AdminUser } from '@/types/auth'
import { isJwtExpired } from '@/utils/jwt'

function activeStorage(): Storage {
  if (localStorage.getItem(STORAGE_KEYS.TOKEN)) return localStorage
  if (sessionStorage.getItem(STORAGE_KEYS.TOKEN)) return sessionStorage
  return localStorage.getItem(STORAGE_KEYS.REMEMBER) === '1' ? localStorage : sessionStorage
}

function clearAuthStorage() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN)
  sessionStorage.removeItem(STORAGE_KEYS.USER)
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

function readValidSession(): { user: AdminUser | null; token: string | null } {
  const user = readStoredUser()
  const token = readStoredToken()
  if (!user || !token) return { user: null, token: null }
  if (isJwtExpired(token)) {
    clearAuthStorage()
    return { user: null, token: null }
  }
  return { user, token }
}

const initial = readValidSession()

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
  user: initial.user,
  token: initial.token,
  isAuthenticated: !!(initial.user && initial.token),

  hydrate: () => {
    const { user, token } = readValidSession()
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

  logout: () => {
    clearAuthStorage()
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  },
}))
