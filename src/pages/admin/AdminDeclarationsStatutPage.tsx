import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
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

// V2 W (07/06/2026) : 2 etats backend (DANS_FENETRE + EN_RETARD) fusionnes
// cote UI en 'A_DECLARER'. Plus aucune notion de retard / fenetre / penalite.
type Filter = 'all' | 'DECLARE' | 'A_DECLARER'

/**
 * V2 W (07/06/2026) : panneau "Statut de declaration par bien".
 * Vue globale "qui a declare ce trimestre, qui reste a declarer".
 */
export function DeclarationsStatutsPanel() {
  const { data, isLoading } = useAdminStatutsDeclaration()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const statuts = data ?? []

  const stats = useMemo(() => {
    return {
      total: statuts.length,
      declares: statuts.filter((s) => s.statut === 'DECLARE').length,
      aDeclarer: statuts.filter((s) => s.statut !== 'DECLARE').length,
    }
  }, [statuts])

  const filtered = useMemo(() => {
    let result = statuts
    if (filter === 'DECLARE') {
      result = result.filter((s) => s.statut === 'DECLARE')
    } else if (filter === 'A_DECLARER') {
      result = result.filter((s) => s.statut !== 'DECLARE')
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
      label: 'Statut',
      hideOnMobile: true,
      align: 'right',
      sortAccessor: (s) => s.joursRestants,
      render: (s) => {
        if (s.statut === 'DECLARE') {
          return <span className="text-earth-300 text-xs">—</span>
        }
        // V2 W : aucune notion de retard / jours / urgence cote UI.
        return (
          <span className="font-body text-warning text-xs font-semibold">
            À déclarer
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
      {/* Sous-en-tete du panneau (l'en-tete principale "Revenus" est dans AdminRevenusPage). */}
      <div>
        <h2 className="font-display font-bold text-earth text-lg mb-1">
          Statut de déclaration par bien
        </h2>
        <p className="font-body text-earth-600 text-xs">
          Vue d'ensemble du cycle trimestriel. Fenêtre normale du 1<sup>er</sup> au 15 du mois suivant la fin du trimestre.
          {moisADeclarer && (
            <span className="block mt-1 inline-flex items-center gap-1.5 text-earth-500">
              <CalendarClock className="w-3.5 h-3.5" strokeWidth={1.75} />
              Trimestre à déclarer : <strong>{formatMonthLong(moisADeclarer)}</strong>
            </span>
          )}
        </p>
      </div>

      {/* KPIs — V2 W : 3 cartes au lieu de 4, aucune notion de retard */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl " />
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
              label="Déclarés ce trimestre"
              value={`${stats.declares} / ${stats.total}`}
              icon={CheckCircle2}
              iconBg="bg-success/10"
              iconColor="text-success"
            />
            <StatCard
              label="À déclarer"
              value={stats.aDeclarer}
              icon={Clock}
              iconBg="bg-warning/15"
              iconColor="text-warning"
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
          active={filter === 'A_DECLARER'}
          onClick={() => setFilter('A_DECLARER')}
          count={stats.aDeclarer}
          color="warning"
        >
          À déclarer
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
        <Skeleton className="h-64 rounded-xl" />
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

function formatMonthLong(value: string): string {
  // P3 (Hugh 22/05/2026) : format trimestriel "2026-Q1"
  if (/^\d{4}-Q[1-4]$/.test(value)) {
    const [year, q] = value.split('-Q')
    const trimNames: Record<string, string> = {
      '1': '1er trimestre (jan-fev-mar)',
      '2': '2e trimestre (avr-mai-jun)',
      '3': '3e trimestre (jui-aou-sep)',
      '4': '4e trimestre (oct-nov-dec)',
    }
    return `${trimNames[q] ?? q} ${year}`
  }
  // Fallback ancien format mensuel
  const [y, m] = value.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d)
}
