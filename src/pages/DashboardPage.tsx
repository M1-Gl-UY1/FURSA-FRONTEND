import { Link } from 'react-router-dom'
import {
  Wallet,
  Coins,
  TrendingUp,
  PiggyBank,
  ArrowRight,
  Bell,
  Compass,
} from 'lucide-react'

import { Money } from '@/components/shared/Money'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboard } from '@/lib/api/dashboard'
import { useMesNotifications } from '@/lib/api/notifications'
import { useMesPossessions } from '@/lib/api/portefeuille'
import { useAuth } from '@/lib/auth/AuthContext'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: dashboard, isLoading: loadingDash } = useDashboard()
  const { data: possessions, isLoading: loadingPoss } = useMesPossessions()
  const { data: notifs, isLoading: loadingNotifs } = useMesNotifications({ pollMs: 30_000 })

  const topPossessions = possessions?.slice(0, 5) ?? []
  const topNotifs = notifs?.slice(0, 4) ?? []

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome */}
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Bienvenue, {user?.prenom ?? 'investisseur'}
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Voici un résumé de votre activité d'investissement.
        </p>
      </header>

      {/* KPIs */}
      <section
        aria-label="Indicateurs clés"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {loadingDash ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-sand-300" />
          ))
        ) : (
          <>
            <StatCard
              label="Valeur portefeuille"
              value={<Money amount={dashboard?.valeurPortefeuille} mono={false} />}
              icon={Wallet}
              iconBg="bg-terra/10"
              iconColor="text-terra"
            />
            <StatCard
              label="Total investi"
              value={<Money amount={dashboard?.totalInvesti} mono={false} />}
              icon={PiggyBank}
              iconBg="bg-ocean/10"
              iconColor="text-ocean"
            />
            <StatCard
              label="Dividendes reçus"
              value={<Money amount={dashboard?.totalDividendes} mono={false} />}
              icon={Coins}
              iconBg="bg-gold/15"
              iconColor="text-gold-600"
            />
            <StatCard
              label="Revenus annuels prév."
              value={<Money amount={dashboard?.revenusAnnuelsPrevisionnels} mono={false} />}
              icon={TrendingUp}
              iconBg="bg-success/10"
              iconColor="text-success"
            />
          </>
        )}
      </section>

      {/* 2 colonnes : possessions + notifs */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top possessions */}
        <div className="lg:col-span-2 bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-earth text-lg">
                Mes possessions
              </h2>
              <p className="font-body text-earth-500 text-xs mt-0.5">
                Vos parts par propriété
              </p>
            </div>
            {possessions && possessions.length > 0 && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/portefeuille">
                  Voir tout
                  <ArrowRight strokeWidth={2} />
                </Link>
              </Button>
            )}
          </div>

          {loadingPoss ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg bg-sand-300" />
              ))}
            </div>
          ) : topPossessions.length === 0 ? (
            <div className="text-center py-8">
              <Compass className="w-10 h-10 text-earth-400 mx-auto mb-3" strokeWidth={1.5} />
              <p className="font-body text-earth-600 text-sm mb-4">
                Vous n'avez encore aucune part.
              </p>
              <Button asChild size="sm">
                <Link to="/opportunites">Découvrir les opportunités</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {topPossessions.map((p) => (
                <li
                  key={p.id}
                  className="bg-white rounded-lg border border-earth/8 p-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-earth text-sm truncate">
                      {p.proprieteNom}
                    </p>
                    <p className="font-body text-earth-500 text-xs truncate">{p.localisation}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-semibold text-earth text-sm">
                      <Money amount={p.valeurTotale} mono={false} />
                    </p>
                    <p className="font-mono text-earth-500 text-xs tabular-nums">
                      {p.nombreDeParts.toLocaleString('fr-FR')} parts
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-earth text-lg">
              Notifications
            </h2>
            {dashboard && dashboard.notificationsNonLues > 0 && (
              <span className="bg-terra text-white text-[10px] font-mono font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                {dashboard.notificationsNonLues}
              </span>
            )}
          </div>

          {loadingNotifs ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg bg-sand-300" />
              ))}
            </div>
          ) : topNotifs.length === 0 ? (
            <div className="text-center py-6">
              <Bell className="w-8 h-8 text-earth-400 mx-auto mb-2" strokeWidth={1.5} />
              <p className="font-body text-earth-500 text-xs">
                Aucune notification
              </p>
            </div>
          ) : (
            <>
              <ul className="space-y-2.5 mb-4">
                {topNotifs.map((n) => (
                  <li
                    key={n.id}
                    className={
                      (n.lu ?? n.estLue)
                        ? 'p-3 rounded-md bg-white border border-earth/5'
                        : 'p-3 rounded-md bg-white border border-terra/30 relative'
                    }
                  >
                    {!(n.lu ?? n.estLue) && (
                      <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-terra" />
                    )}
                    <p className="font-body text-earth text-xs leading-snug pr-3">
                      {n.message}
                    </p>
                    <p className="font-mono text-[10px] text-earth-500 mt-1">
                      {formatRelativeDate(n.date ?? n.dateCreation ?? '')}
                    </p>
                  </li>
                ))}
              </ul>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link to="/notifications">Voir toutes les notifications</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Quick stats secondaire */}
      {dashboard && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <MiniStat label="Propriétés détenues" value={dashboard.nombreProprietes} />
          <MiniStat label="Total parts" value={dashboard.totalParts.toLocaleString('fr-FR')} />
          <MiniStat label="Annonces ouvertes" value={dashboard.annoncesOuvertes} />
          <MiniStat label="Notifs non lues" value={dashboard.notificationsNonLues} />
        </section>
      )}

      {/* Bandeau d'incitation si peu d'investissements */}
      {dashboard && dashboard.nombreProprietes === 0 && (
        <div className="bg-gradient-to-br from-terra to-terra-700 rounded-xl p-6 sm:p-8 text-white">
          <h3 className="font-display font-bold text-xl sm:text-2xl mb-2">
            Commencez à investir dès aujourd'hui
          </h3>
          <p className="font-body text-white/90 text-sm mb-5 max-w-lg">
            Découvrez nos opportunités sélectionnées en Afrique avec des
            rendements attractifs et une transparence totale.
          </p>
          <Button asChild variant="secondary" className="bg-white text-terra hover:bg-sand-50">
            <Link to="/opportunites">
              Voir les opportunités
              <ArrowRight strokeWidth={2} />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-sand-100 rounded-lg border border-earth/5 px-4 py-3">
      <p className="font-body text-[11px] text-earth-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="font-mono font-bold text-earth text-lg sm:text-xl tabular-nums">
        {value}
      </p>
    </div>
  )
}

// --- Helpers ---

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diffSec = (now - d.getTime()) / 1000
  if (diffSec < 60) return 'À l\'instant'
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`
  if (diffSec < 86_400) return `il y a ${Math.floor(diffSec / 3600)} h`
  if (diffSec < 7 * 86_400) return `il y a ${Math.floor(diffSec / 86_400)} j`
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(d)
}
