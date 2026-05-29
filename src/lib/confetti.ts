/**
 * Mini-confetti vanilla DOM (pas de lib externe).
 *
 * Polish UX : celebre les actions critiques reussies (achat de parts,
 * tokenisation, certification approuvee). Spawn ~60 particules colorees
 * qui tombent ~2s puis disparaissent. ~3 kB de JS, zero dep.
 */

const COLORS = [
  '#C45D3E', // terra
  '#D4A853', // gold
  '#2D6A7A', // ocean
  '#2E7D5B', // success
  '#E89478', // terra-300
]

/**
 * Lance le confetti. Idempotent : appels multiples = multiples bursts.
 * Cible : viewport (position fixed), ne casse pas le layout.
 */
export function fireConfetti(options?: { count?: number; durationMs?: number }) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const count = options?.count ?? 60
  const duration = options?.durationMs ?? 2200

  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  layer.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;'
  document.body.appendChild(layer)

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span')
    const left = Math.random() * 100
    const delay = Math.random() * 150
    const size = 6 + Math.random() * 6
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const rotateStart = Math.random() * 360
    const rotateEnd = rotateStart + 360 + Math.random() * 720
    const driftX = (Math.random() - 0.5) * 200

    piece.style.cssText = [
      'position:absolute',
      'top:-12px',
      `left:${left}%`,
      `width:${size}px`,
      `height:${size * 0.4}px`,
      `background:${color}`,
      `border-radius:1px`,
      `transform:rotate(${rotateStart}deg)`,
      `opacity:1`,
      `animation:fursa-confetti-fall ${duration}ms cubic-bezier(.2,.6,.2,1) ${delay}ms forwards`,
      `--drift-x:${driftX}px`,
      `--rotate-end:${rotateEnd}deg`,
    ].join(';')

    layer.appendChild(piece)
  }

  // Nettoyage apres l'animation + un peu de marge.
  window.setTimeout(() => {
    layer.remove()
  }, duration + 400)
}

/**
 * Injection one-shot des keyframes globales si elles n'existent pas deja.
 * Appele automatiquement par fireConfetti. Reste en page apres premier appel.
 */
function ensureKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById('fursa-confetti-style')) return
  const style = document.createElement('style')
  style.id = 'fursa-confetti-style'
  style.textContent = `@keyframes fursa-confetti-fall {
    0%   { transform: translate(0,0) rotate(0); opacity: 1; }
    100% { transform: translate(var(--drift-x,0), 105vh) rotate(var(--rotate-end,720deg)); opacity: 0; }
  }`
  document.head.appendChild(style)
}

// Injection au chargement du module pour que la 1re salve soit propre.
if (typeof document !== 'undefined') {
  ensureKeyframes()
}
