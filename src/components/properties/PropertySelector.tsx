import { Check, MapPin } from 'lucide-react'

import { Money } from '@/components/shared/Money'
import type { PossessionResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type Option = PossessionResponse & {
  /** Parts disponibles à la vente (parts détenues - parts en annonces ouvertes) */
  partsDisponiblesAVente: number
}

type PropertySelectorProps = {
  options: Option[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export function PropertySelector({ options, selectedId, onSelect }: PropertySelectorProps) {
  if (options.length === 0) {
    return (
      <div className="bg-sand-100 rounded-md border border-earth/8 p-6 text-center">
        <p className="font-body text-earth-600 text-sm">
          Vous n'avez aucune propriété disponible à la vente.
        </p>
      </div>
    )
  }

  return (
    <ul role="radiogroup" className="space-y-3">
      {options.map((opt) => {
        const isSelected = opt.id === selectedId
        const noPartsDispo = opt.partsDisponiblesAVente <= 0

        return (
          <li key={opt.id}>
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={noPartsDispo}
              onClick={() => onSelect(opt.id)}
              className={cn(
                'w-full text-left bg-white rounded-lg border-[1.5px] p-4 transition-all',
                'flex items-center gap-4',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2',
                isSelected
                  ? 'border-terra ring-2 ring-terra/15 shadow-card'
                  : 'border-sand-400 hover:border-earth/30 hover:shadow-card',
                noPartsDispo && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Radio visuel */}
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-[2px] shrink-0 flex items-center justify-center transition-colors',
                  isSelected ? 'border-terra bg-terra' : 'border-sand-500 bg-white'
                )}
              >
                {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-earth text-sm truncate">
                  {opt.proprieteNom}
                </p>
                <p className="flex items-center gap-1 text-earth-500 text-xs font-body truncate">
                  <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                  {opt.localisation}
                </p>
              </div>

              {/* Stats à droite */}
              <div className="text-right shrink-0">
                <p className="font-mono font-semibold text-earth text-sm">
                  {opt.partsDisponiblesAVente.toLocaleString('fr-FR')}
                  <span className="text-earth-400 text-xs"> / {opt.nombreDeParts.toLocaleString('fr-FR')}</span>
                </p>
                <p className="font-body text-[10px] text-earth-500">parts à vendre</p>
                <p className="font-mono text-[11px] text-earth-500 mt-0.5">
                  Prix actuel : <Money amount={opt.prixUnitairePart} mono={false} className="font-semibold" />
                </p>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
