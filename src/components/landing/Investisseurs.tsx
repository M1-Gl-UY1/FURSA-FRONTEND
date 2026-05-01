export function Investisseurs() {
  return (
    <section className="bg-sand-50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Image — gauche */}
          <div className="lg:col-span-6 order-1">
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden shadow-card">
              <img
                src="/images/investisseurs-pieces.jpg"
                alt="Maisons miniatures sur des piles de pièces — investissement immobilier"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Texte — droite */}
          <div className="lg:col-span-6 order-2">
            <h2 className="font-display font-bold text-earth text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-5">
              Pour les{' '}
              <span className="block sm:inline">investisseurs</span>
            </h2>
            <p className="font-body text-earth-600 text-base sm:text-lg leading-relaxed max-w-lg">
              Diversifiez votre patrimoine en accédant à des opportunités
              immobilières rentables, même avec un budget réduit grâce à
              l'achat fractionné.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
