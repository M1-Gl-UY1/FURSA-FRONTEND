import { Link, NavLink } from 'react-router-dom'
import {
  Home,
  Compass,
  Wallet,
  WalletCards,
  ArrowLeftRight,
  Coins,
  Repeat,
  Building2,
  Plus,
  Bell,
  User,
  LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useAuth } from '@/lib/auth/AuthContext'
import { adminOrigin } from '@/lib/hosts'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const investirGroup: NavGroup = {
  label: 'Investir',
  items: [
    { label: 'Opportunités', to: '/opportunites', icon: Compass },
    { label: 'Marché secondaire', to: '/marche/secondaire', icon: Repeat },
  ],
}

const activiteGroup: NavGroup = {
  label: 'Mon activité',
  items: [
    { label: 'Dashboard', to: '/dashboard', icon: Home, end: true },
    { label: 'Mon wallet', to: '/wallet', icon: WalletCards },
    { label: 'Portefeuille', to: '/portefeuille', icon: Wallet },
    { label: 'Transactions', to: '/transactions', icon: ArrowLeftRight },
    { label: 'Dividendes', to: '/dividendes', icon: Coins },
  ],
}

const proprietaireGroup: NavGroup = {
  label: 'Propriétaire',
  items: [
    { label: 'Mes propriétés', to: '/mes-proprietes', icon: Building2 },
    { label: 'Proposer un bien', to: '/proposer-un-bien', icon: Plus },
  ],
}

const compteGroup: NavGroup = {
  label: 'Compte',
  items: [
    { label: 'Notifications', to: '/notifications', icon: Bell },
    { label: 'Mon profil', to: '/compte', icon: User },
  ],
}

type SidebarProps = {
  /** Si true, le user a au moins 1 propriété proposée → afficher la section Propriétaire */
  hasProprietesProposees?: boolean
  /** Callback quand on clique sur un lien (utile pour fermer le drawer mobile) */
  onNavigate?: () => void
}

export function Sidebar({ hasProprietesProposees = false, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  // Les admins ne peuvent ni acheter ni proposer (conflit d'intérêt)
  // → on masque les sections Investir + Propriétaire pour eux.
  const groups = [
    ...(isAdmin ? [] : [investirGroup]),
    activiteGroup,
    ...(!isAdmin && hasProprietesProposees ? [proprietaireGroup] : []),
    compteGroup,
  ]

  return (
    <aside className="h-full flex flex-col bg-sand-50 border-r border-earth/8">
      {/* Logo */}
      <Link
        to="/dashboard"
        onClick={onNavigate}
        aria-label="Fursa - Tableau de bord"
        className="h-[72px] flex items-center px-6 border-b border-earth/8"
      >
        {/* Logo blanc sur transparent → brightness-0 le rend foncé pour le fond clair de la sidebar */}
        <img
          src="/images/logo-fursa.png"
          alt="Fursa"
          className="h-9 w-auto brightness-0"
        />
      </Link>

      {/* Nav scrollable */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 font-body text-[11px] font-semibold uppercase tracking-wider text-earth-400">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body font-medium transition-colors',
                          isActive
                            ? 'bg-terra/10 text-terra'
                            : 'text-earth-600 hover:bg-earth/5 hover:text-earth'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        {/* Proposer un bien (toujours visible, accroche pour les nouveaux propriétaires)
            — masqué pour les admins (conflit d'intérêt) */}
        {!isAdmin && !hasProprietesProposees && (
          <div>
            <p className="px-3 mb-2 font-body text-[11px] font-semibold uppercase tracking-wider text-earth-400">
              Propriétaire
            </p>
            <ul className="space-y-0.5">
              <li>
                <NavLink
                  to="/proposer-un-bien"
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body font-medium transition-colors',
                      isActive
                        ? 'bg-terra/10 text-terra'
                        : 'text-earth-600 hover:bg-earth/5 hover:text-earth'
                    )
                  }
                >
                  <Plus className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">Proposer un bien</span>
                </NavLink>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* Footer : user + logout */}
      <div className="border-t border-earth/8 p-3">
        {user?.role === 'ADMIN' && (
          // Lien externe : le backoffice est sur un sous-domaine separe (admin.fursa.seed-innov.com).
          // Cf App.tsx pour le routing par hostname.
          <a
            href={adminOrigin() + '/admin/dashboard'}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-body font-semibold text-terra bg-terra/10 hover:bg-terra/15 transition-colors mb-2"
          >
            <span>→ Aller au back-office admin</span>
          </a>
        )}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-terra/15 flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-terra text-sm">
              {(user?.prenom?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body font-semibold text-earth text-sm truncate">
              {user?.prenom} {user?.nom}
            </p>
            <p className="font-body text-earth-500 text-xs truncate">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Se déconnecter"
            className="w-9 h-9 rounded-md flex items-center justify-center text-earth-500 hover:bg-earth/5 hover:text-earth transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  )
}
