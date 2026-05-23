import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type {
  DemandeRetraitRequest,
  DemandeRetraitResponse,
} from './types'

// =============================================================================
// User-side hooks
// =============================================================================

export function useMesRetraits() {
  return useQuery({
    queryKey: ['retraits', 'me'],
    queryFn: async () => {
      const { data } = await api.get<DemandeRetraitResponse[]>('/api/retraits/me')
      return data
    },
  })
}

export function useDemanderRetrait() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: DemandeRetraitRequest) => {
      const { data } = await api.post<DemandeRetraitResponse>('/api/retraits', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retraits', 'me'] })
      qc.invalidateQueries({ queryKey: ['wallet', 'me'] })
      qc.invalidateQueries({ queryKey: ['wallet', 'me', 'stats'] })
      qc.invalidateQueries({ queryKey: ['wallet', 'me', 'transactions'] })
      qc.invalidateQueries({ queryKey: ['admin', 'retraits'] })
      qc.invalidateQueries({ queryKey: ['escrow'] })
    },
  })
}

// =============================================================================
// Admin-side hooks
// =============================================================================

export function useAdminRetraits() {
  return useQuery({
    queryKey: ['admin', 'retraits'],
    queryFn: async () => {
      const { data } = await api.get<DemandeRetraitResponse[]>('/api/admin/retraits')
      return data
    },
  })
}

export function useAdminRetraitsPending() {
  return useQuery({
    queryKey: ['admin', 'retraits', 'pending'],
    queryFn: async () => {
      const { data } = await api.get<DemandeRetraitResponse[]>('/api/admin/retraits/pending')
      return data
    },
  })
}

export function useValiderRetrait() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<DemandeRetraitResponse>(
        `/api/admin/retraits/${id}/valider`
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'retraits'] })
      qc.invalidateQueries({ queryKey: ['retraits', 'me'] })
      qc.invalidateQueries({ queryKey: ['admin', 'wallets'] })
    },
  })
}

export function useRefuserRetrait() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, motif }: { id: number; motif: string }) => {
      const { data } = await api.post<DemandeRetraitResponse>(
        `/api/admin/retraits/${id}/refuser`,
        { motif }
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'retraits'] })
      qc.invalidateQueries({ queryKey: ['retraits', 'me'] })
    },
  })
}

export function useCompleterRetrait() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, preuvePaiement }: { id: number; preuvePaiement: string }) => {
      const { data } = await api.post<DemandeRetraitResponse>(
        `/api/admin/retraits/${id}/completer`,
        { preuvePaiement }
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'retraits'] })
      qc.invalidateQueries({ queryKey: ['retraits', 'me'] })
    },
  })
}
