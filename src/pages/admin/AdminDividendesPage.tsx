import { CheckCircle2, Coins, ExternalLink, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminDividendes, useMarquerDividendePaye } from '@/lib/api/admin'
import { extractApiError } from '@/lib/api/errors'
import type { DividendeResponse } from '@/lib/api/types'
import { cn, resolveFileUrl } from '@/lib/utils'

const METHODES = ['MOBILE_MONEY', 'VIREMENT', 'CRYPTO', 'AUTRE'] as const
type Methode = (typeof METHODES)[number]

export function AdminDividendesPage() {
  const { data, isLoading } = useAdminDividendes()
  const marquerPaye = useMarquerDividendePaye()

  const [toPay, setToPay] = useState<DividendeResponse | null>(null)
  const [methode, setMethode] = useState<Methode>('MOBILE_MONEY')
  const [preuve, setPreuve] = useState('')

  const dividendes = data ?? []

  const totaux = useMemo(() => {
    let aPayer = 0
    let nbAPayer = 0
    let dejaPaye = 0
    let nbDejaPaye = 0
    for (const d of dividendes) {
      if (d.statut === 'PAYE') {
        dejaPaye += d.montant
        nbDejaPaye += 1
      } else if (d.statut === 'VALIDE') {
        aPayer += d.montant
        nbAPayer += 1
      }
    }
    return { aPayer, nbAPayer, dejaPaye, nbDejaPaye, total: aPayer + dejaPaye }
  }, [dividendes])

  function openPayoutModal(d: DividendeResponse) {
    setToPay(d)
    setMethode('MOBILE_MONEY')
    setPreuve('')
  }

  function confirmPayout() {
    if (!toPay) return
    if (!preuve.trim()) {
      toast.error('La référence/preuve de paiement est requise.')
      return
    }
    marquerPaye.mutate(
      { id: toPay.id, methodePaiement: methode, preuvePaiement: preuve.trim() },
      {
        onSuccess: () => {
          toast.success(`Dividende #${toPay.id} marqué comme PAYÉ.`)
          setToPay(null)
        },
        onError: (e) => toast.error(extractApiError(e, 'Impossible de marquer comme payé.')),
      }
    )
  }

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
      render: (d) => <span className="font-body font-semibold text-earth">{d.proprieteNom}</span>,
    },
    {
      key: 'investisseurId',
      label: 'Investisseur',
      hideOnMobile: true,
      render: (d) => <span className="font-mono text-xs text-ocean">#{d.investisseurId}</span>,
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
      align: 'center',
      render: (d) => <StatusBadge status={d.statut} />,
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
          <span className="font-body text-xs text-earth-400 italic">—</span>
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
    {
      key: 'actions',
      label: 'Actions',
      noSort: true,
      align: 'right',
      render: (d) =>
        d.statut === 'VALIDE' ? (
          <Button size="sm" variant="outline" onClick={() => openPayoutModal(d)}>
            <CheckCircle2 className="w-4 h-4 mr-1" strokeWidth={1.75} /> Marquer payé
          </Button>
        ) : (
          <span className="text-earth-300 text-xs">—</span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Dividendes distribués
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Calculs des parts (VALIDE) puis confirmation du versement réel (PAYÉ).
          Marquez chaque dividende payé après votre Mobile Money / virement / crypto.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl " />
          ))
        ) : (
          <>
            <StatCard
              label="À verser aux investisseurs"
              value={<Money amount={totaux.aPayer} mono={false} />}
              icon={Wallet}
              iconBg="bg-warning/15"
              iconColor="text-warning"
              trendLabel={`${totaux.nbAPayer} dividende${totaux.nbAPayer > 1 ? 's' : ''} en attente`}
              trend={totaux.nbAPayer ? 0 : null}
            />
            <StatCard
              label="Déjà versé"
              value={<Money amount={totaux.dejaPaye} mono={false} />}
              icon={CheckCircle2}
              iconBg="bg-success/10"
              iconColor="text-success"
              trendLabel={`${totaux.nbDejaPaye} versement${totaux.nbDejaPaye > 1 ? 's' : ''}`}
              trend={totaux.nbDejaPaye ? 0 : null}
            />
            <StatCard
              label="Total calculé"
              value={<Money amount={totaux.total} mono={false} />}
              icon={Coins}
              iconBg="bg-gold/15"
              iconColor="text-gold-600"
              trendLabel={`${dividendes.length} dividende${dividendes.length > 1 ? 's' : ''}`}
              trend={dividendes.length ? 0 : null}
            />
          </>
        )}
      </section>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <DataTable
          data={dividendes}
          columns={columns}
          rowKey={(d) => d.id}
          initialSort={{ key: 'dateDistribution', direction: 'desc' }}
          pageSize={20}
          empty={
            <EmptyState
              icon={Coins}
              title="Aucun dividende distribué"
              description="Les dividendes apparaîtront ici après distribution."
            />
          }
        />
      )}

      {/* Modal marquer payé */}
      <Dialog open={toPay !== null} onOpenChange={(open) => !open && setToPay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
              Confirmer le versement
            </DialogTitle>
            <DialogDescription className="pt-2">
              Vous confirmez avoir versé{' '}
              <strong className="text-earth">
                <Money amount={toPay?.montant ?? 0} mono={false} />
              </strong>{' '}
              à l'investisseur <span className="font-mono text-xs">#{toPay?.investisseurId}</span>{' '}
              pour la propriété <strong>{toPay?.proprieteNom}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block font-body text-sm font-semibold text-earth mb-2">
                Méthode utilisée
              </label>
              <div className="grid grid-cols-2 gap-2">
                {METHODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethode(m)}
                    className={cn(
                      'h-11 rounded-md border-[1.5px] font-body text-sm font-medium transition-colors',
                      methode === m
                        ? 'border-ocean bg-ocean/10 text-ocean'
                        : 'border-sand-400 text-earth-600 hover:border-ocean/40'
                    )}
                  >
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="preuve"
                className="block font-body text-sm font-semibold text-earth mb-2"
              >
                Référence / preuve <span className="text-error">*</span>
              </label>
              <Input
                id="preuve"
                value={preuve}
                onChange={(e) => setPreuve(e.target.value)}
                placeholder={
                  methode === 'MOBILE_MONEY'
                    ? 'Ex : MM-2026-05-22-XYZ123'
                    : methode === 'VIREMENT'
                      ? 'Numéro / référence du virement'
                      : methode === 'CRYPTO'
                        ? '0x... ou lien explorer'
                        : 'Référence ou lien'
                }
                disabled={marquerPaye.isPending}
              />
              <p className="font-body text-xs text-earth-500 mt-1">
                Visible par l'investisseur pour tracer son versement.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToPay(null)}
              disabled={marquerPaye.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmPayout}
              disabled={marquerPaye.isPending || !preuve.trim()}
              className="bg-success hover:bg-success/90 text-white"
            >
              {marquerPaye.isPending ? 'Enregistrement...' : 'Confirmer le versement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}
