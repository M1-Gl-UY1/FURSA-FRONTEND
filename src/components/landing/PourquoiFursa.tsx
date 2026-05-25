import { Globe, Lock, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const PILLARS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Globe,
    title: 'Accessible partout',
    text: "Investissez dans l'immobilier africain depuis n'importe où dans le monde, dès quelques dollars la part.",
  },
  {
    icon: Lock,
    title: 'Vérifié et certifié',
    text: 'Tous les biens passent par notre équipe : documents légaux, vidéo de visite, validation administrative.',
  },
  {
    icon: TrendingUp,
    title: 'Revenus + revente',
    text: 'Revenus locatifs trimestriels distribués automatiquement. Revendez vos parts à tout moment sur le marché secondaire.',
  },
]

export function PourquoiFursa() {
  return (
    <section id="pourquoi" className="bg-earth py-16 sm:py-20 lg:py-24 relative overflow-hidden">
      {/* Halos décoratifs */}
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
            Notre mission
          </p>
          <h2 className="font-display font-bold text-white text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-5">
            Pourquoi Fursa ?
          </h2>
          <p className="font-body text-white/85 text-base sm:text-lg leading-relaxed">
            Le marché immobilier africain regorge d'opportunités, mais reste difficile
            d'accès. Fursa crée un pont de confiance entre propriétaires et investisseurs
            via une plateforme moderne, sécurisée et simple.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {PILLARS.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.title}
                className="group relative rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-7 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-terra/20 flex items-center justify-center mb-4 group-hover:bg-terra/30 group-hover:scale-105 transition-all">
                  <Icon className="w-5 h-5 text-terra-300" strokeWidth={1.75} />
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-2">
                  {p.title}
                </h3>
                <p className="font-body text-white/75 text-sm leading-relaxed">
                  {p.text}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
