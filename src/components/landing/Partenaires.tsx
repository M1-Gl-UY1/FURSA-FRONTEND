import { ArrowUpRight, ShieldCheck } from 'lucide-react'

/**
 * Section partenaires : Paje Square + Fumba Town.
 * Hugh 22/05/2026 : FURSA va tokeniser principalement les biens de ces partenaires.
 */
export function Partenaires() {
  return (
    <section className="bg-white py-16 sm:py-20 border-y border-earth/8">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center mb-10 sm:mb-12">
          <p className="font-body text-xs uppercase tracking-widest text-terra font-semibold mb-2 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
            Partenaires officiels
          </p>
          <h2 className="font-display font-bold text-earth text-2xl sm:text-3xl lg:text-4xl mb-3">
            Des biens premium, sélectionnés avec rigueur
          </h2>
          <p className="font-body text-earth-600 text-sm sm:text-base max-w-2xl mx-auto">
            FURSA collabore avec les promoteurs immobiliers les plus reconnus à Zanzibar
            pour vous proposer des biens vérifiés, certifiés et à fort potentiel locatif.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
          {/* Paje Square */}
          <a
            href="https://www.pajesquare.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl border border-earth/8 bg-sand-50 p-6 sm:p-8 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-bold text-earth text-2xl sm:text-3xl tracking-tight">
                Paje Square
              </p>
              <ArrowUpRight
                className="w-5 h-5 text-earth-400 group-hover:text-terra group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                strokeWidth={1.75}
              />
            </div>
            <p className="font-body text-earth-600 text-sm leading-relaxed mb-4">
              Promoteur de résidences contemporaines à Paje. Studios, appartements 1 et 2
              chambres pensés pour le lifestyle insulaire.
            </p>
            <div className="flex flex-wrap gap-2">
              <Tag>Studios à partir de $67K</Tag>
              <Tag>Style contemporain</Tag>
              <Tag>Vue mer</Tag>
            </div>
          </a>

          {/* Fumba Town */}
          <a
            href="https://fumba.town"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl border border-earth/8 bg-sand-50 p-6 sm:p-8 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-bold text-earth text-2xl sm:text-3xl tracking-tight">
                Fumba Town
              </p>
              <ArrowUpRight
                className="w-5 h-5 text-earth-400 group-hover:text-terra group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                strokeWidth={1.75}
              />
            </div>
            <p className="font-body text-earth-600 text-sm leading-relaxed mb-4">
              Ville nouvelle écoresponsable conçue par CPS Africa. Communauté
              internationale, infrastructures modernes au sud de Zanzibar.
            </p>
            <div className="flex flex-wrap gap-2">
              <Tag>Urban planning</Tag>
              <Tag>Communauté intl.</Tag>
              <Tag>Eco-friendly</Tag>
            </div>
          </a>
        </div>

        {/* Mini reassurance */}
        <p className="mt-8 text-center font-body text-earth-500 text-xs sm:text-sm">
          Tous nos biens sont vérifiés par notre équipe avant tokenisation
          (documents légaux, certification, vidéo de visite guidée).
        </p>
      </div>
    </section>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-earth/10 font-body text-[11px] font-medium text-earth-600">
      {children}
    </span>
  )
}
