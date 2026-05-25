import { Building2, TrendingUp, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useCountUp } from '@/lib/hooks/useCountUp'

type Stat = {
  target: number
  prefix?: string
  suffix?: string
  label: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

const STATS: Stat[] = [
  {
    target: 120,
    prefix: '+',
    label: 'Investisseurs actifs',
    icon: Users,
    iconBg: 'bg-ocean/10',
    iconColor: 'text-ocean',
  },
  {
    target: 35,
    prefix: '+',
    label: 'Biens financés',
    icon: Building2,
    iconBg: 'bg-terra/10',
    iconColor: 'text-terra',
  },
  {
    target: 18,
    prefix: '+',
    suffix: 'M FCFA',
    label: 'Distribués',
    icon: TrendingUp,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
]

export function Stats() {
  return (
    <section className="bg-sand-50 py-16 sm:py-20 relative overflow-hidden">
      {/* Subtle deco */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 w-96 h-96 bg-terra/5 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -left-32 w-96 h-96 bg-ocean/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center mb-10 sm:mb-12">
          <p className="font-body text-xs uppercase tracking-widest text-terra font-semibold mb-2">
            La plateforme en chiffres
          </p>
          <h2 className="font-display font-bold text-earth text-2xl sm:text-3xl lg:text-4xl">
            Une communauté en pleine croissance
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {STATS.map((s) => (
            <StatCardAnimated key={s.label} stat={s} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatCardAnimated({ stat }: { stat: Stat }) {
  const [value, ref] = useCountUp({ target: stat.target })
  const Icon = stat.icon

  return (
    <div
      ref={ref}
      className="bg-white rounded-xl border border-earth/8 p-6 sm:p-7 shadow-card hover:shadow-card-hover transition-shadow text-center group"
    >
      <div
        className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className={`w-5 h-5 ${stat.iconColor}`} strokeWidth={1.75} />
      </div>
      <div className="font-display font-bold text-earth text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-2 tabular-nums">
        {stat.prefix}
        {Math.round(value).toLocaleString('fr-FR')}
        {stat.suffix && (
          <span className="text-base sm:text-lg align-top ml-1 text-earth-500 font-semibold">
            {stat.suffix}
          </span>
        )}
      </div>
      <p className="font-body text-earth-600 text-sm sm:text-base font-medium">
        {stat.label}
      </p>
    </div>
  )
}
