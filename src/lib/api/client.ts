import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

import {
  clearToken,
  getRefreshToken,
  getToken,
  setTokens,
} from '@/lib/auth/token'

const baseURL = import.meta.env.VITE_API_BASE ?? 'http://localhost:8081'

export const api = axios.create({
  baseURL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inject access token sur toutes les requetes.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// =============================================================================
// Refresh token : retry automatique sur 401 (Facebook-style).
// Si plusieurs requetes echouent en meme temps, on ne lance qu'UN seul refresh
// et on met les autres en file d'attente.
// =============================================================================

type FailedRequest = {
  resolve: (token: string) => void
  reject: (err: unknown) => void
}

let isRefreshing = false
let queue: FailedRequest[] = []

function flushQueue(error: unknown, token: string | null) {
  queue.forEach(({ resolve, reject }) => {
    if (error || !token) reject(error)
    else resolve(token)
  })
  queue = []
}

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false
  return (
    url.includes('/api/user/auth/login') ||
    url.includes('/api/user/auth/register') ||
    url.includes('/api/user/auth/refresh') ||
    url.includes('/api/user/auth/logout')
  )
}

function redirectToLogin() {
  const onAuthPage = ['/login', '/register'].some((p) =>
    window.location.pathname.startsWith(p)
  )
  if (!onAuthPage) {
    const redirect = window.location.pathname + window.location.search
    window.location.href = `/login?expired=true&redirect=${encodeURIComponent(redirect)}`
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined

    // Pas un 401, ou requete deja retentee, ou un endpoint d'auth -> on laisse passer.
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isAuthEndpoint(original.url)
    ) {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearToken()
      redirectToLogin()
      return Promise.reject(error)
    }

    // Un refresh est deja en cours : on attend son resultat.
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        queue.push({ resolve, reject })
      }).then((newToken) => {
        original._retry = true
        original.headers = {
          ...(original.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        }
        return api(original)
      })
    }

    isRefreshing = true
    original._retry = true

    try {
      // Appel direct (sans interceptor) pour eviter un cycle si /refresh renvoie 401.
      const { data } = await axios.post(
        `${baseURL}/api/user/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      )
      setTokens(data.token, data.refreshToken)
      flushQueue(null, data.token)

      original.headers = {
        ...(original.headers ?? {}),
        Authorization: `Bearer ${data.token}`,
      }
      return api(original)
    } catch (refreshError) {
      flushQueue(refreshError, null)
      clearToken()
      redirectToLogin()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
