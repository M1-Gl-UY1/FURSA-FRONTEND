import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Repeat,
  ShoppingCart,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Money } from '@/components/shared/Money'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { useAcheterAnnonce, useAnnonce } from '@/lib/api/annonces'
import { extractApiError } from '@/lib/api/errors'
import { useAuth } from '@/lib/auth/AuthContext'

export function AnnonceDetailPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : NaN

  if (Number.isNaN(id)) return <Navigate to="/marche/secondaire" replace />

  const { data: annonce, isLoading, isError } = useAnnonce(id)
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [parts, setParts] = useState(1)
  const navigate = useNavigate()
  const acheter = useAcheterAnnonce()

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-8 w-40 mb-6 bg-sand-300" />
        <Skeleton className="h-72 w-full rounded-xl bg-sand-300" />
      </div>
    )
  }

  if (isError || !annonce) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-earth text-xl mb-2">
          Annonce introuvable
        </h2>
        <Button asChild>
          <Link to="/marche/secondaire">Retour au marché secondaire</Link>
        </Button>
      </div>
    )
  }

  const isOwn = user?.id === annonce.vendeurId
  const isOpen = annonce.statut === 'OUVERTE'
  const total = parts * annonce.prixUnitaireDemande
  const totalAnnonce = annonce.partsAVendre * annonce.prixUnitaireDemande

  function startBuy() {
    setParts(1)
    setOpen(true)
  }

  function confirmBuy() {
    acheter.mutate(
      { annonceId: annonce!.id, payload: { partsAchetees: parts } },
      {
        onSuccess: (res) => {
          setOpen(false)
          toast.success(
            `${res.partsAchetees} parts achetées pour ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(res.montantTotal)}.`
          )
          navigate('/portefeuille')
        },
        onError: (err) => {
          toast.error(extractApiError(err, 'Achat impossible.'))
        },
      }
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/marche/secondaire"
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour au marché secondaire
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-10 items-start">
        {/* Colonne gauche : info principale */}
        <div>
          <div className="aspect-[16/9] rounded-xl overflow-hidden bg-sand-300 mb-6">
            <img
              src={annonce.proprieteImage ?? '/images/villa-falaise.jpg'}
              alt={annonce.proprieteNom}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex items-center flex-wrap gap-2 mb-3">
            <StatusBadge status={annonce.statut} />
            <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-semibold rounded-full px-2.5 py-1">
              <Repeat className="w-3 h-3" strokeWidth={2.25} />
              Marché secondaire
            </span>
          </div>

          <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-2">
            {annonce.proprieteNom}
          </h1>

          <div className="bg-sand-100 rounded-xl border border-earth/5 p-5 mb-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-earth/8">
              <div className="w-10 h-10 rounded-full bg-ocean/10 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-ocean" strokeWidth={1.75} />
              </div>
              <div>
                <p className="font-body font-semibold text-earth text-sm">
                  {annonce.vendeurNom ?? `Investisseur #${annonce.vendeurId}`}
                </p>
                <p className="font-body text-earth-500 text-xs">Vendeur</p>
              </div>
            </div>
            <p className="font-body text-earth-700 text-sm leading-relaxed">
              Cet investisseur vend{' '}
              <span className="font-mono font-semibold text-earth">
                {annonce.partsAVendre}
              </span>{' '}
              parts de cette propriété au prix unitaire de{' '}
              <Money
                amount={annonce.prixUnitaireDemande}
                mono={false}
                className="font-mono font-semibold text-earth"
              />
              .
            </p>
          </div>
        </div>

        {/* Colonne droite : panel achat */}
        <aside className="lg:sticky lg:top-20">
          <div className="bg-sand-100 rounded-xl border border-earth/5 shadow-card p-6">
            <div className="mb-5 pb-5 border-b border-earth/8">
              <p className="font-body text-xs text-earth-500 uppercase tracking-wide mb-1">
                Total annonce
              </p>
              <p className="font-mono font-bold text-earth text-3xl">
                <Money amount={totalAnnonce} mono={false} />
              </p>
            </div>

            <dl className="space-y-3 mb-6 pb-5 border-b border-earth/8">
              <Row label="Parts à vendre">
                <span className="font-mono font-semibold text-earth">
                  {annonce.partsAVendre.toLocaleString('fr-FR')}
                </span>
              </Row>
              <Row label="Prix unitaire" accent>
                <Money
                  amount={annonce.prixUnitaireDemande}
                  mono={false}
                  className="font-mono font-semibold text-success"
                />
              </Row>
              <Row label="Statut">
                <StatusBadge status={annonce.statut} size="sm" />
              </Row>
            </dl>

            {isOwn ? (
              <div className="bg-ocean/8 rounded-md p-4 text-center">
                <p className="font-body text-ocean text-sm font-medium mb-3">
                  C'est votre annonce.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/marche/mes-annonces">Gérer mes annonces</Link>
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full"
                disabled={!isOpen}
                onClick={startBuy}
              >
                <ShoppingCart strokeWidth={2} />
                {isOpen ? 'Acheter ces parts' : 'Annonce indisponible'}
              </Button>
            )}
          </div>
        </aside>
      </div>

      {/* Modal achat */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-earth/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-earth text-xl">
              Acheter des parts
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="bg-sand-100 rounded-md p-3">
              <p className="font-body text-xs text-earth-500 mb-0.5">Propriété</p>
              <p className="font-body font-semibold text-earth text-sm">
                {annonce.proprieteNom}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label htmlFor="parts-buy">Nombre de parts à acheter</Label>
                <Input
                  id="parts-buy"
                  type="number"
                  min={1}
                  max={annonce.partsAVendre}
                  value={parts}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10)
                    if (!Number.isNaN(n)) {
                      setParts(Math.max(1, Math.min(annonce.partsAVendre, n)))
                    }
                  }}
                  className="w-24 h-10 text-right font-mono font-semibold"
                />
              </div>
              <Slider
                value={[parts]}
                min={1}
                max={annonce.partsAVendre}
                step={1}
                onValueChange={([v]) => setParts(v)}
              />
              <div className="flex justify-between text-xs font-mono text-earth-500 mt-2">
                <span>1</span>
                <span>{annonce.partsAVendre.toLocaleString('fr-FR')}</span>
              </div>
            </div>

            <div className="bg-white rounded-md border border-earth/8 p-4 space-y-2">
              <Row label="Prix unitaire">
                <Money amount={annonce.prixUnitaireDemande} mono={false} className="font-mono text-sm" />
              </Row>
              <div className="pt-2 mt-2 border-t border-earth/8">
                <Row label="Total à payer">
                  <Money amount={total} mono={false} className="font-mono font-bold text-earth text-base" />
                </Row>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={acheter.isPending}
            >
              Annuler
            </Button>
            <Button onClick={confirmBuy} disabled={acheter.isPending}>
              {acheter.isPending ? (
                'Traitement...'
              ) : (
                <>
                  <CheckCircle2 strokeWidth={2} />
                  Confirmer l'achat
                  <ArrowRight strokeWidth={2} />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({
  label,
  children,
  accent = false,
}: {
  label: string
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={accent ? 'text-success text-sm font-body inline-flex items-center gap-1.5' : 'text-earth-600 text-sm font-body'}>
        {accent && <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />}
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
  )
}
