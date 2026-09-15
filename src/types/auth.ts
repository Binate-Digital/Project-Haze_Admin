export type AdminAddress = {
  streetAddress?: string
  city?: string
  state?: string
  zipCode?: string
  apartmentSuiteFloor?: string
}

export type AdminUser = {
  _id: string
  email?: string
  fullName?: string | null
  phoneNumber?: string | null
  bio?: string | null
  userImg?: string | null
  address?: AdminAddress | null
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
