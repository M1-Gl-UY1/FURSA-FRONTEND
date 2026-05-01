// Stockage du JWT côté client.
// V1 : localStorage (simple, fonctionne offline-friendly).
// V2 envisagée : httpOnly cookie + refresh token.

const TOKEN_KEY = 'fursa_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function hasToken(): boolean {
  return !!getToken()
}
