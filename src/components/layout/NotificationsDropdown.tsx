import { Link } from 'react-router-dom'
import { Bell, Check } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMarquerToutLu, useMesNotifications } from '@/lib/api/notifications'
import { cn } from '@/lib/utils'

const POLL_MS = 30_000

export function NotificationsDropdown() {
  const { data } = useMesNotifications({ pollMs: POLL_MS })
  const marquerToutLu = useMarquerToutLu()

  const notifications = data ?? []
  const unreadCount = notifications.filter((n) => !(n.lu ?? n.estLue)).length
  const top5 = notifications.slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        className="relative w-10 h-10 rounded-full flex items-center justify-center text-earth-600 hover:bg-earth/5 hover:text-earth transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2"
      >
        <Bell className="w-5 h-5" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] rounded-full bg-terra text-white text-[10px] font-mono font-bold flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[320px] sm:w-[360px] p-0 bg-white border border-earth/10 shadow-dropdown rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-earth/8">
          <h3 className="font-display font-semibold text-earth text-sm">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => marquerToutLu.mutate()}
              disabled={marquerToutLu.isPending}
              className="inline-flex items-center gap-1 text-ocean text-xs font-semibold font-body hover:underline disabled:opacity-50"
            >
              <Check className="w-3 h-3" strokeWidth={2.25} />
              Tout marquer lu
            </button>
          )}
        </div>

        {/* Liste */}
        {top5.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="w-8 h-8 text-earth-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="font-body text-earth-500 text-xs">
              Aucune notification
            </p>
          </div>
        ) : (
          <ul className="max-h-[400px] overflow-y-auto divide-y divide-earth/5">
            {top5.map((n) => (
              <li key={n.id} className="px-4 py-3 hover:bg-sand-100/60">
                <div className="flex items-start gap-2">
                  {!(n.lu ?? n.estLue) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-terra mt-1.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'font-body text-xs leading-snug mb-1',
                        (n.lu ?? n.estLue) ? 'text-earth-700' : 'text-earth font-medium'
                      )}
                    >
                      {n.message}
                    </p>
                    <p className="font-mono text-[10px] text-earth-500">
                      {formatRelative(n.date ?? n.dateCreation ?? '')}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <div className="border-t border-earth/8 px-4 py-2.5 bg-sand-50">
          <Link
            to="/notifications"
            className="block text-center font-body font-semibold text-ocean text-sm hover:underline"
          >
            Voir toutes les notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const sec = (now - d.getTime()) / 1000
  if (sec < 60) return 'À l\'instant'
  if (sec < 3600) return `il y a ${Math.floor(sec / 60)} min`
  if (sec < 86_400) return `il y a ${Math.floor(sec / 3600)} h`
  if (sec < 7 * 86_400) return `il y a ${Math.floor(sec / 86_400)} j`
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(d)
}
