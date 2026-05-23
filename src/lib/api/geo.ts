import { useQuery } from '@tanstack/react-query'

import { api } from './client'
import type { PaysInfo } from './types'

/**
 * P1 (Hugh 22/05/2026) : liste des pays cibles FURSA (dropdown).
 * MVP : liste figee de 10 pays cote backend.
 */
export function usePays() {
  return useQuery({
    queryKey: ['geo', 'pays'],
    queryFn: async () => {
      const { data } = await api.get<PaysInfo[]>('/api/geo/pays')
      return data
    },
    staleTime: 24 * 60 * 60 * 1000, // 24h, donnees rarement modifiees
  })
}

/**
 * Villes principales d'un pays donne. Charge dynamiquement quand le user
 * selectionne un pays dans le wizard.
 */
export function useVilles(codePays: string | null | undefined) {
  return useQuery({
    queryKey: ['geo', 'villes', codePays],
    enabled: !!codePays,
    queryFn: async () => {
      const { data } = await api.get<string[]>(`/api/geo/pays/${codePays}/villes`)
      return data
    },
    staleTime: 24 * 60 * 60 * 1000,
  })
}
