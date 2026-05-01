import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type Step = {
  number: string
  title: string
  description: string
  image: string
  imageAlt: string
}

const steps: Step[] = [
  {
    number: '1',
    title: 'Créez votre compte',
    description:
      'Inscrivez-vous gratuitement en quelques minutes et vérifiez votre identité pour rejoindre la communauté Fursa.',
    image: '/images/step1-compte.jpg',
    imageAlt: 'Carte de compte avec validation',
  },
  {
    number: '2',
    title: 'Choisissez un bien',
    description:
      'Analysez les performances, images, localisation et rendement estimé de chaque propriété disponible.',
    image: '/images/step2-maison.jpg',
    imageAlt: 'Illustration de maison',
  },
  {
    number: '3',
    title: 'Investissez en quelques clics',
    description:
      'Achetez vos parts en toute sécurité et suivez vos rendements directement depuis votre tableau de bord.',
    image: '/images/step3-banque.jpg',
    imageAlt: 'Illustration de banque et graphique de rendement',
  },
]

export function CommentCaMarche() {
  return (
    <section id="comment-ca-marche" className="bg-sand-100 py-16 sm:py-20 lg:py-24">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-display font-bold text-earth text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            Comment ça marche ?
          </h2>
        </div>

        <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
          {steps.map((step, i) => {
            const reverse = i % 2 === 1
            return (
              <div
                key={step.number}
                className={cn(
                  'grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center bg-sand-50 rounded-xl p-6 sm:p-8 shadow-card',
                  reverse && 'md:[&>*:first-child]:order-2'
                )}
              >
                {/* Bloc texte */}
                <div className="md:col-span-7">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-full bg-earth text-white font-mono text-xs font-bold px-2">
                      {step.number}
                    </span>
                    <h3 className="font-display font-semibold text-earth text-xl sm:text-2xl">
                      {step.title}
                    </h3>
                  </div>
                  <p className="font-body text-earth-600 text-sm sm:text-base leading-relaxed mb-5">
                    {step.description}
                  </p>
                  <Link
                    to="/register"
                    className="inline-flex items-center rounded-full bg-ocean hover:bg-ocean-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 transition-colors duration-200"
                  >
                    Commencer
                  </Link>
                </div>

                {/* Illustration 3D */}
                <div className="md:col-span-5 flex justify-center md:justify-end">
                  <img
                    src={step.image}
                    alt={step.imageAlt}
                    loading="lazy"
                    className="w-40 h-40 sm:w-48 sm:h-48 object-contain mix-blend-multiply"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
