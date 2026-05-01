import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type AuthLayoutProps = {
  children: ReactNode
  /** Bandeau d'info au-dessus de la card (ex: "Connectez-vous pour proposer votre bien") */
  banner?: ReactNode
  /** Largeur max de la card (default 480px). Register est plus large car plus de champs. */
  cardSize?: 'default' | 'wide'
}

export function AuthLayout({ children, banner, cardSize = 'default' }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Image de fond plein écran */}
      <img
        src="/images/hero-zanzibar.jpg"
        alt=""
        aria-hidden="true"
        className="fixed inset-0 w-full h-full object-cover object-[center_28%]"
      />

      {/* Overlay sombre dégradé */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-gradient-to-b from-earth/55 via-earth/40 to-earth/70"
      />

      {/* Header minimal */}
      <header className="relative z-20">
        <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center">
          <Link to="/" aria-label="Fursa - Accueil" className="flex items-center">
            <img
              src="/images/logo-fursa.png"
              alt="Fursa"
              className="h-8 sm:h-9 w-auto"
            />
          </Link>
        </div>
      </header>

      {/* Contenu centré */}
      <main className="relative z-10 flex items-center justify-center px-4 sm:px-6 pb-12 pt-2 sm:pt-6 min-h-[calc(100vh-5rem)]">
        <div
          className={cn(
            'w-full',
            cardSize === 'wide' ? 'max-w-[560px]' : 'max-w-[460px]'
          )}
        >
          {banner && <div className="mb-4">{banner}</div>}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-modal border border-white/40 p-6 sm:p-8 lg:p-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
