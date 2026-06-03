import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Building,
  Building2,
  Camera,
  Castle,
  CheckCircle2,
  Coins,
  Edit,
  FileText,
  Globe,
  Home as HomeIcon,
  Image as ImageIcon,
  Info,
  Loader2,
  MapPin,
  PlayCircle,
  Sparkles,
  Upload,
  Video,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { WizardStepper } from '@/components/shared/WizardStepper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth/AuthContext'
import { usePays, useVilles } from '@/lib/api/geo'
import {
  useSoumettreBien,
  type CategorieDocument,
  type DocumentLegal,
  type PhotoStructuree,
} from '@/lib/api/submissions'
import {
  useAjouterDocsBrouillon,
  useAjouterPhotosBrouillon,
  useBrouillonDetail,
  useCreerBrouillon,
  useFinaliserBrouillon,
  usePatcherBrouillon,
  useSetVideoBrouillon,
  useSupprimerMediaBrouillon,
  type BrouillonPatch,
} from '@/lib/api/brouillon'
import type {
  SectionPhoto,
  SourceRevenu,
  StatutExploitation,
  TypeBien,
} from '@/lib/api/types'
import { extractApiError } from '@/lib/api/errors'
import { cn, resolveFileUrl } from '@/lib/utils'

const STEPS = [
  'Localisation',
  'Type & équipements',
  'État du bien',
  'Finance',
  'Photos',
  'Vidéo',
  'Documents légaux',
  'Récap',
]

const MAX_DOC_SIZE = 10 * 1024 * 1024 // 10 Mo par PDF
const DOC_TYPES = ['application/pdf']

const CATEGORIES_DOC: { value: CategorieDocument; label: string; description: string }[] = [
  { value: 'TITRE_FONCIER', label: 'Titre foncier', description: 'Preuve de propriété (obligatoire)' },
  { value: 'PERMIS_CONSTRUIRE', label: 'Permis de construire', description: 'Obligatoire pour les biens neufs ou en construction' },
  { value: 'CONTRAT_GESTION', label: 'Contrat de gestion locative', description: 'Pour les biens déjà rentables' },
  { value: 'CONTRAT_BAIL', label: 'Contrat de bail', description: 'Pour les biens loués en direct' },
  { value: 'RELEVE_AIRBNB', label: 'Relevé Airbnb / plateforme', description: 'Justificatif de revenus locatifs courts séjours' },
  { value: 'AUTRE', label: 'Autre', description: 'Tout autre document utile (expertise, plans, etc.)' },
]

/**
 * Valide l'etape 6 (documents legaux). Reflete exactement la regle backend
 * (ProprieteService.soumettre cat conditionnelle) pour eviter une erreur tardive.
 * Considere les docs LOCAUX (en attente d'upload) ET SERVEUR (deja sauvegardes).
 */
function docsValides(
  docs: DocumentLegal[],
  statut: StatutExploitation | '',
  serverDocs: { categorieDocument?: string | null }[] = [],
): boolean {
  const cats = new Set<string>([
    ...docs.map((d) => d.categorie as string),
    ...serverDocs.map((d) => d.categorieDocument ?? '').filter(Boolean),
  ])
  if (cats.size === 0) return false
  if (!cats.has('TITRE_FONCIER')) return false
  if (statut === 'DEJA_RENTABLE') {
    return cats.has('CONTRAT_GESTION') || cats.has('CONTRAT_BAIL')
  }
  if (statut === 'EN_CONSTRUCTION' || statut === 'NEUF') {
    return cats.has('PERMIS_CONSTRUIRE')
  }
  return true
}

const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100 Mo
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTO_SIZE = 4 * 1024 * 1024 // 4 Mo par photo (limite imposee Hugh)

type FormState = {
  // Etape 1
  nom: string
  pays: string
  ville: string
  villeManuelle: string
  adressePrecise: string
  description: string
  // Etape 2
  typeBien: TypeBien | ''
  nombrePieces: number
  nombreChambres: number
  superficieM2: number
  hasPiscine: boolean
  hasClimatisation: boolean
  hasParking: boolean
  hasAscenseur: boolean
  hasJardin: boolean
  hasVueMer: boolean
  // Etape 3
  statutExploitation: StatutExploitation | ''
  /** P8b : ISO date string. Obligatoire si statutExploitation = EN_CONSTRUCTION. */
  dateLivraisonPrevue: string
  revenuMensuelActuel: number
  sourceRevenu: SourceRevenu | ''
  // Etape 4
  prixVenteTotal: number
  deviseLocale: string
  fractionVenduePct: number
  nombreTotalPart: number
  rentabilitePrevue: number
  // Etape 5 & 6 & 7
  photos: PhotoStructuree[]
  video: File | null
  documents: DocumentLegal[]
  // Etape 8 (Recap)
  cguAccepted: boolean
  certified: boolean
}

const INITIAL: FormState = {
  nom: '',
  pays: '',
  ville: '',
  villeManuelle: '',
  adressePrecise: '',
  description: '',
  typeBien: '',
  nombrePieces: 1,
  nombreChambres: 1,
  superficieM2: 50,
  hasPiscine: false,
  hasClimatisation: false,
  hasParking: false,
  hasAscenseur: false,
  hasJardin: false,
  hasVueMer: false,
  statutExploitation: '',
  dateLivraisonPrevue: '',
  revenuMensuelActuel: 0,
  sourceRevenu: '',
  prixVenteTotal: 100000,
  deviseLocale: '',
  fractionVenduePct: 100,
  nombreTotalPart: 100,
  rentabilitePrevue: 8,
  photos: [],
  video: null,
  documents: [],
  cguAccepted: false,
  certified: false,
}

const TYPE_BIEN_OPTIONS: { value: TypeBien; label: string; icon: typeof HomeIcon }[] = [
  { value: 'VILLA', label: 'Villa', icon: Castle },
  { value: 'APPARTEMENT', label: 'Appartement', icon: Building },
  { value: 'STUDIO', label: 'Studio', icon: HomeIcon },
  { value: 'PENTHOUSE', label: 'Penthouse', icon: Sparkles },
  { value: 'DUPLEX', label: 'Duplex', icon: Building2 },
  { value: 'IMMEUBLE', label: 'Immeuble', icon: Building2 },
  { value: 'CHAMBRE', label: 'Chambre', icon: BedDouble },
]

const EQUIPEMENTS: { key: keyof FormState; label: string }[] = [
  { key: 'hasPiscine', label: 'Piscine' },
  { key: 'hasClimatisation', label: 'Climatisation' },
  { key: 'hasParking', label: 'Parking' },
  { key: 'hasAscenseur', label: 'Ascenseur' },
  { key: 'hasJardin', label: 'Jardin' },
  { key: 'hasVueMer', label: 'Vue mer' },
]

// Persistance : on sauvegarde les champs texte/nombre/bool dans localStorage
// pour ne pas perdre la progression au refresh. Les File (photos/video/documents)
// ne sont PAS serialisables et devront etre re-selectionnes apres un refresh.
const DRAFT_KEY = 'fursa.proposer-bien.draft'

type DraftState = Omit<FormState, 'photos' | 'video' | 'documents'>

function loadDraft(): Partial<DraftState> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Partial<DraftState>) : null
  } catch {
    return null
  }
}

export function ProposerBienPage() {
  const navigate = useNavigate()
  const { id: idParam } = useParams<{ id?: string }>()
  const { user } = useAuth()
  const [step, setStep] = useState<number>(0)
  const [form, setForm] = useState<FormState>(() => {
    const draft = loadDraft()
    return draft ? { ...INITIAL, ...draft, photos: [], video: null, documents: [] } : INITIAL
  })
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const soumettre = useSoumettreBien()

  // ===========================================================================
  // Wizard auto-save (Phase 9, 02/06/2026)
  // ===========================================================================
  // Strategie : creer un brouillon serveur des le mount, puis PATCH a chaque
  // "Continuer". Permet la reprise sur un autre appareil. La soumission finale
  // appelle /finaliser au lieu de l'ancien POST /submissions multipart.
  const [brouillonId, setBrouillonId] = useState<number | null>(
    idParam ? Number(idParam) : null
  )
  const creerBrouillon = useCreerBrouillon()
  const patcher = usePatcherBrouillon()
  const ajouterPhotos = useAjouterPhotosBrouillon()
  const setVideoApi = useSetVideoBrouillon()
  const ajouterDocs = useAjouterDocsBrouillon()
  const supprimerMedia = useSupprimerMediaBrouillon()
  const finaliser = useFinaliserBrouillon()
  const { data: brouillonData } = useBrouillonDetail(brouillonId ?? undefined)
  const initRef = useRef(false)
  const hydratedRef = useRef(false)

  // Au mount : si pas d'id, creer un brouillon vide. Si id fourni, on charge via
  // useBrouillonDetail puis on hydrate le form.
  useEffect(() => {
    if (initRef.current) return
    if (brouillonId == null && user?.isVerified === true) {
      initRef.current = true
      creerBrouillon.mutate(undefined, {
        onSuccess: (b) => {
          setBrouillonId(b.id)
          // Push l'id dans l'URL pour permettre la reprise au refresh
          navigate(`/proposer-un-bien/${b.id}`, { replace: true })
        },
        onError: (e) => {
          initRef.current = false
          toast.error(extractApiError(e, 'Impossible de creer le brouillon.'))
        },
      })
    }
  }, [brouillonId, user?.isVerified, creerBrouillon, navigate])

  // Hydrater le form depuis le brouillon serveur (une fois charge).
  useEffect(() => {
    if (!brouillonData || hydratedRef.current) return
    hydratedRef.current = true
    setForm((s) => ({
      ...s,
      nom: brouillonData.nom && brouillonData.nom !== 'Brouillon' ? brouillonData.nom : s.nom,
      pays: brouillonData.pays ?? s.pays,
      ville: brouillonData.ville ?? s.ville,
      adressePrecise: brouillonData.adressePrecise ?? s.adressePrecise,
      description: brouillonData.description ?? s.description,
      typeBien: (brouillonData.typeBien as TypeBien) ?? s.typeBien,
      nombrePieces: brouillonData.nombrePieces ?? s.nombrePieces,
      nombreChambres: brouillonData.nombreChambres ?? s.nombreChambres,
      superficieM2: brouillonData.superficieM2 ?? s.superficieM2,
      hasPiscine: brouillonData.hasPiscine ?? s.hasPiscine,
      hasClimatisation: brouillonData.hasClimatisation ?? s.hasClimatisation,
      hasParking: brouillonData.hasParking ?? s.hasParking,
      hasAscenseur: brouillonData.hasAscenseur ?? s.hasAscenseur,
      hasJardin: brouillonData.hasJardin ?? s.hasJardin,
      hasVueMer: brouillonData.hasVueMer ?? s.hasVueMer,
      statutExploitation: (brouillonData.statutExploitation as StatutExploitation) ?? s.statutExploitation,
      dateLivraisonPrevue: brouillonData.dateLivraisonPrevue ?? s.dateLivraisonPrevue,
      revenuMensuelActuel: Number(brouillonData.revenuMensuelActuel ?? s.revenuMensuelActuel),
      sourceRevenu: (brouillonData.sourceRevenu as SourceRevenu) ?? s.sourceRevenu,
      prixVenteTotal: Number(brouillonData.prixVenteTotal ?? s.prixVenteTotal),
      deviseLocale: brouillonData.deviseLocale ?? s.deviseLocale,
      fractionVenduePct: brouillonData.fractionVenduePct ?? s.fractionVenduePct,
      nombreTotalPart: brouillonData.nombreTotalPart ?? s.nombreTotalPart,
      rentabilitePrevue: brouillonData.rentabilitePrevue ?? s.rentabilitePrevue,
    }))
  }, [brouillonData])

  const { data: paysList, isLoading: paysLoading } = usePays()
  const { data: villesList } = useVilles(form.pays || null)

  // Auto-set devise locale quand pays change
  useEffect(() => {
    if (!form.pays || !paysList) return
    const found = paysList.find((p) => p.code === form.pays)
    if (found && !form.deviseLocale) {
      setForm((s) => ({ ...s, deviseLocale: found.devise }))
    }
  }, [form.pays, paysList, form.deviseLocale])

  // Persistance du brouillon a chaque modif (hors fichiers, non serialisables).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const { photos: _p, video: _v, documents: _d, ...serializable } = form
    void _p; void _v; void _d
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(serializable))
    } catch {
      // quota depasse ou indispo : on ignore silencieusement
    }
  }, [form])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }))
  }

  // Documents serveur deja uploades (utilises pour la validation Step4/5/6).
  const serverDocs = brouillonData?.documents ?? []
  const serverImages = serverDocs.filter((d) => d.type === 'IMAGE')
  const serverPdfs = serverDocs.filter((d) => d.type === 'PDF')

  // ---- Validation par étape ----
  const stepValid: boolean[] = [
    // 0 — Localisation
    form.nom.trim().length >= 3 && !!form.pays && (!!form.ville || !!form.villeManuelle.trim()),
    // 1 — Type & équipements
    form.typeBien !== '' && form.nombrePieces >= 1 && form.superficieM2 >= 1,
    // 2 — Statut
    form.statutExploitation !== '' &&
      (form.statutExploitation !== 'DEJA_RENTABLE' ||
        (form.revenuMensuelActuel > 0 && form.sourceRevenu !== '')) &&
      (form.statutExploitation !== 'EN_CONSTRUCTION' ||
        form.dateLivraisonPrevue.length > 0),
    // 3 — Finance
    form.prixVenteTotal > 0 &&
      !!form.deviseLocale &&
      form.fractionVenduePct >= 1 &&
      form.fractionVenduePct <= 100 &&
      form.nombreTotalPart >= 1 &&
      form.rentabilitePrevue >= 0,
    // 4 — Photos : façade + salon obligatoires (combine local + serveur)
    (form.photos.some((p) => p.section === 'FACADE')
      || serverImages.some((d) => d.sectionPhoto === 'FACADE'))
    && (form.photos.some((p) => p.section === 'SALON')
      || serverImages.some((d) => d.sectionPhoto === 'SALON')),
    // 5 — Vidéo obligatoire : locale OU serveur
    form.video !== null || !!brouillonData?.videoUrl,
    // 6 — Documents légaux : titre foncier obligatoire + conditionnels (combine local + serveur)
    docsValides(form.documents, form.statutExploitation, serverPdfs),
    // 7 — Récap
    form.cguAccepted && form.certified,
  ]

  // ---- Calculs dérivés ----
  const prixUnitaire = useMemo(() => {
    if (form.nombreTotalPart <= 0) return 0
    const cible = (form.prixVenteTotal * form.fractionVenduePct) / 100
    return cible / form.nombreTotalPart
  }, [form.prixVenteTotal, form.fractionVenduePct, form.nombreTotalPart])

  // Liste unique des devises disponibles, derivee des pays FURSA + USD/EUR
  // toujours acceptes (devise de base de la plateforme + devise de l'UE).
  const devises = useMemo(() => {
    const set = new Set<string>(['USD', 'EUR'])
    ;(paysList ?? []).forEach((p) => p.devise && set.add(p.devise))
    return Array.from(set).sort()
  }, [paysList])

  // Legacy : ancien flux multipart en 1 requete. Garde temporairement pour
  // documentation et fallback. Le nouveau flux utilise brouillon + finaliser.
  // @ts-expect-error legacy non utilise apres migration auto-save
  function submit() {
    const villeFinal = form.villeManuelle.trim() || form.ville

    soumettre.mutate(
      {
        submission: {
          nom: form.nom.trim(),
          pays: form.pays,
          ville: villeFinal,
          adressePrecise: form.adressePrecise.trim() || undefined,
          localisation: `${villeFinal}, ${form.pays}`,
          description: form.description.trim() || undefined,
          typeBien: form.typeBien as TypeBien,
          nombrePieces: form.nombrePieces || null,
          nombreChambres: form.nombreChambres || null,
          superficieM2: form.superficieM2 || null,
          hasPiscine: form.hasPiscine,
          hasClimatisation: form.hasClimatisation,
          hasParking: form.hasParking,
          hasAscenseur: form.hasAscenseur,
          hasJardin: form.hasJardin,
          hasVueMer: form.hasVueMer,
          statutExploitation: form.statutExploitation as StatutExploitation,
          dateLivraisonPrevue:
            form.statutExploitation === 'EN_CONSTRUCTION' && form.dateLivraisonPrevue
              ? form.dateLivraisonPrevue
              : null,
          revenuMensuelActuel:
            form.statutExploitation === 'DEJA_RENTABLE' ? form.revenuMensuelActuel : null,
          sourceRevenu:
            form.statutExploitation === 'DEJA_RENTABLE'
              ? (form.sourceRevenu as SourceRevenu)
              : null,
          prixVenteTotal: form.prixVenteTotal,
          deviseLocale: form.deviseLocale,
          fractionVenduePct: form.fractionVenduePct,
          nombreTotalPart: form.nombreTotalPart,
          prixUnitairePart: Number(prixUnitaire.toFixed(2)),
          rentabilitePrevue: form.rentabilitePrevue,
        },
        photos: form.photos,
        video: form.video,
        documents: form.documents,
        onProgress: (pct) => setUploadProgress(pct),
      },
      {
        onSuccess: () => {
          // Brouillon envoye avec succes : on nettoie le localStorage.
          try {
            window.localStorage.removeItem(DRAFT_KEY)
          } catch {
            // ignore
          }
          toast.success('Bien soumis pour validation. Un admin vous contactera.')
          navigate('/mes-proprietes')
        },
        onError: (err) => {
          setUploadProgress(0)
          toast.error(extractApiError(err, 'Soumission impossible.'))
        },
      }
    )
  }

  // ===========================================================================
  // Phase 9 auto-save : PATCH par etape + upload immediat medias + finaliser
  // ===========================================================================

  /**
   * Construit le patch correspondant a l'etape courante (champs touches).
   * Retourne null si rien a sauvegarder (etapes 4-6 = medias, gerees a part).
   */
  function buildPatchForStep(currentStep: number): BrouillonPatch | null {
    const villeFinal = form.villeManuelle.trim() || form.ville
    switch (currentStep) {
      case 0:
        return {
          nom: form.nom.trim() || undefined,
          pays: form.pays || undefined,
          ville: villeFinal || undefined,
          adressePrecise: form.adressePrecise.trim() || undefined,
          description: form.description.trim() || undefined,
        }
      case 1:
        return {
          typeBien: (form.typeBien || undefined) as TypeBien | undefined,
          nombrePieces: form.nombrePieces || undefined,
          nombreChambres: form.nombreChambres || undefined,
          superficieM2: form.superficieM2 || undefined,
          hasPiscine: form.hasPiscine,
          hasClimatisation: form.hasClimatisation,
          hasParking: form.hasParking,
          hasAscenseur: form.hasAscenseur,
          hasJardin: form.hasJardin,
          hasVueMer: form.hasVueMer,
        }
      case 2:
        return {
          statutExploitation: (form.statutExploitation || undefined) as StatutExploitation | undefined,
          dateLivraisonPrevue:
            form.statutExploitation === 'EN_CONSTRUCTION' && form.dateLivraisonPrevue
              ? form.dateLivraisonPrevue
              : undefined,
          revenuMensuelActuel:
            form.statutExploitation === 'DEJA_RENTABLE' ? form.revenuMensuelActuel : undefined,
          sourceRevenu:
            form.statutExploitation === 'DEJA_RENTABLE'
              ? (form.sourceRevenu as SourceRevenu)
              : undefined,
        }
      case 3:
        return {
          prixVenteTotal: form.prixVenteTotal,
          deviseLocale: form.deviseLocale || undefined,
          fractionVenduePct: form.fractionVenduePct,
          nombreTotalPart: form.nombreTotalPart,
          prixUnitairePart: Number(prixUnitaire.toFixed(2)),
          rentabilitePrevue: form.rentabilitePrevue,
        }
      default:
        return null
    }
  }

  /**
   * Au clic Continuer : PATCH les champs de l'etape + upload eventuels medias
   * de cette etape + avance d'une etape. Si pas de brouillonId encore (creation
   * en cours), on attend.
   */
  async function handleNext() {
    if (brouillonId == null) {
      toast.error('Brouillon en cours de creation, patientez quelques secondes.')
      return
    }
    try {
      // Etapes 0-3 : champs texte/number → PATCH
      const patch = buildPatchForStep(step)
      if (patch) {
        await patcher.mutateAsync({ id: brouillonId, patch })
      }

      // Etape 4 : photos selectionnees en local → upload
      if (step === 4 && form.photos.length > 0) {
        await ajouterPhotos.mutateAsync({ id: brouillonId, photos: form.photos })
        // Reset local : les photos sont maintenant cote serveur (visibles via brouillonData.documents)
        setForm((s) => ({ ...s, photos: [] }))
      }
      // Etape 5 : video selectionnee en local → upload
      if (step === 5 && form.video) {
        await setVideoApi.mutateAsync({
          id: brouillonId,
          video: form.video,
          onProgress: (pct) => setUploadProgress(pct),
        })
        setForm((s) => ({ ...s, video: null }))
        setUploadProgress(0)
      }
      // Etape 6 : documents selectionnes en local → upload
      if (step === 6 && form.documents.length > 0) {
        await ajouterDocs.mutateAsync({ id: brouillonId, documents: form.documents })
        setForm((s) => ({ ...s, documents: [] }))
      }

      setStep(step + 1)
    } catch (err) {
      toast.error(extractApiError(err, 'Sauvegarde impossible.'))
    }
  }

  /**
   * Etape finale : bascule BROUILLON → EN_REVIEW. Le backend valide tous les
   * requis et renvoie 400 + message explicite si quelque chose manque.
   */
  async function handleFinaliser() {
    if (brouillonId == null) return
    try {
      await finaliser.mutateAsync(brouillonId)
      try { window.localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
      toast.success('Bien soumis pour validation. Un admin vous contactera.')
      navigate('/mes-proprietes')
    } catch (err) {
      toast.error(extractApiError(err, 'Soumission impossible.'))
    }
  }

  /**
   * Retire un media deja uploade cote serveur (depuis l'affichage des medias deja
   * uploades du brouillon en cours). A brancher sur les boutons de suppression
   * dans les sous-composants Photos/Video/Documents.
   */
  // @ts-expect-error : utilise par futurs handlers UI sur les medias deja uploades
  async function handleRemoveMedia(mediaId: number) {
    if (brouillonId == null) return
    try {
      await supprimerMedia.mutateAsync({ id: brouillonId, mediaId })
      toast.success('Media supprime.')
    } catch (err) {
      toast.error(extractApiError(err, 'Suppression impossible.'))
    }
  }

  // GUARD KYC : seuls les profils verifies peuvent soumettre un bien.
  // Symetrique de AcheterPartsPage. Le backend renforce dans ProprieteService.soumettre.
  if (user && user.isVerified !== true) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          to="/mes-proprietes"
          className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Retour
        </Link>
        <div className="bg-sand-100 border border-warning/30 rounded-2xl p-8 sm:p-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-warning/15">
            <AlertCircle className="w-7 h-7 text-warning" strokeWidth={1.75} />
          </div>
          <h1 className="font-display font-bold text-earth text-2xl">
            Verification d'identite requise
          </h1>
          <p className="font-body text-earth-600 text-sm max-w-md mx-auto">
            Pour proposer un bien immobilier sur FURSA, vous devez d'abord verifier votre identite.
            Cette etape est obligatoire pour respecter la reglementation et proteger les investisseurs.
            Comptez quelques minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg">
              <Link to="/compte/kyc">Verifier mon profil</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/dashboard">Plus tard</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/mes-proprietes"
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour
      </Link>

      <header className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="font-body text-xs uppercase tracking-widest text-ocean font-semibold inline-flex items-center gap-1.5">
            <HomeIcon className="w-3.5 h-3.5" strokeWidth={2} />
            Espace propriétaire
          </p>
          {/* Badge "Brouillon sauvegarde" : auto-save discret */}
          {brouillonId != null && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-body font-medium border transition-all',
                patcher.isPending || ajouterPhotos.isPending || setVideoApi.isPending || ajouterDocs.isPending
                  ? 'bg-ocean/10 border-ocean/30 text-ocean'
                  : 'bg-success/10 border-success/30 text-success'
              )}
              title={`Brouillon #${brouillonId} - reprise possible depuis tout appareil`}
            >
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                patcher.isPending || ajouterPhotos.isPending || setVideoApi.isPending || ajouterDocs.isPending
                  ? 'bg-ocean animate-pulse'
                  : 'bg-success'
              )} />
              {patcher.isPending || ajouterPhotos.isPending || setVideoApi.isPending || ajouterDocs.isPending
                ? 'Sauvegarde en cours…'
                : 'Brouillon sauvegardé'}
            </span>
          )}
        </div>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Proposer un bien
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Décrivez votre bien étape par étape. Chaque progression est sauvegardée :
          vous pouvez reprendre depuis n'importe quel appareil.
        </p>
      </header>

      <div className="mb-8">
        <WizardStepper steps={STEPS} current={step} />
      </div>

      <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
        {/* Wrapper avec key={step} : remount a chaque changement d'etape
            -> l'animation fade-up se relance pour donner un effet de
            transition douce (Polish UX). */}
        <div key={step} className="animate-fade-up">
        {step === 0 && (
          <Step0Localisation
            form={form}
            update={update}
            paysList={paysList ?? []}
            paysLoading={paysLoading}
            villesList={villesList ?? []}
          />
        )}
        {step === 1 && <Step1Type form={form} update={update} />}
        {step === 2 && <Step2Statut form={form} update={update} />}
        {step === 3 && (
          <Step3Finance
            form={form}
            update={update}
            prixUnitaire={prixUnitaire}
            devises={devises}
          />
        )}
        {step === 4 && (
          <Step4Photos
            form={form}
            update={update}
            serverPhotos={brouillonData?.documents?.filter((d) => d.type === 'IMAGE') ?? []}
            onRemoveServerMedia={handleRemoveMedia}
          />
        )}
        {step === 5 && (
          <Step5Video
            form={form}
            update={update}
            serverVideoUrl={brouillonData?.videoUrl ?? null}
            onRemoveServerVideo={async () => {
              if (!brouillonId) return
              // La video n'a pas d'id document distinct -> on PATCH pour la retirer
              // Pour l'instant on signale juste que l'user doit la remplacer en uploadant une nouvelle
              toast.info('Pour changer la video, uploadez-en une nouvelle - elle remplacera l\'ancienne.')
            }}
          />
        )}
        {step === 6 && (
          <Step6Documents
            form={form}
            update={update}
            serverDocuments={brouillonData?.documents?.filter((d) => d.type === 'PDF') ?? []}
            onRemoveServerMedia={handleRemoveMedia}
          />
        )}
        {step === 7 && (
          <Step7Recap
            form={form}
            update={update}
            prixUnitaire={prixUnitaire}
            onEditStep={(n) => setStep(n)}
          />
        )}
        </div>

        {/* Barre de progression d'upload (visible pendant l'envoi) */}
        {soumettre.isPending && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="font-body text-sm text-earth font-medium inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-terra" strokeWidth={2} />
                {uploadProgress < 100
                  ? 'Envoi des données et médias en cours…'
                  : 'Finalisation côté serveur…'}
              </p>
              <span className="font-mono text-sm font-bold text-terra tabular-nums">
                {uploadProgress}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-sand-200 overflow-hidden">
              <div
                className="h-full bg-terra transition-[width] duration-200 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-2 font-body text-xs text-earth-500">
              Ne fermez pas cette page. La vidéo peut prendre un moment selon votre connexion.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              size="lg"
              className="sm:flex-1"
              onClick={() => setStep(step - 1)}
              disabled={soumettre.isPending}
            >
              <ArrowLeft strokeWidth={2} />
              Précédent
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              size="lg"
              className="sm:flex-[2]"
              onClick={handleNext}
              disabled={
                !stepValid[step] ||
                patcher.isPending ||
                ajouterPhotos.isPending ||
                setVideoApi.isPending ||
                ajouterDocs.isPending ||
                brouillonId == null
              }
            >
              {patcher.isPending || ajouterPhotos.isPending || setVideoApi.isPending || ajouterDocs.isPending ? (
                <>
                  <Loader2 className="animate-spin" strokeWidth={2} />
                  {step === 5 && uploadProgress > 0
                    ? `Upload video ${uploadProgress}%`
                    : 'Enregistrement…'}
                </>
              ) : (
                <>
                  Continuer
                  <ArrowRight strokeWidth={2} />
                </>
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              className="sm:flex-[2]"
              onClick={handleFinaliser}
              disabled={!stepValid[7] || finaliser.isPending}
            >
              {finaliser.isPending ? (
                <>
                  <Loader2 className="animate-spin" strokeWidth={2} />
                  Finalisation…
                </>
              ) : (
                <>
                  <CheckCircle2 strokeWidth={2} />
                  Soumettre le bien
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Step 0 — Localisation
// =============================================================================

function Step0Localisation({
  form,
  update,
  paysList,
  paysLoading,
  villesList,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  paysList: { code: string; nom: string; devise: string }[]
  paysLoading: boolean
  villesList: string[]
}) {
  return (
    <>
      <h2 className="font-display font-bold text-earth text-xl mb-1 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-terra" strokeWidth={1.75} />
        Localisation & bases
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        Où se trouve votre bien ?
      </p>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="nom">Nom du bien <span className="text-error">*</span></Label>
          <Input
            id="nom"
            value={form.nom}
            onChange={(e) => update('nom', e.target.value)}
            placeholder="Ex: Villa Baobab, Appartement vue mer, etc."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pays">Pays <span className="text-error">*</span></Label>
            <div className="relative">
              <Globe
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none"
                strokeWidth={1.75}
              />
              {paysLoading ? (
                <Skeleton className="h-11 rounded-md" />
              ) : (
                <select
                  id="pays"
                  aria-label="Pays"
                  value={form.pays}
                  onChange={(e) => {
                    update('pays', e.target.value)
                    update('ville', '')
                    update('villeManuelle', '')
                    update('deviseLocale', '')
                  }}
                  className="h-11 w-full pl-9 pr-3 rounded-md border-[1.5px] border-sand-400 bg-white text-sm font-body text-earth focus:outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                >
                  <option value="">— Choisir un pays —</option>
                  {paysList.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.nom} ({p.devise})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ville">Ville <span className="text-error">*</span></Label>
            {form.pays && villesList.length > 0 ? (
              <select
                id="ville"
                aria-label="Ville"
                value={form.ville}
                onChange={(e) => update('ville', e.target.value)}
                className="h-11 w-full px-3 rounded-md border-[1.5px] border-sand-400 bg-white text-sm font-body text-earth focus:outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              >
                <option value="">— Choisir une ville —</option>
                {villesList.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
                <option value="__autre__">Autre (saisir manuellement)</option>
              </select>
            ) : (
              <Input
                id="ville"
                value={form.villeManuelle}
                onChange={(e) => update('villeManuelle', e.target.value)}
                placeholder="Sélectionnez d'abord un pays"
                disabled={!form.pays}
              />
            )}
            {form.ville === '__autre__' && (
              <Input
                value={form.villeManuelle}
                onChange={(e) => update('villeManuelle', e.target.value)}
                placeholder="Saisir le nom de la ville"
                className="mt-2"
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adresse">Adresse précise (quartier, rue) <span className="text-earth-500 text-xs">(optionnel)</span></Label>
          <Input
            id="adresse"
            value={form.adressePrecise}
            onChange={(e) => update('adressePrecise', e.target.value)}
            placeholder="Ex: Quartier Stone Town, Mizingani Road"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">Description courte <span className="text-earth-500 text-xs">(optionnel)</span></Label>
          <textarea
            id="desc"
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Décrivez l'atout principal de votre bien en quelques phrases…"
            className="w-full rounded-md border-[1.5px] border-sand-400 bg-white px-3 py-2 text-sm font-body text-earth focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15 resize-y"
          />
        </div>
      </div>
    </>
  )
}

// =============================================================================
// Step 1 — Type & équipements
// =============================================================================

function Step1Type({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <>
      <h2 className="font-display font-bold text-earth text-xl mb-1 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-terra" strokeWidth={1.75} />
        Type & équipements
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        Quel type de bien proposez-vous et quels équipements offre-t-il ?
      </p>

      <div className="space-y-6">
        <div>
          <Label className="mb-3 block">Type de bien <span className="text-error">*</span></Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPE_BIEN_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const active = form.typeBien === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('typeBien', opt.value)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-[1.5px] font-body text-xs font-semibold transition-colors',
                    active
                      ? 'border-terra bg-terra/10 text-terra'
                      : 'border-sand-400 text-earth-600 hover:border-terra/40'
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pieces">Nb pièces</Label>
            <Input
              id="pieces"
              type="number"
              min={1}
              value={form.nombrePieces || ''}
              onChange={(e) => update('nombrePieces', parseInt(e.target.value, 10) || 0)}
            />
          </div>
          {form.typeBien !== 'STUDIO' && form.typeBien !== 'CHAMBRE' && (
            <div className="space-y-2">
              <Label htmlFor="chambres">Nb chambres</Label>
              <Input
                id="chambres"
                type="number"
                min={0}
                value={form.nombreChambres || ''}
                onChange={(e) => update('nombreChambres', parseInt(e.target.value, 10) || 0)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="m2">Surface (m²)</Label>
            <Input
              id="m2"
              type="number"
              min={1}
              value={form.superficieM2 || ''}
              onChange={(e) => update('superficieM2', parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>

        <div>
          <Label className="mb-3 block">Équipements disponibles</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EQUIPEMENTS.map((eq) => {
              const checked = form[eq.key] as boolean
              return (
                <button
                  key={eq.key}
                  type="button"
                  onClick={() => update(eq.key as 'hasPiscine', !checked as never)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-md border-[1.5px] font-body text-sm font-medium transition-colors',
                    checked
                      ? 'border-success bg-success/10 text-success'
                      : 'border-sand-400 text-earth-600 hover:border-success/40'
                  )}
                >
                  <Checkbox checked={checked} className="pointer-events-none" />
                  {eq.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

// =============================================================================
// Step 2 — Statut d'exploitation
// =============================================================================

function Step2Statut({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <>
      <h2 className="font-display font-bold text-earth text-xl mb-1 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-terra" strokeWidth={1.75} />
        État du bien
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        Votre bien est-il en exploitation ou tout neuf ?
      </p>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['EN_CONSTRUCTION', 'NEUF', 'DEJA_RENTABLE'] as const).map((s) => {
            const active = form.statutExploitation === s
            const labels: Record<typeof s, { title: string; desc: string }> = {
              EN_CONSTRUCTION: {
                title: 'En construction',
                desc: "Le bien n'est pas encore livré. Aucun revenu possible avant livraison.",
              },
              NEUF: {
                title: 'Neuf (livré)',
                desc: 'Livré mais jamais loué. Aucune preuve de revenu à fournir.',
              },
              DEJA_RENTABLE: {
                title: 'Déjà rentable',
                desc: 'En exploitation (Airbnb, bail). Vous fournirez des preuves de revenus.',
              },
            }
            return (
              <button
                key={s}
                type="button"
                onClick={() => update('statutExploitation', s)}
                className={cn(
                  'p-5 rounded-lg border-[1.5px] text-left transition-colors',
                  active
                    ? 'border-terra bg-terra/10'
                    : 'border-sand-400 hover:border-terra/40'
                )}
              >
                <p className={cn('font-display font-bold text-earth mb-1', active && 'text-terra')}>
                  {labels[s].title}
                </p>
                <p className="font-body text-earth-600 text-xs leading-relaxed">
                  {labels[s].desc}
                </p>
              </button>
            )
          })}
        </div>

        {/* P8b : champ date livraison obligatoire si EN_CONSTRUCTION */}
        {form.statutExploitation === 'EN_CONSTRUCTION' && (
          <div className="rounded-lg border-[1.5px] border-warning/30 bg-warning/5 p-5 space-y-3">
            <div className="flex items-center gap-2 text-warning font-body text-sm font-semibold">
              <Info className="w-4 h-4" strokeWidth={1.75} />
              Date de livraison prévue
            </div>
            <p className="font-body text-earth-700 text-xs">
              Cette date sera affichée aux investisseurs. Les déclarations de revenus
              seront bloquées tant que le bien n'a pas été livré.
            </p>
            <div className="space-y-2">
              <Label htmlFor="date-livraison">
                Livraison prévue <span className="text-error">*</span>
              </Label>
              <Input
                id="date-livraison"
                type="date"
                value={form.dateLivraisonPrevue ?? ''}
                onChange={(e) => update('dateLivraisonPrevue', e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>
        )}

        {form.statutExploitation === 'DEJA_RENTABLE' && (
          <div className="rounded-lg border-[1.5px] border-ocean/30 bg-ocean/5 p-5 space-y-4">
            <div className="flex items-center gap-2 text-ocean font-body text-sm font-semibold">
              <Info className="w-4 h-4" strokeWidth={1.75} />
              Preuves de revenus
            </div>
            <p className="font-body text-earth-700 text-xs">
              Joindre une preuve solide rassure les investisseurs et booste la décision d'achat.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="revenu-mensuel">
                  Revenu mensuel actuel <span className="text-error">*</span>
                </Label>
                <Input
                  id="revenu-mensuel"
                  type="number"
                  min={0}
                  value={form.revenuMensuelActuel || ''}
                  onChange={(e) =>
                    update('revenuMensuelActuel', parseFloat(e.target.value) || 0)
                  }
                  placeholder="Ex: 2500"
                />
              </div>
              <div className="space-y-2">
                <Label>Partenaire / opérateur <span className="text-error">*</span></Label>
                <div className="flex gap-1.5">
                  {(['PAJE_SQUARE', 'FUMBA_TOWN', 'AUTRE'] as const).map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => update('sourceRevenu', src)}
                      className={cn(
                        'flex-1 h-11 rounded-md border-[1.5px] font-body text-xs font-semibold transition-colors',
                        form.sourceRevenu === src
                          ? 'border-ocean bg-ocean/10 text-ocean'
                          : 'border-sand-400 text-earth-600 hover:border-ocean/40'
                      )}
                    >
                      {src === 'PAJE_SQUARE' ? 'Paje Square' : src === 'FUMBA_TOWN' ? 'Fumba Town' : 'Autre'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="font-body text-earth-500 text-xs">
              💡 Les justificatifs (contrat de bail, relevés Airbnb) seront demandés
              séparément dans l'étape de certification du bien après publication.
            </p>
          </div>
        )}
      </div>
    </>
  )
}

// =============================================================================
// Step 3 — Finance
// =============================================================================

function Step3Finance({
  form,
  update,
  prixUnitaire,
  devises,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  prixUnitaire: number
  devises: string[]
}) {
  return (
    <>
      <h2 className="font-display font-bold text-earth text-xl mb-1 flex items-center gap-2">
        <Coins className="w-5 h-5 text-terra" strokeWidth={1.75} />
        Finance
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        Indiquez le prix total et combien vous voulez vendre.
      </p>

      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="prix">Prix de vente total <span className="text-error">*</span></Label>
            <Input
              id="prix"
              type="number"
              min={1}
              value={form.prixVenteTotal || ''}
              onChange={(e) => update('prixVenteTotal', parseFloat(e.target.value) || 0)}
              className="font-mono font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="devise">Devise <span className="text-error">*</span></Label>
            <select
              id="devise"
              aria-label="Devise"
              value={form.deviseLocale}
              onChange={(e) => update('deviseLocale', e.target.value)}
              className="h-11 w-full px-3 rounded-md border-[1.5px] border-sand-400 bg-white text-sm font-mono font-semibold text-earth focus:outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            >
              <option value="">—</option>
              {devises.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Fraction du bien à vendre :{' '}
            <span className="font-mono font-bold text-terra">{form.fractionVenduePct}%</span>
          </Label>
          <input
            type="range"
            aria-label="Fraction du bien à vendre"
            min={1}
            max={100}
            step={1}
            value={form.fractionVenduePct}
            onChange={(e) => update('fractionVenduePct', parseInt(e.target.value, 10))}
            className="w-full accent-terra"
          />
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[25, 50, 75, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => update('fractionVenduePct', preset)}
                className={cn(
                  'h-9 rounded-md border-[1.5px] font-body text-xs font-semibold transition-colors',
                  form.fractionVenduePct === preset
                    ? 'border-terra bg-terra/10 text-terra'
                    : 'border-sand-400 text-earth-600 hover:border-terra/40'
                )}
              >
                {preset}%
              </button>
            ))}
          </div>
          <p className="font-body text-earth-500 text-xs">
            Vous pouvez vendre seulement une fraction de votre bien et conserver le reste.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="parts">Nombre total de parts <span className="text-error">*</span></Label>
            <Input
              id="parts"
              type="number"
              min={1}
              value={form.nombreTotalPart || ''}
              onChange={(e) => update('nombreTotalPart', parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rentab">Rentabilité prévue (%/an) <span className="text-error">*</span></Label>
            <Input
              id="rentab"
              type="number"
              min={0}
              step={0.1}
              value={form.rentabilitePrevue || ''}
              onChange={(e) => update('rentabilitePrevue', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Récap calculé */}
        <div className="rounded-lg border border-earth/8 bg-white p-4 space-y-2">
          <p className="font-body text-xs text-earth-500 uppercase tracking-wide font-semibold">
            Récap des calculs
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm font-body">
            <span className="text-earth-600">Montant mis en vente</span>
            <span className="text-right font-mono font-semibold text-earth">
              {((form.prixVenteTotal * form.fractionVenduePct) / 100).toLocaleString('fr-FR')}{' '}
              {form.deviseLocale}
            </span>
            <span className="text-earth-600">Prix par part</span>
            <span className="text-right font-mono font-semibold text-earth">
              {prixUnitaire.toFixed(2)} {form.deviseLocale}
            </span>
            <span className="text-earth-600">Conservé par vous</span>
            <span className="text-right font-mono font-semibold text-success">
              {(100 - form.fractionVenduePct)}% (
              {((form.prixVenteTotal * (100 - form.fractionVenduePct)) / 100).toLocaleString(
                'fr-FR'
              )}{' '}
              {form.deviseLocale})
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

// =============================================================================
// Step 4 — Photos structurées
// =============================================================================

type ServerDoc = {
  id: number
  nom: string | null
  url: string | null
  type?: string
  sectionPhoto?: SectionPhoto | null
  categorieDocument?: string | null
}

function Step4Photos({
  form,
  update,
  serverPhotos = [],
  onRemoveServerMedia,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  serverPhotos?: ServerDoc[]
  onRemoveServerMedia?: (mediaId: number) => Promise<void> | void
}) {
  // Sections requises selon le type de bien et équipements
  const sectionsRequises: { section: SectionPhoto; label: string; required: boolean }[] =
    useMemo(() => {
      const base: { section: SectionPhoto; label: string; required: boolean }[] = [
        { section: 'FACADE', label: 'Façade avant', required: true },
        { section: 'SALON', label: 'Salon', required: true },
        { section: 'CUISINE', label: 'Cuisine', required: false },
      ]
      if (form.typeBien !== 'STUDIO' && form.typeBien !== 'CHAMBRE') {
        base.push({ section: 'CHAMBRE', label: 'Chambres', required: false })
      }
      base.push({ section: 'SALLE_DE_BAIN', label: 'Salle de bain', required: false })
      if (form.hasPiscine) {
        base.push({ section: 'PISCINE', label: 'Piscine', required: false })
      }
      if (form.hasVueMer) {
        base.push({ section: 'VUE', label: 'Vue mer', required: false })
      }
      base.push({ section: 'EXTERIEUR', label: 'Extérieur / jardin', required: false })
      base.push({ section: 'AUTRE', label: 'Autres photos', required: false })
      return base
    }, [form.typeBien, form.hasPiscine, form.hasVueMer])

  function addPhotos(section: SectionPhoto, files: FileList | null) {
    if (!files) return
    const accepted: PhotoStructuree[] = []
    for (const f of Array.from(files)) {
      if (!PHOTO_TYPES.includes(f.type)) {
        toast.error(`Format non supporté : ${f.name}`)
        continue
      }
      if (f.size > MAX_PHOTO_SIZE) {
        const sizeMo = (f.size / (1024 * 1024)).toFixed(1)
        toast.error(
          `Photo "${f.name}" rejetée : ${sizeMo} Mo. Taille maximum autorisée : 4 Mo. Compressez l'image (TinyPNG, Squoosh...) puis recommencez.`
        )
        continue
      }
      accepted.push({ file: f, section })
    }
    update('photos', [...form.photos, ...accepted])
  }

  function removePhoto(index: number) {
    update(
      'photos',
      form.photos.filter((_, i) => i !== index)
    )
  }

  // Aide visuelle en temps reel : count + poids total + check obligatoires.
  const totalBytes = form.photos.reduce((acc, p) => acc + (p.file?.size ?? 0), 0)
  const totalMo = totalBytes / (1024 * 1024)
  // hasFacade/hasSalon : combine serveur + local (pour la validation visuelle).
  const hasFacade = form.photos.some((p) => p.section === 'FACADE')
    || serverPhotos.some((d) => d.sectionPhoto === 'FACADE')
  const hasSalon = form.photos.some((p) => p.section === 'SALON')
    || serverPhotos.some((d) => d.sectionPhoto === 'SALON')

  return (
    <>
      <h2 className="font-display font-bold text-earth text-xl mb-1 flex items-center gap-2">
        <Camera className="w-5 h-5 text-terra" strokeWidth={1.75} />
        Photos structurées
      </h2>
      <p className="font-body text-earth-600 text-sm mb-1">
        Une photo par section. Façade et salon sont obligatoires.
      </p>
      <p className="font-body text-earth-500 text-xs mb-4">
        Formats acceptés : JPG, PNG, WebP · <strong>4 Mo max</strong> par photo.
      </p>

      {/* Photos deja uploadees (au serveur lors d'une session precedente) */}
      {serverPhotos.length > 0 && (
        <div className="mb-5 p-4 rounded-lg bg-success/8 border border-success/30">
          <p className="font-body text-xs uppercase tracking-wider text-success font-semibold mb-2">
            ✓ Photos deja sauvegardees ({serverPhotos.length})
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {serverPhotos.map((p) => (
              <div key={p.id} className="relative group aspect-square rounded-md overflow-hidden bg-sand-200 border border-earth/8">
                <img
                  src={resolveFileUrl(p.url ?? '')}
                  alt={p.nom ?? 'Photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {p.sectionPhoto && (
                  <span className="absolute bottom-0 left-0 right-0 bg-earth/75 text-white text-[9px] font-body font-semibold px-1 py-0.5 text-center truncate">
                    {p.sectionPhoto}
                  </span>
                )}
                {onRemoveServerMedia && (
                  <button
                    type="button"
                    onClick={() => onRemoveServerMedia(p.id)}
                    aria-label="Supprimer cette photo"
                    title="Supprimer"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-error text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mini-dashboard temps reel : count + taille + obligatoires */}
      {form.photos.length > 0 && (
        <div className="mb-6 p-3 rounded-lg bg-sand-50 border border-earth/8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-body">
          <span className="inline-flex items-center gap-1.5 text-earth">
            <strong className="font-mono text-base text-earth">{form.photos.length}</strong>
            photo{form.photos.length > 1 ? 's' : ''} ajoutée{form.photos.length > 1 ? 's' : ''}
          </span>
          <span className="text-earth-500">
            Poids total : <strong className="font-mono text-earth">{totalMo.toFixed(1)} Mo</strong>
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 font-semibold',
              hasFacade ? 'text-success' : 'text-error'
            )}
          >
            {hasFacade ? '✓' : '✗'} Façade
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 font-semibold',
              hasSalon ? 'text-success' : 'text-error'
            )}
          >
            {hasSalon ? '✓' : '✗'} Salon
          </span>
        </div>
      )}

      <div className="space-y-4">
        {sectionsRequises.map(({ section, label, required }) => {
          const photosSection = form.photos
            .map((p, i) => ({ ...p, index: i }))
            .filter((p) => p.section === section)
          const hasPhotos = photosSection.length > 0

          return (
            <div key={section} className="rounded-lg border border-earth/8 bg-white p-4">
              <div className="flex items-baseline justify-between mb-3">
                <p className="font-body font-semibold text-earth text-sm">
                  {label}{' '}
                  {required && <span className="text-error text-xs">obligatoire</span>}
                </p>
                <span className="font-body text-xs text-earth-500">
                  {photosSection.length} photo{photosSection.length > 1 ? 's' : ''}
                </span>
              </div>

              {hasPhotos && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                  {photosSection.map((p) => (
                    <div key={p.index} className="relative aspect-square rounded-md overflow-hidden bg-sand-200 group">
                      <img
                        src={URL.createObjectURL(p.file)}
                        alt={p.file.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(p.index)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-error/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Retirer"
                      >
                        <X className="w-3 h-3" strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label
                htmlFor={`upload-${section}`}
                className="flex items-center justify-center gap-2 h-11 rounded-md border-[1.5px] border-dashed border-sand-400 cursor-pointer hover:border-terra/40 hover:bg-sand-50 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-earth-500" strokeWidth={1.75} />
                <span className="font-body text-xs text-earth-600">
                  {hasPhotos ? 'Ajouter une photo' : `Charger une photo (${label.toLowerCase()})`}
                </span>
                <input
                  id={`upload-${section}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => addPhotos(section, e.target.files)}
                />
              </label>

              {required && !hasPhotos && (
                <p className="mt-2 font-body text-xs text-warning inline-flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" strokeWidth={1.75} />
                  Photo {label.toLowerCase()} obligatoire pour publier le bien
                </p>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

// =============================================================================
// Step 5 — Vidéo
// =============================================================================

function Step5Video({
  form,
  update,
  serverVideoUrl = null,
  onRemoveServerVideo,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  serverVideoUrl?: string | null
  onRemoveServerVideo?: () => Promise<void> | void
}) {
  function handleVideo(file: File | null) {
    if (!file) {
      update('video', null)
      return
    }
    if (!VIDEO_TYPES.includes(file.type)) {
      toast.error('Format vidéo non supporté. MP4, MOV ou WebM.')
      return
    }
    if (file.size > MAX_VIDEO_SIZE) {
      const sizeMo = (file.size / (1024 * 1024)).toFixed(1)
      toast.error(
        `Vidéo trop lourde : ${sizeMo} Mo. Taille maximum autorisée : 100 Mo. Compressez la vidéo (HandBrake, format MP4 720p) avant de réessayer.`
      )
      return
    }
    update('video', file)
  }

  return (
    <>
      <h2 className="font-display font-bold text-earth text-xl mb-1 flex items-center gap-2">
        <Video className="w-5 h-5 text-terra" strokeWidth={1.75} />
        Vidéo de visite guidée
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        <strong>Obligatoire</strong>. Une courte vidéo (1 à 3 minutes) qui fait le tour
        du bien. Cela permet à l'admin de faire une validation préalable et aux
        investisseurs de se projeter.
      </p>

      {/* Video deja uploadee sur le serveur (depuis session precedente) */}
      {serverVideoUrl && !form.video && (
        <div className="mb-5 p-4 rounded-lg bg-success/8 border border-success/30">
          <p className="font-body text-xs uppercase tracking-wider text-success font-semibold mb-3">
            ✓ Video deja sauvegardee
          </p>
          <video
            controls
            src={resolveFileUrl(serverVideoUrl)}
            className="w-full rounded-md bg-sand-300 max-h-[300px]"
          />
          {onRemoveServerVideo && (
            <button
              type="button"
              onClick={() => { void onRemoveServerVideo() }}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-body text-earth-600 hover:text-error"
            >
              <X className="w-3 h-3" strokeWidth={2} />
              Remplacer cette vidéo
            </button>
          )}
        </div>
      )}

      {!form.video ? (
        <label
          htmlFor="video-upload"
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-sand-400 rounded-xl p-10 cursor-pointer hover:border-terra hover:bg-white/40 transition-colors"
        >
          <div className="w-14 h-14 rounded-full bg-terra/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-terra" strokeWidth={1.75} />
          </div>
          <div className="text-center">
            <p className="font-body font-semibold text-earth text-sm">
              Cliquez pour choisir votre vidéo
            </p>
            <p className="font-body text-earth-500 text-xs mt-1">
              MP4, MOV ou WebM · <strong>100 Mo max</strong> · 1-3 min recommandé
            </p>
          </div>
          <input
            id="video-upload"
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={(e) => handleVideo(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : (
        <div className="rounded-xl border border-success/40 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-md bg-success/10 flex items-center justify-center flex-shrink-0">
                <PlayCircle className="w-5 h-5 text-success" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="font-body font-semibold text-earth text-sm truncate">
                  {form.video.name}
                </p>
                <p className="font-body text-earth-500 text-xs">
                  {(form.video.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => update('video', null)}>
              <X strokeWidth={1.75} />
            </Button>
          </div>
          <video
            src={URL.createObjectURL(form.video)}
            controls
            className="w-full max-h-96 rounded-md bg-black"
          />
        </div>
      )}

      <div className="mt-4 inline-flex items-start gap-2 text-earth-500 text-xs font-body">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
        Une vidéo prise au smartphone suffit. Filmez le bien pièce par pièce et
        l'extérieur. Évitez les vidéos trop sombres ou tremblantes.
      </div>
    </>
  )
}

// =============================================================================
// Step 6 — Documents legaux (categorises)
// =============================================================================

function Step6Documents({
  form,
  update,
  serverDocuments = [],
  onRemoveServerMedia,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  serverDocuments?: ServerDoc[]
  onRemoveServerMedia?: (mediaId: number) => Promise<void> | void
}) {
  function addDocs(files: FileList | null) {
    if (!files) return
    const valid: DocumentLegal[] = []
    Array.from(files).forEach((f) => {
      if (!DOC_TYPES.includes(f.type)) {
        toast.error(`${f.name} : seuls les PDF sont acceptes.`)
        return
      }
      if (f.size > MAX_DOC_SIZE) {
        toast.error(`${f.name} : taille > 10 Mo.`)
        return
      }
      // Par defaut : AUTRE, l'user choisit ensuite la categorie
      valid.push({ file: f, categorie: 'AUTRE' })
    })
    if (valid.length > 0) {
      update('documents', [...form.documents, ...valid])
    }
  }

  function removeDoc(idx: number) {
    update('documents', form.documents.filter((_, i) => i !== idx))
  }

  function changeCategorie(idx: number, categorie: CategorieDocument) {
    const next = [...form.documents]
    next[idx] = { ...next[idx], categorie }
    update('documents', next)
  }

  // Combine local + serveur pour la validation des categories obligatoires.
  const cats = new Set<string>([
    ...form.documents.map((d) => d.categorie as string),
    ...serverDocuments.map((d) => d.categorieDocument ?? '').filter(Boolean),
  ])
  const requisManquants: string[] = []
  if (!cats.has('TITRE_FONCIER')) requisManquants.push('Titre foncier')
  if (form.statutExploitation === 'DEJA_RENTABLE'
      && !cats.has('CONTRAT_GESTION') && !cats.has('CONTRAT_BAIL')) {
    requisManquants.push('Contrat de gestion ou bail')
  }
  if ((form.statutExploitation === 'EN_CONSTRUCTION' || form.statutExploitation === 'NEUF')
      && !cats.has('PERMIS_CONSTRUIRE')) {
    requisManquants.push('Permis de construire')
  }

  return (
    <>
      <h2 className="font-display font-bold text-earth text-xl mb-1 flex items-center gap-2">
        <FileText className="w-5 h-5 text-terra" strokeWidth={1.75} />
        Documents légaux
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        Téléversez vos documents (PDF uniquement, 10 Mo max chacun) et choisissez la
        catégorie de chaque document. L'admin vérifiera leur authenticité avant validation.
      </p>

      {/* Documents deja uploades sur le serveur (session precedente) */}
      {serverDocuments.length > 0 && (
        <div className="mb-5 p-4 rounded-lg bg-success/8 border border-success/30">
          <p className="font-body text-xs uppercase tracking-wider text-success font-semibold mb-2">
            ✓ Documents deja sauvegardes ({serverDocuments.length})
          </p>
          <ul className="space-y-2">
            {serverDocuments.map((d) => (
              <li key={d.id} className="bg-white border border-earth/10 rounded-lg p-3 flex items-center gap-3">
                <FileText className="w-5 h-5 text-error shrink-0" strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <a
                    href={resolveFileUrl(d.url ?? '')}
                    target="_blank" rel="noopener noreferrer"
                    className="font-body font-semibold text-earth text-sm hover:text-terra truncate block"
                  >
                    {d.nom ?? 'Document'}
                  </a>
                  {d.categorieDocument && (
                    <p className="font-mono text-[11px] text-earth-500">{d.categorieDocument}</p>
                  )}
                </div>
                {onRemoveServerMedia && (
                  <button
                    type="button"
                    onClick={() => onRemoveServerMedia(d.id)}
                    aria-label="Supprimer ce document"
                    title="Supprimer"
                    className="w-8 h-8 rounded-md flex items-center justify-center text-earth-500 hover:bg-error/10 hover:text-error transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Liste des minimums requis selon le statut */}
      <div className={cn(
        'rounded-lg border p-4 mb-5',
        requisManquants.length > 0
          ? 'bg-warning/10 border-warning/40'
          : 'bg-success/10 border-success/40'
      )}>
        <p className={cn(
          'font-body font-semibold text-sm mb-2',
          requisManquants.length > 0 ? 'text-warning' : 'text-success'
        )}>
          {requisManquants.length > 0
            ? `Documents obligatoires manquants (${requisManquants.length})`
            : 'Documents obligatoires fournis'}
        </p>
        {requisManquants.length > 0 ? (
          <ul className="space-y-1">
            {requisManquants.map((r) => (
              <li key={r} className="font-body text-xs text-earth-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body text-xs text-earth-600">Vous pouvez passer à l'étape suivante.</p>
        )}
      </div>

      {/* Zone d'upload */}
      <label
        htmlFor="docs-upload"
        className="block border-2 border-dashed border-earth/20 hover:border-terra/50 rounded-lg p-6 text-center cursor-pointer transition-colors mb-4 bg-white"
      >
        <Upload className="w-8 h-8 text-earth-400 mx-auto mb-2" strokeWidth={1.5} />
        <p className="font-body font-semibold text-earth text-sm mb-1">
          Cliquez pour ajouter des documents PDF
        </p>
        <p className="font-body text-xs text-earth-500">
          Glissez plusieurs fichiers à la fois — vous choisirez la catégorie ensuite.
        </p>
        <input
          id="docs-upload"
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            addDocs(e.target.files)
            e.target.value = ''
          }}
        />
      </label>

      {/* Liste des docs uploadés */}
      {form.documents.length > 0 && (
        <ul className="space-y-2.5">
          {form.documents.map((doc, idx) => (
            <li
              key={idx}
              className="bg-white border border-earth/10 rounded-lg p-3 flex items-center gap-3"
            >
              <FileText className="w-5 h-5 text-error shrink-0" strokeWidth={1.75} />
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-earth text-sm truncate">
                  {doc.file.name}
                </p>
                <p className="font-mono text-[11px] text-earth-500">
                  {(doc.file.size / 1024 / 1024).toFixed(1)} Mo
                </p>
              </div>
              <select
                value={doc.categorie}
                onChange={(e) => changeCategorie(idx, e.target.value as CategorieDocument)}
                aria-label={`Categorie du document ${doc.file.name}`}
                title="Choisir la categorie du document"
                className="px-3 py-1.5 rounded-md border border-earth/15 bg-sand-50 text-earth text-xs font-body font-medium focus:border-terra focus:outline-none"
              >
                {CATEGORIES_DOC.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeDoc(idx)}
                className="w-8 h-8 rounded-md flex items-center justify-center text-earth-500 hover:bg-error/10 hover:text-error transition-colors shrink-0"
                aria-label="Supprimer"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// =============================================================================
// Step 7 — Récap + CGV
// =============================================================================

function Step7Recap({
  form,
  update,
  prixUnitaire,
  onEditStep,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  prixUnitaire: number
  onEditStep: (n: number) => void
}) {
  const ville = form.villeManuelle.trim() || form.ville
  return (
    <>
      <h2 className="font-display font-bold text-earth text-xl mb-1 flex items-center gap-2">
        <FileText className="w-5 h-5 text-terra" strokeWidth={1.75} />
        Récapitulatif
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        Vérifiez avant soumission. Vous pouvez encore modifier chaque section.
      </p>

      <div className="space-y-3">
        <RecapSection title="Localisation" onEdit={() => onEditStep(0)}>
          <Row label="Nom">{form.nom}</Row>
          <Row label="Pays / Ville">
            {form.pays} · {ville}
          </Row>
          {form.adressePrecise && <Row label="Adresse">{form.adressePrecise}</Row>}
        </RecapSection>

        <RecapSection title="Type" onEdit={() => onEditStep(1)}>
          <Row label="Type">{form.typeBien}</Row>
          <Row label="Surface">{form.superficieM2} m²</Row>
          <Row label="Pièces">{form.nombrePieces}{form.nombreChambres ? ` (${form.nombreChambres} chambres)` : ''}</Row>
          <Row label="Équipements">
            {EQUIPEMENTS.filter((e) => form[e.key]).map((e) => e.label).join(', ') || '—'}
          </Row>
        </RecapSection>

        <RecapSection title="État" onEdit={() => onEditStep(2)}>
          <Row label="Statut">{form.statutExploitation === 'NEUF' ? 'Neuf' : 'Déjà rentable'}</Row>
          {form.statutExploitation === 'DEJA_RENTABLE' && (
            <>
              <Row label="Revenu mensuel">
                {form.revenuMensuelActuel.toLocaleString('fr-FR')} {form.deviseLocale}
              </Row>
              <Row label="Source">{form.sourceRevenu}</Row>
            </>
          )}
        </RecapSection>

        <RecapSection title="Finance" onEdit={() => onEditStep(3)}>
          <Row label="Prix total">
            {form.prixVenteTotal.toLocaleString('fr-FR')} {form.deviseLocale}
          </Row>
          <Row label="Fraction vendue">{form.fractionVenduePct}%</Row>
          <Row label="Parts">{form.nombreTotalPart}</Row>
          <Row label="Prix par part">{prixUnitaire.toFixed(2)} {form.deviseLocale}</Row>
          <Row label="Rentabilité prévue">{form.rentabilitePrevue}%/an</Row>
        </RecapSection>

        <RecapSection title="Médias" onEdit={() => onEditStep(4)}>
          <Row label="Photos">{form.photos.length}</Row>
          <Row label="Vidéo">{form.video ? form.video.name : '—'}</Row>
        </RecapSection>
      </div>

      <div className="mt-6 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={form.cguAccepted}
            onCheckedChange={(v) => update('cguAccepted', v === true)}
            className="mt-0.5"
          />
          <span className="font-body text-sm text-earth-700 leading-relaxed">
            J'accepte les CGV de FURSA et je certifie avoir le droit légal de mettre
            en vente ce bien.
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={form.certified}
            onCheckedChange={(v) => update('certified', v === true)}
            className="mt-0.5"
          />
          <span className="font-body text-sm text-earth-700 leading-relaxed">
            Je certifie l'exactitude des informations fournies. Toute fausse déclaration
            peut entraîner le retrait du bien et la fermeture de mon compte.
          </span>
        </label>
      </div>
    </>
  )
}

function RecapSection({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-earth/8 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-body font-semibold text-earth text-sm">{title}</p>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-ocean text-xs font-semibold hover:underline"
        >
          <Edit className="w-3 h-3" strokeWidth={2} />
          Modifier
        </button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="font-body text-earth-600">{label}</span>
      <span className="font-body font-medium text-earth text-right">{children}</span>
    </div>
  )
}

