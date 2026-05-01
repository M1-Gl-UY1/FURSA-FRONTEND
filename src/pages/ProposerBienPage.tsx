import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Edit,
  FileText,
  Image as ImageIcon,
  Info,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'

import { FileDropzone } from '@/components/shared/FileDropzone'
import { Money } from '@/components/shared/Money'
import { WizardStepper } from '@/components/shared/WizardStepper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSoumettreBien } from '@/lib/api/submissions'
import { extractApiError } from '@/lib/api/errors'

const STEPS = ['Infos', 'Finances', 'Médias', 'Récap']

type FormState = {
  nom: string
  localisation: string
  description: string
  nombreTotalPart: number
  prixUnitairePart: number
  rentabilitePrevue: number
  photos: File[]
  documents: File[]
  cguAccepted: boolean
  certified: boolean
}

const INITIAL: FormState = {
  nom: '',
  localisation: '',
  description: '',
  nombreTotalPart: 100,
  prixUnitairePart: 100,
  rentabilitePrevue: 8,
  photos: [],
  documents: [],
  cguAccepted: false,
  certified: false,
}

export function ProposerBienPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [form, setForm] = useState<FormState>(INITIAL)
  const soumettre = useSoumettreBien()

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }))
  }

  function step1Valid() {
    return form.nom.trim().length >= 3 && form.localisation.trim().length >= 3
  }
  function step2Valid() {
    return form.nombreTotalPart >= 1 && form.prixUnitairePart > 0 && form.rentabilitePrevue >= 0
  }
  function step3Valid() {
    return form.photos.length >= 1
  }
  function step4Valid() {
    return form.cguAccepted && form.certified
  }

  function submit() {
    soumettre.mutate(
      {
        submission: {
          nom: form.nom,
          localisation: form.localisation,
          description: form.description || undefined,
          nombreTotalPart: form.nombreTotalPart,
          prixUnitairePart: form.prixUnitairePart,
          rentabilitePrevue: form.rentabilitePrevue,
        },
        files: [...form.photos, ...form.documents],
      },
      {
        onSuccess: () => {
          toast.success('Soumission enregistrée. L\'admin vous contactera après examen.')
          navigate('/mes-proprietes')
        },
        onError: (err) => {
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
        Retour à mes propriétés
      </Link>

      <header className="mb-8">
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Proposer un bien
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Soumettez votre propriété à la communauté Fursa. Notre équipe l'examinera
          avant publication.
        </p>
      </header>

      <div className="mb-10">
        <WizardStepper steps={STEPS} current={step} />
      </div>

      {step === 0 && (
        <Step1Infos
          form={form}
          update={update}
          onContinue={() => setStep(1)}
          canContinue={step1Valid()}
        />
      )}
      {step === 1 && (
        <Step2Finances
          form={form}
          update={update}
          onBack={() => setStep(0)}
          onContinue={() => setStep(2)}
          canContinue={step2Valid()}
        />
      )}
      {step === 2 && (
        <Step3Medias
          form={form}
          update={update}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
          canContinue={step3Valid()}
        />
      )}
      {step === 3 && (
        <Step4Recap
          form={form}
          update={update}
          onBack={() => setStep(2)}
          onSubmit={submit}
          canSubmit={step4Valid()}
          onEditStep={(s) => setStep(s)}
          isPending={soumettre.isPending}
        />
      )}
    </div>
  )
}

// ============================================================================
// Étape 1 — Infos générales
// ============================================================================

type StepProps<K extends keyof FormState = keyof FormState> = {
  form: FormState
  update: <T extends K>(key: T, value: FormState[T]) => void
}

function Step1Infos({
  form,
  update,
  onContinue,
  canContinue,
}: StepProps & { onContinue: () => void; canContinue: boolean }) {
  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
      <h2 className="font-display font-bold text-earth text-xl mb-1">
        Informations générales
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        Décrivez votre propriété en quelques mots.
      </p>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="nom">Nom du bien</Label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none" strokeWidth={1.75} />
            <Input
              id="nom"
              placeholder="Ex: Villa Fumba Town"
              value={form.nom}
              onChange={(e) => update('nom', e.target.value)}
              className="pl-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loc">Localisation</Label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none" strokeWidth={1.75} />
            <Input
              id="loc"
              placeholder="Ex: Zanzibar, Tanzanie"
              value={form.localisation}
              onChange={(e) => update('localisation', e.target.value)}
              className="pl-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">Description (optionnel)</Label>
          <textarea
            id="desc"
            placeholder="Décrivez le bien : type, surface, atouts, environnement..."
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={5}
            className="w-full rounded-md border-[1.5px] border-sand-400 bg-white px-4 py-3 text-sm font-body text-earth placeholder:text-earth-400 focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15 transition-colors resize-y"
          />
        </div>
      </div>

      <div className="mt-7">
        <Button size="lg" className="w-full" onClick={onContinue} disabled={!canContinue}>
          Continuer
          <ArrowRight strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Étape 2 — Caractéristiques financières
// ============================================================================

function Step2Finances({
  form,
  update,
  onBack,
  onContinue,
  canContinue,
}: StepProps & { onBack: () => void; onContinue: () => void; canContinue: boolean }) {
  const valeurTotale = form.nombreTotalPart * form.prixUnitairePart
  const revenuAnnuelTotal = (valeurTotale * form.rentabilitePrevue) / 100

  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
      <h2 className="font-display font-bold text-earth text-xl mb-1">
        Caractéristiques financières
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        Combien de parts proposez-vous, et à quel prix ?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <div className="space-y-2">
          <Label htmlFor="parts">Nombre de parts</Label>
          <Input
            id="parts"
            type="number"
            min={1}
            value={form.nombreTotalPart}
            onChange={(e) => update('nombreTotalPart', Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prix">Prix par part (EUR)</Label>
          <Input
            id="prix"
            type="number"
            min={0.01}
            step={0.01}
            value={form.prixUnitairePart}
            onChange={(e) =>
              update('prixUnitairePart', Math.max(0.01, parseFloat(e.target.value) || 0.01))
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="renta">Rentabilité estimée (% / an)</Label>
          <Input
            id="renta"
            type="number"
            min={0}
            step={0.5}
            value={form.rentabilitePrevue}
            onChange={(e) =>
              update('rentabilitePrevue', Math.max(0, parseFloat(e.target.value) || 0))
            }
          />
          <p className="text-xs font-body text-earth-500 inline-flex items-center gap-1">
            <Info className="w-3 h-3" strokeWidth={2} />
            Estimation basée sur revenus locatifs ou valorisation prévue.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-earth/8 p-5 mb-7 space-y-3">
        <Row label="Valeur totale du bien">
          <Money amount={valeurTotale} mono={false} className="font-mono font-bold text-earth text-base" />
        </Row>
        <Row label="Revenus annuels prévisionnels">
          <Money amount={revenuAnnuelTotal} mono={false} className="font-mono font-bold text-success" />
        </Row>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button variant="outline" size="lg" className="sm:flex-1" onClick={onBack}>
          <ArrowLeft strokeWidth={2} />
          Retour
        </Button>
        <Button
          size="lg"
          className="sm:flex-[2]"
          onClick={onContinue}
          disabled={!canContinue}
        >
          Continuer
          <ArrowRight strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Étape 3 — Médias & documents
// ============================================================================

function Step3Medias({
  form,
  update,
  onBack,
  onContinue,
  canContinue,
}: StepProps & { onBack: () => void; onContinue: () => void; canContinue: boolean }) {
  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
      <h2 className="font-display font-bold text-earth text-xl mb-1">
        Médias & documents
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        Ajoutez des photos du bien et tout document utile (titre de propriété, plans...).
      </p>

      <section className="mb-6">
        <Label className="mb-3 inline-flex items-center gap-2">
          <ImageIcon className="w-4 h-4" strokeWidth={1.75} />
          Photos (au moins 1, max 12)
        </Label>
        <FileDropzone
          files={form.photos}
          onChange={(f) => update('photos', f)}
          kind="image"
          maxFiles={12}
          hint="JPG, PNG, WEBP — max 10 MB par photo"
        />
        {!canContinue && form.photos.length === 0 && (
          <p className="text-error text-xs font-body mt-2 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" strokeWidth={2} />
            Au moins une photo est requise.
          </p>
        )}
      </section>

      <section className="mb-7">
        <Label className="mb-3 inline-flex items-center gap-2">
          <FileText className="w-4 h-4" strokeWidth={1.75} />
          Documents (optionnel, max 5)
        </Label>
        <FileDropzone
          files={form.documents}
          onChange={(f) => update('documents', f)}
          kind="pdf"
          maxFiles={5}
          hint="PDF — max 10 MB par document"
        />
      </section>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button variant="outline" size="lg" className="sm:flex-1" onClick={onBack}>
          <ArrowLeft strokeWidth={2} />
          Retour
        </Button>
        <Button
          size="lg"
          className="sm:flex-[2]"
          onClick={onContinue}
          disabled={!canContinue}
        >
          Continuer
          <ArrowRight strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Étape 4 — Récap
// ============================================================================

function Step4Recap({
  form,
  update,
  onBack,
  onSubmit,
  canSubmit,
  onEditStep,
  isPending,
}: StepProps & {
  onBack: () => void
  onSubmit: () => void
  canSubmit: boolean
  onEditStep: (step: 0 | 1 | 2) => void
  isPending: boolean
}) {
  const valeurTotale = form.nombreTotalPart * form.prixUnitairePart

  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
      <h2 className="font-display font-bold text-earth text-xl mb-1">
        Récapitulatif
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        Vérifiez les informations avant de soumettre.
      </p>

      {/* Bloc Infos */}
      <RecapBlock title="Informations générales" onEdit={() => onEditStep(0)}>
        <Row label="Nom">
          <span className="font-body font-semibold text-earth">{form.nom}</span>
        </Row>
        <Row label="Localisation">
          <span className="font-body text-earth">{form.localisation}</span>
        </Row>
        {form.description && (
          <div className="pt-2 mt-2 border-t border-earth/8">
            <p className="font-body text-xs text-earth-500 mb-1">Description</p>
            <p className="font-body text-earth-700 text-sm whitespace-pre-line">
              {form.description}
            </p>
          </div>
        )}
      </RecapBlock>

      {/* Bloc Finances */}
      <RecapBlock title="Caractéristiques financières" onEdit={() => onEditStep(1)}>
        <Row label="Nombre de parts">
          <span className="font-mono font-semibold text-earth">
            {form.nombreTotalPart.toLocaleString('fr-FR')}
          </span>
        </Row>
        <Row label="Prix unitaire">
          <Money amount={form.prixUnitairePart} mono={false} className="font-mono font-semibold" />
        </Row>
        <Row label="Rentabilité estimée">
          <span className="font-mono font-semibold text-success">
            {form.rentabilitePrevue}% / an
          </span>
        </Row>
        <div className="pt-2 mt-2 border-t border-earth/8">
          <Row label="Valeur totale">
            <Money
              amount={valeurTotale}
              mono={false}
              className="font-mono font-bold text-terra text-base"
            />
          </Row>
        </div>
      </RecapBlock>

      {/* Bloc Médias */}
      <RecapBlock title="Médias & documents" onEdit={() => onEditStep(2)}>
        <Row label="Photos">
          <span className="font-mono text-earth">{form.photos.length}</span>
        </Row>
        <Row label="Documents PDF">
          <span className="font-mono text-earth">{form.documents.length}</span>
        </Row>
      </RecapBlock>

      {/* Conditions */}
      <div className="space-y-3 mb-7">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={form.certified}
            onCheckedChange={(v) => update('certified', v === true)}
            className="mt-0.5"
          />
          <span className="font-body text-sm text-earth-700 leading-relaxed">
            Je certifie être le propriétaire légal du bien et que toutes les
            informations fournies sont exactes.
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={form.cguAccepted}
            onCheckedChange={(v) => update('cguAccepted', v === true)}
            className="mt-0.5"
          />
          <span className="font-body text-sm text-earth-700 leading-relaxed">
            J'accepte les{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                toast.info('CGU propriétaires bientôt disponibles.')
              }}
              className="text-ocean font-semibold hover:underline"
            >
              conditions générales propriétaires
            </a>
            .
          </span>
        </label>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button variant="outline" size="lg" className="sm:flex-1" onClick={onBack} disabled={isPending}>
          <ArrowLeft strokeWidth={2} />
          Retour
        </Button>
        <Button
          size="lg"
          className="sm:flex-[2]"
          onClick={onSubmit}
          disabled={!canSubmit || isPending}
        >
          {isPending ? 'Envoi en cours...' : (
            <>
              <CheckCircle2 strokeWidth={2} />
              Soumettre pour validation
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Sous-composants
// ============================================================================

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-earth-600 text-sm font-body">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}

function RecapBlock({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-lg border border-earth/8 p-5 mb-4">
      <header className="flex items-center justify-between mb-3 pb-3 border-b border-earth/8">
        <h3 className="font-display font-semibold text-earth text-sm">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-ocean text-xs font-semibold hover:underline"
        >
          <Edit className="w-3 h-3" strokeWidth={2} />
          Modifier
        </button>
      </header>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
