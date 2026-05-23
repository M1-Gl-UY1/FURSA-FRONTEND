import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

import type { StatutDeclarationResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type Props = {
  statut: StatutDeclarationResponse
  size?: 'sm' | 'md'
  showMonth?: boolean
}

/**
 * Phase 10b : badge synthetique du statut de declaration mensuelle d'une propriete.
 * - DECLARE   : vert "✓ Déclaré pour {mois}"
 * - DANS_FENETRE : ocre "À déclarer (J-X)"
 * - EN_RETARD : rouge "En retard — pénalité {300} EUR"
 */
export function StatutDeclarationBadge({ statut, size = 'md', showMonth = true }: Props) {
  const config = configFor(statut)
  const Icon = config.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-body font-semibold whitespace-nowrap',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        config.className
      )}
      title={config.title}
    >
      <Icon
        className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')}
        strokeWidth={2}
      />
      <span>
        {config.label}
        {showMonth && statut.statut === 'DECLARE' && (
          <> · {formatMonthShort(statut.moisADeclarer)}</>
        )}
      </span>
    </span>
  )
}

function configFor(s: StatutDeclarationResponse) {
  switch (s.statut) {
    case 'DECLARE':
      return {
        icon: CheckCircle2,
        label: 'Déclaré',
        className: 'bg-success/15 text-success',
        title: `Revenus déclarés pour ${formatMonthLong(s.moisADeclarer)}`,
      }
    case 'DANS_FENETRE': {
      const j = s.joursRestants
      return {
        icon: Clock,
        label:
          j === 0 ? 'À déclarer (dernier jour)' : `À déclarer (J-${j})`,
        className: 'bg-warning/15 text-warning',
        title: `Période ouverte jusqu'au 5 inclus. Aucune pénalité.`,
      }
    }
    case 'EN_RETARD':
      return {
        icon: AlertTriangle,
        label: `En retard · pénalité ${formatEur(s.penaliteSiDeclarationMaintenant)}`,
        className: 'bg-error/15 text-error',
        title: `Période normale fermée. ${formatEur(s.penaliteSiDeclarationMaintenant)} seront retenus si vous déclarez maintenant.`,
      }
  }
}

function formatMonthShort(yearMonth: string): string {
  const [y, m] = yearMonth.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' }).format(d)
}

function formatMonthLong(yearMonth: string): string {
  const [y, m] = yearMonth.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d)
}

function formatEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}
