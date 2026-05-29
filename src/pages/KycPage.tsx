import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  IdCard,
  Loader2,
  Upload,
  User as UserIcon,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { WizardStepper } from '@/components/shared/WizardStepper'
import { useKycMe, useKycSubmit } from '@/lib/api/kyc'
import { extractApiError } from '@/lib/api/errors'
import type { KycSubmitData, SourceFonds } from '@/lib/api/types'

const STEPS = ['Identité', 'Documents', 'Déclaration', 'Récap']

const SOURCE_FONDS_OPTIONS: { value: SourceFonds; label: string }[] = [
  { value: 'SALAIRE', label: 'Salaire / revenu professionnel' },
  { value: 'EPARGNE', label: 'Épargne personnelle' },
  { value: 'HERITAGE', label: 'Héritage' },
  { value: 'BUSINESS', label: 'Revenu d\'activité indépendante' },
  { value: 'VENTE_BIEN', label: 'Vente d\'un bien immobilier' },
  { value: 'AUTRE', label: 'Autre' },
]

const MAX_FILE_MB = 10

export function KycPage() {
  const { data: me, isLoading } = useKycMe()
  const submitMutation = useKycSubmit()

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [form, setForm] = useState<KycSubmitData>({
    nationalite: '',
    dateNaissance: '',
    paysResidence: '',
    adresse: '',
    sourceFonds: 'SALAIRE',
    isPep: false,
    declarationSurHonneur: false,
  })
  const [documentIdentite, setDocumentIdentite] = useState<File | null>(null)
  const [documentDomicile, setDocumentDomicile] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-12 w-full mb-8" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  // Si deja APPROVED, on bloque l'acces au wizard
  if (me?.statut === 'APPROVED') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-earth text-xl mb-2">Identité vérifiée</h2>
        <p className="font-body text-earth-600 text-sm mb-6">
          Votre dossier KYC est déjà approuvé. Vous pouvez investir librement.
        </p>
        <Button asChild>
          <Link to="/opportunites">Voir les opportunités</Link>
        </Button>
      </div>
    )
  }

  // Si PENDING/IN_REVIEW, on affiche une page d'attente
  if (me?.statut === 'PENDING' || me?.statut === 'IN_REVIEW') {
    return <KycWaitingScreen submission={me.submission!} />
  }

  function handleSubmit() {
    if (!documentIdentite || !documentDomicile || !selfie) {
      toast.error('Tous les documents sont obligatoires')
      return
    }
    submitMutation.mutate(
      { data: form, documentIdentite, documentDomicile, selfie },
      {
        onSuccess: () => {
          toast.success('Dossier soumis avec succès')
          // useKycMe va invalidate -> on bascule auto sur l'écran d'attente au prochain refetch
        },
        onError: (err) => toast.error(extractApiError(err, 'Soumission impossible')),
      }
    )
  }

  const previousMotifRefus = me?.statut === 'REJECTED' ? me.submission?.motifRefus : null

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/compte"
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour au profil
      </Link>

      <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-2">
        Vérification d'identité (KYC)
      </h1>
      <p className="font-body text-earth-600 text-sm mb-8">
        Obligatoire pour pouvoir investir. Vos données restent strictement confidentielles et
        ne sont utilisées qu'à des fins de conformité.
      </p>

      {previousMotifRefus && (
        <div className="flex items-start gap-3 px-4 py-3 mb-8 rounded-lg border border-error/30 bg-error/10">
          <XCircle className="w-5 h-5 text-error shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="font-body font-semibold text-earth">Précédent refus</p>
            <p className="font-body text-earth-600 text-xs mt-0.5">{previousMotifRefus}</p>
          </div>
        </div>
      )}

      <div className="mb-10">
        <WizardStepper steps={STEPS} current={step} />
      </div>

      {step === 0 && (
        <Step1Identite form={form} onChange={setForm} onContinue={() => setStep(1)} />
      )}
      {step === 1 && (
        <Step2Documents
          documentIdentite={documentIdentite}
          documentDomicile={documentDomicile}
          selfie={selfie}
          onIdentite={setDocumentIdentite}
          onDomicile={setDocumentDomicile}
          onSelfie={setSelfie}
          onBack={() => setStep(0)}
          onContinue={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <Step3Declaration
          form={form}
          onChange={setForm}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step4Recap
          form={form}
          onChange={setForm}
          documentIdentite={documentIdentite}
          documentDomicile={documentDomicile}
          selfie={selfie}
          onBack={() => setStep(2)}
          onSubmit={handleSubmit}
          isPending={submitMutation.isPending}
        />
      )}
    </div>
  )
}

// =============================================================================
// Etape 1 - Identite
// =============================================================================

function Step1Identite({
  form,
  onChange,
  onContinue,
}: {
  form: KycSubmitData
  onChange: (f: KycSubmitData) => void
  onContinue: () => void
}) {
  const isValid =
    form.nationalite.trim() && form.dateNaissance && form.paysResidence.trim() && form.adresse.trim().length > 5

  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-6">
        <UserIcon className="w-5 h-5 text-ocean" strokeWidth={1.75} />
        <h2 className="font-display font-bold text-earth text-xl">Informations personnelles</h2>
      </div>

      <div className="space-y-5">
        <div>
          <Label htmlFor="nationalite">Nationalité</Label>
          <Input
            id="nationalite"
            value={form.nationalite}
            onChange={(e) => onChange({ ...form, nationalite: e.target.value })}
            placeholder="Camerounaise"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="dateNaissance">Date de naissance</Label>
          <Input
            id="dateNaissance"
            type="date"
            value={form.dateNaissance}
            onChange={(e) => onChange({ ...form, dateNaissance: e.target.value })}
            max={new Date().toISOString().slice(0, 10)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="paysResidence">Pays de résidence</Label>
          <Input
            id="paysResidence"
            value={form.paysResidence}
            onChange={(e) => onChange({ ...form, paysResidence: e.target.value })}
            placeholder="Cameroun"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="adresse">Adresse complète</Label>
          <Input
            id="adresse"
            value={form.adresse}
            onChange={(e) => onChange({ ...form, adresse: e.target.value })}
            placeholder="Rue, ville, code postal"
            className="mt-2"
          />
        </div>
      </div>

      <Button size="lg" className="w-full mt-8" onClick={onContinue} disabled={!isValid}>
        Continuer
        <ArrowRight strokeWidth={2} />
      </Button>
    </div>
  )
}

// =============================================================================
// Etape 2 - Documents
// =============================================================================

function Step2Documents({
  documentIdentite,
  documentDomicile,
  selfie,
  onIdentite,
  onDomicile,
  onSelfie,
  onBack,
  onContinue,
}: {
  documentIdentite: File | null
  documentDomicile: File | null
  selfie: File | null
  onIdentite: (f: File | null) => void
  onDomicile: (f: File | null) => void
  onSelfie: (f: File | null) => void
  onBack: () => void
  onContinue: () => void
}) {
  const isValid = documentIdentite && documentDomicile && selfie

  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-6">
        <IdCard className="w-5 h-5 text-ocean" strokeWidth={1.75} />
        <h2 className="font-display font-bold text-earth text-xl">Documents</h2>
      </div>

      <FileField
        label="Pièce d'identité"
        description="CNI ou passeport, photo lisible (recto-verso)."
        accept="image/jpeg,image/png,application/pdf"
        file={documentIdentite}
        onChange={onIdentite}
      />
      <FileField
        label="Justificatif de domicile"
        description="Facture utilities, attestation, ou contrat de bail (< 3 mois)."
        accept="image/jpeg,image/png,application/pdf"
        file={documentDomicile}
        onChange={onDomicile}
      />
      <FileField
        label="Selfie"
        description="Photo récente de votre visage, tête nue, sans lunettes de soleil."
        accept="image/jpeg,image/png"
        file={selfie}
        onChange={onSelfie}
      />

      <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
        <Button variant="outline" size="lg" onClick={onBack} className="sm:flex-1">
          <ArrowLeft strokeWidth={2} />
          Retour
        </Button>
        <Button size="lg" onClick={onContinue} disabled={!isValid} className="sm:flex-[2]">
          Continuer
          <ArrowRight strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}

function FileField({
  label,
  description,
  accept,
  file,
  onChange,
}: {
  label: string
  description: string
  accept: string
  file: File | null
  onChange: (f: File | null) => void
}) {
  const sizeMb = file ? (file.size / 1024 / 1024).toFixed(2) : null
  const tooBig = file && file.size > MAX_FILE_MB * 1024 * 1024

  return (
    <div className="mb-5">
      <p className="font-body font-semibold text-earth text-sm mb-1">{label}</p>
      <p className="font-body text-earth-500 text-xs mb-2">{description}</p>
      <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-earth/15 bg-white cursor-pointer hover:border-ocean hover:bg-ocean/5 transition-colors">
        <Upload className="w-5 h-5 text-earth-400 shrink-0" strokeWidth={1.75} />
        <div className="flex-1 min-w-0">
          {file ? (
            <>
              <p className="font-body text-sm text-earth font-semibold truncate">{file.name}</p>
              <p className={`font-body text-xs ${tooBig ? 'text-error' : 'text-earth-500'}`}>
                {sizeMb} MB{tooBig ? ` (max ${MAX_FILE_MB} MB)` : ''}
              </p>
            </>
          ) : (
            <p className="font-body text-sm text-earth-500">Cliquez pour choisir un fichier</p>
          )}
        </div>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            if (f && f.size > MAX_FILE_MB * 1024 * 1024) {
              toast.error(`Fichier trop volumineux (max ${MAX_FILE_MB} MB)`)
              return
            }
            onChange(f)
          }}
        />
      </label>
    </div>
  )
}

// =============================================================================
// Etape 3 - Declaration (AML)
// =============================================================================

function Step3Declaration({
  form,
  onChange,
  onBack,
  onContinue,
}: {
  form: KycSubmitData
  onChange: (f: KycSubmitData) => void
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-6">
        <FileCheck className="w-5 h-5 text-ocean" strokeWidth={1.75} />
        <h2 className="font-display font-bold text-earth text-xl">Déclaration (anti-blanchiment)</h2>
      </div>

      <div className="space-y-5">
        <div>
          <Label htmlFor="sourceFonds">Source des fonds investis</Label>
          <select
            id="sourceFonds"
            aria-label="Source des fonds"
            value={form.sourceFonds}
            onChange={(e) => onChange({ ...form, sourceFonds: e.target.value as SourceFonds })}
            className="mt-2 flex h-11 w-full rounded-md border-[1.5px] border-sand-400 bg-white px-3 text-sm focus:outline-none focus:border-ocean"
          >
            {SOURCE_FONDS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={form.isPep}
            onCheckedChange={(v) => onChange({ ...form, isPep: v === true })}
            className="mt-0.5"
          />
          <span className="font-body text-sm text-earth-700">
            Je suis une <strong>personne politiquement exposée</strong> (PEP) ou un membre proche de la famille
            d'une telle personne. Cocher uniquement si applicable (ministre, parlementaire, dirigeant
            d'entreprise publique, magistrat, etc.).
          </span>
        </label>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
        <Button variant="outline" size="lg" onClick={onBack} className="sm:flex-1">
          <ArrowLeft strokeWidth={2} />
          Retour
        </Button>
        <Button size="lg" onClick={onContinue} className="sm:flex-[2]">
          Continuer
          <ArrowRight strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Etape 4 - Récap + Soumission
// =============================================================================

function Step4Recap({
  form,
  onChange,
  documentIdentite,
  documentDomicile,
  selfie,
  onBack,
  onSubmit,
  isPending,
}: {
  form: KycSubmitData
  onChange: (f: KycSubmitData) => void
  documentIdentite: File | null
  documentDomicile: File | null
  selfie: File | null
  onBack: () => void
  onSubmit: () => void
  isPending: boolean
}) {
  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
      <h2 className="font-display font-bold text-earth text-xl mb-6">Récapitulatif</h2>

      <div className="bg-white rounded-lg border border-earth/8 p-5 mb-6 space-y-2 text-sm font-body">
        <Row label="Nationalité" value={form.nationalite} />
        <Row label="Date de naissance" value={form.dateNaissance} />
        <Row label="Pays de résidence" value={form.paysResidence} />
        <Row label="Adresse" value={form.adresse} />
        <Row label="Source des fonds" value={SOURCE_FONDS_OPTIONS.find((o) => o.value === form.sourceFonds)?.label ?? form.sourceFonds} />
        <Row label="PEP" value={form.isPep ? 'Oui' : 'Non'} />
        <Row label="Pièce d'identité" value={documentIdentite?.name ?? '—'} />
        <Row label="Justif domicile" value={documentDomicile?.name ?? '—'} />
        <Row label="Selfie" value={selfie?.name ?? '—'} />
      </div>

      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <Checkbox
          checked={form.declarationSurHonneur}
          onCheckedChange={(v) => onChange({ ...form, declarationSurHonneur: v === true })}
          className="mt-0.5"
        />
        <span className="font-body text-sm text-earth-700 leading-relaxed">
          Je certifie sur l'honneur l'exactitude des informations et documents fournis. Toute fausse
          déclaration peut entraîner le rejet de mon dossier et des poursuites légales.
        </span>
      </label>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button variant="outline" size="lg" onClick={onBack} disabled={isPending} className="sm:flex-1">
          <ArrowLeft strokeWidth={2} />
          Retour
        </Button>
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={!form.declarationSurHonneur || isPending}
          className="sm:flex-[2]"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              Envoi en cours...
            </>
          ) : (
            <>Soumettre le dossier</>
          )}
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="text-earth-600">{label}</span>
      <span className="text-earth font-semibold text-right break-all">{value}</span>
    </div>
  )
}

// =============================================================================
// Ecran d'attente apres soumission
// =============================================================================

function KycWaitingScreen({ submission }: { submission: { id: number; submittedAt: string; statut: string } }) {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-ocean/15 animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-ocean flex items-center justify-center">
          <FileCheck className="w-10 h-10 text-white" strokeWidth={2} />
        </div>
      </div>
      <h1 className="font-display font-bold text-earth text-2xl mb-2">Dossier en cours d'examen</h1>
      <p className="font-body text-earth-600 text-sm mb-8 max-w-md mx-auto">
        Votre dossier KYC a été soumis le {new Date(submission.submittedAt).toLocaleDateString('fr-FR')}.
        Un agent FURSA va l'examiner dans les 24 à 72h. Vous recevrez une notification dès la décision.
      </p>
      <div className="bg-white rounded-lg border border-earth/8 p-5 max-w-md mx-auto mb-6 text-left">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-ocean animate-pulse" />
          <span className="font-body text-earth font-semibold text-sm">Statut : {submission.statut}</span>
        </div>
      </div>
      <Button asChild variant="outline">
        <Link to="/compte">Retour au profil</Link>
      </Button>
    </div>
  )
}
