import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type {
  AjustementWalletRequest,
  TypeWalletTransaction,
  WalletResponse,
  WalletStats,
  WalletTransactionResponse,
} from './types'

// =============================================================================
// User-side hooks (/api/wallet/me)
// =============================================================================

export function useMyWallet() {
  return useQuery({
    queryKey: ['wallet', 'me'],
    queryFn: async () => {
      const { data } = await api.get<WalletResponse>('/api/wallet/me')
      return data
    },
  })
}

export function useMyWalletStats() {
  return useQuery({
    queryKey: ['wallet', 'me', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<WalletStats>('/api/wallet/me/stats')
      return data
    },
  })
}

export type WalletTxFilter = {
  type?: TypeWalletTransaction | null
  from?: string | null
  to?: string | null
}

export function useMyWalletTransactions(filter: WalletTxFilter = {}) {
  return useQuery({
    queryKey: ['wallet', 'me', 'transactions', filter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter.type) params.append('type', filter.type)
      if (filter.from) params.append('from', filter.from)
      if (filter.to) params.append('to', filter.to)
      const qs = params.toString()
      const url = qs ? `/api/wallet/me/transactions?${qs}` : '/api/wallet/me/transactions'
      const { data } = await api.get<WalletTransactionResponse[]>(url)
      return data
    },
  })
}

// =============================================================================
// Admin-side hooks (/api/admin/wallets)
// =============================================================================

export function useAdminWallets() {
  return useQuery({
    queryKey: ['admin', 'wallets'],
    queryFn: async () => {
      const { data } = await api.get<WalletResponse[]>('/api/admin/wallets')
      return data
    },
  })
}

export function useAdminWalletByUser(userId: number | null) {
  return useQuery({
    queryKey: ['admin', 'wallets', 'user', userId],
    enabled: userId != null,
    queryFn: async () => {
      const { data } = await api.get<WalletResponse>(`/api/admin/wallets/user/${userId}`)
      return data
    },
  })
}

export function useAdminWalletTransactions(userId: number | null) {
  return useQuery({
    queryKey: ['admin', 'wallets', 'user', userId, 'transactions'],
    enabled: userId != null,
    queryFn: async () => {
      const { data } = await api.get<WalletTransactionResponse[]>(
        `/api/admin/wallets/user/${userId}/transactions`
      )
      return data
    },
  })
}

export function useAjusterWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: number
      payload: AjustementWalletRequest
    }) => {
      const { data } = await api.post<WalletTransactionResponse>(
        `/api/admin/wallets/user/${userId}/ajuster`,
        payload
      )
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'wallets'] })
      qc.invalidateQueries({ queryKey: ['admin', 'wallets', 'user', vars.userId] })
      qc.invalidateQueries({ queryKey: ['wallet', 'me'] })
    },
  })
}

// =============================================================================
// Helpers UI : metadata d'affichage par type de mouvement
// =============================================================================

export type WalletTxDisplay = {
  label: string
  description: string
  /** Tailwind text color class */
  color: string
  /** Direction : credit (+) ou debit (-) ou neutre */
  direction: 'credit' | 'debit' | 'neutral'
}

export const WALLET_TX_DISPLAY: Record<TypeWalletTransaction, WalletTxDisplay> = {
  TOPUP: {
    label: 'Recharge',
    description: 'Recharge du wallet via Mobile Money / virement',
    color: 'text-success',
    direction: 'credit',
  },
  DEBIT_ACHAT_PARTS: {
    label: 'Achat parts',
    description: 'Achat de parts sur le marché primaire',
    color: 'text-warning',
    direction: 'debit',
  },
  DEBIT_ACHAT_REVENTE: {
    label: 'Achat (revente)',
    description: 'Achat sur le marché secondaire',
    color: 'text-warning',
    direction: 'debit',
  },
  CREDIT_DIVIDENDE: {
    label: 'Dividende',
    description: 'Dividende reçu suite à une distribution',
    color: 'text-success',
    direction: 'credit',
  },
  CREDIT_VENTE_PARTS: {
    label: 'Vente parts',
    description: 'Fonds débloqués suite à la vente de parts d\'une propriété',
    color: 'text-success',
    direction: 'credit',
  },
  CREDIT_REVENTE: {
    label: 'Revente',
    description: 'Revente sur le marché secondaire',
    color: 'text-success',
    direction: 'credit',
  },
  CREDIT_REFUND_ACHAT: {
    label: 'Remboursement',
    description: 'Remboursement (collecte propriété annulée)',
    color: 'text-ocean',
    direction: 'credit',
  },
  DEBIT_WITHDRAW: {
    label: 'Retrait',
    description: 'Retrait vers Mobile Money / virement / crypto',
    color: 'text-warning',
    direction: 'debit',
  },
  AJUSTEMENT_ADMIN: {
    label: 'Ajustement admin',
    description: 'Ajustement manuel par un administrateur',
    color: 'text-earth-600',
    direction: 'neutral',
  },
}
