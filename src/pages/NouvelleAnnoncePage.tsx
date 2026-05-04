import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

import { PropertySelector } from '@/components/properties/PropertySelector'
import { Money } from '@/components/shared/Money'
import { WizardStepper } from '@/components/shared/WizardStepper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { useCreerAnnonce, useMesAnnonces } from '@/lib/api/annonces'
import { extractApiError } from '@/lib/api/errors'
import { useMesPossessions } from '@/lib/api/portefeuille'
import type { AnnonceResponse, PossessionResponse } from '@/lib/api/types'

const STEPS = ['Propriété', 'Conditions', 'Succès']

export function NouvelleAnnoncePage() {
  const { data: possessions, isLoading: loadingPoss } = useMesPossessions()
  const { data: mesAnnonces } = useMesAnnonces()
  const navigate = useNavigate()
  const creer = useCreerAnnonce()

  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [parts, setParts] = useState(1)
  const [prix, setPrix] = useState(0)
  const [created, setCreated] = useState<AnnonceResponse | null>(null)

  // Calcul des parts disponibles à la vente par propriété
  const options = useMemo(() => {
    if (!possessions) return []
    const annoncesActives = mesAnnonces?.filter((a) => a.statut === 'OUVERTE') ?? []
    return possessions.map((p: PossessionResponse) => {
      const partsEnAnnonces = annoncesActives
        .filter((a) => a.proprieteNom === p.proprieteNom)
        .reduce((s, a) => s + a.nombreDePartsAVendre, 0)
      return {
        ...p,
        partsDisponiblesAVente: Math.max(0, p.nombreDeParts - partsEnAnnonces),
      }
    })
  }, [possessions, mesAnnonces])

  const selectedOption = options.find((o) => o.id === selectedId)
  const partsMax = selectedOption?.partsDisponiblesAVente ?? 0
  const proprieteId =
    selectedOption?.proprieteNom // on n'a pas l'ID propriété ici, faut la retrouver depuis la réponse
      ? findProprieteIdFromName(selectedOption.proprieteNom, mesAnnonces)
      : null

  // Init prix au prix unitaire courant quand on change de propriété
  function selectProperty(id: number) {
    setSelectedId(id)
    const opt = options.find((o) => o.id === id)
    if (opt) {
      setPrix(opt.prixUnitairePart)
      setParts(1)
    }
  }

  function submitAnnonce() {
    if (!selectedOption) return
    // Si on n'a pas l'id propriété via les annonces existantes, on essaie via possessions (proprieteId pas exposé dans le DTO)
    // Workaround : on stocke proprieteId ailleurs
    const propId = findProprieteIdFromPossession(selectedOption)
    if (!propId) {
      toast.error('Impossible de retrouver l\'identifiant de la propriété.')
      return
    }
    creer.mutate(
      {
        proprieteId: propId,
        nombreDePartsAVendre: parts,
        prixUnitaireDemande: prix,
      },
      {
        onSuccess: (res) => {
          setCreated(res)
          setStep(2)
          toast.success('Annonce publiée !')
        },
        onError: (err) => {
          toast.error(extractApiError(err, 'Création de l\'annonce impossible.'))
        },
      }
    )
  }

  if (loadingPoss) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-8 w-40 mb-6 bg-sand-300" />
        <Skeleton className="h-72 rounded-xl bg-sand-300" />
      </div>
    )
  }

  if (!possessions || possessions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Compass className="w-12 h-12 text-earth-400 mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-earth text-xl mb-2">
          Aucune propriété détenue
        </h2>
        <p className="font-body text-earth-600 text-sm mb-6">
          Vous devez d'abord acheter des parts pour pouvoir les revendre.
        </p>
        <Button asChild>
          <Link to="/opportunites">Découvrir les opportunités</Link>
        </Button>
      </div>
    )
  }

  const allOptionsEmpty = options.every((o) => o.partsDisponiblesAVente <= 0)
  if (allOptionsEmpty) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-earth text-xl mb-2">
          Aucune part disponible à la vente
        </h2>
        <p className="font-body text-earth-600 text-sm mb-6">
          Toutes vos parts sont déjà engagées dans des annonces ouvertes.
          Annulez ou modifiez une annonce existante pour libérer des parts.
        </p>
        <Button asChild>
          <Link to="/marche/mes-annonces">Voir mes annonces</Link>
        </Button>
      </div>
    )
  }

  void proprieteId

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/marche/secondaire"
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour au marché secondaire
      </Link>

      <div className="mb-10">
        <WizardStepper steps={STEPS} current={step} />
      </div>

      {step === 0 && (
        <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
          <h1 className="font-display font-bold text-earth text-2xl mb-1">
            Quelle propriété ?
          </h1>
          <p className="font-body text-earth-600 text-sm mb-6">
            Sélectionnez le bien dont vous voulez revendre des parts.
          </p>

          <PropertySelector
            options={options}
            selectedId={selectedId}
            onSelect={selectProperty}
          />

          <div className="mt-7">
            <Button
              size="lg"
              className="w-full"
              onClick={() => setStep(1)}
              disabled={!selectedOption || selectedOption.partsDisponiblesAVente <= 0}
            >
              Continuer
              <ArrowRight strokeWidth={2} />
            </Button>
          </div>
        </div>
      )}

      {step === 1 && selectedOption && (
        <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-8">
          <h1 className="font-display font-bold text-earth text-2xl mb-1">
            Conditions de vente
          </h1>
          <p className="font-body text-earth-600 text-sm mb-6">
            Pour <span className="font-semibold text-earth">{selectedOption.proprieteNom}</span>.
          </p>

          {/* Parts à vendre */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <Label htmlFor="parts">Parts à vendre</Label>
              <Input
                id="parts"
                type="number"
                min={1}
                max={partsMax}
                value={parts}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  if (!Number.isNaN(n)) setParts(Math.max(1, Math.min(partsMax, n)))
                }}
                className="w-24 h-10 text-right font-mono font-semibold"
              />
            </div>
            <Slider
              value={[parts]}
              min={1}
              max={partsMax}
              step={1}
              onValueChange={([v]) => setParts(v)}
            />
            <div className="flex justify-between text-xs font-mono text-earth-500 mt-2">
              <span>1</span>
              <span>{partsMax.toLocaleString('fr-FR')}</span>
            </div>
          </div>

          {/* Prix unitaire */}
          <div className="mb-6">
            <Label htmlFor="prix">Prix unitaire (EUR)</Label>
            <Input
              id="prix"
              type="number"
              min={0.01}
              step={0.01}
              value={prix}
              onChange={(e) => setPrix(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
              className="mt-2 font-mono font-semibold"
            />
            <p className="font-body text-xs text-earth-500 mt-1.5 inline-flex items-center gap-1">
              <Info className="w-3 h-3" strokeWidth={2} />
              Prix unitaire actuel sur le marché primaire :{' '}
              <Money amount={selectedOption.prixUnitairePart} mono={false} className="font-mono font-semibold ml-1" />
            </p>
          </div>

          {/* Total calculé */}
          <div className="bg-white rounded-lg border border-earth/8 p-5 mb-7 space-y-3">
            <Row label="Parts">
              <span className="font-mono font-semibold text-earth">
                {parts.toLocaleString('fr-FR')}
              </span>
            </Row>
            <Row label="Prix unitaire">
              <Money amount={prix} mono={false} className="font-mono font-semibold" />
            </Row>
            <div className="pt-3 mt-3 border-t border-earth/8">
              <Row label="Total demandé">
                <Money
                  amount={parts * prix}
                  mono={false}
                  className="font-mono font-bold text-terra text-lg"
                />
              </Row>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button variant="outline" size="lg" className="sm:flex-1" onClick={() => setStep(0)}>
              <ArrowLeft strokeWidth={2} />
              Retour
            </Button>
            <Button
              size="lg"
              className="sm:flex-[2]"
              onClick={submitAnnonce}
              disabled={parts < 1 || prix <= 0 || creer.isPending}
            >
              {creer.isPending ? 'Publication...' : 'Publier l\'annonce'}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && created && (
        <div className="bg-sand-100 rounded-xl border border-earth/5 p-6 sm:p-10 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-success/15 animate-ping opacity-75" />
            <div className="relative w-20 h-20 rounded-full bg-success flex items-center justify-center shadow-card-hover">
              <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-2">
            Annonce publiée !
          </h1>
          <p className="font-body text-earth-600 text-sm sm:text-base mb-8 max-w-md mx-auto">
            Vos {created.nombreDePartsAVendre} parts de{' '}
            <span className="font-semibold text-earth">{created.proprieteNom}</span> sont
            désormais visibles sur le marché secondaire.
          </p>

          <div className="flex flex-col-reverse sm:flex-row gap-3 max-w-md mx-auto">
            <Button variant="outline" size="lg" className="sm:flex-1" onClick={() => navigate('/marche/secondaire')}>
              Voir le marché
            </Button>
            <Button size="lg" className="sm:flex-1" onClick={() => navigate('/marche/mes-annonces')}>
              Mes annonces
              <ArrowRight strokeWidth={2} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-earth-600 text-sm font-body">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}

// --- Helpers résolution ID propriété ---
// Le DTO Possession ne contient pas proprieteId dans les types V1.
// On le retrouve via les annonces existantes (qui ont proprieteId).
function findProprieteIdFromName(
  nom: string,
  annonces: AnnonceResponse[] | undefined
): number | null {
  return annonces?.find((a) => a.proprieteNom === nom)?.proprieteId ?? null
}

// Fallback : récupérer via l'API propriétés (le seed garantit qu'on les trouve par nom)
function findProprieteIdFromPossession(_p: PossessionResponse): number | null {
  // V1 : faute d'avoir proprieteId dans PossessionResponse, on lit depuis le cache des annonces.
  // À corriger backend en V2 (ajouter proprieteId au PossessionResponse).
  // Workaround temporaire : on lit depuis le DTO si disponible (cast)
  const anyP = _p as PossessionResponse & { proprieteId?: number }
  return anyP.proprieteId ?? null
}
