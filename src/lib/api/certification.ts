import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { ProprieteResponse } from './types'

/**
 * Phase Certification (Hugh 22/05/2026) : upload des documents legaux,
 * soumission de la demande, et validation/refus admin.
 */

// =============================================================================
// Proprio
// =============================================================================

/** Upload de N documents PDF/image (titre foncier, contrat, etc.) */
export function useUploadDocsCertification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ proprieteId, documents }: { proprieteId: number; documents: File[] }) => {
      const fd = new FormData()
      documents.forEach((f) => fd.append('documents', f))
      const { data } = await api.post<ProprieteResponse>(
        `/api/proprietes/${proprieteId}/certification/documents`,
        fd,
        { headers: { 'Content-Type': undefined as unknown as string } }
      )
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees'] })
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees', vars.proprieteId] })
      qc.invalidateQueries({ queryKey: ['propriete', vars.proprieteId] })
    },
  })
}

/** Le proprio soumet sa demande de certification (apres uploads). */
export function useSoumettreCertification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (proprieteId: number) => {
      const { data } = await api.post<ProprieteResponse>(
        `/api/proprietes/${proprieteId}/certification/soumettre`
      )
      return data
    },
    onSuccess: (_d, proprieteId) => {
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees'] })
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees', proprieteId] })
      qc.invalidateQueries({ queryKey: ['propriete', proprieteId] })
      qc.invalidateQueries({ queryKey: ['admin', 'certifications', 'pending'] })
    },
  })
}

// =============================================================================
// Admin
// =============================================================================

export function useAdminCertificationsPending() {
  return useQuery({
    queryKey: ['admin', 'certifications', 'pending'],
    queryFn: async () => {
      const { data } = await api.get<ProprieteResponse[]>(
        '/api/proprietes/admin/certification/pending'
      )
      return data
    },
  })
}

export function useApprouverCertification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (proprieteId: number) => {
      const { data } = await api.post<ProprieteResponse>(
        `/api/proprietes/admin/${proprieteId}/certification/approuver`
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'certifications', 'pending'] })
      qc.invalidateQueries({ queryKey: ['proprietes'] })
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees'] })
    },
  })
}

export function useRefuserCertification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ proprieteId, motif }: { proprieteId: number; motif: string }) => {
      const { data } = await api.post<ProprieteResponse>(
        `/api/proprietes/admin/${proprieteId}/certification/refuser`,
        { motif }
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'certifications', 'pending'] })
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees'] })
    },
  })
}
