import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type {
  AchatRequest,
  PaymentInitResponse,
  PaymentSessionStatusResponse,
} from './types'

/**
 * POST /api/paiements/init — Cree une session de paiement chez le PSP.
 * Idempotency-Key header recommande (UUID v4 par tentative) pour resister aux double-clics.
 */
export async function initierPaiement(
  payload: AchatRequest,
  idempotencyKey?: string
): Promise<PaymentInitResponse> {
  const { data } = await api.post<PaymentInitResponse>('/api/paiements/init', payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  })
  return data
}

export function useInitierPaiement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: AchatRequest
      idempotencyKey?: string
    }) => initierPaiement(payload, idempotencyKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proprietes'] })
    },
  })
}

/**
 * GET /api/paiements/session/{id} — Consulte le statut d'une session.
 * Hook avec polling toutes les {pollIntervalMs}ms tant que statut == PENDING.
 */
export function useSessionStatus(sessionId: number | null, options?: { pollIntervalMs?: number }) {
  const pollMs = options?.pollIntervalMs ?? 10_000
  return useQuery({
    queryKey: ['payment-session', sessionId],
    enabled: sessionId !== null,
    queryFn: async () => {
      const { data } = await api.get<PaymentSessionStatusResponse>(
        `/api/paiements/session/${sessionId}`
      )
      return data
    },
    // Poll uniquement tant que PENDING. Arret sur statut terminal.
    refetchInterval: (query) => {
      const statut = query.state.data?.statut
      if (statut === 'CONFIRMED' || statut === 'EXPIRED' || statut === 'FAILED') {
        return false
      }
      return pollMs
    },
    refetchIntervalInBackground: true,
  })
}
