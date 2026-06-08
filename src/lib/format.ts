/**
 * V2 J (06/06/2026) : helpers de formatage de chaines (toasts, boutons,
 * messages). Pour le JSX, utiliser le composant <Money /> dans
 * components/shared/Money.tsx.
 *
 * Cible : format francais fr-FR avec separateur de milliers (espace fine)
 *   1000000.5  -> "1 000 000,50 $US"
 *   1234       -> "1 234 USD"
 *
 * Decision Hugh 22/05/2026 : devise unique = USD (compatible USDC/USDT
 * on-chain, lisibilite internationale).
 */

const DEFAULT_CURRENCY = (import.meta.env.VITE_DEFAULT_CURRENCY as string) ?? 'USD'
const DEFAULT_LOCALE = (import.meta.env.VITE_DEFAULT_LOCALE as string) ?? 'fr-FR'

type FormatMoneyOptions = {
  currency?: string
  /** Force le nombre de decimales. Par defaut : 2 si non-entier, 0 si entier. */
  decimals?: number
  /** Si true, supprime les decimales (override le default). */
  noDecimals?: boolean
}

/**
 * Formate un montant en chaine type "1 234,56 $US".
 *
 * Pour usage dans les toasts, les boutons (label dynamique), les messages
 * de confirmation, etc. Pour l'affichage JSX, prefere <Money amount={n} />.
 */
export function formatMoney(
  amount: number | string | null | undefined,
  options: FormatMoneyOptions = {},
): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  if (value == null || Number.isNaN(value)) return '—'

  const currency = options.currency ?? DEFAULT_CURRENCY
  const decimals = options.noDecimals
    ? 0
    : options.decimals != null
      ? options.decimals
      : Number.isInteger(value)
        ? 0
        : 2

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Formate un nombre entier ou decimal avec separateur de milliers, sans
 * devise (parts, totaux divers, etc.).
 *
 *   formatNumber(1234567)      -> "1 234 567"
 *   formatNumber(1234.5, 2)    -> "1 234,50"
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals?: number,
): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (n == null || Number.isNaN(n)) return '—'

  const d = decimals != null ? decimals : Number.isInteger(n) ? 0 : 2
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n)
}

/**
 * Formate un pourcentage. La valeur est attendue en pourcent (ex : 75.5
 * pour 75,5 %), pas en fraction (0.755).
 *
 *   formatPercent(75.5)    -> "75,5 %"
 *   formatPercent(100, 0)  -> "100 %"
 */
export function formatPercent(
  value: number | null | undefined,
  decimals: number = 1,
): string {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value) + ' %'
}
