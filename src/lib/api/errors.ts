import axios from 'axios'

import type { ApiErrorBody } from './types'

/**
 * Extrait un message lisible depuis une erreur axios.
 * - Backend FURSA renvoie un body { message, fieldErrors? } via GlobalExceptionHandler.
 * - 429 (rate limit) : message spécifique.
 */
export function extractApiError(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const status = error.response?.status
  const data = error.response?.data as Partial<ApiErrorBody> & { message?: string } | undefined

  if (status === 429) {
    return data?.message ?? 'Trop de tentatives. Réessayez dans une minute.'
  }

  if (status === 401) {
    return data?.message ?? 'Identifiants invalides.'
  }

  if (data?.message) {
    return data.message
  }

  if (data?.fieldErrors) {
    const first = Object.values(data.fieldErrors)[0]
    if (typeof first === 'string') return first
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion.'
  }

  return fallback
}

/**
 * Récupère les erreurs par champ pour les afficher inline (ex: email déjà utilisé).
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) return {}
  const data = error.response?.data as Partial<ApiErrorBody> | undefined
  return data?.fieldErrors ?? {}
}
