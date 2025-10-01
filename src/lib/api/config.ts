export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const

export const API_ENDPOINTS = {
  CLOUDS: {
    LIST: '/clouds',
    GET: (id: string) => `/clouds/${id}`,
    CREATE: '/clouds',
    UPDATE: (id: string) => `/clouds/${id}`,
    DELETE: (id: string) => `/clouds/${id}`,
  },
  CLOUD_GROUPS: {
    LIST: '/cloud-groups',
  },
  REGIONS: {
    LIST: (provider: string) => `/regions/${provider}`,
  },
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const