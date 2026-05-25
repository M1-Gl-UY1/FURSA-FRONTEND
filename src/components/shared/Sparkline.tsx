import { useMemo } from 'react'

import { cn } from '@/lib/utils'

type SparklineProps = {
  /** Liste de points (du plus ancien au plus recent). */
  values: number[]
  width?: number
  height?: number
  /** Si true, colore la courbe en success/error selon la tendance globale. */
  colorByTrend?: boolean
  /** Override la couleur de la courbe (priorite max). */
  color?: string
  className?: string
}

/**
 * Mini-courbe SVG pour l'historique de prix d'une part.
 * Pas de dependance externe : trace en pur SVG.
 *
 * P1 (Hugh 22/05/2026). Voir PRIX_DYNAMIQUE_FURSA.md.
 */
export function Sparkline({
  values,
  width = 120,
  height = 32,
  colorByTrend = true,
  color: colorOverride,
  className,
}: SparklineProps) {
  const { path, area, color, trend } = useMemo(() => {
    if (values.length === 0) {
      return { path: '', area: '', color: colorOverride ?? '#6b7280', trend: 0 }
    }
    if (values.length === 1) {
      const y = height / 2
      return {
        path: `M 0 ${y} L ${width} ${y}`,
        area: '',
        color: colorOverride ?? '#6b7280',
        trend: 0,
      }
    }

    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const padding = 2

    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * (width - padding * 2) + padding
      const y =
        height - padding - ((v - min) / range) * (height - padding * 2)
      return [x, y] as const
    })

    const path = points
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(' ')

    // Polygone ferme pour l'aire sous la courbe
    const first = points[0]
    const last = points[points.length - 1]
    const area = `M ${first[0].toFixed(2)} ${height} L ${path.slice(2)} L ${last[0].toFixed(
      2
    )} ${height} Z`

    const trend = values[values.length - 1] - values[0]
    let color = '#6b7280' // earth-500
    if (colorByTrend) {
      if (trend > 0) color = '#2E7D5B' // success
      else if (trend < 0) color = '#C43D3D' // error
    }
    if (colorOverride) color = colorOverride

    return { path, area, color, trend }
  }, [values, width, height, colorByTrend, colorOverride])

  if (values.length === 0) {
    return (
      <div
        className={cn('inline-block bg-sand-100 rounded', className)}
        style={{ width, height }}
      />
    )
  }

  const areaId = `sparkline-area-${Math.random().toString(36).slice(2, 8)}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('inline-block overflow-visible', className)}
      role="img"
      aria-label={
        trend > 0
          ? 'Tendance haussiere'
          : trend < 0
            ? 'Tendance baissiere'
            : 'Tendance stable'
      }
    >
      <defs>
        <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill={`url(#${areaId})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  )
}
