import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { AchatRequest, AchatResponse } from './types'

export async function acheterParts(payload: AchatRequest): Promise<AchatResponse> {
  const { data } = await api.post<AchatResponse>('/api/marche-primaire/acheter', payload)
  return data
}

export function useAcheterParts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: acheterParts,
    onSuccess: (_data, variables) => {
      // Invalider les caches impactés
      qc.invalidateQueries({ queryKey: ['proprietes'] })
      qc.invalidateQueries({ queryKey: ['propriete', variables.proprieteId] })
      qc.invalidateQueries({ queryKey: ['progression', variables.proprieteId] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'me'] })
      qc.invalidateQueries({ queryKey: ['mes-possessions'] })
      qc.invalidateQueries({ queryKey: ['mes-transactions'] })
      qc.invalidateQueries({ queryKey: ['mes-paiements'] })
    },
  })
}
