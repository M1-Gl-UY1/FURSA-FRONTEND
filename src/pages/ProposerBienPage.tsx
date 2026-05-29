import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { usePays, useVilles } from '@/lib/api/geo'
import {
  useSoumettreBien,
  type PhotoStructuree,
} from '@/lib/api/submissions'
import type {
  SectionPhoto,
  SourceRevenu,
  StatutExploitation,
  TypeBien,
} from '@/lib/api/types'
import { extractApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

const STEPS = [
  'Localisation',
  'Type & équipements',
  'État du bien',
  'Finance',
  'Photos',
  'Vidéo',
  'Récap',
]

const MAX_VIDEO_SIZE = 200 * 1024 * 1024 // 200 Mo
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTO_SIZE = 20 * 1024 * 1024 // 20 Mo par photo

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
  // Etape 5 & 6
  photos: PhotoStructuree[]
  video: File | null
  documents: File[]
  // Etape 7
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
  const [step, setStep] = useState<number>(0)
  const [form, setForm] = useState<FormState>(() => {
    const draft = loadDraft()
    return draft ? { ...INITIAL, ...draft, photos: [], video: null, documents: [] } : INITIAL
  })
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const soumettre = useSoumettreBien()

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
    // 4 — Photos : façade + salon obligatoires
    form.photos.some((p) => p.section === 'FACADE') &&
      form.photos.some((p) => p.section === 'SALON'),
    // 5 — Vidéo obligatoire (Hugh)
    form.video !== null,
    // 6 — Récap
    form.cguAccepted && form.certified,
  ]

  // ---- Calculs dérivés ----
  const prixUnitaire = useMemo(() => {
    if (form.nombreTotalPart <= 0) return 0
    const cible = (form.prixVenteTotal * form.fractionVenduePct) / 100
    return cible / form.nombreTotalPart
  }, [form.prixVenteTotal, form.fractionVenduePct, form.nombreTotalPart])

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
        <p className="font-body text-xs uppercase tracking-widest text-ocean font-semibold mb-2 inline-flex items-center gap-1.5">
          <HomeIcon className="w-3.5 h-3.5" strokeWidth={2} />
          Espace propriétaire
        </p>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Proposer un bien
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Décrivez votre bien immobilier pour le mettre en vente fractionnée sur FURSA.
          Validation par un admin avant publication.
        </p>
      </header>

      <div className="mb-8">
        <WizardStepper steps={STEPS} current={step} />
      </div>

      <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
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
        {step === 3 && <Step3Finance form={form} update={update} prixUnitaire={prixUnitaire} />}
        {step === 4 && <Step4Photos form={form} update={update} />}
        {step === 5 && <Step5Video form={form} update={update} />}
        {step === 6 && (
          <Step6Recap
            form={form}
            update={update}
            prixUnitaire={prixUnitaire}
            onEditStep={(n) => setStep(n)}
          />
        )}

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
              onClick={() => setStep(step + 1)}
              disabled={!stepValid[step]}
            >
              Continuer
              <ArrowRight strokeWidth={2} />
            </Button>
          ) : (
            <Button
              size="lg"
              className="sm:flex-[2]"
              onClick={submit}
              disabled={!stepValid[6] || soumettre.isPending}
            >
              {soumettre.isPending ? (
                <>
                  <Loader2 className="animate-spin" strokeWidth={2} />
                  {uploadProgress < 100 ? `Envoi… ${uploadProgress}%` : 'Finalisation…'}
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
                <Skeleton className="h-11 rounded-md bg-sand-300" />
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
                <Label>Source <span className="text-error">*</span></Label>
                <div className="flex gap-1.5">
                  {(['BAIL', 'AIRBNB', 'AUTRE'] as const).map((src) => (
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
                      {src === 'BAIL' ? 'Bail' : src === 'AIRBNB' ? 'Airbnb' : 'Autre'}
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
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  prixUnitaire: number
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
            <Input
              id="devise"
              value={form.deviseLocale}
              onChange={(e) => update('deviseLocale', e.target.value.toUpperCase().slice(0, 3))}
              maxLength={3}
              className="font-mono uppercase text-center"
            />
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

function Step4Photos({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
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
        toast.error(`Photo trop lourde : ${f.name} (max 20 Mo)`)
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

  return (
    <>
      <h2 className="font-display font-bold text-earth text-xl mb-1 flex items-center gap-2">
        <Camera className="w-5 h-5 text-terra" strokeWidth={1.75} />
        Photos structurées
      </h2>
      <p className="font-body text-earth-600 text-sm mb-1">
        Une photo par section. Façade et salon sont obligatoires.
      </p>
      <p className="font-body text-earth-500 text-xs mb-6">
        Formats acceptés : JPG, PNG, WebP · <strong>20 Mo max</strong> par photo.
      </p>

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
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
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
      toast.error('Vidéo trop lourde (max 200 Mo).')
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
              MP4, MOV ou WebM · <strong>200 Mo max</strong> · 1-3 min recommandé
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
// Step 6 — Récap + CGV
// =============================================================================

function Step6Recap({
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

