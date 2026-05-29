import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'terra' | 'ocean' | 'success' | 'warning'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  /** Couleur d'ambiance du halo + de l'icone. Default 'terra'. */
  tone?: Tone
  className?: string
}

const TONE_STYLES: Record<Tone, { halo: string; bg: string; icon: string }> = {
  neutral: {
    halo: 'bg-earth/8',
    bg: 'bg-gradient-to-br from-sand-100 to-sand-200',
    icon: 'text-earth-500',
  },
  terra: {
    halo: 'bg-terra/15',
    bg: 'bg-gradient-to-br from-terra/15 to-terra/5',
    icon: 'text-terra',
  },
  ocean: {
    halo: 'bg-ocean/15',
    bg: 'bg-gradient-to-br from-ocean/15 to-ocean/5',
    icon: 'text-ocean',
  },
  success: {
    halo: 'bg-success/15',
    bg: 'bg-gradient-to-br from-success/15 to-success/5',
    icon: 'text-success',
  },
  warning: {
    halo: 'bg-warning/15',
    bg: 'bg-gradient-to-br from-warning/15 to-warning/5',
    icon: 'text-warning',
  },
}

/**
 * Empty state enrichi : icone sur fond degrade + halo flou decoratif + action.
 * Polish UX : remplace l'ancienne pastille grise plate par un visuel premium
 * coherent avec le reste de la plateforme (heros gradient, halos).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'terra',
  className,
}: EmptyStateProps) {
  const styles = TONE_STYLES[tone]
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center text-center py-14 px-6 overflow-hidden',
        className
      )}
    >
      {/* Halo decoratif derriere */}
      {Icon && (
        <div
          aria-hidden="true"
          className={cn(
            'absolute top-2 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full blur-3xl pointer-events-none',
            styles.halo
          )}
        />
      )}

      {Icon && (
        <div
          className={cn(
            'relative w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-card',
            styles.bg
          )}
        >
          <Icon className={cn('w-8 h-8', styles.icon)} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="relative font-display font-bold text-earth text-lg sm:text-xl mb-2">
        {title}
      </h3>
      {description && (
        <p className="relative font-body text-earth-600 text-sm max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="relative">{action}</div>}
    </div>
  )
}
