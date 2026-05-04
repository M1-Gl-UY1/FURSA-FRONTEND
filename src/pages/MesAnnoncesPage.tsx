import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Edit, Plus, Repeat, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAnnulerAnnonce,
  useMesAnnonces,
  useModifierAnnonce,
} from '@/lib/api/annonces'
import { extractApiError } from '@/lib/api/errors'
import type { AnnonceResponse } from '@/lib/api/types'

export function MesAnnoncesPage() {
  const { data, isLoading } = useMesAnnonces()
  const [editTarget, setEditTarget] = useState<AnnonceResponse | null>(null)
  const [cancelTarget, setCancelTarget] = useState<AnnonceResponse | null>(null)

  const annonces = data ?? []

  const columns: Column<AnnonceResponse>[] = [
    {
      key: 'createdAt',
      label: 'Date',
      sortAccessor: (a) => (a.createdAt ? new Date(a.createdAt) : new Date(0)),
      render: (a) => (a.createdAt ? formatDate(a.createdAt) : '—'),
      width: 'w-32',
    },
    {
      key: 'proprieteNom',
      label: 'Propriété',
      render: (a) => (
        <Link
          to={`/marche/secondaire/${a.id}`}
          className="font-body font-semibold text-earth hover:text-terra"
        >
          {a.proprieteNom}
        </Link>
      ),
    },
    {
      key: 'nombreDePartsAVendre',
      label: 'Parts',
      align: 'right',
      render: (a) => (
        <span className="font-mono font-semibold tabular-nums">
          {a.nombreDePartsAVendre.toLocaleString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'prixUnitaireDemande',
      label: 'Prix / part',
      align: 'right',
      render: (a) => <Money amount={a.prixUnitaireDemande} mono={false} className="font-semibold" />,
    },
    {
      key: 'total',
      label: 'Total',
      sortAccessor: (a) => a.nombreDePartsAVendre * a.prixUnitaireDemande,
      align: 'right',
      render: (a) => (
        <Money
          amount={a.nombreDePartsAVendre * a.prixUnitaireDemande}
          mono={false}
          className="font-bold text-terra"
        />
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (a) => <StatusBadge status={a.statut} />,
      align: 'center',
    },
    {
      key: 'actions',
      label: 'Actions',
      noSort: true,
      align: 'right',
      render: (a) => (
        <div className="inline-flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={a.statut !== 'OUVERTE'}
            onClick={() => setEditTarget(a)}
            aria-label="Modifier"
          >
            <Edit strokeWidth={1.75} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={a.statut !== 'OUVERTE'}
            onClick={() => setCancelTarget(a)}
            aria-label="Annuler l'annonce"
            className="text-error hover:bg-error/8 hover:text-error"
          >
            <Trash2 strokeWidth={1.75} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
            Mes annonces
          </h1>
          <p className="font-body text-earth-600 text-sm">
            Gérez vos annonces de revente sur le marché secondaire.
          </p>
        </div>
        <Button asChild>
          <Link to="/marche/nouvelle-annonce">
            <Plus strokeWidth={2} />
            Nouvelle annonce
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      ) : (
        <DataTable
          data={annonces}
          columns={columns}
          rowKey={(a) => a.id}
          initialSort={{ key: 'createdAt', direction: 'desc' }}
          empty={
            <EmptyState
              icon={Repeat}
              title="Aucune annonce"
              description="Vous n'avez encore mis aucune part en vente. Créez votre première annonce pour revendre des parts d'une propriété que vous détenez."
              action={
                <Button asChild>
                  <Link to="/marche/nouvelle-annonce">
                    <Plus strokeWidth={2} />
                    Créer une annonce
                  </Link>
                </Button>
              }
            />
          }
        />
      )}

      {/* Modale modification */}
      {editTarget && (
        <EditModal
          annonce={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Modale annulation */}
      {cancelTarget && (
        <CancelModal
          annonce={cancelTarget}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  )
}

// --- Modal édition ---

function EditModal({ annonce, onClose }: { annonce: AnnonceResponse; onClose: () => void }) {
  const modifier = useModifierAnnonce()
  const [parts, setParts] = useState(annonce.nombreDePartsAVendre)
  const [prix, setPrix] = useState(annonce.prixUnitaireDemande)

  const dirty = parts !== annonce.nombreDePartsAVendre || prix !== annonce.prixUnitaireDemande

  function save() {
    modifier.mutate(
      {
        id: annonce.id,
        payload: { nombreDePartsAVendre: parts, prixUnitaireDemande: prix },
      },
      {
        onSuccess: () => {
          toast.success('Annonce modifiée.')
          onClose()
        },
        onError: (err) => {
          toast.error(extractApiError(err, 'Modification impossible.'))
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white border-earth/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-earth text-xl">
            Modifier l'annonce
          </DialogTitle>
          <DialogDescription className="font-body text-earth-600 text-sm">
            {annonce.proprieteNom}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-parts">Parts à vendre</Label>
            <Input
              id="edit-parts"
              type="number"
              min={1}
              value={parts}
              onChange={(e) => setParts(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-prix">Prix unitaire (EUR)</Label>
            <Input
              id="edit-prix"
              type="number"
              min={0.01}
              step={0.01}
              value={prix}
              onChange={(e) => setPrix(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
            />
          </div>
          <div className="bg-sand-100 rounded-md p-3 flex items-center justify-between">
            <span className="font-body text-sm text-earth-600">Nouveau total</span>
            <Money amount={parts * prix} mono={false} className="font-mono font-bold text-terra" />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={modifier.isPending}>
            Annuler
          </Button>
          <Button onClick={save} disabled={!dirty || modifier.isPending}>
            {modifier.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Modal annulation ---

function CancelModal({ annonce, onClose }: { annonce: AnnonceResponse; onClose: () => void }) {
  const annuler = useAnnulerAnnonce()

  function confirm() {
    annuler.mutate(annonce.id, {
      onSuccess: () => {
        toast.success('Annonce annulée.')
        onClose()
      },
      onError: (err) => {
        toast.error(extractApiError(err, 'Annulation impossible.'))
      },
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white border-earth/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-earth text-xl">
            Annuler cette annonce ?
          </DialogTitle>
          <DialogDescription className="font-body text-earth-600 text-sm">
            <span className="font-semibold text-earth">{annonce.proprieteNom}</span> —{' '}
            <span className="font-mono">{annonce.nombreDePartsAVendre.toLocaleString('fr-FR')}</span> parts à{' '}
            <Money amount={annonce.prixUnitaireDemande} mono={false} className="font-mono" /> par part.
            <br />
            Vous pourrez recréer une annonce à tout moment, mais celle-ci ne sera plus visible des autres investisseurs.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={annuler.isPending}>
            Conserver
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={annuler.isPending}>
            {annuler.isPending ? 'Annulation...' : 'Annuler l\'annonce'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}
