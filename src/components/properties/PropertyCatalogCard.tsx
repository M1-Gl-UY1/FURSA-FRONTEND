import { Link } from 'react-router-dom'
import { MapPin, TrendingUp, Flame } from 'lucide-react'

import { Money } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { calculatePartsVendues, calculatePourcentageVendu } from '@/lib/api/proprietes'
import type { ProprieteResponse } from '@/lib/api/types'

type PropertyCatalogCardProps = {
  propriete: ProprieteResponse
}

const PLACEHOLDER_IMAGE = '/images/villa-falaise.jpg'

export function PropertyCatalogCard({ propriete }: PropertyCatalogCardProps) {
  const image = propriete.photos?.[0] ?? PLACEHOLDER_IMAGE
  const pourcentage = calculatePourcentageVendu(propriete)
  const partsVendues = calculatePartsVendues(propriete)
  const isTrending = pourcentage >= 50 && pourcentage < 100
  const isFunded = pourcentage >= 100

  return (
    <Link
      to={`/opportunites/${propriete.id}`}
      className="group block bg-sand-100 rounded-lg overflow-hidden border border-earth/5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-sand-300">
        <img
          src={image}
          alt={propriete.nom}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
        />

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {propriete.statut && propriete.statut !== 'PUBLIEE' && (
            <StatusBadge status={propriete.statut} />
          )}
          {isTrending && (
            <span className="inline-flex items-center gap-1 bg-terra text-white text-[10px] font-semibold font-body rounded-full px-2 py-0.5">
              <Flame className="w-3 h-3" strokeWidth={2.25} />
              Tendance
            </span>
          )}
          {isFunded && (
            <span className="inline-flex items-center bg-success text-white text-[10px] font-semibold font-body rounded-full px-2.5 py-0.5">
              Financée
            </span>
          )}
        </div>

        {/* Rentabilité — badge bottom-right */}
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 bg-success text-white text-xs font-semibold font-body rounded-full px-2.5 py-1 shadow-card">
          <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="font-mono">{propriete.rentabilitePrevue}% / an</span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5">
        <h3 className="font-display font-semibold text-earth text-base sm:text-lg leading-snug mb-1 line-clamp-2 group-hover:text-terra transition-colors">
          {propriete.nom}
        </h3>
        <p className="flex items-center gap-1 text-earth-500 text-xs font-body mb-4">
          <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{propriete.localisation}</span>
        </p>

        {/* KPIs : prix part + parts dispo */}
        <div className="grid grid-cols-2 gap-3 pb-4 mb-4 border-b border-earth/8">
          <div>
            <p className="font-body text-[11px] text-earth-500 uppercase tracking-wide mb-0.5">
              Prix par part
            </p>
            <p className="font-mono font-semibold text-earth text-sm">
              <Money amount={propriete.prixUnitairePart} mono={false} />
            </p>
          </div>
          <div>
            <p className="font-body text-[11px] text-earth-500 uppercase tracking-wide mb-0.5">
              Parts dispo
            </p>
            <p className="font-mono font-semibold text-earth text-sm">
              {propriete.partsDisponibles?.toLocaleString('fr-FR') ?? '—'}
              <span className="text-earth-400 text-xs"> / {(propriete.nombreTotalPart ?? propriete.partsTotales)?.toLocaleString('fr-FR') ?? '—'}</span>
            </p>
          </div>
        </div>

        {/* Progression financement */}
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="font-body text-[11px] text-earth-500 uppercase tracking-wide">
              Financement
            </p>
            <p className="font-mono text-[11px] text-earth-500 tabular-nums">
              {partsVendues.toLocaleString('fr-FR')} parts vendues
            </p>
          </div>
          <ProgressBar value={pourcentage} size="sm" />
        </div>
      </div>
    </Link>
  )
}
