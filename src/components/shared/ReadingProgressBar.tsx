import { useEffect, useState } from 'react'

/**
 * Barre de progression de lecture en haut de page.
 *
 * UX P3 (PROPOSITION_UX_FURSA.md §3.11). Inspire des sites de contenu long
 * comme Medium, Substack. Indique a l'utilisateur ou il en est dans une
 * page dense (ex : fiche bien).
 */
export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setProgress(Math.min(Math.max(pct, 0), 100))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-0.5 bg-transparent z-[60] pointer-events-none"
    >
      <div
        className="h-full bg-terra transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
