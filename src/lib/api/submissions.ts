import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type {
  ProprieteResponse,
  SectionPhoto,
  SubmissionRequest,
} from './types'

// =============================================================================
// Listing mes proprietes proposees
// =============================================================================

export function useMesProprietesProposees() {
  return useQuery({
    queryKey: ['mes-proprietes-proposees'],
    queryFn: async () => {
      const { data } = await api.get<ProprieteResponse[]>('/api/proprietes/me')
      return data
    },
  })
}

export function useMaProprieteProposee(id: number | undefined) {
  return useQuery({
    queryKey: ['mes-proprietes-proposees', id],
    enabled: id != null,
    queryFn: async () => {
      const { data } = await api.get<ProprieteResponse>(`/api/proprietes/me/${id}`)
      return data
    },
  })
}

// =============================================================================
// Soumission nouveau bien (refonte Hugh 22/05/2026)
// =============================================================================

export type PhotoStructuree = {
  file: File
  section: SectionPhoto
}

/** Catégories possibles de documents légaux (cf énum CategorieDocument backend). */
export type CategorieDocument =
  | 'TITRE_FONCIER'
  | 'PERMIS_CONSTRUIRE'
  | 'CONTRAT_GESTION'
  | 'CONTRAT_BAIL'
  | 'RELEVE_AIRBNB'
  | 'AUTRE'

export type DocumentLegal = {
  file: File
  categorie: CategorieDocument
}

export type SoumissionPayload = {
  submission: SubmissionRequest
  /** Photos structurees par section (Facade, Salon, Chambre, ...). */
  photos?: PhotoStructuree[]
  /** Video de visite guidee (max 100 MB). */
  video?: File | null
  /** Documents legaux categorises (titre foncier, permis, contrat gestion/bail, ...). */
  documents?: DocumentLegal[]
  /** Callback de progression d'upload (0-100). Pour la barre de chargement. */
  onProgress?: (percent: number) => void
}

export function useSoumettreBien() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: SoumissionPayload) => {
      const formData = new FormData()

      // 1. JSON principal (content-type application/json)
      formData.append(
        'submission',
        new Blob([JSON.stringify(vars.submission)], { type: 'application/json' })
      )

      // 2. Video (1 fichier max)
      if (vars.video) {
        formData.append('video', vars.video)
      }

      // 3. Photos structurees : on envoie en parallele "photos" (files)
      //    et "photoSections" (string array). Backend zip les deux par index.
      if (vars.photos && vars.photos.length > 0) {
        vars.photos.forEach((p) => {
          formData.append('photos', p.file)
          formData.append('photoSections', p.section)
        })
      }

      // 4. Documents legaux : fichier + categorie en parallele (backend zippe par index).
      if (vars.documents && vars.documents.length > 0) {
        vars.documents.forEach((d) => {
          formData.append('documents', d.file)
          formData.append('documentCategories', d.categorie)
        })
      }

      // IMPORTANT : Content-Type undefined pour que axios calcule le boundary.
      // Cf bug "Soumission impossible" rapporte par Hugh le 22/05/2026.
      const { data } = await api.post<ProprieteResponse>(
        '/api/proprietes/submissions',
        formData,
        {
          headers: { 'Content-Type': undefined as unknown as string },
          // Barre de progression d'upload (la video peut peser 100 MB).
          onUploadProgress: (evt) => {
            if (vars.onProgress && evt.total) {
              vars.onProgress(Math.round((evt.loaded / evt.total) * 100))
            }
          },
        }
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mes-proprietes-proposees'] })
      qc.invalidateQueries({ queryKey: ['proprietes'] })
      qc.invalidateQueries({ queryKey: ['mes-notifications'] })
    },
  })
}
