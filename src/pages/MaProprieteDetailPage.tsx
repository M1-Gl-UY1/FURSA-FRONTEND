import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Bed,
  Building2,
  CalendarClock,
  CalendarDays,
  Clock,
  Coins,
  FileText,
  Globe,
  Home as HomeIcon,
  ImageIcon,
  LayoutGrid,
  Link2,
  MapPin,
  PlayCircle,
  Plus,
  Ruler,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

import { Money } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMesRevenus, useStatutDeclaration } from '@/lib/api/revenus'
import { useMaProprieteProposee } from '@/lib/api/submissions'
import { useEquipements } from '@/lib/api/equipements'
import { getEquipementsMetaList } from '@/lib/equipementsMeta'
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
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
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
        </div>
        <ModifierProprieteButton propriete={p} />
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
          <Meta icon={Building2} label="Type de bien">{p.typeBienLabel ?? p.typeBien ?? '—'}</Meta>
          <Meta icon={Ruler} label="Superficie">
            {p.superficieM2 ? `${p.superficieM2} m²` : '—'}
          </Meta>
          <Meta icon={LayoutGrid} label="Nombre de pieces">{p.nombrePieces ?? '—'}</Meta>
          <Meta icon={Bed} label="Nombre de chambres">{p.nombreChambres ?? '—'}</Meta>
        </div>

        <EquipementsList codes={p.equipementsCodes ?? null} />
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

      {/* V2 I (06/06/2026) : phase Certification supprimee. Le bien valide
          par l'admin (PUBLIEE) est directement achetable, sans second tour
          de validation des memes documents legaux. */}

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
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-display font-semibold text-earth text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
            Photos ({photos.length})
          </h2>
          {/* V2 G.7 (05/06/2026) : bouton d'ajout post-tokenisation. */}
          {(p.statut === 'ACCEPTEE'
            || p.statut === 'EN_TOKENISATION'
            || p.statut === 'PUBLIEE') && (
            <AjouterPhotosButton proprieteId={p.id} />
          )}
        </div>
        {photos.length > 0 ? (
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
        ) : (
          <p className="font-body text-sm text-earth-500 italic">
            Aucune photo encore. Utilisez le bouton « Ajouter des photos » ci-dessus pour enrichir la fiche.
          </p>
        )}
      </section>

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
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-body text-earth text-sm">
                      {d.nom ?? d.fileName ?? d.url}
                    </p>
                    {/* V2 G.2 : label resolu cote backend. */}
                    {(d.categorieDocumentLabel || d.categorieDocument) && (
                      <p className="font-body text-[11px] text-earth-500">
                        {d.categorieDocumentLabel ?? d.categorieDocument}
                      </p>
                    )}
                  </div>
                  <span className="text-earth-500 text-xs shrink-0">Ouvrir</span>
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

/**
 * V2 G.1 (04/06/2026) : affiche les equipements d'un bien depuis ses codes
 * (admin-configurables). Resout les labels et icones via getEquipementsMetaList
 * (legacy + API).
 */
function EquipementsList({ codes }: { codes: string[] | null }) {
  const { data: apiList } = useEquipements()
  if (!codes || codes.length === 0) return null
  const items = getEquipementsMetaList(codes, apiList)
  if (items.length === 0) return null
  return (
    <div>
      <p className="font-body text-xs uppercase tracking-wider text-earth-500 font-semibold mb-2">Equipements</p>
      <div className="flex flex-wrap gap-2">
        {items.map((eq) => (
          <Tag key={eq.code} icon={eq.icon}>{eq.label}</Tag>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Bouton "Modifier" + modal (Phase E - 04/06/2026)
// =============================================================================

import { Edit3, Upload as UploadIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAjouterPhotosPostTokenisation, useModifierMaPropriete } from '@/lib/api/proprietes'
import { useSectionsPhoto } from '@/lib/api/sectionsPhoto'
import type { BrouillonPatch } from '@/lib/api/brouillon'

// =============================================================================
// V2 G.7 (05/06/2026) : Bouton "Ajouter des photos" post-tokenisation
// =============================================================================

function AjouterPhotosButton({ proprieteId }: { proprieteId: number }) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [section, setSection] = useState<string>('')
  const { data: sectionsApi } = useSectionsPhoto()
  const ajouter = useAjouterPhotosPostTokenisation()

  const sectionsList = sectionsApi && sectionsApi.length > 0
    ? sectionsApi
    : [
        { code: 'FACADE', label: 'Façade avant' },
        { code: 'SALON', label: 'Salon' },
        { code: 'CUISINE', label: 'Cuisine' },
        { code: 'CHAMBRE', label: 'Chambres' },
        { code: 'SALLE_DE_BAIN', label: 'Salle de bain' },
        { code: 'PISCINE', label: 'Piscine' },
        { code: 'EXTERIEUR', label: 'Extérieur / jardin' },
        { code: 'VUE', label: 'Vue' },
        { code: 'AUTRE', label: 'Autres photos' },
      ]

  function reset() {
    setFiles([])
    setSection('')
  }

  function submit() {
    if (files.length === 0) {
      toast.error('Sélectionnez au moins une photo.')
      return
    }
    if (!section) {
      toast.error('Choisissez la section pour ces photos.')
      return
    }
    ajouter.mutate(
      {
        proprieteId,
        photos: files,
        sections: files.map(() => section),
      },
      {
        onSuccess: () => {
          toast.success(`${files.length} photo(s) ajoutée(s)`)
          reset()
          setOpen(false)
        },
        onError: (err) =>
          toast.error(extractApiError(err, 'Upload impossible.')),
      }
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Ajouter des photos
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UploadIcon className="w-5 h-5 text-terra" />
              Ajouter des photos
            </DialogTitle>
            <DialogDescription>
              Enrichissez votre fiche avec de nouvelles photos.
              Toutes les photos sélectionnées seront classées dans la même section.
              Refaites plusieurs uploads pour des sections différentes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="apb-section" className="font-body text-sm font-semibold text-earth">
                Section <span className="text-error">*</span>
              </label>
              <select
                id="apb-section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full h-10 rounded-md border-[1.5px] border-sand-400 bg-white px-3 text-sm font-body text-earth"
              >
                <option value="">— Choisir —</option>
                {sectionsList.map((s) => (
                  <option key={s.code} value={s.code}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="apb-files" className="font-body text-sm font-semibold text-earth">
                Photos (JPG / PNG / WEBP) <span className="text-error">*</span>
              </label>
              <Input
                id="apb-files"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              {files.length > 0 && (
                <p className="font-body text-xs text-earth-500">
                  {files.length} fichier(s) sélectionné(s) ({(files.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} Mo total)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { reset(); setOpen(false) }} disabled={ajouter.isPending}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={ajouter.isPending}>
              {ajouter.isPending ? 'Envoi...' : 'Uploader'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ModifierProprieteButton({ propriete: p }: { propriete: ProprieteResponse }) {
  const [open, setOpen] = useState(false)
  const modifier = useModifierMaPropriete()
  const [form, setForm] = useState<{ nom: string; description: string }>(() => ({
    nom: p.nom ?? '',
    description: p.description ?? '',
  }))

  // BROUILLON : modification via le wizard auto-save (-> redirection)
  if (p.statut === 'BROUILLON') {
    return (
      <Button asChild variant="outline">
        <Link to={`/proposer-un-bien/${p.id}`}>
          <Edit3 className="w-4 h-4" strokeWidth={1.75} />
          Continuer la soumission
        </Link>
      </Button>
    )
  }

  // REFUSEE : doit re-soumettre, pas de modification possible
  if (p.statut === 'REFUSEE') {
    return (
      <Button asChild>
        <Link to="/proposer-un-bien">
          <Edit3 className="w-4 h-4" strokeWidth={1.75} />
          Soumettre à nouveau
        </Link>
      </Button>
    )
  }

  // Apres tokenisation : seuls nom + description sont modifiables.
  const isAfterTokenisation = p.statut === 'EN_TOKENISATION'
    || p.statut === 'PUBLIEE'
    || p.statut === 'EN_ATTENTE'

  function handleSave() {
    const patch: BrouillonPatch = {
      nom: form.nom.trim() || undefined,
      description: form.description.trim() || undefined,
    }
    modifier.mutate(
      { id: p.id, patch },
      {
        onSuccess: () => {
          toast.success('Modifications enregistrées.')
          setOpen(false)
        },
        onError: (err: unknown) => {
          toast.error(extractApiError(err, 'Modification impossible.'))
        },
      }
    )
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Edit3 className="w-4 h-4" strokeWidth={1.75} />
        Modifier
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-earth text-xl">
              Modifier la propriété
            </DialogTitle>
            <DialogDescription className="font-body text-earth-600 text-sm">
              {isAfterTokenisation ? (
                <>Après tokenisation, seuls le <strong>nom</strong> et la <strong>description</strong> sont modifiables. Les autres caractéristiques sont figées on-chain.</>
              ) : (
                <>Vous pouvez modifier le nom et la description. Les caractéristiques (type, équipements, finance) sont à modifier via le wizard de re-soumission si nécessaire.</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="font-body text-sm font-semibold text-earth block mb-1.5">
                Nom du bien
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                maxLength={120}
                placeholder="Ex : Villa Paje vue mer"
                title="Nom du bien"
                aria-label="Nom du bien"
                className="w-full px-3 py-2 rounded-md border-[1.5px] border-sand-400 bg-white text-sm text-earth font-body focus:border-terra focus:ring-2 focus:ring-terra/15 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-body text-sm font-semibold text-earth block mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={6}
                maxLength={2000}
                placeholder="Décrivez le bien : emplacement, équipements, atouts pour un investisseur..."
                title="Description du bien"
                aria-label="Description du bien"
                className="w-full px-3 py-2 rounded-md border-[1.5px] border-sand-400 bg-white text-sm text-earth font-body focus:border-terra focus:ring-2 focus:ring-terra/15 focus:outline-none resize-vertical"
              />
              <p className="text-xs text-earth-500 mt-1">{form.description.length} / 2000 caractères</p>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={modifier.isPending}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={modifier.isPending || !form.nom.trim()}>
              {modifier.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
