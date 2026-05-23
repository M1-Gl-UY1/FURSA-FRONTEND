import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  Eye,
  Search,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
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
  useAdminEscrows,
  useAnnulerCollecte,
  useEscrowTransactions,
} from '@/lib/api/escrow'
import { extractApiError } from '@/lib/api/errors'
import type { EscrowProprieteResponse, StatutEscrow } from '@/lib/api/types'
import { cn } from '@/lib/utils'

/**
 * Phase 10c bis : page admin pour la gestion des escrows de propriete (crowdfunding).
 *
 * Permet :
 * - Voir l'avancement de la collecte par propriete (% atteint sur le seuil 100%)
 * - Annuler manuellement une collecte EN_COLLECTE (refund integral des investisseurs)
 * - Consulter l'historique complet des mouvements d'un escrow
 */
export function AdminEscrowsPage() {
  const { data, isLoading } = useAdminEscrows()
  const annuler = useAnnulerCollecte()
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<StatutEscrow | 'ALL'>('ALL')
  const [annulationTarget, setAnnulationTarget] = useState<EscrowProprieteResponse | null>(null)
  const [historiqueTarget, setHistoriqueTarget] = useState<EscrowProprieteResponse | null>(null)

  const escrows = data ?? []

  const filtered = useMemo(() => {
    let result = escrows
    if (filterStatut !== 'ALL') {
      result = result.filter((e) => e.statut === filterStatut)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter((e) => (e.proprieteNom ?? '').toLowerCase().includes(q))
    }
    return result
  }, [escrows, filterStatut, search])

  const stats = useMemo(() => {
    const enCollecte = escrows.filter((e) => e.statut === 'EN_COLLECTE')
    const financees = escrows.filter((e) => e.statut === 'FINANCEE')
    const annulees = escrows.filter((e) => e.statut === 'ANNULEE')
    const totalCollecte = escrows.reduce((s, e) => s + (e.totalCollecte ?? 0), 0)
    return {
      total: escrows.length,
      enCollecte: enCollecte.length,
      financees: financees.length,
      annulees: annulees.length,
      totalCollecte,
    }
  }, [escrows])

  const columns: Column<EscrowProprieteResponse>[] = [
    {
      key: 'id',
      label: 'ID',
      width: 'w-16',
      align: 'right',
      render: (e) => <span className="font-mono text-xs text-earth-500">#{e.id}</span>,
    },
    {
      key: 'propriete',
      label: 'Propriété',
      sortAccessor: (e) => e.proprieteNom ?? '',
      render: (e) => (
        <Link
          to={`/admin/proprietes/${e.proprieteId}`}
          className="font-body font-semibold text-earth hover:text-terra transition-colors"
        >
          {e.proprieteNom ?? '—'}
        </Link>
      ),
    },
    {
      key: 'progression',
      label: 'Collecte',
      sortAccessor: (e) => e.pourcentageCollecte ?? 0,
      render: (e) => (
        <div className="space-y-1 min-w-[180px]">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-mono text-earth font-semibold">
              <Money amount={e.totalCollecte} mono={false} />
            </span>
            <span className="font-mono text-earth-500">
              / <Money amount={e.montantCible} mono={false} />
            </span>
          </div>
          <ProgressBar value={(e.pourcentageCollecte / e.seuilPct) * 100} size="sm" showLabel={false} />
          <p className="font-mono text-[10px] text-earth-500">
            {e.pourcentageCollecte.toFixed(1)}% atteint · seuil {e.seuilPct}%
          </p>
        </div>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      sortAccessor: (e) => e.statut,
      render: (e) => <StatutBadge statut={e.statut} />,
    },
    {
      key: 'createdAt',
      label: 'Créé le',
      hideOnMobile: true,
      sortAccessor: (e) => new Date(e.createdAt),
      render: (e) => (
        <span className="font-body text-xs text-earth-600">{formatDate(e.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      noSort: true,
      align: 'right',
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setHistoriqueTarget(e)}
            title="Voir l'historique"
            aria-label="Voir l'historique"
          >
            <Eye className="w-4 h-4" strokeWidth={1.75} />
          </Button>
          {e.statut === 'EN_COLLECTE' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-error hover:bg-error/10 hover:text-error"
              onClick={() => setAnnulationTarget(e)}
              title="Annuler la collecte"
              aria-label="Annuler la collecte"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
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
          Escrows de propriété
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Suivi des collectes crowdfunding par propriété. Une collecte passe automatiquement
          à <strong>FINANCEE</strong> dès que <strong>100%</strong> des parts sont vendues
          (les parts deviennent actives, dividendes en cours).
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
              label="Propriétés en collecte"
              value={stats.enCollecte}
              icon={Banknote}
              iconBg="bg-warning/15"
              iconColor="text-warning"
            />
            <StatCard
              label="Financées"
              value={stats.financees}
              icon={CheckCircle2}
              iconBg="bg-success/10"
              iconColor="text-success"
            />
            <StatCard
              label="Annulées"
              value={stats.annulees}
              icon={AlertTriangle}
              iconBg="bg-error/10"
              iconColor="text-error"
            />
            <StatCard
              label="Total collecté"
              value={<Money amount={stats.totalCollecte} mono={false} />}
              icon={Wallet}
              iconBg="bg-terra/10"
              iconColor="text-terra"
            />
          </>
        )}
      </section>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
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
              aria-label="Effacer"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'EN_COLLECTE', 'FINANCEE', 'ANNULEE'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatut(s)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-body font-semibold transition-colors',
                filterStatut === s
                  ? 'bg-earth text-white'
                  : 'bg-sand-200 text-earth-600 hover:bg-sand-300'
              )}
            >
              {s === 'ALL' ? 'Toutes' : s === 'EN_COLLECTE' ? 'En collecte' : s === 'FINANCEE' ? 'Financées' : 'Annulées'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          rowKey={(e) => e.id}
          initialSort={{ key: 'progression', direction: 'desc' }}
          pageSize={20}
          empty={
            <EmptyState
              icon={Building2}
              title="Aucun escrow"
              description="Les escrows apparaissent automatiquement à la publication d'une propriété."
            />
          }
        />
      )}

      {/* Modal annulation */}
      <AnnulationModal
        target={annulationTarget}
        onClose={() => setAnnulationTarget(null)}
        isPending={annuler.isPending}
        onConfirm={(motif) => {
          if (!annulationTarget?.proprieteId) return
          annuler.mutate(
            { proprieteId: annulationTarget.proprieteId, motif },
            {
              onSuccess: () => {
                toast.success(`Collecte annulée. Tous les investisseurs ont été remboursés.`)
                setAnnulationTarget(null)
              },
              onError: (e) => toast.error(extractApiError(e, 'Annulation impossible.')),
            }
          )
        }}
      />

      {/* Modal historique */}
      <HistoriqueModal target={historiqueTarget} onClose={() => setHistoriqueTarget(null)} />
    </div>
  )
}

// =============================================================================
// Modal Annulation
// =============================================================================

function AnnulationModal({
  target,
  onClose,
  onConfirm,
  isPending,
}: {
  target: EscrowProprieteResponse | null
  onClose: () => void
  onConfirm: (motif: string) => void
  isPending: boolean
}) {
  const [motif, setMotif] = useState('')
  const valid = motif.trim().length >= 10

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-error">
            <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
            Annuler la collecte
          </DialogTitle>
          <DialogDescription className="pt-2 space-y-2">
            <span className="block">
              Propriété : <strong className="text-earth">{target?.proprieteNom}</strong>
            </span>
            <span className="block text-earth-700 text-sm pt-2">
              <strong>Action irréversible.</strong> Tous les investisseurs ayant acheté
              des parts seront <strong>intégralement remboursés sur leur wallet</strong>.
              Les Possessions seront marquées ANNULEE. L'escrow sera fermé.
            </span>
            {target && target.totalCollecte > 0 && (
              <span className="block bg-warning/10 border border-warning/30 rounded-md p-3 text-xs">
                ⚠ <Money amount={target.totalCollecte} mono={false} className="font-bold" /> seront
                remboursés à <strong>{Math.ceil(target.totalCollecte / 100)} investisseur(s)</strong> approximativement.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="motif">
            Motif <span className="text-error">*</span>{' '}
            <span className="font-body text-earth-500 text-xs font-normal">
              (min 10 caractères, audit)
            </span>
          </Label>
          <textarea
            id="motif"
            rows={4}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex : Propriété retirée par le propriétaire, problème juridique, collecte stagnante..."
            disabled={isPending}
            className="w-full rounded-md border-[1.5px] border-sand-400 bg-white px-3 py-2 text-sm font-body text-earth focus:outline-none focus:border-error focus:ring-2 focus:ring-error/15 resize-y"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            onClick={() => onConfirm(motif.trim())}
            disabled={!valid || isPending}
            className="bg-error hover:bg-error/90 text-white"
          >
            {isPending ? 'Annulation...' : 'Confirmer l\'annulation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Modal Historique
// =============================================================================

function HistoriqueModal({
  target,
  onClose,
}: {
  target: EscrowProprieteResponse | null
  onClose: () => void
}) {
  const { data: transactions, isLoading } = useEscrowTransactions(target?.proprieteId)

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-earth">
            <Eye className="w-5 h-5" strokeWidth={1.75} />
            Historique escrow
          </DialogTitle>
          <DialogDescription>
            <strong>{target?.proprieteNom}</strong>
            <br />
            <span className="font-body text-earth-700 text-sm">
              Solde actuel :{' '}
              <strong>
                <Money amount={target?.solde ?? 0} mono={false} />
              </strong>{' '}
              · Total collecté :{' '}
              <strong>
                <Money amount={target?.totalCollecte ?? 0} mono={false} />
              </strong>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-md bg-sand-300" />
            ))
          ) : !transactions || transactions.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aucun mouvement"
              description="Aucune transaction enregistrée sur cet escrow."
            />
          ) : (
            transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-start justify-between gap-3 p-3 bg-sand-50 rounded-md border border-earth/5"
              >
                <div className="min-w-0">
                  <p className="font-body font-semibold text-earth text-sm">
                    {labelType(t.type)}
                  </p>
                  {t.libelle && (
                    <p className="font-body text-earth-600 text-xs mt-0.5">{t.libelle}</p>
                  )}
                  <p className="font-body text-earth-400 text-[10px] mt-1">
                    {formatDate(t.createdAt)}
                    {t.investisseurId && ` · inv #${t.investisseurId}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={cn(
                      'font-mono font-bold text-sm',
                      t.montant > 0 ? 'text-success' : 'text-warning'
                    )}
                  >
                    {t.montant > 0 ? '+' : ''}
                    <Money amount={t.montant} mono />
                  </span>
                  <p className="font-mono text-[10px] text-earth-500">
                    solde : <Money amount={t.soldeApres} mono />
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function StatutBadge({ statut }: { statut: StatutEscrow }) {
  const config: Record<StatutEscrow, { label: string; className: string }> = {
    EN_COLLECTE: { label: 'En collecte', className: 'bg-warning/15 text-warning' },
    FINANCEE: { label: 'Financée', className: 'bg-success/15 text-success' },
    ANNULEE: { label: 'Annulée', className: 'bg-error/15 text-error' },
  }
  const c = config[statut]
  return (
    <span
      className={cn(
        'inline-flex items-center font-body font-semibold rounded-full text-xs px-2.5 py-1',
        c.className
      )}
    >
      {c.label}
    </span>
  )
}

function labelType(type: string): string {
  switch (type) {
    case 'CREDIT_ACHAT': return 'Achat investisseur'
    case 'DEBIT_RETRAIT_PROPRIO': return 'Retrait propriétaire'
    case 'DEBIT_COMMISSION_FURSA': return 'Commission FURSA'
    case 'DEBIT_REFUND_INVESTISSEUR': return 'Remboursement investisseur'
    case 'AJUSTEMENT_ADMIN': return 'Ajustement admin'
    default: return type
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
