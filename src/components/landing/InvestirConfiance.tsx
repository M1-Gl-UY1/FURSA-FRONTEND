import { ShieldCheck, FileText, Lock, Eye, Scale, BadgeCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Guarantee = {
  icon: LucideIcon
  titleKey: string
  descKey: string
}

const GUARANTEES: Guarantee[] = [
  { icon: BadgeCheck, titleKey: 'confiance.certified_title', descKey: 'confiance.certified_desc' },
  { icon: FileText, titleKey: 'confiance.legal_title', descKey: 'confiance.legal_desc' },
  { icon: Lock, titleKey: 'confiance.secure_title', descKey: 'confiance.secure_desc' },
  { icon: Eye, titleKey: 'confiance.transparency_title', descKey: 'confiance.transparency_desc' },
  { icon: Scale, titleKey: 'confiance.compliance_title', descKey: 'confiance.compliance_desc' },
  { icon: ShieldCheck, titleKey: 'confiance.refund_title', descKey: 'confiance.refund_desc' },
]

export function InvestirConfiance() {
  const { t } = useTranslation()

  return (
    <section className="bg-sand-100 py-16 sm:py-20 lg:py-24">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <p className="font-body text-xs uppercase tracking-widest text-terra font-semibold mb-3 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
            {t('confiance.eyebrow')}
          </p>
          <h2 className="font-display font-bold text-earth text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
            {t('confiance.title')}
          </h2>
          <p className="font-body text-earth-600 text-base sm:text-lg leading-relaxed">
            {t('confiance.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {GUARANTEES.map((g) => {
            const Icon = g.icon
            return (
              <div
                key={g.titleKey}
                className="group relative rounded-xl border border-earth/8 bg-white p-5 sm:p-6 hover:shadow-card-hover hover:border-terra/20 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-terra/10 flex items-center justify-center group-hover:bg-terra/20 transition-colors">
                    <Icon className="w-5 h-5 text-terra" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-earth text-base sm:text-lg mb-1.5">
                      {t(g.titleKey)}
                    </h3>
                    <p className="font-body text-earth-600 text-sm leading-relaxed">
                      {t(g.descKey)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
