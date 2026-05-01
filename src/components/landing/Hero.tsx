import { Link } from 'react-router-dom'

export function Hero() {
  return (
    <section
      id="accueil"
      className="relative min-h-[600px] sm:min-h-[640px] lg:min-h-[680px] flex items-end overflow-hidden"
    >
      {/* Background image — cadrage haut pour mettre en avant les paillotes / dhow */}
      <img
        src="/images/hero-zanzibar.jpg"
        alt="Villas paillote en bord de mer à Zanzibar avec dhow traditionnel"
        className="absolute inset-0 w-full h-full object-cover object-[center_28%]"
        loading="eager"
        fetchPriority="high"
      />

      {/* Dark overlay for legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-earth/45 via-earth/25 to-earth/70"
      />

      {/* Content */}
      <div className="relative w-full max-w-container mx-auto px-5 sm:px-6 lg:px-10 pb-12 sm:pb-16 lg:pb-20 pt-28 sm:pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          {/* Title — left, dans un encadré stylisé */}
          <div className="lg:col-span-7">
            <div className="inline-block rounded-lg border border-white/30 bg-earth/25 backdrop-blur-[2px] px-5 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6 max-w-xl">
              <h1 className="font-display font-bold text-white uppercase leading-[1.08] tracking-tight text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] xl:text-[2.75rem]">
                Investissez dans l'immobilier africain,{' '}
                <span className="text-white/95">où que vous soyez</span>
              </h1>
            </div>
          </div>

          {/* Baseline + CTAs — right */}
          <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6 lg:items-end">
            <p className="text-white/90 font-body text-sm sm:text-base leading-relaxed max-w-md lg:text-right">
              Fursa vous permet d'acheter des parts de biens immobiliers
              vérifiés en Afrique en toute sécurité avec transparence et
              rentabilité.
            </p>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-white text-earth font-body font-semibold text-sm px-5 py-3 hover:bg-sand-50 transition-colors duration-200 shadow-card-hover"
              >
                Commencer à investir
              </Link>
              <Link
                to="/register?redirect=%2Fproposer-un-bien"
                className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/35 font-body font-semibold text-sm px-5 py-3 backdrop-blur-sm transition-colors duration-200"
              >
                Proposer un bien
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
