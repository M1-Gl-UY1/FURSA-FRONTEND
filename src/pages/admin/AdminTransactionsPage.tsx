import { ArrowLeftRight, Coins, CreditCard } from 'lucide-react'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminPaiements, useAdminTransactions } from '@/lib/api/admin'
import type { PaiementResponse, TransactionResponse } from '@/lib/api/types'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Tab = 'transactions' | 'paiements'

export function AdminTransactionsPage() {
  const [tab, setTab] = useState<Tab>('transactions')

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Audit transactions
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Historique complet des opérations sur la plateforme.
        </p>
      </header>

      {/* Tabs */}
      <div role="tablist" className="inline-flex bg-sand-200 rounded-md p-1 gap-1">
        <TabBtn active={tab === 'transactions'} onClick={() => setTab('transactions')} icon={<ArrowLeftRight className="w-4 h-4" strokeWidth={1.75} />}>
          Transactions blockchain
        </TabBtn>
        <TabBtn active={tab === 'paiements'} onClick={() => setTab('paiements')} icon={<CreditCard className="w-4 h-4" strokeWidth={1.75} />}>
          Paiements
        </TabBtn>
      </div>

      {tab === 'transactions' ? <TransactionsTab /> : <PaiementsTab />}
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
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
        active ? 'bg-white text-earth shadow-sm' : 'text-earth-600 hover:text-earth hover:bg-white/50'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  )
}

function TransactionsTab() {
  const { data, isLoading } = useAdminTransactions()

  const columns: Column<TransactionResponse>[] = [
    {
      key: 'dateTransaction',
      label: 'Date',
      sortAccessor: (t) => new Date(t.dateTransaction),
      render: (t) => formatDate(t.dateTransaction),
      width: 'w-32',
    },
    {
      key: 'proprieteNom',
      label: 'Propriété',
      render: (t) => <span className="font-body font-semibold text-earth">{t.proprieteNom}</span>,
    },
    { key: 'typeOperation', label: 'Type', render: (t) => t.typeOperation ?? '—' },
    {
      key: 'nombreParts',
      label: 'Parts',
      align: 'right',
      render: (t) => <span className="font-mono font-semibold tabular-nums">{(t.nombreParts ?? 0).toLocaleString('fr-FR')}</span>,
    },
    {
      key: 'montant',
      label: 'Montant',
      align: 'right',
      render: (t) => <Money amount={t.montant} mono={false} className="font-semibold" />,
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      render: (t) => <StatusBadge status={t.statut} />,
    },
    {
      key: 'hashTransaction',
      label: 'Hash',
      hideOnMobile: true,
      noSort: true,
      render: (t) => (
        <code className="font-mono text-[10px] text-earth-500 truncate block max-w-[140px]">
          {t.hashTransaction}
        </code>
      ),
    },
  ]

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <DataTable
      data={data ?? []}
      columns={columns}
      rowKey={(t) => t.id}
      initialSort={{ key: 'dateTransaction', direction: 'desc' }}
      pageSize={20}
      empty={
        <EmptyState
          icon={ArrowLeftRight}
          title="Aucune transaction"
          description="L'historique des transactions apparaîtra ici."
        />
      }
    />
  )
}

function PaiementsTab() {
  const { data, isLoading } = useAdminPaiements()

  const columns: Column<PaiementResponse>[] = [
    {
      key: 'date',
      label: 'Date',
      sortAccessor: (p) => new Date(p.date),
      render: (p) => formatDate(p.date),
      width: 'w-32',
    },
    {
      key: 'proprieteNom',
      label: 'Propriété',
      render: (p) => <span className="font-body font-semibold text-earth">{p.proprieteNom}</span>,
    },
    { key: 'type', label: 'Méthode', render: (p) => p.type },
    {
      key: 'nombreParts',
      label: 'Parts',
      align: 'right',
      render: (p) => <span className="font-mono font-semibold tabular-nums">{(p.nombreParts ?? 0).toLocaleString('fr-FR')}</span>,
    },
    {
      key: 'montant',
      label: 'Montant',
      align: 'right',
      render: (p) => <Money amount={p.montant} mono={false} className="font-semibold" />,
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      render: (p) => <StatusBadge status={p.statut} />,
    },
  ]

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <DataTable
      data={data ?? []}
      columns={columns}
      rowKey={(p) => p.id}
      initialSort={{ key: 'date', direction: 'desc' }}
      pageSize={20}
      empty={<EmptyState icon={Coins} title="Aucun paiement" />}
    />
  )
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}
