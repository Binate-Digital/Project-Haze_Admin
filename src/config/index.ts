export const env = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
    'https://project-haze-backend.deployment-uat.com',
}

export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/',
} as const

export const STORAGE_KEYS = {
  TOKEN: 'haze_admin_token',
  USER: 'haze_admin_user',
  REMEMBER: 'haze_admin_remember',
} as const
