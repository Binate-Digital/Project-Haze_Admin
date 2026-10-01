import axios from 'axios'
import { env, ROUTES, STORAGE_KEYS } from '@/config'
import { useAuthStore } from '@/store/auth.store'
import { isJwtExpired } from '@/utils/jwt'

function getToken(): string | null {
  return (
    localStorage.getItem(STORAGE_KEYS.TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.TOKEN)
  )
}

function clearAuthStorage() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN)
  sessionStorage.removeItem(STORAGE_KEYS.USER)
}

function isAuthPage(pathname: string) {
  return (
    pathname === ROUTES.LOGIN ||
    pathname.startsWith(ROUTES.LOGIN) ||
    pathname === ROUTES.FORGOT_PASSWORD ||
    pathname.startsWith(ROUTES.FORGOT_PASSWORD)
  )
}

function isAuthEndpoint(url?: string) {
  const path = String(url || '')
  return (
    path.includes('/admin/login') ||
    path.includes('/auth/forgot-password') ||
    path.includes('/auth/login')
  )
}

function isSessionExpiredError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false

  // After long idle, browsers often surface expired sessions as Network Error
  // (no HTTP response / CORS / connection reset) instead of 401.
  if (!error.response) {
    if (isAuthEndpoint(error.config?.url)) return false
    if (!getToken()) return false
    const code = String(error.code || '')
    const msg = String(error.message || '').toLowerCase()
    return (
      code === 'ERR_NETWORK' ||
      code === 'ECONNABORTED' ||
      code === 'ERR_CONNECTION_RESET' ||
      code === 'ERR_CONNECTION_CLOSED' ||
      msg.includes('network error') ||
      msg.includes('timeout')
    )
  }

  const status = error.response.status
  const message = String(
    (error.response.data as { message?: string } | undefined)?.message || '',
  ).toLowerCase()

  if (status === 401) return true

  // Legacy backends sometimes returned 400 for expired JWT
  if (
    status === 400 &&
    (message.includes('expired') ||
      message.includes('invalid or expired token') ||
      message.includes('access token is missing') ||
      message.includes('authorization header') ||
      message.includes('session expired'))
  ) {
    return true
  }

  return false
}

let redirectingToLogin = false

export function forceLoginRedirect() {
  clearAuthStorage()
  try {
    useAuthStore.getState().logout()
  } catch {
    // store may be unavailable during early bootstrap
  }

  if (typeof window === 'undefined') return
  if (isAuthPage(window.location.pathname)) return
  if (redirectingToLogin) return

  redirectingToLogin = true
  const next = `${ROUTES.LOGIN}?session=expired`
  window.location.replace(next)
}

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    if (isJwtExpired(token) && !isAuthEndpoint(config.url)) {
      forceLoginRedirect()
      return Promise.reject(
        Object.assign(new Error('Session expired. Please sign in again.'), {
          isSessionExpired: true,
        }),
      )
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (isSessionExpiredError(error)) {
      forceLoginRedirect()
      return Promise.reject(
        Object.assign(new Error('Session expired. Please sign in again.'), {
          isSessionExpired: true,
          cause: error,
        }),
      )
    }
    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (
    error &&
    typeof error === 'object' &&
    'isSessionExpired' in error &&
    (error as { isSessionExpired?: boolean }).isSessionExpired
  ) {
    return 'Session expired. Please sign in again.'
  }
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    return data?.message || error.message || fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
