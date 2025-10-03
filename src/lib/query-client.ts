import { QueryClient, DefaultOptions } from '@tanstack/react-query'
import { ApiClientError, NetworkError, ValidationError } from './api/services'

/**
 * Default options for React Query
 * Enterprise-grade configuration with smart caching and error handling
 */
const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: (failureCount, error) => {
      // Don't retry client errors (4xx)
      if (error instanceof ApiClientError && error.statusCode >= 400 && error.statusCode < 500) {
        return false
      }
      // Retry server errors (5xx) up to 3 times
      if (error instanceof ApiClientError && error.statusCode >= 500) {
        return failureCount < 3
      }
      // Retry network errors up to 5 times
      if (error instanceof NetworkError) {
        return failureCount < 5
      }
      // Never retry validation errors
      if (error instanceof ValidationError) {
        return false
      }
      // Default retry for unknown errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s, 8s...
      return Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: 'always',
  },
  mutations: {
    retry: (failureCount, error) => {
      // Don't retry client errors for mutations
      if (error instanceof ApiClientError && error.statusCode >= 400 && error.statusCode < 500) {
        return false
      }
      // Only retry server errors once for mutations
      if (error instanceof ApiClientError && error.statusCode >= 500) {
        return failureCount < 1
      }
      // Retry network errors for mutations
      if (error instanceof NetworkError) {
        return failureCount < 2
      }
      return false
    },
    retryDelay: (attemptIndex) => {
      return Math.min(1000 * 2 ** attemptIndex, 10000)
    },
  },
}

/**
 * Global QueryClient instance
 * Centralized query management with error handling
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
})
