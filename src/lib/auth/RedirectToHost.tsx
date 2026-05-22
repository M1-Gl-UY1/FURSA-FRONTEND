import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Redirige hors-React (window.location.replace) vers un autre hostname,
 * en preservant le path + query courants.
 *
 * Utilise pour les routes accedees depuis le mauvais sous-domaine :
 *   - /admin/* sur fursa.seed-innov.com   -> redirect admin.fursa.seed-innov.com
 *   - /dashboard sur admin.fursa.seed-innov.com -> redirect fursa.seed-innov.com
 */
export function RedirectToHost({ targetOrigin }: { targetOrigin: string }) {
  const location = useLocation()
  useEffect(() => {
    const target = `${targetOrigin}${location.pathname}${location.search}${location.hash}`
    window.location.replace(target)
  }, [targetOrigin, location.pathname, location.search, location.hash])

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50">
      <div className="font-body text-earth-600 text-sm">Redirection...</div>
    </div>
  )
}
