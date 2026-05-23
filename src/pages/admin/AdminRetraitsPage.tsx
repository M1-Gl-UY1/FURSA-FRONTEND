import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpFromLine,
  Banknote,
  Bitcoin,
  CheckCircle2,
  Clock,
  Coins,
  Send,
  Smartphone,
  Wallet as WalletIcon,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
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
import {
  useAdminRetraits,
  useCompleterRetrait,
  useRefuserRetrait,
  useValiderRetrait,
} from '@/lib/api/retraits'
import { extractApiError } from '@/lib/api/errors'
import type {
  DemandeRetraitResponse,
  MethodeRetrait,
  StatutDemandeRetrait,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'

type Tab = 'pending' | 'approved' | 'all'

export function AdminRetraitsPage() {
  const { data, isLoading } = useAdminRetraits()
  const valider = useValiderRetrait()
  const [tab, setTab] = useState<Tab>('pending')
  const [refusTarget, setRefusTarget] = useState<DemandeRetraitResponse | null>(null)
  const [completerTarget, setCompleterTarget] = useState<DemandeRetraitResponse | null>(null)

  const list = data ?? []
  const pending = list.filter((r) => r.statut === 'PENDING')
  const approved = list.filter((r) => r.statut === 'APPROVED')
  const completed = list.filter((r) => r.statut === 'COMPLETED')

  const filtered = useMemo(() => {
    if (tab === 'pending') return pending
    if (tab === 'approved') return approved
    return list
  }, [tab, list, pending, approved])

  const stats = {
    pending: pending.length,
    approved: approved.length,
    completed: completed.length,
    montantPending: pending.reduce((s, r) => s + r.montantDemande, 0),
  }

  function handleValider(r: DemandeRetraitResponse) {
    valider.mutate(r.id, {
      onSuccess: () =>
        toast.success(
          r.source === 'ESCROW_PROPRIETE'
            ? `Retrait validé : net crédité sur le wallet de ${r.userNomComplet}.`
            : `Retrait approuvé. Exécutez le paiement, puis marquez "Complété".`
        ),
      onError: (e) => toast.error(extractApiError(e, 'Validation impossible.')),
    })
  }

  const columns: Column<DemandeRetraitResponse>[] = [
    {
      key: 'id',
      label: '#',
      width: 'w-12',
      align: 'right',
      render: (r) => <span className="font-mono text-xs text-earth-500">#{r.id}</span>,
    },
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
      key: 'user',
      label: 'Utilisateur',
      render: (r) => (
        <div>
          <p className="font-body font-semibold text-earth text-sm">{r.userNomComplet}</p>
          <p className="font-body text-earth-500 text-[10px]">{r.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      hideOnMobile: true,
      render: (r) => (
        <div>
          <p className="font-body text-earth text-xs">
            {r.source === 'WALLET' ? '💼 Wallet' : '🏠 Escrow'}
          </p>
          {r.sourceLibelle && (
            <p className="font-body text-earth-500 text-[10px] line-clamp-1 max-w-[140px]">
              {r.sourceLibelle}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'montantDemande',
      label: 'Montant',
      align: 'right',
      render: (r) => (
        <div className="text-right">
          <Money
            amount={r.montantDemande}
            mono={false}
            className="font-bold text-earth"
          />
          {r.commissionFursa != null && r.commissionFursa > 0 && (
            <p className="font-mono text-[10px] text-success">
              FURSA + <Money amount={r.commissionFursa} mono />
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'methode',
      label: 'Méthode',
      hideOnMobile: true,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <MethodeIcon methode={r.methode} />
          <span className="font-body text-xs text-earth-600">
            {labelMethode(r.methode)}
          </span>
        </div>
      ),
    },
    {
      key: 'reference',
      label: 'Référence',
      hideOnMobile: true,
      noSort: true,
      render: (r) =>
        r.referenceCible ? (
          <code className="font-mono text-[10px] text-earth-600 truncate block max-w-[160px]">
            {r.referenceCible}
          </code>
        ) : (
          <span className="text-earth-300 text-xs">—</span>
        ),
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      render: (r) => <StatutBadge statut={r.statut} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      noSort: true,
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.statut === 'PENDING' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleValider(r)}
                disabled={valider.isPending}
                title="Valider"
                aria-label="Valider"
                className="text-success hover:bg-success/10 hover:text-success"
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRefusTarget(r)}
                title="Refuser"
                aria-label="Refuser"
                className="text-error hover:bg-error/10 hover:text-error"
              >
                <XCircle className="w-4 h-4" strokeWidth={1.75} />
              </Button>
            </>
          )}
          {r.statut === 'APPROVED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCompleterTarget(r)}
              className="text-ocean border-ocean/40"
            >
              <Send className="w-4 h-4 mr-1" strokeWidth={1.75} />
              Marquer payé
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Demandes de retrait
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Valider les retraits wallet (vers MM/virement/crypto) ou escrow (vers wallet
          propriétaire). Commission FURSA 5% appliquée automatiquement.
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
              label="À valider"
              value={stats.pending}
              icon={Clock}
              iconBg="bg-warning/15"
              iconColor="text-warning"
            />
            <StatCard
              label="À exécuter (cash)"
              value={stats.approved}
              icon={Send}
              iconBg="bg-ocean/10"
              iconColor="text-ocean"
            />
            <StatCard
              label="Effectués"
              value={stats.completed}
              icon={CheckCircle2}
              iconBg="bg-success/10"
              iconColor="text-success"
            />
            <StatCard
              label="En attente (montant)"
              value={<Money amount={stats.montantPending} mono={false} />}
              icon={WalletIcon}
              iconBg="bg-terra/10"
              iconColor="text-terra"
            />
          </>
        )}
      </section>

      {/* Tabs */}
      <div role="tablist" className="flex flex-wrap gap-1 bg-sand-200 rounded-md p-1">
        <TabButton active={tab === 'pending'} onClick={() => setTab('pending')} count={pending.length} highlight>
          À valider
        </TabButton>
        <TabButton active={tab === 'approved'} onClick={() => setTab('approved')} count={approved.length}>
          À exécuter
        </TabButton>
        <TabButton active={tab === 'all'} onClick={() => setTab('all')} count={list.length}>
          Toutes
        </TabButton>
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          rowKey={(r) => r.id}
          initialSort={{ key: 'createdAt', direction: 'desc' }}
          pageSize={20}
          empty={
            <EmptyState
              icon={ArrowUpFromLine}
              title={tab === 'pending' ? 'Aucune demande à valider' : 'Aucun retrait'}
              description={
                tab === 'pending'
                  ? 'Toutes les demandes ont été traitées.'
                  : 'Aucun retrait dans cette catégorie.'
              }
            />
          }
        />
      )}

      {/* Modal refus */}
      <RefusModal
        target={refusTarget}
        onClose={() => setRefusTarget(null)}
      />

      {/* Modal completer */}
      <CompleterModal
        target={completerTarget}
        onClose={() => setCompleterTarget(null)}
      />
    </div>
  )
}

// =============================================================================
// Modal Refus
// =============================================================================

function RefusModal({
  target,
  onClose,
}: {
  target: DemandeRetraitResponse | null
  onClose: () => void
}) {
  const [motif, setMotif] = useState('')
  const refuser = useRefuserRetrait()
  const valid = motif.trim().length >= 5

  function submit() {
    if (!target) return
    refuser.mutate(
      { id: target.id, motif: motif.trim() },
      {
        onSuccess: () => {
          toast.success('Demande refusée. Le montant a été recrédité à la source.')
          setMotif('')
          onClose()
        },
        onError: (e) => toast.error(extractApiError(e, 'Refus impossible.')),
      }
    )
  }

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-error">
            <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
            Refuser la demande
          </DialogTitle>
          <DialogDescription className="pt-2">
            <span className="block">
              Demande #{target?.id} de {target?.userNomComplet}
            </span>
            <span className="block mt-2 font-body text-earth-700 text-sm">
              Montant : <strong>
                <Money amount={target?.montantDemande ?? 0} mono={false} />
              </strong>
              <br />
              Le montant sera intégralement recrédité à la source.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="motif-refus">
            Motif <span className="text-error">*</span>{' '}
            <span className="font-body text-earth-500 text-xs font-normal">(min 5 caractères)</span>
          </Label>
          <textarea
            id="motif-refus"
            rows={4}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex : Référence Mobile Money incorrecte, dépassement plafond AML, etc."
            disabled={refuser.isPending}
            className="w-full rounded-md border-[1.5px] border-sand-400 bg-white px-3 py-2 text-sm font-body text-earth focus:outline-none focus:border-error focus:ring-2 focus:ring-error/15 resize-y"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={refuser.isPending}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={!valid || refuser.isPending}
            className="bg-error hover:bg-error/90 text-white"
          >
            {refuser.isPending ? 'Refus...' : 'Confirmer le refus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Modal Compléter (paiement effectué)
// =============================================================================

function CompleterModal({
  target,
  onClose,
}: {
  target: DemandeRetraitResponse | null
  onClose: () => void
}) {
  const [preuve, setPreuve] = useState('')
  const completer = useCompleterRetrait()

  function submit() {
    if (!target || !preuve.trim()) return
    completer.mutate(
      { id: target.id, preuvePaiement: preuve.trim() },
      {
        onSuccess: () => {
          toast.success('Retrait marqué effectué. Le user est notifié.')
          setPreuve('')
          onClose()
        },
        onError: (e) => toast.error(extractApiError(e, 'Action impossible.')),
      }
    )
  }

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-success">
            <Send className="w-5 h-5" strokeWidth={1.75} />
            Marquer le retrait comme effectué
          </DialogTitle>
          <DialogDescription className="pt-2">
            Vous confirmez avoir versé{' '}
            <strong>
              <Money amount={target?.montantFinal ?? 0} mono={false} />
            </strong>{' '}
            à <strong>{target?.userNomComplet}</strong> via{' '}
            <strong>{target ? labelMethode(target.methode) : ''}</strong>
            {target?.referenceCible && (
              <>
                {' '}sur <code className="text-xs">{target.referenceCible}</code>
              </>
            )}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="preuve">
            Référence du paiement <span className="text-error">*</span>
          </Label>
          <Input
            id="preuve"
            value={preuve}
            onChange={(e) => setPreuve(e.target.value)}
            placeholder={
              target?.methode === 'MOBILE_MONEY'
                ? 'Ex : MM-2026-05-23-ABC123'
                : target?.methode === 'VIREMENT'
                  ? 'Référence du virement'
                  : '0x... ou hash crypto'
            }
            disabled={completer.isPending}
          />
          <p className="font-body text-xs text-earth-500">
            Visible par le user pour suivre son retrait.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={completer.isPending}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={!preuve.trim() || completer.isPending}
            className="bg-success hover:bg-success/90 text-white"
          >
            {completer.isPending ? 'Enregistrement...' : 'Confirmer le versement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function StatutBadge({ statut }: { statut: StatutDemandeRetrait }) {
  const config: Record<StatutDemandeRetrait, { label: string; className: string }> = {
    PENDING: { label: 'À valider', className: 'bg-warning/15 text-warning' },
    APPROVED: { label: 'À payer', className: 'bg-ocean/15 text-ocean' },
    COMPLETED: { label: 'Effectué', className: 'bg-success/15 text-success' },
    REFUSED: { label: 'Refusé', className: 'bg-error/15 text-error' },
  }
  const c = config[statut]
  return (
    <span
      className={cn(
        'inline-flex items-center font-body font-semibold rounded-full text-[11px] px-2 py-0.5',
        c.className
      )}
    >
      {c.label}
    </span>
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

function MethodeIcon({ methode }: { methode: MethodeRetrait }) {
  if (methode === 'MOBILE_MONEY') return <Smartphone className="w-3.5 h-3.5 text-earth-500" strokeWidth={1.75} />
  if (methode === 'VIREMENT') return <Banknote className="w-3.5 h-3.5 text-earth-500" strokeWidth={1.75} />
  if (methode === 'CRYPTO') return <Bitcoin className="w-3.5 h-3.5 text-earth-500" strokeWidth={1.75} />
  return <WalletIcon className="w-3.5 h-3.5 text-earth-500" strokeWidth={1.75} />
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

// Suppress unused
void Coins
