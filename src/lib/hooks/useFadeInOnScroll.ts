import { useEffect, useRef, useState } from 'react'

type Options = {
  /** Seuil de visibilite pour declencher l'animation (0-1). Default 0.15. */
  threshold?: number
  /** Si true, declenche une seule fois. Default true. */
  once?: boolean
  /** Marge supplementaire (ex: "-50px 0px") pour pre-declencher. Default 0. */
  rootMargin?: string
}

/**
 * Detecte quand un element devient visible dans le viewport.
 * Utilise pour les animations fade-up / fade-in scroll-triggered.
 *
 * Inspire des patterns Fumba.town / Paje Square (PROPOSITION_UX_FURSA.md §3.2).
 *
 * Usage :
 *   const [ref, visible] = useFadeInOnScroll()
 *   <div ref={ref} className={cn('transition-all duration-700',
 *       visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
 *
 * @returns [ref, visible] — ref a attacher a l'element, visible = true quand l'element entre dans le viewport
 */
export function useFadeInOnScroll<T extends HTMLElement = HTMLDivElement>(
  options?: Options
): [React.RefObject<T | null>, boolean] {
  const { threshold = 0.15, once = true, rootMargin = '0px' } = options ?? {}
  const [visible, setVisible] = useState(false)
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) obs.disconnect()
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, once, rootMargin])

  return [ref, visible]
}
