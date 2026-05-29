import { Clock, Coins, ExternalLink, TrendingUp, Wallet } from 'lucide-react'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useMaBalanceDividendes, useMesDividendes } from '@/lib/api/dividendes'
import type { DividendeResponse } from '@/lib/api/types'
import { resolveFileUrl } from '@/lib/utils'

export function DividendesPage() {
  const { data, isLoading } = useMesDividendes()
  const { data: balance, isLoading: balanceLoading } = useMaBalanceDividendes()

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
      label: 'Montant',
      align: 'right',
      render: (d) => (
        <Money
          amount={d.montant}
          mono={false}
          className={
            d.statut === 'PAYE'
              ? 'font-semibold text-success'
              : 'font-semibold text-warning'
          }
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
      key: 'datePaiementEffectif',
      label: 'Versé le',
      hideOnMobile: true,
      sortAccessor: (d) => (d.datePaiementEffectif ? new Date(d.datePaiementEffectif) : new Date(0)),
      render: (d) =>
        d.datePaiementEffectif ? (
          <span className="font-body text-xs text-earth-600">
            {formatDate(d.datePaiementEffectif)}
            {d.methodePaiement && (
              <span className="block font-mono text-[10px] text-earth-500">
                {d.methodePaiement}
              </span>
            )}
          </span>
        ) : (
          <span className="font-body text-xs text-earth-400 italic">En attente</span>
        ),
    },
    {
      key: 'preuvePaiement',
      label: 'Preuve',
      hideOnMobile: true,
      noSort: true,
      render: (d) =>
        d.preuvePaiement ? (
          /\.(pdf|jpg|jpeg|png|webp)$/i.test(d.preuvePaiement) || d.preuvePaiement.startsWith('http') || d.preuvePaiement.startsWith('/api/') ? (
            <a
              href={resolveFileUrl(d.preuvePaiement)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-ocean text-xs hover:underline"
            >
              <ExternalLink className="w-3 h-3" strokeWidth={1.75} /> Voir
            </a>
          ) : (
            <code className="font-mono text-[10px] text-earth-600 truncate block max-w-[140px]">
              {d.preuvePaiement}
            </code>
          )
        ) : (
          <span className="text-earth-300 text-xs">—</span>
        ),
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
          Le solde <strong>à retirer</strong> sera versé par l'admin (Mobile Money, virement
          ou crypto) dès qu'un montant suffisant sera atteint.
        </p>
      </header>

      {/* KPIs balance */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balanceLoading || isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl " />
          ))
        ) : (
          <>
            <StatCard
              label="À retirer"
              value={<Money amount={balance?.aRetirer ?? 0} mono={false} />}
              icon={Wallet}
              iconBg="bg-warning/15"
              iconColor="text-warning"
              trendLabel={
                balance?.nbARetirer
                  ? `${balance.nbARetirer} dividende${balance.nbARetirer > 1 ? 's' : ''} en attente`
                  : 'Aucun en attente'
              }
              trend={balance?.nbARetirer ? 0 : null}
            />
            <StatCard
              label="Déjà reçu"
              value={<Money amount={balance?.dejaRecu ?? 0} mono={false} />}
              icon={Coins}
              iconBg="bg-success/10"
              iconColor="text-success"
              trendLabel={
                balance?.nbDejaRecu
                  ? `${balance.nbDejaRecu} versement${balance.nbDejaRecu > 1 ? 's' : ''}`
                  : 'Aucun versement'
              }
              trend={balance?.nbDejaRecu ? 0 : null}
            />
            <StatCard
              label="Total cumulé"
              value={<Money amount={balance?.total ?? 0} mono={false} />}
              icon={TrendingUp}
              iconBg="bg-gold/15"
              iconColor="text-gold-600"
            />
            <StatCard
              label="Propriétés"
              value={nbProprietes}
              icon={Clock}
              iconBg="bg-ocean/10"
              iconColor="text-ocean"
              trendLabel="génératrices de revenu"
              trend={nbProprietes ? 0 : null}
            />
          </>
        )}
      </section>

      {/* Tableau */}
      <section>
        {isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
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
