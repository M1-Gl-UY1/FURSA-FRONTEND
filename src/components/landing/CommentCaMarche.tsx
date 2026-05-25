import { Link } from 'react-router-dom'
import { UserPlus, Search, Wallet, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Step = {
  number: string
  title: string
  description: string
  icon: LucideIcon
  highlight?: string
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Créez votre compte',
    description:
      'Inscription gratuite en quelques minutes. Vérification KYC simplifiée pour rejoindre la communauté Fursa en toute conformité.',
    icon: UserPlus,
    highlight: 'Gratuit · 5 min',
  },
  {
    number: '02',
    title: 'Choisissez un bien',
    description:
      "Parcourez nos biens certifiés à Zanzibar. Étudiez les performances, photos, vidéo de visite et rendement estimé avant de vous décider.",
    icon: Search,
    highlight: 'Dès $67',
  },
  {
    number: '03',
    title: 'Investissez en quelques clics',
    description:
      "Réglez en USD ou crypto via Yellow Card. Vos fonds restent en séquestre jusqu'à ce que l'objectif de collecte soit atteint à 100%.",
    icon: Wallet,
    highlight: 'Paiement sécurisé',
  },
  {
    number: '04',
    title: 'Recevez vos revenus',
    description:
      'Loyers nets distribués trimestriellement, directement sur votre wallet Fursa. Suivez vos rendements en temps réel depuis votre dashboard.',
    icon: TrendingUp,
    highlight: 'Trimestriel',
  },
]

export function CommentCaMarche() {
  return (
    <section id="comment-ca-marche" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <p className="font-body text-xs uppercase tracking-widest text-terra font-semibold mb-3">
            Parcours investisseur
          </p>
          <h2 className="font-display font-bold text-earth text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
            Comment ça marche ?
          </h2>
          <p className="font-body text-earth-600 text-base sm:text-lg leading-relaxed">
            Quatre étapes simples pour devenir copropriétaire d'un bien
            immobilier africain.
          </p>
        </div>

        {/* Timeline desktop */}
        <div className="hidden md:block relative max-w-5xl mx-auto">
          {/* Ligne horizontale */}
          <div
            aria-hidden="true"
            className="absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-terra/0 via-terra/30 to-terra/0"
          />

          <div className="relative grid grid-cols-4 gap-6">
            {STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.number} className="relative flex flex-col items-center text-center">
                  {/* Bulle numérotée */}
                  <div className="relative z-10 w-16 h-16 rounded-full bg-white border-2 border-terra flex items-center justify-center shadow-card mb-5">
                    <Icon className="w-6 h-6 text-terra" strokeWidth={1.75} />
                  </div>
                  <span className="font-mono text-xs font-bold text-terra mb-2">
                    ÉTAPE {step.number}
                  </span>
                  <h3 className="font-display font-bold text-earth text-lg mb-2">
                    {step.title}
                  </h3>
                  <p className="font-body text-earth-600 text-sm leading-relaxed mb-3">
                    {step.description}
                  </p>
                  {step.highlight && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-terra/10 font-body text-[11px] font-semibold text-terra">
                      {step.highlight}
                    </span>
                  )}
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
                <div key={step.number} className="relative flex gap-5">
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-full bg-white border-2 border-terra flex items-center justify-center shadow-card">
                    <Icon className="w-6 h-6 text-terra" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 pt-1">
                    <span className="font-mono text-xs font-bold text-terra block mb-1">
                      ÉTAPE {step.number}
                    </span>
                    <h3 className="font-display font-bold text-earth text-lg mb-2">
                      {step.title}
                    </h3>
                    <p className="font-body text-earth-600 text-sm leading-relaxed mb-2">
                      {step.description}
                    </p>
                    {step.highlight && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-terra/10 font-body text-[11px] font-semibold text-terra">
                        {step.highlight}
                      </span>
                    )}
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
            Créer mon compte gratuitement
          </Link>
          <p className="mt-3 font-body text-earth-500 text-xs">
            Sans engagement · Vérification KYC en 5 minutes
          </p>
        </div>
      </div>
    </section>
  )
}
