import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

/**
 * Hook admin : liste TOUTES les proprietes (sauf BROUILLON) avec tous les statuts.
 * Endpoint protege par ROLE_ADMIN. A utiliser dans AdminProprietesPage pour voir
 * les biens EN_REVIEW, ACCEPTEE, EN_TOKENISATION, REFUSEE en plus des PUBLIEE.
 */
export function useAdminProprietes() {
  return useQuery({
    queryKey: ['proprietes', 'admin'],
    queryFn: async () => {
      const { data } = await api.get<ProprieteResponse[]>('/api/proprietes/admin/all')
      return data
    },
  })
}

/**
 * Hook : modifier ma propriete (proposeur). Le backend filtre les champs
 * autorises selon le statut : EN_REVIEW/ACCEPTEE -> tout sauf prix/parts ;
 * EN_TOKENISATION/PUBLIEE -> nom + description uniquement ; REFUSEE -> bloque ;
 * BROUILLON -> utiliser PATCH /brouillon/{id}.
 */
export function useModifierMaPropriete() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: import('./brouillon').BrouillonPatch }) => {
      const { data } = await api.patch<ProprieteResponse>(
        `/api/proprietes/me/${id}`,
        patch
      )
      return data
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['propriete', id] })
      qc.invalidateQueries({ queryKey: ['ma-propriete-proposee', id] })
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees'] })
    },
  })
}

/**
 * V2 G.7 (05/06/2026) : ajout de photos a un bien deja accepte / tokenise / publie.
 * Le bien doit appartenir au caller (verifie cote backend). Refuse si statut
 * EN_REVIEW ou REFUSEE.
 */
export function useAjouterPhotosPostTokenisation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      proprieteId: number
      photos: File[]
      sections: string[]
    }) => {
      const formData = new FormData()
      for (const photo of args.photos) {
        formData.append('photos', photo)
      }
      for (const section of args.sections) {
        formData.append('sections', section)
      }
      const { data } = await api.post<ProprieteResponse>(
        `/api/proprietes/${args.proprieteId}/medias/photos`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return data
    },
    onSuccess: (_d, args) => {
      qc.invalidateQueries({ queryKey: ['propriete', args.proprieteId] })
      qc.invalidateQueries({ queryKey: ['ma-propriete-proposee', args.proprieteId] })
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees'] })
    },
  })
}

/**
 * Hook admin detail : accede a une propriete quel que soit son statut.
 * Polling auto tant que EN_TOKENISATION (cf usePropriete classique).
 */
export function useAdminPropriete(id: number | undefined) {
  return useQuery({
    queryKey: ['propriete', 'admin', id],
    queryFn: async () => {
      const { data } = await api.get<ProprieteResponse>(`/api/proprietes/admin/${id}`)
      return data
    },
    enabled: id != null && Number.isFinite(id),
    refetchInterval: (query) =>
      query.state.data?.statut === 'EN_TOKENISATION' ? 5000 : false,
    refetchIntervalInBackground: false,
  })
}

/**
 * Hook propriete avec polling automatique tant que le bien est en EN_TOKENISATION.
 * Permet a l'UI admin de basculer en PUBLIEE des que le worker backend a confirme
 * le receipt blockchain (~15-60s apres le clic "Valider").
 */
export function usePropriete(id: number | undefined) {
  return useQuery({
    queryKey: ['propriete', id],
    queryFn: () => fetchPropriete(id!),
    enabled: id != null,
    refetchInterval: (query) =>
      query.state.data?.statut === 'EN_TOKENISATION' ? 5000 : false,
    refetchIntervalInBackground: false,
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
