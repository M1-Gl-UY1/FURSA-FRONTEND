import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpFromLine,
  ArrowDownToLine,
  Clock,
  Coins,
  Construction,
  Filter,
  Info,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Wallet as WalletIcon,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useMyWallet,
  useMyWalletStats,
  useMyWalletTransactions,
  WALLET_TX_DISPLAY,
  type WalletTxFilter,
} from '@/lib/api/wallet'
import { useCountUp } from '@/lib/hooks/useCountUp'
import type { TypeWalletTransaction, WalletTransactionResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type Tab = 'historique' | 'recharger' | 'retirer'

export function WalletPage() {
  const { data: wallet, isLoading: walletLoading } = useMyWallet()
  const { data: stats, isLoading: statsLoading } = useMyWalletStats()
  const [tab, setTab] = useState<Tab>('historique')
  const [filter, setFilter] = useState<WalletTxFilter>({})
  const { data: transactions, isLoading: txLoading } = useMyWalletTransactions(filter)

  const filtersActive = !!(filter.type || filter.from || filter.to)
  const isLoading = walletLoading || statsLoading

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p className="font-body text-xs uppercase tracking-widest text-terra font-semibold mb-2 inline-flex items-center gap-1.5">
          <WalletIcon className="w-3.5 h-3.5" strokeWidth={2} />
          Mon espace financier
        </p>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Mon wallet
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Votre solde et l'historique de tous vos mouvements sur la plateforme FURSA.
        </p>
      </header>

      {/* Hero balance — gros affichage du solde */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-terra to-terra-700 text-white p-6 sm:p-8">
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm mb-4">
              <WalletIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="font-body text-xs font-semibold uppercase tracking-wider">
                Solde disponible
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-12 w-64 bg-white/20" />
            ) : (
              <SoldeAnimated solde={wallet?.solde ?? 0} />
            )}
            {!isLoading && stats?.dernierMouvement && (
              <p className="font-body text-white/70 text-xs mt-3 inline-flex items-center gap-1.5">
                <Clock className="w-3 h-3" strokeWidth={1.75} />
                Dernier mouvement : {formatRelativeDate(stats.dernierMouvement)}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="lg"
              onClick={() => setTab('recharger')}
              className="bg-white text-terra hover:bg-white/90 font-semibold"
            >
              <ArrowDownToLine className="w-4 h-4 mr-2" strokeWidth={2} />
              Recharger
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setTab('retirer')}
              disabled={(wallet?.solde ?? 0) <= 0}
              className="border-white/40 text-white hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowUpFromLine className="w-4 h-4 mr-2" strokeWidth={2} />
              Retirer
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs secondaires */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-sand-300" />
          ))
        ) : (
          <>
            <KpiMoney
              label="Total crédité"
              target={stats?.totalCredite ?? 0}
              icon={TrendingUp}
              iconBg="bg-success/10"
              iconColor="text-success"
            />
            <KpiMoney
              label="Total débité"
              target={stats?.totalDebite ?? 0}
              icon={TrendingDown}
              iconBg="bg-warning/15"
              iconColor="text-warning"
            />
            <KpiCount
              label="Mouvements"
              target={stats?.nbMouvements ?? 0}
              icon={Coins}
              iconBg="bg-ocean/10"
              iconColor="text-ocean"
            />
            <KpiStatic
              label="Devise"
              value={wallet?.devise ?? 'USD'}
              icon={WalletIcon}
              iconBg="bg-gold/15"
              iconColor="text-gold-600"
            />
          </>
        )}
      </section>

      {/* Tabs */}
      <div role="tablist" className="flex flex-wrap gap-1 bg-sand-200 rounded-md p-1">
        <TabButton active={tab === 'historique'} onClick={() => setTab('historique')}>
          Historique
        </TabButton>
        <TabButton active={tab === 'recharger'} onClick={() => setTab('recharger')}>
          Recharger
        </TabButton>
        <TabButton active={tab === 'retirer'} onClick={() => setTab('retirer')}>
          Retirer
        </TabButton>
      </div>

      {tab === 'historique' && (
        <HistoriqueTab
          transactions={transactions ?? []}
          isLoading={txLoading}
          filter={filter}
          onChangeFilter={setFilter}
          filtersActive={filtersActive}
        />
      )}
      {tab === 'recharger' && <RechargerTab />}
      {tab === 'retirer' && <RetirerTab />}
    </div>
  )
}

// =============================================================================
// Tab : Historique
// =============================================================================

function HistoriqueTab({
  transactions,
  isLoading,
  filter,
  onChangeFilter,
  filtersActive,
}: {
  transactions: WalletTransactionResponse[]
  isLoading: boolean
  filter: WalletTxFilter
  onChangeFilter: (f: WalletTxFilter) => void
  filtersActive: boolean
}) {
  const columns = useMemo<Column<WalletTransactionResponse>[]>(
    () => [
      {
        key: 'createdAt',
        label: 'Date',
        sortAccessor: (t) => new Date(t.createdAt),
        render: (t) => (
          <span className="font-body text-xs text-earth-600">
            {formatFullDate(t.createdAt)}
          </span>
        ),
        width: 'w-40',
      },
      {
        key: 'type',
        label: 'Type',
        render: (t) => {
          const d = WALLET_TX_DISPLAY[t.type]
          const Icon = t.montant > 0 ? ArrowDownLeft : ArrowUpRight
          return (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  t.montant > 0 ? 'bg-success/10' : 'bg-warning/15'
                )}
              >
                <Icon
                  className={cn('w-4 h-4', t.montant > 0 ? 'text-success' : 'text-warning')}
                  strokeWidth={1.75}
                />
              </div>
              <div className="min-w-0">
                <p className="font-body font-semibold text-earth text-sm leading-tight">
                  {d.label}
                </p>
                {t.libelle && (
                  <p className="font-body text-earth-500 text-xs truncate max-w-[260px]">
                    {t.libelle}
                  </p>
                )}
              </div>
            </div>
          )
        },
      },
      {
        key: 'montant',
        label: 'Montant',
        align: 'right',
        render: (t) => (
          <span
            className={cn(
              'font-mono font-bold',
              t.montant > 0 ? 'text-success' : 'text-warning'
            )}
          >
            {t.montant > 0 ? '+' : ''}
            <Money amount={t.montant} mono />
          </span>
        ),
      },
      {
        key: 'soldeApres',
        label: 'Solde après',
        align: 'right',
        hideOnMobile: true,
        render: (t) => (
          <span className="font-mono text-earth-600 text-xs">
            <Money amount={t.soldeApres} mono />
          </span>
        ),
      },
    ],
    []
  )

  return (
    <section className="space-y-3">
      {/* Toolbar filtres */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          <FilterSelect
            value={filter.type ?? ''}
            onChange={(v) =>
              onChangeFilter({ ...filter, type: (v || null) as TypeWalletTransaction | null })
            }
            options={[
              { value: '', label: 'Tous les types' },
              ...Object.entries(WALLET_TX_DISPLAY).map(([k, v]) => ({
                value: k,
                label: v.label,
              })),
            ]}
            ariaLabel="Filtrer par type"
          />
          <DateFilter
            value={filter.from ?? ''}
            onChange={(v) => onChangeFilter({ ...filter, from: v || null })}
            placeholder="Depuis"
          />
          <DateFilter
            value={filter.to ?? ''}
            onChange={(v) => onChangeFilter({ ...filter, to: v || null })}
            placeholder="Jusqu'à"
          />
        </div>
        {filtersActive && (
          <Button variant="outline" size="sm" onClick={() => onChangeFilter({})}>
            <X className="w-4 h-4 mr-1" strokeWidth={1.75} />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      ) : (
        <DataTable
          data={transactions}
          columns={columns}
          rowKey={(t) => t.id}
          initialSort={{ key: 'createdAt', direction: 'desc' }}
          pageSize={20}
          empty={
            <EmptyState
              icon={filtersActive ? Filter : Coins}
              title={filtersActive ? 'Aucun résultat' : 'Aucun mouvement'}
              description={
                filtersActive
                  ? 'Aucune transaction ne correspond à vos filtres. Essayez de les élargir.'
                  : "Votre historique de transactions apparaîtra ici dès que vous rechargerez votre wallet, achèterez des parts ou recevrez un dividende."
              }
            />
          }
        />
      )}
    </section>
  )
}

// =============================================================================
// Tab : Recharger (placeholder — sera plein avec PSP en Phase 10c)
// =============================================================================

function RechargerTab() {
  return (
    <section className="rounded-xl border border-dashed border-earth/15 bg-sand-50 p-8 sm:p-12 text-center">
      <div className="w-14 h-14 rounded-full bg-ocean/10 flex items-center justify-center mx-auto mb-4">
        <Construction className="w-6 h-6 text-ocean" strokeWidth={1.75} />
      </div>
      <h2 className="font-display font-bold text-earth text-xl mb-2">
        Recharge wallet — bientôt disponible
      </h2>
      <p className="font-body text-earth-600 text-sm max-w-md mx-auto mb-6">
        La recharge via Mobile Money, virement et crypto sera disponible dans la prochaine
        mise à jour. En attendant, votre solde sera crédité automatiquement lors de la
        distribution des dividendes des propriétés dans lesquelles vous détenez des parts.
      </p>
      <div className="inline-flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white border border-earth/10 rounded-lg px-4 py-3 text-left">
        <Info className="w-4 h-4 text-ocean flex-shrink-0" strokeWidth={1.75} />
        <p className="font-body text-earth-700 text-xs">
          <strong>Besoin de tester votre wallet ?</strong> Contactez l'équipe FURSA pour
          un crédit de test.
        </p>
      </div>
    </section>
  )
}

// =============================================================================
// Tab : Retirer — Phase 10e LIVRÉ
// =============================================================================

function RetirerTab() {
  const { data: wallet } = useMyWallet()
  const solde = wallet?.solde ?? 0

  if (solde <= 0) {
    return (
      <EmptyState
        icon={ArrowUpFromLine}
        title="Wallet vide"
        description="Vous n'avez aucun solde à retirer pour le moment. Recevez des dividendes ou rechargez votre wallet pour pouvoir effectuer un retrait."
      />
    )
  }

  return (
    <section className="rounded-xl border border-success/30 bg-success/5 p-6 sm:p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
        <ArrowUpFromLine className="w-6 h-6 text-success" strokeWidth={1.75} />
      </div>
      <h2 className="font-display font-bold text-earth text-xl mb-2">
        Retirer votre solde
      </h2>
      <p className="font-body text-earth-600 text-sm max-w-md mx-auto mb-4">
        Transférez votre solde vers <strong>Mobile Money</strong>, virement bancaire
        ou wallet crypto. Validation admin requise, commission FURSA 5%.
      </p>
      <div className="inline-flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white border border-earth/10 rounded-lg px-4 py-3 text-left mb-5">
        <PlusCircle className="w-4 h-4 text-success flex-shrink-0" strokeWidth={1.75} />
        <p className="font-body text-earth-700 text-xs">
          <strong>Solde disponible :</strong>{' '}
          <Money amount={solde} mono={false} className="font-bold" />
        </p>
      </div>
      <Button asChild size="lg">
        <Link to="/retraits">
          <ArrowUpFromLine strokeWidth={2} />
          Aller à mes retraits
        </Link>
      </Button>
    </section>
  )
}

// =============================================================================
// Animated KPI cards
// =============================================================================

function SoldeAnimated({ solde }: { solde: number }) {
  const [value, ref] = useCountUp({ target: solde })
  return (
    <div
      ref={ref}
      className="font-mono font-bold text-4xl sm:text-5xl tabular-nums"
    >
      <Money amount={value} className="text-white" mono />
    </div>
  )
}

type KpiProps = {
  label: string
  target: number
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

function KpiMoney({ label, target, icon: Icon, iconBg, iconColor }: KpiProps) {
  const [value, ref] = useCountUp({ target })
  return (
    <div
      ref={ref}
      className="bg-white rounded-xl border border-earth/8 shadow-card p-4 sm:p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="font-body text-xs text-earth-500 uppercase tracking-wide font-semibold">
          {label}
        </p>
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.75} />
        </div>
      </div>
      <p className="font-mono font-bold text-earth text-xl sm:text-2xl tabular-nums">
        <Money amount={value} mono={false} />
      </p>
    </div>
  )
}

function KpiCount({ label, target, icon: Icon, iconBg, iconColor }: KpiProps) {
  const [value, ref] = useCountUp({ target })
  return (
    <div
      ref={ref}
      className="bg-white rounded-xl border border-earth/8 shadow-card p-4 sm:p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="font-body text-xs text-earth-500 uppercase tracking-wide font-semibold">
          {label}
        </p>
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.75} />
        </div>
      </div>
      <p className="font-mono font-bold text-earth text-2xl sm:text-3xl tabular-nums">
        {Math.round(value).toLocaleString('fr-FR')}
      </p>
    </div>
  )
}

function KpiStatic({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-earth/8 shadow-card p-4 sm:p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="font-body text-xs text-earth-500 uppercase tracking-wide font-semibold">
          {label}
        </p>
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.75} />
        </div>
      </div>
      <p className="font-mono font-bold text-earth text-2xl sm:text-3xl">
        {value}
      </p>
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'px-3 sm:px-4 py-2 rounded-md font-body text-sm font-semibold transition-colors',
        active
          ? 'bg-white text-earth shadow-sm'
          : 'text-earth-600 hover:text-earth hover:bg-white/50'
      )}
    >
      {children}
    </button>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  ariaLabel: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={cn(
        'h-11 px-3 rounded-md border-[1.5px] border-sand-400 bg-white text-sm font-body text-earth',
        'focus:outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15'
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function DateFilter({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const dateOnly = value ? value.slice(0, 10) : ''
  return (
    <input
      type="date"
      value={dateOnly}
      onChange={(e) => onChange(e.target.value ? `${e.target.value}T00:00:00` : '')}
      placeholder={placeholder}
      aria-label={placeholder}
      className={cn(
        'h-11 px-3 rounded-md border-[1.5px] border-sand-400 bg-white text-sm font-body text-earth',
        'focus:outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15'
      )}
    />
  )
}

// =============================================================================
// Date helpers
// =============================================================================

function formatFullDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatRelativeDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  if (diffH < 24) return `il y a ${diffH}h`
  if (diffD < 7) return `il y a ${diffD}j`
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}
