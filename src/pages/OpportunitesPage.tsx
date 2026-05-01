import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Search, SlidersHorizontal, X } from 'lucide-react'

import { PropertyCardSkeleton } from '@/components/properties/PropertyCardSkeleton'
import { PropertyCatalogCard } from '@/components/properties/PropertyCatalogCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useProprietes } from '@/lib/api/proprietes'
import type { ProprieteResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type SortOption = 'recent' | 'rentabilite-desc' | 'prix-asc' | 'prix-desc'

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Plus récentes',
  'rentabilite-desc': 'Meilleure rentabilité',
  'prix-asc': 'Prix croissant',
  'prix-desc': 'Prix décroissant',
}

export function OpportunitesPage() {
  const { data, isLoading, isError, refetch } = useProprietes()

  const [search, setSearch] = useState('')
  const [localisation, setLocalisation] = useState('')
  const [minRenta, setMinRenta] = useState('')
  const [maxPrix, setMaxPrix] = useState('')
  const [sort, setSort] = useState<SortOption>('recent')

  // Liste unique des localisations pour le filtre
  const localisations = useMemo(() => {
    if (!data) return []
    const set = new Set(data.map((p) => p.localisation).filter(Boolean))
    return Array.from(set).sort()
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    let arr = data.filter((p) => p.statut === 'PUBLIEE' || p.statut === 'FINANCEE')

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      arr = arr.filter(
        (p) =>
          p.nom?.toLowerCase().includes(q) ||
          p.localisation?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
    }

    if (localisation) {
      arr = arr.filter((p) => p.localisation === localisation)
    }

    const minR = parseFloat(minRenta)
    if (!Number.isNaN(minR) && minR > 0) {
      arr = arr.filter((p) => (p.rentabilitePrevue ?? 0) >= minR)
    }

    const maxP = parseFloat(maxPrix)
    if (!Number.isNaN(maxP) && maxP > 0) {
      arr = arr.filter((p) => (p.prixUnitairePart ?? 0) <= maxP)
    }

    return [...arr].sort(getComparator(sort))
  }, [data, search, localisation, minRenta, maxPrix, sort])

  const hasActiveFilters = !!(search || localisation || minRenta || maxPrix)

  function reset() {
    setSearch('')
    setLocalisation('')
    setMinRenta('')
    setMaxPrix('')
    setSort('recent')
  }

  return (
    <div className="max-w-container mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Opportunités d'investissement
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Découvrez des biens sélectionnés avec potentiel de croissance, revenus
          locatifs et valorisation à long terme.
        </p>
      </header>

      {/* Toolbar : recherche + tri + filtres mobile */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none"
            strokeWidth={1.75}
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un bien, une ville..."
            className="pl-11"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="h-12 rounded-md border-[1.5px] border-sand-400 bg-white px-4 text-sm font-body text-earth focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15 transition-colors"
        >
          {Object.entries(SORT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden gap-2">
              <SlidersHorizontal className="w-4 h-4" strokeWidth={1.75} />
              Filtres
              {hasActiveFilters && (
                <span className="bg-terra text-white text-[10px] font-mono font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  •
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[340px] bg-sand-50">
            <SheetHeader>
              <SheetTitle className="font-display text-earth">Filtres</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FiltersPanel
                localisations={localisations}
                localisation={localisation}
                onLocalisation={setLocalisation}
                minRenta={minRenta}
                onMinRenta={setMinRenta}
                maxPrix={maxPrix}
                onMaxPrix={setMaxPrix}
                onReset={reset}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Layout : filtres desktop + grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8 items-start">
        {/* Sidebar filtres desktop */}
        <aside className="hidden lg:block sticky top-20">
          <div className="bg-sand-100 rounded-xl border border-earth/5 p-5">
            <FiltersPanel
              localisations={localisations}
              localisation={localisation}
              onLocalisation={setLocalisation}
              minRenta={minRenta}
              onMinRenta={setMinRenta}
              maxPrix={maxPrix}
              onMaxPrix={setMaxPrix}
              onReset={reset}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </aside>

        {/* Grid résultats */}
        <section>
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <EmptyState
              icon={Compass}
              title="Impossible de charger les opportunités"
              description="Vérifiez votre connexion et réessayez."
              action={
                <Button variant="outline" onClick={() => refetch()}>
                  Réessayer
                </Button>
              }
            />
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <EmptyState
              icon={Search}
              title={hasActiveFilters ? 'Aucun résultat' : 'Aucune opportunité disponible'}
              description={
                hasActiveFilters
                  ? 'Essayez d\'élargir vos critères de recherche.'
                  : 'Revenez bientôt pour découvrir nos prochains biens.'
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={reset}>
                    Réinitialiser les filtres
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/dashboard">Retour au tableau de bord</Link>
                  </Button>
                )
              }
            />
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <>
              <p className="font-body text-earth-500 text-sm mb-4">
                <span className="font-mono font-semibold text-earth">{filtered.length}</span>
                {' '}opportunité{filtered.length > 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((p) => (
                  <PropertyCatalogCard key={p.id} propriete={p} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

// --- Sous-composant : Panneau de filtres réutilisé desktop + drawer mobile ---

type FiltersPanelProps = {
  localisations: string[]
  localisation: string
  onLocalisation: (v: string) => void
  minRenta: string
  onMinRenta: (v: string) => void
  maxPrix: string
  onMaxPrix: (v: string) => void
  onReset: () => void
  hasActiveFilters: boolean
}

function FiltersPanel({
  localisations,
  localisation,
  onLocalisation,
  minRenta,
  onMinRenta,
  maxPrix,
  onMaxPrix,
  onReset,
  hasActiveFilters,
}: FiltersPanelProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-earth text-sm">
          Filtres
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-terra text-xs font-semibold font-body hover:underline"
          >
            <X className="w-3 h-3" strokeWidth={2.25} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Localisation */}
      <div className="space-y-2">
        <Label htmlFor="filter-localisation">Localisation</Label>
        <select
          id="filter-localisation"
          value={localisation}
          onChange={(e) => onLocalisation(e.target.value)}
          className={cn(
            'h-11 w-full rounded-md border-[1.5px] border-sand-400 bg-white px-3 text-sm font-body text-earth',
            'focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15 transition-colors'
          )}
        >
          <option value="">Toutes les localisations</option>
          {localisations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Rentabilité min */}
      <div className="space-y-2">
        <Label htmlFor="filter-renta">Rentabilité minimale (%)</Label>
        <Input
          id="filter-renta"
          type="number"
          min={0}
          step={0.5}
          value={minRenta}
          onChange={(e) => onMinRenta(e.target.value)}
          placeholder="Ex: 8"
          className="h-11"
        />
      </div>

      {/* Prix part max */}
      <div className="space-y-2">
        <Label htmlFor="filter-prix">Prix par part max (EUR)</Label>
        <Input
          id="filter-prix"
          type="number"
          min={0}
          step={10}
          value={maxPrix}
          onChange={(e) => onMaxPrix(e.target.value)}
          placeholder="Ex: 200"
          className="h-11"
        />
      </div>
    </div>
  )
}

// --- Comparator pour le tri ---

function getComparator(sort: SortOption) {
  return (a: ProprieteResponse, b: ProprieteResponse) => {
    switch (sort) {
      case 'rentabilite-desc':
        return (b.rentabilitePrevue ?? 0) - (a.rentabilitePrevue ?? 0)
      case 'prix-asc':
        return (a.prixUnitairePart ?? 0) - (b.prixUnitairePart ?? 0)
      case 'prix-desc':
        return (b.prixUnitairePart ?? 0) - (a.prixUnitairePart ?? 0)
      case 'recent':
      default:
        return (b.id ?? 0) - (a.id ?? 0)
    }
  }
}
