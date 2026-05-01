import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Repeat,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnnonces } from '@/lib/api/annonces'
import type { AnnonceResponse } from '@/lib/api/types'
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

  const annonces = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
            Marché secondaire
          </h1>
          <p className="font-body text-earth-600 text-sm">
            Achetez des parts directement à d'autres investisseurs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/marche/mes-annonces">Mes annonces</Link>
          </Button>
          <Button asChild>
            <Link to="/marche/nouvelle-annonce">
              <Plus strokeWidth={2} />
              Vendre des parts
            </Link>
          </Button>
        </div>
      </header>

      {/* Toolbar : tri + total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="font-body text-earth-500 text-sm">
          <span className="font-mono font-semibold text-earth">
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
          className="h-11 rounded-md border-[1.5px] border-sand-400 bg-white px-3 text-sm font-body text-earth focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15 transition-colors"
        >
          {Object.entries(SORT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Grid annonces */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl bg-sand-300" />
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
              <AnnonceCard key={a.id} annonce={a} />
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

function AnnonceCard({ annonce }: { annonce: AnnonceResponse }) {
  const total = annonce.partsAVendre * annonce.prixUnitaireDemande
  const image = annonce.proprieteImage ?? '/images/villa-falaise.jpg'

  return (
    <Link
      to={`/marche/secondaire/${annonce.id}`}
      className="group block bg-sand-100 rounded-xl border border-earth/5 overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Image header */}
      <div className="relative aspect-[16/9] overflow-hidden bg-sand-300">
        <img
          src={image}
          alt={annonce.proprieteNom}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-success text-white text-[10px] font-semibold font-body rounded-full px-2.5 py-1 shadow-card">
          <TrendingUp className="w-3 h-3" strokeWidth={2.25} />
          Revente
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3
          className={cn(
            'font-display font-semibold text-earth text-base mb-1 line-clamp-1',
            'group-hover:text-terra transition-colors'
          )}
        >
          {annonce.proprieteNom}
        </h3>
        <p className="flex items-center gap-1 text-earth-500 text-xs font-body mb-3">
          <UserIcon className="w-3 h-3" strokeWidth={1.75} />
          <span className="truncate">Vendu par {annonce.vendeurNom ?? `Investisseur #${annonce.vendeurId}`}</span>
        </p>

        <div className="grid grid-cols-2 gap-2 pb-3 mb-3 border-b border-earth/8">
          <div>
            <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide mb-0.5">
              Parts
            </p>
            <p className="font-mono font-semibold text-earth text-sm tabular-nums">
              {annonce.partsAVendre.toLocaleString('fr-FR')}
            </p>
          </div>
          <div>
            <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide mb-0.5">
              Prix / part
            </p>
            <p className="font-mono font-semibold text-earth text-sm">
              <Money amount={annonce.prixUnitaireDemande} mono={false} />
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-earth-500">Total</span>
          <span className="font-mono font-bold text-terra text-base">
            <Money amount={total} mono={false} />
          </span>
        </div>
      </div>
    </Link>
  )
}
