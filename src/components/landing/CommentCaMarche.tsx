import { Link } from 'react-router-dom'
import { Search, Wallet, ShieldCheck, TrendingUp, DoorOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Step = {
  labelKey: string
  titleKey: string
  descKey: string
  highlightKey: string
  icon: LucideIcon
}

/**
 * Les 5 etapes reprises du pitch officiel FURSA Community (page 5-6) :
 * Browse / Invest / Own / Earn / Exit.
 */
const STEPS: Step[] = [
  {
    labelKey: 'how.browse_label',
    titleKey: 'how.browse_title',
    descKey: 'how.browse_desc',
    highlightKey: 'how.browse_highlight',
    icon: Search,
  },
  {
    labelKey: 'how.invest_label',
    titleKey: 'how.invest_title',
    descKey: 'how.invest_desc',
    highlightKey: 'how.invest_highlight',
    icon: Wallet,
  },
  {
    labelKey: 'how.own_label',
    titleKey: 'how.own_title',
    descKey: 'how.own_desc',
    highlightKey: 'how.own_highlight',
    icon: ShieldCheck,
  },
  {
    labelKey: 'how.earn_label',
    titleKey: 'how.earn_title',
    descKey: 'how.earn_desc',
    highlightKey: 'how.earn_highlight',
    icon: TrendingUp,
  },
  {
    labelKey: 'how.exit_label',
    titleKey: 'how.exit_title',
    descKey: 'how.exit_desc',
    highlightKey: 'how.exit_highlight',
    icon: DoorOpen,
  },
]

export function CommentCaMarche() {
  const { t } = useTranslation()

  return (
    <section id="comment-ca-marche" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <p className="font-body text-xs uppercase tracking-widest text-terra font-semibold mb-3">
            {t('how.eyebrow')}
          </p>
          <h2 className="font-display font-bold text-earth text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
            {t('how.title')}
          </h2>
          <p className="font-body text-earth-600 text-base sm:text-lg leading-relaxed">
            {t('how.subtitle')}
          </p>
        </div>

        {/* Timeline desktop (5 etapes horizontal) */}
        <div className="hidden md:block relative max-w-6xl mx-auto">
          <div
            aria-hidden="true"
            className="absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-terra/0 via-terra/30 to-terra/0"
          />

          <div className="relative grid grid-cols-5 gap-4">
            {STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.titleKey} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 w-16 h-16 rounded-full bg-white border-2 border-terra flex items-center justify-center shadow-card mb-5">
                    <Icon className="w-6 h-6 text-terra" strokeWidth={1.75} />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-terra mb-2 uppercase tracking-wider">
                    {t(step.labelKey)}
                  </span>
                  <h3 className="font-display font-bold text-earth text-base mb-2">
                    {t(step.titleKey)}
                  </h3>
                  <p className="font-body text-earth-600 text-xs leading-relaxed mb-3">
                    {t(step.descKey)}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-terra/10 font-body text-[10px] font-semibold text-terra">
                    {t(step.highlightKey)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Timeline mobile (vertical) */}
        <div className="md:hidden relative max-w-md mx-auto">
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-8 w-0.5 bg-gradient-to-b from-terra/0 via-terra/30 to-terra/0"
          />
          <div className="space-y-8">
            {STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.titleKey} className="relative flex gap-5">
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-full bg-white border-2 border-terra flex items-center justify-center shadow-card">
                    <Icon className="w-6 h-6 text-terra" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 pt-1">
                    <span className="font-mono text-xs font-bold text-terra block mb-1 uppercase tracking-wider">
                      {t(step.labelKey)}
                    </span>
                    <h3 className="font-display font-bold text-earth text-lg mb-2">
                      {t(step.titleKey)}
                    </h3>
                    <p className="font-body text-earth-600 text-sm leading-relaxed mb-2">
                      {t(step.descKey)}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-terra/10 font-body text-[11px] font-semibold text-terra">
                      {t(step.highlightKey)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA final */}
        <div className="mt-14 sm:mt-16 text-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-full bg-terra hover:bg-terra-600 text-white font-display font-semibold text-sm sm:text-base px-7 py-3.5 shadow-brand hover:shadow-brand-hover transition-all duration-200"
          >
            {t('how.cta')}
          </Link>
          <p className="mt-3 font-body text-earth-500 text-xs">
            {t('how.cta_sub')}
          </p>
        </div>
      </div>
    </section>
  )
}
