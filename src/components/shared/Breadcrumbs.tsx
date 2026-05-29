import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export type BreadcrumbItem = {
  /** Texte affiche. */
  label: string
  /** Lien optionnel. Si absent ou non fourni sur le dernier item, c'est la page courante. */
  to?: string
}

type Props = {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Fil d'Ariane discret pour les pages profondes (notamment admin).
 *
 * Polish UX : orientation immediate sur les chemins de 3 niveaux ou plus.
 * Le dernier item est rendu en text-earth font-semibold (page courante,
 * non cliquable). Les precedents sont cliquables, en text-earth-500.
 */
export function Breadcrumbs({ items, className }: Props) {
  if (!items || items.length === 0) return null

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn('flex items-center flex-wrap gap-1 text-xs font-body mb-4', className)}
    >
      {items.map((it, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={`${i}-${it.label}`} className="inline-flex items-center gap-1">
            {it.to && !isLast ? (
              <Link
                to={it.to}
                className="text-earth-500 hover:text-earth transition-colors"
              >
                {it.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast ? 'text-earth font-semibold' : 'text-earth-500'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {it.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight
                className="w-3 h-3 text-earth-300 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
            )}
          </span>
        )
      })}
    </nav>
  )
}
