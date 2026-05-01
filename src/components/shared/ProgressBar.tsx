import { cn } from '@/lib/utils'

type ProgressBarProps = {
  /** Valeur entre 0 et 100 */
  value: number
  /** Affiche le label "X%" à droite */
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function ProgressBar({
  value,
  showLabel = true,
  size = 'md',
  className,
}: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex-1 bg-sand-300 rounded-full overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2'
        )}
        role="progressbar"
        aria-valuenow={Math.round(safeValue)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-gradient-to-r from-terra to-gold rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${safeValue}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            'font-mono font-semibold text-terra shrink-0 tabular-nums',
            size === 'sm' ? 'text-[11px]' : 'text-xs'
          )}
        >
          {Math.round(safeValue)}%
        </span>
      )}
    </div>
  )
}
