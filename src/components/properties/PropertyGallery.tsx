import { useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'

import { cn } from '@/lib/utils'

const PLACEHOLDER = '/images/villa-falaise.jpg'

type PropertyGalleryProps = {
  photos?: string[]
  alt: string
}

export function PropertyGallery({ photos, alt }: PropertyGalleryProps) {
  const list = (photos && photos.length > 0 ? photos : [PLACEHOLDER])
  const [index, setIndex] = useState(0)
  const main = list[index]

  const prev = () => setIndex((i) => (i - 1 + list.length) % list.length)
  const next = () => setIndex((i) => (i + 1) % list.length)

  return (
    <div>
      {/* Image principale */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden bg-sand-300">
        {main ? (
          <img
            src={main}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-earth-400">
            <ImageOff className="w-12 h-12" strokeWidth={1.5} />
          </div>
        )}

        {/* Flèches navigation si plus d'1 photo */}
        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Photo précédente"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-earth shadow-card flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Photo suivante"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-earth shadow-card flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
            </button>

            {/* Indicateur "X / Y" */}
            <div className="absolute bottom-3 right-3 bg-earth/75 backdrop-blur-sm text-white text-xs font-mono px-2.5 py-1 rounded-full">
              {index + 1} / {list.length}
            </div>
          </>
        )}
      </div>

      {/* Miniatures (si plusieurs) */}
      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 gap-2">
          {list.slice(0, 12).map((photo, i) => (
            <button
              key={`${photo}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Voir photo ${i + 1}`}
              className={cn(
                'relative aspect-square rounded-md overflow-hidden border-2 transition-all',
                i === index
                  ? 'border-terra ring-2 ring-terra/20'
                  : 'border-transparent hover:border-earth/20 opacity-80 hover:opacity-100'
              )}
            >
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
