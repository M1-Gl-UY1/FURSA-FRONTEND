import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Repeat,
  TrendingDown,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnnonces } from '@/lib/api/annonces'
import { useProprietes } from '@/lib/api/proprietes'
import { useCountUp } from '@/lib/hooks/useCountUp'
import type { AnnonceResponse, ProprieteResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type SortOption = 'recent' | 'prix-asc' | 'prix-desc'

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Plus récentes',
  'prix-asc': 'Prix par part — croissant',
  'prix-desc': 'Prix par part — décroissant',
}

const SORT_TO_SPRING: Record<SortOption, string> = {
  recent: 'id,desc',
  'prix-asc': 'prixUnitaireDemande,asc',
  'prix-desc': 'prixUnitaireDemande,desc',
}

export function MarcheSecondairePage() {
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<SortOption>('recent')
  const { data, isLoading, isError } = useAnnonces({
    page,
    size: 12,
    sort: SORT_TO_SPRING[sort],
  })
  const { data: proprietes } = useProprietes()

  // Lookup propriete -> prix FURSA courant, pour calculer l'ecart par annonce
  const proprieteById = useMemo(() => {
    const m = new Map<number, ProprieteResponse>()
    ;(proprietes ?? []).forEach((p) => m.set(p.id, p))
    return m
  }, [proprietes])

  const annonces = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  // KPIs agreges sur la page courante (pas global -- limite Spring Page)
  const stats = useMemo(() => {
    if (!annonces.length) return { volume: 0, prixMoyen: 0, partsTotal: 0 }
    const volume = annonces.reduce(
      (s, a) => s + a.nombreDePartsAVendre * a.prixUnitaireDemande,
      0
    )
    const parts = annonces.reduce((s, a) => s + a.nombreDePartsAVendre, 0)
    const prixMoyen = parts > 0 ? volume / parts : 0
    return { volume, prixMoyen, partsTotal: parts }
  }, [annonces])

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero compact gradient */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-terra to-terra-700 p-6 sm:p-7">
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 w-56 h-56 bg-gold/15 rounded-full blur-3xl pointer-events-none"
        />
        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-center">
          <div>
            <p className="font-body text-xs uppercase tracking-widest text-gold-300 font-semibold mb-2 inline-flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5" strokeWidth={2} />
              Marché secondaire
            </p>
            <h1 className="font-display font-bold text-white text-2xl sm:text-3xl lg:text-4xl mb-2">
              Trader des parts en P2P
            </h1>
            <p className="font-body text-white/85 text-sm">
              Achetez ou revendez directement des parts entre investisseurs. La valeur
              fluctue selon l'offre, la demande et la rentabilité réelle du bien.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" className="bg-white text-terra hover:bg-sand-50">
              <Link to="/marche/nouvelle-annonce">
                <Plus strokeWidth={2} />
                Vendre des parts
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/10">
              <Link to="/marche/mes-annonces">Mes annonces</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* KPIs animes */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KpiCount
          label="Annonces ouvertes"
          target={totalElements}
          icon={Repeat}
          color="bg-terra/10 text-terra"
        />
        <KpiMoney
          label="Volume disponible"
          target={stats.volume}
          icon={TrendingUp}
          color="bg-success/10 text-success"
        />
        <KpiMoney
          label="Prix moyen / part"
          target={stats.prixMoyen}
          icon={ArrowRight}
          color="bg-ocean/10 text-ocean"
        />
      </section>

      {/* Toolbar : tri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="font-body text-earth-500 text-sm">
          <span className="font-mono font-bold text-earth text-base">
            {totalElements.toLocaleString('fr-FR')}
          </span>{' '}
          annonce{totalElements > 1 ? 's' : ''} ouverte{totalElements > 1 ? 's' : ''}
        </p>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortOption)
            setPage(0)
          }}
          aria-label="Trier"
          className="h-11 rounded-md border-[1.5px] border-sand-400 bg-white px-3 text-sm font-body text-earth focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15 transition-colors"
        >
          {Object.entries(SORT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl " />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={Repeat}
          title="Impossible de charger le marché secondaire"
          description="Réessayez plus tard."
        />
      )}

      {!isLoading && !isError && annonces.length === 0 && (
        <EmptyState
          icon={Repeat}
          title="Aucune annonce ouverte"
          description="Personne ne revend de parts pour le moment. Revenez plus tard !"
        />
      )}

      {!isLoading && !isError && annonces.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {annonces.map((a) => (
              <AnnonceCard
                key={a.id}
                annonce={a}
                propriete={a.proprieteId ? proprieteById.get(a.proprieteId) : undefined}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label="Page précédente"
              >
                <ChevronLeft strokeWidth={1.75} />
              </Button>
              <span className="font-mono text-sm text-earth tabular-nums px-3">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                aria-label="Page suivante"
              >
                <ChevronRight strokeWidth={1.75} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// =============================================================================
// AnnonceCard refondue : image bien + ecart vs prix FURSA + KPIs
// =============================================================================

function AnnonceCard({
  annonce,
  propriete,
}: {
  annonce: AnnonceResponse
  propriete?: ProprieteResponse
}) {
  const total = annonce.nombreDePartsAVendre * annonce.prixUnitaireDemande
  const prixFursa = propriete?.prixUnitairePart ?? null
  const image = annonce.proprieteImage ?? propriete?.photos?.[0] ?? '/images/villa-falaise.jpg'
  const localisation = propriete?.localisation

  // Ecart prix demande vs prix FURSA courant
  const ecart =
    prixFursa != null && prixFursa > 0
      ? ((annonce.prixUnitaireDemande - prixFursa) / prixFursa) * 100
      : null

  return (
    <Link
      to={`/marche/secondaire/${annonce.id}`}
      className="group block bg-white rounded-xl border border-earth/8 overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Image header */}
      <div className="relative aspect-[16/9] overflow-hidden bg-sand-300">
        {/* UX P1 : Ken Burns au hover */}
        <img
          src={image}
          alt={annonce.proprieteNom}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:animate-ken-burns-hover"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-terra text-white text-[10px] font-semibold font-body rounded-full px-2.5 py-1 shadow-card">
          <Repeat className="w-3 h-3" strokeWidth={2.25} />
          Revente P2P
        </div>
        {ecart != null && Math.abs(ecart) >= 0.5 && (
          <div className="absolute top-3 right-3">
            <PriceDeltaBadge ecartPct={ecart} />
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-display font-bold text-base sm:text-lg leading-tight line-clamp-1 drop-shadow-md">
            {annonce.proprieteNom}
          </h3>
          {localisation && (
            <p className="flex items-center gap-1 text-white/85 text-xs font-body mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" strokeWidth={2} />
              <span className="truncate">{localisation}</span>
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="flex items-center gap-1 text-earth-500 text-xs font-body mb-3">
          <UserIcon className="w-3 h-3" strokeWidth={1.75} />
          <span className="truncate">
            Vendu par {annonce.vendeurNom ?? `Investisseur #${annonce.vendeurId}`}
          </span>
        </p>

        <div className="grid grid-cols-2 gap-2 pb-3 mb-3 border-b border-earth/8">
          <div>
            <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide mb-0.5">
              Parts
            </p>
            <p className="font-mono font-bold text-earth text-base tabular-nums">
              {annonce.nombreDePartsAVendre.toLocaleString('fr-FR')}
            </p>
          </div>
          <div>
            <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide mb-0.5">
              Prix / part
            </p>
            <p className="font-mono font-bold text-earth text-base">
              <Money amount={annonce.prixUnitaireDemande} mono={false} />
            </p>
            {prixFursa != null && (
              <p className="font-mono text-[10px] text-earth-500 tabular-nums">
                FURSA <Money amount={prixFursa} mono />
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-earth-500">Total annonce</span>
          <span className="font-mono font-bold text-terra text-base">
            <Money amount={total} mono={false} />
          </span>
        </div>
      </div>
    </Link>
  )
}

function PriceDeltaBadge({ ecartPct }: { ecartPct: number }) {
  const positive = ecartPct > 0
  const Icon = positive ? TrendingUp : TrendingDown
  const formatted = (positive ? '+' : '') + ecartPct.toFixed(1) + '%'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full font-mono font-bold tabular-nums text-[10px] px-2 py-0.5 shadow-card backdrop-blur-sm',
        positive ? 'bg-warning/90 text-white' : 'bg-success/90 text-white'
      )}
      title={
        positive
          ? `Prix demandé ${formatted} au-dessus du prix FURSA courant.`
          : `Prix demandé ${formatted} en-dessous du prix FURSA courant (potentiel bonne affaire).`
      }
    >
      <Icon className="w-2.5 h-2.5" strokeWidth={2.25} />
      {formatted} vs FURSA
    </span>
  )
}

// =============================================================================
// Animated KPI cards
// =============================================================================

type KpiAnimProps = {
  label: string
  target: number
  icon: LucideIcon
  color: string
}

function KpiMoney({ label, target, icon: Icon, color }: KpiAnimProps) {
  const [value, ref] = useCountUp({ target })
  return (
    <div
      ref={ref}
      className="bg-white rounded-xl border border-earth/8 shadow-card p-4 sm:p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="font-body text-xs text-earth-500 uppercase tracking-wide font-semibold">
          {label}
        </p>
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
      </div>
      <p className="font-mono font-bold text-earth text-xl sm:text-2xl tabular-nums">
        <Money amount={value} mono={false} />
      </p>
    </div>
  )
}

function KpiCount({ label, target, icon: Icon, color }: KpiAnimProps) {
  const [value, ref] = useCountUp({ target })
  return (
    <div
      ref={ref}
      className="bg-white rounded-xl border border-earth/8 shadow-card p-4 sm:p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="font-body text-xs text-earth-500 uppercase tracking-wide font-semibold">
          {label}
        </p>
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
      </div>
      <p className="font-mono font-bold text-earth text-2xl sm:text-3xl tabular-nums">
        {Math.round(value).toLocaleString('fr-FR')}
      </p>
    </div>
  )
}
