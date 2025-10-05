import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale

  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as any)) {notFound()}

  // Load all namespaces
  const [common, cloud] = await Promise.all([
    import(`../../messages/common/${locale}.json`).then(m => m.default),
    import(`../../messages/cloud/${locale}.json`).then(m => m.default),
  ])

  return {
    locale,
    messages: {
      common,
      cloud,
    },
  }
})