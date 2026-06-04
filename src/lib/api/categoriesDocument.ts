/**
 * V2 G.2 (04/06/2026) : categories de document admin-configurables.
 *
 * - GET /api/categories-document         : public, actives (utilise par le wizard)
 * - GET /api/categories-document/admin   : toutes (admin)
 * - POST/PUT/DELETE /api/categories-document/admin : CRUD admin
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'

export type RegleObligationDoc =
  | 'TOUJOURS'
  | 'SI_NEUF_OU_CONSTRUCTION'
  | 'SI_DEJA_RENTABLE'
  | 'OPTIONNEL'

export type CategorieDocumentResponse = {
  id: number
  code: string
  label: string
  description: string | null
  icone: string | null
  ordre: number
  actif: boolean
  regleObligation: RegleObligationDoc
}

export type CategorieDocumentRequest = {
  code: string
  label: string
  description?: string | null
  icone?: string | null
  ordre?: number | null
  actif?: boolean | null
  regleObligation?: RegleObligationDoc | null
}

const BASE = '/api/categories-document'
const KEY_PUBLIC = ['categories-document', 'actives'] as const
const KEY_ADMIN = ['categories-document', 'admin'] as const

export async function fetchCategoriesDocument(): Promise<CategorieDocumentResponse[]> {
  const { data } = await api.get<CategorieDocumentResponse[]>(BASE)
  return data
}

export async function fetchAdminCategoriesDocument(): Promise<CategorieDocumentResponse[]> {
  const { data } = await api.get<CategorieDocumentResponse[]>(`${BASE}/admin`)
  return data
}

/** Hook public : categories actives (pour le wizard de proposition). */
export function useCategoriesDocument() {
  return useQuery({
    queryKey: KEY_PUBLIC,
    queryFn: fetchCategoriesDocument,
    staleTime: 10 * 60_000,
  })
}

/** Hook admin : toutes les categories (actives + inactives). */
export function useAdminCategoriesDocument() {
  return useQuery({
    queryKey: KEY_ADMIN,
    queryFn: fetchAdminCategoriesDocument,
    staleTime: 30_000,
  })
}

export function useCreerCategorieDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (req: CategorieDocumentRequest) => {
      const { data } = await api.post<CategorieDocumentResponse>(`${BASE}/admin`, req)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ADMIN })
      qc.invalidateQueries({ queryKey: KEY_PUBLIC })
    },
  })
}

export function useModifierCategorieDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: number; req: CategorieDocumentRequest }) => {
      const { data } = await api.put<CategorieDocumentResponse>(
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

export function useDesactiverCategorieDocument() {
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

export function useSupprimerCategorieDocument() {
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
