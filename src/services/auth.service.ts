import { api } from '@/services/api'
import type { AdminUser, ApiEnvelope, LoginPayload } from '@/types/auth'
import { STORAGE_KEYS } from '@/config'

type AuthData = AdminUser & { token: string }

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<ApiEnvelope<AuthData>>('/admin/login', {
      email: payload.email,
      password: payload.password,
    })

    if (!data.status || !data.data?.token) {
      throw new Error(data.message || 'Login failed')
    }

    const { token, ...user } = data.data
    const storage = payload.rememberMe ? localStorage : sessionStorage
    const other = payload.rememberMe ? sessionStorage : localStorage

    other.removeItem(STORAGE_KEYS.TOKEN)
    other.removeItem(STORAGE_KEYS.USER)
    storage.setItem(STORAGE_KEYS.TOKEN, token)
    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    localStorage.setItem(STORAGE_KEYS.REMEMBER, payload.rememberMe ? '1' : '0')

    return { user: user as AdminUser, token }
  },

  async logout() {
    try {
      await api.patch('/auth/logout')
    } catch {
      // discard token either way
    }
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN)
    sessionStorage.removeItem(STORAGE_KEYS.USER)
  },

  async forgotPassword(email: string) {
    const { data } = await api.post<ApiEnvelope<{ userId: string; otp?: string; email: string }>>(
      '/auth/forgot-password',
      { email },
    )
    if (!data.status) throw new Error(data.message || 'Failed to send OTP')
    return data
  },

  async verifyForgotOtp(email: string, otp: string) {
    const { data } = await api.post<ApiEnvelope<unknown>>('/auth/forgot-password/verify-otp', {
      email,
      otp,
    })
    if (!data.status) throw new Error(data.message || 'Invalid OTP')
    return data
  },

  async setForgotPassword(payload: {
    email: string
    newPassword: string
    confirmPassword: string
  }) {
    const { data } = await api.post<ApiEnvelope<unknown>>('/auth/forgot-password/set-password', payload)
    if (!data.status) throw new Error(data.message || 'Failed to set password')
    return data
  },
}
