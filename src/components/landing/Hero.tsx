import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section
      id="accueil"
      className="relative min-h-[640px] sm:min-h-[700px] lg:min-h-[760px] flex items-end overflow-hidden"
    >
      {/* Background image avec effet Ken Burns (zoom + pan lent) */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/images/hero-zanzibar.jpg"
          alt="Villas paillote en bord de mer à Zanzibar avec dhow traditionnel"
          className="absolute inset-0 w-full h-full object-cover object-[center_28%] animate-ken-burns will-change-transform"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      {/* Overlay gradient sombre pour lisibilité — plus prononcé en bas */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-earth/40 via-earth/15 to-earth/85"
      />

      {/* Halo terra subtil bottom-left pour chaleur */}
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -left-20 w-96 h-96 bg-terra/20 rounded-full blur-3xl pointer-events-none"
      />

      {/* Content avec animations d'entrée */}
      <div className="relative w-full max-w-container mx-auto px-5 sm:px-6 lg:px-10 pb-14 sm:pb-20 lg:pb-24 pt-28 sm:pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          {/* Titre principal */}
          <div className="lg:col-span-7 opacity-0 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {/* Badge accroche */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-4 py-1.5 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-gold-300" strokeWidth={2} />
              <span className="font-body text-white/95 text-xs font-semibold uppercase tracking-wider">
                Immobilier fractionné · Zanzibar
              </span>
            </div>
            <h1 className="font-display font-bold text-white leading-[1.05] tracking-tight text-3xl sm:text-5xl lg:text-6xl xl:text-7xl">
              Investissez dans
              <br />
              le paradis,
              <br />
              <span className="text-gold-300">part par part.</span>
            </h1>
          </div>

          {/* Baseline + CTAs */}
          <div
            className="lg:col-span-5 flex flex-col gap-5 sm:gap-6 lg:items-end opacity-0 animate-fade-up"
            style={{ animationDelay: '0.4s' }}
          >
            <p className="text-white/90 font-body text-base sm:text-lg leading-relaxed max-w-md lg:text-right">
              Achetez des parts de villas, appartements et penthouses
              vérifiés en Afrique. Recevez vos revenus locatifs trimestriels.
              Revendez quand vous voulez.
            </p>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-terra text-white font-body font-semibold text-sm px-6 py-3.5 hover:bg-terra-600 hover:scale-[1.03] transition-all duration-200 shadow-brand hover:shadow-brand-hover"
              >
                Commencer à investir
                <ArrowRight
                  className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                  strokeWidth={2.25}
                />
              </Link>
              <Link
                to="/register?redirect=%2Fproposer-un-bien"
                className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/35 font-body font-semibold text-sm px-6 py-3.5 backdrop-blur-sm transition-colors duration-200"
              >
                Proposer un bien
              </Link>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div
          className="mt-10 sm:mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 opacity-0 animate-fade-up"
          style={{ animationDelay: '0.7s' }}
        >
          <span className="font-body text-white/85 text-xs sm:text-sm font-medium">
            ✓ Biens certifiés
          </span>
          <span className="font-body text-white/85 text-xs sm:text-sm font-medium">
            ✓ Revenus trimestriels
          </span>
          <span className="font-body text-white/85 text-xs sm:text-sm font-medium">
            ✓ Revendez à tout moment
          </span>
          <span className="font-body text-white/85 text-xs sm:text-sm font-medium">
            ✓ KYC sécurisé
          </span>
        </div>
      </div>
    </section>
  )
}
