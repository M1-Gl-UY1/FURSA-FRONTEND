import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Building2, Eye, TrendingUp } from 'lucide-react'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminProprietes } from '@/lib/api/proprietes'
import type { ProprieteResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type Tab = 'a-valider' | 'toutes' | 'publiees' | 'refusees'

export function AdminProprietesPage() {
  const { data, isLoading } = useAdminProprietes()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('onglet') as Tab | null
  const [tab, setTab] = useState<Tab>(tabParam ?? 'a-valider')

  function changeTab(t: Tab) {
    setTab(t)
    setSearchParams({ onglet: t })
  }

  const proprietes = data ?? []
  const aValider = proprietes.filter((p) => p.statut === 'EN_REVIEW')
  const publiees = proprietes.filter((p) => p.statut === 'PUBLIEE')
  const refusees = proprietes.filter((p) => p.statut === 'REFUSEE')

  const filtered = (() => {
    if (tab === 'a-valider') return aValider
    if (tab === 'publiees') return publiees
    if (tab === 'refusees') return refusees
    return proprietes
  })()

  const columns: Column<ProprieteResponse>[] = [
    {
      key: 'id',
      label: 'ID',
      width: 'w-16',
      align: 'right',
      render: (p) => <span className="font-mono text-xs text-earth-500">#{p.id}</span>,
    },
    {
      key: 'nom',
      label: 'Propriété',
      render: (p) => (
        <div className="min-w-0">
          <p className="font-body font-semibold text-earth truncate">{p.nom}</p>
          <p className="font-body text-earth-500 text-xs truncate">{p.localisation}</p>
        </div>
      ),
    },
    {
      key: 'proposeurId',
      label: 'Proposeur',
      hideOnMobile: true,
      render: (p) =>
        p.proposeurId
          ? <span className="font-mono text-xs text-ocean">#{p.proposeurId}</span>
          : <span className="text-earth-400 text-xs">Admin</span>,
    },
    {
      key: 'nombreTotalPart',
      label: 'Parts',
      align: 'right',
      render: (p) => (
        <span className="font-mono font-semibold tabular-nums">
          {(p.nombreTotalPart ?? 0).toLocaleString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'prixUnitairePart',
      label: 'Prix / part',
      align: 'right',
      render: (p) => <Money amount={p.prixUnitairePart} mono={false} className="font-semibold" />,
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      render: (p) => <StatusBadge status={p.statut} />,
    },
    {
      key: 'actions',
      label: '',
      noSort: true,
      align: 'right',
      render: (p) => (
        <div className="inline-flex items-center gap-1">
          <Button asChild variant="ghost" size="icon-sm" aria-label="Diagnostic prix dynamique">
            <Link to={`/admin/prix-parts/${p.id}`}>
              <TrendingUp strokeWidth={1.75} />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon-sm" aria-label="Voir détail">
            <Link to={`/admin/proprietes/${p.id}`}>
              <Eye strokeWidth={1.75} />
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Propriétés
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Gérer le catalogue : valider les soumissions, publier, suivre.
        </p>
      </header>

      {/* Tabs */}
      <div role="tablist" className="flex flex-wrap gap-1 bg-sand-200 rounded-md p-1">
        <TabButton active={tab === 'a-valider'} onClick={() => changeTab('a-valider')} count={aValider.length} highlight>
          À valider
        </TabButton>
        <TabButton active={tab === 'toutes'} onClick={() => changeTab('toutes')} count={proprietes.length}>
          Toutes
        </TabButton>
        <TabButton active={tab === 'publiees'} onClick={() => changeTab('publiees')} count={publiees.length}>
          Publiées
        </TabButton>
        <TabButton active={tab === 'refusees'} onClick={() => changeTab('refusees')} count={refusees.length}>
          Refusées
        </TabButton>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          rowKey={(p) => p.id}
          initialSort={{ key: 'id', direction: 'desc' }}
          empty={
            <EmptyState
              icon={Building2}
              title={tab === 'a-valider' ? 'Aucune soumission à valider' : 'Aucune propriété'}
              description={tab === 'a-valider' ? 'Toutes les soumissions ont été examinées.' : 'Aucune propriété dans cette catégorie.'}
            />
          }
        />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  count,
  highlight = false,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  highlight?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md font-body text-sm font-semibold transition-colors',
        active
          ? 'bg-white text-earth shadow-sm'
          : 'text-earth-600 hover:text-earth hover:bg-white/50'
      )}
    >
      <span>{children}</span>
      {count > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-mono font-bold px-1.5',
            highlight && !active ? 'bg-warning text-white' : 'bg-earth/10 text-earth-600'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
