import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type {
  PeriodeTrimestrielleResponse,
  RevenuResponse,
  StatutDeclarationResponse,
  SubmissionRevenuRequest,
} from './types'

export function useMesRevenus() {
  return useQuery({
    queryKey: ['mes-revenus'],
    queryFn: async () => {
      const { data } = await api.get<RevenuResponse[]>('/api/revenus/me')
      return data
    },
  })
}

export function useRevenusParPropriete(proprieteId: number | undefined) {
  return useQuery({
    queryKey: ['revenus-propriete', proprieteId],
    queryFn: async () => {
      const { data } = await api.get<RevenuResponse[]>(
        `/api/revenus/propriete/${proprieteId}`
      )
      return data
    },
    enabled: proprieteId != null,
  })
}

export function useDeclarerRevenu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SubmissionRevenuRequest) => {
      const { data } = await api.post<RevenuResponse>(
        '/api/revenus/submissions',
        payload
      )
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['mes-revenus'] })
      qc.invalidateQueries({ queryKey: ['revenus-propriete', vars.proprieteId] })
      qc.invalidateQueries({ queryKey: ['mes-notifications'] })
    },
  })
}

export type DeclarerRevenuMultipartPayload = SubmissionRevenuRequest & {
  justificatif?: File | null
}

/** Variante multipart : ajoute le justificatif PDF/image à la soumission. */
export function useDeclarerRevenuMultipart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: DeclarerRevenuMultipartPayload) => {
      const fd = new FormData()
      fd.append('proprieteId', String(payload.proprieteId))
      fd.append('montantTotal', String(payload.montantTotal))
      if (payload.periodeDebut) fd.append('periodeDebut', payload.periodeDebut)
      if (payload.periodeFin) fd.append('periodeFin', payload.periodeFin)
      if (payload.justificatif) fd.append('justificatif', payload.justificatif)

      const { data } = await api.post<RevenuResponse>(
        '/api/revenus/submissions/multipart',
        fd,
        { headers: { 'Content-Type': undefined as unknown as string } }
      )
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['mes-revenus'] })
      qc.invalidateQueries({ queryKey: ['revenus-propriete', vars.proprieteId] })
      qc.invalidateQueries({ queryKey: ['mes-notifications'] })
    },
  })
}

// --- Phase 10b : statut de declaration ---

export function useStatutDeclaration(proprieteId: number | null | undefined) {
  return useQuery({
    queryKey: ['revenus', 'statut-declaration', proprieteId],
    enabled: proprieteId != null,
    queryFn: async () => {
      const { data } = await api.get<StatutDeclarationResponse>(
        `/api/revenus/propriete/${proprieteId}/statut-mois-courant`
      )
      return data
    },
  })
}

export function useMesStatutsDeclaration() {
  return useQuery({
    queryKey: ['revenus', 'me', 'statuts'],
    queryFn: async () => {
      const { data } = await api.get<StatutDeclarationResponse[]>('/api/revenus/me/statuts')
      return data
    },
  })
}

/**
 * V2 L (06/06/2026) : catalogue des trimestres declarables pour une propriete.
 * Utilise par le wizard de declaration (selecteur) et par la frise annuelle.
 */
export function usePeriodesTrimestres(proprieteId: number | null | undefined) {
  return useQuery({
    queryKey: ['revenus', 'periodes-trimestres', proprieteId],
    enabled: proprieteId != null,
    queryFn: async () => {
      const { data } = await api.get<PeriodeTrimestrielleResponse[]>(
        `/api/revenus/propriete/${proprieteId}/periodes-trimestres`
      )
      return data
    },
  })
}

export function useAdminStatutsDeclaration() {
  return useQuery({
    queryKey: ['admin', 'revenus', 'statuts'],
    queryFn: async () => {
      const { data } = await api.get<StatutDeclarationResponse[]>('/api/revenus/admin/statuts')
      return data
    },
  })
}

export function useUploadJustificatifRevenu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ revenuId, file }: { revenuId: number; file: File }) => {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post<RevenuResponse>(
        `/api/revenus/${revenuId}/justificatif`,
        fd,
        { headers: { 'Content-Type': undefined as unknown as string } }
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mes-revenus'] })
      qc.invalidateQueries({ queryKey: ['admin', 'revenus'] })
    },
  })
}
