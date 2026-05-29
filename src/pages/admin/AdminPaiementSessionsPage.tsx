import { AlertTriangle, CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminPaymentSessions, useRetryOnChain } from '@/lib/api/admin'
import { extractApiError } from '@/lib/api/errors'
import type { AdminPaymentSessionResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type Statut = 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'FAILED'

const TABS: { value: Statut; label: string; icon: React.ReactNode }[] = [
  { value: 'FAILED', label: 'Echoues', icon: <AlertTriangle className="w-4 h-4" strokeWidth={1.75} /> },
  { value: 'PENDING', label: 'En attente', icon: <Clock className="w-4 h-4" strokeWidth={1.75} /> },
  { value: 'CONFIRMED', label: 'Confirmes', icon: <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} /> },
  { value: 'EXPIRED', label: 'Expires', icon: <XCircle className="w-4 h-4" strokeWidth={1.75} /> },
]

export function AdminPaiementSessionsPage() {
  const [statut, setStatut] = useState<Statut>('FAILED')
  const { data: sessions, isLoading, isError } = useAdminPaymentSessions(statut)
  const retryMutation = useRetryOnChain()

  function handleRetry(sessionId: number) {
    retryMutation.mutate(sessionId, {
      onSuccess: () => toast.success(`Session ${sessionId} : retry on-chain OK`),
      onError: (err) => toast.error(extractApiError(err, 'Retry impossible')),
    })
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Sessions de paiement
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Visualise les sessions PSP par statut. Retry on-chain disponible sur les sessions
          confirmees dont l'ecriture blockchain a echoue.
        </p>
      </header>

      <div role="tablist" className="inline-flex bg-sand-200 rounded-md p-1 gap-1 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={statut === t.value ? 'true' : 'false'}
            onClick={() => setStatut(t.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-body transition-colors',
              statut === t.value
                ? 'bg-white text-earth shadow-sm font-semibold'
                : 'text-earth-600 hover:text-earth'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {isError && (
        <EmptyState
          icon={AlertTriangle}
          title="Erreur de chargement"
          description="Impossible de charger les sessions. Reessayez plus tard."
        />
      )}

      {sessions && sessions.length === 0 && (
        <EmptyState
          icon={CheckCircle2}
          title="Aucune session"
          description={`Pas de session avec le statut ${statut}.`}
        />
      )}

      {sessions && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionCard
              key={s.sessionId}
              session={s}
              onRetry={handleRetry}
              isRetrying={retryMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type SessionCardProps = {
  session: AdminPaymentSessionResponse
  onRetry: (id: number) => void
  isRetrying: boolean
}

function SessionCard({ session, onRetry, isRetrying }: SessionCardProps) {
  // Retry possible uniquement si CONFIRMED + errorMessage mentionne "On-chain"
  const isRetryable =
    session.statut === 'CONFIRMED' &&
    (session.errorMessage?.includes('On-chain') ?? false)

  return (
    <div className="bg-white rounded-lg border border-earth/8 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-xs text-earth-500">#{session.sessionId}</span>
            <StatutPill statut={session.statut} />
            <span className="font-mono text-xs text-earth-400">{session.providerName}</span>
          </div>
          <p className="font-display font-bold text-earth text-base mb-1">
            {session.proprieteNom}{' '}
            <span className="font-body font-normal text-earth-600 text-sm">
              · {session.nombreParts} part{session.nombreParts > 1 ? 's' : ''}
            </span>
          </p>
          <p className="font-body text-sm text-earth-600">
            <span className="font-mono text-earth">{session.investisseurEmail}</span>
            {' · '}
            <Money
              amount={session.montantFiat}
              mono={false}
              className="font-mono font-semibold text-earth"
            />{' '}
            ({session.deviseFiat})
          </p>
          {session.errorMessage && (
            <p className="mt-2 text-xs font-mono text-warning bg-warning/10 px-2 py-1 rounded">
              {session.errorMessage}
            </p>
          )}
          <p className="mt-2 text-xs font-mono text-earth-400">
            Cree le {new Date(session.createdAt).toLocaleString('fr-FR')}
            {session.confirmedAt && (
              <> · confirme le {new Date(session.confirmedAt).toLocaleString('fr-FR')}</>
            )}
          </p>
        </div>

        {isRetryable && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRetry(session.sessionId)}
            disabled={isRetrying}
            className="shrink-0"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRetrying && 'animate-spin')} strokeWidth={2} />
            Retry on-chain
          </Button>
        )}
      </div>
    </div>
  )
}

function StatutPill({ statut }: { statut: AdminPaymentSessionResponse['statut'] }) {
  const config = {
    PENDING: { label: 'PENDING', cls: 'bg-ocean/10 text-ocean' },
    CONFIRMED: { label: 'CONFIRMED', cls: 'bg-success/10 text-success' },
    EXPIRED: { label: 'EXPIRED', cls: 'bg-earth/10 text-earth-600' },
    FAILED: { label: 'FAILED', cls: 'bg-warning/10 text-warning' },
  }[statut]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold', config.cls)}>
      {config.label}
    </span>
  )
}
