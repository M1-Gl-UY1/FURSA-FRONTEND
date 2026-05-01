import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { RevenuResponse, SubmissionRevenuRequest } from './types'

export function useMesRevenus() {
  return useQuery({
    queryKey: ['mes-revenus'],
    queryFn: async () => {
      const { data } = await api.get<RevenuResponse[]>('/api/revenus/me')
      return data
    },
  })
}

export function useRevenusParPropriete(proprieteId: number | undefined) {
  return useQuery({
    queryKey: ['revenus-propriete', proprieteId],
    queryFn: async () => {
      const { data } = await api.get<RevenuResponse[]>(
        `/api/revenus/propriete/${proprieteId}`
      )
      return data
    },
    enabled: proprieteId != null,
  })
}

export function useDeclarerRevenu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SubmissionRevenuRequest) => {
      const { data } = await api.post<RevenuResponse>(
        '/api/revenus/submissions',
        payload
      )
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['mes-revenus'] })
      qc.invalidateQueries({ queryKey: ['revenus-propriete', vars.proprieteId] })
      qc.invalidateQueries({ queryKey: ['mes-notifications'] })
    },
  })
}
