/**
 * V2 G.4 (05/06/2026) : metadonnees d'affichage des sections photos.
 *
 * Le frontend recoit le code (ex "FACADE", "TERRASSE") via
 * DocumentResponse.sectionPhotoCode + sectionPhotoLabel (resolu cote
 * backend). Pour les 9 codes historiques on garde un mapping en dur.
 */
import type { SectionPhotoResponse } from './api/sectionsPhoto'

export type SectionPhotoMeta = {
  code: string
  label: string
}

/** Meta des 9 codes historiques (en dur, garantis presents). */
const LEGACY: Record<string, Omit<SectionPhotoMeta, 'code'>> = {
  FACADE: { label: 'Façade avant' },
  SALON: { label: 'Salon' },
  CUISINE: { label: 'Cuisine' },
  CHAMBRE: { label: 'Chambres' },
  SALLE_DE_BAIN: { label: 'Salle de bain' },
  PISCINE: { label: 'Piscine' },
  EXTERIEUR: { label: 'Extérieur / jardin' },
  VUE: { label: 'Vue' },
  AUTRE: { label: 'Autres photos' },
}

/**
 * Resout les meta d'un code section : legacy si historique, sinon utilise
 * le label de l'API (si fournie), sinon le code brut.
 */
export function getSectionPhotoMeta(
  code: string | null | undefined,
  apiList?: SectionPhotoResponse[] | null
): SectionPhotoMeta | null {
  if (!code) return null
  const legacy = LEGACY[code]
  if (legacy) return { code, ...legacy }
  const fromApi = apiList?.find((s) => s.code === code)
  return {
    code,
    label: fromApi?.label ?? code,
  }
}
