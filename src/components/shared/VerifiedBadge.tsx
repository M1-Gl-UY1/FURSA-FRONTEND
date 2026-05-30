import { CheckCircle2 } from 'lucide-react'

import { cn } from '@/lib/utils'

type Size = 'xs' | 'sm' | 'md' | 'lg'

type Props = {
  /** Si false ou undefined, ne rend rien. */
  verified?: boolean | null
  size?: Size
  /** Texte du tooltip natif (title). */
  label?: string
  /** Override des classes wrapper. */
  className?: string
  /** Mode "etiquette" : cercle + label "Verifie" inline. */
  withLabel?: boolean
}

const SIZE_CLASS: Record<Size, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

/**
 * Badge "verifie" style Facebook/Twitter : coche blanche dans un disque bleu.
 * - Affiche rien si `verified` n'est pas strictement true (evite les flickers
 *   sur les profils anonymes ou en attente).
 * - L'icone lucide CheckCircle2 garde le cercle et la coche d'un seul tenant
 *   (pas de bord blanc parasite quand le badge est superpose sur une couleur).
 */
export function VerifiedBadge({
  verified,
  size = 'sm',
  label = 'Profil verifie',
  className,
  withLabel = false,
}: Props) {
  if (verified !== true) return null

  if (withLabel) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-ocean-700 font-body text-xs font-medium',
          className
        )}
        title={label}
      >
        <CheckCircle2
          className={cn(SIZE_CLASS[size], 'text-ocean-600 fill-ocean-100')}
          strokeWidth={2.25}
          aria-hidden="true"
        />
        <span>Verifie</span>
      </span>
    )
  }

  return (
    <CheckCircle2
      className={cn(SIZE_CLASS[size], 'text-ocean-600 fill-ocean-100 shrink-0', className)}
      strokeWidth={2.25}
      role="img"
      aria-label={label}
    />
  )
}
