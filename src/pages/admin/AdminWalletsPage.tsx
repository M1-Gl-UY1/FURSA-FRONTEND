import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Eye,
  MinusCircle,
  PlusCircle,
  Search,
  Settings2,
  TrendingUp,
  Users,
  Wallet as WalletIcon,
  X,
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
  useAdminWallets,
  useAdminWalletTransactions,
  useAjusterWallet,
  WALLET_TX_DISPLAY,
} from '@/lib/api/wallet'
import { extractApiError } from '@/lib/api/errors'
import type { WalletResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export function AdminWalletsPage() {
  const { data, isLoading } = useAdminWallets()
  const ajuster = useAjusterWallet()
  const [search, setSearch] = useState('')
  const [ajustementTarget, setAjustementTarget] = useState<WalletResponse | null>(null)
  const [detailTarget, setDetailTarget] = useState<WalletResponse | null>(null)

  const wallets = data ?? []
  const filtered = useMemo(() => {
    if (!search.trim()) return wallets
    const q = search.toLowerCase().trim()
    return wallets.filter((w) =>
      `${w.userEmail ?? ''} ${w.userNom ?? ''} ${w.userPrenom ?? ''}`.toLowerCase().includes(q)
    )
  }, [wallets, search])

  const totaux = useMemo(() => {
    const total = wallets.reduce((s, w) => s + w.solde, 0)
    const nbActifs = wallets.filter((w) => w.solde > 0).length
    const moyenne = wallets.length ? total / wallets.length : 0
    return { total, nbActifs, moyenne }
  }, [wallets])

  const columns: Column<WalletResponse>[] = [
    {
      key: 'id',
      label: 'ID',
      width: 'w-16',
      align: 'right',
      render: (w) => <span className="font-mono text-xs text-earth-500">#{w.id}</span>,
    },
    {
      key: 'user',
      label: 'Utilisateur',
      sortAccessor: (w) => `${w.userNom ?? ''} ${w.userPrenom ?? ''}`,
      render: (w) => (
        <div>
          <p className="font-body font-semibold text-earth">
            {w.userPrenom} {w.userNom}
          </p>
          <p className="font-body text-earth-500 text-xs">{w.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'solde',
      label: 'Solde',
      align: 'right',
      sortAccessor: (w) => w.solde,
      render: (w) => (
        <Money
          amount={w.solde}
          mono
          className={cn(
            'font-bold text-sm',
            w.solde > 0 ? 'text-success' : 'text-earth-400'
          )}
        />
      ),
    },
    {
      key: 'devise',
      label: 'Devise',
      align: 'center',
      hideOnMobile: true,
      render: (w) => (
        <span className="inline-flex items-center font-mono text-[10px] text-earth-500 bg-sand-200 px-2 py-0.5 rounded">
          {w.devise}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Créé le',
      hideOnMobile: true,
      sortAccessor: (w) => new Date(w.createdAt),
      render: (w) => (
        <span className="font-body text-xs text-earth-500">{formatDate(w.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      noSort: true,
      align: 'right',
      render: (w) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDetailTarget(w)}
            title="Voir l'historique"
            aria-label="Voir l'historique"
          >
            <Eye className="w-4 h-4" strokeWidth={1.75} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAjustementTarget(w)}
          >
            <Settings2 className="w-4 h-4 mr-1" strokeWidth={1.75} />
            Ajuster
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Wallets utilisateurs
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Vue d'ensemble des wallets de la plateforme. Les ajustements manuels sont tracés
          dans l'audit trail de chaque wallet (motif obligatoire).
        </p>
      </header>

      {/* KPIs admin */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-sand-300" />
          ))
        ) : (
          <>
            <StatCard
              label="Total des soldes wallets"
              value={<Money amount={totaux.total} mono={false} />}
              icon={WalletIcon}
              iconBg="bg-terra/10"
              iconColor="text-terra"
            />
            <StatCard
              label="Wallets avec solde > 0"
              value={`${totaux.nbActifs} / ${wallets.length}`}
              icon={Users}
              iconBg="bg-ocean/10"
              iconColor="text-ocean"
            />
            <StatCard
              label="Solde moyen"
              value={<Money amount={totaux.moyenne} mono={false} />}
              icon={TrendingUp}
              iconBg="bg-gold/15"
              iconColor="text-gold-600"
            />
          </>
        )}
      </section>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none"
          strokeWidth={1.75}
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par email, nom, prénom..."
          className="pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth"
            aria-label="Effacer la recherche"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          rowKey={(w) => w.id}
          initialSort={{ key: 'solde', direction: 'desc' }}
          pageSize={20}
          empty={
            <EmptyState
              icon={Coins}
              title="Aucun wallet"
              description={
                search
                  ? 'Aucun wallet ne correspond à cette recherche.'
                  : 'Aucun wallet enregistré pour le moment.'
              }
            />
          }
        />
      )}

      {/* Modal ajustement */}
      <AjustementModal
        target={ajustementTarget}
        onClose={() => setAjustementTarget(null)}
        isPending={ajuster.isPending}
        onSubmit={(montant, motif) => {
          if (!ajustementTarget?.userId) return
          ajuster.mutate(
            { userId: ajustementTarget.userId, payload: { montant, motif } },
            {
              onSuccess: () => {
                toast.success(
                  montant > 0
                    ? `Wallet crédité de ${montant.toFixed(2)} EUR.`
                    : `Wallet débité de ${Math.abs(montant).toFixed(2)} EUR.`
                )
                setAjustementTarget(null)
              },
              onError: (e) => toast.error(extractApiError(e, 'Ajustement impossible.')),
            }
          )
        }}
      />

      {/* Modal détail historique */}
      <DetailModal target={detailTarget} onClose={() => setDetailTarget(null)} />
    </div>
  )
}

// =============================================================================
// Modal Ajustement
// =============================================================================

function AjustementModal({
  target,
  onClose,
  onSubmit,
  isPending,
}: {
  target: WalletResponse | null
  onClose: () => void
  onSubmit: (montant: number, motif: string) => void
  isPending: boolean
}) {
  const [sens, setSens] = useState<'credit' | 'debit'>('credit')
  const [montant, setMontant] = useState('')
  const [motif, setMotif] = useState('')

  const montantNum = parseFloat(montant || '0')
  const montantSigne = sens === 'credit' ? montantNum : -montantNum
  const valid = montantNum > 0 && motif.trim().length >= 5
  const newSolde = target ? target.solde + montantSigne : 0
  const wouldGoNegative = sens === 'debit' && newSolde < 0

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-earth">
            <Settings2 className="w-5 h-5" strokeWidth={1.75} />
            Ajustement manuel wallet
          </DialogTitle>
          <DialogDescription className="pt-2">
            <span className="block">
              <strong>{target?.userPrenom} {target?.userNom}</strong>
              <br />
              <span className="font-mono text-xs">{target?.userEmail}</span>
            </span>
            <span className="block mt-3 font-body text-earth-700 text-sm">
              Solde actuel :{' '}
              <strong>
                <Money amount={target?.solde ?? 0} mono={false} />
              </strong>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Sens */}
          <div>
            <Label className="mb-2 block">Type d'ajustement</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSens('credit')}
                className={cn(
                  'flex items-center justify-center gap-2 h-11 rounded-md border-[1.5px] font-body text-sm font-semibold transition-colors',
                  sens === 'credit'
                    ? 'border-success bg-success/10 text-success'
                    : 'border-sand-400 text-earth-600 hover:border-success/40'
                )}
              >
                <PlusCircle className="w-4 h-4" strokeWidth={1.75} /> Créditer
              </button>
              <button
                type="button"
                onClick={() => setSens('debit')}
                className={cn(
                  'flex items-center justify-center gap-2 h-11 rounded-md border-[1.5px] font-body text-sm font-semibold transition-colors',
                  sens === 'debit'
                    ? 'border-warning bg-warning/10 text-warning'
                    : 'border-sand-400 text-earth-600 hover:border-warning/40'
                )}
              >
                <MinusCircle className="w-4 h-4" strokeWidth={1.75} /> Débiter
              </button>
            </div>
          </div>

          {/* Montant */}
          <div>
            <Label htmlFor="montant-ajust">Montant (EUR)</Label>
            <Input
              id="montant-ajust"
              type="number"
              min="0.01"
              step="0.01"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="Ex: 50.00"
              className="font-mono"
              disabled={isPending}
            />
            {montant && montantNum > 0 && (
              <p className="font-body text-xs text-earth-500 mt-1">
                Nouveau solde après ajustement :{' '}
                <strong className={wouldGoNegative ? 'text-error' : 'text-earth'}>
                  <Money amount={newSolde} mono={false} />
                </strong>
                {wouldGoNegative && (
                  <span className="text-error ml-2">⚠ Solde négatif interdit</span>
                )}
              </p>
            )}
          </div>

          {/* Motif */}
          <div>
            <Label htmlFor="motif-ajust">
              Motif <span className="text-error">*</span>
              <span className="font-body text-earth-500 text-xs font-normal ml-1">
                (min 5 caractères, audit trail)
              </span>
            </Label>
            <textarea
              id="motif-ajust"
              rows={3}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: Geste commercial suite à incident #123, ou Correction erreur de saisie..."
              disabled={isPending}
              className={cn(
                'w-full rounded-md border-[1.5px] border-sand-400 bg-white px-3 py-2 text-sm font-body text-earth',
                'focus:outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15 resize-y'
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            disabled={!valid || wouldGoNegative || isPending}
            onClick={() => onSubmit(montantSigne, motif.trim())}
            className={
              sens === 'credit'
                ? 'bg-success hover:bg-success/90 text-white'
                : 'bg-warning hover:bg-warning/90 text-white'
            }
          >
            {isPending
              ? 'Enregistrement...'
              : sens === 'credit'
                ? `Créditer ${montantNum > 0 ? montantNum.toFixed(2) : ''} EUR`
                : `Débiter ${montantNum > 0 ? montantNum.toFixed(2) : ''} EUR`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Modal Détail historique
// =============================================================================

function DetailModal({
  target,
  onClose,
}: {
  target: WalletResponse | null
  onClose: () => void
}) {
  const { data: transactions, isLoading } = useAdminWalletTransactions(target?.userId ?? null)

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-earth">
            <Eye className="w-5 h-5" strokeWidth={1.75} />
            Historique wallet
          </DialogTitle>
          <DialogDescription>
            <strong>{target?.userPrenom} {target?.userNom}</strong>
            <br />
            <span className="font-mono text-xs">{target?.userEmail}</span>
            <br />
            <span className="font-body text-earth-700 text-sm">
              Solde actuel :{' '}
              <strong>
                <Money amount={target?.solde ?? 0} mono={false} />
              </strong>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-md bg-sand-300" />
            ))
          ) : !transactions || transactions.length === 0 ? (
            <EmptyState
              icon={Coins}
              title="Aucun mouvement"
              description="Ce wallet n'a aucun mouvement enregistré."
            />
          ) : (
            transactions.map((t) => {
              const d = WALLET_TX_DISPLAY[t.type]
              const Icon = t.montant > 0 ? ArrowDownLeft : ArrowUpRight
              return (
                <div
                  key={t.id}
                  className="flex items-start gap-3 p-3 bg-sand-50 rounded-md border border-earth/5"
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                      t.montant > 0 ? 'bg-success/10' : 'bg-warning/15'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4',
                        t.montant > 0 ? 'text-success' : 'text-warning'
                      )}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-body font-semibold text-earth text-sm">
                        {d.label}
                      </p>
                      <span
                        className={cn(
                          'font-mono font-bold text-sm',
                          t.montant > 0 ? 'text-success' : 'text-warning'
                        )}
                      >
                        {t.montant > 0 ? '+' : ''}
                        <Money amount={t.montant} mono />
                      </span>
                    </div>
                    {t.libelle && (
                      <p className="font-body text-earth-600 text-xs mt-0.5">
                        {t.libelle}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-body text-earth-400 text-[10px]">
                        {formatDate(t.createdAt)} · #{t.id}
                      </span>
                      <span className="font-mono text-[10px] text-earth-500">
                        solde après :{' '}
                        <Money amount={t.soldeApres} mono />
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
