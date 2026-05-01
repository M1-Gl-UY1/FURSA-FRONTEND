import { useQuery } from '@tanstack/react-query'

import { api } from './client'
import type {
  PaiementResponse,
  PossessionResponse,
  TransactionResponse,
} from './types'

export function useMesPossessions() {
  return useQuery({
    queryKey: ['mes-possessions'],
    queryFn: async () => {
      const { data } = await api.get<PossessionResponse[]>(
        '/api/marche-primaire/me/possessions'
      )
      return data
    },
  })
}

export function useMesTransactions() {
  return useQuery({
    queryKey: ['mes-transactions'],
    queryFn: async () => {
      const { data } = await api.get<TransactionResponse[]>(
        '/api/marche-primaire/me/transactions'
      )
      return data
    },
  })
}

export function useMesPaiements() {
  return useQuery({
    queryKey: ['mes-paiements'],
    queryFn: async () => {
      const { data } = await api.get<PaiementResponse[]>(
        '/api/marche-primaire/me/paiements'
      )
      return data
    },
  })
}
