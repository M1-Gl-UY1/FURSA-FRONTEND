import { useState } from 'react'
import { Clock, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { extractApiError } from '@/lib/api/errors'
import {
  useFilePropriete,
  useInscrireListeAttente,
} from '@/lib/api/liste-attente'

type Props = {
  open: boolean
  onClose: () => void
  proprieteId: number
  proprieteNom: string
}

/**
 * Modal d'inscription en liste d'attente sur un bien entierement vendu.
 *
 * P2 (Hugh 22/05/2026). Voir PRIX_DYNAMIQUE_FURSA.md §4.
 */
export function WaitlistModal({ open, onClose, proprieteId, proprieteNom }: Props) {
  const [nombreParts, setNombreParts] = useState(1)
  const inscrire = useInscrireListeAttente()
  const { data: file } = useFilePropriete(open ? proprieteId : undefined)

  const totalInFile = (file ?? []).reduce(
    (sum, e) => sum + (e.statut === 'EN_ATTENTE' ? e.nombreParts : 0),
    0
  )
  const nbInscrits = (file ?? []).filter((e) => e.statut === 'EN_ATTENTE').length

  function reset() {
    setNombreParts(1)
  }

  function submit() {
    inscrire.mutate(
      { proprieteId, nombreParts },
      {
        onSuccess: () => {
          toast.success(
            `Inscription confirmée. Vous serez notifié dès qu'une part se libère.`
          )
          reset()
          onClose()
        },
        onError: (e) =>
          toast.error(extractApiError(e, "Inscription impossible.")),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-earth">
            <Clock className="w-5 h-5 text-terra" strokeWidth={1.75} />
            S'inscrire en liste d'attente
          </DialogTitle>
          <DialogDescription className="pt-2">
            Le bien <strong>{proprieteNom}</strong> est entièrement vendu. Inscrivez-vous
            pour être notifié dès qu'une part redevient disponible sur le marché secondaire.
          </DialogDescription>
        </DialogHeader>

        {/* Indicateur pression */}
        {file && file.length > 0 && (
          <div className="bg-terra/5 border border-terra/15 rounded-md p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-terra/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-terra" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-earth text-sm font-semibold">
                {nbInscrits} investisseur{nbInscrits > 1 ? 's' : ''} en attente
              </p>
              <p className="font-body text-earth-600 text-xs">
                {totalInFile} parts demandées au total. Plus la file est longue, plus le
                prix par part tend à monter.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-5 py-2">
          <div>
            <Label htmlFor="parts">
              Nombre de parts souhaitées <span className="text-error">*</span>
            </Label>
            <p className="font-body text-earth-500 text-xs mb-2">
              Entre 1 et 100. Vous pourrez en acheter jusqu'à ce nombre quand une part se libère.
            </p>
            <Input
              id="parts"
              type="number"
              min={1}
              max={100}
              value={nombreParts || ''}
              onChange={(e) => setNombreParts(parseInt(e.target.value, 10) || 1)}
              className="font-mono font-semibold"
            />
          </div>

          <div className="bg-sand-100 border border-earth/8 rounded-md p-3 text-xs font-body text-earth-700 leading-relaxed">
            <strong>Comment ça marche :</strong> dès qu'un détenteur revend une part sur le
            marché secondaire, le premier inscrit de la file est notifié. Vous pouvez
            annuler votre inscription à tout moment.
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={inscrire.isPending}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={inscrire.isPending || nombreParts < 1}>
            {inscrire.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                Inscription...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" strokeWidth={1.75} />
                Confirmer l'inscription
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
