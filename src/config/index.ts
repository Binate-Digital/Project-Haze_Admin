export const env = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
    'https://project-haze-backend.deployment-uat.com',
}

export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/',
  BUSINESSES: '/businesses',
  BUSINESS_DETAIL: '/businesses/:businessId',
  BLOGS: '/blogs',
  EDUCATION: '/education',
  ADS: '/ads',
  PACKAGES: '/packages',
  LEGAL: '/legal',
  USERS: '/users',
  NOTIFICATIONS: '/notifications',
  REPORTS: '/reports',
  ORDERS: '/orders',
  ANALYTICS: '/analytics',
  PROFILE: '/profile',
  UPDATE_PASSWORD: '/update-password',
} as const

export const STORAGE_KEYS = {
  TOKEN: 'haze_admin_token',
  USER: 'haze_admin_user',
  REMEMBER: 'haze_admin_remember',
} as const

export const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.ANALYTICS, label: 'Analytics' },
  { to: ROUTES.BUSINESSES, label: 'Businesses' },
  { to: ROUTES.USERS, label: 'Users' },
  { to: ROUTES.BLOGS, label: 'Blogs' },
  { to: ROUTES.EDUCATION, label: 'Education' },
  { to: ROUTES.ADS, label: 'Ads' },
  { to: ROUTES.ORDERS, label: 'Orders' },
  { to: ROUTES.PACKAGES, label: 'Packages' },
  { to: ROUTES.NOTIFICATIONS, label: 'Push blasts' },
  { to: ROUTES.REPORTS, label: 'Reports' },
  { to: ROUTES.LEGAL, label: 'Legal' },
] as const
