/**
 * V2 G.3 (04/06/2026) : metadonnees d'affichage des types de bien.
 *
 * Le frontend recoit le code (ex "VILLA", "LOFT") via
 * ProprieteResponse.typeBienCode + typeBienLabel (resolu cote backend).
 * Pour les 7 codes historiques on garde un mapping en dur (icone Lucide +
 * fallback label). Pour les codes custom crees par l'admin, l'icone est
 * generique (Home) et le label vient de l'API.
 */
import {
  BedDouble,
  Building,
  Building2,
  Castle,
  Home,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

import type { TypeBienResponse } from './api/typesBien'

export type TypeBienMeta = {
  code: string
  label: string
  icon: LucideIcon
}

/** Meta des 7 types historiques (en dur, garantis presents). */
const LEGACY: Record<string, Omit<TypeBienMeta, 'code'>> = {
  VILLA: { label: 'Villa', icon: Castle },
  APPARTEMENT: { label: 'Appartement', icon: Building },
  STUDIO: { label: 'Studio', icon: Home },
  PENTHOUSE: { label: 'Penthouse', icon: Sparkles },
  DUPLEX: { label: 'Duplex', icon: Building2 },
  IMMEUBLE: { label: 'Immeuble', icon: Building2 },
  CHAMBRE: { label: 'Chambre', icon: BedDouble },
}

/**
 * Resout les meta d'un code type de bien : legacy si historique, sinon utilise
 * le label de l'API (si fournie), sinon le code brut. L'icone est generique
 * (Home) pour les codes custom.
 */
export function getTypeBienMeta(
  code: string | null | undefined,
  apiList?: TypeBienResponse[] | null
): TypeBienMeta | null {
  if (!code) return null
  const legacy = LEGACY[code]
  if (legacy) return { code, ...legacy }
  const fromApi = apiList?.find((t) => t.code === code)
  return {
    code,
    label: fromApi?.label ?? code,
    icon: Home,
  }
}
