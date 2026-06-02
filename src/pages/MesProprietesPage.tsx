import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  Building2,
  Home,
  MapPin,
  PlayCircle,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react'

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
import { resolveFileUrl } from '@/lib/utils'
import { useMesProprietesProposees } from '@/lib/api/submissions'
import { useMesBrouillons, useSupprimerBrouillon } from '@/lib/api/brouillon'
import { toast } from 'sonner'
import { useStatutDeclaration } from '@/lib/api/revenus'
import { StatutDeclarationBadge } from '@/components/shared/StatutDeclarationBadge'
import { useCountUp } from '@/lib/hooks/useCountUp'
import type { ProprieteResponse } from '@/lib/api/types'

const PLACEHOLDER_IMAGE = '/images/villa-falaise.jpg'

export function MesProprietesPage() {
  const { data: proprietes, isLoading } = useMesProprietesProposees()
  const { data: brouillons } = useMesBrouillons()
  const supprimerBrouillon = useSupprimerBrouillon()

  // On exclut les brouillons de la grille principale (ils ont leur propre section).
  const proprietesNonBrouillon = useMemo(
    () => (proprietes ?? []).filter((p) => p.statut !== 'BROUILLON'),
    [proprietes]
  )
  const [refusInfo, setRefusInfo] = useState<ProprieteResponse | null>(null)

  const stats = useMemo(() => {
    const list = proprietes ?? []
    const publiees = list.filter((p) => p.statut === 'PUBLIEE')
    const enReview = list.filter((p) => p.statut === 'EN_REVIEW' || p.statut === 'ACCEPTEE')
    const totalLeve = publiees.reduce((sum, p) => {
      const total = p.nombreTotalPart ?? p.partsTotales ?? 0
      const dispo = p.partsDisponibles ?? 0
      const vendues = Math.max(0, total - dispo)
      return sum + vendues * (p.prixUnitairePart ?? 0)
    }, 0)
    return {
      total: list.length,
      publiees: publiees.length,
      enReview: enReview.length,
      totalLeve,
    }
  }, [proprietes])

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero header proprietaire */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ocean via-ocean-600 to-ocean-700 p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-20 w-72 h-72 bg-gold/15 rounded-full blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -left-20 w-72 h-72 bg-terra/15 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-center">
          <div>
            <p className="font-body text-xs uppercase tracking-widest text-gold-300 font-semibold mb-2 inline-flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" strokeWidth={2} />
              Espace propriétaire
            </p>
            <h1 className="font-display font-bold text-white text-2xl sm:text-3xl lg:text-4xl mb-2">
              Mes propriétés
            </h1>
            <p className="font-body text-white/80 text-sm sm:text-base">
              Gérez les biens que vous avez soumis à FURSA pour la mise en vente
              fractionnée.
            </p>
          </div>
          <Button asChild variant="secondary" className="bg-white text-ocean hover:bg-sand-50">
            <Link to="/proposer-un-bien">
              <Plus strokeWidth={2} />
              Proposer un nouveau bien
            </Link>
          </Button>
        </div>
      </header>

      {/* Stats agregees */}
      {!isLoading && stats.total > 0 && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatTile
            label="Biens soumis"
            target={stats.total}
            icon={Building2}
            color="bg-ocean/10 text-ocean"
          />
          <StatTile
            label="Publiés"
            target={stats.publiees}
            icon={BadgeCheck}
            color="bg-success/10 text-success"
          />
          <StatTile
            label="En examen"
            target={stats.enReview}
            icon={PlayCircle}
            color="bg-warning/10 text-warning"
          />
          <MoneyTile label="Total levé" target={stats.totalLeve} />
        </section>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl " />
          ))}
        </div>
      ) : (
        <>
        {/* Section Brouillons : biens en cours de soumission, non encore envoyes a l'admin */}
        {brouillons && brouillons.length > 0 && (
          <section className="bg-warning/5 border border-warning/20 rounded-xl p-5 sm:p-6">
            <header className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display font-semibold text-earth text-lg flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-warning text-white text-xs font-bold">
                    {brouillons.length}
                  </span>
                  Brouillons à finir
                </h2>
                <p className="font-body text-earth-600 text-xs mt-0.5">
                  Reprenez vos soumissions en cours. Vos données sont sauvegardées étape par étape.
                </p>
              </div>
            </header>
            <ul className="space-y-2.5">
              {brouillons.map((b) => (
                <li
                  key={b.id}
                  className="bg-white border border-warning/30 rounded-lg p-3 sm:p-4 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-earth text-sm truncate">
                      {b.nom && b.nom !== 'Brouillon' ? b.nom : 'Brouillon sans nom'}
                    </p>
                    <p className="font-body text-earth-500 text-xs">
                      {b.ville && b.pays
                        ? `${b.ville}, ${b.pays}`
                        : 'Localisation non renseignée'}
                      {b.soumiseLe && ` · démarré le ${new Date(b.soumiseLe).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/proposer-un-bien/${b.id}`}>
                      Continuer
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      if (confirm(`Supprimer définitivement ce brouillon ?`)) {
                        supprimerBrouillon.mutate(b.id, {
                          onSuccess: () => toast.success('Brouillon supprimé.'),
                          onError: () => toast.error('Suppression impossible.'),
                        })
                      }
                    }}
                    className="text-earth-500 hover:text-error"
                    aria-label="Supprimer le brouillon"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {proprietesNonBrouillon.length === 0 && (!brouillons || brouillons.length === 0) ? (
          <EmptyState
            icon={Building2}
            title="Aucun bien proposé"
            description="Soumettez votre premier bien immobilier à la communauté Fursa pour lever des fonds et garder une fraction."
            action={
              <Button asChild>
                <Link to="/proposer-un-bien">
                  <Plus strokeWidth={2} />
                  Proposer un bien
                </Link>
              </Button>
            }
          />
        ) : proprietesNonBrouillon.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {proprietesNonBrouillon.map((p) => (
              <ProprieteCard
                key={p.id}
                propriete={p}
                onShowRefus={() => setRefusInfo(p)}
              />
            ))}
          </div>
        ) : null}
        </>
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

// =============================================================================
// Stats tiles
// =============================================================================

type StatTileProps = {
  label: string
  target: number
  icon: typeof Building2
  color: string
}

function StatTile({ label, target, icon: Icon, color }: StatTileProps) {
  const [value, ref] = useCountUp({ target })
  return (
    <div
      ref={ref}
      className="bg-white rounded-xl border border-earth/8 shadow-card p-4 sm:p-5"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="font-body text-[10px] sm:text-xs text-earth-500 uppercase tracking-wide font-semibold">
          {label}
        </p>
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
      </div>
      <p className="font-mono font-bold text-earth text-2xl sm:text-3xl tabular-nums">
        {Math.round(value).toLocaleString('fr-FR')}
      </p>
    </div>
  )
}

function MoneyTile({ label, target }: { label: string; target: number }) {
  const [value, ref] = useCountUp({ target })
  return (
    <div
      ref={ref}
      className="bg-gradient-to-br from-success/10 to-ocean/5 rounded-xl border border-success/15 p-4 sm:p-5"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="font-body text-[10px] sm:text-xs text-success uppercase tracking-wide font-semibold">
          {label}
        </p>
        <div className="w-8 h-8 rounded-md flex items-center justify-center bg-success/15 text-success">
          <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
        </div>
      </div>
      <p className="font-mono font-bold text-earth text-xl sm:text-2xl tabular-nums">
        <Money amount={value} mono={false} />
      </p>
    </div>
  )
}

// =============================================================================
// Card
// =============================================================================

function ProprieteCard({
  propriete: p,
  onShowRefus,
}: {
  propriete: ProprieteResponse
  onShowRefus: () => void
}) {
  // Fix : passer par resolveFileUrl pour que l'URL relative renvoyee par le
  // backend (ex "/api/fichiers/abc.jpg") soit prefixee par VITE_API_BASE en prod.
  // Sans ca, le navigateur tape le frontend qui repond 404.
  const firstPhoto = p.photos?.[0]
  const imageUrl = firstPhoto ? resolveFileUrl(firstPhoto) : PLACEHOLDER_IMAGE

  const total = p.nombreTotalPart ?? p.partsTotales ?? 0
  const dispo = p.partsDisponibles ?? 0
  const vendues = Math.max(0, total - dispo)
  const pourcentage = total > 0 ? Math.round((vendues / total) * 100) : 0
  const valeurLevee = vendues * p.prixUnitairePart

  const isRefusee = p.statut === 'REFUSEE'
  const isPubliee = p.statut === 'PUBLIEE'
  const isCertifie = p.certifie === true || p.statutCertif === 'CERTIFIE'

  return (
    <article className="bg-white rounded-xl border border-earth/8 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
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
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {isCertifie && (
            <span className="inline-flex items-center gap-1 bg-success text-white text-[10px] font-semibold font-body rounded-full px-2.5 py-0.5 shadow-card">
              <BadgeCheck className="w-3 h-3" strokeWidth={2.25} />
              Certifié
            </span>
          )}
          {p.videoUrl && (
            <span className="inline-flex items-center bg-white/95 text-earth text-[10px] font-semibold font-body rounded-full px-2 py-0.5 shadow-card">
              <PlayCircle className="w-3 h-3 mr-1" strokeWidth={2} />
              Vidéo
            </span>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5 flex-1 flex flex-col">
        <Link
          to={`/mes-proprietes/${p.id}`}
          className="font-display font-bold text-earth text-base sm:text-lg mb-1 line-clamp-1 hover:text-terra transition-colors"
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
              Parts totales
            </p>
            <p className="font-mono font-bold text-earth text-base">
              {total.toLocaleString('fr-FR')}
            </p>
          </div>
          <div>
            <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide mb-0.5">
              Prix / part
            </p>
            <p className="font-mono font-bold text-earth text-base">
              <Money amount={p.prixUnitairePart} mono={false} />
            </p>
          </div>
        </div>

        {/* Selon statut */}
        <div className="mt-auto">
          {isPubliee && (
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <p className="font-body text-[11px] text-earth-500 uppercase tracking-wide">
                  Financement
                </p>
                <p className="font-mono text-[11px] text-earth tabular-nums">
                  <span className="font-bold">
                    <Money amount={valeurLevee} mono={false} />
                  </span>{' '}
                  <span className="text-earth-500">levés</span>
                </p>
              </div>
              <ProgressBar value={pourcentage} size="sm" />
              <p className="mt-1.5 font-mono text-[10px] text-earth-500 tabular-nums">
                {vendues.toLocaleString('fr-FR')}/{total.toLocaleString('fr-FR')} parts vendues
              </p>
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
              ⏳ En cours d'examen par notre équipe
            </p>
          )}

          {p.statut === 'ACCEPTEE' && (
            <p className="font-body text-ocean text-xs bg-ocean/8 rounded-md p-3 text-center">
              ✓ Validée — sera publiée prochainement
            </p>
          )}
        </div>
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
