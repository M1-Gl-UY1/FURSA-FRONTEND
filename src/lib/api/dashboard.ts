import { useQuery } from '@tanstack/react-query'

import { api } from './client'
import type { DashboardInvestisseurResponse } from './types'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'me'],
    queryFn: async () => {
      const { data } = await api.get<DashboardInvestisseurResponse>('/api/dashboard/me')
      return data
    },
  })
}
