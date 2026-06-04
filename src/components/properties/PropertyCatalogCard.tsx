import { Link } from 'react-router-dom'
import {
  BedDouble,
  Building,
  Building2,
  Castle,
  Flame,
  Home as HomeIcon,
  MapPin,
  Maximize2,
  Sparkles,
  TrendingUp,
  Waves,
} from 'lucide-react'

import { Money } from '@/components/shared/Money'
import { PriceVariationBadge } from '@/components/shared/PriceVariationBadge'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import {
  calculatePartsVendues,
  calculatePourcentageVendu,
  calculateVariationPrix,
} from '@/lib/api/proprietes'
import type { ProprieteResponse, TypeBien } from '@/lib/api/types'
import { cn, resolveFileUrl } from '@/lib/utils'

type PropertyCatalogCardProps = {
  propriete: ProprieteResponse
}

const PLACEHOLDER_IMAGE = '/images/villa-falaise.jpg'

const TYPE_ICONS: Record<TypeBien, typeof HomeIcon> = {
  VILLA: Castle,
  APPARTEMENT: Building,
  STUDIO: HomeIcon,
  PENTHOUSE: Sparkles,
  DUPLEX: Building2,
  IMMEUBLE: Building2,
  CHAMBRE: BedDouble,
}

const TYPE_LABELS: Record<TypeBien, string> = {
  VILLA: 'Villa',
  APPARTEMENT: 'Appartement',
  STUDIO: 'Studio',
  PENTHOUSE: 'Penthouse',
  DUPLEX: 'Duplex',
  IMMEUBLE: 'Immeuble',
  CHAMBRE: 'Chambre',
}

export function PropertyCatalogCard({ propriete }: PropertyCatalogCardProps) {
  const image = propriete.photos?.[0] ? resolveFileUrl(propriete.photos[0]) : PLACEHOLDER_IMAGE
  const pourcentage = calculatePourcentageVendu(propriete)
  const partsVendues = calculatePartsVendues(propriete)
  const variationPrix = calculateVariationPrix(propriete)
  const isTrending = pourcentage >= 50 && pourcentage < 100
  // Polish UX : badge "Nouveau" pour les biens publies depuis moins de 7 jours.
  const isNew = (() => {
    const iso = propriete.dateCreation ?? propriete.createdAt
    if (!iso) return false
    const ageMs = Date.now() - new Date(iso).getTime()
    return ageMs >= 0 && ageMs < 7 * 24 * 60 * 60 * 1000
  })()
  const isFunded = pourcentage >= 100
  // V2 G.3 : resolution typeBienCode (admin-configurable) -> icone + label.
  // Fallback sur l'enum legacy si typeBienCode non fourni (vieux client).
  const typeCode = propriete.typeBienCode ?? propriete.typeBien ?? null
  const TypeIcon =
    typeCode && (typeCode in TYPE_ICONS)
      ? TYPE_ICONS[typeCode as TypeBien]
      : null
  const typeLabel =
    propriete.typeBienLabel
    ?? (typeCode && (typeCode in TYPE_LABELS) ? TYPE_LABELS[typeCode as TypeBien] : typeCode)

  return (
    <Link
      to={`/opportunites/${propriete.id}`}
      className="group block bg-white rounded-xl overflow-hidden border border-earth/8 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image avec overlay gradient et badges */}
      <div className="relative aspect-[4/3] overflow-hidden bg-sand-300">
        {/* UX P1 : Ken Burns subtil au hover (PROPOSITION_UX_FURSA.md §3.4) */}
        <img
          src={image}
          alt={propriete.nom}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:animate-ken-burns-hover"
        />
        {/* Gradient noir bas pour lisibilité */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {propriete.statut && propriete.statut !== 'PUBLIEE' && (
            <StatusBadge status={propriete.statut} />
          )}
          {propriete.statutExploitation === 'DEJA_RENTABLE' && (
            <span className="inline-flex items-center gap-1 bg-gold text-earth text-[10px] font-semibold font-body rounded-full px-2.5 py-0.5 shadow-sm">
              <TrendingUp className="w-3 h-3" strokeWidth={2.25} />
              Déjà rentable
            </span>
          )}
          {propriete.statutExploitation === 'NEUF' && (
            <span className="inline-flex items-center gap-1 bg-ocean text-white text-[10px] font-semibold font-body rounded-full px-2.5 py-0.5 shadow-sm">
              <Sparkles className="w-3 h-3" strokeWidth={2.25} />
              Neuf
            </span>
          )}
          {propriete.statutExploitation === 'EN_CONSTRUCTION' && (
            <span className="inline-flex items-center gap-1 bg-warning text-white text-[10px] font-semibold font-body rounded-full px-2.5 py-0.5 shadow-sm">
              <Building className="w-3 h-3" strokeWidth={2.25} />
              En construction
            </span>
          )}
          {propriete.acquisFursa && (
            <span className="inline-flex items-center gap-1 bg-gold text-earth text-[10px] font-semibold font-body rounded-full px-2.5 py-0.5 shadow-sm">
              <Sparkles className="w-3 h-3" strokeWidth={2.25} />
              Acquis FURSA
            </span>
          )}
          {propriete.certifie && (
            <span className="inline-flex items-center bg-white/90 text-success text-[10px] font-semibold font-body rounded-full px-2 py-0.5 shadow-sm">
              ✓ Certifié
            </span>
          )}
        </div>

        {/* Badges top-right : nouveau + type + tendance */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {isNew && (
            <span className="inline-flex items-center gap-1 bg-terra text-white text-[10px] font-bold font-body rounded-full px-2.5 py-0.5 shadow-card uppercase tracking-wide animate-pulse">
              ★ Nouveau
            </span>
          )}
          {typeLabel && TypeIcon && (
            <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm text-earth text-[10px] font-semibold font-body rounded-full px-2.5 py-1 shadow-card">
              <TypeIcon className="w-3 h-3" strokeWidth={2} />
              {typeLabel}
            </span>
          )}
          {isTrending && (
            <span className="inline-flex items-center gap-1 bg-terra text-white text-[10px] font-semibold font-body rounded-full px-2.5 py-0.5 shadow-card">
              <Flame className="w-3 h-3" strokeWidth={2.25} />
              Tendance
            </span>
          )}
          {isFunded && (
            <span className="inline-flex items-center bg-success text-white text-[10px] font-semibold font-body rounded-full px-2.5 py-0.5 shadow-card">
              Financée
            </span>
          )}
        </div>

        {/* Bandeau bas : titre + rentabilité */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-white text-base sm:text-lg leading-tight line-clamp-2 drop-shadow-md">
                {propriete.nom}
              </h3>
              <p className="flex items-center gap-1 text-white/85 text-xs font-body mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" strokeWidth={2} />
                <span className="truncate">{propriete.localisation}</span>
              </p>
            </div>
            <div className="inline-flex items-center gap-1 bg-success text-white text-xs font-bold font-mono rounded-full px-2.5 py-1 shadow-md flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.25} />
              {propriete.rentabilitePrevue}%/an
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        {/* Caractéristiques (chips équipements) */}
        {hasCaracteristiques(propriete) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {propriete.superficieM2 && propriete.superficieM2 > 0 && (
              <Chip icon={Maximize2} label={`${propriete.superficieM2} m²`} />
            )}
            {propriete.nombreChambres && propriete.nombreChambres > 0 && (
              <Chip icon={BedDouble} label={`${propriete.nombreChambres} ch.`} />
            )}
            {propriete.equipementsCodes?.includes('VUE_MER') && <Chip icon={Waves} label="Vue mer" highlight />}
            {propriete.equipementsCodes?.includes('PISCINE') && <Chip label="🏊 Piscine" />}
            {propriete.equipementsCodes?.includes('CLIMATISATION') && <Chip label="❄ Clim" />}
            {propriete.equipementsCodes?.includes('JARDIN') && <Chip label="🌿 Jardin" />}
          </div>
        )}

        {/* KPIs : prix part + parts dispo */}
        <div className="grid grid-cols-2 gap-3 pb-3 mb-3 border-b border-earth/8">
          <div>
            <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide mb-0.5">
              Prix par part
            </p>
            <div className="flex items-baseline gap-1.5">
              <p className="font-mono font-bold text-earth text-base">
                <Money amount={propriete.prixUnitairePart} mono={false} />
              </p>
              <PriceVariationBadge variationPct={variationPrix} size="sm" />
            </div>
          </div>
          <div className="text-right">
            <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide mb-0.5">
              Parts dispo
            </p>
            <p className="font-mono font-bold text-earth text-base">
              {propriete.partsDisponibles?.toLocaleString('fr-FR') ?? '—'}
              <span className="text-earth-400 text-xs font-normal">
                {' '}/ {(propriete.nombreTotalPart ?? propriete.partsTotales)?.toLocaleString('fr-FR') ?? '—'}
              </span>
            </p>
          </div>
        </div>

        {/* Progression financement */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide font-semibold">
              {isFunded ? '✓ Financée' : 'Financement'}
            </p>
            <p className="font-mono text-[10px] text-earth-500 tabular-nums">
              {partsVendues.toLocaleString('fr-FR')} parts vendues
            </p>
          </div>
          <ProgressBar value={pourcentage} size="sm" />
        </div>
      </div>
    </Link>
  )
}

function hasCaracteristiques(p: ProprieteResponse): boolean {
  const codes = p.equipementsCodes ?? []
  return !!(
    (p.superficieM2 && p.superficieM2 > 0) ||
    (p.nombreChambres && p.nombreChambres > 0) ||
    codes.length > 0
  )
}

function Chip({
  icon: Icon,
  label,
  highlight = false,
}: {
  icon?: typeof HomeIcon
  label: string
  highlight?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-body text-[10px] font-medium rounded-full px-2 py-0.5',
        highlight
          ? 'bg-ocean/15 text-ocean'
          : 'bg-sand-200 text-earth-600'
      )}
    >
      {Icon && <Icon className="w-3 h-3" strokeWidth={1.75} />}
      {label}
    </span>
  )
}
