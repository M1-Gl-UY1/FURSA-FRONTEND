import { ShieldCheck, FileText, Lock, Eye, Scale, BadgeCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Guarantee = {
  icon: LucideIcon
  title: string
  text: string
}

const GUARANTEES: Guarantee[] = [
  {
    icon: BadgeCheck,
    title: 'Biens certifiés',
    text: "Chaque bien est inspecté physiquement, documents légaux vérifiés et validé par notre équipe avant publication.",
  },
  {
    icon: FileText,
    title: 'Documents légaux',
    text: 'Titre foncier, permis de construire, contrats de gestion : tout est accessible avant achat.',
  },
  {
    icon: Lock,
    title: 'Transactions sécurisées',
    text: "Vos paiements transitent par un compte séquestre. Les fonds ne sont libérés que lorsque l'objectif de collecte est atteint.",
  },
  {
    icon: Eye,
    title: 'Transparence totale',
    text: "Loyers, charges, taux d'occupation, revenus nets : vous voyez exactement ce que rapporte votre investissement.",
  },
  {
    icon: Scale,
    title: 'Conformité juridique',
    text: 'Structure juridique conforme aux régulations locales. Vos droits de copropriété sont garantis et traçables.',
  },
  {
    icon: ShieldCheck,
    title: 'Garantie de remboursement',
    text: "Si l'objectif n'est pas atteint dans le délai imparti, vos fonds vous sont automatiquement restitués.",
  },
]

export function InvestirConfiance() {
  return (
    <section className="bg-sand-100 py-16 sm:py-20 lg:py-24">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <p className="font-body text-xs uppercase tracking-widest text-terra font-semibold mb-3 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
            Nos garanties
          </p>
          <h2 className="font-display font-bold text-earth text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
            Investir avec confiance
          </h2>
          <p className="font-body text-earth-600 text-base sm:text-lg leading-relaxed">
            Six engagements concrets pour que votre investissement soit aussi sûr
            que rentable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {GUARANTEES.map((g) => {
            const Icon = g.icon
            return (
              <div
                key={g.title}
                className="group relative rounded-xl border border-earth/8 bg-white p-5 sm:p-6 hover:shadow-card-hover hover:border-terra/20 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-terra/10 flex items-center justify-center group-hover:bg-terra/20 transition-colors">
                    <Icon className="w-5 h-5 text-terra" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-earth text-base sm:text-lg mb-1.5">
                      {g.title}
                    </h3>
                    <p className="font-body text-earth-600 text-sm leading-relaxed">
                      {g.text}
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
