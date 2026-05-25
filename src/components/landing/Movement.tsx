import { Quote, Sparkles, Building2, Globe2, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Audience = {
  icon: LucideIcon
  key: string
}

const AUDIENCES: Audience[] = [
  { icon: Sparkles, key: 'movement.tech_savvy' },
  { icon: Building2, key: 'movement.real_estate_pros' },
  { icon: Globe2, key: 'movement.diaspora' },
  { icon: Users, key: 'movement.forward_thinking' },
]

/**
 * Section "Be Part of the Movement" reprise du pitch officiel FURSA Community :
 * - manifesto ("FURSA is not just a platform, it's a movement")
 * - vision generationnelle
 * - audiences cibles (Who we're looking for)
 * - temoignage early member
 *
 * Volontairement immersive et mission-driven pour les grands investisseurs.
 */
export function Movement() {
  const { t } = useTranslation()

  return (
    <section className="bg-gradient-to-br from-earth via-earth-600 to-earth-700 py-16 sm:py-20 lg:py-24 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 w-[28rem] h-[28rem] bg-terra/20 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] bg-gold/10 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        {/* Manifesto */}
        <div className="max-w-3xl mx-auto text-center mb-14 sm:mb-16">
          <p className="font-body text-xs uppercase tracking-widest text-gold-300 font-semibold mb-3">
            {t('movement.eyebrow')}
          </p>
          <h2 className="font-display font-bold text-white text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-6 leading-tight">
            {t('movement.title')}
          </h2>
          <p className="font-body text-white/85 text-base sm:text-lg leading-relaxed mb-6">
            {t('movement.subtitle')}
          </p>
          <div className="inline-block bg-white/5 backdrop-blur-sm border-l-4 border-gold-300 px-6 py-4 rounded-r-md max-w-2xl">
            <p className="font-display italic text-white text-base sm:text-lg leading-relaxed text-left">
              {t('movement.vision')}
            </p>
          </div>
        </div>

        {/* Who we're looking for */}
        <div className="max-w-4xl mx-auto mb-14 sm:mb-16">
          <p className="text-center font-display font-bold text-white text-xl sm:text-2xl mb-8">
            {t('movement.looking_for_title')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AUDIENCES.map((a) => {
              const Icon = a.icon
              return (
                <div
                  key={a.key}
                  className="flex items-center gap-4 bg-white/[0.05] backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-5 hover:bg-white/[0.08] hover:border-white/20 transition-all"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-gold-300/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gold-300" strokeWidth={1.75} />
                  </div>
                  <p className="font-body text-white text-sm sm:text-base font-medium">
                    {t(a.key)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Testimonial */}
        <div className="max-w-3xl mx-auto">
          <figure className="relative bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-10">
            <Quote
              className="absolute -top-4 left-6 w-10 h-10 text-gold-300 bg-earth-700 rounded-full p-2"
              strokeWidth={1.5}
              fill="currentColor"
            />
            <blockquote className="font-display italic text-white text-lg sm:text-xl leading-relaxed mb-4">
              &ldquo;{t('movement.testimonial_quote')}&rdquo;
            </blockquote>
            <figcaption className="font-body text-gold-300 text-sm font-semibold not-italic">
              — {t('movement.testimonial_author')}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
