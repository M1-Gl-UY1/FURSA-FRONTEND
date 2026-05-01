export function InvestirConfiance() {
  return (
    <section className="bg-sand-100 py-16 sm:py-20 lg:py-24">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="font-display font-bold text-earth text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            Investir avec confiance
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center max-w-4xl mx-auto">
          <div className="md:col-span-7 order-2 md:order-1">
            <p className="font-body text-earth-600 text-base sm:text-lg leading-relaxed text-center md:text-left">
              Chaque bien est vérifié, documenté et validé avant publication.
              Transactions sécurisées, traçabilité complète et transparence
              totale.
            </p>
          </div>
          <div className="md:col-span-5 order-1 md:order-2 flex justify-center md:justify-end">
            <img
              src="/images/cle-bouclier.jpg"
              alt="Clé et bouclier — sécurité des transactions"
              loading="lazy"
              className="w-32 h-32 sm:w-40 sm:h-40 object-contain mix-blend-multiply"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
