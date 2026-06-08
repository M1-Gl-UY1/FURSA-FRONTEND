import { CheckCircle2, Clock } from 'lucide-react'

import type { StatutDeclarationResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type Props = {
  statut: StatutDeclarationResponse
  size?: 'sm' | 'md'
  showMonth?: boolean
}

/**
 * V2 W (07/06/2026) : badge synthetique du statut de declaration trimestrielle.
 * Toute notion de retard / penalite / urgence a ete supprimee a la demande PO.
 * Deux etats visibles uniquement :
 *
 *   - DECLARE                  : vert "✓ Déclaré pour {trimestre}"
 *   - DANS_FENETRE / EN_RETARD : ocre "À déclarer" (aucune difference visuelle,
 *                                 aucun decompte de jours, aucune alerte rouge)
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
    // V2 W : DANS_FENETRE et EN_RETARD sont fusionnés visuellement.
    // Aucune notion de retard / pénalité / urgence n'est exposée à l'utilisateur.
    case 'DANS_FENETRE':
    case 'EN_RETARD':
      return {
        icon: Clock,
        label: 'À déclarer',
        className: 'bg-warning/15 text-warning',
        title: `Revenus du trimestre ${formatMonthLong(s.moisADeclarer)} à déclarer.`,
      }
  }
}

/**
 * Format trimestriel : entree "2026-Q1", "2026-Q2", etc. (cf P3 Hugh 22/05/2026).
 * Fallback : ancien format "2026-05" (mensuel) pour compat retro.
 */
function formatMonthShort(value: string): string {
  if (/^\d{4}-Q[1-4]$/.test(value)) {
    return value // ex : "2026-Q1"
  }
  // Fallback mensuel
  const [y, m] = value.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' }).format(d)
}

function formatMonthLong(value: string): string {
  if (/^\d{4}-Q[1-4]$/.test(value)) {
    const [year, q] = value.split('-Q')
    const trimNames: Record<string, string> = {
      '1': '1er trimestre (jan-fev-mar)',
      '2': '2e trimestre (avr-mai-jun)',
      '3': '3e trimestre (jui-aou-sep)',
      '4': '4e trimestre (oct-nov-dec)',
    }
    return `${trimNames[q] ?? q} ${year}`
  }
  // Fallback mensuel
  const [y, m] = value.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d)
}

