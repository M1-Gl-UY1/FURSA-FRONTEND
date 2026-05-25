import { useMemo, useState } from 'react'
import {
  ArrowUpFromLine,
  Banknote,
  Bitcoin,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  HelpCircle,
  Loader2,
  Smartphone,
  Wallet as WalletIcon,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { Button } from '@/components/ui/button'
import { useCountUp } from '@/lib/hooks/useCountUp'
import type { LucideIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useDemanderRetrait, useMesRetraits } from '@/lib/api/retraits'
import { useMyWallet } from '@/lib/api/wallet'
import { extractApiError } from '@/lib/api/errors'
import type {
  DemandeRetraitResponse,
  MethodeRetrait,
  StatutDemandeRetrait,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'

const COMMISSION_FURSA_PCT = 5

/**
 * Page user /retraits : suivre mes demandes + en créer une nouvelle.
 */
export function RetraitsPage() {
  const { data: retraits, isLoading } = useMesRetraits()
  const { data: wallet } = useMyWallet()
  const [demanderOpen, setDemanderOpen] = useState(false)

  const stats = useMemo(() => {
    const list = retraits ?? []
    return {
      pending: list.filter((r) => r.statut === 'PENDING' || r.statut === 'APPROVED').length,
      completed: list.filter((r) => r.statut === 'COMPLETED').length,
      totalRetire: list
        .filter((r) => r.statut === 'COMPLETED')
        .reduce((s, r) => s + (r.montantFinal ?? 0), 0),
    }
  }, [retraits])

  const columns: Column<DemandeRetraitResponse>[] = [
    {
      key: 'createdAt',
      label: 'Date',
      sortAccessor: (r) => new Date(r.createdAt),
      render: (r) => (
        <span className="font-body text-xs text-earth-600">{formatDate(r.createdAt)}</span>
      ),
      width: 'w-32',
    },
    {
      key: 'source',
      label: 'Source',
      render: (r) => (
        <div>
          <p className="font-body font-semibold text-earth text-sm">
            {r.source === 'WALLET' ? 'Mon wallet' : r.sourceLibelle ?? 'Escrow'}
          </p>
          <p className="font-body text-earth-500 text-[10px]">
            via {labelMethode(r.methode)}
          </p>
        </div>
      ),
    },
    {
      key: 'montantDemande',
      label: 'Montant',
      align: 'right',
      render: (r) => (
        <div className="text-right">
          <Money amount={r.montantDemande} mono={false} className="font-bold text-earth" />
          {r.commissionFursa && r.commissionFursa > 0 && (
            <p className="font-mono text-[10px] text-error">
              − <Money amount={r.commissionFursa} mono /> FURSA
            </p>
          )}
          {r.montantFinal && r.montantFinal !== r.montantDemande && (
            <p className="font-mono text-[10px] text-success font-semibold">
              Net <Money amount={r.montantFinal} mono />
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      render: (r) => <StatutBadge statut={r.statut} />,
    },
    {
      key: 'preuve',
      label: 'Réf.',
      hideOnMobile: true,
      noSort: true,
      render: (r) => {
        if (r.statut === 'REFUSED') {
          return (
            <span className="text-error text-[10px] line-clamp-2 max-w-[180px] block">
              {r.motifRefus}
            </span>
          )
        }
        if (r.preuvePaiement) {
          return r.preuvePaiement.startsWith('http') ? (
            <a
              href={r.preuvePaiement}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-ocean text-xs hover:underline"
            >
              <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
              Voir
            </a>
          ) : (
            <code className="font-mono text-[10px] text-earth-600 truncate block max-w-[140px]">
              {r.preuvePaiement}
            </code>
          )
        }
        if (r.referenceCible) {
          return (
            <code className="font-mono text-[10px] text-earth-500 truncate block max-w-[140px]">
              → {r.referenceCible}
            </code>
          )
        }
        return <span className="text-earth-300 text-xs">—</span>
      },
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero compact */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-terra to-terra-700 p-6 sm:p-7">
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 w-56 h-56 bg-gold/15 rounded-full blur-3xl pointer-events-none"
        />
        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-center">
          <div>
            <p className="font-body text-xs uppercase tracking-widest text-gold-300 font-semibold mb-2 inline-flex items-center gap-1.5">
              <ArrowUpFromLine className="w-3.5 h-3.5" strokeWidth={2} />
              Mes retraits
            </p>
            <h1 className="font-display font-bold text-white text-2xl sm:text-3xl lg:text-4xl mb-2">
              Retirer mon argent
            </h1>
            <p className="font-body text-white/80 text-sm">
              Transférez votre solde vers Mobile Money, virement bancaire ou crypto.
              Commission FURSA <strong>{COMMISSION_FURSA_PCT}%</strong> · validation admin requise.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setDemanderOpen(true)}
            disabled={(wallet?.solde ?? 0) <= 0}
            className="bg-white text-terra hover:bg-sand-50 disabled:opacity-50"
          >
            <ArrowUpFromLine className="w-4 h-4" strokeWidth={2} />
            Demander un retrait
          </Button>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KpiMoney
          label="Solde wallet"
          target={wallet?.solde ?? 0}
          icon={WalletIcon}
          iconBg="bg-terra/10"
          iconColor="text-terra"
        />
        <KpiCount
          label="Demandes en cours"
          target={stats.pending}
          icon={Clock}
          iconBg="bg-warning/15"
          iconColor="text-warning"
        />
        <KpiMoney
          label="Total déjà retiré"
          target={stats.totalRetire}
          icon={CheckCircle2}
          iconBg="bg-success/10"
          iconColor="text-success"
        />
      </section>

      {/* Table */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      ) : (
        <DataTable
          data={retraits ?? []}
          columns={columns}
          rowKey={(r) => r.id}
          initialSort={{ key: 'createdAt', direction: 'desc' }}
          pageSize={20}
          empty={
            <EmptyState
              icon={Banknote}
              title="Aucun retrait pour le moment"
              description="Cliquez sur 'Demander un retrait' pour transférer votre solde wallet vers Mobile Money, virement ou crypto."
            />
          }
        />
      )}

      {/* Modal demande */}
      <DemandeModal
        open={demanderOpen}
        onClose={() => setDemanderOpen(false)}
        soldeWallet={wallet?.solde ?? 0}
      />
    </div>
  )
}

// =============================================================================
// Modal de demande de retrait
// =============================================================================

function DemandeModal({
  open,
  onClose,
  soldeWallet,
}: {
  open: boolean
  onClose: () => void
  soldeWallet: number
}) {
  const [methode, setMethode] = useState<MethodeRetrait>('MOBILE_MONEY')
  const [montant, setMontant] = useState('')
  const [reference, setReference] = useState('')
  const demander = useDemanderRetrait()

  const montantNum = parseFloat(montant || '0')
  const commission = Math.round(montantNum * COMMISSION_FURSA_PCT) / 100
  const net = montantNum - commission
  const valid =
    montantNum > 0 &&
    montantNum <= soldeWallet &&
    reference.trim().length > 0 &&
    methode !== 'WALLET_INTERNE'

  function reset() {
    setMethode('MOBILE_MONEY')
    setMontant('')
    setReference('')
  }

  function submit() {
    demander.mutate(
      {
        source: 'WALLET',
        montant: montantNum,
        methode,
        referenceCible: reference.trim(),
      },
      {
        onSuccess: () => {
          toast.success(`Demande de retrait de ${montantNum} USD créée. Validation admin en attente.`)
          reset()
          onClose()
        },
        onError: (e) => toast.error(extractApiError(e, 'Demande impossible.')),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-earth">
            <ArrowUpFromLine className="w-5 h-5 text-terra" strokeWidth={1.75} />
            Demander un retrait
          </DialogTitle>
          <DialogDescription className="pt-2">
            Votre demande sera examinée par un admin avant exécution. Une commission
            FURSA de {COMMISSION_FURSA_PCT}% est prélevée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Méthode */}
          <div>
            <Label className="mb-2 block">Méthode de retrait</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone },
                  { value: 'VIREMENT', label: 'Virement', icon: Banknote },
                  { value: 'CRYPTO', label: 'Crypto', icon: Bitcoin },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMethode(value)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 h-20 rounded-md border-[1.5px] font-body text-xs font-semibold transition-colors',
                    methode === value
                      ? 'border-terra bg-terra/10 text-terra'
                      : 'border-sand-400 text-earth-600 hover:border-terra/40'
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Montant */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <Label htmlFor="montant">Montant (USD)</Label>
              <button
                type="button"
                onClick={() => setMontant(String(soldeWallet))}
                className="font-body text-[10px] text-ocean font-semibold hover:underline"
              >
                Max : <Money amount={soldeWallet} mono={false} />
              </button>
            </div>
            <Input
              id="montant"
              type="number"
              min={1}
              max={soldeWallet}
              step={0.01}
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="Ex : 250"
              className="font-mono"
            />
            {montantNum > 0 && montantNum <= soldeWallet && (
              <div className="mt-2 bg-sand-100 rounded-md p-3 space-y-1 text-xs font-body">
                <Row label="Montant demandé">
                  <Money amount={montantNum} mono={false} />
                </Row>
                <Row label={`Commission FURSA (${COMMISSION_FURSA_PCT}%)`}>
                  <span className="text-error">
                    − <Money amount={commission} mono={false} />
                  </span>
                </Row>
                <div className="pt-1 mt-1 border-t border-earth/8">
                  <Row label="Vous recevrez">
                    <strong className="text-success">
                      <Money amount={net} mono={false} className="font-bold" />
                    </strong>
                  </Row>
                </div>
              </div>
            )}
            {montantNum > soldeWallet && (
              <p className="mt-1 font-body text-xs text-error">
                Montant supérieur à votre solde disponible.
              </p>
            )}
          </div>

          {/* Référence */}
          <div>
            <Label htmlFor="reference">
              {methode === 'MOBILE_MONEY' && 'Numéro Mobile Money'}
              {methode === 'VIREMENT' && 'IBAN / RIB'}
              {methode === 'CRYPTO' && 'Adresse wallet crypto'}
              <span className="text-error"> *</span>
            </Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={
                methode === 'MOBILE_MONEY'
                  ? '+225 07 XX XX XX XX'
                  : methode === 'VIREMENT'
                    ? 'FR76 1234 5678 9012 3456 7890 123'
                    : '0x... ou bc1...'
              }
              className={methode === 'CRYPTO' ? 'font-mono text-xs' : ''}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={demander.isPending}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={!valid || demander.isPending}
          >
            {demander.isPending ? (
              <>
                <Loader2 className="animate-spin" strokeWidth={2} />
                Création...
              </>
            ) : (
              <>
                <ArrowUpFromLine strokeWidth={2} />
                Soumettre la demande
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function StatutBadge({ statut }: { statut: StatutDemandeRetrait }) {
  const config: Record<StatutDemandeRetrait, { label: string; className: string; icon: typeof Clock }> = {
    PENDING: { label: 'En attente', className: 'bg-warning/15 text-warning', icon: Clock },
    APPROVED: { label: 'Validé', className: 'bg-ocean/15 text-ocean', icon: CheckCircle2 },
    COMPLETED: { label: 'Effectué', className: 'bg-success/15 text-success', icon: CheckCircle2 },
    REFUSED: { label: 'Refusé', className: 'bg-error/15 text-error', icon: XCircle },
  }
  const c = config[statut]
  const Icon = c.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-body font-semibold rounded-full text-[11px] px-2 py-0.5',
        c.className
      )}
    >
      <Icon className="w-3 h-3" strokeWidth={2} />
      {c.label}
    </span>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-earth-600">{label}</span>
      <span className="font-mono font-semibold text-earth">{children}</span>
    </div>
  )
}

function labelMethode(m: MethodeRetrait): string {
  switch (m) {
    case 'MOBILE_MONEY': return 'Mobile Money'
    case 'VIREMENT': return 'Virement bancaire'
    case 'CRYPTO': return 'Crypto'
    case 'WALLET_INTERNE': return 'Wallet interne'
  }
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

// =============================================================================
// Animated KPI cards
// =============================================================================

type KpiAnimProps = {
  label: string
  target: number
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

function KpiMoney({ label, target, icon: Icon, iconBg, iconColor }: KpiAnimProps) {
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

function KpiCount({ label, target, icon: Icon, iconBg, iconColor }: KpiAnimProps) {
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

// Suppress unused
void Coins
void HelpCircle
