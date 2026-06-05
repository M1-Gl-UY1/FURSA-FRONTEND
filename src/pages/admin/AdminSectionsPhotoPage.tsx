/**
 * V2 G.4 (05/06/2026) : page admin de gestion des sections photo (CRUD).
 * Les 9 codes historiques sont seeds par la migration 028 ; l'admin peut
 * en ajouter (ex : TERRASSE, GARAGE, BALCON, CAVE, BUREAU_INTERIEUR,
 * ROOFTOP, SALLE_DE_SPORT...) sans devoir redeployer.
 */
import {
  AlertTriangle,
  Camera,
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
  useAdminSectionsPhoto,
  useCreerSectionPhoto,
  useDesactiverSectionPhoto,
  useModifierSectionPhoto,
  useSupprimerSectionPhoto,
  type SectionPhotoResponse,
} from '@/lib/api/sectionsPhoto'
import { extractApiError } from '@/lib/api/errors'

export function AdminSectionsPhotoPage() {
  const { data: sections, isLoading, isError } = useAdminSectionsPhoto()
  const [editing, setEditing] = useState<SectionPhotoResponse | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
            Sections photo
          </h1>
          <p className="font-body text-earth-600 text-sm max-w-2xl">
            Sections proposees dans le wizard pour classer les photos d'un bien.
            Ajoutez des sections specifiques (terrasse, garage, balcon, cave,
            rooftop, salle de sport...). Pour V1, seules les sections « toujours
            requises » (FACADE et SALON) sont obligatoires ; les regles
            conditionnelles (CHAMBRE si exigeChambres, PISCINE/VUE si
            equipement) restent hardcodees pour les 9 codes historiques.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle section
        </Button>
      </header>

      {isLoading && <Skeleton className="h-72 w-full" />}

      {isError && (
        <EmptyState
          icon={X}
          title="Erreur de chargement"
          description="Impossible de charger les sections. Reessayez plus tard."
        />
      )}

      {sections && sections.length === 0 && (
        <EmptyState
          icon={Camera}
          title="Aucune section configurée"
          description="Cliquez sur Nouvelle section pour en ajouter."
        />
      )}

      {sections && sections.length > 0 && (
        <div className="bg-white rounded-xl border border-earth/8 overflow-hidden">
          <table className="w-full">
            <thead className="bg-sand-200">
              <tr>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">Code</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">Libellé</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm hidden sm:table-cell">Icône</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm hidden md:table-cell">Ordre</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm hidden lg:table-cell">Requise</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">Statut</th>
                <th className="px-4 py-3 w-32" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {sections.map((s) => (
                <SectionRow key={s.id} s={s} onEdit={() => setEditing(s)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <SectionFormModal
          mode="create"
          initial={null}
          onClose={() => setCreating(false)}
        />
      )}

      {editing && (
        <SectionFormModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function SectionRow({
  s,
  onEdit,
}: {
  s: SectionPhotoResponse
  onEdit: () => void
}) {
  const desactiver = useDesactiverSectionPhoto()
  const supprimer = useSupprimerSectionPhoto()

  function handleDesactiver() {
    desactiver.mutate(s.id, {
      onSuccess: () => toast.success(`${s.label} désactivée`),
      onError: (err) => toast.error(extractApiError(err, 'Désactivation impossible')),
    })
  }

  function handleSupprimer() {
    if (!confirm(`Supprimer définitivement la section "${s.label}" ? Cette action est irréversible.`)) {
      return
    }
    supprimer.mutate(s.id, {
      onSuccess: () => toast.success(`${s.label} supprimée`),
      onError: (err) =>
        toast.error(
          extractApiError(
            err,
            'Suppression impossible (probablement utilisée par des photos). Désactivez-la plutôt.'
          )
        ),
    })
  }

  return (
    <tr className="border-t border-earth/8">
      <td className="px-4 py-3 font-mono text-xs text-earth-700">{s.code}</td>
      <td className="px-4 py-3 font-body text-earth">{s.label}</td>
      <td className="px-4 py-3 font-mono text-xs text-earth-600 hidden sm:table-cell">
        {s.icone || '—'}
      </td>
      <td className="px-4 py-3 font-body text-earth-600 hidden md:table-cell">{s.ordre}</td>
      <td className="px-4 py-3 font-body text-earth-600 hidden lg:table-cell">
        {s.requise ? 'Oui' : 'Non'}
      </td>
      <td className="px-4 py-3">
        {s.actif ? (
          <span className="inline-flex items-center gap-1 text-success text-xs font-body font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-earth-500 text-xs font-body font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Inactive
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit} title="Modifier">
            <Pencil className="w-4 h-4" />
          </Button>
          {s.actif && (
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

function SectionFormModal({
  mode,
  initial,
  onClose,
}: {
  mode: 'create' | 'edit'
  initial: SectionPhotoResponse | null
  onClose: () => void
}) {
  const [code, setCode] = useState(initial?.code ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [icone, setIcone] = useState(initial?.icone ?? '')
  const [ordre, setOrdre] = useState<number>(initial?.ordre ?? 100)
  const [actif, setActif] = useState<boolean>(initial?.actif ?? true)
  const [requise, setRequise] = useState<boolean>(initial?.requise ?? false)

  const creer = useCreerSectionPhoto()
  const modifier = useModifierSectionPhoto()
  const busy = creer.isPending || modifier.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const req = {
      code: code.trim().toUpperCase(),
      label: label.trim(),
      icone: icone.trim() || null,
      ordre,
      actif,
      requise,
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
          toast.success('Section créée')
          onClose()
        },
        onError: (err) => toast.error(extractApiError(err, 'Création impossible')),
      })
    } else if (initial) {
      modifier.mutate(
        { id: initial.id, req },
        {
          onSuccess: () => {
            toast.success('Section modifiée')
            onClose()
          },
          onError: (err) => toast.error(extractApiError(err, 'Modification impossible')),
        }
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-earth text-lg">
            {mode === 'create' ? 'Nouvelle section photo' : 'Modifier la section'}
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose} title="Fermer">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sec-code">
              Code <span className="text-error">*</span>
            </Label>
            <Input
              id="sec-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="TERRASSE"
              disabled={mode === 'edit'}
              className="font-mono uppercase"
            />
            {mode === 'edit' && (
              <p className="font-body text-xs text-earth-500">
                Le code n'est pas modifiable (il est référencé par les photos existantes).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sec-label">
              Libellé <span className="text-error">*</span>
            </Label>
            <Input
              id="sec-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Terrasse"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sec-icone">Icône Lucide (optionnel)</Label>
            <Input
              id="sec-icone"
              value={icone ?? ''}
              onChange={(e) => setIcone(e.target.value)}
              placeholder="Sun"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sec-ordre">Ordre d'affichage</Label>
              <Input
                id="sec-ordre"
                type="number"
                value={ordre}
                onChange={(e) => setOrdre(parseInt(e.target.value, 10) || 100)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sec-actif">Active</Label>
              <div className="flex items-center gap-2 h-10">
                <input
                  id="sec-actif"
                  type="checkbox"
                  checked={actif}
                  onChange={(e) => setActif(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-body text-sm text-earth-700">
                  {actif ? 'Visible' : 'Cachée'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-md border border-sand-300 bg-sand-100">
            <div className="flex items-center gap-2">
              <input
                id="sec-requise"
                type="checkbox"
                checked={requise}
                onChange={(e) => setRequise(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="sec-requise" className="cursor-pointer">
                Section toujours obligatoire
              </Label>
            </div>
            <p className="font-body text-xs text-earth-500 pl-6">
              Si coché, le wizard exigera au moins une photo pour cette section.
              FACADE et SALON sont à TRUE par défaut. Les règles conditionnelles
              (CHAMBRE si exigeChambres, PISCINE/VUE si équipement) restent
              hardcodées pour les codes historiques.
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
