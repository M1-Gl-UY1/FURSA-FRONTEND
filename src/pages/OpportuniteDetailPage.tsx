import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  TrendingUp,
  PieChart,
  Coins,
  FileText,
  Share2,
  AlertTriangle,
  ShieldAlert,
  BadgeCheck,
  Home,
  Bed,
  Ruler,
  LayoutGrid,
  Waves,
  Wind,
  Car,
  Building2,
  Trees,
  Eye,
  PlayCircle,
  Sparkles,
  CalendarClock,
  Clock,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import { PropertyGallery } from '@/components/properties/PropertyGallery'
import { WaitlistModal } from '@/components/properties/WaitlistModal'
import { Money } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { Sparkline } from '@/components/shared/Sparkline'
import { useEscrowPropriete } from '@/lib/api/escrow'
import {
  useDesinscrireListeAttente,
  useMesInscriptions,
} from '@/lib/api/liste-attente'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  calculatePartsVendues,
  calculatePourcentageVendu,
  calculateVariationPrix,
  useHistoriquePrix,
  usePropriete,
} from '@/lib/api/proprietes'
import { useAuth } from '@/lib/auth/AuthContext'
import type { ProprieteResponse, TypeBien } from '@/lib/api/types'

const TYPE_BIEN_LABELS: Record<TypeBien, string> = {
  VILLA: 'Villa',
  APPARTEMENT: 'Appartement',
  STUDIO: 'Studio',
  PENTHOUSE: 'Penthouse',
  DUPLEX: 'Duplex',
  IMMEUBLE: 'Immeuble',
  CHAMBRE: 'Chambre',
}

const SOURCE_REVENU_LABELS: Record<string, string> = {
  BAIL: 'Bail long terme',
  AIRBNB: 'Location courte durée (Airbnb)',
  AUTRE: 'Autre',
}

export function OpportuniteDetailPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : NaN

  if (Number.isNaN(id)) {
    return <Navigate to="/opportunites" replace />
  }

  const { data: propriete, isLoading, isError } = usePropriete(id)
  const { isAdmin, isAuthenticated } = useAuth()
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const { data: mesInscriptions } = useMesInscriptions(isAuthenticated && !isAdmin)
  const desinscrire = useDesinscrireListeAttente()

  if (isLoading) return <DetailSkeleton />

  if (isError || !propriete) {
    return (
      <div className="max-w-container mx-auto py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-earth text-xl mb-2">
          Propriété introuvable
        </h2>
        <p className="font-body text-earth-600 text-sm mb-6">
          Cette opportunité n'existe pas ou a été retirée.
        </p>
        <Button asChild>
          <Link to="/opportunites">Retour aux opportunités</Link>
        </Button>
      </div>
    )
  }

  const pourcentage = calculatePourcentageVendu(propriete)
  const partsVendues = calculatePartsVendues(propriete)
  const partsTotales = propriete.nombreTotalPart ?? propriete.partsTotales ?? 0
  const variationPrix = calculateVariationPrix(propriete)
  const isPubliee = propriete.statut === 'PUBLIEE'
  const sansParts = (propriete.partsDisponibles ?? 0) <= 0
  const { data: escrow } = useEscrowPropriete(isPubliee ? propriete.id : null)
  const { data: historiquePrix } = useHistoriquePrix(propriete.id)
  const sparklineValues = (historiquePrix ?? []).map((h) => h.prixUnitaire)

  const equipements = collectEquipements(propriete)
  const caracteristiques = collectCaracteristiques(propriete)
  const isCertifie = propriete.certifie === true || propriete.statutCertif === 'CERTIFIE'

  function share() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: propriete?.nom, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success('Lien copié !'))
    }
  }

  const localisationFull = [propriete.adressePrecise, propriete.ville, propriete.pays]
    .filter(Boolean)
    .join(', ') || propriete.localisation

  return (
    <div className="max-w-container mx-auto">
      {/* Back link */}
      <Link
        to="/opportunites"
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour aux opportunités
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-10 items-start">
        {/* Colonne gauche : galerie + contenu */}
        <div>
          <PropertyGallery photos={propriete.photos} alt={propriete.nom} />

          {/* Header titre + meta */}
          <header className="mt-6 mb-8">
            <div className="flex items-center flex-wrap gap-2 mb-3">
              {propriete.statut && <StatusBadge status={propriete.statut} />}
              {sansParts && <StatusBadge status="FINANCEE" />}
              {isCertifie && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 text-success font-body text-xs font-semibold">
                  <BadgeCheck className="w-3.5 h-3.5" strokeWidth={2} />
                  Certifié Fursa
                </span>
              )}
              {propriete.typeBien && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-terra/10 text-terra font-body text-xs font-semibold">
                  <Home className="w-3.5 h-3.5" strokeWidth={2} />
                  {TYPE_BIEN_LABELS[propriete.typeBien]}
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl lg:text-4xl mb-2 leading-tight">
              {propriete.nom}
            </h1>
            <p className="flex items-center gap-1.5 text-earth-600 text-sm font-body">
              <MapPin className="w-4 h-4" strokeWidth={1.75} />
              {localisationFull}
            </p>
          </header>

          {/* Bandeau caractéristiques */}
          {caracteristiques.length > 0 && (
            <section className="mb-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {caracteristiques.map((c) => (
                  <div
                    key={c.label}
                    className="bg-sand-100 rounded-lg p-4 border border-earth/5"
                  >
                    <div className="flex items-center gap-2 text-earth-500 mb-1">
                      <c.icon className="w-4 h-4" strokeWidth={1.75} />
                      <span className="font-body text-xs uppercase tracking-wide">
                        {c.label}
                      </span>
                    </div>
                    <p className="font-mono font-bold text-earth text-lg">{c.value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Description */}
          {propriete.description && (
            <section className="mb-8">
              <h2 className="font-display font-semibold text-earth text-xl mb-3">
                À propos de ce bien
              </h2>
              <p className="font-body text-earth-700 text-base leading-relaxed whitespace-pre-line">
                {propriete.description}
              </p>
            </section>
          )}

          {/* Équipements */}
          {equipements.length > 0 && (
            <section className="mb-8">
              <h2 className="font-display font-semibold text-earth text-xl mb-4">
                Équipements & confort
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {equipements.map((e) => (
                  <div
                    key={e.label}
                    className="flex items-center gap-3 p-3 bg-white border border-earth/8 rounded-lg"
                  >
                    <div className="w-9 h-9 rounded-md bg-ocean/10 flex items-center justify-center shrink-0">
                      <e.icon className="w-4 h-4 text-ocean" strokeWidth={1.75} />
                    </div>
                    <span className="font-body text-earth-700 text-sm font-medium">
                      {e.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Exploitation / Pourquoi investir */}
          {(propriete.statutExploitation || propriete.sourceRevenu || propriete.revenuMensuelActuel) && (
            <section className="mb-8">
              <h2 className="font-display font-semibold text-earth text-xl mb-4">
                Pourquoi investir ici
              </h2>
              <div className="bg-gradient-to-br from-sand-100 to-sand-50 border border-earth/8 rounded-xl p-5 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {propriete.statutExploitation && (
                    <ExploitItem
                      icon={propriete.statutExploitation === 'DEJA_RENTABLE' ? Sparkles : CalendarClock}
                      label="État"
                      value={
                        propriete.statutExploitation === 'DEJA_RENTABLE'
                          ? 'Déjà en exploitation, génère des revenus'
                          : 'Neuf — premiers revenus à venir'
                      }
                    />
                  )}
                  {propriete.sourceRevenu && (
                    <ExploitItem
                      icon={TrendingUp}
                      label="Mode d'exploitation"
                      value={SOURCE_REVENU_LABELS[propriete.sourceRevenu] ?? propriete.sourceRevenu}
                    />
                  )}
                  {propriete.revenuMensuelActuel != null && propriete.revenuMensuelActuel > 0 && (
                    <ExploitItem
                      icon={Coins}
                      label="Revenu mensuel actuel"
                      value={<Money amount={propriete.revenuMensuelActuel} mono={false} />}
                    />
                  )}
                  {propriete.rentabilitePrevue != null && (
                    <ExploitItem
                      icon={PieChart}
                      label="Rentabilité prévue"
                      value={`${propriete.rentabilitePrevue}% / an`}
                    />
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Vidéo de visite */}
          {propriete.videoUrl && (
            <section className="mb-8">
              <h2 className="font-display font-semibold text-earth text-xl mb-3 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-terra" strokeWidth={1.75} />
                Vidéo de visite
              </h2>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-earth shadow-card">
                <video
                  src={propriete.videoUrl}
                  controls
                  preload="metadata"
                  className="w-full h-full"
                >
                  Votre navigateur ne prend pas en charge la lecture vidéo.
                </video>
              </div>
            </section>
          )}

          {/* Documents */}
          {propriete.documents && propriete.documents.length > 0 && (
            <section className="mb-8">
              <h2 className="font-display font-semibold text-earth text-xl mb-3">
                Documents légaux
              </h2>
              <ul className="space-y-2">
                {propriete.documents
                  .filter((doc) => doc.type === 'PDF' || !doc.sectionPhoto)
                  .map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-sand-100 hover:bg-sand-200 rounded-lg border border-earth/5 text-earth font-body text-sm transition-colors"
                      >
                        <div className="w-10 h-10 rounded-md bg-ocean/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-ocean" strokeWidth={1.75} />
                        </div>
                        <span className="flex-1 truncate">{doc.nom ?? doc.fileName}</span>
                        <span className="text-earth-500 text-xs">Ouvrir</span>
                      </a>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>

        {/* Colonne droite : sticky panel achat */}
        <aside className="lg:sticky lg:top-20">
          <div className="bg-white rounded-xl border border-earth/8 shadow-card overflow-hidden">
            {/* Header panel avec accent terra */}
            <div className="bg-gradient-to-br from-terra to-terra-600 p-5 text-white">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <p className="font-body text-xs uppercase tracking-widest opacity-90">
                  Prix par part
                </p>
                {variationPrix != null && Math.abs(variationPrix) >= 0.5 && (
                  <span
                    className="font-mono text-xs font-bold tabular-nums bg-white/15 backdrop-blur-sm rounded-full px-2 py-0.5"
                    title="Variation depuis la mise en vente initiale"
                  >
                    {variationPrix > 0 ? '+' : ''}
                    {variationPrix.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="font-mono font-bold text-3xl sm:text-4xl">
                <Money amount={propriete.prixUnitairePart} mono={false} />
              </p>
              {sparklineValues.length > 1 ? (
                <div className="mt-3 flex items-center gap-2">
                  <Sparkline
                    values={sparklineValues}
                    width={160}
                    height={28}
                    color="#ffffff"
                    className="opacity-90"
                  />
                  <span className="font-body text-[10px] opacity-75">
                    {sparklineValues.length} pts
                  </span>
                </div>
              ) : (
                <p className="font-body text-xs mt-1 opacity-90">
                  Investissement minimum
                </p>
              )}
            </div>

            <div className="p-5 sm:p-6">
              {/* KPIs */}
              <dl className="space-y-4 mb-5 pb-5 border-b border-earth/8">
                <KpiRow
                  icon={TrendingUp}
                  label="Rentabilité estimée"
                  value={`${propriete.rentabilitePrevue ?? 0}% / an`}
                  accent="success"
                />
                <KpiRow
                  icon={PieChart}
                  label="Parts disponibles"
                  value={`${(propriete.partsDisponibles ?? 0).toLocaleString('fr-FR')} / ${partsTotales.toLocaleString('fr-FR')}`}
                />
                <KpiRow
                  icon={CalendarClock}
                  label="Distribution"
                  value="Trimestrielle"
                />
              </dl>

              {/* Progression */}
              <div className="mb-5">
                <div className="flex items-baseline justify-between mb-2">
                  <p className="font-body text-xs text-earth-500 uppercase tracking-wide">
                    Financement
                  </p>
                  <p className="font-mono text-xs text-earth-600 tabular-nums">
                    {pourcentage.toFixed(0)}%
                  </p>
                </div>
                <ProgressBar value={pourcentage} />
                <p className="mt-2 font-mono text-[11px] text-earth-500">
                  {partsVendues.toLocaleString('fr-FR')} parts vendues
                </p>
                {escrow && (
                  <p className="mt-2 font-body text-[11px] text-earth-500 inline-flex items-center gap-1">
                    {escrow.statut === 'FINANCEE' ? (
                      <span className="text-success font-semibold">
                        ✓ Seuil {escrow.seuilPct}% atteint — dividendes en cours
                      </span>
                    ) : escrow.statut === 'ANNULEE' ? (
                      <span className="text-error font-semibold">
                        Collecte annulée — investisseurs remboursés
                      </span>
                    ) : (
                      <>
                        Seuil de déblocage à <strong>{escrow.seuilPct}%</strong>
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* CTA — masqué pour les admins (conflit d'intérêt + délit d'initié) */}
              {isAdmin ? (
                <div className="bg-warning/10 border border-warning/30 rounded-md p-4 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <p className="font-body font-semibold text-earth text-sm mb-1">
                      Achat indisponible pour les administrateurs
                    </p>
                    <p className="font-body text-earth-600 text-xs leading-relaxed">
                      Pour préserver la neutralité de la plateforme, les comptes admin ne peuvent pas investir.
                    </p>
                  </div>
                </div>
              ) : isPubliee && !sansParts ? (
                <Button size="lg" className="w-full" asChild>
                  <Link to={`/opportunites/${propriete.id}/acheter`}>
                    Acheter des parts
                    <ArrowRight className="ml-1" strokeWidth={2} />
                  </Link>
                </Button>
              ) : isPubliee && sansParts ? (
                <WaitlistCTA
                  proprieteId={propriete.id}
                  proprieteNom={propriete.nom}
                  inscriptions={mesInscriptions ?? []}
                  onOpen={() => setWaitlistOpen(true)}
                  onCancel={(id) =>
                    desinscrire.mutate(id, {
                      onSuccess: () =>
                        toast.success('Inscription annulée.'),
                      onError: () =>
                        toast.error('Annulation impossible.'),
                    })
                  }
                  cancelling={desinscrire.isPending}
                />
              ) : (
                <Button size="lg" className="w-full" disabled>
                  <span>Indisponible</span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="default"
                className="w-full mt-2"
                onClick={share}
              >
                <Share2 className="w-4 h-4" strokeWidth={1.75} />
                Partager
              </Button>

              {/* Mini-reassurance */}
              {isCertifie && (
                <div className="mt-5 pt-5 border-t border-earth/8 flex items-start gap-2.5">
                  <BadgeCheck className="w-4 h-4 text-success shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="font-body text-xs text-earth-600 leading-relaxed">
                    Bien <strong>certifié Fursa</strong> : documents légaux vérifiés,
                    inspection physique réalisée.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* P2 — Modal liste d'attente */}
      <WaitlistModal
        open={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        proprieteId={propriete.id}
        proprieteNom={propriete.nom}
      />
    </div>
  )
}

// --- Waitlist CTA ---

import type { ListeAttenteResponse } from '@/lib/api/types'

function WaitlistCTA({
  proprieteId,
  proprieteNom: _proprieteNom,
  inscriptions,
  onOpen,
  onCancel,
  cancelling,
}: {
  proprieteId: number
  proprieteNom: string
  inscriptions: ListeAttenteResponse[]
  onOpen: () => void
  onCancel: (id: number) => void
  cancelling: boolean
}) {
  const monInscription = inscriptions.find(
    (i) =>
      i.proprieteId === proprieteId &&
      (i.statut === 'EN_ATTENTE' || i.statut === 'NOTIFIE')
  )

  if (monInscription) {
    return (
      <div className="space-y-2">
        <div className="bg-terra/8 border border-terra/25 rounded-md p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-terra/15 flex items-center justify-center">
              <Clock className="w-4 h-4 text-terra" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-earth text-sm">
                Vous êtes en liste d'attente
              </p>
              <p className="font-body text-earth-600 text-xs">
                {monInscription.nombreParts} part{monInscription.nombreParts > 1 ? 's' : ''} demandée{monInscription.nombreParts > 1 ? 's' : ''}
                {monInscription.position
                  ? ` · position #${monInscription.position} dans la file`
                  : ''}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onCancel(monInscription.id)}
            disabled={cancelling}
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
            Annuler mon inscription
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button size="lg" className="w-full" onClick={onOpen}>
      <Clock className="w-4 h-4" strokeWidth={1.75} />
      S'inscrire en liste d'attente
    </Button>
  )
}

// --- Helpers ---

type Carac = { icon: LucideIcon; label: string; value: string }

function collectCaracteristiques(p: ProprieteResponse): Carac[] {
  const out: Carac[] = []
  if (p.typeBien) {
    out.push({ icon: Home, label: 'Type', value: TYPE_BIEN_LABELS[p.typeBien] })
  }
  if (p.nombrePieces != null && p.nombrePieces > 0) {
    out.push({ icon: LayoutGrid, label: 'Pièces', value: String(p.nombrePieces) })
  }
  if (p.nombreChambres != null && p.nombreChambres > 0) {
    out.push({ icon: Bed, label: 'Chambres', value: String(p.nombreChambres) })
  }
  if (p.superficieM2 != null && p.superficieM2 > 0) {
    out.push({ icon: Ruler, label: 'Superficie', value: `${p.superficieM2} m²` })
  }
  return out
}

type Equip = { icon: LucideIcon; label: string }

function collectEquipements(p: ProprieteResponse): Equip[] {
  const out: Equip[] = []
  if (p.hasPiscine) out.push({ icon: Waves, label: 'Piscine' })
  if (p.hasClimatisation) out.push({ icon: Wind, label: 'Climatisation' })
  if (p.hasParking) out.push({ icon: Car, label: 'Parking' })
  if (p.hasAscenseur) out.push({ icon: Building2, label: 'Ascenseur' })
  if (p.hasJardin) out.push({ icon: Trees, label: 'Jardin' })
  if (p.hasVueMer) out.push({ icon: Eye, label: 'Vue mer' })
  return out
}

// --- Sous-composants ---

type KpiRowProps = {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  accent?: 'success' | 'default'
}

function KpiRow({ icon: Icon, label, value, accent = 'default' }: KpiRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={
          accent === 'success'
            ? 'w-9 h-9 rounded-md bg-success/10 flex items-center justify-center shrink-0'
            : 'w-9 h-9 rounded-md bg-ocean/10 flex items-center justify-center shrink-0'
        }
      >
        <Icon
          className={accent === 'success' ? 'w-4 h-4 text-success' : 'w-4 h-4 text-ocean'}
          strokeWidth={1.75}
        />
      </div>
      <div className="min-w-0">
        <dt className="font-body text-xs text-earth-500 mb-0.5">{label}</dt>
        <dd className="font-mono font-semibold text-earth text-sm">{value}</dd>
      </div>
    </div>
  )
}

type ExploitItemProps = {
  icon: LucideIcon
  label: string
  value: React.ReactNode
}

function ExploitItem({ icon: Icon, label, value }: ExploitItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-terra/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-terra" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-body text-xs uppercase tracking-wide text-earth-500 mb-1">
          {label}
        </p>
        <p className="font-body text-earth font-semibold text-sm">{value}</p>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="max-w-container mx-auto">
      <Skeleton className="h-4 w-40 mb-5 bg-sand-300" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        <div>
          <Skeleton className="aspect-[16/9] w-full rounded-xl bg-sand-300" />
          <Skeleton className="h-8 w-2/3 mt-6 bg-sand-300" />
          <Skeleton className="h-4 w-1/3 mt-3 bg-sand-300" />
        </div>
        <Skeleton className="h-96 rounded-xl bg-sand-300" />
      </div>
    </div>
  )
}
