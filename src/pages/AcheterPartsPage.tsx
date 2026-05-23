import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Coins,
  Copy,
  ExternalLink,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  WalletCards,
} from 'lucide-react'
import { toast } from 'sonner'

import { Money } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { WizardStepper } from '@/components/shared/WizardStepper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { useAcheterViaWallet, useEscrowPropriete } from '@/lib/api/escrow'
import { useMyWallet } from '@/lib/api/wallet'
import { usePropriete } from '@/lib/api/proprietes'
import type {
  AchatResponse,
  EscrowProprieteResponse,
  ProprieteResponse,
  WalletResponse,
} from '@/lib/api/types'
import { extractApiError } from '@/lib/api/errors'
import { useAuth } from '@/lib/auth/AuthContext'
import { cn } from '@/lib/utils'

const STEPS = ['Sélection', 'Confirmation', 'Succès']

/**
 * Phase 10c : achat de parts via le wallet de l'investisseur (crowdfunding).
 * Flux en 3 etapes :
 *  0. Selection : slider parts + apercu cout + check solde wallet
 *  1. Confirmation : recap + CGV + bouton "Confirmer l'achat"
 *  2. Succes : recap final + lien historique wallet + retour opportunites
 */
export function AcheterPartsPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : NaN

  if (Number.isNaN(id)) {
    return <Navigate to="/opportunites" replace />
  }

  const { data: propriete, isLoading, isError } = usePropriete(id)
  const { data: wallet, isLoading: walletLoading } = useMyWallet()
  const { data: escrow, isLoading: escrowLoading } = useEscrowPropriete(id)
  const { isAdmin, user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [parts, setParts] = useState<number>(1)
  const [cgvAccepted, setCgvAccepted] = useState(false)
  const [result, setResult] = useState<AchatResponse | null>(null)

  const mutation = useAcheterViaWallet()
  // Idempotency-Key regenere a chaque tentative (anti double-clic)
  const idempotencyKey = useMemo(
    () => crypto.randomUUID(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step]
  )

  useEffect(() => {
    if (propriete) setParts(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propriete?.id])

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
          ne peuvent pas investir dans les biens.
        </p>
        <Button asChild>
          <Link to={`/opportunites/${propriete.id}`}>Retour à la propriété</Link>
        </Button>
      </div>
    )
  }

  const partsMax = propriete.partsDisponibles ?? 0
  const isPubliee = propriete.statut === 'PUBLIEE'
  const isCollecteAnnulee = escrow?.statut === 'ANNULEE'
  // Phase Certification (Hugh 22/05/2026) : bien doit etre CERTIFIE pour pouvoir acheter
  const isCertifie = propriete.statutCertif === 'CERTIFIE'
  const certifEnReview = propriete.statutCertif === 'EN_REVIEW'

  if (!isPubliee || partsMax <= 0 || isCollecteAnnulee || !isCertifie) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-earth text-xl mb-2">
          {isCollecteAnnulee
            ? 'Collecte annulée'
            : !isCertifie
              ? 'Propriété non certifiée'
              : partsMax <= 0
                ? 'Plus de parts disponibles'
                : 'Propriété non disponible'}
        </h2>
        <p className="font-body text-earth-600 text-sm mb-6 max-w-md mx-auto">
          {isCollecteAnnulee
            ? 'La collecte de cette propriété a été annulée. Les investisseurs ont été remboursés.'
            : !isCertifie
              ? certifEnReview
                ? "Les documents légaux de cette propriété sont en cours de vérification par notre équipe. L'achat sera ouvert dès certification."
                : "Les documents légaux de cette propriété n'ont pas encore été certifiés par notre équipe. L'achat est bloqué tant que le propriétaire n'a pas fourni les preuves nécessaires."
              : partsMax <= 0
                ? 'Ce bien est entièrement financé. Consultez le marché secondaire.'
                : "Cette propriété n'est pas ouverte à l'achat pour le moment."}
        </p>
        <Button asChild>
          <Link to="/opportunites">Voir les opportunités</Link>
        </Button>
      </div>
    )
  }

  // GUARD KYC
  const kycOk = user?.isVerified === true

  function lancerAchat() {
    if (!propriete) return
    mutation.mutate(
      { proprieteId: propriete.id, nombreParts: parts, idempotencyKey },
      {
        onSuccess: (res) => {
          setResult(res)
          setStep(2)
          toast.success('Achat confirmé !')
        },
        onError: (err) => {
          toast.error(extractApiError(err, 'Achat impossible.'))
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
          escrow={escrow}
          wallet={wallet}
          walletLoading={walletLoading}
          escrowLoading={escrowLoading}
          parts={parts}
          partsMax={partsMax}
          onPartsChange={setParts}
          kycOk={kycOk}
          onContinue={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <Step2Confirmation
          propriete={propriete}
          escrow={escrow}
          wallet={wallet}
          parts={parts}
          cgvAccepted={cgvAccepted}
          onCgvChange={setCgvAccepted}
          isPending={mutation.isPending}
          onBack={() => setStep(0)}
          onConfirm={lancerAchat}
        />
      )}

      {step === 2 && result && (
        <Step3Success
          propriete={propriete}
          escrow={escrow}
          result={result}
          onSeeWallet={() => navigate('/wallet')}
          onSeePortfolio={() => navigate('/portefeuille')}
        />
      )}
    </div>
  )
}

// =============================================================================
// Step 1 : Sélection
// =============================================================================

function Step1Selection({
  propriete,
  escrow,
  wallet,
  walletLoading,
  escrowLoading,
  parts,
  partsMax,
  onPartsChange,
  kycOk,
  onContinue,
}: {
  propriete: ProprieteResponse
  escrow: EscrowProprieteResponse | undefined
  wallet: WalletResponse | undefined
  walletLoading: boolean
  escrowLoading: boolean
  parts: number
  partsMax: number
  onPartsChange: (n: number) => void
  kycOk: boolean
  onContinue: () => void
}) {
  const prixUnitaire = propriete.prixUnitairePart ?? 0
  const total = parts * prixUnitaire
  const solde = wallet?.solde ?? 0
  const soldeInsuffisant = !walletLoading && solde < total
  const partsValid = parts > 0 && parts <= partsMax

  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
      <h2 className="font-display font-bold text-earth text-xl mb-1">
        Sélection
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        Combien de parts de <strong>{propriete.nom}</strong> souhaitez-vous acquérir ?
      </p>

      {/* Etat de la collecte */}
      {escrowLoading ? (
        <Skeleton className="h-20 rounded-lg bg-sand-300 mb-6" />
      ) : (
        escrow && <CollecteCard escrow={escrow} />
      )}

      {/* Slider parts */}
      <div className="space-y-4 mt-6">
        <div className="flex items-baseline justify-between">
          <span className="font-body text-sm text-earth-600">Nombre de parts</span>
          <span className="font-mono font-bold text-earth text-xl">
            {parts.toLocaleString('fr-FR')}{' '}
            <span className="font-body text-xs text-earth-500 font-normal">
              / {partsMax.toLocaleString('fr-FR')}
            </span>
          </span>
        </div>
        <Slider
          value={[parts]}
          min={1}
          max={partsMax}
          step={1}
          onValueChange={(v) => onPartsChange(v[0] ?? 1)}
        />
        <div className="grid grid-cols-4 gap-2">
          {[1, 5, 10, partsMax].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onPartsChange(Math.min(preset, partsMax))}
              className={cn(
                'h-9 rounded-md border-[1.5px] font-body text-xs font-semibold transition-colors',
                parts === preset
                  ? 'border-terra bg-terra/10 text-terra'
                  : 'border-sand-400 text-earth-600 hover:border-terra/40'
              )}
            >
              {preset === partsMax ? 'Max' : preset}
            </button>
          ))}
        </div>
      </div>

      {/* Récap coût */}
      <div className="mt-6 bg-white rounded-lg border border-earth/8 p-5 space-y-2">
        <Row label="Prix par part">
          <Money amount={prixUnitaire} mono={false} className="font-semibold" />
        </Row>
        <Row label="Nombre de parts">
          <span className="font-mono font-semibold text-earth">
            ×{parts.toLocaleString('fr-FR')}
          </span>
        </Row>
        <div className="pt-2 mt-2 border-t border-earth/8">
          <Row label="Total à payer">
            <Money
              amount={total}
              mono={false}
              className="font-mono font-bold text-earth text-xl"
            />
          </Row>
        </div>
      </div>

      {/* Wallet check */}
      <div className="mt-4">
        {walletLoading ? (
          <Skeleton className="h-16 rounded-lg bg-sand-300" />
        ) : (
          <div
            className={cn(
              'rounded-lg border-[1.5px] p-4 flex items-center justify-between gap-3',
              soldeInsuffisant
                ? 'border-error/40 bg-error/5'
                : 'border-success/40 bg-success/5'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  soldeInsuffisant ? 'bg-error/15' : 'bg-success/15'
                )}
              >
                <WalletCards
                  className={cn(
                    'w-5 h-5',
                    soldeInsuffisant ? 'text-error' : 'text-success'
                  )}
                  strokeWidth={1.75}
                />
              </div>
              <div className="min-w-0">
                <p className="font-body text-xs text-earth-500">Solde wallet</p>
                <p className="font-mono font-bold text-earth text-base">
                  <Money amount={solde} mono />
                </p>
              </div>
            </div>
            {soldeInsuffisant ? (
              <div className="text-right">
                <p className="font-body text-xs text-error font-semibold mb-1">
                  Manque <Money amount={total - solde} mono={false} />
                </p>
                <Button asChild size="sm" variant="outline" className="border-error/40 text-error hover:bg-error/10">
                  <Link to="/wallet">Recharger</Link>
                </Button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                Solde suffisant
              </span>
            )}
          </div>
        )}
      </div>

      {/* GUARD KYC */}
      {!kycOk && (
        <div className="mt-4 rounded-lg border-[1.5px] border-warning/40 bg-warning/5 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-warning" strokeWidth={1.75} />
            <p className="font-body text-sm text-earth-700">
              <strong>KYC requis</strong> avant tout investissement.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/compte/kyc">Compléter</Link>
          </Button>
        </div>
      )}

      {/* CTA */}
      <div className="mt-7">
        <Button
          size="lg"
          className="w-full"
          disabled={!partsValid || soldeInsuffisant || !kycOk}
          onClick={onContinue}
        >
          Continuer
          <ArrowRight strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Step 2 : Confirmation
// =============================================================================

function Step2Confirmation({
  propriete,
  escrow,
  wallet,
  parts,
  cgvAccepted,
  onCgvChange,
  isPending,
  onBack,
  onConfirm,
}: {
  propriete: ProprieteResponse
  escrow: EscrowProprieteResponse | undefined
  wallet: WalletResponse | undefined
  parts: number
  cgvAccepted: boolean
  onCgvChange: (v: boolean) => void
  isPending: boolean
  onBack: () => void
  onConfirm: () => void
}) {
  const prixUnitaire = propriete.prixUnitairePart ?? 0
  const total = parts * prixUnitaire
  const soldeApres = (wallet?.solde ?? 0) - total

  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
      <h2 className="font-display font-bold text-earth text-xl mb-1">
        Confirmation
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        Vérifiez les informations avant de débiter votre wallet.
      </p>

      <div className="bg-white rounded-lg border border-earth/8 p-5 mb-6 space-y-3">
        <Row label="Propriété">
          <span className="font-body font-semibold text-earth text-right">
            {propriete.nom}
          </span>
        </Row>
        <Row label="Parts achetées">
          <span className="font-mono font-bold text-earth">
            {parts.toLocaleString('fr-FR')}
          </span>
        </Row>
        <Row label="Prix par part">
          <Money amount={prixUnitaire} mono={false} />
        </Row>
        <div className="pt-3 mt-3 border-t border-earth/8 space-y-2">
          <Row label="Total à débiter">
            <Money
              amount={total}
              mono={false}
              className="font-mono font-bold text-error text-lg"
            />
          </Row>
          <Row label="Solde wallet après">
            <Money
              amount={soldeApres}
              mono={false}
              className="font-mono font-bold text-earth"
            />
          </Row>
        </div>
      </div>

      {/* Explication crowdfunding */}
      <div className="bg-ocean/8 border border-ocean/20 rounded-lg p-4 mb-6">
        <h3 className="font-body font-semibold text-ocean text-sm mb-2 flex items-center gap-2">
          <Users className="w-4 h-4" strokeWidth={1.75} />
          Comment ça fonctionne
        </h3>
        <ul className="font-body text-earth-700 text-xs space-y-1.5 leading-relaxed">
          <li>
            • Votre paiement est instantané. <strong>{parts} part(s)</strong> sont
            réservées à votre nom.
          </li>
          <li>
            • L'argent reste sur le compte séquestre de FURSA jusqu'à ce que la
            propriété atteigne <strong>{escrow?.seuilPct ?? 100}%</strong> de collecte.
          </li>
          <li>
            • À ce seuil, vos parts deviennent actives et vous commencez à recevoir
            des dividendes mensuels.
          </li>
          <li>
            • Si la collecte est annulée par FURSA, vous serez intégralement remboursé
            sur votre wallet.
          </li>
        </ul>
      </div>

      {/* CGV */}
      <label className="flex items-start gap-3 cursor-pointer mb-7">
        <Checkbox
          checked={cgvAccepted}
          onCheckedChange={(v) => onCgvChange(v === true)}
          className="mt-0.5"
        />
        <span className="font-body text-sm text-earth-700 leading-relaxed">
          J'accepte les CGV et je confirme que les fonds investis sont des fonds
          propres dont je peux disposer librement. Je comprends que mes parts seront
          activées dès que la collecte aura atteint son seuil minimum.
        </span>
      </label>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button
          variant="outline"
          size="lg"
          className="sm:flex-1"
          onClick={onBack}
          disabled={isPending}
        >
          <ArrowLeft strokeWidth={2} />
          Modifier
        </Button>
        <Button
          size="lg"
          className="sm:flex-[2]"
          onClick={onConfirm}
          disabled={!cgvAccepted || isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" strokeWidth={2} />
              Débit en cours...
            </>
          ) : (
            <>
              <Wallet strokeWidth={2} />
              Débiter mon wallet de <Money amount={total} mono={false} className="font-bold" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Step 3 : Succès
// =============================================================================

function Step3Success({
  propriete,
  escrow,
  result,
  onSeeWallet,
  onSeePortfolio,
}: {
  propriete: ProprieteResponse
  escrow: EscrowProprieteResponse | undefined
  result: AchatResponse
  onSeeWallet: () => void
  onSeePortfolio: () => void
}) {
  const possessionPending = (escrow?.pourcentageCollecte ?? 0) < (escrow?.seuilPct ?? 100)

  function copyHash() {
    navigator.clipboard
      .writeText(result.hashTransaction)
      .then(() => toast.success('Hash copié.'))
      .catch(() => toast.error('Impossible de copier.'))
  }

  return (
    <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-success" strokeWidth={1.75} />
      </div>
      <h2 className="font-display font-bold text-earth text-2xl mb-2">
        Achat confirmé !
      </h2>
      <p className="font-body text-earth-600 text-sm mb-6">
        Vous avez acquis <strong>{result.nombreParts} part(s)</strong> de{' '}
        <strong>{propriete.nom}</strong>.
      </p>

      <div className="bg-white rounded-lg border border-earth/8 p-5 mb-6 space-y-2 text-left">
        <Row label="Montant débité">
          <Money amount={result.montant} mono={false} className="font-bold text-error" />
        </Row>
        <Row label="Date">
          <span className="font-mono text-xs text-earth-600">
            {formatDate(result.dateTransaction)}
          </span>
        </Row>
        <Row label="Référence transaction">
          <button
            type="button"
            onClick={copyHash}
            className="inline-flex items-center gap-1 font-mono text-xs text-ocean hover:underline"
          >
            <span className="truncate max-w-[180px]">{result.hashTransaction}</span>
            <Copy className="w-3 h-3 flex-shrink-0" strokeWidth={1.75} />
          </button>
        </Row>
      </div>

      {possessionPending ? (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-body font-semibold text-warning text-sm mb-1 flex items-center gap-2">
            <Coins className="w-4 h-4" strokeWidth={1.75} />
            Parts en attente d'activation
          </h3>
          <p className="font-body text-earth-700 text-xs">
            La propriété est en cours de collecte (
            <strong>{(escrow?.pourcentageCollecte ?? 0).toFixed(0)}% atteint sur {escrow?.seuilPct ?? 100}% requis</strong>
            ). Vos parts seront activées et commenceront à générer des dividendes
            dès que le seuil sera atteint.
          </p>
          {escrow && (
            <div className="mt-3">
              <ProgressBar
                value={Math.min(100, (escrow.pourcentageCollecte / escrow.seuilPct) * 100)}
                size="sm"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-body font-semibold text-success text-sm mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
            Parts actives
          </h3>
          <p className="font-body text-earth-700 text-xs">
            La propriété est déjà financée. Vos parts sont actives, vous percevrez
            les dividendes dès la prochaine distribution mensuelle.
          </p>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button variant="outline" size="lg" className="sm:flex-1" onClick={onSeeWallet}>
          <WalletCards strokeWidth={2} />
          Voir mon wallet
        </Button>
        <Button size="lg" className="sm:flex-1" onClick={onSeePortfolio}>
          <ExternalLink strokeWidth={2} />
          Mon portefeuille
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function CollecteCard({ escrow }: { escrow: EscrowProprieteResponse }) {
  const pct = escrow.pourcentageCollecte ?? 0
  const seuil = escrow.seuilPct ?? 100
  const seuilAtteint = escrow.statut === 'FINANCEE'

  return (
    <div className="bg-white rounded-lg border border-earth/8 p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-body text-[11px] text-earth-500 uppercase tracking-wide">
            Collecte
          </p>
          <p className="font-mono font-bold text-earth text-base">
            <Money amount={escrow.totalCollecte} mono={false} /> /{' '}
            <Money amount={escrow.montantCible} mono={false} className="text-earth-500 font-normal text-sm" />
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold',
            seuilAtteint
              ? 'bg-success/15 text-success'
              : 'bg-warning/15 text-warning'
          )}
        >
          {seuilAtteint ? (
            <>
              <CheckCircle2 className="w-3 h-3" strokeWidth={2} /> Financée
            </>
          ) : (
            <>
              <Users className="w-3 h-3" strokeWidth={2} /> En collecte
            </>
          )}
        </span>
      </div>
      <ProgressBar value={Math.min(100, pct)} size="sm" />
      <p className="mt-1.5 font-body text-[11px] text-earth-500">
        {pct.toFixed(1)}% atteint · seuil de déblocage à <strong>{seuil}%</strong>
      </p>
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
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
