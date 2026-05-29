import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type Column<T> = {
  key: string
  label: string
  /** Accesseur pour la valeur de tri (par défaut row[key]) */
  sortAccessor?: (row: T) => string | number | Date | null | undefined
  /** Render custom de la cellule */
  render?: (row: T) => React.ReactNode
  className?: string
  /** Largeur fixe (CSS class, ex: w-32) */
  width?: string
  align?: 'left' | 'right' | 'center'
  /** Désactive le tri sur cette colonne */
  noSort?: boolean
  /** Cache cette colonne en vue mobile (vue cards) */
  hideOnMobile?: boolean
  /** Label de la cellule en vue mobile (par défaut = label) */
  mobileLabel?: string
}

type DataTableProps<T> = {
  data: T[]
  columns: Column<T>[]
  /** Clé unique pour chaque row */
  rowKey: (row: T) => string | number
  /** Tri initial : { key, direction } */
  initialSort?: { key: string; direction: 'asc' | 'desc' }
  pageSize?: number
  /** Affichage si data vide */
  empty?: React.ReactNode
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  initialSort,
  pageSize = 10,
  empty,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sort) return data
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return data
    const accessor = col.sortAccessor ?? ((row: T) => (row as Record<string, unknown>)[sort.key])
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...data].sort((a, b) => {
      const va = accessor(a) as string | number | Date | null | undefined
      const vb = accessor(b) as string | number | Date | null | undefined
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (va instanceof Date && vb instanceof Date) return (va.getTime() - vb.getTime()) * dir
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
  }, [data, columns, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const paginated = useMemo(
    () => sorted.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [sorted, safePage, pageSize]
  )

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'desc' }
      if (prev.direction === 'desc') return { key, direction: 'asc' }
      return undefined
    })
  }

  if (data.length === 0 && empty) return <>{empty}</>

  return (
    <div>
      {/* Vue desktop : tableau (header sticky pour long scroll) */}
      <div className="hidden md:block bg-sand-100 rounded-xl border border-earth/5 overflow-hidden">
        <table className="w-full">
          <thead className="bg-sand-200 border-b border-earth/8 sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <tr>
              {columns.map((col) => {
                const isSorted = sort?.key === col.key
                const Icon = isSorted
                  ? sort.direction === 'asc' ? ArrowUp : ArrowDown
                  : ArrowUpDown
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      'px-4 py-3 text-xs font-body font-semibold text-earth-600 uppercase tracking-wider',
                      col.width,
                      alignClass(col.align),
                      col.className
                    )}
                  >
                    {col.noSort ? (
                      col.label
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          'inline-flex items-center gap-1 hover:text-earth transition-colors',
                          isSorted && 'text-terra'
                        )}
                      >
                        {col.label}
                        <Icon className="w-3 h-3" strokeWidth={2} />
                      </button>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-earth/8">
            {paginated.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-sand-200/40 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3.5 text-sm font-body text-earth',
                      alignClass(col.align),
                      col.className
                    )}
                  >
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue mobile : cards stackés */}
      <div className="md:hidden space-y-3">
        {paginated.map((row) => (
          <div
            key={rowKey(row)}
            className="bg-sand-100 rounded-xl border border-earth/5 p-4 space-y-2.5"
          >
            {columns
              .filter((c) => !c.hideOnMobile)
              .map((col) => (
                <div
                  key={col.key}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="text-xs font-body font-medium text-earth-500 shrink-0">
                    {col.mobileLabel ?? col.label}
                  </span>
                  <div className="text-sm font-body text-earth text-right min-w-0 truncate">
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="font-body text-xs text-earth-500">
            <span className="font-mono">
              {safePage * pageSize + 1}-{Math.min((safePage + 1) * pageSize, sorted.length)}
            </span>{' '}
            sur <span className="font-mono">{sorted.length}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              aria-label="Page précédente"
            >
              <ChevronLeft strokeWidth={1.75} />
            </Button>
            <span className="font-mono text-xs text-earth-600 px-2 tabular-nums">
              {safePage + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage === pageCount - 1}
              aria-label="Page suivante"
            >
              <ChevronRight strokeWidth={1.75} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function alignClass(align?: 'left' | 'right' | 'center') {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}
