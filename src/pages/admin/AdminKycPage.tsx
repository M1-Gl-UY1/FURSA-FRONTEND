import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileImage,
  IdCard,
  Mail,
  Phone,
  ShieldX,
  User as UserIcon,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAdminKycApprove,
  useAdminKycDetail,
  useAdminKycList,
  useAdminKycReject,
  useAdminKycStats,
} from '@/lib/api/kyc'
import { extractApiError } from '@/lib/api/errors'
import type { KycAdminResponse, StatutKyc } from '@/lib/api/types'
import { cn, resolveFileUrl } from '@/lib/utils'

type Tab = Exclude<StatutKyc, 'NONE'>

const TABS: { value: Tab; label: string; statKey: 'pending' | 'inReview' | 'approved' | 'rejected' | 'expired' }[] = [
  { value: 'PENDING', label: 'En attente', statKey: 'pending' },
  { value: 'IN_REVIEW', label: 'En cours', statKey: 'inReview' },
  { value: 'APPROVED', label: 'Approuvés', statKey: 'approved' },
  { value: 'REJECTED', label: 'Refusés', statKey: 'rejected' },
  { value: 'EXPIRED', label: 'Expirés', statKey: 'expired' },
]

export function AdminKycPage() {
  const [statut, setStatut] = useState<Tab>('PENDING')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { data: stats } = useAdminKycStats()
  const { data: list, isLoading } = useAdminKycList(statut)

  if (selectedId !== null) {
    return <AdminKycDetail id={selectedId} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Vérification d'identité (KYC)
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Examinez les dossiers soumis par les investisseurs avant qu'ils puissent investir.
        </p>
      </header>

      <div className="inline-flex bg-sand-200 rounded-md p-1 gap-1 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setStatut(t.value)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-body transition-colors',
              statut === t.value
                ? 'bg-white text-earth shadow-sm font-semibold'
                : 'text-earth-600 hover:text-earth'
            )}
          >
            {t.label}
            {stats && (
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-earth/10 text-earth-600">
                {stats[t.statKey]}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && <Skeleton className="h-64 w-full bg-sand-300" />}

      {list && list.length === 0 && (
        <EmptyState
          icon={CheckCircle2}
          title={`Aucun dossier ${statut}`}
          description="La file d'attente est vide."
        />
      )}

      {list && list.length > 0 && (
        <div className="space-y-3">
          {list.map((k) => (
            <KycCard key={k.id} kyc={k} onOpen={() => setSelectedId(k.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Carte resume d'un dossier (vue liste)
// =============================================================================

function KycCard({ kyc, onOpen }: { kyc: KycAdminResponse; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full bg-white rounded-lg border border-earth/8 p-4 sm:p-5 text-left hover:border-ocean hover:shadow-card transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-xs text-earth-500">#{kyc.id}</span>
            <StatutPill statut={kyc.statut} />
            {kyc.nombreReSubmissions > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-warning/10 text-warning">
                {kyc.nombreReSubmissions}e tentative
              </span>
            )}
          </div>
          <p className="font-display font-bold text-earth text-base mb-1">
            {kyc.investisseurPrenom} {kyc.investisseurNom}
          </p>
          <p className="font-body text-sm text-earth-600 mb-2">
            {kyc.nationalite} · {kyc.paysResidence}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-earth-500">
            <span className="inline-flex items-center gap-1">
              <Mail className="w-3 h-3" strokeWidth={1.75} />
              {kyc.investisseurEmail}
            </span>
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3 h-3" strokeWidth={1.75} />
              {kyc.investisseurTelephone}
            </span>
          </div>
          <p className="mt-2 text-xs font-mono text-earth-400">
            Soumis le {new Date(kyc.submittedAt).toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
    </button>
  )
}

// =============================================================================
// Detail d'un dossier (vue admin, viewer docs + actions)
// =============================================================================

function AdminKycDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { data: kyc, isLoading } = useAdminKycDetail(id)
  const approveMutation = useAdminKycApprove()
  const rejectMutation = useAdminKycReject()
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [motif, setMotif] = useState('')

  if (isLoading || !kyc) {
    return <Skeleton className="h-96 w-full bg-sand-300" />
  }

  const canReview = kyc.statut === 'PENDING' || kyc.statut === 'IN_REVIEW'

  function handleApprove() {
    approveMutation.mutate(id, {
      onSuccess: () => {
        toast.success(`Dossier #${id} approuvé. Investisseur vérifié.`)
        onBack()
      },
      onError: (err) => toast.error(extractApiError(err, 'Approbation impossible')),
    })
  }

  function handleReject() {
    if (motif.trim().length < 5) {
      toast.error('Motif obligatoire (minimum 5 caractères)')
      return
    }
    rejectMutation.mutate(
      { id, motif: motif.trim() },
      {
        onSuccess: () => {
          toast.success(`Dossier #${id} refusé. Notification envoyée à l'investisseur.`)
          onBack()
        },
        onError: (err) => toast.error(extractApiError(err, 'Refus impossible')),
      }
    )
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour à la liste
      </button>

      <header>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="font-mono text-sm text-earth-500">#{kyc.id}</span>
          <StatutPill statut={kyc.statut} />
        </div>
        <h1 className="font-display font-bold text-earth text-2xl">
          {kyc.investisseurPrenom} {kyc.investisseurNom}
        </h1>
        <p className="font-body text-earth-600 text-sm mt-1">
          Soumis le {new Date(kyc.submittedAt).toLocaleString('fr-FR')}
          {kyc.reviewedAt && <> · Examiné le {new Date(kyc.reviewedAt).toLocaleString('fr-FR')}</>}
        </p>
      </header>

      {kyc.statut === 'REJECTED' && kyc.motifRefus && (
        <div className="px-4 py-3 rounded-lg border border-error/30 bg-error/10">
          <p className="font-body font-semibold text-earth text-sm mb-1">Motif du précédent refus</p>
          <p className="font-body text-earth-600 text-sm">{kyc.motifRefus}</p>
        </div>
      )}

      {/* Infos personnelles */}
      <section className="bg-white rounded-xl border border-earth/8 p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="w-5 h-5 text-ocean" strokeWidth={1.75} />
          <h2 className="font-display font-bold text-earth text-base">Informations</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm font-body">
          <Field label="Email" value={kyc.investisseurEmail} />
          <Field label="Téléphone" value={kyc.investisseurTelephone} />
          <Field label="Nationalité" value={kyc.nationalite ?? '—'} />
          <Field label="Date de naissance" value={kyc.dateNaissance ?? '—'} />
          <Field label="Pays de résidence" value={kyc.paysResidence ?? '—'} />
          <Field label="Source des fonds" value={kyc.sourceFonds ?? '—'} />
          <Field label="PEP" value={kyc.isPep ? 'Oui ⚠️' : 'Non'} highlight={kyc.isPep === true} />
          <Field label="Re-soumissions" value={String(kyc.nombreReSubmissions)} />
        </div>
        <div className="mt-3 pt-3 border-t border-earth/8">
          <p className="text-xs text-earth-500 font-body mb-1">Adresse</p>
          <p className="text-sm text-earth font-body">{kyc.adresse ?? '—'}</p>
        </div>
      </section>

      {/* Documents */}
      <section className="bg-white rounded-xl border border-earth/8 p-5">
        <div className="flex items-center gap-2 mb-4">
          <IdCard className="w-5 h-5 text-ocean" strokeWidth={1.75} />
          <h2 className="font-display font-bold text-earth text-base">Documents</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DocumentPreview label="Pièce d'identité" url={resolveFileUrl(kyc.documentIdentiteUrl)} />
          <DocumentPreview label="Justificatif domicile" url={resolveFileUrl(kyc.documentDomicileUrl)} />
          <DocumentPreview label="Selfie" url={resolveFileUrl(kyc.selfieUrl)} />
        </div>
      </section>

      {/* Actions (uniquement si PENDING ou IN_REVIEW) */}
      {canReview && (
        <section className="bg-sand-100 rounded-xl border border-earth/5 p-5">
          <h2 className="font-display font-bold text-earth text-base mb-3">Décision</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleApprove}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              <Check strokeWidth={2} />
              {approveMutation.isPending ? 'Approbation...' : 'Approuver'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => setShowRejectDialog(true)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              <X strokeWidth={2} />
              Refuser
            </Button>
          </div>
        </section>
      )}

      {/* Modal refus */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-earth/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-card-hover">
            <div className="flex items-center gap-2 mb-3">
              <ShieldX className="w-5 h-5 text-error" strokeWidth={1.75} />
              <h3 className="font-display font-bold text-earth text-lg">Refuser le dossier</h3>
            </div>
            <p className="font-body text-earth-600 text-sm mb-4">
              Soyez précis. L'investisseur verra ce motif et pourra re-soumettre après correction.
            </p>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: La pièce d'identité est illisible, merci de refaire la photo en bonne lumière."
              className="w-full min-h-[100px] mb-4 rounded-md border-[1.5px] border-sand-400 bg-white px-3 py-2 text-sm text-earth font-body placeholder:text-earth-400 focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15"
              maxLength={500}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={rejectMutation.isPending}>
                Annuler
              </Button>
              <Button onClick={handleReject} disabled={rejectMutation.isPending || motif.trim().length < 5}>
                {rejectMutation.isPending ? 'Envoi...' : 'Confirmer le refus'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Sous-composants
// =============================================================================

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-earth-500 mb-0.5">{label}</p>
      <p className={cn('text-sm font-semibold', highlight ? 'text-warning' : 'text-earth')}>{value}</p>
    </div>
  )
}

function DocumentPreview({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="bg-sand-200 rounded-lg p-4 text-center">
        <FileImage className="w-8 h-8 text-earth-400 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-xs font-body text-earth-500">{label}</p>
        <p className="text-xs font-mono text-earth-400">Manquant</p>
      </div>
    )
  }
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(url)
  return (
    <div className="bg-sand-100 rounded-lg overflow-hidden border border-earth/8">
      <div className="aspect-square bg-white flex items-center justify-center overflow-hidden">
        {isImage ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img src={url} alt={label} className="w-full h-full object-contain" />
        ) : (
          <div className="text-center">
            <FileImage className="w-12 h-12 text-earth-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs font-body text-earth-500">PDF / autre</p>
          </div>
        )}
      </div>
      <div className="p-3 flex items-center justify-between gap-2">
        <span className="text-xs font-body text-earth font-semibold">{label}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-ocean text-xs font-semibold hover:underline shrink-0"
        >
          Ouvrir
          <ExternalLink className="w-3 h-3" strokeWidth={2} />
        </a>
      </div>
    </div>
  )
}

function StatutPill({ statut }: { statut: Exclude<StatutKyc, 'NONE'> }) {
  const config = {
    PENDING: { label: 'EN ATTENTE', cls: 'bg-warning/10 text-warning', Icon: AlertTriangle },
    IN_REVIEW: { label: 'EN COURS', cls: 'bg-ocean/10 text-ocean', Icon: Clock },
    APPROVED: { label: 'APPROUVÉ', cls: 'bg-success/10 text-success', Icon: CheckCircle2 },
    REJECTED: { label: 'REFUSÉ', cls: 'bg-error/10 text-error', Icon: XCircle },
    EXPIRED: { label: 'EXPIRÉ', cls: 'bg-earth/10 text-earth-600', Icon: AlertTriangle },
  }[statut]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold',
        config.cls
      )}
    >
      <config.Icon className="w-3 h-3" strokeWidth={2} />
      {config.label}
    </span>
  )
}
