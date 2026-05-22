import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Banknote,
  CheckCircle2,
  Coins,
  ExternalLink,
  FileText,
  Send,
  Wallet,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAdminRevenus,
  useApprouverRevenu,
  useDistribuerRevenu,
  useMarquerArgentRecu,
  useRefuserRevenu,
} from '@/lib/api/admin'
import { extractApiError } from '@/lib/api/errors'
import type { RevenuResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'

function resolveFileUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
  return base ? `${base}${url.startsWith('/') ? '' : '/'}${url}` : url
}

type Tab = 'a-valider' | 'valides' | 'distribues' | 'tous'

export function AdminRevenusPage() {
  const { data, isLoading } = useAdminRevenus()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('onglet') as Tab | null
  const [tab, setTab] = useState<Tab>(tabParam ?? 'a-valider')

  function changeTab(t: Tab) {
    setTab(t)
    setSearchParams({ onglet: t })
  }

  const approuver = useApprouverRevenu()
  const refuser = useRefuserRevenu()
  const distribuer = useDistribuerRevenu()
  const argentRecu = useMarquerArgentRecu()
  const [refusTarget, setRefusTarget] = useState<RevenuResponse | null>(null)
  const [distribTarget, setDistribTarget] = useState<RevenuResponse | null>(null)

  const revenus = data ?? []
  const aValider = revenus.filter((r) => r.statut === 'EN_REVIEW')
  const valides = revenus.filter((r) => r.statut === 'VALIDE')
  const distribues = revenus.filter((r) => r.statut === 'DISTRIBUE')

  const filtered = (() => {
    if (tab === 'a-valider') return aValider
    if (tab === 'valides') return valides
    if (tab === 'distribues') return distribues
    return revenus
  })()

  function approve(id: number) {
    approuver.mutate(id, {
      onSuccess: () => toast.success('Revenu validé. Vous pouvez le distribuer.'),
      onError: (e) => toast.error(extractApiError(e, 'Approbation impossible.')),
    })
  }

  function distribute(r: RevenuResponse) {
    distribuer.mutate(r.id, {
      onSuccess: (dividendes) => {
        toast.success(`Distribution effectuée : ${dividendes.length} dividende${dividendes.length > 1 ? 's' : ''} générés.`)
        setDistribTarget(null)
      },
      onError: (e) => toast.error(extractApiError(e, 'Distribution impossible.')),
    })
  }

  function reject(motif: string) {
    if (!refusTarget) return
    refuser.mutate(
      { id: refusTarget.id, motif },
      {
        onSuccess: () => {
          toast.success('Revenu refusé.')
          setRefusTarget(null)
        },
        onError: (e) => toast.error(extractApiError(e, 'Refus impossible.')),
      }
    )
  }

  function toggleArgentRecu(r: RevenuResponse) {
    const next = !r.argentRecuParFursa
    argentRecu.mutate(
      { id: r.id, argentRecu: next },
      {
        onSuccess: () =>
          toast.success(
            next
              ? `Argent confirmé reçu — vous pouvez distribuer #${r.id}.`
              : `Confirmation annulée pour #${r.id}.`
          ),
        onError: (e) => toast.error(extractApiError(e, 'Mise à jour impossible.')),
      }
    )
  }

  const columns: Column<RevenuResponse>[] = [
    {
      key: 'id',
      label: 'ID',
      width: 'w-16',
      align: 'right',
      render: (r) => <span className="font-mono text-xs text-earth-500">#{r.id}</span>,
    },
    {
      key: 'proprieteNom',
      label: 'Propriété',
      render: (r) => (
        <span className="font-body font-semibold text-earth">
          {r.proprieteNom ?? '—'}
        </span>
      ),
    },
    {
      key: 'periode',
      label: 'Période',
      hideOnMobile: true,
      render: (r) =>
        r.periodeDebut || r.periodeFin
          ? <span className="font-mono text-xs text-earth-600">{shortDate(r.periodeDebut)} → {shortDate(r.periodeFin)}</span>
          : <span className="text-earth-400 text-xs">—</span>,
    },
    {
      key: 'montantTotal',
      label: 'Montant',
      align: 'right',
      render: (r) => <Money amount={r.montantTotal} mono={false} className="font-bold" />,
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      render: (r) => r.statut ? <StatusBadge status={r.statut} /> : '—',
    },
    {
      key: 'justificatif',
      label: 'Justif.',
      align: 'center',
      hideOnMobile: true,
      noSort: true,
      render: (r) => {
        const url = resolveFileUrl(r.justificatifUrl)
        return url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-ocean text-xs hover:underline"
            title="Voir le justificatif"
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
            <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
          </a>
        ) : (
          <span className="text-earth-300 text-xs">—</span>
        )
      },
    },
    {
      key: 'argentRecu',
      label: 'Argent reçu',
      align: 'center',
      hideOnMobile: true,
      sortAccessor: (r) => (r.argentRecuParFursa ? 1 : 0),
      render: (r) =>
        r.statut === 'VALIDE' ? (
          <label
            className={cn(
              'inline-flex items-center gap-2 cursor-pointer',
              argentRecu.isPending && 'opacity-50 pointer-events-none'
            )}
          >
            <Checkbox
              checked={!!r.argentRecuParFursa}
              onCheckedChange={() => toggleArgentRecu(r)}
              aria-label="Marquer argent reçu par FURSA"
            />
            <span
              className={cn(
                'font-body text-[11px] font-semibold',
                r.argentRecuParFursa ? 'text-success' : 'text-warning'
              )}
            >
              {r.argentRecuParFursa ? 'Reçu' : 'En attente'}
            </span>
          </label>
        ) : r.statut === 'DISTRIBUE' ? (
          <span className="inline-flex items-center gap-1 text-success text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> Reçu
          </span>
        ) : (
          <span className="text-earth-300 text-xs">—</span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      noSort: true,
      align: 'right',
      render: (r) => (
        <div className="inline-flex items-center gap-1 justify-end">
          {r.statut === 'EN_REVIEW' && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => approve(r.id)}
                disabled={approuver.isPending}
                aria-label="Approuver"
                className="text-success hover:bg-success/10 hover:text-success"
              >
                <CheckCircle2 strokeWidth={1.75} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setRefusTarget(r)}
                aria-label="Refuser"
                className="text-error hover:bg-error/10 hover:text-error"
              >
                <XCircle strokeWidth={1.75} />
              </Button>
            </>
          )}
          {r.statut === 'VALIDE' && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDistribTarget(r)}
              aria-label={
                r.argentRecuParFursa
                  ? 'Distribuer'
                  : "Cochez 'Argent reçu' avant de distribuer"
              }
              disabled={!r.argentRecuParFursa}
              title={
                r.argentRecuParFursa
                  ? 'Distribuer aux investisseurs'
                  : "Cochez d'abord 'Argent reçu par FURSA' pour pouvoir distribuer."
              }
              className={cn(
                'text-terra hover:bg-terra/10 hover:text-terra',
                !r.argentRecuParFursa && 'opacity-40 cursor-not-allowed'
              )}
            >
              <Send strokeWidth={1.75} />
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
          Revenus
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Valider les déclarations propriétaires + déclencher les distributions de dividendes.
        </p>
      </header>

      {/* Tabs */}
      <div role="tablist" className="flex flex-wrap gap-1 bg-sand-200 rounded-md p-1">
        <TabButton active={tab === 'a-valider'} onClick={() => changeTab('a-valider')} count={aValider.length} highlight>
          À valider
        </TabButton>
        <TabButton active={tab === 'valides'} onClick={() => changeTab('valides')} count={valides.length}>
          Validés (à distribuer)
        </TabButton>
        <TabButton active={tab === 'distribues'} onClick={() => changeTab('distribues')} count={distribues.length}>
          Distribués
        </TabButton>
        <TabButton active={tab === 'tous'} onClick={() => changeTab('tous')} count={revenus.length}>
          Tous
        </TabButton>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          rowKey={(r) => r.id}
          initialSort={{ key: 'id', direction: 'desc' }}
          empty={
            <EmptyState
              icon={tab === 'a-valider' ? Banknote : Coins}
              title={tab === 'a-valider' ? 'Aucune déclaration à valider' : 'Aucun revenu'}
              description={
                tab === 'a-valider'
                  ? 'Toutes les déclarations ont été examinées.'
                  : 'Aucun revenu dans cette catégorie.'
              }
            />
          }
        />
      )}

      {/* Modal refus */}
      <RefusDialog
        target={refusTarget}
        onClose={() => setRefusTarget(null)}
        onConfirm={reject}
        isPending={refuser.isPending}
      />

      {/* Modal distribution */}
      <Dialog open={!!distribTarget} onOpenChange={(o) => !o && setDistribTarget(null)}>
        <DialogContent className="bg-white border-earth/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-earth text-xl">
              Distribuer ce revenu ?
            </DialogTitle>
            <DialogDescription className="font-body text-earth-600 text-sm">
              <span className="font-semibold text-earth">{distribTarget?.proprieteNom}</span> —{' '}
              <Money amount={distribTarget?.montantTotal} mono={false} className="font-mono font-bold" />
              <br />
              Les dividendes seront calculés au prorata des parts détenues et chaque
              investisseur sera notifié. Action irréversible.
              <span className="block mt-3 inline-flex items-center gap-1.5 text-success text-xs font-semibold">
                <Wallet className="w-3.5 h-3.5" strokeWidth={1.75} />
                Argent confirmé reçu par FURSA
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setDistribTarget(null)} disabled={distribuer.isPending}>
              Annuler
            </Button>
            <Button
              onClick={() => distribTarget && distribute(distribTarget)}
              disabled={distribuer.isPending}
            >
              <Send strokeWidth={2} />
              {distribuer.isPending ? 'Distribution...' : 'Distribuer maintenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
      role="tab"
      aria-selected={active}
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

function RefusDialog({
  target,
  onClose,
  onConfirm,
  isPending,
}: {
  target: RevenuResponse | null
  onClose: () => void
  onConfirm: (motif: string) => void
  isPending: boolean
}) {
  const [motif, setMotif] = useState('')

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white border-earth/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-earth text-xl">
            Refuser cette déclaration
          </DialogTitle>
          <DialogDescription className="font-body text-earth-600 text-sm">
            {target?.proprieteNom} —{' '}
            <Money amount={target?.montantTotal} mono={false} className="font-mono font-bold" />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="motif-rev">Motif (10-1000 caractères)</Label>
          <textarea
            id="motif-rev"
            rows={5}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex: Justificatifs manquants, montant incohérent..."
            className="w-full rounded-md border-[1.5px] border-sand-400 bg-white px-4 py-3 text-sm font-body text-earth focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15 transition-colors resize-y"
          />
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            disabled={motif.trim().length < 10 || isPending}
            onClick={() => onConfirm(motif.trim())}
          >
            <XCircle strokeWidth={2} />
            {isPending ? 'Envoi...' : 'Confirmer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function shortDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(iso))
}
