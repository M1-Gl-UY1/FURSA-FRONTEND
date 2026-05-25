import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Partner = {
  name: string
  url: string | null
  descKey: string
  tags: string[]
  /** Partenaire principal (presente plus large) vs secondaire (card compacte). */
  primary: boolean
}

const PARTNERS: Partner[] = [
  {
    name: 'Paje Square',
    url: 'https://www.pajesquare.com',
    descKey: 'partners.paje_square_desc',
    tags: ['partners.paje_square_tag1', 'partners.paje_square_tag2', 'partners.paje_square_tag3'],
    primary: true,
  },
  {
    name: 'Fumba Town',
    url: 'https://fumba.town',
    descKey: 'partners.fumba_town_desc',
    tags: ['partners.fumba_town_tag1', 'partners.fumba_town_tag2', 'partners.fumba_town_tag3'],
    primary: true,
  },
  {
    name: 'Africa Bahari',
    url: null,
    descKey: 'partners.africa_bahari_desc',
    tags: ['partners.africa_bahari_tag1', 'partners.africa_bahari_tag2'],
    primary: false,
  },
  {
    name: 'CPS Zanzibar',
    url: null,
    descKey: 'partners.cps_zanzibar_desc',
    tags: ['partners.cps_zanzibar_tag1', 'partners.cps_zanzibar_tag2'],
    primary: false,
  },
  {
    name: 'SEED Innov',
    url: null,
    descKey: 'partners.seed_innov_desc',
    tags: ['partners.seed_innov_tag1', 'partners.seed_innov_tag2'],
    primary: false,
  },
]

/**
 * Section Partenaires : developpeurs immobiliers + operationnels.
 * Reprise du pitch officiel FURSA Community (page 12).
 */
export function Partenaires() {
  const { t } = useTranslation()
  const primaries = PARTNERS.filter((p) => p.primary)
  const secondaries = PARTNERS.filter((p) => !p.primary)

  return (
    <section id="partenaires" className="bg-white py-16 sm:py-20 border-y border-earth/8">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="text-center mb-10 sm:mb-12 max-w-2xl mx-auto">
          <p className="font-body text-xs uppercase tracking-widest text-terra font-semibold mb-2 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
            {t('partners.eyebrow')}
          </p>
          <h2 className="font-display font-bold text-earth text-2xl sm:text-3xl lg:text-4xl mb-3">
            {t('partners.title')}
          </h2>
          <p className="font-body text-earth-600 text-sm sm:text-base">
            {t('partners.subtitle')}
          </p>
        </div>

        {/* Partenaires immobiliers principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto mb-8">
          {primaries.map((p) => (
            <PartnerCardLarge key={p.name} partner={p} t={t} />
          ))}
        </div>

        {/* Partenaires operationnels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {secondaries.map((p) => (
            <PartnerCardCompact key={p.name} partner={p} t={t} />
          ))}
        </div>

        {/* Mini reassurance */}
        <p className="mt-8 text-center font-body text-earth-500 text-xs sm:text-sm max-w-3xl mx-auto">
          {t('partners.reassurance')}
        </p>
      </div>
    </section>
  )
}

type CardProps = {
  partner: Partner
  t: (key: string) => string
}

function PartnerCardLarge({ partner, t }: CardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="font-display font-bold text-earth text-2xl sm:text-3xl tracking-tight">
          {partner.name}
        </p>
        {partner.url && (
          <ArrowUpRight
            className="w-5 h-5 text-earth-400 group-hover:text-terra group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            strokeWidth={1.75}
          />
        )}
      </div>
      <p className="font-body text-earth-600 text-sm leading-relaxed mb-4">
        {t(partner.descKey)}
      </p>
      <div className="flex flex-wrap gap-2">
        {partner.tags.map((tagKey) => (
          <Tag key={tagKey}>{t(tagKey)}</Tag>
        ))}
      </div>
    </>
  )

  const className =
    'group relative overflow-hidden rounded-xl border border-earth/8 bg-sand-50 p-6 sm:p-8 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5'

  if (partner.url) {
    return (
      <a
        href={partner.url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    )
  }
  return <div className={className}>{content}</div>
}

function PartnerCardCompact({ partner, t }: CardProps) {
  return (
    <div className="rounded-xl border border-earth/8 bg-white p-5 hover:shadow-card transition-shadow">
      <p className="font-display font-bold text-earth text-lg tracking-tight mb-2">
        {partner.name}
      </p>
      <p className="font-body text-earth-600 text-xs leading-relaxed mb-3 line-clamp-3">
        {t(partner.descKey)}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {partner.tags.map((tagKey) => (
          <Tag key={tagKey} small>
            {t(tagKey)}
          </Tag>
        ))}
      </div>
    </div>
  )
}

function Tag({ children, small = false }: { children: React.ReactNode; small?: boolean }) {
  return (
    <span
      className={
        small
          ? 'inline-flex items-center px-2 py-0.5 rounded-full bg-sand-100 border border-earth/8 font-body text-[10px] font-medium text-earth-600'
          : 'inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-earth/10 font-body text-[11px] font-medium text-earth-600'
      }
    >
      {children}
    </span>
  )
}
