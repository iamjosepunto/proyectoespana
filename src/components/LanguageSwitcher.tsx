// UBICACION: src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../i18n'
import type { SupportedLanguage } from '../i18n'

const BANDERAS: Record<SupportedLanguage, string> = {
  es: '/bandera-es.webp',
  en: '/bandera-en.webp'
}

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const current = i18n.resolvedLanguage as SupportedLanguage | undefined

  return (
    <nav aria-label={t('language.label')} className="flex items-center gap-0 sm:flex-col sm:items-start sm:gap-1">
      {SUPPORTED_LANGUAGES.map((code) => {
        const active = current === code
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-current={active ? 'true' : undefined}
            aria-label={t(`language.${code}`)}
            onClick={() => void i18n.changeLanguage(code)}
            className={[
              'flex items-center gap-2 rounded-sm px-0.5 py-1.5',
              'sm:gap-2 sm:px-2 sm:py-[9px]',
              'font-mono text-[16px] uppercase leading-none tracking-[0.18em] sm:text-[29px]',
              'cursor-pointer transition-colors duration-200',
              active ? 'text-accent' : 'text-muted hover:text-ink'
            ].join(' ')}
          >
            <img
              src={BANDERAS[code]}
              alt=""
              width={20}
              height={14}
              className="h-[11px] w-4 rounded-[2px] object-cover sm:h-[21px] sm:w-[30px] sm:rounded-[3px]"
            />
            {code}
          </button>
        )
      })}
    </nav>
  )
}
