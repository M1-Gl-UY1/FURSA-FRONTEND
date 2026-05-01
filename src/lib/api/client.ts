import axios, { AxiosError } from 'axios'

import { clearToken, getToken } from '@/lib/auth/token'

const baseURL = import.meta.env.VITE_API_BASE ?? 'http://localhost:8081'

export const api = axios.create({
  baseURL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inject JWT on every request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Évite de cycler quand on est déjà sur la page login
      const onAuthPage = ['/login', '/register'].some((p) =>
        window.location.pathname.startsWith(p)
      )
      if (!onAuthPage) {
        clearToken()
        const redirect = window.location.pathname + window.location.search
        window.location.href = `/login?expired=true&redirect=${encodeURIComponent(redirect)}`
      }
    }
    return Promise.reject(error)
  }
)
