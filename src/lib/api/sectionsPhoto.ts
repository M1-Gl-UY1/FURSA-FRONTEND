/**
 * V2 G.4 (05/06/2026) : sections photos admin-configurables.
 *
 * - GET /api/sections-photo         : public, actives (utilise par le wizard)
 * - GET /api/sections-photo/admin   : toutes (admin)
 * - POST/PUT/DELETE /api/sections-photo/admin : CRUD admin
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'

export type SectionPhotoResponse = {
  id: number
  code: string
  label: string
  icone: string | null
  ordre: number
  actif: boolean
  /** Si true, au moins une photo dans cette section est requise dans le wizard. */
  requise: boolean
}

export type SectionPhotoRequest = {
  code: string
  label: string
  icone?: string | null
  ordre?: number | null
  actif?: boolean | null
  requise?: boolean | null
}

const BASE = '/api/sections-photo'
const KEY_PUBLIC = ['sections-photo', 'actives'] as const
const KEY_ADMIN = ['sections-photo', 'admin'] as const

export async function fetchSectionsPhoto(): Promise<SectionPhotoResponse[]> {
  const { data } = await api.get<SectionPhotoResponse[]>(BASE)
  return data
}

export async function fetchAdminSectionsPhoto(): Promise<SectionPhotoResponse[]> {
  const { data } = await api.get<SectionPhotoResponse[]>(`${BASE}/admin`)
  return data
}

/** Hook public : sections actives (pour le wizard de proposition). */
export function useSectionsPhoto() {
  return useQuery({
    queryKey: KEY_PUBLIC,
    queryFn: fetchSectionsPhoto,
    staleTime: 10 * 60_000,
  })
}

/** Hook admin : toutes les sections (actives + inactives). */
export function useAdminSectionsPhoto() {
  return useQuery({
    queryKey: KEY_ADMIN,
    queryFn: fetchAdminSectionsPhoto,
    staleTime: 30_000,
  })
}

export function useCreerSectionPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (req: SectionPhotoRequest) => {
      const { data } = await api.post<SectionPhotoResponse>(`${BASE}/admin`, req)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ADMIN })
      qc.invalidateQueries({ queryKey: KEY_PUBLIC })
    },
  })
}

export function useModifierSectionPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: number; req: SectionPhotoRequest }) => {
      const { data } = await api.put<SectionPhotoResponse>(
        `${BASE}/admin/${args.id}`, args.req
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ADMIN })
      qc.invalidateQueries({ queryKey: KEY_PUBLIC })
    },
  })
}

export function useDesactiverSectionPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`${BASE}/admin/${id}/desactiver`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ADMIN })
      qc.invalidateQueries({ queryKey: KEY_PUBLIC })
    },
  })
}

export function useSupprimerSectionPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE}/admin/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ADMIN })
      qc.invalidateQueries({ queryKey: KEY_PUBLIC })
    },
  })
}
