import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useKycMe } from '@/lib/api/kyc'
import { useAuth } from '@/lib/auth/AuthContext'
import { cn } from '@/lib/utils'

/**
 * Bandeau persistant en haut de l'app investisseur qui affiche le statut KYC courant.
 *
 *   NONE     : "Verifiez votre identite pour investir"      → CTA vers /compte/kyc
 *   PENDING  : "Dossier en cours d'examen"
 *   IN_REVIEW: "Un agent examine votre dossier"
 *   APPROVED : (rien — bandeau masque)
 *   REJECTED : "Dossier refuse : <motif>" + CTA pour recommencer
 *   EXPIRED  : "Votre verification a expire, refaites-la"
 */
export function KycStatusBanner({ className }: { className?: string }) {
  const { data, isLoading } = useKycMe()
  const { user } = useAuth()

  // Source de verite fonctionnelle : Investisseur.isVerified.
  // Peut etre true sans que la derniere KycSubmission soit APPROVED
  // (validation manuelle BDD, migration historique, etc.). On masque
  // le bandeau dans ce cas pour eviter de paniquer un user verifie.
  if (user?.isVerified === true) return null

  if (isLoading || !data) return null
  if (data.statut === 'APPROVED') return null

  const config = getConfig(data.statut, data.submission?.motifRefus ?? null)

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-lg border text-sm font-body',
        config.bgClass,
        className
      )}
      role="status"
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <config.Icon className={cn('w-5 h-5 shrink-0', config.iconClass)} strokeWidth={1.75} />
        <div className="min-w-0">
          <p className="font-semibold text-earth">{config.title}</p>
          {config.description && (
            <p className="text-earth-600 text-xs mt-0.5 break-words">{config.description}</p>
          )}
        </div>
      </div>
      {config.cta && (
        <Button asChild size="sm" variant={config.ctaVariant ?? 'default'} className="shrink-0">
          <Link to="/compte/kyc">{config.cta}</Link>
        </Button>
      )}
    </div>
  )
}

function getConfig(statut: string, motifRefus: string | null) {
  switch (statut) {
    case 'NONE':
      return {
        Icon: AlertTriangle,
        iconClass: 'text-warning',
        bgClass: 'bg-warning/10 border-warning/30',
        title: 'Vérifiez votre identité pour pouvoir investir',
        description: 'Quelques minutes — une pièce d\'identité, un selfie, un justificatif de domicile.',
        cta: 'Commencer la vérification',
        ctaVariant: 'default' as const,
      }
    case 'PENDING':
      return {
        Icon: Clock,
        iconClass: 'text-ocean',
        bgClass: 'bg-ocean/10 border-ocean/30',
        title: 'Dossier en cours d\'examen',
        description: 'Vous serez notifié par email dès qu\'un agent aura examiné votre dossier (24-72h).',
        cta: 'Voir mon dossier',
        ctaVariant: 'outline' as const,
      }
    case 'IN_REVIEW':
      return {
        Icon: Clock,
        iconClass: 'text-ocean',
        bgClass: 'bg-ocean/10 border-ocean/30',
        title: 'Un agent examine actuellement votre dossier',
        description: 'Plus que quelques instants. Vous recevrez une notification dès la décision.',
        cta: 'Voir mon dossier',
        ctaVariant: 'outline' as const,
      }
    case 'REJECTED':
      return {
        Icon: XCircle,
        iconClass: 'text-error',
        bgClass: 'bg-error/10 border-error/30',
        title: 'Dossier refusé',
        description: motifRefus ?? 'Veuillez recommencer après correction.',
        cta: 'Re-soumettre',
        ctaVariant: 'default' as const,
      }
    case 'EXPIRED':
      return {
        Icon: AlertTriangle,
        iconClass: 'text-warning',
        bgClass: 'bg-warning/10 border-warning/30',
        title: 'Votre vérification d\'identité a expiré',
        description: 'Pour continuer à investir, mettez à jour vos documents.',
        cta: 'Renouveler',
        ctaVariant: 'default' as const,
      }
    default:
      return {
        Icon: CheckCircle2,
        iconClass: 'text-success',
        bgClass: 'bg-success/10 border-success/30',
        title: 'Statut KYC',
        description: null,
        cta: null,
        ctaVariant: undefined,
      }
  }
}
