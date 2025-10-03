/**
 * i18n Type Definitions - Enterprise Route-Based Structure
 * Auto-generated types for translation keys with type safety
 */

import type commonEn from '../../messages/common/en.json'
import type navigationEn from '../../messages/shared/navigation/en.json'
import type validationEn from '../../messages/shared/validation/en.json'
import type cloudEn from '../../messages/cloud/en.json'

// Merge all namespace types into a single Messages type
export type Messages = {
  common: typeof commonEn
  navigation: typeof navigationEn
  validation: typeof validationEn
  cloud: typeof cloudEn
}

// Helper type to get nested keys
export type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}` | K
          : K
        : never
    }[keyof T]
  : never

// All valid translation keys
export type TranslationKey = NestedKeyOf<Messages>

// Namespace keys (top-level)
export type Namespace = keyof Messages

// Type-safe translation function signature
export type TranslateFn<NS extends Namespace = Namespace> = (
  key: keyof Messages[NS],
  params?: Record<string, string | number>
) => string

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
