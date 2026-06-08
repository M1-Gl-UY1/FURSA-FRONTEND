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
  Lock,
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
import {
  usePeriodesTrimestres,
  useDeclarerRevenuMultipart,
  useStatutDeclaration,
} from '@/lib/api/revenus'
import { useMaProprieteProposee } from '@/lib/api/submissions'
import { useMyWallet } from '@/lib/api/wallet'
import type { PeriodeTrimestrielleResponse } from '@/lib/api/types'
import { Wallet as WalletIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = ['Période & montant', 'Justificatif', 'Récap']

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

type FormState = {
  montantTotal: number
  /** V2 L : code trimestre choisi ("2026-Q1"). */
  trimestreCode: string
  periodeDebut: string
  periodeFin: string
  justificatif: File | null
  certified: boolean
}

export function DeclarerRevenuPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : NaN

  if (Number.isNaN(id)) return <Navigate to="/mes-proprietes" replace />

  const navigate = useNavigate()
  const { data: propriete, isLoading, isError } = useMaProprieteProposee(id)
  const { data: statut } = useStatutDeclaration(Number.isNaN(id) ? null : id)
  const { data: periodes, isLoading: periodesLoading } = usePeriodesTrimestres(
    Number.isNaN(id) ? null : id
  )
  // V2 Z (07/06/2026) : le wallet du proprio est débité du montant déclaré.
  // On affiche son solde et on bloque la soumission si insuffisant.
  const { data: wallet } = useMyWallet()
  const declarer = useDeclarerRevenuMultipart()

  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [form, setForm] = useState<FormState>({
    montantTotal: 0,
    trimestreCode: '',
    periodeDebut: '',
    periodeFin: '',
    justificatif: null,
    certified: false,
  })

  function selectTrimestre(p: PeriodeTrimestrielleResponse) {
    setForm((s) => ({
      ...s,
      trimestreCode: p.code,
      periodeDebut: p.dateDebut,
      periodeFin: p.dateFin,
    }))
  }

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
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-xl" />
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

  // V2 Z : solde wallet courant et check suffisance.
  const soldeWallet = wallet?.solde ?? 0
  const soldeInsuffisant =
    form.montantTotal > 0 && soldeWallet < form.montantTotal
  const manqueWallet = Math.max(0, form.montantTotal - soldeWallet)

  function step1Valid() {
    return form.montantTotal > 0 && !!form.trimestreCode && !soldeInsuffisant
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

      {/* V2 W (07/06/2026) : banniere d'info neutre. Plus aucune notion
          de fenetre fermee / retard / penalite. */}
      {statut && statut.statut !== 'DECLARE' && (
        <div className="mb-8 rounded-xl border-[1.5px] border-warning/40 bg-warning/5 p-4 sm:p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-warning/15 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-warning" strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <p className="font-body font-semibold text-earth text-sm">
              Déclaration trimestrielle à faire
            </p>
            <p className="font-body text-earth-600 text-xs mt-1">
              Déclarez les revenus du{' '}
              <strong>{formatMonthLong(statut.moisADeclarer)}</strong> pour permettre
              la distribution aux investisseurs.
            </p>
          </div>
        </div>
      )}

      <div className="mb-10">
        <WizardStepper steps={STEPS} current={step} />
      </div>

      {step === 0 && (
        <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
          <h2 className="font-display font-bold text-earth text-xl mb-1">
            Trimestre et montant
          </h2>
          <p className="font-body text-earth-600 text-sm mb-6">
            La déclaration est <strong>trimestrielle</strong>. Choisissez le trimestre
            concerné et indiquez le montant <strong>net</strong> perçu sur la période.
          </p>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Trimestre à déclarer</Label>
              {periodesLoading || !periodes ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : periodes.filter((p) => p.statut !== 'A_VENIR').length === 0 ? (
                <div className="text-xs font-body text-earth-500 bg-white rounded-md border border-earth/8 p-4">
                  Aucun trimestre n'est encore disponible à la déclaration.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {periodes.map((p) => (
                    <TrimestreCard
                      key={p.code}
                      periode={p}
                      selected={form.trimestreCode === p.code}
                      onSelect={() => selectTrimestre(p)}
                    />
                  ))}
                </div>
              )}
              <p className="text-xs font-body text-earth-500 inline-flex items-center gap-1 mt-1">
                <Info className="w-3 h-3" strokeWidth={2} />
                Les trimestres déjà déclarés sont verrouillés. Ceux à venir s'ouvriront
                au fur et à mesure.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="montant">Montant total net perçu (USD)</Label>
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

            {/* V2 Z (07/06/2026) : informer du paiement immédiat depuis le wallet */}
            <div className={cn(
              'rounded-lg border-[1.5px] p-4 flex items-start gap-3',
              soldeInsuffisant
                ? 'border-error/40 bg-error/5'
                : 'border-ocean/20 bg-ocean/5'
            )}>
              <WalletIcon
                className={cn(
                  'w-5 h-5 flex-shrink-0 mt-0.5',
                  soldeInsuffisant ? 'text-error' : 'text-ocean'
                )}
                strokeWidth={1.75}
              />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-body font-semibold text-sm',
                  soldeInsuffisant ? 'text-error' : 'text-earth'
                )}>
                  {soldeInsuffisant
                    ? 'Solde wallet insuffisant'
                    : 'Paiement immédiat depuis votre wallet'}
                </p>
                <p className="font-body text-earth-600 text-xs mt-1">
                  À la soumission, <strong><Money amount={form.montantTotal || 0} mono={false} /></strong>
                  {' '}seront débités de votre wallet et placés en séquestre FURSA.
                  Solde actuel : <strong><Money amount={soldeWallet} mono={false} /></strong>.
                </p>
                {soldeInsuffisant && (
                  <Link
                    to="/wallet?onglet=recharger"
                    className="inline-flex items-center gap-1 mt-2 text-error text-xs font-body font-semibold hover:underline"
                  >
                    Charger <Money amount={manqueWallet} mono={false} /> supplémentaires →
                  </Link>
                )}
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
            <Row label="Trimestre">
              <span className="font-body font-semibold text-earth text-sm">
                {libelleTrimestreFromCode(form.trimestreCode)}
              </span>
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

function libelleTrimestreFromCode(code: string): string {
  const m = /^(\d{4})-Q([1-4])$/.exec(code)
  if (!m) return code || '—'
  const year = m[1]
  const q = m[2]
  const noms: Record<string, string> = {
    '1': '1er trimestre',
    '2': '2e trimestre',
    '3': '3e trimestre',
    '4': '4e trimestre',
  }
  return `${noms[q]} ${year}`
}

function TrimestreCard({
  periode,
  selected,
  onSelect,
}: {
  periode: PeriodeTrimestrielleResponse
  selected: boolean
  onSelect: () => void
}) {
  const isDeclare = periode.statut === 'DEJA_DECLARE'
  const isAvenir = periode.statut === 'A_VENIR'
  const disabled = isDeclare || isAvenir
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      className={cn(
        'group text-left w-full rounded-lg border-[1.5px] p-3 transition-all',
        selected
          ? 'border-ocean bg-ocean/5'
          : 'border-earth/10 bg-white hover:border-ocean/40',
        disabled && 'cursor-not-allowed opacity-70 hover:border-earth/10'
      )}
      aria-pressed={selected ? 'true' : 'false'}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-body font-semibold text-earth text-sm">
            {libelleTrimestreFromCode(periode.code)}
          </p>
          <p className="font-body text-earth-500 text-[11px] mt-0.5">
            {periode.libelle.replace(/^[^()]+/, '').replace(/[()]/g, '').trim()}
          </p>
        </div>
        {isDeclare && (
          <span className="inline-flex items-center gap-1 text-success text-[10px] font-semibold whitespace-nowrap">
            <Lock className="w-3 h-3" strokeWidth={2} />
            Déjà déclaré
          </span>
        )}
        {isAvenir && (
          <span className="inline-flex items-center gap-1 text-earth-400 text-[10px] font-semibold whitespace-nowrap">
            <CalendarDays className="w-3 h-3" strokeWidth={2} />
            À venir
          </span>
        )}
        {!disabled && (
          <span className="inline-flex items-center gap-1 text-ocean text-[10px] font-semibold whitespace-nowrap">
            <Clock className="w-3 h-3" strokeWidth={2} />
            Disponible
          </span>
        )}
      </div>
      {isDeclare && periode.montantDeclare != null && (
        <p className="font-mono text-earth-500 text-[11px] mt-1">
          Montant déclaré : <span className="font-semibold text-earth">
            <Money amount={periode.montantDeclare} mono={false} />
          </span>
        </p>
      )}
    </button>
  )
}

function formatMonthLong(value: string): string {
  // P3 (Hugh 22/05/2026) : format trimestriel "2026-Q1"
  if (/^\d{4}-Q[1-4]$/.test(value)) {
    const [year, q] = value.split('-Q')
    const trimNames: Record<string, string> = {
      '1': '1er trimestre (jan-fev-mar)',
      '2': '2e trimestre (avr-mai-jun)',
      '3': '3e trimestre (jui-aou-sep)',
      '4': '4e trimestre (oct-nov-dec)',
    }
    return `${trimNames[q] ?? q} ${year}`
  }
  // Fallback ancien format mensuel
  const [y, m] = value.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d)
}
