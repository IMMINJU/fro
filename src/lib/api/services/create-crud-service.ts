import { ListResponse, PaginationParams, FilterParams } from '../types'

/**
 * Delay utility for simulating API latency
 */
const delay = (ms: number = 300): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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
