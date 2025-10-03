'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { LOCALE_CONFIGS, type Locale } from '@/types/i18n'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Locale Switcher Component
 * Allows users to switch between available languages
 */
export function LocaleSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  const handleLocaleChange = (newLocale: Locale) => {
    // Replace the locale in the current pathname
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPathname = segments.join('/')

    router.push(newPathname)
  }

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          {LOCALE_CONFIGS[locale].flag} {LOCALE_CONFIGS[locale].nativeName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(LOCALE_CONFIGS).map((config) => (
          <SelectItem key={config.code} value={config.code}>
            {config.flag} {config.nativeName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
