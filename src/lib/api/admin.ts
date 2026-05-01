import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type {
  CurrentUser,
  DashboardAdminResponse,
  DividendeResponse,
  PaiementResponse,
  ProprieteResponse,
  RevenuResponse,
  TransactionResponse,
} from './types'

// =============================================================================
// Dashboard admin
// =============================================================================

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DashboardAdminResponse>('/api/dashboard/admin')
      return data
    },
  })
}

// =============================================================================
// Utilisateurs (admin)
// =============================================================================

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await api.get<CurrentUser[]>('/api/user')
      return data
    },
  })
}

export function useValiderUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<CurrentUser>(`/api/user/${id}/valider`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

// =============================================================================
// Propriétés (admin) — workflow soumission
// =============================================================================

export function useApprouverPropriete() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<ProprieteResponse>(
        `/api/proprietes/admin/${id}/approuver`
      )
      return data
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['proprietes'] })
      qc.invalidateQueries({ queryKey: ['propriete', id] })
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees'] })
      qc.invalidateQueries({ queryKey: ['ma-propriete-proposee', id] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useRefuserPropriete() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { id: number; motif: string }) => {
      const { data } = await api.post<ProprieteResponse>(
        `/api/proprietes/admin/${vars.id}/refuser`,
        { motif: vars.motif }
      )
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['proprietes'] })
      qc.invalidateQueries({ queryKey: ['propriete', vars.id] })
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees'] })
      qc.invalidateQueries({ queryKey: ['ma-propriete-proposee', vars.id] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function usePublierPropriete() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<ProprieteResponse>(
        `/api/proprietes/admin/${id}/publier`
      )
      return data
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['proprietes'] })
      qc.invalidateQueries({ queryKey: ['propriete', id] })
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees'] })
      qc.invalidateQueries({ queryKey: ['ma-propriete-proposee', id] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useSupprimerPropriete() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/proprietes/admin/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proprietes'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

// =============================================================================
// Revenus (admin) — workflow validation + distribution
// =============================================================================

export function useApprouverRevenu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<RevenuResponse>(
        `/api/revenus/admin/${id}/approuver`
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'revenus'] })
      qc.invalidateQueries({ queryKey: ['mes-revenus'] })
    },
  })
}

export function useRefuserRevenu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { id: number; motif: string }) => {
      const { data } = await api.post<RevenuResponse>(
        `/api/revenus/admin/${vars.id}/refuser`,
        { motif: vars.motif }
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'revenus'] })
      qc.invalidateQueries({ queryKey: ['mes-revenus'] })
    },
  })
}

export function useDistribuerRevenu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (revenuId: number) => {
      const { data } = await api.post<DividendeResponse[]>(
        `/api/distribution/${revenuId}`
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'revenus'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      qc.invalidateQueries({ queryKey: ['mes-revenus'] })
      qc.invalidateQueries({ queryKey: ['mes-dividendes'] })
    },
  })
}

export function useAdminRevenus() {
  return useQuery({
    queryKey: ['admin', 'revenus'],
    queryFn: async () => {
      const { data } = await api.get<RevenuResponse[]>('/api/revenus')
      return data
    },
  })
}

// =============================================================================
// Audit (admin) : transactions, paiements, dividendes
// =============================================================================

export function useAdminTransactions() {
  return useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: async () => {
      const { data } = await api.get<TransactionResponse[]>(
        '/api/marche-primaire/transactions'
      )
      return data
    },
  })
}

export function useAdminPaiements() {
  return useQuery({
    queryKey: ['admin', 'paiements'],
    queryFn: async () => {
      const { data } = await api.get<PaiementResponse[]>(
        '/api/marche-primaire/paiements'
      )
      return data
    },
  })
}

export function useAdminDividendes() {
  return useQuery({
    queryKey: ['admin', 'dividendes'],
    queryFn: async () => {
      const { data } = await api.get<DividendeResponse[]>('/api/dividendes')
      return data
    },
  })
}
