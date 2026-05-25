import { useQuery } from '@tanstack/react-query'

import { api } from './client'
import type { HistoriquePrixPartResponse, ProgressionResponse, ProprieteResponse } from './types'

// --- Fonctions brutes ---

export async function fetchProprietes(): Promise<ProprieteResponse[]> {
  const { data } = await api.get<ProprieteResponse[]>('/api/proprietes/public')
  return data
}

export async function fetchPropriete(id: number): Promise<ProprieteResponse> {
  const { data } = await api.get<ProprieteResponse>(`/api/proprietes/public/${id}`)
  return data
}

export async function fetchProgression(id: number): Promise<ProgressionResponse> {
  const { data } = await api.get<ProgressionResponse>(`/api/proprietes/public/${id}/progression`)
  return data
}

// --- Hooks TanStack Query ---

export function useProprietes() {
  return useQuery({
    queryKey: ['proprietes'],
    queryFn: fetchProprietes,
  })
}

export function usePropriete(id: number | undefined) {
  return useQuery({
    queryKey: ['propriete', id],
    queryFn: () => fetchPropriete(id!),
    enabled: id != null,
  })
}

export function useProgression(id: number | undefined) {
  return useQuery({
    queryKey: ['progression', id],
    queryFn: () => fetchProgression(id!),
    enabled: id != null,
  })
}

// P1 (Hugh 22/05/2026) : prix dynamique. Voir PRIX_DYNAMIQUE_FURSA.md.

export async function fetchHistoriquePrix(id: number): Promise<HistoriquePrixPartResponse[]> {
  const { data } = await api.get<HistoriquePrixPartResponse[]>(
    `/api/proprietes/${id}/historique-prix`
  )
  return data
}

export function useHistoriquePrix(id: number | undefined) {
  return useQuery({
    queryKey: ['propriete', id, 'historique-prix'],
    queryFn: () => fetchHistoriquePrix(id!),
    enabled: id != null,
    staleTime: 60_000,
  })
}

/**
 * Variation entre le prix courant et le prix initial, en pourcentage.
 * Retourne null si le prix initial n'est pas defini (bien anterieur a P1).
 */
export function calculateVariationPrix(p: ProprieteResponse): number | null {
  const initial = p.prixInitialPart
  const courant = p.prixUnitairePart
  if (initial == null || initial <= 0 || courant == null) return null
  return ((courant - initial) / initial) * 100
}

// --- Helpers ---

export function calculatePartsVendues(p: ProprieteResponse): number {
  const total = p.nombreTotalPart ?? p.partsTotales ?? 0
  return Math.max(0, total - (p.partsDisponibles ?? 0))
}

export function calculatePourcentageVendu(p: ProprieteResponse): number {
  const total = p.nombreTotalPart ?? p.partsTotales ?? 0
  if (total <= 0) return 0
  return Math.round((calculatePartsVendues(p) / total) * 100)
}
