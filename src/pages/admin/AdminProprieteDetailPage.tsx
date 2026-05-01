import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Money } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
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
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useApprouverPropriete,
  usePublierPropriete,
  useRefuserPropriete,
  useSupprimerPropriete,
} from '@/lib/api/admin'
import { extractApiError } from '@/lib/api/errors'
import { calculatePartsVendues, calculatePourcentageVendu, usePropriete } from '@/lib/api/proprietes'

export function AdminProprieteDetailPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : NaN

  if (Number.isNaN(id)) return <Navigate to="/admin/proprietes" replace />

  const navigate = useNavigate()
  const { data: p, isLoading, isError } = usePropriete(id)
  const approuver = useApprouverPropriete()
  const refuser = useRefuserPropriete()
  const publier = usePublierPropriete()
  const supprimer = useSupprimerPropriete()
  const [refusOpen, setRefusOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40 bg-sand-300" />
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      </div>
    )
  }

  if (isError || !p) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-earth text-xl mb-2">Propriété introuvable</h2>
        <Button asChild>
          <Link to="/admin/proprietes">Retour</Link>
        </Button>
      </div>
    )
  }

  const pourcentage = calculatePourcentageVendu(p)
  const vendues = calculatePartsVendues(p)
  const total = p.nombreTotalPart ?? p.partsTotales ?? 0
  const valeurTotale = total * p.prixUnitairePart

  const apiBase = import.meta.env.VITE_API_BASE
  const fileUrl = (urlOrName: string) => `${apiBase}/api/fichiers/${urlOrName}`
  const photos = p.documents?.filter((d) => d.type === 'IMAGE') ?? []
  const docs = p.documents?.filter((d) => d.type === 'PDF') ?? []
  const heroPhoto = photos[0]

  function approve() {
    approuver.mutate(p!.id, {
      onSuccess: () => toast.success('Propriété approuvée. Elle peut maintenant être publiée.'),
      onError: (e) => toast.error(extractApiError(e, 'Approbation impossible.')),
    })
  }
  function publish() {
    publier.mutate(p!.id, {
      onSuccess: () => toast.success('Propriété publiée. Visible sur le marché.'),
      onError: (e) => toast.error(extractApiError(e, 'Publication impossible.')),
    })
  }
  function destroy() {
    supprimer.mutate(p!.id, {
      onSuccess: () => {
        toast.success('Propriété supprimée.')
        navigate('/admin/proprietes')
      },
      onError: (e) => toast.error(extractApiError(e, 'Suppression impossible.')),
    })
  }
  function confirmRefus(motif: string) {
    refuser.mutate(
      { id: p!.id, motif },
      {
        onSuccess: () => {
          toast.success('Propriété refusée.')
          setRefusOpen(false)
        },
        onError: (e) => toast.error(extractApiError(e, 'Refus impossible.')),
      }
    )
  }

  const isReview = p.statut === 'EN_REVIEW'
  const isAcceptee = p.statut === 'ACCEPTEE'
  const isPubliee = p.statut === 'PUBLIEE'
  const isRefusee = p.statut === 'REFUSEE'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        to="/admin/proprietes"
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour
      </Link>

      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <StatusBadge status={p.statut} />
            <span className="font-mono text-xs text-earth-500">#{p.id}</span>
            {p.proposeurId && (
              <span className="text-xs font-body text-ocean">
                Proposé par investisseur #{p.proposeurId}
              </span>
            )}
          </div>
          <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
            {p.nom}
          </h1>
          <p className="flex items-center gap-1.5 text-earth-600 text-sm font-body">
            <MapPin className="w-4 h-4" strokeWidth={1.75} />
            {p.localisation}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {isReview && (
            <>
              <Button onClick={approve} disabled={approuver.isPending}>
                <CheckCircle2 strokeWidth={2} />
                Approuver
              </Button>
              <Button variant="outline" onClick={() => setRefusOpen(true)} className="text-error border-error/40 hover:bg-error/10">
                <XCircle strokeWidth={2} />
                Refuser
              </Button>
            </>
          )}
          {isAcceptee && (
            <Button onClick={publish} disabled={publier.isPending}>
              <Send strokeWidth={2} />
              Publier
            </Button>
          )}
          {(isPubliee || isRefusee) && (
            <Button variant="outline" onClick={() => setDeleteOpen(true)} className="text-error border-error/40 hover:bg-error/10">
              <Trash2 strokeWidth={1.75} />
              Supprimer
            </Button>
          )}
        </div>
      </header>

      {heroPhoto && (
        <div className="aspect-[16/9] rounded-xl overflow-hidden bg-sand-300">
          <img src={fileUrl(heroPhoto.url)} alt={p.nom} className="w-full h-full object-cover" />
        </div>
      )}

      {isRefusee && p.motifRefus && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-5">
          <p className="font-body font-semibold text-error text-sm mb-1">Motif du refus</p>
          <p className="font-body text-earth-700 text-sm whitespace-pre-line">{p.motifRefus}</p>
        </div>
      )}

      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
        <h2 className="font-display font-semibold text-earth text-lg mb-4">
          Caractéristiques
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <Kpi label="Parts totales" value={total.toLocaleString('fr-FR')} />
          <Kpi label="Prix unitaire" value={<Money amount={p.prixUnitairePart} mono={false} />} />
          <Kpi label="Valeur totale" value={<Money amount={valeurTotale} mono={false} />} />
          <Kpi label="Rentabilité" value={`${p.rentabilitePrevue ?? 0}%`} />
        </div>

        {isPubliee && (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <p className="font-body text-xs text-earth-500 uppercase tracking-wide">
                Financement
              </p>
              <p className="font-mono text-xs text-earth-600 tabular-nums">
                {vendues.toLocaleString('fr-FR')} / {total.toLocaleString('fr-FR')} parts
              </p>
            </div>
            <ProgressBar value={pourcentage} />
          </div>
        )}
      </section>

      {p.description && (
        <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
          <h2 className="font-display font-semibold text-earth text-lg mb-3">
            Description
          </h2>
          <p className="font-body text-earth-700 text-sm leading-relaxed whitespace-pre-line">
            {p.description}
          </p>
        </section>
      )}

      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Meta icon={CalendarDays} label="Soumise le">
            {p.soumiseLe ? formatDate(p.soumiseLe) : '—'}
          </Meta>
          <Meta icon={CalendarDays} label="Créée le">
            {p.dateCreation ? formatDate(p.dateCreation) : '—'}
          </Meta>
          <Meta icon={Building2} label="Type">
            {p.proposeurId ? 'Soumission propriétaire' : 'Création admin direct'}
          </Meta>
        </div>
      </section>

      {docs.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-earth text-lg mb-3">
            Documents ({docs.length})
          </h2>
          <ul className="space-y-2">
            {docs.map((d) => (
              <li key={d.id}>
                <a
                  href={fileUrl(d.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-sand-100 hover:bg-sand-200 rounded-lg border border-earth/5 transition-colors"
                >
                  <span className="flex-1 truncate font-body text-earth text-sm">
                    {d.nom ?? d.fileName ?? d.url}
                  </span>
                  <span className="text-earth-500 text-xs">Ouvrir</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {photos.length > 1 && (
        <section>
          <h2 className="font-display font-semibold text-earth text-lg mb-3">
            Photos ({photos.length})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((d) => (
              <a
                key={d.id}
                href={fileUrl(d.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-md overflow-hidden bg-sand-300 hover:opacity-90"
              >
                <img src={fileUrl(d.url)} alt="" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Modal refus */}
      <RefusDialog
        open={refusOpen}
        onClose={() => setRefusOpen(false)}
        onConfirm={confirmRefus}
        isPending={refuser.isPending}
      />

      {/* Modal suppression */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-white border-earth/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-earth text-xl">
              Supprimer définitivement ?
            </DialogTitle>
            <DialogDescription className="font-body text-earth-600 text-sm">
              <span className="font-semibold text-earth">{p.nom}</span> sera retirée du catalogue ainsi que tous ses fichiers. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={supprimer.isPending}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={destroy} disabled={supprimer.isPending}>
              {supprimer.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// Sous-composants
// ============================================================================

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="font-body text-[11px] text-earth-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="font-mono font-semibold text-earth text-base sm:text-lg tabular-nums">
        {value}
      </p>
    </div>
  )
}

function Meta({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center shrink-0 border border-earth/8">
        <Icon className="w-4 h-4 text-earth-500" strokeWidth={1.75} />
      </div>
      <div>
        <p className="font-body text-xs text-earth-500">{label}</p>
        <p className="font-body text-sm text-earth font-medium">{children}</p>
      </div>
    </div>
  )
}

function RefusDialog({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (motif: string) => void
  isPending: boolean
}) {
  const [motif, setMotif] = useState('')

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white border-earth/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-earth text-xl">
            Refuser cette propriété
          </DialogTitle>
          <DialogDescription className="font-body text-earth-600 text-sm">
            Indiquez un motif clair (le proposeur le verra dans son espace).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="motif">Motif (10-1000 caractères)</Label>
          <textarea
            id="motif"
            rows={5}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex: Documents incomplets, prix surévalué..."
            className="w-full rounded-md border-[1.5px] border-sand-400 bg-white px-4 py-3 text-sm font-body text-earth focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15 transition-colors resize-y"
          />
          <p className="font-mono text-xs text-earth-500">{motif.length} / 1000</p>
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
            {isPending ? 'Envoi...' : 'Confirmer le refus'}
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
  }).format(new Date(iso))
}
