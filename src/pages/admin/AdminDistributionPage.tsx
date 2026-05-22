import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Coins,
  Eye,
  Loader2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

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
  useAdminRevenus,
  useDistribuerRevenu,
  useDistributionPreview,
} from '@/lib/api/admin'
import { extractApiError } from '@/lib/api/errors'
import type {
  DistributionPreviewItem,
  RevenuResponse,
  StatutRevenu,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'

type Tab = 'a-distribuer' | 'distribues'

export function AdminDistributionPage() {
  const { data: revenus, isLoading } = useAdminRevenus()
  const [tab, setTab] = useState<Tab>('a-distribuer')
  const [previewRevenuId, setPreviewRevenuId] = useState<number | null>(null)

  // VALIDE = approuve mais pas encore distribue. DISTRIBUE = deja distribue.
  const aDistribuer = (revenus ?? []).filter((r) => r.statut === 'VALIDE')
  const distribues = (revenus ?? []).filter((r) => r.statut === 'DISTRIBUE')

  const totalADistribuer = aDistribuer.reduce((acc, r) => acc + (r.montantTotal ?? 0), 0)
  const totalDistribues = distribues.reduce((acc, r) => acc + (r.montantTotal ?? 0), 0)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Distribution des dividendes
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Versez les dividendes aux investisseurs au prorata de leurs parts. Visualisez la
          répartition avant de déclencher la distribution.
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={<AlertTriangle className="w-5 h-5 text-warning" strokeWidth={1.75} />}
          label="À distribuer"
          value={
            <>
              <span className="text-2xl font-bold text-warning font-mono">{aDistribuer.length}</span>
              <span className="text-sm text-earth-500 font-body ml-2">revenu{aDistribuer.length > 1 ? 's' : ''}</span>
            </>
          }
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-ocean" strokeWidth={1.75} />}
          label="Montant en attente"
          value={<Money amount={totalADistribuer} mono={false} className="text-2xl font-bold text-earth" />}
        />
        <KpiCard
          icon={<Coins className="w-5 h-5 text-success" strokeWidth={1.75} />}
          label="Total distribué (historique)"
          value={<Money amount={totalDistribues} mono={false} className="text-2xl font-bold text-success" />}
        />
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-sand-200 rounded-md p-1 gap-1">
        <TabBtn active={tab === 'a-distribuer'} onClick={() => setTab('a-distribuer')}>
          À distribuer
          <CountBadge n={aDistribuer.length} tone={aDistribuer.length > 0 ? 'warning' : 'neutral'} />
        </TabBtn>
        <TabBtn active={tab === 'distribues'} onClick={() => setTab('distribues')}>
          Historique
          <CountBadge n={distribues.length} tone="neutral" />
        </TabBtn>
      </div>

      {/* Liste */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      ) : tab === 'a-distribuer' ? (
        aDistribuer.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Rien à distribuer"
            description="Tous les revenus validés ont déjà été distribués. Les nouveaux revenus déclarés apparaîtront ici une fois approuvés."
          />
        ) : (
          <DataTable
            data={aDistribuer}
            columns={getColumnsADistribuer(setPreviewRevenuId)}
            rowKey={(r) => r.id}
            initialSort={{ key: 'date', direction: 'desc' }}
          />
        )
      ) : distribues.length === 0 ? (
        <EmptyState icon={Coins} title="Aucune distribution effectuée" />
      ) : (
        <DataTable
          data={distribues}
          columns={getColumnsDistribues()}
          rowKey={(r) => r.id}
          initialSort={{ key: 'date', direction: 'desc' }}
        />
      )}

      {/* Modal preview + confirmation */}
      <PreviewModal
        revenuId={previewRevenuId}
        onClose={() => setPreviewRevenuId(null)}
      />
    </div>
  )
}

// =============================================================================
// Modal Preview + Confirmation
// =============================================================================

function PreviewModal({ revenuId, onClose }: { revenuId: number | null; onClose: () => void }) {
  const { data: preview, isLoading } = useDistributionPreview(revenuId)
  const distribuer = useDistribuerRevenu()

  function handleDistribuer() {
    if (revenuId === null) return
    distribuer.mutate(revenuId, {
      onSuccess: () => {
        toast.success(`Distribution effectuée. ${preview?.totalInvestisseurs ?? 0} dividende(s) créé(s).`)
        onClose()
      },
      onError: (e) => toast.error(extractApiError(e, 'Distribution impossible.')),
    })
  }

  return (
    <Dialog open={revenuId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-ocean" strokeWidth={1.75} />
            Aperçu de la distribution
          </DialogTitle>
          <DialogDescription>
            Voici exactement ce qui sera versé à chaque investisseur. <strong>Aucune action effectuée pour le moment.</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading || !preview ? (
          <Skeleton className="h-48 bg-sand-300" />
        ) : (
          <>
            {/* Recap */}
            <div className="bg-sand-100 rounded-lg p-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-earth-500 mb-0.5">Bénéficiaires</p>
                <p className="font-bold text-earth text-lg font-mono">{preview.totalInvestisseurs}</p>
              </div>
              <div>
                <p className="text-xs text-earth-500 mb-0.5">Montant total</p>
                <Money amount={preview.totalAttendu} mono={false} className="font-bold text-earth text-lg" />
              </div>
              <div>
                <p className="text-xs text-earth-500 mb-0.5">Stratégie</p>
                <p className="font-semibold text-earth text-sm">Prorata des parts</p>
              </div>
            </div>

            {/* Tableau bénéficiaires */}
            {preview.items.length === 0 ? (
              <div className="py-6 text-center text-earth-500 font-body text-sm">
                Aucune possession sur cette propriété → personne à payer.
              </div>
            ) : (
              <div className="border border-earth/8 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-sand-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-body font-semibold text-earth">Investisseur</th>
                      <th className="text-right px-3 py-2 font-body font-semibold text-earth">Parts</th>
                      <th className="text-right px-3 py-2 font-body font-semibold text-earth">%</th>
                      <th className="text-right px-3 py-2 font-body font-semibold text-earth">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.items.map((it) => (
                      <BeneficiaireRow key={it.investisseurId ?? Math.random()} item={it} />
                    ))}
                  </tbody>
                  <tfoot className="bg-sand-50 border-t-2 border-earth/15">
                    <tr>
                      <td className="px-3 py-2 font-body font-bold text-earth">Total</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-earth">
                        {preview.items.reduce((acc, it) => acc + it.nombreParts, 0)} /{' '}
                        {preview.items[0]?.totalPartsPropriete ?? 0}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-earth">
                        {preview.items.reduce((acc, it) => acc + it.pourcentage, 0).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Money amount={preview.totalAttendu} mono={false} className="font-mono font-bold text-earth" />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={distribuer.isPending}>
            Annuler
          </Button>
          <Button
            onClick={handleDistribuer}
            disabled={distribuer.isPending || !preview || preview.items.length === 0}
            className="bg-success hover:bg-success/90 text-white"
          >
            {distribuer.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                Distribution...
              </>
            ) : (
              <>
                Distribuer maintenant
                <ArrowRight strokeWidth={2} />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BeneficiaireRow({ item }: { item: DistributionPreviewItem }) {
  return (
    <tr className="border-t border-earth/8">
      <td className="px-3 py-2">
        <p className="font-body font-semibold text-earth">{item.prenom} {item.nom}</p>
        <p className="font-mono text-xs text-earth-500">{item.email}</p>
      </td>
      <td className="px-3 py-2 text-right font-mono">{item.nombreParts}</td>
      <td className="px-3 py-2 text-right font-mono">{item.pourcentage.toFixed(2)}%</td>
      <td className="px-3 py-2 text-right">
        <Money amount={item.montantAttendu} mono={false} className="font-mono font-semibold" />
      </td>
    </tr>
  )
}

// =============================================================================
// Colonnes table
// =============================================================================

function getColumnsADistribuer(
  onPreview: (id: number) => void
): Column<RevenuResponse>[] {
  return [
    {
      key: 'date',
      label: 'Période',
      sortAccessor: (r) => (r.date ? new Date(r.date) : 0),
      render: (r) => (
        <div className="text-sm">
          {r.periodeDebut && r.periodeFin ? (
            <>
              <p className="font-body font-semibold text-earth">
                {new Date(r.periodeDebut).toLocaleDateString('fr-FR')} →{' '}
                {new Date(r.periodeFin).toLocaleDateString('fr-FR')}
              </p>
              {r.date && (
                <p className="font-mono text-xs text-earth-500">Décl. {new Date(r.date).toLocaleDateString('fr-FR')}</p>
              )}
            </>
          ) : (
            <p className="font-mono">{r.date ?? '—'}</p>
          )}
        </div>
      ),
    },
    {
      key: 'propriete',
      label: 'Propriété',
      render: (r) => (
        <span className="font-body font-semibold text-earth inline-flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-terra" strokeWidth={1.75} />
          {r.proprieteNom ?? '—'}
        </span>
      ),
    },
    {
      key: 'montant',
      label: 'Montant total',
      align: 'right',
      render: (r) => <Money amount={r.montantTotal} mono={false} className="font-mono font-bold text-earth" />,
    },
    {
      key: 'actions',
      label: '',
      noSort: true,
      align: 'right',
      render: (r) => (
        <Button size="sm" onClick={() => onPreview(r.id)}>
          <Eye className="w-3.5 h-3.5" strokeWidth={2} />
          Prévisualiser
        </Button>
      ),
    },
  ]
}

function getColumnsDistribues(): Column<RevenuResponse>[] {
  return [
    {
      key: 'date',
      label: 'Période',
      sortAccessor: (r) => (r.date ? new Date(r.date) : 0),
      render: (r) =>
        r.periodeDebut && r.periodeFin ? (
          <span className="font-body text-sm">
            {new Date(r.periodeDebut).toLocaleDateString('fr-FR')} → {new Date(r.periodeFin).toLocaleDateString('fr-FR')}
          </span>
        ) : (
          <span className="font-mono text-sm">{r.date ?? '—'}</span>
        ),
    },
    {
      key: 'propriete',
      label: 'Propriété',
      render: (r) => <span className="font-body font-semibold text-earth">{r.proprieteNom ?? '—'}</span>,
    },
    {
      key: 'montant',
      label: 'Montant',
      align: 'right',
      render: (r) => <Money amount={r.montantTotal} mono={false} className="font-mono font-semibold" />,
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      render: () => <StatutBadge statut="DISTRIBUE" />,
    },
  ]
}

// =============================================================================
// Sous-composants
// =============================================================================

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
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

function TabBtn({
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
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-body transition-colors',
        active ? 'bg-white text-earth shadow-sm font-semibold' : 'text-earth-600 hover:text-earth'
      )}
    >
      {children}
    </button>
  )
}

function CountBadge({ n, tone }: { n: number; tone: 'warning' | 'neutral' }) {
  return (
    <span
      className={cn(
        'text-xs font-mono px-1.5 py-0.5 rounded',
        tone === 'warning' ? 'bg-warning/15 text-warning' : 'bg-earth/10 text-earth-600'
      )}
    >
      {n}
    </span>
  )
}

function StatutBadge({ statut }: { statut: StatutRevenu }) {
  const config: Record<string, string> = {
    DISTRIBUE: 'bg-success/10 text-success',
    VALIDE: 'bg-warning/10 text-warning',
    EN_REVIEW: 'bg-ocean/10 text-ocean',
    REFUSE: 'bg-error/10 text-error',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold',
        config[statut] ?? 'bg-earth/10 text-earth-600'
      )}
    >
      {statut === 'DISTRIBUE' && <CheckCircle2 className="w-3 h-3" strokeWidth={2} />}
      {statut === 'VALIDE' && <Users className="w-3 h-3" strokeWidth={2} />}
      {statut}
    </span>
  )
}
