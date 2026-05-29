import {
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  Copy,
  CreditCard,
  Mail,
  Phone,
  RotateCcw,
  ShieldCheck,
  ShieldX,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAdminPaiementsByUser,
  useAdminPossessionsByUser,
  useAdminTransactionsByUser,
  useAdminUserById,
  useDeleteUser,
  useRestoreUser,
  useValiderUser,
} from '@/lib/api/admin'
import { extractApiError } from '@/lib/api/errors'
import type { PaiementResponse, TransactionResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export function AdminUserDetailPage() {
  const navigate = useNavigate()
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : NaN

  const { data: user, isLoading } = useAdminUserById(Number.isNaN(id) ? null : id)
  const { data: possessions } = useAdminPossessionsByUser(Number.isNaN(id) ? null : id)
  const { data: transactions } = useAdminTransactionsByUser(Number.isNaN(id) ? null : id)
  const { data: paiements } = useAdminPaiementsByUser(Number.isNaN(id) ? null : id)

  const valider = useValiderUser()
  const deleteUser = useDeleteUser()
  const restoreUser = useRestoreUser()

  const [confirmDelete, setConfirmDelete] = useState(false)

  if (Number.isNaN(id)) {
    navigate('/admin/utilisateurs', { replace: true })
    return null
  }

  if (isLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  // Aggregats
  const totalInvesti = (paiements ?? [])
    .filter((p) => p.statut === 'VALIDE')
    .reduce((acc, p) => acc + (p.montant ?? 0), 0)
  const totalParts = (possessions ?? []).reduce((acc, p) => acc + (p.nombreParts ?? 0), 0)
  const valeurTotale = (possessions ?? []).reduce((acc, p) => acc + (p.valeurTotale ?? 0), 0)

  const isDeleted = user.deletedAt !== null && user.deletedAt !== undefined

  function handleApproveKyc() {
    valider.mutate(id, {
      onSuccess: () => toast.success('KYC validé.'),
      onError: (e) => toast.error(extractApiError(e, 'Validation impossible.')),
    })
  }

  function handleDelete() {
    deleteUser.mutate(id, {
      onSuccess: () => {
        toast.success('Compte supprimé.')
        setConfirmDelete(false)
      },
      onError: (e) => toast.error(extractApiError(e, 'Suppression impossible.')),
    })
  }

  function handleRestore() {
    restoreUser.mutate(id, {
      onSuccess: () => toast.success('Compte restauré.'),
      onError: (e) => toast.error(extractApiError(e, 'Restauration impossible.')),
    })
  }

  function copyWallet() {
    if (!user?.walletAddress) return
    navigator.clipboard.writeText(user.walletAddress).then(() => toast.success('Wallet copié.'))
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/utilisateurs"
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour à la liste
      </Link>

      <Breadcrumbs
        items={[
          { label: 'Admin', to: '/admin' },
          { label: 'Utilisateurs', to: '/admin/utilisateurs' },
          { label: `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || user.email || `User #${user.id}` },
        ]}
        className="mt-1 mb-0"
      />

      {/* Header user */}
      <header className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-terra/15 flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-terra text-2xl">
              {(user.prenom?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="font-display font-bold text-earth text-2xl">
                {user.prenom} {user.nom}
              </h1>
              <RolePill role={user.role} />
              {user.isVerified ? <KycPill verified /> : <KycPill />}
              {isDeleted && <DeletedPill />}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-body text-earth-600 mt-2">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span className="font-mono text-xs">{user.email}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span className="font-mono text-xs">{user.telephone}</span>
              </span>
              <span className="font-mono text-xs text-earth-500">ID #{user.id}</span>
            </div>
            {user.walletAddress && (
              <button
                type="button"
                onClick={copyWallet}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-earth/8 text-xs font-mono text-earth hover:border-ocean transition-colors"
              >
                <Wallet className="w-3.5 h-3.5 text-earth-500" strokeWidth={1.75} />
                {user.walletAddress}
                <Copy className="w-3 h-3 text-earth-400" strokeWidth={1.75} />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            {!user.isVerified && !isDeleted && (
              <Button size="sm" onClick={handleApproveKyc} disabled={valider.isPending}>
                <ShieldCheck strokeWidth={2} className="w-4 h-4" />
                Valider KYC
              </Button>
            )}
            {isDeleted ? (
              <Button size="sm" variant="outline" onClick={handleRestore} disabled={restoreUser.isPending}>
                <RotateCcw strokeWidth={2} className="w-4 h-4" />
                Restaurer
              </Button>
            ) : user.role !== 'ADMIN' ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                className="text-error hover:bg-error/10 hover:text-error"
              >
                <Trash2 strokeWidth={2} className="w-4 h-4" />
                Supprimer
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={<CreditCard className="w-5 h-5" strokeWidth={1.75} />}
          label="Montant investi total"
          value={<Money amount={totalInvesti} mono={false} className="text-xl font-bold text-earth" />}
        />
        <KpiCard
          icon={<Building2 className="w-5 h-5" strokeWidth={1.75} />}
          label="Parts détenues"
          value={
            <span className="text-xl font-bold font-mono text-earth">
              {totalParts.toLocaleString('fr-FR')}
            </span>
          }
        />
        <KpiCard
          icon={<ArrowLeftRight className="w-5 h-5" strokeWidth={1.75} />}
          label="Valeur portefeuille"
          value={<Money amount={valeurTotale} mono={false} className="text-xl font-bold text-success" />}
        />
      </div>

      {/* Possessions */}
      <Section title="Possessions" count={possessions?.length ?? 0}>
        {!possessions || possessions.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucune possession"
            description="Cet utilisateur n'a encore acheté aucune part."
          />
        ) : (
          <DataTable
            data={possessions}
            rowKey={(p) => p.possessionId}
            columns={[
              { key: 'nom', label: 'Propriété', render: (p) => <span className="font-body font-semibold text-earth">{p.proprieteNom}</span> },
              { key: 'loc', label: 'Localisation', hideOnMobile: true, render: (p) => <span className="font-body text-earth-600 text-sm">{p.proprieteLocalisation}</span> },
              { key: 'parts', label: 'Parts', align: 'right', render: (p) => <span className="font-mono font-semibold tabular-nums">{p.nombreParts}</span> },
              { key: 'prix', label: 'Prix/part', align: 'right', hideOnMobile: true, render: (p) => <Money amount={p.prixUnitairePart} mono={false} className="font-mono" /> },
              { key: 'valeur', label: 'Valeur', align: 'right', render: (p) => <Money amount={p.valeurTotale} mono={false} className="font-mono font-semibold" /> },
            ]}
          />
        )}
      </Section>

      {/* Paiements */}
      <Section title="Paiements" count={paiements?.length ?? 0}>
        {!paiements || paiements.length === 0 ? (
          <EmptyState icon={CreditCard} title="Aucun paiement" />
        ) : (
          <DataTable
            data={paiements}
            rowKey={(p) => p.id}
            columns={paiementColumns}
            initialSort={{ key: 'date', direction: 'desc' }}
            pageSize={10}
          />
        )}
      </Section>

      {/* Transactions */}
      <Section title="Transactions blockchain" count={transactions?.length ?? 0}>
        {!transactions || transactions.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="Aucune transaction" />
        ) : (
          <DataTable
            data={transactions}
            rowKey={(t) => t.id}
            columns={transactionColumns}
            initialSort={{ key: 'date', direction: 'desc' }}
            pageSize={10}
          />
        )}
      </Section>

      {/* Modal suppression */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-error">
              <Trash2 className="w-5 h-5" strokeWidth={1.75} />
              Supprimer ce compte ?
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <span className="block">
                <strong>{user.prenom} {user.nom}</strong> · {user.email}
              </span>
              <span className="block text-sm pt-2">
                Soft delete réversible. Le compte sera désactivé mais ses données restent en base.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleteUser.isPending}>
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteUser.isPending}
              className="bg-error hover:bg-error/90 text-white"
            >
              {deleteUser.isPending ? 'Suppression...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// =============================================================================
// Colonnes table paiements
// =============================================================================

const paiementColumns: Column<PaiementResponse>[] = [
  {
    key: 'date',
    label: 'Date',
    sortAccessor: (p) => new Date(p.date),
    render: (p) => <span className="font-mono text-xs text-earth-600">{new Date(p.date).toLocaleString('fr-FR')}</span>,
    width: 'w-40',
  },
  {
    key: 'proprieteNom',
    label: 'Propriété',
    render: (p) => <span className="font-body font-semibold text-earth">{p.proprieteNom}</span>,
  },
  { key: 'type', label: 'Méthode', render: (p) => <span className="font-mono text-xs text-earth-600">{p.type}</span> },
  {
    key: 'nombreParts',
    label: 'Parts',
    align: 'right',
    render: (p) => <span className="font-mono font-semibold">{p.nombreParts}</span>,
  },
  {
    key: 'montant',
    label: 'Montant',
    align: 'right',
    render: (p) => <Money amount={p.montant} mono={false} className="font-mono font-semibold" />,
  },
  {
    key: 'statut',
    label: 'Statut',
    align: 'center',
    render: (p) => <StatutPill statut={p.statut} />,
  },
]

const transactionColumns: Column<TransactionResponse>[] = [
  {
    key: 'date',
    label: 'Date',
    sortAccessor: (t) => new Date(t.dateTransaction),
    render: (t) => <span className="font-mono text-xs text-earth-600">{new Date(t.dateTransaction).toLocaleString('fr-FR')}</span>,
    width: 'w-40',
  },
  {
    key: 'proprieteNom',
    label: 'Propriété',
    render: (t) => <span className="font-body font-semibold text-earth">{t.proprieteNom}</span>,
  },
  { key: 'typeOperation', label: 'Opération', render: (t) => <span className="font-mono text-xs">{t.typeOperation ?? '—'}</span> },
  {
    key: 'hashTransaction',
    label: 'Tx hash',
    hideOnMobile: true,
    render: (t) => {
      const isOnChain = t.hashTransaction?.match(/^0x[0-9a-fA-F]{64}$/)
      return isOnChain ? (
        <a
          href={`https://sepolia.etherscan.io/tx/${t.hashTransaction}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] text-ocean hover:underline"
        >
          {t.hashTransaction.slice(0, 10)}...{t.hashTransaction.slice(-6)}
        </a>
      ) : (
        <span className="font-mono text-[10px] text-earth-400" title={t.hashTransaction}>
          {(t.hashTransaction ?? '').slice(0, 10)}... <em className="not-italic">(mock)</em>
        </span>
      )
    },
  },
  {
    key: 'montant',
    label: 'Montant',
    align: 'right',
    render: (t) => <Money amount={t.montant} mono={false} className="font-mono font-semibold" />,
  },
  {
    key: 'statut',
    label: 'Statut',
    align: 'center',
    render: (t) => <StatutPill statut={t.statut} />,
  },
]

// =============================================================================
// Sous-composants
// =============================================================================

function Section({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-display font-bold text-earth text-lg">{title}</h2>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-earth/10 text-earth-600">{count}</span>
      </div>
      {children}
    </section>
  )
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-earth/8 p-5">
      <div className="flex items-center gap-2 text-earth-500 mb-2">
        {icon}
        <span className="font-body text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div>{value}</div>
    </div>
  )
}

function RolePill({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold',
        role === 'ADMIN' ? 'bg-terra/15 text-terra' : 'bg-ocean/15 text-ocean'
      )}
    >
      {role}
    </span>
  )
}

function KycPill({ verified }: { verified?: boolean } = {}) {
  return verified ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success">
      <ShieldCheck className="w-3 h-3" strokeWidth={2} /> KYC vérifié
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning/15 text-warning">
      <ShieldX className="w-3 h-3" strokeWidth={2} /> KYC en attente
    </span>
  )
}

function DeletedPill() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error/15 text-error">
      <Trash2 className="w-3 h-3" strokeWidth={2} /> Supprimé
    </span>
  )
}

function StatutPill({ statut }: { statut: string }) {
  const map: Record<string, string> = {
    VALIDE: 'bg-success/10 text-success',
    SUCCES: 'bg-success/10 text-success',
    EN_ATTENTE: 'bg-ocean/10 text-ocean',
    ECHEC: 'bg-error/10 text-error',
    REMBOURSEMENT: 'bg-warning/10 text-warning',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold', map[statut] ?? 'bg-earth/10 text-earth-600')}>
      {statut}
    </span>
  )
}
