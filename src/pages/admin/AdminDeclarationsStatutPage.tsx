import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Search,
  X,
} from 'lucide-react'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatCard } from '@/components/shared/StatCard'
import { StatutDeclarationBadge } from '@/components/shared/StatutDeclarationBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminStatutsDeclaration } from '@/lib/api/revenus'
import type { StatutDeclarationResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'DECLARE' | 'DANS_FENETRE' | 'EN_RETARD'

/**
 * Phase 10b : tableau de bord admin du statut de declaration mensuel.
 * Vue globale "qui a déclaré ce mois, qui est en retard, qui est dans la fenêtre".
 */
export function AdminDeclarationsStatutPage() {
  const { data, isLoading } = useAdminStatutsDeclaration()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const statuts = data ?? []

  const stats = useMemo(() => {
    return {
      total: statuts.length,
      declares: statuts.filter((s) => s.statut === 'DECLARE').length,
      dansFenetre: statuts.filter((s) => s.statut === 'DANS_FENETRE').length,
      enRetard: statuts.filter((s) => s.statut === 'EN_RETARD').length,
    }
  }, [statuts])

  const filtered = useMemo(() => {
    let result = statuts
    if (filter !== 'all') {
      result = result.filter((s) => s.statut === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter((s) => s.proprieteNom.toLowerCase().includes(q))
    }
    return result
  }, [statuts, filter, search])

  const moisADeclarer = statuts[0]?.moisADeclarer

  const columns: Column<StatutDeclarationResponse>[] = [
    {
      key: 'proprieteId',
      label: 'ID',
      width: 'w-16',
      align: 'right',
      render: (s) => <span className="font-mono text-xs text-earth-500">#{s.proprieteId}</span>,
    },
    {
      key: 'proprieteNom',
      label: 'Propriété',
      render: (s) => (
        <Link
          to={`/admin/proprietes/${s.proprieteId}`}
          className="font-body font-semibold text-earth hover:text-terra transition-colors"
        >
          {s.proprieteNom}
        </Link>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      sortAccessor: (s) => s.statut,
      render: (s) => <StatutDeclarationBadge statut={s} size="sm" showMonth={false} />,
    },
    {
      key: 'joursRestants',
      label: 'Jours restants',
      hideOnMobile: true,
      align: 'right',
      sortAccessor: (s) => s.joursRestants,
      render: (s) => {
        if (s.statut === 'DECLARE') {
          return <span className="text-earth-300 text-xs">—</span>
        }
        if (s.joursRestants < 0) {
          return (
            <span className="font-mono text-error text-xs font-semibold">
              +{Math.abs(s.joursRestants)} jour{Math.abs(s.joursRestants) > 1 ? 's' : ''} de retard
            </span>
          )
        }
        return (
          <span className="font-mono text-warning text-xs font-semibold">
            J−{s.joursRestants}
          </span>
        )
      },
    },
    {
      key: 'dateSoumission',
      label: 'Soumis le',
      hideOnMobile: true,
      sortAccessor: (s) => (s.dateSoumission ? new Date(s.dateSoumission) : new Date(0)),
      render: (s) =>
        s.dateSoumission ? (
          <span className="font-body text-xs text-earth-600">{formatDate(s.dateSoumission)}</span>
        ) : (
          <span className="text-earth-300 text-xs">—</span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      noSort: true,
      align: 'right',
      render: (s) =>
        s.revenuId ? (
          <Button asChild size="sm" variant="outline">
            <Link to={`/admin/revenus?onglet=tous`} title={`Revenu #${s.revenuId}`}>
              Voir le revenu
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="ghost" className="text-warning hover:bg-warning/10">
            <Link to={`/admin/proprietes/${s.proprieteId}`}>Voir le bien</Link>
          </Button>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Statut des déclarations
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Vue d'ensemble du cycle mensuel de déclaration des revenus. Fenêtre normale du
          1<sup>er</sup> au 5 du mois — au-delà, pénalité de 300 EUR retenue au compte
          central FURSA.
          {moisADeclarer && (
            <span className="block mt-1 inline-flex items-center gap-1.5 text-earth-500 text-xs">
              <CalendarClock className="w-3.5 h-3.5" strokeWidth={1.75} />
              Mois à déclarer : <strong>{formatMonthLong(moisADeclarer)}</strong>
            </span>
          )}
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-sand-300" />
          ))
        ) : (
          <>
            <StatCard
              label="Propriétés"
              value={stats.total}
              icon={Building2}
              iconBg="bg-ocean/10"
              iconColor="text-ocean"
            />
            <StatCard
              label="Déclarés ce mois"
              value={`${stats.declares} / ${stats.total}`}
              icon={CheckCircle2}
              iconBg="bg-success/10"
              iconColor="text-success"
            />
            <StatCard
              label="Dans la fenêtre"
              value={stats.dansFenetre}
              icon={Clock}
              iconBg="bg-warning/15"
              iconColor="text-warning"
            />
            <StatCard
              label="En retard"
              value={stats.enRetard}
              icon={AlertTriangle}
              iconBg="bg-error/10"
              iconColor="text-error"
            />
          </>
        )}
      </section>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          count={stats.total}
        >
          Toutes
        </FilterChip>
        <FilterChip
          active={filter === 'DECLARE'}
          onClick={() => setFilter('DECLARE')}
          count={stats.declares}
          color="success"
        >
          Déclarées
        </FilterChip>
        <FilterChip
          active={filter === 'DANS_FENETRE'}
          onClick={() => setFilter('DANS_FENETRE')}
          count={stats.dansFenetre}
          color="warning"
        >
          Dans la fenêtre
        </FilterChip>
        <FilterChip
          active={filter === 'EN_RETARD'}
          onClick={() => setFilter('EN_RETARD')}
          count={stats.enRetard}
          color="error"
        >
          En retard
        </FilterChip>

        <div className="flex-1 max-w-xs ml-auto relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none"
            strokeWidth={1.75}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une propriété..."
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth"
              aria-label="Effacer la recherche"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          rowKey={(s) => s.proprieteId}
          initialSort={{ key: 'statut', direction: 'asc' }}
          pageSize={20}
          empty={
            <EmptyState
              icon={CalendarClock}
              title={filter === 'all' ? 'Aucune propriété publiée' : 'Aucun résultat'}
              description={
                filter === 'all'
                  ? "Les propriétés apparaîtront ici une fois publiées."
                  : 'Aucune propriété ne correspond aux filtres.'
              }
            />
          }
        />
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  count,
  color = 'neutral',
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  color?: 'neutral' | 'success' | 'warning' | 'error'
  children: React.ReactNode
}) {
  const colorClasses: Record<string, string> = {
    neutral: active ? 'bg-earth text-white' : 'bg-sand-200 text-earth-600 hover:bg-sand-300',
    success: active ? 'bg-success text-white' : 'bg-success/10 text-success hover:bg-success/15',
    warning: active ? 'bg-warning text-white' : 'bg-warning/10 text-warning hover:bg-warning/15',
    error: active ? 'bg-error text-white' : 'bg-error/10 text-error hover:bg-error/15',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-semibold transition-colors',
        colorClasses[color]
      )}
    >
      {children}
      <span
        className={cn(
          'inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-mono font-bold px-1.5',
          active ? 'bg-white/25 text-white' : 'bg-white/60 text-earth'
        )}
      >
        {count}
      </span>
    </button>
  )
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatMonthLong(yearMonth: string): string {
  const [y, m] = yearMonth.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d)
}
