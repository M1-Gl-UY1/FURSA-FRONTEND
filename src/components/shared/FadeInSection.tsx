import type { ElementType, ReactNode } from 'react'

import { useFadeInOnScroll } from '@/lib/hooks/useFadeInOnScroll'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
  /** Tag HTML utilise (section, div, article...). Default : div. */
  as?: ElementType
  /** Delai d'apparition en ms (pour les effets en cascade). Default 0. */
  delay?: number
  /** Duree de la transition en ms. Default 700. */
  duration?: number
  className?: string
  /** Si vrai, ID HTML pour les ancres. */
  id?: string
}

/**
 * Wrapper qui anime ses enfants en fade-up quand ils entrent dans le viewport.
 *
 * Inspire des patterns Fumba.town / Paje Square (PROPOSITION_UX_FURSA.md §3.2).
 *
 * Usage :
 *   <FadeInSection delay={100}>
 *     <h2>Mon titre</h2>
 *   </FadeInSection>
 */
export function FadeInSection({
  children,
  as: Tag = 'div',
  delay = 0,
  duration = 700,
  className,
  id,
}: Props) {
  const [ref, visible] = useFadeInOnScroll<HTMLDivElement>()

  return (
    <Tag
      ref={ref}
      id={id}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: visible ? `${delay}ms` : '0ms',
      }}
      className={cn(
        'transition-[opacity,transform] ease-out will-change-[opacity,transform]',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        className
      )}
    >
      {children}
    </Tag>
  )
}
