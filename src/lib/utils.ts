import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Prefixe une URL de fichier servie par le backend avec l'API base.
 *
 * Fix critique (25/05/2026) : le backend stocke des URLs relatives comme
 * "/api/fichiers/abc.jpg". Si on les utilise telles quelles dans un <a href>
 * ou <img src>, le navigateur les charge depuis l'origine du frontend
 * (fursa.seed-innov.com) au lieu de l'API (api.fursa.seed-innov.com) -> 404.
 *
 * - Si url commence par http(s)://, on la retourne intacte (URL absolue)
 * - Si url commence par /, on prefixe avec VITE_API_BASE
 * - Sinon (chemin relatif sans slash), pareil avec un slash de jointure
 */
export function resolveFileUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')
  if (!base) return url
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`
}
