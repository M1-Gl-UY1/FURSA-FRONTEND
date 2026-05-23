import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  TrendingUp,
  PieChart,
  Coins,
  FileText,
  Share2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'

import { PropertyGallery } from '@/components/properties/PropertyGallery'
import { Money } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { useEscrowPropriete } from '@/lib/api/escrow'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { calculatePartsVendues, calculatePourcentageVendu, usePropriete } from '@/lib/api/proprietes'
import { useAuth } from '@/lib/auth/AuthContext'

export function OpportuniteDetailPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : NaN

  if (Number.isNaN(id)) {
    return <Navigate to="/opportunites" replace />
  }

  const { data: propriete, isLoading, isError } = usePropriete(id)
  const { isAdmin } = useAuth()

  if (isLoading) return <DetailSkeleton />

  if (isError || !propriete) {
    return (
      <div className="max-w-container mx-auto py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-earth text-xl mb-2">
          Propriété introuvable
        </h2>
        <p className="font-body text-earth-600 text-sm mb-6">
          Cette opportunité n'existe pas ou a été retirée.
        </p>
        <Button asChild>
          <Link to="/opportunites">Retour aux opportunités</Link>
        </Button>
      </div>
    )
  }

  const pourcentage = calculatePourcentageVendu(propriete)
  const partsVendues = calculatePartsVendues(propriete)
  const isPubliee = propriete.statut === 'PUBLIEE'
  const sansParts = (propriete.partsDisponibles ?? 0) <= 0
  const { data: escrow } = useEscrowPropriete(isPubliee ? propriete.id : null)

  function share() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: propriete?.nom, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success('Lien copié !'))
    }
  }

  return (
    <div className="max-w-container mx-auto">
      {/* Back link */}
      <Link
        to="/opportunites"
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour aux opportunités
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-10 items-start">
        {/* Colonne gauche : galerie + description */}
        <div>
          <PropertyGallery photos={propriete.photos} alt={propriete.nom} />

          {/* Header titre + meta */}
          <header className="mt-6 mb-6">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              {propriete.statut && <StatusBadge status={propriete.statut} />}
              {sansParts && <StatusBadge status="FINANCEE" />}
            </div>
            <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl lg:text-4xl mb-2 leading-tight">
              {propriete.nom}
            </h1>
            <p className="flex items-center gap-1.5 text-earth-600 text-sm font-body">
              <MapPin className="w-4 h-4" strokeWidth={1.75} />
              {propriete.localisation}
            </p>
          </header>

          {/* Description */}
          {propriete.description && (
            <section className="mb-8">
              <h2 className="font-display font-semibold text-earth text-lg mb-3">
                À propos de ce bien
              </h2>
              <p className="font-body text-earth-700 text-base leading-relaxed whitespace-pre-line">
                {propriete.description}
              </p>
            </section>
          )}

          {/* Documents */}
          {propriete.documents && propriete.documents.length > 0 && (
            <section className="mb-8">
              <h2 className="font-display font-semibold text-earth text-lg mb-3">
                Documents
              </h2>
              <ul className="space-y-2">
                {propriete.documents.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-sand-100 hover:bg-sand-200 rounded-lg border border-earth/5 text-earth font-body text-sm transition-colors"
                    >
                      <div className="w-10 h-10 rounded-md bg-ocean/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-ocean" strokeWidth={1.75} />
                      </div>
                      <span className="flex-1 truncate">{doc.nom ?? doc.fileName}</span>
                      <span className="text-earth-500 text-xs">Ouvrir</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Colonne droite : sticky panel achat */}
        <aside className="lg:sticky lg:top-20">
          <div className="bg-sand-100 rounded-xl border border-earth/5 shadow-card p-6">
            {/* Prix part */}
            <div className="mb-5 pb-5 border-b border-earth/8">
              <p className="font-body text-xs text-earth-500 uppercase tracking-wide mb-1">
                Prix par part
              </p>
              <p className="font-mono font-bold text-earth text-3xl">
                <Money amount={propriete.prixUnitairePart} mono={false} />
              </p>
            </div>

            {/* KPIs */}
            <dl className="space-y-4 mb-5 pb-5 border-b border-earth/8">
              <KpiRow
                icon={TrendingUp}
                label="Rentabilité estimée"
                value={`${propriete.rentabilitePrevue ?? 0}% / an`}
                accent="success"
              />
              <KpiRow
                icon={PieChart}
                label="Parts disponibles"
                value={`${(propriete.partsDisponibles ?? 0).toLocaleString('fr-FR')} / ${(propriete.nombreTotalPart ?? propriete.partsTotales ?? 0).toLocaleString('fr-FR')}`}
              />
              <KpiRow
                icon={Coins}
                label="Investissement minimum"
                value={<Money amount={propriete.prixUnitairePart} mono={false} />}
              />
            </dl>

            {/* Progression */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between mb-2">
                <p className="font-body text-xs text-earth-500 uppercase tracking-wide">
                  Financement
                </p>
                <p className="font-mono text-xs text-earth-600 tabular-nums">
                  {partsVendues.toLocaleString('fr-FR')} parts vendues
                </p>
              </div>
              <ProgressBar value={pourcentage} />
              {escrow && (
                <p className="mt-2 font-body text-[11px] text-earth-500 inline-flex items-center gap-1">
                  {escrow.statut === 'FINANCEE' ? (
                    <span className="text-success font-semibold">
                      ✓ Seuil de {escrow.seuilPct}% atteint — parts actives, dividendes en cours
                    </span>
                  ) : escrow.statut === 'ANNULEE' ? (
                    <span className="text-error font-semibold">
                      Collecte annulée — investisseurs remboursés
                    </span>
                  ) : (
                    <>
                      Seuil de déblocage à <strong>{escrow.seuilPct}%</strong> · vos parts
                      seront actives une fois le seuil atteint
                    </>
                  )}
                </p>
              )}
            </div>

            {/* CTA — masqué pour les admins (conflit d'intérêt + délit d'initié) */}
            {isAdmin ? (
              <div className="bg-warning/10 border border-warning/30 rounded-md p-4 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" strokeWidth={1.75} />
                <div>
                  <p className="font-body font-semibold text-earth text-sm mb-1">
                    Achat indisponible pour les administrateurs
                  </p>
                  <p className="font-body text-earth-600 text-xs leading-relaxed">
                    Pour préserver la neutralité de la plateforme, les comptes admin ne peuvent pas investir.
                  </p>
                </div>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full"
                disabled={!isPubliee || sansParts}
                asChild={isPubliee && !sansParts}
              >
                {isPubliee && !sansParts ? (
                  <Link to={`/opportunites/${propriete.id}/acheter`}>
                    Acheter des parts
                    <ArrowRight className="ml-1" strokeWidth={2} />
                  </Link>
                ) : (
                  <span>{sansParts ? 'Plus de parts disponibles' : 'Indisponible'}</span>
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="default"
              className="w-full mt-2"
              onClick={share}
            >
              <Share2 className="w-4 h-4" strokeWidth={1.75} />
              Partager
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

// --- Sous-composants ---

type KpiRowProps = {
  icon: typeof TrendingUp
  label: string
  value: React.ReactNode
  accent?: 'success' | 'default'
}

function KpiRow({ icon: Icon, label, value, accent = 'default' }: KpiRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={
          accent === 'success'
            ? 'w-9 h-9 rounded-md bg-success/10 flex items-center justify-center shrink-0'
            : 'w-9 h-9 rounded-md bg-ocean/10 flex items-center justify-center shrink-0'
        }
      >
        <Icon
          className={accent === 'success' ? 'w-4 h-4 text-success' : 'w-4 h-4 text-ocean'}
          strokeWidth={1.75}
        />
      </div>
      <div className="min-w-0">
        <dt className="font-body text-xs text-earth-500 mb-0.5">{label}</dt>
        <dd className="font-mono font-semibold text-earth text-sm">{value}</dd>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="max-w-container mx-auto">
      <Skeleton className="h-4 w-40 mb-5 bg-sand-300" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <Skeleton className="aspect-[16/9] w-full rounded-xl bg-sand-300" />
          <Skeleton className="h-8 w-2/3 mt-6 bg-sand-300" />
          <Skeleton className="h-4 w-1/3 mt-3 bg-sand-300" />
        </div>
        <Skeleton className="h-96 rounded-xl bg-sand-300" />
      </div>
    </div>
  )
}
