import { TrendingDown, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'

type Props = {
  variationPct: number | null
  size?: 'sm' | 'md'
  /** Seuil sous lequel on n'affiche pas le badge (en %). Default : 0.5. */
  threshold?: number
  className?: string
}

/**
 * Affiche la variation de prix d'une part par rapport au prix initial.
 * Vert si positif, rouge si negatif, masque si null ou trop faible.
 *
 * P1 (Hugh 22/05/2026). Voir PRIX_DYNAMIQUE_FURSA.md.
 */
export function PriceVariationBadge({
  variationPct,
  size = 'md',
  threshold = 0.5,
  className,
}: Props) {
  if (variationPct == null || Math.abs(variationPct) < threshold) {
    return null
  }

  const positive = variationPct > 0
  const Icon = positive ? TrendingUp : TrendingDown
  const formatted = (positive ? '+' : '') + variationPct.toFixed(1) + '%'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full font-mono font-bold tabular-nums',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
        positive ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
        className
      )}
      title={
        positive
          ? `Le prix a augmente de ${formatted} depuis la mise en vente initiale.`
          : `Le prix a baisse de ${formatted} depuis la mise en vente initiale.`
      }
    >
      <Icon
        className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}
        strokeWidth={2.25}
      />
      {formatted}
    </span>
  )
}
