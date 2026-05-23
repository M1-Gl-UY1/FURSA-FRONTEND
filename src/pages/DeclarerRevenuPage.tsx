import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Coins,
  Edit,
  FileText,
  Info,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Money } from '@/components/shared/Money'
import { StatutDeclarationBadge } from '@/components/shared/StatutDeclarationBadge'
import { WizardStepper } from '@/components/shared/WizardStepper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { extractApiError } from '@/lib/api/errors'
import { useDeclarerRevenuMultipart, useStatutDeclaration } from '@/lib/api/revenus'
import { useMaProprieteProposee } from '@/lib/api/submissions'
import { cn } from '@/lib/utils'

const STEPS = ['Période & montant', 'Justificatif', 'Récap']

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

type FormState = {
  montantTotal: number
  periodeDebut: string
  periodeFin: string
  justificatif: File | null
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
  const { data: statut } = useStatutDeclaration(Number.isNaN(id) ? null : id)
  const declarer = useDeclarerRevenuMultipart()

  const initialPeriode = defaultPeriode()
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [form, setForm] = useState<FormState>({
    montantTotal: 0,
    periodeDebut: initialPeriode.debut,
    periodeFin: initialPeriode.fin,
    justificatif: null,
    certified: false,
  })

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }))
  }

  function handleFile(file: File | null) {
    if (!file) {
      update('justificatif', null)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Fichier trop volumineux (max 10 MB).')
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Format non supporté. PDF, JPG, PNG ou WebP uniquement.')
      return
    }
    update('justificatif', file)
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
  function step3Valid() {
    return form.certified
  }

  function submit() {
    declarer.mutate(
      {
        proprieteId: id,
        montantTotal: form.montantTotal,
        periodeDebut: form.periodeDebut || undefined,
        periodeFin: form.periodeFin || undefined,
        justificatif: form.justificatif,
      },
      {
        onSuccess: () => {
          toast.success("Déclaration enregistrée. L'admin examinera votre demande.")
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

      <header className="mb-6">
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Déclarer un revenu
        </h1>
        <p className="font-body text-earth-600 text-sm mb-3">
          Pour <span className="font-semibold text-earth">{propriete.nom}</span>. La
          déclaration sera examinée par notre équipe avant distribution aux investisseurs.
        </p>
        {statut && (
          <div className="mt-3">
            <StatutDeclarationBadge statut={statut} />
          </div>
        )}
      </header>

      {/* Banniere window 1-5 : etat de la fenetre de declaration */}
      {statut && statut.statut !== 'DECLARE' && (
        <div
          className={cn(
            'mb-8 rounded-xl border-[1.5px] p-4 sm:p-5 flex items-start gap-3',
            statut.dansFenetre
              ? 'border-success/40 bg-success/5'
              : 'border-error/40 bg-error/5'
          )}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
              statut.dansFenetre ? 'bg-success/15' : 'bg-error/15'
            )}
          >
            {statut.dansFenetre ? (
              <Clock className="w-5 h-5 text-success" strokeWidth={1.75} />
            ) : (
              <AlertTriangle className="w-5 h-5 text-error" strokeWidth={1.75} />
            )}
          </div>
          <div className="flex-1">
            {statut.dansFenetre ? (
              <>
                <p className="font-body font-semibold text-earth text-sm">
                  Fenêtre de déclaration ouverte
                </p>
                <p className="font-body text-earth-600 text-xs mt-1">
                  Vous avez <strong>{statut.joursRestants} jour{statut.joursRestants > 1 ? 's' : ''}</strong>{' '}
                  pour déclarer les revenus de{' '}
                  <strong>{formatMonthLong(statut.moisADeclarer)}</strong> sans
                  pénalité. Au-delà du 5, une pénalité de{' '}
                  <strong>300 EUR</strong> sera retenue sur le montant déclaré.
                </p>
              </>
            ) : (
              <>
                <p className="font-body font-semibold text-error text-sm">
                  Fenêtre fermée — pénalité retard applicable
                </p>
                <p className="font-body text-earth-700 text-xs mt-1">
                  La période normale de déclaration (1<sup>er</sup> au 5) est dépassée.
                  Vous pouvez toujours déclarer les revenus de{' '}
                  <strong>{formatMonthLong(statut.moisADeclarer)}</strong>, mais{' '}
                  <strong>300 EUR seront retenus</strong> sur le montant déclaré et
                  reversés au compte central FURSA.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mb-10">
        <WizardStepper steps={STEPS} current={step} />
      </div>

      {step === 0 && (
        <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
          <h2 className="font-display font-bold text-earth text-xl mb-1">
            Période et montant
          </h2>
          <p className="font-body text-earth-600 text-sm mb-6">
            Quelle période couvre ce revenu et quel est son montant <strong>net</strong> ?
          </p>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="montant">Montant total net perçu (EUR)</Label>
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
              <p className="text-xs font-body text-earth-500 inline-flex items-center gap-1">
                <Info className="w-3 h-3" strokeWidth={2} />
                Montant net après charges, taxes, commissions Booking/Airbnb.
              </p>
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
            Justificatif
          </h2>
          <p className="font-body text-earth-600 text-sm mb-6">
            Joignez un PDF ou une image qui prouve le revenu : rapport PMS, relevé bancaire,
            export Booking/Airbnb. <span className="text-earth-500">Facultatif mais fortement recommandé pour accélérer la validation.</span>
          </p>

          {!form.justificatif ? (
            <label
              htmlFor="justif-input"
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-sand-400 rounded-xl p-8 cursor-pointer hover:border-ocean hover:bg-white/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-ocean/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-ocean" strokeWidth={1.75} />
              </div>
              <div className="text-center">
                <p className="font-body font-semibold text-earth text-sm">
                  Cliquez pour choisir un fichier
                </p>
                <p className="font-body text-earth-500 text-xs mt-1">
                  PDF, JPG, PNG ou WebP · max 10 MB
                </p>
              </div>
              <input
                id="justif-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-success/40 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-md bg-success/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-success" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="font-body font-semibold text-earth text-sm truncate">
                    {form.justificatif.name}
                  </p>
                  <p className="font-body text-earth-500 text-xs">
                    {(form.justificatif.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => update('justificatif', null)}
                aria-label="Retirer le fichier"
              >
                <X strokeWidth={1.75} />
              </Button>
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              className="sm:flex-1"
              onClick={() => setStep(0)}
            >
              <ArrowLeft strokeWidth={2} />
              Retour
            </Button>
            <Button size="lg" className="sm:flex-[2]" onClick={() => setStep(2)}>
              Continuer
              <ArrowRight strokeWidth={2} />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
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
            <Row label="Justificatif">
              {form.justificatif ? (
                <span className="inline-flex items-center gap-1.5 font-body text-success text-sm">
                  <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {form.justificatif.name}
                </span>
              ) : (
                <span className="font-body text-warning text-xs italic">
                  Aucun (vous pourrez l'ajouter plus tard)
                </span>
              )}
            </Row>
            <div className="pt-3 mt-3 border-t border-earth/8">
              <Row label="Montant total déclaré">
                <Money
                  amount={form.montantTotal}
                  mono={false}
                  className="font-mono font-bold text-earth text-lg"
                />
              </Row>
              {statut && !statut.dansFenetre && form.montantTotal > 0 && (
                <>
                  <Row label="Pénalité retard">
                    <span className="font-mono font-semibold text-error">
                      −<Money
                        amount={Math.min(300, form.montantTotal)}
                        mono={false}
                      />
                    </span>
                  </Row>
                  <div className="pt-2 mt-2 border-t border-error/20">
                    <Row label="Distribuable aux investisseurs">
                      <Money
                        amount={Math.max(0, form.montantTotal - Math.min(300, form.montantTotal))}
                        mono={false}
                        className="font-mono font-bold text-success text-lg"
                      />
                    </Row>
                  </div>
                </>
              )}
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
              Je certifie l'exactitude des informations fournies et confirme que ce revenu
              correspond au <strong>net</strong> perçu sur la période, après toutes charges.
              La distribution ne sera effectuée qu'après validation par l'équipe Fursa
              et réception effective du versement.
            </span>
          </label>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              className="sm:flex-1"
              onClick={() => setStep(1)}
              disabled={declarer.isPending}
            >
              <ArrowLeft strokeWidth={2} />
              Retour
            </Button>
            <Button
              size="lg"
              className="sm:flex-[2]"
              onClick={submit}
              disabled={!step3Valid() || declarer.isPending}
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

function formatMonthLong(yearMonth: string): string {
  const [y, m] = yearMonth.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d)
}
