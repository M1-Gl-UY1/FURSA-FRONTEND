/**
 * V2 G.5 (05/06/2026) : page admin de gestion des settings application
 * (limites fichiers, age verification d'identite, fenetre declaration, etc.).
 *
 * Les cles sont definies par les seeds des migrations. L'admin ne peut pas
 * en creer ni supprimer, seulement modifier la valeur. Le service backend
 * valide que la valeur est parseable dans le type declare.
 */
import { Check, Pencil, Settings, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  grouperSettings,
  useAdminAppSettings,
  useModifierAppSetting,
  type AppSettingResponse,
  type TypeSetting,
} from '@/lib/api/settings'
import { extractApiError } from '@/lib/api/errors'

export function AdminSettingsPage() {
  const { data: settings, isLoading, isError } = useAdminAppSettings()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Paramètres globaux
        </h1>
        <p className="font-body text-earth-600 text-sm max-w-2xl">
          Réglages applicatifs modifiables sans redéploiement : limites
          d'upload, contraintes de vérification d'identité, fenêtres de déclaration, seuils escrow.
          Les changements prennent effet immédiatement sur les nouvelles
          requêtes (cache invalidé à chaque sauvegarde).
        </p>
      </header>

      {isLoading && <Skeleton className="h-96 w-full" />}

      {isError && (
        <EmptyState
          icon={X}
          title="Erreur de chargement"
          description="Impossible de charger les paramètres. Réessayez plus tard."
        />
      )}

      {settings && settings.length === 0 && (
        <EmptyState
          icon={Settings}
          title="Aucun paramètre configuré"
          description="La migration 029 n'a peut-être pas été appliquée. Vérifiez le déploiement."
        />
      )}

      {settings && settings.length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouperSettings(settings)).map(([groupe, items]) => (
            <section key={groupe}>
              <h2 className="font-display font-semibold text-earth text-lg mb-3">
                {groupe}
              </h2>
              <div className="bg-white rounded-xl border border-earth/8 overflow-hidden">
                <ul className="divide-y divide-earth/8">
                  {items.map((s) => (
                    <SettingRow key={s.cle} setting={s} />
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function SettingRow({ setting }: { setting: AppSettingResponse }) {
  const [editing, setEditing] = useState(false)
  const [valeur, setValeur] = useState(setting.valeur)
  const modifier = useModifierAppSetting()

  // Synchroniser quand le setting change (apres sauvegarde + invalidation cache)
  useEffect(() => {
    if (!editing) setValeur(setting.valeur)
  }, [setting.valeur, editing])

  function save() {
    if (valeur === setting.valeur) {
      setEditing(false)
      return
    }
    if (!validerValeur(valeur, setting.type)) {
      toast.error(messageValidation(setting.type))
      return
    }
    modifier.mutate(
      { cle: setting.cle, valeur },
      {
        onSuccess: () => {
          toast.success(`${setting.label} mis à jour`)
          setEditing(false)
        },
        onError: (err) =>
          toast.error(extractApiError(err, 'Sauvegarde impossible')),
      }
    )
  }

  function cancel() {
    setValeur(setting.valeur)
    setEditing(false)
  }

  return (
    <li className="p-4 flex flex-wrap gap-3 items-start">
      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-earth text-sm">
          {setting.label}
        </p>
        {setting.description && (
          <p className="font-body text-earth-500 text-xs mt-0.5">
            {setting.description}
          </p>
        )}
        <p className="font-mono text-[10px] text-earth-400 mt-1">
          {setting.cle} · {setting.type}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <>
            {setting.type === 'BOOLEAN' ? (
              <select
                value={valeur}
                onChange={(e) => setValeur(e.target.value)}
                className="h-10 px-3 rounded-md border-[1.5px] border-sand-400 bg-white text-earth text-sm font-mono"
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : (
              <Input
                value={valeur}
                onChange={(e) => setValeur(e.target.value)}
                type={
                  setting.type === 'INTEGER' || setting.type === 'LONG' || setting.type === 'DECIMAL'
                    ? 'number'
                    : 'text'
                }
                step={setting.type === 'DECIMAL' ? '0.01' : undefined}
                className="w-32 font-mono"
                autoFocus
              />
            )}
            {setting.unite && (
              <span className="font-body text-earth-500 text-sm">{setting.unite}</span>
            )}
            <Button
              size="icon"
              variant="outline"
              onClick={save}
              disabled={modifier.isPending}
              title="Sauvegarder"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={cancel}
              disabled={modifier.isPending}
              title="Annuler"
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <span className="font-mono text-earth font-semibold text-sm">
              {setting.valeur}
              {setting.unite && (
                <span className="font-body text-earth-500 font-normal ml-1">
                  {setting.unite}
                </span>
              )}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setEditing(true)}
              title="Modifier"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </li>
  )
}

function validerValeur(valeur: string, type: TypeSetting): boolean {
  if (valeur.trim() === '') return false
  switch (type) {
    case 'INTEGER': return /^-?\d+$/.test(valeur.trim())
    case 'LONG':    return /^-?\d+$/.test(valeur.trim())
    case 'DECIMAL': return /^-?\d+(\.\d+)?$/.test(valeur.trim())
    case 'BOOLEAN': return valeur === 'true' || valeur === 'false'
    case 'STRING':  return true
    default: return true
  }
}

function messageValidation(type: TypeSetting): string {
  switch (type) {
    case 'INTEGER': return 'Entier attendu (ex : 10)'
    case 'LONG':    return 'Entier long attendu (ex : 1000)'
    case 'DECIMAL': return 'Nombre decimal attendu (ex : 1.25)'
    case 'BOOLEAN': return 'Booleen attendu (true ou false)'
    case 'STRING':  return 'Texte attendu'
    default: return 'Valeur invalide'
  }
}
