/**
 * Query Key Factory
 *
 * Creates consistent, type-safe query keys for any entity.
 * Follows TanStack Query best practices for cache invalidation.
 *
 * @example
 * ```typescript
 * const cloudKeys = createQueryKeys('clouds')
 *
 * // Usage:
 * cloudKeys.all          // ['clouds']
 * cloudKeys.lists()      // ['clouds', 'list']
 * cloudKeys.list(params) // ['clouds', 'list', { page: 1, ... }]
 * cloudKeys.details()    // ['clouds', 'detail']
 * cloudKeys.detail(id)   // ['clouds', 'detail', '123']
 * ```
 */

export interface QueryKeyFactory<TEntity extends string> {
  /** Base key for all queries of this entity */
  all: readonly [TEntity]

  /** Key for all list queries */
  lists: () => readonly [TEntity, 'list']

  /** Key for a specific list query with filters/pagination */
  list: (filters?: Record<string, unknown>) => readonly [TEntity, 'list', Record<string, unknown>]

  /** Key for all detail queries */
  details: () => readonly [TEntity, 'detail']

  /** Key for a specific detail query */
  detail: (id: string) => readonly [TEntity, 'detail', string]

  /** Key for mutation operations (optional, for optimistic updates) */
  mutation: () => readonly [TEntity, 'mutation']
}

/**
 * Creates a query key factory for an entity
 *
 * @param entity - The entity name (e.g., 'clouds', 'users', 'policies')
 * @returns A query key factory with type-safe methods
 *
 * @example
 * ```typescript
 * // Create factory
 * export const cloudKeys = createQueryKeys('clouds')
 * export const userKeys = createQueryKeys('users')
 * export const policyKeys = createQueryKeys('policies')
 *
 * // Use in hooks
 * useQuery({
 *   queryKey: cloudKeys.lists(),
 *   queryFn: () => cloudService.list()
 * })
 *
 * // Invalidate all clouds
 * queryClient.invalidateQueries({ queryKey: cloudKeys.all })
 *
 * // Invalidate specific cloud
 * queryClient.invalidateQueries({ queryKey: cloudKeys.detail('123') })
 * ```
 */
export function createQueryKeys<TEntity extends string>(
  entity: TEntity,
): QueryKeyFactory<TEntity> {
  return {
    all: [entity] as const,
    lists: () => [entity, 'list'] as const,
    list: (filters = {}) => [entity, 'list', filters] as const,
    details: () => [entity, 'detail'] as const,
    detail: (id: string) => [entity, 'detail', id] as const,
    mutation: () => [entity, 'mutation'] as const,
  }
}

/**
 * Utility to create multiple query key factories at once
 *
 * @example
 * ```typescript
 * const queryKeys = createQueryKeysMap({
 *   clouds: 'clouds',
 *   users: 'users',
 *   policies: 'policies',
 * })
 *
 * // Usage:
 * queryKeys.clouds.all       // ['clouds']
 * queryKeys.users.detail(id) // ['users', 'detail', '123']
 * ```
 */
export function createQueryKeysMap<
  T extends Record<string, string>,
>(entities: T): { [K in keyof T]: QueryKeyFactory<T[K]> } {
  return Object.fromEntries(
    Object.entries(entities).map(([key, entity]) => [
      key,
      createQueryKeys(entity),
    ]),
  ) as { [K in keyof T]: QueryKeyFactory<T[K]> }
}
