import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Wallet,
  AlertTriangle,
  ShieldCheck,
  Copy,
  Loader2,
  ExternalLink,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Money } from '@/components/shared/Money'
import { WizardStepper } from '@/components/shared/WizardStepper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { useInitierPaiement, useSessionStatus } from '@/lib/api/paiements'
import { usePropriete } from '@/lib/api/proprietes'
import type {
  PaymentInitResponse,
  PaymentSessionStatusResponse,
  ProprieteResponse,
} from '@/lib/api/types'
import { extractApiError } from '@/lib/api/errors'
import { useAuth } from '@/lib/auth/AuthContext'
import { ShieldAlert } from 'lucide-react'

const STEPS = ['Sélection', 'Confirmation', 'Paiement', 'Succès']

export function AcheterPartsPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : NaN

  if (Number.isNaN(id)) {
    return <Navigate to="/opportunites" replace />
  }

  const { data: propriete, isLoading, isError } = usePropriete(id)
  const { isAdmin } = useAuth()
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [parts, setParts] = useState<number>(1)
  const [cgvAccepted, setCgvAccepted] = useState(false)
  const [session, setSession] = useState<PaymentInitResponse | null>(null)
  const mutation = useInitierPaiement()

  // Polling du statut de la session une fois qu'elle existe
  const { data: sessionStatus } = useSessionStatus(session?.sessionId ?? null)

  // Transition step 2 -> 3 quand la session est CONFIRMED
  useEffect(() => {
    if (sessionStatus?.statut === 'CONFIRMED' && step === 2) {
      setStep(3)
      toast.success('Paiement confirmé !')
    }
  }, [sessionStatus?.statut, step])

  useEffect(() => {
    if (propriete) setParts(1)
  }, [propriete?.id])

  // Idempotency-Key genere une fois par tentative d'achat (anti double-clic, anti retry)
  const idempotencyKey = useMemo(() => crypto.randomUUID(), [step === 1])

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-8 w-40 mb-6 bg-sand-300" />
        <Skeleton className="h-12 w-full mb-8 bg-sand-300" />
        <Skeleton className="h-96 w-full rounded-xl bg-sand-300" />
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
          <Link to="/opportunites">Retour aux opportunités</Link>
        </Button>
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <ShieldAlert className="w-12 h-12 text-warning mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-earth text-xl mb-2">
          Achat indisponible pour les administrateurs
        </h2>
        <p className="font-body text-earth-600 text-sm mb-6 max-w-md mx-auto">
          Pour préserver la neutralité de la plateforme, les comptes administrateurs
          ne peuvent pas investir dans les biens. Connectez-vous avec un compte
          investisseur pour acheter des parts.
        </p>
        <Button asChild>
          <Link to={`/opportunites/${propriete.id}`}>Retour à la propriété</Link>
        </Button>
      </div>
    )
  }

  const partsMax = propriete.partsDisponibles ?? 0
  const isPubliee = propriete.statut === 'PUBLIEE'

  if (!isPubliee || partsMax <= 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-earth text-xl mb-2">
          {partsMax <= 0 ? 'Plus de parts disponibles' : 'Propriété non disponible'}
        </h2>
        <p className="font-body text-earth-600 text-sm mb-6">
          {partsMax <= 0
            ? 'Ce bien est entièrement financé. Consultez le marché secondaire.'
            : 'Cette propriété n\'est pas ouverte à l\'achat pour le moment.'}
        </p>
        <Button asChild>
          <Link to="/opportunites">Voir les opportunités</Link>
        </Button>
      </div>
    )
  }

  function lancerPaiement() {
    if (!propriete) return
    mutation.mutate(
      { payload: { proprieteId: propriete.id, nombreParts: parts }, idempotencyKey },
      {
        onSuccess: (res) => {
          setSession(res)
          setStep(2)
        },
        onError: (err) => {
          toast.error(extractApiError(err, 'Paiement impossible.'))
        },
      }
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/opportunites/${propriete.id}`}
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour à la propriété
      </Link>

      <div className="mb-10">
        <WizardStepper steps={STEPS} current={step} />
      </div>

      {step === 0 && (
        <Step1Selection
          propriete={propriete}
          parts={parts}
          partsMax={partsMax}
          onPartsChange={setParts}
          onContinue={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <Step2Confirmation
          propriete={propriete}
          parts={parts}
          cgvAccepted={cgvAccepted}
          onCgvChange={setCgvAccepted}
          onBack={() => setStep(0)}
          onConfirm={lancerPaiement}
          isPending={mutation.isPending}
        />
      )}

      {step === 2 && session && (
        <Step3Waiting
          session={session}
          status={sessionStatus ?? null}
          onCancel={() => {
            setSession(null)
            setStep(1)
          }}
        />
      )}

      {step === 3 && session && sessionStatus && (
        <Step4Success session={session} status={sessionStatus} />
      )}
    </div>
  )
}

// ============================================================================
// Étape 1 — Sélection
// ============================================================================

type Step1Props = {
  propriete: ProprieteResponse
  parts: number
  partsMax: number
  onPartsChange: (n: number) => void
  onContinue: () => void
}

function Step1Selection({ propriete, parts, partsMax, onPartsChange, onContinue }: Step1Props) {
  const prix = propriete.prixUnitairePart ?? 0
  const renta = propriete.rentabilitePrevue ?? 0
  const total = parts * prix
  const roiAnnuel = (total * renta) / 100

  function handleInput(v: string) {
    const n = parseInt(v, 10)
    if (Number.isNaN(n)) onPartsChange(1)
    else onPartsChange(Math.max(1, Math.min(partsMax, n)))
  }

  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
      <h1 className="font-display font-bold text-earth text-2xl mb-1">
        Combien de parts ?
      </h1>
      <p className="font-body text-earth-600 text-sm mb-6">
        Choisissez le nombre de parts à acheter dans{' '}
        <span className="font-semibold text-earth">{propriete.nom}</span>.
      </p>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-body text-earth-600 mb-8 pb-6 border-b border-earth/8">
        <span>
          Prix / part : <Money amount={prix} mono={false} className="font-mono font-semibold text-earth" />
        </span>
        <span>
          Parts dispo :{' '}
          <span className="font-mono font-semibold text-earth">
            {partsMax.toLocaleString('fr-FR')}
          </span>
        </span>
        <span>
          Rentabilité :{' '}
          <span className="font-mono font-semibold text-success">{renta}% / an</span>
        </span>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <Label htmlFor="parts">Nombre de parts</Label>
          <Input
            id="parts"
            type="number"
            min={1}
            max={partsMax}
            value={parts}
            onChange={(e) => handleInput(e.target.value)}
            className="w-28 h-10 text-right font-mono font-semibold"
          />
        </div>
        <Slider
          value={[parts]}
          min={1}
          max={partsMax}
          step={1}
          onValueChange={([v]) => onPartsChange(v)}
          aria-label="Nombre de parts"
        />
        <div className="flex justify-between text-xs font-mono text-earth-500 mt-2">
          <span>1</span>
          <span>{partsMax.toLocaleString('fr-FR')}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-earth/8 p-5 mb-8 space-y-3">
        <Row label="Montant total" mono>
          <Money amount={total} mono={false} className="text-base font-bold text-earth" />
        </Row>
        <Row
          label="Revenus annuels estimés"
          accent="success"
          icon={<TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />}
        >
          <Money amount={roiAnnuel} mono={false} className="text-base font-bold text-success" />
        </Row>
      </div>

      <Button size="lg" className="w-full" onClick={onContinue}>
        Continuer
        <ArrowRight strokeWidth={2} />
      </Button>
    </div>
  )
}

// ============================================================================
// Étape 2 — Confirmation
// ============================================================================

type Step2Props = {
  propriete: ProprieteResponse
  parts: number
  cgvAccepted: boolean
  onCgvChange: (b: boolean) => void
  onBack: () => void
  onConfirm: () => void
  isPending: boolean
}

function Step2Confirmation({
  propriete,
  parts,
  cgvAccepted,
  onCgvChange,
  onBack,
  onConfirm,
  isPending,
}: Step2Props) {
  const prix = propriete.prixUnitairePart ?? 0
  const renta = propriete.rentabilitePrevue ?? 0
  const total = parts * prix
  const roiAnnuel = (total * renta) / 100

  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
      <h1 className="font-display font-bold text-earth text-2xl mb-1">
        Confirmation
      </h1>
      <p className="font-body text-earth-600 text-sm mb-6">
        Vérifiez les détails avant de finaliser votre achat.
      </p>

      <div className="bg-white rounded-lg border border-earth/8 p-5 mb-6 space-y-3">
        <Row label="Propriété">
          <span className="font-body font-semibold text-earth">{propriete.nom}</span>
        </Row>
        <Row label="Localisation">
          <span className="font-body text-earth">{propriete.localisation}</span>
        </Row>
        <Row label="Nombre de parts" mono>
          <span className="font-mono font-semibold text-earth">
            {parts.toLocaleString('fr-FR')}
          </span>
        </Row>
        <Row label="Prix unitaire" mono>
          <Money amount={prix} mono={false} className="font-mono text-earth" />
        </Row>
        <div className="pt-3 mt-3 border-t border-earth/8 space-y-3">
          <Row label="Total à payer" mono>
            <Money amount={total} mono={false} className="font-mono font-bold text-earth text-lg" />
          </Row>
          <Row
            label="Revenus annuels estimés"
            accent="success"
            icon={<TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />}
          >
            <Money
              amount={roiAnnuel}
              mono={false}
              className="font-mono font-bold text-success"
            />
          </Row>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-earth/8 p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-ocean/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-ocean" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body font-semibold text-earth text-sm">Paiement par USDC (stable-coin)</p>
          <p className="font-body text-earth-500 text-xs">
            Conversion automatique depuis votre devise locale. Mode démo actif.
          </p>
        </div>
      </div>

      <label className="flex items-start gap-3 mb-7 cursor-pointer">
        <Checkbox
          id="cgv"
          checked={cgvAccepted}
          onCheckedChange={(v) => onCgvChange(v === true)}
          className="mt-0.5"
        />
        <span className="font-body text-sm text-earth-700 leading-relaxed">
          J'accepte les{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              toast.info('Page CGV bientôt disponible.')
            }}
            className="text-ocean font-semibold hover:underline"
          >
            conditions générales d'investissement
          </a>{' '}
          et je confirme avoir compris les risques.
        </span>
      </label>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button variant="outline" size="lg" className="sm:flex-1" onClick={onBack} disabled={isPending}>
          <ArrowLeft strokeWidth={2} />
          Retour
        </Button>
        <Button
          size="lg"
          className="sm:flex-[2]"
          onClick={onConfirm}
          disabled={!cgvAccepted || isPending}
        >
          {isPending ? 'Initialisation...' : 'Payer maintenant'}
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Étape 3 — En attente du paiement (polling)
// ============================================================================

type Step3WaitingProps = {
  session: PaymentInitResponse
  status: PaymentSessionStatusResponse | null
  onCancel: () => void
}

function Step3Waiting({ session, status, onCancel }: Step3WaitingProps) {
  const statut = status?.statut ?? session.statut
  const isFailed = statut === 'FAILED' || statut === 'EXPIRED'

  if (isFailed) {
    return (
      <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-10 text-center">
        <XCircle className="w-16 h-16 text-warning mx-auto mb-6" strokeWidth={1.5} />
        <h1 className="font-display font-bold text-earth text-2xl mb-2">
          {statut === 'EXPIRED' ? 'Session expirée' : 'Paiement échoué'}
        </h1>
        <p className="font-body text-earth-600 text-sm mb-6 max-w-md mx-auto">
          {status?.errorMessage ??
            (statut === 'EXPIRED'
              ? 'Le délai de paiement est dépassé. Veuillez recommencer.'
              : 'Le paiement n\'a pas pu être validé. Vous pouvez réessayer.')}
        </p>
        <Button onClick={onCancel} size="lg">
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-10 text-center">
      <Loader2 className="w-16 h-16 text-ocean mx-auto mb-6 animate-spin" strokeWidth={1.5} />
      <h1 className="font-display font-bold text-earth text-2xl mb-2">
        Paiement en cours...
      </h1>
      <p className="font-body text-earth-600 text-sm mb-6 max-w-md mx-auto">
        En attente de confirmation du paiement. Cela prend généralement quelques secondes.
        Ne fermez pas cette page.
      </p>

      <div className="bg-white rounded-lg border border-earth/8 p-5 mb-6 max-w-md mx-auto text-left space-y-3">
        <Row label="Montant à payer" mono>
          <Money
            amount={session.montantFiat}
            mono={false}
            className="font-mono font-bold text-earth"
          />
        </Row>
        <Row label="En USDC" mono>
          <span className="font-mono text-earth">{session.montantUsdc.toFixed(2)} USDC</span>
        </Row>
        <Row label="Provider">
          <span className="font-body text-earth">{session.providerName}</span>
        </Row>
      </div>

      {session.widgetUrl && session.providerName !== 'MOCK' && (
        <a
          href={session.widgetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-ocean text-sm font-semibold hover:underline mb-4"
        >
          Ouvrir le portail de paiement
          <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
        </a>
      )}

      <Button variant="outline" onClick={onCancel} className="mt-2">
        Annuler
      </Button>
    </div>
  )
}

// ============================================================================
// Étape 4 — Succès
// ============================================================================

type Step4SuccessProps = {
  session: PaymentInitResponse
  status: PaymentSessionStatusResponse
}

function Step4Success({ session, status }: Step4SuccessProps) {
  const navigate = useNavigate()
  const txHash = status.txHash

  function copyHash() {
    if (!txHash) return
    navigator.clipboard.writeText(txHash).then(() => toast.success('Hash copié !'))
  }

  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-10 text-center">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-success/15 animate-ping opacity-75" />
        <div className="relative w-20 h-20 rounded-full bg-success flex items-center justify-center shadow-card-hover">
          <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2} />
        </div>
      </div>

      <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-2">
        Achat confirmé !
      </h1>
      <p className="font-body text-earth-600 text-sm sm:text-base mb-8 max-w-md mx-auto">
        Vos parts ont été ajoutées à votre portefeuille.
      </p>

      <div className="bg-white rounded-lg border border-earth/8 p-5 mb-8 max-w-md mx-auto text-left space-y-3">
        <Row label="Montant" mono>
          <Money
            amount={session.montantFiat}
            mono={false}
            className="font-mono font-semibold text-earth"
          />
        </Row>
        <Row label="Statut">
          <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
            {status.statut}
          </span>
        </Row>
        {txHash && (
          <div className="pt-3 mt-3 border-t border-earth/8">
            <p className="font-body text-xs text-earth-500 mb-1">Hash transaction</p>
            <button
              type="button"
              onClick={copyHash}
              className="group flex items-center gap-2 w-full text-left"
            >
              <code className="font-mono text-[11px] text-earth break-all flex-1 leading-tight">
                {txHash}
              </code>
              <Copy
                className="w-4 h-4 text-earth-400 group-hover:text-ocean shrink-0 transition-colors"
                strokeWidth={1.75}
              />
            </button>
            {status.etherscanUrl && (
              <a
                href={status.etherscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-ocean text-xs font-semibold hover:underline"
              >
                Voir sur Etherscan
                <ExternalLink className="w-3 h-3" strokeWidth={2} />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 max-w-md mx-auto">
        <Button variant="outline" size="lg" className="sm:flex-1" onClick={() => navigate('/opportunites')}>
          Continuer à investir
        </Button>
        <Button size="lg" className="sm:flex-1" onClick={() => navigate('/portefeuille')}>
          Voir mon portefeuille
          <ArrowRight strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Sous-composant Row
// ============================================================================

type RowProps = {
  label: string
  children: React.ReactNode
  mono?: boolean
  accent?: 'default' | 'success'
  icon?: React.ReactNode
}

function Row({ label, children, accent = 'default', icon }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={
          accent === 'success'
            ? 'flex items-center gap-1.5 text-success text-sm font-body'
            : 'text-earth-600 text-sm font-body'
        }
      >
        {icon}
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
  )
}
