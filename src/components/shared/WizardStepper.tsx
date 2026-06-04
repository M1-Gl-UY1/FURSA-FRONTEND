import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

type WizardStepperProps = {
  steps: string[]
  /** Index 0-based de l'étape courante */
  current: number
  className?: string
}

/**
 * Affiche la progression d'un wizard sous forme de pastilles numérotées
 * reliées par des traits.
 *
 * Refonte 04/06/2026 (G.3) :
 * - Conteneur `overflow-x-auto` : sur petits écrans le stepper scrolle
 *   horizontalement au lieu de tronquer les labels avec « ... ».
 * - `min-w` par étape : garantit assez de place pour afficher le libellé
 *   complet sans ellipse, jusqu'à 8+ étapes.
 * - Connecteur HORIZONTAL aligné sur la ligne médiane des pastilles (LEFT et
 *   RIGHT autour du cercle), via un flex-row dans la colonne de chaque étape.
 *   Plus robuste que le précédent `-mt-6` qui se cassait visuellement.
 */
export function WizardStepper({ steps, current, className }: WizardStepperProps) {
  return (
    <nav
      aria-label="Progression"
      className={cn('overflow-x-auto -mx-1 px-1', className)}
    >
      <ol className="flex items-start min-w-fit">
        {steps.map((label, i) => {
          const isDone = i < current
          const isCurrent = i === current
          const isFirst = i === 0
          const isLast = i === steps.length - 1
          const leftConnectorActive = i <= current
          const rightConnectorActive = i < current

          return (
            <li
              key={label}
              className="flex-1 min-w-[88px] sm:min-w-[112px]"
            >
              <div className="flex flex-col items-center w-full">
                {/* Ligne medianne : connector gauche + pastille + connector droit */}
                <div className="flex items-center w-full">
                  <div
                    className={cn(
                      'flex-1 h-0.5 transition-colors',
                      isFirst
                        ? 'invisible'
                        : leftConnectorActive
                          ? 'bg-terra'
                          : 'bg-sand-300'
                    )}
                  />
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-sm transition-colors shrink-0',
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
                  <div
                    className={cn(
                      'flex-1 h-0.5 transition-colors',
                      isLast
                        ? 'invisible'
                        : rightConnectorActive
                          ? 'bg-terra'
                          : 'bg-sand-300'
                    )}
                  />
                </div>

                {/* Libelle : peut wrap sur 2 lignes si besoin (pas de truncate) */}
                <span
                  className={cn(
                    'mt-2 px-1 font-body text-[11px] sm:text-xs font-semibold text-center leading-tight',
                    (isDone || isCurrent) ? 'text-earth' : 'text-earth-500'
                  )}
                >
                  {label}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
