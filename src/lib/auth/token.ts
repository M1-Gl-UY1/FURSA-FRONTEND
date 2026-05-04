// Stockage des tokens cote client.
// V2 : access token (JWT court ~1h) + refresh token (opaque ~7j, revocable serveur).
// L'intercepteur axios echange automatiquement le refresh contre une nouvelle paire sur 401.

const ACCESS_KEY = 'fursa_token'
const REFRESH_KEY = 'fursa_refresh'

export function getToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  localStorage.setItem(ACCESS_KEY, token)
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token)
}

export function setTokens(access: string, refresh: string): void {
  setToken(access)
  setRefreshToken(refresh)
}

export function clearToken(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function hasToken(): boolean {
  return !!getToken()
}
