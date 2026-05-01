import { TrendingUp, PieChart } from 'lucide-react'

type PropertyCardProps = {
  image: string
  imageAlt?: string
  partsDisponibles: number
  rentabilite: string
}

export function PropertyCard({
  image,
  imageAlt = 'Propriété disponible à l\'investissement',
  partsDisponibles,
  rentabilite,
}: PropertyCardProps) {
  return (
    <article className="group relative rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 bg-sand-100 border border-earth/5">
      {/* Image */}
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
        />
      </div>

      {/* Badges en bas de l'image */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean text-white text-xs font-semibold font-body px-3 py-1.5 shadow-card">
          <PieChart className="w-3.5 h-3.5" strokeWidth={2} />
          Parts disponibles
          <span className="font-mono ml-1">{partsDisponibles}%</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success text-white text-xs font-semibold font-body px-3 py-1.5 shadow-card">
          <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
          Rentabilité estimée
          <span className="font-mono ml-1">{rentabilite}</span>
        </span>
      </div>
    </article>
  )
}
