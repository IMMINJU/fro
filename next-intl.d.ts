/**
 * next-intl Type Declaration
 *
 * This file enables TypeScript support for next-intl translations.
 * It extends the next-intl module with our message structure.
 *
 * Official Documentation:
 * https://next-intl-docs.vercel.app/docs/workflows/typescript
 */

import type cloudEn from './messages/cloud/en.json'
import type commonEn from './messages/common/en.json'

declare global {
  // Use type-safe message keys with `next-intl`
  interface IntlMessages {
    common: typeof commonEn
    cloud: typeof cloudEn
    // Allow dynamic namespaces (less type-safe but more flexible)
    [key: string]: any
  }
}
