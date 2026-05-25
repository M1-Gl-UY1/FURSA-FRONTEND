import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  Coins,
  TrendingUp,
  PiggyBank,
  ArrowRight,
  Bell,
  Compass,
  CalendarClock,
  Flame,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Money } from '@/components/shared/Money'
import { PropertyCatalogCard } from '@/components/properties/PropertyCatalogCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboard } from '@/lib/api/dashboard'
import { useMesNotifications } from '@/lib/api/notifications'
import { useMesPossessions } from '@/lib/api/portefeuille'
import { calculatePourcentageVendu, useProprietes } from '@/lib/api/proprietes'
import { useCountUp } from '@/lib/hooks/useCountUp'
import { useAuth } from '@/lib/auth/AuthContext'
import type { ProprieteResponse } from '@/lib/api/types'

const PLACEHOLDER_IMAGE = '/images/villa-falaise.jpg'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: dashboard, isLoading: loadingDash } = useDashboard()
  const { data: possessions, isLoading: loadingPoss } = useMesPossessions()
  const { data: notifs, isLoading: loadingNotifs } = useMesNotifications({ pollMs: 30_000 })
  const { data: proprietes } = useProprietes()

  const topPossessions = possessions?.slice(0, 5) ?? []
  const topNotifs = notifs?.slice(0, 4) ?? []
  const hasInvestments = (dashboard?.nombreProprietes ?? 0) > 0

  // 3 biens en tendance pour la section "Recommandé pour vous"
  const recommandations = useMemo(() => {
    if (!proprietes) return []
    const investiIds = new Set((possessions ?? []).map((p) => p.proprieteId).filter(Boolean))
    return proprietes
      .filter((p) => p.statut === 'PUBLIEE' && !investiIds.has(p.id))
      .map((p) => ({ p, pct: calculatePourcentageVendu(p) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3)
      .map(({ p }) => p)
  }, [proprietes, possessions])

  const prochainDividende = getProchainTrimestre()

  // Lookup propriete par id pour enrichir les possessions
  const proprieteById = useMemo(() => {
    const map = new Map<number, ProprieteResponse>()
    ;(proprietes ?? []).forEach((p) => map.set(p.id, p))
    return map
  }, [proprietes])

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome hero */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-earth via-earth-600 to-earth-700 p-6 sm:p-8">
        {/* Halos */}
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-20 w-72 h-72 bg-terra/20 rounded-full blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -left-20 w-72 h-72 bg-ocean/15 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-center">
          <div>
            <p className="font-body text-xs uppercase tracking-widest text-gold-300 font-semibold mb-2">
              Tableau de bord
            </p>
            <h1 className="font-display font-bold text-white text-2xl sm:text-3xl lg:text-4xl mb-2">
              Bienvenue, {user?.prenom ?? 'investisseur'}
            </h1>
            <p className="font-body text-white/80 text-sm sm:text-base">
              {hasInvestments
                ? `Vous détenez des parts dans ${dashboard?.nombreProprietes} propriété${(dashboard?.nombreProprietes ?? 0) > 1 ? 's' : ''}.`
                : "Découvrez nos opportunités sélectionnées pour démarrer votre portefeuille."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
            <Button asChild variant="secondary" className="bg-white text-earth hover:bg-sand-50">
              <Link to="/opportunites">
                <Compass className="w-4 h-4" strokeWidth={1.75} />
                Opportunités
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/10">
              <Link to="/wallet">
                <Wallet className="w-4 h-4" strokeWidth={1.75} />
                Mon wallet
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* KPIs animés */}
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
            <KpiAnimated
              label="Valeur portefeuille"
              target={dashboard?.valeurPortefeuille ?? 0}
              icon={Wallet}
              iconBg="bg-terra/10"
              iconColor="text-terra"
            />
            <KpiAnimated
              label="Total investi"
              target={dashboard?.totalInvesti ?? 0}
              icon={PiggyBank}
              iconBg="bg-ocean/10"
              iconColor="text-ocean"
            />
            <KpiAnimated
              label="Dividendes reçus"
              target={dashboard?.totalDividendes ?? 0}
              icon={Coins}
              iconBg="bg-gold/15"
              iconColor="text-gold-600"
            />
            <KpiAnimated
              label="Revenus annuels prév."
              target={dashboard?.revenusAnnuelsPrevisionnels ?? 0}
              icon={TrendingUp}
              iconBg="bg-success/10"
              iconColor="text-success"
            />
          </>
        )}
      </section>

      {/* Prochain dividende trimestriel + Mini stats */}
      {hasInvestments && (
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 lg:gap-5">
          <div className="bg-gradient-to-br from-success/10 to-ocean/10 border border-success/15 rounded-xl p-5 sm:p-6 flex items-center gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-card flex items-center justify-center shrink-0">
              <CalendarClock className="w-7 h-7 text-success" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-xs uppercase tracking-widest text-success font-semibold mb-1">
                Prochain dividende trimestriel
              </p>
              <p className="font-display font-bold text-earth text-lg sm:text-xl mb-1">
                {prochainDividende.label}
              </p>
              <p className="font-body text-earth-600 text-sm">
                Distribution automatique sur votre wallet · {prochainDividende.jours} jour
                {prochainDividende.jours > 1 ? 's' : ''} restant
                {prochainDividende.jours > 1 ? 's' : ''}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/dividendes">
                Historique
                <ArrowRight strokeWidth={2} />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:min-w-[200px]">
            <MiniStat
              label="Propriétés"
              value={(dashboard?.nombreProprietes ?? 0).toString()}
            />
            <MiniStat
              label="Total parts"
              value={(dashboard?.totalParts ?? 0).toLocaleString('fr-FR')}
            />
          </div>
        </section>
      )}

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
                <Skeleton key={i} className="h-20 rounded-lg bg-sand-300" />
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
              {topPossessions.map((p) => {
                const prop = p.proprieteId ? proprieteById.get(p.proprieteId) : undefined
                const image = prop?.photos?.[0] ?? PLACEHOLDER_IMAGE
                const partsTotales =
                  prop?.nombreTotalPart ?? prop?.partsTotales ?? 0
                const pctOwned =
                  partsTotales > 0 ? ((p.nombreDeParts ?? 0) / partsTotales) * 100 : 0
                return (
                  <li key={p.id}>
                    <Link
                      to={p.proprieteId ? `/opportunites/${p.proprieteId}` : '/portefeuille'}
                      className="flex items-center gap-4 bg-white rounded-lg border border-earth/8 p-3 hover:shadow-card-hover transition-all"
                    >
                      <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-sand-300">
                        <img
                          src={image}
                          alt={p.proprieteNom}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-semibold text-earth text-sm truncate">
                          {p.proprieteNom}
                        </p>
                        <p className="font-body text-earth-500 text-xs truncate">
                          {p.localisation}
                        </p>
                        <p className="font-mono text-[11px] text-earth-500 mt-0.5 tabular-nums">
                          {(p.nombreDeParts ?? 0).toLocaleString('fr-FR')} parts
                          {pctOwned > 0 && (
                            <span className="text-terra font-semibold">
                              {' '}· {pctOwned.toFixed(1)}% détenu
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-earth text-base">
                          <Money amount={p.valeurTotale} mono={false} />
                        </p>
                        {p.rentabilitePrevue != null && (
                          <p className="font-mono text-success text-[11px] font-semibold inline-flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" strokeWidth={2.25} />
                            {p.rentabilitePrevue}%/an
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
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

      {/* Section "Recommandé pour vous" */}
      {recommandations.length > 0 && (
        <section>
          <header className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-earth text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-terra" strokeWidth={1.75} />
                Recommandé pour vous
              </h2>
              <p className="font-body text-earth-500 text-xs mt-0.5">
                Biens en tendance que vous n'avez pas encore
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/opportunites">
                Tout voir
                <ArrowRight strokeWidth={2} />
              </Link>
            </Button>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {recommandations.map((p) => (
              <PropertyCatalogCard key={p.id} propriete={p} />
            ))}
          </div>
        </section>
      )}

      {/* Bandeau d'incitation si peu d'investissements */}
      {dashboard && !hasInvestments && (
        <div className="bg-gradient-to-br from-terra to-terra-700 rounded-xl p-6 sm:p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-white" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-xl sm:text-2xl mb-2">
                Commencez à investir dès aujourd'hui
              </h3>
              <p className="font-body text-white/90 text-sm mb-5 max-w-lg">
                Découvrez nos opportunités sélectionnées en Afrique avec des
                rendements attractifs, des dividendes trimestriels et une transparence
                totale.
              </p>
              <Button asChild variant="secondary" className="bg-white text-terra hover:bg-sand-50">
                <Link to="/opportunites">
                  Voir les opportunités
                  <ArrowRight strokeWidth={2} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

type KpiAnimatedProps = {
  label: string
  target: number
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

function KpiAnimated({ label, target, icon: Icon, iconBg, iconColor }: KpiAnimatedProps) {
  const [value, ref] = useCountUp({ target })
  return (
    <div
      ref={ref}
      className="bg-white rounded-xl border border-earth/8 shadow-card hover:shadow-card-hover p-5 transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="font-body text-xs text-earth-500 uppercase tracking-wide font-semibold">
          {label}
        </p>
        <div
          className={`w-9 h-9 rounded-md flex items-center justify-center ${iconBg}`}
        >
          <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.75} />
        </div>
      </div>
      <p className="font-mono font-bold text-earth text-2xl sm:text-3xl tracking-tight tabular-nums">
        <Money amount={value} mono={false} />
      </p>
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

// =============================================================================
// Helpers
// =============================================================================

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diffSec = (now - d.getTime()) / 1000
  if (diffSec < 60) return "À l'instant"
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`
  if (diffSec < 86_400) return `il y a ${Math.floor(diffSec / 3600)} h`
  if (diffSec < 7 * 86_400) return `il y a ${Math.floor(diffSec / 86_400)} j`
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(d)
}

/** Calcule la prochaine date de distribution trimestrielle (31/03, 30/06, 30/09, 31/12). */
function getProchainTrimestre(): { label: string; jours: number } {
  const now = new Date()
  const year = now.getFullYear()
  // Fins de trimestre (mois 0-indexés)
  const quarters = [
    new Date(year, 2, 31),
    new Date(year, 5, 30),
    new Date(year, 8, 30),
    new Date(year, 11, 31),
    new Date(year + 1, 2, 31),
  ]
  const next = quarters.find((q) => q.getTime() > now.getTime()) ?? quarters[0]
  const jours = Math.max(0, Math.ceil((next.getTime() - now.getTime()) / 86_400_000))
  const label = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(next)
  return { label, jours }
}
