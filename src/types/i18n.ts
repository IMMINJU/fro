/**
 * i18n Type Definitions
 * Locale configuration and utilities
 */

// Available locales
export type Locale = 'en' | 'ko' | 'ja'

// Locale configuration
export interface LocaleConfig {
  code: Locale
  name: string
  nativeName: string
  flag: string
}

export const LOCALE_CONFIGS: Record<Locale, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
  },
}

// Helper to get locale config
export function getLocaleConfig(locale: Locale): LocaleConfig {
  return LOCALE_CONFIGS[locale]
}
