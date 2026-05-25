import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import fr from './fr.json'

export const SUPPORTED_LANGS = ['fr', 'en'] as const
export type SupportedLang = (typeof SUPPORTED_LANGS)[number]

const STORAGE_KEY = 'fursa.lang'

function detectInitialLang(): SupportedLang {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'fr' || saved === 'en') return saved
    const nav = window.navigator.language?.toLowerCase() ?? ''
    if (nav.startsWith('en')) return 'en'
  }
  return 'fr'
}

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: detectInitialLang(),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
  returnNull: false,
})

export function setLang(lang: SupportedLang) {
  i18n.changeLanguage(lang)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, lang)
  }
}

export default i18n
