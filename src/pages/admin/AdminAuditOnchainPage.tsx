import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  HandCoins,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { extractApiError } from '@/lib/api/errors'
import {
  useLedgerEvents,
  useLedgerStatus,
  useRetrySyncTask,
  useSyncQueueList,
  useSyncQueueStats,
} from '@/lib/api/prix-part'
import type {
  BlockchainSyncTaskResponse,
  LedgerEventResponse,
  LedgerEventType,
  StatutSyncBlockchain,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<LedgerEventType, string> = {
  REVENU_ENREGISTRE: 'Revenu enregistré',
  DIVIDENDE_DISTRIBUE: 'Dividende distribué',
  KYC_ENREGISTRE: 'Vérification de profil ancrée',
  KYC_REVOQUE: 'Vérification de profil révoquée',
}

const RANGE_OPTIONS: { label: string; blocks: number }[] = [
  { label: '~1h (300 blocs)', blocks: 300 },
  { label: '~24h (7 200 blocs)', blocks: 7200 },
  { label: '~7j (50 000 blocs)', blocks: 50000 },
  { label: '~30j (215 000 blocs)', blocks: 215000 },
]

type Filter = 'TOUS' | LedgerEventType

/**
 * V2 Q (07/06/2026) : page admin "Audit on-chain".
 *
 * Visualise les events RevenuEnregistre + DividendeDistribue emis par le
 * RevenueLedger. Permet de prouver publiquement que :
 *   - chaque revenu trimestriel valide est ancre on-chain avec le sha256 du
 *     justificatif
 *   - chaque dividende distribue est trace par investisseur
 *
 * La page tombe en EmptyState propre si le ledger n'est pas configure
 * (variable BLOCKCHAIN_REVENUE_LEDGER_ADDRESS vide en dev).
 */
export function AdminAuditOnchainPage() {
  const [maxBlocks, setMaxBlocks] = useState<number>(7200)
  const [filtre, setFiltre] = useState<Filter>('TOUS')
  const [recherche, setRecherche] = useState('')

  const status = useLedgerStatus()
  const events = useLedgerEvents(maxBlocks)

  const filtered = useMemo(() => {
    const items = events.data ?? []
    return items.filter((e) => {
      if (filtre !== 'TOUS' && e.type !== filtre) return false
      if (recherche.trim().length > 0) {
        const q = recherche.trim().toLowerCase()
        const hay = [e.proprieteToken, e.investisseur, e.txHash, e.hashJustificatif]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [events.data, filtre, recherche])

  const nbRevenus = filtered.filter((e) => e.type === 'REVENU_ENREGISTRE').length
  const nbDividendes = filtered.filter((e) => e.type === 'DIVIDENDE_DISTRIBUE').length

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Audit on-chain
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Journal public et immuable des revenus validés + distributions de dividendes,
          ancré dans le contrat <code className="font-mono text-xs">RevenueLedger</code>.
        </p>
      </header>

      {status.data && !status.data.actif && (
        <EmptyState
          icon={ShieldOff}
          title="Ledger on-chain non configuré"
          description={
            "La variable d'environnement BLOCKCHAIN_REVENUE_LEDGER_ADDRESS est vide. " +
            "Déployer le RevenueLedger (scripts/deploy-revenue-ledger.js) puis renseigner " +
            "son adresse dans le backend pour activer l'audit on-chain."
          }
        />
      )}

      {status.data?.actif && (
        <>
          {/* Synthèse */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SynthCard
              icon={Banknote}
              label="Revenus ancrés"
              value={nbRevenus}
              hint="Sur la période sélectionnée"
              color="success"
            />
            <SynthCard
              icon={HandCoins}
              label="Dividendes distribués"
              value={nbDividendes}
              hint="Sur la période sélectionnée"
              color="terra"
            />
            <SynthCard
              icon={Radio}
              label="Période"
              value={
                <span className="text-base font-mono">
                  {RANGE_OPTIONS.find((r) => r.blocks === maxBlocks)?.label ?? `${maxBlocks} blocs`}
                </span>
              }
              hint="Bloc le plus récent ← N blocs"
              color="ocean"
            />
          </section>

          {/* Filtres */}
          <section className="bg-sand-100 rounded-xl border border-earth/5 p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="type" className="text-xs">Type d'event</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(['TOUS', 'REVENU_ENREGISTRE', 'DIVIDENDE_DISTRIBUE', 'KYC_ENREGISTRE', 'KYC_REVOQUE'] as Filter[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFiltre(f)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-body font-semibold transition-colors',
                        filtre === f
                          ? 'bg-ocean text-white'
                          : 'bg-white text-earth-600 border border-earth/10 hover:border-ocean/30'
                      )}
                    >
                      {f === 'TOUS' ? 'Tous' : TYPE_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="range" className="text-xs">Profondeur d'historique</Label>
                <select
                  id="range"
                  title="Profondeur d'historique en blocs"
                  value={maxBlocks}
                  onChange={(e) => setMaxBlocks(parseInt(e.target.value, 10))}
                  className="mt-1 w-full h-9 rounded-md border-[1.5px] border-sand-400 bg-white px-3 text-sm font-body text-earth focus-visible:outline-none focus-visible:border-ocean"
                >
                  {RANGE_OPTIONS.map((r) => (
                    <option key={r.blocks} value={r.blocks}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="search" className="text-xs">Recherche</Label>
                <div className="relative mt-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-earth-400 pointer-events-none"
                    strokeWidth={2}
                  />
                  <Input
                    id="search"
                    type="text"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Adresse, hash, tx..."
                    className="pl-9 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* V2 R : queue de sync blockchain (retry des push echoues) */}
          <SyncQueueSection />

          {/* Liste */}
          {events.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : events.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Lecture impossible"
              description="Le RPC blockchain n'a pas répondu. Réessayez dans un instant."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Filter}
              title="Aucun event sur cette période"
              description={
                recherche.trim()
                  ? 'Aucun résultat ne correspond à votre recherche.'
                  : "Aucun revenu ou dividende n'a été ancré on-chain sur cette plage de blocs."
              }
            />
          ) : (
            <ul className="space-y-2">
              {filtered.map((e) => (
                <EventCard key={`${e.txHash}-${e.blockNumber}-${e.type}-${e.investisseur ?? ''}`} ev={e} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function SynthCard({
  icon: Icon,
  label,
  value,
  hint,
  color,
}: {
  icon: typeof Radio
  label: string
  value: React.ReactNode
  hint: string
  color: 'success' | 'terra' | 'ocean'
}) {
  const palette = {
    success: { bg: 'bg-success/10', text: 'text-success' },
    terra: { bg: 'bg-terra/10', text: 'text-terra' },
    ocean: { bg: 'bg-ocean/10', text: 'text-ocean' },
  }[color]
  return (
    <div className="rounded-xl border-[1.5px] border-earth/10 bg-white p-4 flex items-start gap-3">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', palette.bg)}>
        <Icon className={cn('w-5 h-5', palette.text)} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="font-body text-xs text-earth-500 uppercase tracking-wider">{label}</p>
        <p className="font-display font-bold text-earth text-2xl mt-0.5">{value}</p>
        <p className="font-body text-xs text-earth-500 mt-0.5">{hint}</p>
      </div>
    </div>
  )
}

function EventCard({ ev }: { ev: LedgerEventResponse }) {
  const meta = eventMeta(ev.type)
  const Icon = meta.icon
  const palette = meta.palette
  const montant = ev.montantUsd ? Number(ev.montantUsd) : 0
  const isKyc = ev.type === 'KYC_ENREGISTRE' || ev.type === 'KYC_REVOQUE'

  return (
    <li className={cn('bg-sand-100 rounded-xl border-[1.5px] p-4 flex items-start gap-3', palette.border)}>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', palette.bg)}>
        <Icon className={cn('w-5 h-5', palette.text)} strokeWidth={1.75} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={cn('font-body font-semibold text-sm', palette.text)}>
            {TYPE_LABELS[ev.type]}
          </span>
          <span className="text-earth-400 text-xs">·</span>
          <span className="font-mono text-earth-500 text-xs">
            Bloc {ev.blockNumber}
          </span>
          {ev.trimestre && (
            <>
              <span className="text-earth-400 text-xs">·</span>
              <span className="font-mono text-earth-500 text-xs">
                Trim. {trimestreLabel(ev.trimestre)}
              </span>
            </>
          )}
          {isKyc && ev.kycExpireLe && (
            <>
              <span className="text-earth-400 text-xs">·</span>
              <span className="font-mono text-earth-500 text-xs">
                Expire le {new Date(ev.kycExpireLe * 1000).toLocaleDateString('fr-FR')}
              </span>
            </>
          )}
        </div>

        {!isKyc && (
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="font-mono font-bold text-earth text-lg">
              <Money amount={montant} mono={false} />
            </span>
            {ev.revenuIdBackend && (
              <span className="font-mono text-earth-500 text-xs">
                revenuId BDD : {ev.revenuIdBackend}
              </span>
            )}
          </div>
        )}

        {ev.motif && (
          <p className="font-body text-error text-xs mb-2">
            Motif : {ev.motif}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono">
          {ev.proprieteToken && (
            <CompactLink label="Propriété" address={ev.proprieteToken} kind="address" />
          )}
          {ev.investisseur && (
            <CompactLink
              label={isKyc ? 'Wallet vérifié' : 'Investisseur'}
              address={ev.investisseur}
              kind="address"
            />
          )}
          <CompactLink label="Tx" address={ev.txHash} kind="tx" />
          {ev.hashJustificatif && ev.hashJustificatif !== '0x' + '00'.repeat(32) && (
            <div className="flex items-start gap-1">
              <FileText className="w-3 h-3 text-earth-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <span className="text-earth-500 text-xs">
                {isKyc ? 'empreinte profil' : 'sha256 justif'} :{' '}
                <span className="text-earth-600">
                  {ev.hashJustificatif.slice(0, 10)}…{ev.hashJustificatif.slice(-6)}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

function eventMeta(type: LedgerEventType): {
  icon: typeof Banknote
  palette: { bg: string; text: string; border: string }
} {
  switch (type) {
    case 'REVENU_ENREGISTRE':
      return {
        icon: Banknote,
        palette: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
      }
    case 'DIVIDENDE_DISTRIBUE':
      return {
        icon: HandCoins,
        palette: { bg: 'bg-terra/10', text: 'text-terra', border: 'border-terra/30' },
      }
    case 'KYC_ENREGISTRE':
      return {
        icon: ShieldCheck,
        palette: { bg: 'bg-ocean/10', text: 'text-ocean', border: 'border-ocean/30' },
      }
    case 'KYC_REVOQUE':
      return {
        icon: ShieldOff,
        palette: { bg: 'bg-error/10', text: 'text-error', border: 'border-error/30' },
      }
  }
}

function CompactLink({ label, address, kind }: { label: string; address: string; kind: 'address' | 'tx' }) {
  const url = `https://sepolia.etherscan.io/${kind}/${address}`
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-ocean hover:underline truncate"
      title={address}
    >
      <CheckCircle2 className="w-3 h-3 flex-shrink-0" strokeWidth={2} />
      <span className="text-earth-500">{label} :</span>
      <span className="truncate">
        {address.slice(0, 8)}…{address.slice(-6)}
      </span>
      <ExternalLink className="w-3 h-3 flex-shrink-0" strokeWidth={2} />
    </a>
  )
}

// =========================================================================
// V2 R (07/06/2026) : queue de sync blockchain
// =========================================================================

function SyncQueueSection() {
  const stats = useSyncQueueStats()
  const list = useSyncQueueList()
  const retry = useRetrySyncTask()
  const [showAll, setShowAll] = useState(false)

  const items = list.data ?? []
  const failed = items.filter((t) => t.status === 'FAILED')
  const pending = items.filter((t) => t.status === 'PENDING')
  const visible = showAll ? items : [...failed, ...pending].slice(0, 5)

  function handleRetry(id: number) {
    retry.mutate(id, {
      onSuccess: () => toast.success(`Job #${id} relancé. Reprise au prochain tick (max 60s).`),
      onError: (e) => toast.error(extractApiError(e, 'Retry impossible.')),
    })
  }

  return (
    <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display font-semibold text-earth text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
            File de synchronisation
          </h2>
          <p className="font-body text-earth-500 text-xs mt-0.5">
            Jobs blockchain en attente, en cours de retry, ou abandonnés après 5 essais.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatPill
          icon={Clock}
          label="En attente"
          value={stats.data?.pending ?? 0}
          color="warning"
        />
        <StatPill
          icon={CheckCircle2}
          label="Succès"
          value={stats.data?.success ?? 0}
          color="success"
        />
        <StatPill
          icon={XCircle}
          label="Abandonnés"
          value={stats.data?.failed ?? 0}
          color="error"
        />
      </div>

      {list.isLoading ? (
        <Skeleton className="h-32 rounded-lg" />
      ) : visible.length === 0 ? (
        <p className="font-body text-earth-500 text-sm italic">
          Aucun job en attente ni en échec. Tout est synchronisé.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((t) => (
            <SyncTaskCard
              key={t.id}
              task={t}
              onRetry={() => handleRetry(t.id)}
              retryPending={retry.isPending}
            />
          ))}
        </ul>
      )}

      {items.length > visible.length && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-3 text-ocean text-xs font-body font-semibold hover:underline"
        >
          Afficher les {items.length} jobs (PENDING/SUCCESS/FAILED) ↓
        </button>
      )}
      {showAll && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="mt-3 text-earth-500 text-xs font-body hover:underline"
        >
          Masquer les jobs réussis
        </button>
      )}
    </section>
  )
}

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Clock
  label: string
  value: number
  color: 'warning' | 'success' | 'error'
}) {
  const palette = {
    warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
    success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
    error: { bg: 'bg-error/10', text: 'text-error', border: 'border-error/30' },
  }[color]
  return (
    <div className={cn('bg-white rounded-lg border-[1.5px] p-3 flex items-center gap-3', palette.border)}>
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', palette.bg)}>
        <Icon className={cn('w-4 h-4', palette.text)} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="font-body text-xs text-earth-500 uppercase tracking-wider">{label}</p>
        <p className="font-display font-bold text-earth text-xl">{value}</p>
      </div>
    </div>
  )
}

function SyncTaskCard({
  task,
  onRetry,
  retryPending,
}: {
  task: BlockchainSyncTaskResponse
  onRetry: () => void
  retryPending: boolean
}) {
  const statutPalette: Record<StatutSyncBlockchain, { bg: string; text: string; border: string; label: string }> = {
    PENDING: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', label: 'En attente' },
    SUCCESS: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30', label: 'Succès' },
    FAILED:  { bg: 'bg-error/10', text: 'text-error', border: 'border-error/30', label: 'Abandonné' },
  }
  const palette = statutPalette[task.status]

  return (
    <li className={cn('bg-white rounded-lg border-[1.5px] p-3', palette.border)}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-earth-500 text-xs">#{task.id}</span>
            <span className="font-body font-semibold text-earth text-sm">
              {typeLabel(task.type)}
            </span>
            <span className={cn('font-body text-[10px] font-bold px-2 py-0.5 rounded-full', palette.bg, palette.text)}>
              {palette.label}
            </span>
            {task.attempts > 0 && (
              <span className="font-mono text-earth-500 text-xs">
                {task.attempts}/5 essais
              </span>
            )}
          </div>

          {task.refId && (
            <p className="font-mono text-xs text-earth-500">
              Réf BDD : {task.refId}
            </p>
          )}

          {task.lastError && task.status !== 'SUCCESS' && (
            <p className="font-mono text-xs text-error mt-1 break-words">
              ⚠ {task.lastError.slice(0, 200)}
              {task.lastError.length > 200 && '…'}
            </p>
          )}

          {task.txHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${task.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-ocean hover:underline inline-flex items-center gap-1 mt-1"
            >
              tx : {task.txHash.slice(0, 10)}…{task.txHash.slice(-6)}
              <ExternalLink className="w-3 h-3" strokeWidth={2} />
            </a>
          )}

          {task.nextAttemptAt && task.status === 'PENDING' && (
            <p className="font-body text-xs text-earth-500 mt-1">
              Prochain essai : {formatDateTime(task.nextAttemptAt)}
            </p>
          )}
        </div>

        {task.status === 'FAILED' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={retryPending}
            className="flex-shrink-0"
          >
            <RefreshCw strokeWidth={2} />
            Relancer
          </Button>
        )}
      </div>
    </li>
  )
}

function typeLabel(t: BlockchainSyncTaskResponse['type']): string {
  switch (t) {
    case 'SYNC_PRIX':                return 'Sync prix dynamique'
    case 'SET_STATUT':               return 'Mise à jour statut'
    case 'ENREGISTRER_REVENU':       return 'Ancrage revenu (Ledger)'
    case 'ENREGISTRER_DISTRIBUTION': return 'Ancrage distribution (Ledger)'
  }
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function trimestreLabel(yyyyQ: number): string {
  // 20262 -> "Q2 2026", 20264 -> "Q4 2026"
  const annee = Math.floor(yyyyQ / 10)
  const q = yyyyQ % 10
  return `Q${q} ${annee}`
}
