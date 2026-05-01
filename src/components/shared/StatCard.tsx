import { ArrowDown, ArrowUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: React.ReactNode
  /** Variation en pourcentage (positif = vert, négatif = rouge) */
  trend?: number | null
  trendLabel?: string
  icon?: LucideIcon
  iconBg?: string
  iconColor?: string
  className?: string
}

export function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  iconBg = 'bg-terra/10',
  iconColor = 'text-terra',
  className,
}: StatCardProps) {
  const hasTrend = trend != null && !Number.isNaN(trend)
  const isPositive = hasTrend && trend! > 0
  const isNegative = hasTrend && trend! < 0

  return (
    <div
      className={cn(
        'bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6 transition-shadow hover:shadow-card',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="font-body text-xs sm:text-sm text-earth-500 font-medium">
          {label}
        </p>
        {Icon && (
          <div className={cn('w-9 h-9 rounded-md flex items-center justify-center', iconBg)}>
            <Icon className={cn('w-4 h-4', iconColor)} strokeWidth={1.75} />
          </div>
        )}
      </div>
      <div className="font-mono font-bold text-earth text-2xl sm:text-3xl tracking-tight tabular-nums">
        {value}
      </div>
      {hasTrend && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-mono text-xs font-semibold',
              isPositive && 'text-success',
              isNegative && 'text-error',
              !isPositive && !isNegative && 'text-earth-500'
            )}
          >
            {isPositive && <ArrowUp className="w-3 h-3" strokeWidth={2.5} />}
            {isNegative && <ArrowDown className="w-3 h-3" strokeWidth={2.5} />}
            {trend! > 0 ? '+' : ''}
            {trend!}%
          </span>
          {trendLabel && (
            <span className="font-body text-xs text-earth-500">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
