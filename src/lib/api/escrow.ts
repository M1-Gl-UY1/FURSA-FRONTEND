import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type {
  AchatRequest,
  AchatResponse,
  EscrowProprieteResponse,
  EscrowTransactionResponse,
} from './types'

// =============================================================================
// Achat via wallet (Phase 10c)
// =============================================================================

export type AcheterViaWalletPayload = AchatRequest & {
  idempotencyKey?: string
}

export function useAcheterViaWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AcheterViaWalletPayload) => {
      const { idempotencyKey, ...body } = payload
      const headers: Record<string, string> = {}
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
      const { data } = await api.post<AchatResponse>(
        '/api/marche-primaire/acheter-via-wallet',
        body,
        { headers }
      )
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['wallet', 'me'] })
      qc.invalidateQueries({ queryKey: ['wallet', 'me', 'stats'] })
      qc.invalidateQueries({ queryKey: ['wallet', 'me', 'transactions'] })
      qc.invalidateQueries({ queryKey: ['portefeuille'] })
      qc.invalidateQueries({ queryKey: ['propriete', vars.proprieteId] })
      qc.invalidateQueries({ queryKey: ['propriete', 'progression', vars.proprieteId] })
      qc.invalidateQueries({ queryKey: ['escrow', vars.proprieteId] })
    },
  })
}

// =============================================================================
// Escrow lookup
// =============================================================================

export function useEscrowPropriete(proprieteId: number | null | undefined) {
  return useQuery({
    queryKey: ['escrow', proprieteId],
    enabled: proprieteId != null,
    queryFn: async () => {
      const { data } = await api.get<EscrowProprieteResponse>(
        `/api/escrow/propriete/${proprieteId}`
      )
      return data
    },
  })
}

export function useEscrowTransactions(proprieteId: number | null | undefined) {
  return useQuery({
    queryKey: ['escrow', proprieteId, 'transactions'],
    enabled: proprieteId != null,
    queryFn: async () => {
      const { data } = await api.get<EscrowTransactionResponse[]>(
        `/api/escrow/propriete/${proprieteId}/transactions`
      )
      return data
    },
  })
}

export function useAdminEscrows() {
  return useQuery({
    queryKey: ['admin', 'escrows'],
    queryFn: async () => {
      const { data } = await api.get<EscrowProprieteResponse[]>('/api/escrow')
      return data
    },
  })
}

// =============================================================================
// Phase 10c bis : annulation manuelle admin
// =============================================================================

export function useAnnulerCollecte() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ proprieteId, motif }: { proprieteId: number; motif: string }) => {
      const { data } = await api.post<EscrowProprieteResponse>(
        `/api/escrow/propriete/${proprieteId}/annuler`,
        { motif }
      )
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'escrows'] })
      qc.invalidateQueries({ queryKey: ['escrow', vars.proprieteId] })
      qc.invalidateQueries({ queryKey: ['admin', 'wallets'] })
    },
  })
}
