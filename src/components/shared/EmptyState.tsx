import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-sand-200 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-earth-500" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="font-display font-semibold text-earth text-lg mb-1.5">{title}</h3>
      {description && (
        <p className="font-body text-earth-600 text-sm max-w-sm mb-5">{description}</p>
      )}
      {action}
    </div>
  )
}
