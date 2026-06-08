import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Eye,
  Search,
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
  WALLET_TX_DISPLAY,
} from '@/lib/api/wallet'
import type { WalletResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export function AdminWalletsPage() {
  const { data, isLoading } = useAdminWallets()
  const [search, setSearch] = useState('')
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
          {/* V2 BB (08/06/2026) : bouton "Ajuster" retire — l'admin n'a pas
              le droit de crediter/debiter manuellement un wallet. Source de
              verite : recharges via PSP et workflow metier (achat/vente/dividende). */}
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
            <Skeleton key={i} className="h-32 rounded-xl " />
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
        <Skeleton className="h-64 rounded-xl" />
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

      {/* V2 BB (08/06/2026) : Modal Ajustement retiree (admin n'a plus le droit). */}

      {/* Modal détail historique */}
      <DetailModal target={detailTarget} onClose={() => setDetailTarget(null)} />
    </div>
  )
}

// =============================================================================
// Modal Ajustement
// =============================================================================

// V2 BB (08/06/2026) : AjustementModal entierement retire — l'admin n'a plus
// le droit d'ajuster manuellement un wallet (decision PO). Tous les mouvements
// de wallet passent desormais uniquement par les flows metier (achat de parts,
// distribution dividende, recharge PSP, retrait valide).

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
              <Skeleton key={i} className="h-16 rounded-md " />
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
