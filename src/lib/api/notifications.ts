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

export function useMarquerNonLue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.put<NotificationResponse>(`/api/notifications/${id}/non-lu`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mes-notifications'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'me'] })
    },
  })
}

export function useSupprimerNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/notifications/${id}`)
    },
    onMutate: async (id: number) => {
      // Optimistic update : retire immediatement la notif du cache pour
      // que la suppression soit perceptible instantanement.
      await qc.cancelQueries({ queryKey: ['mes-notifications'] })
      const previous = qc.getQueriesData<NotificationResponse[]>({ queryKey: ['mes-notifications'] })
      previous.forEach(([key, value]) => {
        if (value) {
          qc.setQueryData(key, value.filter((n) => n.id !== id))
        }
      })
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      // Rollback si echec
      ctx?.previous.forEach(([key, value]) => qc.setQueryData(key, value))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['mes-notifications'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'me'] })
    },
  })
}

export function useSupprimerToutLu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<{ supprimees: number }>('/api/notifications/me/lues')
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mes-notifications'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'me'] })
    },
  })
}
