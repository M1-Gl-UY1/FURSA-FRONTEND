import { Coins } from 'lucide-react'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { StatCard } from '@/components/shared/StatCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminDividendes } from '@/lib/api/admin'
import type { DividendeResponse } from '@/lib/api/types'

export function AdminDividendesPage() {
  const { data, isLoading } = useAdminDividendes()
  const total = data?.reduce((s, d) => s + (d.montant ?? 0), 0) ?? 0
  const dividendes = data ?? []

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
      render: (d) => <span className="font-body font-semibold text-earth">{d.proprieteNom}</span>,
    },
    {
      key: 'investisseurId',
      label: 'Investisseur',
      hideOnMobile: true,
      render: (d) => <span className="font-mono text-xs text-ocean">#{d.investisseurId}</span>,
    },
    {
      key: 'montant',
      label: 'Montant',
      align: 'right',
      render: (d) => <Money amount={d.montant} mono={false} className="font-semibold text-success" />,
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      render: (d) => <StatusBadge status={d.statut} />,
    },
    {
      key: 'hashTransaction',
      label: 'Hash',
      hideOnMobile: true,
      noSort: true,
      render: (d) => (
        <code className="font-mono text-[10px] text-earth-500 truncate block max-w-[140px]">
          {d.hashTransaction}
        </code>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Dividendes distribués
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Audit complet des dividendes versés aux investisseurs.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-sand-300" />
          ))
        ) : (
          <>
            <StatCard
              label="Total distribué"
              value={<Money amount={total} mono={false} />}
              icon={Coins}
              iconBg="bg-gold/15"
              iconColor="text-gold-600"
            />
            <StatCard label="Nombre de dividendes" value={dividendes.length} />
          </>
        )}
      </section>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      ) : (
        <DataTable
          data={dividendes}
          columns={columns}
          rowKey={(d) => d.id}
          initialSort={{ key: 'dateDistribution', direction: 'desc' }}
          pageSize={20}
          empty={
            <EmptyState
              icon={Coins}
              title="Aucun dividende distribué"
              description="Les dividendes apparaîtront ici après distribution."
            />
          }
        />
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}
