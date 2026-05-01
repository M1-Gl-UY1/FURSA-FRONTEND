import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 p-6">
      <div className="text-center max-w-md">
        <p className="font-mono font-bold text-terra text-7xl mb-2">404</p>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-3">
          Page introuvable
        </h1>
        <p className="font-body text-earth-600 text-sm mb-8">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Button asChild>
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  )
}
