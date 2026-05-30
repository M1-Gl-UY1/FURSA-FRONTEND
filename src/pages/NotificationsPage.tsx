import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCheck,
  Coins,
  Info,
  Megaphone,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useMarquerLue,
  useMarquerNonLue,
  useMarquerToutLu,
  useMesNotifications,
  useSupprimerNotification,
  useSupprimerToutLu,
} from '@/lib/api/notifications'
import type { NotificationResponse, TypeMessage } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'unread'

// =============================================================================
// Helpers de groupement par date
// =============================================================================

type Bucket = 'today' | 'yesterday' | 'week' | 'older' | 'undated'

const BUCKET_LABEL: Record<Bucket, string> = {
  today: "Aujourd'hui",
  yesterday: 'Hier',
  week: 'Cette semaine',
  older: 'Plus ancien',
  undated: 'Sans date',
}

const BUCKET_ORDER: Bucket[] = ['today', 'yesterday', 'week', 'older', 'undated']

function bucketOf(iso: string | undefined): Bucket {
  if (!iso) return 'undated'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'undated'

  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startYesterday = new Date(startToday)
  startYesterday.setDate(startToday.getDate() - 1)
  const startWeek = new Date(startToday)
  startWeek.setDate(startToday.getDate() - 7)

  if (d >= startToday) return 'today'
  if (d >= startYesterday) return 'yesterday'
  if (d >= startWeek) return 'week'
  return 'older'
}

function isUnread(n: NotificationResponse): boolean {
  return !(n.lu ?? n.estLue)
}

// =============================================================================
// Page
// =============================================================================

export function NotificationsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const { data, isLoading } = useMesNotifications({
    nonLuesSeulement: filter === 'unread',
    pollMs: 30_000,
  })
  const marquerLue = useMarquerLue()
  const marquerNonLue = useMarquerNonLue()
  const marquerToutLu = useMarquerToutLu()
  const supprimer = useSupprimerNotification()
  const supprimerToutLu = useSupprimerToutLu()

  const notifications = data ?? []
  const unreadCount = notifications.filter(isUnread).length
  const hasReadOnes = notifications.some((n) => !isUnread(n))
  const selectionCount = selectedIds.size

  // Group par bucket
  const grouped = useMemo(() => {
    const map = new Map<Bucket, NotificationResponse[]>()
    for (const n of notifications) {
      const b = bucketOf(n.date ?? n.dateCreation)
      const arr = map.get(b) ?? []
      arr.push(n)
      map.set(b, arr)
    }
    return BUCKET_ORDER.flatMap((b) => {
      const items = map.get(b)
      return items && items.length > 0 ? [{ bucket: b, items }] : []
    })
  }, [notifications])

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function selectAllVisible() {
    setSelectedIds(new Set(notifications.map((n) => n.id)))
  }

  async function bulkMarkRead() {
    const ids = [...selectedIds]
    await Promise.all(
      ids.map((id) => {
        const target = notifications.find((n) => n.id === id)
        if (target && isUnread(target)) {
          return marquerLue.mutateAsync(id).catch(() => null)
        }
        return Promise.resolve(null)
      })
    )
    clearSelection()
    toast.success(`${ids.length} notification(s) marquée(s) comme lue(s)`)
  }

  async function bulkDelete() {
    const ids = [...selectedIds]
    await Promise.all(ids.map((id) => supprimer.mutateAsync(id).catch(() => null)))
    clearSelection()
    toast.success(`${ids.length} notification(s) supprimée(s)`)
  }

  function handleOpen(n: NotificationResponse) {
    // Marque comme lue si besoin, puis navigue.
    if (isUnread(n)) {
      marquerLue.mutate(n.id)
    }
    if (n.lien && n.lien.startsWith('/')) {
      navigate(n.lien)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1 flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-terra text-white text-xs font-mono font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="font-body text-earth-600 text-sm">
            {unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''} — cliquez sur une notification pour la consulter.`
              : 'Vous êtes à jour. Tout est lu.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => marquerToutLu.mutate()}
              disabled={marquerToutLu.isPending}
            >
              <CheckCheck strokeWidth={1.75} />
              Tout marquer lu
            </Button>
          )}
          {hasReadOnes && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Supprimer toutes les notifications déjà lues ?')) {
                  supprimerToutLu.mutate(undefined, {
                    onSuccess: (res) => toast.success(`${res.supprimees} supprimée(s)`),
                  })
                }
              }}
              disabled={supprimerToutLu.isPending}
              className="text-earth-500 hover:text-error"
            >
              <Trash2 strokeWidth={1.75} />
              Nettoyer les lues
            </Button>
          )}
        </div>
      </header>

      {/* Barre de selection bulk (apparait quand au moins 1 selection) */}
      {selectionCount > 0 && (
        <div className="sticky top-16 z-20 animate-fade-up bg-earth text-white rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-lg">
          <p className="font-body text-sm font-semibold flex-1 min-w-0">
            {selectionCount} sélectionnée{selectionCount > 1 ? 's' : ''}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={bulkMarkRead}
            className="text-white hover:bg-white/10"
          >
            <CheckCheck strokeWidth={1.75} />
            Marquer lue{selectionCount > 1 ? 's' : ''}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={bulkDelete}
            className="text-white hover:bg-error hover:text-white"
          >
            <Trash2 strokeWidth={1.75} />
            Supprimer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAllVisible}
            className="text-white hover:bg-white/10"
          >
            Tout sélectionner
          </Button>
          <button
            type="button"
            onClick={clearSelection}
            aria-label="Annuler la sélection"
            className="w-8 h-8 rounded-md hover:bg-white/10 flex items-center justify-center"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Filtres */}
      <div role="tablist" className="inline-flex bg-sand-200 rounded-md p-1 gap-1">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          Toutes
        </FilterButton>
        <FilterButton active={filter === 'unread'} onClick={() => setFilter('unread')}>
          Non lues{unreadCount > 0 && ` (${unreadCount})`}
        </FilterButton>
      </div>

      {/* Liste */}
      <section className="space-y-8">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <EmptyState
            icon={Bell}
            tone="neutral"
            title={filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            description={
              filter === 'unread'
                ? 'Vous êtes à jour. Tout a été lu.'
                : 'Vos notifications apparaîtront ici (transactions, dividendes, nouvelles opportunités).'
            }
          />
        )}

        {!isLoading &&
          grouped.map(({ bucket, items }) => (
            <div key={bucket}>
              <h2 className="font-display font-semibold text-earth-600 text-sm uppercase tracking-widest mb-3 px-1">
                {BUCKET_LABEL[bucket]}
                <span className="ml-2 font-mono text-xs text-earth-400 normal-case tracking-normal">
                  {items.length}
                </span>
              </h2>
              <ul className="space-y-2">
                {items.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    selected={selectedIds.has(n.id)}
                    onToggleSelect={() => toggleSelect(n.id)}
                    onOpen={() => handleOpen(n)}
                    onMarkRead={() => marquerLue.mutate(n.id)}
                    onMarkUnread={() => marquerNonLue.mutate(n.id)}
                    onDelete={() => supprimer.mutate(n.id)}
                  />
                ))}
              </ul>
            </div>
          ))}
      </section>
    </div>
  )
}

// =============================================================================
// Items
// =============================================================================

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

type ItemProps = {
  notification: NotificationResponse
  selected: boolean
  onToggleSelect: () => void
  onOpen: () => void
  onMarkRead: () => void
  onMarkUnread: () => void
  onDelete: () => void
}

function NotificationItem({
  notification: n,
  selected,
  onToggleSelect,
  onOpen,
  onMarkRead,
  onMarkUnread,
  onDelete,
}: ItemProps) {
  const unread = isUnread(n)
  const clickable = !!(n.lien && n.lien.startsWith('/'))
  const meta = typeMeta(n.type)

  return (
    <li
      className={cn(
        'group relative rounded-xl border transition-all duration-200 animate-fade-up',
        unread
          ? 'bg-white border-terra/30 hover:border-terra/60 hover:shadow-sm'
          : 'bg-sand-100 border-earth/5 hover:border-earth/15',
        selected && 'ring-2 ring-ocean/40 border-ocean/40'
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5">
        {/* Checkbox de selection (apparait au hover ou si selectionne) */}
        <label
          className={cn(
            'pt-1 cursor-pointer transition-opacity',
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            aria-label="Sélectionner cette notification"
          />
        </label>

        {/* Icone du type */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
            unread ? meta.iconBg : 'bg-sand-200 text-earth-500'
          )}
        >
          <meta.Icon className="w-5 h-5" strokeWidth={1.75} />
        </div>

        {/* Contenu clickable */}
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 min-w-0 text-left"
          aria-label={n.titre ? `Ouvrir : ${n.titre}` : 'Ouvrir la notification'}
        >
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0 flex-1">
              {n.titre && (
                <p
                  className={cn(
                    'font-body text-sm leading-snug mb-0.5',
                    unread ? 'text-earth font-semibold' : 'text-earth-700 font-medium'
                  )}
                >
                  {n.titre}
                </p>
              )}
              <p
                className={cn(
                  'font-body text-sm leading-snug',
                  unread ? 'text-earth-700' : 'text-earth-500'
                )}
              >
                {n.message}
              </p>
            </div>
            {unread && (
              <span
                className="w-2 h-2 rounded-full bg-terra mt-1.5 shrink-0 animate-pulse"
                aria-label="Non lue"
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-3 mt-1.5">
            <p className="font-mono text-[11px] text-earth-500">
              {formatDate(n.date ?? n.dateCreation ?? '')}
            </p>
            {clickable && (
              <span className="inline-flex items-center gap-1 text-ocean text-xs font-body font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Ouvrir
                <ArrowRight className="w-3 h-3" strokeWidth={2} />
              </span>
            )}
          </div>
        </button>

        {/* Quick actions (visibles au hover) */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {unread ? (
            <IconAction
              title="Marquer comme lue"
              onClick={onMarkRead}
              icon={<CheckCheck className="w-4 h-4" strokeWidth={1.75} />}
            />
          ) : (
            <IconAction
              title="Marquer comme non lue"
              onClick={onMarkUnread}
              icon={<RotateCcw className="w-4 h-4" strokeWidth={1.75} />}
            />
          )}
          <IconAction
            title="Supprimer"
            onClick={onDelete}
            danger
            icon={<Trash2 className="w-4 h-4" strokeWidth={1.75} />}
          />
        </div>
      </div>
    </li>
  )
}

function IconAction({
  title,
  onClick,
  icon,
  danger,
}: {
  title: string
  onClick: () => void
  icon: React.ReactNode
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
        danger
          ? 'text-earth-500 hover:text-error hover:bg-error/10'
          : 'text-earth-500 hover:text-earth hover:bg-earth/5'
      )}
    >
      {icon}
    </button>
  )
}

// =============================================================================
// Type → icon mapping
// =============================================================================

function typeMeta(type: TypeMessage | undefined): {
  Icon: typeof Info
  iconBg: string
} {
  switch (type) {
    case 'TRANSACTION':
      return { Icon: Coins, iconBg: 'bg-success/15 text-success' }
    case 'ANNONCE':
      return { Icon: Sparkles, iconBg: 'bg-ocean/15 text-ocean' }
    case 'ALERTE':
      return { Icon: AlertTriangle, iconBg: 'bg-error/15 text-error' }
    case 'AVERTISSEMENT':
      return { Icon: AlertCircle, iconBg: 'bg-warning/15 text-warning' }
    case 'INFO':
      return { Icon: Info, iconBg: 'bg-terra/15 text-terra' }
    default:
      return { Icon: Megaphone, iconBg: 'bg-terra/15 text-terra' }
  }
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso

  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Aujourd'hui → "il y a Xm" ou heure
  if (d >= startToday) {
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 1) return "À l'instant"
    if (diffMin < 60) return `il y a ${diffMin} min`
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  }

  // Sinon : date courte + heure
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
