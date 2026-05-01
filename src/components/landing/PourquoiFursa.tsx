import { Image as ImageIcon } from 'lucide-react'

export function PourquoiFursa() {
  return (
    <section id="pourquoi" className="bg-earth py-16 sm:py-20 lg:py-24">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Texte */}
          <div className="lg:col-span-6">
            <h2 className="font-display font-bold text-ocean-300 text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-6">
              Pourquoi Fursa ?
            </h2>
            <p className="font-body text-white/85 text-base sm:text-lg leading-relaxed max-w-xl">
              Le marché immobilier africain regorge d'opportunités, mais reste
              difficile d'accès pour de nombreux investisseurs. Fursa crée un
              pont de confiance entre propriétaires et investisseurs grâce à
              une plateforme moderne, sécurisée et simple d'utilisation.
            </p>
          </div>

          {/* Visuel placeholder (mockup app à intégrer plus tard) */}
          <div className="lg:col-span-6">
            <div className="aspect-[4/3] w-full rounded-xl bg-earth-600/40 border border-white/5 flex items-center justify-center">
              <ImageIcon
                className="w-16 h-16 text-white/30"
                strokeWidth={1.25}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
