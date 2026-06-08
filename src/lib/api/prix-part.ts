import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type {
  BlockchainSyncTaskResponse,
  ConstantesFormulePrix,
  LedgerEventResponse,
  PrixPartDiagnosticResponse,
  SyncQueueStats,
} from './types'

// V2 R (07/06/2026)
export function useSyncQueueStats() {
  return useQuery({
    queryKey: ['admin', 'sync-queue', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<SyncQueueStats>('/api/admin/sync-queue/stats')
      return data
    },
    refetchInterval: 15_000,
  })
}

export function useSyncQueueList() {
  return useQuery({
    queryKey: ['admin', 'sync-queue', 'list'],
    queryFn: async () => {
      const { data } = await api.get<BlockchainSyncTaskResponse[]>('/api/admin/sync-queue')
      return data
    },
    refetchInterval: 15_000,
  })
}

export function useRetrySyncTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<BlockchainSyncTaskResponse>(
        `/api/admin/sync-queue/${id}/retry`
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'sync-queue'] })
    },
  })
}

// V2 Q (07/06/2026)
export function useLedgerStatus() {
  return useQuery({
    queryKey: ['admin', 'ledger', 'status'],
    queryFn: async () => {
      const { data } = await api.get<{ actif: boolean }>(
        '/api/admin/ledger/status'
      )
      return data
    },
    staleTime: 60 * 1000,
  })
}

export function useLedgerEvents(maxBlocks: number = 10000) {
  return useQuery({
    queryKey: ['admin', 'ledger', 'events', maxBlocks],
    queryFn: async () => {
      const { data } = await api.get<LedgerEventResponse[]>(
        '/api/admin/ledger/events',
        { params: { maxBlocks } }
      )
      return data
    },
  })
}

/**
 * V2 M (07/06/2026) : constantes du modele de prix dynamique
 * (lissage, caps, coef demande, plancher/plafond). Source unique :
 * PrixPartService cote backend.
 */
export function useConstantesPrixPart() {
  return useQuery({
    queryKey: ['admin', 'prix-parts', 'constantes'],
    queryFn: async () => {
      const { data } = await api.get<ConstantesFormulePrix>(
        '/api/admin/prix-parts/constantes'
      )
      return data
    },
    staleTime: 60 * 60 * 1000,
  })
}

/**
 * Diagnostic complet du prix d'un bien (admin) : formule, valeurs courantes,
 * bornes, constantes, historique des recalculs.
 */
export function useDiagnosticPrixPart(proprieteId: number | null | undefined) {
  return useQuery({
    queryKey: ['admin', 'prix-parts', 'diagnostic', proprieteId],
    enabled: proprieteId != null && !Number.isNaN(proprieteId),
    queryFn: async () => {
      const { data } = await api.get<PrixPartDiagnosticResponse>(
        `/api/admin/prix-parts/${proprieteId}/diagnostic`
      )
      return data
    },
  })
}
