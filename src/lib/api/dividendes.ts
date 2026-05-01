import { useQuery } from '@tanstack/react-query'

import { api } from './client'
import type { DividendeResponse } from './types'

export function useMesDividendes() {
  return useQuery({
    queryKey: ['mes-dividendes'],
    queryFn: async () => {
      const { data } = await api.get<DividendeResponse[]>('/api/dividendes/me')
      return data
    },
  })
}
