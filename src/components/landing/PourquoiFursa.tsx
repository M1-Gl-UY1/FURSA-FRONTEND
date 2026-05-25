import { Coins, House, CalendarClock, ArrowRightLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Pillar = {
  icon: LucideIcon
  titleKey: string
  descKey: string
}

/**
 * Les 4 pillars repris du pitch officiel FURSA Community (page 4-5) :
 * Low Entry Point / Hands-Off Ownership / Monthly Income / Flexible Exit.
 *
 * Note : "Monthly Income" du pitch a ete adapte en "Quarterly Income"
 * (decision Hugh reunion 22/05/2026).
 */
const PILLARS: Pillar[] = [
  { icon: Coins, titleKey: 'why.low_entry_title', descKey: 'why.low_entry_desc' },
  { icon: House, titleKey: 'why.hands_off_title', descKey: 'why.hands_off_desc' },
  { icon: CalendarClock, titleKey: 'why.quarterly_title', descKey: 'why.quarterly_desc' },
  { icon: ArrowRightLeft, titleKey: 'why.exit_title', descKey: 'why.exit_desc' },
]

export function PourquoiFursa() {
  const { t } = useTranslation()

  return (
    <section id="pourquoi" className="bg-earth py-16 sm:py-20 lg:py-24 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 w-96 h-96 bg-terra/15 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -left-32 w-96 h-96 bg-ocean/15 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <p className="font-body text-xs uppercase tracking-widest text-gold-300 font-semibold mb-3">
            {t('why.eyebrow')}
          </p>
          <h2 className="font-display font-bold text-white text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-5">
            {t('why.title')}
          </h2>
          <p className="font-body text-white/85 text-base sm:text-lg leading-relaxed">
            {t('why.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {PILLARS.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.titleKey}
                className="group relative rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-terra/20 flex items-center justify-center mb-4 group-hover:bg-terra/30 group-hover:scale-105 transition-all">
                  <Icon className="w-5 h-5 text-terra-300" strokeWidth={1.75} />
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-2">
                  {t(p.titleKey)}
                </h3>
                <p className="font-body text-white/75 text-sm leading-relaxed">
                  {t(p.descKey)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
