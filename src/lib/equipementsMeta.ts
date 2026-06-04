/**
 * V2 G.1 (04/06/2026) : metadonnees d'affichage des equipements.
 *
 * Le frontend recoit les codes (ex "PISCINE", "SALLE_DE_SPORT") via
 * ProprieteResponse.equipementsCodes. Pour l'affichage, on a besoin d'un
 * libelle lisible et eventuellement d'une icone (Lucide).
 *
 * Strategie :
 *   1. Pour les 6 codes historiques, on possede les meta en dur (icone Lucide)
 *   2. Pour les codes custom crees par l'admin, on resout via la liste API
 *      (useEquipements) — le label vient de la base, l'icone est generique
 *      (Wrench par defaut, ou le composant Lucide nomme dans Equipement.icone
 *      mais on ne fait pas de resolution dynamique d'icone ici pour rester simple)
 */
import {
  Building2,
  Car,
  Eye,
  Trees,
  Waves,
  Wind,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import type { EquipementResponse } from './api/equipements'

export type EquipementMeta = {
  code: string
  label: string
  emoji: string
  icon: LucideIcon
}

/** Meta des 6 equipements historiques (en dur, garantis presents). */
const LEGACY: Record<string, Omit<EquipementMeta, 'code'>> = {
  PISCINE: { label: 'Piscine', emoji: '🏊', icon: Waves },
  CLIMATISATION: { label: 'Climatisation', emoji: '❄', icon: Wind },
  PARKING: { label: 'Parking', emoji: '🅿', icon: Car },
  ASCENSEUR: { label: 'Ascenseur', emoji: '🛗', icon: Building2 },
  JARDIN: { label: 'Jardin', emoji: '🌿', icon: Trees },
  VUE_MER: { label: 'Vue mer', emoji: '🌊', icon: Eye },
}

/**
 * Resout les meta d'un code equipement : legacy si historique, sinon utilise
 * le label de l'API (si fournie), sinon le code brut. L'icone est generique
 * pour les codes custom (Wrench).
 */
export function getEquipementMeta(
  code: string,
  apiList?: EquipementResponse[] | null
): EquipementMeta {
  const legacy = LEGACY[code]
  if (legacy) return { code, ...legacy }
  const fromApi = apiList?.find((e) => e.code === code)
  return {
    code,
    label: fromApi?.label ?? code,
    emoji: '🔧',
    icon: Wrench,
  }
}

/** Resout en lot. Garde l'ordre d'entree. */
export function getEquipementsMetaList(
  codes: string[] | null | undefined,
  apiList?: EquipementResponse[] | null
): EquipementMeta[] {
  return (codes ?? []).map((c) => getEquipementMeta(c, apiList))
}
