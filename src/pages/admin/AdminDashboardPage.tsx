import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowLeftRight,
  Banknote,
  Building2,
  Coins,
  CreditCard,
  IdCard,
  PiggyBank,
  TrendingUp,
  Users,
} from 'lucide-react'

import { Money } from '@/components/shared/Money'
import { StatCard } from '@/components/shared/StatCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminDashboard, useAdminPaymentSessions, useAdminRevenus } from '@/lib/api/admin'
import { useAdminKycStats } from '@/lib/api/kyc'
import { useProprietes } from '@/lib/api/proprietes'
import { useAuth } from '@/lib/auth/AuthContext'

export function AdminDashboardPage() {
  const { user } = useAuth()
  const { data: dash, isLoading } = useAdminDashboard()
  const { data: proprietes } = useProprietes()
  const { data: revenus } = useAdminRevenus()
  const { data: kycStats } = useAdminKycStats()
  const { data: failedPayments } = useAdminPaymentSessions('FAILED')

  const enReview = (proprietes ?? []).filter((p) => p.statut === 'EN_REVIEW').length
  const revenusEnReview = (revenus ?? []).filter((r) => r.statut === 'EN_REVIEW').length
  const kycPending = (kycStats?.pending ?? 0) + (kycStats?.inReview ?? 0)
  const paymentsFailed = failedPayments?.length ?? 0

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Tableau de bord admin
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Bonjour {user?.prenom ?? 'admin'}, voici un aperçu de la plateforme.
        </p>
      </header>

      {/* Alerts - actions a prendre par l'admin */}
      {(enReview > 0 || revenusEnReview > 0 || kycPending > 0 || paymentsFailed > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kycPending > 0 && (
            <AlertCard
              to="/admin/kyc"
              icon={IdCard}
              count={kycPending}
              label={`Dossier${kycPending > 1 ? 's' : ''} KYC à examiner`}
              tone="warning"
            />
          )}
          {enReview > 0 && (
            <AlertCard
              to="/admin/proprietes?onglet=a-valider"
              icon={Building2}
              count={enReview}
              label={`Propriété${enReview > 1 ? 's' : ''} à valider`}
              tone="warning"
            />
          )}
          {revenusEnReview > 0 && (
            <AlertCard
              to="/admin/revenus?onglet=a-valider"
              icon={Banknote}
              count={revenusEnReview}
              label={`Revenu${revenusEnReview > 1 ? 's' : ''} à valider`}
              tone="warning"
            />
          )}
          {paymentsFailed > 0 && (
            <AlertCard
              to="/admin/paiements"
              icon={CreditCard}
              count={paymentsFailed}
              label={`Paiement${paymentsFailed > 1 ? 's' : ''} en échec`}
              tone="error"
            />
          )}
        </div>
      )}

      {/* KPIs principaux */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl " />
          ))
        ) : (
          <>
            <StatCard
              label="Investisseurs"
              value={dash?.nombreInvestisseurs ?? 0}
              icon={Users}
              iconBg="bg-ocean/10"
              iconColor="text-ocean"
            />
            <StatCard
              label="Propriétés"
              value={dash?.nombreProprietes ?? 0}
              icon={Building2}
              iconBg="bg-terra/10"
              iconColor="text-terra"
            />
            <StatCard
              label="Volume transactions"
              value={<Money amount={dash?.volumeTransactions} mono={false} />}
              icon={PiggyBank}
              iconBg="bg-success/10"
              iconColor="text-success"
            />
            <StatCard
              label="Dividendes distribués"
              value={<Money amount={dash?.dividendesDistribues} mono={false} />}
              icon={Coins}
              iconBg="bg-gold/15"
              iconColor="text-gold-600"
            />
          </>
        )}
      </section>

      {/* KPIs secondaires */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <MiniStat label="Parts vendues" value={dash?.partsVendues?.toLocaleString('fr-FR') ?? '—'} />
        <MiniStat label="Annonces ouvertes" value={dash?.annoncesOuvertes ?? '—'} />
        <MiniStat label="Soumissions en attente" value={enReview + revenusEnReview} />
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          icon={Building2}
          title="Propriétés"
          description="Examiner soumissions, publier, gérer le catalogue"
          to="/admin/proprietes"
          color="text-terra"
        />
        <ActionCard
          icon={TrendingUp}
          title="Revenus"
          description="Valider déclarations + déclencher distributions"
          to="/admin/revenus"
          color="text-success"
        />
        <ActionCard
          icon={ArrowLeftRight}
          title="Audit transactions"
          description="Historique complet des opérations"
          to="/admin/transactions"
          color="text-ocean"
        />
      </section>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-sand-100 rounded-lg border border-earth/5 px-4 py-3">
      <p className="font-body text-[11px] text-earth-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="font-mono font-bold text-earth text-lg sm:text-xl tabular-nums">{value}</p>
    </div>
  )
}

function ActionCard({
  icon: Icon,
  title,
  description,
  to,
  color,
}: {
  icon: typeof Building2
  title: string
  description: string
  to: string
  color: string
}) {
  return (
    <Link
      to={to}
      className="group bg-sand-100 hover:bg-sand-200/50 border border-earth/5 rounded-xl p-5 transition-all hover:shadow-card flex items-start gap-4"
    >
      <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center shrink-0 border border-earth/8">
        <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-earth text-sm mb-1">{title}</h3>
        <p className="font-body text-earth-500 text-xs leading-snug">{description}</p>
      </div>
      <ArrowRight
        className="w-4 h-4 text-earth-400 group-hover:translate-x-1 group-hover:text-earth transition-all shrink-0 mt-1"
        strokeWidth={1.75}
      />
    </Link>
  )
}

function AlertCard({
  to,
  icon: Icon,
  count,
  label,
  tone,
}: {
  to: string
  icon: typeof Building2
  count: number
  label: string
  tone: 'warning' | 'error'
}) {
  const cls = tone === 'error'
    ? 'bg-error/10 border-error/30 hover:bg-error/15 [&_.icon-bg]:bg-error/20 [&_.icon]:text-error [&_.count]:text-error [&_.arrow]:text-error'
    : 'bg-warning/10 border-warning/30 hover:bg-warning/15 [&_.icon-bg]:bg-warning/20 [&_.icon]:text-warning [&_.count]:text-warning [&_.arrow]:text-warning'
  return (
    <Link
      to={to}
      className={`${cls} border rounded-xl p-5 transition-colors flex items-center gap-4 group`}
    >
      <div className="icon-bg w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
        <Icon className="icon w-6 h-6" strokeWidth={1.75} />
      </div>
      <div className="flex-1">
        <p className="count font-mono font-bold text-2xl">{count}</p>
        <p className="font-body text-earth text-sm font-semibold">{label}</p>
      </div>
      <ArrowRight className="arrow w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={1.75} />
    </Link>
  )
}

