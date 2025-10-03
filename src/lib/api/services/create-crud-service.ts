import { ListResponse, PaginationParams, FilterParams } from '../types'
import { delay } from '../utils'

/**
 * CRUD Service Type
 * Defines the structure of a CRUD service
 */
export interface CrudService<T, TCreate, TUpdate> {
  list(params?: PaginationParams & FilterParams): Promise<ListResponse<T>>
  get(id: string): Promise<T>
  create(data: TCreate): Promise<T>
  update(id: string, data: Partial<TUpdate>): Promise<T>
  delete(id: string): Promise<void>
}

/**
 * Read-only Service Type
 * For services that only support list and get operations
 */
export interface ReadOnlyService<T> {
  list(params?: PaginationParams & FilterParams): Promise<ListResponse<T>>
  get(id: string): Promise<T>
}

/**
 * Service Configuration
 * Allows customization of service behavior
 */
export interface ServiceConfig {
  enableDelay?: boolean
  delayMs?: number
  baseUrl?: string
}

/**
 * Factory function to create a CRUD service
 *
 * @template T - The entity type (e.g., Cloud, User)
 * @template TCreate - The creation request type
 * @template TUpdate - The update request type
 *
 * @param handlers - Object containing CRUD operation handlers
 * @param config - Optional service configuration
 * @returns A CRUD service object
 *
 * @example
 * ```typescript
 * const userService = createCrudService<User, UserCreateRequest, UserUpdateRequest>({
 *   list: async (params) => {
 *     const response = await fetch('/api/users')
 *     return response.json()
 *   },
 *   get: async (id) => {
 *     const response = await fetch(`/api/users/${id}`)
 *     return response.json()
 *   },
 *   // ... other handlers
 * })
 * ```
 */
export function createCrudService<T, TCreate = T, TUpdate = TCreate>(
  handlers: {
    list: (params?: PaginationParams & FilterParams) => Promise<ListResponse<T>>
    get: (id: string) => Promise<T>
    create: (data: TCreate) => Promise<T>
    update: (id: string, data: Partial<TUpdate>) => Promise<T>
    delete: (id: string) => Promise<void>
  },
  config: ServiceConfig = {},
): CrudService<T, TCreate, TUpdate> {
  const { enableDelay = true, delayMs } = config

  // Helper to optionally add delay
  const withDelay = async <R>(fn: () => Promise<R>): Promise<R> => {
    if (enableDelay) {
      await delay(delayMs)
    }
    return fn()
  }

  return {
    list: (params) => withDelay(() => handlers.list(params)),
    get: (id) => withDelay(() => handlers.get(id)),
    create: (data) => withDelay(() => handlers.create(data)),
    update: (id, data) => withDelay(() => handlers.update(id, data)),
    delete: (id) => withDelay(() => handlers.delete(id)),
  }
}

/**
 * Factory function to create a read-only service
 *
 * @example
 * ```typescript
 * const analyticsService = createReadOnlyService<Analytics>({
 *   list: async (params) => { ... },
 *   get: async (id) => { ... }
 * })
 * ```
 */
export function createReadOnlyService<T>(
  handlers: {
    list: (params?: PaginationParams & FilterParams) => Promise<ListResponse<T>>
    get: (id: string) => Promise<T>
  },
  config: ServiceConfig = {},
): ReadOnlyService<T> {
  const { enableDelay = true, delayMs } = config

  const withDelay = async <R>(fn: () => Promise<R>): Promise<R> => {
    if (enableDelay) {
      await delay(delayMs)
    }
    return fn()
  }

  return {
    list: (params) => withDelay(() => handlers.list(params)),
    get: (id) => withDelay(() => handlers.get(id)),
  }
}
