import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { cn } from '@/lib/utils'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t } = useTranslation()

  const navLinks = [
    { label: t('header.nav_home', 'Accueil'), href: '#accueil' },
    { label: t('header.nav_about', 'À propos'), href: '#pourquoi' },
    { label: t('header.nav_partners', 'Partenaires'), href: '#partenaires' },
    { label: t('header.nav_contact', 'Contact'), href: '#contact' },
  ]

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-earth/55 backdrop-blur-md border-b border-white/10">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="h-16 sm:h-[72px] flex items-center justify-between">
          {/* Logo */}
          <a href="#accueil" aria-label="Fursa - Accueil" className="flex items-center">
            <img
              src="/images/logo-fursa.png"
              alt="Fursa"
              className="h-8 sm:h-9 w-auto"
            />
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-12">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-white/90 hover:text-white font-body text-sm font-medium transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right cluster (lang + CTA + avatar) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="light" className="hidden sm:inline-flex" />
            <Link
              to="/register"
              className="hidden sm:inline-flex items-center bg-white text-earth rounded-full px-4 lg:px-5 py-2 text-xs lg:text-sm font-semibold font-body hover:bg-sand-50 transition-colors duration-200"
            >
              {t('common.create_account')}
            </Link>
            <Link
              to="/login"
              aria-label="Se connecter"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-colors duration-200"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={1.75} />
            </Link>

            {/* Burger (mobile only) */}
            <button
              type="button"
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-colors duration-200"
            >
              {mobileOpen ? (
                <X className="w-4 h-4 text-white" strokeWidth={2} />
              ) : (
                <Menu className="w-4 h-4 text-white" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out',
            mobileOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <nav className="pb-4 pt-1 flex flex-col gap-1 bg-earth/80 backdrop-blur-md rounded-xl mx-1 mb-2 px-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-white/90 hover:text-white font-body text-sm font-medium px-3 py-2.5 rounded-md hover:bg-white/10 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="sm:hidden mt-1 inline-flex justify-center items-center bg-white text-earth rounded-full px-4 py-2.5 text-sm font-semibold font-body hover:bg-sand-50 transition-colors"
            >
              {t('common.create_account')}
            </Link>
            <div className="sm:hidden flex justify-center pt-2">
              <LanguageSwitcher variant="light" />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
