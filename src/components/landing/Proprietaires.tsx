export function Proprietaires() {
  return (
    <section className="bg-sand-100 py-16 sm:py-20 lg:py-24">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Texte — gauche (sur desktop) */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <h2 className="font-display font-bold text-earth text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-5">
              Pour les{' '}
              <span className="block sm:inline">propriétaires</span>
            </h2>
            <p className="font-body text-earth-600 text-base sm:text-lg leading-relaxed max-w-lg">
              Levez des fonds rapidement en mettant votre bien sur la
              plateforme et en vendant des parts à des investisseurs
              qualifiés.
            </p>
          </div>

          {/* Image — droite */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden shadow-card">
              <img
                src="/images/proprietaires-cle.jpg"
                alt="Main tenant des clés de maison"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
