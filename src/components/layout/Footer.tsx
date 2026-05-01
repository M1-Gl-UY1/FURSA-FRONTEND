import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

// Lucide a retiré les icônes de marques — on utilise des SVG inline.
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.128 22 16.991 22 12z" />
  </svg>
)
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)
const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455v6.288zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const socials = [
  { label: 'Facebook', Icon: FacebookIcon, href: '#' },
  { label: 'Instagram', Icon: InstagramIcon, href: '#' },
  { label: 'LinkedIn', Icon: LinkedinIcon, href: '#' },
  { label: 'X', Icon: XIcon, href: '#' },
]

type FooterLink = {
  label: string
  /** Soit ancre interne, soit chemin route, soit "soon" pour le toast */
  to: string | 'soon'
  external?: boolean
}

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Liens rapides',
    links: [
      { label: 'À propos', to: '#pourquoi' },
      { label: 'Comment ça marche', to: '#comment-ca-marche' },
      { label: 'Opportunités', to: '/opportunites' },
      { label: 'Devenir investisseur', to: '/register' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Blog', to: 'soon' },
      { label: 'FAQ', to: 'soon' },
      { label: 'Centre d\'aide', to: 'soon' },
      { label: 'Communauté', to: 'soon' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Mentions légales', to: 'soon' },
      { label: 'Conditions d\'utilisation', to: 'soon' },
      { label: 'Politique de confidentialité', to: 'soon' },
      { label: 'Cookies', to: 'soon' },
    ],
  },
]

export function Footer() {
  return (
    <footer id="contact" className="bg-ocean-700 text-white">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10 pt-14 sm:pt-16 lg:pt-20 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand + newsletter */}
          <div className="md:col-span-4">
            <img
              src="/images/logo-fursa.png"
              alt="Fursa"
              className="h-10 w-auto mb-4"
            />
            <p className="font-body text-white/75 text-sm leading-relaxed mb-6 max-w-xs">
              Restez informé de nos nouvelles opportunités d'investissement.
            </p>

            {/* Newsletter */}
            <form
              className="relative max-w-sm"
              onSubmit={(e) => {
                e.preventDefault()
                const input = e.currentTarget.elements.namedItem(
                  'newsletter-email'
                ) as HTMLInputElement
                if (!input?.value) return
                toast.success('Merci ! Vous serez notifié dès la mise en service.')
                input.value = ''
              }}
            >
              <label className="sr-only" htmlFor="newsletter-email">
                Votre adresse email
              </label>
              <input
                id="newsletter-email"
                name="newsletter-email"
                type="email"
                required
                placeholder="Votre adresse email"
                className="w-full bg-white/10 border border-white/20 rounded-full pl-4 pr-12 py-3 text-sm font-body text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/15 transition"
              />
              <button
                type="submit"
                aria-label="S'inscrire à la newsletter"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-terra hover:bg-terra-600 flex items-center justify-center transition-colors duration-200"
              >
                <ArrowUpRight className="w-4 h-4 text-white" strokeWidth={2.25} />
              </button>
            </form>
          </div>

          {/* Colonnes liens */}
          {columns.map((col) => (
            <nav
              key={col.title}
              aria-label={col.title}
              className="md:col-span-2 lg:col-span-2"
            >
              <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Réseaux */}
          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4">
              Suivez-nous
            </h3>
            <div className="flex flex-wrap gap-2">
              {socials.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  onClick={(e) => {
                    if (href === '#') {
                      e.preventDefault()
                      toast.info(`${label} : page sociale bientôt disponible.`)
                    }
                  }}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200"
                >
                  <Icon className="w-4 h-4 text-white" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bas */}
        <div className="border-t border-white/15 mt-12 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="font-body text-white/60 text-xs">
            © {new Date().getFullYear()} Fursa Community. Tous droits réservés.
          </p>
          <p className="font-body text-white/60 text-xs">
            Plateforme d'investissement immobilier fractionné en Afrique.
          </p>
        </div>
      </div>
    </footer>
  )
}

// --- Sous-composant : un lien de footer (ancre, route, ou "soon") ---

function FooterLinkItem({ link }: { link: FooterLink }) {
  const cls =
    'font-body text-white/80 hover:text-white text-sm transition-colors'

  if (link.to === 'soon') {
    return (
      <button
        type="button"
        onClick={() => toast.info(`${link.label} : bientôt disponible.`)}
        className={cls + ' text-left'}
      >
        {link.label}
      </button>
    )
  }

  if (link.to.startsWith('#')) {
    return (
      <a href={link.to} className={cls}>
        {link.label}
      </a>
    )
  }

  return (
    <Link to={link.to} className={cls}>
      {link.label}
    </Link>
  )
}
