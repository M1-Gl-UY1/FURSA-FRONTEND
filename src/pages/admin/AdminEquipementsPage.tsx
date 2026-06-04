/**
 * V2 G.1 (04/06/2026) : page admin de gestion des equipements de bien
 * immobilier (CRUD). Les codes des 6 equipements historiques (PISCINE,
 * CLIMATISATION, PARKING, ASCENSEUR, JARDIN, VUE_MER) sont seeds par la
 * migration 025 ; l'admin peut en ajouter (ex : SALLE_DE_SPORT, SECURITE_24_7)
 * sans devoir redeployer.
 */
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  Power,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAdminEquipements,
  useCreerEquipement,
  useDesactiverEquipement,
  useModifierEquipement,
  useSupprimerEquipement,
  type EquipementResponse,
} from '@/lib/api/equipements'
import { extractApiError } from '@/lib/api/errors'

export function AdminEquipementsPage() {
  const { data: equipements, isLoading, isError } = useAdminEquipements()
  const [editing, setEditing] = useState<EquipementResponse | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
            Équipements
          </h1>
          <p className="font-body text-earth-600 text-sm max-w-2xl">
            Liste des équipements proposables dans le wizard de proposition d'un bien.
            Ajoutez-en pour enrichir l'offre. Les équipements désactivés restent visibles
            sur les biens où ils sont déjà cochés mais ne sont plus proposés au choix.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvel équipement
        </Button>
      </header>

      {isLoading && <Skeleton className="h-72 w-full" />}

      {isError && (
        <EmptyState
          icon={X}
          title="Erreur de chargement"
          description="Impossible de charger les équipements. Reessayez plus tard."
        />
      )}

      {equipements && equipements.length === 0 && (
        <EmptyState
          icon={Wrench}
          title="Aucun équipement configuré"
          description="Cliquez sur Nouvel équipement pour en ajouter."
        />
      )}

      {equipements && equipements.length > 0 && (
        <div className="bg-white rounded-xl border border-earth/8 overflow-hidden">
          <table className="w-full">
            <thead className="bg-sand-200">
              <tr>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">
                  Code
                </th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">
                  Libellé
                </th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm hidden sm:table-cell">
                  Icône
                </th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm hidden md:table-cell">
                  Ordre
                </th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">
                  Statut
                </th>
                <th className="px-4 py-3 w-32" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {equipements.map((eq) => (
                <EquipementRow
                  key={eq.id}
                  eq={eq}
                  onEdit={() => setEditing(eq)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <EquipementFormModal
          mode="create"
          initial={null}
          onClose={() => setCreating(false)}
        />
      )}

      {editing && (
        <EquipementFormModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function EquipementRow({
  eq,
  onEdit,
}: {
  eq: EquipementResponse
  onEdit: () => void
}) {
  const desactiver = useDesactiverEquipement()
  const supprimer = useSupprimerEquipement()

  function handleDesactiver() {
    desactiver.mutate(eq.id, {
      onSuccess: () => toast.success(`${eq.label} désactivé`),
      onError: (err) => toast.error(extractApiError(err, 'Désactivation impossible')),
    })
  }

  function handleSupprimer() {
    if (!confirm(`Supprimer définitivement l'équipement "${eq.label}" ? Cette action est irréversible.`)) {
      return
    }
    supprimer.mutate(eq.id, {
      onSuccess: () => toast.success(`${eq.label} supprimé`),
      onError: (err) =>
        toast.error(
          extractApiError(
            err,
            'Suppression impossible (probablement utilisé par des biens). Désactivez-le plutôt.'
          )
        ),
    })
  }

  return (
    <tr className="border-t border-earth/8">
      <td className="px-4 py-3 font-mono text-xs text-earth-700">{eq.code}</td>
      <td className="px-4 py-3 font-body text-earth">{eq.label}</td>
      <td className="px-4 py-3 font-mono text-xs text-earth-600 hidden sm:table-cell">
        {eq.icone || '—'}
      </td>
      <td className="px-4 py-3 font-body text-earth-600 hidden md:table-cell">{eq.ordre}</td>
      <td className="px-4 py-3">
        {eq.actif ? (
          <span className="inline-flex items-center gap-1 text-success text-xs font-body font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Actif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-earth-500 text-xs font-body font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Inactif
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit} title="Modifier">
            <Pencil className="w-4 h-4" />
          </Button>
          {eq.actif && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDesactiver}
              title="Désactiver"
              disabled={desactiver.isPending}
            >
              <Power className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSupprimer}
            title="Supprimer"
            disabled={supprimer.isPending}
            className="text-error hover:text-error"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

function EquipementFormModal({
  mode,
  initial,
  onClose,
}: {
  mode: 'create' | 'edit'
  initial: EquipementResponse | null
  onClose: () => void
}) {
  const [code, setCode] = useState(initial?.code ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [icone, setIcone] = useState(initial?.icone ?? '')
  const [ordre, setOrdre] = useState<number>(initial?.ordre ?? 100)
  const [actif, setActif] = useState<boolean>(initial?.actif ?? true)

  const creer = useCreerEquipement()
  const modifier = useModifierEquipement()
  const busy = creer.isPending || modifier.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const req = {
      code: code.trim().toUpperCase(),
      label: label.trim(),
      icone: icone.trim() || null,
      ordre,
      actif,
    }
    if (!/^[A-Z][A-Z0-9_]*$/.test(req.code)) {
      toast.error('Code en majuscules uniquement (lettres, chiffres, underscores).')
      return
    }
    if (!req.label) {
      toast.error('Le libellé est obligatoire.')
      return
    }
    if (mode === 'create') {
      creer.mutate(req, {
        onSuccess: () => {
          toast.success('Équipement créé')
          onClose()
        },
        onError: (err) => toast.error(extractApiError(err, 'Création impossible')),
      })
    } else if (initial) {
      modifier.mutate(
        { id: initial.id, req },
        {
          onSuccess: () => {
            toast.success('Équipement modifié')
            onClose()
          },
          onError: (err) => toast.error(extractApiError(err, 'Modification impossible')),
        }
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-earth text-lg">
            {mode === 'create' ? 'Nouvel équipement' : 'Modifier l\'équipement'}
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose} title="Fermer">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eq-code">
              Code <span className="text-error">*</span>
            </Label>
            <Input
              id="eq-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SALLE_DE_SPORT"
              disabled={mode === 'edit'}
              className="font-mono uppercase"
            />
            {mode === 'edit' && (
              <p className="font-body text-xs text-earth-500">
                Le code n'est pas modifiable (il est référencé par les biens existants).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="eq-label">
              Libellé <span className="text-error">*</span>
            </Label>
            <Input
              id="eq-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Salle de sport"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eq-icone">Icône Lucide (optionnel)</Label>
            <Input
              id="eq-icone"
              value={icone ?? ''}
              onChange={(e) => setIcone(e.target.value)}
              placeholder="Dumbbell"
            />
            <p className="font-body text-xs text-earth-500">
              Nom d'icône <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="underline">lucide.dev/icons</a> (ex: Waves, Wind, Car).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eq-ordre">Ordre d'affichage</Label>
              <Input
                id="eq-ordre"
                type="number"
                value={ordre}
                onChange={(e) => setOrdre(parseInt(e.target.value, 10) || 100)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eq-actif">Actif</Label>
              <div className="flex items-center gap-2 h-10">
                <input
                  id="eq-actif"
                  type="checkbox"
                  checked={actif}
                  onChange={(e) => setActif(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-body text-sm text-earth-700">
                  {actif ? 'Visible au wizard' : 'Caché'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Annuler
            </Button>
            <Button type="submit" disabled={busy}>
              {mode === 'create' ? 'Créer' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
