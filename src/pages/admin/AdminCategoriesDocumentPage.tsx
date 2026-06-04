/**
 * V2 G.2 (04/06/2026) : page admin de gestion des categories de document
 * legal (CRUD). Les 6 codes historiques sont seedes par la migration 027 ;
 * l'admin peut en ajouter (ex : ASSURANCE_HABITATION, DIAGNOSTIC_DPE,
 * ACTE_NOTARIE, ATTESTATION_FISCALE) sans devoir redeployer.
 */
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
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
  useAdminCategoriesDocument,
  useCreerCategorieDocument,
  useDesactiverCategorieDocument,
  useModifierCategorieDocument,
  useSupprimerCategorieDocument,
  type CategorieDocumentResponse,
  type RegleObligationDoc,
} from '@/lib/api/categoriesDocument'
import { extractApiError } from '@/lib/api/errors'

const REGLE_LABELS: Record<RegleObligationDoc, string> = {
  TOUJOURS: 'Toujours obligatoire',
  SI_NEUF_OU_CONSTRUCTION: 'Obligatoire si bien neuf / en construction',
  SI_DEJA_RENTABLE: 'Obligatoire si bien deja rentable (au moins un du groupe)',
  OPTIONNEL: 'Optionnel',
}

export function AdminCategoriesDocumentPage() {
  const { data: categories, isLoading, isError } = useAdminCategoriesDocument()
  const [editing, setEditing] = useState<CategorieDocumentResponse | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
            Catégories de document
          </h1>
          <p className="font-body text-earth-600 text-sm max-w-2xl">
            Types de documents legaux que le proprietaire peut joindre au dossier
            d'un bien. Ajoutez des categories specifiques a votre marche
            (assurance habitation, diagnostic DPE, acte notarie, attestation
            fiscale...). La regle d'obligation est enregistree mais reste
            uniquement appliquee pour les 6 codes historiques (refonte future).
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle catégorie
        </Button>
      </header>

      {isLoading && <Skeleton className="h-72 w-full" />}

      {isError && (
        <EmptyState
          icon={X}
          title="Erreur de chargement"
          description="Impossible de charger les catégories. Reessayez plus tard."
        />
      )}

      {categories && categories.length === 0 && (
        <EmptyState
          icon={FileText}
          title="Aucune catégorie configurée"
          description="Cliquez sur Nouvelle catégorie pour en ajouter."
        />
      )}

      {categories && categories.length > 0 && (
        <div className="bg-white rounded-xl border border-earth/8 overflow-hidden">
          <table className="w-full">
            <thead className="bg-sand-200">
              <tr>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">Code</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">Libellé</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm hidden lg:table-cell">Règle</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm hidden md:table-cell">Ordre</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">Statut</th>
                <th className="px-4 py-3 w-32" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <CategorieRow key={c.id} c={c} onEdit={() => setEditing(c)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <CategorieFormModal
          mode="create"
          initial={null}
          onClose={() => setCreating(false)}
        />
      )}

      {editing && (
        <CategorieFormModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function CategorieRow({
  c,
  onEdit,
}: {
  c: CategorieDocumentResponse
  onEdit: () => void
}) {
  const desactiver = useDesactiverCategorieDocument()
  const supprimer = useSupprimerCategorieDocument()

  function handleDesactiver() {
    desactiver.mutate(c.id, {
      onSuccess: () => toast.success(`${c.label} désactivée`),
      onError: (err) => toast.error(extractApiError(err, 'Désactivation impossible')),
    })
  }

  function handleSupprimer() {
    if (!confirm(`Supprimer définitivement la catégorie "${c.label}" ? Cette action est irréversible.`)) {
      return
    }
    supprimer.mutate(c.id, {
      onSuccess: () => toast.success(`${c.label} supprimée`),
      onError: (err) =>
        toast.error(
          extractApiError(
            err,
            'Suppression impossible (probablement utilisée par des documents). Désactivez-la plutôt.'
          )
        ),
    })
  }

  return (
    <tr className="border-t border-earth/8">
      <td className="px-4 py-3 font-mono text-xs text-earth-700">{c.code}</td>
      <td className="px-4 py-3 font-body text-earth">
        <div>{c.label}</div>
        {c.description && (
          <div className="font-body text-xs text-earth-500 mt-0.5">{c.description}</div>
        )}
      </td>
      <td className="px-4 py-3 font-body text-earth-600 text-xs hidden lg:table-cell">
        {REGLE_LABELS[c.regleObligation]}
      </td>
      <td className="px-4 py-3 font-body text-earth-600 hidden md:table-cell">{c.ordre}</td>
      <td className="px-4 py-3">
        {c.actif ? (
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
          {c.actif && (
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

function CategorieFormModal({
  mode,
  initial,
  onClose,
}: {
  mode: 'create' | 'edit'
  initial: CategorieDocumentResponse | null
  onClose: () => void
}) {
  const [code, setCode] = useState(initial?.code ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [icone, setIcone] = useState(initial?.icone ?? '')
  const [ordre, setOrdre] = useState<number>(initial?.ordre ?? 100)
  const [actif, setActif] = useState<boolean>(initial?.actif ?? true)
  const [regleObligation, setRegleObligation] = useState<RegleObligationDoc>(
    initial?.regleObligation ?? 'OPTIONNEL'
  )

  const creer = useCreerCategorieDocument()
  const modifier = useModifierCategorieDocument()
  const busy = creer.isPending || modifier.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const req = {
      code: code.trim().toUpperCase(),
      label: label.trim(),
      description: description.trim() || null,
      icone: icone.trim() || null,
      ordre,
      actif,
      regleObligation,
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
          toast.success('Catégorie créée')
          onClose()
        },
        onError: (err) => toast.error(extractApiError(err, 'Création impossible')),
      })
    } else if (initial) {
      modifier.mutate(
        { id: initial.id, req },
        {
          onSuccess: () => {
            toast.success('Catégorie modifiée')
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
            {mode === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose} title="Fermer">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-code">
              Code <span className="text-error">*</span>
            </Label>
            <Input
              id="cat-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ASSURANCE_HABITATION"
              disabled={mode === 'edit'}
              className="font-mono uppercase"
            />
            {mode === 'edit' && (
              <p className="font-body text-xs text-earth-500">
                Le code n'est pas modifiable (il est référencé par les documents existants).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-label">
              Libellé <span className="text-error">*</span>
            </Label>
            <Input
              id="cat-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Assurance habitation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-desc">Description (optionnel)</Label>
            <textarea
              id="cat-desc"
              rows={2}
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Attestation d'assurance multirisque habitation."
              className="w-full rounded-md border-[1.5px] border-sand-400 bg-white px-3 py-2 text-sm font-body text-earth focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15 resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-regle">Règle d'obligation</Label>
            <select
              id="cat-regle"
              value={regleObligation}
              onChange={(e) => setRegleObligation(e.target.value as RegleObligationDoc)}
              className="w-full rounded-md border-[1.5px] border-sand-400 bg-white px-3 py-2 text-sm font-body text-earth"
            >
              {(Object.keys(REGLE_LABELS) as RegleObligationDoc[]).map((r) => (
                <option key={r} value={r}>{REGLE_LABELS[r]}</option>
              ))}
            </select>
            <p className="font-body text-xs text-earth-500">
              Stocke en BDD mais n'est appliquee dynamiquement que pour les 6
              codes historiques. Pour les codes custom, la regle est ignoree
              (la categorie reste optionnelle) jusqu'a la refonte de la
              validation. Tu peux quand meme la renseigner pour preparer la suite.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-icone">Icône Lucide (optionnel)</Label>
            <Input
              id="cat-icone"
              value={icone ?? ''}
              onChange={(e) => setIcone(e.target.value)}
              placeholder="FileText"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cat-ordre">Ordre d'affichage</Label>
              <Input
                id="cat-ordre"
                type="number"
                value={ordre}
                onChange={(e) => setOrdre(parseInt(e.target.value, 10) || 100)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-actif">Active</Label>
              <div className="flex items-center gap-2 h-10">
                <input
                  id="cat-actif"
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
