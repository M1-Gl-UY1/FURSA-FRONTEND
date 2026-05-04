/**
 * Détection du hostname admin.
 * Si l'app est servie depuis admin.fursa.seed-innov.com (ou tout sous-domaine
 * commençant par "admin."), on bascule en mode back-office.
 */
export function isAdminHost(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname.startsWith('admin.')
}
