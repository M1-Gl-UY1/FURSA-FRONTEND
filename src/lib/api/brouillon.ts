import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { CategorieDocument, DocumentLegal, PhotoStructuree } from './submissions'
import type { ProprieteResponse, SectionPhoto, SourceRevenu, StatutExploitation, TypeBien } from './types'

// =============================================================================
// DTO du PATCH : tous champs optionnels (parallele a BrouillonPatchRequest backend)
// =============================================================================

export type BrouillonPatch = Partial<{
  nom: string
  pays: string
  ville: string
  adressePrecise: string
  description: string

  typeBien: TypeBien
  nombrePieces: number
  nombreChambres: number
  superficieM2: number
  hasPiscine: boolean
  hasClimatisation: boolean
  hasParking: boolean
  hasAscenseur: boolean
  hasJardin: boolean
  hasVueMer: boolean
  /** V2 G.1 (04/06/2026) : equipements admin-configurables. Prime sur les hasXxx si fourni. */
  equipementsCodes: string[]

  statutExploitation: StatutExploitation
  dateLivraisonPrevue: string
  revenuMensuelActuel: number
  sourceRevenu: SourceRevenu

  prixVenteTotal: number
  deviseLocale: string
  fractionVenduePct: number
  nombreTotalPart: number
  prixUnitairePart: number
  rentabilitePrevue: number
}>

// =============================================================================
// CRUD brouillon
// =============================================================================

/**
 * Cree un brouillon vide cote serveur. Renvoie l'id. Appele a l'arrivee sur le
 * wizard quand l'user n'a pas encore d'id (route /proposer-un-bien).
 */
export function useCreerBrouillon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ProprieteResponse>('/api/proprietes/brouillon')
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mes-brouillons'] })
    },
  })
}

/**
 * Update partiel : envoie uniquement les champs renseignes. Appele a chaque clic
 * Continuer du wizard (debounce optionnel cote front).
 */
export function usePatcherBrouillon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: BrouillonPatch }) => {
      const { data } = await api.patch<ProprieteResponse>(
        `/api/proprietes/brouillon/${id}`,
        patch
      )
      return data
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['brouillon', id] })
      qc.invalidateQueries({ queryKey: ['mes-brouillons'] })
    },
  })
}

/**
 * Upload N photos avec leur section (FACADE, SALON, ...). Upload immediat des
 * que l'user les ajoute dans le wizard.
 */
export function useAjouterPhotosBrouillon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, photos }: { id: number; photos: PhotoStructuree[] }) => {
      const fd = new FormData()
      photos.forEach((p) => {
        fd.append('photos', p.file)
        fd.append('sections', p.section)
      })
      const { data } = await api.post<ProprieteResponse>(
        `/api/proprietes/brouillon/${id}/photos`,
        fd,
        { headers: { 'Content-Type': undefined as unknown as string } }
      )
      return data
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['brouillon', id] })
    },
  })
}

/**
 * Set la video (remplace l'existante).
 */
export function useSetVideoBrouillon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, video, onProgress }: {
      id: number
      video: File
      onProgress?: (pct: number) => void
    }) => {
      const fd = new FormData()
      fd.append('video', video)
      const { data } = await api.post<ProprieteResponse>(
        `/api/proprietes/brouillon/${id}/video`,
        fd,
        {
          headers: { 'Content-Type': undefined as unknown as string },
          onUploadProgress: (evt) => {
            if (onProgress && evt.total) {
              onProgress(Math.round((evt.loaded / evt.total) * 100))
            }
          },
        }
      )
      return data
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['brouillon', id] })
    },
  })
}

/**
 * Upload N documents legaux categorises.
 */
export function useAjouterDocsBrouillon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, documents }: { id: number; documents: DocumentLegal[] }) => {
      const fd = new FormData()
      documents.forEach((d) => {
        fd.append('documents', d.file)
        fd.append('categories', d.categorie)
      })
      const { data } = await api.post<ProprieteResponse>(
        `/api/proprietes/brouillon/${id}/documents`,
        fd,
        { headers: { 'Content-Type': undefined as unknown as string } }
      )
      return data
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['brouillon', id] })
    },
  })
}

/**
 * Retire un media (photo, video ou document).
 */
export function useSupprimerMediaBrouillon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, mediaId }: { id: number; mediaId: number }) => {
      await api.delete(`/api/proprietes/brouillon/${id}/medias/${mediaId}`)
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['brouillon', id] })
    },
  })
}

/**
 * Etape finale : valide les regles metier + bascule en EN_REVIEW.
 * En cas d'erreur, le backend renvoie 400 avec un message explicite (champ manquant,
 * doc obligatoire absent, etc.) et le brouillon reste BROUILLON.
 */
export function useFinaliserBrouillon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<ProprieteResponse>(
        `/api/proprietes/brouillon/${id}/finaliser`
      )
      return data
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['brouillon', id] })
      qc.invalidateQueries({ queryKey: ['mes-brouillons'] })
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees'] })
    },
  })
}

/**
 * Supprime un brouillon definitivement.
 */
export function useSupprimerBrouillon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/proprietes/brouillon/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mes-brouillons'] })
    },
  })
}

/**
 * Liste tous mes brouillons en cours (statut BROUILLON uniquement).
 */
export function useMesBrouillons() {
  return useQuery({
    queryKey: ['mes-brouillons'],
    queryFn: async () => {
      const { data } = await api.get<ProprieteResponse[]>('/api/proprietes/brouillon/me')
      return data
    },
  })
}

/**
 * Detail d'un brouillon (utilise par la page de reprise).
 * Reuse l'endpoint /me/{id} existant qui renvoie le bien avec ses documents.
 */
export function useBrouillonDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['brouillon', id],
    queryFn: async () => {
      const { data } = await api.get<ProprieteResponse>(`/api/proprietes/me/${id}`)
      return data
    },
    enabled: id != null && Number.isFinite(id),
  })
}

// Re-export pour les consommateurs (wizard)
export type { CategorieDocument, DocumentLegal, PhotoStructuree, SectionPhoto }
