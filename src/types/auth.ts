export type AdminUser = {
  _id: string
  email?: string
  fullName?: string | null
  role: 'admin'
  [key: string]: unknown
}

export type ApiEnvelope<T> = {
  status: boolean
  message: string
  data: T
}

export type LoginPayload = {
  email: string
  password: string
  rememberMe?: boolean
}
