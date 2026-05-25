import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { PropertyCatalogCard } from '@/components/properties/PropertyCatalogCard'
import { Button } from '@/components/ui/button'
import { useProprietes } from '@/lib/api/proprietes'
import type { ProprieteResponse } from '@/lib/api/types'

/**
 * Featured opportunities sur la landing : top 3 biens publies les plus
 * proches d'etre finances (% le plus haut). Utilise la PropertyCatalogCard
 * refondue (P4) pour cohérence avec la page /opportunites.
 */
export function Opportunites() {
  const { data } = useProprietes()

  const featured = (data ?? [])
    .filter((p) => p.statut === 'PUBLIEE')
    .map((p) => ({ p, pct: pourcentageFinance(p) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)
    .map(({ p }) => p)

  return (
    <section className="bg-sand-50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <p className="font-body text-xs uppercase tracking-widest text-terra font-semibold mb-2">
              Opportunités du moment
            </p>
            <h2 className="font-display font-bold text-earth text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              Investissez dès aujourd'hui
            </h2>
            <p className="font-body text-earth-600 text-sm sm:text-base mt-3 max-w-xl">
              Biens vérifiés, certifiés, prêts à générer des revenus locatifs trimestriels.
            </p>
          </div>
          <Button asChild variant="outline" size="lg">
            <Link to="/opportunites" className="group">
              Voir tout le catalogue
              <ArrowRight
                className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                strokeWidth={2}
              />
            </Link>
          </Button>
        </header>

        {featured.length === 0 ? (
          <div className="rounded-xl border border-dashed border-earth/15 bg-white p-10 text-center">
            <p className="font-body text-earth-600 text-sm">
              Aucun bien publié pour le moment. Revenez bientôt — nos partenaires
              ajoutent régulièrement de nouvelles propriétés.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {featured.map((p) => (
              <PropertyCatalogCard key={p.id} propriete={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function pourcentageFinance(p: ProprieteResponse): number {
  const total = p.nombreTotalPart ?? p.partsTotales ?? 0
  const dispo = p.partsDisponibles ?? 0
  if (total <= 0) return 0
  return ((total - dispo) / total) * 100
}
