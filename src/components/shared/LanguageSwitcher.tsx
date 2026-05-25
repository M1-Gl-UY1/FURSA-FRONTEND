import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

import { setLang, SUPPORTED_LANGS, type SupportedLang } from '@/i18n'
import { cn } from '@/lib/utils'

const LABELS: Record<SupportedLang, string> = {
  fr: 'FR',
  en: 'EN',
}

type Props = {
  variant?: 'light' | 'dark'
  className?: string
}

/**
 * Bouton segmente FR / EN pour basculer la langue de l'interface.
 * La preference est persistee dans localStorage.
 */
export function LanguageSwitcher({ variant = 'dark', className }: Props) {
  const { i18n } = useTranslation()
  const current = (i18n.resolvedLanguage as SupportedLang) ?? 'fr'

  const baseTrack =
    variant === 'light'
      ? 'bg-white/15 backdrop-blur-sm'
      : 'bg-sand-100 border border-earth/8'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full p-0.5',
        baseTrack,
        className
      )}
      role="group"
      aria-label="Language switcher"
    >
      <Globe
        className={cn(
          'w-3.5 h-3.5 ml-2 mr-1',
          variant === 'light' ? 'text-white/80' : 'text-earth-500'
        )}
        strokeWidth={1.75}
      />
      {SUPPORTED_LANGS.map((lang) => {
        const active = current === lang
        return (
          <button
            key={lang}
            type="button"
            onClick={() => setLang(lang)}
            aria-pressed={active}
            aria-label={`Switch to ${LABELS[lang]}`}
            className={cn(
              'inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold font-body tracking-wide transition-colors',
              active
                ? variant === 'light'
                  ? 'bg-white text-earth shadow-sm'
                  : 'bg-white text-earth shadow-sm border border-earth/10'
                : variant === 'light'
                  ? 'text-white/80 hover:text-white'
                  : 'text-earth-500 hover:text-earth'
            )}
          >
            {LABELS[lang]}
          </button>
        )
      })}
    </div>
  )
}
