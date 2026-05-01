import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { api } from '@/lib/api/client'
import type { AuthResponse, CurrentUser, LoginRequest, RegisterRequest } from '@/lib/api/types'
import { clearToken, getToken, setToken } from '@/lib/auth/token'

type AuthContextValue = {
  user: CurrentUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<CurrentUser>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(!!getToken())

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

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const { data } = await api.post<AuthResponse>('/api/user/auth/login', credentials)
      setToken(data.token)
      await fetchMe()
    },
    [fetchMe]
  )

  const register = useCallback(async (payload: RegisterRequest) => {
    const { data } = await api.post<CurrentUser>('/api/user/auth/register', payload)
    return data
  }, [])

  const logout = useCallback(() => {
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
