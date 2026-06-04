import { cn } from '@/lib/utils'

type StatusKey =
  // Propriété
  | 'BROUILLON'
  | 'EN_REVIEW'
  | 'EN_TOKENISATION'
  | 'ACCEPTEE'
  | 'PUBLIEE'
  | 'FINANCEE'
  | 'CLOTUREE'
  | 'REFUSEE'
  // Paiement / Transaction
  | 'EN_ATTENTE'
  | 'VALIDE'
  | 'SUCCES'
  | 'EN_COURS'
  | 'ECHEC'
  | 'REMBOURSE'
  // Annonce
  | 'OUVERTE'
  | 'COMPLETEE'
  | 'ANNULEE'
  // Dividende / Revenu
  | 'DISTRIBUE'
  | 'REFUSE'
  // Verification d'identite (anciennement KYC)
  | 'NONE'
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'

type StatusConfig = {
  label: string
  /** Tailwind classes pour bg + text */
  className: string
}

const STATUS_MAP: Record<StatusKey, StatusConfig> = {
  // Propriété
  BROUILLON:        { label: 'Brouillon',          className: 'bg-sand-300 text-earth-700' },
  EN_REVIEW:        { label: 'En examen',          className: 'bg-warning/15 text-warning' },
  EN_TOKENISATION:  { label: 'Tokenisation en cours', className: 'bg-ocean/15 text-ocean' },
  ACCEPTEE:         { label: 'Acceptée',           className: 'bg-ocean/15 text-ocean' },
  PUBLIEE:          { label: 'Publiée',            className: 'bg-success/15 text-success' },
  FINANCEE:         { label: 'Financée',           className: 'bg-gold/20 text-gold-700' },
  CLOTUREE:         { label: 'Clôturée',           className: 'bg-earth/10 text-earth-600' },
  REFUSEE:          { label: 'Refusée',            className: 'bg-error/15 text-error' },

  // Paiement / Transaction
  EN_ATTENTE:  { label: 'En attente',  className: 'bg-warning/15 text-warning' },
  VALIDE:      { label: 'Validé',      className: 'bg-success/15 text-success' },
  SUCCES:      { label: 'Succès',      className: 'bg-success/15 text-success' },
  EN_COURS:    { label: 'En cours',    className: 'bg-ocean/15 text-ocean' },
  ECHEC:       { label: 'Échec',       className: 'bg-error/15 text-error' },
  REMBOURSE:   { label: 'Remboursé',   className: 'bg-earth/10 text-earth-600' },

  // Annonce
  OUVERTE:     { label: 'Ouverte',     className: 'bg-success/15 text-success' },
  COMPLETEE:   { label: 'Complétée',   className: 'bg-ocean/15 text-ocean' },
  ANNULEE:     { label: 'Annulée',     className: 'bg-earth/10 text-earth-600' },

  // Dividende / Revenu
  DISTRIBUE:   { label: 'Distribué',   className: 'bg-gold/20 text-gold-700' },
  REFUSE:      { label: 'Refusé',      className: 'bg-error/15 text-error' },

  // Verification d'identite (anciennement KYC)
  NONE:        { label: 'Non vérifiée', className: 'bg-sand-300 text-earth-600' },
  PENDING:     { label: 'En attente',   className: 'bg-warning/15 text-warning' },
  IN_REVIEW:   { label: 'En examen',    className: 'bg-ocean/15 text-ocean' },
  APPROVED:    { label: 'Vérifiée',     className: 'bg-success/15 text-success' },
  REJECTED:    { label: 'Refusée',      className: 'bg-error/15 text-error' },
  EXPIRED:     { label: 'Expirée',      className: 'bg-earth/10 text-earth-600' },
}

type StatusBadgeProps = {
  status: string  // accepte n'importe quelle string, fallback gracieux
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = STATUS_MAP[status as StatusKey] ?? {
    label: status,
    className: 'bg-earth/10 text-earth-600',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-body font-semibold rounded-full whitespace-nowrap',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
