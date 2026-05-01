import { Link, Navigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Clock,
  Coins,
  FileText,
  ImageIcon,
  MapPin,
  Plus,
  TrendingUp,
} from 'lucide-react'

import { Money } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMesRevenus } from '@/lib/api/revenus'
import { useMaProprieteProposee } from '@/lib/api/submissions'

export function MaProprieteDetailPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam ? Number(idParam) : NaN

  if (Number.isNaN(id)) return <Navigate to="/mes-proprietes" replace />

  const { data: p, isLoading, isError } = useMaProprieteProposee(id)
  const { data: mesRevenus } = useMesRevenus()

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40 bg-sand-300" />
        <Skeleton className="aspect-[16/9] rounded-xl bg-sand-300" />
        <Skeleton className="h-32 rounded-xl bg-sand-300" />
      </div>
    )
  }

  if (isError || !p) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-earth text-xl mb-2">
          Propriété introuvable
        </h2>
        <Button asChild>
          <Link to="/mes-proprietes">Retour à mes propriétés</Link>
        </Button>
      </div>
    )
  }

  const total = p.nombreTotalPart ?? p.partsTotales ?? 0
  const dispo = p.partsDisponibles ?? 0
  const vendues = Math.max(0, total - dispo)
  const pourcentage = total > 0 ? Math.round((vendues / total) * 100) : 0
  const valeurLevee = vendues * p.prixUnitairePart
  const valeurTotale = total * p.prixUnitairePart
  const isPubliee = p.statut === 'PUBLIEE'

  const photos = p.documents?.filter((d) => d.type === 'IMAGE') ?? []
  const docs = p.documents?.filter((d) => d.type === 'PDF') ?? []
  const apiBase = import.meta.env.VITE_API_BASE
  const fileUrl = (urlOrName: string) => `${apiBase}/api/fichiers/${urlOrName}`

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        to="/mes-proprietes"
        className="inline-flex items-center gap-1.5 text-earth-600 hover:text-earth text-sm font-body transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour à mes propriétés
      </Link>

      {/* Header bien */}
      <header>
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <StatusBadge status={p.statut} />
        </div>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-2">
          {p.nom}
        </h1>
        <p className="flex items-center gap-1.5 text-earth-600 text-sm font-body">
          <MapPin className="w-4 h-4" strokeWidth={1.75} />
          {p.localisation}
        </p>
      </header>

      {/* Bandeau statut */}
      {p.statut === 'EN_REVIEW' && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-5 flex items-start gap-4">
          <Clock className="w-6 h-6 text-warning shrink-0" strokeWidth={1.75} />
          <div>
            <p className="font-body font-semibold text-earth text-sm mb-1">
              En cours d'examen
            </p>
            <p className="font-body text-earth-600 text-sm">
              Notre équipe étudie votre soumission. Vous recevrez une notification dès qu'une décision aura été prise.
            </p>
          </div>
        </div>
      )}

      {p.statut === 'REFUSEE' && p.motifRefus && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-5 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-error shrink-0" strokeWidth={1.75} />
          <div className="min-w-0">
            <p className="font-body font-semibold text-earth text-sm mb-1">
              Soumission refusée
            </p>
            <p className="font-body text-earth-700 text-sm whitespace-pre-line">
              {p.motifRefus}
            </p>
          </div>
        </div>
      )}

      {/* KPIs financiers */}
      {isPubliee && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Fonds levés"
            value={<Money amount={valeurLevee} mono={false} />}
            trend={pourcentage}
            trendLabel={`sur ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(valeurTotale)}`}
          />
          <StatCard
            label="Parts vendues"
            value={`${vendues.toLocaleString('fr-FR')} / ${total.toLocaleString('fr-FR')}`}
          />
          <StatCard
            label="Rentabilité estimée"
            value={`${p.rentabilitePrevue}% / an`}
            icon={TrendingUp}
            iconBg="bg-success/10"
            iconColor="text-success"
          />
        </section>
      )}

      {/* Progression */}
      {isPubliee && (
        <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
          <h2 className="font-display font-semibold text-earth text-lg mb-3">
            Progression du financement
          </h2>
          <ProgressBar value={pourcentage} />
          <p className="font-body text-earth-500 text-xs mt-3">
            <span className="font-mono font-semibold text-earth">{vendues.toLocaleString('fr-FR')}</span> parts vendues sur{' '}
            <span className="font-mono">{total.toLocaleString('fr-FR')}</span>
          </p>
        </section>
      )}

      {/* Description */}
      {p.description && (
        <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
          <h2 className="font-display font-semibold text-earth text-lg mb-3">
            Description
          </h2>
          <p className="font-body text-earth-700 text-sm leading-relaxed whitespace-pre-line">
            {p.description}
          </p>
        </section>
      )}

      {/* Revenus déclarés (uniquement si propriété PUBLIEE) */}
      {isPubliee && (
        <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display font-semibold text-earth text-lg flex items-center gap-2">
                <Coins className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
                Revenus déclarés
              </h2>
              <p className="font-body text-earth-500 text-xs mt-0.5">
                Déclarez les loyers / revenus perçus pour distribution aux investisseurs.
              </p>
            </div>
            <Button asChild size="sm">
              <Link to={`/mes-proprietes/${id}/declarer-revenu`}>
                <Plus strokeWidth={2} />
                Déclarer un revenu
              </Link>
            </Button>
          </header>

          <RevenusList proprieteId={id} mesRevenus={mesRevenus ?? []} />
        </section>
      )}

      {/* Méta */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-6">
        <h2 className="font-display font-semibold text-earth text-lg mb-3">
          Détails
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Meta icon={CalendarDays} label="Soumise le">
            {p.soumiseLe
              ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(p.soumiseLe))
              : '—'}
          </Meta>
          <Meta icon={CalendarDays} label="Créée le">
            {p.dateCreation
              ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(p.dateCreation))
              : '—'}
          </Meta>
        </div>
      </section>

      {/* Photos */}
      {photos.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-earth text-lg mb-3 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
            Photos ({photos.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((d) => (
              <a
                key={d.id}
                href={fileUrl(d.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-md overflow-hidden bg-sand-300 hover:opacity-90 transition-opacity"
              >
                <img
                  src={fileUrl(d.url)}
                  alt={d.nom ?? d.fileName ?? 'Photo'}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Documents */}
      {docs.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-earth text-lg mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
            Documents ({docs.length})
          </h2>
          <ul className="space-y-2">
            {docs.map((d) => (
              <li key={d.id}>
                <a
                  href={fileUrl(d.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-sand-100 hover:bg-sand-200 rounded-lg border border-earth/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-md bg-ocean/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-ocean" strokeWidth={1.75} />
                  </div>
                  <span className="flex-1 truncate font-body text-earth text-sm">
                    {d.nom ?? d.fileName ?? d.url}
                  </span>
                  <span className="text-earth-500 text-xs">Ouvrir</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function RevenusList({
  proprieteId,
  mesRevenus,
}: {
  proprieteId: number
  mesRevenus: import('@/lib/api/types').RevenuResponse[]
}) {
  const filtered = mesRevenus.filter((r) => r.proprieteId === proprieteId)

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-md border border-dashed border-earth/15 p-6 text-center">
        <p className="font-body text-earth-500 text-sm">
          Aucun revenu déclaré pour cette propriété.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {filtered.map((r) => (
        <li
          key={r.id}
          className="bg-white rounded-md border border-earth/8 p-4 flex items-center justify-between gap-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Money
                amount={r.montantTotal}
                mono={false}
                className="font-mono font-bold text-earth text-base"
              />
              {r.statut && <StatusBadge status={r.statut} size="sm" />}
            </div>
            {(r.periodeDebut || r.periodeFin) && (
              <p className="font-body text-earth-500 text-xs">
                Période : {r.periodeDebut ?? '—'} → {r.periodeFin ?? '—'}
              </p>
            )}
            {r.statut === 'REFUSE' && r.motifRefus && (
              <p className="font-body text-error text-xs mt-1">
                Motif : {r.motifRefus}
              </p>
            )}
          </div>
          <span className="font-mono text-earth-500 text-xs whitespace-nowrap">
            {r.date
              ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(r.date))
              : ''}
          </span>
        </li>
      ))}
    </ul>
  )
}

function Meta({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center shrink-0 border border-earth/8">
        <Icon className="w-4 h-4 text-earth-500" strokeWidth={1.75} />
      </div>
      <div>
        <p className="font-body text-xs text-earth-500">{label}</p>
        <p className="font-body text-sm text-earth font-medium">{children}</p>
      </div>
    </div>
  )
}
