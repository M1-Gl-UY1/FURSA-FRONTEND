/**
 * V2 G.5 (05/06/2026) : settings application admin-configurables.
 *
 * - GET /api/app-settings/admin       : liste complete (admin)
 * - PUT /api/app-settings/admin/{cle} : modifier la valeur d'une cle (admin)
 *
 * Pas d'endpoint public en V1 : le frontend public utilise les valeurs par
 * defaut hardcodees pour les validations (KYC age, limites fichiers), avec
 * synchronisation differee. Si tu veux exposer une valeur particuliere a
 * l'investisseur (ex limite upload), on ajoutera un endpoint public selectif.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'

export type TypeSetting = 'INTEGER' | 'LONG' | 'DECIMAL' | 'BOOLEAN' | 'STRING'

export type AppSettingResponse = {
  cle: string
  valeur: string
  type: TypeSetting
  label: string
  description: string | null
  groupe: string
  unite: string | null
  ordre: number
}

const BASE = '/api/app-settings'
const KEY_ADMIN = ['app-settings', 'admin'] as const

export async function fetchAdminAppSettings(): Promise<AppSettingResponse[]> {
  const { data } = await api.get<AppSettingResponse[]>(`${BASE}/admin`)
  return data
}

export function useAdminAppSettings() {
  return useQuery({
    queryKey: KEY_ADMIN,
    queryFn: fetchAdminAppSettings,
    staleTime: 30_000,
  })
}

export function useModifierAppSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { cle: string; valeur: string }) => {
      const { data } = await api.put<AppSettingResponse>(
        `${BASE}/admin/${encodeURIComponent(args.cle)}`,
        { valeur: args.valeur }
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ADMIN })
    },
  })
}

/**
 * Helper : regroupe les settings par {@code groupe} pour l'affichage en
 * sections distinctes dans la page admin.
 */
export function grouperSettings(
  settings: AppSettingResponse[]
): Record<string, AppSettingResponse[]> {
  const groupes: Record<string, AppSettingResponse[]> = {}
  for (const s of settings) {
    if (!groupes[s.groupe]) groupes[s.groupe] = []
    groupes[s.groupe].push(s)
  }
  return groupes
}
