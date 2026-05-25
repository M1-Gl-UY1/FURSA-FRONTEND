import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { ListeAttenteRequest, ListeAttenteResponse } from './types'

const BASE = '/api/liste-attente'

// --- Fonctions brutes ---

export async function inscrireListeAttente(
  req: ListeAttenteRequest
): Promise<ListeAttenteResponse> {
  const { data } = await api.post<ListeAttenteResponse>(BASE, req)
  return data
}

export async function desinscrireListeAttente(id: number): Promise<ListeAttenteResponse> {
  const { data } = await api.delete<ListeAttenteResponse>(`${BASE}/${id}`)
  return data
}

export async function fetchMesInscriptions(): Promise<ListeAttenteResponse[]> {
  const { data } = await api.get<ListeAttenteResponse[]>(`${BASE}/me`)
  return data
}

export async function fetchFilePropriete(
  proprieteId: number
): Promise<ListeAttenteResponse[]> {
  const { data } = await api.get<ListeAttenteResponse[]>(
    `${BASE}/propriete/${proprieteId}`
  )
  return data
}

// --- Hooks ---

export function useMesInscriptions(enabled = true) {
  return useQuery({
    queryKey: ['liste-attente', 'me'],
    queryFn: fetchMesInscriptions,
    enabled,
  })
}

export function useFilePropriete(proprieteId: number | undefined) {
  return useQuery({
    queryKey: ['liste-attente', 'propriete', proprieteId],
    queryFn: () => fetchFilePropriete(proprieteId!),
    enabled: proprieteId != null,
  })
}

export function useInscrireListeAttente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: inscrireListeAttente,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['liste-attente'] })
      qc.invalidateQueries({ queryKey: ['propriete', vars.proprieteId] })
      qc.invalidateQueries({
        queryKey: ['propriete', vars.proprieteId, 'historique-prix'],
      })
    },
  })
}

export function useDesinscrireListeAttente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: desinscrireListeAttente,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['liste-attente'] })
      qc.invalidateQueries({ queryKey: ['propriete', data.proprieteId] })
      qc.invalidateQueries({
        queryKey: ['propriete', data.proprieteId, 'historique-prix'],
      })
    },
  })
}
