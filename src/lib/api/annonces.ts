import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type {
  AchatAnnonceRequest,
  AchatAnnonceResponse,
  AnnonceRequest,
  AnnonceResponse,
  AnnonceUpdateRequest,
} from './types'

// Format de réponse Spring Page
type Page<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

// --- Listing paginé ---

type ListAnnoncesParams = {
  page?: number
  size?: number
  sort?: string  // ex: "prixUnitaireDemande,asc"
}

export function useAnnonces(params: ListAnnoncesParams = {}) {
  const { page = 0, size = 20, sort = 'id,desc' } = params
  return useQuery({
    queryKey: ['annonces', page, size, sort],
    queryFn: async () => {
      const { data } = await api.get<Page<AnnonceResponse>>('/api/annonces', {
        params: { page, size, sort },
      })
      return data
    },
  })
}

export function useMesAnnonces() {
  return useQuery({
    queryKey: ['mes-annonces'],
    queryFn: async () => {
      const { data } = await api.get<AnnonceResponse[]>('/api/annonces/me')
      return data
    },
  })
}

export function useAnnonce(id: number | undefined) {
  return useQuery({
    queryKey: ['annonce', id],
    queryFn: async () => {
      const { data } = await api.get<AnnonceResponse>(`/api/annonces/${id}`)
      return data
    },
    enabled: id != null,
  })
}

// --- Mutations ---

export function useCreerAnnonce() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AnnonceRequest) => {
      const { data } = await api.post<AnnonceResponse>('/api/annonces', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['annonces'] })
      qc.invalidateQueries({ queryKey: ['mes-annonces'] })
      qc.invalidateQueries({ queryKey: ['mes-possessions'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'me'] })
    },
  })
}

export function useModifierAnnonce() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { id: number; payload: AnnonceUpdateRequest }) => {
      const { data } = await api.put<AnnonceResponse>(
        `/api/annonces/${vars.id}`,
        vars.payload
      )
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['annonces'] })
      qc.invalidateQueries({ queryKey: ['mes-annonces'] })
      qc.invalidateQueries({ queryKey: ['annonce', vars.id] })
    },
  })
}

export function useAnnulerAnnonce() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete<AnnonceResponse>(`/api/annonces/${id}`)
      return data
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['annonces'] })
      qc.invalidateQueries({ queryKey: ['mes-annonces'] })
      qc.invalidateQueries({ queryKey: ['annonce', id] })
      qc.invalidateQueries({ queryKey: ['mes-possessions'] })
    },
  })
}

export function useAcheterAnnonce() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { annonceId: number; payload: AchatAnnonceRequest }) => {
      const { data } = await api.post<AchatAnnonceResponse>(
        `/api/marche-secondaire/annonces/${vars.annonceId}/acheter`,
        vars.payload
      )
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['annonces'] })
      qc.invalidateQueries({ queryKey: ['annonce', vars.annonceId] })
      qc.invalidateQueries({ queryKey: ['mes-possessions'] })
      qc.invalidateQueries({ queryKey: ['mes-transactions'] })
      qc.invalidateQueries({ queryKey: ['mes-paiements'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'me'] })
      qc.invalidateQueries({ queryKey: ['mes-notifications'] })
    },
  })
}
