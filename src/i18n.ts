// UBICACION: src/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import es from './locales/es.json'
import en from './locales/en.json'

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_STORAGE_KEY = 'ap3c.lang'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en }
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    // es-ES, en-GB y similares se resuelven al idioma base
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    detection: {
      // Solo la eleccion guardada: sin ella se entra en ingles via fallbackLng
      order: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage']
    },
    interpolation: { escapeValue: false }
  })

export default i18n
