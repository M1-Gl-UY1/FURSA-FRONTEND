import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Coins,
  Edit,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

import { Money } from '@/components/shared/Money'
import { WizardStepper } from '@/components/shared/WizardStepper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { extractApiError } from '@/lib/api/errors'
import { useDeclarerRevenu } from '@/lib/api/revenus'
import { useMaProprieteProposee } from '@/lib/api/submissions'

const STEPS = ['Période & montant', 'Récap']

type FormState = {
  montantTotal: number
  periodeDebut: string  // YYYY-MM-DD
  periodeFin: string
  certified: boolean
}

function defaultPeriode() {
  const today = new Date()
  const debut = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const fin = new Date(today.getFullYear(), today.getMonth(), 0)
  return {
    debut: debut.toISOString().slice(0, 10),
    fin: fin.toISOString().slice(0, 10),
  }
}

export function DeclarerRevenuPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : NaN

  if (Number.isNaN(id)) return <Navigate to="/mes-proprietes" replace />

  const navigate = useNavigate()
  const { data: propriete, isLoading, isError } = useMaProprieteProposee(id)
  const declarer = useDeclarerRevenu()

  const initialPeriode = defaultPeriode()
  const [step, setStep] = useState<0 | 1>(0)
  const [form, setForm] = useState<FormState>({
    montantTotal: 0,
    periodeDebut: initialPeriode.debut,
    periodeFin: initialPeriode.fin,
    certified: false,
  })

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }))
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40 bg-sand-300" />
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      </div>
    )
  }

  if (isError || !propriete) {
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

  if (propriete.statut !== 'PUBLIEE') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-earth text-xl mb-2">
          Propriété non publiée
        </h2>
        <p className="font-body text-earth-600 text-sm mb-6">
          Vous ne pouvez déclarer un revenu que pour les biens publiés (statut PUBLIEE).
        </p>
        <Button asChild>
          <Link to={`/mes-proprietes/${id}`}>Retour à la propriété</Link>
        </Button>
      </div>
    )
  }

  function step1Valid() {
    return form.montantTotal > 0 && form.periodeDebut && form.periodeFin
  }
  function step2Valid() {
    return form.certified
  }

  function submit() {
    declarer.mutate(
      {
        proprieteId: id,
        montantTotal: form.montantTotal,
        periodeDebut: form.periodeDebut || undefined,
        periodeFin: form.periodeFin || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Déclaration enregistrée. L\'admin examinera votre demande.')
          navigate(`/mes-proprietes/${id}`)
        },
        onError: (err) => {
          toast.error(extractApiError(err, 'Soumission impossible.'))
        },
      }
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to={`/mes-proprietes/${id}`}
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour à la propriété
      </Link>

      <header className="mb-8">
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Déclarer un revenu
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Pour <span className="font-semibold text-earth">{propriete.nom}</span>. La
          déclaration sera examinée par notre équipe avant distribution aux
          investisseurs.
        </p>
      </header>

      <div className="mb-10">
        <WizardStepper steps={STEPS} current={step} />
      </div>

      {step === 0 && (
        <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
          <h2 className="font-display font-bold text-earth text-xl mb-1">
            Période et montant
          </h2>
          <p className="font-body text-earth-600 text-sm mb-6">
            Quelle période couvre ce revenu et quel est son montant ?
          </p>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="montant">Montant total perçu (EUR)</Label>
              <div className="relative">
                <Coins
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none"
                  strokeWidth={1.75}
                />
                <Input
                  id="montant"
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="Ex: 5000"
                  value={form.montantTotal || ''}
                  onChange={(e) =>
                    update('montantTotal', Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  className="pl-11 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debut">Période — début</Label>
                <div className="relative">
                  <CalendarDays
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none"
                    strokeWidth={1.75}
                  />
                  <Input
                    id="debut"
                    type="date"
                    value={form.periodeDebut}
                    onChange={(e) => update('periodeDebut', e.target.value)}
                    className="pl-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fin">Période — fin</Label>
                <div className="relative">
                  <CalendarDays
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none"
                    strokeWidth={1.75}
                  />
                  <Input
                    id="fin"
                    type="date"
                    value={form.periodeFin}
                    onChange={(e) => update('periodeFin', e.target.value)}
                    className="pl-11"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs font-body text-earth-500 inline-flex items-center gap-1">
              <Info className="w-3 h-3" strokeWidth={2} />
              Ce revenu correspond généralement aux loyers ou recettes perçus sur la période indiquée.
            </p>
          </div>

          <div className="mt-7">
            <Button
              size="lg"
              className="w-full"
              onClick={() => setStep(1)}
              disabled={!step1Valid()}
            >
              Continuer
              <ArrowRight strokeWidth={2} />
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
          <h2 className="font-display font-bold text-earth text-xl mb-1">
            Récapitulatif
          </h2>
          <p className="font-body text-earth-600 text-sm mb-6">
            Vérifiez les informations avant soumission.
          </p>

          <div className="bg-white rounded-lg border border-earth/8 p-5 mb-6 space-y-3">
            <Row label="Propriété">
              <span className="font-body font-semibold text-earth">{propriete.nom}</span>
            </Row>
            <Row label="Période">
              <span className="font-mono text-earth text-sm">
                {formatDate(form.periodeDebut)} — {formatDate(form.periodeFin)}
              </span>
            </Row>
            <div className="pt-3 mt-3 border-t border-earth/8">
              <Row label="Montant total">
                <Money
                  amount={form.montantTotal}
                  mono={false}
                  className="font-mono font-bold text-earth text-lg"
                />
              </Row>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(0)}
            className="inline-flex items-center gap-1 text-ocean text-xs font-semibold hover:underline mb-6"
          >
            <Edit className="w-3 h-3" strokeWidth={2} />
            Modifier les informations
          </button>

          <label className="flex items-start gap-3 cursor-pointer mb-7">
            <Checkbox
              checked={form.certified}
              onCheckedChange={(v) => update('certified', v === true)}
              className="mt-0.5"
            />
            <span className="font-body text-sm text-earth-700 leading-relaxed">
              Je certifie l'exactitude des informations fournies. La distribution
              ne sera effectuée qu'après validation par l'équipe Fursa.
            </span>
          </label>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              className="sm:flex-1"
              onClick={() => setStep(0)}
              disabled={declarer.isPending}
            >
              <ArrowLeft strokeWidth={2} />
              Retour
            </Button>
            <Button
              size="lg"
              className="sm:flex-[2]"
              onClick={submit}
              disabled={!step2Valid() || declarer.isPending}
            >
              {declarer.isPending ? (
                'Envoi...'
              ) : (
                <>
                  <CheckCircle2 strokeWidth={2} />
                  Soumettre la déclaration
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-earth-600 text-sm font-body">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}
