import { Link, NavLink } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowUpFromLine,
  Bell,
  Coins,
  DollarSign,
  FileText,
  HandCoins,
  IdCard,
  LayoutDashboard,
  LogOut,
  Building2,
  Lock,
  ShoppingCart,
  Sparkles,
  Users,
  Banknote,
  Camera,
  Radio,
  Settings,
  TrendingUp,
  WalletCards,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useAuth } from '@/lib/auth/AuthContext'
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

const groups: NavGroup[] = [
  {
    label: 'Vue d\'ensemble',
    items: [
      { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    // V2 KK (12/06/2026) : nouveau bloc — pages investisseur en lecture seule
    // (catalogue public). Les boutons d'action sont caches dans ces pages
    // quand le user est admin.
    label: 'Vue catalogue',
    items: [
      { label: 'Opportunités', to: '/opportunites', icon: Sparkles },
      { label: 'Marché secondaire', to: '/marche/secondaire', icon: ShoppingCart },
      { label: 'Notifications', to: '/notifications', icon: Bell },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { label: 'Propriétés', to: '/admin/proprietes', icon: Building2 },
      { label: 'Revenus', to: '/admin/revenus', icon: Banknote },
      { label: 'Utilisateurs', to: '/admin/utilisateurs', icon: Users },
      { label: 'Wallets', to: '/admin/wallets', icon: WalletCards },
      { label: 'Vérifications identité', to: '/admin/kyc', icon: IdCard },
    ],
  },
  {
    label: 'Audit',
    items: [
      { label: 'Escrows', to: '/admin/escrows', icon: Lock },
      { label: 'Retraits', to: '/admin/retraits', icon: ArrowUpFromLine },
      { label: 'Transactions', to: '/admin/transactions', icon: ArrowLeftRight },
      { label: 'Taux change', to: '/admin/devise-rate', icon: DollarSign },
      { label: 'Distribution', to: '/admin/distribution', icon: HandCoins },
      { label: 'Dividendes', to: '/admin/dividendes', icon: Coins },
      { label: 'Audit on-chain', to: '/admin/audit-onchain', icon: Radio },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Modèle de prix', to: '/admin/prix-parts/explication', icon: TrendingUp },
      { label: 'Types de bien', to: '/admin/types-bien', icon: Building2 },
      { label: 'Équipements', to: '/admin/equipements', icon: Wrench },
      { label: 'Catégories doc.', to: '/admin/categories-document', icon: FileText },
      { label: 'Sections photo', to: '/admin/sections-photo', icon: Camera },
      { label: 'Paramètres', to: '/admin/settings', icon: Settings },
    ],
  },
]

type AdminSidebarProps = {
  onNavigate?: () => void
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const { user, logout } = useAuth()

  return (
    <aside className="h-full flex flex-col bg-earth border-r border-white/8">
      {/* Logo */}
      <Link
        to="/admin/dashboard"
        onClick={onNavigate}
        aria-label="Fursa Admin"
        className="h-[72px] flex items-center px-6 border-b border-white/8"
      >
        <img src="/images/logo-fursa.png" alt="Fursa" className="h-9 w-auto" />
        <span className="ml-3 px-2 py-0.5 rounded-md bg-terra/20 text-terra text-[10px] font-mono font-bold uppercase tracking-wider">
          Admin
        </span>
      </Link>

      {/* Nav scrollable */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 font-body text-[11px] font-semibold uppercase tracking-wider text-white/40">
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
                            ? 'bg-terra/20 text-terra'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
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
      </nav>

      {/* Footer */}
      <div className="border-t border-white/8 p-3">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-body text-white/60 hover:text-white hover:bg-white/5 transition-colors mb-2"
        >
          ← Retour à l'espace investisseur
        </Link>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-terra/20 flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-terra text-sm">
              {(user?.prenom?.[0] ?? user?.email?.[0] ?? 'A').toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body font-semibold text-white text-sm truncate">
              {user?.prenom} {user?.nom}
            </p>
            <p className="font-body text-white/50 text-xs truncate">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Se déconnecter"
            className="w-9 h-9 rounded-md flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  )
}
