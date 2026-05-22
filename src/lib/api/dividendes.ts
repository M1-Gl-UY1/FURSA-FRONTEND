import { useQuery } from '@tanstack/react-query'

import { api } from './client'
import type { DividendeResponse, DividendesBalance } from './types'

export function useMesDividendes() {
  return useQuery({
    queryKey: ['mes-dividendes'],
    queryFn: async () => {
      const { data } = await api.get<DividendeResponse[]>('/api/dividendes/me')
      return data
    },
  })
}

export function useMaBalanceDividendes() {
  return useQuery({
    queryKey: ['mes-dividendes', 'balance'],
    queryFn: async () => {
      const { data } = await api.get<DividendesBalance>('/api/dividendes/me/balance')
      return data
    },
  })
}
