import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { ProprieteResponse, SubmissionRequest } from './types'

export function useMesProprietesProposees() {
  return useQuery({
    queryKey: ['mes-proprietes-proposees'],
    queryFn: async () => {
      const { data } = await api.get<ProprieteResponse[]>('/api/proprietes/me')
      return data
    },
  })
}

export function useMaProprieteProposee(id: number | undefined) {
  return useQuery({
    queryKey: ['ma-propriete-proposee', id],
    queryFn: async () => {
      const { data } = await api.get<ProprieteResponse>(`/api/proprietes/me/${id}`)
      return data
    },
    enabled: id != null,
  })
}

export function useSoumettreBien() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { submission: SubmissionRequest; files: File[] }) => {
      const formData = new FormData()

      // La partie "submission" doit être envoyée en JSON avec content-type application/json
      formData.append(
        'submission',
        new Blob([JSON.stringify(vars.submission)], { type: 'application/json' })
      )

      vars.files.forEach((f) => formData.append('files', f))

      const { data } = await api.post<ProprieteResponse>(
        '/api/proprietes/submissions',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees'] })
      qc.invalidateQueries({ queryKey: ['proprietes'] })
      qc.invalidateQueries({ queryKey: ['mes-notifications'] })
    },
  })
}
