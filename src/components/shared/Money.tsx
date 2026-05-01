import { cn } from '@/lib/utils'

const DEFAULT_CURRENCY = (import.meta.env.VITE_DEFAULT_CURRENCY as string) ?? 'EUR'
const DEFAULT_LOCALE = (import.meta.env.VITE_DEFAULT_LOCALE as string) ?? 'fr-FR'

type MoneyProps = {
  amount: number | string | null | undefined
  currency?: string
  /** Affichage compact : 12.5K€ au lieu de 12 500 € */
  compact?: boolean
  /** Cache les centimes même si montant à virgule */
  noDecimals?: boolean
  /** Police mono (par défaut true — convention financière FURSA) */
  mono?: boolean
  className?: string
}

export function Money({
  amount,
  currency = DEFAULT_CURRENCY,
  compact = false,
  noDecimals = false,
  mono = true,
  className,
}: MoneyProps) {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount

  if (value == null || Number.isNaN(value)) {
    return <span className={cn(mono && 'font-mono', className)}>—</span>
  }

  const formatted = new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: noDecimals || Number.isInteger(value) ? 0 : 2,
    minimumFractionDigits: noDecimals ? 0 : value % 1 === 0 ? 0 : 2,
  }).format(value)

  return <span className={cn(mono && 'font-mono', className)}>{formatted}</span>
}
