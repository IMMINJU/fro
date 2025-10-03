/**
 * Cloud Query Keys
 * Centralized query key factory for cloud-related queries
 */

export const cloudKeys = {
  all: ['clouds'] as const,
  lists: () => [...cloudKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) =>
    [...cloudKeys.lists(), { filters }] as const,
  details: () => [...cloudKeys.all, 'detail'] as const,
  detail: (id: string) => [...cloudKeys.details(), id] as const,
}

export type CloudQueryKey = typeof cloudKeys
