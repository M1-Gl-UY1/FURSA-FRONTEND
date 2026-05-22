import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type {
  AdminPaymentSessionResponse,
  CurrentUser,
  DashboardAdminResponse,
  DeviseRate,
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

/** Soft delete : set `deleted_at = now()`. L'user ne peut plus se logger. Reversible via restore. */
export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/user/delete/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

/** Restaure un user soft-deleted (set `deleted_at = null`). */
export function useRestoreUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/api/user/${id}/restore`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

/** Recupere le profil complet d'un user (admin). */
export function useAdminUserById(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'user', id],
    enabled: id !== null,
    queryFn: async () => {
      const { data } = await api.get<CurrentUser>(`/api/user/${id}`)
      return data
    },
  })
}

/** Possessions d'un investisseur (admin). */
export function useAdminPossessionsByUser(investisseurId: number | null) {
  return useQuery({
    queryKey: ['admin', 'possessions', investisseurId],
    enabled: investisseurId !== null,
    queryFn: async () => {
      const { data } = await api.get(`/api/marche-primaire/possessions/${investisseurId}`)
      return data as Array<{
        possessionId: number
        proprieteNom: string
        proprieteLocalisation: string
        nombreParts: number
        prixUnitairePart: number
        valeurTotale: number
        rentabilitePrevue: number
      }>
    },
  })
}

/** Transactions blockchain d'un investisseur (admin). */
export function useAdminTransactionsByUser(investisseurId: number | null) {
  return useQuery({
    queryKey: ['admin', 'transactions', investisseurId],
    enabled: investisseurId !== null,
    queryFn: async () => {
      const { data } = await api.get<TransactionResponse[]>(
        `/api/marche-primaire/transactions/${investisseurId}`
      )
      return data
    },
  })
}

/** Paiements d'un investisseur (admin). */
export function useAdminPaiementsByUser(investisseurId: number | null) {
  return useQuery({
    queryKey: ['admin', 'paiements', investisseurId],
    enabled: investisseurId !== null,
    queryFn: async () => {
      const { data } = await api.get<PaiementResponse[]>(
        `/api/marche-primaire/paiements/${investisseurId}`
      )
      return data
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
      qc.invalidateQueries({ queryKey: ['admin', 'distribution', 'preview'] })
    },
  })
}

/**
 * GET /api/distribution/{revenuId}/preview - calcule la repartition prevue sans persister.
 * Utile pour montrer a l'admin "voici ce qui va se passer" avant de cliquer "Distribuer".
 */
export function useDistributionPreview(revenuId: number | null) {
  return useQuery({
    queryKey: ['admin', 'distribution', 'preview', revenuId],
    enabled: revenuId !== null,
    queryFn: async () => {
      const { data } = await api.get<import('./types').DistributionPreview>(
        `/api/distribution/${revenuId}/preview`
      )
      return data
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

// =============================================================================
// Admin paiements (sessions PSP)
// =============================================================================

export function useAdminPaymentSessions(statut: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'FAILED' = 'FAILED') {
  return useQuery({
    queryKey: ['admin', 'payment-sessions', statut],
    queryFn: async () => {
      const { data } = await api.get<AdminPaymentSessionResponse[]>(
        `/api/admin/paiements?statut=${statut}`
      )
      return data
    },
  })
}

export function useRetryOnChain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: number) => {
      const { data } = await api.post<{ sessionId: number; status: string }>(
        `/api/admin/paiements/${sessionId}/retry-on-chain`
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'payment-sessions'] })
    },
  })
}

// =============================================================================
// Admin taux de devises (fiat -> USDC)
// =============================================================================

export function useAdminDeviseRates() {
  return useQuery({
    queryKey: ['admin', 'devise-rates'],
    queryFn: async () => {
      const { data } = await api.get<DeviseRate[]>('/api/admin/devise-rate')
      return data
    },
  })
}

export function useUpsertDeviseRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ code, tauxVersUsdc }: { code: string; tauxVersUsdc: number }) => {
      const { data } = await api.put<DeviseRate>(`/api/admin/devise-rate/${code}`, {
        tauxVersUsdc,
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'devise-rates'] })
    },
  })
}
