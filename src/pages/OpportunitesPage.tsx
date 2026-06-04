import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building,
  Building2,
  BedDouble,
  Castle,
  ChevronDown,
  Compass,
  Flame,
  Globe,
  Home as HomeIcon,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'

import { PropertyCardSkeleton } from '@/components/properties/PropertyCardSkeleton'
import { PropertyCatalogCard } from '@/components/properties/PropertyCatalogCard'
import { PropertyCatalogRow } from '@/components/properties/PropertyCatalogRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProprietes } from '@/lib/api/proprietes'
import { usePays } from '@/lib/api/geo'
import { useCountUp } from '@/lib/hooks/useCountUp'
import type { ProprieteResponse, StatutExploitation, TypeBien } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list'

type SortOption = 'recent' | 'rentabilite-desc' | 'prix-asc' | 'prix-desc' | 'tendance'

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Plus récentes',
  tendance: 'Tendance',
  'rentabilite-desc': 'Meilleure rentabilité',
  'prix-asc': 'Prix croissant',
  'prix-desc': 'Prix décroissant',
}

const TYPE_BIEN_OPTIONS: { value: TypeBien; label: string; icon: typeof HomeIcon }[] = [
  { value: 'VILLA', label: 'Villa', icon: Castle },
  { value: 'APPARTEMENT', label: 'Appart.', icon: Building },
  { value: 'STUDIO', label: 'Studio', icon: HomeIcon },
  { value: 'PENTHOUSE', label: 'Penthouse', icon: Sparkles },
  { value: 'DUPLEX', label: 'Duplex', icon: Building2 },
  { value: 'IMMEUBLE', label: 'Immeuble', icon: Building2 },
  { value: 'CHAMBRE', label: 'Chambre', icon: BedDouble },
]

// V2 G.1 (04/06/2026) : filtres par code d'equipement (et non plus par
// booleen hasXxx). Les codes correspondent aux codes des entites Equipement
// admin-configurables (cf migration 025). Cette liste reste statique pour
// preserver l'UX (emojis + ordre) ; les equipements custom crees par l'admin
// ne sont pas encore filtrables ici (a faire dans une iteration ulterieure).
const EQUIPEMENTS_OPTIONS: { code: string; label: string }[] = [
  { code: 'VUE_MER', label: '🌊 Vue mer' },
  { code: 'PISCINE', label: '🏊 Piscine' },
  { code: 'CLIMATISATION', label: '❄ Climatisation' },
  { code: 'JARDIN', label: '🌿 Jardin' },
  { code: 'PARKING', label: '🅿 Parking' },
  { code: 'ASCENSEUR', label: '🛗 Ascenseur' },
]

/**
 * P4 (Hugh 22/05/2026) : refonte page opportunites
 * - Hero immersif avec image background + KPIs globaux
 * - Filtres HORIZONTAUX (pas en sidebar verticale comme avant)
 * - Filtres etendus : type bien, pays, statut (neuf vs rentable), equipements
 * - Cards plus riches (PropertyCatalogCard refondue)
 * - Section "Tendances" en avant
 */
export function OpportunitesPage() {
  const { data, isLoading, isError, refetch } = useProprietes()
  const { data: paysList } = usePays()

  const [search, setSearch] = useState('')
  const [typeBien, setTypeBien] = useState<TypeBien | ''>('')
  const [pays, setPays] = useState('')
  const [statutExp, setStatutExp] = useState<StatutExploitation | ''>('')
  const [equipements, setEquipements] = useState<string[]>([])
  const [maxPrix, setMaxPrix] = useState('')
  const [minRenta, setMinRenta] = useState('')
  const [sort, setSort] = useState<SortOption>('tendance')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!data) return []
    let arr = data.filter((p) => p.statut === 'PUBLIEE' || p.statut === 'FINANCEE')

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      arr = arr.filter(
        (p) =>
          p.nom?.toLowerCase().includes(q) ||
          p.localisation?.toLowerCase().includes(q) ||
          p.ville?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
    }
    // V2 G.3 : filtre sur typeBienCode (source de verite admin-configurable),
    // fallback sur l'enum typeBien pour les biens crees avant la migration.
    if (typeBien) arr = arr.filter((p) => (p.typeBienCode ?? p.typeBien) === typeBien)
    if (pays) arr = arr.filter((p) => p.pays === pays)
    if (statutExp) arr = arr.filter((p) => p.statutExploitation === statutExp)
    if (equipements.length > 0) {
      // V2 G.1 : filtre sur equipementsCodes (codes admin-configurables).
      arr = arr.filter((p) =>
        equipements.every((code) => (p.equipementsCodes ?? []).includes(code))
      )
    }
    const maxP = parseFloat(maxPrix)
    if (!Number.isNaN(maxP) && maxP > 0) {
      arr = arr.filter((p) => (p.prixUnitairePart ?? 0) <= maxP)
    }
    const minR = parseFloat(minRenta)
    if (!Number.isNaN(minR) && minR > 0) {
      arr = arr.filter((p) => (p.rentabilitePrevue ?? 0) >= minR)
    }

    return [...arr].sort(getComparator(sort))
  }, [data, search, typeBien, pays, statutExp, equipements, maxPrix, minRenta, sort])

  const activeFiltersCount =
    (search ? 1 : 0) +
    (typeBien ? 1 : 0) +
    (pays ? 1 : 0) +
    (statutExp ? 1 : 0) +
    equipements.length +
    (maxPrix ? 1 : 0) +
    (minRenta ? 1 : 0)
  const hasActiveFilters = activeFiltersCount > 0

  function reset() {
    setSearch('')
    setTypeBien('')
    setPays('')
    setStatutExp('')
    setEquipements([])
    setMaxPrix('')
    setMinRenta('')
    setSort('tendance')
  }

  function toggleEquipement(key: string) {
    setEquipements((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  // Stats globales (sur tout le catalogue publié, pas le filtre)
  const stats = useMemo(() => {
    const publiees = (data ?? []).filter((p) => p.statut === 'PUBLIEE' || p.statut === 'FINANCEE')
    const totalParts = publiees.reduce((s, p) => s + (p.nombreTotalPart ?? p.partsTotales ?? 0), 0)
    const valeurMarche = publiees.reduce(
      (s, p) => s + (p.prixUnitairePart ?? 0) * (p.nombreTotalPart ?? p.partsTotales ?? 0),
      0
    )
    const rentaMoyenne =
      publiees.length === 0
        ? 0
        : publiees.reduce((s, p) => s + (p.rentabilitePrevue ?? 0), 0) / publiees.length
    return { count: publiees.length, totalParts, valeurMarche, rentaMoyenne }
  }, [data])

  // Tendances : 3 biens les plus avancés en collecte (30-99%)
  const tendances = useMemo(() => {
    if (!data) return []
    return data
      .filter((p) => p.statut === 'PUBLIEE')
      .map((p) => ({ p, pct: getPourcentageFinance(p) }))
      .filter(({ pct }) => pct >= 30 && pct < 100)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3)
      .map(({ p }) => p)
  }, [data])

  return (
    <div className="space-y-8">
      {/* ============================================ HERO IMMERSIF */}
      <section
        className="relative rounded-2xl overflow-hidden bg-cover bg-center min-h-[280px] sm:min-h-[340px]"
        style={{
          backgroundImage: `url(/images/villa-falaise.jpg)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-earth/85 via-earth/60 to-earth/30" />
        <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-3xl text-white">
          <p className="font-body text-xs uppercase tracking-widest text-white/80 mb-3 inline-flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" strokeWidth={2} />
            Immobilier fractionné · Zanzibar & Afrique
          </p>
          <h1 className="font-display font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight mb-3">
            Devenez propriétaire,<br className="hidden sm:block" /> dès quelques dollars.
          </h1>
          <p className="font-body text-white/90 text-sm sm:text-base max-w-xl">
            Investissez dans des biens premium, percevez des revenus locatifs trimestriels
            et tradez vos parts quand vous voulez.
          </p>

          {/* KPIs globaux dans le hero */}
          <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-6 max-w-md">
            <HeroKpiAnimated target={stats.count} label="Biens dispo" />
            <HeroKpiMoney target={stats.valeurMarche} label="Marché" />
            <HeroKpiPercent target={stats.rentaMoyenne} label="Rentabilité moy." />
          </div>
        </div>
      </section>

      {/* ============================================ TENDANCES */}
      {tendances.length > 0 && (
        <section>
          <header className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-earth text-xl flex items-center gap-2">
              <Flame className="w-5 h-5 text-terra" strokeWidth={1.75} />
              En tendance
            </h2>
            <span className="font-body text-earth-500 text-xs">
              Bientôt entièrement financées
            </span>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {tendances.map((p) => (
              <PropertyCatalogCard key={p.id} propriete={p} />
            ))}
          </div>
        </section>
      )}

      {/* ============================================ FILTRES HORIZONTAUX */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-4 sm:p-5 space-y-4">
        {/* Ligne 1 : recherche + tri + reset */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none"
              strokeWidth={1.75}
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un bien, une ville, un mot-clé..."
              className="pl-11 bg-white"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label="Trier par"
            className="h-11 rounded-md border-[1.5px] border-sand-400 bg-white px-4 text-sm font-body text-earth focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15"
          >
            {Object.entries(SORT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <Button variant="outline" onClick={reset} size="default" className="bg-white">
              <X className="w-4 h-4 mr-1" strokeWidth={1.75} />
              Réinitialiser ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Ligne 2 : type de bien (chips icones) */}
        <div className="flex flex-wrap gap-2">
          <FilterChip active={typeBien === ''} onClick={() => setTypeBien('')}>
            Tous types
          </FilterChip>
          {TYPE_BIEN_OPTIONS.map((opt) => {
            const Icon = opt.icon
            return (
              <FilterChip
                key={opt.value}
                active={typeBien === opt.value}
                onClick={() => setTypeBien(opt.value)}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                {opt.label}
              </FilterChip>
            )
          })}
        </div>

        {/* Toggle filtres avancés */}
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-earth-600 hover:bg-white text-xs font-body font-semibold uppercase tracking-wide transition-colors"
          aria-expanded={advancedOpen}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
          {advancedOpen ? 'Masquer les filtres avancés' : 'Filtres avancés'}
          {!advancedOpen && (statutExp || pays || maxPrix || minRenta || equipements.length > 0) && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-terra text-white text-[10px] font-bold tabular-nums">
              {(statutExp ? 1 : 0) +
                (pays ? 1 : 0) +
                (maxPrix ? 1 : 0) +
                (minRenta ? 1 : 0) +
                equipements.length}
            </span>
          )}
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 transition-transform',
              advancedOpen && 'rotate-180'
            )}
            strokeWidth={1.75}
          />
        </button>

        {advancedOpen && (
          <>
            {/* Ligne 3 : statut + pays + prix + renta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select
                value={statutExp}
                onChange={(e) => setStatutExp(e.target.value as StatutExploitation | '')}
                aria-label="Statut"
                className="h-11 rounded-md border-[1.5px] border-sand-400 bg-white px-3 text-xs sm:text-sm font-body text-earth focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15"
              >
                <option value="">Tous états</option>
                <option value="NEUF">✨ Neuf</option>
                <option value="DEJA_RENTABLE">📈 Déjà rentable</option>
              </select>
              <select
                value={pays}
                onChange={(e) => setPays(e.target.value)}
                aria-label="Pays"
                className="h-11 rounded-md border-[1.5px] border-sand-400 bg-white px-3 text-xs sm:text-sm font-body text-earth focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15"
              >
                <option value="">Tous pays</option>
                {(paysList ?? []).map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.nom}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={minRenta}
                onChange={(e) => setMinRenta(e.target.value)}
                placeholder="Rentab. min %"
                aria-label="Rentabilité minimum"
                className="h-11 bg-white text-xs sm:text-sm"
              />
              <Input
                type="number"
                min={0}
                step={10}
                value={maxPrix}
                onChange={(e) => setMaxPrix(e.target.value)}
                placeholder="Prix part max USD"
                aria-label="Prix part max"
                className="h-11 bg-white text-xs sm:text-sm"
              />
            </div>

            {/* Ligne 4 : équipements (toggles) */}
            <div>
              <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide mb-2 font-semibold">
                Équipements
              </p>
              <div className="flex flex-wrap gap-1.5">
                {EQUIPEMENTS_OPTIONS.map((eq) => (
                  <FilterChip
                    key={eq.code}
                    small
                    active={equipements.includes(eq.code)}
                    onClick={() => toggleEquipement(eq.code)}
                  >
                    {eq.label}
                  </FilterChip>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ============================================ RÉSULTATS */}
      <section>
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
                ? "Essayez d'élargir vos critères de recherche."
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
            <div className="flex items-center justify-between mb-4 gap-3">
              <p className="font-body text-earth-500 text-sm">
                <span className="font-mono font-bold text-earth text-base">
                  {filtered.length}
                </span>
                {' '}opportunité{filtered.length > 1 ? 's' : ''}
                {hasActiveFilters && (
                  <span className="text-earth-400">
                    {' '}sur {stats.count} disponibles
                  </span>
                )}
              </p>
              <div className="inline-flex items-center bg-sand-100 rounded-lg p-1 border border-earth/5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Vue grille"
                  aria-pressed={viewMode === 'grid'}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-semibold transition-colors',
                    viewMode === 'grid'
                      ? 'bg-white text-earth shadow-sm'
                      : 'text-earth-500 hover:text-earth'
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Grille</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="Vue liste"
                  aria-pressed={viewMode === 'list'}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-semibold transition-colors',
                    viewMode === 'list'
                      ? 'bg-white text-earth shadow-sm'
                      : 'text-earth-500 hover:text-earth'
                  )}
                >
                  <List className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Liste</span>
                </button>
              </div>
            </div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filtered.map((p) => (
                  <PropertyCatalogCard key={p.id} propriete={p} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((p) => (
                  <PropertyCatalogRow key={p.id} propriete={p} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function HeroKpiAnimated({ target, label }: { target: number; label: string }) {
  const [value, ref] = useCountUp({ target })
  return (
    <div ref={ref}>
      <p className="font-mono font-bold text-white text-lg sm:text-2xl leading-none tabular-nums">
        {Math.round(value).toLocaleString('fr-FR')}
      </p>
      <p className="font-body text-white/70 text-[10px] sm:text-xs uppercase tracking-wider mt-1">
        {label}
      </p>
    </div>
  )
}

function HeroKpiMoney({ target, label }: { target: number; label: string }) {
  const [value, ref] = useCountUp({ target })
  return (
    <div ref={ref}>
      <p className="font-mono font-bold text-white text-lg sm:text-2xl leading-none tabular-nums">
        <Money amount={value} mono={false} compact />
      </p>
      <p className="font-body text-white/70 text-[10px] sm:text-xs uppercase tracking-wider mt-1">
        {label}
      </p>
    </div>
  )
}

function HeroKpiPercent({ target, label }: { target: number; label: string }) {
  const [value, ref] = useCountUp({ target })
  return (
    <div ref={ref}>
      <p className="font-mono font-bold text-white text-lg sm:text-2xl leading-none tabular-nums">
        {value.toFixed(1)}%/an
      </p>
      <p className="font-body text-white/70 text-[10px] sm:text-xs uppercase tracking-wider mt-1">
        {label}
      </p>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  small = false,
  children,
}: {
  active: boolean
  onClick: () => void
  small?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-body font-semibold transition-colors',
        small ? 'text-[11px] px-2.5 py-1' : 'text-xs px-3 py-1.5',
        active
          ? 'bg-terra text-white shadow-sm'
          : 'bg-white text-earth-600 border border-sand-400 hover:bg-sand-50 hover:border-terra/40'
      )}
    >
      {children}
    </button>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function getPourcentageFinance(p: ProprieteResponse): number {
  const total = p.nombreTotalPart ?? p.partsTotales ?? 0
  const dispo = p.partsDisponibles ?? 0
  if (total <= 0) return 0
  return ((total - dispo) / total) * 100
}

function getComparator(sort: SortOption) {
  return (a: ProprieteResponse, b: ProprieteResponse) => {
    switch (sort) {
      case 'rentabilite-desc':
        return (b.rentabilitePrevue ?? 0) - (a.rentabilitePrevue ?? 0)
      case 'prix-asc':
        return (a.prixUnitairePart ?? 0) - (b.prixUnitairePart ?? 0)
      case 'prix-desc':
        return (b.prixUnitairePart ?? 0) - (a.prixUnitairePart ?? 0)
      case 'tendance':
        return getPourcentageFinance(b) - getPourcentageFinance(a)
      case 'recent':
      default:
        return (b.id ?? 0) - (a.id ?? 0)
    }
  }
}
