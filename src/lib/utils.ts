import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resout une URL de fichier servie par le backend (endpoint /api/fichiers/{nom}).
 *
 * Fix critique (25/05/2026) : le backend stocke 2 formats INCOHERENTS selon
 * la source :
 *   - Document.url (proprietes / certification) = NOM SEUL ex "abc.pdf"
 *   - KycSubmission.selfieUrl + Revenus.justificatifUrl = "/api/fichiers/abc.pdf"
 *
 * Cette fonction normalise les 3 cas vers une URL absolue chargeable :
 *   1. URL http(s):// absolue  -> retournee intacte
 *   2. chemin "/api/..."        -> prefixe avec VITE_API_BASE
 *   3. nom de fichier seul       -> prefixe avec VITE_API_BASE + "/api/fichiers/"
 *
 * Sans VITE_API_BASE (dev local + proxy vite), retourne des chemins relatifs
 * valides (/api/fichiers/abc.pdf).
 */
export function resolveFileUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')
  // Cas 2 : chemin API deja forme (/api/fichiers/xxx, /api/xxx)
  if (url.startsWith('/')) return `${base}${url}`
  // Cas 3 : nom de fichier seul -> ajouter le chemin de l'endpoint
  return `${base}/api/fichiers/${url}`
}
