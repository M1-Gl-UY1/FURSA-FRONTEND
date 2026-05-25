import { useQuery } from '@tanstack/react-query'

import { api } from './client'
import type { PartenaireGestionResponse, TypePartenaire } from './types'

const BASE = '/api/partenaires-gestion'

export async function fetchPartenaires(
  type?: TypePartenaire
): Promise<PartenaireGestionResponse[]> {
  const { data } = await api.get<PartenaireGestionResponse[]>(BASE, {
    params: type ? { type } : undefined,
  })
  return data
}

export function usePartenaires(type?: TypePartenaire) {
  return useQuery({
    queryKey: ['partenaires-gestion', type ?? 'all'],
    queryFn: () => fetchPartenaires(type),
    staleTime: 5 * 60_000,
  })
}
