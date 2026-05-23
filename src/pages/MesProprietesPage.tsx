import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, MapPin, Plus } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useMesProprietesProposees } from '@/lib/api/submissions'
import { useStatutDeclaration } from '@/lib/api/revenus'
import { StatutDeclarationBadge } from '@/components/shared/StatutDeclarationBadge'
import type { ProprieteResponse } from '@/lib/api/types'

const PLACEHOLDER_IMAGE = '/images/villa-falaise.jpg'

export function MesProprietesPage() {
  const { data: proprietes, isLoading } = useMesProprietesProposees()
  const [refusInfo, setRefusInfo] = useState<ProprieteResponse | null>(null)

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
            Mes propriétés
          </h1>
          <p className="font-body text-earth-600 text-sm">
            Gérez les biens que vous avez soumis à la plateforme.
          </p>
        </div>
        <Button asChild>
          <Link to="/proposer-un-bien">
            <Plus strokeWidth={2} />
            Proposer un bien
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl bg-sand-300" />
          ))}
        </div>
      ) : !proprietes || proprietes.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucun bien proposé"
          description="Soumettez votre premier bien immobilier à la communauté Fursa pour lever des fonds."
          action={
            <Button asChild>
              <Link to="/proposer-un-bien">
                <Plus strokeWidth={2} />
                Proposer un bien
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {proprietes.map((p) => (
            <ProprieteCard
              key={p.id}
              propriete={p}
              onShowRefus={() => setRefusInfo(p)}
            />
          ))}
        </div>
      )}

      {/* Modal motif refus */}
      <Dialog open={!!refusInfo} onOpenChange={(o) => !o && setRefusInfo(null)}>
        <DialogContent className="bg-white border-earth/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-earth text-xl">
              Motif du refus
            </DialogTitle>
            <DialogDescription className="font-body text-earth-600 text-sm">
              {refusInfo?.nom}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-error/8 border border-error/20 rounded-md p-4 mt-2">
            <p className="font-body text-earth-700 text-sm leading-relaxed whitespace-pre-line">
              {refusInfo?.motifRefus ?? 'Aucun motif fourni.'}
            </p>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRefusInfo(null)}>
              Fermer
            </Button>
            <Button asChild>
              <Link to="/proposer-un-bien">Soumettre à nouveau</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProprieteCard({
  propriete: p,
  onShowRefus,
}: {
  propriete: ProprieteResponse
  onShowRefus: () => void
}) {
  const image = p.documents?.find((d) => d.type === 'IMAGE')
  const imageUrl = image
    ? `${import.meta.env.VITE_API_BASE}/api/fichiers/${image.url}`
    : PLACEHOLDER_IMAGE

  const total = p.nombreTotalPart ?? p.partsTotales ?? 0
  const dispo = p.partsDisponibles ?? 0
  const vendues = Math.max(0, total - dispo)
  const pourcentage = total > 0 ? Math.round((vendues / total) * 100) : 0
  const valeurLevee = vendues * p.prixUnitairePart

  const isRefusee = p.statut === 'REFUSEE'
  const isPubliee = p.statut === 'PUBLIEE'

  return (
    <article className="bg-sand-100 rounded-xl border border-earth/5 overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-sand-300">
        <img
          src={imageUrl}
          alt={p.nom}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
          <StatusBadge status={p.statut} />
          {isPubliee && <DeclarationBadgeInline proprieteId={p.id} />}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5">
        <Link
          to={`/mes-proprietes/${p.id}`}
          className="font-display font-semibold text-earth text-base mb-1 line-clamp-1 hover:text-terra transition-colors block"
        >
          {p.nom}
        </Link>
        <p className="flex items-center gap-1 text-earth-500 text-xs font-body mb-4">
          <MapPin className="w-3 h-3" strokeWidth={1.75} />
          {p.localisation}
        </p>

        {/* KPIs financiers */}
        <div className="grid grid-cols-2 gap-2 pb-4 mb-4 border-b border-earth/8">
          <div>
            <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide mb-0.5">
              Parts
            </p>
            <p className="font-mono font-semibold text-earth text-sm">
              {total.toLocaleString('fr-FR')}
            </p>
          </div>
          <div>
            <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide mb-0.5">
              Prix / part
            </p>
            <p className="font-mono font-semibold text-earth text-sm">
              <Money amount={p.prixUnitairePart} mono={false} />
            </p>
          </div>
        </div>

        {/* Selon statut */}
        {isPubliee && (
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="font-body text-[11px] text-earth-500 uppercase tracking-wide">
                Financement
              </p>
              <p className="font-mono text-[11px] text-earth tabular-nums">
                <Money amount={valeurLevee} mono={false} className="font-semibold" /> levés
              </p>
            </div>
            <ProgressBar value={pourcentage} size="sm" />
          </div>
        )}

        {isRefusee && p.motifRefus && (
          <button
            type="button"
            onClick={onShowRefus}
            className="w-full text-left bg-error/8 border border-error/20 rounded-md p-3 hover:bg-error/12 transition-colors"
          >
            <p className="font-body text-error text-xs font-semibold mb-1">
              Voir le motif du refus
            </p>
            <p className="font-body text-earth-700 text-xs line-clamp-2">
              {p.motifRefus}
            </p>
          </button>
        )}

        {p.statut === 'EN_REVIEW' && (
          <p className="font-body text-warning text-xs bg-warning/8 rounded-md p-3 text-center">
            En cours d'examen par notre équipe
          </p>
        )}

        {p.statut === 'ACCEPTEE' && (
          <p className="font-body text-ocean text-xs bg-ocean/8 rounded-md p-3 text-center">
            Validée — sera publiée prochainement
          </p>
        )}
      </div>
    </article>
  )
}

/**
 * Phase 10b : affiche le badge de declaration mensuelle sur la card propriete publiee.
 * Hook isole pour ne pas multiplier les requetes par card (chaque card a son propre id).
 */
function DeclarationBadgeInline({ proprieteId }: { proprieteId: number }) {
  const { data } = useStatutDeclaration(proprieteId)
  if (!data) return null
  return <StatutDeclarationBadge statut={data} size="sm" showMonth={false} />
}
