/**
 * V2 G.3 (04/06/2026) : types de bien admin-configurables.
 *
 * - GET /api/types-bien         : public, actifs (utilise par le wizard)
 * - GET /api/types-bien/admin   : tous (admin)
 * - POST/PUT/DELETE /api/types-bien/admin : CRUD admin
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'

export type TypeBienResponse = {
  id: number
  code: string
  label: string
  icone: string | null
  ordre: number
  actif: boolean
  /** Pilote l'affichage du champ "Nb chambres" dans le wizard. */
  exigeChambres: boolean
}

export type TypeBienRequest = {
  code: string
  label: string
  icone?: string | null
  ordre?: number | null
  actif?: boolean | null
  exigeChambres?: boolean | null
}

const BASE = '/api/types-bien'
const KEY_PUBLIC = ['types-bien', 'actifs'] as const
const KEY_ADMIN = ['types-bien', 'admin'] as const

export async function fetchTypesBien(): Promise<TypeBienResponse[]> {
  const { data } = await api.get<TypeBienResponse[]>(BASE)
  return data
}

export async function fetchAdminTypesBien(): Promise<TypeBienResponse[]> {
  const { data } = await api.get<TypeBienResponse[]>(`${BASE}/admin`)
  return data
}

/** Hook public : types actifs (pour le wizard de proposition). */
export function useTypesBien() {
  return useQuery({
    queryKey: KEY_PUBLIC,
    queryFn: fetchTypesBien,
    staleTime: 10 * 60_000,
  })
}

/** Hook admin : tous les types (actifs + inactifs). */
export function useAdminTypesBien() {
  return useQuery({
    queryKey: KEY_ADMIN,
    queryFn: fetchAdminTypesBien,
    staleTime: 30_000,
  })
}

export function useCreerTypeBien() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (req: TypeBienRequest) => {
      const { data } = await api.post<TypeBienResponse>(`${BASE}/admin`, req)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ADMIN })
      qc.invalidateQueries({ queryKey: KEY_PUBLIC })
    },
  })
}

export function useModifierTypeBien() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: number; req: TypeBienRequest }) => {
      const { data } = await api.put<TypeBienResponse>(`${BASE}/admin/${args.id}`, args.req)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ADMIN })
      qc.invalidateQueries({ queryKey: KEY_PUBLIC })
    },
  })
}

export function useDesactiverTypeBien() {
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

export function useSupprimerTypeBien() {
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
