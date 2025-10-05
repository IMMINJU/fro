/**
 * Query Key Factory
 * Centralized query key management for consistent caching
 *
 * Note: Individual query keys are now separated by namespace
 * See: src/lib/query-keys/
 *
 * @example
 * ```typescript
 * // Import specific keys
 * import { cloudKeys } from '@/lib/query-keys/clouds.keys'
 *
 * // Or use the centralized map
 * import { queryKeys } from '@/lib/query-keys'
 * queryKeys.clouds.all // ['clouds']
 * ```
 */

import { createQueryKeysMap } from './factory'

/**
 * Centralized query keys map
 * Add new entities here to auto-generate their query keys
 */
export const queryKeys = createQueryKeysMap({
  clouds: 'clouds',
  // Add more entities as needed:
  // users: 'users',
  // policies: 'policies',
  // alerts: 'alerts',
  // reports: 'reports',
})

// Re-export individual keys for convenience
export { cloudKeys } from './clouds.keys'

// Type helpers for query keys
export type QueryKey = typeof queryKeys
export type CloudQueryKey = QueryKey['clouds']