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
import { PropertyGallery } from '@/components/properties/PropertyGallery'
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
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  usePublierPropriete,
  useRefuserPropriete,
  useSupprimerPropriete,
  useToggleAcquisFursa,
  useTokeniserPropriete,
  useValiderPropriete,
} from '@/lib/api/admin'
import { extractApiError } from '@/lib/api/errors'
import { fireConfetti } from '@/lib/confetti'
import { calculatePartsVendues, calculatePourcentageVendu, useAdminPropriete } from '@/lib/api/proprietes'
import { useEquipements } from '@/lib/api/equipements'
import { getEquipementsMetaList } from '@/lib/equipementsMeta'
import { resolveFileUrl } from '@/lib/utils'

export function AdminProprieteDetailPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : NaN

  if (Number.isNaN(id)) return <Navigate to="/admin/proprietes" replace />

  const navigate = useNavigate()
  const { data: p, isLoading, isError } = useAdminPropriete(id)
  const refuser = useRefuserPropriete()
  const publier = usePublierPropriete()
  const supprimer = useSupprimerPropriete()
  const toggleAcquis = useToggleAcquisFursa()
  const tokeniser = useTokeniserPropriete()
  const valider = useValiderPropriete()
  const [refusOpen, setRefusOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [validerOpen, setValiderOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-xl" />
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

  // Fix 25/05/2026 : utiliser resolveFileUrl qui gere correctement les chemins
  // /api/fichiers/* deja prefixes par le backend (mapper).
  const fileUrl = (urlOrName: string) => resolveFileUrl(urlOrName)
  const photos = p.documents?.filter((d) => d.type === 'IMAGE') ?? []
  const docs = p.documents?.filter((d) => d.type === 'PDF') ?? []

  function publish() {
    publier.mutate(p!.id, {
      onSuccess: () => {
        fireConfetti()
        toast.success('Propriété publiée. Visible sur le marché.')
      },
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
  const isTokenisation = p.statut === 'EN_TOKENISATION'

  function confirmValider() {
    valider.mutate(p!.id, {
      onSuccess: () => {
        setValiderOpen(false)
        toast.success('Propriete validee. Tokenisation en cours sur Sepolia.')
      },
      onError: (e) => toast.error(extractApiError(e, 'Validation impossible.')),
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        to="/admin/proprietes"
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour
      </Link>

      <Breadcrumbs
        items={[
          { label: 'Admin', to: '/admin' },
          { label: 'Propriétés', to: '/admin/proprietes' },
          { label: p.nom },
        ]}
        className="mt-2 mb-0"
      />

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
          {/* Workflow unifie 02/06/2026 : un seul bouton "Valider" pour EN_REVIEW.
              Il declenche : approbation + tokenisation Sepolia + publication automatique
              une fois la tx minee (le worker bascule en PUBLIEE en ~15-60s). */}
          {isReview && (
            <>
              <Button onClick={() => setValiderOpen(true)} disabled={valider.isPending}>
                <CheckCircle2 strokeWidth={2} />
                Valider la propriete
              </Button>
              <Button variant="outline" onClick={() => setRefusOpen(true)} className="text-error border-error/40 hover:bg-error/10">
                <XCircle strokeWidth={2} />
                Refuser
              </Button>
            </>
          )}
          {/* Fallback workflow legacy si une propriete est en ACCEPTEE (avant V2). */}
          {isAcceptee && (
            <Button onClick={publish} disabled={publier.isPending}>
              <Send strokeWidth={2} />
              Publier
            </Button>
          )}
          {isTokenisation && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean/10 border border-ocean/30 text-ocean">
              <span className="w-4 h-4 rounded-full border-2 border-ocean border-t-transparent animate-spin" />
              <span className="font-body text-sm font-semibold">Tokenisation en cours sur Sepolia...</span>
            </div>
          )}
          {(isPubliee || isRefusee) && (
            <Button variant="outline" onClick={() => setDeleteOpen(true)} className="text-error border-error/40 hover:bg-error/10">
              <Trash2 strokeWidth={1.75} />
              Supprimer
            </Button>
          )}
          {/* Retry manuel de la tokenisation : seulement si PUBLIEE sans tx (cas legacy) */}
          {isPubliee && !p.transactionHash && (
            <Button
              variant="outline"
              onClick={() =>
                tokeniser.mutate(p.id, {
                  onSuccess: () => {
                    fireConfetti({ count: 90, durationMs: 2800 })
                    toast.success('Propriété tokenisée sur Sepolia.')
                  },
                  onError: (e) =>
                    toast.error(extractApiError(e, 'Tokenisation impossible.')),
                })
              }
              disabled={tokeniser.isPending}
              className="text-ocean border-ocean/40 hover:bg-ocean/10"
            >
              {tokeniser.isPending ? 'Déploiement...' : 'Tokeniser sur Sepolia'}
            </Button>
          )}

          {/* P4 (Hugh 22/05/2026) : toggle flag "Acquis FURSA" */}
          <Button
            variant="outline"
            onClick={() =>
              toggleAcquis.mutate(
                { id: p.id, acquisFursa: !p.acquisFursa },
                {
                  onSuccess: () =>
                    toast.success(
                      p.acquisFursa
                        ? 'Flag "Acquis FURSA" retiré.'
                        : 'Bien marqué comme acquis par FURSA.'
                    ),
                  onError: (e) =>
                    toast.error(extractApiError(e, 'Action impossible.')),
                }
              )
            }
            disabled={toggleAcquis.isPending}
            className={
              p.acquisFursa
                ? 'text-gold-700 border-gold/40 hover:bg-gold/10'
                : 'text-earth-600 border-earth/30 hover:bg-earth/5'
            }
          >
            {p.acquisFursa ? '✓ Acquis FURSA' : 'Marquer Acquis FURSA'}
          </Button>
        </div>
      </header>

      {/* Galerie photos : hero + miniatures cliquables (gere 0, 1 ou N photos) */}
      {photos.length > 0 ? (
        <PropertyGallery photos={photos.map((d) => d.url)} alt={p.nom} />
      ) : (
        <div className="aspect-[16/9] rounded-xl bg-sand-200 border border-earth/8 flex items-center justify-center">
          <p className="font-body text-earth-500 text-sm">Aucune photo uploadee.</p>
        </div>
      )}

      {isRefusee && p.motifRefus && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-5">
          <p className="font-body font-semibold text-error text-sm mb-1">Motif du refus</p>
          <p className="font-body text-earth-700 text-sm whitespace-pre-line">{p.motifRefus}</p>
        </div>
      )}

      {/* Bloc blockchain : visible des qu'on a un txHash (donc EN_TOKENISATION ou PUBLIEE). */}
      {p.transactionHash && (
        <div className="bg-ocean/5 border border-ocean/20 rounded-xl p-5">
          <p className="font-body font-semibold text-ocean text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ocean" />
            Blockchain Sepolia
          </p>
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

      {/* Localisation complete */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
        <h2 className="font-display font-semibold text-earth text-lg mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
          Localisation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Meta icon={MapPin} label="Pays">{p.pays ?? '—'}</Meta>
          <Meta icon={MapPin} label="Ville">{p.ville ?? '—'}</Meta>
          {p.adressePrecise && (
            <Meta icon={MapPin} label="Adresse precise">{p.adressePrecise}</Meta>
          )}
        </div>
      </section>

      {/* Type & equipements */}
      {(p.typeBien || p.typeBienCode || p.superficieM2 || p.nombrePieces || p.nombreChambres) && (
        <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
          <h2 className="font-display font-semibold text-earth text-lg mb-4">
            Type & equipements
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <Meta icon={Building2} label="Type">{p.typeBienLabel ?? p.typeBien ?? '—'}</Meta>
            <Meta icon={Building2} label="Surface">
              {p.superficieM2 ? `${p.superficieM2} m²` : '—'}
            </Meta>
            <Meta icon={Building2} label="Pieces">{p.nombrePieces ?? '—'}</Meta>
            <Meta icon={Building2} label="Chambres">{p.nombreChambres ?? '—'}</Meta>
          </div>
          <AdminEquipementsChips codes={p.equipementsCodes ?? null} />
        </section>
      )}

      {/* Finance complete */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
        <h2 className="font-display font-semibold text-earth text-lg mb-4">
          Finance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {p.prixVenteTotal && (
            <Meta icon={Building2} label={`Prix total (${p.deviseLocale ?? 'devise locale'})`}>
              {Number(p.prixVenteTotal).toLocaleString('fr-FR')} {p.deviseLocale ?? ''}
            </Meta>
          )}
          {p.prixVenteTotalUsd && (
            <Meta icon={Building2} label="Equivalent USD">
              <Money amount={p.prixVenteTotalUsd} mono={false} />
            </Meta>
          )}
          {p.fractionVenduePct != null && (
            <Meta icon={Building2} label="Fraction mise en vente">{p.fractionVenduePct}%</Meta>
          )}
          {p.prixInitialPart != null && Number(p.prixInitialPart) !== Number(p.prixUnitairePart) && (
            <Meta icon={Building2} label="Prix initial par part">
              <Money amount={p.prixInitialPart} mono={false} />
            </Meta>
          )}
          {p.bonusRentabiliteTotal != null && Number(p.bonusRentabiliteTotal) > 0 && (
            <Meta icon={Building2} label="Bonus rentabilite">
              +{(Number(p.bonusRentabiliteTotal) * 100).toFixed(2)}%
            </Meta>
          )}
        </div>
      </section>

      {/* Exploitation */}
      {(p.statutExploitation || p.sourceRevenu || p.revenuMensuelActuel) && (
        <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
          <h2 className="font-display font-semibold text-earth text-lg mb-4">
            Exploitation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {p.statutExploitation && (
              <Meta icon={Building2} label="Statut exploitation">{p.statutExploitation}</Meta>
            )}
            {p.dateLivraisonPrevue && (
              <Meta icon={CalendarDays} label="Livraison prevue">{formatDate(p.dateLivraisonPrevue)}</Meta>
            )}
            {p.revenuMensuelActuel && Number(p.revenuMensuelActuel) > 0 && (
              <Meta icon={Building2} label="Revenu mensuel">
                {Number(p.revenuMensuelActuel).toLocaleString('fr-FR')} {p.deviseLocale ?? ''}
              </Meta>
            )}
            {p.sourceRevenu && (
              <Meta icon={Building2} label="Source des revenus">{p.sourceRevenu}</Meta>
            )}
          </div>
        </section>
      )}

      {/* Certification */}
      {(p.statutCertif && p.statutCertif !== 'NON_CERTIFIE') && (
        <section className="bg-ocean/5 border border-ocean/20 rounded-xl p-5">
          <h2 className="font-body font-semibold text-ocean text-sm mb-3">
            Certification
          </h2>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <Meta icon={Building2} label="Statut">{p.statutCertif}</Meta>
            {p.certifSoumiseLe && (
              <Meta icon={CalendarDays} label="Soumise le">{formatDate(p.certifSoumiseLe)}</Meta>
            )}
            {p.certifieLe && (
              <Meta icon={CalendarDays} label="Certifiee le">{formatDate(p.certifieLe)}</Meta>
            )}
          </div>
          {p.certifMotifRefus && (
            <div className="mt-3 p-3 bg-error/10 border border-error/20 rounded-md">
              <p className="text-xs font-semibold text-error mb-1">Motif du refus de certification</p>
              <p className="font-body text-earth-700 text-xs">{p.certifMotifRefus}</p>
            </div>
          )}
        </section>
      )}

      {/* Gestionnaire locatif */}
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
          <h2 className="font-display font-semibold text-earth text-lg mb-3">
            Video de visite
          </h2>
          <video
            controls
            src={resolveFileUrl(p.videoUrl)}
            className="w-full rounded-xl bg-sand-300 max-h-[480px]"
          />
        </section>
      )}

      {/* Meta */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
        <h2 className="font-display font-semibold text-earth text-lg mb-3">
          Meta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Meta icon={CalendarDays} label="Soumise le">
            {p.soumiseLe ? formatDate(p.soumiseLe) : '—'}
          </Meta>
          <Meta icon={CalendarDays} label="Créée le">
            {p.dateCreation ? formatDate(p.dateCreation) : '—'}
          </Meta>
          <Meta icon={Building2} label="Origine">
            {p.proposeurId ? `Soumission proprietaire #${p.proposeurId}` : 'Création admin direct'}
          </Meta>
          {p.acquisFursa && (
            <Meta icon={Building2} label="Drapeau">Acquis FURSA</Meta>
          )}
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
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-body text-earth text-sm">
                      {d.nom ?? d.fileName ?? d.url}
                    </p>
                    {/* V2 G.2 : label resolu cote backend (incluant categories admin custom). */}
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

      {/* Galerie cliquable (ouvre les photos en taille reelle dans un nouvel onglet) */}
      {photos.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-earth text-lg mb-3">
            Toutes les photos ({photos.length})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((d) => (
              <a
                key={d.id}
                href={fileUrl(d.url)}
                target="_blank"
                rel="noopener noreferrer"
                title={d.sectionPhotoLabel ?? d.sectionPhoto ?? d.nom ?? 'Photo'}
                className="aspect-square rounded-md overflow-hidden bg-sand-300 hover:opacity-90 relative group"
              >
                <img src={fileUrl(d.url)} alt={d.nom ?? 'Photo'} className="w-full h-full object-cover" />
                {d.sectionPhoto && (
                  <span className="absolute bottom-1 left-1 right-1 bg-earth/75 text-white text-[10px] font-body font-semibold px-1.5 py-0.5 rounded text-center">
                    {/* V2 G.4 : label resolu cote backend (legacy + custom). */}
                    {d.sectionPhotoLabel ?? d.sectionPhoto}
                  </span>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Modal validation (workflow unifie) */}
      <Dialog open={validerOpen} onOpenChange={setValiderOpen}>
        <DialogContent className="bg-white border-earth/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-earth text-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={2} />
              Valider la propriete ?
            </DialogTitle>
            <DialogDescription className="font-body text-earth-600 text-sm pt-2">
              Vous etes sur le point de valider <span className="font-semibold text-earth">{p.nom}</span>.
              Cette action est <span className="font-semibold">irreversible</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            <p className="font-body font-semibold text-earth text-sm">Ce qui va se passer :</p>
            <ol className="space-y-2 text-sm font-body text-earth-700">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-terra/15 text-terra text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>La propriete est <b>approuvee</b>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-ocean/15 text-ocean text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Un smart contract ERC-20 est <b>deploye sur Sepolia</b> (~15-60 secondes).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-success/15 text-success text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>Une fois la transaction minee, le bien passe en <b>PUBLIEE</b> et est visible publiquement.</span>
              </li>
            </ol>
          </div>

          <div className="bg-warning/8 border border-warning/30 rounded-md p-3 text-xs font-body text-earth-700 mt-3">
            <p className="font-semibold text-warning mb-1">⚠ Avant de valider, verifiez :</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Tous les documents legaux sont fournis et lisibles</li>
              <li>Les photos correspondent bien au bien decrit</li>
              <li>Le prix et le nombre de parts sont coherents</li>
            </ul>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setValiderOpen(false)} disabled={valider.isPending}>
              Annuler
            </Button>
            <Button onClick={confirmValider} disabled={valider.isPending}>
              {valider.isPending ? 'Validation en cours...' : 'Valider la propriete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <div className="bg-warning/10 border border-warning/25 rounded-md p-3 text-xs font-body text-earth-700 space-y-1 mt-2">
            <p className="font-semibold text-warning">⚠ La suppression sera refusée si :</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Des investisseurs détiennent encore des parts</li>
              <li>Des annonces marché secondaire sont ouvertes</li>
              <li>L'escrow du bien contient encore des fonds</li>
            </ul>
            <p className="text-earth-600 mt-1">Annulez d'abord la collecte (escrow) pour rembourser les investisseurs.</p>
          </div>
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

function AdminEquipementsChips({ codes }: { codes: string[] | null }) {
  const { data: apiList } = useEquipements()
  const items = getEquipementsMetaList(codes, apiList)
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 text-xs font-body text-earth-700">
      {items.map((eq) => (
        <span
          key={eq.code}
          className="px-2.5 py-1 bg-white rounded-full border border-earth/10"
        >
          {eq.label}
        </span>
      ))}
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
          <Label htmlFor="motif">Motif (3-1000 caractères)</Label>
          <textarea
            id="motif"
            rows={5}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex: Documents incomplets, prix surévalué..."
            className="w-full rounded-md border-[1.5px] border-sand-400 bg-white px-4 py-3 text-sm font-body text-earth focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15 transition-colors resize-y"
          />
          {motif.trim().length > 0 && motif.trim().length < 3 ? (
            <p className="font-mono text-xs text-error">
              Encore {3 - motif.trim().length} caractère(s) minimum pour activer le refus
            </p>
          ) : (
            <p className="font-mono text-xs text-earth-500">{motif.length} / 1000</p>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            disabled={motif.trim().length < 3 || isPending}
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
