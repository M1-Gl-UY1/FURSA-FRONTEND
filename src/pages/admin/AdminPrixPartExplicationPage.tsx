import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  HelpCircle,
  Info,
  LineChart,
  TrendingUp,
  Users,
} from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useConstantesPrixPart } from '@/lib/api/prix-part'
import type { ConstantesFormulePrix } from '@/lib/api/types'

/**
 * V2 M (07/06/2026) : page admin "Modele de prix dynamique".
 *
 * Documentation visuelle du mecanisme : formule, role de chaque variable,
 * d'ou viennent les chiffres, valeurs des constantes en vigueur. Pas de bien
 * specifique ici — uniquement la pedagogie. Le diagnostic par bien est sur
 * AdminPrixPartPage.
 */
export function AdminPrixPartExplicationPage() {
  const { data: constantes, isLoading, isError } = useConstantesPrixPart()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Modèle de prix dynamique
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Comment le prix d'une part évolue dans le temps. Chaque variable, sa source
          et la valeur des coefficients en vigueur.
        </p>
      </header>

      {/* La formule */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-7">
        <h2 className="font-display font-semibold text-earth text-lg mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-ocean" strokeWidth={1.75} />
          La formule
        </h2>
        <div className="bg-white rounded-lg border border-earth/10 p-5 font-mono text-center">
          <span className="text-earth-500 text-sm">prix_courant</span>
          <span className="text-earth-400 mx-2">=</span>
          <span className="text-ocean font-semibold">prix_initial</span>
          <span className="text-earth-400 mx-2">×</span>
          <span className="text-earth-500">(</span>
          <span className="text-earth font-semibold">1</span>
          <span className="text-earth-400 mx-1">+</span>
          <span className="text-success font-semibold">bonus_rentabilité</span>
          <span className="text-earth-400 mx-1">+</span>
          <span className="text-terra font-semibold">bonus_demande</span>
          <span className="text-earth-500">)</span>
        </div>
        <p className="text-earth-600 text-xs font-body mt-3 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-earth-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
          Le résultat est ensuite borné entre un <strong>plancher</strong> et un <strong>plafond</strong>
          {' '}(voir plus bas) pour éviter toute dérive.
        </p>
      </section>

      {/* Les variables une par une */}
      <section className="space-y-3">
        <h2 className="font-display font-semibold text-earth text-lg flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
          Les trois variables
        </h2>

        <VariableCard
          icon={LineChart}
          color="ocean"
          title="prix_initial"
          role="La valeur de référence : le prix unitaire d'une part au moment où le bien est publié."
          origin="Figé à la première publication du bien (snapshot stocké dans la colonne prix_initial_part)."
          impact="Ne bouge jamais. Sert de base de calcul pour le prix courant et pour les bornes plancher/plafond."
        />

        <VariableCard
          icon={TrendingUp}
          color="success"
          title="bonus_rentabilité"
          role="Ajustement positif ou négatif accumulé selon les revenus réels du bien comparés à la rentabilité annoncée."
          origin={
            <>
              Mis à jour à chaque <strong>revenu trimestriel validé</strong> par l'admin :
              <ol className="list-decimal list-inside mt-2 space-y-1 text-earth-600">
                <li>
                  <span className="font-mono">rentabilité_réelle = (revenu_net ÷ valeur_mise_en_vente) × 4 × 100</span>
                  {' '}(annualisée)
                </li>
                <li>
                  <span className="font-mono">écart = rentabilité_réelle − rentabilité_prévue</span>
                  {' '}(en points de %)
                </li>
                <li>
                  <span className="font-mono">contribution = écart × lissage</span>
                  {' '}(coefficient de lissage : {constantes ? fmtPct(constantes.lissageRentabilite, 1) : '…'})
                </li>
                <li>Bornée à ± cap_par_trimestre, puis ajoutée au bonus cumulé.</li>
                <li>Le bonus total est lui-même borné par cap_total.</li>
              </ol>
            </>
          }
          impact="Devient positif si le bien rapporte plus que prévu, négatif sinon. C'est le moteur principal de la valorisation à long terme."
        />

        <VariableCard
          icon={Users}
          color="terra"
          title="bonus_demande"
          role="Reflète la pression d'achat : plus la liste d'attente est longue par rapport au nombre de parts, plus le prix monte."
          origin={
            <>
              Recalculé à chaque inscription / désinscription en <strong>liste d'attente</strong> :
              <ol className="list-decimal list-inside mt-2 space-y-1 text-earth-600">
                <li>
                  <span className="font-mono">ratio = personnes_en_attente ÷ nombre_total_parts</span>
                </li>
                <li>
                  <span className="font-mono">bonus_demande = ratio × coef_demande</span>
                  {' '}(coefficient demande : {constantes ? fmtPct(constantes.coefDemande, 0) : '…'})
                </li>
                <li>Borné en haut par cap_demande, jamais négatif.</li>
              </ol>
            </>
          }
          impact="Strictement positif. Effet instantané (recalcul à chaque mouvement de la liste d'attente)."
        />
      </section>

      {/* Tableau des constantes en vigueur */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-7">
        <h2 className="font-display font-semibold text-earth text-lg mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-warning" strokeWidth={1.75} />
          Constantes en vigueur
        </h2>
        <p className="text-earth-600 text-sm font-body mb-4">
          Ces coefficients sont définis dans <span className="font-mono text-xs">PrixPartService.java</span>.
          Toute modification nécessite un redéploiement backend.
        </p>

        {isLoading && <Skeleton className="h-72 w-full rounded-lg" />}

        {isError && (
          <EmptyState
            icon={AlertTriangle}
            title="Constantes indisponibles"
            description="Le backend n'a pas répondu. Réessayez plus tard."
          />
        )}

        {constantes && <ConstantesTable c={constantes} />}
      </section>

      {/* Bornes */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-7">
        <h2 className="font-display font-semibold text-earth text-lg mb-4 flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-success" strokeWidth={1.75} />
          Bornes plancher / plafond
        </h2>
        <p className="text-earth-600 text-sm font-body mb-4">
          Quoi qu'il arrive, le prix courant reste dans cet intervalle. Si le calcul brut sort
          de la zone, on tronque à la borne la plus proche et un avertissement est journalisé.
        </p>
        {constantes && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border-[1.5px] border-error/30 p-4">
              <p className="text-earth-500 text-xs font-body uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ArrowDownRight className="w-3.5 h-3.5 text-error" strokeWidth={2} />
                Plancher
              </p>
              <p className="font-display font-bold text-earth text-2xl">
                {fmtPct(constantes.plancherPrixPct, 0)}
              </p>
              <p className="text-earth-600 text-xs font-body mt-1">
                Le prix ne peut jamais descendre sous {fmtPct(constantes.plancherPrixPct, 0)} du prix initial.
              </p>
            </div>
            <div className="bg-white rounded-lg border-[1.5px] border-success/30 p-4">
              <p className="text-earth-500 text-xs font-body uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-success" strokeWidth={2} />
                Plafond
              </p>
              <p className="font-display font-bold text-earth text-2xl">
                {fmtPct(constantes.plafondPrixPct, 0)}
              </p>
              <p className="text-earth-600 text-xs font-body mt-1">
                Le prix ne peut jamais dépasser {fmtPct(constantes.plafondPrixPct, 0)} du prix initial.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Exemple chiffré */}
      <section className="bg-sand-100 rounded-xl border border-earth/5 p-5 sm:p-7">
        <h2 className="font-display font-semibold text-earth text-lg mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-ocean" strokeWidth={1.75} />
          Exemple chiffré
        </h2>
        <p className="text-earth-600 text-sm font-body mb-4">
          Appartement valorisé 100 000 USD, découpé en 100 parts (1 part = 1 000 USD initial),
          80% mis en vente, rentabilité prévue 8% / an.
        </p>
        <ol className="space-y-3 font-body text-earth-700 text-sm">
          <li className="bg-white rounded-lg border border-earth/10 p-3">
            <span className="font-semibold text-earth">Q1 — revenu déclaré : 2 000 USD net.</span>{' '}
            Rentabilité réelle = (2 000 ÷ 80 000) × 4 × 100 = <strong>10%</strong>. Écart = +2 pts →
            contribution = +1%. Bonus rentabilité passe à <strong>+1%</strong>. Pas de liste d'attente
            → bonus demande = 0%. <span className="font-mono text-ocean">Prix : 1 000 × 1,01 = 1 010 USD/part.</span>
          </li>
          <li className="bg-white rounded-lg border border-earth/10 p-3">
            <span className="font-semibold text-earth">Q2 — revenu : 2 500 USD net.</span>{' '}
            Rentabilité réelle 12,5%. Écart +4,5 pts → contribution +2,25%. Bonus cumulé{' '}
            <strong>+3,25%</strong>. <span className="font-mono text-ocean">Prix : 1 000 × 1,0325 = 1 032,50 USD/part.</span>
          </li>
          <li className="bg-white rounded-lg border border-earth/10 p-3">
            <span className="font-semibold text-earth">20 personnes en liste d'attente (sur 100 parts).</span>{' '}
            Ratio = 0,20 → bonus demande = 0,20 × 0,40 = <strong>+8%</strong>.{' '}
            <span className="font-mono text-ocean">
              Prix : 1 000 × (1 + 0,0325 + 0,08) = 1 112,50 USD/part.
            </span>
          </li>
        </ol>
      </section>
    </div>
  )
}

function VariableCard({
  icon: Icon,
  color,
  title,
  role,
  origin,
  impact,
}: {
  icon: typeof Calculator
  color: 'ocean' | 'success' | 'terra'
  title: string
  role: React.ReactNode
  origin: React.ReactNode
  impact: React.ReactNode
}) {
  const colorClasses = {
    ocean: { bg: 'bg-ocean/10', text: 'text-ocean', border: 'border-ocean/30' },
    success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
    terra: { bg: 'bg-terra/10', text: 'text-terra', border: 'border-terra/30' },
  }[color]

  return (
    <div className={`bg-sand-100 rounded-xl border-[1.5px] ${colorClasses.border} p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${colorClasses.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${colorClasses.text}`} strokeWidth={1.75} />
        </div>
        <h3 className="font-display font-bold text-earth text-lg font-mono">{title}</h3>
      </div>
      <dl className="space-y-3 text-sm font-body">
        <div>
          <dt className="text-earth-500 text-xs uppercase tracking-wider font-semibold mb-0.5">
            À quoi ça sert ?
          </dt>
          <dd className="text-earth-700">{role}</dd>
        </div>
        <div>
          <dt className="text-earth-500 text-xs uppercase tracking-wider font-semibold mb-0.5">
            Comment c'est calculé / d'où ça vient ?
          </dt>
          <dd className="text-earth-700">{origin}</dd>
        </div>
        <div>
          <dt className="text-earth-500 text-xs uppercase tracking-wider font-semibold mb-0.5">
            Effet sur le prix
          </dt>
          <dd className="text-earth-700">{impact}</dd>
        </div>
      </dl>
    </div>
  )
}

function ConstantesTable({ c }: { c: ConstantesFormulePrix }) {
  const rows: { code: string; valeur: string; role: string }[] = [
    {
      code: 'lissage_rentabilite',
      valeur: fmtNum(c.lissageRentabilite, 4),
      role: 'Multiplie l\'écart de rentabilité pour calculer la contribution du trimestre. Plus c\'est petit, plus le prix bouge lentement.',
    },
    {
      code: 'cap_contribution_trimestrielle',
      valeur: '±' + fmtPct(c.capContributionTrimestrielle, 0),
      role: 'Limite l\'effet d\'un seul trimestre. Évite qu\'un revenu exceptionnel fasse exploser le prix.',
    },
    {
      code: 'cap_bonus_rentabilite_total',
      valeur: '±' + fmtPct(c.capBonusRentabiliteTotal, 0),
      role: 'Limite l\'effet cumulé de tous les trimestres ensemble. Le bonus rentabilité ne dépasse jamais cette borne.',
    },
    {
      code: 'coef_demande',
      valeur: fmtPct(c.coefDemande, 0),
      role: 'Convertit le ratio liste d\'attente / parts en bonus. Plus c\'est grand, plus la demande pèse sur le prix.',
    },
    {
      code: 'cap_bonus_demande',
      valeur: '+' + fmtPct(c.capBonusDemande, 0),
      role: 'Limite l\'effet maximum de la liste d\'attente, même si elle est très longue.',
    },
    {
      code: 'plancher_prix_pct',
      valeur: fmtPct(c.plancherPrixPct, 0),
      role: 'Borne basse absolue. Le prix courant ne descend jamais sous ce pourcentage du prix initial.',
    },
    {
      code: 'plafond_prix_pct',
      valeur: fmtPct(c.plafondPrixPct, 0),
      role: 'Borne haute absolue. Le prix courant ne dépasse jamais ce pourcentage du prix initial.',
    },
  ]
  return (
    <div className="bg-white rounded-lg border border-earth/10 overflow-hidden">
      <table className="w-full">
        <thead className="bg-sand-200">
          <tr>
            <th className="text-left px-4 py-3 font-body font-semibold text-earth text-xs uppercase tracking-wider">
              Constante
            </th>
            <th className="text-left px-4 py-3 font-body font-semibold text-earth text-xs uppercase tracking-wider">
              Valeur
            </th>
            <th className="text-left px-4 py-3 font-body font-semibold text-earth text-xs uppercase tracking-wider hidden md:table-cell">
              Rôle
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.code} className="border-t border-earth/8">
              <td className="px-4 py-3 align-top">
                <code className="font-mono text-earth text-xs">{r.code}</code>
              </td>
              <td className="px-4 py-3 align-top">
                <span className="font-mono font-bold text-ocean text-sm">{r.valeur}</span>
              </td>
              <td className="px-4 py-3 align-top hidden md:table-cell">
                <span className="font-body text-earth-600 text-xs">{r.role}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function fmtPct(fraction: number, digits: number): string {
  return (fraction * 100).toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }) + '%'
}

function fmtNum(value: number, digits: number): string {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
