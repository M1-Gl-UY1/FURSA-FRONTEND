import { useState } from 'react'
import { Bell, CheckCheck, Info } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useMarquerLue,
  useMarquerToutLu,
  useMesNotifications,
} from '@/lib/api/notifications'
import type { NotificationResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'unread'

export function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const { data, isLoading } = useMesNotifications({
    nonLuesSeulement: filter === 'unread',
    pollMs: 30_000,
  })
  const marquerLue = useMarquerLue()
  const marquerToutLu = useMarquerToutLu()

  const notifications = data ?? []
  const hasUnread = notifications.some((n) => !(n.lu ?? n.estLue))

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
            Notifications
          </h1>
          <p className="font-body text-earth-600 text-sm">
            Toutes vos notifications, lues et non lues.
          </p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            onClick={() => marquerToutLu.mutate()}
            disabled={marquerToutLu.isPending}
          >
            <CheckCheck strokeWidth={1.75} />
            Tout marquer comme lu
          </Button>
        )}
      </header>

      {/* Filtre */}
      <div role="tablist" className="inline-flex bg-sand-200 rounded-md p-1 gap-1">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          Toutes
        </FilterButton>
        <FilterButton active={filter === 'unread'} onClick={() => setFilter('unread')}>
          Non lues
        </FilterButton>
      </div>

      {/* Liste */}
      <section>
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl bg-sand-300" />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <EmptyState
            icon={Bell}
            title={filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            description={
              filter === 'unread'
                ? 'Vous êtes à jour ! Toutes vos notifications ont été lues.'
                : 'Vos notifications apparaîtront ici (transactions, dividendes, mises à jour).'
            }
          />
        )}

        {!isLoading && notifications.length > 0 && (
          <ul className="space-y-2.5">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={() => marquerLue.mutate(n.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-md font-body text-sm font-semibold transition-colors',
        active
          ? 'bg-white text-earth shadow-sm'
          : 'text-earth-600 hover:text-earth hover:bg-white/50'
      )}
    >
      {children}
    </button>
  )
}

function NotificationItem({
  notification: n,
  onMarkRead,
}: {
  notification: NotificationResponse
  onMarkRead: () => void
}) {
  return (
    <li
      className={cn(
        'group rounded-xl border p-4 sm:p-5 flex items-start gap-4 transition-colors',
        (n.lu ?? n.estLue)
          ? 'bg-sand-100 border-earth/5'
          : 'bg-white border-terra/30 hover:border-terra/50'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-md flex items-center justify-center shrink-0',
          (n.lu ?? n.estLue) ? 'bg-sand-200 text-earth-500' : 'bg-terra/15 text-terra'
        )}
      >
        <Info className="w-5 h-5" strokeWidth={1.75} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p
            className={cn(
              'font-body text-sm leading-snug',
              (n.lu ?? n.estLue) ? 'text-earth-700' : 'text-earth font-medium'
            )}
          >
            {n.message}
          </p>
          {!(n.lu ?? n.estLue) && (
            <span className="w-2 h-2 rounded-full bg-terra mt-1.5 shrink-0" />
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] text-earth-500">
            {formatDate(n.date ?? n.dateCreation ?? '')}
          </p>
          {!(n.lu ?? n.estLue) && (
            <button
              type="button"
              onClick={onMarkRead}
              className="font-body text-xs text-ocean hover:underline font-semibold"
            >
              Marquer lue
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
