import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

type WizardStepperProps = {
  steps: string[]
  /** Index 0-based de l'étape courante */
  current: number
  className?: string
}

export function WizardStepper({ steps, current, className }: WizardStepperProps) {
  return (
    <ol className={cn('flex items-center w-full', className)} aria-label="Progression">
      {steps.map((label, i) => {
        const isDone = i < current
        const isCurrent = i === current
        const isLast = i === steps.length - 1

        return (
          <li
            key={label}
            className={cn('flex items-center', !isLast && 'flex-1')}
          >
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-sm transition-colors',
                  isDone && 'bg-terra text-white',
                  isCurrent && 'bg-terra text-white ring-4 ring-terra/20',
                  !isDone && !isCurrent && 'bg-sand-200 text-earth-500 border border-sand-400'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isDone ? (
                  <Check className="w-4 h-4" strokeWidth={2.75} />
                ) : (
                  i + 1
                )}
              </div>
              <span
                title={label}
                className={cn(
                  'font-body text-[11px] sm:text-xs font-semibold text-center',
                  // Largeur fixe = espacement uniforme. Truncate + tooltip natif
                  // au hover affiche le texte complet sans casser le layout.
                  'w-[72px] sm:w-[104px] truncate whitespace-nowrap',
                  (isDone || isCurrent) ? 'text-earth' : 'text-earth-500'
                )}
              >
                {label}
              </span>
            </div>

            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1 sm:mx-3 transition-colors -mt-6',
                  isDone ? 'bg-terra' : 'bg-sand-300'
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
