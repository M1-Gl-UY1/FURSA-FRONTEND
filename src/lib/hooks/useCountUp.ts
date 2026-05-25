import { useEffect, useRef, useState } from 'react'

type UseCountUpOptions = {
  target: number
  duration?: number
  threshold?: number
  enabled?: boolean
}

/**
 * Anime un compteur de 0 vers `target` quand l'element devient visible.
 * Utilise IntersectionObserver + requestAnimationFrame (ease-out cubic).
 *
 * @returns [value, ref] — value est le nombre courant, ref a attacher a l'element a observer
 */
export function useCountUp({
  target,
  duration = 1800,
  threshold = 0.3,
  enabled = true,
}: UseCountUpOptions): [number, React.RefObject<HTMLDivElement | null>] {
  const [value, setValue] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [enabled, threshold])

  useEffect(() => {
    if (!visible) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, target, duration])

  return [value, ref]
}
