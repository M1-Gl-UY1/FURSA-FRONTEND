/**
 * V2 G.3 (04/06/2026) : page admin de gestion des types de bien immobilier
 * (CRUD). Les codes des 7 types historiques (VILLA, APPARTEMENT, STUDIO,
 * PENTHOUSE, DUPLEX, IMMEUBLE, CHAMBRE) sont seeds par la migration 026 ;
 * l'admin peut en ajouter (ex : LOFT, MAISON_DE_VILLE, TERRAIN, BUREAU,
 * COMMERCE) sans devoir redeployer.
 */
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Pencil,
  Plus,
  Power,
  Trash2,
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
  useAdminTypesBien,
  useCreerTypeBien,
  useDesactiverTypeBien,
  useModifierTypeBien,
  useSupprimerTypeBien,
  type TypeBienResponse,
} from '@/lib/api/typesBien'
import { extractApiError } from '@/lib/api/errors'

export function AdminTypesBienPage() {
  const { data: types, isLoading, isError } = useAdminTypesBien()
  const [editing, setEditing] = useState<TypeBienResponse | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
            Types de bien
          </h1>
          <p className="font-body text-earth-600 text-sm max-w-2xl">
            Typologies de bien proposables dans le wizard. Ajoutez des codes
            spécifiques à votre marché (ex : LOFT, MAISON_DE_VILLE, BUREAU,
            COMMERCE). Le flag « Exige chambres » contrôle si le champ
            « Nombre de chambres » est demandé dans le wizard.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau type
        </Button>
      </header>

      {isLoading && <Skeleton className="h-72 w-full" />}

      {isError && (
        <EmptyState
          icon={X}
          title="Erreur de chargement"
          description="Impossible de charger les types de bien. Reessayez plus tard."
        />
      )}

      {types && types.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Aucun type configuré"
          description="Cliquez sur Nouveau type pour en ajouter."
        />
      )}

      {types && types.length > 0 && (
        <div className="bg-white rounded-xl border border-earth/8 overflow-hidden">
          <table className="w-full">
            <thead className="bg-sand-200">
              <tr>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">Code</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">Libellé</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm hidden sm:table-cell">Icône</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm hidden md:table-cell">Ordre</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm hidden lg:table-cell">Chambres ?</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">Statut</th>
                <th className="px-4 py-3 w-32" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <TypeBienRow key={t.id} t={t} onEdit={() => setEditing(t)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <TypeBienFormModal
          mode="create"
          initial={null}
          onClose={() => setCreating(false)}
        />
      )}

      {editing && (
        <TypeBienFormModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function TypeBienRow({
  t,
  onEdit,
}: {
  t: TypeBienResponse
  onEdit: () => void
}) {
  const desactiver = useDesactiverTypeBien()
  const supprimer = useSupprimerTypeBien()

  function handleDesactiver() {
    desactiver.mutate(t.id, {
      onSuccess: () => toast.success(`${t.label} désactivé`),
      onError: (err) => toast.error(extractApiError(err, 'Désactivation impossible')),
    })
  }

  function handleSupprimer() {
    if (!confirm(`Supprimer définitivement le type "${t.label}" ? Cette action est irréversible.`)) {
      return
    }
    supprimer.mutate(t.id, {
      onSuccess: () => toast.success(`${t.label} supprimé`),
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
      <td className="px-4 py-3 font-mono text-xs text-earth-700">{t.code}</td>
      <td className="px-4 py-3 font-body text-earth">{t.label}</td>
      <td className="px-4 py-3 font-mono text-xs text-earth-600 hidden sm:table-cell">
        {t.icone || '—'}
      </td>
      <td className="px-4 py-3 font-body text-earth-600 hidden md:table-cell">{t.ordre}</td>
      <td className="px-4 py-3 font-body text-earth-600 hidden lg:table-cell">
        {t.exigeChambres ? 'Oui' : 'Non'}
      </td>
      <td className="px-4 py-3">
        {t.actif ? (
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
          {t.actif && (
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

function TypeBienFormModal({
  mode,
  initial,
  onClose,
}: {
  mode: 'create' | 'edit'
  initial: TypeBienResponse | null
  onClose: () => void
}) {
  const [code, setCode] = useState(initial?.code ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [icone, setIcone] = useState(initial?.icone ?? '')
  const [ordre, setOrdre] = useState<number>(initial?.ordre ?? 100)
  const [actif, setActif] = useState<boolean>(initial?.actif ?? true)
  const [exigeChambres, setExigeChambres] = useState<boolean>(initial?.exigeChambres ?? true)

  const creer = useCreerTypeBien()
  const modifier = useModifierTypeBien()
  const busy = creer.isPending || modifier.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const req = {
      code: code.trim().toUpperCase(),
      label: label.trim(),
      icone: icone.trim() || null,
      ordre,
      actif,
      exigeChambres,
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
          toast.success('Type de bien créé')
          onClose()
        },
        onError: (err) => toast.error(extractApiError(err, 'Création impossible')),
      })
    } else if (initial) {
      modifier.mutate(
        { id: initial.id, req },
        {
          onSuccess: () => {
            toast.success('Type de bien modifié')
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
            {mode === 'create' ? 'Nouveau type de bien' : 'Modifier le type'}
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose} title="Fermer">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tb-code">
              Code <span className="text-error">*</span>
            </Label>
            <Input
              id="tb-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="LOFT"
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
            <Label htmlFor="tb-label">
              Libellé <span className="text-error">*</span>
            </Label>
            <Input
              id="tb-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Loft"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tb-icone">Icône Lucide (optionnel)</Label>
            <Input
              id="tb-icone"
              value={icone ?? ''}
              onChange={(e) => setIcone(e.target.value)}
              placeholder="Warehouse"
            />
            <p className="font-body text-xs text-earth-500">
              Nom d'icône <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="underline">lucide.dev/icons</a>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tb-ordre">Ordre d'affichage</Label>
              <Input
                id="tb-ordre"
                type="number"
                value={ordre}
                onChange={(e) => setOrdre(parseInt(e.target.value, 10) || 100)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tb-actif">Actif</Label>
              <div className="flex items-center gap-2 h-10">
                <input
                  id="tb-actif"
                  type="checkbox"
                  checked={actif}
                  onChange={(e) => setActif(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-body text-sm text-earth-700">
                  {actif ? 'Visible' : 'Caché'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-md border border-sand-300 bg-sand-100">
            <div className="flex items-center gap-2">
              <input
                id="tb-chambres"
                type="checkbox"
                checked={exigeChambres}
                onChange={(e) => setExigeChambres(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="tb-chambres" className="cursor-pointer">
                Le wizard demande le nombre de chambres
              </Label>
            </div>
            <p className="font-body text-xs text-earth-500 pl-6">
              Décoché pour les typologies sans chambres distinctes (STUDIO, CHAMBRE, BUREAU, COMMERCE, TERRAIN...).
            </p>
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
