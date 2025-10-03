/**
 * Query Key Factory
 * Centralized query key management for consistent caching
 *
 * Note: Individual query keys are now separated by namespace
 * See: src/lib/query-keys/
 */

import { cloudKeys } from './query-keys/clouds.keys'

export const queryKeys = {
  clouds: cloudKeys,
  // Add more API namespaces here as they are created
  // users: userKeys,
  // policies: policyKeys,
} as const

// Type helpers for query keys
export type QueryKey = typeof queryKeys
export type CloudQueryKey = QueryKey['clouds']