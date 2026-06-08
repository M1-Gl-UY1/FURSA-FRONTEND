import { Link, Navigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Home as HomeIcon,
  LineChart,
  Link2,
  Lock,
  Radio,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDiagnosticPrixPart } from '@/lib/api/prix-part'
import type {
  HistoriquePrixPartResponse,
  PrixPartDiagnosticResponse,
  RaisonRecalculPrix,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'

/**
 * V2 M (07/06/2026) : page admin diagnostic prix dynamique d'un bien.
 *
 * Affiche pour un bien donne : prix initial / courant, formule substituee
 * avec les valeurs courantes, bornes plancher/plafond, composantes (bonus
 * rentabilite et bonus demande), constantes en vigueur, historique des recalculs.
 */
export function AdminPrixPartPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : NaN

  if (Number.isNaN(id)) return <Navigate to="/admin/proprietes" replace />

  const { data, isLoading, isError } = useDiagnosticPrixPart(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Diagnostic indisponible"
        description="Impossible de charger le diagnostic prix pour ce bien."
      />
    )
  }

  const variationPositive = data.variationPct >= 0

  return (
    <div className="space-y-6">
      <Link
        to="/admin/proprietes"
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour aux propriétés
      </Link>

      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="font-body text-earth-500 text-xs uppercase tracking-wider mb-1">
            Diagnostic prix dynamique
          </p>
          <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl">
            {data.proprieteNom}
          </h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/prix-parts/explication">
            <HelpCircle strokeWidth={2} />
            Comprendre le modèle
          </Link>
        </Button>
      </header>

      {/* Synthèse prix initial / courant / variation */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SynthesisCard
          icon={HomeIcon}
          label="Prix initial"
          value={<Money amount={data.prixInitial} mono={false} />}
          hint="Snapshot à la publication"
        />
        <SynthesisCard
          icon={LineChart}
          label="Prix courant"
          value={<Money amount={data.prixCourant} mono={false} />}
          hint="Affiché aux investisseurs"
          highlight
        />
        <SynthesisCard
          icon={variationPositive ? TrendingUp : TrendingDown}
          label="Variation cumulée"
          value={
            <span className={variationPositive ? 'text-success' : 'text-error'}>
              {variationPositive ? '+' : ''}
              {fmtNum(data.variationPct, 2)}%
            </span>
          }
          hint="Depuis la publication"
        />
      </section>

      {/* Formule substituée */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-7">
        <h2 className="font-display font-semibold text-earth text-lg mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-ocean" strokeWidth={1.75} />
          Comment le prix courant est calculé
        </h2>
        <div className="bg-white rounded-lg border border-earth/10 p-5 space-y-2 font-mono text-sm">
          <div className="text-earth-500">
            prix_courant = prix_initial × (1 + bonus_rentabilité + bonus_demande)
          </div>
          <div className="text-earth-400 text-xs">↓ avec les valeurs courantes :</div>
          <div className="text-earth">
            <Money amount={data.prixCourant} mono={false} className="text-ocean font-bold" /> ={' '}
            <Money amount={data.prixInitial} mono={false} className="font-semibold" /> × (1 +{' '}
            <span className="text-success font-semibold">{fmtSign(data.bonusRentabiliteTotal)}</span> +{' '}
            <span className="text-terra font-semibold">{fmtSign(data.bonusDemande)}</span>)
          </div>
        </div>
      </section>

      {/* Bornes */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-7">
        <h2 className="font-display font-semibold text-earth text-lg mb-4 flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-warning" strokeWidth={1.75} />
          Bornes plancher / plafond
        </h2>
        <BornesBar diag={data} />
      </section>

      {/* Composantes */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ComposanteCard
          icon={TrendingUp}
          color="success"
          title="Bonus rentabilité"
          value={data.bonusRentabiliteTotal}
          cap={data.constantes.capBonusRentabiliteTotal}
          allowNegative
          explanation={
            data.rentabilitePrevue != null && data.valeurMisEnVente > 0 ? (
              <>
                Rentabilité prévue annoncée : <strong>{fmtNum(data.rentabilitePrevue, 1)}%</strong> / an.
                Valeur mise en vente : <Money amount={data.valeurMisEnVente} mono={false} />.
                <br />
                Chaque revenu validé ajuste ce bonus (lissage{' '}
                {fmtPct(data.constantes.lissageRentabilite, 1)}, cap ±
                {fmtPct(data.constantes.capContributionTrimestrielle, 0)} par trimestre).
              </>
            ) : (
              <>Aucune donnée de rentabilité encore renseignée pour ce bien.</>
            )
          }
        />
        <ComposanteCard
          icon={Users}
          color="terra"
          title="Bonus demande"
          value={data.bonusDemande}
          cap={data.constantes.capBonusDemande}
          allowNegative={false}
          explanation={
            <>
              Dépend de la liste d'attente : <span className="font-mono">ratio × {fmtPct(data.constantes.coefDemande, 0)}</span>.
              Capé à +{fmtPct(data.constantes.capBonusDemande, 0)}.
            </>
          }
        />
      </section>

      {/* Etat on-chain (V2 O) */}
      <EtatOnchainSection diag={data} />

      {/* Historique */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-7">
        <h2 className="font-display font-semibold text-earth text-lg mb-4 flex items-center gap-2">
          <LineChart className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
          Historique des recalculs ({data.historique.length})
        </h2>
        {data.historique.length === 0 ? (
          <p className="font-body text-earth-500 text-sm italic">
            Aucun recalcul enregistré pour ce bien.
          </p>
        ) : (
          <HistoriqueList items={[...data.historique].reverse()} />
        )}
      </section>
    </div>
  )
}

function EtatOnchainSection({ diag }: { diag: PrixPartDiagnosticResponse }) {
  const version = (diag.contratVersion ?? '').toUpperCase()
  const adresse = diag.adresseContrat
  const tx = diag.transactionHash

  if (!version && !adresse) {
    return (
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-7">
        <h2 className="font-display font-semibold text-earth text-lg mb-3 flex items-center gap-2">
          <Radio className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
          État on-chain
        </h2>
        <p className="font-body text-earth-500 text-sm italic">
          Ce bien n'a pas encore été tokenisé. Aucun contrat n'est déployé.
        </p>
      </section>
    )
  }

  const isV2 = version === 'V2'
  const syncActif = isV2

  return (
    <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-7">
      <h2 className="font-display font-semibold text-earth text-lg mb-4 flex items-center gap-2">
        <Radio className="w-5 h-5 text-ocean" strokeWidth={1.75} />
        État on-chain
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-earth/10 p-3">
          <p className="font-body text-xs text-earth-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" strokeWidth={2} />
            Version du contrat
          </p>
          <p className="font-display font-bold text-earth text-base">
            {version || '—'}
          </p>
          <p className="font-body text-xs text-earth-500 mt-0.5">
            {isV2
              ? 'Prix dynamique synchronisé on-chain à chaque revenu validé.'
              : 'Contrat legacy immuable. Le prix dynamique reste off-chain.'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-earth/10 p-3">
          <p className="font-body text-xs text-earth-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" strokeWidth={2} />
            Sync prix BDD → chain
          </p>
          {syncActif ? (
            <p className="inline-flex items-center gap-1.5 font-body text-success text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
              Actif (async)
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 font-body text-earth-500 text-sm">
              <Lock className="w-4 h-4" strokeWidth={2} />
              Désactivé (V1)
            </p>
          )}
          <p className="font-body text-xs text-earth-500 mt-0.5">
            {syncActif
              ? 'Chaque recalcul déclenche un push on-chain via BlockchainSyncService.'
              : 'Les contrats V1 ne sont jamais synchronisés. À la prochaine retokenisation, le bien passera en V2.'}
          </p>
        </div>

        {/* V2 P (07/06/2026) : audit RevenueLedger */}
        <div className="bg-white rounded-lg border border-earth/10 p-3">
          <p className="font-body text-xs text-earth-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" strokeWidth={2} />
            Audit RevenueLedger
          </p>
          <p className="inline-flex items-center gap-1.5 font-body text-ocean text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            Revenus + dividendes
          </p>
          <p className="font-body text-xs text-earth-500 mt-0.5">
            Chaque revenu validé est enregistré on-chain avec le sha256 du justificatif.
            Chaque distribution loggue le détail par investisseur.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-earth/10 p-3 space-y-2">
        {adresse && (
          <div className="flex items-start gap-2">
            <Link2 className="w-3.5 h-3.5 text-earth-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="font-body text-xs text-earth-500 uppercase tracking-wider">
                Adresse du contrat
              </p>
              <a
                href={`https://sepolia.etherscan.io/address/${adresse}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-ocean text-xs hover:underline inline-flex items-center gap-1 break-all"
              >
                {adresse}
                <ExternalLink className="w-3 h-3 flex-shrink-0" strokeWidth={2} />
              </a>
            </div>
          </div>
        )}
        {tx && (
          <div className="flex items-start gap-2">
            <Link2 className="w-3.5 h-3.5 text-earth-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="font-body text-xs text-earth-500 uppercase tracking-wider">
                Tx de déploiement
              </p>
              <a
                href={`https://sepolia.etherscan.io/tx/${tx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-ocean text-xs hover:underline inline-flex items-center gap-1 break-all"
              >
                {tx}
                <ExternalLink className="w-3 h-3 flex-shrink-0" strokeWidth={2} />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function SynthesisCard({
  icon: Icon,
  label,
  value,
  hint,
  highlight,
}: {
  icon: typeof Calculator
  label: string
  value: React.ReactNode
  hint: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border-[1.5px] p-4 flex items-start gap-3',
        highlight
          ? 'border-ocean/40 bg-ocean/5'
          : 'border-earth/10 bg-white'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          highlight ? 'bg-ocean/15' : 'bg-sand-200'
        )}
      >
        <Icon className={cn('w-5 h-5', highlight ? 'text-ocean' : 'text-earth-500')} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="font-body text-xs text-earth-500 uppercase tracking-wider">{label}</p>
        <p className="font-display font-bold text-earth text-xl mt-0.5">{value}</p>
        <p className="font-body text-xs text-earth-500 mt-0.5">{hint}</p>
      </div>
    </div>
  )
}

function BornesBar({ diag }: { diag: PrixPartDiagnosticResponse }) {
  const min = diag.plancher
  const max = diag.plafond
  const denom = max - min || 1
  const initialPct = ((diag.prixInitial - min) / denom) * 100
  const courantPct = ((diag.prixCourant - min) / denom) * 100

  return (
    <div>
      <div className="relative h-3 bg-sand-200 rounded-full mb-2">
        <span
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-5 bg-earth-400 rounded"
          style={{ left: `${clamp(initialPct, 0, 100)}%` }}
          title="Prix initial"
        />
        <span
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-6 bg-ocean rounded shadow-sm"
          style={{ left: `${clamp(courantPct, 0, 100)}%` }}
          title="Prix courant"
        />
      </div>
      <div className="flex justify-between text-xs font-body">
        <div className="text-error">
          <span className="block text-[10px] uppercase tracking-wider">Plancher</span>
          <span className="font-mono font-semibold">
            <Money amount={min} mono={false} />
          </span>
        </div>
        <div className="text-earth-500 text-center">
          <span className="block text-[10px] uppercase tracking-wider">Prix initial</span>
          <span className="font-mono">
            <Money amount={diag.prixInitial} mono={false} />
          </span>
        </div>
        <div className="text-ocean text-center">
          <span className="block text-[10px] uppercase tracking-wider">Prix courant</span>
          <span className="font-mono font-bold">
            <Money amount={diag.prixCourant} mono={false} />
          </span>
        </div>
        <div className="text-success text-right">
          <span className="block text-[10px] uppercase tracking-wider">Plafond</span>
          <span className="font-mono font-semibold">
            <Money amount={max} mono={false} />
          </span>
        </div>
      </div>
    </div>
  )
}

function ComposanteCard({
  icon: Icon,
  color,
  title,
  value,
  cap,
  allowNegative,
  explanation,
}: {
  icon: typeof Calculator
  color: 'success' | 'terra'
  title: string
  value: number
  cap: number
  allowNegative: boolean
  explanation: React.ReactNode
}) {
  const palette = {
    success: { text: 'text-success', bar: 'bg-success', bg: 'bg-success/10', border: 'border-success/30' },
    terra: { text: 'text-terra', bar: 'bg-terra', bg: 'bg-terra/10', border: 'border-terra/30' },
  }[color]
  const range = allowNegative ? cap * 2 : cap
  const pct = allowNegative
    ? (clamp(value, -cap, cap) + cap) / range * 100
    : (clamp(value, 0, cap) / range) * 100
  return (
    <div className={cn('rounded-xl border-[1.5px] p-4', palette.border)}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', palette.bg)}>
          <Icon className={cn('w-4 h-4', palette.text)} strokeWidth={1.75} />
        </div>
        <div>
          <p className="font-display font-semibold text-earth text-sm">{title}</p>
          <p className={cn('font-mono font-bold text-xl', palette.text)}>{fmtSign(value)}</p>
        </div>
      </div>
      <div className="relative h-2 bg-sand-200 rounded-full mb-2">
        {allowNegative && (
          <span className="absolute top-0 bottom-0 left-1/2 w-px bg-earth-400" />
        )}
        <span
          className={cn('absolute top-0 bottom-0 rounded-full', palette.bar)}
          style={{
            left: allowNegative ? `${Math.min(50, pct)}%` : '0',
            width: `${allowNegative ? Math.abs(pct - 50) : pct}%`,
          }}
        />
      </div>
      <p className="font-body text-[11px] text-earth-500 mb-2">
        Borne {allowNegative ? '±' : '+'}{fmtPct(cap, 0)}
      </p>
      <p className="font-body text-earth-600 text-xs leading-relaxed">{explanation}</p>
    </div>
  )
}

function HistoriqueList({ items }: { items: HistoriquePrixPartResponse[] }) {
  return (
    <ul className="space-y-2">
      {items.map((h) => {
        const positif = h.variationPct >= 0
        return (
          <li
            key={h.id}
            className="bg-white rounded-lg border border-earth/8 p-3 flex items-start gap-3"
          >
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                positif ? 'bg-success/10' : 'bg-error/10'
              )}
            >
              {positif ? (
                <TrendingUp className="w-4 h-4 text-success" strokeWidth={1.75} />
              ) : (
                <TrendingDown className="w-4 h-4 text-error" strokeWidth={1.75} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-body font-semibold text-earth text-sm">
                  {raisonLabel(h.raison)}
                </span>
                <span className="text-earth-400 text-xs">·</span>
                <span className="font-mono text-earth-500 text-xs">
                  {formatDateTime(h.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-earth-600 mt-1 flex-wrap">
                <span>
                  Prix :{' '}
                  <span className="font-semibold text-earth">
                    <Money amount={h.prixUnitaire} mono={false} />
                  </span>
                </span>
                <span>
                  Variation :{' '}
                  <span className={positif ? 'text-success font-bold' : 'text-error font-bold'}>
                    {positif ? '+' : ''}
                    {fmtNum(h.variationPct, 2)}%
                  </span>
                </span>
                <span>
                  Bonus renta : <span className="text-success">{fmtSign(h.bonusRentabiliteTotal)}</span>
                </span>
                <span>
                  Bonus demande : <span className="text-terra">{fmtSign(h.bonusDemande)}</span>
                </span>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function raisonLabel(r: RaisonRecalculPrix): string {
  switch (r) {
    case 'INITIALE':
      return 'Snapshot initial'
    case 'DECLARATION_REVENU_VALIDEE':
      return 'Revenu trimestriel validé'
    case 'CRON_TRIMESTRIEL':
      return 'Cron trimestriel'
    case 'LISTE_ATTENTE_CHANGEE':
      return 'Liste d\'attente changée'
    case 'TRADE_SECONDAIRE':
      return 'Marché secondaire'
    case 'AJUSTEMENT_ADMIN':
      return 'Ajustement admin'
    default:
      return r
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function fmtNum(v: number, digits: number): string {
  return v.toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function fmtPct(fraction: number, digits: number): string {
  return (fraction * 100).toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }) + '%'
}

function fmtSign(fraction: number): string {
  const pct = fraction * 100
  const sign = pct >= 0 ? '+' : ''
  return sign + fmtNum(pct, 2) + '%'
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
