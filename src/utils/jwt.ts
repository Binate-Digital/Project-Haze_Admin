/** Decode JWT payload without verifying signature (client-side expiry check). */
export function getJwtExpiryMs(token: string | null | undefined): number | null {
  if (!token) return null
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(''),
      ),
    ) as { exp?: number }
    if (!json.exp) return null
    return json.exp * 1000
  } catch {
    return null
  }
}

export function isJwtExpired(token: string | null | undefined, skewMs = 15_000): boolean {
  const expMs = getJwtExpiryMs(token)
  if (expMs == null) return false
  return Date.now() >= expMs - skewMs
}
