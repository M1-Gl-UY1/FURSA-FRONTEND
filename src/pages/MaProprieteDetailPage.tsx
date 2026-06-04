import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Bed,
  Building2,
  CalendarClock,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  Coins,
  Eye,
  FileText,
  Globe,
  Home as HomeIcon,
  ImageIcon,
  LayoutGrid,
  Link2,
  Loader2,
  MapPin,
  PlayCircle,
  Plus,
  Ruler,
  ShieldCheck,
  Sparkles,
  Trees,
  TrendingUp,
  Upload,
  Waves,
  Wind,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Money } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useSoumettreCertification,
  useUploadDocsCertification,
} from '@/lib/api/certification'
import { useMesRevenus, useStatutDeclaration } from '@/lib/api/revenus'
import { useMaProprieteProposee } from '@/lib/api/submissions'
import { StatutDeclarationBadge } from '@/components/shared/StatutDeclarationBadge'
import { extractApiError } from '@/lib/api/errors'
import type { ProprieteResponse } from '@/lib/api/types'
import { cn, resolveFileUrl } from '@/lib/utils'

export function MaProprieteDetailPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : NaN

  if (Number.isNaN(id)) return <Navigate to="/mes-proprietes" replace />

  const { data: p, isLoading, isError } = useMaProprieteProposee(id)
  const { data: mesRevenus } = useMesRevenus()

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="aspect-[16/9] rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    )
  }

  if (isError || !p) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-earth text-xl mb-2">
          Propriété introuvable
        </h2>
        <Button asChild>
          <Link to="/mes-proprietes">Retour à mes propriétés</Link>
        </Button>
      </div>
    )
  }

  const total = p.nombreTotalPart ?? p.partsTotales ?? 0
  const dispo = p.partsDisponibles ?? 0
  const vendues = Math.max(0, total - dispo)
  const pourcentage = total > 0 ? Math.round((vendues / total) * 100) : 0
  const valeurLevee = vendues * p.prixUnitairePart
  const valeurTotale = total * p.prixUnitairePart
  const isPubliee = p.statut === 'PUBLIEE'

  const photos = p.documents?.filter((d) => d.type === 'IMAGE') ?? []
  const docs = p.documents?.filter((d) => d.type === 'PDF') ?? []
  // Fix 25/05/2026 : utiliser resolveFileUrl (backend prefixe deja /api/fichiers/)
  const fileUrl = (urlOrName: string) => resolveFileUrl(urlOrName)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        to="/mes-proprietes"
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour à mes propriétés
      </Link>

      {/* Header bien */}
      <header>
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <StatusBadge status={p.statut} />
          {isPubliee && <DeclarationBadgeForPropriete proprieteId={id} />}
        </div>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-2">
          {p.nom}
        </h1>
        <p className="flex items-center gap-1.5 text-earth-600 text-sm font-body">
          <MapPin className="w-4 h-4" strokeWidth={1.75} />
          {p.localisation}
        </p>
      </header>

      {/* Bandeau statut */}
      {p.statut === 'EN_REVIEW' && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-5 flex items-start gap-4">
          <Clock className="w-6 h-6 text-warning shrink-0" strokeWidth={1.75} />
          <div>
            <p className="font-body font-semibold text-earth text-sm mb-1">
              En cours d'examen
            </p>
            <p className="font-body text-earth-600 text-sm">
              Notre équipe étudie votre soumission. Vous recevrez une notification dès qu'une décision aura été prise.
            </p>
          </div>
        </div>
      )}

      {p.statut === 'REFUSEE' && p.motifRefus && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-5 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-error shrink-0" strokeWidth={1.75} />
          <div className="min-w-0">
            <p className="font-body font-semibold text-earth text-sm mb-1">
              Soumission refusée
            </p>
            <p className="font-body text-earth-700 text-sm whitespace-pre-line">
              {p.motifRefus}
            </p>
          </div>
        </div>
      )}

      {/* KPIs financiers */}
      {isPubliee && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Fonds levés"
            value={<Money amount={valeurLevee} mono={false} />}
            trend={pourcentage}
            trendLabel={`sur ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(valeurTotale)}`}
          />
          <StatCard
            label="Parts vendues"
            value={`${vendues.toLocaleString('fr-FR')} / ${total.toLocaleString('fr-FR')}`}
          />
          <StatCard
            label="Rentabilité estimée"
            value={`${p.rentabilitePrevue}% / an`}
            icon={TrendingUp}
            iconBg="bg-success/10"
            iconColor="text-success"
          />
        </section>
      )}

      {/* Progression */}
      {isPubliee && (
        <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
          <h2 className="font-display font-semibold text-earth text-lg mb-3">
            Progression du financement
          </h2>
          <ProgressBar value={pourcentage} />
          <p className="font-body text-earth-500 text-xs mt-3">
            <span className="font-mono font-semibold text-earth">{vendues.toLocaleString('fr-FR')}</span> parts vendues sur{' '}
            <span className="font-mono">{total.toLocaleString('fr-FR')}</span>
          </p>
        </section>
      )}

      {/* Description */}
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

      {/* Localisation détaillée */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
        <h2 className="font-display font-semibold text-earth text-lg mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
          Localisation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Meta icon={Globe} label="Pays">{p.pays ?? '—'}</Meta>
          <Meta icon={MapPin} label="Ville">{p.ville ?? '—'}</Meta>
          {p.adressePrecise && (
            <Meta icon={MapPin} label="Adresse precise" className="sm:col-span-2">
              {p.adressePrecise}
            </Meta>
          )}
        </div>
      </section>

      {/* Caracteristiques du bien */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
        <h2 className="font-display font-semibold text-earth text-lg mb-4 flex items-center gap-2">
          <HomeIcon className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
          Caracteristiques
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <Meta icon={Building2} label="Type de bien">{p.typeBien ?? '—'}</Meta>
          <Meta icon={Ruler} label="Superficie">
            {p.superficieM2 ? `${p.superficieM2} m²` : '—'}
          </Meta>
          <Meta icon={LayoutGrid} label="Nombre de pieces">{p.nombrePieces ?? '—'}</Meta>
          <Meta icon={Bed} label="Nombre de chambres">{p.nombreChambres ?? '—'}</Meta>
        </div>

        {(p.hasPiscine || p.hasClimatisation || p.hasParking || p.hasAscenseur || p.hasJardin || p.hasVueMer) && (
          <div>
            <p className="font-body text-xs uppercase tracking-wider text-earth-500 font-semibold mb-2">Equipements</p>
            <div className="flex flex-wrap gap-2">
              {p.hasPiscine && <Tag icon={Waves}>Piscine</Tag>}
              {p.hasClimatisation && <Tag icon={Wind}>Climatisation</Tag>}
              {p.hasParking && <Tag icon={Car}>Parking</Tag>}
              {p.hasAscenseur && <Tag icon={Building2}>Ascenseur</Tag>}
              {p.hasJardin && <Tag icon={Trees}>Jardin</Tag>}
              {p.hasVueMer && <Tag icon={Eye}>Vue mer</Tag>}
            </div>
          </div>
        )}
      </section>

      {/* Finance detaillee */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
        <h2 className="font-display font-semibold text-earth text-lg mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
          Finance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {p.prixVenteTotal && (
            <Meta icon={Coins} label={`Prix total (${p.deviseLocale ?? 'devise locale'})`}>
              {Number(p.prixVenteTotal).toLocaleString('fr-FR')} {p.deviseLocale ?? ''}
            </Meta>
          )}
          {p.prixVenteTotalUsd && (
            <Meta icon={Coins} label="Equivalent USD">
              <Money amount={p.prixVenteTotalUsd} />
            </Meta>
          )}
          {p.fractionVenduePct != null && (
            <Meta icon={TrendingUp} label="Fraction mise en vente">
              {p.fractionVenduePct}%
            </Meta>
          )}
          <Meta icon={Coins} label="Prix par part">
            <Money amount={p.prixUnitairePart} />
          </Meta>
          {p.prixInitialPart != null && Number(p.prixInitialPart) !== Number(p.prixUnitairePart) && (
            <Meta icon={Coins} label="Prix initial par part">
              <Money amount={p.prixInitialPart} />
            </Meta>
          )}
          {p.bonusRentabiliteTotal != null && Number(p.bonusRentabiliteTotal) > 0 && (
            <Meta icon={TrendingUp} label="Bonus rentabilite cumule">
              +{(Number(p.bonusRentabiliteTotal) * 100).toFixed(2)}%
            </Meta>
          )}
        </div>
      </section>

      {/* Exploitation */}
      {(p.statutExploitation || p.sourceRevenu || p.revenuMensuelActuel || p.dateLivraisonPrevue) && (
        <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
          <h2 className="font-display font-semibold text-earth text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
            Exploitation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {p.statutExploitation && (
              <Meta icon={Building2} label="Statut">{p.statutExploitation}</Meta>
            )}
            {p.dateLivraisonPrevue && (
              <Meta icon={CalendarClock} label="Date de livraison prevue">
                {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(p.dateLivraisonPrevue))}
              </Meta>
            )}
            {p.revenuMensuelActuel && Number(p.revenuMensuelActuel) > 0 && (
              <Meta icon={Coins} label="Revenu mensuel actuel">
                {Number(p.revenuMensuelActuel).toLocaleString('fr-FR')} {p.deviseLocale ?? ''}
              </Meta>
            )}
            {p.sourceRevenu && (
              <Meta icon={TrendingUp} label="Source des revenus">{p.sourceRevenu}</Meta>
            )}
          </div>
        </section>
      )}

      {/* Gestionnaire locatif si assigne */}
      {p.gestionnaire && (
        <section className="bg-ocean/5 border border-ocean/20 rounded-xl p-5">
          <p className="font-body text-xs uppercase tracking-wider text-ocean font-semibold mb-2">
            Gestion locative confiee a
          </p>
          <p className="font-display font-bold text-earth text-lg">{p.gestionnaire.nom}</p>
          {p.gestionnaire.description && (
            <p className="font-body text-earth-600 text-sm mt-1">{p.gestionnaire.description}</p>
          )}
        </section>
      )}

      {/* Video de visite */}
      {p.videoUrl && (
        <section>
          <h2 className="font-display font-semibold text-earth text-lg mb-3 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
            Video de visite
          </h2>
          <video
            controls
            src={resolveFileUrl(p.videoUrl)}
            className="w-full rounded-xl bg-sand-300 max-h-[480px]"
          />
        </section>
      )}

      {/* Blockchain : visible des qu'il y a un txHash */}
      {p.transactionHash && (
        <section className="bg-ocean/5 border border-ocean/20 rounded-xl p-5">
          <h2 className="font-body font-semibold text-ocean text-sm mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4" strokeWidth={2} />
            Blockchain Sepolia
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-xs font-body">
            <div>
              <p className="text-earth-500 uppercase tracking-wider mb-1">Transaction hash</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${p.transactionHash}`}
                target="_blank" rel="noopener noreferrer"
                className="font-mono text-ocean hover:underline break-all"
              >
                {p.transactionHash}
              </a>
            </div>
            {p.adresseContrat ? (
              <div>
                <p className="text-earth-500 uppercase tracking-wider mb-1">Adresse du contrat</p>
                <a
                  href={`https://sepolia.etherscan.io/address/${p.adresseContrat}`}
                  target="_blank" rel="noopener noreferrer"
                  className="font-mono text-ocean hover:underline break-all"
                >
                  {p.adresseContrat}
                </a>
              </div>
            ) : (
              <div>
                <p className="text-earth-500 uppercase tracking-wider mb-1">Adresse du contrat</p>
                <p className="text-earth-500 italic">En attente de confirmation Sepolia...</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Phase Certification : section uploads + soumission */}
      {(p.statut === 'PUBLIEE' || p.statut === 'ACCEPTEE') && (
        <CertificationSection propriete={p} proprieteId={id} />
      )}

      {/* Revenus déclarés (uniquement si propriété PUBLIEE) */}
      {isPubliee && (
        <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display font-semibold text-earth text-lg flex items-center gap-2">
                <Coins className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
                Revenus déclarés
              </h2>
              <p className="font-body text-earth-500 text-xs mt-0.5">
                Déclarez les loyers / revenus perçus pour distribution aux investisseurs.
              </p>
            </div>
            <Button asChild size="sm">
              <Link to={`/mes-proprietes/${id}/declarer-revenu`}>
                <Plus strokeWidth={2} />
                Déclarer un revenu
              </Link>
            </Button>
          </header>

          <RevenusList proprieteId={id} mesRevenus={mesRevenus ?? []} />
        </section>
      )}

      {/* Méta */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
        <h2 className="font-display font-semibold text-earth text-lg mb-3">
          Détails
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Meta icon={CalendarDays} label="Soumise le">
            {p.soumiseLe
              ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(p.soumiseLe))
              : '—'}
          </Meta>
          <Meta icon={CalendarDays} label="Créée le">
            {p.dateCreation
              ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(p.dateCreation))
              : '—'}
          </Meta>
        </div>
      </section>

      {/* Photos */}
      {photos.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-earth text-lg mb-3 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
            Photos ({photos.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((d) => (
              <a
                key={d.id}
                href={fileUrl(d.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-md overflow-hidden bg-sand-300 hover:opacity-90 transition-opacity"
              >
                <img
                  src={fileUrl(d.url)}
                  alt={d.nom ?? d.fileName ?? 'Photo'}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Documents */}
      {docs.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-earth text-lg mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
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
                  <div className="w-10 h-10 rounded-md bg-ocean/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-ocean" strokeWidth={1.75} />
                  </div>
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
    </div>
  )
}

function RevenusList({
  proprieteId,
  mesRevenus,
}: {
  proprieteId: number
  mesRevenus: import('@/lib/api/types').RevenuResponse[]
}) {
  const filtered = mesRevenus.filter((r) => r.proprieteId === proprieteId)

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-md border border-dashed border-earth/15 p-6 text-center">
        <p className="font-body text-earth-500 text-sm">
          Aucun revenu déclaré pour cette propriété.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {filtered.map((r) => (
        <li
          key={r.id}
          className="bg-white rounded-md border border-earth/8 p-4 flex items-center justify-between gap-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Money
                amount={r.montantTotal}
                mono={false}
                className="font-mono font-bold text-earth text-base"
              />
              {r.statut && <StatusBadge status={r.statut} size="sm" />}
            </div>
            {(r.periodeDebut || r.periodeFin) && (
              <p className="font-body text-earth-500 text-xs">
                Période : {r.periodeDebut ?? '—'} → {r.periodeFin ?? '—'}
              </p>
            )}
            {r.statut === 'REFUSE' && r.motifRefus && (
              <p className="font-body text-error text-xs mt-1">
                Motif : {r.motifRefus}
              </p>
            )}
          </div>
          <span className="font-mono text-earth-500 text-xs whitespace-nowrap">
            {r.date
              ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(r.date))
              : ''}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Phase 10b : badge declaration mensuelle dans le header de la fiche bien. */
function DeclarationBadgeForPropriete({ proprieteId }: { proprieteId: number }) {
  const { data } = useStatutDeclaration(proprieteId)
  if (!data) return null
  return <StatutDeclarationBadge statut={data} />
}

/**
 * Phase Certification (Hugh 22/05/2026) : section certification cote proprio.
 * Upload des documents legaux + bouton "Soumettre pour certification".
 */
function CertificationSection({
  propriete,
  proprieteId,
}: {
  propriete: ProprieteResponse
  proprieteId: number
}) {
  const [files, setFiles] = useState<File[]>([])
  const upload = useUploadDocsCertification()
  const soumettre = useSoumettreCertification()

  const statut = propriete.statutCertif ?? 'NON_CERTIFIE'
  const certifie = statut === 'CERTIFIE'
  const enReview = statut === 'EN_REVIEW'
  const refusee = statut === 'REFUSEE'

  // Documents légaux uploadés = Document type=PDF + sectionPhoto=null
  const docsLegaux = (propriete.documents ?? []).filter(
    (d) => (d.type === 'PDF' || !d.type) && !(d as { sectionPhoto?: string }).sectionPhoto
  )

  function handleFileChange(list: FileList | null) {
    if (!list) return
    const arr = Array.from(list).filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} : trop volumineux (max 10 MB)`)
        return false
      }
      return true
    })
    setFiles((prev) => [...prev, ...arr])
  }

  function doUpload() {
    if (files.length === 0) return
    upload.mutate(
      { proprieteId, documents: files },
      {
        onSuccess: () => {
          toast.success(`${files.length} document(s) uploadé(s).`)
          setFiles([])
        },
        onError: (e) => toast.error(extractApiError(e, 'Upload impossible.')),
      }
    )
  }

  function doSoumettre() {
    soumettre.mutate(proprieteId, {
      onSuccess: () =>
        toast.success("Demande de certification soumise. L'admin va l'examiner."),
      onError: (e) => toast.error(extractApiError(e, 'Soumission impossible.')),
    })
  }

  return (
    <section
      className={cn(
        'rounded-xl border-[1.5px] p-5 sm:p-6',
        certifie
          ? 'border-success/40 bg-success/5'
          : enReview
            ? 'border-ocean/30 bg-ocean/5'
            : refusee
              ? 'border-error/30 bg-error/5'
              : 'border-warning/30 bg-warning/5'
      )}
    >
      <header className="flex items-start gap-3 mb-4">
        <div
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0',
            certifie
              ? 'bg-success/15 text-success'
              : enReview
                ? 'bg-ocean/15 text-ocean'
                : refusee
                  ? 'bg-error/15 text-error'
                  : 'bg-warning/15 text-warning'
          )}
        >
          <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <h2 className="font-display font-semibold text-earth text-lg">
            Certification
          </h2>
          <p className="font-body text-earth-600 text-sm mt-0.5">
            {certifie && '✓ Votre bien est certifié — les investisseurs peuvent acheter.'}
            {enReview && '⏳ Demande en cours d\'examen par l\'admin.'}
            {refusee && '✗ Certification refusée. Re-uploadez les documents corrigés et resoumettez.'}
            {statut === 'NON_CERTIFIE' && (
              <>
                Uploadez les documents légaux (titre foncier, contrat de propriété…)
                puis soumettez pour certification. <strong>Sans certification, les
                investisseurs ne peuvent pas acheter de parts.</strong>
              </>
            )}
          </p>
          {refusee && propriete.certifMotifRefus && (
            <p className="mt-2 inline-block bg-white/80 border border-error/30 rounded-md px-3 py-1.5 text-xs font-body text-error">
              <strong>Motif :</strong> {propriete.certifMotifRefus}
            </p>
          )}
        </div>
      </header>

      {/* Liste des docs uploadés */}
      {docsLegaux.length > 0 && (
        <div className="bg-white border border-earth/8 rounded-md p-3 mb-4">
          <p className="font-body font-semibold text-earth text-xs mb-2 inline-flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
            {docsLegaux.length} document(s) déjà uploadé(s)
          </p>
          <ul className="space-y-1">
            {docsLegaux.map((d) => (
              <li key={d.id} className="font-body text-xs text-earth-600 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-earth-400" strokeWidth={1.75} />
                <span className="truncate">{d.nom ?? d.fileName ?? '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload zone (sauf si CERTIFIE) */}
      {!certifie && (
        <>
          <label
            htmlFor="certif-upload"
            className="flex items-center justify-center gap-2 h-14 rounded-md border-2 border-dashed border-sand-400 cursor-pointer hover:border-terra/40 hover:bg-white/40 transition-colors mb-3"
          >
            <Upload className="w-4 h-4 text-earth-500" strokeWidth={1.75} />
            <span className="font-body text-sm text-earth-700">
              Ajouter un document légal (PDF, max 10 MB)
            </span>
            <input
              id="certif-upload"
              type="file"
              accept="application/pdf,image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files)}
            />
          </label>

          {files.length > 0 && (
            <div className="bg-white border border-earth/8 rounded-md p-3 mb-3 space-y-1.5">
              <p className="font-body font-semibold text-earth text-xs mb-1">
                À uploader ({files.length})
              </p>
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-body text-earth-600 truncate flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-earth-400" strokeWidth={1.75} />
                    {f.name} <span className="text-earth-400">({(f.size / 1024).toFixed(0)} KB)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                    className="text-earth-400 hover:text-error"
                    aria-label="Retirer"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2">
            {files.length > 0 && (
              <Button
                variant="outline"
                onClick={doUpload}
                disabled={upload.isPending}
                className="sm:flex-1"
              >
                {upload.isPending ? (
                  <>
                    <Loader2 className="animate-spin" strokeWidth={2} />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload strokeWidth={2} />
                    Uploader {files.length} fichier(s)
                  </>
                )}
              </Button>
            )}
            {!enReview && docsLegaux.length > 0 && (
              <Button
                onClick={doSoumettre}
                disabled={soumettre.isPending}
                className="sm:flex-[2]"
              >
                {soumettre.isPending ? (
                  <>
                    <Loader2 className="animate-spin" strokeWidth={2} />
                    Soumission...
                  </>
                ) : (
                  <>
                    <CheckCircle2 strokeWidth={2} />
                    {refusee ? 'Resoumettre pour certification' : 'Soumettre pour certification'}
                  </>
                )}
              </Button>
            )}
          </div>
        </>
      )}

      {certifie && propriete.certifieLe && (
        <p className="font-body text-xs text-earth-500 mt-2">
          Certifié le {new Date(propriete.certifieLe).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}
    </section>
  )
}

function Meta({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: typeof CalendarDays
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center shrink-0 border border-earth/8">
        <Icon className="w-4 h-4 text-earth-500" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="font-body text-xs text-earth-500">{label}</p>
        <p className="font-body text-sm text-earth font-medium break-words">{children}</p>
      </div>
    </div>
  )
}

function Tag({ icon: Icon, children }: { icon: typeof CalendarDays; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-earth/10 text-xs font-body font-medium text-earth">
      <Icon className="w-3.5 h-3.5 text-terra" strokeWidth={1.75} />
      {children}
    </span>
  )
}
