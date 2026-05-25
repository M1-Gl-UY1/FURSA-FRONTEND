import { TrendingUp, BarChart3, Building2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useCountUp } from '@/lib/hooks/useCountUp'

type Stat = {
  target: number
  suffix: string
  labelKey: string
  descKey: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

/**
 * Statistiques marche Zanzibar reprises du pitch officiel FURSA Community.
 * Pas de chiffres internes inventes : ce sont des chiffres marche verifiables
 * sur l'industrie touristique et immobiliere de Zanzibar.
 */
const STATS: Stat[] = [
  {
    target: 12,
    suffix: '%',
    labelKey: 'stats.rental_yield',
    descKey: 'stats.rental_yield_desc',
    icon: TrendingUp,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  {
    target: 15,
    suffix: '%',
    labelKey: 'stats.property_growth',
    descKey: 'stats.property_growth_desc',
    icon: BarChart3,
    iconBg: 'bg-terra/10',
    iconColor: 'text-terra',
  },
  {
    target: 95,
    suffix: '%',
    labelKey: 'stats.occupancy_rate',
    descKey: 'stats.occupancy_rate_desc',
    icon: Building2,
    iconBg: 'bg-ocean/10',
    iconColor: 'text-ocean',
  },
]

export function Stats() {
  const { t } = useTranslation()

  return (
    <section className="bg-sand-50 py-16 sm:py-20 lg:py-24 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 w-96 h-96 bg-terra/5 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -left-32 w-96 h-96 bg-ocean/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <p className="font-body text-xs uppercase tracking-widest text-terra font-semibold mb-3">
            {t('stats.eyebrow')}
          </p>
          <h2 className="font-display font-bold text-earth text-2xl sm:text-3xl lg:text-4xl tracking-tight">
            {t('stats.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {STATS.map((s) => (
            <StatCardAnimated key={s.labelKey} stat={s} />
          ))}
        </div>

        <p className="mt-12 text-center font-display font-bold text-earth text-lg sm:text-xl italic tracking-tight">
          {t('stats.tagline')}
        </p>
      </div>
    </section>
  )
}

function StatCardAnimated({ stat }: { stat: Stat }) {
  const { t } = useTranslation()
  const [value, ref] = useCountUp({ target: stat.target })
  const Icon = stat.icon

  return (
    <div
      ref={ref}
      className="bg-white rounded-xl border border-earth/8 p-6 sm:p-7 shadow-card hover:shadow-card-hover transition-shadow group"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className={`w-5 h-5 ${stat.iconColor}`} strokeWidth={1.75} />
        </div>
      </div>
      <div className="font-display font-bold text-earth text-4xl sm:text-5xl tracking-tight mb-2 tabular-nums">
        {Math.round(value).toLocaleString('fr-FR')}
        <span className="text-2xl sm:text-3xl ml-0.5">{stat.suffix}</span>
      </div>
      <p className="font-display font-bold text-earth text-base mb-2">
        {t(stat.labelKey)}
      </p>
      <p className="font-body text-earth-600 text-sm leading-relaxed">
        {t(stat.descKey)}
      </p>
    </div>
  )
}
