import { Link } from 'react-router-dom'
import { Compass, MapPin, TrendingUp, Wallet } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Money } from '@/components/shared/Money'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMesPossessions } from '@/lib/api/portefeuille'

export function PortefeuillePage() {
  const { data: possessions, isLoading, isError } = useMesPossessions()

  const totalValeur = possessions?.reduce((s, p) => s + (p.valeurTotale ?? 0), 0) ?? 0
  const totalParts = possessions?.reduce((s, p) => s + (p.nombreDeParts ?? 0), 0) ?? 0
  const nbProprietes = possessions?.length ?? 0

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Mon portefeuille
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Vos parts, leur valeur actuelle et leur rendement estimé.
        </p>
      </header>

      {/* Totaux */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-sand-300" />
          ))
        ) : (
          <>
            <StatCard
              label="Valeur totale"
              value={<Money amount={totalValeur} mono={false} />}
              icon={Wallet}
              iconBg="bg-terra/10"
              iconColor="text-terra"
            />
            <StatCard
              label="Nombre de propriétés"
              value={nbProprietes}
              icon={MapPin}
              iconBg="bg-ocean/10"
              iconColor="text-ocean"
            />
            <StatCard
              label="Total parts détenues"
              value={totalParts.toLocaleString('fr-FR')}
              icon={TrendingUp}
              iconBg="bg-success/10"
              iconColor="text-success"
            />
          </>
        )}
      </section>

      {/* Liste possessions */}
      <section>
        <h2 className="font-display font-semibold text-earth text-lg mb-4">
          Mes possessions
        </h2>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl bg-sand-300" />
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            icon={Wallet}
            title="Impossible de charger vos possessions"
            description="Réessayez plus tard."
          />
        )}

        {!isLoading && !isError && (!possessions || possessions.length === 0) && (
          <EmptyState
            icon={Compass}
            title="Vous n'avez encore aucune part"
            description="Découvrez nos opportunités sélectionnées et commencez à investir."
            action={
              <Button asChild>
                <Link to="/opportunites">Voir les opportunités</Link>
              </Button>
            }
          />
        )}

        {possessions && possessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {possessions.map((p) => {
              const roiAnnuel = (p.valeurTotale * (p.rentabilitePrevue ?? 0)) / 100
              return (
                <article
                  key={p.id}
                  className="bg-sand-100 rounded-xl border border-earth/5 p-5 hover:shadow-card transition-shadow"
                >
                  <h3 className="font-display font-semibold text-earth text-base mb-1 leading-snug">
                    {p.proprieteNom}
                  </h3>
                  <p className="flex items-center gap-1 text-earth-500 text-xs font-body mb-4">
                    <MapPin className="w-3 h-3" strokeWidth={1.75} />
                    {p.localisation}
                  </p>

                  <dl className="space-y-2.5 pb-4 mb-4 border-b border-earth/8">
                    <Row label="Parts détenues">
                      <span className="font-mono font-semibold text-earth text-sm">
                        {p.nombreDeParts.toLocaleString('fr-FR')}
                      </span>
                    </Row>
                    <Row label="Prix unitaire">
                      <Money amount={p.prixUnitairePart} mono={false} className="text-sm" />
                    </Row>
                    <Row label="Valeur actuelle">
                      <Money amount={p.valeurTotale} mono={false} className="text-sm font-bold" />
                    </Row>
                  </dl>

                  <div className="bg-success/8 rounded-md p-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-success/15 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4 text-success" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[10px] text-earth-500 uppercase tracking-wide leading-none mb-0.5">
                        Revenus annuels estimés
                      </p>
                      <p className="font-mono font-bold text-success text-sm">
                        <Money amount={roiAnnuel} mono={false} />
                        <span className="text-earth-500 font-medium text-xs ml-1">
                          ({p.rentabilitePrevue}% / an)
                        </span>
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="font-body text-xs text-earth-500">{label}</dt>
      <dd className="font-mono text-earth tabular-nums">{children}</dd>
    </div>
  )
}
