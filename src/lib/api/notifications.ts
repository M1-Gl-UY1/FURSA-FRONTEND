import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { NotificationResponse } from './types'

export function useMesNotifications(opts?: { nonLuesSeulement?: boolean; pollMs?: number }) {
  return useQuery({
    queryKey: ['mes-notifications', opts?.nonLuesSeulement ?? false],
    queryFn: async () => {
      const { data } = await api.get<NotificationResponse[]>('/api/notifications/me', {
        params: { nonLuesSeulement: opts?.nonLuesSeulement ?? false },
      })
      return data
    },
    refetchInterval: opts?.pollMs,
    refetchIntervalInBackground: false,
  })
}

export function useMarquerLue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.put<NotificationResponse>(`/api/notifications/${id}/lu`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mes-notifications'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'me'] })
    },
  })
}

export function useMarquerToutLu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.put<{ marquees: number }>('/api/notifications/me/lu-tout')
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mes-notifications'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'me'] })
    },
  })
}
