import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { api } from '@/lib/api/client'
import type { AuthResponse, CurrentUser, LoginRequest, RegisterRequest } from '@/lib/api/types'
import { clearToken, getRefreshToken, getToken, setTokens } from '@/lib/auth/token'

/**
 * Decode le champ `exp` (timestamp Unix en secondes) d'un JWT sans verifier la signature.
 * Renvoie null si parsing impossible.
 */
function getTokenExpMs(token: string | null): number | null {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

type AuthContextValue = {
  user: CurrentUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<CurrentUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(!!getToken())
  const expiryTimerRef = useRef<number | null>(null)

  const fetchMe = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      return
    }
    try {
      const { data } = await api.get<CurrentUser>('/api/user/me')
      setUser(data)
    } catch {
      clearToken()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    fetchMe().finally(() => setIsLoading(false))
  }, [fetchMe])

  /**
   * Deconnexion proactive : on lit l'exp du JWT et on declenche un timer qui force
   * la deconnexion + redirection /login?expired=true des que le token expire.
   * Evite le moment ou l'user a un token mort, voit des erreurs CORS pendant
   * que le backend rejette tout, et reste bloque sans feedback clair.
   */
  useEffect(() => {
    // Cleanup precedent
    if (expiryTimerRef.current) {
      window.clearTimeout(expiryTimerRef.current)
      expiryTimerRef.current = null
    }
    if (!user) return // pas connecte, rien a programmer

    const token = getToken()
    const expMs = getTokenExpMs(token)
    if (!expMs) return

    // Marge de securite : on declenche 10 sec AVANT l'expiration reelle
    // pour que la derniere requete passe encore (sinon race condition).
    const delay = expMs - Date.now() - 10_000
    if (delay <= 0) {
      // Deja expire au montage
      forceLogoutExpired()
      return
    }
    expiryTimerRef.current = window.setTimeout(() => {
      // Tentative refresh silencieuse au cas ou
      const rt = getRefreshToken()
      if (!rt) {
        forceLogoutExpired()
        return
      }
      // L'interceptor axios va tenter le refresh au prochain appel.
      // Si l'user est inactif, on force quand meme la deconnexion clean.
      forceLogoutExpired()
    }, delay)

    return () => {
      if (expiryTimerRef.current) {
        window.clearTimeout(expiryTimerRef.current)
        expiryTimerRef.current = null
      }
    }
  }, [user])

  function forceLogoutExpired() {
    clearToken()
    setUser(null)
    // Evite la boucle si on est deja sur /login
    const onAuth = ['/login', '/register'].some((p) => window.location.pathname.startsWith(p))
    if (!onAuth) {
      const redirect = window.location.pathname + window.location.search
      window.location.href = `/login?expired=true&redirect=${encodeURIComponent(redirect)}`
    }
  }

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const { data } = await api.post<AuthResponse>('/api/user/auth/login', credentials)
      setTokens(data.token, data.refreshToken)
      await fetchMe()
    },
    [fetchMe]
  )

  const register = useCallback(async (payload: RegisterRequest) => {
    const { data } = await api.post<CurrentUser>('/api/user/auth/register', payload)
    return data
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await api.post('/api/user/auth/logout', { refreshToken })
      } catch {
        // Logout serveur best-effort : on nettoie le client meme si le serveur echoue.
      }
    }
    clearToken()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      isLoading,
      login,
      register,
      logout,
      refresh: fetchMe,
    }),
    [user, isLoading, login, register, logout, fetchMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}
