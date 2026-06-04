import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Flame,
  MapPin,
  Maximize2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

import { Money } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { calculatePartsVendues, calculatePourcentageVendu } from '@/lib/api/proprietes'
import type { ProprieteResponse, TypeBien } from '@/lib/api/types'
import { resolveFileUrl } from '@/lib/utils'

const PLACEHOLDER_IMAGE = '/images/villa-falaise.jpg'

const TYPE_LABELS: Record<TypeBien, string> = {
  VILLA: 'Villa',
  APPARTEMENT: 'Appartement',
  STUDIO: 'Studio',
  PENTHOUSE: 'Penthouse',
  DUPLEX: 'Duplex',
  IMMEUBLE: 'Immeuble',
  CHAMBRE: 'Chambre',
}

type Props = { propriete: ProprieteResponse }

/** Vue liste horizontale d'une propriete — alternative compact a PropertyCatalogCard. */
export function PropertyCatalogRow({ propriete }: Props) {
  const firstPhoto = propriete.photos?.[0]
  const image = firstPhoto ? resolveFileUrl(firstPhoto) : PLACEHOLDER_IMAGE
  const pourcentage = calculatePourcentageVendu(propriete)
  const partsVendues = calculatePartsVendues(propriete)
  const partsTotales = propriete.nombreTotalPart ?? propriete.partsTotales ?? 0
  const isTrending = pourcentage >= 50 && pourcentage < 100
  const isFunded = pourcentage >= 100
  const typeLabel = propriete.typeBien ? TYPE_LABELS[propriete.typeBien] : null

  return (
    <Link
      to={`/opportunites/${propriete.id}`}
      className="group flex flex-col sm:flex-row bg-white rounded-xl overflow-hidden border border-earth/8 shadow-card hover:shadow-card-hover transition-all duration-300"
    >
      {/* Image gauche */}
      <div className="relative w-full sm:w-64 lg:w-72 aspect-[16/10] sm:aspect-auto sm:h-auto shrink-0 overflow-hidden bg-sand-300">
        {/* UX P1 : Ken Burns au hover (PROPOSITION_UX_FURSA.md §3.4) */}
        <img
          src={image}
          alt={propriete.nom}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:animate-ken-burns-hover"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {propriete.statutExploitation === 'DEJA_RENTABLE' && (
            <span className="inline-flex items-center gap-1 bg-gold text-earth text-[10px] font-semibold font-body rounded-full px-2 py-0.5 shadow-sm">
              <TrendingUp className="w-3 h-3" strokeWidth={2.25} />
              Rentable
            </span>
          )}
          {propriete.statutExploitation === 'NEUF' && (
            <span className="inline-flex items-center gap-1 bg-ocean text-white text-[10px] font-semibold font-body rounded-full px-2 py-0.5 shadow-sm">
              <Sparkles className="w-3 h-3" strokeWidth={2.25} />
              Neuf
            </span>
          )}
          {isTrending && (
            <span className="inline-flex items-center gap-1 bg-terra text-white text-[10px] font-semibold font-body rounded-full px-2 py-0.5 shadow-sm">
              <Flame className="w-3 h-3" strokeWidth={2.25} />
              Tendance
            </span>
          )}
          {isFunded && (
            <span className="inline-flex items-center bg-success text-white text-[10px] font-semibold font-body rounded-full px-2 py-0.5 shadow-sm">
              Financée
            </span>
          )}
        </div>
      </div>

      {/* Contenu droite */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col">
        {/* Header titre + rentabilité */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-1.5 mb-1">
              {typeLabel && (
                <span className="font-body text-[10px] text-terra font-semibold uppercase tracking-wide">
                  {typeLabel}
                </span>
              )}
              {propriete.certifie && (
                <span className="inline-flex items-center gap-0.5 text-success text-[10px] font-semibold">
                  <BadgeCheck className="w-3 h-3" strokeWidth={2} />
                  Certifié
                </span>
              )}
            </div>
            <h3 className="font-display font-bold text-earth text-lg sm:text-xl leading-tight line-clamp-1">
              {propriete.nom}
            </h3>
            <p className="flex items-center gap-1 text-earth-500 text-xs font-body mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" strokeWidth={2} />
              <span className="truncate">{propriete.localisation}</span>
            </p>
          </div>
          <div className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-bold font-mono rounded-full px-2.5 py-1 shrink-0">
            <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.25} />
            {propriete.rentabilitePrevue}%/an
          </div>
        </div>

        {/* Description courte */}
        {propriete.description && (
          <p className="font-body text-earth-600 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-3">
            {propriete.description}
          </p>
        )}

        {/* Chips équipements */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {propriete.superficieM2 != null && propriete.superficieM2 > 0 && (
            <span className="inline-flex items-center gap-1 bg-sand-200 text-earth-600 font-body text-[10px] font-medium rounded-full px-2 py-0.5">
              <Maximize2 className="w-3 h-3" strokeWidth={1.75} />
              {propriete.superficieM2} m²
            </span>
          )}
          {propriete.nombreChambres != null && propriete.nombreChambres > 0 && (
            <span className="inline-flex items-center gap-1 bg-sand-200 text-earth-600 font-body text-[10px] font-medium rounded-full px-2 py-0.5">
              <BedDouble className="w-3 h-3" strokeWidth={1.75} />
              {propriete.nombreChambres} ch.
            </span>
          )}
          {propriete.equipementsCodes?.includes('PISCINE') && (
            <span className="inline-flex items-center bg-sand-200 text-earth-600 font-body text-[10px] font-medium rounded-full px-2 py-0.5">
              Piscine
            </span>
          )}
          {propriete.equipementsCodes?.includes('VUE_MER') && (
            <span className="inline-flex items-center bg-ocean/15 text-ocean font-body text-[10px] font-medium rounded-full px-2 py-0.5">
              Vue mer
            </span>
          )}
          {propriete.equipementsCodes?.includes('JARDIN') && (
            <span className="inline-flex items-center bg-sand-200 text-earth-600 font-body text-[10px] font-medium rounded-full px-2 py-0.5">
              Jardin
            </span>
          )}
        </div>

        {/* Footer : KPIs + progression + CTA */}
        <div className="mt-auto grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end pt-3 border-t border-earth/8">
          <div>
            <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide mb-0.5">
              Prix part
            </p>
            <p className="font-mono font-bold text-earth text-base">
              <Money amount={propriete.prixUnitairePart} mono={false} />
            </p>
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline justify-between mb-1">
              <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide">
                Financement
              </p>
              <p className="font-mono text-[10px] text-earth-500 tabular-nums">
                {pourcentage.toFixed(0)}%
              </p>
            </div>
            <ProgressBar value={pourcentage} size="sm" />
            <p className="font-mono text-[10px] text-earth-500 mt-1">
              {partsVendues.toLocaleString('fr-FR')}/{partsTotales.toLocaleString('fr-FR')} parts
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-terra text-xs font-semibold group-hover:gap-2 transition-all">
            Voir
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </span>
        </div>
      </div>
    </Link>
  )
}
