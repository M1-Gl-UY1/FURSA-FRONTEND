/**
 * V2 G.1 (04/06/2026) : equipements admin-configurables.
 *
 * - GET /api/equipements         : public, actifs (utilise par le wizard)
 * - GET /api/equipements/admin   : tous (admin)
 * - POST/PUT/DELETE /api/equipements/admin : CRUD admin
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'

export type EquipementResponse = {
  id: number
  code: string
  label: string
  icone: string | null
  ordre: number
  actif: boolean
}

export type EquipementRequest = {
  code: string
  label: string
  icone?: string | null
  ordre?: number | null
  actif?: boolean | null
}

const BASE = '/api/equipements'
const KEY_PUBLIC = ['equipements', 'actifs'] as const
const KEY_ADMIN = ['equipements', 'admin'] as const

export async function fetchEquipements(): Promise<EquipementResponse[]> {
  const { data } = await api.get<EquipementResponse[]>(BASE)
  return data
}

export async function fetchAdminEquipements(): Promise<EquipementResponse[]> {
  const { data } = await api.get<EquipementResponse[]>(`${BASE}/admin`)
  return data
}

/** Hook public : equipements actifs (pour le wizard de proposition). */
export function useEquipements() {
  return useQuery({
    queryKey: KEY_PUBLIC,
    queryFn: fetchEquipements,
    staleTime: 10 * 60_000,
  })
}

/** Hook admin : tous les equipements (actifs + inactifs). */
export function useAdminEquipements() {
  return useQuery({
    queryKey: KEY_ADMIN,
    queryFn: fetchAdminEquipements,
    staleTime: 30_000,
  })
}

export function useCreerEquipement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (req: EquipementRequest) => {
      const { data } = await api.post<EquipementResponse>(`${BASE}/admin`, req)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ADMIN })
      qc.invalidateQueries({ queryKey: KEY_PUBLIC })
    },
  })
}

export function useModifierEquipement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: number; req: EquipementRequest }) => {
      const { data } = await api.put<EquipementResponse>(`${BASE}/admin/${args.id}`, args.req)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ADMIN })
      qc.invalidateQueries({ queryKey: KEY_PUBLIC })
    },
  })
}

export function useDesactiverEquipement() {
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

export function useSupprimerEquipement() {
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
