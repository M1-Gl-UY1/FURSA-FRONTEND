/**
 * Detection des hostnames FURSA et helpers de redirection cross-host.
 *
 * Principe :
 *   - `fursa.seed-innov.com`        = front investisseur uniquement
 *   - `admin.fursa.seed-innov.com`  = backoffice admin uniquement
 *   - `api.fursa.seed-innov.com`    = backend Spring Boot (sert les deux fronts)
 *
 * En cas d'acces a une route admin depuis le hostname investisseur (ou inverse),
 * on redirige cote client vers le bon sous-domaine.
 */

export function isAdminHost(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname.startsWith('admin.')
}

/** Hostname investisseur attendu (= base host sans le prefix "admin."). */
export function getInvestisseurHost(): string {
  if (typeof window === 'undefined') return ''
  const h = window.location.hostname
  return h.startsWith('admin.') ? h.slice('admin.'.length) : h
}

/** URL absolue (protocol + host) du backoffice admin. */
export function adminOrigin(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.protocol}//admin.${getInvestisseurHost()}`
}

/** URL absolue (protocol + host) du front investisseur. */
export function investisseurOrigin(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.protocol}//${getInvestisseurHost()}`
}
