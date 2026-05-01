import { Coins, TrendingUp } from 'lucide-react'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useMesDividendes } from '@/lib/api/dividendes'
import type { DividendeResponse } from '@/lib/api/types'

export function DividendesPage() {
  const { data, isLoading } = useMesDividendes()

  const total = data?.reduce((s, d) => s + (d.montant ?? 0), 0) ?? 0
  const nbDistributions = data?.length ?? 0
  const nbProprietes = new Set(data?.map((d) => d.proprieteNom) ?? []).size

  const columns: Column<DividendeResponse>[] = [
    {
      key: 'dateDistribution',
      label: 'Date',
      sortAccessor: (d) => new Date(d.dateDistribution),
      render: (d) => formatDate(d.dateDistribution),
      width: 'w-32',
    },
    {
      key: 'proprieteNom',
      label: 'Propriété',
      render: (d) => (
        <span className="font-body font-semibold text-earth">{d.proprieteNom}</span>
      ),
    },
    {
      key: 'montant',
      label: 'Montant reçu',
      align: 'right',
      render: (d) => (
        <Money
          amount={d.montant}
          mono={false}
          className="font-semibold text-success"
        />
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (d) => <StatusBadge status={d.statut} />,
      align: 'center',
    },
    {
      key: 'hashTransaction',
      label: 'Hash',
      hideOnMobile: true,
      render: (d) => (
        <code className="font-mono text-[10px] text-earth-500 truncate block max-w-[140px]">
          {d.hashTransaction}
        </code>
      ),
      noSort: true,
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Mes dividendes
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Revenus distribués par les propriétés dans lesquelles vous détenez des parts.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-sand-300" />
          ))
        ) : (
          <>
            <StatCard
              label="Total perçu"
              value={<Money amount={total} mono={false} />}
              icon={Coins}
              iconBg="bg-gold/15"
              iconColor="text-gold-600"
            />
            <StatCard
              label="Distributions reçues"
              value={nbDistributions}
              icon={TrendingUp}
              iconBg="bg-success/10"
              iconColor="text-success"
            />
            <StatCard
              label="Propriétés génératrices"
              value={nbProprietes}
            />
          </>
        )}
      </section>

      {/* Tableau */}
      <section>
        {isLoading ? (
          <Skeleton className="h-64 rounded-xl bg-sand-300" />
        ) : (
          <DataTable
            data={data ?? []}
            columns={columns}
            rowKey={(d) => d.id}
            initialSort={{ key: 'dateDistribution', direction: 'desc' }}
            empty={
              <EmptyState
                icon={Coins}
                title="Aucun dividende reçu"
                description="Les dividendes seront distribués par l'admin dès qu'un revenu sera enregistré sur une propriété dont vous détenez des parts."
              />
            }
          />
        )}
      </section>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}
