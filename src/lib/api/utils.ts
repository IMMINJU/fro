import { ApiClientError, NetworkError } from './types'

/**
 * Simulates network delay for mock APIs
 * Can be removed when using real API endpoints
 * Ensures minimum 200ms delay to prevent skeleton flashing
 */
export async function delay(ms?: number): Promise<void> {
  const delayTime = ms ?? (200 + Math.random() * 300) // 200-500ms
  return new Promise(resolve => setTimeout(resolve, delayTime))
}

/**
 * Standardized error handling for API calls
 * @param error - Error object to handle
 * @throws ApiClientError or NetworkError
 */
export function handleError(error: unknown): never {
  // If already a known error type, rethrow
  if (error instanceof ApiClientError) {
    throw error
  }

  if (error instanceof NetworkError) {
    throw error
  }

  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new NetworkError('Network request failed. Please check your connection.', error)
  }

  // Generic error fallback
  const message = error instanceof Error ? error.message : 'An unknown error occurred'
  throw new ApiClientError(500, 'UNKNOWN_ERROR', message)
}

/**
 * API endpoint builder helper
 * @param path - API path segment
 * @returns Full API URL
 */
export function buildUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
  return `${baseUrl}${path}`
}
