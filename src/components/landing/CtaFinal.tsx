import { Link } from 'react-router-dom'
import { ArrowRight, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function CtaFinal() {
  const { t } = useTranslation()

  return (
    <section id="commencer" className="bg-sand-50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display font-bold text-earth text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
            {t('cta_final.title')}
          </h2>
          <p className="font-body text-earth-600 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            {t('cta_final.subtitle')}
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <Link
              to="/opportunites"
              className="group inline-flex items-center gap-2 rounded-full bg-terra hover:bg-terra-600 text-white font-body font-semibold text-sm px-6 py-3 shadow-brand hover:shadow-brand-hover transition-all duration-200"
            >
              {t('cta_final.primary')}
              <ArrowRight
                className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                strokeWidth={2.25}
              />
            </Link>
            <a
              href="/fursa-investor-deck.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-transparent hover:bg-earth/5 text-earth border-[1.5px] border-earth font-body font-semibold text-sm px-6 py-3 transition-colors duration-200"
            >
              <Download className="w-4 h-4" strokeWidth={2} />
              {t('cta_final.secondary')}
            </a>
          </div>

          <p className="font-display italic text-earth-600 text-base sm:text-lg tracking-tight">
            {t('cta_final.tagline')}
          </p>
        </div>
      </div>
    </section>
  )
}
