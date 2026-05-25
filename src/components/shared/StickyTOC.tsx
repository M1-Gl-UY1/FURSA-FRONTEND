import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

export type TOCItem = {
  /** ID HTML de la section cible (sans #). */
  id: string
  /** Label affiche. */
  label: string
}

type Props = {
  items: TOCItem[]
  /** Offset pour la detection du scroll-spy (compense le header fixe). Default 100. */
  offset?: number
  className?: string
}

/**
 * Mini table des matieres sticky sur la fiche bien.
 *
 * UX P3 (PROPOSITION_UX_FURSA.md §3.13). Inspire de la navigation Notion /
 * docs.stripe.com : sidebar gauche desktop, item courant highlight selon
 * la position de scroll. Cache automatiquement sur mobile (l'usage est
 * desktop-first pour les fiches biens detaillees).
 */
export function StickyTOC({ items, offset = 100, className }: Props) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)

  useEffect(() => {
    function onScroll() {
      let current: string | null = null
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top <= offset) {
          current = item.id
        }
      }
      if (current !== activeId) {
        setActiveId(current)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [items, offset, activeId])

  return (
    <nav
      aria-label="Table des matières"
      className={cn(
        'hidden xl:block fixed left-4 top-24 w-44 max-h-[calc(100vh-7rem)] overflow-auto z-30',
        className
      )}
    >
      <p className="font-body text-[10px] uppercase tracking-widest text-earth-500 font-semibold mb-3">
        Sur cette page
      </p>
      <ul className="space-y-1 border-l border-earth/10 pl-3">
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  '-ml-[13px] pl-3 block py-1.5 text-sm font-body transition-colors border-l-2',
                  active
                    ? 'border-terra text-terra font-semibold'
                    : 'border-transparent text-earth-500 hover:text-earth'
                )}
              >
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
