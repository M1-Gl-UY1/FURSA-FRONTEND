import { Link } from 'react-router-dom'

export function CtaFinal() {
  return (
    <section id="commencer" className="bg-sand-50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display font-bold text-earth text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-8">
            Prêt à faire grandir votre capital ?
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-terra hover:bg-terra-600 text-white font-body font-semibold text-sm px-6 py-3 shadow-brand hover:shadow-brand-hover transition-all duration-200"
            >
              Devenir investisseur
            </Link>
            <Link
              to="/register?redirect=%2Fproposer-un-bien"
              className="inline-flex items-center justify-center rounded-full bg-transparent hover:bg-earth/5 text-earth border-[1.5px] border-earth font-body font-semibold text-sm px-6 py-3 transition-colors duration-200"
            >
              Rentabiliser sa propriété
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
