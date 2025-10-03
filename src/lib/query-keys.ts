/**
 * Query Key Factory
 * Centralized query key management for consistent caching
 */

export const queryKeys = {
  // Cloud queries
  clouds: {
    all: ['clouds'] as const,
    lists: () => [...queryKeys.clouds.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.clouds.lists(), { filters }] as const,
  },
} as const

// Type helpers for query keys
export type QueryKey = typeof queryKeys
export type CloudQueryKey = QueryKey['clouds']