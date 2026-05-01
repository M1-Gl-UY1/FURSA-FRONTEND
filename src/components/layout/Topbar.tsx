import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { NotificationsDropdown } from './NotificationsDropdown'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  opportunites: 'Opportunités',
  portefeuille: 'Portefeuille',
  transactions: 'Transactions',
  dividendes: 'Dividendes',
  marche: 'Marché',
  secondaire: 'Marché secondaire',
  'mes-annonces': 'Mes annonces',
  'nouvelle-annonce': 'Nouvelle annonce',
  notifications: 'Notifications',
  compte: 'Mon profil',
  'proposer-un-bien': 'Proposer un bien',
  'mes-proprietes': 'Mes propriétés',
  'declarer-revenu': 'Déclarer un revenu',
  modifier: 'Modifier',
  acheter: 'Acheter',
}

function humanizeSegment(segment: string): string {
  return ROUTE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
}

type TopbarProps = {
  onOpenSidebar: () => void
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  return (
    <header className="sticky top-0 z-30 h-16 bg-sand-50/85 backdrop-blur-md border-b border-earth/8">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Burger mobile + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenSidebar}
            aria-label="Ouvrir le menu"
            className="md:hidden text-earth"
          >
            <Menu strokeWidth={1.75} />
          </Button>

          {/* Breadcrumb (desktop only, mobile cache pour gagner la place) */}
          <nav aria-label="Fil d'Ariane" className="hidden sm:flex items-center gap-2 min-w-0">
            {segments.length === 0 ? (
              <span className="font-body text-sm text-earth-500">Accueil</span>
            ) : (
              segments.map((segment, i) => {
                const isLast = i === segments.length - 1
                const path = '/' + segments.slice(0, i + 1).join('/')
                return (
                  <span key={path} className="flex items-center gap-2 min-w-0">
                    {i > 0 && (
                      <span className="text-earth-300" aria-hidden="true">
                        /
                      </span>
                    )}
                    {isLast ? (
                      <span className="font-body font-semibold text-earth text-sm truncate">
                        {humanizeSegment(segment)}
                      </span>
                    ) : (
                      <Link
                        to={path}
                        className="font-body text-sm text-earth-500 hover:text-earth transition-colors truncate"
                      >
                        {humanizeSegment(segment)}
                      </Link>
                    )}
                  </span>
                )
              })
            )}
          </nav>
        </div>

        {/* Cloche notifications avec dropdown */}
        <div className="flex items-center gap-1 sm:gap-2">
          <NotificationsDropdown />
        </div>
      </div>
    </header>
  )
}
