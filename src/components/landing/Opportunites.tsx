import { PropertyCard } from './PropertyCard'

const properties = [
  {
    image: '/images/villa-falaise.jpg',
    imageAlt: 'Villa en falaise face à l\'océan',
    partsDisponibles: 43,
    rentabilite: '12% / An',
  },
  {
    image: '/images/villa-bois.jpg',
    imageAlt: 'Villa moderne en bord de plage',
    partsDisponibles: 43,
    rentabilite: '12% / An',
  },
]

export function Opportunites() {
  return (
    <section className="bg-sand-50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="font-display font-bold text-earth text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
            Opportunités disponibles
          </h2>
          <p className="font-body text-earth-600 text-sm sm:text-base">
            Découvrez des biens sélectionnés avec potentiel de croissance,
            revenus locatifs et valorisation à long terme.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {properties.map((p, i) => (
            <PropertyCard key={i} {...p} />
          ))}
        </div>
      </div>
    </section>
  )
}
