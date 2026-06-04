/**
 * V2 G.2 (04/06/2026) : metadonnees d'affichage des categories de document.
 *
 * Le frontend recoit le code (ex "TITRE_FONCIER", "ASSURANCE_HABITATION")
 * via DocumentResponse.categorieDocumentCode + categorieDocumentLabel
 * (resolu cote backend).
 *
 * Pour les 6 codes historiques on garde un mapping en dur (label + description).
 * Pour les codes custom crees par l'admin, le label vient de l'API.
 */
import type { CategorieDocumentResponse } from './api/categoriesDocument'

export type CategorieDocumentMeta = {
  code: string
  label: string
  description: string
}

/** Meta des 6 codes historiques (en dur, garantis presents). */
const LEGACY: Record<string, Omit<CategorieDocumentMeta, 'code'>> = {
  TITRE_FONCIER: {
    label: 'Titre foncier',
    description: 'Preuve officielle de propriete (obligatoire).',
  },
  PERMIS_CONSTRUIRE: {
    label: 'Permis de construire',
    description: 'Obligatoire pour les biens neufs ou en construction.',
  },
  CONTRAT_GESTION: {
    label: 'Contrat de gestion locative',
    description: 'Pour les biens deja rentables.',
  },
  CONTRAT_BAIL: {
    label: 'Contrat de bail',
    description: 'Pour les biens loues en direct.',
  },
  RELEVE_AIRBNB: {
    label: 'Releve Airbnb / plateforme',
    description: 'Justificatif de revenus locatifs courts sejours.',
  },
  AUTRE: {
    label: 'Autre',
    description: 'Tout autre document utile (expertise, plans, etc.).',
  },
}

/**
 * Resout les meta d'un code categorie : legacy si historique, sinon utilise
 * le label de l'API (si fournie), sinon le code brut.
 */
export function getCategorieDocumentMeta(
  code: string | null | undefined,
  apiList?: CategorieDocumentResponse[] | null
): CategorieDocumentMeta | null {
  if (!code) return null
  const legacy = LEGACY[code]
  if (legacy) return { code, ...legacy }
  const fromApi = apiList?.find((c) => c.code === code)
  return {
    code,
    label: fromApi?.label ?? code,
    description: fromApi?.description ?? '',
  }
}
