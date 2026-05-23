import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type {
  KycAdminResponse,
  KycMeResponse,
  KycStats,
  KycSubmissionResponse,
  KycSubmitData,
  StatutKyc,
} from './types'

// =============================================================================
// Investisseur
// =============================================================================

export function useKycMe() {
  return useQuery({
    queryKey: ['kyc', 'me'],
    queryFn: async () => {
      const { data } = await api.get<KycMeResponse>('/api/kyc/me')
      return data
    },
  })
}

export function useKycHistory() {
  return useQuery({
    queryKey: ['kyc', 'me', 'history'],
    queryFn: async () => {
      const { data } = await api.get<KycSubmissionResponse[]>('/api/kyc/me/history')
      return data
    },
  })
}

export function useKycSubmit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      data: KycSubmitData
      documentIdentite: File
      documentDomicile: File
      selfie: File
    }) => {
      const form = new FormData()
      form.append('data', new Blob([JSON.stringify(input.data)], { type: 'application/json' }))
      form.append('documentIdentite', input.documentIdentite)
      form.append('documentDomicile', input.documentDomicile)
      form.append('selfie', input.selfie)
      const { data } = await api.post<KycSubmissionResponse>('/api/kyc/submit', form, {
        // Bug fix : passer undefined pour que axios calcule le boundary du FormData.
        // Forcer "multipart/form-data" sans boundary casse le parsing cote backend.
        headers: { 'Content-Type': undefined as unknown as string },
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kyc'] })
    },
  })
}

// =============================================================================
// Admin
// =============================================================================

export function useAdminKycStats() {
  return useQuery({
    queryKey: ['admin', 'kyc', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<KycStats>('/api/admin/kyc/stats')
      return data
    },
  })
}

export function useAdminKycList(statut: StatutKyc = 'PENDING') {
  return useQuery({
    queryKey: ['admin', 'kyc', 'list', statut],
    queryFn: async () => {
      const { data } = await api.get<KycAdminResponse[]>(`/api/admin/kyc?statut=${statut}`)
      return data
    },
  })
}

export function useAdminKycDetail(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'kyc', 'detail', id],
    enabled: id !== null,
    queryFn: async () => {
      const { data } = await api.get<KycAdminResponse>(`/api/admin/kyc/${id}`)
      return data
    },
  })
}

export function useAdminKycApprove() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<KycAdminResponse>(`/api/admin/kyc/${id}/approve`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'kyc'] })
      qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] })
    },
  })
}

export function useAdminKycReject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, motif }: { id: number; motif: string }) => {
      const { data } = await api.post<KycAdminResponse>(`/api/admin/kyc/${id}/reject`, { motif })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'kyc'] })
    },
  })
}
